# SocialGuessSkills 项目全面改进计划

## TL;DR

> **Quick Summary**: 对 SocialGuessSkills 项目进行全面改进，修复关键bug、集成真实LLM、提升测试覆盖率、完善工程质量。
> 
> **Deliverables**: 
> - 2个P0级别bug修复（冲突检测、收敛检测）
> - GLM-4.7真实LLM集成
> - 测试覆盖率从20%提升至80%+
> - ESLint + Prettier代码规范
> - 性能监控和错误处理标准化
> - 文档一致性修复
> 
> **Estimated Effort**: Large（92小时）
> **Parallel Execution**: YES - 3 waves（Phase 1 → Phase 2 → Phase 3）
> **Critical Path**: P0修复 → GLM集成 → 测试补全 → 监控完善

---

## Context

### Original Request
用户要求"制定具体实施方案和计划，实施"，基于之前生成的深度分析报告（docs/DEEP-ANALYSIS-REPORT.md）。

### Interview Summary
**Key Discussions**:
- **实施范围**: 用户选择 P0 + P1 + P2（全面改进，不包含P3）
- **LLM提供商**: GLM-4.7（智谱AI）- 国内服务、低延迟、价格实惠
- **测试策略**: 测试后补（tests-after）- 实现功能后立即补充测试
- **时间线**: 充裕（1-3个月）- 允许充分测试和迭代优化

**Research Findings**:
- 深度分析报告识别出10个优先级任务（P0:2个、P1:3个、P2:2个、P3:3个）
- 当前项目状态：架构3.5/5、可用性1.5/5、商业价值2.5/5、学术价值3.5/5
- 关键阻塞：冲突检测bug、无收敛检测、AI调用模拟（非真实LLM）
- 测试覆盖率仅20%，E2E测试全部超时

### Metis Review
**Identified Gaps** (已解决):
1. **GLM-4.7 API配额确认** → 已解决：默认使用个人开发额度，任务中包含额度监控
2. **E2E测试修复策略** → 已解决：作为P1任务中测试覆盖率提升的一部分
3. **回滚策略** → 已解决：每个Phase作为一个commit，可逐Phase回滚
4. **依赖包版本冲突** → 已解决：guardrails明确"不升级现有依赖"
5. **AI调用失败处理** → 已解决：Task 4.2 中明确实现Fallback机制
6. **性能基线** → 已解决：Task 7 中明确测量当前基线并设定目标
7. **文档更新范围** → 已解决：Task 8 明确列出所有需更新的文档文件

---

## Work Objectives

### Core Objective
将 SocialGuessSkills 项目从原型状态提升至生产就绪状态，修复关键缺陷，集成真实LLM能力，完善工程质量和可维护性。

### Concrete Deliverables
1. **P0修复**:
   - `src/workflow/conflict-resolver.ts` - 冲突检测正则bug修复
   - `src/workflow/orchestrator.ts` - 工作流收敛检测实现
2. **GLM-4.7集成**:
   - `src/agents/agent-executor.ts` - 真实LLM调用替换模拟
   - `src/config/llm.ts` - LLM配置管理（新文件）
3. **测试提升**:
   - 测试覆盖率从20%提升至80%+
   - 所有E2E测试修复（不再超时）
4. **代码规范**:
   - `.eslintrc.json` + `.prettierrc.json`（新文件）
   - 所有现有代码通过linting
5. **监控和日志**:
   - `src/utils/logger.ts` - 统一日志系统（新文件）
   - `src/utils/error-handler.ts` - 错误处理标准化（新文件）
6. **文档修复**:
   - `AGENTS.md` - 修复anti-pattern声明
   - `README.md` - 更新架构图和使用说明

### Definition of Done
- [x] 所有P0/P1/P2任务完成并测试通过
- [x] `bun test` 覆盖率 ≥80%，无失败测试
- [x] `bun run lint` 零告警
- [x] `bun run src/server.ts` 成功启动MCP服务器
- [x] GLM-4.7可成功调用并返回结果（非模拟）
- [x] 所有文档与代码一致

### Must Have
- 冲突检测正则bug必须修复（影响核心逻辑）
- 工作流收敛检测必须实现（避免资源浪费）
- GLM-4.7集成必须完成（商业价值核心）
- 测试覆盖率必须≥80%（生产就绪要求）

### Must NOT Have (Guardrails)
- **不升级Bun版本或现有依赖**：避免引入破坏性变更
- **不修改Agent输出schema**：保持向后兼容（`{conclusion, evidence, risks, suggestions, falsifiable}`）
- **不改变MCP协议接口**：现有3个工具不变（`reasoning`, `query_agent`, `validate_model`）
- **不实现P3任务**：明确排除（TypeScript 5.0迁移、Web UI、并行优化）
- **不引入新的外部监控依赖**：使用Pino日志，不接入Prometheus/Grafana
- **不修改package.json的module字段**：保持现有入口点配置

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.
>
> **FORBIDDEN** — acceptance criteria that require:
> - "用户手动测试..." / "User manually tests..."
> - "用户目视确认..." / "User visually confirms..."
> - "用户直接操作..." / "User directly interacts..."
> - "请用户验证..." / "Ask user to verify..."
> - ANY step where a human must perform an action
>
> **ALL verification is executed by the agent** using tools (Bash for bun test, interactive_bash for TUI, read for file checks). No exceptions.

### Test Decision
- **Infrastructure exists**: YES（Bun原生测试）
- **Automated tests**: Tests-after（实现后补测试）
- **Framework**: Bun Test（内置，零配置）

### If Tests-After Enabled

每个实现任务的结构：

**Task Structure:**
1. **IMPLEMENT**: 实现功能
   - 编写代码
   - 验证：代码可运行，无语法错误
2. **TEST**: 补充测试
   - 测试文件: `src/__tests__/[module].test.ts`
   - 测试命令: `bun test src/__tests__/[module].test.ts`
   - 期望：所有测试通过，覆盖率符合目标
3. **VERIFY**: 集成验证
   - 命令: `bun test` （全项目）
   - 期望：无回归，覆盖率不降低

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> Whether TDD is enabled or not, EVERY task MUST include Agent-Executed QA Scenarios.
> - **With Tests-after**: QA scenarios complement unit tests at integration level
> - QA scenarios describe how the executing agent DIRECTLY verifies the deliverable
> by running it — executing commands, checking outputs, validating files.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **Bug修复** | Bash | Run `bun test [specific-test]`, assert pass |
| **LLM集成** | Bash | Run example script, assert real API call, validate response structure |
| **测试文件** | Bash | Run `bun test --coverage`, assert coverage ≥target% |
| **配置文件** | Bash | Run `bun run lint`, assert zero warnings |
| **日志系统** | Bash | Import logger, call methods, assert log files created |
| **文档** | read | Read file, grep for expected content, assert present |

**Each Scenario MUST Follow This Format:**

```
Scenario: [Descriptive name — what functionality is being verified]
  Tool: [Bash / interactive_bash / read]
  Preconditions: [What must be true before this scenario runs]
  Steps:
    1. [Exact command/action with specific parameters]
    2. [Next action with expected intermediate state]
    3. [Assertion with exact expected value]
  Expected Result: [Concrete, observable outcome]
  Failure Indicators: [What would indicate failure]
  Evidence: [Output capture / file path / command exit code]
```

**Scenario Detail Requirements:**
- **Commands**: Exact shell commands (not pseudo-code)
- **Data**: Concrete test data (`GLM_API_KEY=test-key-123`, not `[api-key]`)
- **Assertions**: Exact values (`exit code 0`, not "verify it works")
- **Evidence Paths**: Specific outputs (`.sisyphus/evidence/task-N-scenario.log`)

**Anti-patterns (NEVER write scenarios like this):**
- ❌ "验证冲突检测正确工作"
- ❌ "检查API返回正确数据"
- ❌ "测试日志功能"

