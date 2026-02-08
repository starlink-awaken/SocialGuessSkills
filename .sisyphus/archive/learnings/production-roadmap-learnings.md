实现要点:

- 在 src/server.ts 启动一个轻量 HTTP 服务用于导出 /metrics，以便 Prometheus 抓取。
- 使用项目内已有的 globalTokenCounter 获取月度 token 使用统计并导出为 mcp_tokens_total 与 mcp_cost_usd_total。
- 由于当前代码库未集中记录每个 tool 的请求计数与延迟，/metrics 暂时导出占位值(0)。后续可在工具调用处新增埋点以递增计数器与直方图桶。
- Grafana 仪表板提供基础面板示例，展示 requests、latency、tokens、cost、errors 指标。
- Prometheus 配置示例包含对 localhost:3000 的 scrape 配置，适用于在本地运行 Prometheus 进行验证。

注意事项:

- 保持导出格式遵循 Prometheus 文本格式版本 0.0.4。
- 不在 /metrics 中暴露敏感信息或大量日志，仅导出数值指标。
- TypeScript 编译与测试在提交前必须通过: bunx tsc --noEmit && bun test
