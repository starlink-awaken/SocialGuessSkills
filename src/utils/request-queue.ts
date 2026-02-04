/*
 * Request queue with concurrency limit and FIFO scheduling
 * - MAX_CONCURRENT read from centralized config (default 3)
 * - queue size limited to MAX_QUEUE (100)
 */

import { config } from './config.js';

type TaskFn<T> = () => Promise<T>;

export class RequestQueue {
  private maxConcurrent: number;
  private maxQueue: number;
  private running = 0;
  private queue: Array<{
    fn: TaskFn<any>;
    resolve: (v: any) => void;
    reject: (e: any) => void;
  }> = [];

  constructor(options?: { maxConcurrent?: number; maxQueue?: number }) {
    this.maxConcurrent = options?.maxConcurrent ?? config.MAX_CONCURRENT;
    this.maxQueue = options?.maxQueue ?? 100;
  }

  enqueue<T>(fn: TaskFn<T>): Promise<T> {
    if (this.queue.length >= this.maxQueue) {
      return Promise.reject(new Error("RequestQueue: queue size limit reached"));
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.tryToStartNext();
    });
  }

  private tryToStartNext() {
    // while allows starting multiple if slots available
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;
      this.running += 1;
      const { fn, resolve, reject } = item;

      // execute
      fn()
        .then((v) => {
          resolve(v);
        })
        .catch((e) => {
          reject(e);
        })
        .finally(() => {
          this.running -= 1;
          // ensure queue cleanup and continue
          // schedule next tick to avoid deep recursion
          setImmediate(() => this.tryToStartNext());
        });
    }
  }

  get size() {
    return this.queue.length;
  }

  get inFlight() {
    return this.running;
  }

  clearPending() {
    // reject pending tasks
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        item.reject(new Error("RequestQueue: cleared"));
      }
    }
  }
}

export default RequestQueue;
