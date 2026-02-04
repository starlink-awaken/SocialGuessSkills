# MCP集成计划 - 将社会推理系统集成到AI Agent

## TL;DR

> **Quick Summary**: 将已完成的社会推理MCP Server集成到OpenCode CLI、Claude Desktop、Droid等MCP客户端，使AI agent能够调用社会系统推理能力。
> 
> **Deliverables**: 
> - OpenCode CLI配置文件（OCX格式）
> - Claude Desktop配置文件
> - Droid配置文件
> - 通用MCP客户端配置指南
> - 集成测试验证
> - 使用示例与文档
> 
> **Estimated Effort**: Short
> **Parallel Execution**: NO - 需要逐个验证配置
> **Critical Path**: 研究配置格式 → 创建配置 → 验证集成 → 编写文档

---

## Context

### Original Request
用户希望将社会推理系统集成到AI agent中使用，具体目标平台包括：
- OpenCode CLI
- Claude Desktop
- Droid
- 其他支持MCP协议的AI agent平台

### Current Status
- ✅ MCP Server已实现（`src/server.ts`）
- ✅ 系统功能完整（17个测试全部通过）
- ✅ 提供3个MCP工具：`reasoning`, `query_agent`, `validate_model`
- ⚠️ 尚未配置到任何MCP客户端
- ⚠️ 之前尝试配置OpenCode失败（配置格式不正确）

### System Capabilities
MCP Server提供的工具：
1. **reasoning** - 完整社会系统推演
   - 输入：假设、约束、目标
   - 输出：7个Agent的分析、冲突检测、综合模型
   
2. **query_agent** - 查询单个专业Agent
   - 输入：Agent类型、假设、上下文
   - 输出：该Agent的专业分析
   
3. **validate_model** - 验证社会模型
   - 输入：社会模型结构
   - 输出：验证结果和建议

---

## Work Objectives

### Core Objective
配置并验证MCP Server在多个AI agent客户端中的集成，使AI agent能够直接调用社会推理能力。

### Concrete Deliverables
1. **OpenCode CLI配置**
   - 文件：`~/.opencode/ocx.jsonc`（或正确的配置文件）
   - 验证：`opencode` 命令能列出和调用MCP工具
   
2. **Claude Desktop配置**
   - 文件：`~/Library/Application Support/Claude/claude_desktop_config.json`
   - 验证：Claude Desktop界面显示MCP工具
   
3. **Droid配置**
   - 文件：根据Droid文档确定
   - 验证：Droid能调用MCP工具
   
4. **集成文档**
   - 文件：`/Users/xiamingxing/Workspace/Skills/SocialGuessSkills/docs/MCP_INTEGRATION.md`
   - 内容：各平台配置指南、使用示例、常见问题

5. **使用示例**
   - 文件：`/Users/xiamingxing/Workspace/Skills/SocialGuessSkills/examples/mcp-usage-examples.md`
   - 内容：在AI agent中调用的实际对话示例

### Definition of Done
- [ ] OpenCode CLI成功加载MCP Server，能调用工具
- [ ] Claude Desktop成功加载MCP Server，能调用工具
- [ ] 至少一个其他MCP客户端验证成功
- [ ] 文档完整，包含所有配置步骤和故障排除
- [ ] 提供实际使用示例

### Must Have
- OpenCode CLI集成（用户主要使用平台）
- 完整的配置步骤文档
- 错误处理和故障排除指南
- 实际可运行的验证命令

### Must NOT Have (Guardrails)
- 不修改MCP Server代码（已验证工作正常）
- 不创建复杂的包装脚本（直接使用标准MCP配置）
- 不依赖第三方工具（使用原生配置方式）
- 避免硬编码路径（使用相对路径或环境变量）

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES（bun test已有17个测试）
- **Automated tests**: Tests-after（集成测试）
- **Framework**: bun test
- **Agent-Executed QA**: MANDATORY（使用bash和interactive_bash验证）

### Agent-Executed QA Scenarios (MANDATORY)

每个集成任务必须包含实际验证场景，由执行agent通过bash工具运行。

