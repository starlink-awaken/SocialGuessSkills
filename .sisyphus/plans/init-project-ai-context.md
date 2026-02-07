# 初始化项目AI上下文文档系统

## TL;DR

> **快速摘要**: 为 SocialGuessSkills 项目创建分层 AI 上下文文档体系,包含根级总览文档和各模块详细文档,添加 Mermaid 架构图和导航面包屑
> 
> **可交付成果**:
> - 根级 `CLAUDE.md` (项目总览 + Mermaid架构图 + 模块索引 + 全局规范)
> - 4个模块级 `CLAUDE.md` (src/agents/, src/workflow/, src/utils/, src/__tests__/)
> - 项目结构可视化 Mermaid 图
> - 每个模块文档的导航面包屑
> - 覆盖率报告 (已扫描vs估算总量)
> 
> **预估工作量**: 中等 (Medium)
> **并行执行**: YES - 2波次
> **关键路径**: Task 1 → Task 2 → Task 3 → Task 4 → Task 7

---

## 背景

### 原始请求
用户执行 `/init-project` 命令,需要初始化 SocialGuessSkills 项目的 AI 上下文文档体系。该项目是一个多智能体社会系统建模框架,使用 TypeScript + Bun 运行时。

### 访谈摘要
**项目信息**:
- 项目名称: SocialGuessSkills (社会体系建模多Agent系统)
- 技术栈: TypeScript, Bun, MCP SDK, Anthropic SDK
- 核心功能: 7个专业Agent协作分析,生成社会体系模型
- 项目规模: 27个 TypeScript 文件, 42个 Markdown 文件

**现有文档**:
- README.md (完整使用指南)
- ARCHITECTURE.md (446行,详细架构文档)
- CLAUDE.md (Bun运行时约定)
- AGENTS.md (项目知识库,已在根目录和多个子目录)

**识别的模块结构**:
```
src/
├── agents/          # Agent工厂、执行器、LLM客户端、prompts/
├── workflow/        # 编排器、冲突解析器
├── utils/          # 工具函数(配置、日志、重试、成本预测等)
├── __tests__/      # 测试文件
└── types.ts        # 核心类型定义
```

### 研究发现
**项目当前状态**:
- ✅ 已有根级 CLAUDE.md (Bun约定)
- ✅ 已有根级 AGENTS.md (项目知识库)
- ✅ 已有详细 README.md 和 ARCHITECTURE.md
- ⚠️ 缺少模块级详细文档
- ⚠️ 缺少可视化架构图 (Mermaid)
- ⚠️ 缺少模块间导航体系

---

## 工作目标

### 核心目标
创建分层 AI 上下文文档体系,使执行 Agent 能够快速理解项目结构、模块职责、代码规范和关键入口点。

### 具体可交付成果
- **根级 CLAUDE.md**: 整合项目总览、Mermaid架构图、模块索引、全局规范
- **src/agents/CLAUDE.md**: Agent系统详细文档 (工厂、执行器、Prompt管理、LLM集成)
- **src/workflow/CLAUDE.md**: 工作流模块文档 (编排器、冲突解析器、6步流程)
- **src/utils/CLAUDE.md**: 工具模块文档 (配置、日志、重试、成本控制)
- **src/__tests__/CLAUDE.md**: 测试模块文档 (测试结构、约定、覆盖范围)
- **覆盖率报告**: 文件扫描统计、遗漏分析、建议补扫路径

### 完成定义
- [ ] 根级 CLAUDE.md 包含 Mermaid 架构图
- [ ] 至少4个模块级 CLAUDE.md 已创建
- [ ] 每个模块文档包含导航面包屑
- [ ] 覆盖率报告生成(已扫描文件数/总文件数)
- [ ] 所有文档使用统一格式 (OVERVIEW/STRUCTURE/WHERE TO LOOK/CONVENTIONS)

### 必须包含
- Mermaid 图 (项目结构可视化)
- 模块索引 (快速跳转链接)
- 导航面包屑 (层级路径)
- 关键文件位置表 (任务→文件映射)
- 代码规范 (Bun、TypeScript、MCP约定)

### 禁止包含 (护栏)
- ❌ 不要复制整个源代码 (只引用关键片段)
- ❌ 不要硬编码行号 (使用符号名称引用)
- ❌ 不要添加无关的AI建议 (保持文档客观)
- ❌ 不要修改现有源代码文件
- ❌ 不要生成重复内容 (引用而非复制)

---

## 验证策略

### 测试决策
- **基础设施存在**: YES (Bun test)
- **自动化测试**: 无 (仅生成文档,不需要测试)
- **框架**: 不适用

### Agent执行的QA场景 (强制 - 所有任务)

每个任务完成后,执行Agent必须直接验证可交付成果:

**场景: 根级CLAUDE.md内容完整性检查**
  工具: Bash (grep + wc)
  前置条件: CLAUDE.md已生成
  步骤:
    1. grep -c "```mermaid" CLAUDE.md → 断言: >= 1 (至少有1个Mermaid图)
    2. grep -c "## 模块索引" CLAUDE.md → 断言: = 1
    3. grep -c "src/agents/" CLAUDE.md → 断言: >= 2 (模块索引 + 文件引用)
    4. wc -l CLAUDE.md → 断言: >= 100 (内容足够详细)
  预期结果: 所有grep返回预期数量
  失败指标: 缺少Mermaid图或模块索引部分
  证据: .sisyphus/evidence/task-1-root-claude-check.txt

**场景: 模块级CLAUDE.md导航面包屑检查**
  工具: Bash (head + grep)
  前置条件: src/agents/CLAUDE.md已生成
  步骤:
    1. head -n 10 src/agents/CLAUDE.md | grep "SocialGuessSkills > src > agents"
    2. 断言: 面包屑存在于文档顶部
    3. grep -c "## OVERVIEW" src/agents/CLAUDE.md → 断言: = 1
    4. grep -c "## WHERE TO LOOK" src/agents/CLAUDE.md → 断言: = 1
  预期结果: 面包屑和必需章节都存在
  失败指标: 缺少面包屑或章节结构不完整
  证据: .sisyphus/evidence/task-2-agents-breadcrumb.txt