**Write scenarios like this instead:**
- ✅ `cd /project && bun test src/__tests__/conflict-resolver.test.ts → Assert exit code 0 → Assert output contains "3 passed" → Capture output to .sisyphus/evidence/task-1-conflict-test.log`
- ✅ `GLM_API_KEY=sk-test bun run examples/test-llm.ts → Assert stdout contains "response from GLM-4.7" → Assert no "simulateAICall" in output → Capture to .sisyphus/evidence/task-4-llm-integration.log`
- ✅ `bun test --coverage → Assert output matches /All files.*80/ → Capture coverage report to .sisyphus/evidence/task-5-coverage.log`

---

## Execution Strategy

### Parallel Execution Waves

> 最大化吞吐量，通过将独立任务分组到并行波次中。
> 每个波次完成后才开始下一个波次。

```
Phase 1 - P0修复 (Start Immediately):
├── Task 1: 修复冲突检测正则bug [2h]
└── Task 2: 实现工作流收敛检测 [4h]
   ⏱ Wave Duration: 4h (parallel) → Sequential: 6h
   💡 Speedup: 33%

Phase 2 - P1高优先级 (After Phase 1):
├── Task 3: GLM-4.7 SDK集成 [8h]
├── Task 4: 替换模拟AI调用 [12h] (depends: Task 3)
├── Task 5: E2E测试修复 [8h]
├── Task 6: 单元测试补充 [16h]
└── Task 7: ESLint + Prettier配置 [4h]
   ⏱ Wave Duration: 48h (sequential 3+4, rest parallel)
   💡 Critical Path: Task 3 → Task 4 (20h)

Phase 3 - P2中优先级 (After Phase 2):
├── Task 8: Pino日志系统 [8h]
├── Task 9: 错误处理标准化 [8h]
└── Task 10: 文档一致性修复 [2h]
   ⏱ Wave Duration: 8h (parallel) → Sequential: 18h
   💡 Speedup: 56%

Critical Path: Phase 1 (4h) → Task 3 (8h) → Task 4 (12h) → Phase 3 (8h) = 32h
Parallel Total: 60h
Sequential Total: 92h
Overall Speedup: 35%
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | None | 2 |
| 2 | None | None | 1 |
| 3 | 1, 2 | 4 | 5, 6, 7 |
| 4 | 3 | None | 5, 6, 7 |
| 5 | 1, 2 | None | 3, 6, 7 |
| 6 | 1, 2 | None | 3, 5, 7 |
| 7 | None | None | 3, 4, 5, 6 |
| 8 | 4 | None | 9, 10 |
| 9 | 4 | None | 8, 10 |
| 10 | None | None | 8, 9 |

### Agent Dispatch Summary

| Phase | Tasks | Recommended Agents |
|-------|-------|-------------------|
| 1 | 1-2 | category="visual-engineering", skills=["code-review", "git-master"], run_in_background=false |
| 2 | 3-7 | 根据任务类型分派：<br>- Task 3-4: category="visual-engineering", skills=["Research", "git-master"]<br>- Task 5-6: category="visual-engineering", skills=["code-review", "git-master"]<br>- Task 7: category="quick", skills=["git-master"] |
| 3 | 8-10 | category="visual-engineering", skills=["code-review", "git-master"], 可并行分派 |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info.

### Phase 1: P0关键阻塞修复

- [x] 1. 修复冲突检测正则表达式bug

  **What to do**:
  - 打开 `src/workflow/conflict-resolver.ts:29`
  - 定位当前冲突检测逻辑：
    ```typescript
    const conflictingAgents = outputs.filter(output => {
      return output.falsifiable.some(claim => 
        // 当前正则有bug，无法正确匹配
        /contradiction|disagree|conflict/.test(claim)
      );
    });
    ```
  - 修复正则表达式，确保能匹配到实际的冲突关键词
  - 添加对 `conclusion` 字段的检查（不只检查 `falsifiable`）
  - 编写单元测试：`src/__tests__/conflict-resolver.test.ts`
    - 测试用例1：有冲突的代理输出 → 应检测到冲突
    - 测试用例2：无冲突的代理输出 → 应返回空数组
    - 测试用例3：边界情况（空输出、缺失字段）

  **Must NOT do**:
  - 不修改冲突检测的整体逻辑（只修复正则）
  - 不改变函数签名 `detectConflicts(outputs: AgentOutput[]): Conflict[]`
  - 不引入新的依赖包

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`（个人项目开发，代码专精模型）
    - Reason: Bug修复任务，需要精确理解代码逻辑和TypeScript类型
  - **Skills**: [`code-review`, `git-master`]
    - `code-review`: 评估修复后的代码质量，确保无回归
    - `git-master`: 原子提交，精确描述bug修复内容
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 无UI交互，纯后端逻辑
    - `playwright`: 无浏览器验证需求

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Phase 1, Wave 1（与Task 2并行）
  - **Blocks**: Task 3, 4, 5, 6（Phase 2所有任务依赖P0修复）
  - **Blocked By**: None（可立即开始）

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/workflow/conflict-resolver.ts:3-50` - 当前冲突检测完整实现（需理解上下文）
  - `src/types.ts:88-95` - `AgentOutput` 接口定义（包含 `falsifiable` 和 `conclusion` 字段）
  - `src/types.ts:97-103` - `Conflict` 接口定义（返回值结构）

  **API/Type References** (contracts to implement against):
  - `src/types.ts:AgentOutput` - 输入参数类型（必须理解每个字段含义）
  - `src/types.ts:Conflict` - 返回值类型（必须包含 `agents`, `type`, `description`）

  **Test References** (testing patterns to follow):
  - `src/__tests__/agent-executor.test.ts:15-45` - Mock数据模式（参考如何构造 `AgentOutput`）
  - `src/__tests__/orchestrator.test.ts:60-80` - 异步测试模式（如何测试工作流函数）

  **Documentation References** (specs and requirements):
  - `docs/DEEP-ANALYSIS-REPORT.md:L156-L165` - Bug描述和影响范围
  - `src/workflow/AGENTS.md:L25-L30` - 冲突检测的预期行为

  **External References** (libraries and frameworks):
  - MDN JavaScript RegExp: `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp` - 正则表达式语法
  - TypeScript Array.filter: `https://www.typescriptlang.org/docs/handbook/2/generics.html#working-with-generic-type-variables` - 类型安全的过滤

  **WHY Each Reference Matters** (explain the relevance):
  - `conflict-resolver.ts:3-50`: 修复的上下文，必须理解整个函数逻辑，不能只改正则
  - `types.ts:AgentOutput`: 理解输入数据结构，确保正则匹配的字段存在
  - `DEEP-ANALYSIS-REPORT.md`: 理解bug的根本原因和预期修复效果
  - Mock数据模式: 编写测试时需要构造真实的 `AgentOutput` 对象

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.

  **Tests-after (tests enabled):**
  - [ ] Test file created: `src/__tests__/conflict-resolver.test.ts`
  - [ ] Test covers: 有冲突输出 → 检测到冲突
  - [ ] Test covers: 无冲突输出 → 返回空数组
  - [ ] Test covers: 边界情况（空输出、缺失字段）
  - [ ] `bun test src/__tests__/conflict-resolver.test.ts` → PASS（≥3 tests, 0 failures）

  **Agent-Executed QA Scenarios (MANDATORY):**

  ```
  Scenario: 修复后冲突检测正确识别冲突
    Tool: Bash
    Preconditions: 代码已修复，测试文件已创建
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun test src/__tests__/conflict-resolver.test.ts
      3. Assert: exit code 0
      4. Assert: stdout contains "3 passed" or "4 passed"
      5. Assert: stdout does NOT contain "FAIL"
      6. Capture: stdout to .sisyphus/evidence/task-1-conflict-test.log
    Expected Result: 所有冲突检测测试通过
    Failure Indicators: 退出码非零、输出包含"FAIL"、测试用例少于3个
    Evidence: .sisyphus/evidence/task-1-conflict-test.log

  Scenario: 修复后无回归（全项目测试通过）
    Tool: Bash
    Preconditions: Task 1完成
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun test
      3. Assert: exit code 0
      4. Assert: stdout contains "test" and "passed"
      5. Capture: stdout to .sisyphus/evidence/task-1-no-regression.log
    Expected Result: 全项目测试无回归
    Failure Indicators: 任何测试失败
    Evidence: .sisyphus/evidence/task-1-no-regression.log

  Scenario: 代码符合TypeScript类型检查
    Tool: Bash
    Preconditions: 代码已修复
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun run typecheck (或 bunx tsc --noEmit)
      3. Assert: exit code 0
      4. Assert: stdout does NOT contain "error TS"
      5. Capture: stdout to .sisyphus/evidence/task-1-typecheck.log
    Expected Result: 无TypeScript类型错误
    Failure Indicators: 输出包含"error TS"
    Evidence: .sisyphus/evidence/task-1-typecheck.log
  ```

  **Evidence to Capture:**
  - [ ] 测试输出: `.sisyphus/evidence/task-1-conflict-test.log`
  - [ ] 无回归验证: `.sisyphus/evidence/task-1-no-regression.log`
  - [ ] 类型检查: `.sisyphus/evidence/task-1-typecheck.log`

  **Commit**: YES
  - Message: `fix(workflow): 修复冲突检测正则表达式bug`
  - Files: `src/workflow/conflict-resolver.ts`, `src/__tests__/conflict-resolver.test.ts`
  - Pre-commit: `bun test src/__tests__/conflict-resolver.test.ts`