---

## TODOs

- [x] 1. 研究OpenCode CLI的MCP配置格式

  **What to do**:
  - 查找OpenCode CLI的官方文档或配置示例
  - 确定正确的配置文件位置（`~/.opencode/ocx.jsonc` 或其他）
  - 确定MCP Server配置的正确JSON schema
  - 识别之前失败的原因（"Unrecognized key: mcpServers"）
  
  **Research Paths**:
  - 搜索OpenCode CLI文档关于MCP集成
  - 查看`~/.opencode/`目录下的其他配置文件作为参考
  - 搜索OpenCode GitHub仓库中的配置示例
  - 查找其他用户的OpenCode MCP配置案例
  
  **Must NOT do**:
  - 不要猜测配置格式（必须基于文档或示例）
  - 不要修改MCP Server代码来适配配置
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 主要是文档查找和配置研究，不涉及复杂逻辑
  - **Skills**: [`playwright`]
    - `playwright`: 可能需要访问在线文档或GitHub
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential（必须先完成才能配置）
  - **Blocks**: Task 2, 3, 7
  - **Blocked By**: None
  
  **References**:
  - 项目路径：`/Users/xiamingxing/Workspace/Skills/SocialGuessSkills`
  - 之前尝试的配置：`~/.opencode/ocx.jsonc`（失败）
  - MCP Server启动命令：`bun run /Users/xiamingxing/Workspace/Skills/SocialGuessSkills/src/server.ts`
  - 错误信息：`Configuration is invalid at ~/.opencode/ocx.jsonc - Unrecognized key: "mcpServers"`
  
  **Acceptance Criteria**:
  
  **Research Output**:
  - [ ] 文档找到OpenCode MCP配置的官方说明或示例
  - [ ] 确定配置文件的正确路径
  - [ ] 确定配置JSON的正确结构和key名称
  - [ ] 说明之前失败的原因
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: 验证OpenCode配置文件位置
    Tool: Bash
    Preconditions: OpenCode CLI已安装
    Steps:
      1. ls -la ~/.opencode/
      2. 检查输出中是否有ocx.jsonc或其他配置文件
      3. cat ~/.opencode/ocx.jsonc（如果存在）
      4. 查看当前配置内容和格式
    Expected Result: 找到配置文件并了解其结构
    Evidence: 配置文件内容和目录结构
  
  Scenario: 搜索OpenCode MCP文档
    Tool: Bash (grep或ripgrep)
    Preconditions: 有OpenCode的安装目录或文档
    Steps:
      1. 查找OpenCode CLI的帮助信息：opencode --help
      2. 搜索MCP相关配置：opencode config --help
      3. 查找示例配置文件
    Expected Result: 找到MCP配置的官方说明
    Evidence: 命令输出
  ```
  
  **Evidence to Capture**:
  - [ ] OpenCode帮助文档截图或输出
  - [ ] 找到的配置示例
  - [ ] 正确的配置格式说明
  
  **Commit**: NO（研究任务，无代码变更）

---

- [x] 2. 创建OpenCode CLI的MCP配置

  **What to do**:
  - 基于Task 1的研究结果，创建正确的配置文件
  - 配置MCP Server的启动命令和参数
  - 设置正确的工作目录和环境变量（如需要）
  
  **Must NOT do**:
  - 不使用错误的key名称（如之前的"mcpServers"）
  - 不硬编码绝对路径（使用环境变量或相对路径）
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 基于研究结果创建配置文件，逻辑简单
  - **Skills**: []
    - 无需特殊技能，标准文件写入
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1
  
  **References**:
  - Task 1的研究结果（配置格式）
  - MCP Server路径：`/Users/xiamingxing/Workspace/Skills/SocialGuessSkills/src/server.ts`
  - 启动命令：`bun run /Users/xiamingxing/Workspace/Skills/SocialGuessSkills/src/server.ts`
  
  **Acceptance Criteria**:
  
  **Configuration Created**:
  - [ ] 配置文件创建在正确位置
  - [ ] 使用正确的JSON schema和key名称
  - [ ] MCP Server命令配置正确
  - [ ] 配置文件语法验证通过：`cat ~/.opencode/ocx.jsonc | jq .` → 无语法错误
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: 验证配置文件语法正确
    Tool: Bash
    Preconditions: 配置文件已创建
    Steps:
      1. cat ~/.opencode/ocx.jsonc
      2. 使用jq验证JSON语法：cat ~/.opencode/ocx.jsonc | jq .
      3. 检查必需字段是否存在
    Expected Result: JSON格式正确，包含所有必需字段
    Evidence: jq输出无错误
  
  Scenario: 验证命令路径可执行
    Tool: Bash
    Preconditions: 配置中指定了bun和server.ts路径
    Steps:
      1. 从配置中提取命令：grep -o '"command":.*' ~/.opencode/ocx.jsonc
      2. 验证bun可用：which bun
      3. 验证server.ts存在：ls -la /Users/xiamingxing/Workspace/Skills/SocialGuessSkills/src/server.ts
    Expected Result: 所有路径都有效
    Evidence: 文件存在确认
  ```
  
  **Evidence to Capture**:
  - [ ] 配置文件完整内容
  - [ ] jq验证输出
  
  **Commit**: YES
  - Message: `feat(config): add OpenCode MCP integration config`
  - Files: `~/.opencode/ocx.jsonc`（或正确路径）
  - Pre-commit: N/A

