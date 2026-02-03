# 社会体系建模多Agent系统 (Social System Modeling Multi-Agent Framework)

## TL;DR

> **核心目标**: 构建一个轻量级的多Agent协作框架,用于从基础假设推演出完整的社会体系模型
> 
> **交付物**:
> - TypeScript实现的MCP Server (可被Claude/AI直接调用)
> - 7个专业Agent的Prompt模板系统 (Systems/Econ/Socio/Governance/Culture/Risk/Validation)
> - 结构化工作流引擎 (6步协同流程)
> - 示例:小型社区治理模型推演
> - 基础文档与使用指南
> 
> **预计工作量**: Medium (约8-12个任务)
> **并行执行**: YES - 3个波次
> **关键路径**: 任务1(架构) → 任务3(Prompt系统) → 任务5(工作流引擎) → 任务7(集成测试)

---

## Context

### 原始需求

用户想做一个**思想实验工具**:
- 从基础假设出发(如"资源稀缺+有限理性+需要协作")
- 通过多个专业视角的AI Agent协同推演
- 最终建立一套完整的、可验证的社会体系模型

这不是传统的模拟系统,而是一个**AI推理增强框架** - 通过结构化的多视角分析,帮助AI进行深度的系统建模。

### 访谈总结

**关键决策**:
- **实现形式**: 轻量级MCP Server + 可选OpenCode Skill包装
- **技术栈**: TypeScript (类型安全、易集成、生态丰富)
- **Agent策略**: Prompt-based (每个Agent有专门的系统提示词,灵活可调)
- **目标用户**: Claude/其他AI系统,以及人类研究者

**用户提供的框架**:
- 7个专业Agent角色及其职责
- 6步协同工作流程
- 统一的输出格式(结论/依据/风险/建议/可证伪点)
- 完整的9层社会体系模型示例

### Metis审查要点 (已整合到计划中)

**关键发现**:
1. **范围边界**: 需明确MVP只实现核心工作流,可视化/存储作为扩展
2. **输入格式**: 需设计结构化的"假设定义"模板
3. **冲突解决**: Risk Agent的冲突检测需要具体算法
4. **性能护栏**: 需设定推演深度上限(防止无限递归)
5. **验收标准**: 需可运行的端到端示例

**已设定护栏**:
- MVP阶段不实现前端UI (聚焦核心逻辑)
- 不实现持久化存储 (首版基于内存,可扩展)
- 不实现Agent学习机制 (Prompt固定,可人工优化)

---

## Work Objectives

### 核心目标

构建一个**可执行的、类型安全的、可扩展的**多Agent协作框架,实现从假设到社会体系模型的自动化推演。

### 具体交付物

1. **MCP Server核心**:
   - `src/server.ts` - MCP协议实现
   - `src/types.ts` - 完整类型定义
   - `package.json` - 依赖与脚本配置

2. **Agent系统**:
   - `src/agents/prompts/` - 7个Agent的系统提示词(Markdown格式)
   - `src/agents/agent-factory.ts` - Agent实例化逻辑

3. **工作流引擎**:
   - `src/workflow/orchestrator.ts` - 6步协同流程控制
   - `src/workflow/conflict-resolver.ts` - 冲突检测与对齐
   - `src/workflow/synthesizer.ts` - 决策合成逻辑

4. **工具函数**:
   - `reasoning` - 启动完整推演流程
   - `query_agent` - 单独调用某个Agent
   - `validate_model` - 验证模型一致性

5. **示例与文档**:
   - `examples/community-governance.json` - 小型社区治理示例
   - `README.md` - 安装与使用指南
   - `ARCHITECTURE.md` - 架构设计文档

### 完成标准

- [ ] 可通过MCP协议调用 `reasoning` 工具完成端到端推演
- [ ] 示例输入返回结构化的社会体系模型(包含所有7个视角)
- [ ] 冲突检测能识别逻辑矛盾(至少2种检测规则)
- [ ] 输出包含可证伪点与风险评估
- [ ] 代码覆盖核心类型检查(无any滥用)

### Must Have (MVP范围)

- 7个Agent的完整Prompt定义
- 6步工作流的可执行实现
- 至少1个可运行的端到端示例
- 冲突检测基础算法(逻辑矛盾+优先级冲突)
- 结构化输出格式(JSON Schema定义)

### Must NOT Have (明确排除,防止过度设计)

- ❌ 图形化界面或Web前端
- ❌ 数据库持久化存储
- ❌ Agent自我学习/训练机制
- ❌ 可视化图表生成(留给调用方实现)
- ❌ 用户认证与权限管理
- ❌ 超过10个以上的配置参数(保持简单)

---

## Verification Strategy

### 测试决策

- **基础设施**: 使用 `bun test` (TypeScript原生支持,快速)
- **测试策略**: Tests-after (先实现核心逻辑,再补充测试)
- **覆盖目标**: 核心工作流路径 + 冲突检测逻辑

### 测试设置任务 (在首个实现任务前执行)

- [ ] 0. 设置测试基础设施
  - 安装: `bun add -d @types/bun`
  - 创建: `src/__tests__/example.test.ts`
  - 验证: `bun test` → 示例测试通过

### Agent-Executed QA Scenarios (MANDATORY — 每个任务)

> **核心原则**: 所有验证必须可由执行Agent自动完成,无需人工干预

**验证工具映射**:

| 交付物类型 | 验证工具 | 验证方式 |
|------------|----------|----------|
| TypeScript代码 | Bash (bun) | 编译检查 + 类型检查 |
| MCP Server | Bash (curl/stdio) | 协议通信验证 |
| Agent推演结果 | Bash (bun run) | JSON结构验证 |
| 示例输入输出 | Bash (bun test) | 断言匹配 |

**场景模板示例** (具体任务中会包含详细场景):