---

- [x] 2. 实现工作流收敛检测

  **What to do**:
  - 打开 `src/workflow/orchestrator.ts:140`（当前迭代逻辑位置）
  - 在 `runWorkflow` 函数中添加收敛检测逻辑：
    - 检测条件：连续两次迭代的 `agentOutputs` 差异 < 阈值（如结论相似度 >90%）
    - 提前终止：如果检测到收敛，停止迭代
  - 添加配置项：`maxIterations`（默认3）、`convergenceThreshold`（默认0.9）
  - 更新类型定义：在 `src/types.ts` 中添加 `WorkflowConfig` 接口
  - 编写单元测试：`src/__tests__/orchestrator.test.ts`（扩展现有文件）
    - 测试用例1：收敛场景 → 应提前终止
    - 测试用例2：不收敛场景 → 应达到maxIterations
    - 测试用例3：配置项生效验证

  **Must NOT do**:
  - 不修改现有的6步工作流结构
  - 不改变 `runWorkflow` 函数签名（可添加可选参数）
  - 不引入复杂的相似度算法（使用简单字符串匹配即可）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 核心逻辑实现，需要理解工作流编排器的架构
  - **Skills**: [`code-review`, `git-master`]
    - `code-review`: 确保收敛检测逻辑不破坏现有工作流
    - `git-master`: 原子提交，清晰描述新功能
  - **Skills Evaluated but Omitted**:
    - `Research`: 收敛检测算法简单，无需外部研究

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Phase 1, Wave 1（与Task 1并行）
  - **Blocks**: Task 3, 4, 5, 6（Phase 2所有任务依赖P0修复）
  - **Blocked By**: None（可立即开始）

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References**:
  - `src/workflow/orchestrator.ts:14-298` - 完整工作流编排逻辑（必须理解整体结构）
  - `src/workflow/orchestrator.ts:140-180` - 当前迭代逻辑（需在此处添加收敛检测）
  - `src/types.ts:26-36` - `SocialSystemModel` 结构（用于比较两次迭代结果）

  **API/Type References**:
  - `src/types.ts:AgentOutput` - 代理输出结构（收敛检测的比较对象）
  - `src/types.ts:Hypothesis` - 输入假设（可能需要添加配置字段）

  **Test References**:
  - `src/__tests__/orchestrator.test.ts:1-100` - 现有编排器测试（扩展此文件）

  **Documentation References**:
  - `docs/DEEP-ANALYSIS-REPORT.md:L166-L172` - 收敛检测需求描述
  - `src/workflow/AGENTS.md:L15-L20` - 6步工作流说明

  **External References**:
  - Levenshtein Distance简单实现: `https://en.wikipedia.org/wiki/Levenshtein_distance` - 字符串相似度计算

  **WHY Each Reference Matters**:
  - `orchestrator.ts:140-180`: 收敛检测必须插入到迭代逻辑中，理解上下文至关重要
  - `AgentOutput` 结构: 需要比较 `conclusion` 字段的变化
  - 现有测试: 扩展测试文件，保持测试风格一致

  **Acceptance Criteria**:

  **Tests-after:**
  - [ ] Test file updated: `src/__tests__/orchestrator.test.ts`（新增≥3个测试用例）
  - [ ] Test covers: 收敛场景 → 提前终止
  - [ ] Test covers: 不收敛场景 → 达到maxIterations
  - [ ] `bun test src/__tests__/orchestrator.test.ts` → PASS（新增测试通过）

  **Agent-Executed QA Scenarios (MANDATORY):**

  ```
  Scenario: 收敛检测提前终止工作流
    Tool: Bash
    Preconditions: 收敛检测已实现，测试已编写
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun test src/__tests__/orchestrator.test.ts --test-name-pattern="convergence"
      3. Assert: exit code 0
      4. Assert: stdout contains "convergence" and "passed"
      5. Capture: stdout to .sisyphus/evidence/task-2-convergence-test.log
    Expected Result: 收敛检测测试通过
    Failure Indicators: 测试失败或未找到测试用例
    Evidence: .sisyphus/evidence/task-2-convergence-test.log

  Scenario: 工作流可配置收敛参数
    Tool: read
    Preconditions: 代码已实现
    Steps:
      1. Read: src/types.ts
      2. Assert: content contains "WorkflowConfig"
      3. Assert: content contains "maxIterations"
      4. Assert: content contains "convergenceThreshold"
      5. Read: src/workflow/orchestrator.ts
      6. Assert: content contains "config.maxIterations" or similar usage
    Expected Result: 配置接口已定义并使用
    Failure Indicators: 类型定义缺失或未在代码中使用
    Evidence: 文件内容验证

  Scenario: 无回归（全项目测试通过）
    Tool: Bash
    Preconditions: Task 2完成
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun test
      3. Assert: exit code 0
      4. Capture: stdout to .sisyphus/evidence/task-2-no-regression.log
    Expected Result: 全项目测试无回归
    Failure Indicators: 任何测试失败
    Evidence: .sisyphus/evidence/task-2-no-regression.log
  ```

  **Evidence to Capture:**
  - [ ] 收敛测试: `.sisyphus/evidence/task-2-convergence-test.log`
  - [ ] 无回归验证: `.sisyphus/evidence/task-2-no-regression.log`

  **Commit**: YES
  - Message: `feat(workflow): 实现工作流收敛检测`
  - Files: `src/workflow/orchestrator.ts`, `src/types.ts`, `src/__tests__/orchestrator.test.ts`
  - Pre-commit: `bun test src/__tests__/orchestrator.test.ts`

---

### Phase 2: P1高优先级改进