---

- [ ] 3. 验证OpenCode CLI集成

  **What to do**:
  - 使用OpenCode CLI测试MCP Server加载
  - 验证工具列表显示正确
  - 执行一个简单的工具调用测试
  - 捕获并分析任何错误
  
  **Must NOT do**:
  - 不在生产数据上测试（使用简单示例）
  - 不跳过错误处理验证
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 执行验证命令，简单直接
  - **Skills**: []
    - 标准bash命令即可
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 7
  - **Blocked By**: Task 2
  
  **References**:
  - OpenCode CLI文档（Task 1找到的）
  - 测试用例：`examples/community-governance.json`
  - MCP工具列表：reasoning, query_agent, validate_model
  
  **Acceptance Criteria**:
  
  **Integration Verified**:
  - [ ] OpenCode CLI启动无错误
  - [ ] MCP工具列表包含3个工具：reasoning, query_agent, validate_model
  - [ ] 至少一个工具调用成功返回结果
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: OpenCode加载MCP Server成功
    Tool: Bash
    Preconditions: OpenCode已配置（Task 2完成）
    Steps:
      1. 启动OpenCode CLI（或重新加载配置）
      2. 列出可用的MCP工具：opencode mcp list（或相应命令）
      3. 检查输出是否包含"reasoning", "query_agent", "validate_model"
    Expected Result: 3个工具全部显示
    Evidence: 命令输出截图或文本
  
  Scenario: 调用reasoning工具成功
    Tool: Bash
    Preconditions: MCP Server已加载
    Steps:
      1. 准备测试输入JSON：
         {
           "hypothesis": {
             "assumptions": ["测试假设"],
             "constraints": ["测试约束"],
             "goals": ["测试目标"]
           }
         }
      2. 通过OpenCode调用reasoning工具
      3. 检查返回结果包含：agentOutputs, conflicts, structure, metadata
      4. 验证metadata.iterations > 0
    Expected Result: 推演成功，返回完整模型
    Evidence: 工具调用输出（JSON格式）
  
  Scenario: 错误处理正常
    Tool: Bash
    Preconditions: MCP Server运行中
    Steps:
      1. 调用reasoning工具但传入错误格式的JSON
      2. 检查返回错误信息是否清晰
      3. 验证服务器不会崩溃
    Expected Result: 返回友好的错误信息
    Evidence: 错误输出
  ```
  
  **Evidence to Capture**:
  - [ ] 工具列表输出
  - [ ] 成功调用的完整响应
  - [ ] 错误处理示例
  
  **Commit**: NO（验证任务，无代码变更）

---

- [x] 4. 研究Claude Desktop的MCP配置格式

  **What to do**:
  - 查找Claude Desktop的MCP集成文档
  - 确定配置文件位置（通常是`~/Library/Application Support/Claude/claude_desktop_config.json`）
  - 了解配置schema和示例
  
  **Must NOT do**:
  - 不假设配置格式与OpenCode相同
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 文档查找任务
  - **Skills**: [`playwright`]
    - `playwright`: 可能需要访问Claude官方文档
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2（与Task 1并行，但Task 1优先级更高）
  - **Blocks**: Task 5
  - **Blocked By**: None
  
  **References**:
  - Anthropic官方文档：https://docs.anthropic.com/
  - Claude Desktop应用
  - MCP协议文档
  
  **Acceptance Criteria**:
  
  **Research Output**:
  - [ ] 找到Claude Desktop MCP配置的官方文档
  - [ ] 确认配置文件路径
  - [ ] 获得配置示例或schema
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: 查找Claude Desktop配置文件
    Tool: Bash
    Preconditions: Claude Desktop已安装
    Steps:
      1. 检查配置目录：ls -la ~/Library/Application\ Support/Claude/
      2. 查看配置文件：cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
      3. 分析现有配置结构
    Expected Result: 找到配置文件并理解格式
    Evidence: 配置文件内容
  ```
  
  **Evidence to Capture**:
  - [ ] Claude Desktop配置文档链接
  - [ ] 配置文件示例
  
  **Commit**: NO（研究任务）