```
Scenario: MCP Server responds to reasoning tool call
  Tool: Bash (bun + stdio通信)
  Preconditions: Server已构建, stdio transport可用
  Steps:
    1. echo '{"method":"tools/call","params":{"name":"reasoning","arguments":{"hypothesis":"..."}}}' | bun run src/server.ts
    2. 解析stdout JSON响应
    3. Assert: response.result.model包含7个agent_outputs
    4. Assert: 每个agent_output包含conclusion/evidence/risks/suggestions/falsifiable字段
  Expected Result: 返回结构化模型JSON
  Evidence: 响应体保存至.sisyphus/evidence/task-N-mcp-call.json
```

---

## Execution Strategy

### 并行执行波次

```
Wave 1 (基础设施 - 可立即开始):
├── Task 1: 项目架构初始化 (无依赖)
└── Task 2: Agent Prompt模板编写 (无依赖)

Wave 2 (核心逻辑 - Wave 1完成后):
├── Task 3: Agent工厂与类型系统 (依赖: 1, 2)
├── Task 4: 冲突检测算法实现 (依赖: 1)
└── Task 5: 工作流编排器实现 (依赖: 3, 4)

Wave 3 (集成与示例 - Wave 2完成后):
├── Task 6: MCP Server集成 (依赖: 5)
├── Task 7: 端到端示例实现 (依赖: 6)
└── Task 8: 文档与README (依赖: 7)

关键路径: Task 1 → Task 3 → Task 5 → Task 6 → Task 7
并行加速: 约40%快于顺序执行
```

### 依赖矩阵

| 任务 | 依赖 | 阻塞 | 可并行 |
|------|------|------|--------|
| 1 | 无 | 3 | 2 |
| 2 | 无 | 3 | 1 |
| 3 | 1,2 | 5 | 4 |
| 4 | 1 | 5 | 3 |
| 5 | 3,4 | 6 | 无 |
| 6 | 5 | 7 | 无 |
| 7 | 6 | 8 | 无 |
| 8 | 7 | 无 | 无 |

---

## TODOs

### Wave 1: 基础设施搭建

---

