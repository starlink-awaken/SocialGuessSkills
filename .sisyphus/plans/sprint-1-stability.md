# Next Iteration Plan: Sprint 1 - Stability & Convergence

**Sprint Duration**: 2-3 days
**Goal**: Fix all P0 bugs and restore basic functionality
**Target**: Production readiness score from 2.0/5 to 3.0/5

---

## Sprint Objectives

1. ✅ **Conflict Detection Works Correctly**
   - Fix regex bug in conflict-resolver.ts
   - Expand conflict detection rules (goal/constraint/evidence conflicts)
   - Add unit tests for conflict detection

2. ✅ **Workflow Converges Efficiently**
   - Add convergence check to stop early when conflicts resolved
   - Implement agent result caching (memoization)
   - Add workflow metrics (iteration count, convergence rate)

3. ✅ **E2E Tests Pass for Critical MCP Tools**
   - Fix E2E test timeouts
   - Add MCP server health check
   - Restore testing for reasoning, query_agent, validate_model tools

4. ✅ **Type Safety Restored**
   - Remove all unsafe `as any` casts
   - Replace `any` types with proper types
   - Add runtime validation where needed

5. ✅ **Maintainability Improved**
   - Create constants.ts for all magic numbers
   - Fix duplicate code (cost-alert.ts)
   - Standardize logging to logger

---

## Task Breakdown

### Task 1: Fix Conflict Detection Regex Bug
**Priority**: P0
**Estimated Time**: 2 hours
**Owner**: TBD

**Description**:
Fix the critical bug in `src/workflow/conflict-resolver.ts:29` where `join('|')` creates a string instead of a regex pattern, causing conflict detection to always fail.

**Changes Required**:
```typescript
// BEFORE (WRONG):
const regex = risks.join('|');

// AFTER (CORRECT):
const regex = new RegExp(risks.join('|'));
```

**Files to Modify**:
- `src/workflow/conflict-resolver.ts`

**Acceptance Criteria**:
- [ ] Regex pattern correctly constructed
- [ ] Unit tests pass for conflict detection
- [ ] Manual verification: Conflict detection works for sample risks

**Related Tests**:
- `src/__tests__/conflict-resolver.test.ts`

---

### Task 2: Expand Conflict Detection Rules
**Priority**: P1
**Estimated Time**: 3 hours
**Owner**: TBD

**Description**:
Expand conflict detection to include missing dimensions identified by Oracle: Goal conflicts, Constraint conflicts, Evidence conflicts.

