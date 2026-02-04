// cost-predictor.ts
// 提供estimateCost()用于基于输入token估算输出token、单次推理成本、月度剩余预算
// 说明：此模块只做估算，不会改变实际计费或记录真实消费。输出=输入*1.5 为默认假设，仅用于快速预算规划。

import { globalTokenCounter } from "./token-counter.js";
import { appendFileSync } from "fs";
import { config } from './config.js';

export type EstimateResult = {
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimated_cost: number; // 单次请求美元
  remaining_budget: number; // 本月剩余预算美元
  remaining_requests: number; // 在剩余预算下可执行的近似请求次数
};

export type Hypothesis = {
  assumptions?: string[];
  constraints?: string[];
  goals?: string[];
  // 也允许直接传入字符串
};

// 读取月预算，环境变量 MONTHLY_BUDGET（美元），默认 50
function readMonthlyBudget(): number {
  return config.MONTHLY_BUDGET;
}

// 估算函数
export function estimateCost(h: Hypothesis | string, inputTokens?: number): EstimateResult {
  // 如果没有明确的inputTokens，尝试根据hypothesis长度估算（每字符0.25 token）
  let estInput = 0;
  if (typeof h === "string") {
    estInput = inputTokens ?? Math.ceil(h.length * 0.25);
  } else {
    const serialized = JSON.stringify(h);
    estInput = inputTokens ?? Math.ceil(serialized.length * 0.25);
  }

  // 假设输出 = 输入 * 1.5
  const estOutput = Math.ceil(estInput * 1.5);

  // 使用 token-counter 中的定价来计算成本（保持一致）
  // token-counter: input $3/1M, output $15/1M
  const inputCost = (estInput / 1_000_000) * 3;
  const outputCost = (estOutput / 1_000_000) * 15;
  const cost = Math.round((inputCost + outputCost) * 100) / 100;

  // 获取本月已消耗
  const monthly = globalTokenCounter.getMonthlyUsage();
  const spent = monthly.costUsd;
  const budget = readMonthlyBudget();
  const remainingBudget = Math.max(0, Math.round((budget - spent) * 100) / 100);

  // 估算在剩余预算下还能执行多少次此类请求
  const remainingRequests = cost > 0 ? Math.floor(remainingBudget / cost) : Infinity;

  const result: EstimateResult = {
    estimated_input_tokens: estInput,
    estimated_output_tokens: estOutput,
    estimated_cost: cost,
    remaining_budget: remainingBudget,
    remaining_requests: remainingRequests,
  };

  // 追加到项目 notepad（只追加简短记录，避免大量 IO）
  try {
    const notePath = ".sisyphus/notepads/production-roadmap/learnings.md";
    const now = new Date().toISOString();
    const line = `\n${now} - cost-predictor estimate: input=${result.estimated_input_tokens}, output=${result.estimated_output_tokens}, cost=$${result.estimated_cost}, remainingBudget=$${result.remaining_budget}`;
    appendFileSync(notePath, line, { encoding: "utf8" });
  } catch (e) {
    // 忽略写入错误，不影响主流程
  }

  return result;
}

export default estimateCost;
