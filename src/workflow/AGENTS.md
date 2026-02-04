# WORKFLOW DIRECTORY

## OVERVIEW
6-step workflow orchestration: hypothesis validation → parallel agent execution → conflict alignment → model synthesis → validation.

## STRUCTURE
```
workflow/
├── orchestrator.ts      # Main workflow loop (298 lines)
└── conflict-resolver.ts # 3 conflict detection rules (206 lines)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Workflow entry | orchestrator.ts:14 | runWorkflow() - returns SocialSystemModel |
| Step 1: Validation | orchestrator.ts:51 | Checks assumptions/goals non-empty |
| Step 2: Agent execution | orchestrator.ts:68 | Parallel Promise.all() for 7 agents |
| Step 3: Conflict alignment | orchestrator.ts:100 | Logs conflicts, saves snapshot |
| Step 4: Model synthesis | orchestrator.ts:121 | Extracts 9-layer structure via keyword matching |
| Step 5: Model validation | orchestrator.ts:149 | Checks validation agent presence |
| Conflict detection | conflict-resolver.ts:3 | 3 rule types applied sequentially |
| Logical conflicts | conflict-resolver.ts:13 | Keyword overlap in falsifiable fields |
| Priority conflicts | conflict-resolver.ts:58 | Similar suggestions, resource contention |
| Risk amplification | conflict-resolver.ts:121 | Avg risk > 3, 3+ agents with "崩溃" |

## CONVENTIONS
- Max iterations: 3 (configurable via options.maxIterations)
- WorkflowState tracks: currentStep, iteration, agentResults (Map), conflicts, history
- Confidence formula: `(agentRatio * 0.7) + (conflictRatio * 0.3)`
- Agent priority for conflicts: Risk(5) > Governance(4) > Systems(3) > Econ/Socio/Culture(2) > Validation(1)

## UNIQUE STYLES
- Structure synthesis uses keyword matching on suggestions (extractFromOutputs)
- Keyword lists hardcoded per section (e.g., ["资源", "材料", "工具"] for resourceLayer)
- Falls back to first suggestion if no matches found

## ANTI-PATTERNS
- No real convergence detection - always runs maxIterations
- No early termination even with 0 conflicts
