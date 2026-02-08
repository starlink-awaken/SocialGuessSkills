
- ModelRepository 的 findByConfidenceRange 直接在 SQL 层使用 json_extract 过滤，避免加载后再解析。