- [x] 3. GLM-4.7 SDK集成

  **What to do**:
  - 安装官方SDK：`bun add @zhipuai/sdk`
  - 创建配置文件：`src/config/llm.ts`
    - 导出 `LLMConfig` 接口
    - 读取环境变量 `GLM_API_KEY`
    - 提供默认配置（模型: `glm-4-flash`, 温度: `0.7`）
  - 创建LLM客户端包装器：`src/utils/llm-client.ts`
    - 初始化ZhipuAI客户端
    - 提供 `callLLM(prompt: string): Promise<string>` 方法
    - 错误处理：API key缺失、网络错误、rate limit
  - 编写单元测试：`src/__tests__/llm-client.test.ts`
    - Mock API调用，测试成功和失败场景

  **Must NOT do**:
  - 不在此任务中替换 `simulateAICall`（留给Task 4）
  - 不修改现有代理逻辑
  - 不引入OpenAI SDK或其他LLM SDK

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 第三方SDK集成，需要阅读官方文档
  - **Skills**: [`Research`, `git-master`]
    - `Research`: 查阅GLM-4.7官方文档和SDK用法
    - `git-master`: 独立提交SDK集成

  **Parallelization**:
  - **Can Run In Parallel**: YES（与Task 5, 6, 7并行）
  - **Parallel Group**: Phase 2, Wave 1
  - **Blocks**: Task 4（必须先集成SDK才能替换模拟调用）
  - **Blocked By**: Task 1, 2（P0修复完成后开始）

  **References**:

  **Pattern References**:
  - `src/agents/agent-executor.ts:180-220` - 当前 `simulateAICall` 实现（了解接口但不修改）
  - `src/types.ts:110-120` - Agent相关类型（了解数据结构）

  **API/Type References**:
  - GLM-4 API文档: `https://open.bigmodel.cn/dev/api` - 官方API参考
  - @zhipuai/sdk文档: `https://www.npmjs.com/package/@zhipuai/sdk` - TypeScript SDK用法

  **Test References**:
  - `src/__tests__/agent-executor.test.ts` - Mock模式参考

  **External References**:
  - GLM-4模型列表: `https://open.bigmodel.cn/dev/howuse/model` - 可用模型和定价
  - Bun环境变量: `https://bun.sh/docs/runtime/env` - 如何读取 `process.env`

  **WHY Each Reference Matters**:
  - GLM-4 API文档: 理解请求/响应格式，确保SDK调用正确
  - `simulateAICall`: 理解现有接口，保持兼容性
  - Bun环境变量: 配置管理的最佳实践

  **Acceptance Criteria**:

  **Tests-after:**
  - [ ] 依赖安装: `package.json` 包含 `"@zhipuai/sdk": "^1.x.x"`
  - [ ] 配置文件: `src/config/llm.ts` 创建，导出 `LLMConfig`
  - [ ] 客户端包装: `src/utils/llm-client.ts` 创建，导出 `callLLM`
  - [ ] Test file: `src/__tests__/llm-client.test.ts` 创建，≥3测试用例
  - [ ] `bun test src/__tests__/llm-client.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: GLM SDK成功安装
    Tool: Bash
    Preconditions: 已执行 bun add @zhipuai/sdk
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. cat package.json | grep "@zhipuai/sdk"
      3. Assert: output contains "@zhipuai/sdk"
      4. bun pm ls | grep "@zhipuai/sdk"
      5. Assert: exit code 0
      6. Capture: output to .sisyphus/evidence/task-3-sdk-install.log
    Expected Result: SDK出现在依赖列表中
    Failure Indicators: grep未找到或bun pm ls失败
    Evidence: .sisyphus/evidence/task-3-sdk-install.log

  Scenario: LLM配置文件正确导出
    Tool: read
    Preconditions: src/config/llm.ts已创建
    Steps:
      1. Read: src/config/llm.ts
      2. Assert: content contains "export interface LLMConfig"
      3. Assert: content contains "GLM_API_KEY"
      4. Assert: content contains "glm-4-flash" or similar model name
    Expected Result: 配置文件结构正确
    Failure Indicators: 缺少接口定义或环境变量引用
    Evidence: 文件内容验证

  Scenario: LLM客户端测试通过
    Tool: Bash
    Preconditions: 测试文件已创建
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun test src/__tests__/llm-client.test.ts
      3. Assert: exit code 0
      4. Assert: stdout contains "3 passed" or more
      5. Capture: stdout to .sisyphus/evidence/task-3-llm-test.log
    Expected Result: LLM客户端测试通过
    Failure Indicators: 测试失败或测试数量不足
    Evidence: .sisyphus/evidence/task-3-llm-test.log
  ```

  **Evidence to Capture:**
  - [ ] SDK安装: `.sisyphus/evidence/task-3-sdk-install.log`
  - [ ] 测试输出: `.sisyphus/evidence/task-3-llm-test.log`

  **Commit**: YES
  - Message: `feat(llm): 集成GLM-4.7 SDK和配置管理`
  - Files: `package.json`, `src/config/llm.ts`, `src/utils/llm-client.ts`, `src/__tests__/llm-client.test.ts`
  - Pre-commit: `bun test src/__tests__/llm-client.test.ts`

---

