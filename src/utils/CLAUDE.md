# SocialGuessSkills > src > utils

## OVERVIEW
模块职责: 提供通用工具函数支持整个系统

关键功能:
- 配置管理 - 加载和验证环境变量,管理应用配置
- 日志记录 - 使用Pino结构化日志输出
- 重试机制 - 指数退避重试,处理API调用失败
- 成本控制 - Token计数,成本预测,超出告警
- 熔断器保护 - 失败率阈值保护,防止雪崩
- 请求队列 - 管理请求速率限制

设计理念:
- 模块化工具函数 - 每个工具函数独立且可测试
- 统一错误处理 - 使用标准Error对象(code/message)
- 配置优先级 - 环境变量覆盖默认值
- 成本可见性 - 实时显示Token消耗和成本

## STRUCTURE
```
src/utils/
├── config.ts           # 配置加载和环境变量处理
├── logger.ts           # Pino日志器配置和初始化
├── retry.ts            # 重试机制(指数退避算法)
├── circuit-breaker.ts  # 熔断器模式实现
├── cost-predictor.ts  # 成本预测和Token计费
├── cost-alert.ts       # 成本告警触发器(超预算通知)
├── token-counter.ts    # Token计数器(统计输入/输出Token)
└── request-queue.ts   # 请求队列管理(速率限制)
```

## WHERE TO LOOK

| 需求 | 文件 | 说明 |
|------|------|------|
| 加载配置 | config.ts | 环境变量读取,类型验证,默认值设置 |
| 记录日志 | logger.ts | Pino日志器初始化,日志级别配置 |
| 重试API调用 | retry.ts | 指数退避重试逻辑(maxRetry/delayMs/backoffMultiplier) |
| 熔断器保护 | circuit-breaker.ts | 失败率阈值保护(开启/关闭/状态追踪) |
| 预测成本 | cost-predictor.ts | Token成本计算,模型定价,预估成本 |
| 触发成本告警 | cost-alert.ts | 超预算通知,成本累积统计 |
| 计数Token | token-counter.ts | 统计输入/输出Token数,总Token消耗 |
| 管理请求队列 | request-queue.ts | 请求速率限制,队列管理,延迟控制 |

## CONVENTIONS
- **日志库**: 使用 Pino (非console.log),结构化日志输出
- **错误处理**: 统一使用 Error 对象,包含code和message字段
- **配置优先级**: 环境变量 > 默认配置值
- **成本控制**: Token计费基于模型定价,设置告警阈值
- **重试策略**: 指数退避,可配置最大重试次数
- **熔断保护**: 基于失败率触发,半开半关状态,自动恢复

## ANTI-PATTERNS
- 不要在工具函数中直接console.log(使用logger)
- 不要忽略错误传播(所有工具都应正确抛出Error)
- 不要硬编码配置值(使用环境变量或配置对象)
- 不要跳过成本统计(所有AI调用都应计费)
