#!/usr/bin/env bun
import { performance } from "perf_hooks";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { globalTokenCounter } from "../src/utils/token-counter.js";
import { runWorkflow } from "../src/workflow/orchestrator.js";

// 配置
const RUNS = Number(process.env.BENCH_RUNS ?? 100);
const CONCURRENCY = Number(process.env.BENCH_CONCURRENCY ?? 3);
const RESULTS_DIR = path.resolve(process.cwd(), "benchmarks");
const RESULTS_FILE = path.join(RESULTS_DIR, "results.json");

mkdirSync(RESULTS_DIR, { recursive: true });

type Sample = {
  idx: number;
  startAt: string;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  memoryBytes: number;
};

function stats(values: number[]) {
  const sorted = values.slice().sort((a, b) => a - b);
  const sum = values.reduce((s, v) => s + v, 0);
  const avg = sum / values.length;
  const median = sorted[Math.floor(values.length / 2)];
  const p95 = sorted[Math.floor(values.length * 0.95)];
  const p99 = sorted[Math.floor(values.length * 0.99)];
  return { avg, min: sorted[0], max: sorted[sorted.length - 1], median, p95, p99 };
}

async function runOnce(idx: number) {
  const start = performance.now();
  const bunPeek = (globalThis as any).Bun?.peek?.();
  const beforeMem = bunPeek && bunPeek.memory ? bunPeek.memory.used : 0;

  // 使用一个小的 hypothesis 快速驱动 workflow（mock 模式下不调用真实 API）
  const hypothesis = {
    assumptions: ["1000人社区,资源有限(粮食、住房、工具)"],
    constraints: ["通信成本有限"],
    goals: ["保证基本生存"]
  };

  // 运行 workflow（内部使用 simulateAICall -> mock 输出）
  await runWorkflow(hypothesis, { maxIterations: 1 });

  const end = performance.now();
  const bunPeekAfter = (globalThis as any).Bun?.peek?.();
  const afterMem = bunPeekAfter && bunPeekAfter.memory ? bunPeekAfter.memory.used : 0;

  // 从 token counter 获取消耗（注意：agent 模拟调用在本库中不会记录 token，故此处可能为0）
  const monthly = globalTokenCounter.getMonthlyUsage();

  return {
    idx,
    startAt: new Date().toISOString(),
    durationMs: end - start,
    inputTokens: monthly.input,
    outputTokens: monthly.output,
    memoryBytes: afterMem - beforeMem
  } as Sample;
}

async function main() {
  console.log(`Running baseline benchmark: ${RUNS} runs (concurrency=${CONCURRENCY})`);

  const results: Sample[] = [];

  // 简单并发队列
  let inFlight = 0;
  let nextIdx = 0;

  async function pump() {
    while (nextIdx < RUNS) {
      if (inFlight >= CONCURRENCY) {
        await new Promise(r => setTimeout(r, 20));
        continue;
      }
      const i = nextIdx++;
      inFlight++;
      runOnce(i).then(r => {
        results.push(r);
      }).catch(err => {
        console.error(`run ${i} failed:`, err);
      }).finally(() => {
        inFlight--;
      });
    }

    // wait for remaining
    while (inFlight > 0) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  await pump();

  // 计算统计
  const durations = results.map(r => r.durationMs);
  const inputTokens = results.map(r => r.inputTokens);
  const outputTokens = results.map(r => r.outputTokens);
  const mems = results.map(r => r.memoryBytes);

  const summary = {
    runs: RUNS,
    concurrency: CONCURRENCY,
    durations: stats(durations),
    inputTokens: stats(inputTokens),
    outputTokens: stats(outputTokens),
    memoryBytes: stats(mems),
    generatedAt: new Date().toISOString()
  };

  const report = { summary, samples: results };

  writeFileSync(RESULTS_FILE, JSON.stringify(report, null, 2));

  console.log("Benchmark complete. Summary:");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Wrote ${RESULTS_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
