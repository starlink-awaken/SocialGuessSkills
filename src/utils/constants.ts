/**
 * Constants for SocialGuessSkills project
 *
 * This file centralizes all magic numbers and configuration values
 * to improve maintainability and make the codebase easier to understand and modify.
 */

/**
 * ==================== Workflow Constants ====================
 */

// Maximum number of workflow iterations
export const MAX_ITERATIONS: number = 3;

// Convergence threshold for no conflicts
export const CONVERGENCE_THRESHOLD: number = 0;

/**
 * ==================== Agent Constants ====================
 */

// All 7 agent types
export const AGENT_TYPES: Record<string, string> = {
  systems: 'systems',
  econ: 'econ',
  socio: 'socio',
  governance: 'governance',
  culture: 'culture',
  risk: 'risk',
  validation: 'validation'
} as const;

/**
 * ==================== MCP Constants ====================
 */

// JSON-RPC version for MCP protocol
export const MCP_JSONRPC_VERSION: string = '2.0';

/**
 * ==================== Cost Constants ====================
 */

// Default cost per token (in dollars)
export const TOKEN_COST_DEFAULT: number = 0.001;

// Budget range for cost alerts
export const BUDGET_RANGE_MIN: number = 10;
export const BUDGET_RANGE_MAX: number = 50;

/**
 * ==================== Retry Constants ====================
 */

export const MAX_RETRY_ATTEMPTS: number = 3;
export const DEFAULT_BACKOFF_MS: number = 1000;

/**
 * ==================== Circuit Breaker Constants ====================
 */

// Failure threshold to trigger circuit breaker (out of 10 requests)
export const FAILURE_THRESHOLD: number = 5;

// Recovery time after circuit breaker triggers (30 seconds)
export const RECOVERY_TIME_MS: number = 30000;

/**
 * ==================== Queue Constants ====================
 */

// Minimum requests in queue
export const MIN_QUEUE_SIZE: number = 1;

// Maximum requests in queue
export const MAX_QUEUE_SIZE: number = 100;

/**
 * ==================== Logging Constants ====================
 */

// Log levels
export const LOG_LEVEL_DEBUG: string = 'debug';
export const LOG_LEVEL_INFO: string = 'info';
export const LOG_LEVEL_WARN: string = 'warn';
export const LOG_LEVEL_ERROR: string = 'error';

/**
 * ==================== Validation Constants ====================
 */

// Maximum string length for hypothesis/goals
export const MAX_STRING_LENGTH: number = 1000;

/**
 * ==================== Type Safety Constants ====================
 */

// Default timeout for AI calls (ms)
export const DEFAULT_TIMEOUT: number = 5000;
