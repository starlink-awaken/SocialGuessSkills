# AGENTS MODULE

## OVERVIEW
7 专业 Agent 工厂与执行器。基于 Prompt 驱动架构，支持 mock/真实 LLM 双模式。

## STRUCTURE
```
src/agents/
├── agent-factory.ts      # 工厂：批量创建7个Agent
├── agent-executor.ts     # 执行器：运行Agent推理（支持Anthropic/Mock双模式）
├── llm-client.ts         # Anthropic SDK 客户端封装
└── prompts/
    ├── AGENTS.md         # Prompt目录说明
    └── *-agent.md        # 7个Agent的Prompt模板（中文）
```

## WHERE TO LOOK
| 任务 | 位置 | 关键函数/说明 |
|------|------|---------------|
| 创建所有Agent | agent-factory.ts:43 | `createAllAgents()` - 返回 Map<AgentType, AgentInstance> |
| 加载单个Prompt | agent-factory.ts:5 | `loadPrompt(type)` - 同步读取 prompts/${type}-agent.md |
| 单Agent实例化 | agent-factory.ts:16 | `createAgent(type)` - 构造 AgentInstance 对象 |
| 执行Agent推理 | agent-executor.ts:22 | `executeAgent(agent, context)` - 主入口 |
| 上下文构建 | agent-executor.ts:28-58 | 拼接假设/冲突/其他Agent输出 |
| 模式切换逻辑 | agent-executor.ts:68-98 | `shouldUseMock()` / `canUseAnthropic()` |
| 输出解析 | agent-executor.ts:161-179 | `parseAgentOutput()` - 提取5个字段 |
| Mock输出 | agent-executor.ts:216-342 | 7个Agent的硬编码中文输出 |
| Anthropic调用 | llm-client.ts:47 | `callAnthropic(prompt, options)` - 真实API |

## CONVENTIONS

### Agent 输出格式
所有 Agent 必须返回统一结构：
```typescript
{
  agentType: AgentType,
  conclusion: string,        // 核心结论（单行）
  evidence: string[],        // 支持依据（列表）
  risks: string[],           // 风险点（列表）
  suggestions: string[],     // 建议（列表）
  falsifiable: string        // 可证伪假设（单行）
}
```

### 执行模式
- **Mock 模式**：
  - 触发条件：`AGENT_MOCK_MODE=1` 或 无 `ANTHROPIC_API_KEY`
  - 延迟：100-600ms 随机
  - 输出：agent-executor.ts 第216-342行硬编码数据
- **Anthropic 模式**：
  - 触发条件：有效 API Key
  - 重试机制：最多3次，指数退避（1s→30s）
  - 解析：提取中文标题（结论/依据/风险/建议/可证伪点）

### Prompt 加载
- 路径模式：`src/agents/prompts/${agentType}-agent.md`
- 加载时机：调用 `createAgent()` 时同步读取
- 无缓存：每次创建都重新读取（支持热更新）

### 7 个 Agent 类型
| AgentType | 中文名 | 分析领域 |
|-----------|--------|----------|
| systems | Systems Agent | 反馈回路/边界/系统稳定性 |
| econ | Econ Agent | 激励相容/产权/交易成本 |
| socio | Socio Agent | 群体行为/认同/信任 |
| governance | Governance Agent | 权力结构/权责对称/执行力 |
| culture | Culture Agent | 价值观/仪式/符号/叙事 |
| risk | Risk Agent | 韧性/脆弱性/极端情境 |
| validation | Validation Agent | 可证伪性/历史对比 |

## ANTI-PATTERNS
- **❌ 直接修改 systemPrompt**：应通过重新创建 Agent 或编辑 .md 文件
- **❌ 跳过输出验证**：必须检查返回对象是否包含5个必需字段
- **❌ 假设 API 永远可用**：需处理 `forceMock` 自动降级
- **❌ 忽略解析失败**：Mock 模式下硬编码输出，Anthropic 模式下需解析中文标题

## UNIQUE STYLES

### 双模式切换机制
```typescript
// 优先级：forceMock > AGENT_MOCK_MODE > ANTHROPIC_API_KEY
if (forceMock) return false;                // 手动强制Mock
if (AGENT_MOCK_MODE == "1") return false;   // 环境变量
if (!ANTHROPIC_API_KEY) return false;       // 无密钥自动降级
return true;                                 // 尝试真实API
```

### 上下文拼接策略
- **首次执行**（Systems Agent）：仅假设输入
- **后续 Agent**：假设 + 已有冲突 + 其他 Agent 的结论/可证伪点
- **冲突标注**：`[${type}] ${description} (涉及: ${agents})`

### 输出解析（Anthropic 模式）
使用正则提取中文标题：
```typescript
/^\*{0,2}(结论|依据|风险|建议|可证伪点)\*{0,2}\s*[:：]?\s*(.*)$/
```
- 支持无加粗/单星/双星标题格式
- 列表项自动清理：去除 `-`/`*`/`•`/`1.`/`(1)` 等前缀

## NOTES
- **Agent 名称硬编码**：agent-factory.ts:19-26 的 `agentNames` 对象
- **Anthropic 模型**：默认 `claude-3-5-sonnet-20241022`
- **API Key 验证**：首次调用时 ping 测试（2秒超时，8 token）
- **错误降级**：若 API Key 无效，自动设置 `forceMock=true` 避免重复尝试
- **中文输出**：Mock 数据和 Prompt 模板均为中文，适配中文场景分析
- **无单测覆盖**：Mock 输出未集成到测试，仅在运行时验证
