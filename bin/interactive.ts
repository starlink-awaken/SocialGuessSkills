#!/usr/bin/env bun
type PromptOption = {
  type: "select" | "text";
  message: string;
  options?: string[];
};

declare const prompt: (options: PromptOption) => Promise<string>;
import { runWorkflow } from "../src/workflow/orchestrator.js";
import type { AgentType, Hypothesis } from "../src/types.js";

const agents7: AgentType[] = [
  "systems",
  "econ",
  "socio",
  "governance",
  "culture",
  "risk",
  "validation"
];
const agents12: AgentType[] = [
  "systems",
  "econ",
  "socio",
  "governance",
  "culture",
  "risk",
  "validation",
  "environmental",
  "demographic",
  "infrastructure",
  "technology",
  "historical"
];

type AgentMode = "7 Agent" | "12 Agent";

function splitList(input: string): string[] {
  return input
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function resolveModeFromArgs(args: string[]): AgentMode | null {
  const modeIndex = args.findIndex(arg => arg === "--mode" || arg === "-m");
  const nextValue = modeIndex === -1 ? undefined : args[modeIndex + 1];
  if (nextValue) {
    const value = nextValue.trim();
    if (value === "7 Agent" || value === "7" || value.toLowerCase() === "7-agent") {
      return "7 Agent";
    }
    if (value === "12 Agent" || value === "12" || value.toLowerCase() === "12-agent") {
      return "12 Agent";
    }
  }

  const inlineMode = args.find(arg => arg.startsWith("--mode="));
  if (inlineMode) {
    const value = inlineMode.split("=")[1]?.trim() ?? "";
    if (value === "7 Agent" || value === "7" || value.toLowerCase() === "7-agent") {
      return "7 Agent";
    }
    if (value === "12 Agent" || value === "12" || value.toLowerCase() === "12-agent") {
      return "12 Agent";
    }
  }

  return null;
}

function printHelp(): void {
  console.log("\n社会体系建模交互式 CLI\n");
  console.log("用法:");
  console.log("  bun run bin/interactive.ts");
  console.log("  bun run bin/interactive.ts --mode \"7 Agent\"");
  console.log("  bun run bin/interactive.ts --mode \"12 Agent\"\n");
  console.log("选项:");
  console.log("  -m, --mode   选择 Agent 模式 (7 Agent | 12 Agent)");
  console.log("  -h, --help   显示帮助信息\n");
}

export async function runInteractive(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const modeFromArgs = resolveModeFromArgs(args);
  const selectedMode =
    modeFromArgs ??
    (await prompt({
      type: "select",
      message: "选择 Agent 模式:\n1. 7 Agent 模式（默认）\n2. 12 Agent 模式（扩展）",
      options: ["7 Agent", "12 Agent"]
    }));

  const useExtendedAgents = selectedMode === "12 Agent";
  const agents = useExtendedAgents ? agents12 : agents7;

  const topic = await prompt({ type: "text", message: "请输入假设主题：" });
  const assumptionsInput = await prompt({
    type: "text",
    message: "请输入假设前提（多个,逗号分隔）："
  });
  const constraintsInput = await prompt({
    type: "text",
    message: "请输入约束条件（多个,逗号分隔）："
  });
  const goalsInput = await prompt({
    type: "text",
    message: "请输入目标（多个,逗号分隔）："
  });

  const hypothesis: Hypothesis = {
    assumptions: splitList(assumptionsInput ?? ""),
    constraints: splitList(constraintsInput ?? ""),
    goals: splitList(goalsInput ?? "")
  };

  if (hypothesis.assumptions.length === 0 || hypothesis.goals.length === 0) {
    console.log("\n输入为空，未执行工作流。请确保 assumptions 与 goals 非空。\n");
    return;
  }

  const model = await runWorkflow(hypothesis, { extendedAgents: useExtendedAgents });

  console.log("\n=== 执行结果 ===");
  console.log(`主题: ${topic ?? ""}`);
  console.log(`Agent 模式: ${useExtendedAgents ? "12 Agent" : "7 Agent"}`);
  console.log(`迭代次数: ${model.metadata.iterations}`);
  console.log(`置信度: ${model.metadata.confidence.toFixed(2)}`);
  console.log(`Agent 数量: ${model.agentOutputs.length}`);
  console.log(`Agent 列表: ${agents.join(", ")}`);
}

if (import.meta.main) {
  runInteractive().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