**Changes Required**:
- Add conflict type enum: `logical | priority | risk_amplification | goal | constraint | evidence`
- Implement goal conflict detection (agents have incompatible goals)
- Implement constraint conflict detection (agents violate same constraints)
- Implement evidence conflict detection (agents contradict each other's evidence)

**Files to Modify**:
- `src/workflow/conflict-resolver.ts`
- `src/types.ts` (add conflict type)

**Acceptance Criteria**:
- [ ] All 6 conflict types implemented
- [ ] Unit tests for each conflict type
- [ ] Conflicts properly categorized and reported

**Related Tests**:
- `src/__tests__/conflict-resolver.test.ts`

---

### Task 3: Add Workflow Convergence Check
**Priority**: P0
**Estimated Time**: 3 hours
**Owner**: TBD

**Description**:
Add early termination check in orchestrator to stop iterations when no conflicts are detected, preventing 33-66% resource waste.

**Changes Required**:
```typescript
// Add in orchestrator.ts after conflict detection:
if (conflicts.length === 0) {
  logger.info(`Workflow converged in ${iteration + 1} iterations`);
  break;
}
```

**Files to Modify**:
- `src/workflow/orchestrator.ts`

**Acceptance Criteria**:
- [ ] Convergence check implemented
- [ ] Workflow stops when no conflicts
- [ ] Convergence logged for observability
- [ ] Unit tests verify early termination

**Related Tests**:
- `src/__tests__/orchestrator.test.ts`

---

### Task 4: Implement Agent Caching
**Priority**: P1
**Estimated Time**: 8 hours
**Owner**: TBD

**Description**:
Implement memoization for agent results to avoid re-executing agents in iterations 2-3 when their conclusions haven't changed. Eliminates 80% waste in later iterations.

**Changes Required**:
- Create agent result cache structure
- Cache agent conclusions after execution
- Check cache before re-executing (only re-execute if hypothesis changed)
- Invalidate cache when new evidence added

**Files to Modify**:
- `src/workflow/orchestrator.ts`
- `src/workflow/cache.ts` (new file)

**Acceptance Criteria**:
- [ ] Agent results cached after execution
- [ ] Cache checked before re-execution
- [ ] Cache invalidated correctly
- [ ] 80% reduction in agent re-execution verified
- [ ] Unit tests for caching logic

**Related Tests**:
- `src/__tests__/cache.test.ts` (new)

---

### Task 5: Fix E2E Test Timeouts
**Priority**: P0
**Estimated Time**: 4 hours
**Owner**: TBD

**Description**:
Fix all 7 E2E test timeouts by adding MCP server health check and fixing process startup timing issues.

**Root Cause Analysis Needed**:
- MCP server startup slow?
- Process management issue with Bun.spawn()?
- Port binding race condition?
- Test timeout too aggressive (5 seconds)?

**Changes Required**:
- Add MCP server health check endpoint
- Implement "ready signal" mechanism
- Increase test timeout if needed (add exponential backoff)
- Add retry logic for connection attempts
- Improve error messages for debugging

**Files to Modify**:
- `src/__tests__/e2e.test.ts`
- `src/server.ts` (add health check)

**Acceptance Criteria**:
- [ ] All 7 E2E tests pass
- [ ] MCP server health check implemented
- [ ] Tests complete within reasonable time (<10s each)
- [ ] Connection errors properly handled and logged

**Related Tests**:
- `src/__tests__/e2e.test.ts`

---

### Task 6: Remove Unsafe Type Casts
**Priority**: P0
**Estimated Time**: 4 hours
**Owner**: TBD

**Description**:
Remove all unsafe `as any` and `any` type casts throughout the codebase to restore TypeScript strict mode benefits and prevent runtime errors.

**Files to Fix**:
- `src/agents/agent-executor.ts` (lines 27, 52)
- `src/utils/retry.ts` (line 9)
- `src/utils/cost-alert.ts` (line 100)
- `src/utils/cost-predictor.ts` (line 30)

**Changes Required**:
- Replace `as any` with proper type guards
- Replace `any` types with specific types
- Add runtime validation where types cannot be statically verified
- Use `unknown` for untyped data and narrow with type guards

**Acceptance Criteria**:
- [ ] All `as any` casts removed
- [ ] All `any` types replaced with specific types
- [ ] Type safety verified with `bun run typecheck`
- [ ] No runtime type errors in manual testing
- [ ] Tests still pass

**Verification**:
- `bun run typecheck` (no errors)
- `bun test` (all tests pass)

---

### Task 7: Create constants.ts
**Priority**: P1
**Estimated Time**: 2 hours
**Owner**: TBD

**Description**:
Create `src/utils/constants.ts` to centralize all magic numbers scattered across the codebase, improving maintainability and clarity.

**Magic Numbers to Extract**:
- Budget ranges: 10-50 (cost-alert.ts)
- Token limits: 1024 (config.ts)
- Queue size: 100 (request-queue.ts)
- Recovery time: 30_000ms (circuit-breaker.ts)
- Max iterations: 5 (orchestrator.ts)
- Agent types: 7 (types.ts)
- Conflict types: 3 → 6 (after expansion)

**File to Create**:
- `src/utils/constants.ts`

**Changes Required**:
- Define all constants with descriptive names
- Export constants for use across codebase
- Replace all hardcoded values with constants

**Acceptance Criteria**:
- [ ] All 15+ magic numbers extracted
- [ ] Constants have descriptive names
- [ ] All hardcoded values replaced
- [ ] Code is self-documenting

**Files to Update**:
- `src/agents/agent-executor.ts`
- `src/workflow/orchestrator.ts`
- `src/utils/cost-alert.ts`
- `src/utils/config.ts`
- `src/utils/request-queue.ts`
- `src/utils/circuit-breaker.ts`

---

### Task 8: Fix cost-alert.ts Duplication
**Priority**: P1
**Estimated Time**: 1 hour
**Owner**: TBD

**Description**:
Extract duplicate budget range checking code in `src/utils/cost-alert.ts` into a `clampBudget()` method to follow DRY principle.

**Changes Required**:
```typescript
// Extract duplicate code (appears at lines 28-29 and 90-91)
function clampBudget(budget: number): number {
  return Math.max(10, Math.min(50, budget));
}

// Use in both places:
const adjustedBudget = clampBudget(budget);
```

**Files to Modify**:
- `src/utils/cost-alert.ts`

**Acceptance Criteria**:
- [ ] Duplicate code eliminated
- [ ] `clampBudget()` function extracted
- [ ] Function used in both locations
- [ ] Tests still pass

**Related Tests**:
- `src/__tests__/cost-alert.test.ts`

---

### Task 9: Standardize Logging
**Priority**: P1
**Estimated Time**: 3 hours
**Owner**: TBD

**Description**:
Replace all `console.log()` and `console.error()` with logger calls for consistency and production-ready logging.

**Files to Update**:
- `src/agents/agent-executor.ts`
- `src/workflow/orchestrator.ts`
- `src/utils/*.ts` (check for console usage)

**Changes Required**:
- Replace `console.log()` with `logger.info()`
- Replace `console.error()` with `logger.error()`
- Replace `console.warn()` with `logger.warn()`
- Add proper context (file, function) to logger calls

**Acceptance Criteria**:
- [ ] All console.log/error/warn replaced
- [ ] Logger used consistently
- [ ] Context included in all logger calls
- [ ] Logs are structured and queryable

**Verification**:
- `grep -r "console\." src/` (should find no results)

---

## Sprint Timeline

### Day 1: P0 Fixes (9 hours)
- [ ] Task 1: Fix Conflict Detection Regex Bug (2h)
- [ ] Task 3: Add Workflow Convergence Check (3h)
- [ ] Task 5: Fix E2E Test Timeouts (4h)

### Day 2: Type Safety & Constants (6 hours)
- [ ] Task 6: Remove Unsafe Type Casts (4h)
- [ ] Task 7: Create constants.ts (2h)

### Day 3: Quality Improvements (12 hours)
- [ ] Task 2: Expand Conflict Detection Rules (3h)
- [ ] Task 4: Implement Agent Caching (8h)
- [ ] Task 8: Fix cost-alert.ts Duplication (1h)
- [ ] Task 9: Standardize Logging (3h)

**Total Effort**: 27 hours (~3.5 days)

---

## Success Criteria

### Functional Requirements
- [ ] All E2E tests pass (7/7)
- [ ] Conflict detection works for all 6 rule types
- [ ] Workflow converges efficiently (<3 iterations for simple scenarios)
- [ ] Agent caching eliminates 80% redundant execution

### Quality Requirements
- [ ] Type safety restored (bun run typecheck: no errors)
- [ ] Test coverage >40%
- [ ] No magic numbers in codebase
- [ ] No duplicate code violations

### Observability Requirements
- [ ] Workflow convergence logged
- [ ] All logging uses structured logger
- [ ] Error messages include context

### Production Readiness Requirements
- [ ] Production readiness score improved from 2.0/5 to 3.0/5
- [ ] All P0 bugs resolved
- [ ] MCP integration verified

---

## Risk Management

### High Risks
- **Task 4 (Agent Caching)**: Complex caching logic, may introduce bugs
  - **Mitigation**: Write comprehensive unit tests, implement simple cache first
- **Task 5 (E2E Tests)**: Root cause unclear, may take longer
  - **Mitigation**: Start with simple health check, add retries progressively

### Medium Risks
- **Task 2 (Expand Conflict Rules)**: New rules may have edge cases
  - **Mitigation**: Write unit tests for each rule, test with sample scenarios
- **Task 6 (Remove Type Casts)**: May break existing functionality
  - **Mitigation**: Run tests after each file change, use runtime validation

---

## Definition of Done

A task is considered **Done** when:
1. Code changes committed and pushed
2. All acceptance criteria met
3. Tests pass (unit tests for affected modules)
4. No regressions (all tests still pass)
5. Code reviewed (if working in team)

The **Sprint** is considered **Done** when:
1. All 9 tasks completed
2. All E2E tests pass
3. Production readiness score ≥3.0/5
4. Test coverage ≥40%
5. No P0 bugs remaining

---

## Dependencies

### Task Dependencies
- Task 4 (Agent Caching) depends on Task 3 (Convergence Check)
- Task 2 (Expand Conflict Rules) depends on Task 1 (Fix Regex Bug)

### Can Be Done in Parallel
- Task 1, Task 3, Task 5 (no dependencies)
- Task 6, Task 7, Task 8, Task 9 (no dependencies)

---

## Notes

- **Estimated times are optimistic**; adjust based on actual progress
- **Task 5 (E2E Tests)** may require debugging and take longer than estimated
- **Consider adding buffer time** (20-30%) for unknown issues
- **Daily standup** recommended to track progress and adjust plan

---

**Plan Created**: 2026-02-05
**Ready to Execute**: Yes
**Next Step**: Assign owners and start Sprint 1
