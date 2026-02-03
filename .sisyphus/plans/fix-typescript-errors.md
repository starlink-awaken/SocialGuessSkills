# TypeScript类型错误修复计划

## TL;DR

> **Quick Summary**: 修复conflict-resolver.ts和server.ts中的TypeScript类型错误，确保类型安全和LSP无错误。
> 
> **Deliverables**: 
> - 修复后的conflict-resolver.ts（处理validation agent类型和undefined检查）
> - 修复后的server.ts（修正MCP schema类型定义）
> - 所有LSP错误清零
> - 所有17个测试仍然通过
> 
> **Estimated Effort**: Quick（10-15分钟）
> **Parallel Execution**: NO - 单一文件顺序修复
> **Critical Path**: 修复conflict-resolver.ts → 修复server.ts → 验证

---

## Context

### Original Request
用户希望先修复TypeScript类型错误，然后再开始MCP集成。

### Current Issues
LSP检测到以下类型错误：

**conflict-resolver.ts (8个错误)**:
1. Line 30: `validation` agent类型不在`conclusionKeywords`映射中
2. Line 30, 31: `agentA`, `agentB`可能是undefined
3. Line 33-40: 多处`agentA`, `agentB`可能undefined的错误

**server.ts (12个错误)**:
1. Line 18, 50, 75, 102, 127, 134: `AnySchema`类型不匹配
2. Line 20, 77, 129: 对象字面量的属性不存在于`AnySchema`类型
3. Line 52, 104, 136: 参数隐式`any`类型

### System Status
- ✅ 所有17个测试通过
- ✅ 功能运行正常（示例成功执行）
- ⚠️ LSP报告类型错误（不影响运行时）
- 🎯 目标：达到类型安全，LSP无错误

---

## Work Objectives

### Core Objective
修复所有TypeScript类型错误，确保代码类型安全且LSP检查通过。

### Concrete Deliverables
1. **修复后的conflict-resolver.ts**
   - 添加`validation`到`conclusionKeywords`映射
   - 添加undefined检查
   
2. **修复后的server.ts**
   - 修正MCP tool的inputSchema类型定义
   - 为handler参数添加明确类型

3. **验证报告**
   - LSP诊断结果：0个错误
   - 测试结果：17个测试全部通过

### Definition of Done
- [x] conflict-resolver.ts的LSP错误清零
- [x] server.ts的LSP错误清零
- [x] 所有测试仍然通过（`bun test`）
- [x] 示例仍能成功运行

### Must Have
- 所有类型错误修复
- 测试通过率保持100%
- 不改变运行时行为

### Must NOT Have (Guardrails)
- 不使用`@ts-ignore`或`@ts-expect-error`压制错误
- 不使用`any`类型作为快捷方案
- 不改变函数签名或导出接口
- 不修改业务逻辑（只修复类型）

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES（17个测试）
- **Automated tests**: Tests-after（修复后验证）
- **Framework**: bun test
- **Agent-Executed QA**: MANDATORY（bash运行测试和LSP检查）

---

## TODOs

