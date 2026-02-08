# Phase 3 执行计划：高级功能

**项目**: SocialGuessSkills
**创建时间**: 2026-02-07
**优先级**: P2 - 中等优先级
**预估工作量**: 100-130 小时 (12-16 天)
**前置条件**: Phase 2 完成 (并行执行 + 监控系统)

---

## 执行概览

Phase 3 聚焦于**数据持久化**、**模型分析**和**批量处理**,将系统从"一次性推演"升级为"可追溯、可对比的研究平台"。

**三大任务**:

1. **数据库持久化** (14-20小时) - SQLite 存储模型历史,支持版本管理与查询
2. **模型分析工具** (62-80小时) - 模型对比、敏感性分析、交互式可视化
3. **批量处理系统** (24-34小时) - 多假设并行推演,支持参数扫描与场景对比

**核心目标**: 将 SocialGuessSkills 从"单次推演工具"升级为"社会体系研究平台",支持迭代式研究与多场景对比分析。

---

## 任务 1: 数据库持久化

### 1.1 背景与价值

**当前状态**:
- 模型仅存在于内存,进程结束后丢失
- 无法追溯历史推演结果
- 无法对比不同假设下的模型差异

**持久化目标**:
- 所有模型自动保存到数据库
- 支持按假设、时间、置信度查询
- 版本管理: 同一假设的多次推演可对比

**业务价值**:
- **研究可追溯**: 实验记录永久保存
- **迭代优化**: 对比多次推演结果,持续改进假设
- **知识积累**: 构建假设-模型数据库,发现规律

---

### 1.2 技术方案

#### 步骤 1: SQLite 数据库设计 (4-6 小时)

**目标**: 设计 Schema,满足模型存储与查询需求

**1.1.1 Schema 设计**:

```sql
-- 文件: src/database/schema.sql

-- 假设表 (存储输入假设)
CREATE TABLE hypotheses (
  id TEXT PRIMARY KEY,                   -- UUID
  assumptions TEXT NOT NULL,             -- JSON 数组
  constraints TEXT NOT NULL,             -- JSON 数组
  goals TEXT NOT NULL,                   -- JSON 数组
  created_at INTEGER NOT NULL,           -- UNIX 时间戳 (毫秒)
  hash TEXT NOT NULL                     -- 假设内容的 SHA-256 哈希 (用于去重)
);

CREATE INDEX idx_hypothesis_hash ON hypotheses(hash);
CREATE INDEX idx_hypothesis_created_at ON hypotheses(created_at);

-- 模型表 (存储推演结果)
CREATE TABLE models (
  id TEXT PRIMARY KEY,                   -- UUID
  hypothesis_id TEXT NOT NULL,           -- 外键: hypotheses.id
  agent_outputs TEXT NOT NULL,           -- JSON 数组 (7个Agent的输出)
  conflicts TEXT NOT NULL,               -- JSON 数组 (检测到的冲突)
  structure TEXT NOT NULL,               -- JSON 对象 (9层结构化模型)
  metadata TEXT NOT NULL,                -- JSON 对象 (迭代次数/置信度/生成时间)
  created_at INTEGER NOT NULL,           -- UNIX 时间戳 (毫秒)
  
  FOREIGN KEY (hypothesis_id) REFERENCES hypotheses(id) ON DELETE CASCADE
);

CREATE INDEX idx_model_hypothesis_id ON models(hypothesis_id);
CREATE INDEX idx_model_created_at ON models(created_at);
CREATE INDEX idx_model_confidence ON models(json_extract(metadata, '$.confidence'));

-- 工作流执行日志表 (可选 - 用于调试)
CREATE TABLE workflow_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT NOT NULL,                -- 外键: models.id
  iteration INTEGER NOT NULL,            -- 当前迭代次数
  wave INTEGER,                          -- 波次 (如果使用并行执行)
  agent_type TEXT NOT NULL,              -- Agent 类型
  execution_time_ms INTEGER NOT NULL,    -- 执行时间 (毫秒)
  status TEXT NOT NULL,                  -- success/error
  error_message TEXT,                    -- 错误信息 (如果有)
  created_at INTEGER NOT NULL,           -- UNIX 时间戳 (毫秒)
  
  FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
);

CREATE INDEX idx_workflow_log_model_id ON workflow_logs(model_id);
CREATE INDEX idx_workflow_log_agent_type ON workflow_logs(agent_type);
```

**设计要点**:

1. **假设去重**: 使用 `hash` 字段存储假设内容的哈希值,避免重复存储相同假设
2. **外键约束**: `models.hypothesis_id` 引用 `hypotheses.id`,支持级联删除
3. **JSON 字段**: 使用 SQLite 的 JSON 函数查询嵌套数据 (例如 `json_extract(metadata, '$.confidence')`)
4. **索引优化**: 对常用查询字段建立索引 (假设哈希、创建时间、置信度)
5. **工作流日志**: 可选表,用于性能分析与调试 (记录每个 Agent 的执行时间)

**可交付物**:
- ✅ `src/database/schema.sql` - 数据库 Schema 定义

---

#### 步骤 2: ORM 集成 (Bun SQLite) (6-8 小时)

**目标**: 使用 Bun 内置的 `bun:sqlite` 模块操作数据库

**2.1 数据库连接管理**:

```typescript
// 文件: src/database/connection.ts

import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';

let db: Database | null = null;

/**
 * 获取数据库连接 (单例模式)
 */
export function getDatabase(): Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || './data/socialguess.db';
  
  // 确保 data 目录存在
  const dataDir = join(process.cwd(), 'data');
  if (!require('fs').existsSync(dataDir)) {
    require('fs').mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath, { create: true });
  logger.info({ path: dbPath }, "Database connected");

  // 初始化 Schema (如果表不存在)
  initializeSchema(db);

  return db;
}

/**
 * 初始化数据库 Schema
 */
function initializeSchema(db: Database) {
  const schemaPath = join(process.cwd(), 'src', 'database', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // 检查表是否已存在
  const tableExists = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='models'").get();
  
  if (!tableExists) {
    logger.info("Initializing database schema...");
    db.exec(schema);
    logger.info("✓ Database schema initialized");
  }
}

/**
 * 关闭数据库连接
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    logger.info("Database connection closed");
  }
}
```

