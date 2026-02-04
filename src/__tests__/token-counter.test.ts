import { test, expect } from "bun:test";
import TokenCounter, { globalTokenCounter } from "../utils/token-counter.js";

test("能导入 token counter", () => {
  expect(TokenCounter).toBeDefined();
  expect(globalTokenCounter).toBeDefined();
});

test("记录使用并计算成本", () => {
  const tc = new TokenCounter();
  tc.resetMonth();
  const rec = tc.recordUsage(1000, 2000, new Date("2026-02-01T00:00:00Z"));
  expect(rec.inputTokens).toBe(1000);
  expect(rec.outputTokens).toBe(2000);
  // cost = (1000/1e6)*3 + (2000/1e6)*15 = 0.003 + 0.03 = 0.033 -> round to 0.03
  expect(typeof rec.costUsd).toBe("number");
  const month = tc.getMonthlyUsage("2026-02");
  expect(month.input).toBe(1000);
  expect(month.output).toBe(2000);
  expect(month.costUsd).toBeCloseTo(rec.costUsd, 2);
});

test("硬限制触发", () => {
  const tc = new TokenCounter();
  tc.resetMonth();
  expect(() => tc.recordUsage(30_000, 21_000)).toThrow();
});
