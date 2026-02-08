# Phase 2 执行计划：性能与规模优化

**项目**: SocialGuessSkills
**创建时间**: 2026-02-07
**优先级**: P1 - 高优先级
**预估工作量**: 36-56 小时 (4-7 天)
**前置条件**: Phase 1 完成 (✅ 已完成)

---

## 执行概览

Phase 2 聚焦于**性能优化**和**可观测性建设**,包含两个主要任务:

1. **并行 Agent 执行优化** (18-26小时) - 通过依赖分析实现并发执行,加速模型生成 2-3 倍
2. **性能监控系统** (24-30小时) - Prometheus + Grafana + GLM 成本追踪,建立完整可观测性

**核心目标**: 在不增加成本的前提下,将模型生成速度提升 2-3 倍,并建立完整的性能监控体系,为未来扩展打好基础。

---

## 任务 1: 并行 Agent 执行优化

### 1.1 背景与价值

**当前状态**:
- 7 个 Agent 顺序执行 (systems → econ → socio → governance → culture → risk → validation)
- 每个 Agent 平均耗时 2-5 秒 (GLM API 调用 + 处理)
- 总执行时间: 14-35 秒/迭代

**优化目标**:
- 识别可并行执行的 Agent 组
- 通过 `Promise.all()` 实现并发执行
- 预期加速: **2-3 倍** (理想情况下 7-12 秒/迭代)

**业务价值**:
- 用户体验: 减少等待时间 50-70%
- 成本优化: GLM API 并发请求无额外费用
- 扩展性: 为未来添加更多 Agent 打好基础

---

### 1.2 技术方案

#### 步骤 1: 依赖图分析 (4-6 小时)

**目标**: 识别 Agent 间的依赖关系,构建有向无环图 (DAG)

**分析维度**:

| Agent | 依赖输入 | 阻塞后续 Agent | 并行组 |
|-------|----------|----------------|--------|
| Systems | 仅假设 | Governance, Validation | **Wave 1** |
| Econ | 仅假设 | Risk | **Wave 1** |
| Socio | 仅假设 | Culture, Validation | **Wave 1** |
| Governance | Systems 的结论 | Validation | **Wave 2** |
| Culture | Socio 的认同机制 | Validation | **Wave 2** |
| Risk | Econ 的激励机制 | Validation | **Wave 2** |
| Validation | 所有 Agent 输出 | 无 | **Wave 3** |

**依赖分析方法**:

```typescript
// 文件: src/workflow/dependency-analyzer.ts

import type { AgentType, AgentOutput } from '../types';

export interface AgentDependency {
  agent: AgentType;
  dependsOn: AgentType[];
  wave: number;
}

/**
 * 分析 Agent 依赖关系,构建执行波次
 */
export function analyzeAgentDependencies(): AgentDependency[] {
  return [
    // Wave 1: 无依赖,可并行执行
    { agent: 'systems', dependsOn: [], wave: 1 },
    { agent: 'econ', dependsOn: [], wave: 1 },
    { agent: 'socio', dependsOn: [], wave: 1 },
    
    // Wave 2: 依赖 Wave 1 的部分输出
    { agent: 'governance', dependsOn: ['systems'], wave: 2 },
    { agent: 'culture', dependsOn: ['socio'], wave: 2 },
    { agent: 'risk', dependsOn: ['econ'], wave: 2 },
    
    // Wave 3: 依赖所有 Agent 输出
    { agent: 'validation', dependsOn: ['systems', 'econ', 'socio', 'governance', 'culture', 'risk'], wave: 3 }
  ];
}

/**
 * 获取指定波次的 Agent 列表
 */
export function getAgentsByWave(wave: number): AgentType[] {
  const dependencies = analyzeAgentDependencies();
  return dependencies
    .filter(dep => dep.wave === wave)
    .map(dep => dep.agent);
}

/**
 * 验证依赖关系是否满足 (检测循环依赖)
 */
export function validateDependencies(): { valid: boolean; errors: string[] } {
  const dependencies = analyzeAgentDependencies();
  const errors: string[] = [];
  
  // 简单的循环依赖检测 (可扩展为完整的拓扑排序)
  for (const dep of dependencies) {
    for (const requiredAgent of dep.dependsOn) {
      const requiredDep = dependencies.find(d => d.agent === requiredAgent);
      if (!requiredDep) {
        errors.push(`Agent ${dep.agent} depends on unknown agent: ${requiredAgent}`);
        continue;
      }
      if (requiredDep.wave >= dep.wave) {
        errors.push(`Dependency cycle detected: ${dep.agent} (wave ${dep.wave}) depends on ${requiredAgent} (wave ${requiredDep.wave})`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

**测试用例**:

```typescript
// 文件: src/workflow/__tests__/dependency-analyzer.test.ts

import { describe, expect, test } from 'bun:test';
import { 
  analyzeAgentDependencies, 
  getAgentsByWave, 
  validateDependencies 
} from '../dependency-analyzer';

