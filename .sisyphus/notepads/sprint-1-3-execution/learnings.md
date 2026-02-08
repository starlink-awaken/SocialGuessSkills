## 2026-02-07
- 收敛检测现在基于全部 Agent 的 conclusion + falsifiable 组合信号进行对比，确保 wave 分组不影响覆盖面。
- 新增 SQLite schema：hypotheses/models/workflow_logs 三表与索引；typecheck 当前因 Bun 类型与依赖缺失失败；SQL 文件无 LSP 支持提示。

- 新增 ModelRepository：与 HypothesisRepository 风格一致，使用 db.query + run/get/all。
- 置信度范围查询使用 SQLite json_extract(model_json, '$.metadata.confidence') 并 CAST 为 REAL。
