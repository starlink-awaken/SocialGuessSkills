# SocialGuessSkills > src > __tests__

## OVERVIEW
模块职责: 系统测试覆盖,确保代码质量和功能正确性

关键功能:
- 端到端测试 - 验证完整工作流从输入到输出的正确性
- 单元测试 - 测试各模块的独立功能
- 集成测试 - 验证模块间协作和数据流正确性
- 快速执行 - 使用Bun内置测试框架,无需额外依赖

设计理念:
- 测试覆盖全面性 - 确保所有核心功能都有测试
- 测试隔离性 - 每个测试独立运行,无依赖
- 快速反馈 - Bun测试框架提供即时结果

## STRUCTURE
```
src/__tests__/
├── e2e.test.ts                  # 端到端测试(完整工作流)
├── orchestrator.test.ts           # 编排器单元测试
├── conflict-resolver.test.ts       # 冲突解析器测试
├── agent-factory.test.ts          # Agent工厂测试
├── agent-executor.test.ts         # Agent执行器测试
├── retry.test.ts                # 重试机制测试
├── token-counter.test.ts          # Token计数器测试
├── config.test.ts               # 配置测试
└── example.test.ts              # 示例测试
```

## WHERE TO LOOK

| 测试类型 | 文件 | 说明 |
|---------|------|------|
| 端到端测试 | e2e.test.ts | 完整工作流验证(假设→7 Agent→模型→输出) |
| 编排器测试 | orchestrator.test.ts | 6步流程验证,状态管理,迭代逻辑 |
| 冲突检测测试 | conflict-resolver.test.ts | 3种检测规则测试(逻辑/优先级/风险叠加) |
| Agent工厂测试 | agent-factory.test.ts | Agent创建和Prompt加载测试 |
| Agent执行器测试 | agent-executor.test.ts | Agent推理测试,上下文构建,模拟输出 |
| 工具函数测试 | retry.test.ts, token-counter.test.ts, config.test.ts | 独立工具测试 |
| 示例测试 | example.test.ts | 使用示例验证系统行为 |

## CONVENTIONS
- **测试框架**: `bun test` (非 `npm test`, `jest`, `vitest`)
- **测试文件命名**: `*.test.ts` (非 `*.spec.ts`)
- **断言**: 使用 Bun内置的断言 (基于标准assert)
- **Mock函数**: 使用 Bun.spy 或简单的函数Mock
- **异步测试**: 使用 `async/await` 和 Promise处理
- **测试运行**:
  ```bash
  bun test src/__tests__/              # 运行所有测试
  bun test src/__tests__/orchestrator.test.ts  # 运行单个测试文件
  ```

## ANTI-PATTERNS
- 不要使用jest/vitest特定语法(如expect().toHaveBeenCalled())
- 不要跳过错误情况测试(必须测试边界和失败场景)
- 不要在测试中使用console.log调试(使用assert输出)
- 不要耦合测试(每个测试应独立运行,无副作用)