describe('Agent Dependency Analyzer', () => {
  test('应返回 7 个 Agent 的依赖关系', () => {
    const dependencies = analyzeAgentDependencies();
    expect(dependencies).toHaveLength(7);
  });

  test('Wave 1 应包含 3 个无依赖的 Agent', () => {
    const wave1 = getAgentsByWave(1);
    expect(wave1).toEqual(['systems', 'econ', 'socio']);
  });

  test('Wave 2 应包含 3 个依赖 Wave 1 的 Agent', () => {
    const wave2 = getAgentsByWave(2);
    expect(wave2).toEqual(['governance', 'culture', 'risk']);
  });

  test('Wave 3 应只包含 validation Agent', () => {
    const wave3 = getAgentsByWave(3);
    expect(wave3).toEqual(['validation']);
  });

  test('依赖关系验证应通过 (无循环依赖)', () => {
    const validation = validateDependencies();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  test('Governance Agent 应依赖 Systems Agent', () => {
    const deps = analyzeAgentDependencies();
    const governance = deps.find(d => d.agent === 'governance');
    expect(governance?.dependsOn).toContain('systems');
  });

  test('Validation Agent 应依赖所有其他 Agent', () => {
    const deps = analyzeAgentDependencies();
    const validation = deps.find(d => d.agent === 'validation');
    expect(validation?.dependsOn).toHaveLength(6);
  });
});
```

**可交付物**:
- ✅ `src/workflow/dependency-analyzer.ts` - 依赖分析模块
- ✅ `src/workflow/__tests__/dependency-analyzer.test.ts` - 单元测试 (100% 覆盖)
- ✅ 文档: 依赖关系图 (Mermaid 格式,添加到 `docs/architecture.md`)

---

#### 步骤 2: 并行执行实现 (8-12 小时)

**目标**: 修改 `orchestrator.ts`,支持分波次并行执行

**核心改动点**:

**2.1 修改 `step2_ExecuteAgents`**:

```typescript
// 文件: src/workflow/orchestrator.ts

import { getAgentsByWave } from './dependency-analyzer.js';

/**
 * 原版本: 顺序执行所有 Agent
 * 新版本: 分波次并行执行
 */
async function step2_ExecuteAgents(
  agents: Map<AgentType, any>,
  hypothesis: Hypothesis,
  state: WorkflowState
): Promise<void> {
  logger.info("Step 2: 并行执行Agent推演 (优化版)");

  // 获取最大波次数
  const maxWave = 3; // 当前架构下固定为 3 波

  for (let wave = 1; wave <= maxWave; wave++) {
    const waveAgents = getAgentsByWave(wave);
    logger.info({ wave, agents: waveAgents }, `执行 Wave ${wave}`);

    const wavePromises: Promise<void>[] = [];

    for (const agentType of waveAgents) {
      const agent = agents.get(agentType);
      if (!agent) {
        logger.warn(`Agent not found: ${agentType}`);
        continue;
      }

      // 检查缓存 (保留原有缓存机制)
      const cacheKey = getCacheKey(agentType, hypothesis);
      const cached = agentCache.get(cacheKey);

      if (cached && state.iteration > 1) {
        logger.info(`Using cached result for ${agentType} Agent`);
        state.agentResults.set(agentType, cached.result);
        continue;
      }

      // 并行执行 (关键改动)
      const promise = executeAgent(agent, {
        hypothesis,
        previousOutputs: state.agentResults,
        iteration: state.iteration,
        conflicts: state.conflicts,
        agentType
      }).then(output => {
        state.agentResults.set(agentType, output);
        logger.info(`✓ ${agentType} Agent 完成 (Wave ${wave})`);

        // 缓存结果
        agentCache.set(cacheKey, {
          agentType,
          hypothesisHash: JSON.stringify(hypothesis),
          result: output,
          timestamp: Date.now()
        });
      }).catch(error => {
        logger.error({ err: String(error), agent: String(agentType) }, `✗ ${agentType} Agent 失败`);
      });

      wavePromises.push(promise);
    }

    // 等待当前波次完成后再进入下一波次
    await Promise.all(wavePromises);
    logger.info({ wave, completed: waveAgents.length }, `Wave ${wave} 完成`);
  }

  logger.info({ completed: state.agentResults.size }, `→ 完成Agent推演`);
}
```

**2.2 性能指标收集**:

```typescript
// 在 step2_ExecuteAgents 中添加性能追踪

interface WaveMetrics {
  wave: number;
  agents: AgentType[];
  startTime: number;
  endTime: number;
  duration: number;
}

const waveMetrics: WaveMetrics[] = [];

for (let wave = 1; wave <= maxWave; wave++) {
  const waveStart = Date.now();
  
  // ... 执行逻辑 ...
  
  const waveEnd = Date.now();
  waveMetrics.push({
    wave,
    agents: waveAgents,
    startTime: waveStart,
    endTime: waveEnd,
    duration: waveEnd - waveStart
  });
}

// 在工作流结束后记录
logger.info({ metrics: waveMetrics }, "Wave execution metrics");
```

**可交付物**:
- ✅ 修改 `src/workflow/orchestrator.ts` - 并行执行逻辑
- ✅ 向后兼容: 原有测试不受影响
- ✅ 性能日志: 记录每个 Wave 的执行时间

---

#### 步骤 3: 收敛检测更新 (4-6 小时)

**问题**: 并行执行后,收敛检测需要在所有 Wave 完成后才能进行

**解决方案**:

```typescript
// 文件: src/workflow/orchestrator.ts

export async function runWorkflow(
  hypothesis: Hypothesis,
  options: WorkflowConfig = {}
): Promise<SocialSystemModel> {
  // ... 初始化代码 ...

  let previousOutputs: AgentOutput[] | null = null;

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    state.iteration = iteration;
    logger.info({ iteration, maxIterations }, `=== 迭代 ${iteration}/${maxIterations} ===`);

    await step1_ValidateHypothesis(hypothesis, state);
    
    // 并行执行 (新版本)
    await step2_ExecuteAgents(agents, hypothesis, state);
    
    // 收敛检测 (在所有 Agent 完成后)
    const currentOutputs = Array.from(state.agentResults.values());
    
    if (previousOutputs) {
      const similarity = compareOutputs(previousOutputs, currentOutputs);
      if (similarity >= convergenceThreshold) {
        logger.info(`✓ Workflow converged at iteration ${iteration} (similarity: ${similarity.toFixed(2)})`);
        const model = await step4_SynthesizeModel(hypothesis, state);
        await step5_ValidateModel(model, state);
        model.metadata.convergedAtIteration = iteration;
        model.metadata.finalSimilarity = similarity;
        return model;
      }
    }
    
    previousOutputs = currentOutputs;

    // 冲突检测与对齐
    state.conflicts = detectConflicts(Array.from(state.agentResults.values()));
    await step3_AlignConflicts(state);

    // 早停条件: 无冲突
    if (state.conflicts.length === 0) {
      logger.info(`✓ Workflow converged in ${iteration} iterations (no conflicts)`);
      const model = await step4_SynthesizeModel(hypothesis, state);
      await step5_ValidateModel(model, state);
      return model;
    }

    if (iteration === maxIterations) {
      const model = await step4_SynthesizeModel(hypothesis, state);
      await step5_ValidateModel(model, state);
      return model;
    }
  }

  throw new Error("Workflow did not complete within max iterations");
}
```

**测试策略**:

```typescript
// 文件: src/workflow/__tests__/orchestrator-parallel.test.ts

import { describe, expect, test } from 'bun:test';
import { runWorkflow } from '../orchestrator';

describe('Parallel Agent Execution', () => {
  test('并行执行应生成完整模型', async () => {
    const hypothesis = {
      assumptions: ["测试假设"],
      constraints: [],
      goals: ["测试目标"]
    };

    const model = await runWorkflow(hypothesis, { maxIterations: 1 });

    expect(model.agentOutputs).toHaveLength(7);
    expect(model.metadata.iterations).toBe(1);
  });

  test('并行执行应比顺序执行更快', async () => {
    const hypothesis = {
      assumptions: ["性能测试"],
      constraints: [],
      goals: ["评估加速比"]
    };

    // 记录执行时间
    const start = Date.now();
    await runWorkflow(hypothesis, { maxIterations: 1 });
    const duration = Date.now() - start;

    // 预期: 并行执行应在 10 秒内完成 (顺序执行需 20-30 秒)
    expect(duration).toBeLessThan(10000);
  });

  test('并行执行应保持收敛检测正确性', async () => {
    const hypothesis = {
      assumptions: ["收敛测试"],
      constraints: [],
      goals: ["验证收敛"]
    };

    const model = await runWorkflow(hypothesis, { 
      maxIterations: 3,
      convergenceThreshold: 0.9
    });

    // 应在 2-3 次迭代内收敛
    expect(model.metadata.iterations).toBeLessThanOrEqual(3);
  });
});
```

**可交付物**:
- ✅ 更新收敛检测逻辑
- ✅ 新增 `src/workflow/__tests__/orchestrator-parallel.test.ts` - 并行执行测试
- ✅ 性能基准测试: 记录加速比 (目标: 2-3x)

---

#### 步骤 4: 集成测试与基准测试 (2-4 小时)

**目标**: 验证并行执行的正确性与性能提升

**测试矩阵**:

| 测试场景 | 迭代次数 | Agent 数量 | 预期结果 |
|----------|----------|------------|----------|
| 单次迭代 | 1 | 7 | 完整模型,7 个 Agent 输出 |
| 收敛测试 | 3 | 7 | 2-3 次迭代收敛 |
| 冲突场景 | 3 | 7 | 检测到冲突,正确对齐 |
| 性能基准 | 1 | 7 | 执行时间 < 10 秒 |

**基准测试脚本**:

```typescript
// 文件: benchmarks/parallel-execution.bench.ts

import { runWorkflow } from '../src/workflow/orchestrator';

async function benchmark() {
  const hypothesis = {
    assumptions: [
      "1000人社区,资源有限",
      "协作可提升总产出30%"
    ],
    constraints: [
      "通信成本:当面交流免费"
    ],
    goals: [
      "建立可持续的资源生产机制"
    ]
  };

  console.log("=== 并行执行基准测试 ===\n");

  // 测试 1: 单次迭代
  console.log("测试 1: 单次迭代");
  const start1 = Date.now();
  const model1 = await runWorkflow(hypothesis, { maxIterations: 1 });
  const duration1 = Date.now() - start1;
  console.log(`  ✓ 耗时: ${duration1}ms`);
  console.log(`  ✓ Agent 数量: ${model1.agentOutputs.length}`);

  // 测试 2: 多次迭代
  console.log("\n测试 2: 多次迭代 (收敛测试)");
  const start2 = Date.now();
  const model2 = await runWorkflow(hypothesis, { maxIterations: 3 });
  const duration2 = Date.now() - start2;
  console.log(`  ✓ 耗时: ${duration2}ms`);
  console.log(`  ✓ 迭代次数: ${model2.metadata.iterations}`);
  console.log(`  ✓ 置信度: ${model2.metadata.confidence.toFixed(2)}`);

  // 测试 3: 加速比估算 (对比理论顺序执行时间)
  console.log("\n测试 3: 加速比分析");
  const theoreticalSequential = model1.agentOutputs.length * 3000; // 假设每个 Agent 3 秒
  const speedup = theoreticalSequential / duration1;
  console.log(`  ✓ 理论顺序执行: ${theoreticalSequential}ms`);
  console.log(`  ✓ 实际并行执行: ${duration1}ms`);
  console.log(`  ✓ 加速比: ${speedup.toFixed(2)}x`);

  if (speedup < 2) {
    console.warn(`  ⚠ 警告: 加速比低于预期 (目标: 2-3x)`);
  } else {
    console.log(`  ✓ 加速比达标!`);
  }
}

benchmark().catch(console.error);
```

**运行方式**:

```bash
# 执行基准测试
bun run benchmarks/parallel-execution.bench.ts

# 预期输出:
# === 并行执行基准测试 ===
#
# 测试 1: 单次迭代
#   ✓ 耗时: 7500ms
#   ✓ Agent 数量: 7
#
# 测试 2: 多次迭代 (收敛测试)
#   ✓ 耗时: 18000ms
#   ✓ 迭代次数: 2
#   ✓ 置信度: 0.79
#
# 测试 3: 加速比分析
#   ✓ 理论顺序执行: 21000ms
#   ✓ 实际并行执行: 7500ms
#   ✓ 加速比: 2.8x
#   ✓ 加速比达标!
```

**可交付物**:
- ✅ `benchmarks/parallel-execution.bench.ts` - 基准测试脚本
- ✅ 测试报告: 记录加速比与性能指标
- ✅ 回归测试: 确保所有现有测试通过

---

### 1.3 验收标准

**功能验收**:
- ✅ 所有 Agent 正确执行,输出结果完整
- ✅ 收敛检测逻辑正确,迭代次数与原版本一致
- ✅ 冲突检测与对齐不受影响
- ✅ 所有现有单元测试通过 (42 个测试)

**性能验收**:
- ✅ 单次迭代执行时间 < 10 秒 (顺序执行 ~20-30 秒)
- ✅ 加速比 ≥ 2x (目标: 2-3x)
- ✅ GLM API 并发调用成功率 ≥ 95%

**代码质量**:
- ✅ 新增代码测试覆盖率 ≥ 80%
- ✅ 通过 Biome 代码检查
- ✅ 无 TypeScript 类型错误

---

### 1.4 风险与缓解措施

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| GLM API 并发限流 | 高 | 中 | 添加请求队列与重试机制 |
| 收敛检测失效 | 高 | 低 | 保留顺序执行模式作为回退 |
| 内存占用增加 | 中 | 中 | 监控内存使用,必要时限制并发数 |
| Agent 间数据竞争 | 高 | 低 | 使用不可变数据结构,避免共享状态 |

**回退策略**:

```typescript
// 环境变量控制并行执行
const ENABLE_PARALLEL_EXECUTION = process.env.PARALLEL_EXECUTION !== "0";

if (ENABLE_PARALLEL_EXECUTION) {
  await step2_ExecuteAgentsParallel(agents, hypothesis, state);
} else {
  await step2_ExecuteAgentsSequential(agents, hypothesis, state);
}
```

---

## 任务 2: 性能监控系统

### 2.1 背景与价值

**当前状态**:
- 无性能指标收集
- 无 GLM API 成本追踪
- 生产问题难以定位

**监控目标**:
- 实时性能指标 (延迟、吞吐量、错误率)
- GLM API 使用统计 (Token 数、成本)
- 系统健康度可视化

**业务价值**:
- **成本控制**: 追踪 GLM API 使用,避免超支
- **性能优化**: 识别瓶颈,持续改进
- **故障诊断**: 快速定位生产问题根因

---

### 2.2 技术方案

#### 步骤 1: Prometheus 指标收集 (10-12 小时)

**目标**: 在应用中埋点,收集关键性能指标

**2.1.1 安装依赖**:

```bash
bun add prom-client
```

**2.1.2 创建指标注册表**:

```typescript
// 文件: src/utils/metrics.ts

import { 
  Registry, 
  Counter, 
  Histogram, 
  Gauge 
} from 'prom-client';

// 全局注册表
export const register = new Registry();

// === MCP 请求指标 ===

export const mcpRequestTotal = new Counter({
  name: 'mcp_requests_total',
  help: 'Total number of MCP requests',
  labelNames: ['tool', 'status'], // reasoning/query_agent/validate_model, success/error
  registers: [register]
});

export const mcpRequestDuration = new Histogram({
  name: 'mcp_request_duration_seconds',
  help: 'Duration of MCP requests in seconds',
  labelNames: ['tool'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60], // 100ms 到 60s
  registers: [register]
});

// === Agent 执行指标 ===

export const agentExecutionTotal = new Counter({
  name: 'agent_execution_total',
  help: 'Total number of agent executions',
  labelNames: ['agent_type', 'status'], // systems/econ/..., success/error
  registers: [register]
});

export const agentExecutionDuration = new Histogram({
  name: 'agent_execution_duration_seconds',
  help: 'Duration of agent execution in seconds',
  labelNames: ['agent_type'],
  buckets: [0.5, 1, 2, 3, 5, 10], // 500ms 到 10s
  registers: [register]
});

// === GLM API 指标 ===

export const glmApiCallsTotal = new Counter({
  name: 'glm_api_calls_total',
  help: 'Total number of GLM API calls',
  labelNames: ['model', 'status'], // glm-4, success/error/retry
  registers: [register]
});

export const glmTokensUsed = new Counter({
  name: 'glm_tokens_used_total',
  help: 'Total GLM tokens consumed',
  labelNames: ['model', 'type'], // glm-4, prompt/completion
  registers: [register]
});

export const glmCostUsd = new Gauge({
  name: 'glm_cost_usd_total',
  help: 'Total GLM API cost in USD',
  labelNames: ['model'],
  registers: [register]
});

export const glmApiDuration = new Histogram({
  name: 'glm_api_duration_seconds',
  help: 'Duration of GLM API calls in seconds',
  labelNames: ['model'],
  buckets: [0.5, 1, 2, 3, 5, 10, 15], // 500ms 到 15s
  registers: [register]
});

// === 工作流指标 ===

export const workflowIterations = new Histogram({
  name: 'workflow_iterations_total',
  help: 'Number of iterations until convergence',
  buckets: [1, 2, 3, 4, 5],
  registers: [register]
});

export const workflowConfidence = new Histogram({
  name: 'workflow_confidence_score',
  help: 'Final confidence score of the model',
  buckets: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [register]
});

export const workflowConflicts = new Histogram({
  name: 'workflow_conflicts_detected',
  help: 'Number of conflicts detected in workflow',
  buckets: [0, 1, 3, 5, 7, 10],
  registers: [register]
});

// === 系统指标 (可选) ===

export const memoryUsage = new Gauge({
  name: 'process_memory_usage_bytes',
  help: 'Process memory usage in bytes',
  labelNames: ['type'], // rss, heapTotal, heapUsed
  registers: [register]
});

/**
 * 定期收集系统指标 (每 30 秒)
 */
export function startSystemMetricsCollection() {
  setInterval(() => {
    const usage = process.memoryUsage();
    memoryUsage.set({ type: 'rss' }, usage.rss);
    memoryUsage.set({ type: 'heap_total' }, usage.heapTotal);
    memoryUsage.set({ type: 'heap_used' }, usage.heapUsed);
  }, 30000);
}
```

**2.1.3 埋点实现**:

**在 MCP Server 中**:

```typescript
// 文件: src/server.ts

import { mcpRequestTotal, mcpRequestDuration, register } from './utils/metrics.js';

// 注册 reasoning tool
(mcpServer as any).registerTool({
  name: "reasoning",
  description: "完整推演流程",
  inputSchema: { /* ... */ }
}, async (input: any) => {
  const end = mcpRequestDuration.startTimer({ tool: 'reasoning' });
  
  try {
    const model = await runWorkflow(input.hypothesis, {
      maxIterations: input.maxIterations ?? 3
    });
    
    mcpRequestTotal.inc({ tool: 'reasoning', status: 'success' });
    end();
    
    return { content: [{ type: "text", text: JSON.stringify(model, null, 2) }] };
  } catch (error) {
    mcpRequestTotal.inc({ tool: 'reasoning', status: 'error' });
    end();
    throw error;
  }
});

// 暴露 /metrics 端点 (用于 Prometheus 抓取)
Bun.serve({
  port: 9090,
  fetch(req) {
    if (new URL(req.url).pathname === '/metrics') {
      return new Response(register.metrics(), {
        headers: { 'Content-Type': register.contentType }
      });
    }
    return new Response('Not Found', { status: 404 });
  }
});

console.log("Prometheus metrics exposed at http://localhost:9090/metrics");
```

**在 Agent Executor 中**:

```typescript
// 文件: src/agents/agent-executor.ts

import { 
  agentExecutionTotal, 
  agentExecutionDuration,
  glmApiCallsTotal,
  glmTokensUsed,
  glmCostUsd,
  glmApiDuration
} from '../utils/metrics.js';

export async function executeAgent(
  agent: AgentInstance,
  context: AnalysisContext
): Promise<AgentOutput> {
  const end = agentExecutionDuration.startTimer({ agent_type: context.agentType });
  
  try {
    const output = await simulateAICall(agent.agentType, contextualPrompt);
    
    agentExecutionTotal.inc({ agent_type: context.agentType, status: 'success' });
    end();
    
    return output;
  } catch (error) {
    agentExecutionTotal.inc({ agent_type: context.agentType, status: 'error' });
    end();
    throw error;
  }
}

async function callRealGLM(prompt: string): Promise<string> {
  const apiStart = glmApiDuration.startTimer({ model: 'glm-4' });
  
  try {
    const response = await callLLM(prompt);
    
    // 假设 API 返回 token 使用信息 (需要从实际 API 响应中提取)
    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0 };
    
    glmTokensUsed.inc({ model: 'glm-4', type: 'prompt' }, usage.prompt_tokens);
    glmTokensUsed.inc({ model: 'glm-4', type: 'completion' }, usage.completion_tokens);
    
    // GLM-4 定价: 0.1元/千tokens (约 $0.014)
    const cost = ((usage.prompt_tokens + usage.completion_tokens) / 1000) * 0.014;
    glmCostUsd.inc({ model: 'glm-4' }, cost);
    
    glmApiCallsTotal.inc({ model: 'glm-4', status: 'success' });
    apiStart();
    
    return response.content;
  } catch (error) {
    glmApiCallsTotal.inc({ model: 'glm-4', status: 'error' });
    apiStart();
    throw error;
  }
}
```

**在 Orchestrator 中**:

```typescript
// 文件: src/workflow/orchestrator.ts

