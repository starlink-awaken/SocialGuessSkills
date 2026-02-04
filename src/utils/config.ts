// Centralized configuration loader
// Exports typed config constants read from process.env with sensible defaults

function parseIntOrDefault(v: string | undefined, d: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : d;
}

function parseFloatOrDefault(v: string | undefined, d: number) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : d;
}

function ensureOneOf<T extends string>(v: string | undefined, allowed: T[], d: T): T {
  const vv = (v ?? String(d)).toLowerCase();
  return (allowed.includes(vv as T) ? (vv as T) : d);
}

export const config = {
  // Secrets / required
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',

  // Limits & concurrency
  MAX_CONCURRENT: parseIntOrDefault(process.env.MAX_CONCURRENT, 3),
  MAX_TOKENS: parseIntOrDefault(process.env.MAX_TOKENS, 50000),

  // Budgeting
  MONTHLY_BUDGET: parseFloatOrDefault(process.env.MONTHLY_BUDGET, 50),

  // Logging
  LOG_LEVEL: ensureOneOf(process.env.LOG_LEVEL, ['fatal','error','warn','info','debug','trace','silent'], 'info'),

  // Retry/backoff
  MAX_RETRIES: parseIntOrDefault(process.env.MAX_RETRIES, 3),
  RETRY_BASE_DELAY_MS: parseIntOrDefault(process.env.RETRY_BASE_DELAY_MS, 1000),
  RETRY_MAX_DELAY_MS: parseIntOrDefault(process.env.RETRY_MAX_DELAY_MS, 30000),
} as const;

export type Config = typeof config;

export function validateConfig(opts?: { requireApiKey?: boolean }) {
  const { requireApiKey = true } = opts ?? {};
  if (requireApiKey && !config.ANTHROPIC_API_KEY) {
    throw new Error('Missing required configuration: ANTHROPIC_API_KEY');
  }
  // If not required, we allow missing API key (mock-mode). But ensure numeric ranges are sane
  if (config.MAX_CONCURRENT <= 0) throw new Error('MAX_CONCURRENT must be > 0');
  if (config.MAX_TOKENS < 1024) throw new Error('MAX_TOKENS must be >= 1024');
  if (config.MONTHLY_BUDGET < 0) throw new Error('MONTHLY_BUDGET must be >= 0');
}

export default config;
