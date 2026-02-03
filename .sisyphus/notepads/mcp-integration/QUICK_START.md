# MCP集成快速验证和使用指南

## 📊 当前配置状态

### ✅ Claude Desktop配置
**配置文件**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

**状态**: ✅ 配置完成，需要重启应用验证

### ✅ OpenCode CLI配置
**配置文件**: `~/.opencode/ocx.jsonc`

```json
{
  "$schema": "https://ocx.kdco.dev/schemas/ocx.json",
  "mcpServers": {
    "social-modeling": {
      "command": "bun",
      "args": ["run", "/Users/xiamingxing/Workspace/Skills/SocialGuessSkills/src/server.ts"],
      "cwd": "/Users/xiamingxing/Workspace/Skills/SocialGuessSkills"
    }
  }
}
```

**状态**: ⚠️ 配置存在，但`opencode mcp list`未识别social-modeling

---

## 🚀 Claude Desktop使用步骤

### 步骤1：重启Claude Desktop

```bash
# 在终端运行（或直接操作GUI）
# 1. 完全退出 Claude Desktop (Cmd+Q)
# 2. 重新启动应用
```

### 步骤2：验证MCP工具加载

在Claude Desktop界面中：

1. **新建对话**或打开任意对话
2. **查看工具面板**（通常在右侧或通过/工具访问）
3. **验证是否显示3个工具**：
   - `reasoning` - 完整社会系统推演
   - `query_agent` - 查询单个Agent
   - `validate_model` - 验证社会模型

### 步骤3：测试工具调用

在对话框中输入：

```
请使用reasoning工具分析一个100人社区的治理问题

假设：
- 100人社区，资源有限
- 个体能力差异大
- 协作可提升总产出30%

约束：
- 通信成本：当面交流免费，间接传播有衰减
- 信息不完全：个体只知道邻近50人的状态

目标：
- 保证所有人基本生存
- 建立可持续的资源分配机制
```

**预期结果**：
- Claude会自动调用`reasoning`工具
- 返回7个Agent的分析结果
- 包含冲突检测和综合模型

---

## 🔧 OpenCode CLI使用步骤

### 当前问题

`opencode mcp list` 未显示social-modeling服务器

### 尝试方案1：使用opencode mcp add

```bash
# 尝试添加MCP服务器
opencode mcp add social-modeling \
  --command bun \
  --args "run,/Users/xiamingxing/Workspace/Skills/SocialGuessSkills/src/server.ts" \
  --cwd "/Users/xiamingxing/Workspace/Skills/SocialGuessSkills"
```

### 尝试方案2：直接配置

如果ocx.jsonc配置正确但未被识别：

```bash
# 1. 验证配置文件
cat ~/.opencode/ocx.jsonc | jq .

# 2. 检查OpenCode是否读取配置
opencode config show

# 3. 查看可用命令
opencode --help | grep -A 5 mcp
```

### 尝试方案3：使用opencode.jsonc（而非ocx.jsonc）

```bash
# 有些系统可能使用opencode.jsonc而非ocx.jsonc
# 将配置复制到opencode.jsonc中（如果之前失败）
cp ~/.opencode/ocx.jsonc ~/.opencode/opencode.jsonc
```

---

## 📝 快速测试命令

### 测试1：MCP服务器启动

```bash
cd /Users/xiamingxing/Workspace/Skills/SocialGuessSkills

# 后台启动服务器
bun run src/server.ts > /tmp/mcp-server.log 2>&1 &

# 查看日志
tail -f /tmp/mcp-server.log

# 停止服务器（测试完成后）
pkill -f "bun.*server.ts"
```

**预期输出**：
```
[MCP] Social Modeling MCP Server running on stdio
```

### 测试2：手动测试MCP协议

```bash
cd /Users/xiamingxing/Workspace/Skills/SocialGuessSkills

# 通过stdio发送tools/list请求
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | bun run src/server.ts
```

**预期输出**：包含3个工具定义的JSON

---

## 🐛 故障排除

### 问题1：Claude Desktop重启后看不到MCP工具

**可能原因**：
- 配置文件格式错误
- MCP服务器路径错误
- Bun未安装或不在PATH

**解决步骤**：
```bash
# 1. 检查Bun是否可用
which bun

# 2. 检查服务器文件是否存在
ls -la /Users/xiamingxing/Workspace/Skills/SocialGuessSkills/src/server.ts

# 3. 验证JSON语法
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .

# 4. 查看Claude Desktop日志
# macOS: ~/Library/Logs/Claude/
```

### 问题2：OpenCode CLI未识别MCP服务器

**解决步骤**：
```bash
# 1. 检查OpenCode版本
opencode --version

# 2. 尝试重新加载配置
opencode config reload

# 3. 查看详细错误
opencode mcp list --verbose
```

### 问题3：MCP服务器启动失败

**可能原因**：
- TypeScript编译错误
- 依赖缺失
- 端口冲突（虽然stdio模式不会有）

**解决步骤**：
```bash
# 1. 检查TypeScript编译
bunx tsc --noEmit

# 2. 检查依赖
bun install

# 3. 运行测试
bun test
```

---

## 📚 参考文档

- **完整集成指南**: `docs/MCP_INTEGRATION.md`
- **使用示例**: `examples/mcp-usage-examples.md`
- **项目README**: `README.md`

---

## 🎯 下一步行动

### 立即执行
1. ✅ 重启Claude Desktop
2. ✅ 在Claude中测试MCP工具调用
3. ✅ 查看工具返回结果

### 如果Claude Desktop成功
- ✅ 可以开始使用社会推理能力
- ✅ 使用`examples/mcp-usage-examples.md`中的prompt模板
- ✅ 如有问题，查阅`docs/MCP_INTEGRATION.md`故障排除章节

### 如果OpenCode需要深入集成
- 📝 查看OpenCode CLI文档和GitHub
- 🔍 研究opencode mcp add命令的正确用法
- 🐛 如遇阻塞性问题，记录到issues.md

---

## ✅ 验证检查清单

在使用MCP工具前，确认：

- [ ] Claude Desktop已重启
- [ ] 在工具面板中看到3个MCP工具
- [ ] 成功调用了至少一个工具
- [ ] 工具返回的结果格式正确
- [ ] 遇到问题时查看了故障排除章节

完成以上清单，说明MCP集成成功！🎉