import { 
  workflowIterations, 
  workflowConfidence, 
  workflowConflicts 
} from '../utils/metrics.js';

export async function runWorkflow(
  hypothesis: Hypothesis,
  options: WorkflowConfig = {}
): Promise<SocialSystemModel> {
  // ... 工作流执行逻辑 ...

  // 记录最终指标
  workflowIterations.observe(state.iteration);
  workflowConfidence.observe(model.metadata.confidence);
  workflowConflicts.observe(state.conflicts.length);

  return model;
}
```

**可交付物**:
- ✅ `src/utils/metrics.ts` - Prometheus 指标定义
- ✅ 埋点: MCP Server, Agent Executor, Orchestrator
- ✅ `/metrics` 端点: 暴露指标供 Prometheus 抓取

---

#### 步骤 2: Grafana 仪表盘配置 (6-8 小时)

**目标**: 创建可视化仪表盘,监控关键指标

**2.2.1 Prometheus 配置**:

```yaml
# 文件: docker/prometheus/prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'socialguess-mcp'
    static_configs:
      - targets: ['localhost:9090']
```

**2.2.2 Docker Compose 配置**:

```yaml
# 文件: docker-compose.monitoring.yml

version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: socialguess-prometheus
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9091:9090"
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: socialguess-grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./docker/grafana/provisioning:/etc/grafana/provisioning
      - ./docker/grafana/dashboards:/var/lib/grafana/dashboards
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
    networks:
      - monitoring

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