- [x] 1. 修复conflict-resolver.ts中的类型错误

  **What to do**:
  - 添加`validation`到`conclusionKeywords`对象（line 16-23）
  - 在使用`agentA`和`agentB`之前添加类型检查
  - 确保所有数组索引访问都安全
  
  **具体修复**:
  
  **问题1**: `validation`不在`conclusionKeywords`中
  ```typescript
  // Line 16-23, 添加validation entry
  const conclusionKeywords = {
    systems: ["反馈", "回路", "稳定"],
    econ: ["激励", "产权", "效率"],
    socio: ["认同", "规范", "共同体"],
    governance: ["权力", "执行", "监督"],
    culture: ["仪式", "符号", "认同"],
    risk: ["崩溃", "储备", "缓冲"],
    validation: ["可证伪", "反例", "验证"]  // 新增
  };
  ```
  
  **问题2**: agentA和agentB可能undefined
  ```typescript
  // Line 30-34, 添加类型断言或检查
  const keywordsA = conclusionKeywords[agentA.agentType as keyof typeof conclusionKeywords] || [];
  const keywordsB = conclusionKeywords[agentB.agentType as keyof typeof conclusionKeywords] || [];
  ```
  
  **Must NOT do**:
  - 不改变`conclusionKeywords`的结构（只添加validation）
  - 不改变函数返回类型
  - 不影响现有的冲突检测逻辑
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的类型修复，无复杂逻辑
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None
  
  **References**:
  - `src/types.ts` - AgentType定义（包含validation）
  - `src/workflow/conflict-resolver.ts:16-23` - conclusionKeywords对象
  - `src/workflow/conflict-resolver.ts:30-40` - 使用agentA/agentB的地方
  
  **Acceptance Criteria**:
  
  **Code Changes**:
  - [ ] `validation`已添加到`conclusionKeywords`
  - [ ] Line 30-31的类型错误已修复（使用类型断言）
  - [ ] Line 33-40的undefined错误已修复
  - [ ] 代码格式保持一致
  
  **LSP Verification**:
  - [ ] 运行LSP诊断：`bun run tsc --noEmit` → conflict-resolver.ts无错误
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: LSP诊断conflict-resolver.ts
    Tool: Bash
    Preconditions: 文件已修改
    Steps:
      1. cd /Users/xiamingxing/Workspace/Skills/SocialGuessSkills
      2. bunx tsc --noEmit --pretty false 2>&1 | grep "conflict-resolver.ts"
      3. 检查输出是否为空（无错误）
    Expected Result: 无LSP错误输出
    Evidence: tsc输出
  
  Scenario: 验证冲突检测测试仍然通过
    Tool: Bash
    Preconditions: 文件已修改
    Steps:
      1. bun test src/__tests__/conflict-resolver.test.ts
      2. 检查所有测试通过
    Expected Result: 所有冲突检测测试通过
    Evidence: 测试输出
  ```
  
  **Evidence to Capture**:
  - [ ] tsc诊断输出（应为空或无conflict-resolver.ts错误）
  - [ ] 测试通过输出
  
  **Commit**: YES
  - Message: `fix(types): add validation to conclusionKeywords and fix undefined checks in conflict-resolver`
  - Files: `src/workflow/conflict-resolver.ts`
  - Pre-commit: `bun test src/__tests__/conflict-resolver.test.ts`

---

- [x] 2. 修复server.ts中的MCP schema类型错误

  **What to do**:
  - 修正`registerTool`的`inputSchema`类型定义
  - 为handler函数参数添加明确类型标注
  - 确保schema符合MCP协议规范
  
  **具体修复**:
  
  **问题1**: inputSchema类型不匹配（Line 17-51）
  ```typescript
  // 将inputSchema定义为符合JSONSchema的对象
  mcpServer.registerTool("reasoning", {
    description: "...",
    inputSchema: {
      type: "object",
      properties: {
        hypothesis: {
          type: "object",
          properties: {
            assumptions: { type: "array", items: { type: "string" } },
            constraints: { type: "array", items: { type: "string" } },
            goals: { type: "array", items: { type: "string" } }
          },
          required: ["assumptions", "goals"]
        },
        maxIterations: { type: "number", default: 3, minimum: 1, maximum: 10 }
      },
      required: ["hypothesis"]
    }
  }, async (args: any) => {  // 添加类型标注
    // ...
  });
  ```
  
  **问题2**: handler参数隐式any（Line 52, 104, 136）
  ```typescript
  // 为每个handler添加明确类型
  }, async (args: any) => {
    const hypothesis: Hypothesis = args.hypothesis;
    // ...
  });
  ```
  
  或者定义接口：
  ```typescript
  interface ReasoningArgs {
    hypothesis: Hypothesis;
    maxIterations?: number;
  }
  
  }, async (args: ReasoningArgs) => {
    // ...
  });
  ```
  
  **Must NOT do**:
  - 不改变MCP协议的接口
  - 不改变工具的功能行为
  - 不破坏现有的调用方式
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 类型标注修复，逻辑不变
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1
  
  **References**:
  - `@modelcontextprotocol/sdk` - MCP SDK类型定义
  - `src/types.ts` - Hypothesis类型定义
  - `src/server.ts:15-201` - 三个tool注册
  
  **Acceptance Criteria**:
  
  **Code Changes**:
  - [ ] 所有`registerTool`的handler参数都有明确类型
  - [ ] inputSchema结构保持不变（只修复类型）
  - [ ] Line 18, 50, 75等的schema错误已修复
  
  **LSP Verification**:
  - [ ] 运行LSP诊断：`bunx tsc --noEmit` → server.ts无错误
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: LSP诊断server.ts
    Tool: Bash
    Preconditions: 文件已修改
    Steps:
      1. cd /Users/xiamingxing/Workspace/Skills/SocialGuessSkills
      2. bunx tsc --noEmit --pretty false 2>&1 | grep "server.ts"
      3. 检查输出是否为空（无错误）
    Expected Result: 无LSP错误输出
    Evidence: tsc输出
  
  Scenario: 验证MCP Server仍能启动
    Tool: Bash
    Preconditions: 文件已修改
    Steps:
      1. timeout 5 bun run src/server.ts &
      2. sleep 2
      3. 检查进程是否存在：ps aux | grep "bun.*server.ts"
      4. kill进程
    Expected Result: Server启动无错误
    Evidence: 启动日志
  
  Scenario: 端到端测试仍然通过
    Tool: Bash
    Preconditions: 文件已修改
    Steps:
      1. bun test src/__tests__/e2e.test.ts
      2. 检查测试通过
    Expected Result: E2E测试通过
    Evidence: 测试输出
  ```
  
  **Evidence to Capture**:
  - [ ] tsc诊断输出（应为空或无server.ts错误）
  - [ ] Server启动日志
  - [ ] E2E测试输出
  
  **Commit**: YES
  - Message: `fix(types): add explicit types to MCP handler parameters in server.ts`
  - Files: `src/server.ts`
  - Pre-commit: `bun test src/__tests__/e2e.test.ts`

