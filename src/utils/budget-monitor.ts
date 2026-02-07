import { logger } from './logger.js';
import {
  GLMCostTracker,
  globalGLMCostTracker,
  type GLMCostRecord,
  type GLMCostState,
} from './glm-cost-tracker.js';

export type BudgetReport = {
  period: 'daily' | 'weekly' | 'monthly';
  start: string; // ISO
  end: string; // ISO
  tokens: number;
  costUsd: number;
  records: GLMCostRecord[];
  monthlyState: GLMCostState;
};

type ReportRange = { start: Date; end: Date };

export class BudgetMonitor {
  private tracker: GLMCostTracker;
  private records: GLMCostRecord[] = [];

  constructor(tracker: GLMCostTracker = globalGLMCostTracker) {
    this.tracker = tracker;
  }

  addUsage(tokens: number, when = new Date()): { allowed: boolean; state: GLMCostState; record?: GLMCostRecord } {
    const result = this.tracker.addUsage(tokens, when);
    if (result.record) {
      this.records.push(result.record);
    }
    return result;
  }

  getDailyReport(day = new Date()): BudgetReport {
    const range = this.dayRange(day);
    return this.buildReport('daily', range);
  }

  getWeeklyReport(ending = new Date()): BudgetReport {
    const range = this.weekRange(ending);
    return this.buildReport('weekly', range);
  }

  getMonthlyReport(month: string | Date = new Date()): BudgetReport {
    const range = this.monthRange(month);
    return this.buildReport('monthly', range);
  }

  private buildReport(period: BudgetReport['period'], range: ReportRange): BudgetReport {
    const records = this.filterRecords(range);
    const { tokens, costUsd } = this.sumRecords(records);
    const monthlyState = this.tracker.getState(this.monthKey(range.end));

    if (records.length === 0) {
      logger.info('[budget-monitor] report has no records', { period, start: range.start, end: range.end });
    }

    return {
      period,
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      tokens,
      costUsd,
      records,
      monthlyState,
    };
  }

  private filterRecords(range: ReportRange): GLMCostRecord[] {
    const startMs = range.start.getTime();
    const endMs = range.end.getTime();
    return this.records.filter((record) => {
      const ts = Date.parse(record.timestamp);
      return ts >= startMs && ts <= endMs;
    });
  }

  private sumRecords(records: GLMCostRecord[]): { tokens: number; costUsd: number } {
    return records.reduce(
      (acc, record) => ({
        tokens: acc.tokens + record.tokens,
        costUsd: acc.costUsd + record.costUsd,
      }),
      { tokens: 0, costUsd: 0 },
    );
  }

  private dayRange(day: Date): ReportRange {
    const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59, 999));
    return { start, end };
  }

  private weekRange(ending: Date): ReportRange {
    const end = new Date(Date.UTC(ending.getUTCFullYear(), ending.getUTCMonth(), ending.getUTCDate(), 23, 59, 59, 999));
    const start = new Date(Date.UTC(ending.getUTCFullYear(), ending.getUTCMonth(), ending.getUTCDate(), 0, 0, 0, 0));
    start.setUTCDate(start.getUTCDate() - 6);
    return { start, end };
  }

  private monthRange(month: string | Date): ReportRange {
    const key = typeof month === 'string' ? month : this.monthKey(month);
    const [yearPart, monthPart] = key.split('-');
    const year = Number(yearPart);
    const monthIndex = Number(monthPart) - 1;
    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
    return { start, end };
  }

  private monthKey(d: Date): string {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    return `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}`;
  }
}

export const globalBudgetMonitor = new BudgetMonitor();

export default BudgetMonitor;
