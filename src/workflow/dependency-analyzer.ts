/**
 * 依赖图分析模块
 * 
 * 功能:分析 Agent 之间的依赖关系,生成执行波次(Wave)
 * 目标:实现 wave-based 并行执行,提升性能(预期 2-3x 加速)
 * 
 * @module workflow/dependency-analyzer
 */

import type { AgentType } from "../types.js";

/**
 * Agent 依赖关系定义
 * 
 * @property agent - Agent 类型
 * @property dependsOn - 依赖的其他 Agent 列表
 * @property wave - 执行波次(从 1 开始)
 */
export interface AgentDependency {
  agent: AgentType;
  dependsOn: AgentType[];
  wave: number;
}

/**
 * Wave 执行指标
 * 
 * 用于追踪每个 Wave 的性能数据
 * 
 * @property wave - Wave 编号
 * @property agents - 该 Wave 包含的 Agent 列表
 * @property startTime - 开始执行时间(ms)
 * @property endTime - 结束执行时间(ms)
 * @property duration - 执行耗时(ms)
 * @property parallel - 是否并行执行
 */
export interface WaveExecutionMetrics {
  wave: number;
  agents: AgentType[];
  startTime: number;
  endTime?: number;
  duration?: number;
  parallel: boolean;
}

/**
 * 执行计划
 * 
 * @property waves - Wave 列表(按执行顺序)
 * @property dependencies - 完整的依赖图
 * @property metrics - 性能指标(执行后填充)
 */
export interface ExecutionPlan {
  waves: WaveExecutionMetrics[];
  dependencies: Map<AgentType, AgentDependency>;
  metrics: Map<number, WaveExecutionMetrics>;
}

/**
 * 基础 Agent 依赖规则(12 Agent 系统)
 *
 * Wave 1: systems, econ, socio (无依赖,可并行)
 * Wave 2: governance, culture, risk (依赖 Wave 1)
 * Wave 3: 空 (12 Agent模式中的gap)
 * Wave 4: environmental, demographic, infrastructure (依赖 Wave 1-2)
 * Wave 5: technology, historical (依赖 Wave 4)
 * Wave 6: validation (依赖 Wave 1-5)
 */
const BASE_AGENT_DEPENDENCIES: Partial<Record<AgentType, AgentDependency>> = {
  systems: { agent: "systems", dependsOn: [], wave: 1 },
  econ: { agent: "econ", dependsOn: [], wave: 1 },
  socio: { agent: "socio", dependsOn: [], wave: 1 },
  governance: { agent: "governance", dependsOn: ["systems", "econ", "socio"], wave: 2 },
  culture: { agent: "culture", dependsOn: ["systems", "econ", "socio"], wave: 2 },
  risk: { agent: "risk", dependsOn: ["systems", "econ", "socio"], wave: 2 },
  environmental: { agent: "environmental", dependsOn: ["systems", "econ", "socio", "governance"], wave: 4 },
  demographic: { agent: "demographic", dependsOn: ["systems", "econ", "socio", "culture"], wave: 4 },
  infrastructure: { agent: "infrastructure", dependsOn: ["systems", "econ", "socio"], wave: 4 },
  technology: { agent: "technology", dependsOn: ["systems", "econ", "socio"], wave: 5 },
  historical: { agent: "historical", dependsOn: ["systems", "econ", "socio"], wave: 5 },
  validation: { agent: "validation", dependsOn: ["systems", "econ", "socio", "governance", "culture", "risk", "environmental", "demographic", "infrastructure", "technology", "historical"], wave: 6 }
};

/**
 * 构建 Agent 依赖图
 *
 * @param agents - 需要执行的 Agent 列表
 * @param useExtended - 是否使用12 Agent模式（默认7 Agent模式）
 * @returns 完整的依赖图
 */
