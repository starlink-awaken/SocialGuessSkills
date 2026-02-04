决策记录 - production-roadmap

- 2026-02-04: 为MCP服务器添加health_check工具，返回字段: status, timestamp, version，并包含最小的布尔系统检查summary (envLoaded, apiKeyPresent)。

- 2026-02-04: 实现 retryWithBackoff 工具函数（src/utils/retry.ts）
  - 原因: 需要统一的网络/IO 重试策略, 减少上层代码重复实现
  - 要点:
    - 默认 maxRetries=3, baseDelayMs=1000ms, 指数退避, 支持 jitter
    - 默认重试规则: 5xx 与网络（无 status）重试; 不重试 401/403; 429 只有存在 Retry-After 时可重试
    - 支持自定义 shouldRetry(err) 覆盖
  - 验证: TypeScript 检查通过, 已加入基础单元测试
决策：使用 setImmediate 在任务完成后异步调度下一任务，避免深递归；队列上限为100以防内存泄露