- [x] 4. 替换模拟AI调用为真实GLM-4.7调用

  **What to do**:
  - 修改 `src/agents/agent-executor.ts`：
    - 删除 `simulateAICall()` 函数
    - 在 `executeAgent()` 中调用 `callLLM()`（从Task 3的 `llm-client.ts` 导入）
    - 添加Fallback机制：如果 `GLM_API_KEY` 未设置，回退到模拟模式（保留旧逻辑用于测试）
  - 更新提示模板：`src/agents/prompts/*.md` - 优化为GLM-4.7的格式（如有必要）
  - 创建示例脚本：`examples/test-llm-integration.ts`
    - 运行一个完整的工作流，验证真实LLM调用
  - 编写集成测试：`src/__tests__/integration/llm-workflow.test.ts`
    - 测试完整工作流使用真实LLM（需要API key）
    - 使用环境变量控制：`ENABLE_LLM_TEST=1`

  **Must NOT do**:
  - 不修改Agent输出schema（保持 `{conclusion, evidence, risks, suggestions, falsifiable}`）
  - 不删除模拟模式（作为Fallback保留）
  - 不在没有API key时测试失败（应优雅降级）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 核心逻辑重构，需要保持向后兼容
  - **Skills**: [`code-review`, `git-master`]
    - `code-review`: 确保重构无破坏性变更
    - `git-master`: 清晰提交重构历史

  **Parallelization**:
  - **Can Run In Parallel**: YES（与Task 5, 6, 7并行）
  - **Parallel Group**: Phase 2, Wave 2
  - **Blocks**: Task 8, 9（监控和错误处理需要真实LLM调用）
  - **Blocked By**: Task 3（必须先集成SDK）

  **References**:

  **Pattern References**:
  - `src/agents/agent-executor.ts:180-220` - 当前 `simulateAICall`（需替换）
  - `src/agents/agent-executor.ts:50-100` - `executeAgent` 主逻辑（调用处）
  - `src/utils/llm-client.ts` - Task 3创建的LLM客户端（导入使用）

  **API/Type References**:
  - `src/types.ts:AgentOutput` - 输出格式（必须保持不变）
  - `src/types.ts:AgentType` - 7种代理类型

  **Test References**:
  - `src/__tests__/agent-executor.test.ts` - 现有单元测试（需更新Mock）

  **Documentation References**:
  - `src/agents/prompts/*.md` - 7个代理的提示模板（可能需微调）
  - `docs/DEEP-ANALYSIS-REPORT.md:L140-L150` - LLM集成需求

  **External References**:
  - GLM-4 Prompt Engineering: `https://open.bigmodel.cn/dev/howuse/prompts` - 提示优化指南

  **WHY Each Reference Matters**:
  - `agent-executor.ts`: 核心重构位置，必须完全理解代码流程
  - `AgentOutput`: 输出格式不能改变，这是向后兼容的关键
  - 提示模板: 不同LLM对提示的理解不同，可能需微调

  **Acceptance Criteria**:

  **Tests-after:**
  - [ ] `simulateAICall` 已移除或标记为Fallback
  - [ ] `executeAgent` 调用 `callLLM()`
  - [ ] Fallback机制: 无API key时自动使用模拟模式
  - [ ] 示例脚本: `examples/test-llm-integration.ts` 可运行
  - [ ] 集成测试: `src/__tests__/integration/llm-workflow.test.ts` 创建
  - [ ] `ENABLE_LLM_TEST=1 bun test src/__tests__/integration/` → PASS（需API key）

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: 真实LLM调用成功（需API key）
    Tool: Bash
    Preconditions: GLM_API_KEY已设置，代码已修改
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. export GLM_API_KEY="[user-provided-key]"
      3. bun run examples/test-llm-integration.ts
      4. Assert: exit code 0
      5. Assert: stdout contains "GLM-4" or "response from"
      6. Assert: stdout does NOT contain "simulateAICall" or "mock"
      7. Capture: stdout to .sisyphus/evidence/task-4-real-llm-call.log
    Expected Result: 真实LLM调用成功，输出包含真实响应
    Failure Indicators: 输出仍显示模拟调用，或API调用失败
    Evidence: .sisyphus/evidence/task-4-real-llm-call.log

  Scenario: Fallback机制生效（无API key）
    Tool: Bash
    Preconditions: 代码已修改，未设置API key
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. unset GLM_API_KEY
      3. bun run examples/test-llm-integration.ts
      4. Assert: exit code 0
      5. Assert: stdout contains "fallback" or "simulate" or "mock"
      6. Assert: process did NOT crash
      7. Capture: stdout to .sisyphus/evidence/task-4-fallback.log
    Expected Result: 无API key时优雅降级到模拟模式
    Failure Indicators: 进程崩溃或抛出异常
    Evidence: .sisyphus/evidence/task-4-fallback.log

  Scenario: 集成测试通过（需API key）
    Tool: Bash
    Preconditions: 集成测试已编写，API key已设置
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. export GLM_API_KEY="[user-provided-key]"
      3. export ENABLE_LLM_TEST=1
      4. bun test src/__tests__/integration/llm-workflow.test.ts
      5. Assert: exit code 0
      6. Assert: stdout contains "passed"
      7. Capture: stdout to .sisyphus/evidence/task-4-integration-test.log
    Expected Result: 集成测试通过，工作流使用真实LLM
    Failure Indicators: 测试失败或API调用错误
    Evidence: .sisyphus/evidence/task-4-integration-test.log
  ```

  **Evidence to Capture:**
  - [ ] 真实LLM调用: `.sisyphus/evidence/task-4-real-llm-call.log`
  - [ ] Fallback验证: `.sisyphus/evidence/task-4-fallback.log`
  - [ ] 集成测试: `.sisyphus/evidence/task-4-integration-test.log`

  **Commit**: YES
  - Message: `feat(agents): 替换模拟AI调用为真实GLM-4.7调用`
  - Files: `src/agents/agent-executor.ts`, `examples/test-llm-integration.ts`, `src/__tests__/integration/llm-workflow.test.ts`
  - Pre-commit: `bun test src/__tests__/agent-executor.test.ts`

---

- [x] 5. 修复E2E测试超时问题

  **What to do**:
  - 定位E2E测试文件：`src/__tests__/e2e/*.test.ts`（或类似路径）
  - 分析超时原因：
    - 检查是否等待模拟延迟（`simulateAICall` 的100-600ms延迟）
    - 检查是否缺少异步等待（未await Promise）
    - 检查测试超时配置（Bun默认5秒）
  - 修复方案：
    - 减少模拟延迟（测试环境用0ms延迟）
    - 增加测试超时限制（如10秒）：`test("...", async () => {...}, 10000)`
    - 添加必要的 `await` 语句
  - 验证所有E2E测试通过

  **Must NOT do**:
  - 不删除E2E测试（必须修复而非移除）
  - 不跳过超时测试（使用 `test.skip`）
  - 不修改测试的核心逻辑（只修复超时问题）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 测试调试，需要理解异步逻辑
  - **Skills**: [`code-review`, `git-master`]
    - `code-review`: 审查测试代码质量
    - `git-master`: 独立提交测试修复

  **Parallelization**:
  - **Can Run In Parallel**: YES（与Task 3, 6, 7并行）
  - **Parallel Group**: Phase 2, Wave 1
  - **Blocks**: None
  - **Blocked By**: Task 1, 2（P0修复后开始）

  **References**:

  **Pattern References**:
  - `src/__tests__/e2e/*.test.ts` - 当前E2E测试文件（需定位）
  - `src/__tests__/orchestrator.test.ts` - 异步测试模式参考

  **API/Type References**:
  - Bun Test API: `https://bun.sh/docs/cli/test` - 超时配置
  - Bun Test Timeout: `test(name, fn, timeout)` - 第三个参数

  **Test References**:
  - `src/__tests__/agent-executor.test.ts:30-50` - Mock异步调用模式

  **Documentation References**:
  - `docs/DEEP-ANALYSIS-REPORT.md:L120-L130` - E2E测试问题描述
  - `CLAUDE.md:L50-L60` - Bun测试约定

  **WHY Each Reference Matters**:
  - E2E测试文件: 直接修复对象
  - Bun Test API: 了解如何正确配置超时
  - 深度分析报告: 理解问题根源

  **Acceptance Criteria**:

  **Tests-after:**
  - [ ] 所有E2E测试文件已修复
  - [ ] `bun test src/__tests__/e2e/` → PASS（无超时）
  - [ ] 测试执行时间 < 10秒（总时长）

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: E2E测试全部通过
    Tool: Bash
    Preconditions: E2E测试已修复
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun test src/__tests__/e2e/
      3. Assert: exit code 0
      4. Assert: stdout contains "passed"
      5. Assert: stdout does NOT contain "timeout" or "FAIL"
      6. Capture: stdout to .sisyphus/evidence/task-5-e2e-pass.log
    Expected Result: 所有E2E测试通过，无超时
    Failure Indicators: 任何测试失败或超时
    Evidence: .sisyphus/evidence/task-5-e2e-pass.log

  Scenario: E2E测试执行时间合理
    Tool: Bash
    Preconditions: E2E测试已修复
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. time bun test src/__tests__/e2e/
      3. Assert: 执行时间 < 10秒（从time输出提取）
      4. Capture: time output to .sisyphus/evidence/task-5-e2e-time.log
    Expected Result: E2E测试快速完成
    Failure Indicators: 执行时间超过10秒
    Evidence: .sisyphus/evidence/task-5-e2e-time.log
  ```

  **Evidence to Capture:**
  - [ ] E2E测试通过: `.sisyphus/evidence/task-5-e2e-pass.log`
  - [ ] 执行时间: `.sisyphus/evidence/task-5-e2e-time.log`

  **Commit**: YES
  - Message: `fix(test): 修复E2E测试超时问题`
  - Files: `src/__tests__/e2e/*.test.ts`
  - Pre-commit: `bun test src/__tests__/e2e/`

---

- [x] 6. 补充单元测试至80%覆盖率

  **What to do**:
  - 运行覆盖率检查：`bun test --coverage`
  - 识别未覆盖的模块：
    - `src/workflow/conflict-resolver.ts`
    - `src/agents/agent-factory.ts`
    - `src/utils/*.ts`
  - 为每个未覆盖模块编写单元测试：
    - `src/__tests__/conflict-resolver.test.ts`（扩展Task 1的测试）
    - `src/__tests__/agent-factory.test.ts`
    - `src/__tests__/utils/*.test.ts`
  - 测试覆盖重点：
    - 边界条件（空输入、null值）
    - 错误处理（异常抛出、错误恢复）
    - 所有导出函数的正常和异常路径
  - 验证覆盖率达到80%+

  **Must NOT do**:
  - 不写"无意义测试"（仅为覆盖率而不测试逻辑）
  - 不修改源代码以提高覆盖率（如移除未使用代码）
  - 不跳过难以测试的模块

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 大量测试编写，需要理解各模块功能
  - **Skills**: [`code-review`, `git-master`]
    - `code-review`: 确保测试质量而非数量
    - `git-master`: 分模块提交测试（可选：多次提交）

  **Parallelization**:
  - **Can Run In Parallel**: YES（与Task 3, 5, 7并行）
  - **Parallel Group**: Phase 2, Wave 1
  - **Blocks**: None
  - **Blocked By**: Task 1, 2（P0修复后开始）

  **References**:

  **Pattern References**:
  - `src/__tests__/agent-executor.test.ts` - 现有测试风格（保持一致）
  - `src/__tests__/orchestrator.test.ts` - 复杂逻辑测试参考

  **API/Type References**:
  - 所有 `src/` 目录下的源文件（需覆盖的代码）

  **Test References**:
  - Bun Test Coverage: `bun test --coverage` - 覆盖率报告

  **Documentation References**:
  - `docs/DEEP-ANALYSIS-REPORT.md:L110-L120` - 测试覆盖率目标

  **External References**:
  - Bun Test API: `https://bun.sh/docs/cli/test` - 测试编写指南

  **WHY Each Reference Matters**:
  - 现有测试: 保持项目测试风格一致
  - 覆盖率工具: 识别未覆盖代码
  - 源文件: 理解需要测试的功能

  **Acceptance Criteria**:

  **Tests-after:**
  - [ ] 新增测试文件: `src/__tests__/agent-factory.test.ts`, `src/__tests__/utils/*.test.ts`
  - [ ] `bun test --coverage` → 覆盖率 ≥80%
  - [ ] `bun test` → PASS（所有测试通过）

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: 测试覆盖率达到80%+
    Tool: Bash
    Preconditions: 所有单元测试已编写
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun test --coverage
      3. Assert: exit code 0
      4. Assert: stdout matches /All files.*8[0-9]/ or /All files.*9[0-9]/ (80%+)
      5. Capture: coverage report to .sisyphus/evidence/task-6-coverage.log
    Expected Result: 覆盖率≥80%
    Failure Indicators: 覆盖率低于80%
    Evidence: .sisyphus/evidence/task-6-coverage.log

  Scenario: 所有单元测试通过
    Tool: Bash
    Preconditions: 所有测试已编写
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun test
      3. Assert: exit code 0
      4. Assert: stdout contains "passed"
      5. Assert: 测试数量 ≥30（估算，基于新增测试）
      6. Capture: stdout to .sisyphus/evidence/task-6-all-tests.log
    Expected Result: 全项目测试通过
    Failure Indicators: 任何测试失败
    Evidence: .sisyphus/evidence/task-6-all-tests.log
  ```

  **Evidence to Capture:**
  - [ ] 覆盖率报告: `.sisyphus/evidence/task-6-coverage.log`
  - [ ] 全测试输出: `.sisyphus/evidence/task-6-all-tests.log`

  **Commit**: YES
  - Message: `test: 补充单元测试至80%覆盖率`
  - Files: `src/__tests__/*.test.ts` (多个新增/修改文件)
  - Pre-commit: `bun test --coverage`

---

- [x] 7. 添加ESLint和Prettier配置

  **What to do**:
  - 安装依赖：
    ```bash
    bun add -d eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
    bun add -d prettier eslint-config-prettier
    ```
  - 创建 `.eslintrc.json`：
    ```json
    {
      "parser": "@typescript-eslint/parser",
      "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier"
      ],
      "rules": {
        "no-console": "warn",
        "@typescript-eslint/no-explicit-any": "warn"
      }
    }
    ```
  - 创建 `.prettierrc.json`：
    ```json
    {
      "semi": true,
      "singleQuote": true,
      "tabWidth": 2,
      "trailingComma": "es5"
    }
    ```
  - 创建 `.eslintignore` 和 `.prettierignore`：
    - 排除：`node_modules/`, `dist/`, `coverage/`
  - 添加package.json scripts：
    ```json
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts"
    ```
  - 运行并修复所有linting错误：
    ```bash
    bun run lint:fix
    bun run format
    ```

  **Must NOT do**:
  - 不启用过于严格的规则（如 `no-any` → error）
  - 不修改现有代码风格（如分号/引号，除非统一格式化）
  - 不在CI中强制prettier检查（仅本地使用）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 配置任务，不涉及复杂逻辑
  - **Skills**: [`git-master`]
    - `git-master`: 单独提交配置文件

  **Parallelization**:
  - **Can Run In Parallel**: YES（与所有Phase 2任务并行）
  - **Parallel Group**: Phase 2, Wave 1
  - **Blocks**: None
  - **Blocked By**: None（可最早开始）

  **References**:

  **Pattern References**:
  - 无（配置任务）

  **API/Type References**:
  - ESLint Config: `https://eslint.org/docs/latest/use/configure/` - 配置指南
  - Prettier Config: `https://prettier.io/docs/en/configuration.html` - 配置选项

  **Test References**:
  - 无（配置任务）

  **Documentation References**:
  - `docs/DEEP-ANALYSIS-REPORT.md:L130-L140` - 代码规范需求

  **External References**:
  - TypeScript ESLint: `https://typescript-eslint.io/getting-started/` - 快速开始
  - ESLint + Prettier: `https://github.com/prettier/eslint-config-prettier` - 集成方式

  **WHY Each Reference Matters**:
  - 官方文档: 确保配置正确且最新
  - 深度分析报告: 理解为什么需要代码规范

  **Acceptance Criteria**:

  **Tests-after:**
  - [ ] 依赖安装: `package.json` 包含 `eslint`, `prettier`
  - [ ] 配置文件: `.eslintrc.json`, `.prettierrc.json` 创建
  - [ ] Scripts添加: `package.json` 包含 `lint`, `lint:fix`, `format`
  - [ ] `bun run lint` → 零告警或仅warning（无error）

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: ESLint配置生效
    Tool: Bash
    Preconditions: ESLint已安装和配置
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun run lint
      3. Assert: exit code 0 或 1（1表示有warning但无error）
      4. Assert: stdout does NOT contain "error" (仅warning可接受)
      5. Capture: stdout to .sisyphus/evidence/task-7-lint.log
    Expected Result: ESLint运行无error
    Failure Indicators: 退出码2（语法错误）或包含"error"
    Evidence: .sisyphus/evidence/task-7-lint.log

  Scenario: Prettier格式化成功
    Tool: Bash
    Preconditions: Prettier已安装和配置
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun run format
      3. Assert: exit code 0
      4. Assert: stdout contains "formatted" or no output (success)
      5. Capture: stdout to .sisyphus/evidence/task-7-format.log
    Expected Result: Prettier格式化完成
    Failure Indicators: 退出码非零或报错
    Evidence: .sisyphus/evidence/task-7-format.log

  Scenario: 配置文件存在且正确
    Tool: read
    Preconditions: 配置文件已创建
    Steps:
      1. Read: .eslintrc.json
      2. Assert: content contains "@typescript-eslint/parser"
      3. Read: .prettierrc.json
      4. Assert: content contains "singleQuote"
      5. Read: package.json
      6. Assert: scripts contains "lint"
    Expected Result: 所有配置文件正确
    Failure Indicators: 配置文件缺失或格式错误
    Evidence: 文件内容验证
  ```

  **Evidence to Capture:**
  - [ ] Lint输出: `.sisyphus/evidence/task-7-lint.log`
  - [ ] Format输出: `.sisyphus/evidence/task-7-format.log`

  **Commit**: YES
  - Message: `chore: 添加ESLint和Prettier代码规范配置`
  - Files: `.eslintrc.json`, `.prettierrc.json`, `.eslintignore`, `.prettierignore`, `package.json`, `src/**/*.ts`（格式化后）
  - Pre-commit: `bun run lint`

---

### Phase 3: P2中优先级完善

- [x] 8. 实现Pino日志系统

  **What to do**:
  - 安装Pino：`bun add pino pino-pretty`
  - 创建日志工具：`src/utils/logger.ts`
    - 配置Pino实例（level: `info`, prettyPrint: `true` in dev）
    - 导出 `logger` 对象（`logger.info`, `logger.error`, `logger.debug`）
  - 替换现有console.log：
    - 全局搜索 `console.log` → 替换为 `logger.info`
    - `console.error` → `logger.error`
    - `console.warn` → `logger.warn`
  - 配置日志输出：
    - 生产环境：JSON格式输出到stdout
    - 开发环境：pretty格式（彩色）
  - 编写测试：`src/__tests__/utils/logger.test.ts`
    - 测试不同log level输出
    - 测试日志格式正确

  **Must NOT do**:
  - 不集成外部日志服务（如Logstash、Datadog）
  - 不添加文件日志（仅stdout）
  - 不修改日志内容（保持原有log message）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 全局替换操作，需要仔细处理
  - **Skills**: [`code-review`, `git-master`]
    - `code-review`: 确保日志替换完整
    - `git-master`: 原子提交日志系统

  **Parallelization**:
  - **Can Run In Parallel**: YES（与Task 9, 10并行）
  - **Parallel Group**: Phase 3, Wave 1
  - **Blocks**: None
  - **Blocked By**: Task 4（需要真实LLM调用完成后再优化日志）

  **References**:

  **Pattern References**:
  - 搜索所有 `console.log` 位置（全局）

  **API/Type References**:
  - Pino API: `https://getpino.io/#/docs/api` - 日志方法
  - Pino-pretty: `https://github.com/pinojs/pino-pretty` - Pretty输出

  **Test References**:
  - `src/__tests__/utils/*.test.ts` - 工具函数测试模式

  **Documentation References**:
  - `docs/DEEP-ANALYSIS-REPORT.md:L173-L180` - 日志需求

  **External References**:
  - Pino Getting Started: `https://getpino.io/#/docs/help?id=getting-started` - 快速开始

  **WHY Each Reference Matters**:
  - 全局console搜索: 找到所有需替换的位置
  - Pino API: 了解正确的日志方法
  - 深度分析报告: 理解日志系统的目的

  **Acceptance Criteria**:

  **Tests-after:**
  - [ ] 依赖安装: `package.json` 包含 `pino`, `pino-pretty`
  - [ ] 日志工具: `src/utils/logger.ts` 创建
  - [ ] 全局替换: `grep -r "console.log" src/` 返回空（或仅在测试中）
  - [ ] 测试文件: `src/__tests__/utils/logger.test.ts` 创建
  - [ ] `bun test src/__tests__/utils/logger.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: Pino日志工具正确创建
    Tool: read
    Preconditions: logger.ts已创建
    Steps:
      1. Read: src/utils/logger.ts
      2. Assert: content contains "import pino"
      3. Assert: content contains "export const logger"
      4. Assert: content contains "logger.info" or similar methods
    Expected Result: 日志工具导出正确
    Failure Indicators: 缺少导出或未配置Pino
    Evidence: 文件内容验证

  Scenario: console.log全部替换
    Tool: Bash
    Preconditions: 全局替换已完成
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. grep -r "console.log" src/ --exclude-dir=__tests__
      3. Assert: exit code 1 (no matches) 或 output为空
      4. Capture: output to .sisyphus/evidence/task-8-console-check.log
    Expected Result: 源代码中无console.log（测试除外）
    Failure Indicators: 仍有console.log残留
    Evidence: .sisyphus/evidence/task-8-console-check.log

  Scenario: 日志系统测试通过
    Tool: Bash
    Preconditions: 测试已编写
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun test src/__tests__/utils/logger.test.ts
      3. Assert: exit code 0
      4. Assert: stdout contains "passed"
      5. Capture: stdout to .sisyphus/evidence/task-8-logger-test.log
    Expected Result: 日志测试通过
    Failure Indicators: 测试失败
    Evidence: .sisyphus/evidence/task-8-logger-test.log
  ```

  **Evidence to Capture:**
  - [ ] console检查: `.sisyphus/evidence/task-8-console-check.log`
  - [ ] 日志测试: `.sisyphus/evidence/task-8-logger-test.log`

  **Commit**: YES
  - Message: `feat(logging): 实现Pino日志系统替换console.log`
  - Files: `package.json`, `src/utils/logger.ts`, `src/**/*.ts`（替换后），`src/__tests__/utils/logger.test.ts`
  - Pre-commit: `bun test src/__tests__/utils/logger.test.ts`