**2.2.3 Grafana 仪表盘 JSON**:

```json
// 文件: docker/grafana/dashboards/socialguess-overview.json

{
  "dashboard": {
    "title": "SocialGuessSkills 监控概览",
    "panels": [
      {
        "title": "MCP 请求速率",
        "targets": [
          {
            "expr": "rate(mcp_requests_total[5m])"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Agent 执行时间 (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(agent_execution_duration_seconds_bucket[5m]))"
          }
        ],
        "type": "graph"
      },
      {
        "title": "GLM API 成本 (累计)",
        "targets": [
          {
            "expr": "glm_cost_usd_total"
          }
        ],
        "type": "stat"
      },
      {
        "title": "工作流收敛迭代次数 (平均)",
        "targets": [
          {
            "expr": "avg(workflow_iterations_total)"
          }
        ],
        "type": "gauge"
      },
      {
        "title": "内存使用",
        "targets": [
          {
            "expr": "process_memory_usage_bytes{type=\"heap_used\"}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

**2.2.4 启动监控栈**:

```bash
# 启动 Prometheus + Grafana
docker-compose -f docker-compose.monitoring.yml up -d

# 访问 Grafana
open http://localhost:3001
# 默认登录: admin / admin
```

**可交付物**:
- ✅ `docker/prometheus/prometheus.yml` - Prometheus 配置
- ✅ `docker-compose.monitoring.yml` - 监控栈编排
- ✅ `docker/grafana/dashboards/socialguess-overview.json` - Grafana 仪表盘
- ✅ 文档: 监控系统使用指南 (添加到 `docs/monitoring.md`)

---

#### 步骤 3: GLM 成本追踪 (8-10 小时)

**目标**: 精确追踪 GLM API 使用成本,设置预算告警

**3.1 Token 使用统计**:

```typescript
// 文件: src/utils/glm-cost-tracker.ts

