# SocialGuessSkills > src > agents

## OVERVIEW
模块职责: 管理7个专业Agent的生命周期

关键功能:
- 加载Prompt模板 - 从文件系统读取Markdown格式的Agent配置
- 创建Agent实例 - 根据AgentType实例化7个专业Agent
- 执行AI推理 - 运行单个Agent的推理过程
- 格式化输出 - 确保所有Agent返回统一的AgentOutput结构

设计理念:
- Prompt-based Agent架构 - 使用预定义的Prompt模板而非训练独立AI模型
- 灵活性 - Prompt易于调整和更新,无需重新训练
- 可解释性 - 每个Agent的推理过程可通过Prompt追溯
- 轻量级 - 无需部署独立的AI服务,降低复杂度

## STRUCTURE
```
src/agents/
├── agent-factory.ts      # Agent工厂,批量创建7个Agent
├── agent-executor.ts    # Agent执行器,运行单个Agent推理
├── llm-client.ts        # LLM客户端集成(未来版本将接入真实API)
├── simulate-ai-call.ts  # AI调用模拟(首版,生产环境可替换)
└── prompts/             # Prompt模板目录
    ├── AGENTS.md        # 统一的Agent配置和注册表
    └── *.md            # 7个Agent专用Prompt
        ├── systems-agent.md      # 系统思维Agent
        ├── econ-agent.md          # 经济学Agent
        ├── socio-agent.md         # 社会学Agent
        ├── governance-agent.md     # 治理学Agent
        ├── culture-agent.md        # 文化学Agent
        ├── risk-agent.md          # 风险分析Agent
        └── validation-agent.md    # 验证Agent
```

## WHERE TO LOOK

| 任务 | 文件 | 函数/说明 |
|------|------|------------|
| 创建所有7个Agent | agent-factory.ts | `createAllAgents()` - 批量Agent创建入口 |
| 加载单个Prompt | agent-factory.ts | `loadPrompt(agentType)` - 从文件系统读取模板 |
| 创建单个Agent | agent-factory.ts | `createAgent(agentType)` - 创建Agent实例 |
| 执行单个Agent推理 | agent-executor.ts | `executeAgent(agent, context)` - Agent执行核心函数 |
| 构建Agent上下文 | agent-executor.ts | `buildContext(...)` - 格式化输入为Prompt |
| 模拟AI响应 | agent-executor.ts | `simulateAICall(...)` / simulate-ai-call.ts | 首版模拟输出 |
| 真实AI集成 | llm-client.ts | 未来版本接入真实API(OpenAI/Claude) |
| 7个Agent配置 | prompts/AGENTS.md | 统一Agent注册表,定义Agent元数据 |
| 专用Prompt模板 | prompts/{agent-name}-agent.md | 每个Agent的推理框架和输出要求 |

## CONVENTIONS
- **Agent输出格式**: 必须返回 `{conclusion, evidence[], risks[], suggestions[], falsifiable}`
- **Prompt加载**: 使用 `fs.readFileSync` 从 `src/agents/prompts/` 读取
- **Agent实例**: 必须包含 `{name, systemPrompt, outputSchema}` 属性
- **7个Agent类型**:
  - Systems - 系统思维、反馈回路、边界、变量、正负反馈、稳定性
  - Econ - 经济学、激励机制、激励相容、产权、交易成本、博弈论
  - Socio - 社会学、群体行为、规范、认同、信任、制度化
  - Governance - 治理学、权力结构、权责对称、合法性、执行力、分层治理
  - Culture - 文化学、价值观、仪式、叙事、符号、文化演化
  - Risk - 风险分析、韧性、脆弱性、极端情境、缓冲、冗余
  - Validation - 科学验证、可证伪性、可证伪假设、历史对比、反事实推理

## ANTI-PATTERNS
- 不要在Prompt中硬编码具体数据(使用占位符或参数)
- 不要跳过输出格式验证(确保符合AgentOutput schema)
- 不要直接修改Agent实例的systemPrompt(应通过createAgent接口)
- 不要忽略错误处理(Agent执行失败应记录错误,继续其他Agent)
