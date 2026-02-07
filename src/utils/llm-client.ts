import { loadLLMConfig } from '../config/llm.js';
import { ZhipuAI } from 'zhipuai-sdk-nodejs-v4';

export async function callLLM(prompt: string): Promise<string> {
  const config = loadLLMConfig();

  if (!config.apiKey) {
    throw new Error('GLM_API_KEY not configured');
  }

  const ai = new ZhipuAI({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    timeout: config.timeout,
  });

  const maxRetries = config.maxRetries || 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await ai.createCompletions({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      });

      const content = (result as any)?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from GLM API');
      }

      return content;
    } catch (error) {
      lastError = error as Error;

      if (isFatalError(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`GLM API failed: ${lastError?.message}`);
}

function isFatalError(error: unknown): boolean {
  const msg = (error as Error).message?.toLowerCase() || '';
  return msg.includes('unauthorized') || msg.includes('invalid api key');
}