**场景: Mermaid图语法有效性**
  工具: Bash (mermaid-cli 或 语法检查)
  前置条件: CLAUDE.md包含Mermaid图
  步骤:
    1. 提取Mermaid代码块: awk '/```mermaid/,/```/' CLAUDE.md > /tmp/arch.mmd
    2. 检查基本语法: grep -E "(graph|flowchart|classDiagram)" /tmp/arch.mmd
    3. 断言: 包含基本图类型关键字
    4. wc -l /tmp/arch.mmd → 断言: >= 10 (图有实质内容)
  预期结果: Mermaid代码块格式正确,有实质内容
  失败指标: 空图或语法错误
  证据: .sisyphus/evidence/task-3-mermaid-syntax.txt

**场景: 覆盖率报告数值准确性**
  工具: Bash (find + wc + 数学计算)
  前置条件: 覆盖率报告已生成
  步骤:
    1. find src -name "*.ts" | wc -l → 记录总TS文件数
    2. grep "已扫描文件" 覆盖率报告 → 提取扫描数
    3. 断言: 扫描数/总数 >= 0.8 (至少80%覆盖)
    4. grep "遗漏路径" 覆盖率报告 → 列出未扫描区域
  预期结果: 覆盖率 >= 80%, 遗漏路径已列出
  失败指标: 覆盖率 < 80% 且无合理解释
  证据: .sisyphus/evidence/task-7-coverage-report.txt

**场景: 文档格式一致性**
  工具: Bash (grep + diff)
  前置条件: 所有模块CLAUDE.md已生成
  步骤:
    1. for f in src/*/CLAUDE.md; do grep "## OVERVIEW" $f || echo "FAIL: $f"; done
    2. 断言: 所有文档都有 OVERVIEW/STRUCTURE/WHERE TO LOOK 章节
    3. 检查面包屑格式一致性: grep -o "^# .*>.*>.*" src/*/CLAUDE.md
    4. 断言: 所有面包屑使用 " > " 分隔符
  预期结果: 所有模块文档格式统一
  失败指标: 章节缺失或面包屑格式不一致
  证据: .sisyphus/evidence/task-8-format-consistency.txt

**证据捕获要求**:
- [ ] 所有验证输出保存到 .sisyphus/evidence/
- [ ] 每个场景生成独立证据文件: task-{N}-{scenario-slug}.txt
- [ ] 覆盖率数据以JSON或表格形式保存
- [ ] 所有grep/awk输出捕获完整输出(不仅行数)

---

## 执行策略

### 并行执行波次

```
Wave 1 (立即开始 - 信息收集):
├── Task 1: 扫描项目结构,生成文件清单
└── Task 5: 分析现有文档,提取可复用内容

Wave 2 (Wave 1后 - 文档生成):
├── Task 2: 生成 src/agents/CLAUDE.md
├── Task 3: 生成 src/workflow/CLAUDE.md
├── Task 4: 生成 src/utils/CLAUDE.md
└── Task 6: 生成 src/__tests__/CLAUDE.md

Wave 3 (Wave 2后 - 整合):
├── Task 7: 生成根级 CLAUDE.md (整合所有信息)
└── Task 8: 生成覆盖率报告

Wave 4 (Wave 3后 - 验证):
└── Task 9: 执行QA场景,验证所有文档

关键路径: Task 1 → Task 2,3,4,6 (并行) → Task 7 → Task 8 → Task 9
并行加速: ~40% 比顺序执行快
```

### 依赖矩阵

| 任务 | 依赖 | 阻塞 | 可并行于 |
|------|------|------|----------|
| 1 | 无 | 2,3,4,5,6 | 5 |
| 2 | 1 | 7 | 3,4,6 |
| 3 | 1 | 7 | 2,4,6 |
| 4 | 1 | 7 | 2,3,6 |
| 5 | 无 | 7 | 1 |
| 6 | 1 | 7 | 2,3,4 |
| 7 | 2,3,4,5,6 | 8 | 无 |
| 8 | 7 | 9 | 无 |
| 9 | 8 | 无 | 无 (最后验证) |

### Agent调度摘要

| 波次 | 任务 | 推荐Agent |
|------|------|-----------|
| 1 | 1, 5 | category="quick", load_skills=[] |
| 2 | 2,3,4,6 | category="quick", load_skills=[] (并行) |
| 3 | 7, 8 | category="quick", load_skills=[] |
| 4 | 9 | category="quick", load_skills=[] |

---

## TODOs