export function buildDependencyGraph(agents: AgentType[], useExtended: boolean = false): Map<AgentType, AgentDependency> {
  const dependencies = new Map<AgentType, AgentDependency>();
  const agentSet = new Set(agents);

  for (const agent of agents) {
    const dependency = BASE_AGENT_DEPENDENCIES[agent];
    if (!dependency) {
      throw new Error(`Unknown agent type: ${agent}`);
    }

    // 过滤依赖,只包含在当前执行计划中的 Agent
    const filteredDependsOn = dependency.dependsOn.filter(dep => agentSet.has(dep));

    // 根据模式重新编号wave
    let wave = dependency.wave;
    if (useExtended) {
      // 12 Agent模式: 直接使用BASE_AGENT_DEPENDENCIES中的wave编号(1-6)
      wave = wave;
    } else {
      // 7 Agent模式: 重新映射wave 1,2,4,5,6 -> 1,2,3 (只有base agents: wave 1,2,6)
      if (wave === 1 || wave === 2) {
        wave = wave;
      } else if (wave === 4 || wave === 5 || wave === 6) {
        wave = 3;
      }
    }

    dependencies.set(agent, {
      agent,
      dependsOn: filteredDependsOn,
      wave
    });
  }

  return dependencies;
}

/**
 * 解析执行波次
 *
 * 根据 Agent 依赖关系,将 Agent 分组为多个 Wave
 * 同一波次的 Agent 可以并行执行,不同 Wave 顺序执行
 *
 * @param agents - 需要执行的 Agent 列表
 * @param useExtended - 是否使用12 Agent模式（默认7 Agent模式）
 * @returns 执行计划(包含 Waves 和依赖图)
 */
export function resolveExecutionWaves(agents: AgentType[], useExtended: boolean = false): ExecutionPlan {
  const dependencies = buildDependencyGraph(agents, useExtended);

  // 按 Wave 分组
  const waveGroups = new Map<number, AgentType[]>();

  for (const [agentType, dependency] of dependencies) {
    const wave = dependency.wave;
    if (!waveGroups.has(wave)) {
      waveGroups.set(wave, []);
    }
    waveGroups.get(wave)!.push(agentType);
  }

  // 12 Agent模式: 需要保留空Wave 3，所以不能重新编号
  const waves: WaveExecutionMetrics[] = [];

  if (useExtended) {
    // 12 Agent模式: 直接按wave编号1-6生成，Wave 3为空
    for (let waveNum = 1; waveNum <= 6; waveNum++) {
      const waveAgents = waveGroups.get(waveNum) || [];

      const parallel = waveAgents.length > 1;

      waves.push({
        wave: waveNum,
        agents: waveAgents,
        startTime: 0,
        parallel
      });
    }
  } else {
    // 7 Agent模式: 重新编号为连续的 1, 2, 3...
    const sortedWaveNumbers = Array.from(waveGroups.keys()).sort((a, b) => a - b);
    let newWaveNum = 1;

    for (const originalWaveNum of sortedWaveNumbers) {
      const waveAgents = waveGroups.get(originalWaveNum)!;

      const parallel = waveAgents.length > 1;

      waves.push({
        wave: newWaveNum,
        agents: waveAgents,
        startTime: 0,
        parallel
      });

      newWaveNum++;
    }
  }

  return {
    waves,
    dependencies,
    metrics: new Map<number, WaveExecutionMetrics>()
  };
}

/**
 * 检测循环依赖
 * 
 * 拓扑排序中不应存在循环依赖,否则无法确定执行顺序
 * 
 * @param dependencies - 依赖图
 * @returns 是否存在循环依赖
 */
export function detectCircularDependencies(dependencies: Map<AgentType, AgentDependency>): boolean {
  const visited = new Set<AgentType>();
  const recursionStack = new Set<AgentType>();

  function hasCycle(agent: AgentType): boolean {
    if (recursionStack.has(agent)) {
      return true;
    }
    if (visited.has(agent)) {
      return false;
    }

    visited.add(agent);
    recursionStack.add(agent);

    const dependency = dependencies.get(agent);
    if (dependency) {
      for (const dep of dependency.dependsOn) {
        if (hasCycle(dep)) {
          return true;
        }
      }
    }

    recursionStack.delete(agent);
    return false;
  }

  for (const agent of dependencies.keys()) {
    if (hasCycle(agent)) {
      return true;
    }
  }

  return false;
}

