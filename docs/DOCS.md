# 文档目录

本文档索引说明项目文档的组织结构和访问方式。

---

## 📂 核心文档

| 文档名称 | 路径 | 说明 |
|---------|------|------|
| 项目主文档 | [README.md](../README.md) | 项目简介、安装、配置、使用指南 |
| Agent系统文档 | [docs/architecture/AGENT-SYSTEM.md](docs/architecture/AGENT-SYSTEM.md) | 7个原始Agent的类型、职责和Prompt模板 |
| 工作流文档 | [docs/workflow/WORKFLOW.md](docs/workflow/WORKFLOW.md) | 6步工作流程的详细说明 |
| 依赖分析文档 | [docs/workflow/DEPENDENCY-ANALYSIS.md](docs/workflow/DEPENDENCY-ANALYSIS.md) | Agent依赖关系和Wave分配逻辑 |
| 核心类型定义 | [docs/architecture/CORE-TYPES.md](docs/architecture/CORE-TYPES.md) | 核心接口和类型定义 |

---

## 📚 技术文档

| 文档名称 | 路径 | 说明 |
|---------|------|------|
| 开发规范 | [docs/development/CLAUDE.md](docs/development/CLAUDE.md) | 代码规范、测试和贡献指南 |
| API参考 | [docs/api/API-REFERENCE.md](docs/api/API-REFERENCE.md) | MCP API和工具参考 |
| MCP集成指南 | [docs/api/ANTHROPIC-INTEGRATION.md](docs/api/ANTHROPIC-INTEGRATION.md) | Anthropic API集成详细指南 |
| 部署指南 | [docs/development/DEPLOYMENT.md](docs/development/DEPLOYMENT.md) | 部署和配置说明 |

---

## 🎨 使用示例

| 文档名称 | 路径 | 说明 |
|---------|------|------|
| 社区治理模型示例 | [docs/examples/community-governance.json](../examples/community-governance.json) | 社区治理的假设输入示例 |
| 运行示例 | [docs/examples/run-example.md](../examples/run-example.md) | 完整工作流使用示例 |

---

## 📖 扩展Agent文档

| 文档名称 | 路径 | 说明 |
|---------|------|------|
| 环境Agent | [docs/agents/prompts/environmental-agent.md](docs/agents/prompts/environmental-agent.md) | 环境分析Agent的Prompt模板 |
| 人口Agent | [docs/agents/prompts/demographic-agent.md](docs/agents/prompts/demographic-agent.md) | 人口分析Agent的Prompt模板 |
| 基础设施Agent | [docs/agents/prompts/infrastructure-agent.md](docs/agents/prompts/infrastructure-agent.md) | 基础设施分析Agent的Prompt模板 |
| 技术Agent | [docs/agents/prompts/technology-agent.md](docs/agents/prompts/technology-agent.md) | 技术分析Agent的Prompt模板 |
| 历史Agent | [docs/agents/prompts/historical-agent.md](docs/agents/prompts/historical-agent.md) | 历史分析Agent的Prompt模板 |

---

## 📊 计划和归档

| 文档名称 | 路径 | 说明 |
|---------|------|------|
| 生产路线图 | [.sisyphus/plans/production-roadmap.md](.sisyphus/plans/production-roadmap.md) | 15个任务的完成情况和交付物 |
| 扩展Agent计划 | [.sisyphus/plans/phase4-extended-agents.md](.sisyphus/plans/phase4-extended-agents.md) | 5个新Agent的扩展计划 |
| 归档笔记 | [.sisyphus/archive/learnings/production-roadmap-learnings.md](.sisyphus/archive/learnings/production-roadmap-learnings.md) | 生产路线图执行过程中的学习笔记 |

---

## 🔧 快速导航

### 根据您的需求选择文档：

| 场景 | 推荐文档 |
|-------|----------|
| 想了解项目整体 | [README.md](../README.md) |
| 添加新的Agent | [扩展Agent文档](#-扩展agent文档) |
| 集成Anthropic API | [MCP集成指南](#-技术文档) → [API参考](#-技术文档) → [docs/api/ANTHROPIC-INTEGRATION.md](docs/api/ANTHROPIC-INTEGRATION.md) |
| 调试依赖关系 | [依赖分析文档](#-核心文档) → [docs/workflow/DEPENDENCY-ANALYSIS.md](docs/workflow/DEPENDENCY-ANALYSIS.md) |
| 开发新功能 | [开发规范](#-技术文档) → [docs/development/CLAUDE.md](docs/development/CLAUDE.md) |

---

## 📝 文档维护说明

所有文档按照以下命名规则组织：

### 命名格式
- **主文档**: `[模块] - [简述].md`
- **技术文档**: `docs/` + `[模块]/[子模块].md`
- **计划文档**: `.sisyphus/plans/` + `[计划名称].md`
- **归档文档**: `.sisyphus/archive/` + `[归档名称].md`

### 文档分类
1. **核心文档**（在根目录）
   - README.md - 项目主文档
   - DOCS.md - 文档导航（本文件）

2. **技术文档**（在 docs/ 目录下）
   - architecture/ - 架构设计
   - api/ - API和集成
   - development - 开发、测试、部署

3. **计划文档**（在 .sisyphus/plans/ 目录）
   - 保留最新的执行计划
   - 归档已完成的计划

4. **归档**（在 .sisyphus/archive/ 目录）
   - learnings - 学习笔记和历史记录

---

## 📋 快速开始

```bash
# 安装项目
git clone https://github.com/your-org/SocialGuessSkills.git
cd SocialGuessSkills
bun install

# 配置环境
cp .env.example .env
# 编辑.env文件，设置ANTHROPIC_API_KEY

# 启动MCP服务器
bun run src/server.ts

# 查看文档
open docs/DOCS.md
```

---

## ⚠️ 注意事项

1. 本文档索引文件会随着项目发展定期更新
2. 如需修改文档，请遵循[贡献指南](../CONTRIBUTING.md)
3. 文档路径均为相对路径，相对于本文件
4. 核心模块文档优先参考，扩展示例其次

---

## 📞 更新日志

- **2026-02-08**: 创建文档索引，组织文档结构
- **2026-02-08**: 完成核心文档移动和技术文档整理
- **2026-02-08**: 完成扩展Agent Prompt文档整合
- **2026-02-08**: 完成计划文档归档
