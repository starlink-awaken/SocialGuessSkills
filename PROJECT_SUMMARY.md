# SocialGuessSkills 项目总结报告

生成时间: 2026-02-04
项目版本: 1.0.0
分析范围: 核心架构、技术栈、文档、问题与风险、改进建议

---

## 一、项目愿景与目标

### 1.1 核心愿景
提供一个轻量级、结构化的多-Agent 协作框架,从基础假设出发,通过多个专业 Agent (systems/econ/socio/governance/culture/risk/validation) 协同推演,构建"可验证"的社会体系模型,便于 AI (如 Claude) 通过 MCP 协议直接调用、交互式生成社会/社区/组织设计与政策影响分析结果。

### 1.2 主要目标
- **自动推演**: 针对给定假设自动生成 9 层结构化社会体系模型 (overall/workflow/institutions/governance/.../optimization)
- **可解释性**: 通过 6 步工作流 (假设验证→并行推演→冲突对齐→决策合成→证据校验→迭代收敛) 保证可解释性与可验证性
- **易集成**: 以 MCP Server (stdio) 暴露三大工具 (reasoning/query_agent/validate_model),便于 Claude Desktop 等通过 MCP 直接使用
- **可扩展**: 用户可通过修改 src/agents/prompts/*.md 或添加 AgentType/注册来自定义 Agent

---

## 二、技术架构与实现策略

### 2.1 技术栈
| 组件 | 技术选型 | 版本 | 决策理由 |
|------|---------|------|---------|
| 语言 | TypeScript | ^5 | 强类型系统,便于维护与扩展 |
| 运行时 | Bun | Latest | 更快启动/测试体验,内置 test runner |
| MCP 集成 | @modelcontextprotocol/sdk | ^1.25.3 | 官方 MCP SDK,支持 stdio transport |
| 测试框架 | Bun Test | 内置 | 快速、轻量、与 Bun 深度集成 |

### 2.2 核心架构

#### 2.2.1 模块关系图
```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Server (server.ts)                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  reasoning  │ │ query_agent │ │ validate_   │          │
│  │             │ │             │ │  model      │          │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘          │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │   Orchestrator (orchestrator.ts) │
          └────────────────┬────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │   Conflict Resolver              │
          │   (conflict-resolver.ts)        │
          └────────────────┬────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │   Agent Factory                 │
          │   (agent-factory.ts)            │
          │   ┌───────┬───────┬───────┐   │
          │   │ 7 x  │Prompts│Loader │   │
          │   │Agents│(md)   │       │   │
          │   └───────┴───────┴───────┘   │
          └────────────────┬────────────────┘
                           │
          ┌────────────────▼────────────────┐
          │   Agent Executor                │
          │   (agent-executor.ts)           │
          │   simulateAICall (模拟)         │
          └─────────────────────────────────┘
```

#### 2.2.2 工作流编排 (6 步)
1. **假设验证** (step1_ValidateHypothesis): 检查 assumptions/goals 非空
2. **并行 Agent 推演** (step2_ExecuteAgents): Promise.all 并行执行 7 个 Agent
3. **冲突检测与对齐** (step3_AlignConflicts): 检测逻辑/优先级/风险放大冲突
4. **模型合成** (step4_SynthesizeModel): 从 Agent 输出合成 9 层结构
5. **模型验证** (step5_ValidateModel): 检查 validation agent 是否存在
6. **迭代收敛** (for loop): 默认 3 次迭代,逐步优化

### 2.3 设计模式
- **工厂模式** (agent-factory.ts): 加载 Prompt 文件并创建 AgentInstance
- **编排器模式** (orchestrator.ts): 管理工作流生命周期
- **规则引擎** (conflict-resolver.ts): 基于关键词/优先级的冲突检测

---

## 三、使用场景与目标用户

### 3.1 典型使用场景

#### 场景 A - 新社区/基地治理设计
- **输入**: 人口规模、资源/时间约束 (examples/community-governance.json)
- **输出**: 分层治理、分配、应急储备与文化营造策略
- **适用**: 社区组织者、产品经理

#### 场景 B - 政策/制度变更影响评估
- **输入**: 政策变更假设 (如引入劳动券或配给制)
- **输出**: econ/socio/risk 等 Agent 的二阶效应与冲突分析
- **适用**: 策略分析师、政策制定者

#### 场景 C - 单维度专家咨询
- **工具**: query_agent
- **输出**: 单个 Agent 的深入分析 (如 risk Agent 的风险评估)
- **适用**: 学术研究者、分析师

#### 场景 D - 模型一致性/完整性验证
- **工具**: validate_model
- **输出**: 模型是否包含 7 个 Agent、结构字段、元数据等检查
- **适用**: AI/工程集成者、质量控制

#### 场景 E - 教学与研究
- **用途**: 社会科学、公共政策课程示例
- **特点**: 对比不同假设下的系统行为与冲突
- **适用**: 教育工作者、研究人员

#### 场景 F - 集成到 Claude Desktop/OpenCode 工作流
- **方式**: MCP Server (stdio) 集成
- **特点**: 作为对话式助手的后端推理组件
- **适用**: AI/工程集成者、开发者

### 3.2 目标用户画像

| 用户类型 | 技能水平 | 核心需求 | 期望产出 |
|---------|---------|---------|---------|
| **学术研究者** | 高 | 快速生成/比较不同假设的系统行为与冲突点,可重复实验、可证伪的模型 | 学术论文、理论验证、案例对比 |
| **策略/政策分析师** (政府/NGO) | 中-高 | 评估政策影响、识别风险、生成决策合成建议与可执行措施 | 政策评估报告、风险分析、实施清单 |
| **AI/工程集成者** | 高 | MCP 接入、部署 MCP Server、测试 RPC 调用、扩展 Agent | 集成文档、测试用例、扩展组件 |
| **社区组织者/产品经理** | 低-中 | 快速获得可执行治理建议、冲突解决方案、实施清单 | 治理方案、冲突缓解策略、优先级建议 |

---

## 四、核心功能与价值

### 4.1 已具备功能

#### 4.1.1 MCP 工具 (3 个)
1. **reasoning**: 完整推演 workflow
   - 输入: Hypothesis (assumptions/constraints/goals), maxIterations (默认 3)
   - 输出: SocialSystemModel (9 层结构)

2. **query_agent**: 单 Agent 查询
   - 输入: agentType, Hypothesis
   - 输出: AgentOutput (conclusion/evidence/risks/suggestions/falsifiable)

3. **validate_model**: 模型验证
   - 输入: modelJson (JSON 字符串)
   - 输出: validation (isValid, checks, issues, warnings)

#### 4.1.2 Agent 系统 (7 个)
| Agent 类型 | 职责 | 核心关注点 |
|-----------|------|-----------|
| systems | 系统架构 | 反馈回路、资源约束、系统稳定性 |
| econ | 经济激励 | 产权、分配、激励机制、搭便车 |
| socio | 社会规范 | 共同体认同、叙事、信任机制 |
| governance | 治理结构 | 分层治理、权责边界、规则执行 |
| culture | 文化塑造 | 仪式、符号系统、价值观 |
| risk | 风险评估 | 资源稀缺、信任崩塌、权力异化 |
| validation | 可证伪验证 | 假设验证、反例识别、科学性 |

#### 4.1.3 冲突检测机制 (3 种)
1. **逻辑冲突** (detectLogicalConflicts): 基于关键词匹配可证伪点
2. **优先级冲突** (detectPriorityConflicts): 相似建议/资源配置冲突,按优先级矩阵排序
3. **风险放大** (detectRiskAmplification): 平均风险 >3 或 >=3 个 Agent 识别崩溃风险

**优先级排序**: Risk(5) > Governance(4) > Systems(3) > Econ/Socio/Culture(2) > Validation(1)

#### 4.1.4 模型结构 (9 层)
```typescript
interface SystemStructure {
  overall: { resourceLayer, behaviorLayer, organizationLayer, institutionalLayer, governanceLayer, culturalLayer }
  workflow: { demandGeneration, resourceAllocation, production, ruleEnforcement, publicGoods, feedback }
  institutions: { propertyRights, contracts, publicGoods, disputeResolution, riskSharing }
  governance: { layeredGovernance, accountability, transparency, crisis }
  culture: { narrative, rituals, values, education }
  innovation: { experimentation, balance, adaptability }
  risks: { scarcity, trust, power, culture }
  metrics: { stability, fairness, efficiency, cooperation, resilience, legitimacy }
  optimization: { indicators, mechanisms, decisionLoop }
}
```

### 4.2 核心价值
- **结构化思考**: 将复杂社会系统分解为 9 个可分析层次
- **多维视角**: 7 个 Agent 从不同专业角度协同分析
- **冲突可见性**: 自动检测并分类冲突,避免盲点
- **可验证性**: 每个结论包含可证伪点,支持科学检验
- **快速原型**: 从假设到模型数秒完成,支持快速迭代

---

## 五、存在问题、风险与挑战

### 5.1 高优先级问题

#### 5.1.1 TypeScript 开发环境缺失
- **问题**: package.json 将 typescript 标为 peerDependency,无 devDependency
- **影响**: 无法本地运行 `bun run typecheck`,CI 类型检查失败
- **修复**: 添加 `"typescript": "^5.x"` 到 devDependencies

#### 5.1.2 真实 LLM 集成缺失
- **问题**: simulateAICall 是本地模拟,返回静态样例
- **影响**: 无法调用真实 AI (Claude/OpenAI) 进行推理,仅限演示
- **修复**: 抽象 LLMAdapter 接口,提供 Mock/Real 两种实现

#### 5.1.3 文档路径硬编码
- **问题**: 文档使用绝对路径 `/Users/xiamingxing/...`
- **影响**: 用户直接复制会报错,降低可用性
- **修复**: 泛化为占位变量 `<PROJECT_PATH>`

#### 5.1.4 错误处理不完善
- **问题**: Agent 执行失败仅记录日志,流程继续,可能返回不完整模型
- **影响**: 静默失败,用户无法感知问题
- **修复**: 明确失败策略 (重试/中断/部分结果),生成结构化错误输出

### 5.2 中等风险

#### 5.2.1 MCP SDK 依赖兼容性
- **风险**: @modelcontextprotocol/sdk 引入大量 Node 依赖 (express, zod, jose 等)
- **影响**: 在 Bun 运行时可能出现兼容性问题
- **缓解**: 在 Bun 环境进行集成测试,若不兼容考虑 Node 容器部署

#### 5.2.2 同步 I/O 阻塞
- **问题**: readFileSync 在 createAgent 中同步读取 prompt
- **影响**: 启动时阻塞,性能可优化
- **缓解**: 改为异步并行读取 (Promise.all)

#### 5.2.3 日志与监控不足
- **问题**: 散式 console.* 调用,无结构化日志
- **影响**: 生产故障定位困难,缺乏可观测性
- **缓解**: 引入结构化 logger (pino/bun log),增加 metrics

#### 5.2.4 外部 AI 调用无保护
- **问题**: 无超时/重试/限流机制
- **影响**: 生产环境可能阻塞或成本失控
- **缓解**: 增加超时 (5s)、并发池、令牌桶限流

### 5.3 低优先级问题

#### 5.3.1 LSP 提示未使用声明
- 文件: src/workflow/orchestrator.ts, src/agents/agent-executor.ts
- 类型: hint,非错误
- 影响: 代码整洁度
- 缓解: 清理未使用的 imports/变量

#### 5.3.2 tsconfig 配置可优化
- module: "Preserve" (大小写,应为 "preserve")
- noUnusedLocals/Parameters: false (建议开发阶段设为 true)
- 影响: 类型检查严格度
- 缓解: 调整配置,开启严格模式

---

## 六、下一步工作计划与任务

### 6.1 短期任务 (1-2 周)

#### 任务 1: 完善 TypeScript 开发环境 (优先级: 最高)
- [ ] 添加 `"typescript": "^5.x"` 到 devDependencies
- [ ] 运行 `bun install`
- [ ] 修复 tsconfig.json: module: "Preserve" → "preserve"
- [ ] 在 CI 中添加 `tsc --noEmit` 步骤
- [ ] 修复所有类型错误/提示

#### 任务 2: 抽象 LLM 适配器 (优先级: 高)
- [ ] 定义 LLMAdapter 接口 (executeAgent, timeout, retry)
- [ ] 实现 MockAdapter (当前 simulateAICall)
- [ ] 实现 RealAdapter (调用 Claude/OpenAI)
- [ ] 配置化: 通过环境变量切换 Mock/Real 模式
- [ ] 添加 API key 配置与速率控制

#### 任务 3: 改进错误处理 (优先级: 高)
- [ ] 为 executeAgent 添加超时 (默认 5s)
- [ ] Agent 执行失败时生成结构化错误 AgentOutput
- [ ] 明确失败策略: 重要 Agent (risk/governance/systems) 失败时中断流程
- [ ] 在 metadata 中记录失败详情

#### 任务 4: 并行化 Prompt 加载 (优先级: 高)
- [ ] 将 readFileSync 改为 fs.promises.readFile 或 Bun.file
- [ ] createAllAgents 使用 Promise.all 并行加载
- [ ] 测试启动性能提升

#### 任务 5: 文档改进 (优先级: 中)
- [ ] 泛化所有绝对路径为占位变量
- [ ] 增加"如何替换 simulateAICall 为真实 LLM"文档
- [ ] 添加完整 MCP RPC 请求/响应示例 (含错误)
- [ ] 更新 README: 添加平台注意事项 (Windows/Linux/Docker)

### 6.2 中期任务 (2-4 周)

#### 任务 6: 引入结构化日志 (优先级: 中)
- [ ] 选择 logger: pino 或 bun 自带日志方案
- [ ] 替换所有 console.* 为 logger.* (支持日志等级)
- [ ] 输出 JSON 格式,便于 APM/监控对接
- [ ] 添加 traceId、timings、error stack

#### 任务 7: 依赖安全扫描 (优先级: 中)
- [ ] 在 CI 中添加 `npm audit` 或 `bun audit`
- [ ] 集成 Snyk 或 GitHub Dependabot
- [ ] 评估 @modelcontextprotocol/sdk 传递依赖安全性
- [ ] 考虑是否可以替换/移除不必要的 transitive deps

#### 任务 8: 集成测试 (优先级: 中)
- [ ] 在 Bun 环境启动 MCP server
- [ ] 模拟 stdio transport 的工具注册/调用
- [ ] 验证 @modelcontextprotocol/sdk 在 Bun 的兼容性
- [ ] 若不兼容,决定走 Node 部署或适配

#### 任务 9: CI 改进 (优先级: 高)
- [ ] 串联 typecheck、tests、依赖扫描到 PR 流程
- [ ] 添加覆盖率报告 (c8/nyc)
- [ ] 设置最低覆盖率阈值 (建议 >80%)
- [ ] 自动化依赖更新提醒

### 6.3 长期任务 (1-3 个月)

#### 任务 10: 升级冲突检测 (优先级: 中)
- [ ] 从关键词匹配升级为语义检索 (向量化)
- [ ] 支持自定义 priorityMatrix (配置文件)
- [ ] 增加冲突去重/合并逻辑

#### 任务 11: 性能优化 (优先级: 中)
- [ ] 并发控制: 最大并发 N 个 AI 调用
- [ ] 缓存/复用输出 (输入相近时)
- [ ] 限制 history 长度或采样/摘要存储

#### 任务 12: 持久化与审计 (优先级: 低)
- [ ] 将 workflow history 存储到 sqlite (bun:sqlite)
- [ ] 添加审计日志 (每次 agent 调用、timestamp、traceId)
- [ ] 支持模型版本管理与回溯

#### 任务 13: 指标与监控 (优先级: 低)
- [ ] 埋点: 每次 agent latency/成功率/模型置信度
- [ ] 暴露 metrics endpoint (Prometheus)
- [ ] 集成 APM (Sentry/Datadog)

#### 任务 14: 可视化与交互 (优先级: 低)
- [ ] 提供交互式教程 (Notebook/Playground)
- [ ] 让非技术用户通过 UI 填表生成 hypothesis
- [ ] 模型可视化 (9 层结构树状图)

#### 任务 15: 扩展 Prompt 模板 (优先级: 低)
- [ ] 添加行业-focused templates (灾难响应、城市规划、DAO 设计)
- [ ] 支持用户自定义 prompt 集市
- [ ] 版本化 prompt 管理

---

## 七、经验教训与知识

### 7.1 架构设计经验
1. **模块化优于一体化**: 清晰的工厂/编排器/执行器职责分离,便于扩展和维护
2. **类型定义先行**: types.ts 作为单一真相来源,大幅减少类型错误
3. **Prompt 模板化**: Markdown 文件存储 prompt,便于非程序员编辑 Agent 行为
4. **并行执行是关键**: 7 个 Agent 的 Promise.all 并行,充分利用并发优势

### 7.2 技术选型教训
1. **Bun 的优势明显**: 启动快、内置 test runner,适合轻量工具与本地开发
2. **MCP SDK 依赖重**: @modelcontextprotocol/sdk 引入大量 Node 依赖,需评估 Bun 兼容性
3. **TypeScript peerDependency 风险**: 未添加 devDependency 导致 typecheck 无法运行,应强制 devDependency

### 7.3 测试与质量保证
1. **模拟优于真实调用**: simulateAICall 使测试稳定、快速,但生产集成需替换
2. **覆盖率不可忽视**: 当前测试通过,但缺少覆盖率报告,无法量化覆盖度
3. **异常路径测试不足**: 缺少故障注入测试 (超时、malformed output),验证容错性

### 7.4 文档与可维护性
1. **示例驱动文档**: README 提供可运行示例,大幅降低上手门槛
2. **MCP 集成文档关键**: docs/MCP_INTEGRATION.md 实用性强,需保持更新
3. **硬编码路径是大坑**: 绝对路径直接复制会失败,必须泛化

### 7.5 生产部署准备
1. **错误处理不能只记录**: 静默失败会导致不完整模型,需明确失败策略
2. **日志结构化是必需**: console.* 无法对接监控,生产环境需结构化 logger
3. **超时与限流必备**: 外部 AI 调用无保护会导致阻塞或成本失控

### 7.6 未来扩展方向
1. **语义理解**: 从关键词匹配到向量检索,提升冲突检测准确度
2. **可观测性**: traceId、metrics、audit log 是规模化部署的基础
3. **配置化**: priorityMatrix、riskKeywords 应外置,便于 A/B 测试与动态调整
4. **多模态输出**: 从纯 JSON 到可视化 (图表、树状图、时间线)

---

## 八、附录

### 8.1 项目文件统计
- **源码文件**: 15+ (src/**/*.ts)
- **测试文件**: 4 (src/__tests__/**/*.test.ts)
- **测试用例**: 17 (全部通过)
- **Agent Prompt**: 7 (src/agents/prompts/*.md)
- **文档文件**: 4 (README.md, docs/*.md)
- **示例文件**: 3 (examples/*)

### 8.2 类型定义完整性
| 类型 | 完整度 | 评价 |
|------|-------|------|
| Hypothesis | ✅ 完整 | 清晰定义 assumptions/constraints/goals |
| AgentOutput | ✅ 完整 | 结论/证据/风险/建议/可证伪点 |
| Conflict | ✅ 完整 | 3 种类型,severity 分级 |
| SocialSystemModel | ✅ 完整 | 包含所有必要字段 |
| SystemStructure | ✅ 完整 | 9 层结构,每层包含多个子项 |
| WorkflowState | ✅ 完整 | 状态管理完善 |
| AnalysisContext | ✅ 完整 | 上下文传递清晰 |
| AgentInstance | ⚠️ 部分 | outputSchema 未与 AgentOutput 强绑定 |

### 8.3 测试覆盖评估
- **已覆盖**:
  - 端到端流程 (e2e.test.ts)
  - 冲突检测 (conflict-resolver.test.ts)
  - 工作流编排 (orchestrator.test.ts)
  - Prompt 文件完整性 (example.test.ts)

- **未覆盖**:
  - 故障注入 (超时、malformed output)
  - 并发行为/竞态条件
  - MCP stdio transport 交互
  - 大型 payload/长 JSON 处理

### 8.4 依赖树摘要
```
@modelcontextprotocol/sdk (^1.25.3)
├── express (Node HTTP server)
├── zod (Schema validation)
├── jose (JWT)
├── ajv (JSON Schema validator)
├── body-parser
└── ... (30+ transitive dependencies)
```

**风险**: 大量传递依赖可能包含 Node-only API,在 Bun 下需验证兼容性

### 8.5 配置文件清单
- **package.json**: 依赖管理、scripts (install/test/typecheck)
- **tsconfig.json**: TypeScript 编译配置
- **bun.lock**: Bun 依赖锁定文件
- **.gitignore**: Git 忽略规则 (node_modules, .DS_Store 等)

### 8.6 MCP 工具注册清单
| 工具名 | 输入 Schema | 输出格式 | 状态 |
|-------|-----------|---------|------|
| reasoning | Hypothesis + maxIterations | SocialSystemModel (JSON) | ✅ 已实现 |
| query_agent | agentType + Hypothesis | AgentOutput (JSON) | ✅ 已实现 |
| validate_model | modelJson (string) | validation (JSON) | ✅ 已实现 |

---

## 九、总结

SocialGuessSkills 是一个设计良好、定位清晰的轻量级多 Agent 协作框架,具备以下优势:

**优势**:
- 架构清晰,模块化程度高,便于扩展和维护
- 类型定义集中 (types.ts),减少类型错误
- Prompt 模板规范化,便于非程序员编辑 Agent 行为
- 文档结构良好,示例覆盖广 (社区治理、政策影响、Agent 单点查询、模型验证)
- 工作流设计合理 (6 步流程,支持迭代收敛)
- 冲突检测机制完整 (逻辑/优先级/风险放大 3 种类型)

**主要短板**:
- TypeScript 开发环境缺失 (peerDependency 导致 typecheck 无法运行)
- 真实 LLM 集成文档薄弱 (simulateAICall 是模拟,未说明如何替换)
- MCP SDK 依赖兼容性需验证 (大量 Node 依赖,在 Bun 下可能不兼容)
- 错误处理与日志不足 (散式 console.* 调用,无结构化日志与监控)
- 文档路径使用绝对路径 (用户直接复制会报错)

**关键建议**:
1. 立即修复 TypeScript 开发环境 (添加 devDependency,修复 tsconfig)
2. 抽象 LLM 适配器,提供 Mock/Real 两种实现,支持生产部署
3. 在 Bun 环境进行 MCP SDK 集成测试,验证 stdio transport 兼容性
4. 改进错误处理,明确失败策略,增加超时/重试/限流
5. 引入结构化日志,替换散式 console.* 调用
6. 泛化文档路径,增加真实 LLM 替换示例与 MCP 请求响应样例

补齐上述关键改进后,项目可以从 demo/模拟模式平滑过渡到真实 AI 驱动的生产使用,为学术研究者、政策分析师、AI 集成者、社区组织者等用户提供强大的社会体系建模与推演能力。

---

**报告生成完成** - 2026-02-04
