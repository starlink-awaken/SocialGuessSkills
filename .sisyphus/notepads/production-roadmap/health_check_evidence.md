Health check 工具变更证据 - 2026-02-04

- 文件: src/server.ts
- 工具名: health_check
- 返回: { status: "ok", timestamp: ISO8601, version: package.json.version, systemChecks: { envLoaded: boolean, apiKeyPresent: boolean } }
- 敏感信息: 未返回或打印任何 environment 变量具体值，仅返回布尔标志

验证步骤:
1. 在代码中已注册 health_check 工具 (见 src/server.ts 中 registerTool 调用)
2. 代码通过 lsp 诊断，TypeScript 无错误
3. 证据: grep 输出、代码审查
