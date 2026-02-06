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

function parseBooleanOrDefault(v: string | undefined, d: boolean) {
  if (!v) return d;
  const normalized = v.toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return d;
}

function parseListOrDefault(v: string | undefined, d: string[]) {
  if (!v) return d;
  return v
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

  // LLM adapter
  LLM_PROVIDER: ensureOneOf(process.env.LLM_PROVIDER, ["auto", "anthropic", "mock"], "auto"),
  LLM_MODEL: process.env.LLM_MODEL ?? "claude-3-5-sonnet-20241022",
  LLM_MAX_TOKENS: parseIntOrDefault(process.env.LLM_MAX_TOKENS, 4096),
  LLM_TIMEOUT_MS: parseIntOrDefault(process.env.LLM_TIMEOUT_MS, 60000),
  AGENT_MOCK_MODE: parseBooleanOrDefault(process.env.AGENT_MOCK_MODE, false),
  FAIL_ON_CRITICAL: parseBooleanOrDefault(process.env.FAIL_ON_CRITICAL, true),
  CRITICAL_AGENTS: parseListOrDefault(process.env.CRITICAL_AGENTS, ["risk", "governance", "systems"]),
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
  if (config.MAX_RETRIES < 0) throw new Error('MAX_RETRIES must be >= 0');
  if (config.RETRY_BASE_DELAY_MS <= 0) throw new Error('RETRY_BASE_DELAY_MS must be > 0');
  if (config.RETRY_MAX_DELAY_MS < config.RETRY_BASE_DELAY_MS) throw new Error('RETRY_MAX_DELAY_MS must be >= RETRY_BASE_DELAY_MS');
  if (config.LLM_MAX_TOKENS < 256) throw new Error('LLM_MAX_TOKENS must be >= 256');
  if (config.LLM_TIMEOUT_MS < 1000) throw new Error('LLM_TIMEOUT_MS must be >= 1000');
  const allowedAgents = new Set(['systems','econ','socio','governance','culture','risk','validation']);
  for (const agent of config.CRITICAL_AGENTS) {
    if (!allowedAgents.has(agent)) {
      throw new Error(`CRITICAL_AGENTS contains invalid value: ${agent}`);
    }
  }
}

export default config;