export interface GLMUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  timestamp: string;
}

export class GLMCostTracker {
  private usageHistory: GLMUsage[] = [];

  /**
   * GLM-4 定价 (2026年)
   * - 0.1元/千tokens (约 $0.014/千tokens)
   */
  private readonly PRICE_PER_1K_TOKENS = 0.014;

  /**
   * 记录单次 API 调用的使用情况
   */
  recordUsage(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): GLMUsage {
    const totalTokens = promptTokens + completionTokens;
    const costUsd = (totalTokens / 1000) * this.PRICE_PER_1K_TOKENS;

    const usage: GLMUsage = {
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      timestamp: new Date().toISOString()
    };

    this.usageHistory.push(usage);

    return usage;
  }

  /**
   * 获取今日累计成本
   */
  getTodayCost(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.usageHistory
      .filter(usage => usage.timestamp.startsWith(today))
      .reduce((sum, usage) => sum + usage.costUsd, 0);
  }

  /**
   * 获取指定时间范围的成本
   */
  getCostInRange(startDate: Date, endDate: Date): number {
    return this.usageHistory
      .filter(usage => {
        const timestamp = new Date(usage.timestamp);
        return timestamp >= startDate && timestamp <= endDate;
      })
      .reduce((sum, usage) => sum + usage.costUsd, 0);
  }

