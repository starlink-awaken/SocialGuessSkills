# Technical Debt Cleanup Plan

**Project**: SocialGuessSkills
**Created**: 2026-02-07
**Status**: Draft
**Priority**: High - Blocking full test suite pass and code quality tooling

---

## Executive Summary

**2 Technical Debt Items Identified** from the SocialGuessSkills improvement plan execution.

| ID | Debt Item | Impact | Priority | Est. Effort |
|----|-----------|--------|----------|-------------|
| TD-001 | E2E test MCP response format mismatch | Tests fail, blocks CI/CD | High | 2-4 hours |
| TD-002 | ESLint 10.0.0 flat config complexity | Linting unusable, code quality gap | Medium | 3-6 hours |

**Total Estimated Effort**: 5-10 hours (parallelizable where applicable)

---

## Technical Debt Item TD-001: E2E Test MCP Response Format Mismatch

### Current State

**Problem Description**:
E2E tests in `src/__tests__/e2e.test.ts` fail because MCP server responses do not include the required `jsonrpc` field in the JSON-RPC 2.0 format.

**Evidence**:
- E2E tests timeout/fail after server startup
- MCP tools registered via `(mcpServer as any).registerTool()` (SDK quirk from AGENTS.md)
- Test output suggests response format incompatibility with JSON-RPC 2.0 spec

**Expected MCP Response Format** (JSON-RPC 2.0):
```json
{
  "jsonrpc": "2.0",
  "result": { /* tool result data */ },
  "id": 1
}
```

**Actual Response**: Missing `jsonrpc` field (SDK implementation detail)

### Impact

- **Blocking**: E2E tests cannot pass
- **CI/CD**: Prevents automated testing in deployment pipeline
- **Coverage**: Reduces confidence in integration testing
- **Severity**: HIGH - Tests fail, 7/42 tests failing

### Root Cause Analysis

**Hypotheses**:
1. MCP SDK (likely `@modelcontextprotocol/sdk`) version compatibility issue
2. Incorrect MCP server initialization/configuration
3. Test client expects JSON-RPC 2.0 format but SDK uses different format
4. Need to inspect MCP SDK documentation for correct response format

**Investigation Required**:
- [ ] Identify exact MCP SDK version from package.json
- [ ] Read MCP SDK documentation for response format requirements
- [ ] Check if SDK provides configuration options for JSON-RPC compliance
- [ ] Examine actual MCP server response format via logging/debugging

### Proposed Solutions

**Option 1: Fix MCP Server Response Format** (Recommended)
- Investigate MCP SDK configuration for JSON-RPC 2.0 compliance
- Modify `src/server.ts` to ensure responses include `jsonrpc` field
- Add middleware or wrapper if SDK doesn't support it natively

**Pros**: Proper fix, aligns with JSON-RPC spec
**Cons**: Requires SDK research, may need SDK upgrade
**Effort**: 2-4 hours

**Option 2: Update Test Client to Match SDK Format**
- Modify test expectations to match actual SDK response format
- Document deviation from JSON-RPC 2.0 spec

**Pros**: Quick fix, no SDK changes
**Cons**: Non-standard, future maintenance burden
**Effort**: 1-2 hours

**Option 3: Add Response Transformation Middleware**
- Create middleware to wrap SDK responses with JSON-RPC 2.0 format
- Apply to all MCP tool calls

**Pros**: Isolates fix, maintains test compatibility
**Cons**: Additional complexity, performance overhead
**Effort**: 2-3 hours

**Recommendation**: **Option 1** - Fix at source for long-term maintainability.

### Implementation Plan (Option 1)

**Phase 1: Investigation** (1 hour)
1. Identify MCP SDK version and documentation
2. Research JSON-RPC 2.0 compliance options
3. Examine current `src/server.ts` implementation
4. Add logging to capture actual response format

**Phase 2: Configuration/Code Fix** (1-2 hours)
1. Update MCP server initialization for JSON-RPC compliance
2. Verify response format via logging
3. Update test expectations if needed

**Phase 3: Verification** (0.5 hour)
1. Run E2E tests
2. Verify all 42 tests pass
3. Confirm no regressions in other tests

**Success Criteria**:
- All 42 tests pass (currently 35/42)
- E2E tests complete without timeout
- Responses include `jsonrpc: "2.0"` field
- No breaking changes to MCP tool interface

---

## Technical Debt Item TD-002: ESLint 10.0.0 Flat Config Complexity

### Current State

**Problem Description**:
ESLint 10.0.0 uses flat config format (`eslint.config.js`), which is significantly more complex than the legacy `.eslintrc.js` format. Previous attempts to configure it failed due to package incompatibility and configuration complexity.