- [ ] 1. 项目架构初始化与类型定义

  **要做什么**:
  - 初始化TypeScript项目 (`bun init`)
  - 配置tsconfig.json (strict模式, ES2022目标)
  - 定义核心类型 (`src/types.ts`):
    - `Hypothesis` - 基础假设结构
    - `AgentOutput` - 统一输出格式(结论/依据/风险/建议/可证伪点)
    - `SocialSystemModel` - 最终模型结构(9层架构)
    - `WorkflowState` - 工作流状态管理
  - 创建项目目录结构:
    ```
    src/
      agents/
        prompts/
      workflow/
      tools/
      __tests__/
    examples/
    ```

  **明确不做**:
  - ❌ 不添加数据库ORM或持久化层
  - ❌ 不配置复杂的构建工具链(直接用bun)
  - ❌ 不创建配置文件管理系统(硬编码核心参数)

  **推荐Agent配置**:
  - **Category**: `quick` (简单的项目初始化任务)
  - **Skills**: 无需特殊skill
    - 原因: 标准TypeScript项目初始化,无领域特殊性

  **并行化信息**:
  - **可并行**: YES
  - **并行组**: Wave 1 (与Task 2并行)
  - **阻塞**: Task 3, 4 (类型定义是后续任务的基础)
  - **依赖**: 无

  **参考资料**:

  **类型定义参考** (用户需求文档):
  - 用户提供的"统一输出格式": 结论/依据(3条)/风险(2个)/建议(1-2个)/可证伪点(1个)
  - 用户提供的"9层社会体系模型": 总体结构/运行流程/核心制度/治理/文化/创新/风险/指标/迭代
  
  **TypeScript最佳实践**:
  - Bun文档: https://bun.sh/docs/typescript (原生TS支持)
  - 严格模式配置: `strict: true, noUncheckedIndexedAccess: true`
  
  **项目结构参考**:
  - MCP Server示例: https://github.com/modelcontextprotocol/servers (标准目录布局)
  
  **为什么这些参考重要**:
  - 用户文档定义了完整的数据契约 - 执行者需要精确映射到TypeScript类型
  - Bun原生TS支持意味着无需babel/webpack复杂配置
  - MCP标准示例确保目录结构符合生态规范

  **验收标准**:

  **编译检查**:
  - [ ] `bun run src/types.ts` → 无类型错误
  - [ ] `tsc --noEmit` → 编译通过

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: 核心类型定义完整性验证
    Tool: Bash (bun)
    Preconditions: src/types.ts已创建
    Steps:
      1. bun run -e "import * as T from './src/types'; console.log(Object.keys(T))"
      2. Assert: 输出包含 Hypothesis, AgentOutput, SocialSystemModel, WorkflowState
      3. bun run -e "import { AgentOutput } from './src/types'; const test: AgentOutput = { conclusion: 'test', evidence: ['a'], risks: ['r1'], suggestions: ['s1'], falsifiable: 'f' }; console.log('OK')"
      4. Assert: 输出 "OK" (类型约束正确)
    Expected Result: 所有核心类型可导入且约束正确
    Evidence: Terminal输出截图保存至 .sisyphus/evidence/task-1-type-check.txt

  Scenario: 目录结构创建验证
    Tool: Bash (ls + tree)
    Preconditions: 项目初始化完成
    Steps:
      1. ls -R src/
      2. Assert: 存在 src/agents/prompts/, src/workflow/, src/tools/, src/__tests__/
      3. ls examples/
      4. Assert: examples/目录存在
    Expected Result: 所有必需目录已创建
    Evidence: 目录树输出保存至 .sisyphus/evidence/task-1-structure.txt
  ```

  **提交策略**: YES
  - Message: `feat(init): initialize project structure and core types`
  - Files: `package.json`, `tsconfig.json`, `src/types.ts`, 目录结构
  - 验证: `bun run tsc --noEmit`

---

- [ ] 2. 编写7个Agent的Prompt模板

  **要做什么**:
  - 在 `src/agents/prompts/` 下创建7个Markdown文件:
    - `systems-agent.md` - 系统边界、反馈回路、动态稳定性
    - `econ-agent.md` - 激励结构、机制设计、资源配置
    - `socio-agent.md` - 社会结构、规范、群体行为
    - `governance-agent.md` - 权力结构、治理成本、合法性
    - `culture-agent.md` - 价值观、信任、文化演化
    - `risk-agent.md` - 脆弱性、极端情境、韧性策略
    - `validation-agent.md` - 案例对比、历史验证、反事实检验
  
  - 每个Prompt包含统一结构:
    ```markdown
    # {Agent Name} - 系统提示词
    
    ## 角色定义
    你是{Agent}，负责从{视角}分析社会体系模型...
    
    ## 核心职责
    - {职责1}
    - {职责2}
    
    ## 分析框架
    {该Agent特有的分析工具和方法论}
    
    ## 输出格式 (CRITICAL - 严格遵守)
    **结论**: 一句话核心观点
    **依据**: 
    1. {因果链条1}
    2. {因果链条2}
    3. {因果链条3}
    **风险**:
    1. {高风险点1}
    2. {高风险点2}
    **建议**:
    1. {可执行调整1}
    2. {可执行调整2}
    **可证伪点**: {能否定结论的条件}
    
    ## 关键约束
    - 必须基于输入的假设和前序分析
    - 避免超出专业领域的判断
    - 明确指出不确定性
    ```

  **明确不做**:
  - ❌ 不实现Prompt动态生成逻辑(首版固定模板)
  - ❌ 不添加Prompt版本管理系统
  - ❌ 不实现Agent间的自然语言对话(严格遵循输出格式)

  **推荐Agent配置**:
  - **Category**: `writing` (技术写作任务,需要精确的领域知识)
  - **Skills**: 无需特殊skill
    - 原因: 基于用户提供的完整框架,主要是结构化表达

  **并行化信息**:
  - **可并行**: YES
  - **并行组**: Wave 1 (与Task 1并行)
  - **阻塞**: Task 3 (Prompt是Agent实例化的输入)
  - **依赖**: 无

  **参考资料**:

  **用户提供的Agent职责定义** (需求文档):
  - Systems Agent: "系统边界、变量、反馈回路与动态稳定性"
  - Econ Agent: "激励结构、机制设计、资源配置与效率"
  - Socio Agent: "社会结构、规范、群体行为与制度化过程"
  - Governance Agent: "权力结构、治理成本、合法性与执行力"
  - Culture Agent: "价值观、信任、合作扩展与文化演化"
  - Risk Agent: "脆弱性、极端情境、系统崩溃与韧性策略"
  - Validation Agent: "对比案例、历史验证、反事实检验"
  
  **用户提供的分析工具列表** (需求文档):
  - "系统思维、因果图、博弈论、制度经济学..." (每个Agent需映射相关工具)
  
  **Prompt工程最佳实践**:
  - Anthropic Prompt指南: https://docs.anthropic.com/claude/docs/prompt-engineering (结构化输出、Few-shot示例)
  
  **为什么这些参考重要**:
  - 用户文档提供了每个Agent的精确职责边界 - 必须在Prompt中明确体现
  - 分析工具列表帮助每个Agent建立专业的"思维框架"
  - Anthropic指南确保输出格式的稳定性(关键:后续解析依赖格式一致性)

  **验收标准**:

  **文件完整性检查**:
  - [ ] 7个Markdown文件全部存在于 `src/agents/prompts/`
  - [ ] 每个文件包含5个必需部分:角色定义/核心职责/分析框架/输出格式/关键约束

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Prompt模板结构完整性验证
    Tool: Bash (grep + wc)
    Preconditions: 所有Prompt文件已创建
    Steps:
      1. for file in src/agents/prompts/*.md; do echo "=== $file ==="; grep -c "## 输出格式" "$file"; done
      2. Assert: 每个文件输出 "1" (包含输出格式部分)
      3. grep -r "结论:" src/agents/prompts/ | wc -l
      4. Assert: 输出 "7" (所有文件都定义了结论字段)
      5. grep -r "可证伪点:" src/agents/prompts/ | wc -l
      6. Assert: 输出 "7" (所有文件都包含可证伪性要求)
    Expected Result: 7个Prompt都遵循统一格式
    Evidence: 检查输出保存至 .sisyphus/evidence/task-2-prompt-validation.txt

  Scenario: Systems Agent Prompt内容正确性验证
    Tool: Bash (grep)
    Preconditions: systems-agent.md已创建
    Steps:
      1. grep -i "反馈回路\|feedback" src/agents/prompts/systems-agent.md
      2. Assert: 匹配到至少1处 (核心概念存在)
      3. grep -i "边界\|boundary" src/agents/prompts/systems-agent.md
      4. Assert: 匹配到至少1处 (核心职责覆盖)
    Expected Result: Systems Agent的Prompt包含其特有的分析概念
    Evidence: 匹配结果保存至 .sisyphus/evidence/task-2-systems-content.txt
  ```

  **提交策略**: YES
  - Message: `feat(agents): add 7 agent prompt templates`
  - Files: `src/agents/prompts/*.md`
  - 验证: `ls src/agents/prompts/ | wc -l` 输出7

---

### Wave 2: 核心逻辑实现

---