/**
 * 计算理论最小执行时间
 * 
 * 假设:
 * - 单个 Agent 执行时间 = 3s
 * - Wave 内并行执行(耗时 = max(单个 Agent 耗时))
 * - Wave 顺序执行(总耗时 = sum(Wave 耗时))
 * 
 * @param plan - 执行计划
 * @param singleAgentTimeMs - 单个 Agent 平均执行时间(默认 3000ms)
 * @returns 理论最小执行时间(ms)
 */
export function calculateMinExecutionTime(
  plan: ExecutionPlan,
  singleAgentTimeMs: number = 3000
): number {
  return plan.waves.reduce((total, wave) => {
    // Wave 内并行,耗时 = max(单个 Agent 耗时)
    // 但实际 Wave 内 Agent 数量较少,可近似为 singleAgentTimeMs
    const waveTime = singleAgentTimeMs; // 简化模型,假设 Wave 内耗时相同
    return total + waveTime;
  }, 0);
}

/**
 * 计算并行加速比
 * 
 * 加速比 = 顺序执行时间 / 并行执行时间
 * 
 * @param plan - 执行计划
 * @param singleAgentTimeMs - 单个 Agent 平均执行时间(默认 3000ms)
 * @returns 加速比(>1 表示加速)
 */
export function calculateSpeedup(
  plan: ExecutionPlan,
  singleAgentTimeMs: number = 3000
): number {
  const parallelTime = calculateMinExecutionTime(plan, singleAgentTimeMs);
  const sequentialTime = plan.dependencies.size * singleAgentTimeMs;
  
  return sequentialTime / parallelTime;
}

/**
 * 记录 Wave 开始时间
 * 
 * @param plan - 执行计划
 * @param wave - Wave 编号
 */
export function recordWaveStart(plan: ExecutionPlan, wave: number): void {
  const waveMetrics = plan.waves.find(w => w.wave === wave);
  if (!waveMetrics) {
    throw new Error(`Wave ${wave} not found in execution plan`);
  }

  waveMetrics.startTime = Date.now();
}

/**
 * 记录 Wave 结束时间
 * 
 * @param plan - 执行计划
 * @param wave - Wave 编号
 */
export function recordWaveEnd(plan: ExecutionPlan, wave: number): void {
  const waveMetrics = plan.waves.find(w => w.wave === wave);
  if (!waveMetrics) {
    throw new Error(`Wave ${wave} not found in execution plan`);
  }

  waveMetrics.endTime = Date.now();
  waveMetrics.duration = waveMetrics.endTime - waveMetrics.startTime;

  // 保存到 metrics map
  plan.metrics.set(wave, { ...waveMetrics });
}

/**
 * 生成执行计划摘要
 * 
 * @param plan - 执行计划
 * @returns 格式化的字符串摘要
 */
export function summarizeExecutionPlan(plan: ExecutionPlan): string {
  const lines: string[] = [];
  lines.push("=== Execution Plan Summary ===");
  lines.push(`Total Waves: ${plan.waves.length}`);
  lines.push(`Total Agents: ${plan.dependencies.size}`);
  lines.push("");

  for (const wave of plan.waves) {
    lines.push(`Wave ${wave.wave} (${wave.parallel ? "Parallel" : "Sequential"}):`);
    lines.push(`  Agents: ${wave.agents.join(", ")}`);
    if (wave.duration !== undefined) {
      lines.push(`  Duration: ${wave.duration}ms`);
    }
    lines.push("");
  }

  const speedup = calculateSpeedup(plan);
  lines.push(`Theoretical Speedup: ${speedup.toFixed(2)}x`);

  return lines.join("\n");
}

/**
 * 导出测试辅助函数
 */
export const __test__ = {
  buildDependencyGraph,
  resolveExecutionWaves,
  detectCircularDependencies,
  calculateMinExecutionTime,
  calculateSpeedup,
  recordWaveStart,
  recordWaveEnd
};