**2.2 Repository 模式 (数据访问层)**:

```typescript
// 文件: src/database/repositories/hypothesis-repository.ts

import type { Hypothesis } from '../../types';
import { getDatabase } from '../connection.js';
import { createHash } from 'crypto';
import { randomUUID } from 'crypto';

export interface HypothesisRecord {
  id: string;
  assumptions: string;
  constraints: string;
  goals: string;
  created_at: number;
  hash: string;
}

export class HypothesisRepository {
  /**
   * 计算假设的哈希值 (用于去重)
   */
  private computeHash(hypothesis: Hypothesis): string {
    const content = JSON.stringify({
      assumptions: hypothesis.assumptions.sort(),
      constraints: hypothesis.constraints.sort(),
      goals: hypothesis.goals.sort()
    });
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * 保存假设 (如果已存在则返回现有记录)
   */
  save(hypothesis: Hypothesis): string {
    const db = getDatabase();
    const hash = this.computeHash(hypothesis);

    // 检查是否已存在
    const existing = db.query<HypothesisRecord, [string]>(
      "SELECT id FROM hypotheses WHERE hash = ?"
    ).get(hash);

    if (existing) {
      return existing.id;
    }

    // 插入新记录
    const id = randomUUID();
    db.query(
      `INSERT INTO hypotheses (id, assumptions, constraints, goals, created_at, hash) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      JSON.stringify(hypothesis.assumptions),
      JSON.stringify(hypothesis.constraints),
      JSON.stringify(hypothesis.goals),
      Date.now(),
      hash
    );

    return id;
  }

  /**
   * 根据 ID 查询假设
   */
  findById(id: string): Hypothesis | null {
    const db = getDatabase();
    const record = db.query<HypothesisRecord, [string]>(
      "SELECT * FROM hypotheses WHERE id = ?"
    ).get(id);

    if (!record) return null;

    return {
      assumptions: JSON.parse(record.assumptions),
      constraints: JSON.parse(record.constraints),
      goals: JSON.parse(record.goals)
    };
  }

  /**
   * 根据哈希值查询假设
   */
  findByHash(hash: string): HypothesisRecord | null {
    const db = getDatabase();
    return db.query<HypothesisRecord, [string]>(
      "SELECT * FROM hypotheses WHERE hash = ?"
    ).get(hash);
  }

  /**
   * 查询所有假设 (分页)
   */
  findAll(limit: number = 50, offset: number = 0): HypothesisRecord[] {
    const db = getDatabase();
    return db.query<HypothesisRecord, [number, number]>(
      "SELECT * FROM hypotheses ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).all(limit, offset);
  }
}
```

```typescript
// 文件: src/database/repositories/model-repository.ts

import type { SocialSystemModel } from '../../types';
import { getDatabase } from '../connection.js';
import { randomUUID } from 'crypto';

export interface ModelRecord {
  id: string;
  hypothesis_id: string;
  agent_outputs: string;
  conflicts: string;
  structure: string;
  metadata: string;
  created_at: number;
}

