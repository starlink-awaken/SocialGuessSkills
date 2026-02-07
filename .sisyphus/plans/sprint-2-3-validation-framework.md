# Sprint 2收尾 + Sprint 3: 参数验证与错误处理框架

## TL;DR

> **Quick Summary**: 完成Sprint 2遗留任务（参数验证），启动Sprint 3建立基于Zod的验证框架，为4个MCP工具添加参数验证和标准化错误响应，使用TDD方式确保代码质量。
> 
> **Deliverables**: 
> - Zod验证框架（schema定义 + 验证工具函数）
> - 4个MCP工具的参数验证（reasoning, query_agent, validate_model, health_check）
> - 标准化错误响应格式
> - MCP工具集成测试（8个测试：每工具2个）
> - TypeScript配置诊断报告
> 
> **Estimated Effort**: Medium（~8-12小时，分8个任务）
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1（Zod安装）→ Task 2（Schema定义）→ Task 3-6（各MCP工具验证）

---

## Context

### Original Request
用户请求："对当前项目现状进行深入分析和思考，明确当前阶段的主要工作目标，制定实施方案与具体工作计划吧"

### Interview Summary
**Key Discussions**:
- **Sprint 2复盘**: 过度设计ValidationError接口导致18+编译错误，一次改动过大，缺少测试保护
- **当前状态**: Sprint 2完成5/8任务，已回退到Sprint 1稳定状态（0编译错误）
- **技术栈**: TypeScript + Bun + MCP SDK + Pino日志，25个TS文件，7个测试文件

**User's Decisions**:
1. **Sprint方向**: A + B混合模式（完成Sprint 2简单任务 + 新Sprint 3验证主题）
2. **验证方案**: 使用Zod库（Schema验证，零成本类型推断）
3. **优先级**: 功能完整性优先（P0问题：参数验证、错误处理）
4. **LLM集成**: 延后（agent-executor保持mock）

### Research Findings
从代码审查发现：
- ✅ 4个MCP工具已注册：reasoning, query_agent, validate_model, health_check
- ✅ server.ts共258行，工具定义清晰（行44-167）
- ⚠️ 所有工具直接接受参数，无验证层
- ⚠️ 错误处理不一致：validate_model有try-catch，其他工具没有
- ⚠️ 存在 `as any` 类型断言（行46, 55, 76, 85, 95, 119, 134, 162）

---

## Work Objectives

### Core Objective
为SocialGuessSkills MCP服务器建立健壮的参数验证和错误处理机制，使用Zod Schema确保类型安全，统一错误响应格式，提升MCP工具的可靠性和用户体验。

### Concrete Deliverables
1. **Zod验证框架** - `src/utils/validation.ts`（Schema定义 + 验证函数）
2. **4个MCP工具集成验证** - server.ts中集成Zod验证
3. **标准化错误格式** - `src/utils/mcp-error.ts`（统一错误响应）
4. **集成测试套件** - `src/__tests__/mcp-tools.test.ts`（8+个测试）
5. **TypeScript配置诊断报告** - `docs/typescript-import-issues.md`

### Definition of Done
- [ ] `bun run typecheck` - 0个编译错误
- [ ] `bun test` - 所有测试通过（包括新增的8个MCP工具测试）
- [ ] 每个MCP工具验证失败时返回清晰的错误消息（含字段名、期望类型、实际值）
- [ ] Zod版本锁定在package.json（使用^3.x）
- [ ] 现有功能向后兼容（examples/run-example.ts仍能正常运行）

### Must Have
- Zod验证框架完整实现（不依赖外部验证库）
- 所有4个MCP工具都有参数验证
- 错误响应格式统一且信息丰富
- TDD方式开发（测试先于实现）
- 增量式集成（一次改一个工具，测试通过再继续）

### Must NOT Have (Guardrails)
- ❌ **禁止agent-executor.ts重构** - Task 2.1明确延后，不在本Sprint范围
- ❌ **禁止LLM集成工作** - 用户已决策延后，保持mock方式
- ❌ **禁止工作流并行优化** - orchestrator.ts的TODO不在本Sprint范围
- ❌ **禁止大规模server.ts改动** - Sprint 2失败教训，只添加验证层，不重构整体结构
- ❌ **禁止过度设计错误类型** - 避免Sprint 2的ValidationError复杂接口陷阱，使用简单的Error子类
- ❌ **禁止一次性集成所有工具** - 必须增量式：一个工具验证 → 测试 → 下一个工具

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.

### Test Decision
- **Infrastructure exists**: YES（Bun test runner已配置）
- **Automated tests**: **TDD**（测试驱动开发）
- **Framework**: bun test（内置测试框架）

### TDD Workflow

每个TODO遵循 **RED-GREEN-REFACTOR**:

1. **RED**: 先写失败的测试
   - 测试文件: `src/__tests__/validation.test.ts` 或 `src/__tests__/mcp-tools.test.ts`
   - 测试命令: `bun test src/__tests__/{file}.test.ts`
   - 预期: FAIL（测试存在，实现不存在或未完成）

2. **GREEN**: 实现最小代码使测试通过
   - 命令: `bun test src/__tests__/{file}.test.ts`
   - 预期: PASS

3. **REFACTOR**: 优化代码（保持测试绿色）
   - 命令: `bun test src/__tests__/{file}.test.ts`
   - 预期: PASS（仍然）

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> 每个任务都必须包含详细的Agent可执行验证场景。
> 使用 Bash 工具运行命令，验证输出。

**验证工具映射**:

| 交付物类型 | 工具 | 如何验证 |
|-----------|------|---------|
| **Zod Schema** | Bash (bun test) | 运行测试，断言验证成功/失败 |
| **MCP工具验证** | Bash (bun test) | 集成测试：发送有效/无效参数，断言响应 |
| **错误格式** | Bash (bun test) | 测试错误响应包含必需字段 |
| **TypeScript编译** | Bash (bun run typecheck) | 断言0个编译错误 |
| **文档** | Read工具 | 读取文档，验证包含必需章节 |

**每个场景格式**:

```
Scenario: [描述性名称 - 验证什么用户行为/流程]
  Tool: Bash
  Preconditions: [运行前必须满足的条件]
  Steps:
    1. [精确命令，含具体参数]
    2. [下一步操作，含预期中间状态]
    3. [断言，含精确预期值]
  Expected Result: [具体、可观察的输出]
  Failure Indicators: [什么情况表示失败]
  Evidence: [输出捕获路径或命令退出码]
```

---

## Execution Strategy

### Parallel Execution Waves

> 最大化吞吐量，按依赖关系分波次执行。

