# SocialGuessSkills 生产路线图计划

## TL;DR

> **快速摘要**: 将多智能体社会系统建模框架从mock数据驱动升级到生产就绪状态，集成真实LLM、完善错误处理、添加监控体系。
>
> **交付物**:
> - TypeScript依赖修复（20个错误清零）
> - 真实Anthropic LLM集成（替换simulateAICall）
> - 错误处理机制（重试、断路器、降级）
> - 结构化日志系统（JSON格式）
> - 环境变量配置（.env模板）
> - 健康检查端点
> - 成本监控和告警（$10-50/月预算）
> - 进度反馈机制（可选，完整功能边界）
> - 请求队列（可选，完整功能边界）
> - 成本预测（可选，完整功能边界）
>
> **预估工作量**: 中等（6周，~20个任务）
> **并行执行**: YES - 3阶段（每个阶段内部可并行）
> **关键路径**: 依赖修复 → LLM集成 → 错误处理 → 监控完善

---

## Context

### Original Request
制定详细的生产路线图，将项目从当前状态（97%核心完成，mock数据）提升到生产就绪状态。

### Interview Summary
**关键决策**:
- **API配额**: 有密钥，$10-50/月（中等预算）
- **部署环境**: Claude Desktop本地调用（单用户）
- **性能要求**: >60秒可接受（宽松）
- **监控需求**: 基础+性能+成本（全选）
- **功能边界**: 标准+基础优化（完整）
- **测试策略**: Agent QA自动验证（不编写单元测试）

**Metis Review**:
**识别的缺陷**（已处理）:
- **缺失验收标准**: 添加了可执行的bash验证命令
- **范围蔓延风险**: 明确排除Web UI、多模型支持、用户认证、数据库
- **Edge cases未处理**: 添加API限流、并发冲突、Token超限、JSON解析失败的处理
- **依赖问题**: 优先修复TypeScript错误
- **环境配置缺失**: 添加.env模板和dotenv集成

**研究结论**:
- Anthropic TypeScript SDK提供完整错误处理和重试支持
- 生产级项目普遍使用环境变量管理密钥
- 指数退避重试是标准实践（1s → 2s → 4s → 8s）
- 结构化日志推荐pino或bunyan（JSON格式）

---

## Work Objectives

### Core Objective
将SocialGuessSkills从mock数据驱动的原型升级为生产可用的多智能体社会系统建模工具，确保稳定可靠、成本可控、可观测。

### Concrete Deliverables
- 修复所有20个TypeScript类型错误
- 替换simulateAICall()为真实Anthropic API调用
- 实现重试机制（指数退避，最多3次）
- 实现断路器模式（连续5次失败熔断）
- 添加结构化日志系统（JSON格式）
- 实现环境变量配置（.env.example + dotenv）
- 创建健康检查端点（/health）
- 实现Token成本监控和预算告警
- 添加进度反馈机制（MCP进度通知）
- 实现请求队列（限制并发数）
- 添加成本预测功能

### Definition of Done
- [x] `bunx tsc --noEmit` 零错误
- [x] `bun test` 17/17测试通过
- [x] `bun run src/server.ts` 正常启动并响应MCP调用
- [x] 真实LLM调用成功率 >95%
- [x] API失败自动重试，重试成功率 >50%
- [x] 日志输出JSON格式，包含timestamp、level、message
- [x] 月度成本不超过$50（告警触发）
- [x] 响应时间 <60秒（平均）

### Must Have
- 零TypeScript错误
- 真实LLM集成（Anthropic API）
- 错误处理和重试机制
- 环境变量配置
- 结构化日志
- Token成本监控
- 健康检查端点

### Must NOT Have (Guardrails)
- **禁止 Web UI可视化**（延后至M4或以后）
- **禁止 多模型支持**（M1-M3仅支持Anthropic）
- **禁止 用户认证系统**（Claude Desktop自带用户隔离）
- **禁止 数据库持久化**（无状态设计）
- **禁止 Redis缓存**（过早优化）
- **禁止 过度抽象**（不创建通用LLM provider接口）
- **禁止 硬编码API密钥**（必须从环境变量读取）
- **禁止 提交.env到git**（必须在.gitignore中）
- **禁止 @ts-ignore**（必须修复类型错误）
- **禁止 需要用户干预的验收标准**

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
> This is NOT conditional — it applies to EVERY task, regardless of test strategy.
>
> **FORBIDDEN** — acceptance criteria that require:
> - "User manually tests..." / "用户手动测试..."
> - "User visually confirms..." / "用户视觉确认..."
> - "User interacts with..." / "用户交互..."
> - "Ask user to verify..." / "请用户验证..."
> - ANY step where a human must perform an action
>
> **ALL verification is executed by the agent** using tools (Playwright, interactive_bash, curl, etc.). No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Bun内置测试框架)
- **Automated tests**: NO (用户选择Agent QA验证，不编写单元测试)
- **Framework**: bun test (内置)

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

> **Whether TDD is enabled or not, EVERY task MUST include Agent-Executed QA Scenarios.**
> - **With TDD**: QA scenarios complement unit tests at integration/E2E level
> - **Without TDD**: QA scenarios are the PRIMARY verification method
>
> These describe how the executing agent DIRECTLY verifies the deliverable
> by running it — opening browsers, executing commands, sending API requests.
> The agent performs what a human tester would do, but automated via tools.

**Verification Tool by Deliverable Type:**

| Type | Tool | How Agent Verifies |
|------|------|-------------------|
| **MCP Server** | Bash (curl) | Send MCP JSON-RPC requests, assert responses |
| **API Integration** | Bash (curl/httpie) | Send HTTP requests, parse responses, assert fields |
| **CLI/Server** | Bash (tmux) | Run command, send signals, validate output, check exit code |
| **Environment Config** | Bash (shell) | Apply config, run state checks, validate |
| **Logging** | Bash (shell) | Trigger actions, capture logs, assert format/level |
| **Cost Monitoring** | Bash (curl) | Simulate requests, check counters, verify alerts |

**Each Scenario MUST Follow This Format:**

