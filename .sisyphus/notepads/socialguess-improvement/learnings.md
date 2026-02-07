# Learnings - SocialGuessSkills Improvement Plan

Created: 2026-02-07T06:15:10.692Z
Plan: socialguess-improvement

## Phase 1: P0 Critical Fixes

### Task 1: Conflict Detection Regex Bug
- **Location**: `src/workflow/conflict-resolver.ts:29`
- **Bug**: `keywords.join("|")` searches for literal string "keyword1|keyword2"
- **Fix**: Use `keywords.some(kw => text.includes(kw))`
- **Files to modify**: `src/workflow/conflict-resolver.ts`
- **Tests to create**: `src/__tests__/conflict-resolver.test.ts`

### Task 2: Workflow Convergence Detection
- **Location**: `src/workflow/orchestrator.ts:140`
- **Requirement**: Detect when agent outputs stabilize and stop early
- **Implementation**: Check if consecutive iterations have < 10% difference
- **Config options**: `maxIterations` (default 3), `convergenceThreshold` (default 0.9)
- **Files to modify**: `src/workflow/orchestrator.ts`, `src/types.ts`
- **Tests to extend**: `src/__tests__/orchestrator.test.ts`

## Conventions Discovered

### Project Structure
- Runtime: Bun (NOT Node.js)
- Testing: Bun native test (`bun test`)
- MCP Server: `src/server.ts` (3 tools: reasoning, query_agent, validate_model)
- Agent outputs: Must preserve schema `{conclusion, evidence, risks, suggestions, falsifiable}`

### Code Patterns
- Mock AI calls: `simulateAICall()` returns hardcoded Chinese output
- Conflict detection: Uses keyword matching on `falsifiable` field
- Workflow: 6-step process with configurable maxIterations
- File imports: Use `.js` extension for ESM modules

### Testing Patterns
- Unit tests: `src/__tests__/*.test.ts`
- Mock data: Use `AgentOutput` interface from `src/types.ts`
- Async testing: Use `test("...", async () => {...})` pattern

### Git Commit Convention
- Format: `type(scope): description`
  - `fix(workflow): ...` for bug fixes
  - `feat(workflow): ...` for new features
  - `test(...): ...` for test changes
  - `chore(...): ...` for configuration

### Workflow Convergence Implementation
- Convergence now uses average similarity across agent falsifiable strings.
- Similarity uses token overlap; empty strings return 0 to avoid false convergence.
- `convergenceThreshold` is clamped to [0, 1] and validated alongside `maxIterations`.

## P0 Bug Fix: Conflict Detection Regex (Completed 2026-02-07)

### Issue Fixed
- **File**: `src/workflow/conflict-resolver.ts:43`
- **Original Bug**: Used `keywords.join("|")` which searches for literal string with pipe characters (e.g., "反馈|回路|稳定")
- **Correct Behavior**: Should match individual keywords within text

### Solution Implemented
```typescript
// BEFORE (WRONG):
const hasConflict = falsifiableB.toLowerCase().includes(keywordsA.join("|")) ||
                  falsifiableA.toLowerCase().includes(keywordsB.join("|"));

// AFTER (CORRECT):
const hasConflict = keywordsA.some(kw => 
  falsifiableB.toLowerCase().includes(kw.toLowerCase())
) || keywordsB.some(kw => 
  falsifiableA.toLowerCase().includes(kw.toLowerCase())
);
```

### Test Coverage Added
Added 8 comprehensive test cases in `src/__tests__/conflict-resolver.test.ts`:
1. Single keyword match detection
2. Multiple keywords (one matches)
3. Multiple keywords (none match)
4. Case-insensitive matching
5. Empty keyword list handling
6. Empty falsifiable string handling
7. Bidirectional conflict detection
8. Regression test for existing functionality

### Verification Completed
- ✅ All 12 tests pass in `conflict-resolver.test.ts`
- ✅ All 9 tests pass in `orchestrator.test.ts` (no regression)
- ✅ TypeScript compilation clean (`bun run typecheck`)
- ✅ LSP diagnostics clean
- ✅ Commit created: `fix(workflow): Use keywords.some() for conflict detection instead of join("|")`

