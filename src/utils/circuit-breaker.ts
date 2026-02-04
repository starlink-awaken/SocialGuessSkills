export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number; // 连续失败次数阈值
  recoveryTimeMs?: number; // 熔断后等待时间
}

/**
 * 简单的断路器实现:
 * - CLOSED: 正常，记录失败计数
 * - OPEN: 熔断，不允许请求通过，直到 recoveryTimeMs 到期
 * - HALF_OPEN: 在尝试窗口，允许 1 个请求通过以检测后端是否恢复
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private halfOpenTrialInFlight = false;
  private readonly failureThreshold: number;
  private readonly recoveryTimeMs: number;

  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold = options?.failureThreshold ?? 5;
    this.recoveryTimeMs = options?.recoveryTimeMs ?? 30_000; // 默认 30 秒
  }

  getState(): CircuitState {
    // 在访问时检查是否应该从 OPEN 转为 HALF_OPEN
    if (this.state === 'OPEN' && this.lastFailureTime !== null) {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.recoveryTimeMs) {
        this.state = 'HALF_OPEN';
        this.halfOpenTrialInFlight = false;
      }
    }
    return this.state;
  }

  /**
   * 尝试运行一个操作。如果断路器允许，将执行 provided 函数并根据结果更新状态。
   * 如果断路器不允许（OPEN 且未到恢复时间），会抛出错误。
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();
    if (state === 'OPEN') {
      throw new Error('CircuitBreaker is OPEN');
    }

    if (state === 'HALF_OPEN') {
      // 半开只允许一个试探性请求通过
      if (this.halfOpenTrialInFlight) {
        throw new Error('CircuitBreaker is HALF_OPEN and trial already in progress');
      }
      this.halfOpenTrialInFlight = true;
    }

    try {
      const res = await fn();
      this.onSuccess();
      return res;
    } catch (err) {
      this.onFailure();
      throw err;
    } finally {
      if (this.state === 'HALF_OPEN') {
        // 允许下一个试验在下一次调用时进行
        this.halfOpenTrialInFlight = false;
      }
    }
  }

  private onSuccess() {
    // 成功则重置计数，并从 HALF_OPEN 恢复到 CLOSED
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    // 在 HALF_OPEN 失败时，立即回到 OPEN
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      return;
    }

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  // 外部工具方法
  forceOpen() {
    this.state = 'OPEN';
    this.lastFailureTime = Date.now();
  }

  forceClose() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  getFailureCount() {
    return this.failureCount;
  }
}

export default CircuitBreaker;