```
Wave 1 (立即开始):
└── Task 1: 安装Zod并添加类型定义 [无依赖]

Wave 2 (Wave 1完成后):
├── Task 2: 创建Zod Schema验证框架 [依赖: 1]
└── Task 8: TypeScript配置诊断 [无依赖，可并行]

Wave 3 (Wave 2完成后):
├── Task 3: 为reasoning工具添加验证 [依赖: 2]
├── Task 4: 为query_agent工具添加验证 [依赖: 2]
├── Task 5: 为validate_model工具添加验证 [依赖: 2]
└── Task 6: 为health_check工具添加验证 [依赖: 2]

Wave 4 (Wave 3完成后):
└── Task 7: 端到端验证和文档更新 [依赖: 3, 4, 5, 6]

Critical Path: Task 1 → Task 2 → Task 3 → Task 7
Parallel Speedup: ~50% (4个MCP工具可并行验证)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2 | 8 |
| 2 | 1 | 3, 4, 5, 6 | 8 |
| 3 | 2 | 7 | 4, 5, 6 |
| 4 | 2 | 7 | 3, 5, 6 |
| 5 | 2 | 7 | 3, 4, 6 |
| 6 | 2 | 7 | 3, 4, 5 |
| 7 | 3, 4, 5, 6 | None | None（最终任务）|
| 8 | None | None | 1, 2 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1, 8 | 2个独立任务，可并行dispatch |
| 2 | 2 | 单个任务，等待Wave 1完成 |
| 3 | 3, 4, 5, 6 | 4个并行任务，MCP工具验证 |
| 4 | 7 | 最终集成任务 |

---

## TODOs

### Wave 1: 基础设施准备

- [ ] 1. 安装Zod并添加类型定义

  **What to do**:
  - 安装Zod库（版本^3.x）: `bun add zod`
  - 验证安装: 检查package.json和bun.lockb
  - 创建类型定义测试文件: `src/__tests__/validation.test.ts`
  - 编写第一个Zod测试（RED状态）:
    ```typescript
    import { z } from 'zod'
    import { describe, it, expect } from 'bun:test'
    
    describe('Zod Installation', () => {
      it('should parse simple string schema', () => {
        const schema = z.string()
        expect(schema.parse('hello')).toBe('hello')
      })
    })
    ```

  **Must NOT do**:
  - ❌ 不要同时安装其他验证库（如Yup, Joi）
  - ❌ 不要修改现有的MCP工具代码（只准备环境）
  - ❌ 不要创建复杂的验证框架（本任务只安装依赖）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的依赖安装任务，使用快速模型即可
  - **Skills**: []
    - Reason: Bun包管理，无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 8)
  - **Blocks**: Task 2（Zod Schema框架依赖Zod安装）
  - **Blocked By**: None（可立即开始）

  **References**:
  
  **External References**:
  - Zod官方文档: `https://zod.dev/` - 基础用法和TypeScript集成
  - Bun包管理: `https://bun.sh/docs/cli/install` - bun add命令
  
  **Pattern References** (项目约定):
  - `package.json:6-17` - 依赖管理格式（devDependencies vs dependencies）
  - `src/__tests__/config.test.ts:1-5` - 测试文件导入模式（使用bun:test）
  
  **为什么这些引用重要**:
  - Zod官方文档：学习基础Schema定义语法，确保使用最新API
  - package.json：确定Zod应该放在dependencies（运行时需要）而非devDependencies
  - 现有测试文件：遵循项目测试导入约定，使用 `bun:test` 而非 `@types/bun`

  **Acceptance Criteria**:

  **TDD - RED**:
  - [ ] 测试文件创建: `src/__tests__/validation.test.ts`
  - [ ] 测试运行失败: `bun test src/__tests__/validation.test.ts` → FAIL（Zod未安装，导入错误）
  
  **TDD - GREEN**:
  - [ ] Zod安装成功: `bun add zod` → 退出码0
  - [ ] package.json已更新: `grep '"zod":' package.json` → 匹配到版本号（例如："zod": "^3.22.4"）
  - [ ] bun.lockb已更新: `ls -lh bun.lockb` → 文件修改时间为最近
  - [ ] 测试通过: `bun test src/__tests__/validation.test.ts` → PASS (1 test)
  
  **TDD - REFACTOR** (如需要):
  - [ ] TypeScript编译无错: `bun run typecheck` → 0 errors
  
  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Zod安装验证 - 检查依赖和测试
    Tool: Bash
    Preconditions: 项目目录存在，package.json可读
    Steps:
      1. bun add zod
      2. grep '"zod":' package.json
      3. bun test src/__tests__/validation.test.ts
    Expected Result: 
      - 步骤1退出码0
      - 步骤2输出包含 "zod": "^3.x.x"
      - 步骤3输出包含 "1 test, 0 failures"
    Failure Indicators: 
      - bun add失败（网络问题/版本冲突）
      - package.json未更新
      - 测试仍然失败（导入错误）
    Evidence: 命令退出码 + package.json内容 + 测试输出
  
  Scenario: TypeScript类型推断验证
    Tool: Bash
    Preconditions: Zod已安装，validation.test.ts存在
    Steps:
      1. bun run typecheck
      2. grep -A 5 'z.string()' src/__tests__/validation.test.ts
    Expected Result:
      - 步骤1输出 "0 errors"
      - 步骤2显示z.string()代码，无TypeScript类型错误
    Failure Indicators:
      - tsc报错：找不到模块'zod'
      - 类型推断失败（schema.parse返回unknown而非string）
    Evidence: tsc输出 + 代码片段
  ```

  **Evidence to Capture**:
  - [ ] package.json中Zod版本号
  - [ ] bun test输出（显示1个测试通过）
  - [ ] bun run typecheck输出（0 errors）

  **Commit**: YES
  - Message: `feat(deps): Add Zod validation library (^3.x)`
  - Files: `package.json`, `bun.lockb`, `src/__tests__/validation.test.ts`
  - Pre-commit: `bun test src/__tests__/validation.test.ts && bun run typecheck`

---

- [ ] 8. TypeScript配置诊断（研究任务）

  **What to do**:
  - 研究Sprint 2模块导入失败的根本原因
  - 复现问题（如果可能）:
    - 创建临时测试文件 `src/utils/test-import.ts`
    - 导出函数: `export function testFn() { return 'ok' }`
    - 在另一文件导入: `import { testFn } from './utils/test-import.js'`
    - 检查是否能编译通过
  - 检查tsconfig.json配置项（重点关注moduleResolution、module、target）
  - 查阅TypeScript文档关于ESM模块解析
  - 编写诊断报告: `docs/typescript-import-issues.md`
    - 章节1: 问题复现步骤
    - 章节2: tsconfig.json分析
    - 章节3: 根本原因假设
    - 章节4: 解决方案建议
    - 章节5: 预防措施

  **Must NOT do**:
  - ❌ 不要修改tsconfig.json（只研究，不改动）
  - ❌ 不要尝试"修复"Sprint 2的回退文件（已删除，不要恢复）
  - ❌ 不要引入新的编译配置（如paths映射、baseUrl）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 研究型任务，不需要复杂推理
  - **Skills**: []
    - Reason: 主要使用Read和Bash工具查看配置

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1) 或 Wave 2 (with Task 2)
  - **Blocks**: None（研究任务，不阻塞其他任务）
  - **Blocked By**: None（独立任务）

  **References**:
  
  **Configuration Files**:
  - `tsconfig.json` - TypeScript编译配置（module, moduleResolution, target等）
  - `package.json:3` - `"type": "module"` - ESM模块声明
  
  **Code Pattern References**:
  - `src/server.ts:1-7` - 现有导入模式（使用.js扩展名）
  - `src/agents/agent-factory.ts:1-5` - 另一个导入示例
  
  **Documentation References**:
  - TypeScript Handbook: `https://www.typescriptlang.org/docs/handbook/modules.html` - 模块解析规则
  - TypeScript 5.0+ ESM: `https://www.typescriptlang.org/docs/handbook/esm-node.html` - Node.js ESM支持
  
  **Sprint 2 Context** (问题背景):
  - 用户提到："TypeScript import errors: validateMaxIterations and validateAgentType could not be imported despite being exported"
  - 这表明可能的问题：
    1. 导出语法错误（named export vs default export）
    2. 模块解析配置不当（moduleResolution设置）
    3. 文件扩展名问题（.ts vs .js in imports）
  
  **为什么这些引用重要**:
  - tsconfig.json：诊断的核心，需要逐项检查配置是否与ESM兼容
  - 现有导入模式：验证项目约定（.js扩展名在import语句中）
  - TypeScript文档：理解模块解析算法，找到配置与行为的对应关系
  - Sprint 2上下文：明确问题症状，避免盲目搜索

  **Acceptance Criteria**:

  **研究完成标志** (无TDD，因为是研究任务):
  - [ ] 诊断报告创建: `docs/typescript-import-issues.md` 文件存在
  - [ ] 报告包含5个章节: 
    - 问题复现 / tsconfig分析 / 根因假设 / 解决方案 / 预防措施
  - [ ] 复现测试（如果可能）:
    - 创建 `src/utils/test-import.ts`
    - 尝试导入，记录结果（成功/失败）
  - [ ] tsconfig.json关键配置记录在报告中:
    - `module`字段值
    - `moduleResolution`字段值
    - `target`字段值
  
  **Agent-Executed QA Scenarios**:

  ```
  Scenario: 复现导入问题
    Tool: Bash
    Preconditions: 项目编译当前正常（0 errors）
    Steps:
      1. 创建测试文件: echo 'export function testFn() { return "ok" }' > src/utils/test-import.ts
      2. 创建导入文件: echo 'import { testFn } from "./utils/test-import.js"; console.log(testFn());' > src/test-importer.ts
      3. 尝试编译: bun run typecheck
      4. 清理测试文件: rm src/utils/test-import.ts src/test-importer.ts
    Expected Result:
      - 步骤3成功（0 errors）- 说明当前配置正常
      - 或步骤3失败 - 复现了问题
    Failure Indicators:
      - 无法创建文件（权限问题）
      - typecheck崩溃（配置严重错误）
    Evidence: typecheck输出 + 错误信息（如有）
  
  Scenario: 验证诊断报告完整性
    Tool: Bash (使用grep检查文档章节)
    Preconditions: docs/typescript-import-issues.md已创建
    Steps:
      1. grep -c "## 问题复现" docs/typescript-import-issues.md
      2. grep -c "## tsconfig.json分析" docs/typescript-import-issues.md
      3. grep -c "## 根本原因假设" docs/typescript-import-issues.md
      4. grep -c "## 解决方案建议" docs/typescript-import-issues.md
      5. grep -c "## 预防措施" docs/typescript-import-issues.md
    Expected Result: 每个grep命令返回1（找到1个章节标题）
    Failure Indicators: 任何grep返回0（章节缺失）
    Evidence: grep输出计数
  ```

  **Evidence to Capture**:
  - [ ] docs/typescript-import-issues.md内容（报告完整性）
  - [ ] tsconfig.json关键字段截图或摘录
  - [ ] 复现测试的typecheck输出

  **Commit**: YES
  - Message: `docs: Add TypeScript import issues diagnostic report`
  - Files: `docs/typescript-import-issues.md`
  - Pre-commit: `grep -c "## 问题复现" docs/typescript-import-issues.md` (验证报告存在)