- [ ] 3. Agent工厂与实例化逻辑

  **要做什么**:
  - 实现 `src/agents/agent-factory.ts`:
    - `loadPrompt(agentType: AgentType): string` - 读取Markdown Prompt
    - `createAgent(type: AgentType): AgentInstance` - 实例化Agent配置
    - `AgentInstance` 接口包含: `name`, `systemPrompt`, `outputSchema`
  
  - 实现 `src/agents/agent-executor.ts`:
    - `executeAgent(agent: AgentInstance, context: AnalysisContext): Promise<AgentOutput>`
    - 模拟AI调用(首版可用简单的模板填充,或调用实际的AI API)
  
  - 更新 `src/types.ts`:
    - 添加 `AgentType = 'systems' | 'econ' | 'socio' | ...`
    - 添加 `AnalysisContext` - Agent执行的上下文输入

  **明确不做**:
  - ❌ 不实现Agent状态持久化
  - ❌ 不实现Agent热重载机制
  - ❌ 不实现多AI后端抽象层(首版硬编码单一实现)

  **推荐Agent配置**:
  - **Category**: `unspecified-low` (标准TypeScript工厂模式实现)
  - **Skills**: 无需特殊skill
    - 原因: 常规代码模式,无复杂领域逻辑

  **并行化信息**:
  - **可并行**: YES (可与Task 4并行)
  - **并行组**: Wave 2
  - **阻塞**: Task 5 (工作流编排依赖Agent实例)
  - **依赖**: Task 1 (类型定义), Task 2 (Prompt文件)

  **参考资料**:

  **TypeScript工厂模式**:
  - 设计模式参考: https://refactoring.guru/design-patterns/factory-method/typescript
  
  **文件读取API**:
  - Bun文件API: `Bun.file('path').text()` (异步读取)
  
  **用户需求中的"模拟AI调用"策略**:
  - 首版可简化:如果无AI API可用,用模板字符串生成模拟输出
  - 扩展点:预留 `AIBackend` 接口,后续可插入真实API
  
  **为什么这些参考重要**:
  - 工厂模式确保Agent实例化的一致性和可测试性
  - Bun的原生文件API比Node.js的fs更简洁
  - 模拟输出允许在无AI API时也能测试完整流程

  **验收标准**:

  **类型检查**:
  - [ ] `bun run tsc --noEmit` → 无错误
  - [ ] `AgentType` 包含所有7个Agent名称

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: Agent工厂成功加载所有Prompt
    Tool: Bash (bun run)
    Preconditions: Task 1, 2已完成
    Steps:
      1. bun run -e "
        import { loadPrompt } from './src/agents/agent-factory';
        const types = ['systems', 'econ', 'socio', 'governance', 'culture', 'risk', 'validation'];
        for (const t of types) {
          const prompt = await loadPrompt(t);
          if (!prompt.includes('## 输出格式')) throw new Error(\`Missing format in \${t}\`);
        }
        console.log('ALL_LOADED');
      "
      2. Assert: 输出 "ALL_LOADED"
    Expected Result: 所有7个Prompt成功加载且包含格式定义
    Evidence: 输出保存至 .sisyphus/evidence/task-3-factory-load.txt

  Scenario: Agent实例创建包含完整配置
    Tool: Bash (bun run)
    Preconditions: agent-factory.ts已实现
    Steps:
      1. bun run -e "
        import { createAgent } from './src/agents/agent-factory';
        const agent = await createAgent('systems');
        console.log(JSON.stringify({
          hasName: !!agent.name,
          hasPrompt: agent.systemPrompt.length > 100,
          hasSchema: !!agent.outputSchema
        }));
      "
      2. 解析JSON输出
      3. Assert: hasName=true, hasPrompt=true, hasSchema=true
    Expected Result: Agent实例包含所有必需字段
    Evidence: JSON保存至 .sisyphus/evidence/task-3-agent-instance.json
  ```

  **提交策略**: YES (与Task 4一起提交,作为Wave 2的里程碑)
  - Message: `feat(agents): implement agent factory and executor`
  - Files: `src/agents/agent-factory.ts`, `src/agents/agent-executor.ts`, `src/types.ts`
  - 验证: `bun test src/__tests__/agent-factory.test.ts`

---

- [ ] 4. 冲突检测算法实现

  **要做什么**:
  - 实现 `src/workflow/conflict-resolver.ts`:
    - `detectConflicts(outputs: AgentOutput[]): Conflict[]` - 检测Agent输出间的冲突
    - 实现至少3种冲突检测规则:
      1. **逻辑矛盾检测**: Agent A的结论与Agent B的可证伪点冲突
      2. **优先级冲突**: 多个Agent对同一资源提出互斥建议
      3. **风险叠加**: 多个Agent识别的风险组合后超过阈值
  
  - 定义冲突数据结构:
    ```typescript
    interface Conflict {
      type: 'logical' | 'priority' | 'risk_amplification';
      involvedAgents: AgentType[];
      description: string;
      severity: 'low' | 'medium' | 'high';
      resolutionStrategy?: string;
    }
    ```
  
  - 实现 `suggestResolution(conflict: Conflict): string` - 提供冲突解决建议

  **明确不做**:
  - ❌ 不实现自动化冲突解决(只检测和建议,不修改Agent输出)
  - ❌ 不实现复杂的自然语言语义分析(基于关键字和结构化字段)
  - ❌ 不实现冲突历史学习机制

  **推荐Agent配置**:
  - **Category**: `unspecified-high` (需要设计启发式算法,有一定复杂度)
  - **Skills**: 无需特殊skill
    - 原因: 逻辑推理为主,非特定领域技术栈

  **并行化信息**:
  - **可并行**: YES (可与Task 3并行)
  - **并行组**: Wave 2
  - **阻塞**: Task 5 (工作流编排需要冲突检测结果)
  - **依赖**: Task 1 (类型定义)

  **参考资料**:

  **用户需求中的"冲突对齐"职责**:
  - "Risk Agent牵头审查矛盾与逻辑缺口"
  - "冲突优先级:生存性>稳定性>公平性>效率性"
  
  **逻辑冲突检测策略**:
  - 关键字匹配:提取Agent A结论中的核心断言,与Agent B可证伪点比对
  - 示例: A说"中央集权提高效率" vs B说"若权力过于集中则失稳" → 检测"集权"关键词冲突
  
  **优先级冲突算法**:
  - 建立优先级矩阵:生存=4, 稳定=3, 公平=2, 效率=1
  - 当多个建议涉及同一维度时,按优先级排序
  
  **为什么这些参考重要**:
  - 用户明确了Risk Agent的特殊职责 - 冲突检测逻辑应反映这一设计
  - 优先级矩阵是决策合成的核心算法基础
  - 关键字匹配虽简单,但对MVP足够(避免引入NLP复杂度)

  **验收标准**:

  **单元测试**:
  - [ ] `bun test src/__tests__/conflict-resolver.test.ts` → 所有测试通过
  - [ ] 至少3个测试用例覆盖3种冲突类型

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: 逻辑矛盾检测 - 成功识别冲突
    Tool: Bash (bun run)
    Preconditions: conflict-resolver.ts已实现
    Steps:
      1. bun run -e "
        import { detectConflicts } from './src/workflow/conflict-resolver';
        const outputs = [
          { conclusion: '中央集权可提高决策效率', falsifiable: '若地方失去自主权则创新下降', ... },
          { conclusion: '地方自治促进创新', falsifiable: '若中央权威不足则秩序崩溃', ... }
        ];
        const conflicts = detectConflicts(outputs);
        console.log(JSON.stringify(conflicts));
      "
      2. 解析JSON输出
      3. Assert: conflicts数组长度 >= 1
      4. Assert: 存在type='logical'的冲突
    Expected Result: 成功检测到逻辑冲突
    Evidence: 冲突列表保存至 .sisyphus/evidence/task-4-logical-conflict.json

  Scenario: 优先级冲突检测 - 资源分配互斥
    Tool: Bash (bun run)
    Preconditions: conflict-resolver.ts已实现
    Steps:
      1. bun run -e "
        import { detectConflicts } from './src/workflow/conflict-resolver';
        const outputs = [
          { suggestions: ['将80%资源投入国防'], ... },
          { suggestions: ['将70%资源投入教育'], ... }
        ];
        const conflicts = detectConflicts(outputs);
        const hasResourceConflict = conflicts.some(c => c.type === 'priority');
        console.log(hasResourceConflict);
      "
      2. Assert: 输出 "true"
    Expected Result: 检测到资源分配优先级冲突
    Evidence: 输出保存至 .sisyphus/evidence/task-4-priority-conflict.txt
  ```

  **提交策略**: YES (与Task 3一起提交)
  - Message: `feat(workflow): implement conflict detection algorithms`
  - Files: `src/workflow/conflict-resolver.ts`, `src/__tests__/conflict-resolver.test.ts`
  - 验证: `bun test src/workflow/`

---

- [ ] 5. 工作流编排器实现 (核心引擎)

  **要做什么**:
  - 实现 `src/workflow/orchestrator.ts` - 6步协同流程控制:
    1. **定义假设** (validateHypothesis): 检查输入假设的结构完整性
    2. **并行推演** (executeAgents): 并发调用7个Agent
    3. **冲突对齐** (alignConflicts): 调用冲突检测,标记需重推的Agent
    4. **决策合成** (synthesize): 合成最终模型(调用synthesizer)
    5. **证据校验** (validate): Validation Agent执行可证伪检验
    6. **迭代收敛** (iterate): 如有冲突,回到步骤2重推
  
  - 主入口函数:
    ```typescript
    async function runWorkflow(
      hypothesis: Hypothesis,
      options?: { maxIterations?: number }
    ): Promise<SocialSystemModel>
    ```
  
  - 实现 `src/workflow/synthesizer.ts`:
    - `synthesizeModel(outputs: AgentOutput[], conflicts: Conflict[]): SocialSystemModel`
    - 应用决策合成规则:分层加权、冲突优先级
  
  - 状态管理:
    - `WorkflowState` 追踪当前步骤、迭代次数、冲突历史

  **明确不做**:
  - ❌ 不实现可视化工作流图
  - ❌ 不实现工作流持久化(中断恢复)
  - ❌ 不实现自适应迭代深度(固定maxIterations=3)

  **推荐Agent配置**:
  - **Category**: `unspecified-high` (核心控制逻辑,需要严谨的状态管理)
  - **Skills**: 无需特殊skill
    - 原因: 编排逻辑为主,非特定框架

  **并行化信息**:
  - **可并行**: NO (关键路径任务)
  - **并行组**: Wave 2 (但必须等Task 3和4完成)
  - **阻塞**: Task 6 (MCP集成依赖工作流可用)
  - **依赖**: Task 3 (Agent执行), Task 4 (冲突检测)

  **参考资料**:

  **用户提供的6步工作流** (需求文档):
  1. "定义假设 (Systems Agent设定)"
  2. "并行推演 (各Agent从自身视角构建机制)"
  3. "冲突对齐 (Risk Agent审查矛盾)"
  4. "决策合成 (Governance Agent合成规则)"
  5. "证据校验 (Validation Agent可证伪检验)"
  6. "迭代收敛 (回到假设层修订)"
  
  **决策合成机制** (需求文档):
  - "分层加权:宏观结构>激励机制>文化规范"
  - "冲突优先级:生存性>稳定性>公平性>效率性"
  
  **并发执行策略**:
  - 使用 `Promise.all()` 并行调用7个Agent
  - 超时控制:单Agent执行超过30s则标记失败
  
  **为什么这些参考重要**:
  - 6步流程是用户明确定义的核心逻辑 - 必须精确实现
  - 决策合成规则直接影响最终模型的质量
  - 并发执行是"轻量级"的关键 - 顺序执行会很慢

  **验收标准**:

  **集成测试**:
  - [ ] `bun test src/__tests__/orchestrator.test.ts` → 端到端测试通过
  - [ ] 测试覆盖:正常收敛 + 达到最大迭代次数 + 无冲突快速路径

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: 工作流正常执行 - 端到端推演
    Tool: Bash (bun run)
    Preconditions: Task 3, 4已完成, Agent模拟实现可用
    Steps:
      1. bun run -e "
        import { runWorkflow } from './src/workflow/orchestrator';
        const hypothesis = {
          assumptions: ['资源稀缺', '有限理性', '协作收益高'],
          constraints: ['人口1000人', '孤立环境'],
          goals: ['稳定秩序', '基本公平']
        };
        const model = await runWorkflow(hypothesis, { maxIterations: 3 });
        console.log(JSON.stringify({
          hasStructure: !!model.structure,
          agentCount: model.agentOutputs.length,
          hasConflicts: model.conflicts.length > 0,
          iterations: model.metadata.iterations
        }));
      "
      2. 解析JSON输出
      3. Assert: agentCount === 7 (所有Agent执行)
      4. Assert: iterations <= 3 (未超过最大迭代)
      5. Assert: hasStructure === true (模型结构生成)
    Expected Result: 工作流成功完成并返回完整模型
    Evidence: 模型JSON保存至 .sisyphus/evidence/task-5-workflow-success.json

  Scenario: 工作流冲突迭代 - 自动重推机制
    Tool: Bash (bun run)
    Preconditions: 冲突检测器返回冲突
    Steps:
      1. bun run -e "
        import { runWorkflow } from './src/workflow/orchestrator';
        // 构造必然产生冲突的假设
        const conflictingHypothesis = {
          assumptions: ['绝对平等', '完全自由市场'],
          constraints: [],
          goals: ['零不平等']
        };
        const model = await runWorkflow(conflictingHypothesis, { maxIterations: 2 });
        console.log(model.metadata.iterations);
      "
      2. Assert: 输出 "2" (触发重推,达到最大迭代)
    Expected Result: 工作流检测到冲突并尝试迭代
    Evidence: 迭代日志保存至 .sisyphus/evidence/task-5-workflow-iteration.txt
  ```

  **提交策略**: YES
  - Message: `feat(workflow): implement 6-step orchestration engine`
  - Files: `src/workflow/orchestrator.ts`, `src/workflow/synthesizer.ts`, `src/__tests__/orchestrator.test.ts`
  - 验证: `bun test src/workflow/`

---

### Wave 3: 集成与交付

---

- [ ] 6. MCP Server集成

  **要做什么**:
  - 实现 `src/server.ts` - MCP协议入口:
    - 使用 `@modelcontextprotocol/sdk` 创建Server
    - 注册3个Tool:
      1. `reasoning` - 完整推演流程 (调用 runWorkflow)
      2. `query_agent` - 单独查询某个Agent
      3. `validate_model` - 验证已有模型的一致性
  
  - Tool定义示例:
    ```typescript
    server.tool('reasoning', {
      description: '从基础假设推演社会体系模型',
      inputSchema: {
        type: 'object',
        properties: {
          hypothesis: { ... },
          options: { maxIterations: { type: 'number' } }
        },
        required: ['hypothesis']
      }
    }, async (params) => {
      const model = await runWorkflow(params.hypothesis, params.options);
      return { content: [{ type: 'text', text: JSON.stringify(model, null, 2) }] };
    });
    ```
  
  - 配置启动脚本:
    - `package.json` 添加 `"start": "bun run src/server.ts"`
    - 支持stdio transport (标准MCP通信方式)

  **明确不做**:
  - ❌ 不实现HTTP REST API包装
  - ❌ 不实现认证授权机制
  - ❌ 不实现流式响应(完整返回结果)

  **推荐Agent配置**:
  - **Category**: `unspecified-low` (标准MCP SDK使用,模式化代码)
  - **Skills**: 无需特殊skill
    - 原因: SDK文档清晰,集成直接

  **并行化信息**:
  - **可并行**: NO (关键路径)
  - **并行组**: Wave 3
  - **阻塞**: Task 7 (示例依赖Server可用)
  - **依赖**: Task 5 (工作流引擎)

  **参考资料**:

  **MCP SDK文档**:
  - 官方指南: https://modelcontextprotocol.io/docs/tools/building
  - TypeScript Server示例: https://github.com/modelcontextprotocol/typescript-sdk/tree/main/examples
  
  **Tool定义最佳实践**:
  - JSON Schema validation: 确保输入参数类型正确
  - 错误处理: 捕获工作流异常,返回结构化错误信息
  
  **stdio transport配置**:
  - 使用 `new StdioServerTransport()` 
  - 输出重定向:确保日志不干扰stdio通信
  
  **为什么这些参考重要**:
  - MCP SDK是标准协议实现 - 遵循官方示例确保兼容性
  - JSON Schema验证防止错误输入导致工作流崩溃
  - stdio是Claude Desktop等客户端的标准通信方式

  **验收标准**:

  **MCP协议测试**:
  - [ ] Server启动无错误: `bun run src/server.ts` (后台运行)
  - [ ] Tool列表可获取: `echo '{"method":"tools/list"}' | bun run src/server.ts` 返回3个Tool

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: MCP Server启动并响应tools/list
    Tool: Bash (echo + pipe)
    Preconditions: src/server.ts已实现
    Steps:
      1. echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | timeout 5s bun run src/server.ts
      2. 捕获stdout JSON响应
      3. Assert: response.result.tools数组包含 'reasoning', 'query_agent', 'validate_model'
    Expected Result: Server返回所有3个Tool定义
    Evidence: 响应保存至 .sisyphus/evidence/task-6-mcp-list.json

  Scenario: reasoning tool调用成功执行
    Tool: Bash (echo + pipe)
    Preconditions: 工作流引擎可用
    Steps:
      1. echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"reasoning","arguments":{"hypothesis":{"assumptions":["测试假设"],"constraints":[],"goals":["测试目标"]}}}}' | timeout 30s bun run src/server.ts
      2. 捕获stdout JSON响应
      3. Assert: response.result.content[0].text包含 "agentOutputs" 字段
      4. 解析JSON,验证结构
      5. Assert: agentOutputs数组长度 === 7
    Expected Result: reasoning执行成功并返回完整模型
    Evidence: 完整响应保存至 .sisyphus/evidence/task-6-reasoning-call.json
  ```

  **提交策略**: YES
  - Message: `feat(mcp): integrate MCP server with 3 tools`
  - Files: `src/server.ts`, `package.json` (添加start脚本)
  - 验证: `echo '{"method":"tools/list"}' | bun run start`

---

- [ ] 7. 端到端示例实现

  **要做什么**:
  - 创建 `examples/community-governance.json` - 小型社区治理示例输入:
    ```json
    {
      "hypothesis": {
        "assumptions": [
          "1000人社区,资源有限(粮食、住房、工具)",
          "个体能力差异大(技能、体力、智力)",
          "协作可提升总产出30%",
          "无外部干预,孤立环境"
        ],
        "constraints": [
          "通信成本:当面交流免费,间接传播有衰减",
          "信息不完全:个体只知道邻近50人的状态",
          "时间压力:必须在30天内建立稳定秩序"
        ],
        "goals": [
          "保证所有人基本生存(食物、住所)",
          "建立可持续的资源生产与分配机制",
          "冲突解决机制可执行",
          "容忍一定不平等(基尼系数<0.4)"
        ]
      },
      "options": {
        "maxIterations": 3
      }
    }
    ```
  
  - 创建执行脚本 `examples/run-example.ts`:
    ```typescript
    import { runWorkflow } from '../src/workflow/orchestrator';
    import exampleInput from './community-governance.json';
    
    const model = await runWorkflow(exampleInput.hypothesis, exampleInput.options);
    console.log(JSON.stringify(model, null, 2));
    ```
  
  - 创建预期输出 `examples/community-governance-output.json` (基于实际运行结果)
  
  - 添加验证测试 `src/__tests__/e2e.test.ts`:
    - 加载示例输入
    - 执行工作流
    - 断言输出包含所有必需字段

  **明确不做**:
  - ❌ 不创建多个示例(MVP只需1个)
  - ❌ 不实现示例的交互式生成器
  - ❌ 不实现输出的可视化渲染

  **推荐Agent配置**:
  - **Category**: `quick` (基于现有工作流,主要是数据准备)
  - **Skills**: 无需特殊skill
    - 原因: JSON编写和脚本调用

  **并行化信息**:
  - **可并行**: YES (可与Task 8并行)
  - **并行组**: Wave 3
  - **阻塞**: Task 8 (README需要引用示例)
  - **依赖**: Task 6 (MCP Server)

  **参考资料**:

  **用户提供的示例框架** (需求文档):
  - "落地实例(小型社区治理模型)"
  - "输入:1000人社区,资源有限,目标稳定合作"
  - 预期输出包含:Systems/Econ/Governance/Culture/Risk/Validation的分析
  
  **示例设计原则**:
  - 具体化假设:避免"资源稀缺"这种抽象表述,使用"粮食仅够维持25天"
  - 可验证约束:如"基尼系数<0.4"可通过计算检验
  - 多维度目标:同时包含生存、公平、效率三个维度
  
  **为什么这些参考重要**:
  - 用户已提供示例场景 - 需要将其形式化为JSON输入
  - 具体化假设使得Agent推演更加精确(避免空泛分析)
  - 多维度目标会触发冲突检测机制,验证系统健壮性

  **验收标准**:

  **端到端测试**:
  - [ ] `bun test src/__tests__/e2e.test.ts` → 测试通过
  - [ ] 示例执行时间 < 60s (性能基准)

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: 示例输入成功执行完整推演
    Tool: Bash (bun run)
    Preconditions: Task 5, 6已完成
    Steps:
      1. bun run examples/run-example.ts > /tmp/output.json 2>&1
      2. Assert: 退出码 === 0 (执行成功)
      3. cat /tmp/output.json | jq '.agentOutputs | length'
      4. Assert: 输出 "7" (所有Agent都生成了输出)
      5. cat /tmp/output.json | jq '.structure'
      6. Assert: 返回非null对象 (模型结构已合成)
    Expected Result: 示例输入生成完整的社会体系模型
    Evidence: 输出保存至 .sisyphus/evidence/task-7-example-output.json

  Scenario: 示例输出包含所有必需维度
    Tool: Bash (jq)
    Preconditions: 示例已执行
    Steps:
      1. cat /tmp/output.json | jq '.agentOutputs | map(.agentType)'
      2. Assert: 数组包含 ['systems', 'econ', 'socio', 'governance', 'culture', 'risk', 'validation']
      3. cat /tmp/output.json | jq '.agentOutputs[0].conclusion'
      4. Assert: 返回非空字符串 (结论字段存在)
      5. cat /tmp/output.json | jq '.agentOutputs[0].falsifiable'
      6. Assert: 返回非空字符串 (可证伪点存在)
    Expected Result: 输出结构符合AgentOutput定义
    Evidence: 字段验证结果保存至 .sisyphus/evidence/task-7-output-validation.txt
  ```

  **提交策略**: YES
  - Message: `feat(examples): add community governance example and e2e test`
  - Files: `examples/community-governance.json`, `examples/run-example.ts`, `src/__tests__/e2e.test.ts`
  - 验证: `bun test src/__tests__/e2e.test.ts`