---

- [x] 5. 创建Claude Desktop的MCP配置

  **What to do**:
  - 基于Task 4的研究，创建配置
  - 配置MCP Server连接信息
  - 可能需要配置stdio传输方式
  
  **Must NOT do**:
  - 不破坏现有的Claude Desktop配置
  - 备份原配置文件
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 基于研究创建配置
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 6
  - **Blocked By**: Task 4
  
  **References**:
  - Task 4的研究结果
  - MCP Server路径和启动命令
  
  **Acceptance Criteria**:
  
  **Configuration Created**:
  - [ ] 配置文件正确更新
  - [ ] 原配置已备份
  - [ ] JSON语法验证通过
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: 配置文件创建和验证
    Tool: Bash
    Preconditions: 研究完成（Task 4）
    Steps:
      1. 备份现有配置：cp ~/Library/Application\ Support/Claude/claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup
      2. 更新配置文件（添加MCP Server）
      3. 验证JSON语法：cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .
    Expected Result: 配置更新成功，语法正确
    Evidence: jq验证输出
  ```
  
  **Evidence to Capture**:
  - [ ] 更新后的配置文件
  - [ ] 备份文件确认
  
  **Commit**: YES
  - Message: `feat(config): add Claude Desktop MCP integration`
  - Files: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Pre-commit: N/A

---

- [ ] 6. 验证Claude Desktop集成

  **What to do**:
  - 重启Claude Desktop应用
  - 检查MCP工具是否出现在界面
  - 在对话中测试调用工具
  - 验证响应正确性
  
  **Must NOT do**:
  - 不在重要对话中测试（新建测试对话）
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 手动验证为主
  - **Skills**: [`playwright`]
    - `playwright`: 可能需要自动化UI验证
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 7
  - **Blocked By**: Task 5
  
  **References**:
  - Claude Desktop应用
  - 测试场景：`examples/community-governance.json`
  
  **Acceptance Criteria**:
  
  **Integration Verified**:
  - [ ] Claude Desktop重启后无错误
  - [ ] 工具面板显示3个MCP工具
  - [ ] 在对话中成功调用至少1个工具
  - [ ] 工具响应格式正确且内容有意义
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: Claude Desktop加载MCP工具
    Tool: Playwright (playwright skill)
    Preconditions: Claude Desktop已配置并重启
    Steps:
      1. 打开Claude Desktop应用
      2. 新建对话
      3. 查找工具面板或工具图标
      4. 验证是否显示"reasoning", "query_agent", "validate_model"
      5. 截图证明
    Expected Result: 3个工具全部显示在界面
    Evidence: .sisyphus/evidence/claude-desktop-tools.png
  
  Scenario: 在对话中调用reasoning工具
    Tool: Playwright
    Preconditions: Claude Desktop工具加载成功
    Steps:
      1. 在对话框输入："请使用reasoning工具分析一个100人社区的治理问题"
      2. 等待Claude调用MCP工具
      3. 检查响应是否包含Agent分析结果
      4. 验证响应格式符合预期（包含agentOutputs等字段）
    Expected Result: 工具调用成功，返回社会推理分析
    Evidence: .sisyphus/evidence/claude-desktop-reasoning-call.png
  ```
  
  **Evidence to Capture**:
  - [ ] 工具列表截图
  - [ ] 成功调用的对话截图
  - [ ] 错误（如有）的截图
  
  **Commit**: NO（验证任务）

