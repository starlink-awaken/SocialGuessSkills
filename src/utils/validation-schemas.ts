/**
 * Validation Schemas for MCP Tools
 */

import type { AgentType, Hypothesis } from "./types";

 export interface ValidationError {
  field: string;
  expectedType: string;
  received: any;
  receivedUnknown?: any;
  allowedValues?: any[];
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Hypothesis validation schema
const HYPOTHESIS_SCHEMA = {
  assumptions: {
    type: "array",
    minItems: 1,
    maxItems: 10,
    itemValidation: { type: "string", minLength: 5, maxLength: 500 }
  },
  constraints: {
    type: "array",
    minItems: 0,
    maxItems: 5,
    itemValidation: { type: "string", minLength: 3, maxLength: 100 }
  },
  goals: {
    type: "array",
    minItems: 0,
    maxItems: 3,
    itemValidation: { type: "string", minLength: 3, maxLength: 100 }
  }
};

// Max iterations validation
export const MAX_ITERATIONS_MIN = 1;
export const MAX_ITERATIONS_MAX = 10;

export function validateHypothesis(hypothesis: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof hypothesis !== 'object' || hypothesis === null) {
    errors.push({
      field: "hypothesis",
      expectedType: "object",
      received: hypothesis,
      message: "hypothesis 必须是对象"
    });
  }

  const parsed = hypothesis as any;

  if (parsed.assumptions) {
    if (!Array.isArray(parsed.assumptions)) {
      errors.push({
        field: "assumptions",
        expectedType: "array",
        received: parsed.assumptions,
        message: "assumptions 必须是数组"
      });
    } else {
      for (let i = 0; i < parsed.assumptions.length; i++) {
        const item = parsed.assumptions[i];

        const { minLength, maxLength } = HYPOTHESIS_SCHEMA.assumptions.itemValidation;
        if (typeof item !== 'string') {
          errors.push({
            field: `assumptions[${i}]`,
            expectedType: "string",
            received: item,
            message: "假设必须是字符串类型"
          });
          continue;
        }

        if (item.length < (minLength || 0)) {
          errors.push({
            field: `assumptions[${i}]`,
            message: `假设不能为空，最小长度为 ${minLength}字符`
          });
        }

        if (item.length > maxLength) {
          errors.push({
            field: `assumptions[${i}]`,
            message: `假设长度不能超过 ${maxLength}字符`
          });
        }
      }
    }

  if (parsed.constraints) {
    if (!Array.isArray(parsed.constraints)) {
      errors.push({
        field: "constraints",
        expectedType: "array",
        received: parsed.constraints,
        message: "constraints 必须是数组"
      });
    } else {
      for (let i = 0; i < parsed.constraints.length; i++) {
        const item = parsed.constraints[i];

        const { minLength, maxLength } = HYPOTHESIS_SCHEMA.constraints.itemValidation;
        if (typeof item !== 'string') {
          errors.push({
            field: `constraints[${i}]`,
            expectedType: "string",
            received: item,
            message: "约束必须是字符串类型"
          });
          continue;
        }

        if (item.length < (minLength || 0)) {
          errors.push({
            field: `constraints[${i}]`,
            message: `约束不能为空，最小长度为 ${minLength}字符`
          });
        }

        if (item.length > maxLength) {
          errors.push({
            field: `constraints[${i}]`,
            message: `约束长度不能超过 ${maxLength}字符`
          });
        }
      }
    }

  if (parsed.goals) {
    if (!Array.isArray(parsed.goals)) {
      errors.push({
        field: "goals",
        expectedType: "array",
        received: parsed.goals,
        message: "goals 必须是数组"
      });
    } else {
      for (let i = 0; i < parsed.goals.length; i++) {
        const item = parsed.goals[i];

        const { minLength, maxLength } = HYPOTHESIS_SCHEMA.goals.itemValidation;
        if (typeof item !== 'string') {
          errors.push({
            field: `goals[${i}]`,
            expectedType: "string",
            received: item,
            message: "目标必须是字符串类型"
          });
          continue;
        }

        if (item.length < (minLength || 0)) {
          errors.push({
            field: `goals[${i}]`,
            message: `目标不能为空，最小长度为 ${minLength}字符`
          });
        }

        if (item.length > maxLength) {
          errors.push({
            field: `goals[${i}]`,
            message: `目标长度不能超过 ${maxLength}字符`
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateMaxIterations(maxIterations: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof maxIterations !== 'number') {
    errors.push({
      field: "maxIterations",
      expectedType: "number",
      received: maxIterations,
      message: "maxIterations 必须是数字"
    });
  } else if (maxIterations < MAX_ITERATIONS_MIN) {
    errors.push({
      field: "maxIterations",
      message: `maxIterations 不能小于 ${MAX_ITERATIONS_MIN}`
    });
  } else if (maxIterations > MAX_ITERATIONS_MAX) {
    errors.push({
      field: "maxIterations",
      message: `maxIterations 不能大于 ${MAX_ITERATIONS_MAX}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateAgentType(agentType: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof agentType !== 'string') {
    errors.push({
      field: "agentType",
      expectedType: "string",
      received: agentType,
      message: "agentType 必须是字符串类型"
    });
  }

  const validAgentTypes: AgentType[] = [
    "systems",
    "econ",
    "socio",
    "governance",
    "culture",
    "risk",
    "validation"
  ];

  if (!validAgentTypes.includes(agentType as string)) {
    errors.push({
      field: "agentType",
      received: agentType,
      message: `无效的Agent类型，可用值: ${validAgentTypes.join(", ")}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
}
}