- [x] 1. 扫描项目结构并生成文件清单

  **要做什么**:
  - 使用 `find` 扫描所有 `.ts` 和 `.md` 文件
  - 识别模块目录 (src/agents/, src/workflow/, src/utils/, src/__tests__/)
  - 统计文件数量 (总数/分模块)
  - 生成临时文件清单: `.sisyphus/temp/file-inventory.json`

  **禁止做**:
  - 不要读取每个文件的完整内容 (仅扫描路径)
  - 不要修改任何源代码文件

  **推荐Agent配置**:
  - **类别**: `quick`
    - 原因: 简单文件扫描操作,无需复杂推理
  - **技能**: `[]` (无需特殊技能)
    - 原因: 使用标准bash命令即可完成

  **并行化**:
  - **可并行运行**: YES
  - **并行组**: Wave 1 (与Task 5)
  - **阻塞**: Tasks 2,3,4,6 (所有模块文档生成任务)
  - **被阻塞**: 无 (可立即开始)

  **引用** (关键 - 详尽):

  **模式引用** (现有代码遵循的模式):
  - 无 (文件扫描任务,无需代码模式)

  **API/类型引用** (要实现的契约):
  - 无 (bash命令操作,无TS类型)

  **测试引用** (测试模式):
  - 无 (文档生成任务)

  **文档引用** (规范和需求):
  - `ARCHITECTURE.md:82-98` - 核心模块说明 (Server/Workflow/Agent/Prompts层)
  - `README.md:165-176` - 项目结构说明
  - `package.json:19` - 项目入口点 src/server.ts

  **外部引用** (库和框架):
  - 无

  **为什么每个引用重要**:
  - ARCHITECTURE.md: 理解模块划分标准,确定哪些是核心模块
  - README.md: 验证文件结构符合官方描述
  - package.json: 确认入口点和脚本配置

  **验收标准**:

  **Agent执行的QA场景** (每场景详细 - 具体选择器/数据):

  ```
  场景: 文件清单JSON格式正确性
    工具: Bash (jq)
    前置条件: .sisyphus/temp/file-inventory.json已生成
    步骤:
      1. cat .sisyphus/temp/file-inventory.json | jq '.modules'
      2. 断言: 输出包含 "agents", "workflow", "utils", "tests" 键
      3. jq '.total_files' .sisyphus/temp/file-inventory.json
      4. 断言: 总文件数 >= 27 (已知至少27个TS文件)
      5. jq '.modules.agents.files | length' .sisyphus/temp/file-inventory.json
      6. 断言: agents模块文件数 >= 5
    预期结果: JSON格式有效,模块分类正确,文件数统计准确
    失败指标: JSON解析失败或缺少模块键
    证据: .sisyphus/evidence/task-1-inventory-format.txt

  场景: 模块识别完整性
    工具: Bash (grep + test)
    前置条件: 文件清单已生成
    步骤:
      1. grep -q '"agents"' .sisyphus/temp/file-inventory.json
      2. 断言: 退出码 = 0 (agents模块已识别)
      3. grep -q '"workflow"' .sisyphus/temp/file-inventory.json
      4. 断言: workflow模块已识别
      5. grep -q '"utils"' .sisyphus/temp/file-inventory.json
      6. 断言: utils模块已识别
      7. grep -q '"tests"' .sisyphus/temp/file-inventory.json
      8. 断言: tests模块已识别
    预期结果: 4个核心模块全部识别
    失败指标: 任一模块未出现在清单中
    证据: .sisyphus/evidence/task-1-modules-found.txt
  ```

  **证据捕获**:
  - [ ] 文件清单保存为 .sisyphus/temp/file-inventory.json
  - [ ] 验证输出保存到 .sisyphus/evidence/task-1-*.txt

  **提交**: NO (与Task 7一起提交)

---

- [x] 2. 生成 src/agents/CLAUDE.md (Agent系统模块文档)

  **要做什么**:
  - 创建 `src/agents/CLAUDE.md` 文件
  - 添加导航面包屑: `# SocialGuessSkills > src > agents`
  - 编写 OVERVIEW 章节 (模块职责概述)
  - 编写 STRUCTURE 章节 (子目录和文件结构)
  - 编写 WHERE TO LOOK 表格 (任务→文件映射)
  - 编写 CONVENTIONS 章节 (Agent创建、Prompt加载、输出格式约定)
  - 编写 ANTI-PATTERNS 章节 (避免的模式)

  **禁止做**:
  - 不要复制整个Prompt文件内容 (仅引用路径)
  - 不要修改现有源代码文件
  - 不要硬编码具体行号 (使用函数名引用)

  **推荐Agent配置**:
  - **类别**: `quick`
    - 原因: 文档生成任务,基于已有信息整理
  - **技能**: `[]`
    - 原因: 无需特殊技能,标准文档编写

  **并行化**:
  - **可并行运行**: YES
  - **并行组**: Wave 2 (与Tasks 3,4,6)
  - **阻塞**: Task 7 (根级文档整合)
  - **被阻塞**: Task 1 (需要文件清单)

  **引用**:

  **模式引用**:
  - `src/agents/agent-factory.ts:4-25` - loadPrompt函数模式 (readFileSync读取Prompt)
  - `src/agents/agent-factory.ts:42-58` - createAllAgents函数 (批量创建7个Agent)
  - `src/agents/agent-executor.ts:3-30` - executeAgent函数签名和上下文构建

  **API/类型引用**:
  - `src/types.ts:1` - AgentType枚举定义
  - `src/types.ts:9-16` - AgentOutput接口 (Agent输出格式)
  - `src/types.ts:124-136` - AgentInstance接口 (Agent实例结构)

  **文档引用**:
  - `ARCHITECTURE.md:145-176` - Agent Layer职责和7个Agent类型说明
  - `README.md:165-167` - agents/目录结构说明
  - `src/agents/prompts/AGENTS.md` (如果存在) - Prompt模块说明

  **外部引用**:
  - `node:fs.readFileSync` - Prompt文件加载方式
  - Anthropic SDK - LLM客户端集成 (src/agents/llm-client.ts)

  **为什么每个引用重要**:
  - agent-factory.ts: 展示Agent创建的核心流程,执行者需要理解工厂模式
  - types.ts: 定义Agent输入输出契约,是所有Agent交互的基础
  - ARCHITECTURE.md: 提供Agent系统的设计理念和责任边界
  - llm-client.ts: 理解如何集成真实AI API (当前版本为模拟)

  **验收标准**:

  **Agent执行的QA场景**:

  ```
  场景: 模块文档章节完整性
    工具: Bash (grep)
    前置条件: src/agents/CLAUDE.md已创建
    步骤:
      1. grep -c "## OVERVIEW" src/agents/CLAUDE.md → 断言: = 1
      2. grep -c "## STRUCTURE" src/agents/CLAUDE.md → 断言: = 1
      3. grep -c "## WHERE TO LOOK" src/agents/CLAUDE.md → 断言: = 1
      4. grep -c "## CONVENTIONS" src/agents/CLAUDE.md → 断言: = 1
      5. head -n 5 src/agents/CLAUDE.md | grep "SocialGuessSkills > src > agents"
      6. 断言: 面包屑存在
    预期结果: 所有必需章节存在,面包屑正确
    失败指标: 任何章节缺失或面包屑格式错误
    证据: .sisyphus/evidence/task-2-agents-structure.txt

  场景: WHERE TO LOOK表格内容准确性
    工具: Bash (grep + awk)
    前置条件: src/agents/CLAUDE.md已创建
    步骤:
      1. grep -A 20 "## WHERE TO LOOK" src/agents/CLAUDE.md | grep "agent-factory.ts"
      2. 断言: 包含 agent-factory.ts 引用
      3. grep -A 20 "## WHERE TO LOOK" src/agents/CLAUDE.md | grep "agent-executor.ts"
      4. 断言: 包含 agent-executor.ts 引用
      5. grep -A 20 "## WHERE TO LOOK" src/agents/CLAUDE.md | grep "prompts/"
      6. 断言: 包含 prompts/ 目录引用
    预期结果: 所有关键文件在WHERE TO LOOK表格中
    失败指标: 缺少关键文件引用
    证据: .sisyphus/evidence/task-2-agents-references.txt
  ```

  **证据捕获**:
  - [ ] 文档生成后保存验证输出到 .sisyphus/evidence/task-2-*.txt

  **提交**: NO (与Task 7一起提交)

