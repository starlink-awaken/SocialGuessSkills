// GLM-4 成本追踪器：按月统计 token 与成本，支持预算阈值判定

import { config } from './config.js';
import { logger } from './logger.js';
import { clampBudget } from './cost-alert.js';

export type GLMCostRecord = {
  timestamp: string; // ISO 日期
  tokens: number;
  costUsd: number;
};

export type GLMCostState = {
  month: string;
  monthlyBudget: number;
  used: number;
  remaining: number;
  level: 'ok' | 'warn' | 'error';
  warnThreshold: number;
  errorThreshold: number;
};

const PRICE_PER_1K = 0.014; // $0.014 per 1K tokens
const COST_PRECISION = 1_000_000; // 6 位小数

function readBudgetFromEnv(): number {
  return config.MONTHLY_BUDGET;
}

export class GLMCostTracker {
  private monthlyUsage: Map<string, { tokens: number; costUsd: number }> = new Map();
  private monthlyBudget: number;
  private warnThreshold: number;
  private errorThreshold: number;

  constructor(monthlyBudget?: number) {
    this.monthlyBudget = clampBudget(monthlyBudget ?? readBudgetFromEnv());
    this.warnThreshold = this.monthlyBudget / 2;
    this.errorThreshold = this.monthlyBudget;
  }

  // 计算单次请求成本（美元）
  calculateCostFor(tokens: number): number {
    const raw = (tokens / 1_000) * PRICE_PER_1K;
    return Math.round(raw * COST_PRECISION) / COST_PRECISION;
  }

  // 记录一次使用（仅累计，不判断预算）
  recordUsage(tokens: number, when = new Date()): GLMCostRecord {
    if (tokens < 0) {
      throw new Error('token 数量不能为负数');
    }

    const monthKey = this.monthKey(when);
    const prev = this.monthlyUsage.get(monthKey) ?? { tokens: 0, costUsd: 0 };
    const cost = this.calculateCostFor(tokens);
    prev.tokens += tokens;
    prev.costUsd += cost;
    this.monthlyUsage.set(monthKey, prev);

    return {
      timestamp: when.toISOString(),
      tokens,
      costUsd: cost,
    };
  }

  // 增加消耗并判断预算阈值（参考 cost-alert 计算模式）
  addUsage(tokens: number, when = new Date()): { allowed: boolean; state: GLMCostState; record?: GLMCostRecord } {
    if (tokens <= 0) {
      logger.warn('[glm-cost-tracker] addUsage called with non-positive tokens', tokens);
      return { allowed: true, state: this.getState(this.monthKey(when)) };
    }

    const monthKey = this.monthKey(when);
    const prev = this.monthlyUsage.get(monthKey) ?? { tokens: 0, costUsd: 0 };
    const cost = this.calculateCostFor(tokens);
    const newCost = prev.costUsd + cost;
    const newTokens = prev.tokens + tokens;

    if (prev.costUsd >= this.errorThreshold) {
      logger.error('[glm-cost-tracker] 月度预算已超出，拒绝新请求', {
        monthlyBudget: this.monthlyBudget,
        used: prev.costUsd,
        month: monthKey,
      });
      return { allowed: false, state: this.getState(monthKey) };
    }

    if (newCost >= this.errorThreshold) {
      this.monthlyUsage.set(monthKey, { tokens: newTokens, costUsd: newCost });
      const state = this.getState(monthKey);
      logger.error('[glm-cost-tracker] 达到或超过预算限额（拒绝）。', state);
      return {
        allowed: false,
        state,
        record: { timestamp: when.toISOString(), tokens, costUsd: cost },
      };
    }

    if (newCost >= this.warnThreshold && prev.costUsd < this.warnThreshold) {
      this.monthlyUsage.set(monthKey, { tokens: newTokens, costUsd: newCost });
      const state = this.getState(monthKey);
      logger.warn('[glm-cost-tracker] 达到预算 50% 警告阈值。', state);
      return {
        allowed: true,
        state,
        record: { timestamp: when.toISOString(), tokens, costUsd: cost },
      };
    }

    this.monthlyUsage.set(monthKey, { tokens: newTokens, costUsd: newCost });
    return {
      allowed: true,
      state: this.getState(monthKey),
      record: { timestamp: when.toISOString(), tokens, costUsd: cost },
    };
  }

  // 获取指定月的汇总（YYYY-MM）
  getMonthlyUsage(month?: string): { tokens: number; costUsd: number } {
    const key = month ?? this.monthKey(new Date());
    const v = this.monthlyUsage.get(key) ?? { tokens: 0, costUsd: 0 };
    return { tokens: v.tokens, costUsd: v.costUsd };
  }

  // 获取指定月状态（YYYY-MM）
  getState(month?: string): GLMCostState {
    const key = month ?? this.monthKey(new Date());
    const usage = this.monthlyUsage.get(key) ?? { tokens: 0, costUsd: 0 };
    const level = usage.costUsd >= this.errorThreshold ? 'error' : (usage.costUsd >= this.warnThreshold ? 'warn' : 'ok');
    return {
      month: key,
      monthlyBudget: this.monthlyBudget,
      used: usage.costUsd,
      remaining: Math.max(0, this.monthlyBudget - usage.costUsd),
      level,
      warnThreshold: this.warnThreshold,
      errorThreshold: this.errorThreshold,
    };
  }

  // 重置指定月（便于测试）
  resetMonth(month?: string, monthlyBudget?: number): void {
    if (monthlyBudget !== undefined) {
      this.monthlyBudget = clampBudget(monthlyBudget);
      this.warnThreshold = this.monthlyBudget / 2;
      this.errorThreshold = this.monthlyBudget;
    }
    const key = month ?? this.monthKey(new Date());
    this.monthlyUsage.set(key, { tokens: 0, costUsd: 0 });
  }

  private monthKey(d: Date): string {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}`;
  }
}

export const globalGLMCostTracker = new GLMCostTracker();

export default GLMCostTracker;