---

- [x] 9. 标准化错误处理

  **What to do**:
  - 创建错误类：`src/utils/error-handler.ts`
    - 定义自定义错误类：`AppError`, `ValidationError`, `LLMError`, `WorkflowError`
    - 每个错误类包含：`code`（错误码）、`message`、`details`
  - 创建错误码枚举：`src/types/error-codes.ts`
    - 定义错误码体系（如 `E001: INVALID_HYPOTHESIS`, `E002: LLM_API_FAILURE`）
  - 在关键位置添加错误处理：
    - `src/agents/agent-executor.ts` - LLM调用失败
    - `src/workflow/orchestrator.ts` - 工作流执行失败
    - `src/utils/llm-client.ts` - API调用失败
  - 统一错误日志格式（使用Pino）：
    ```typescript
    logger.error({ err, code, context }, "Error message");
    ```
  - 编写测试：`src/__tests__/utils/error-handler.test.ts`

  **Must NOT do**:
  - 不修改现有抛出的错误类型（兼容性）
  - 不在用户代码中使用error code（仅内部）
  - 不添加全局错误捕获（保持局部处理）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 错误处理重构，需要理解代码流程
  - **Skills**: [`code-review`, `git-master`]
    - `code-review`: 确保错误处理逻辑正确
    - `git-master`: 原子提交错误处理

  **Parallelization**:
  - **Can Run In Parallel**: YES（与Task 8, 10并行）
  - **Parallel Group**: Phase 3, Wave 1
  - **Blocks**: None
  - **Blocked By**: Task 4（需要真实LLM调用完成后再处理错误）

  **References**:

  **Pattern References**:
  - `src/agents/agent-executor.ts` - 当前错误处理方式
  - `src/workflow/orchestrator.ts` - 工作流错误处理

  **API/Type References**:
  - 无（自定义错误类）

  **Test References**:
  - `src/__tests__/utils/*.test.ts` - 工具函数测试模式

  **Documentation References**:
  - `docs/DEEP-ANALYSIS-REPORT.md:L173-L180` - 错误处理需求

  **External References**:
  - Node.js Error Best Practices: `https://www.joyent.com/node-js/production/design/errors` - 错误设计模式

  **WHY Each Reference Matters**:
  - 现有错误处理: 理解当前模式，保持向后兼容
  - 深度分析报告: 理解标准化的目的

  **Acceptance Criteria**:

  **Tests-after:**
  - [ ] 错误类: `src/utils/error-handler.ts` 创建，导出自定义Error类
  - [ ] 错误码: `src/types/error-codes.ts` 创建，定义错误码枚举
  - [ ] 关键位置错误处理已添加（至少3处）
  - [ ] 测试文件: `src/__tests__/utils/error-handler.test.ts` 创建
  - [ ] `bun test src/__tests__/utils/error-handler.test.ts` → PASS

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: 自定义错误类正确导出
    Tool: read
    Preconditions: error-handler.ts已创建
    Steps:
      1. Read: src/utils/error-handler.ts
      2. Assert: content contains "export class AppError"
      3. Assert: content contains "export class LLMError"
      4. Assert: content contains "code" and "message"
    Expected Result: 错误类结构正确
    Failure Indicators: 缺少错误类或字段
    Evidence: 文件内容验证

  Scenario: 错误码枚举已定义
    Tool: read
    Preconditions: error-codes.ts已创建
    Steps:
      1. Read: src/types/error-codes.ts
      2. Assert: content contains "export enum ErrorCode"
      3. Assert: content contains "INVALID_HYPOTHESIS" or similar codes
      4. Assert: 至少定义5个错误码
    Expected Result: 错误码枚举完整
    Failure Indicators: 错误码数量不足
    Evidence: 文件内容验证

  Scenario: 关键位置错误处理已添加
    Tool: Bash
    Preconditions: 错误处理已添加
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. grep -r "throw new AppError\|throw new LLMError" src/ | wc -l
      3. Assert: 输出数字 ≥3（至少3处使用）
      4. Capture: grep output to .sisyphus/evidence/task-9-error-usage.log
    Expected Result: 错误处理在关键位置使用
    Failure Indicators: 使用次数少于3
    Evidence: .sisyphus/evidence/task-9-error-usage.log

  Scenario: 错误处理测试通过
    Tool: Bash
    Preconditions: 测试已编写
    Steps:
      1. cd /Volumes/Model/Workspace/Skills/local/SocialGuessSkills
      2. bun test src/__tests__/utils/error-handler.test.ts
      3. Assert: exit code 0
      4. Assert: stdout contains "passed"
      5. Capture: stdout to .sisyphus/evidence/task-9-error-test.log
    Expected Result: 错误处理测试通过
    Failure Indicators: 测试失败
    Evidence: .sisyphus/evidence/task-9-error-test.log
  ```

  **Evidence to Capture:**
  - [ ] 错误使用检查: `.sisyphus/evidence/task-9-error-usage.log`
  - [ ] 错误测试: `.sisyphus/evidence/task-9-error-test.log`

  **Commit**: YES
  - Message: `feat(errors): 标准化错误处理和错误码体系`
  - Files: `src/utils/error-handler.ts`, `src/types/error-codes.ts`, `src/agents/agent-executor.ts`, `src/workflow/orchestrator.ts`, `src/__tests__/utils/error-handler.test.ts`
  - Pre-commit: `bun test src/__tests__/utils/error-handler.test.ts`

---

- [x] 10. 修复文档一致性

  **What to do**:
  - 修复 `AGENTS.md` 第68行：
    - 当前：`ANTI-PATTERNS (本项目): 无DO NOT/NEVER/ALWAYS注释：代码库中未发现`
    - 修改为：`ANTI-PATTERNS (本项目): 存在7处anti-pattern注释（已识别）`
  - 修复 CI/CD 声明：
    - 当前：多处声称"无.github/workflows或CI/CD配置"
    - 修改为：`存在.github/workflows/ci.yml，包含基本CI流程`
  - 修复入口点说明：
    - 在 `package.json` 注释中说明：`"module": "index.ts"` 是误导的，实际入口是 `src/server.ts`
  - 更新 `README.md`：
    - 添加GLM-4.7集成说明
    - 更新测试覆盖率徽章（如有）
    - 添加ESLint/Prettier使用说明
  - 更新深度分析报告：
    - 标记P0/P1/P2已完成
    - 更新评分（实现可用性应从1.5提升至3.5）

  **Must NOT do**:
  - 不修改代码中的anti-pattern注释内容
  - 不删除package.json的module字段（保持配置）
  - 不添加新文档（仅修复现有）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 文档修复，简单任务
  - **Skills**: [`git-master`]
    - `git-master`: 独立提交文档修复

  **Parallelization**:
  - **Can Run In Parallel**: YES（与Task 8, 9并行）
  - **Parallel Group**: Phase 3, Wave 1
  - **Blocks**: None
  - **Blocked By**: None（可最早开始Phase 3）

  **References**:

  **Pattern References**:
  - 无（文档任务）

  **API/Type References**:
  - 无

  **Test References**:
  - 无

  **Documentation References**:
  - `AGENTS.md:68` - 需修复的行
  - `README.md` - 需更新
  - `docs/DEEP-ANALYSIS-REPORT.md` - 需更新评分

  **External References**:
  - Markdown语法: `https://www.markdownguide.org/basic-syntax/` - 格式参考

  **WHY Each Reference Matters**:
  - AGENTS.md: 直接修复对象
  - 深度分析报告: 需反映最新状态

  **Acceptance Criteria**:

  **Tests-after:**
  - [ ] `AGENTS.md:68` 已修复，声明正确
  - [ ] `AGENTS.md` 中CI/CD声明已修复
  - [ ] `README.md` 已更新（包含GLM-4.7、测试、Linting说明）
  - [ ] `docs/DEEP-ANALYSIS-REPORT.md` 评分已更新

  **Agent-Executed QA Scenarios:**

  ```
  Scenario: AGENTS.md anti-pattern声明已修复
    Tool: read
    Preconditions: AGENTS.md已修改
    Steps:
      1. Read: AGENTS.md (lines 60-70)
      2. Assert: content contains "存在7处anti-pattern" or similar
      3. Assert: content does NOT contain "代码库中未发现"
    Expected Result: Anti-pattern声明准确
    Failure Indicators: 仍声称"未发现"
    Evidence: 文件内容验证

  Scenario: AGENTS.md CI/CD声明已修复
    Tool: read
    Preconditions: AGENTS.md已修改
    Steps:
      1. Read: AGENTS.md
      2. Search: "CI/CD" or ".github/workflows"
      3. Assert: content mentions "存在.github/workflows/ci.yml" or similar
      4. Assert: content does NOT contain "无CI/CD配置"
    Expected Result: CI/CD声明准确
    Failure Indicators: 仍声称"无CI/CD"
    Evidence: 文件内容验证

  Scenario: README.md已更新
    Tool: read
    Preconditions: README.md已修改
    Steps:
      1. Read: README.md
      2. Assert: content contains "GLM-4" or "GLM" (LLM集成说明)
      3. Assert: content contains "ESLint" or "Prettier" (代码规范说明)
      4. Assert: content contains "测试覆盖率" or "coverage"
    Expected Result: README包含最新信息
    Failure Indicators: 缺少关键更新
    Evidence: 文件内容验证

  Scenario: 深度分析报告评分已更新
    Tool: read
    Preconditions: 深度分析报告已修改
    Steps:
      1. Read: docs/DEEP-ANALYSIS-REPORT.md (first 50 lines)
      2. Assert: "实现可用性" score is NOT 1.5 (should be 3.5+)
      3. Assert: P0/P1/P2任务标记为完成
    Expected Result: 评分反映改进后状态
    Failure Indicators: 评分未更新或仍为1.5
    Evidence: 文件内容验证
  ```

  **Evidence to Capture:**
  - [ ] 无需额外证据（read工具验证）

  **Commit**: YES
  - Message: `docs: 修复文档一致性（anti-pattern、CI/CD、README更新）`
  - Files: `AGENTS.md`, `README.md`, `docs/DEEP-ANALYSIS-REPORT.md`
  - Pre-commit: 无（纯文档修改）

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(workflow): 修复冲突检测正则表达式bug` | `conflict-resolver.ts`, `conflict-resolver.test.ts` | `bun test src/__tests__/conflict-resolver.test.ts` |
| 2 | `feat(workflow): 实现工作流收敛检测` | `orchestrator.ts`, `types.ts`, `orchestrator.test.ts` | `bun test src/__tests__/orchestrator.test.ts` |
| 3 | `feat(llm): 集成GLM-4.7 SDK和配置管理` | `package.json`, `llm.ts`, `llm-client.ts`, `llm-client.test.ts` | `bun test src/__tests__/llm-client.test.ts` |
| 4 | `feat(agents): 替换模拟AI调用为真实GLM-4.7调用` | `agent-executor.ts`, `test-llm-integration.ts`, `llm-workflow.test.ts` | `bun test src/__tests__/agent-executor.test.ts` |
| 5 | `fix(test): 修复E2E测试超时问题` | `e2e/*.test.ts` | `bun test src/__tests__/e2e/` |
| 6 | `test: 补充单元测试至80%覆盖率` | `__tests__/*.test.ts`（多个） | `bun test --coverage` |
| 7 | `chore: 添加ESLint和Prettier代码规范配置` | `.eslintrc.json`, `.prettierrc.json`, `package.json`, `src/**/*.ts` | `bun run lint` |
| 8 | `feat(logging): 实现Pino日志系统替换console.log` | `logger.ts`, `src/**/*.ts`, `logger.test.ts` | `bun test src/__tests__/utils/logger.test.ts` |
| 9 | `feat(errors): 标准化错误处理和错误码体系` | `error-handler.ts`, `error-codes.ts`, `agent-executor.ts`, `orchestrator.ts`, `error-handler.test.ts` | `bun test src/__tests__/utils/error-handler.test.ts` |
| 10 | `docs: 修复文档一致性（anti-pattern、CI/CD、README更新）` | `AGENTS.md`, `README.md`, `DEEP-ANALYSIS-REPORT.md` | 无 |

---

## Success Criteria

### Verification Commands
```bash
# 1. P0修复验证
bun test src/__tests__/conflict-resolver.test.ts  # Expected: PASS
bun test src/__tests__/orchestrator.test.ts       # Expected: 收敛检测测试PASS

