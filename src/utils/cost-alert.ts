/*
 * 成本告警工具
 * - 从环境变量 MONTHLY_BUDGET 读取月度预算（美元），默认 20
 * - 阈值为预算的 50%（警告，默认 $5 when budget=10）和 100%（错误）
 * - 提供接口用于增加消耗（例如 token 计数器调用）并返回是否允许新请求
 * - 不会执行任何付费操作；超预算时仅拒绝新请求并记录日志
 */

type AlertLevel = 'ok' | 'warn' | 'error';

import { config } from './config.js';
import { logger } from './logger.js';

const DEFAULT_BUDGET = config.MONTHLY_BUDGET;

function readBudgetFromEnv(): number {
  return DEFAULT_BUDGET;
}

export class CostAlert {
  private monthlyBudget: number;
  private used: number; // 已用金额，美元
  private warnThreshold: number; // 50%阈值
  private errorThreshold: number; // 100%阈值

  constructor(monthlyBudget?: number) {
    this.monthlyBudget = clampBudget(monthlyBudget ?? readBudgetFromEnv());
    this.used = 0;
    this.warnThreshold = this.monthlyBudget / 2; // 50%
    this.errorThreshold = this.monthlyBudget; // 100%
  }

  // 获取当前状态
  getState() {
    const level: AlertLevel = this.used >= this.errorThreshold ? 'error' : (this.used >= this.warnThreshold ? 'warn' : 'ok');
    return {
      monthlyBudget: this.monthlyBudget,
      used: this.used,
      remaining: Math.max(0, this.monthlyBudget - this.used),
      level,
      warnThreshold: this.warnThreshold,
      errorThreshold: this.errorThreshold,
    };
  }

  // 将消耗增加 amount（美元）。返回是否允许继续（true = 允许，新请求可通过；false = 拒绝）
  // 如果增加后达到/超过 warn 或 error，将输出日志
  addUsage(amount: number): { allowed: boolean; state: ReturnType<CostAlert['getState']> } {
    if (amount <= 0) {
      logger.warn('[cost-alert] addUsage called with non-positive amount', amount);
      return { allowed: true, state: this.getState() };
    }

    const prevUsed = this.used;
    const newUsed = this.used + amount;

    // 先判断是否会超预算（如果当前已处于 error，则拒绝所有新请求）
    if (prevUsed >= this.errorThreshold) {
      logger.error('[cost-alert] 月度预算已超出，拒绝新请求', { monthlyBudget: this.monthlyBudget, used: this.used });
      return { allowed: false, state: this.getState() };
    }

    // 如果 newUsed 超过 error 阈值，记录错误并拒绝
    if (newUsed >= this.errorThreshold) {
      this.used = newUsed;
      const s = this.getState();
      logger.error('[cost-alert] 达到或超过预算限额（拒绝）。', s);
      return { allowed: false, state: s };
    }

    // 如果 newUsed 到达 warn 阈值（但未到 error），记录警告，但允许
    if (newUsed >= this.warnThreshold && prevUsed < this.warnThreshold) {
      this.used = newUsed;
      const s = this.getState();
      logger.warn('[cost-alert] 达到预算 50% 警告阈值。', s);
      return { allowed: true, state: s };
    }

    // 正常累加
    this.used = newUsed;
    return { allowed: true, state: this.getState() };
  }

  // 重置当月使用（仅测试/维护用途）
  reset(monthlyBudget?: number) {
    if (monthlyBudget !== undefined) {
      this.monthlyBudget = clampBudget(monthlyBudget);
      this.warnThreshold = this.monthlyBudget / 2;
      this.errorThreshold = this.monthlyBudget;
    }
    this.used = 0;
  }
}

  // Helper: 提取clampBudget()方法以消除重复代码
  export function clampBudget(budget: number): number {
    // Clamp budget to allowed range (10-50 per spec)
    return Math.max(10, Math.min(50, budget));
  }

// 默认导出单例，方便直接在项目中使用
export const defaultCostAlert = new CostAlert();

export default CostAlert;
