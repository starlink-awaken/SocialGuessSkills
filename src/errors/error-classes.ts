export enum ErrorCode {
  // Workflow errors (E001-E099)
  INVALID_HYPOTHESIS = 'E001',
  INVALID_AGENT_TYPE = 'E002',
  CONVERGENCE_FAILURE = 'E003',
  WORKFLOW_TIMEOUT = 'E004',

  // LLM errors (E100-E199)
  LLM_API_KEY_MISSING = 'E100',
  LLM_API_CALL_FAILED = 'E101',
  LLM_RESPONSE_EMPTY = 'E102',
  LLM_RESPONSE_INVALID = 'E103',

  // Validation errors (E200-E299)
  VALIDATION_SCHEMA_MISMATCH = 'E200',
  VALIDATION_MISSING_FIELD = 'E201',
  VALIDATION_INVALID_TYPE = 'E202',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}

export class ValidationError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    public field?: string,
    public expectedType?: string,
    public actualType?: string,
    context?: Record<string, unknown>
  ) {
    super(code, message, context);
    this.name = 'ValidationError';
  }
}

export class LLMError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    public originalError?: Error,
    public retryAttempt?: number,
    context?: Record<string, unknown>
  ) {
    super(code, message, context);
    this.name = 'LLMError';
  }
}

export class WorkflowError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    public step?: string,
    public iteration?: number,
    context?: Record<string, unknown>
  ) {
    super(code, message, context);
    this.name = 'WorkflowError';
  }
}
