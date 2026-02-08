## 2026-02-07
- 在 workflow 结束前持久化模型：先使用 HypothesisRepository.save(hypothesis) 获取假设记录，再用 ModelRepository.save(hypothesisId, hash, model) 保存模型，避免模型缺少关联假设。

## [2026-02-07] SQL 参数绑定修复
- **问题**：Bun SQLite 的 `db.query().run()` 不支持 `$param` 占位符（如 `$hash`, `$content`）
- **正确语法**：必须使用 `?` 占位符（参考 Phase 3 计划第 236-240 行）
- **修复文件**：
  - `src/database/repositories/hypothesis-repository.ts`（4个查询）
  - `src/database/repositories/model-repository.ts`（5个查询）
- **修改示例**：
  - 错误：`db.query("INSERT INTO hypotheses (hash, content) VALUES ($hash, $content)").run({ hash, content: payload })`
  - 正确：`db.query("INSERT INTO hypotheses (hash, content) VALUES (?, ?)").run(hash, payload)`
- **验证结果**：LSP 诊断无错误，测试 12 pass/0 fail 全部通过
- **关键教训**：Bun SQLite API 与 Node.js better-sqlite3 参数绑定语法不同，需要使用标准 `?` 占位符

## 2026-02-08: Model Diff Testing Patterns

### 测试辅助函数设计
- **createTestModel()**: 使用 `Partial<SocialSystemModel>` + 深度合并模式实现灵活的测试数据覆盖
- **mergeDeep()**: 递归合并工具函数，支持对象和数组的深度合并，避免测试代码重复

### 测试覆盖策略
- **diffModels()**: 7 个测试用例覆盖空 diff、Agent 输出变化、冲突变化、元数据变化、结构变化、统计计算
- **diffAgentOutputs()**: 5 个测试用例分别测试 conclusion、evidence、risks、suggestions、falsifiable 字段
- **diffConflicts()**: 4 个测试用例覆盖新增冲突、移除冲突、未变冲突、空数组边界情况
- **diffStructure()**: 3 个测试用例验证 overall、workflow 层变化，以及所有 9 层结构存在性
- **diffMetadata()**: 4 个测试用例测试 iterations、confidence 的 delta 计算，以及 generatedAt 追踪

### 边界情况测试
- 空数组（agentOutputs、conflicts、结构各层）
- 空对象（空 evidence、risks、suggestions 数组）
- 相同文本（相似度 1.0）
- 完全不同文本（相似度计算）

### 测试质量指标
- **测试数量**: 29 个测试用例
- **代码覆盖**: 所有公共函数和核心边界情况
- **LSP 诊断**: 测试文件本身无错误
- **测试价值**: 成功暴露了 model-diff.ts 中的 2 个实现 bug

### 关键教训
- 测试应覆盖函数的**所有分支**和**边界情况**
- 使用辅助函数生成测试数据可以提高可维护性
- 测试失败不总是测试代码的问题，可能暴露实现代码的缺陷

## 2026-02-08: Model Diff Bug Fixes

### Bug #1: 变量作用域错误
- **问题**: `diffStructure()` 函数中，`changes` 变量在 `if` 块内定义，但在 `if` 块外访问
- **根因**: JavaScript 变量作用域 - `const` 在块级作用域中定义
- **修复**: 将 `const changes` 声明移到 `if` 块外层
- **关键教训**: 变量声明应放在使用它的最外层作用域，避免块级作用域导致的 `ReferenceError`

### Bug #2: Levenshtein 距离算法不完整
- **问题**: 矩阵初始化与循环边界不一致，导致 `TypeError: undefined is not an object`
- **根因**:
  - 初始化使用 `lenA` 和 `lenB`
  - 循环使用 `a.length` 和 `b.length`
  - `Math.min()` 缺少第三个参数（insertion 操作）
- **修复**:
  - 统一使用 `b.length` 和 `a.length`
  - 添加完整的三个操作：substitution, insertion, deletion
- **关键教训**:
  - DP 算法的初始化和循环必须使用相同的边界
  - Levenshtein 距离需要考虑三个操作：替换、插入、删除
  - 字符比较索引需要与循环变量对应（`a.charAt(j - 1)` vs `b.charAt(i - 1)`）

