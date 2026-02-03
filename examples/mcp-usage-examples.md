# MCP Usage Examples

This document provides practical examples of how to use the Social System Modeling MCP tools. These examples demonstrate how to interact with the system using natural language and the underlying JSON-RPC structure.

---

## Example 1: Complete Social System Analysis
**Scenario**: 分析一个新社区的治理设计。适用于从零开始构建一个社会体系，或对现有体系进行根本性的重设计。

**User Prompt**:
"请帮我分析一个1,000人的新社区治理方案。资源非常有限（粮食和住房仅够维持基本生存），目标是在30天内建立起稳定的社会秩序。我们需要确保所有人都能生存，同时建立一套可持续的资源生产和分配机制。请考虑个体能力的差异，并允许适度的不平等（基尼系数控制在0.4以下）。"

**MCP Tool Call**:
```json
{
  "name": "reasoning",
  "arguments": {
    "hypothesis": {
      "assumptions": [
        "1000人社区,资源有限(粮食、住房、工具)",
        "个体能力差异大(技能、体力、智力)",
        "协作可提升总产出30%",
        "无外部干预,孤立环境"
      ],
      "constraints": [
        "时间压力:必须在30天内建立稳定秩序",
        "通信成本:信息在传播过程中有衰减",
        "信息不完全:个体只知道邻近50人的状态"
      ],
      "goals": [
        "保证所有人基本生存(食物、住所)",
        "建立可持续的资源生产与分配机制",
        "建立可执行的冲突解决机制",
        "容忍一定不平等(基尼系数<0.4)"
      ]
    },
    "maxIterations": 3
  }
}
```

**Result**:
```json
{
  "hypothesis": { ... },
  "agentOutputs": [
    {
      "agentType": "systems",
      "conclusion": "社区应建立分层的资源分配和信息反馈网络...",
      "evidence": ["梅特卡夫定律的应用", "资源流动的反馈回路分析"],
      "risks": ["信息衰减导致的决策延迟", "局部资源短缺触发的连锁反应"],
      "suggestions": ["建立50人小组为单位的基础治理单元"],
      "falsifiable": "若30天内资源分配效率下降超过15%,则模型失效"
    },
    ... // 其他6个Agent的输出
  ],
  "conflicts": [
    {
      "type": "priority",
      "involvedAgents": ["econ", "socio"],
      "description": "经济效率提升与社会公平目标的潜在冲突",
      "severity": "medium",
      "resolutionStrategy": "通过动态税收机制平衡产出激励与生存保障"
    }
  ],
  "structure": {
    "overall": { "resourceLayer": ["配给制", "劳动换积分"], ... },
    "governance": { "layeredGovernance": ["小组制", "长老会"], ... },
    ...
  },
  "metadata": {
    "iterations": 2,
    "confidence": 0.85,
    "generatedAt": "2026-02-04T10:00:00Z"
  }
}
```

---

## Example 2: Quick Agent Consultation
**Scenario**: 针对特定维度（如风险、文化或经济）进行快速咨询。

**User Prompt**:
"针对上述1,000人社区的设定，如果我们要实施高度集权的配给制，从社会学（socio）的角度看，主要的风险点在哪里？"

**MCP Tool Call**:
```json
{
  "name": "query_agent",
  "arguments": {
    "agentType": "socio",
    "hypothesis": {
      "assumptions": ["实施高度集权的配给制", "资源稀缺"],
      "constraints": ["信息不完全"],
      "goals": ["维持稳定"]
    }
  }
}
```

**Result**:
```json
{
  "agentType": "socio",
  "conclusion": "长期集权配给会导致非正式权力的滋生和信任资本的枯竭...",
  "evidence": ["权力距离指数分析", "地下市场的社会学动力学"],
  "risks": ["腐败", "社会流动性停滞", "心理抵抗"],
  "suggestions": ["引入透明的监督机制", "保留小额的个人物品交易自由"],
  "falsifiable": "若基尼系数在30天内意外激增至0.5以上，表明非正式配给网络已取代官方系统"
}
```

---

## Example 3: Model Validation
**Scenario**: 验证一个已有的模型JSON是否在逻辑上自洽。

**User Prompt**:
"请验证一下这个模型。它是我刚才根据'200人探险队'场景生成的，我想确认它是否包含所有必要的Agent分析且冲突是否已解决。"

**MCP Tool Call**:
```json
{
  "name": "validate_model",
  "arguments": {
    "modelJson": "{\"hypothesis\":{\"assumptions\":[\"200人\"],...},\"agentOutputs\":[...],\"conflicts\":[]}"
  }
}
```

**Result**:
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
  "warnings": [
    "虽然isValid为true，但建议补充culture Agent的深度分析，目前结论较为单薄。"
  ]
}
```

---

## Example 4: Policy Impact Analysis
**Scenario**: 分析一项新政策对现有社会体系的影响。

**User Prompt**:
"假设我们现在的社区已经运行稳定，现在计划引入'通用劳动券'制度。请使用系统推演工具分析这一变化对经济激励和社会凝聚力的影响。"

**MCP Tool Call**:
```json
{
  "name": "reasoning",
  "arguments": {
    "hypothesis": {
      "assumptions": [
        "现有系统稳定",
        "引入新政策：通用劳动券（可兑换额外非生存物资）",
        "劳动券获取与公共服务时长挂钩"
      ],
      "constraints": [
        "总量限制",
        "禁止私下交易（虽然难以完全禁止）"
      ],
      "goals": [
        "提升公共服务参与度",
        "不损害基础生存物资的分配"
      ]
    },
    "maxIterations": 2
  }
}
```

**Result**:
```json
{
  "agentOutputs": [
    {
      "agentType": "econ",
      "conclusion": "劳动券将显著提升非生产性劳动的边际产出...",
      ...
    },
    {
      "agentType": "culture",
      "conclusion": "通过劳动券建立的荣誉体系将重塑社区的价值观...",
      ...
    }
  ],
  "conflicts": [
    {
      "type": "logical",
      "involvedAgents": ["econ", "risk"],
      "description": "奖励机制可能诱发过度劳动或数据造假风险",
      ...
    }
  ],
  "structure": { ... }
}
```

---

## Prompt Templates

### Template 1: Community Governance Design
此模板用于设计一个全新的社区。
```markdown
请使用 reasoning 工具分析以下场景：
**背景假设**：[描述人口、资源、环境，例如：500人火星殖民地，氧气有限]
**约束条件**：[列出物理、技术或时间约束，例如：通信延迟10分钟]
**核心目标**：[列出首要任务，例如：3个月内实现呼吸循环自给]
**迭代次数**：3
```

### Template 2: Policy Impact Assessment
此模板用于评估具体政策的变化。
```markdown
请针对以下社会模型执行推理分析：
**当前状态**：[简述现状，或提供已有模型片段]
**政策变量**：[描述要引入的变化，例如：征收30%的资源浪费税]
**关注重点**：[指定Agent，例如：请重点关注 econ 和 socio Agent 的反馈]
**分析要求**：识别所有可能的二级效应和潜在冲突。
```

### Template 3: Organization Redesign
此模板用于组织架构或DAO的重新设计。
```markdown
请根据以下输入建立一个稳健的社会/组织模型：
**组织规模**：[例如：50人核心团队，2000人贡献者网络]
**激励机制**：[描述当前的激励方式]
**存在问题**：[描述需要解决的痛点，例如：决策缓慢，贡献者流失]
**设计目标**：[例如：提高提案通过率，确保长期参与动力]
```
