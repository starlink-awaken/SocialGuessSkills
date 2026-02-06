/**
 * Error Response Standards
 *
 * Standardized error codes and messages for consistent error handling
 */

export const ERROR_CODES = {
  // MCP Tool Errors
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_AGENT_TYPE: "INVALID_AGENT_TYPE",
  INVALID_HYPOTHESIS: "INVALID_HYPOTHESIS",

  // Server Errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  TOOL_EXECUTION_FAILED: "TOOL_EXECUTION_FAILED",
  WORKFLOW_ERROR: "WORKFLOW_ERROR",
  
  // Agent Execution Errors
  AGENT_TIMEOUT: "AGENT_TIMEOUT",
  AGENT_FAILURE: "AGENT_FAILURE",
  AGENT_PARSING_ERROR: "AGENT_PARSING_ERROR",

  // Validation Errors
  VALIDATION_FAILED: "VALIDATION_FAILED",
  MODEL_INCONSISTENCY: "MODEL_INCONSISTENCY"
} as const;

export interface ErrorDetails {
  code: string;
  message: string;
  timestamp: string;
  context?: string;
  stackTrace?: string;
}

export interface StandardizedErrorResponse {
  success: false;
  error: ErrorDetails;
}

export function formatError(
  code: string,
  message: string,
  context?: string,
  stackTrace?: string
): StandardizedErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      context,
      stackTrace
    }
  };
}

export function createSuccessResponse(content: any): { success: true; content: any } {
  return {
    success: true,
    content
  };
}
