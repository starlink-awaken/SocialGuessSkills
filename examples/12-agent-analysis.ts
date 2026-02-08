import { runWorkflow } from "../src/workflow/orchestrator.js";
import type { Hypothesis } from "../src/types.js";

const hypothesis: Hypothesis & { topic: string } = {
  topic: "全面 AI 自动化治理系统",
  assumptions: ["2025年前", "发达国家", "AI技术成熟"],
  constraints: ["保持社会稳定", "避免大规模失业"],
  goals: ["评估治理架构", "分析效率影响", "识别潜在风险"],
};

console.log("=== 12 Agent 完整分析 ===\n");
const result = await runWorkflow(hypothesis, {
  maxIterations: 3,
  extendedAgents: true,
});

console.log(`迭代次数: ${result.metadata.iterations}`);
console.log(`置信度: ${result.metadata.confidence.toFixed(2)}`);
console.log(`Agent 数量: ${result.agentOutputs.length}`);

console.log("\n=== 6 波执行 ===\n");
result.agentOutputs.forEach((output, index) => {
  const wave = Math.floor(index / 2) + 1;
  console.log(`\nWave ${wave}: ${output.agentType} Agent`);
  console.log(`结论: ${output.conclusion}`);
  console.log(`依据数量: ${output.evidence.length}`);
});

const byCategory = {
  基础: ["systems", "econ", "socio"],
  制度文化: ["governance", "culture", "risk"],
  物理: ["environmental", "demographic", "infrastructure"],
  技术: ["technology", "historical"],
};

console.log("\n=== Agent 分类 ===\n");
Object.entries(byCategory).forEach(([category, agents]) => {
  console.log(`\n${category} (${agents.length}): ${agents.join(", ")}`);
});
