interface ToolInfo {
  name: string;
  description: string;
  category: string;
}

const TOOLS: ToolInfo[] = [
  {
    name: "reasoning",
    description: "执行完整的工作流，模拟7个专业Agent协同分析",
    category: "workflow"
  },
  {
    name: "query_agent",
    description: "单独查询某个Agent的分析结果，提供专业领域视角",
    category: "agent"
  },
  {
    name: "tools_list",
    description: "列出所有可用的MCP工具",
    category: "discovery"
  }
];

export function getAllTools(): ToolInfo[] {
  return [...TOOLS];
}

export function getTool(name: string): ToolInfo | undefined {
  return TOOLS.find(tool => tool.name === name);
}

export function getToolsByCategory(category: string): ToolInfo[] {
  return TOOLS.filter(tool => tool.category === category);
}
