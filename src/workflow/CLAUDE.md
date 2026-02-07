# SocialGuessSkills > src > workflow

## OVERVIEW
模块职责: 实现6步推演流程,控制整体执行逻辑

关键功能:
- 管理工作流状态 - 跟踪迭代次数、Agent结果、冲突历史
- 协调各子模块 - 调用Agent工厂、冲突检测器、模型合成器
- 计算模型置信度 - 基于Agent一致性和冲突情况计算置信分数
- 迭代收敛控制 - 判断是否继续迭代或输出最终模型

设计理念:
- 明确的6步流程 - 避免Agent间无休止的自治协商
- 可预测性 - 每一步都有明确的输入输出,易于调试和验证
- 可控性 - 用户可以控制迭代次数和工作流深度
- 结构化 - 每一步都有明确职责,易于扩展和维护

## STRUCTURE
```
src/workflow/
├── orchestrator.ts       # 6步编排引擎
└── conflict-resolver.ts  # 冲突检测和解决
```

## WHERE TO LOOK

| 任务 | 文件 | 函数 | 说明 |
|------|------|--------|------|
| 启动完整工作流 | orchestrator.ts | `runWorkflow()` | 主入口,6步流程起点 |
| 假设验证 | orchestrator.ts | `validateHypothesis()` | 验证assumptions和goals非空 |
| Agent并行执行 | orchestrator.ts | `executeAgents()` | 并发调用7个Agent |
| 冲突检测 | orchestrator.ts | `alignConflicts()` | 调用冲突解析器检测冲突 |
| 模型合成 | orchestrator.ts | `synthesizeModel()` | 构建9层结构化社会体系模型 |
| 模型验证 | orchestrator.ts | `validateModel()` | 检查模型完整性和质量 |
| 迭代收敛 | orchestrator.ts | `iterate()` | 判断是否继续迭代(最大3次) |
| 逻辑矛盾检测 | conflict-resolver.ts | `detectConflicts()` - 规则1 | 关键字匹配+可证伪点比对 |
| 优先级冲突 | conflict-resolver.ts | `detectConflicts()` - 规则2 | 相似建议去重+Agent优先级矩阵 |
| 风险叠加检测 | conflict-resolver.ts | `detectConflicts()` - 规则3 | 风险评分汇总+阈值判断(>3分) |

## CONVENTIONS
- **6步流程**: 假设验证 → Agent执行 → 冲突对齐 → 模型合成 → 模型验证 → 迭代收敛
- **工作流状态**: 使用 WorkflowState 接口管理状态
  - iterationCount: 当前迭代次数
  - agentOutputs: 所有Agent的输出结果
  - conflicts: 当前检测到的冲突
  - history: 历史记录,用于追踪推理过程
- **迭代控制**: 默认最大3次迭代,防止无限循环
- **Agent优先级矩阵**: Risk(5) > Governance(4) > Systems(3) > Econ/Socio/Culture(2) > Validation(1)

## ANTI-PATTERNS
- 不要跳过冲突检测(必须执行alignConflicts)
- 不要在未验证AgentOutput前进入下一步(确保数据完整性)
- 不要忽略优先级冲突(高优先级Agent的建议应优先考虑)
- 不要无限迭代(默认最大3次,可配置但要有上限)