---

- [x] 3. 生成 src/workflow/CLAUDE.md (工作流模块文档)

  **要做什么**:
  - 创建 `src/workflow/CLAUDE.md` 文件
  - 添加导航面包屑: `# SocialGuessSkills > src > workflow`
  - OVERVIEW: 6步工作流概述 (假设验证→Agent执行→冲突对齐→模型合成→验证→迭代)
  - STRUCTURE: orchestrator.ts 和 conflict-resolver.ts 说明
  - WHERE TO LOOK: 关键函数位置表
  - CONVENTIONS: 工作流状态管理、迭代控制、冲突检测规则

  **禁止做**:
  - 不要复制整个orchestrator.ts代码
  - 不要详细解释每个冲突检测算法 (仅概述)

  **推荐Agent配置**:
  - **类别**: `quick`
    - 原因: 文档整理任务
  - **技能**: `[]`

  **并行化**:
  - **可并行运行**: YES
  - **并行组**: Wave 2 (与Tasks 2,4,6)
  - **阻塞**: Task 7
  - **被阻塞**: Task 1

  **引用**:

  **模式引用**:
  - `src/workflow/orchestrator.ts:14-50` - runWorkflow主函数 (6步流程入口)
  - `src/workflow/orchestrator.ts:60-120` - 各步骤函数 (validateHypothesis, executeAgents等)
  - `src/workflow/conflict-resolver.ts:3-40` - detectConflicts函数和3种检测规则

  **API/类型引用**:
  - `src/types.ts:18-24` - Conflict接口
  - `src/types.ts:100-114` - WorkflowState接口 (状态管理)
  - `src/types.ts:116-122` - AnalysisContext接口 (Agent执行上下文)

  **文档引用**:
  - `ARCHITECTURE.md:102-145` - 6步流程详解
  - `ARCHITECTURE.md:177-201` - 冲突检测器职责和3种规则
  - `README.md:26-70` - 工作流架构概览图

  **为什么每个引用重要**:
  - orchestrator.ts: 是工作流的核心编排逻辑,执行者需要理解每步的输入输出
  - conflict-resolver.ts: 展示如何检测和解决Agent间冲突
  - ARCHITECTURE.md: 提供工作流的设计理念和决策依据

  **验收标准**:

  **Agent执行的QA场景**:

  ```
  场景: 工作流6步描述完整性
    工具: Bash (grep)
    前置条件: src/workflow/CLAUDE.md已创建
    步骤:
      1. grep -i "假设验证" src/workflow/CLAUDE.md
      2. 断言: 包含步骤1描述
      3. grep -i "Agent.*执行\|并行执行" src/workflow/CLAUDE.md
      4. 断言: 包含步骤2描述
      5. grep -i "冲突.*对齐\|冲突检测" src/workflow/CLAUDE.md
      6. 断言: 包含步骤3描述
      7. grep -i "模型合成\|决策合成" src/workflow/CLAUDE.md
      8. 断言: 包含步骤4描述
      9. grep -i "模型验证\|证据校验" src/workflow/CLAUDE.md
      10. 断言: 包含步骤5描述
      11. grep -i "迭代.*收敛\|迭代控制" src/workflow/CLAUDE.md
      12. 断言: 包含步骤6描述
    预期结果: 6个工作流步骤全部描述
    失败指标: 任一步骤未提及
    证据: .sisyphus/evidence/task-3-workflow-steps.txt

  场景: 冲突检测规则说明
    工具: Bash (grep)
    前置条件: src/workflow/CLAUDE.md已创建
    步骤:
      1. grep -i "逻辑.*矛盾\|logical.*conflict" src/workflow/CLAUDE.md
      2. 断言: 提及逻辑矛盾检测
      3. grep -i "优先级.*冲突\|priority.*conflict" src/workflow/CLAUDE.md
      4. 断言: 提及优先级冲突
      5. grep -i "风险.*叠加\|risk.*amplification" src/workflow/CLAUDE.md
      6. 断言: 提及风险叠加检测
    预期结果: 3种冲突检测规则都有说明
    失败指标: 缺少任一规则描述
    证据: .sisyphus/evidence/task-3-conflict-rules.txt
  ```

  **证据捕获**:
  - [ ] 验证输出保存到 .sisyphus/evidence/task-3-*.txt

  **提交**: NO (与Task 7一起提交)

---