### 测试数据一致性
- **问题**: 测试数据中冲突描述不一致（"与" vs "和"），导致测试失败
- **影响**: 即使代码正确，测试数据不一致也会导致测试失败
- **修复**: 统一冲突描述为"系统稳定性和经济模型存在冲突"
- **关键教训**: 测试数据的一致性同样重要，应使用辅助函数避免重复定义

### 验证策略
- **修复前**: 0 pass / 29 fail（所有测试因 bug 失败）
- **修复后**: 29 pass / 0 fail
- **验证步骤**:
  1. 修复 bug
  2. 运行测试验证
  3. LSP 诊断检查
  4. 记录修复过程
- **关键教训**: 完整的验证流程确保修复质量和代码正确性
## [2026-02-07] Model Diff 单元测试完成
- **文件**: `src/analysis/__tests__/model-diff.test.ts`（29个测试用例，945行代码）
- **测试覆盖**: diffModels(), diffAgentOutputs(), diffConflicts(), diffStructure(), diffMetadata()
- **发现并修复的 bug**:
  - Bug #1: diffStructure() 函数第 245 行，changes 变量作用域错误（从 if 块内移到外层）
  - Bug #2: levenshteinDistance() 函数，矩阵访问越界 + 算法不完整（统一索引逻辑 + 添加完整三操作）
- **测试结果**: 修复后 29 pass/0 fail 全部通过
- **关键教训**: 测试成功暴露了实现代码中的缺陷，验证了测试代码的价值

## 2026-02-07: Sensitivity Analysis 实现
- **文件**: `src/analysis/sensitivity-analysis.ts`
- **内容**: 定义 SensitivityConfig/SensitivityResult/VariationResult，并实现 runSensitivityAnalysis 与 generateParameterSweep
- **关键约束**: 引用 runWorkflow 并固定 maxIterations=3，保持 ESM `.js` 导入扩展名
- **验证**: LSP 诊断无错误

## [2026-02-07] 敏感性分析功能实现
- **文件**:
  - `src/analysis/sensitivity-analysis.ts`（147行）
  - `src/server.ts`（新增 MCP Tool）
- **核心功能**:
  - `runSensitivityAnalysis()`: 执行参数扫描，运行多次工作流，返回统计摘要
  - `generateParameterSweep()`: 自动生成参数变体（添加扰动项、移除单个项）
  - `run_sensitivity_analysis` MCP Tool: 提供接口进行敏感性分析
- **接口定义**:
  - SensitivityConfig: { baseHypothesis, parameter, variations }
  - SensitivityResult: { variations, summary }
  - VariationResult: { variationIndex, hypothesis, model, metrics }
- **验证结果**: LSP 诊断无错误，测试 12 pass/0 fail 全部通过
- **关键约定**: 使用 .js 扩展名导入（Bun ESM 规范）

## [2026-02-07] 交互式可视化实现
- **文件**:
  - `web/src/components/ModelVisualization.tsx`（115行）
  - `src/server.ts`（新增 visualize_model MCP Tool）
- **ModelVisualization 组件**:
  - 使用 vis-network/standalone 的 Network 类实现力导向图
  - 展示社会体系的 9 层结构（overall, workflow, institutions, governance, culture, innovation, risks, metrics, optimization）
  - 节点颜色编码：中心节点（绿色 #4CAF50）、层级节点（蓝色 #2196F3）、字段节点（黄色 #FFC107）
  - 鼠标悬停显示详情：title 字段包含 layerData[key].join('\n')
  - 层级布局：direction: 'UD'（从上到下），levelSeparation: 150
  - 平滑边：smooth: { type: 'cubicBezier' }
  - 物理引擎：physics: false（使用层级布局时关闭）
  - 响应式容器：w-full h-[600px]
  - TypeScript 类型安全：使用 keyof SystemStructure 确保类型正确
- **visualize_model MCP Tool**:
  - 工具名称：visualize_model
  - 输入：modelId（必需）、comparisonModelId（可选）
  - 输出：{ nodes, edges, options, summary? }
  - 节点属性：id、label、color、size、font、title
  - 边属性：from、to、smooth
  - 支持模型对比：使用 diffModels 计算差异摘要
