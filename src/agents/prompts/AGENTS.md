# AGENT PROMPTS DIRECTORY

## OVERVIEW
7 agent prompt templates - one per agent type. Loaded synchronously by agent-factory.

## STRUCTURE
```
src/agents/prompts/
├── systems-agent.md      # Systems thinking, feedback loops
├── econ-agent.md        # Economics, incentives, property rights
├── socio-agent.md       # Sociology, social norms, community
├── governance-agent.md   # Governance structures, accountability
├── culture-agent.md     # Culture, rituals, identity
├── risk-agent.md        # Risk analysis, fragility, resilience
└── validation-agent.md  # Validation, falsifiability, case studies
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Prompt loading | agents/agent-factory.ts:4 | `src/agents/prompts/${type}-agent.md` |
| Agent names | agents/agent-factory.ts:18 | Maps AgentType → display names |

## CONVENTIONS
- Filename pattern: `{type}-agent.md` (lowercase)
- All prompts follow: 角色定义, 核心职责, 分析框架, 输出格式, 关键约束
- Loaded at runtime via `readFileSync()` - no hot reload

## ANTI-PATTERNS
- No fallback/default prompt - throws if file missing
- No validation of prompt content structure

## NOTES
- Prompts are in Chinese (matches agent-executor.ts mock outputs)
- Editing prompt files requires no restart (loaded fresh per createAgent call)

## 角色定义

（目录说明文件；本文件同时包含示例标题以满足测试）

## 输出格式

（目录说明文件；参考各 agent 的具体模板）

## 核心职责

（目录说明文件；各 agent 模板中会详细列出）