```
Scenario: [Descriptive name — what user action/flow is being verified]
  Tool: [Playwright / Bash / interactive_bash]
  Preconditions: [What must be true before this scenario runs]
  Steps:
    1. [Exact action with specific command/endpoint/data]
    2. [Next action with expected intermediate state]
    3. [Assertion with exact expected value]
  Expected Result: [Concrete, observable outcome]
  Failure Indicators: [What would indicate failure]
  Evidence: [Log file path / output capture / response body path]
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: 修复TypeScript依赖
└── Task 2: 创建环境配置（并行，无依赖）

Wave 2 (After Wave 1):
├── Task 3: 修复类型错误
├── Task 4: 创建健康检查端点（并行，无依赖）

Wave 3 (After Task 3):
├── Task 5: 集成Anthropic SDK
├── Task 6: 实现重试机制（并行，无依赖）

Wave 4 (After Task 5):
├── Task 7: 替换simulateAICall
├── Task 8: 实现断路器（并行，无依赖）

Wave 5 (After Task 7):
├── Task 9: 实现Token计数
├── Task 10: 实现成本告警（并行，无依赖）

Wave 6 (After Task 9):
├── Task 11: 添加结构化日志
├── Task 12: 实现进度反馈（并行，无依赖）

Wave 7 (After Task 11):
├── Task 13: 实现请求队列
├── Task 14: 添加成本预测（并行，无依赖）

Critical Path: Task 1 → Task 3 → Task 5 → Task 7 → Task 9 → Task 11 → Task 13
Parallel Speedup: ~45% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 3 | 2 |
| 2 | None | 5 | 1 |
| 3 | 1 | 5 | 4 |
| 4 | None | 5, 6, 7 | 3 |
| 5 | 3 | 7 | 6 |
| 6 | None | 8 | 5, 7 |
| 7 | 5 | 9 | 8 |
| 8 | None | 9 | 7 |
| 9 | 7 | 11 | 10 |
| 10 | None | 12 | 9 |
| 11 | 9 | 13 | 12 |
| 12 | None | 14 | 11, 13 |
| 13 | 11 | 15 | 14 |
| 14 | None | 16 | 13 |

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info.

### Phase 1: 环境修复（Week 1）

- [x] 1. 修复TypeScript依赖问题

  **What to do**:
  - 分析当前peerDependency冲突错误
  - 更新`package.json`的`peerDependencies`版本
  - 确保`@types/bun`与Bun运行时版本兼容
  - 运行`bun install`验证依赖安装成功
  - 如仍有冲突，使用`npm install --legacy-peer-deps`作为临时方案

  **Must NOT do**:
  - 不要修改`devDependencies`中的Bun版本（可能导致运行时不兼容）
  - 不要添加不必要的依赖（保持轻量级）

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: 依赖修复是明确的单文件操作，无需深度分析
  - **Skills**: `[]`
    - Reason: 无需特定技能，标准npm/bun操作

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 1 (with Task 2) | Sequential
  - **Blocks**: [Task 3: 修复类型错误]
  - **Blocked By**: [None] (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  > The executor has NO context from your interview. References are their ONLY guide.
  > Each reference must answer: "What should I look at and WHY?"

  **Pattern References** (existing code to follow):
  - `package.json:1-30` - 现有依赖配置，理解peerDependencies结构

  **API/Type References** (contracts to implement against):
  - `bun install` CLI - 依赖安装命令和错误处理

  **Documentation References** (specs and requirements):
  - `package.json` - peerDependencies语义和版本范围规范

  **External References** (libraries and frameworks):
  - Bun official docs: `https://bun.sh/docs/install` - 版本兼容性指南
  - npm docs: `https://docs.npmjs.com/cli/v9/configuring-npm/package-json#peerdependencies` - peerDependencies规范

  **WHY Each Reference Matters** (explain the relevance):
  - Don't just list files - explain what pattern/information the executor should extract
  - Bad: `package.json` (vague, which part?)
  - Good: `package.json:peerDependencies` - 理解peerDependency冲突原因，找到正确版本范围

  **Acceptance Criteria**:

  > **AGENT-EXECUTABLE VERIFICATION ONLY** — No human action permitted.
  > Every criterion MUST be verifiable by running a command or using a tool.
  > REPLACE all placeholders with actual values from task context.

  **Agent-Executed QA Scenarios (MANDATORY — per-scenario, ultra-detailed):**

  \`\`\`
  Scenario: TypeScript依赖成功安装
    Tool: Bash (bun)
    Preconditions: package.json已更新peerDependencies版本
    Steps:
      1. bun install
      2. Assert: exit code 0
      3. Assert: stdout不包含"peerDependency missing"或"ERR_PNPM_PEER_DEP_ISSUE"
      4. Assert: node_modules/目录包含@anthropic-ai/sdk
      5. Assert: node_modules/@types/bun/存在
    Expected Result: 所有依赖安装成功，无peerDependency错误
    Failure Indicators: exit code非0, stdout包含"peerDependency missing"
    Evidence: bun install输出捕获到.sisyphus/evidence/task-1-install.log
  \`\`\`

  \`\`\`
  Scenario: TypeScript类型检查可运行
    Tool: Bash (bunx)
    Preconditions: 依赖安装成功
    Steps:
      1. bunx tsc --noEmit
      2. Assert: exit code 0 或 exit code 1（如果仍有类型错误，需记录数量）
      3. Assert: stderr包含类型错误数量（如"error TS2345: 3 errors"）
    Expected Result: tsc可运行，类型错误可被检测
    Failure Indicators: exit code 2或更高, 无法运行tsc
    Evidence: tsc输出捕获到.sisyphus/evidence/task-1-tsc.log
  \`\`\`

  **Evidence to Capture**:
  - [ ] bun install输出: .sisyphus/evidence/task-1-install.log
  - [ ] tsc输出: .sisyphus/evidence/task-1-tsc.log

  **Commit**: YES | NO (groups with N)
  - Message: `fix(deps): resolve TypeScript peerDependency conflicts`
  - Files: `package.json`
  - Pre-commit: `bunx tsc --noEmit`

---

- [x] 2. 创建环境变量配置

  **What to do**:
  - 创建`.env.example`文件，包含所有环境变量模板
  - 创建`.env`文件（本地开发用，不提交到git）
  - 确保`.env`在`.gitignore`中
  - 集成`dotenv`或Bun内置环境变量支持
  - 更新`package.json`的`scripts`，自动加载环境变量

  **Must NOT do**:
  - 不要硬编码API密钥到代码
  - 不要提交`.env`到git仓库
  - 不要在`.env.example`中包含真实密钥（仅占位符）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 环境配置是标准实践，无复杂逻辑
  - **Skills**: `[]`
    - Reason: 标准文件操作和git配置

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 1 (with Task 1) | Sequential
  - **Blocks**: [Task 5: 集成Anthropic SDK]
  - **Blocked By**: [None] (can start immediately)

  **References**:
  **Pattern References**:
  - 无现有模式参考（新增配置）

  **API/Type References**:
  - `process.env` API - Node.js/Bun环境变量读取

  **Documentation References**:
  - `.gitignore`规范 - 确保敏感文件不被提交
  - `dotenv`文档 - 环境变量加载最佳实践

  **External References**:
  - Bun docs: `https://bun.sh/docs/env` - Bun环境变量支持
  - dotenv docs: `https://github.com/motdotla/dotenv` - dotenv用法

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: .env.example包含所有必需变量
    Tool: Bash (cat)
    Preconditions: .env.example已创建
    Steps:
      1. cat .env.example
      2. Assert: 包含"ANTHROPIC_API_KEY="
      3. Assert: 包含"MAX_TOKENS="
      4. Assert: 包含"MAX_CONCURRENT="
      5. Assert: 不包含真实API密钥（无"sk-ant-"）
    Expected Result: .env.example包含所有环境变量模板，无真实密钥
    Failure Indicators: 缺少必需变量, 包含真实密钥
    Evidence: .env.example内容
  \`\`\`

  \`\`\`
  Scenario: .env在.gitignore中
    Tool: Bash (grep)
    Preconditions: .gitignore存在
    Steps:
      1. grep "^\\.env$" .gitignore
      2. Assert: exit code 0（找到匹配行）
      3. Assert: 无注释（不以#开头）
    Expected Result: .env在.gitignore中，不会被提交
    Failure Indicators: exit code 1（未找到）
    Evidence: grep输出
  \`\`\`

  \`\`\`
  Scenario: 环境变量可从代码读取
    Tool: Bash (bun)
    Preconditions: .env文件包含测试值
    Steps:
      1. echo "ANTHROPIC_API_KEY=sk-test-key" > .env
      2. echo "MAX_TOKENS=50000" >> .env
      3. bun run -e 'console.log(process.env.ANTHROPIC_API_KEY, process.env.MAX_TOKENS)'
      4. Assert: stdout包含"sk-test-key"
      5. Assert: stdout包含"50000"
      6. bun run -e 'console.log(process.env.UNKNOWN_VAR)'
      7. Assert: stdout包含"undefined"或空
    Expected Result: 环境变量可正确读取，缺失变量返回undefined
    Failure Indicators: 环境变量未加载或值不正确
    Evidence: bun输出
  \`\`\`

  **Evidence to Capture**:
  - [ ] .env.example内容: 复制到报告
  - [ ] .gitignore验证结果: grep输出
  - [ ] 环境变量读取测试: bun输出

  **Commit**: YES | NO (groups with N)
  - Message: `feat(config): add environment variable support with .env template`
  - Files: `.env.example`, `.gitignore`
  - Pre-commit: `test -f .env && git ls-files | grep "\.env$" && exit 1 || exit 0`

---

- [x] 3. 修复所有TypeScript类型错误

  **What to do**:
  - 运行`bunx tsc --noEmit`获取所有类型错误列表
  - 逐个修复20个类型错误（conflict-resolver.ts: 8个, server.ts: 12个）
  - 常见错误类型：类型不匹配、any类型、未定义属性
  - 不使用`@ts-ignore`或`@ts-expect-error`
  - 修复后运行`tsc`验证零错误
  - 运行`bun test`确保测试全部通过

  **Must NOT do**:
  - 不要使用`@ts-ignore`压制错误
  - 不要修改测试代码以适应错误（应修复实现）
  - 不要破坏现有功能

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 20个类型错误需要逐个分析和修复，工作量中等但影响核心功能
  - **Skills**: `[]`
    - Reason: TypeScript类型修复是标准开发技能

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 2 (with Task 4) | Sequential
  - **Blocks**: [Task 5: 集成Anthropic SDK]
  - **Blocked By**: [Task 1: 修复TypeScript依赖]

  **References**:
  **Pattern References**:
  - `src/types.ts:1-136` - 所有类型定义，参考正确类型使用

  **API/Type References**:
  - TypeScript compiler API - tsc错误消息解读

  **Documentation References**:
  - `src/types.ts` - 核心类型定义（AgentOutput, WorkflowState等）

  **External References**:
  - TypeScript docs: `https://www.typescriptlang.org/docs/handbook/2/basic-types.html` - 基础类型

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: TypeScript类型检查零错误
    Tool: Bash (bunx)
    Preconditions: 所有类型错误已修复
    Steps:
      1. bunx tsc --noEmit
      2. Assert: exit code 0
      3. Assert: stdout为空或仅包含"Found 0 errors"
      4. Assert: stderr不包含"error TS"
    Expected Result: TypeScript编译通过，零类型错误
    Failure Indicators: exit code非0, stdout包含"error TS"
    Evidence: tsc输出
  \`\`\`

  \`\`\`
  Scenario: 所有测试仍然通过
    Tool: Bash (bun)
    Preconditions: 类型错误已修复
    Steps:
      1. bun test
      2. Assert: stdout包含"17 pass"
      3. Assert: stdout不包含"fail"
      4. Assert: exit code 0
    Expected Result: 测试套件全部通过
    Failure Indicators: 测试失败数量 > 0
    Evidence: bun test输出
  \`\`\`

  \`\`\`
  Scenario: 特定文件无类型错误
    Tool: Bash (bunx)
    Preconditions: 修复了conflict-resolver.ts和server.ts
    Steps:
      1. bunx tsc --noEmit src/conflict-resolver.ts
      2. Assert: exit code 0
      3. bunx tsc --noEmit src/server.ts
      4. Assert: exit code 0
    Expected Result: 目标文件类型检查通过
    Failure Indicators: 仍有类型错误
    Evidence: tsc输出
  \`\`\`

  **Evidence to Capture**:
  - [ ] tsc零错误输出: 复制到报告
  - [ ] bun test 17/17通过输出: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `fix(types): resolve all 20 TypeScript errors in conflict-resolver and server`
  - Files: `src/conflict-resolver.ts`, `src/server.ts`
  - Pre-commit: `bunx tsc --noEmit && bun test`

---

- [x] 4. 创建健康检查端点

  **What to do**:
  - 在MCP服务器中添加`/health`端点
  - 端点返回JSON格式状态：`{"status": "ok", "timestamp": "...", "version": "..."}`
  - 检查依赖项：API密钥是否配置、环境变量是否加载
  - 返回200状态码或503（服务不可用）
  - 更新MCP工具列表，添加健康检查工具

  **Must NOT do**:
  - 不要暴露敏感信息（API密钥、环境变量）
  - 不要返回详细的内部状态（仅健康检查）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 健康检查端点是标准HTTP端点，逻辑简单
  - **Skills**: `[]`
    - Reason: 标准HTTP响应处理

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 2 (with Task 3) | Sequential
  - **Blocks**: [Task 5: 集成Anthropic SDK]
  - **Blocked By**: [None] (can start immediately)

  **References**:
  **Pattern References**:
  - `src/server.ts:41-83` - 现有MCP工具注册模式

  **API/Type References**:
  - Bun.serve() API - HTTP路由处理

  **Documentation References**:
  - MCP SDK docs: 工具注册规范

  **External References**:
  - Bun docs: `https://bun.sh/docs/http/server` - HTTP服务器

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 健康检查返回200 OK
    Tool: Bash (curl)
    Preconditions: 服务器运行在localhost:3000
    Steps:
      1. curl -s http://localhost:3000/health
      2. Assert: HTTP状态码 200
      3. Assert: 输出包含"{\"status\": \"ok\"}"
      4. Assert: 输出包含"timestamp"
      5. Assert: 输出包含"version"
    Expected Result: 健康检查返回正常状态
    Failure Indicators: 状态码非200, 输出格式错误
    Evidence: 响应体
  \`\`\`

  \`\`\`
  Scenario: 健康检查不暴露敏感信息
    Tool: Bash (curl)
    Preconditions: 服务器运行
    Steps:
      1. curl -s http://localhost:3000/health
      2. Assert: 输出不包含"sk-ant-"
      3. Assert: 输出不包含"password"
      4. Assert: 输出不包含"secret"
    Expected Result: 健康检查不泄露敏感信息
    Failure Indicators: 发现敏感信息
    Evidence: 响应体
  \`\`\`

  **Evidence to Capture**:
  - [ ] /health响应体: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `feat(server): add /health check endpoint`
  - Files: `src/server.ts`
  - Pre-commit: `bun test`

---

### Phase 2: LLM集成（Week 2-3）

- [x] 5. 集成Anthropic TypeScript SDK

  **What to do**:
  - 安装`@anthropic-ai/sdk`依赖
  - 在`src/agents/`下创建`llm-client.ts`文件
  - 实现Anthropic客户端初始化（从环境变量读取API密钥）
  - 实现`callAnthropic()`方法，支持prompt输入和响应解析
  - 添加错误处理：网络错误、API错误、超时
  - 编写简单测试验证客户端可连接

  **Must NOT do**:
  - 不要硬编码API密钥
  - 不要在`simulateAICall`中直接集成（创建新方法）
  - 不要过度抽象（不创建通用LLM接口）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: LLM集成是核心功能，需要正确处理错误和响应
  - **Skills**: `[]`
    - Reason: SDK集成是标准操作

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 3 (with Task 6) | Sequential
  - **Blocks**: [Task 7: 替换simulateAICall]
  - **Blocked By**: [Task 3: 修复类型错误]

  **References**:
  **Pattern References**:
  - 无现有模式参考（新增LLM客户端）

  **API/Type References**:
  - `@anthropic-ai/sdk` API - 消息创建、流式响应

  **Documentation References**:
  - Anthropic docs: API密钥管理、错误处理

  **External References**:
  - Anthropic SDK: `https://www.npmjs.com/package/@anthropic-ai/sdk` - SDK文档

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: Anthropic客户端可初始化
    Tool: Bash (bun)
    Preconditions: ANTHROPIC_API_KEY已设置
    Steps:
      1. bun run -e "import('./src/agents/llm-client.js').then(m => console.log('OK'))"
      2. Assert: exit code 0
      3. Assert: stdout包含"OK"
    Expected Result: LLM客户端可正常导入和初始化
    Failure Indicators: 导入失败或初始化错误
    Evidence: bun输出
  \`\`\`

  \`\`\`
  Scenario: 可发送简单消息并获取响应
    Tool: Bash (curl)
    Preconditions: 服务器运行且集成完成
    Steps:
      1. curl -X POST http://localhost:3000/api/test-llm \
           -H "Content-Type: application/json" \
           -d '{"prompt": "你好"}'
      2. Assert: HTTP状态码 200
      3. Assert: 响应包含"content"字段
      4. Assert: 响应content非空
    Expected Result: 可发送消息到Anthropic API并获取响应
    Failure Indicators: API调用失败
    Evidence: 响应体
  \`\`\`

  **Evidence to Capture**:
  - [ ] SDK导入测试输出: bun输出
  - [ ] API调用响应: curl输出

  **Commit**: YES | NO (groups with N)
  - Message: `feat(llm): integrate Anthropic TypeScript SDK`
  - Files: `src/agents/llm-client.ts`, `package.json`
  - Pre-commit: `bun test`

---

- [x] 6. 实现重试机制（指数退避）

  **What to do**:
  - 创建`src/utils/retry.ts`文件
  - 实现`retryWithBackoff()`函数，支持：
    - 最大重试次数（默认3次）
    - 指数退避（1s → 2s → 4s → 8s）
    - 可重试错误判断（网络错误、5xx状态码）
    - 不可重试错误判断（4xx、认证错误）
  - 添加Jitter（随机抖动，避免雷击效应）
  - 编写测试验证重试逻辑

  **Must NOT do**:
  - 不要重试认证错误（401, 403）
  - 不要重试超限错误（429，除非有Retry-After头）
  - 不要无限重试（必须有最大次数）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 重试逻辑是标准模式，有明确最佳实践
  - **Skills**: `[]`
    - Reason: 标准算法实现

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 3 (with Task 5) | Sequential
  - **Blocks**: [Task 8: 实现断路器]
  - **Blocked By**: [None] (can start immediately)

  **References**:
  **Pattern References**:
  - 无现有模式参考（新增重试工具）

  **Documentation References**:
  - `src/utils/` - 工具函数目录

  **External References**:
  - AWS exponential backoff: 最佳实践参考

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 可重试错误自动重试3次
    Tool: Bun (test)
    Preconditions: retry工具已实现
    Steps:
      1. bun test src/__tests__/retry.test.ts
      2. Assert: 输出包含"retry.test.ts"
      3. Assert: 输出包含"pass"（测试通过）
    Expected Result: 重试机制工作正确
    Failure Indicators: 测试失败
    Evidence: test输出
  \`\`\`

  **Evidence to Capture**:
  - [ ] retry测试输出: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `feat(retry): implement exponential backoff retry mechanism`
  - Files: `src/utils/retry.ts`, `src/__tests__/retry.test.ts`
  - Pre-commit: `bun test`

---

- [x] 7. 替换simulateAICall为真实LLM调用

  **What to do**:
  - 修改`src/agents/agent-executor.ts:49`
  - 替换`simulateAICall()`实现为调用`llm-client.ts`
  - 保留prompt模板读取逻辑（从`prompts/`目录）
  - 集成重试机制（包装LLM调用）
  - 保留返回格式（AgentOutput接口）
  - 编写集成测试验证真实LLM调用

  **Must NOT do**:
  - 不要删除prompt文件读取逻辑
  - 不要改变返回格式（AgentOutput）
  - 不要移除mock模式（可配置切换）

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: 需要确保不破坏现有逻辑，正确集成真实LLM
  - **Skills**: `[]`
    - Reason: 核心逻辑修改

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 4 (with Task 8) | Sequential
  - **Blocks**: [Task 9: 实现Token计数]
  - **Blocked By**: [Task 5: 集成Anthropic SDK]

  **References**:
  **Pattern References**:
  - `src/agents/agent-executor.ts:49-192` - 现有simulateAICall逻辑
  - `src/types.ts:3-25` - AgentOutput接口定义

  **API/Type References**:
  - `AgentOutput` interface - 返回数据结构

  **Documentation References**:
  - 无

  **External References**:
  - 无

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 真实LLM调用返回非mock数据
    Tool: Bash (curl)
    Preconditions: 服务器运行，真实LLM集成
    Steps:
      1. curl -X POST http://localhost:3000/tools/reasoning \
           -H "Content-Type: application/json" \
           -d '{
             "hypothesis": {
               "assumptions": ["10人社区"],
               "constraints": [],
               "goals": ["测试"]
             }
           }'
      2. Assert: 响应包含7个agentOutputs
      3. Assert: 每个agentOutput包含中文内容（非硬编码英文）
      4. Assert: 不包含"mock"或"测试数据"字样
    Expected Result: 返回真实AI生成的内容
    Failure Indicators: 返回mock数据
    Evidence: 响应体
  \`\`\`

  \`\`\`
  Scenario: LLM调用失败时自动重试
    Tool: Bash (bash)
    Preconditions: 设置无效API密钥
    Steps:
      1. ANTHROPIC_API_KEY=invalid-key bun run src/server.ts &
      2. sleep 2
      3. curl -X POST http://localhost:3000/tools/reasoning -d '{"hypothesis": {...}}'
      4. Assert: 服务器日志显示"Retry 1/3"
      5. Assert: 服务器日志显示"Retry 2/3"
      6. Assert: 服务器日志显示"Retry 3/3"
    Expected Result: API失败时自动重试3次
    Failure Indicators: 无重试日志
    Evidence: 服务器日志
  \`\`\`

  **Evidence to Capture**:
  - [ ] 真实LLM响应: 复制到报告
  - [ ] 重试日志: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `feat(agents): replace simulateAICall with real Anthropic LLM integration`
  - Files: `src/agents/agent-executor.ts`
  - Pre-commit: `bun test`

---

- [x] 8. 实现断路器模式

  **What to do**:
  - 创建`src/utils/circuit-breaker.ts`文件
  - 实现断路器类，支持：
    - 状态：CLOSED（正常）、OPEN（熔断）、HALF_OPEN（半开）
    - 阈值：连续失败5次触发熔断
    - 恢复：30秒后尝试半开
    - 半开：允许1个请求通过，成功则恢复，失败则继续熔断
  - 集成到LLM调用（包装llm-client）
  - 编写测试验证断路器状态转换

  **Must NOT do**:
  - 不要熔断可重试错误（只熔断持续失败）
  - 不要永久熔断（必须有恢复机制）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 断路器是标准模式，实现清晰
  - **Skills**: `[]`
    - Reason: 标准算法实现

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 4 (with Task 7) | Sequential
  - **Blocks**: [Task 9: 实现Token计数]
  - **Blocked By**: [None] (can start immediately)

  **References**:
  **Pattern References**:
  - 无现有模式参考（新增断路器）

  **Documentation References**:
  - Circuit Breaker pattern - 断路器模式最佳实践

  **External References**:
  - Martin Fowler Circuit Breaker: 模式参考

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 连续5次失败后熔断
    Tool: Bash (bash)
    Preconditions: 服务器运行，断路器集成
    Steps:
      1. ANTHROPIC_API_KEY=invalid-key bun run src/server.ts &
      2. sleep 2
      3. for i in {1..7}; do curl -s http://localhost:3000/tools/reasoning -d '{"hypothesis": {...}}' & done; wait
      4. Assert: 日志包含"第6次请求：断路器OPEN，直接返回"
      5. Assert: 日志包含"第7次请求：断路器OPEN，直接返回"
    Expected Result: 连续5次失败后触发熔断
    Failure Indicators: 7次请求都调用了API
    Evidence: 服务器日志
  \`\`\`

  **Evidence to Capture**:
  - [ ] 断路器日志: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `feat(circuit-breaker): implement circuit breaker pattern for LLM calls`
  - Files: `src/utils/circuit-breaker.ts`
  - Pre-commit: `bun test`

---

### Phase 3: 监控和优化（Week 4-6）

- [x] 9. 实现Token成本计数

  **What to do**:
  - 创建`src/utils/token-counter.ts`文件
  - 实现Token计数器：
    - 跟踪输入和输出token
    - 累计月度总消耗
    - 单次推理成本计算（Claude-3-Sonnet $3/1M输入, $15/1M输出）
  - 集成到LLM调用后（记录每次API调用的token）
  - 实现硬限制（50k tokens/请求，超限返回400）
  - 编写测试验证计数逻辑

  **Must NOT do**:
  - 不要记录敏感内容（仅记录数量）
  - 不要实时扣款（仅计数和告警）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Token计数是简单累加逻辑
  - **Skills**: `[]`
    - Reason: 标准计数实现

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 5 (with Task 10) | Sequential
  - **Blocks**: [Task 11: 添加结构化日志]
  - **Blocked By**: [Task 7: 替换simulateAICall]

  **References**:
  **Pattern References**:
  - 无现有模式参考（新增计数器）

  **Documentation References**:
  - Anthropic pricing: 定价参考

  **External References**:
  - Anthropic pricing: `https://www.anthropic.com/pricing` - Token定价

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: Token计数器正确累加
    Tool: Bun (test)
    Preconditions: 计数器已实现
    Steps:
      1. bun test src/__tests__/token-counter.test.ts
      2. Assert: 输出包含"pass"
    Expected Result: Token计数逻辑正确
    Failure Indicators: 测试失败
    Evidence: test输出
  \`\`\`

  \`\`\`
  Scenario: 超过50k token限制时返回400
    Tool: Bash (curl)
    Preconditions: 服务器运行
    Steps:
      1. curl -X POST http://localhost:3000/tools/reasoning \
           -H "Content-Type: application/json" \
           -d '{
             "hypothesis": {
               "assumptions": ["...100k字符..."],
               "constraints": [],
               "goals": []
             }
           }'
      2. Assert: HTTP状态码 400
      3. Assert: 响应包含"exceeds 50000 token limit"
    Expected Result: 超限请求被拒绝
    Failure Indicators: 返回200或处理了超限请求
    Evidence: 响应体
  \`\`\`

  **Evidence to Capture**:
  - [ ] 计数器测试输出: 复制到报告
  - [ ] 超限错误响应: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `feat(cost): implement token counting and cost tracking`
  - Files: `src/utils/token-counter.ts`, `src/__tests__/token-counter.test.ts`
  - Pre-commit: `bun test`

---

- [x] 10. 实现成本告警

  **What to do**:
  - 创建`src/utils/cost-alert.ts`文件
  - 实现成本监控：
    - 月度预算$10-50（可配置）
    - 告警阈值：$5（50%预算）、$10（100%预算）
    - 超预算时拒绝新请求
  - 告警方式：
    - 日志输出WARN/ERROR级别
    - 可选：发送到配置的webhook或email（延后）
  - 集成到Token计数器（达到阈值时触发）
  - 编写测试验证告警逻辑

  **Must NOT do**:
  - 不要立即扣费（仅告警和拒绝）
  - 不要发送敏感信息到外部（告警内容去敏）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 告警逻辑简单（阈值判断）
  - **Skills**: `[]`
    - Reason: 标准监控实现

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 5 (with Task 9) | Sequential
  - **Blocks**: [Task 12: 实现进度反馈]
  - **Blocked By**: [None] (can start immediately)

  **References**:
  **Pattern References**:
  - 无现有模式参考（新增告警）

  **Documentation References**:
  - 无

  **External References**:
  - 无

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 达到$5阈值时输出WARN日志
    Tool: Bash (bun)
    Preconditions: 服务器运行，模拟累计$5成本
    Steps:
      1. bun run src/server.ts 2>&1 | tee /tmp/server.log &
      2. sleep 2
      3. # 模拟多次调用达到$5阈值
      4. grep "WARN" /tmp/server.log | grep "cost.*50%"
      5. Assert: exit code 0（找到告警）
    Expected Result: 成本达到50%时输出WARN日志
    Failure Indicators: 无告警日志
    Evidence: server.log
  \`\`\`

  **Evidence to Capture**:
  - [ ] 告警日志: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `feat(cost): implement cost alerting with budget thresholds`
  - Files: `src/utils/cost-alert.ts`
  - Pre-commit: `bun test`

---

- [x] 11. 添加结构化日志系统

  **What to do**:
  - 选择日志库（pino或bunyan，推荐pino）
  - 创建`src/utils/logger.ts`文件
  - 实现日志器：
    - JSON格式输出
    - 日志级别：debug/info/warn/error
    - 包含字段：timestamp, level, message, requestId（可选）
    - 从环境变量读取日志级别（LOG_LEVEL）
  - 替换所有`console.log`为`logger.info/error`
  - 编写测试验证日志格式
  - 配置日志轮转（避免日志文件过大）

  **Must NOT do**:
  - 不要在日志中输出敏感信息（API密钥、用户数据）
  - 不要使用console.log（必须用logger）
  - 不要在生产环境输出debug日志

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 日志集成是标准实践，pino库易用
  - **Skills**: `[]`
    - Reason: 标准日志配置

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 6 (with Task 12) | Sequential
  - **Blocks**: [Task 13: 实现请求队列]
  - **Blocked By**: [Task 9: 实现Token计数]

  **References**:
  **Pattern References**:
  - 无现有模式参考（新增日志）

  **Documentation References**:
  - pino docs: 日志库文档

  **External References**:
  - pino: `https://getpino.io/#/` - 快速JSON logger

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 日志输出为JSON格式
    Tool: Bash (bun)
    Preconditions: 服务器运行
    Steps:
      1. bun run src/server.ts 2>&1 | head -1 | jq .
      2. Assert: exit code 0（可解析为JSON）
      3. Assert: 输出包含"timestamp"
      4. Assert: 输出包含"level"
      5. Assert: 输出包含"message"
    Expected Result: 日志为JSON格式，包含必需字段
    Failure Indicators: 无法解析为JSON，缺少字段
    Evidence: 日志输出
  \`\`\`

  \`\`\`
  Scenario: 日志级别可配置
    Tool: Bash (bun)
    Preconditions: 服务器运行
    Steps:
      1. LOG_LEVEL=debug bun run src/server.ts 2>&1 | head -5
      2. Assert: 输出包含"debug"级别日志
      3. LOG_LEVEL=warn bun run src/server.ts 2>&1 | head -5
      4. Assert: 输出不包含"debug"或"info"级别日志
      5. Assert: 输出包含"warn"或"error"
    Expected Result: 日志级别可通过环境变量控制
    Failure Indicators: 级别配置无效
    Evidence: 日志输出
  \`\`\`

  **Evidence to Capture**:
  - [ ] JSON格式日志: 复制到报告
  - [ ] 日志级别测试: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `feat(logging): add structured JSON logging with pino`
  - Files: `src/utils/logger.ts`, `package.json`
  - Pre-commit: `bun test`

---

- [x] 12. 实现进度反馈机制（可选）

  **What to do**:
  - 在MCP协议中添加进度通知
  - 在Agent执行时发送进度更新（Agent 1/7完成、2/7完成...）
  - 进度通知格式：`{"stage": "agent_execution", "progress": 3, "total": 7, "message": "正在运行文化分析Agent"}`
  - 集成到orchestrator工作流
  - （可选）实现MCP客户端的进度显示

  **Must NOT do**:
  - 不要发送敏感数据到进度通知
  - 不要频繁更新（每Agent一次即可）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 进度反馈是MCP协议扩展，逻辑简单
  - **Skills**: `[]`
    - Reason: 标准MCP通知

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 6 (with Task 11) | Sequential
  - **Blocks**: [Task 14: 添加成本预测]
  - **Blocked By**: [None] (can start immediately)

  **References**:
  **Pattern References**:
  - `src/workflow/orchestrator.ts:68-85` - Agent执行循环

  **Documentation References**:
  - MCP protocol docs: 通知机制

  **External References**:
  - 无

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: Agent执行时发送进度通知
    Tool: Bash (curl)
    Preconditions: 服务器运行
    Steps:
      1. curl -X POST http://localhost:3000/tools/reasoning \
           -H "Content-Type: application/json" \
           -d '{"hypothesis": {...}}' \
           2>&1 | grep "progress"
      2. Assert: 输出包含"progress": 1
      3. Assert: 输出包含"progress": 2
      4. Assert: 输出包含"progress": 7
    Expected Result: 每个Agent完成时发送进度通知
    Failure Indicators: 无进度通知
    Evidence: curl输出
  \`\`\`

  **Evidence to Capture**:
  - [ ] 进度通知输出: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `feat(mcp): add progress notifications for agent execution`
  - Files: `src/workflow/orchestrator.ts`
  - Pre-commit: `bun test`

---

- [x] 13. 实现请求队列（可选）

  **What to do**:
  - 创建`src/utils/request-queue.ts`文件
  - 实现请求队列：
    - 限制并发数（MAX_CONCURRENT，默认3）
    - 排队机制（超过并发限制时排队）
    - FIFO调度
  - 集成到MCP工具入口（reasoning/query_agent/validate_model）
  - 添加队列状态日志
  - 编写测试验证队列行为

  **Must NOT do**:
  - 不要无限队列（限制队列大小）
  - 不要阻塞队列清理（处理完成后及时清理）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 请求队列是标准并发控制模式
  - **Skills**: `[]`
    - Reason: 标准队列实现

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 7 (with Task 14) | Sequential
  - **Blocks**: [Task 15: 验证端到端]
  - **Blocked By**: [Task 11: 添加结构化日志]

  **References**:
  **Pattern References**:
  - 无现有模式参考（新增队列）

  **Documentation References**:
  - 无

  **External References**:
  - 无

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 超过并发限制时请求排队
    Tool: Bash (bash)
    Preconditions: 服务器运行，MAX_CONCURRENT=2
    Steps:
      1. MAX_CONCURRENT=2 bun run src/server.ts &
      2. sleep 2
      3. for i in {1..5}; do curl -s http://localhost:3000/tools/reasoning -d '{"hypothesis": {...}}' & done; wait
      4. Assert: 服务器日志包含"队列中等待"或"queuing"
      5. Assert: 前两个请求先完成，后三个等待
    Expected Result: 超过并发限制时请求排队
    Failure Indicators: 所有请求并发执行
    Evidence: 服务器日志
  \`\`\`

  **Evidence to Capture**:
  - [ ] 队列日志: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `feat(queue): implement request queue with concurrency limit`
  - Files: `src/utils/request-queue.ts`
  - Pre-commit: `bun test`

---

- [x] 14. 添加成本预测功能（可选）

  **What to do**:
  - 创建`src/utils/cost-predictor.ts`文件
  - 实现成本预测：
    - 基于输入token估算输出token
    - 估算单次推理成本
    - 月度剩余预算和可执行次数预测
  - 添加MCP工具`estimate_cost`，接受hypothesis输入
  - 返回预测成本：`{"estimated_tokens": 15000, "estimated_cost": 0.05, "remaining_requests": 200}`
  - 编写测试验证预测准确性

  **Must NOT do**:
  - 不要保证预测准确（仅为估算）
  - 不要扣除实际成本（仅估算）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: 成本预测是简单数学估算
  - **Skills**: `[]`
    - Reason: 标准数学计算

  **Parallelization**:
  - **Can Run In Parallel**: YES | NO
  - **Parallel Group**: Wave 7 (with Task 13) | Sequential
  - **Blocks**: [Task 15: 验证端到端]
  - **Blocked By**: [None] (can start immediately)

  **References**:
  **Pattern References**:
  - 无现有模式参考（新增预测）

  **Documentation References**:
  - Anthropic pricing: Token定价

  **External References**:
  - 无

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 可预测推理成本
    Tool: Bash (curl)
    Preconditions: 服务器运行
    Steps:
      1. curl -X POST http://localhost:3000/tools/estimate_cost \
           -H "Content-Type: application/json" \
           -d '{
             "hypothesis": {
               "assumptions": ["100人社区"],
               "constraints": [],
               "goals": ["建立合作"]
             }
           }'
      2. Assert: HTTP状态码 200
      3. Assert: 响应包含"estimated_tokens"
      4. Assert: 响应包含"estimated_cost"
      5. Assert: estimated_cost > 0
    Expected Result: 可预测推理成本
    Failure Indicators: 返回错误或负数成本
    Evidence: 响应体
  \`\`\`

  **Evidence to Capture**:
  - [ ] 成本预测响应: 复制到报告

  **Commit**: YES | NO (groups with N)
  - Message: `feat(cost): add cost prediction tool for hypothesis estimation`
  - Files: `src/utils/cost-predictor.ts`, `src/server.ts`
  - Pre-commit: `bun test`

---

- [x] 15. 端到端验证（Phase 3完成）

  **What to do**:
  - 运行完整工作流测试（真实LLM）
  - 验证所有功能正常：
    - 健康检查
    - LLM调用
    - 错误处理和重试
    - Token计数
    - 成本监控
    - 结构化日志
    - （可选）进度反馈
    - （可选）请求队列
    - （可选）成本预测
  - 运行所有单元测试
  - 验证TypeScript零错误
  - 记录性能指标（响应时间、token消耗）

  **Must NOT do**:
  - 不要跳过任何功能验证

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 端到端验证需要全面测试
  - **Skills**: `[]`
    - Reason: 标准验证流程

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: [None] (final task)
  - **Blocked By**: [Task 13: 实现请求队列]

  **References**:
  **Pattern References**:
  - `examples/run-example.ts` - 示例运行

  **Documentation References**:
  - 无

  **External References**:
  - 无

  **Acceptance Criteria**:

  **Agent-Executed QA Scenarios**:

  \`\`\`
  Scenario: 端到端工作流成功生成模型
    Tool: Bash (bun)
    Preconditions: 服务器运行，所有功能已集成
    Steps:
      1. time bun run examples/run-example.ts
      2. Assert: exit code 0
      3. Assert: stdout包含"SystemStructure"
      4. Assert: stdout包含"resourceLayer"
      5. Assert: stdout包含"governanceLayer"
      6. Assert: real < 60（响应时间<60秒）
      7. Assert: stdout不包含"mock"
      8. Assert: stdout不包含"simulateAICall"
    Expected Result: 完整工作流成功，返回真实AI生成模型
    Failure Indicators: 工作流失败，返回mock数据，超时
    Evidence: run-example输出
  \`\`\`

  \`\`\`
  Scenario: 所有测试通过
    Tool: Bash (bun)
    Preconditions: 所有功能已实现
    Steps:
      1. bun test
      2. Assert: stdout包含"pass"
      3. Assert: stdout不包含"fail"
      4. Assert: exit code 0
    Expected Result: 所有测试通过
    Failure Indicators: 测试失败
    Evidence: bun test输出
  \`\`\`

  \`\`\`
  Scenario: TypeScript零错误
    Tool: Bash (bunx)
    Preconditions: 所有类型错误已修复
    Steps:
      1. bunx tsc --noEmit
      2. Assert: exit code 0
      3. Assert: stdout不包含"error TS"
    Expected Result: TypeScript编译通过
    Failure Indicators: 类型错误
    Evidence: tsc输出
  \`\`\`

  \`\`\`
  Scenario: 健康检查正常
    Tool: Bash (curl)
    Preconditions: 服务器运行
    Steps:
      1. curl -s http://localhost:3000/health
      2. Assert: HTTP状态码 200
      3. Assert: 输出包含"status": "ok"
    Expected Result: 健康检查端点可用
    Failure Indicators: 端点不可用
    Evidence: curl输出
  \`\`\`

  **Evidence to Capture**:
  - [ ] 端到端输出: 复制到报告
  - [ ] bun test输出: 复制到报告
  - [ ] tsc输出: 复制到报告
  - [ ] 健康检查输出: 复制到报告

  **Commit**: NO (verification task, no changes)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(deps): resolve TypeScript peerDependency conflicts` | package.json | bunx tsc --noEmit |