- **验证结果**:
  - LSP 诊断：无错误
  - 测试：12 pass / 0 fail 全部通过
- **关键约定**:
  - 使用 vis-network 库进行力导向图可视化
  - MCP Tool 返回 JSON 数据格式（nodes 和 edges），不直接渲染 React 组件
  - Frontend Philosophy 5 大支柱：目的驱动、视觉层级、清晰表达、一致性、响应式

## [2026-02-07] GraphML 导出功能实现
- **文件**: `src/analysis/export-graphml.ts`（71行）
- **核心功能**:
  - `exportToGraphML(model)`: 将 SocialSystemModel 导出为 GraphML 格式
  - `escapeGraphMLText(text)`: 处理XML特殊字符（&, <, >, ", '）
- **GraphML 格式**:
  - 符合 GraphML 标准（xmlns="http://graphml.graphdrawing.org/xmlns"）
  - 节点属性：id、label（key="d0"）、color（key="d4"）
  - 边属性：source、target（undirected）
- **节点与边**:
  - 中心节点：social_system（绿色 #4CAF50）
  - 9 层节点：layer_0 到 layer_8（蓝色 #2196F3）
  - 字段节点：layer_X_Y（黄色 #FFC107）
  - 边：social_system → layer、layer → field
- **验证结果**: LSP 诊断无错误
- **关键约定**:
  - XML 特殊字符转义（避免 GraphML 解析失败）
  - 使用常量定义结构（STRUCTURE_LAYERS, GRAPHML_HEADER, GRAPHML_FOOTER）
  - 类型安全：使用 as const 确保类型推断

## [2026-02-07] GraphML 导出 MCP Tool 实现
- **文件**: `src/server.ts`（新增 28 行）
- **export_model_graphml MCP Tool**:
  - 工具名称：export_model_graphml
  - 描述："将模型导出为 GraphML 格式（用于 Gephi/Cytoscape 分析）"
  - 输入：modelId（必需）
  - 实现：
    - 使用 ModelRepository.findById() 查询模型数据
    - 调用 exportToGraphML(modelData) 生成 GraphML
    - 返回 GraphML 文本（content: [{ type: "text", text: graphml }]）
  - 错误处理：模型不存在时返回 JSON.stringify({ error: "Model not found" })
- **验证结果**:
  - LSP 诊断：无错误
  - 测试：12 pass / 0 fail 全部通过
- **关键约定**:
  - MCP Tool 返回文本内容（type: "text"），不直接下载文件
  - 用户可以通过客户端工具保存导出的 GraphML
  - 与 exportToGraphML 函数配合使用（src/analysis/export-graphml.ts）

## [2026-02-07] 批量推演 MCP Tool 实现
- **文件**: `src/server.ts`（新增 86 行）
- **batch_reasoning MCP Tool**:
  - 工具名称：batch_reasoning
  - 描述："批量推演多个假设（支持并行或顺序执行）"
  - 输入：
    - hypotheses（必需）：假设数组，每个包含 id、assumptions、constraints、goals
    - maxIterations（可选，默认 3）：每个假设的最大迭代次数
    - parallel（可选，默认 true）：是否并行执行
  - 实现：
    - 并行执行：使用 Promise.all 批量处理所有假设
    - 顺序执行：使用 for...of 逐个处理假设
    - 错误处理：catch 错误并返回错误信息（status: 'error'）
    - 返回汇总结果：results 数组（包含 id、status、model/error）+ summary 对象
  - 汇总统计：
    - total：总数
    - successful：成功数
    - failed：失败数
    - averageConfidence：平均置信度（保留 2 位小数）
    - averageIterations：平均迭代次数（保留 1 位小数）
- **验证结果**:
  - LSP 诊断：无错误
  - 测试：12 pass / 0 fail 全部通过
- **关键约定**:
  - 支持并行/顺序两种执行模式（parallel 参数）
  - 错误隔离：单个假设失败不影响其他假设
  - 统计计算：仅计算成功的假设（避免被错误数据污染）