---

### Wave 2: 验证框架核心

- [ ] 2. 创建Zod Schema验证框架

  **What to do**:
  - 创建 `src/utils/validation.ts` 文件
  - **TDD - RED**: 先写测试（src/__tests__/validation.test.ts）
    ```typescript
    describe('Validation Framework', () => {
      it('should validate Hypothesis schema', () => {
        const validHypothesis = {
          assumptions: ['test'],
          constraints: [],
          goals: ['goal1']
        }
        expect(() => validateHypothesis(validHypothesis)).not.toThrow()
      })
      
      it('should reject invalid Hypothesis', () => {
        const invalid = { assumptions: 'not-array' }
        expect(() => validateHypothesis(invalid)).toThrow()
      })
    })
    ```
  - **TDD - GREEN**: 实现验证函数
    - 定义Zod Schema:
      ```typescript
      const HypothesisSchema = z.object({
        assumptions: z.array(z.string()).min(1),
        constraints: z.array(z.string()),
        goals: z.array(z.string()).min(1)
      })
      ```
    - 导出验证函数:
      ```typescript
      export function validateHypothesis(data: unknown): Hypothesis {
        return HypothesisSchema.parse(data)
      }
      ```
  - 定义其他Schema:
    - `AgentTypeSchema` - 7个有效的agent type
    - `MaxIterationsSchema` - number, min(1), max(10)
    - `ModelJsonSchema` - string, nonempty
  - 创建通用错误转换函数:
    ```typescript
    export function formatZodError(error: z.ZodError): string {
      return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
    }
    ```

  **Must NOT do**:
  - ❌ 不要创建复杂的ValidationError类（Sprint 2教训）
  - ❌ 不要集成到server.ts（下一个Wave才做）
  - ❌ 不要添加自定义验证规则（使用Zod内置规则即可）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 创建新文件，简单逻辑，使用低成本模型
  - **Skills**: []
    - Reason: TypeScript + Zod，标准开发技能

  **Parallelization**:
  - **Can Run In Parallel**: NO（等待Task 1完成）
  - **Parallel Group**: Wave 2（单任务）
  - **Blocks**: Task 3, 4, 5, 6（所有MCP工具验证依赖此框架）
  - **Blocked By**: Task 1（Zod安装）

  **References**:
  
  **Type References** (接口契约):
  - `src/types.ts:1` - `AgentType`枚举定义（7个有效值）
  - `src/types.ts:3-7` - `Hypothesis`接口定义（assumptions, constraints, goals）
  
  **Pattern References** (现有代码模式):
  - `src/utils/logger.ts:1-10` - 工具函数导出模式
  - `src/utils/constants.ts` - 常量定义模式（可参考定义验证常量）
  
  **Test References** (测试模式):
  - `src/__tests__/retry.test.ts:1-20` - Bun测试结构（describe, it, expect）
  - `src/__tests__/config.test.ts` - 配置验证测试模式
  
  **External References**:
  - Zod官方文档 - Schema定义: `https://zod.dev/?id=primitives`
  - Zod错误处理: `https://zod.dev/?id=error-handling`
  
  **为什么这些引用重要**:
  - types.ts：确保Zod Schema与TypeScript接口完全一致（字段名、类型、必填项）
  - 现有工具函数：遵循项目导出约定（export function, 不使用default export）
  - 测试模式：保持测试风格统一，使用项目约定的bun:test导入
  - Zod文档：学习数组验证（z.array）、枚举验证（z.enum）、数字范围（z.number().min().max()）

  **Acceptance Criteria**:

  **TDD - RED**:
  - [ ] 测试先行: `src/__tests__/validation.test.ts` 包含至少6个测试（每个schema 2个：valid + invalid）
  - [ ] 测试失败: `bun test src/__tests__/validation.test.ts` → FAIL (validateHypothesis函数不存在)
  
  **TDD - GREEN**:
  - [ ] 实现文件创建: `src/utils/validation.ts` 存在
  - [ ] 导出4个验证函数:
    - `validateHypothesis(data: unknown): Hypothesis`
    - `validateAgentType(data: unknown): AgentType`
    - `validateMaxIterations(data: unknown): number`
    - `validateModelJson(data: unknown): string`
  - [ ] 导出1个错误格式化函数: `formatZodError(error: z.ZodError): string`
  - [ ] 测试全部通过: `bun test src/__tests__/validation.test.ts` → PASS (6+ tests, 0 failures)
  
  **TDD - REFACTOR**:
  - [ ] TypeScript编译无错: `bun run typecheck` → 0 errors
  - [ ] 代码质量检查:
    - 无 `as any` 断言
    - 所有导出函数有明确的参数和返回类型
    - Zod Schema命名统一（XxxSchema后缀）
  
  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Hypothesis验证 - 有效输入
    Tool: Bash (bun test)
    Preconditions: Zod已安装，validation.ts实现完成
    Steps:
      1. bun test src/__tests__/validation.test.ts -t "should validate Hypothesis schema"
    Expected Result: 测试输出包含 "✓ should validate Hypothesis schema"
    Failure Indicators: 测试失败，提示Schema定义错误或类型不匹配
    Evidence: 测试输出
  
  Scenario: Hypothesis验证 - 无效输入（缺少必填字段）
    Tool: Bash (bun test)
    Preconditions: validation.ts实现完成
    Steps:
      1. bun test src/__tests__/validation.test.ts -t "should reject invalid Hypothesis"
    Expected Result: 测试输出包含 "✓ should reject invalid Hypothesis"
    Failure Indicators: 
      - 测试通过但不应该（验证太宽松）
      - 测试失败但错误消息不清晰
    Evidence: 测试输出 + 抛出的ZodError内容
  
  Scenario: AgentType枚举验证
    Tool: Bash (bun test)
    Preconditions: AgentTypeSchema定义完成
    Steps:
      1. bun test src/__tests__/validation.test.ts -t "AgentType"
    Expected Result: 
      - 有效值（'systems', 'econ'等）验证通过
      - 无效值（'invalid-agent'）抛出错误
    Failure Indicators: 枚举值与types.ts定义不一致
    Evidence: 测试输出
  
  Scenario: MaxIterations范围验证
    Tool: Bash (bun test)
    Preconditions: MaxIterationsSchema定义完成
    Steps:
      1. bun test src/__tests__/validation.test.ts -t "MaxIterations"
    Expected Result:
      - 值3验证通过
      - 值0抛出错误（小于最小值1）
      - 值100抛出错误（大于最大值10）
    Failure Indicators: 范围约束未生效
    Evidence: 测试输出
  
  Scenario: 错误格式化函数
    Tool: Bash (bun test)
    Preconditions: formatZodError函数实现完成
    Steps:
      1. bun test src/__tests__/validation.test.ts -t "formatZodError"
    Expected Result: 
      - 错误消息包含字段路径（如 "assumptions: Expected array, received string"）
      - 多个错误用分号分隔
    Failure Indicators: 错误消息不可读或缺少关键信息
    Evidence: 测试输出 + 格式化后的错误字符串
  ```

  **Evidence to Capture**:
  - [ ] src/utils/validation.ts完整代码
  - [ ] src/__tests__/validation.test.ts测试输出（6+ tests passed）
  - [ ] bun run typecheck输出（0 errors）
  - [ ] Zod Schema定义与types.ts接口的对应关系（文档化）

  **Commit**: YES
  - Message: `feat(validation): Add Zod schema validation framework`
  - Files: `src/utils/validation.ts`, `src/__tests__/validation.test.ts`
  - Pre-commit: `bun test src/__tests__/validation.test.ts && bun run typecheck`

---

### Wave 3: MCP工具验证集成（并行）

> 以下4个任务可以并行执行，因为它们各自修改不同的MCP工具。

- [ ] 3. 为reasoning工具添加验证

  **What to do**:
  - **TDD - RED**: 在 `src/__tests__/mcp-tools.test.ts` 添加测试
    ```typescript
    describe('MCP Tool: reasoning', () => {
      it('should accept valid hypothesis and maxIterations', async () => {
        const args = {
          hypothesis: {
            assumptions: ['test'],
            constraints: [],
            goals: ['goal1']
          },
          maxIterations: 3
        }
        // 调用reasoning工具，预期不抛出错误
      })
      
      it('should reject invalid hypothesis (missing goals)', async () => {
        const args = { hypothesis: { assumptions: ['test'] } }
        // 调用reasoning工具，预期抛出Zod错误
      })
    })
    ```
  - **TDD - GREEN**: 修改 `src/server.ts` 中的reasoning工具处理器（行44-56）
    - 导入验证函数: `import { validateHypothesis, validateMaxIterations } from './utils/validation.js'`
    - 在工具处理器开头添加验证:
      ```typescript
      (mcpServer as any).registerTool("reasoning", reasoningConfig, async (args: ReasoningArgs, _extra?: any): Promise<any> => {
        try {
          const hypothesis = validateHypothesis(args.hypothesis)
          const maxIterations = args.maxIterations 
            ? validateMaxIterations(args.maxIterations) 
            : 3
          
          // ... 原有逻辑
        } catch (error) {
          if (error instanceof z.ZodError) {
            return { 
              content: [{ type: "text", text: `Validation error: ${formatZodError(error)}` }],
              isError: true 
            }
          }
          throw error
        }
      })
      ```
  - 运行测试验证: `bun test src/__tests__/mcp-tools.test.ts`

  **Must NOT do**:
  - ❌ 不要修改reasoning工具的核心逻辑（runWorkflow调用）
  - ❌ 不要改变返回格式（保持 `{ content: [{type: "text", text: ...}] }`）
  - ❌ 不要同时修改其他MCP工具（增量式，一次一个）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 简单的验证逻辑集成，低复杂度
  - **Skills**: []
    - Reason: 标准TypeScript开发

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 4, 5, 6)
  - **Blocks**: Task 7（端到端验证）
  - **Blocked By**: Task 2（验证框架）

  **References**:
  
  **Implementation Target**:
  - `src/server.ts:44-56` - reasoning工具当前实现（需修改的代码位置）
  - `src/server.ts:18-42` - reasoning工具配置（inputSchema已定义，需保持一致）
  
  **Validation Framework**:
  - `src/utils/validation.ts` - 验证函数（validateHypothesis, validateMaxIterations, formatZodError）
  
  **Type References**:
  - `src/types.ts:3-7` - Hypothesis接口（验证目标）
  - `src/server.ts:18-21` - ReasoningArgs接口（工具参数类型）
  
  **Test Pattern**:
  - `src/__tests__/orchestrator.test.ts:10-30` - 异步测试模式（async/await, expect）
  - `src/__tests__/config.test.ts` - 验证错误测试模式
  
  **Error Handling Pattern**:
  - `src/server.ts:95-123` - validate_model工具的try-catch模式（参考现有错误处理）
  
  **为什么这些引用重要**:
  - server.ts行44-56：明确修改位置，避免改错代码
  - validation.ts：确保使用正确的验证函数，避免重复实现
  - ReasoningArgs接口：验证后的数据应符合此类型，确保类型安全
  - validate_model错误处理：项目已有错误处理模式，保持一致性
  - 测试模式：遵循现有异步测试风格

  **Acceptance Criteria**:

  **TDD - RED**:
  - [ ] 测试先行: `src/__tests__/mcp-tools.test.ts` 包含reasoning工具的2个测试
  - [ ] 测试失败: `bun test src/__tests__/mcp-tools.test.ts -t "reasoning"` → FAIL（验证未实现）
  
  **TDD - GREEN**:
  - [ ] server.ts已修改: reasoning工具处理器包含验证逻辑
  - [ ] 有效参数测试通过: hypothesis有assumptions和goals → 不抛出错误
  - [ ] 无效参数测试通过: hypothesis缺少goals → 抛出Zod错误，错误消息包含"goals"
  - [ ] 测试全部通过: `bun test src/__tests__/mcp-tools.test.ts -t "reasoning"` → PASS (2 tests)
  
  **TDD - REFACTOR**:
  - [ ] TypeScript编译无错: `bun run typecheck` → 0 errors
  - [ ] 向后兼容性: `bun run examples/run-example.ts` → 正常运行（因为example使用有效参数）
  
  **Agent-Executed QA Scenarios**:

  ```
  Scenario: reasoning工具 - 有效参数
    Tool: Bash (bun test)
    Preconditions: validation.ts实现完成，server.ts已修改
    Steps:
      1. bun test src/__tests__/mcp-tools.test.ts -t "should accept valid hypothesis and maxIterations"
    Expected Result: 测试通过，无验证错误
    Failure Indicators: 
      - 测试失败：验证函数抛出错误（不应该）
      - 工具返回isError: true
    Evidence: 测试输出
  
  Scenario: reasoning工具 - 无效hypothesis（缺少goals）
    Tool: Bash (bun test)
    Preconditions: validation.ts实现完成，server.ts已修改
    Steps:
      1. bun test src/__tests__/mcp-tools.test.ts -t "should reject invalid hypothesis"
    Expected Result: 
      - 测试通过
      - 工具返回错误响应，包含 "goals"
    Failure Indicators:
      - 验证未生效（无效参数被接受）
      - 错误消息不包含字段名
    Evidence: 测试输出 + 错误消息内容
  
  Scenario: reasoning工具 - maxIterations超出范围
    Tool: Bash (手动调用测试)
    Preconditions: server.ts已修改，validateMaxIterations实现完成
    Steps:
      1. 创建测试用例：maxIterations = 100（超过最大值10）
      2. bun test src/__tests__/mcp-tools.test.ts -t "maxIterations"
    Expected Result: 验证失败，错误消息包含 "maximum is 10"
    Failure Indicators: 验证未生效或错误消息不清晰
    Evidence: 测试输出
  
  Scenario: 向后兼容性 - 运行示例脚本
    Tool: Bash
    Preconditions: server.ts已修改，examples/run-example.ts存在
    Steps:
      1. bun run examples/run-example.ts
    Expected Result: 
      - 脚本正常运行
      - 输出包含 "模型生成完成"
      - 退出码0
    Failure Indicators:
      - 验证导致example失败（参数不兼容）
      - 运行时错误
    Evidence: 脚本输出 + 退出码
  ```

  **Evidence to Capture**:
  - [ ] src/server.ts修改diff（验证逻辑添加位置）
  - [ ] src/__tests__/mcp-tools.test.ts测试输出（reasoning相关测试通过）
  - [ ] examples/run-example.ts执行输出（向后兼容验证）

  **Commit**: YES
  - Message: `feat(mcp): Add parameter validation to reasoning tool`
  - Files: `src/server.ts`, `src/__tests__/mcp-tools.test.ts`
  - Pre-commit: `bun test src/__tests__/mcp-tools.test.ts -t "reasoning" && bun run typecheck`

---

- [ ] 4. 为query_agent工具添加验证

  **What to do**:
  - **TDD - RED**: 在 `src/__tests__/mcp-tools.test.ts` 添加测试
    ```typescript
    describe('MCP Tool: query_agent', () => {
      it('should accept valid agentType and hypothesis', async () => {
        const args = {
          agentType: 'risk' as AgentType,
          hypothesis: {
            assumptions: ['test'],
            constraints: [],
            goals: ['goal1']
          }
        }
        // 调用query_agent工具
      })
      
      it('should reject invalid agentType', async () => {
        const args = {
          agentType: 'invalid-agent',
          hypothesis: { assumptions: ['test'], goals: ['goal1'] }
        }
        // 预期抛出Zod错误
      })
    })
    ```
  - **TDD - GREEN**: 修改 `src/server.ts` 中的query_agent工具处理器（行75-86）
    - 导入验证函数（如果尚未导入）
    - 添加验证逻辑:
      ```typescript
      (mcpServer as any).registerTool("query_agent", queryAgentConfig, async (args: QueryAgentArgs, _extra?: any): Promise<any> => {
        try {
          const agentType = validateAgentType(args.agentType)
          const hypothesis = validateHypothesis(args.hypothesis)
          
          // ... 原有逻辑
        } catch (error) {
          if (error instanceof z.ZodError) {
            return {
              content: [{ type: "text", text: `Validation error: ${formatZodError(error)}` }],
              isError: true
            }
          }
          throw error
        }
      })
      ```

  **Must NOT do**:
  - ❌ 不要修改queryAgent函数的调用逻辑
  - ❌ 不要改变返回格式
  - ❌ 不要同时修改其他MCP工具

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 3, 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **References**:
  
  **Implementation Target**:
  - `src/server.ts:75-86` - query_agent工具当前实现
  - `src/server.ts:58-73` - query_agent工具配置
  
  **Validation Framework**:
  - `src/utils/validation.ts` - validateAgentType, validateHypothesis, formatZodError
  
  **Type References**:
  - `src/types.ts:1` - AgentType枚举（7个有效值）
  - `src/server.ts:58-61` - QueryAgentArgs接口
  
  **为什么这些引用重要**:
  - AgentType枚举：validateAgentType必须与此枚举完全一致
  - query_agent配置：inputSchema已定义，验证应与schema匹配

  **Acceptance Criteria**:

  **TDD - RED**:
  - [ ] 测试先行: query_agent工具的2个测试
  - [ ] 测试失败: `bun test src/__tests__/mcp-tools.test.ts -t "query_agent"` → FAIL
  
  **TDD - GREEN**:
  - [ ] server.ts已修改: query_agent工具处理器包含验证
  - [ ] 有效agentType测试通过: 'risk' → 不抛出错误
  - [ ] 无效agentType测试通过: 'invalid-agent' → 抛出Zod错误，包含 "Invalid enum value"
  - [ ] 测试通过: `bun test src/__tests__/mcp-tools.test.ts -t "query_agent"` → PASS (2 tests)
  
  **TDD - REFACTOR**:
  - [ ] TypeScript编译无错: `bun run typecheck` → 0 errors
  
  **Agent-Executed QA Scenarios**:

  ```
  Scenario: query_agent工具 - 有效agentType
    Tool: Bash (bun test)
    Preconditions: validation.ts实现完成，server.ts已修改
    Steps:
      1. bun test src/__tests__/mcp-tools.test.ts -t "should accept valid agentType"
    Expected Result: 测试通过
    Failure Indicators: 验证拒绝有效的agentType（如'risk'）
    Evidence: 测试输出
  
  Scenario: query_agent工具 - 无效agentType
    Tool: Bash (bun test)
    Preconditions: validation.ts实现完成，server.ts已修改
    Steps:
      1. bun test src/__tests__/mcp-tools.test.ts -t "should reject invalid agentType"
    Expected Result: 
      - 测试通过
      - 错误消息包含 "Invalid enum value" 或 "Expected 'systems' | 'econ' | ..."
    Failure Indicators: 无效agentType被接受
    Evidence: 测试输出 + 错误消息
  
  Scenario: query_agent工具 - 无效hypothesis
    Tool: Bash (bun test)
    Preconditions: server.ts已修改
    Steps:
      1. 创建测试：hypothesis缺少assumptions字段
      2. bun test src/__tests__/mcp-tools.test.ts -t "hypothesis"
    Expected Result: 验证失败，错误消息包含 "assumptions"
    Failure Indicators: 验证未捕获缺少字段的情况
    Evidence: 测试输出
  ```

  **Evidence to Capture**:
  - [ ] src/server.ts修改diff
  - [ ] src/__tests__/mcp-tools.test.ts测试输出（query_agent相关）

  **Commit**: YES
  - Message: `feat(mcp): Add parameter validation to query_agent tool`
  - Files: `src/server.ts`, `src/__tests__/mcp-tools.test.ts`
  - Pre-commit: `bun test src/__tests__/mcp-tools.test.ts -t "query_agent" && bun run typecheck`

---

- [ ] 5. 为validate_model工具添加验证

  **What to do**:
  - **TDD - RED**: 在 `src/__tests__/mcp-tools.test.ts` 添加测试
    ```typescript
    describe('MCP Tool: validate_model', () => {
      it('should accept valid modelJson string', async () => {
        const args = { modelJson: '{"hypothesis": {}, "agentOutputs": []}' }
        // 调用validate_model工具
      })
      
      it('should reject empty modelJson', async () => {
        const args = { modelJson: '' }
        // 预期抛出Zod错误
      })
    })
    ```
  - **TDD - GREEN**: 修改 `src/server.ts` 中的validate_model工具处理器（行95-123）
    - 注意：validate_model已有try-catch，需要在JSON.parse之前添加Zod验证
    - 添加验证逻辑:
      ```typescript
      (mcpServer as any).registerTool("validate_model", validateModelConfig, async (args: ValidateModelArgs, _extra?: any): Promise<any> => {
        try {
          const modelJson = validateModelJson(args.modelJson) // Zod验证
          const model = JSON.parse(modelJson) // 原有逻辑
          
          // ... 原有验证逻辑
        } catch (error) {
          if (error instanceof z.ZodError) {
            return {
              content: [{ type: "text", text: JSON.stringify({ isValid: false, error: `Validation error: ${formatZodError(error)}` }, null, 2) }],
              isError: true
            }
          }
          // 保留原有的JSON.parse错误处理
          return { content: [{ type: "text", text: JSON.stringify({ isValid: false, error: "无效的JSON格式", details: String(error) }, null, 2) }], isError: true }
        }
      })
      ```

  **Must NOT do**:
  - ❌ 不要修改validate_model的验证逻辑（checks, issues, warnings）
  - ❌ 不要改变错误响应的JSON结构

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 3, 4, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **References**:
  
  **Implementation Target**:
  - `src/server.ts:95-123` - validate_model工具当前实现（已有try-catch，需融合Zod验证）
  - `src/server.ts:88-93` - validate_model工具配置
  
  **Validation Framework**:
  - `src/utils/validation.ts` - validateModelJson, formatZodError
  
  **Error Handling Pattern**:
  - `src/server.ts:120-122` - 现有JSON.parse错误处理（需保留并区分Zod错误）
  
  **为什么这些引用重要**:
  - 现有try-catch：validate_model已有错误处理，需要正确集成Zod验证，避免破坏原有逻辑
  - 错误响应格式：validate_model返回JSON格式的错误（与其他工具不同），需保持一致

  **Acceptance Criteria**:

  **TDD - RED**:
  - [ ] 测试先行: validate_model工具的2个测试
  - [ ] 测试失败: `bun test src/__tests__/mcp-tools.test.ts -t "validate_model"` → FAIL
  
  **TDD - GREEN**:
  - [ ] server.ts已修改: validate_model工具处理器集成Zod验证
  - [ ] 有效modelJson测试通过: 非空字符串 → 不抛出Zod错误
  - [ ] 无效modelJson测试通过: 空字符串 → 抛出Zod错误，包含 "String must contain at least 1 character"
  - [ ] 测试通过: `bun test src/__tests__/mcp-tools.test.ts -t "validate_model"` → PASS (2 tests)
  
  **TDD - REFACTOR**:
  - [ ] TypeScript编译无错: `bun run typecheck` → 0 errors
  - [ ] 原有错误处理保留: JSON.parse失败仍返回 "无效的JSON格式" 错误

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: validate_model工具 - 有效modelJson
    Tool: Bash (bun test)
    Preconditions: validation.ts实现完成，server.ts已修改
    Steps:
      1. bun test src/__tests__/mcp-tools.test.ts -t "should accept valid modelJson"
    Expected Result: 测试通过，Zod验证通过
    Failure Indicators: Zod验证拒绝非空字符串
    Evidence: 测试输出
  
  Scenario: validate_model工具 - 空modelJson
    Tool: Bash (bun test)
    Preconditions: validation.ts实现完成，server.ts已修改
    Steps:
      1. bun test src/__tests__/mcp-tools.test.ts -t "should reject empty modelJson"
    Expected Result: 
      - 测试通过
      - 错误响应包含 "Validation error" 和 "String must contain at least 1 character"
    Failure Indicators: 空字符串被接受
    Evidence: 测试输出 + 错误JSON
  
  Scenario: validate_model工具 - 无效JSON（区分Zod错误和JSON.parse错误）
    Tool: Bash (手动测试)
    Preconditions: server.ts已修改
    Steps:
      1. 创建测试：modelJson = '{ invalid json'
      2. bun test src/__tests__/mcp-tools.test.ts -t "invalid JSON"
    Expected Result: 
      - 错误响应包含 "无效的JSON格式"（原有错误处理）
      - 而非Zod验证错误（因为字符串非空，Zod应通过）
    Failure Indicators: 错误类型混淆（Zod错误覆盖JSON.parse错误）
    Evidence: 测试输出 + 错误消息类型
  ```

  **Evidence to Capture**:
  - [ ] src/server.ts修改diff（Zod验证位置）
  - [ ] src/__tests__/mcp-tools.test.ts测试输出（validate_model相关）
  - [ ] 错误响应示例（Zod错误 vs JSON.parse错误）

  **Commit**: YES
  - Message: `feat(mcp): Add parameter validation to validate_model tool`
  - Files: `src/server.ts`, `src/__tests__/mcp-tools.test.ts`
  - Pre-commit: `bun test src/__tests__/mcp-tools.test.ts -t "validate_model" && bun run typecheck`

