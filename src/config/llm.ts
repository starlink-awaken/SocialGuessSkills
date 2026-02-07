export interface LLMConfig {
  apiKey?: string;
  model: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export function loadLLMConfig(): LLMConfig {
  return {
    apiKey: process.env.GLM_API_KEY,
    model: process.env.GLM_MODEL || 'glm-4-flash',
    baseUrl: process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
    timeout: parseInt(process.env.GLM_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.GLM_MAX_RETRIES || '3', 10),
  };
}

export function validateLLMConfig(config: LLMConfig): boolean {
  if (config.apiKey) {
    return !!config.model && config.timeout! > 0 && config.maxRetries! > 0;
  }
  return true;
}
