# MCP Integration Guide

## Overview
本文档详细介绍了如何将“社会体系建模多Agent系统”集成为 Model Context Protocol (MCP) Server，并分别在 Claude Desktop 和 OpenCode CLI 中进行配置。

通过集成 MCP，AI 助手（如 Claude）可以直接调用本项目提供的推理工具，协助用户进行复杂的社会系统分析。

## Prerequisites
- **Bun**: 项目运行环境 (版本 >= 1.0)
- **Claude Desktop**: 推荐的集成平台
- **OpenCode CLI**: 命令行工具 (目前处于研究阶段)
- **项目绝对路径**: `/Users/xiamingxing/Workspace/Skills/SocialGuessSkills`

## Claude Desktop Integration (✅ 已验证配置)

### Configuration
1. 打开或创建 Claude Desktop 配置文件：
   - 路径：`~/Library/Application Support/Claude/claude_desktop_config.json`
2. 在 `mcpServers` 部分添加 `social-modeling` 配置：

```json
{
  "mcpServers": {
    "social-modeling": {
      "command": "bun",
      "args": ["run", "/Users/xiamingxing/Workspace/Skills/SocialGuessSkills/src/server.ts"],
      "cwd": "/Users/xiamingxing/Workspace/Skills/SocialGuessSkills"
    }
  }
}
```

### Verification
1. 完全退出 Claude Desktop (Cmd+Q)。
2. 重新启动 Claude Desktop。
3. 点击聊天框下方的工具图标（或输入 `tools`），检查是否出现以下工具：
   - `reasoning`: 完整推演流程
   - `query_agent`: 单个 Agent 查询
   - `validate_model`: 模型验证

### Troubleshooting
- **工具未出现**: 检查 `claude_desktop_config.json` 中的绝对路径是否正确。
- **启动报错**: 尝试手动运行 `bun run src/server.ts` 确认项目能正常启动。
- **权限问题**: 确保 Claude Desktop 有权访问项目目录。

## OpenCode CLI Integration (⚠️ 状态：研究中)

### Current Status
目前 OpenCode CLI 对本地 MCP Server 的配置支持尚不完善。虽然配置格式与 Claude Desktop 类似，但 CLI 工具在加载自定义 `mcpServers` 键时可能会报错。

### Known Issues
- **Unrecognized key**: `opencode mcp list` 可能会报错 `Unrecognized key: "mcpServers"`，这是因为 CLI 的 schema 校验过于严格。
- **配置文件冲突**: `~/.opencode/opencode.jsonc` 若包含 `mcpServers` 可能导致其它 OpenCode 命令失败。建议暂时将配置保存在 `~/.opencode/ocx.jsonc` 中作为备用。

## Usage Examples

### Example 1: Social System Reasoning (使用 reasoning 工具)
**场景**: 分析一个 1000 人社区在资源有限情况下的合作机制。

**输入 JSON**:
```json
{
  "hypothesis": {
    "assumptions": [
      "1000人社区,资源有限(粮食、住房、工具)",
      "协作可提升总产出30%"
    ],
    "constraints": [
      "信息不完全:个体只知道邻近50人的状态"
    ],
    "goals": [
      "保证所有人基本生存",
      "建立可持续的分配机制"
    ]
  },
  "maxIterations": 2
}
```

**预期输出**: 包含 7 个 Agent 的详细分析报告和 9 层社会结构模型。

### Example 2: Query Specific Agent (使用 query_agent 工具)
**场景**: 专门咨询风险分析 Agent 对特定假设的看法。

**输入 JSON**:
```json
{
  "agentType": "risk",
  "hypothesis": {
    "assumptions": ["高度竞争的环境", "资源分配极度不均"],
    "constraints": [],
    "goals": ["维持社会稳定"]
  }
}
```

**预期输出**: 专注于社会脆弱性、冲突爆发点和韧性策略的专业风险评估。

## Troubleshooting

### Common Issues
1. **Command Not Found**: 报错找不到 `bun`。
   - **解决**: 在 `args` 中使用 `bun` 的绝对路径（如 `/usr/local/bin/bun`），或者确保 `bun` 在系统的 PATH 中。
2. **Path Errors**: 绝对路径错误。
   - **解决**: 仔细核对 `/Users/xiamingxing/Workspace/Skills/SocialGuessSkills/src/server.ts` 是否存在。
3. **JSON Syntax Error**: 配置文件 JSON 格式错误。
   - **解决**: 使用 JSON 校验工具检查 `claude_desktop_config.json` 是否包含多余的逗号或括号不匹配。

### Debug Mode
要查看 MCP Server 的实时日志，可以将其输出重定向到文件：
```json
"args": ["run", "src/server.ts", ">>", "/tmp/mcp.log", "2>&1"]
```
（注：此配置视具体环境而定，Claude Desktop 可能不支持直接重定向，建议检查项目内部日志或使用系统的控制台查看器）。

## FAQ
**Q: 为什么 OpenCode 识别不了我的工具？**
A: 目前 OpenCode 的本地 MCP 扩展机制正在更新中，建议优先使用 Claude Desktop 进行测试。

**Q: 如何更新工具定义的 Prompt？**
A: 修改 `src/agents/prompts/` 目录下的 `.md` 文件。修改后 MCP Server 会在下次调用时自动加载。
