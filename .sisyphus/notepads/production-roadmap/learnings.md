2026-02-04 - 重构配置为环境变量

- 将多个硬编码配置（MAX_CONCURRENT, MAX_TOKENS, MONTHLY_BUDGET, LOG_LEVEL, 重试参数等）集中迁移到 src/utils/config.ts
- 在 request-queue、token-counter、cost-predictor、logger、agent-executor、llm-client 等模块引用 config
- 更新 .env.example 包含说明、默认值和注释
- 增加 validateConfig() 在关键模块（llm-client）导入时进行必需配置校验
- 运行测试: bun test -> 全部通过 (23 tests)
- 注意事项: 尽量避免在类体内直接 import，已确保 import 在文件顶部；token-counter 的 HARD_LIMIT 使用 config.MAX_TOKENS

下一步建议:
- 将更多常量（如 token 定价）也迁移到 config，便于运行时调整
- 添加配置单元测试以覆盖缺失环境变量行为
