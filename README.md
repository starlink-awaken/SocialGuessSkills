# 社会体系建模多Agent系统 (Social System Modeling Multi-Agent Framework)

## 简介

一个轻量级的多Agent协作框架,用于从基础假设推演出完整的社会体系模型。通过7个专业Agent(Systems/Econ/Socio/Governance/Culture/Risk/Validation)的协同分析,生成结构化、可验证的社会体系模型。

**核心特性**:
- 🔬 **7个专业Agent**: 覆盖系统思维、经济学、社会学、治理学、文化学、风险分析和验证
- 🔄 **6步工作流**: 假设验证→并行推演→冲突对齐→决策合成→证据校验→迭代收敛
- ⚡ **轻量级实现**: TypeScript + Bun,可被Claude/AI直接调用
- 🛠️ **MCP协议支持**: 标准Model Context Protocol,可与Claude Desktop无缝集成
- 📊 **结构化输出**: 9层架构模型(总体结构/工作流/制度/治理/文化/创新/风险/指标/优化)

## 快速开始

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd SocialGuessSkills

# 安装依赖
bun install
```

### 运行示例

```bash
# 运行端到端示例(社区治理模型)
bun run examples/run-example.ts
```

**预期输出**:
- 迭代次数: 2
- 置信度: 0.79
- Agent输出数量: 7(每个Agent都会生成分析)
- 冲突数量: 7(逻辑矛盾、优先级冲突、风险叠加)

### MCP集成(推荐)

**在Claude Desktop中配置**:

1. 编辑 `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "social-modeling": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/src/server.ts"]
    }
  }
}
```

2. 重启Claude Desktop

3. 在Claude中使用:
```
请帮我分析:1000人社区,资源有限,如何建立稳定合作的社会体系?
```

Claude会自动调用MCP Server,生成完整的社会体系模型。

**📖 详细集成指南**: 查看 [docs/MCP_INTEGRATION.md](docs/MCP_INTEGRATION.md) 了解：
- Claude Desktop完整配置步骤
- OpenCode CLI集成状态
- 故障排除指南
- 更多使用示例和Prompt模板

## 使用示例

### 1. 完整推演(reasoning tool)

**输入**:
```json
{
  "hypothesis": {
    "assumptions": [
      "1000人社区,资源有限(粮食、住房、工具)",
      "协作可提升总产出30%",
      "无外部干预,孤立环境"
    ],
    "constraints": [
      "通信成本:当面交流免费,间接传播有衰减",
      "信息不完全:个体只知道邻近50人的状态"
    ],
    "goals": [
      "保证所有人基本生存(食物、住所)",
      "建立可持续的资源生产与分配机制",
      "冲突解决机制可执行"
    ]
  },
  "maxIterations": 3
}
```

**输出**: 完整的社会体系模型,包含:
- 7个Agent的分析(结论/依据/风险/建议/可证伪点)
- 检测到的冲突(类型/描述/严重性/解决方案)
- 9层结构化模型(总体结构/工作流/制度/治理/文化/创新/风险/指标/优化)
- 元数据(迭代次数/置信度/生成时间)

### 2. 单Agent查询(query_agent tool)

**输入**:
```json
{
  "agentType": "risk",
  "hypothesis": {
    "assumptions": ["资源稀缺", "有限理性"],
    "constraints": [],
    "goals": ["稳定秩序"]
  }
}
```

**输出**: Risk Agent的专业分析,聚焦于脆弱性、极端情境和韧性策略。

### 3. 模型验证(validate_model tool)

**输入**:
```json
{
  "modelJson": "{...完整的模型JSON字符串...}"
}
```

**输出**: 验证结果,包含:
- isValid: 是否通过验证
- checks: 详细检查项(hasAllAgents, hasStructure, hasHypothesis等)
- issues: 发现的问题列表
- warnings: 警告信息(如冲突过多、置信度较低)

## 架构概览

```
┌─────────────────────────────────────────────────────┐
│                    用户输入假设                   │
│              (assumptions/constraints/goals)      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│           1. 假设验证 (Systems Agent)         │
│       - 检查结构完整性,识别关键变量           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│           2. 并行Agent推演 (7个Agent)         │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐ │
│   │Systems │ │  Econ  │ │ Socio  │ │Govern  │ │
│   │  Agent │ │  Agent │ │  Agent │ │  Agent │ │
│   └────────┘ └────────┘ └────────┘ └───────┘ │
│   ┌────────┐ ┌────────┐                        │
│   │Culture │ │  Risk  │                        │
│   │  Agent │ │  Agent │                        │
│   └────────┘ └────────┘                        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│           3. 冲突对齐 (Risk Agent主导)        │
│      - 检测逻辑矛盾、优先级冲突、风险叠加       │
│      - 标记需要重推的Agent                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│           4. 决策合成 (Governance Agent主导)   │
│    - 应用决策合成规则:分层加权、冲突优先级      │
│    - 提取9层结构化模型                          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│          5. 证据校验 (Validation Agent)        │
│       - 可证伪假设检验、历史案例对比、反事实推理  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│            6. 迭代收敛 (如有冲突,回到步骤2)     │
│          - 最大迭代次数: 3次(可配置)          │
│          - 终止条件: 无新冲突 或 达到最大迭代    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                    最终社会体系模型                 │
│   - Agent输出(7个)                            │
│   - 冲突列表                                   │
│   - 9层结构化模型                               │
│   - 元数据(迭代/置信度/时间)                      │
└─────────────────────────────────────────────────────┘
```

## API参考

### Tool 1: reasoning

完整推演流程,从假设到完整模型。

**输入**:
```json
{
  "hypothesis": {
    "assumptions": ["假设1", "假设2"],
    "constraints": ["约束1", "约束2"],
    "goals": ["目标1", "目标2"]
  },
  "maxIterations": 3
}
```

**输出**:
```json
{
  "hypothesis": {...},
  "agentOutputs": [...],
  "conflicts": [...],
  "structure": {
    "overall": {...},
    "workflow": {...},
    "institutions": {...},
    "governance": {...},
    "culture": {...},
    "innovation": {...},
    "risks": {...},
    "metrics": {...},
    "optimization": {...}
  },
  "metadata": {
    "iterations": 2,
    "confidence": 0.79,
    "generatedAt": "2026-02-03T14:30:00Z"
  }
}
```

### Tool 2: query_agent

单独查询某个Agent的分析。

**输入**:
```json
{
  "agentType": "systems|econ|socio|governance|culture|risk|validation",
  "hypothesis": {...}
}
```

**输出**: 单个Agent的完整分析(结论/依据/风险/建议/可证伪点)

### Tool 3: validate_model

验证已有模型的一致性。

**输入**:
```json
{
  "modelJson": "{...模型JSON字符串...}"
}
```

**输出**:
```json
{
  "isValid": true,
  "checks": {
    "hasAllAgents": true,
    "hasStructure": true,
    "hasHypothesis": true,
    "hasMetadata": true,
    "agentTypesAreValid": true
  },
  "issues": [],
  "warnings": []
}
```

## 扩展指南

### 自定义Agent Prompt

1. 编辑 `src/agents/prompts/{agent}-agent.md`
2. 遵循统一格式:
   - `## 角色定义`
   - `## 核心职责`
   - `## 分析框架`
   - `## 输出格式` (CRITICAL)
   - `## 关键约束`