---

- [ ] 6. 为health_check工具添加验证

  **What to do**:
  - **TDD - RED**: 在 `src/__tests__/mcp-tools.test.ts` 添加测试
    ```typescript
    describe('MCP Tool: health_check', () => {
      it('should accept empty args', async () => {
        const args = {}
        // 调用health_check工具，预期成功
      })
      
      it('should reject unexpected args', async () => {
        const args = { unexpectedField: 'value' }
        // 预期抛出Zod错误（strict mode）
      })
    })
    ```
  - **TDD - GREEN**: 修改 `src/server.ts` 中的health_check工具处理器（行134-167）
    - 定义空Schema:
      ```typescript
      const HealthArgsSchema = z.object({}).strict()
      ```
    - 添加验证逻辑:
      ```typescript
      (mcpServer as any).registerTool("health_check", healthConfig, async (_args: HealthArgs, _extra?: any): Promise<any> => {
        try {
          HealthArgsSchema.parse(_args) // 验证空对象
          
          // ... 原有逻辑
        } catch (error) {
          if (error instanceof z.ZodError) {
            return {
              content: [{ type: "text", text: JSON.stringify({ status: "error", message: `Validation error: ${formatZodError(error)}` }) }],
              isError: true
            }
          }
          throw error
        }
      })
      ```

  **Must NOT do**:
  - ❌ 不要修改health_check的核心逻辑（版本读取、环境检查）
  - ❌ 不要改变返回的JSON结构

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 最简单的验证任务（空参数），使用快速模型
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 3, 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2

  **References**:
  
  **Implementation Target**:
  - `src/server.ts:134-167` - health_check工具当前实现
  - `src/server.ts:126-132` - health_check工具配置（inputSchema为空对象）
  
  **Validation Framework**:
  - `src/utils/validation.ts` - formatZodError（可能需要添加validateEmptyArgs）
  
  **Type References**:
  - `src/server.ts:127` - HealthArgs类型（Record<string, never>）
  
  **为什么这些引用重要**:
  - HealthArgs定义：空对象类型，Zod Schema应与之匹配（strict mode确保真的为空）
  - health_check逻辑：无外部依赖，验证简单，但要确保不影响健康检查功能

  **Acceptance Criteria**:

  **TDD - RED**:
  - [ ] 测试先行: health_check工具的2个测试
  - [ ] 测试失败: `bun test src/__tests__/mcp-tools.test.ts -t "health_check"` → FAIL
  
  **TDD - GREEN**:
  - [ ] server.ts已修改: health_check工具处理器包含验证
  - [ ] 空参数测试通过: {} → 不抛出错误
  - [ ] 意外参数测试通过（strict mode）: {unexpectedField: 'value'} → 抛出Zod错误
  - [ ] 测试通过: `bun test src/__tests__/mcp-tools.test.ts -t "health_check"` → PASS (2 tests)
  
  **TDD - REFACTOR**:
  - [ ] TypeScript编译无错: `bun run typecheck` → 0 errors
  
  **Agent-Executed QA Scenarios**:

  ```
  Scenario: health_check工具 - 空参数
    Tool: Bash (bun test)
    Preconditions: validation.ts实现完成，server.ts已修改
    Steps:
      1. bun test src/__tests__/mcp-tools.test.ts -t "should accept empty args"
    Expected Result: 测试通过，健康检查正常返回status: "ok"
    Failure Indicators: Zod验证拒绝空对象
    Evidence: 测试输出
  
  Scenario: health_check工具 - 意外参数（strict mode）
    Tool: Bash (bun test)
    Preconditions: HealthArgsSchema使用strict()，server.ts已修改
    Steps:
      1. bun test src/__tests__/mcp-tools.test.ts -t "should reject unexpected args"
    Expected Result:
      - 测试通过
      - 错误响应包含 "Unrecognized key(s) in object"
    Failure Indicators: strict mode未生效，意外参数被忽略
    Evidence: 测试输出 + 错误消息
  ```

  **Evidence to Capture**:
  - [ ] src/server.ts修改diff（health_check验证）
  - [ ] src/__tests__/mcp-tools.test.ts测试输出（health_check相关）

  **Commit**: YES
  - Message: `feat(mcp): Add parameter validation to health_check tool`
  - Files: `src/server.ts`, `src/__tests__/mcp-tools.test.ts`
  - Pre-commit: `bun test src/__tests__/mcp-tools.test.ts -t "health_check" && bun run typecheck`