export class ModelRepository {
  /**
   * 保存模型
   */
  save(hypothesisId: string, model: SocialSystemModel): string {
    const db = getDatabase();
    const id = randomUUID();

    db.query(
      `INSERT INTO models (id, hypothesis_id, agent_outputs, conflicts, structure, metadata, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      hypothesisId,
      JSON.stringify(model.agentOutputs),
      JSON.stringify(model.conflicts),
      JSON.stringify(model.structure),
      JSON.stringify(model.metadata),
      Date.now()
    );

    return id;
  }

  /**
   * 根据 ID 查询模型
   */
  findById(id: string): SocialSystemModel | null {
    const db = getDatabase();
    const record = db.query<ModelRecord, [string]>(
      "SELECT * FROM models WHERE id = ?"
    ).get(id);

    if (!record) return null;

    return this.recordToModel(record);
  }

  /**
   * 根据假设 ID 查询所有模型 (按创建时间倒序)
   */
  findByHypothesisId(hypothesisId: string): SocialSystemModel[] {
    const db = getDatabase();
    const records = db.query<ModelRecord, [string]>(
      "SELECT * FROM models WHERE hypothesis_id = ? ORDER BY created_at DESC"
    ).all(hypothesisId);

    return records.map(record => this.recordToModel(record));
  }

  /**
   * 查询所有模型 (分页)
   */
  findAll(limit: number = 50, offset: number = 0): SocialSystemModel[] {
    const db = getDatabase();
    const records = db.query<ModelRecord, [number, number]>(
      "SELECT * FROM models ORDER BY created_at DESC LIMIT ? OFFSET ?"
    ).all(limit, offset);

    return records.map(record => this.recordToModel(record));
  }

  /**
   * 根据置信度范围查询模型
   */
  findByConfidenceRange(min: number, max: number): SocialSystemModel[] {
    const db = getDatabase();
    const records = db.query<ModelRecord, [number, number]>(
      `SELECT * FROM models 
       WHERE json_extract(metadata, '$.confidence') BETWEEN ? AND ? 
       ORDER BY created_at DESC`
    ).all(min, max);

    return records.map(record => this.recordToModel(record));
  }

  /**
   * 统计: 总模型数
   */
  count(): number {
    const db = getDatabase();
    const result = db.query<{ count: number }, []>(
      "SELECT COUNT(*) as count FROM models"
    ).get();
    return result?.count || 0;
  }

  /**
   * 转换数据库记录为模型对象
   */
  private recordToModel(record: ModelRecord): SocialSystemModel {
    return {
      hypothesis: { assumptions: [], constraints: [], goals: [] }, // 需要 JOIN hypotheses 表
      agentOutputs: JSON.parse(record.agent_outputs),
      conflicts: JSON.parse(record.conflicts),
      structure: JSON.parse(record.structure),
      metadata: JSON.parse(record.metadata)
    };
  }

  /**
   * 删除模型
   */
  deleteById(id: string): boolean {
    const db = getDatabase();
    const result = db.query("DELETE FROM models WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
```

**可交付物**:
- ✅ `src/database/connection.ts` - 数据库连接管理
- ✅ `src/database/repositories/hypothesis-repository.ts` - 假设数据访问层
- ✅ `src/database/repositories/model-repository.ts` - 模型数据访问层

---

#### 步骤 3: 集成到工作流 (4-6 小时)

**目标**: 在 `orchestrator.ts` 中自动保存模型到数据库

**3.1 修改 `runWorkflow` 函数**:

```typescript
// 文件: src/workflow/orchestrator.ts

import { HypothesisRepository } from '../database/repositories/hypothesis-repository.js';
import { ModelRepository } from '../database/repositories/model-repository.js';

const hypothesisRepo = new HypothesisRepository();
const modelRepo = new ModelRepository();

export async function runWorkflow(
  hypothesis: Hypothesis,
  options: WorkflowConfig = {}
): Promise<SocialSystemModel> {
  // ... 工作流执行逻辑 ...

  // 在生成模型后,保存到数据库
  const model = await step4_SynthesizeModel(hypothesis, state);
  await step5_ValidateModel(model, state);

  // 保存到数据库
  try {
    const hypothesisId = hypothesisRepo.save(hypothesis);
    const modelId = modelRepo.save(hypothesisId, model);
    
    logger.info({ hypothesisId, modelId }, "✓ 模型已保存到数据库");
    
    // 可选: 将 modelId 添加到模型元数据中
    model.metadata.modelId = modelId;
    model.metadata.hypothesisId = hypothesisId;
  } catch (error) {
    logger.error({ err: String(error) }, "✗ 模型保存失败");
    // 不中断工作流,仅记录错误
  }

  return model;
}
```

**3.2 新增 MCP Tool: 查询历史模型**:

```typescript
// 文件: src/server.ts

import { HypothesisRepository } from './database/repositories/hypothesis-repository.js';
import { ModelRepository } from './database/repositories/model-repository.js';

const hypothesisRepo = new HypothesisRepository();
const modelRepo = new ModelRepository();

// Tool: 查询模型历史
(mcpServer as any).registerTool({
  name: "query_model_history",
  description: "查询已保存的模型历史记录",
  inputSchema: {
    type: "object",
    properties: {
      hypothesisId: {
        type: "string",
        description: "假设 ID (可选,查询特定假设的所有模型)"
      },
      confidenceMin: {
        type: "number",
        description: "最小置信度 (可选,范围 0-1)",
        minimum: 0,
        maximum: 1
      },
      confidenceMax: {
        type: "number",
        description: "最大置信度 (可选,范围 0-1)",
        minimum: 0,
        maximum: 1
      },
      limit: {
        type: "number",
        description: "返回记录数 (默认 10)",
        default: 10
      }
    }
  }
}, async (input: any) => {
  let models: SocialSystemModel[];

  if (input.hypothesisId) {
    models = modelRepo.findByHypothesisId(input.hypothesisId);
  } else if (input.confidenceMin !== undefined && input.confidenceMax !== undefined) {
    models = modelRepo.findByConfidenceRange(input.confidenceMin, input.confidenceMax);
  } else {
    models = modelRepo.findAll(input.limit || 10);
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        total: models.length,
        models: models.map(model => ({
          id: model.metadata.modelId,
          hypothesisId: model.metadata.hypothesisId,
          confidence: model.metadata.confidence,
          iterations: model.metadata.iterations,
          conflicts: model.conflicts.length,
          generatedAt: model.metadata.generatedAt
        }))
      }, null, 2)
    }]
  };
});

// Tool: 获取模型详情
(mcpServer as any).registerTool({
  name: "get_model_by_id",
  description: "根据 ID 获取模型完整内容",
  inputSchema: {
    type: "object",
    properties: {
      modelId: {
        type: "string",
        description: "模型 ID"
      }
    },
    required: ["modelId"]
  }
}, async (input: any) => {
  const model = modelRepo.findById(input.modelId);

  if (!model) {
    throw new Error(`Model not found: ${input.modelId}`);
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify(model, null, 2)
    }]
  };
});
```

**可交付物**:
- ✅ 集成到 `src/workflow/orchestrator.ts` - 自动保存模型
- ✅ MCP Tools: `query_model_history`, `get_model_by_id` - 查询历史记录

---

### 1.3 验收标准

**功能验收**:
- ✅ 模型推演后自动保存到数据库
- ✅ 相同假设不会重复存储 (哈希去重)
- ✅ 支持查询历史模型 (按假设、置信度、时间)
- ✅ MCP Tools 正常工作

**数据验收**:
- ✅ 数据库文件位于 `./data/socialguess.db`
- ✅ 所有 JSON 字段可正确解析
- ✅ 查询性能: 10万条记录下响应时间 < 100ms

**测试用例**:

```typescript
// 文件: src/database/__tests__/repositories.test.ts

import { describe, expect, test, beforeEach, afterAll } from 'bun:test';
import { HypothesisRepository } from '../repositories/hypothesis-repository';
import { ModelRepository } from '../repositories/model-repository';
import { getDatabase, closeDatabase } from '../connection';

describe('Hypothesis Repository', () => {
  const repo = new HypothesisRepository();

  test('应保存假设并返回 ID', () => {
    const hypothesis = {
      assumptions: ["测试假设"],
      constraints: [],
      goals: ["测试目标"]
    };

    const id = repo.save(hypothesis);
    expect(id).toBeDefined();
    expect(id.length).toBe(36); // UUID 长度
  });

  test('相同假设应返回相同 ID (去重)', () => {
    const hypothesis = {
      assumptions: ["去重测试"],
      constraints: [],
      goals: ["去重目标"]
    };

    const id1 = repo.save(hypothesis);
    const id2 = repo.save(hypothesis);
    expect(id1).toBe(id2);
  });

  test('应根据 ID 查询假设', () => {
    const hypothesis = {
      assumptions: ["查询测试"],
      constraints: [],
      goals: ["查询目标"]
    };

    const id = repo.save(hypothesis);
    const retrieved = repo.findById(id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.assumptions).toEqual(hypothesis.assumptions);
  });
});

describe('Model Repository', () => {
  const hypothesisRepo = new HypothesisRepository();
  const modelRepo = new ModelRepository();

  test('应保存模型并返回 ID', () => {
    const hypothesis = {
      assumptions: ["模型测试"],
      constraints: [],
      goals: ["模型目标"]
    };

    const hypothesisId = hypothesisRepo.save(hypothesis);

    const model = {
      hypothesis,
      agentOutputs: [],
      conflicts: [],
      structure: {} as any,
      metadata: {
        iterations: 1,
        confidence: 0.8,
        generatedAt: new Date().toISOString()
      }
    };

    const modelId = modelRepo.save(hypothesisId, model);
    expect(modelId).toBeDefined();
  });

  test('应根据假设 ID 查询所有模型', () => {
    const hypothesis = {
      assumptions: ["批量查询测试"],
      constraints: [],
      goals: ["批量查询目标"]
    };

    const hypothesisId = hypothesisRepo.save(hypothesis);

    // 保存 3 个模型
    for (let i = 0; i < 3; i++) {
      const model = {
        hypothesis,
        agentOutputs: [],
        conflicts: [],
        structure: {} as any,
        metadata: {
          iterations: i + 1,
          confidence: 0.7 + i * 0.1,
          generatedAt: new Date().toISOString()
        }
      };
      modelRepo.save(hypothesisId, model);
    }

    const models = modelRepo.findByHypothesisId(hypothesisId);
    expect(models.length).toBe(3);
  });

  test('应根据置信度范围查询模型', () => {
    // 保存不同置信度的模型
    const hypothesis = {
      assumptions: ["置信度测试"],
      constraints: [],
      goals: ["置信度目标"]
    };

    const hypothesisId = hypothesisRepo.save(hypothesis);

    [0.6, 0.75, 0.9].forEach(confidence => {
      const model = {
        hypothesis,
        agentOutputs: [],
        conflicts: [],
        structure: {} as any,
        metadata: {
          iterations: 1,
          confidence,
          generatedAt: new Date().toISOString()
        }
      };
      modelRepo.save(hypothesisId, model);
    });

    // 查询置信度在 0.7-0.8 之间的模型
    const models = modelRepo.findByConfidenceRange(0.7, 0.8);
    expect(models.length).toBe(1);
    expect(models[0].metadata.confidence).toBe(0.75);
  });

  afterAll(() => {
    closeDatabase();
  });
});
```

---

## 任务 2: 模型分析工具

### 2.1 背景与价值

**当前状态**:
- 模型生成后仅可查看 JSON
- 无法对比不同假设/迭代的模型差异
- 缺乏交互式可视化工具

**分析工具目标**:
- **模型对比**: 高亮差异,识别关键变化
- **敏感性分析**: 参数扫描,评估假设影响
- **交互式可视化**: 9 层结构图形化展示,支持缩放/过滤

**业务价值**:
- **研究效率**: 快速识别模型间的差异与趋势
- **决策支持**: 可视化帮助非技术用户理解模型
- **知识发现**: 通过对比分析发现隐藏规律

---

### 2.2 技术方案

#### 步骤 1: 模型 Diff 算法 (12-16 小时)

**目标**: 实现结构化模型的差异对比算法

**1.1 核心算法设计**:

```typescript
// 文件: src/analysis/model-diff.ts

import type { SocialSystemModel, SystemStructure } from '../types';

export interface ModelDiff {
  summary: {
    totalChanges: number;
    addedFields: number;
    removedFields: number;
    modifiedFields: number;
  };
  agentOutputDiffs: AgentOutputDiff[];
  conflictsDiff: ConflictsDiff;
  structureDiff: StructureDiff;
  metadataDiff: MetadataDiff;
}

export interface AgentOutputDiff {
  agentType: string;
  changes: {
    conclusion: TextDiff | null;
    evidence: ArrayDiff<string>;
    risks: ArrayDiff<string>;
    suggestions: ArrayDiff<string>;
    falsifiable: TextDiff | null;
  };
}

export interface TextDiff {
  old: string;
  new: string;
  similarity: number; // 0-1, Levenshtein 相似度
}

export interface ArrayDiff<T> {
  added: T[];
  removed: T[];
  unchanged: T[];
}

export interface ConflictsDiff {
  added: string[]; // 新增冲突描述
  removed: string[]; // 解决的冲突描述
  unchanged: string[];
}

export interface StructureDiff {
  overall: LayerDiff;
  workflow: LayerDiff;
  institutions: LayerDiff;
  governance: LayerDiff;
  culture: LayerDiff;
  innovation: LayerDiff;
  risks: LayerDiff;
  metrics: LayerDiff;
  optimization: LayerDiff;
}

export interface LayerDiff {
  layerName: string;
  changes: Record<string, ArrayDiff<string>>; // 每个字段的数组差异
}

export interface MetadataDiff {
  iterations: { old: number; new: number; delta: number };
  confidence: { old: number; new: number; delta: number };
  generatedAt: { old: string; new: string };
}

/**
 * 对比两个模型,生成差异报告
 */
export function diffModels(modelA: SocialSystemModel, modelB: SocialSystemModel): ModelDiff {
  return {
    summary: computeSummary(modelA, modelB),
    agentOutputDiffs: diffAgentOutputs(modelA.agentOutputs, modelB.agentOutputs),
    conflictsDiff: diffConflicts(modelA.conflicts, modelB.conflicts),
    structureDiff: diffStructure(modelA.structure, modelB.structure),
    metadataDiff: diffMetadata(modelA.metadata, modelB.metadata)
  };
}

/**
 * 计算总体变化统计
 */
function computeSummary(modelA: SocialSystemModel, modelB: SocialSystemModel): ModelDiff['summary'] {
  let totalChanges = 0;
  let addedFields = 0;
  let removedFields = 0;
  let modifiedFields = 0;

  // Agent 输出变化
  for (const agentA of modelA.agentOutputs) {
    const agentB = modelB.agentOutputs.find(a => a.agentType === agentA.agentType);
    if (!agentB) continue;

    if (agentA.conclusion !== agentB.conclusion) modifiedFields++;
    if (agentA.falsifiable !== agentB.falsifiable) modifiedFields++;

    const evidenceDiff = diffArray(agentA.evidence, agentB.evidence);
    addedFields += evidenceDiff.added.length;
    removedFields += evidenceDiff.removed.length;

    const risksDiff = diffArray(agentA.risks, agentB.risks);
    addedFields += risksDiff.added.length;
    removedFields += risksDiff.removed.length;

    const suggestionsDiff = diffArray(agentA.suggestions, agentB.suggestions);
    addedFields += suggestionsDiff.added.length;
    removedFields += suggestionsDiff.removed.length;
  }

  // 冲突变化
  const conflictDiff = diffConflicts(modelA.conflicts, modelB.conflicts);
  addedFields += conflictDiff.added.length;
  removedFields += conflictDiff.removed.length;

  totalChanges = addedFields + removedFields + modifiedFields;

  return { totalChanges, addedFields, removedFields, modifiedFields };
}

/**
 * 对比 Agent 输出
 */
function diffAgentOutputs(outputsA: any[], outputsB: any[]): AgentOutputDiff[] {
  const diffs: AgentOutputDiff[] = [];

  for (const agentA of outputsA) {
    const agentB = outputsB.find(a => a.agentType === agentA.agentType);
    if (!agentB) continue;

    diffs.push({
      agentType: agentA.agentType,
      changes: {
        conclusion: agentA.conclusion !== agentB.conclusion
          ? { old: agentA.conclusion, new: agentB.conclusion, similarity: computeSimilarity(agentA.conclusion, agentB.conclusion) }
          : null,
        evidence: diffArray(agentA.evidence, agentB.evidence),
        risks: diffArray(agentA.risks, agentB.risks),
        suggestions: diffArray(agentA.suggestions, agentB.suggestions),
        falsifiable: agentA.falsifiable !== agentB.falsifiable
          ? { old: agentA.falsifiable, new: agentB.falsifiable, similarity: computeSimilarity(agentA.falsifiable, agentB.falsifiable) }
          : null
      }
    });
  }

  return diffs;
}

/**
 * 对比数组 (集合差异)
 */
function diffArray<T>(arrayA: T[], arrayB: T[]): ArrayDiff<T> {
  const setA = new Set(arrayA);
  const setB = new Set(arrayB);

  const added = arrayB.filter(item => !setA.has(item));
  const removed = arrayA.filter(item => !setB.has(item));
  const unchanged = arrayA.filter(item => setB.has(item));

  return { added, removed, unchanged };
}

/**
 * 对比冲突
 */
function diffConflicts(conflictsA: any[], conflictsB: any[]): ConflictsDiff {
  const descriptionsA = conflictsA.map(c => c.description);
  const descriptionsB = conflictsB.map(c => c.description);

  const diff = diffArray(descriptionsA, descriptionsB);

  return {
    added: diff.added,
    removed: diff.removed,
    unchanged: diff.unchanged
  };
}

/**
 * 对比 9 层结构
 */
function diffStructure(structureA: SystemStructure, structureB: SystemStructure): StructureDiff {
  const layers = ['overall', 'workflow', 'institutions', 'governance', 'culture', 'innovation', 'risks', 'metrics', 'optimization'] as const;

  const structureDiff: any = {};

  for (const layer of layers) {
    const layerA = structureA[layer] as any;
    const layerB = structureB[layer] as any;

    const changes: Record<string, ArrayDiff<string>> = {};

    for (const key in layerA) {
      if (Array.isArray(layerA[key]) && Array.isArray(layerB[key])) {
        changes[key] = diffArray(layerA[key], layerB[key]);
      }
    }

    structureDiff[layer] = {
      layerName: layer,
      changes
    };
  }

  return structureDiff;
}

/**
 * 对比元数据
 */
function diffMetadata(metadataA: any, metadataB: any): MetadataDiff {
  return {
    iterations: {
      old: metadataA.iterations,
      new: metadataB.iterations,
      delta: metadataB.iterations - metadataA.iterations
    },
    confidence: {
      old: metadataA.confidence,
      new: metadataB.confidence,
      delta: metadataB.confidence - metadataA.confidence
    },
    generatedAt: {
      old: metadataA.generatedAt,
      new: metadataB.generatedAt
    }
  };
}

/**
 * 计算文本相似度 (Levenshtein 距离)
 */
function computeSimilarity(textA: string, textB: string): number {
  const distance = levenshteinDistance(textA, textB);
  const maxLength = Math.max(textA.length, textB.length);
  return maxLength === 0 ? 1.0 : 1.0 - distance / maxLength;
}

/**
 * Levenshtein 距离算法
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j] + 1      // 删除
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
```

**可交付物**:
- ✅ `src/analysis/model-diff.ts` - 模型差异对比算法
- ✅ 测试用例: 验证差异检测准确性

---

#### 步骤 2: 敏感性分析 (8-12 小时)

**目标**: 评估假设参数变化对模型输出的影响

**2.1 参数扫描实现**:

```typescript
// 文件: src/analysis/sensitivity-analysis.ts

import type { Hypothesis, SocialSystemModel } from '../types';
import { runWorkflow } from '../workflow/orchestrator.js';

export interface SensitivityConfig {
  baseHypothesis: Hypothesis;
  parameter: 'assumptions' | 'constraints' | 'goals';
  variations: string[][]; // 每个变体的参数值
}

export interface SensitivityResult {
  variations: VariationResult[];
  summary: {
    confidenceRange: { min: number; max: number; mean: number };
    iterationsRange: { min: number; max: number; mean: number };
    conflictsRange: { min: number; max: number; mean: number };
  };
}

export interface VariationResult {
  variationIndex: number;
  hypothesis: Hypothesis;
  model: SocialSystemModel;
  metrics: {
    confidence: number;
    iterations: number;
    conflicts: number;
  };
}

/**
 * 执行敏感性分析
 */
export async function runSensitivityAnalysis(config: SensitivityConfig): Promise<SensitivityResult> {
  const results: VariationResult[] = [];

  for (let i = 0; i < config.variations.length; i++) {
    const variation = config.variations[i];
    
    // 构造变体假设
    const hypothesis: Hypothesis = {
      ...config.baseHypothesis,
      [config.parameter]: variation
    };

    // 运行工作流
    const model = await runWorkflow(hypothesis, { maxIterations: 3 });

    results.push({
      variationIndex: i,
      hypothesis,
      model,
      metrics: {
        confidence: model.metadata.confidence,
        iterations: model.metadata.iterations,
        conflicts: model.conflicts.length
      }
    });
  }

  // 计算统计摘要
  const confidences = results.map(r => r.metrics.confidence);
  const iterations = results.map(r => r.metrics.iterations);
  const conflicts = results.map(r => r.metrics.conflicts);

  return {
    variations: results,
    summary: {
      confidenceRange: {
        min: Math.min(...confidences),
        max: Math.max(...confidences),
        mean: confidences.reduce((a, b) => a + b, 0) / confidences.length
      },
      iterationsRange: {
        min: Math.min(...iterations),
        max: Math.max(...iterations),
        mean: iterations.reduce((a, b) => a + b, 0) / iterations.length
      },
      conflictsRange: {
        min: Math.min(...conflicts),
        max: Math.max(...conflicts),
        mean: conflicts.reduce((a, b) => a + b, 0) / conflicts.length
      }
    }
  };
}

/**
 * 生成参数扫描变体 (自动生成多个变体)
 */
export function generateParameterSweep(
  baseValue: string[],
  perturbations: string[]
): string[][] {
  const variations: string[][] = [];

  // 原始值
  variations.push([...baseValue]);

  // 添加扰动项
  for (const perturbation of perturbations) {
    variations.push([...baseValue, perturbation]);
  }

  // 移除单个项 (如果基础值有多个元素)
  if (baseValue.length > 1) {
    for (let i = 0; i < baseValue.length; i++) {
      const reduced = baseValue.filter((_, index) => index !== i);
      variations.push(reduced);
    }
  }

  return variations;
}
```

**2.2 MCP Tool: 敏感性分析**:

```typescript
// 文件: src/server.ts

import { runSensitivityAnalysis, generateParameterSweep } from './analysis/sensitivity-analysis.js';

(mcpServer as any).registerTool({
  name: "run_sensitivity_analysis",
  description: "执行假设参数的敏感性分析",
  inputSchema: {
    type: "object",
    properties: {
      baseHypothesis: {
        type: "object",
        description: "基准假设"
      },
      parameter: {
        type: "string",
        enum: ["assumptions", "constraints", "goals"],
        description: "要分析的参数"
      },
      perturbations: {
        type: "array",
        items: { type: "string" },
        description: "扰动值 (将添加到基准值)"
      }
    },
    required: ["baseHypothesis", "parameter", "perturbations"]
  }
}, async (input: any) => {
  const baseValue = input.baseHypothesis[input.parameter];
  const variations = generateParameterSweep(baseValue, input.perturbations);

  const result = await runSensitivityAnalysis({
    baseHypothesis: input.baseHypothesis,
    parameter: input.parameter,
    variations
  });

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        variationsCount: result.variations.length,
        summary: result.summary,
        variations: result.variations.map(v => ({
          index: v.variationIndex,
          confidence: v.metrics.confidence.toFixed(2),
          iterations: v.metrics.iterations,
          conflicts: v.metrics.conflicts
        }))
      }, null, 2)
    }]
  };
});
```

**可交付物**:
- ✅ `src/analysis/sensitivity-analysis.ts` - 敏感性分析实现
- ✅ MCP Tool: `run_sensitivity_analysis` - 敏感性分析接口

---

#### 步骤 3: 交互式可视化 (20-24 小时)

**目标**: 在 Web UI 中实现 9 层结构的交互式图形化展示

**3.1 可视化库选择**: 使用 `vis-network` (力导向图)

```bash
cd web
bun add vis-network
```

**3.2 实现可视化组件**:

```typescript
// 文件: web/src/components/ModelVisualization.tsx

import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';

interface ModelVisualizationProps {
  structure: any; // SystemStructure 类型
}

export function ModelVisualization({ structure }: ModelVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 构建节点与边
    const nodes: any[] = [];
    const edges: any[] = [];

    let nodeId = 0;

    // 添加中心节点 (社会体系)
    nodes.push({ id: nodeId++, label: '社会体系', level: 0, color: '#4CAF50' });
    const centerNodeId = 0;

    // 添加 9 层子节点
    const layers = ['overall', 'workflow', 'institutions', 'governance', 'culture', 'innovation', 'risks', 'metrics', 'optimization'];
    const layerLabels: Record<string, string> = {
      overall: '总体结构',
      workflow: '工作流',
      institutions: '制度',
      governance: '治理',
      culture: '文化',
      innovation: '创新',
      risks: '风险',
      metrics: '指标',
      optimization: '优化'
    };

    for (const layer of layers) {
      const layerId = nodeId++;
      nodes.push({ id: layerId, label: layerLabels[layer], level: 1, color: '#2196F3' });
      edges.push({ from: centerNodeId, to: layerId });

      // 添加子字段节点
      const layerData = structure[layer];
      for (const key in layerData) {
        if (Array.isArray(layerData[key]) && layerData[key].length > 0) {
          const fieldId = nodeId++;
          nodes.push({ 
            id: fieldId, 
            label: `${key} (${layerData[key].length})`, 
            level: 2, 
            color: '#FFC107',
            title: layerData[key].join('\n') // 鼠标悬停显示详情
          });
          edges.push({ from: layerId, to: fieldId });
        }
      }
    }

    // 创建网络图
    const data = { nodes, edges };
    const options = {
      layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed',
          levelSeparation: 150
        }
      },
      nodes: {
        shape: 'box',
        font: { size: 14 }
      },
      edges: {
        smooth: { type: 'cubicBezier' }
      },
      physics: false
    };

    const network = new Network(containerRef.current, data, options);

    return () => {
      network.destroy();
    };
  }, [structure]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">9 层结构可视化</h2>
      <div 
        ref={containerRef} 
        className="w-full h-[600px] border border-gray-300 rounded"
      />
    </div>
  );
}
```

**3.3 集成到 App.tsx**:

```typescript
// 文件: web/src/App.tsx

import { ModelVisualization } from './components/ModelVisualization';

// 在结果展示部分添加可视化
{result && (
  <div className="mt-8">
    <ModelVisualization structure={result.structure} />
  </div>
)}
```

**可交付物**:
- ✅ `web/src/components/ModelVisualization.tsx` - 可视化组件
- ✅ 集成到主应用,支持缩放/拖拽/悬停详情

---

#### 步骤 4: 导出功能扩展 (6-8 小时)

**目标**: 支持导出为 GraphML (用于 Gephi/Cytoscape 分析)

```typescript
// 文件: src/analysis/export-graphml.ts

import type { SystemStructure } from '../types';

/**
 * 将 9 层结构导出为 GraphML 格式
 */
export function exportToGraphML(structure: SystemStructure): string {
  const nodes: string[] = [];
  const edges: string[] = [];

  let nodeId = 0;
  const nodeMap = new Map<string, number>();

  // 中心节点
  nodes.push(`<node id="n${nodeId}"><data key="label">社会体系</data></node>`);
  nodeMap.set('center', nodeId);
  nodeId++;

  // 9 层节点
  const layers = ['overall', 'workflow', 'institutions', 'governance', 'culture', 'innovation', 'risks', 'metrics', 'optimization'];

  for (const layer of layers) {
    const layerId = nodeId++;
    nodes.push(`<node id="n${layerId}"><data key="label">${layer}</data></node>`);
    nodeMap.set(layer, layerId);
    edges.push(`<edge source="n${nodeMap.get('center')}" target="n${layerId}"/>`);

    // 子字段节点
    const layerData = (structure as any)[layer];
    for (const key in layerData) {
      if (Array.isArray(layerData[key]) && layerData[key].length > 0) {
        const fieldId = nodeId++;
        nodes.push(`<node id="n${fieldId}"><data key="label">${key}</data></node>`);
        edges.push(`<edge source="n${layerId}" target="n${fieldId}"/>`);
      }
    }
  }

  // 组装 GraphML
  return `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <graph id="G" edgedefault="directed">
    ${nodes.join('\n    ')}
    ${edges.join('\n    ')}
  </graph>
</graphml>`;
}
```

**可交付物**:
- ✅ `src/analysis/export-graphml.ts` - GraphML 导出功能

---

### 2.3 验收标准

**功能验收**:
- ✅ 模型对比功能正常,高亮显示差异
- ✅ 敏感性分析可执行,生成统计摘要
- ✅ 交互式可视化支持缩放/拖拽/悬停
- ✅ 导出 GraphML 格式正确 (可被 Gephi 打开)

**性能验收**:
- ✅ 对比两个模型耗时 < 500ms
- ✅ 敏感性分析 (10 个变体) 耗时 < 2 分钟
- ✅ 可视化渲染 (100+ 节点) 流畅 (60 FPS)

---

## 任务 3: 批量处理系统

### 3.1 背景与价值

**当前状态**:
- 每次只能推演一个假设
- 无法批量对比多个场景
- 参数扫描需手动逐个执行

**批量处理目标**:
- 支持一次提交多个假设,并行推演
- 批量结果对比与可视化
- 自动生成场景对比报告

**业务价值**:
- **研究效率**: 一次性评估多个方案
- **决策支持**: 并列对比不同假设下的结果
- **参数优化**: 自动搜索最优参数组合

---

### 3.2 技术方案

#### 步骤 1: 批量 API 设计 (6-8 小时)

**目标**: 设计批量推演的 MCP Tool

```typescript
// 文件: src/server.ts

(mcpServer as any).registerTool({
  name: "batch_reasoning",
  description: "批量推演多个假设 (并行执行)",
  inputSchema: {
    type: "object",
    properties: {
      hypotheses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "假设 ID (用于区分)" },
            assumptions: { type: "array", items: { type: "string" } },
            constraints: { type: "array", items: { type: "string" } },
            goals: { type: "array", items: { type: "string" } }
          }
        },
        description: "假设列表"
      },
      maxIterations: {
        type: "number",
        default: 3,
        description: "每个假设的最大迭代次数"
      },
      parallel: {
        type: "boolean",
        default: true,
        description: "是否并行执行 (默认: 是)"
      }
    },
    required: ["hypotheses"]
  }
}, async (input: any) => {
  const hypotheses = input.hypotheses;
  const maxIterations = input.maxIterations || 3;
  const parallel = input.parallel !== false;

  const results: any[] = [];

  if (parallel) {
    // 并行执行
    const promises = hypotheses.map(async (hyp: any) => {
      try {
        const model = await runWorkflow(hyp, { maxIterations });
        return {
          id: hyp.id,
          status: 'success',
          model: {
            iterations: model.metadata.iterations,
            confidence: model.metadata.confidence,
            conflicts: model.conflicts.length
          }
        };
      } catch (error) {
        return {
          id: hyp.id,
          status: 'error',
          error: String(error)
        };
      }
    });

    results.push(...await Promise.all(promises));
  } else {
    // 顺序执行
    for (const hyp of hypotheses) {
      try {
        const model = await runWorkflow(hyp, { maxIterations });
        results.push({
          id: hyp.id,
          status: 'success',
          model: {
            iterations: model.metadata.iterations,
            confidence: model.metadata.confidence,
            conflicts: model.conflicts.length
          }
        });
      } catch (error) {
        results.push({
          id: hyp.id,
          status: 'error',
          error: String(error)
        });
      }
    }
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        results
      }, null, 2)
    }]
  };
});
```

**可交付物**:
- ✅ MCP Tool: `batch_reasoning` - 批量推演接口

---

#### 步骤 2: 批量结果对比 (10-14 小时)

**目标**: 实现多模型并列对比功能

```typescript
// 文件: src/analysis/batch-comparison.ts

import type { SocialSystemModel } from '../types';

export interface BatchComparisonResult {
  modelCount: number;
  metrics: {
    confidence: { min: number; max: number; mean: number; values: number[] };
    iterations: { min: number; max: number; mean: number; values: number[] };
    conflicts: { min: number; max: number; mean: number; values: number[] };
  };
  ranking: ModelRanking[];
}

export interface ModelRanking {
  modelId: string;
  rank: number;
  score: number;
  metrics: {
    confidence: number;
    iterations: number;
    conflicts: number;
  };
}

/**
 * 对比批量模型,生成排名报告
 */
export function compareBatchModels(models: SocialSystemModel[]): BatchComparisonResult {
  const confidences = models.map(m => m.metadata.confidence);
  const iterations = models.map(m => m.metadata.iterations);
  const conflicts = models.map(m => m.conflicts.length);

  // 计算综合得分 (置信度权重 0.6 + 冲突数归一化 0.3 + 迭代数归一化 0.1)
  const ranking: ModelRanking[] = models.map((model, index) => {
    const normalizedIterations = 1 - (model.metadata.iterations / Math.max(...iterations));
    const normalizedConflicts = 1 - (model.conflicts.length / Math.max(...conflicts));
    
    const score = 
      model.metadata.confidence * 0.6 +
      normalizedConflicts * 0.3 +
      normalizedIterations * 0.1;

    return {
      modelId: (model.metadata as any).modelId || `model-${index}`,
      rank: 0, // 稍后填充
      score,
      metrics: {
        confidence: model.metadata.confidence,
        iterations: model.metadata.iterations,
        conflicts: model.conflicts.length
      }
    };
  });

  // 排序并分配排名
  ranking.sort((a, b) => b.score - a.score);
  ranking.forEach((r, index) => r.rank = index + 1);

  return {
    modelCount: models.length,
    metrics: {
      confidence: {
        min: Math.min(...confidences),
        max: Math.max(...confidences),
        mean: confidences.reduce((a, b) => a + b, 0) / confidences.length,
        values: confidences
      },
      iterations: {
        min: Math.min(...iterations),
        max: Math.max(...iterations),
        mean: iterations.reduce((a, b) => a + b, 0) / iterations.length,
        values: iterations
      },
      conflicts: {
        min: Math.min(...conflicts),
        max: Math.max(...conflicts),
        mean: conflicts.reduce((a, b) => a + b, 0) / conflicts.length,
        values: conflicts
      }
    },
    ranking
  };
}
```

**可交付物**:
- ✅ `src/analysis/batch-comparison.ts` - 批量对比算法

---

#### 步骤 3: 批量可视化 (8-12 小时)

**目标**: 在 Web UI 中实现批量结果对比图表

```typescript
// 文件: web/src/components/BatchComparisonChart.tsx

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BatchComparisonChartProps {
  results: any[]; // BatchComparisonResult.ranking
}

export function BatchComparisonChart({ results }: BatchComparisonChartProps) {
  const data = results.map(r => ({
    name: r.modelId.slice(0, 8),
    confidence: (r.metrics.confidence * 100).toFixed(1),
    conflicts: r.metrics.conflicts,
    iterations: r.metrics.iterations,
    score: (r.score * 100).toFixed(1)
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">批量对比结果</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="confidence" fill="#4CAF50" name="置信度 (%)" />
          <Bar dataKey="conflicts" fill="#F44336" name="冲突数" />
          <Bar dataKey="score" fill="#2196F3" name="综合得分 (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

**可交付物**:
- ✅ `web/src/components/BatchComparisonChart.tsx` - 批量对比图表

---

### 3.3 验收标准

**功能验收**:
- ✅ 批量推演支持并行与顺序两种模式
- ✅ 批量对比生成排名报告
- ✅ Web UI 显示对比图表

**性能验收**:
- ✅ 10 个假设并行推演耗时 < 30 秒 (受 GLM API 限制)
- ✅ 批量对比计算耗时 < 1 秒

---

## Phase 3 总结

### 完成标志

- ✅ 数据库持久化正常运行,模型自动保存
- ✅ 模型对比功能可用,敏感性分析可执行
- ✅ 交互式可视化流畅运行
- ✅ 批量处理支持并行推演与对比
- ✅ 所有测试通过,文档完整

### 交付清单

**代码文件**:
- 数据库模块:
  - `src/database/schema.sql`
  - `src/database/connection.ts`
  - `src/database/repositories/hypothesis-repository.ts`
  - `src/database/repositories/model-repository.ts`

- 分析模块:
  - `src/analysis/model-diff.ts`
  - `src/analysis/sensitivity-analysis.ts`
  - `src/analysis/batch-comparison.ts`
  - `src/analysis/export-graphml.ts`

- Web UI:
  - `web/src/components/ModelVisualization.tsx`
  - `web/src/components/BatchComparisonChart.tsx`

**MCP Tools**:
- `query_model_history` - 查询历史模型
- `get_model_by_id` - 获取模型详情
- `run_sensitivity_analysis` - 敏感性分析
- `batch_reasoning` - 批量推演

**测试文件**:
- `src/database/__tests__/repositories.test.ts`
- `src/analysis/__tests__/model-diff.test.ts`
- `src/analysis/__tests__/sensitivity-analysis.test.ts`

**文档**:
- `docs/database.md` - 数据库设计文档
- `docs/analysis-tools.md` - 分析工具使用指南
- `docs/batch-processing.md` - 批量处理指南

### 下一步: Phase 4

完成 Phase 3 后,进入 **Phase 4: 扩展 Agent**,包括:
- Environmental Agent (环境/气候/可持续性)
- Demographic Agent (人口/迁移/代际)
- Infrastructure Agent (交通/公用事业/基础设施)
- Technology Agent (AI/数字化转型/技术采纳)
- Historical Agent (历史事件/趋势/路径依赖)

预估工作量: 76-96 小时 (10-12 天)