---

- [x] 7. 创建集成文档

  **What to do**:
  - 创建`docs/MCP_INTEGRATION.md`文档
  - 包含所有平台的配置步骤
  - 添加故障排除章节
  - 提供使用示例
  
  **Document Structure**:
  ```markdown
  # MCP Integration Guide
  
  ## Overview
  ## Prerequisites
  
  ## OpenCode CLI Integration
  ### Configuration
  ### Verification
  ### Troubleshooting
  
  ## Claude Desktop Integration
  ### Configuration
  ### Verification
  ### Troubleshooting
  
  ## Other MCP Clients
  ### Generic Configuration
  
  ## Usage Examples
  ### Example 1: Social System Reasoning
  ### Example 2: Query Specific Agent
  ### Example 3: Validate Model
  
  ## Troubleshooting
  ### Common Issues
  ### Debug Mode
  
  ## FAQ
  ```
  
  **Must NOT do**:
  - 不包含未验证的配置（只写已测试成功的）
  - 不复制粘贴大段代码（链接到源文件）
  
  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 技术文档写作任务
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: Task 3, 6（需要验证成功后才能写文档）
  
  **References**:
  - Task 1-6的所有研究和验证结果
  - `README.md` - 已有的系统说明
  - `ARCHITECTURE.md` - 架构文档
  - `examples/` - 示例场景
  
  **Acceptance Criteria**:
  
  **Documentation Complete**:
  - [ ] 文件创建：`docs/MCP_INTEGRATION.md`
  - [ ] 包含至少2个平台的完整配置步骤（OpenCode + Claude Desktop）
  - [ ] 每个步骤都有验证命令
  - [ ] 故障排除章节包含至少5个常见问题
  - [ ] 至少3个实际使用示例
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: 文档结构完整性检查
    Tool: Bash
    Preconditions: 文档已创建
    Steps:
      1. cat docs/MCP_INTEGRATION.md | grep "^##"
      2. 验证是否包含所有必需章节：
         - Overview
         - OpenCode CLI Integration
         - Claude Desktop Integration
         - Usage Examples
         - Troubleshooting
      3. 检查代码块语法：grep -c '```' docs/MCP_INTEGRATION.md
         （应该是偶数，每个代码块有开始和结束）
    Expected Result: 所有章节存在，代码块配对
    Evidence: grep输出
  
  Scenario: 配置命令可执行性验证
    Tool: Bash
    Preconditions: 文档包含配置命令
    Steps:
      1. 提取文档中的所有bash命令（在```bash块中的）
      2. 逐个验证命令语法（不执行，只检查语法）
      3. 确保所有路径引用都使用变量或相对路径
    Expected Result: 所有命令语法正确
    Evidence: 命令提取和验证输出
  ```
  
  **Evidence to Capture**:
  - [ ] 文档完整内容
  - [ ] 章节结构验证输出
  
  **Commit**: YES
  - Message: `docs: add MCP integration guide for multiple clients`
  - Files: `docs/MCP_INTEGRATION.md`
  - Pre-commit: N/A

---