---

### Wave 4: 最终验证

- [ ] 7. 端到端验证和文档更新

  **What to do**:
  - **完整测试运行**: `bun test` - 确保所有测试通过（包括原有测试+新增的8+个MCP工具测试）
  - **TypeScript编译检查**: `bun run typecheck` - 确保0个编译错误
  - **示例脚本验证**: `bun run examples/run-example.ts` - 验证向后兼容性
  - **更新README.md**:
    - 在"API参考"章节的每个tool说明中添加"参数验证"小节
    - 示例:
      ```markdown
      ### Tool 1: reasoning
      
      #### 参数验证
      - `hypothesis.assumptions`: 必填，字符串数组，至少1个元素
      - `hypothesis.goals`: 必填，字符串数组，至少1个元素
      - `maxIterations`: 可选，数字，范围1-10，默认3
      
      **验证失败示例**:
      ```json
      {
        "error": "Validation error: hypothesis.goals: Required"
      }
      ```
      ```
  - **创建迁移指南** (如果API有变化): `docs/migration-guide.md`
    - 说明添加了参数验证
    - 列出可能影响现有调用的变更
    - 提供错误处理建议

  **Must NOT do**:
  - ❌ 不要添加新功能（只验证现有功能）
  - ❌ 不要修改测试通过的代码（refactor完成即可）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 验证和文档更新，非实现任务
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（最终任务）
  - **Parallel Group**: Wave 4（单任务）
  - **Blocks**: None
  - **Blocked By**: Task 3, 4, 5, 6（所有MCP工具验证完成）

  **References**:
  
  **Documentation Files**:
  - `README.md:108-150` - API参考章节（需更新，添加验证说明）
  - `docs/MCP_INTEGRATION.md` - MCP集成指南（可能需要补充验证错误示例）
  
  **Test Files**:
  - `src/__tests__/e2e.test.ts` - 端到端测试（确保不受影响）
  - `src/__tests__/example.test.ts` - 示例测试（确保向后兼容）
  
  **Example Scripts**:
  - `examples/run-example.ts` - 示例运行脚本（验证向后兼容性）
  - `examples/community-governance.json` - 示例输入数据（检查是否符合新验证规则）
  
  **为什么这些引用重要**:
  - README API参考：用户首先查阅的文档，必须准确反映新的验证规则
  - 端到端测试：确保验证没有破坏整体工作流
  - 示例脚本：实际用户使用的入口，必须保持可用

  **Acceptance Criteria**:

  **完整性检查**:
  - [ ] 所有测试通过: `bun test` → 所有测试套件PASS（原有测试+新增8+个）
  - [ ] TypeScript无错: `bun run typecheck` → 0 errors
  - [ ] 示例可运行: `bun run examples/run-example.ts` → 正常输出，退出码0
  
  **文档更新**:
  - [ ] README.md已更新: 每个tool的API参考包含"参数验证"小节
  - [ ] 验证错误示例添加: 每个tool至少1个验证失败示例（JSON格式）
  - [ ] 迁移指南创建（如需要）: `docs/migration-guide.md` 存在，包含：
    - 变更摘要
    - 影响分析
    - 错误处理建议
  
  **Agent-Executed QA Scenarios**:

  ```
  Scenario: 完整测试套件运行
    Tool: Bash (bun test)
    Preconditions: 所有Wave 1-3任务完成，测试文件已更新
    Steps:
      1. bun test
    Expected Result: 
      - 所有测试通过（至少15个测试：7个原有+8个新增）
      - 输出包含 "0 failures"
    Failure Indicators: 任何测试失败
    Evidence: 测试输出汇总
  
  Scenario: TypeScript编译检查
    Tool: Bash (bun run typecheck)
    Preconditions: 所有代码修改完成
    Steps:
      1. bun run typecheck
    Expected Result: 输出 "0 errors"
    Failure Indicators: 编译错误（类型不匹配、导入错误）
    Evidence: tsc输出
  
  Scenario: 向后兼容性验证 - 示例脚本
    Tool: Bash
    Preconditions: examples/run-example.ts存在，使用有效参数
    Steps:
      1. bun run examples/run-example.ts
    Expected Result:
      - 脚本正常运行（无验证错误）
      - 输出包含 "模型生成完成"
      - 输出包含 "Agent输出数量: 7"
      - 退出码0
    Failure Indicators:
      - 验证错误（example参数不符合新规则）
      - 运行时错误
    Evidence: 脚本完整输出
  
  Scenario: 验证错误示例文档化
    Tool: Read (读取README.md)
    Preconditions: README.md已更新
    Steps:
      1. 读取README.md
      2. 检查"API参考"章节中reasoning工具部分
      3. 验证是否包含"参数验证"小节
      4. 验证是否包含验证失败示例JSON
    Expected Result:
      - README包含完整的参数验证说明
      - 每个tool至少1个错误示例
    Failure Indicators: 文档不完整或格式不一致
    Evidence: README.md内容片段
  
  Scenario: 迁移指南完整性（如创建）
    Tool: Read (读取docs/migration-guide.md)
    Preconditions: 需要迁移指南（API有破坏性变更）
    Steps:
      1. 检查docs/migration-guide.md是否存在
      2. 验证包含必需章节：变更摘要、影响分析、错误处理建议
    Expected Result: 迁移指南完整且清晰
    Failure Indicators: 章节缺失或内容不足
    Evidence: 迁移指南内容
  ```

  **Evidence to Capture**:
  - [ ] `bun test` 完整输出（所有测试通过）
  - [ ] `bun run typecheck` 输出（0 errors）
  - [ ] `examples/run-example.ts` 执行输出（正常运行）
  - [ ] README.md更新diff（参数验证文档）
  - [ ] docs/migration-guide.md内容（如创建）

  **Commit**: YES
  - Message: `docs: Update README with parameter validation guide and complete Sprint 2-3`
  - Files: `README.md`, `docs/migration-guide.md` (如创建)
  - Pre-commit: `bun test && bun run typecheck && bun run examples/run-example.ts`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(deps): Add Zod validation library (^3.x)` | package.json, bun.lockb, src/__tests__/validation.test.ts | bun test src/__tests__/validation.test.ts |
| 2 | `feat(validation): Add Zod schema validation framework` | src/utils/validation.ts, src/__tests__/validation.test.ts | bun test src/__tests__/validation.test.ts && bun run typecheck |
| 3 | `feat(mcp): Add parameter validation to reasoning tool` | src/server.ts, src/__tests__/mcp-tools.test.ts | bun test src/__tests__/mcp-tools.test.ts -t "reasoning" |
| 4 | `feat(mcp): Add parameter validation to query_agent tool` | src/server.ts, src/__tests__/mcp-tools.test.ts | bun test src/__tests__/mcp-tools.test.ts -t "query_agent" |
| 5 | `feat(mcp): Add parameter validation to validate_model tool` | src/server.ts, src/__tests__/mcp-tools.test.ts | bun test src/__tests__/mcp-tools.test.ts -t "validate_model" |
| 6 | `feat(mcp): Add parameter validation to health_check tool` | src/server.ts, src/__tests__/mcp-tools.test.ts | bun test src/__tests__/mcp-tools.test.ts -t "health_check" |
| 7 | `docs: Update README with parameter validation guide and complete Sprint 2-3` | README.md, docs/migration-guide.md | bun test && bun run typecheck |
| 8 | `docs: Add TypeScript import issues diagnostic report` | docs/typescript-import-issues.md | grep -c "## 问题复现" docs/typescript-import-issues.md |

---

## Success Criteria

### Verification Commands
```bash
# 所有测试通过（包括新增的8+个MCP工具测试）
bun test  # 预期: 所有测试PASS, 0 failures

