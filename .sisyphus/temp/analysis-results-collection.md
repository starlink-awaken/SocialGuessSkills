# Analysis Results Collection Template

**Task ID**: bg_4ce32ae5 (Architecture)
**Status**: ✅ Completed (1m 8s)
**Pending Tasks**: 5

---

## Collection Queue

| Task ID | Dimension | Status | Duration |
|----------|------------|---------|-----------|
| bg_4ce32ae5 | Architecture | ✅ Complete | 1m 8s |
| bg_130647ff | Agents | ⏳ Running | - |
| bg_ba4ad1d3 | Workflow | ⏳ Running | - |
| bg_6003392b | Tests | ⏳ Running | - |
| bg_60d9a5c5 | MCP Integration | ⏳ Running | - |
| bg_a243aeaf | Maintainability | ⏳ Running | - |

---

## Expected Output Format (from each agent)

```json
{
  "dimension": "Architecture | Agents | Workflow | Tests | MCP | Maintainability",
  "score": 1-5,
  "findings": [
    {
      "type": "critical | major | minor",
      "description": "Issue description",
      "file": "path/to/file.ts",
      "line": 42,
      "impact": "What this affects"
    }
  ],
  "strengths": [
    {
      "description": "What's done well",
      "file": "path/to/file.ts"
    }
  ],
  "recommendations": [
    {
      "priority": "high | medium | low",
      "description": "Specific suggestion",
      "effort": "hours/days",
      "expected": "Expected outcome"
    }
  ]
}
```

---

## Scoring Matrix Preparation

### Dimension Scores (to be filled)
- Architecture: __/5
- Agents: __/5
- Workflow: __/5
- Tests: __/5
- MCP: __/5
- Maintainability: __/5
- Vision: __/5

### Overall Score Calculation
```
Overall Score = (Architecture × 0.15) +
              (Agents × 0.15) +
              (Workflow × 0.15) +
              (Tests × 0.15) +
              (MCP × 0.15) +
              (Maintainability × 0.15) +
              (Vision × 0.10)

Total: __/5
```

---

## Critical Issues Tracking

| ID | Dimension | Severity | Description | File | Line |
|----|-----------|-----------|-------------|-------|------|
| - | - | - | - | - |

---

## Strengths Summary

| Dimension | Strength |
|-----------|-----------|
| - | - |

---

## Recommendations Priority Matrix

| Priority | Dimension | Description | Effort | Expected Impact |
|----------|-----------|-------------|---------|----------------|
| - | - | - | - | - |

---

## Next Actions

- [ ] Wait for 5 remaining tasks to complete
- [ ] Collect all 6 results via `background_output`
- [ ] Parse and standardize results
- [ ] Calculate scores and cross-cutting insights
- [ ] Prepare for Oracle consultation (vision alignment)
- [ ] Generate comprehensive report