3. 修改后无需重启,AI会自动加载最新Prompt

### 添加新的Agent类型

1. 在 `src/types.ts` 中添加新的AgentType
2. 创建 `src/agents/prompts/{new-agent}-agent.md`
3. 在 `src/agents/agent-factory.ts` 的`createAllAgents()`中注册
4. 添加对应的测试用例

### 自定义冲突检测规则

在 `src/workflow/conflict-resolver.ts` 中添加新的检测函数:

```typescript
function detectCustomConflict(outputs: AgentOutput[]): Conflict[] {
  const conflicts: Conflict[] = [];
  // 你的检测逻辑
  return conflicts;
}
```

然后在`detectConflicts()`中调用新函数。

## 项目结构

```
SocialGuessSkills/
├── src/
│   ├── agents/
│   │   ├── prompts/           # 7个Agent的Prompt模板
│   │   ├── agent-factory.ts    # Agent工厂
│   │   └── agent-executor.ts   # Agent执行器
│   ├── workflow/
│   │   ├── orchestrator.ts      # 工作流编排器
│   │   └── conflict-resolver.ts # 冲突检测
│   ├── types.ts               # 核心类型定义
│   ├── server.ts              # MCP Server入口
│   └── __tests__/            # 测试用例
├── examples/
│   ├── community-governance.json  # 示例输入
│   └── run-example.ts           # 示例执行脚本
├── package.json
├── tsconfig.json
└── README.md
```

## 测试

运行所有测试:

```bash
bun test
```

测试覆盖:
- Agent Prompt文件完整性
- Agent工厂与执行
- 冲突检测(3种规则)
- 工作流编排器(6步流程)
- 端到端示例
- 执行时间基准(<60秒)

## 贡献

欢迎贡献!请遵循:

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

**提交规范**:
- `feat:` 新功能
- `fix:` Bug修复
- `docs:` 文档更新
- `refactor:` 代码重构
- `test:` 测试相关

## 许可证

MIT

## 联系方式

- 问题反馈: GitHub Issues
- 讨论交流: GitHub Discussions
