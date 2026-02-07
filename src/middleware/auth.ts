import type { McpServer } from '@modelcontextprotocol/sdk/server';
import { logger } from './logger.js';

interface APIKeyConfig {
  enabled: boolean;
  headerName: string;
  keys: Set<string>;
  rateLimitPerMinute: number;
}

class APIKeyAuth {
  private config: APIKeyConfig;
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.config = {
      enabled: process.env.API_KEY_AUTH_ENABLED === 'true',
      headerName: process.env.API_KEY_HEADER_NAME || 'X-API-Key',
      keys: new Set(process.env.API_KEYS?.split(',') || []),
      rateLimitPerMinute: parseInt(process.env.API_RATE_LIMIT_PER_MIN || '100', 10),
    };

    if (this.config.enabled && this.config.keys.size === 0) {
      logger.warn('[SECURITY] API key authentication enabled but no keys configured');
    }
  }

  validateAPIKey(apiKey: string | undefined | null): { valid: boolean; error?: string } {
    if (!this.config.enabled) {
      return { valid: true };
    }

    if (!apiKey) {
      return { valid: false, error: 'API key is required' };
    }

    if (!this.config.keys.has(apiKey)) {
      return { valid: false, error: 'Invalid API key' };
    }

    return { valid: true };
  }

  checkRateLimit(apiKey: string): { allowed: boolean; error?: string; retryAfter?: number } {
    if (!this.config.enabled || !apiKey) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute in milliseconds

    let rateInfo = this.rateLimitMap.get(apiKey);

    if (!rateInfo || now > rateInfo.resetTime) {
      rateInfo = { count: 0, resetTime: now + windowSize };
      this.rateLimitMap.set(apiKey, rateInfo);
    }

    if (rateInfo.count >= this.config.rateLimitPerMinute) {
      const retryAfter = Math.ceil((rateInfo.resetTime - now) / 1000);
      return {
        allowed: false,
        error: 'Rate limit exceeded',
        retryAfter,
      };
    }

    rateInfo.count++;
    this.rateLimitMap.set(apiKey, rateInfo);

    return { allowed: true };
  }

  cleanupExpiredRateLimits(): void {
    const now = Date.now();
    for (const [apiKey, rateInfo] of this.rateLimitMap.entries()) {
      if (now > rateInfo.resetTime) {
        this.rateLimitMap.delete(apiKey);
      }
    }
  }
}

const auth = new APIKeyAuth();

export function authenticateMiddleware(server: McpServer): void {
  if (!auth.config.enabled) {
    logger.info('[SECURITY] API key authentication disabled');
    return;
  }

  logger.info('[SECURITY] API key authentication enabled');

  const originalSetRequestHandler = server.setRequestHandler.bind(server);

  server.setRequestHandler = (schema: any, handler: any) => {
    originalSetRequestHandler(schema, (request: any) => {
      const apiKey = request.params?.headers?.[auth.config.headerName.toLowerCase()] ||
                       request.headers?.[auth.config.headerName];

      const authResult = auth.validateAPIKey(apiKey);

      if (!authResult.valid) {
        logger.warn(`[SECURITY] Authentication failed: ${authResult.error}`, {
          apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'missing',
        });

        throw new Error(authResult.error || 'Authentication failed');
      }

      const rateLimitResult = auth.checkRateLimit(apiKey || 'anonymous');

      if (!rateLimitResult.allowed) {
        logger.warn(`[SECURITY] Rate limit exceeded: ${rateLimitResult.error}`);

        throw new Error(
          `${rateLimitResult.error}${rateLimitResult.retryAfter ? ` (retry after ${rateLimitResult.retryAfter}s)` : ''}`,
        );
      }

      return handler(request);
    });
  };
}

setInterval(() => {
  auth.cleanupExpiredRateLimits();
}, 5 * 60 * 1000); // Clean up every 5 minutes

export { auth };
