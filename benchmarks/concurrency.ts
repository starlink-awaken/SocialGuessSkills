#!/usr/bin/env bun
import { performance } from "perf_hooks";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { runWorkflow } from "../src/workflow/orchestrator.js";
// no-op: do not import token counter to avoid unused diagnostics

// 配置
const CONCURRENCY_LEVELS = [3, 5, 10];
const RUNS_PER_LEVEL = Number(process.env.BENCH_RUNS_PER_LEVEL ?? 30);
const RESULTS_DIR = path.resolve(process.cwd(), "benchmarks");
const RESULTS_FILE = path.join(RESULTS_DIR, "concurrency-results.json");

mkdirSync(RESULTS_DIR, { recursive: true });

type Sample = { idx: number; durationMs: number };

function stats(values: number[]) {
  const sorted = values.slice().sort((a, b) => a - b);
  const sum = values.reduce((s, v) => s + v, 0);
  const avg = sum / values.length;
  const median = sorted[Math.floor(values.length / 2)];
  const p95 = sorted[Math.max(0, Math.floor(values.length * 0.95) - 1)];
  return { avg, min: sorted[0], max: sorted[sorted.length - 1], median, p95 };
}

async function runOnce(idx: number) {
  const start = performance.now();

  const hypothesis = {
    assumptions: ["1000人社区,资源有限(粮食、住房、工具)"],
    constraints: ["通信成本有限"],
    goals: ["保证基本生存"]
  };

  await runWorkflow(hypothesis, { maxIterations: 1 });

  const end = performance.now();
  return { idx, durationMs: end - start } as Sample;
}

async function runLevel(concurrency: number) {
  process.env.MAX_CONCURRENT = String(concurrency);
  const samples: Sample[] = [];

  let inFlight = 0;
  let nextIdx = 0;

  async function pump() {
    while (nextIdx < RUNS_PER_LEVEL) {
      if (inFlight >= concurrency) {
        await new Promise((r) => setTimeout(r, 10));
        continue;
      }
      const i = nextIdx++;
      inFlight++;
      runOnce(i)
        .then((s) => samples.push(s))
        .catch((e) => console.error(`run ${i} failed:`, e))
        .finally(() => {
          inFlight--;
        });
    }

    while (inFlight > 0) {
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  const start = performance.now();
  await pump();
  const duration = performance.now() - start;

  const durations = samples.map((s) => s.durationMs);
  const summary = {
    concurrency,
    runs: RUNS_PER_LEVEL,
    totalDurationMs: duration,
    throughput: RUNS_PER_LEVEL / (duration / 1000),
    durations: stats(durations),
    generatedAt: new Date().toISOString()
  };

  return { summary, samples };
}

async function main() {
  console.log(`Running concurrency benchmark levels=${CONCURRENCY_LEVELS.join(",")} runsPerLevel=${RUNS_PER_LEVEL}`);

  const results: any[] = [];
  for (const level of CONCURRENCY_LEVELS) {
    console.log(`\n=== Testing concurrency=${level} ===`);
    const res = await runLevel(level);
    console.log(JSON.stringify(res.summary, null, 2));
    results.push(res);
  }

  // 选择最优：优先吞吐量，其次平均延迟最小
  const bestByThroughput = results.slice().sort((a, b) => b.summary.throughput - a.summary.throughput)[0];
  const bestByLatency = results.slice().sort((a, b) => a.summary.durations.avg - b.summary.durations.avg)[0];

  const recommended = bestByThroughput.summary.concurrency === bestByLatency.summary.concurrency
    ? bestByThroughput.summary.concurrency
    : bestByThroughput.summary.concurrency; // 若冲突，优先吞吐量

  const report = { generatedAt: new Date().toISOString(), results: results.map(r => r.summary), recommended };

  writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));
  console.log(`\nRecommended MAX_CONCURRENT: ${recommended}`);
  console.log(`Wrote ${RESULTS_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