- [x] 4. 生成 src/utils/CLAUDE.md (工具模块文档)

  **要做什么**:
  - 创建 `src/utils/CLAUDE.md` 文件
  - 添加导航面包屑: `# SocialGuessSkills > src > utils`
  - OVERVIEW: 工具函数职责 (配置管理、日志、重试、成本控制、熔断器)
  - STRUCTURE: 列出所有工具文件 (config.ts, logger.ts, retry.ts等)
  - WHERE TO LOOK: 常见需求→工具函数映射
  - CONVENTIONS: 错误处理约定、日志级别、配置优先级

  **禁止做**:
  - 不要详细解释每个工具函数的实现细节

  **推荐Agent配置**:
  - **类别**: `quick`
  - **技能**: `[]`

  **并行化**:
  - **可并行运行**: YES
  - **并行组**: Wave 2 (与Tasks 2,3,6)
  - **阻塞**: Task 7
  - **被阻塞**: Task 1

  **引用**:

  **模式引用**:
  - `src/utils/config.ts` - 配置加载和环境变量处理
  - `src/utils/logger.ts` - Pino日志器配置
  - `src/utils/retry.ts` - 重试机制 (指数退避)
  - `src/utils/circuit-breaker.ts` - 熔断器模式
  - `src/utils/cost-predictor.ts` - 成本预测和告警

  **API/类型引用**:
  - 无 (工具模块主要导出函数)

  **文档引用**:
  - `package.json:16` - Pino依赖
  - Anthropic SDK文档 - 成本计算相关

  **为什么每个引用重要**:
  - config.ts: 展示如何加载和验证配置
  - retry.ts: 处理LLM API调用失败的标准模式
  - cost-predictor.ts: 成本控制是生产环境的关键需求

  **验收标准**:

  **Agent执行的QA场景**:

  ```
  场景: 工具文件覆盖完整性
    工具: Bash (find + diff)
    前置条件: src/utils/CLAUDE.md已创建
    步骤:
      1. find src/utils -name "*.ts" -type f | wc -l → 记录实际工具文件数
      2. grep -c "\.ts" src/utils/CLAUDE.md → 记录文档中提及的文件数
      3. 断言: 文档提及数 >= 实际文件数 * 0.8 (至少80%覆盖)
      4. grep "config.ts\|logger.ts\|retry.ts" src/utils/CLAUDE.md
      5. 断言: 关键工具文件都被提及
    预期结果: 至少80%的工具文件在文档中说明
    失败指标: 关键工具文件未提及
    证据: .sisyphus/evidence/task-4-utils-coverage.txt
  ```

  **证据捕获**:
  - [ ] 验证输出保存到 .sisyphus/evidence/task-4-*.txt

  **提交**: NO (与Task 7一起提交)

---

- [x] 5. 分析现有文档并提取可复用内容

  **要做什么**:
  - 读取 ARCHITECTURE.md, README.md, 现有AGENTS.md
  - 提取关键信息:
    - 项目总体架构描述
    - 技术栈和依赖说明
    - 核心设计决策
    - 全局代码规范
  - 生成临时摘要文件: `.sisyphus/temp/doc-extracts.json`

  **禁止做**:
  - 不要复制整个文档内容
  - 不要修改现有文档文件

  **推荐Agent配置**:
  - **类别**: `quick`
  - **技能**: `[]`

  **并行化**:
  - **可并行运行**: YES
  - **并行组**: Wave 1 (与Task 1)
  - **阻塞**: Task 7
  - **被阻塞**: 无

  **引用**:

  **文档引用**:
  - `ARCHITECTURE.md:3-80` - 总体架构和核心模块
  - `ARCHITECTURE.md:268-346` - 关键设计决策
  - `README.md:1-25` - 项目简介和核心特性
  - `CLAUDE.md` - Bun运行时约定

  **为什么每个引用重要**:
  - ARCHITECTURE.md: 提供最权威的架构说明,避免重复编写
  - README.md: 提供用户友好的功能描述
  - CLAUDE.md: 确保新文档遵循相同的技术规范

  **验收标准**:

  **Agent执行的QA场景**:

  ```
  场景: 文档提取JSON有效性
    工具: Bash (jq)
    前置条件: .sisyphus/temp/doc-extracts.json已生成
    步骤:
      1. jq '.architecture' .sisyphus/temp/doc-extracts.json
      2. 断言: 包含架构摘要
      3. jq '.tech_stack' .sisyphus/temp/doc-extracts.json
      4. 断言: 包含技术栈列表
      5. jq '.conventions' .sisyphus/temp/doc-extracts.json
      6. 断言: 包含代码规范摘要
    预期结果: JSON格式正确,包含所有关键字段
    失败指标: JSON无效或缺少关键字段
    证据: .sisyphus/evidence/task-5-extracts-format.txt
  ```

  **证据捕获**:
  - [ ] 提取摘要保存为 .sisyphus/temp/doc-extracts.json
  - [ ] 验证输出保存到 .sisyphus/evidence/task-5-*.txt

  **提交**: NO (临时文件,不提交)

---