- [x] 8. 创建使用示例文档

  **What to do**:
  - 创建`examples/mcp-usage-examples.md`
  - 包含在AI agent中的实际对话示例
  - 展示各种工具的使用场景
  - 提供prompt模板
  
  **Example Structure**:
  ```markdown
  # MCP Usage Examples
  
  ## Example 1: Complete Social System Analysis
  **Scenario**: 分析一个新社区的治理设计
  **User Prompt**: "..."
  **Agent Response**: "..."
  **MCP Tool Call**: {...}
  **Result**: {...}
  
  ## Example 2: Quick Agent Consultation
  ## Example 3: Model Validation
  ## Example 4: Complex Multi-turn Analysis
  
  ## Prompt Templates
  ### Template 1: Policy Impact Analysis
  ### Template 2: Organization Design
  ### Template 3: Community Governance
  ```
  
  **Must NOT do**:
  - 不使用过于简单的示例（展示真实复杂场景）
  - 不省略错误处理示例
  
  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 示例文档写作
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2（可与Task 7并行）
  - **Blocks**: None
  - **Blocked By**: Task 3, 6
  
  **References**:
  - `examples/community-governance.json` - 现有示例
  - Task 3, 6的验证结果（实际调用记录）
  - `src/agents/prompts/*.md` - Agent能力说明
  
  **Acceptance Criteria**:
  
  **Examples Complete**:
  - [ ] 文件创建：`examples/mcp-usage-examples.md`
  - [ ] 至少4个完整示例（包含prompt、调用、结果）
  - [ ] 至少3个prompt模板
  - [ ] 每个示例都有实际的JSON输入输出
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: 示例JSON格式验证
    Tool: Bash
    Preconditions: 文档已创建，包含JSON示例
    Steps:
      1. 提取文档中所有JSON代码块
      2. 使用jq验证每个JSON的语法
      3. 验证JSON结构符合MCP工具的输入格式
    Expected Result: 所有JSON示例语法正确
    Evidence: jq验证输出
  
  Scenario: Prompt模板完整性检查
    Tool: Bash
    Preconditions: 文档包含prompt模板
    Steps:
      1. 检查每个模板是否包含：
         - 使用场景说明
         - 完整的prompt文本
         - 预期输出说明
      2. 统计模板数量：grep -c "### Template" examples/mcp-usage-examples.md
    Expected Result: 至少3个完整模板
    Evidence: grep输出
  ```
  
  **Evidence to Capture**:
  - [ ] 示例文档完整内容
  - [ ] JSON验证输出
  
  **Commit**: YES（与Task 7合并提交）
  - Message: `docs: add MCP usage examples and prompt templates`
  - Files: `examples/mcp-usage-examples.md`
  - Pre-commit: N/A

---

- [ ] 9. 研究Droid和其他MCP客户端

  **What to do**:
  - 研究Droid的MCP配置方式
  - 列出其他流行的MCP客户端
  - 为每个客户端提供通用配置指南
  
  **Must NOT do**:
  - 不强制配置所有客户端（提供指南即可）
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 调研任务
  - **Skills**: [`playwright`]
    - `playwright`: 可能需要访问各项目文档
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2（与Task 4, 7并行）
  - **Blocks**: Task 10
  - **Blocked By**: None
  
  **References**:
  - MCP协议文档
  - GitHub上的MCP客户端项目
  
  **Acceptance Criteria**:
  
  **Research Output**:
  - [ ] Droid配置方式已研究
  - [ ] 列出至少3个其他MCP客户端
  - [ ] 每个客户端的配置文档链接
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: 搜索MCP客户端列表
    Tool: Bash (curl访问GitHub API)
    Preconditions: 网络连接
    Steps:
      1. 搜索GitHub上的MCP客户端项目
      2. 查看MCP协议官方仓库的客户端列表
      3. 记录每个客户端的GitHub链接和简介
    Expected Result: 找到至少5个MCP客户端
    Evidence: 客户端列表
  ```
  
  **Evidence to Capture**:
  - [ ] MCP客户端列表
  - [ ] Droid配置文档
  
  **Commit**: NO（研究任务）

---