**Evidence**:
- ESLint configured in `eslint.config.js` (flat config format)
- Attempted to use `@eslint/eslintrc` package (doesn't exist)
- Task 7 marked as "partial completion" in improvement plan
- Currently only Prettier working for code formatting

**Current State**:
- ✅ Prettier configured and working (`.prettierrc`)
- ❌ ESLint flat config overly complex, not functional
- ❌ No linting in development workflow
- ❌ Package.json has `bun run lint` but it may not work

### Impact

- **Code Quality Gap**: No static analysis, potential bugs/uncaught errors
- **Team Workflow**: Missing pre-commit linting
- **Consistency**: No automated style enforcement beyond Prettier
- **Severity**: MEDIUM - Not blocking, but reduces code quality

### Root Cause Analysis

**Hypotheses**:
1. ESLint 10.0.0 flat config requires specific plugins/packages not installed
2. TypeScript + ESLint 10.0.0 compatibility issues
3. Lack of clear documentation/migration guide for Bun + ESLint 10.0.0 + TS
4. Overly complex flat config schema for this project's needs

**Investigation Required**:
- [ ] Check exact ESLint version in package.json
- [ ] Research ESLint 10.0.0 + TypeScript flat config examples
- [ ] Explore alternative linting tools (Biome, Ruff, Deno linter)
- [ ] Evaluate if Prettier-only is sufficient for this project

### Proposed Solutions

**Option 1: Simplify to Prettier-Only** (Fastest)
- Remove ESLint, rely on Prettier for formatting
- Add `bun run typecheck` as pre-commit/lint step
- Leverage TypeScript strict mode for code quality

**Pros**: Simple, works now, minimal complexity
**Cons**: No linting (unused vars, code smells, best practices)
**Effort**: 0.5 hour

**Option 2: Downgrade ESLint to 8.x/9.x** (Balanced)
- Use legacy `.eslintrc.js` format (well-documented)
- Stable with TypeScript + Bun ecosystem
- Proven configuration patterns available

**Pros**: Works, mature ecosystem, good examples
**Cons**: Not using latest ESLint version, future upgrade needed
**Effort**: 1-2 hours

**Option 3: Research Alternative Linters** (Modern)
- **Biome**: Fast, ESLint + Prettier replacement, TS-first
- **Rust-based (Ruff, dprint)**: Extremely fast, but Bun compatibility unclear
- Try Biome first (best modern alternative)

**Pros**: Modern, fast, TS-native, simple config
**Cons**: New tool, learning curve, ecosystem smaller
**Effort**: 2-3 hours (research + setup)

**Option 4: Fix ESLint 10.0.0 Flat Config** (Pursue Original)
- Deep dive into ESLint 10.0.0 documentation
- Find working TypeScript examples
- Iterate until functional

**Pros**: Uses latest ESLint, future-proof
**Cons**: High complexity risk, time-consuming
**Effort**: 3-6 hours (high uncertainty)

**Recommendation**: **Option 3 (Biome)** - Modern, fast, TypeScript-native, simpler than ESLint 10.0.0 flat config.

### Implementation Plan (Option 3: Biome)

**Phase 1: Research & Evaluation** (1 hour)
1. Read Biome documentation for Bun + TypeScript
2. Test Biome CLI: `bunx biome --help`
3. Compare Biome config vs ESLint flat config
4. Check Biome + Prettier integration (can replace or coexist)

**Phase 2: Installation & Configuration** (1 hour)
1. Install Biome: `bun add -D @biomejs/biome`
2. Create `biome.json` config with TypeScript rules
3. Configure to work alongside or replace Prettier
4. Add scripts to package.json:
   - `lint`: `biome check src/`
   - `lint:fix`: `biome check --write src/`

**Phase 3: Integration & Testing** (1 hour)
1. Run linter: `bun run lint`
2. Fix reported issues: `bun run lint:fix`
3. Verify TypeScript + Biome compatibility
4. Test with `bun run typecheck` (both should work)

**Success Criteria**:
- Linter runs without errors
- Code quality issues detected and fixable
- Integration with Bun dev workflow
- Configuration is simple and maintainable

---

## Execution Strategy

### Sequential Execution Path

1. **TD-001 (E2E MCP Fix)** - HIGH priority
   - Investigate MCP SDK → Fix response format → Verify tests

2. **TD-002 (ESLint/Biome)** - MEDIUM priority
   - Research alternatives → Install/configure → Verify linter

### Parallel Opportunities

- Research MCP SDK AND research Biome/linter alternatives can run in parallel
- Documentation reading can be parallelized

### Timeline

**Optimized Sequential**: 5-8 hours
- TD-001: 2-3 hours
- TD-002: 2-3 hours
- Buffer: 1-2 hours

**Parallel Execution**: 3-5 hours
- Research both debt items: 1-2 hours (parallel)
- Implementation: 2-3 hours

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Test Pass Rate | 35/42 (83%) | 42/42 (100%) |
| E2E Test Status | Failing | Passing |
| Linter Available | Prettier only | Prettier + Linter |
| Technical Debt Count | 2 | 0 |
| Code Coverage | 85%+ | 85%+ (maintain) |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| MCP SDK requires upgrade | Low | Medium | Version compatibility check |
| Biome incompatible with Bun | Low | High | Test early, fallback to ESLint 8.x |
| Time exceeds estimates | Medium | Low | Start with research, pivot if too complex |
| Breaking changes to MCP protocol | Low | Medium | Test thoroughly, document changes |

---

## Notes

- **No Urgent Deadline**: These are not blocking production, but should be addressed soon
- **Learning Opportunity**: Research phase will improve future decision-making
- **Documentation**: Create/update AGENTS.md after completion
- **Commit Conventions**: Follow existing commit message format

---

## Related Documents

- Original Improvement Plan: `.sisyphus/plans/socialguess-improvement.md`
- Technical Decisions Notepad: `.sisyphus/notepads/socialguess-improvement/decisions.md`
- Project Knowledge Base: `AGENTS.md`