---

- [x] 3. 全局验证和回归测试

  **What to do**:
  - 运行完整的测试套件（所有17个测试）
  - 运行完整的LSP诊断（整个项目）
  - 运行示例验证功能正常
  - 生成验证报告
  
  **Must NOT do**:
  - 不跳过任何测试
  - 不忽略任何警告
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 执行验证命令
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None（最后一个任务）
  - **Blocked By**: Task 2
  
  **References**:
  - `package.json` - 测试脚本
  - `examples/run-example.ts` - 示例脚本
  
  **Acceptance Criteria**:
  
  **LSP Clean**:
  - [ ] 运行`bunx tsc --noEmit`：0个错误
  - [ ] 运行`bunx tsc --noEmit | wc -l`：输出≤1（只有空行）
  
  **All Tests Pass**:
  - [ ] 运行`bun test`：17个测试全部通过
  - [ ] 测试覆盖率保持不变
  
  **Example Works**:
  - [ ] 运行`bun run examples/run-example.ts`：成功完成推演
  - [ ] 输出包含7个Agent、冲突检测、模型结构
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: 完整LSP诊断
    Tool: Bash
    Preconditions: Task 1, 2已完成
    Steps:
      1. cd /Users/xiamingxing/Workspace/Skills/SocialGuessSkills
      2. bunx tsc --noEmit --pretty false
      3. 捕获输出和退出码
      4. 断言：退出码为0（无错误）
    Expected Result: tsc退出码0，无错误输出
    Evidence: tsc完整输出
  
  Scenario: 完整测试套件
    Tool: Bash
    Preconditions: Task 1, 2已完成
    Steps:
      1. bun test --coverage
      2. 检查输出："17 pass"
      3. 验证无测试失败或跳过
    Expected Result: 17个测试全部通过
    Evidence: 测试摘要输出
  
  Scenario: 示例成功运行
    Tool: Bash
    Preconditions: Task 1, 2已完成
    Steps:
      1. bun run examples/run-example.ts
      2. 检查输出包含：
         - "迭代次数: 2"（或其他数字）
         - "置信度: 0.79"（或其他值）
         - "Agent输出数量: 7"
         - "冲突数量: 7"（或其他数字）
      3. 验证进程退出码为0
    Expected Result: 示例成功完成推演
    Evidence: 完整输出
  
  Scenario: 对比修复前后
    Tool: Bash
    Preconditions: 所有修复完成
    Steps:
      1. 统计修复前的错误数：20个（8+12）
      2. 统计修复后的错误数：0个
      3. 确认测试通过数：17个（不变）
    Expected Result: 错误从20个降到0个，测试保持17个通过
    Evidence: 对比报告
  ```
  
  **Evidence to Capture**:
  - [ ] tsc完整诊断输出
  - [ ] 测试套件完整输出
  - [ ] 示例运行输出
  - [ ] 修复前后对比表
  
  **Commit**: NO（验证任务，无代码变更）
  - 但可以生成验证报告：`docs/type-fix-verification.md`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(types): add validation to conclusionKeywords and fix undefined checks in conflict-resolver` | `src/workflow/conflict-resolver.ts` | `bun test src/__tests__/conflict-resolver.test.ts` |
| 2 | `fix(types): add explicit types to MCP handler parameters in server.ts` | `src/server.ts` | `bun test src/__tests__/e2e.test.ts` |

---

## Success Criteria

### Verification Commands

**LSP诊断（整个项目）**:
```bash
cd /Users/xiamingxing/Workspace/Skills/SocialGuessSkills
bunx tsc --noEmit
# Expected: Exit code 0, no errors
```

**测试套件**:
```bash
bun test
# Expected: 17 pass, 0 fail
```

**示例运行**:
```bash
bun run examples/run-example.ts
# Expected: 成功完成推演，输出包含7个Agent和冲突检测
```

### Final Checklist

- [x] conflict-resolver.ts的LSP错误清零（从8个降到0）
- [x] server.ts的LSP错误清零（从12个降到0）
- [x] 所有17个测试保持通过
- [x] 示例成功运行
- [x] 无新增类型错误
- [x] 代码格式和风格一致
- [x] 提交信息清晰

---

## Notes

### Root Causes

**conflict-resolver.ts错误原因**:
- `validation` agent在`AgentType`中存在，但未添加到`conclusionKeywords`映射
- TypeScript严格模式下，数组索引访问可能返回undefined

**server.ts错误原因**:
- MCP SDK的`registerTool`类型定义要求明确的类型标注
- handler函数参数未显式标注类型

### Risk Assessment

- **风险级别**: 低
- **影响范围**: 仅类型层面，不改变运行时行为
- **回滚策略**: 简单（git revert两个提交）

### Future Improvements

- 考虑启用更严格的TypeScript配置（`strict: true`）
- 为MCP handler定义统一的类型接口
- 添加pre-commit hook运行`tsc --noEmit`
