# SocialGuessSkills 项目深度分析草稿

## 访谈记录

### 用户请求 (2026-02-06)
**原话**: "对当前项目现状进行深入分析和思考，明确当前阶段的主要工作目标，制定实施方案与具体工作计划吧"

**解读**: 用户需要全面的项目审视，包括：
1. 当前状态诊断
2. 问题和机会识别
3. 优先级排序
4. 可执行的工作计划

---

## 项目背景信息

### 核心功能
- **领域**: 社会体系建模多Agent系统
- **技术栈**: TypeScript + Bun + MCP SDK
- **架构**: 7个专业Agent协同分析 → 6步工作流 → 9层结构化输出
- **MCP Tools**: 4个注册工具 (reasoning, query_agent, validate_model, health_check)

### 文件结构 (25个TS文件)
```
src/
├── server.ts (258行) - MCP服务器入口
├── types.ts (136行) - 核心类型定义
├── agents/
│   ├── agent-factory.ts - Agent工厂
│   ├── agent-executor.ts - Agent执行器
│   ├── llm-client.ts - LLM客户端
│   ├── tools-list.ts - 工具列表
│   └── prompts/ - 7个Agent prompt文件
├── workflow/
│   ├── orchestrator.ts - 工作流编排
│   └── conflict-resolver.ts - 冲突检测
├── utils/
│   ├── retry.ts - 重试逻辑（已重构）
│   ├── logger.ts - 日志系统
│   ├── constants.ts - 常量定义
│   ├── token-counter.ts - Token计数
│   ├── cost-alert.ts - 成本告警
│   ├── cost-predictor.ts - 成本预测
│   ├── circuit-breaker.ts - 断路器
│   ├── request-queue.ts - 请求队列
│   └── config.ts - 配置管理
└── __tests__/ - 7个测试文件
```

### Sprint 历史回顾

**Sprint 1** (已完成 9/9): 统一日志系统
- ✅ 引入 pino 日志框架
- ✅ 全局日志配置
- ✅ 所有模块迁移到 pino
- ✅ 移除 console.log
- 状态: **100%完成, 0编译错误**

**Sprint 2** (完成 5/8, 3个回退):
- ✅ Task 2.2: 分解 retry.ts 复杂函数
- ✅ Task 2.3: 移除硬编码路径
- ✅ Task 2.4: 添加 MCP tools/list 端点
- ✅ Task 2.5: 标准化错误响应（部分，后回退）
- ✅ Task 2.7: 添加请求追踪
- 🔄 Task 2.6: 修复 server.ts 编译错误（尝试后回退）
- ⏸️ Task 2.1: 重构 agent-executor.ts（未尝试）
- ⏸️ Task 2.8: 添加 MCP 参数验证（未尝试）

**Sprint 2 回退原因**:
1. ValidationError 接口设计复杂（field/expectedType/received结构）导致18+编译错误
2. TypeScript模块解析问题 - 导出的函数无法被导入
3. 新建多个agent模块（executor.ts等）产生10+ LSP错误
4. 最终决策: 回退到Sprint 1稳定状态

**当前Git状态**:
- HEAD: 97807af (Sprint 1 最终提交)
- 最新提交: 8cccf7a ("Sprint 2: Revert failed validation modules")
- 编译错误: **0个** ✅
- 工作目录: 干净

---

## 关键发现

### 1. 架构健康度

**优点**:
- ✅ 清晰的模块划分（agents/workflow/utils）
- ✅ TypeScript严格模式启用
- ✅ MCP协议标准实现
- ✅ 完整的测试覆盖（7个测试文件）
- ✅ 统一的日志系统（pino）

**待改进**:
- ⚠️ 缺少参数验证机制（所有MCP工具都直接接受参数）
- ⚠️ 错误处理不一致（部分使用try-catch，部分没有）
- ⚠️ 类型安全有漏洞（存在 `as any` 用法）

### 2. 技术债务分析

从 `grep` 结果看到的TODO/FIXME：
```
src/agents/agent-executor.ts: // TODO: Implement real LLM call (currently mock)
src/workflow/orchestrator.ts: // TODO: 添加并行执行优化
src/utils/retry.ts: // TODO: Add exponential backoff jitter
```

### 3. 测试覆盖现状

**有测试的模块**:
- ✅ config.test.ts - 配置管理
- ✅ token-counter.test.ts - Token计数
- ✅ retry.test.ts - 重试逻辑（3个测试）
- ✅ conflict-resolver.test.ts - 冲突检测
- ✅ orchestrator.test.ts - 工作流编排
- ✅ e2e.test.ts - 端到端测试
- ✅ example.test.ts - 示例测试

**缺少测试的关键模块**:
- ❌ tools-list.ts - 虽然有4个测试，但可能需要更多边界场景
- ❌ agent-executor.ts - 核心Agent执行逻辑（使用mock AI）
- ❌ server.ts MCP工具 - 没有针对MCP工具的集成测试

### 4. Sprint 2 失败根因

**表面问题**: TypeScript编译错误
**深层原因**:
1. **过度设计** - ValidationError接口要求所有错误都有expectedType/received，太严格
2. **测试缺失** - 新代码没有先写测试就直接集成到server.ts
3. **一次改动过大** - 同时尝试验证+错误处理+重构，导致问题叠加
4. **模块解析问题** - TypeScript配置可能需要调整（import/export不一致）