- [ ] 10. 添加通用MCP客户端配置指南

  **What to do**:
  - 在`docs/MCP_INTEGRATION.md`中添加"其他客户端"章节
  - 提供通用配置模板
  - 解释stdio vs HTTP传输的选择
  
  **Must NOT do**:
  - 不对未测试的客户端做过于具体的说明
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 基于研究添加文档章节
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: Task 7, 9
  
  **References**:
  - Task 9的研究结果
  - `docs/MCP_INTEGRATION.md`（Task 7创建）
  
  **Acceptance Criteria**:
  
  **Documentation Updated**:
  - [ ] "Other MCP Clients"章节已添加
  - [ ] 包含通用stdio配置模板
  - [ ] 包含通用HTTP配置模板（如适用）
  - [ ] 列出至少3个其他客户端的链接
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: 配置模板验证
    Tool: Bash
    Preconditions: 文档更新完成
    Steps:
      1. 提取"Other MCP Clients"章节：
         sed -n '/## Other MCP Clients/,/## /p' docs/MCP_INTEGRATION.md
      2. 检查是否包含JSON配置示例
      3. 验证JSON语法
    Expected Result: 配置模板语法正确
    Evidence: 章节内容和验证输出
  ```
  
  **Evidence to Capture**:
  - [ ] 更新后的文档章节
  
  **Commit**: YES（更新Task 7的提交）
  - Message: `docs: add generic MCP client configuration guide`
  - Files: `docs/MCP_INTEGRATION.md`
  - Pre-commit: N/A

---

- [ ] 11. 端到端集成测试

  **What to do**:
  - 创建集成测试脚本
  - 验证所有配置的客户端都能工作
  - 测试完整工作流（从AI agent提问到获得推理结果）
  - 记录性能指标（响应时间等）
  
  **Must NOT do**:
  - 不在生产环境测试
  - 不跳过错误场景测试
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 执行测试脚本
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: Task 3, 6, 10
  
  **References**:
  - 所有已配置的MCP客户端
  - `examples/community-governance.json` - 测试数据
  - 系统已有的17个单元测试
  
  **Acceptance Criteria**:
  
  **Integration Tests Pass**:
  - [ ] OpenCode CLI集成测试通过
  - [ ] Claude Desktop集成测试通过
  - [ ] 至少一个其他客户端测试通过（或记录为"待用户测试"）
  - [ ] 所有工具（reasoning, query_agent, validate_model）都验证成功
  - [ ] 错误处理场景都覆盖
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: OpenCode CLI完整工作流测试
    Tool: Bash
    Preconditions: OpenCode配置完成（Task 3）
    Steps:
      1. 启动OpenCode CLI
      2. 调用reasoning工具并传入完整场景
      3. 测量响应时间：time opencode mcp call reasoning {...}
      4. 验证返回结果包含所有必需字段
      5. 测试错误输入的处理
    Expected Result: 工作流完整，响应<10秒
    Evidence: 完整的调用日志和时间测量
  
  Scenario: 多客户端并发测试
    Tool: Bash
    Preconditions: 至少2个客户端配置完成
    Steps:
      1. 同时从OpenCode和Claude Desktop调用同一个工具
      2. 验证两者都成功返回
      3. 对比返回结果是否一致
    Expected Result: 两个客户端都成功，结果一致
    Evidence: 并发调用日志
  
  Scenario: 压力测试（连续调用）
    Tool: Bash
    Preconditions: 任一客户端配置完成
    Steps:
      1. 连续调用reasoning工具10次
      2. 记录每次的响应时间
      3. 检查是否有内存泄漏或性能下降
      4. 验证所有调用都成功
    Expected Result: 10次调用全部成功，性能稳定
    Evidence: 性能测试报告
  ```
  
  **Evidence to Capture**:
  - [ ] 完整的测试日志
  - [ ] 性能指标（响应时间）
  - [ ] 错误场景的处理记录
  
  **Commit**: NO（测试任务，但可以创建测试脚本）
  - 可选：提交测试脚本到`scripts/integration-test.sh`

---