## [2026-02-07] 批量对比功能实现
- **文件**: `src/analysis/batch-comparison.ts`（136行）
- **接口定义**:
  - MetricStats: { min, max, mean, values }
  - BatchComparisonResult: { modelCount, metrics, ranking }
  - ModelRanking: { modelId, rank, score, metrics }
- **核心功能**:
  - `compareModels(models)`: 对比多个模型，计算统计指标和排名
  - `mean(values)`: 计算平均值
  - `standardDeviation(values)`: 计算标准差
  - `zScore(values)`: 计算标准化分数（z-score）
  - `buildStats(values)`: 构建统计对象（min/max/mean/values）
  - `getModelId(model, index)`: 获取模型 ID（优先使用 metadata.id，否则使用 model-N）
- **评分逻辑**:
  - 高置信度（正向）：zConfidence
  - 低迭代次数（负向）：-zIterations
  - 低冲突数（负向）：-zConflicts
  - 综合评分：zConfidence - zIterations - zConflicts
  - 排序：按评分降序（b.score - a.score）
  - 排名：从 1 开始（index + 1）
- **验证结果**: LSP 诊断无错误
- **关键约定**:
  - 类型安全：使用 TypeScript 接口定义所有类型
  - 错误处理：空数组抛出错误（mean、standardDeviation、zScore、buildStats、compareModels）
  - 边界情况：deviation === 0 时返回全 0 数组（避免除零错误）
  - 降序排序：高分模型排在前面

## [2026-02-07] Typecheck 错误记录
- **错误位置**: src/server.ts 第 227-228 行
- **错误信息**: TS1005: ',' expected; TS1005: ';' expected
- **错误来源**: query_model_history MCP Tool（不是本次改动）
- **问题**: return 语句中缺少外层对象右括号 `}]`
- **修复建议**:
  - 当前代码（第 214-227 行）:
    ```typescript
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ ... })
    }, null, 2)
    };
    ```
  - 修复后（添加最后的 `]`）:
    ```typescript
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ ... })
      }]
    };
    ```
- **影响**: 不影响 batch-comparison.ts 的 LSP 诊断（无错误）
- **后续**: 在修复 query_model_history 时一并处理

## [2026-02-07] 批量对比图表组件实现
- **文件**: `web/src/components/BatchComparisonChart.tsx`（58行）
- **接口定义**:
  - ModelRanking: { rank, modelId, score, metrics: { confidence, conflicts, iterations } }
  - BatchComparisonChartProps: { data: ModelRanking[] }
- **核心功能**:
  - 按排名排序：sortedData.sort((a, b) => a.rank - b.rank)（升序）
  - 数据转换：
    - name: `#${rank} ${modelId}`（显示排名和模型ID）
    - confidence: `Number((confidence * 100).toFixed(1))`（转换为百分比）
    - conflicts: 原始冲突数
    - score: `Number((score * 100).toFixed(1))`（综合得分百分比）
  - 三柱状图：
    - 置信度（绿色 #4CAF50，名称："置信度 (%)"）
    - 冲突数（红色 #F44336，名称："冲突数"）
    - 综合得分（蓝色 #2196F3，名称："综合得分 (%)"）
  - 响应式布局：ResponsiveContainer width="100%" height={400}
  - 图表元素：CartesianGrid, XAxis, YAxis, Tooltip, Legend
- **验证结果**: LSP 诊断无错误
- **关键约定**:
  - 使用 recharts 库进行柱状图可视化
  - 颜色语义清晰（绿色=好、红色=坏、蓝色=综合）
  - 响应式设计：ResponsiveContainer 自适应宽度
  - 排序正确：按 rank 升序（#1 在左边，#3 在右边）
- **UI 设计原则（frontend-philosophy）**:
  - 目的驱动：可视化是为了让用户对比不同模型的性能
  - 视觉层级：颜色区分不同指标
  - 清晰表达：X轴显示排名和模型ID，Y轴显示数值
  - 一致性：与 ModelVisualization 组件使用相同颜色方案
  - 响应式：ResponsiveContainer 适应不同屏幕