| 2 | `feat(config): add environment variable support with .env template` | .env.example, .gitignore | bun test |
| 3 | `fix(types): resolve all 20 TypeScript errors in conflict-resolver and server` | src/conflict-resolver.ts, src/server.ts | bunx tsc --noEmit && bun test |
| 4 | `feat(server): add /health check endpoint` | src/server.ts | bun test |
| 5 | `feat(llm): integrate Anthropic TypeScript SDK` | src/agents/llm-client.ts, package.json | bun test |
| 6 | `feat(retry): implement exponential backoff retry mechanism` | src/utils/retry.ts, src/__tests__/retry.test.ts | bun test |
| 7 | `feat(agents): replace simulateAICall with real Anthropic LLM integration` | src/agents/agent-executor.ts | bun test |
| 8 | `feat(circuit-breaker): implement circuit breaker pattern for LLM calls` | src/utils/circuit-breaker.ts | bun test |
| 9 | `feat(cost): implement token counting and cost tracking` | src/utils/token-counter.ts, src/__tests__/token-counter.test.ts | bun test |
| 10 | `feat(cost): implement cost alerting with budget thresholds` | src/utils/cost-alert.ts | bun test |
| 11 | `feat(logging): add structured JSON logging with pino` | src/utils/logger.ts, package.json | bun test |
| 12 | `feat(mcp): add progress notifications for agent execution` | src/workflow/orchestrator.ts | bun test |
| 13 | `feat(queue): implement request queue with concurrency limit` | src/utils/request-queue.ts | bun test |
| 14 | `feat(cost): add cost prediction tool for hypothesis estimation` | src/utils/cost-predictor.ts, src/server.ts | bun test |
| 15 | N/A (verification) | N/A | N/A |

---

## Success Criteria

### Verification Commands
```bash
# TypeScript零错误
bunx tsc --noEmit
# Expected: exit code 0, no errors

# 所有测试通过
bun test
# Expected: 17 pass, 0 fail

# 健康检查
curl -s http://localhost:3000/health
# Expected: {"status": "ok", "timestamp": "...", "version": "..."}

# 端到端工作流
time bun run examples/run-example.ts
# Expected: real < 60, no errors, returns SystemStructure

# 真实LLM调用验证
curl -X POST http://localhost:3000/tools/reasoning -d '{"hypothesis": {...}}'
# Expected: 7 agentOutputs, non-mock content
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] All tests pass (17/17)
- [x] TypeScript zero errors
- [x] Health check endpoint working
- [x] Real LLM integration verified
- [x] Retry mechanism functional
- [x] Circuit breaker working
- [x] Token counting accurate
- [x] Cost alerting active
- [x] Structured logging in place
- [x] Progress feedback sending (if implemented)
- [x] Request queue limiting concurrency (if implemented)
- [x] Cost prediction tool available (if implemented)
- [x] No hardcoded API keys
- [x] .env in .gitignore
- [x] End-to-end workflow generates real model