---

- [ ] 8. 文档与README编写

  **要做什么**:
  - 创建 `README.md`:
    - 项目简介:一句话描述 + 核心特性列表
    - 快速开始:安装、配置、运行示例的3步指令
    - MCP集成指南:如何在Claude Desktop中配置此Server
    - 使用示例:展示 `reasoning` tool的调用方式
    - 架构概览:7个Agent的职责 + 工作流程图(ASCII art)
    - API参考:3个Tool的输入输出Schema
    - 扩展指南:如何自定义Agent Prompt、添加新检测规则
  
  - 创建 `ARCHITECTURE.md`:
    - 系统架构图
    - 核心模块说明:Agent系统、工作流引擎、冲突检测器
    - 数据流图:从假设输入到模型输出的完整流程
    - 关键设计决策:为什么选择Prompt-based、为什么6步流程
    - 扩展点:哪些部分可以定制
  
  - 创建 `CONTRIBUTING.md`:
    - 开发环境设置
    - 测试运行方式
    - Prompt编写规范
    - 提交PR的checklist

  **明确不做**:
  - ❌ 不创建详尽的理论背景文档(保持实用导向)
  - ❌ 不编写多语言README(首版仅中文/英文)
  - ❌ 不创建视频教程或可视化演示

  **推荐Agent配置**:
  - **Category**: `writing` (技术文档编写)
  - **Skills**: 无需特殊skill
    - 原因: 标准技术文档结构

  **并行化信息**:
  - **可并行**: YES (可与Task 7并行)
  - **并行组**: Wave 3
  - **阻塞**: 无 (最后一个任务)
  - **依赖**: Task 7 (README需引用示例)

  **参考资料**:

  **优秀开源项目README参考**:
  - MCP Server示例: https://github.com/modelcontextprotocol/servers (清晰的集成指南)
  - Bun项目文档: https://bun.sh/docs (快速开始风格)
  
  **架构文档模板**:
  - C4模型: https://c4model.com/ (上下文图、容器图、组件图)
  - 用ASCII art绘制流程图 (兼容纯文本阅读)
  
  **MCP配置示例**:
  - Claude Desktop配置文件格式: `claude_desktop_config.json`
  ```json
  {
    "mcpServers": {
      "social-modeling": {
        "command": "bun",
        "args": ["run", "/path/to/src/server.ts"]
      }
    }
  }
  ```
  
  **为什么这些参考重要**:
  - MCP Server的价值在于集成 - 必须提供清晰的配置指南
  - 架构文档帮助用户理解设计意图,降低定制门槛
  - ASCII art确保文档在终端中也可读(符合开发者习惯)

  **验收标准**:

  **文档完整性检查**:
  - [ ] README.md包含所有必需章节(简介/快速开始/MCP集成/API/架构)
  - [ ] ARCHITECTURE.md包含架构图和数据流图
  - [ ] 所有代码示例可复制粘贴执行

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: README快速开始步骤可执行
    Tool: Bash (逐行执行README命令)
    Preconditions: README.md已创建
    Steps:
      1. 提取README中"快速开始"章节的命令
      2. cd /tmp/test-install
      3. 执行: bun install (从README复制)
      4. Assert: 退出码 === 0
      5. 执行: bun run examples/run-example.ts
      6. Assert: 退出码 === 0 且有JSON输出
    Expected Result: 按照README步骤可成功运行示例
    Evidence: 执行日志保存至 .sisyphus/evidence/task-8-readme-test.txt

  Scenario: MCP配置指南格式正确
    Tool: Bash (jq验证)
    Preconditions: README包含配置示例
    Steps:
      1. 从README提取JSON配置块
      2. echo '提取的JSON' | jq .mcpServers
      3. Assert: jq解析成功(JSON格式正确)
      4. jq '.mcpServers."social-modeling".command'
      5. Assert: 输出 "bun" (命令正确)
    Expected Result: 配置示例是有效的JSON且字段正确
    Evidence: 验证结果保存至 .sisyphus/evidence/task-8-config-validation.txt

  Scenario: 代码示例语法正确
    Tool: Bash (bun check)
    Preconditions: README包含TypeScript示例
    Steps:
      1. 从README提取所有```typescript代码块
      2. for each 代码块: echo "代码" > /tmp/check.ts
      3. bun run --check /tmp/check.ts
      4. Assert: 所有代码块无语法错误
    Expected Result: 所有示例代码语法正确
    Evidence: 检查结果保存至 .sisyphus/evidence/task-8-code-examples.txt
  ```

  **提交策略**: YES (最终提交)
  - Message: `docs: add comprehensive README and architecture docs`
  - Files: `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`
  - 验证: 手动审查文档结构完整性