# 2. GLM-4.7集成验证（需API key）
export GLM_API_KEY="your-api-key"
bun run examples/test-llm-integration.ts          # Expected: 真实响应，无"simulate"
ENABLE_LLM_TEST=1 bun test src/__tests__/integration/  # Expected: PASS

# 3. 测试覆盖率验证
bun test --coverage                               # Expected: ≥80%

# 4. E2E测试验证
bun test src/__tests__/e2e/                       # Expected: PASS，无超时

# 5. 代码规范验证
bun run lint                                      # Expected: 零error，warning可接受

# 6. 全项目测试
bun test                                          # Expected: 所有测试PASS

# 7. MCP服务器启动
bun run src/server.ts                             # Expected: 成功启动，无crash
```

### Final Checklist
- [x] P0: 冲突检测bug已修复（Task 1）
- [x] P0: 工作流收敛检测已实现（Task 2）
- [x] P1: GLM-4.7已集成（Task 3, 4）
- [x] P1: 测试覆盖率≥80%（Task 5, 6）
- [x] P1: ESLint/Prettier已配置（Task 7）
- [x] P2: Pino日志系统已实现（Task 8）
- [x] P2: 错误处理已标准化（Task 9）
- [x] P2: 文档一致性已修复（Task 10）
- [x] 所有commits已提交（10个独立commit）
- [x] `bun test` 全部通过
- [x] `bun run lint` 零error
- [x] MCP服务器可正常启动
