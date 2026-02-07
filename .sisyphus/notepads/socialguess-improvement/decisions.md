# Decisions - SocialGuessSkills Improvement Plan

Created: 2026-02-07T06:15:10.692Z
Plan: socialguess-improvement

## User Decisions (from Planning Phase)

### Scope
- **Selected**: P0 + P1 + P2 (7 tasks, 92 hours)
- **Excluded**: P3 (TypeScript 5.0+, Web UI, Parallel optimization)

### LLM Provider
- **Choice**: GLM-4.7 (智谱AI)
- **Reasoning**: Domestic service, low latency, affordable pricing
- **Fallback**: Keep mock mode for testing when API key is not available

### Test Strategy
- **Approach**: Tests-after (implement first, then write tests)
- **Coverage Target**: 80%+ (from current 20%)
- **E2E Tests**: Fix timeouts, not remove them

### Timeline
- **Type**: Relaxed (1-3 months)
- **Allows**: Thorough testing and iteration

## Architectural Decisions

### Agent Output Schema
- **Decision**: Preserve backward compatibility
- **Interface**: `{conclusion, evidence, risks, suggestions, falsifiable}`
- **No changes allowed**: This is critical for MCP protocol compatibility

### MCP Protocol Interface
- **Decision**: Keep existing 3 tools unchanged
- **Tools**: `reasoning`, `query_agent`, `validate_model`
- **No breaking changes**: Protocol must remain stable

### Dependency Management
- **Decision**: Do NOT upgrade Bun or existing dependencies
- **Add only**: New dependencies required for tasks (GLM SDK, ESLint, Prettier, Pino)
- **Avoid**: Breaking changes from version upgrades

### Convergence Detection
- **Algorithm**: Simple string matching (Levenshtein distance is overkill)
- **Threshold**: 90% similarity default
- **Configurable**: `convergenceThreshold` and `maxIterations`

### Error Handling Strategy
- **Custom Error Classes**: `AppError`, `ValidationError`, `LLMError`, `WorkflowError`
- **Error Codes**: Enum-based (e.g., `E001: INVALID_HYPOTHESIS`)
- **Logging**: Use Pino with structured logging `{err, code, context}`

### Code Style
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier with sensible defaults (semi, singleQuote, 2 spaces)
- **Strictness**: Warnings for `console.log` and `any` type, not errors