---

## Commit Strategy

| 任务 | Commit Message | 文件 | 验证命令 |
|------|---------------|------|----------|
| 1 | `feat(init): initialize project structure and core types` | package.json, tsconfig, src/types.ts | `bun run tsc --noEmit` |
| 2 | `feat(agents): add 7 agent prompt templates` | src/agents/prompts/*.md | `ls src/agents/prompts/ \| wc -l` |
| 3+4 | `feat(agents,workflow): implement agent factory and conflict detection` | agent-factory.ts, conflict-resolver.ts | `bun test src/` |
| 5 | `feat(workflow): implement 6-step orchestration engine` | orchestrator.ts, synthesizer.ts | `bun test src/workflow/` |
| 6 | `feat(mcp): integrate MCP server with 3 tools` | server.ts, package.json | `echo '{"method":"tools/list"}' \| bun run start` |
| 7 | `feat(examples): add community governance example and e2e test` | examples/, e2e.test.ts | `bun test e2e` |
| 8 | `docs: add comprehensive README and architecture docs` | README.md, ARCHITECTURE.md | 手动审查 |

---

## Success Criteria

### 最终验证命令

```bash
# 1. 类型检查通过
bun run tsc --noEmit
# Expected: No errors

# 2. 所有测试通过
bun test
# Expected: All tests pass

# 3. MCP Server可启动
bun run start &
SERVER_PID=$!
sleep 2
echo '{"method":"tools/list"}' | bun run src/server.ts | jq '.result.tools | length'
# Expected: 3
kill $SERVER_PID

# 4. 示例执行成功
bun run examples/run-example.ts | jq '.agentOutputs | length'
# Expected: 7

# 5. 文档完整性
test -f README.md && test -f ARCHITECTURE.md && test -f CONTRIBUTING.md
# Expected: Exit code 0
```

### 最终Checklist

- [ ] 所有7个Agent的Prompt模板已创建且格式统一
- [ ] 工作流引擎完整实现6步流程
- [ ] 冲突检测至少包含3种检测规则
- [ ] MCP Server可通过stdio通信并响应3个Tool
- [ ] 社区治理示例可成功执行并返回结构化模型
- [ ] README包含完整的安装和使用指南
- [ ] 所有核心模块有对应的单元测试
- [ ] 输出JSON符合定义的Schema(conclusion/evidence/risks/suggestions/falsifiable)
- [ ] 项目可通过 `bun install && bun run start` 一键启动