  /**
   * 导出使用记录为 CSV
   */
  exportToCSV(): string {
    const header = "timestamp,model,prompt_tokens,completion_tokens,total_tokens,cost_usd\n";
    const rows = this.usageHistory
      .map(usage => 
        `${usage.timestamp},${usage.model},${usage.promptTokens},${usage.completionTokens},${usage.totalTokens},${usage.costUsd.toFixed(4)}`
      )
      .join('\n');
    return header + rows;
  }

  /**
   * 获取每日成本趋势 (最近 30 天)
   */
  getDailyCostTrend(): { date: string; cost: number }[] {
    const costByDate = new Map<string, number>();

    for (const usage of this.usageHistory) {
      const date = usage.timestamp.split('T')[0];
      costByDate.set(date, (costByDate.get(date) || 0) + usage.costUsd);
    }

    return Array.from(costByDate.entries())
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // 最近 30 天
  }
}

// 全局单例
export const glmCostTracker = new GLMCostTracker();
```

**3.2 集成到 Agent Executor**:

```typescript
// 文件: src/agents/agent-executor.ts

import { glmCostTracker } from '../utils/glm-cost-tracker.js';
import { glmTokensUsed, glmCostUsd } from '../utils/metrics.js';

async function callRealGLM(prompt: string): Promise<string> {
  try {
    const response = await callLLM(prompt);
    
    // 提取 token 使用信息 (从 GLM API 响应中)
    const usage = response.usage || { 
      prompt_tokens: estimateTokens(prompt), 
      completion_tokens: estimateTokens(response.content) 
    };
    
    // 记录到成本追踪器
    const costInfo = glmCostTracker.recordUsage(
      'glm-4',
      usage.prompt_tokens,
      usage.completion_tokens
    );
    
    // 更新 Prometheus 指标
    glmTokensUsed.inc({ model: 'glm-4', type: 'prompt' }, usage.prompt_tokens);
    glmTokensUsed.inc({ model: 'glm-4', type: 'completion' }, usage.completion_tokens);
    glmCostUsd.set({ model: 'glm-4' }, glmCostTracker.getTodayCost());
    
    logger.info({ cost: costInfo.costUsd.toFixed(4), tokens: costInfo.totalTokens }, "GLM API call completed");
    
    return response.content;
  } catch (error) {
    throw error;
  }
}