# TypeScript编译无错
bun run typecheck  # 预期: 0 errors

# 示例脚本正常运行（向后兼容）
bun run examples/run-example.ts  # 预期: 正常输出，退出码0

# 检查Zod安装
grep '"zod":' package.json  # 预期: 输出 "zod": "^3.x.x"

# 检查验证框架存在
ls -lh src/utils/validation.ts  # 预期: 文件存在

# 检查测试文件存在
ls -lh src/__tests__/mcp-tools.test.ts  # 预期: 文件存在

# 检查文档更新
grep -A 5 "参数验证" README.md  # 预期: 找到参数验证章节
```

### Final Checklist
- [ ] 所有 "Must Have" 完成
  - [x] Zod验证框架完整实现
  - [x] 所有4个MCP工具都有参数验证
  - [x] 错误响应格式统一且信息丰富
  - [x] TDD方式开发（测试先于实现）
  - [x] 增量式集成（一次改一个工具）
  
- [ ] 所有 "Must NOT Have" 遵守
  - [x] 未重构agent-executor.ts
  - [x] 未集成LLM
  - [x] 未优化工作流并行
  - [x] 未大规模改动server.ts结构
  - [x] 未过度设计错误类型
  - [x] 未一次性集成所有工具
  
- [ ] 所有测试通过
  - [ ] `bun test` → PASS（15+个测试）
  - [ ] `bun run typecheck` → 0 errors
  - [ ] `bun run examples/run-example.ts` → 正常运行
  
- [ ] 文档完整
  - [ ] README.md包含参数验证说明
  - [ ] 每个tool至少1个错误示例
  - [ ] TypeScript诊断报告存在（docs/typescript-import-issues.md）
