# TEST DIRECTORY

## OVERVIEW
Bun test framework (no external deps). Tests in `*.test.ts` pattern.

## STRUCTURE
```
src/__tests__/
├── workflow.test.ts     # Workflow orchestration tests
├── agents.test.ts       # Agent factory/executor tests
└── conflicts.test.ts    # Conflict detection tests
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Test execution | package.json:17 | `bun test src/__tests__/` |
| Test imports | All test files | Use `{ test, expect } from "bun:test"` |

## CONVENTIONS
- Test pattern: `*.test.ts`
- Framework: Bun's built-in test (not jest/vitest)
- Run all: `bun test src/__tests__/`

## ANTI-PATTERNS
- No test utilities/fixtures directory
- No test config files