- [x] 12. 更新主README

  **What to do**:
  - 在主`README.md`中添加"MCP Integration"章节
  - 链接到详细的集成文档
  - 添加快速开始指南（最简单的集成方式）
  
  **Must NOT do**:
  - 不在README中重复详细配置步骤（链接到专门文档）
  - 不破坏现有的README结构
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的文档更新
  - **Skills**: []
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: Task 7, 11
  
  **References**:
  - 现有的`README.md`
  - `docs/MCP_INTEGRATION.md`（详细文档）
  
  **Acceptance Criteria**:
  
  **README Updated**:
  - [ ] "Usage as MCP Server"章节已添加
  - [ ] 包含快速开始步骤（最多5步）
  - [ ] 链接到详细集成文档
  - [ ] 列出支持的客户端
  
  **Agent-Executed QA Scenarios**:
  
  ```
  Scenario: README结构保持完整
    Tool: Bash
    Preconditions: README已更新
    Steps:
      1. 检查README标题结构：cat README.md | grep "^##"
      2. 验证新章节位于合适位置（在"Usage"或"Getting Started"之后）
      3. 验证所有内部链接有效
    Expected Result: 结构完整，链接有效
    Evidence: 标题列表
  
  Scenario: 快速开始步骤可执行
    Tool: Bash
    Preconditions: README包含快速开始步骤
    Steps:
      1. 提取快速开始章节的命令
      2. 验证命令语法正确
      3. 确保步骤数量≤5
    Expected Result: 步骤简洁且可执行
    Evidence: 步骤提取结果
  ```
  
  **Evidence to Capture**:
  - [ ] 更新后的README相关章节
  
  **Commit**: YES
  - Message: `docs: add MCP integration section to README`
  - Files: `README.md`
  - Pre-commit: N/A

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 2 | `feat(config): add OpenCode MCP integration config` | `~/.opencode/ocx.jsonc` | N/A |
| 5 | `feat(config): add Claude Desktop MCP integration` | `~/Library/Application Support/Claude/claude_desktop_config.json` | N/A |
| 7 | `docs: add MCP integration guide for multiple clients` | `docs/MCP_INTEGRATION.md` | N/A |
| 8 | `docs: add MCP usage examples and prompt templates` | `examples/mcp-usage-examples.md` | N/A |
| 10 | `docs: add generic MCP client configuration guide` | `docs/MCP_INTEGRATION.md` | N/A |
| 12 | `docs: add MCP integration section to README` | `README.md` | N/A |

---

## Success Criteria

### Verification Commands

**OpenCode CLI**:
```bash
# 列出MCP工具
opencode mcp list  # 应显示3个工具

# 调用工具测试
opencode mcp call reasoning --input '{"hypothesis":{"assumptions":["测试"],"constraints":[],"goals":[]}}'
```

**Claude Desktop**:
```bash
# 重启应用后在界面查看工具列表
# 在对话中使用自然语言触发工具调用
```

**MCP Server**:
```bash
# 验证服务器启动无错误
bun run src/server.ts

# 验证所有测试仍然通过
bun test
```

### Final Checklist

- [ ] OpenCode CLI成功加载MCP Server并能调用所有3个工具
- [ ] Claude Desktop成功加载MCP Server并能调用所有3个工具
- [ ] 文档完整，包含：
  - [ ] 详细集成指南（`docs/MCP_INTEGRATION.md`）
  - [ ] 使用示例（`examples/mcp-usage-examples.md`）
  - [ ] README更新
- [ ] 至少2个平台的端到端测试通过
- [ ] 所有配置文件已提交到版本控制（或记录在文档中）
- [ ] 原有的17个单元测试仍然全部通过
- [ ] 故障排除指南覆盖常见问题

---

## Notes

### Known Limitations
- 目前使用模拟的Agent响应，集成真实LLM API需要额外配置
- MCP Server使用stdio传输，某些客户端可能需要HTTP传输支持
- 大型推演可能需要较长时间（3轮迭代 × 7个Agent）

### Future Improvements
- 添加HTTP传输支持
- 实现Agent响应缓存机制
- 添加WebSocket支持用于流式响应
- 创建可视化界面展示推演过程
- 添加更多语言的客户端示例

### Dependencies
- Bun（已安装）
- OpenCode CLI（待确认版本）
- Claude Desktop（待确认版本）
- MCP客户端（各平台）
