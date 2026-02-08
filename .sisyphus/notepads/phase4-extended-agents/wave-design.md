# Phase 4: 4-6 波执行设计

## 新拓扑结构

**目标**: 在保持 7 Agent 模式不变的前提下,扩展至 12 Agent 的 6 波执行拓扑。

### 12 Agent (extendedAgents=true)

- **Wave 1**: systems, econ, socio（并行）
  - 依赖: 无
  - 作用: 基础结构/经济/社会基线

- **Wave 2**: governance, culture, risk（并行,依赖 Wave 1）
  - 依赖: systems + econ + socio
  - 作用: 制度/文化/风险框架

- **Wave 3**: validation（依赖 Wave 1+2,对 7 Agent 结果做初步验证）
  - 依赖: systems + econ + socio + governance + culture + risk
  - 作用: 7 Agent 模式兼容的中间验证

- **Wave 4**: environmental, demographic, infrastructure（并行,依赖 Wave 1+2）
  - 依赖: systems + econ + socio + governance + culture + risk
  - 作用: 自然/人口/基建的物理与结构约束

- **Wave 5**: technology, historical（并行,依赖 Wave 1+2+4）
  - 依赖: systems + econ + socio + governance + culture + risk + environmental + demographic + infrastructure
  - 作用: 技术路径与历史惯性校正

- **Wave 6**: validation（最终验证,依赖所有 Agent）
  - 依赖: Wave 1-5 全部 Agent
  - 作用: 全量模型的一致性与可证伪性校验

### 7 Agent (extendedAgents=false)

- **Wave 1**: systems, econ, socio（并行）
- **Wave 2**: governance, culture, risk（并行,依赖 Wave 1）
- **Wave 3**: validation（依赖 Wave 1+2,保持最后）

## 依赖关系表

| Agent | Wave | Dependencies |
|------|------|--------------|
| systems | 1 | 无 |
| econ | 1 | 无 |
| socio | 1 | 无 |
| governance | 2 | systems, econ, socio |
| culture | 2 | systems, econ, socio |
| risk | 2 | systems, econ, socio |
| validation (7 Agent 模式) | 3 | systems, econ, socio, governance, culture, risk |
| environmental | 4 | systems, econ, socio, governance, culture, risk |
| demographic | 4 | systems, econ, socio, governance, culture, risk |
| infrastructure | 4 | systems, econ, socio, governance, culture, risk |
| technology | 5 | systems, econ, socio, governance, culture, risk, environmental, demographic, infrastructure |
| historical | 5 | systems, econ, socio, governance, culture, risk, environmental, demographic, infrastructure |
| validation (12 Agent 模式) | 6 | systems, econ, socio, governance, culture, risk, environmental, demographic, infrastructure, technology, historical |

## 循环依赖检查

依赖只从低波次指向高波次,不存在同波互相依赖或高波次反向依赖,因此拓扑为 DAG,**无循环依赖**。

## 向后兼容性

- **extendedAgents=false**: 保持 3 波执行,validation 仍为 Wave 3 且最后执行。
- **extendedAgents=true**: 扩展为 6 波执行,validation 变为 Wave 6(最终验证)。
- **规则保持**: Wave 4 依赖 Wave 1+2; Wave 5 依赖 Wave 1+2+4; validation 依赖所有 Agent。
