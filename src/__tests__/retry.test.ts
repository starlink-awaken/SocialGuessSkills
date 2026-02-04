import { test, expect } from 'bun:test';
import { retryWithBackoff } from '../utils/retry.js';

test('succeeds without retry when fn resolves', async () => {
  const res = await retryWithBackoff(async () => 'ok');
  expect(res).toBe('ok');
});

test('retries on network error and eventually succeeds', async () => {
  let calls = 0;
  const res = await retryWithBackoff(async () => {
    calls += 1;
    if (calls < 2) throw new Error('network');
    return 'done';
  }, { maxRetries: 3, baseDelayMs: 1, jitter: false });

  expect(res).toBe('done');
  expect(calls).toBe(2);
});

test('does not retry on 401', async () => {
  const err = { status: 401 };
  await expect(retryWithBackoff(async () => { throw err; }, { maxRetries: 2, baseDelayMs: 1, jitter: false }))
    .rejects.toBe(err);
});
