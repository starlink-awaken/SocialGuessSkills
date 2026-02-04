import Anthropic from '@anthropic-ai/sdk';


import { config, validateConfig } from '../utils/config.js';

const API_KEY = config.ANTHROPIC_API_KEY;

// allow importing this module in mock-mode when no API key is present
// do not throw at import time; runtime callers decide whether to use Anthropic
validateConfig({ requireApiKey: false });

let client: Anthropic | null = null;

export interface CallAnthropicOptions {
  model?: string;
  maxTokens?: number;
  timeout?: number;
}

export interface CallAnthropicResult {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * 获取Anthropic客户端实例（单例模式）
 */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: API_KEY,
      dangerouslyAllowBrowser: false,
    });
  }
  return client;
}

/**
 * 调用Anthropic API
 * @param prompt - 用户输入的提示文本
 * @param options - 可选配置（模型、最大token、超时）
 * @returns API响应内容和token使用情况
 */
export async function callAnthropic(
  prompt: string,
  options: CallAnthropicOptions = {}
): Promise<CallAnthropicResult> {
  const {
    model = 'claude-3-5-sonnet-20241022',
    maxTokens = 4096,
    timeout = 60000,
  } = options;

  const anthropic = getAnthropicClient();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await anthropic.messages.create(
      {
        model,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n');

    return {
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Anthropic API call timed out after ${timeout}ms`);
      }

      // Anthropic API错误
      if (error.message.includes('401')) {
        throw new Error('Anthropic API key is invalid or expired');
      }
      if (error.message.includes('429')) {
        throw new Error('Anthropic API rate limit exceeded');
      }
      if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        throw new Error(`Anthropic API server error: ${error.message}`);
      }
      if (error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
        throw new Error('Network error: failed to connect to Anthropic API');
      }

      // 重新抛出原始错误
      throw error;
    }

    throw new Error('Unknown error occurred while calling Anthropic API');
  }
}

/**
 * 检查API密钥是否已配置且有效
 */
export async function checkApiKey(): Promise<boolean> {
  try {
    const anthropic = getAnthropicClient();
    await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    });
    return true;
  } catch (error) {
    return false;
  }
}