/**
 * 简单的 token 估算 (中文: 1字 ≈ 1.5 tokens, 英文: 1词 ≈ 1 token)
 */
function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = text.split(/\s+/).filter(w => /[a-zA-Z]/.test(w)).length;
  return Math.ceil(chineseChars * 1.5 + englishWords);
}
```

**3.3 预算告警**:

```typescript
// 文件: src/utils/budget-monitor.ts

import { glmCostTracker } from './glm-cost-tracker.js';
import { logger } from './logger.js';

export interface BudgetConfig {
  dailyLimitUsd: number;
  warningThreshold: number; // 0.0 - 1.0 (例如 0.8 = 80%)
}

export class BudgetMonitor {
  private config: BudgetConfig;
  private alertSent: boolean = false;

  constructor(config: BudgetConfig) {
    this.config = config;
  }

  /**
   * 检查是否超出预算 (每小时运行一次)
   */
  startMonitoring() {
    setInterval(() => {
      const todayCost = glmCostTracker.getTodayCost();
      const percentage = todayCost / this.config.dailyLimitUsd;

      if (percentage >= 1.0) {
        logger.error({ cost: todayCost, limit: this.config.dailyLimitUsd }, "❌ 每日预算超限!");
        // TODO: 可选 - 禁用 GLM API 调用,强制使用 Mock 模式
        // forceMock = true;
      } else if (percentage >= this.config.warningThreshold && !this.alertSent) {
        logger.warn({ cost: todayCost, limit: this.config.dailyLimitUsd, percentage: (percentage * 100).toFixed(1) }, "⚠️ 预算即将耗尽!");
        this.alertSent = true;
        // TODO: 发送邮件/Slack 通知
      }

      // 每天午夜重置告警状态
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.alertSent = false;
      }
    }, 60 * 60 * 1000); // 每小时检查一次
  }
}

// 初始化预算监控 (每日限额 $5)
export const budgetMonitor = new BudgetMonitor({
  dailyLimitUsd: 5.0,
  warningThreshold: 0.8
});
```

**3.4 成本报告 API**:

```typescript
// 文件: src/server.ts

