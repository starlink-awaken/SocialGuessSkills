# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-04
**Commit:** (unknown)
**Branch:** (unknown)

## OVERVIEW
Multi-agent social system modeling framework. 7 specialized agents analyze hypotheses → generate 9-layer structured models via 6-step workflow.

## STRUCTURE
```
SocialGuessSkills/
├── src/
│   ├── agents/           # Agent factory + executor
│   ├── agents/prompts/    # 7 agent prompt templates
│   ├── workflow/          # Orchestrator + conflict resolver
│   └── __tests__/        # Bun test files
├── examples/             # Demo inputs + runner
├── package.json          # Bun runtime, MCP SDK
├── CLAUDE.md            # Bun conventions (use bun install/test/run)
└── tsconfig.json         # Strict TypeScript
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Core types | src/types.ts | 136 lines, all interfaces |
| MCP entry | src/server.ts | 3 tools: reasoning, query_agent, validate_model |
| Workflow logic | src/workflow/orchestrator.ts | 6-step process, 298 lines |
| Conflict detection | src/workflow/conflict-resolver.ts | 3 rule types (logical/priority/risk_amplification) |
| Agent prompts | src/agents/prompts/*.md | One per agent type |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| AgentType | enum | src/types.ts:1 | 10+ | 7 agent types (systems/econ/socio/governance/culture/risk/validation) |
| Hypothesis | interface | src/types.ts:3 | 5+ | Input assumptions/constraints/goals |
| SocialSystemModel | interface | src/types.ts:26 | 3+ | Final output structure |
| SystemStructure | interface | src/types.ts:38 | 2+ | 9-layer model architecture |
| runWorkflow | function | src/workflow/orchestrator.ts:14 | 2+ | Main entry point |
| executeAgent | function | src/agents/agent-executor.ts:3 | 2+ | AI simulation (no real LLM calls) |
| detectConflicts | function | src/workflow/conflict-resolver.ts:3 | 2+ | 3 conflict detection rules |

## CONVENTIONS

### Bun Runtime (Per CLAUDE.md)
- `bun install` not npm/yarn/pnpm
- `bun run src/server.ts` not node
- `bun test src/__tests__/` not jest/vitest
- `bun:sqlite` not better-sqlite3
- `Bun.serve()` not express

### TypeScript
- Strict mode enabled (tsconfig.json)
- Target: ESNext
- JSX: react-jsx
- Module: Preserve

### Agent Output Schema
All agents must return: `{ conclusion, evidence[], risks[], suggestions[], falsifiable }`

### File Imports
- Use `.js` extension for imports (ESM module)
- Read prompts via `readFileSync` from `src/agents/prompts/`

## ANTI-PATTERNS (THIS PROJECT)
- **No real LLM integration** - `simulateAICall()` returns mock data (17 hardcoded outputs)
- **Missing code standards comments** - No DO NOT/NEVER/ALWAYS comments in codebase
- **No code formatting tools** - No eslint/prettier config (tsconfig.json only)
- **Excessive `any` type usage** - 17 occurrences across 5 files (primarily server.ts)
- **Direct console API usage** - 9 instances of console.log/warn/error (violates Pino logging standards)
- **Hardcoded timing delays** - 8 setTimeout/setInterval calls for mock delays (100-600ms)
- **Hardcoded API endpoints** - API URL hardcoded in config/llm.ts (`https://open.bigmodel.cn/api/paas/v4`)

## UNIQUE STYLES
- Agent execution is simulated with 100-600ms delays + hardcoded outputs
- Conflict detection uses keyword matching on `falsifiable` fields
- Priority matrix: Risk(5) > Governance(4) > Systems(3) > Econ/Socio/Culture(2) > Validation(1)
- Confidence formula: `(agentRatio * 0.7) + (conflictRatio * 0.3)`

## COMMANDS
```bash
# Start MCP server
bun run src/server.ts

# Run tests
bun test src/__tests__/

# Type check
bun run typecheck

# Run example
bun run examples/run-example.ts
```

## NOTES
- package.json `"module": "index.ts"` is misleading - actual entry is `src/server.ts`
- AI calls are mocked - no real inference (simulateAICall returns static outputs)
- MCP tools registered via `(mcpServer as any).registerTool()` (SDK quirk)
- No `.github/workflows` or CI/CD configured