- [x] 6. 生成 src/__tests__/CLAUDE.md (测试模块文档)

  **要做什么**:
  - 创建 `src/__tests__/CLAUDE.md` 文件
  - 添加导航面包屑: `# SocialGuessSkills > src > __tests__`
  - OVERVIEW: 测试结构和覆盖范围概述
  - STRUCTURE: 列出所有测试文件
  - WHERE TO LOOK: 测试类型→测试文件映射
  - CONVENTIONS: Bun test约定、测试命名规范

  **禁止做**:
  - 不要复制整个测试代码

  **推荐Agent配置**:
  - **类别**: `quick`
  - **技能**: `[]`

  **并行化**:
  - **可并行运行**: YES
  - **并行组**: Wave 2 (与Tasks 2,3,4)
  - **阻塞**: Task 7
  - **被阻塞**: Task 1

  **引用**:

  **模式引用**:
  - `src/__tests__/e2e.test.ts` - 端到端测试示例
  - `src/__tests__/orchestrator.test.ts` - 单元测试示例
  - `CLAUDE.md:29-37` - Bun test约定

  **文档引用**:
  - `package.json:22` - 测试脚本
  - `README.md:198-208` - 测试说明

  **为什么每个引用重要**:
  - 测试文件: 展示项目的测试风格和约定
  - CLAUDE.md: 确保使用Bun test而非jest/vitest

  **验收标准**:

  **Agent执行的QA场景**:

  ```
  场景: 测试文档包含Bun约定
    工具: Bash (grep)
    前置条件: src/__tests__/CLAUDE.md已创建
    步骤:
      1. grep -i "bun test" src/__tests__/CLAUDE.md
      2. 断言: 提及 bun test 命令
      3. grep -v "jest\|vitest" src/__tests__/CLAUDE.md || echo "PASS"
      4. 断言: 不提及 jest 或 vitest (应使用bun test)
    预期结果: 文档明确说明使用Bun test
    失败指标: 提及其他测试框架
    证据: .sisyphus/evidence/task-6-tests-bun-convention.txt
  ```

  **证据捕获**:
  - [ ] 验证输出保存到 .sisyphus/evidence/task-6-*.txt

  **提交**: NO (与Task 7一起提交)

---

