// Token计数器：跟踪输入/输出 token，月度累计，单次推理成本计算
// Claude-3-Sonnet 价格假设：$3 / 1_000_000 input tokens, $15 / 1_000_000 output tokens

import { config } from './config.js';

export type TokenRecord = {
  timestamp: string; // ISO 日期
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export class TokenCounter {
  // in-memory store: map from YYYY-MM to { input, output }
  private monthlyUsage: Map<string, { input: number; output: number }> = new Map();

  // pricing
  private inputPricePerMillion = 3; // $3 per 1M input tokens
  private outputPricePerMillion = 15; // $15 per 1M output tokens
  // hard limit per request (from config.MAX_TOKENS)
  public readonly HARD_LIMIT = config.MAX_TOKENS;

  recordUsage(inputTokens: number, outputTokens: number, when = new Date()): TokenRecord {
    if (inputTokens + outputTokens > this.HARD_LIMIT) {
      throw new Error(`请求超出硬限制: ${this.HARD_LIMIT} tokens`);
    }

    if (inputTokens < 0 || outputTokens < 0) {
      throw new Error("token 数量不能为负数");
    }

    const monthKey = this.monthKey(when);
    const prev = this.monthlyUsage.get(monthKey) ?? { input: 0, output: 0 };
    prev.input += inputTokens;
    prev.output += outputTokens;
    this.monthlyUsage.set(monthKey, prev);

    const cost = this.calculateCostFor(inputTokens, outputTokens);

    const record: TokenRecord = {
      timestamp: when.toISOString(),
      inputTokens,
      outputTokens,
      costUsd: cost,
    };

    return record;
  }

  // 计算单次请求成本（美元）
  calculateCostFor(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * this.inputPricePerMillion;
    const outputCost = (outputTokens / 1_000_000) * this.outputPricePerMillion;
    // 保持两位小数
    return Math.round((inputCost + outputCost) * 100) / 100;
  }

  // 获取指定月的汇总（YYYY-MM）
  getMonthlyUsage(month?: string): { input: number; output: number; costUsd: number } {
    const key = month ?? this.monthKey(new Date());
    const v = this.monthlyUsage.get(key) ?? { input: 0, output: 0 };
    const cost = this.calculateCostFor(v.input, v.output);
    return { input: v.input, output: v.output, costUsd: cost };
  }

  // 重置指定月（便于测试）
  resetMonth(month?: string): void {
    const key = month ?? this.monthKey(new Date());
    this.monthlyUsage.set(key, { input: 0, output: 0 });
  }

  // 辅助：当前或给定时间的 YYYY-MM
  private monthKey(d: Date): string {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}`;
  }
}

export const globalTokenCounter = new TokenCounter();

export default TokenCounter;