### Key Learnings
1. **Array.some() pattern**: Best practice for checking if ANY element in array satisfies condition
2. **Case-insensitive matching**: Always use `.toLowerCase()` on both keyword and text
3. **Empty array handling**: `[].some()` correctly returns `false` (no edge case handling needed)
4. **Test-driven fixes**: Writing comprehensive tests BEFORE fixing ensures complete coverage
5. **Bidirectional checks**: Conflict detection requires checking both directions (A->B and B->A)

## P0 Task 2: Workflow Convergence Detection (Completed 2026-02-07)

### Issue Fixed
- **File**: `src/workflow/orchestrator.ts` (lines 49-78)
- **Previous State**: Convergence detection was implemented but incomplete
- **Missing Features**: 
  - No tracking of `convergedAtIteration` in metadata
  - No tracking of `finalSimilarity` in metadata
  - Missing comprehensive test coverage for edge cases

### Solution Implemented
Enhanced existing convergence detection with proper metadata tracking:

```typescript
// Added metadata tracking
let convergedAtIteration: number | undefined = undefined;
let finalSimilarity: number | undefined = undefined;

// Capture convergence info on early termination
if (similarity >= convergenceThreshold) {
  convergedAtIteration = iteration;
  finalSimilarity = similarity;
  model.metadata.convergedAtIteration = convergedAtIteration;
  model.metadata.finalSimilarity = finalSimilarity;
  return model;
}
```

### Type Definitions Updated
- **File**: `src/types.ts:31-36`
- Added optional fields to `SocialSystemModel.metadata`:
  - `convergedAtIteration?: number` - Tracks which iteration converged
  - `finalSimilarity?: number` - Records final similarity score

### Test Coverage Enhanced
Added 4 new comprehensive test cases in `src/__tests__/orchestrator.test.ts`:
1. **Convergence metadata recording**: Verifies `convergedAtIteration` and `finalSimilarity` are captured
2. **Empty outputs handling**: Ensures no crashes with empty agent outputs
3. **Default threshold behavior**: Confirms 0.9 default threshold is applied
4. **Backward compatibility**: All existing tests still pass

### Verification Completed
- ✅ All 12 orchestrator tests pass
- ✅ All 12 conflict-resolver tests pass (no regression)
- ✅ TypeScript compilation clean (`bun run typecheck`)
- ✅ LSP diagnostics clean for all modified files
- ✅ Integration test confirms convergence at iteration 2 with similarity 1.00
- ✅ Metadata correctly includes `convergedAtIteration: 2` and `finalSimilarity: 1.0`

### Key Learnings
1. **Metadata enrichment**: Always track why workflow terminated early (convergence vs max iterations)
2. **Similarity scoring**: Token-based overlap is sufficient for detecting output stabilization
3. **Caching effect**: Agent cache causes iteration 2+ to have perfect similarity (1.00) when outputs don't change
4. **Edge case handling**: Empty strings in similarity calculation correctly return 0 (no false convergence)
5. **Optional metadata fields**: Use `?:` for convergence fields since they only exist on early termination
6. **Test strategy**: Test both convergence path (early termination) and non-convergence path (max iterations)

### Performance Impact
- **Before**: Always runs 3 iterations regardless of output stabilization
- **After**: Terminates at iteration 2 when similarity >= 0.9 (33% compute savings)
- **Observed behavior**: Agent caching causes iteration 2+ to return identical outputs (similarity = 1.00)
- **Result**: Typical workflows now converge at iteration 2 instead of running full 3 iterations

### Configuration Options
- `maxIterations`: Default 3, configurable via `WorkflowConfig`
- `convergenceThreshold`: Default 0.9 (90% similarity), configurable via `WorkflowConfig`
- Both are validated: `maxIterations` must be positive integer, `convergenceThreshold` clamped to [0, 1]
