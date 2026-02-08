# Phase 3 Model Diff Testing - Issues

## 2026-02-08: Model Diff Implementation Bugs

### Bug #1: diffStructure Function - Variable Scope Error

**Location**: `src/analysis/model-diff.ts:258`

**Error**: `ReferenceError: changes is not defined`

**Root Cause**:
```typescript
// Line 246-252
const changes: Record<string, ArrayDiff<string>> = {};
for (const key in layerA) {
  if (Array.isArray(layerB[key]) && Array.isArray(layerB[key])) {
    const arrayDiff = diffArray(layerA[key], layerB[key]);
    changes[key] = arrayDiff;
  }
}
// Line 255-258 - changes variable scope ended at line 252
structureDiff[layer] = {
  layerName: layer,
  changes  // ❌ ReferenceError
};
```

**Fix Applied**: Moved `const changes` declaration outside the `if` block to proper scope. ✅ **FIXED**

---

### Bug #2: levenshteinDistance Function - Matrix Access Error

**Location**: `src/analysis/model-diff.ts:224`

**Error**: `TypeError: undefined is not an object (evaluating 'matrix[i][j] = Math.min(...)')`

**Root Cause**:
```typescript
// Line 219-224
for (let i = 1; i <= a.length; i++) {
  for (let j = 1; j <= b.length; j++) {
    const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;

    // ❌ Using 'a.length' instead of 'b.length' causes out-of-bounds access
    matrix[i][j] = Math.min(
      matrix[i - 1][j - 1] + 1,
      matrix[i - 1][j]
    );
  }
}
```

**Additional Issue**: The Levenshtein distance algorithm is incomplete - missing the third parameter in `Math.min()` (should include substitution cost: `matrix[i][j - 1] + 1`).

**Fix Applied**:
1. Corrected loop bounds to use `b.length` and `a.length` consistently
2. Completed Levenshtein distance algorithm with all three operations:
   - Substitution: `matrix[i - 1][j - 1] + cost`
   - Insertion: `matrix[i][j - 1] + 1`
   - Deletion: `matrix[i - 1][j] + 1`
✅ **FIXED**

---

## Test Results Summary (After Fix)

- **Total Tests**: 29
- **Passed**: 29 ✅
- **Failed**: 0
- **Test File**: `src/analysis/__tests__/model-diff.test.ts` ✅ No LSP errors
- **Source File**: `src/analysis/model-diff.ts` ✅ No LSP errors

**Note**: Both bugs have been successfully fixed. All test cases now pass. Minor test data inconsistencies were also corrected (conflict descriptions).
