# SOURCE CODE DIRECTORY

## OVERVIEW
Core application logic: types, MCP server, agent factory/executor, workflow orchestration.

## STRUCTURE
```
src/
├── types.ts               # All TypeScript interfaces (136 lines)
├── server.ts              # MCP server entry (3 tools)
├── agents/
│   ├── agent-factory.ts   # Create 7 agents from prompt files
│   └── agent-executor.ts  # Execute agents with context
├── workflow/
│   ├── orchestrator.ts     # 6-step workflow main loop
│   └── conflict-resolver.ts # 3 conflict detection rules
└── __tests__/            # Bun test files (see subdir)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Type definitions | types.ts | AgentType enum, all interfaces |
| MCP tool registration | server.ts:41-83 | reasoning, query_agent, validate_model |
| Agent creation | agents/agent-factory.ts:42 | createAllAgents() returns Map<AgentType, AgentInstance> |
| Prompt loading | agents/agent-factory.ts:4 | Reads from `src/agents/prompts/${type}-agent.md` |
| AI simulation | agents/agent-executor.ts:49 | Mock outputs with hardcoded data |
| Workflow entry | workflow/orchestrator.ts:14 | runWorkflow() orchestrates 6 steps |
| Conflict detection | workflow/conflict-resolver.ts:3 | 3 functions: detectLogicalConflicts, detectPriorityConflicts, detectRiskAmplification |

## CONVENTIONS
- Import prompts synchronously via `readFileSync()`
- Agents use Map<AgentType, AgentInstance> for storage
- Mock AI calls return static AgentOutput objects (see agent-executor.ts:55-182)
- Use `.js` extension for ES module imports

## ANTI-PATTERNS
- No real LLM integration - all agent outputs are hardcoded in simulateAICall()