- [x] 7. 生成根级 CLAUDE.md (整合所有信息)

  **要做什么**:
  - 更新根级 `CLAUDE.md` (已存在,需扩展)
  - 保留现有的 Bun 约定部分
  - 添加新章节:
    - **项目总览**: 从 doc-extracts.json 提取
    - **Mermaid架构图**: 可视化项目结构
    - **模块索引**: 链接到4个模块CLAUDE.md
    - **全局规范**: TypeScript、MCP、Bun约定
    - **关键入口点**: server.ts、orchestrator.ts位置
  - 章节顺序:
    1. 现有Bun约定
    2. 项目总览 (NEW)
    3. Mermaid架构图 (NEW)
    4. 模块索引 (NEW)
    5. 全局规范 (NEW)
    6. 关键入口点 (NEW)

  **Mermaid图要求**:
  - 使用 `graph TD` 或 `flowchart TD`
  - 展示 Server → Workflow → Agents → Prompts 层级
  - 标注关键文件路径
  - 至少15行代码 (保证内容详细)

  **禁止做**:
  - 不要删除现有的 Bun 约定部分
  - 不要硬编码模块内部细节 (链接到模块CLAUDE.md即可)

  **推荐Agent配置**:
  - **类别**: `quick`
  - **技能**: `[]`

  **并行化**:
  - **可并行运行**: NO
  - **并行组**: Wave 3 (与Task 8顺序执行)
  - **阻塞**: Task 8
  - **被阻塞**: Tasks 2,3,4,5,6 (需要所有模块文档完成)

  **引用**:

  **模式引用**:
  - 现有 `CLAUDE.md` - Bun约定部分需保留
  - `.sisyphus/temp/doc-extracts.json` - 提取的文档摘要
  - `.sisyphus/temp/file-inventory.json` - 项目结构数据

  **文档引用**:
  - `ARCHITECTURE.md:5-80` - 用于生成Mermaid图的架构说明
  - `src/agents/CLAUDE.md` - 链接目标
  - `src/workflow/CLAUDE.md` - 链接目标
  - `src/utils/CLAUDE.md` - 链接目标
  - `src/__tests__/CLAUDE.md` - 链接目标

  **外部引用**:
  - Mermaid语法文档 - 确保图语法正确

  **为什么每个引用重要**:
  - 现有CLAUDE.md: 保持文档连续性,不丢失已有信息
  - doc-extracts.json: 避免重复阅读大文档
  - 模块CLAUDE.md: 创建导航链接,形成文档体系

  **验收标准**:

  **Agent执行的QA场景**:

  ```
  场景: 根级文档Mermaid图存在性
    工具: Bash (grep + awk)
    前置条件: CLAUDE.md已更新
    步骤:
      1. grep -c "```mermaid" CLAUDE.md
      2. 断言: >= 1 (至少有1个Mermaid图)
      3. awk '/```mermaid/,/```/' CLAUDE.md | wc -l
      4. 断言: >= 15 (Mermaid图至少15行)
      5. awk '/```mermaid/,/```/' CLAUDE.md | grep -E "graph|flowchart"
      6. 断言: 包含图类型声明
    预期结果: Mermaid图存在且内容详细
    失败指标: 无Mermaid图或内容过于简单
    证据: .sisyphus/evidence/task-7-root-mermaid.txt

  场景: 模块索引链接完整性
    工具: Bash (grep)
    前置条件: CLAUDE.md已更新
    步骤:
      1. grep "src/agents/CLAUDE.md" CLAUDE.md
      2. 断言: 包含agents模块链接
      3. grep "src/workflow/CLAUDE.md" CLAUDE.md
      4. 断言: 包含workflow模块链接
      5. grep "src/utils/CLAUDE.md" CLAUDE.md
      6. 断言: 包含utils模块链接
      7. grep "src/__tests__/CLAUDE.md" CLAUDE.md
      8. 断言: 包含tests模块链接
    预期结果: 4个模块都有链接
    失败指标: 任一模块链接缺失
    证据: .sisyphus/evidence/task-7-module-links.txt

  场景: Bun约定保留检查
    工具: Bash (grep)
    前置条件: CLAUDE.md已更新
    步骤:
      1. grep "bun install" CLAUDE.md
      2. 断言: Bun约定仍然存在
      3. grep "Bun.serve" CLAUDE.md
      4. 断言: Bun API说明仍然存在
    预期结果: 原有Bun约定未被删除
    失败指标: Bun约定丢失
    证据: .sisyphus/evidence/task-7-bun-preserved.txt
  ```

  **证据捕获**:
  - [ ] 验证输出保存到 .sisyphus/evidence/task-7-*.txt
  - [ ] 提取的Mermaid图保存到 .sisyphus/evidence/task-7-architecture.mmd (用于独立验证)

  **提交**: YES
  - 消息: `docs: init AI context system with root CLAUDE.md and module docs`
  - 文件:
    - `CLAUDE.md` (更新)
    - `src/agents/CLAUDE.md` (新建)
    - `src/workflow/CLAUDE.md` (新建)
    - `src/utils/CLAUDE.md` (新建)
    - `src/__tests__/CLAUDE.md` (新建)
  - 预提交: 无 (仅文档文件)

---

- [x] 8. 生成覆盖率报告并输出摘要

  **要做什么**:
  - 读取 `.sisyphus/temp/file-inventory.json`
  - 统计已扫描文件数 vs 总文件数
  - 计算覆盖率 (已扫描/总数)
  - 识别未扫描的目录或文件类型
  - 生成报告文件: `.sisyphus/reports/init-project-coverage.md`
  - 在主对话中打印摘要 (不超过20行)

  **报告内容**:
  ```markdown
  # 项目初始化覆盖率报告

  生成时间: 2026-02-05T10:30:00Z

  ## 文件统计
  - 总TypeScript文件: 27
  - 总Markdown文件: 42
  - 已扫描文件: 31
  - 覆盖率: 72% (31/43核心文件)

  ## 模块覆盖
  - ✅ src/agents/ (100% - 5/5文件)
  - ✅ src/workflow/ (100% - 2/2文件)
  - ✅ src/utils/ (85% - 6/7文件,遗漏request-queue.ts)
  - ✅ src/__tests__/ (100% - 7/7文件)
  - ⚠️ benchmarks/ (0% - 0/2文件,未扫描)
  - ⚠️ examples/ (50% - 1/2文件)

  ## 遗漏分析
  - benchmarks/ (性能测试,非核心功能)
  - src/utils/request-queue.ts (工具函数,已在utils/CLAUDE.md概述中提及)

  ## 推荐后续操作
  1. 若需要优化性能,建议补扫: `benchmarks/`
  2. 若需要完整工具文档,建议深入: `src/utils/request-queue.ts`

  ## 已生成文档
  - [x] CLAUDE.md (根级,包含Mermaid图)
  - [x] src/agents/CLAUDE.md
  - [x] src/workflow/CLAUDE.md
  - [x] src/utils/CLAUDE.md
  - [x] src/__tests__/CLAUDE.md
  ```

  **禁止做**:
  - 不要在主对话中输出完整报告 (仅摘要)

  **推荐Agent配置**:
  - **类别**: `quick`
  - **技能**: `[]`

  **并行化**:
  - **可并行运行**: NO
  - **并行组**: Wave 3 (在Task 7之后)
  - **阻塞**: Task 9
  - **被阻塞**: Task 7

  **引用**:

  **模式引用**:
  - `.sisyphus/temp/file-inventory.json` - 文件清单数据

  **为什么引用重要**:
  - file-inventory.json: 唯一的文件统计数据源

  **验收标准**:

  **Agent执行的QA场景**:

  ```
  场景: 覆盖率报告数值准确性
    工具: Bash (jq + bc)
    前置条件: .sisyphus/reports/init-project-coverage.md已生成
    步骤:
      1. grep "覆盖率:" .sisyphus/reports/init-project-coverage.md | grep -oE "[0-9]+%"
      2. 记录报告中的覆盖率数值
      3. jq '.total_files' .sisyphus/temp/file-inventory.json
      4. jq '.scanned_files' .sisyphus/temp/file-inventory.json
      5. 计算: scanned / total (使用bc或awk)
      6. 断言: 报告中的覆盖率 = 计算值 (误差 < 1%)
    预期结果: 覆盖率数值准确
    失败指标: 数值不匹配或计算错误
    证据: .sisyphus/evidence/task-8-coverage-accuracy.txt

  场景: 遗漏分析存在性
    工具: Bash (grep)
    前置条件: 覆盖率报告已生成
    步骤:
      1. grep "## 遗漏分析" .sisyphus/reports/init-project-coverage.md
      2. 断言: 遗漏分析章节存在
      3. grep -A 10 "## 遗漏分析" .sisyphus/reports/init-project-coverage.md | wc -l
      4. 断言: 章节至少3行 (有实质内容)
    预期结果: 遗漏分析详细说明
    失败指标: 章节缺失或内容空洞
    证据: .sisyphus/evidence/task-8-gaps-analysis.txt
  ```

  **证据捕获**:
  - [ ] 覆盖率报告保存到 .sisyphus/reports/init-project-coverage.md
  - [ ] 验证输出保存到 .sisyphus/evidence/task-8-*.txt

  **提交**: YES (与Task 7一起提交,或单独提交)
  - 消息: `docs: add project initialization coverage report`
  - 文件: `.sisyphus/reports/init-project-coverage.md`
  - 预提交: 无

---

- [x] 9. 执行所有QA场景并汇总验证结果

  **要做什么**:
  - 按顺序执行所有前述任务的QA场景
  - 收集所有 `.sisyphus/evidence/task-*` 文件
  - 汇总验证结果:
    - 通过的场景数量
    - 失败的场景列表 (如果有)
    - 每个任务的验证状态
  - 生成最终验证报告: `.sisyphus/reports/init-project-qa-summary.md`
  - 在主对话中打印验证摘要

  **验证摘要格式** (在主对话中打印):
  ```
  ## ✅ 初始化结果摘要

  ### 生成的文档
  - ✅ 根级 CLAUDE.md (已更新,包含Mermaid架构图)
  - ✅ src/agents/CLAUDE.md (Agent系统文档,包含导航面包屑)
  - ✅ src/workflow/CLAUDE.md (工作流文档,6步流程说明)
  - ✅ src/utils/CLAUDE.md (工具模块文档)
  - ✅ src/__tests__/CLAUDE.md (测试模块文档)

  ### 识别的模块
  - src/agents/ (5个文件: agent-factory.ts, agent-executor.ts, llm-client.ts, prompts/)
  - src/workflow/ (2个文件: orchestrator.ts, conflict-resolver.ts)
  - src/utils/ (7个文件: config, logger, retry, cost-*, circuit-breaker等)
  - src/__tests__/ (7个测试文件)

  ### 覆盖率
  - 已扫描文件: 31 / 43 核心文件
  - 覆盖率: **72%**
  - 主要遗漏: benchmarks/ (性能测试,非核心)

  ### 增强功能
  - ✅ 已生成 Mermaid 结构图 (根级CLAUDE.md)
  - ✅ 已为 4 个模块添加导航面包屑
  - ✅ 所有模块文档使用统一格式 (OVERVIEW/STRUCTURE/WHERE TO LOOK/CONVENTIONS)

  ### QA验证
  - ✅ 17/17 场景通过
  - ✅ Mermaid图语法有效 (至少15行)
  - ✅ 所有模块链接可访问
  - ✅ 文档格式一致性检查通过

  ### 推荐后续操作
  如需更高覆盖率,建议补扫:
  - `benchmarks/` (性能测试文档)
  - `src/utils/request-queue.ts` (请求队列详细说明)

  重新运行 `/init-project` 将执行**增量更新**,仅处理新增或修改的文件。

  详细报告:
  - 覆盖率: .sisyphus/reports/init-project-coverage.md
  - QA验证: .sisyphus/reports/init-project-qa-summary.md
  - 证据文件: .sisyphus/evidence/task-*.txt (17个场景)
  ```

  **禁止做**:
  - 不要在失败时自动重试 (报告失败即可)
  - 不要在主对话中输出所有证据文件内容

  **推荐Agent配置**:
  - **类别**: `quick`
  - **技能**: `[]`

  **并行化**:
  - **可并行运行**: NO
  - **并行组**: Wave 4 (最后验证阶段)
  - **阻塞**: 无 (最终任务)
  - **被阻塞**: Task 8

  **引用**:

  **模式引用**:
  - 所有前述任务的QA场景定义

  **为什么引用重要**:
  - QA场景: 是验证的执行规范

  **验收标准**:

  **Agent执行的QA场景**:

  ```
  场景: 所有证据文件存在性
    工具: Bash (ls + test)
    前置条件: 所有任务已完成
    步骤:
      1. ls .sisyphus/evidence/task-*.txt | wc -l
      2. 断言: >= 17 (至少17个场景的证据文件)
      3. for f in .sisyphus/evidence/task-*.txt; do test -s $f || echo "EMPTY: $f"; done
      4. 断言: 所有文件非空
    预期结果: 所有证据文件存在且非空
    失败指标: 缺少证据文件或文件为空
    证据: .sisyphus/evidence/task-9-evidence-check.txt

  场景: QA摘要报告完整性
    工具: Bash (grep)
    前置条件: .sisyphus/reports/init-project-qa-summary.md已生成
    步骤:
      1. grep "通过.*场景" .sisyphus/reports/init-project-qa-summary.md
      2. 断言: 包含通过场景统计
      3. grep "失败.*场景" .sisyphus/reports/init-project-qa-summary.md
      4. 断言: 包含失败场景列表 (可能为空)
      5. wc -l .sisyphus/reports/init-project-qa-summary.md
      6. 断言: >= 30 (报告有详细内容)
    预期结果: QA报告完整且有统计数据
    失败指标: 缺少统计或内容过于简单
    证据: .sisyphus/evidence/task-9-qa-report-check.txt
  ```

  **证据捕获**:
  - [ ] QA摘要报告保存到 .sisyphus/reports/init-project-qa-summary.md
  - [ ] 验证输出保存到 .sisyphus/evidence/task-9-*.txt

  **提交**: YES (可选,取决于报告内容是否需要版本控制)
  - 消息: `docs: add project initialization QA summary`
  - 文件: `.sisyphus/reports/init-project-qa-summary.md`
  - 预提交: 无

---

## 提交策略

| 完成任务后 | 消息 | 文件 | 验证 |
|------------|------|------|------|
| 7 | `docs: init AI context system with root CLAUDE.md and module docs` | CLAUDE.md, src/*/CLAUDE.md (4个) | grep检查Mermaid图和链接 |
| 8 | `docs: add project initialization coverage report` | .sisyphus/reports/init-project-coverage.md | 数值准确性检查 |
| 9 | `docs: add project initialization QA summary` | .sisyphus/reports/init-project-qa-summary.md | 证据文件完整性 |

---

## 成功标准

### 验证命令
```bash
# 验证根级文档包含Mermaid图
grep -c "```mermaid" CLAUDE.md  # 预期: >= 1

# 验证模块文档存在
ls src/agents/CLAUDE.md src/workflow/CLAUDE.md src/utils/CLAUDE.md src/__tests__/CLAUDE.md  # 预期: 4个文件

# 验证导航面包屑
head -n 10 src/agents/CLAUDE.md | grep "SocialGuessSkills > src > agents"  # 预期: 匹配

# 验证覆盖率报告
test -f .sisyphus/reports/init-project-coverage.md  # 预期: 文件存在

# 验证证据文件
ls .sisyphus/evidence/task-*.txt | wc -l  # 预期: >= 17
```

### 最终检查清单
- [ ] 根级 CLAUDE.md 包含 Mermaid 架构图
- [ ] 至少4个模块级 CLAUDE.md 已创建
- [ ] 每个模块文档有导航面包屑
- [ ] 覆盖率报告显示 >= 70% 覆盖率
- [ ] 所有文档使用统一格式
- [ ] QA验证报告显示所有关键场景通过
- [ ] 至少17个证据文件存在于 .sisyphus/evidence/
- [ ] 主对话打印了初始化结果摘要
