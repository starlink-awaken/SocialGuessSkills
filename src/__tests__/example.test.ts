import { test, expect } from "bun:test";

test("示例测试 - 基础结构验证", () => {
  expect(true).toBe(true);
});

test("AgentPrompt文件完整性验证", () => {
  const fs = require("fs");
  const promptDir = "src/agents/prompts";
  const files = fs.readdirSync(promptDir);

  expect(files.length).toBeGreaterThanOrEqual(7);

  for (const file of files) {
    const content = fs.readFileSync(`${promptDir}/${file}`, "utf-8");
    expect(content).toContain("## 角色定义");
    expect(content).toContain("## 输出格式");
    expect(content).toContain("## 核心职责");
  }
});

test("TypeScript类型定义存在性验证", () => {
  const fs = require("fs");
  const typesContent = fs.readFileSync("src/types.ts", "utf-8");
  
  expect(typesContent).toContain("export type AgentType");
  expect(typesContent).toContain("export interface AgentOutput");
  expect(typesContent).toContain("export interface Hypothesis");
  expect(typesContent).toContain("export interface SocialSystemModel");
  expect(typesContent).toContain("export interface Conflict");
});
