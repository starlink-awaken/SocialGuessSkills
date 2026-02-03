## [2026-02-03] issues

- 在使用 `opencode mcp list` 时, CLI 报错: "Unrecognized key: \"mcpServers\""。
- 错因: 用户配置文件 `~/.opencode/opencode.jsonc` 中包含 mcpServers 键, 但 opencode 当前 schema(opencode.ai/config.json) 未识别此键。
- 影响: opencode 无法读取用户定义的 mcpServers 配置, 导致无法列出或调用本地 MCP 服务器。

## 排查记录

1. 验证了多个配置文件:
   - ~/.opencode/ocx.jsonc (使用 ocx schema) 包含 mcpServers
   - ~/.opencode/opencode.jsonc (使用 opencode.ai schema) 同样包含 mcpServers -> 导致校验失败
2. opencode 读取时优先加载 ~/.opencode/opencode.jsonc, 该文件使用 opencode.ai/config.json schema, 不接受 mcpServers 键 -> 报错

## 建议

- 将 mcpServers 配置放在 ocx.jsonc (或其它被接受的文件) 并移除 opencode.jsonc 中的 mcpServers, 或更新 opencode.jsonc 的 schema 以支持 mcpServers(不推荐手动修改主配置)
## [2026-02-03] Task 3: OpenCode CLI验证阻塞

### 问题
OpenCode CLI没有列出social-modeling MCP服务器

### 尝试
1. 配置在ocx.jsonc中 - OpenCode CLI未读取
2. 之前配置在opencode.jsonc中但schema不支持mcpServers键
3. opencode mcp list显示8个服务器但不包含social-modeling

### 可能原因
- OpenCode CLI可能需要特定的注册方式（如opencode mcp add）
- 或者local stdio MCP服务器需要不同的配置方式
- ocx.jsonc可能是不同工具（OCX）的配置

### 建议
暂时跳过OpenCode CLI集成，先验证Claude Desktop集成，因为：
1. Claude Desktop是主要使用场景
2. 有标准的MCP配置文档
3. 可以后续回来解决OpenCode CLI的问题

### 下一步
继续Task 4-6: Claude Desktop集成