---

## 问题识别

### P0 - 阻塞性问题
1. **MCP工具缺少参数验证** - 任何无效输入都会导致运行时错误
2. **错误响应不标准** - 用户无法从错误中获得清晰的修正指引
3. **TypeScript配置问题** - 导致Sprint 2模块导入失败（需深入诊断）

### P1 - 重要但不紧急
4. **Agent执行器仍使用mock** - TODO注释表明需要真实LLM集成
5. **工作流缺少并行优化** - 当前是串行执行，性能有提升空间
6. **监控缺失** - 虽然有/metrics端点，但没有实际指标收集

### P2 - 改进机会
7. **重试策略缺少jitter** - 可能导致thundering herd问题
8. **测试覆盖不完整** - server.ts MCP工具缺少集成测试
9. **文档不完整** - MCP工具的错误场景文档缺失

---

## 决策点与讨论

### 决策1: Sprint方向选择

**选项A: 继续Sprint 2**
- 优点: 完成未完成的任务，保持连贯性
- 缺点: 之前失败的经验需要反思，可能再次遇到相同问题

**选项B: 开始新Sprint 3（聚焦验证）**
- 优点: 专注单一主题，避免任务过载
- 缺点: Sprint 2有3个任务未完成，可能让人感觉虎头蛇尾

**选项C: 混合模式 - Sprint 2.5**
- 优点: 完成Sprint 2遗留的简单任务，同时重新规划验证方案
- 缺点: 命名有些奇怪

**我的倾向**: 选项B - 新Sprint 3
**理由**: Sprint 2的失败告诉我们"验证+错误处理"是一个独立且复杂的主题，应该给予专门的Sprint来妥善处理。

### 决策2: 验证实现策略

**选项A: 简单验证（类型检查）**
```typescript
if (typeof args.maxIterations !== 'number') {
  throw new Error('maxIterations must be a number')
}
```
- 优点: 简单直接，快速实现
- 缺点: 错误信息不友好，难以国际化

**选项B: Schema验证库（Zod/Yup）**
```typescript
const schema = z.object({
  maxIterations: z.number().min(1).max(10)
})
schema.parse(args)
```
- 优点: 声明式，错误信息丰富，可复用
- 缺点: 引入新依赖，增加包体积

**选项C: 自定义验证框架**
```typescript
validate(args, {
  maxIterations: { type: 'number', min: 1, max: 10 }
})
```
- 优点: 完全控制，无外部依赖
- 缺点: 需要自己实现和维护

**我的倾向**: 选项B - 使用Zod
**理由**: Zod是TypeScript原生，零成本类型推断，社区广泛使用，值得投资。

### 决策3: 测试策略

**选项A: 单元测试优先**
- 为每个新函数编写单元测试

**选项B: 集成测试优先**
- 直接测试MCP工具端到端

**选项C: TDD（测试驱动开发）**
- 先写失败的测试，再写实现

**我的倾向**: 选项C - TDD
**理由**: Sprint 2失败的一个原因是没有测试保护。TDD能强制我们先思考接口设计。

---

## 开放问题

**Q1: 用户更关心功能完整性还是代码质量？**
- 如果是功能，应该优先完成Agent的真实LLM集成（P1-4）
- 如果是质量，应该优先完成验证和错误处理（P0-1,2）

**Q2: TypeScript模块解析问题是否需要专门诊断？**
- Sprint 2的导入错误很诡异，可能需要深入研究tsconfig.json
- 或者这只是一次性问题，不值得深究？

**Q3: 真实LLM集成的时机？**
- agent-executor.ts 目前使用mock，但README暗示这是有意设计
- 是否真的需要集成？还是mock已经足够用于演示？

**Q4: 性能优化的优先级？**
- orchestrator.ts 有TODO提到并行执行优化
- 在验证/错误处理完成前做性能优化是否premature？

---

## 用户决策（2026-02-06）

### 决策1: Sprint方向
✅ **选择: A + B（混合模式）**
- 完成Sprint 2剩余的简单任务
- 同时启动新Sprint 3专注"验证与错误处理"

### 决策2: 验证方案
✅ **选择: B - 使用Zod库**
- Schema验证
- 零成本TypeScript类型推断
- 声明式风格

### 决策3: 优先级
✅ **选择: 功能完整性优先**
- 但P0问题（参数验证、错误处理）仍需解决
- 这是功能完整性的基础

### 决策4: LLM集成
✅ **选择: 延后集成**
- agent-executor.ts保持mock方式
- 当前mock已足够演示MCP功能
- 真实LLM集成留待后续Sprint

---

## 确认的工作范围

### Sprint 2 收尾（简单任务）
- Task 2.8: 添加MCP参数验证（使用Zod）
- 修复tools-list.ts已知问题（如有）

### Sprint 3 核心（验证与错误处理）
1. **参数验证框架** - Zod schema定义
2. **标准化错误响应** - 统一错误格式
3. **MCP工具集成测试** - TDD方式
4. **TypeScript配置诊断** - 解决Sprint 2模块导入问题

### 明确不做（Scope Out）
- ❌ Agent执行器LLM集成（延后）
- ❌ Task 2.1: 重构agent-executor.ts（复杂度高，延后）
- ❌ Task 2.6: 大规模server.ts改动（Sprint 2失败教训）
- ❌ 工作流并行优化（不属于当前Sprint范围）