import { glmCostTracker } from './utils/glm-cost-tracker.js';

// 新增 MCP Tool: 查询 GLM 成本
(mcpServer as any).registerTool({
  name: "get_glm_cost_report",
  description: "查询 GLM API 使用成本报告",
  inputSchema: {
    type: "object",
    properties: {
      period: {
        type: "string",
        enum: ["today", "week", "month"],
        description: "查询时间范围"
      }
    }
  }
}, async (input: any) => {
  const period = input.period || "today";
  
  let report: any;
  const now = new Date();
  
  switch (period) {
    case "today":
      report = {
        period: "今日",
        totalCost: glmCostTracker.getTodayCost(),
        trend: glmCostTracker.getDailyCostTrend().slice(-1)
      };
      break;
    case "week":
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      report = {
        period: "最近 7 天",
        totalCost: glmCostTracker.getCostInRange(weekAgo, now),
        trend: glmCostTracker.getDailyCostTrend().slice(-7)
      };
      break;
    case "month":
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      report = {
        period: "最近 30 天",
        totalCost: glmCostTracker.getCostInRange(monthAgo, now),
        trend: glmCostTracker.getDailyCostTrend()
      };
      break;
  }
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify(report, null, 2)
    }]
  };
});
```

**可交付物**:
- ✅ `src/utils/glm-cost-tracker.ts` - 成本追踪类
- ✅ `src/utils/budget-monitor.ts` - 预算监控与告警
- ✅ MCP Tool: `get_glm_cost_report` - 成本报告查询
- ✅ 文档: 成本管理指南 (添加到 `docs/cost-management.md`)

---

### 2.3 验收标准

**功能验收**:
- ✅ Prometheus 成功抓取指标 (访问 http://localhost:9091/targets)
- ✅ Grafana 仪表盘正常显示实时数据
- ✅ GLM 成本追踪准确 (误差 < 5%)
- ✅ 预算告警正常触发

**数据验收**:
- ✅ MCP 请求指标: 请求总数、成功率、P95 延迟
- ✅ Agent 执行指标: 7 个 Agent 的执行时间分布
- ✅ GLM API 指标: 调用次数、Token 使用、成本
- ✅ 工作流指标: 迭代次数、置信度、冲突数

**可视化验收**:
- ✅ Grafana 仪表盘包含至少 5 个关键图表
- ✅ 实时刷新 (15 秒间隔)
- ✅ 支持时间范围选择 (最近 1 小时/24 小时/7 天)

---

### 2.4 运维指南

**启动监控系统**:

```bash
# 1. 启动 MCP Server (暴露 /metrics 端点)
bun run src/server.ts

# 2. 启动监控栈 (Prometheus + Grafana)
docker-compose -f docker-compose.monitoring.yml up -d

# 3. 访问 Grafana 仪表盘
open http://localhost:3001

# 4. 查看 Prometheus 指标
curl http://localhost:9090/metrics
```

**常见问题排查**:

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| Grafana 无数据 | Prometheus 未连接 | 检查 `prometheus.yml` 配置 |
| 成本统计不准 | API 响应缺少 usage 字段 | 启用 token 估算回退 |
| 内存持续增长 | 指标历史数据过多 | 配置 Prometheus 数据保留期 (默认 15 天) |
| 告警未触发 | 预算监控未启动 | 在 `src/server.ts` 中调用 `budgetMonitor.startMonitoring()` |

---

## Phase 2 总结

### 完成标志

- ✅ 并行执行加速比 ≥ 2x
- ✅ Grafana 仪表盘正常运行
- ✅ GLM 成本追踪精度 ≥ 95%
- ✅ 所有测试通过 (包括新增测试)
- ✅ 文档完整 (架构图、监控指南、成本管理)

### 交付清单

**代码文件**:
- `src/workflow/dependency-analyzer.ts` - 依赖分析模块
- `src/workflow/orchestrator.ts` (修改) - 并行执行逻辑
- `src/utils/metrics.ts` - Prometheus 指标定义
- `src/utils/glm-cost-tracker.ts` - 成本追踪
- `src/utils/budget-monitor.ts` - 预算监控
- `src/agents/agent-executor.ts` (修改) - 埋点

**测试文件**:
- `src/workflow/__tests__/dependency-analyzer.test.ts`
- `src/workflow/__tests__/orchestrator-parallel.test.ts`
- `benchmarks/parallel-execution.bench.ts`

**配置文件**:
- `docker/prometheus/prometheus.yml`
- `docker-compose.monitoring.yml`
- `docker/grafana/dashboards/socialguess-overview.json`

**文档**:
- `docs/architecture.md` (新增依赖关系图)
- `docs/monitoring.md` (监控系统使用指南)
- `docs/cost-management.md` (成本管理指南)

### 下一步: Phase 3

完成 Phase 2 后,进入 **Phase 3: 高级功能**,包括:
- 数据库持久化 (SQLite/PostgreSQL)
- 模型分析工具 (diff/对比/可视化)
- 批量处理 (多假设并行推演)

预估工作量: 100-130 小时 (12-16 天)
