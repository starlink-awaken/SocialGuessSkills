// Aligned with backend src/types.ts

export type AgentType = 'systems' | 'econ' | 'socio' | 'governance' | 'culture' | 'risk' | 'validation' | 'environmental' | 'demographic' | 'infrastructure' | 'technology' | 'historical';

export interface Hypothesis {
  assumptions: string[];
  constraints: string[];
  goals: string[];
}

export interface AgentOutput {
  agentType: AgentType;
  conclusion: string;
  evidence: string[];
  risks: string[];
  suggestions: string[];
  falsifiable: string;
  error?: string;
}

export interface Conflict {
  type: 'logical' | 'priority' | 'risk_amplification' | 'goal' | 'constraint' | 'evidence';
  involvedAgents: AgentType[];
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolutionStrategy?: string;
}

export interface SystemStructure {
  overall: Record<string, string[]>;
  workflow: Record<string, string[]>;
  institutions: Record<string, string[]>;
  governance: Record<string, string[]>;
  culture: Record<string, string[]>;
  innovation: Record<string, string[]>;
  risks: Record<string, string[]>;
  metrics: Record<string, string[]>;
  optimization: Record<string, string[]>;
}

export interface SocialSystemModel {
  hypothesis: Hypothesis;
  agentOutputs: AgentOutput[];
  conflicts: Conflict[];
  structure: SystemStructure;
  metadata: {
    iterations: number;
    confidence: number;
    generatedAt: string;
    convergedAtIteration?: number;
    finalSimilarity?: number;
  };
}

export interface AgentMeta {
  type: AgentType;
  name: string;
  icon: string;
  color: string;
  priority: number;
  category: 'core' | 'extended';
}

// SSE event types
export interface WorkflowStartEvent { totalSteps: number; maxIterations: number }
export interface StepEvent { step: number; name: string; status: 'running' | 'completed' }
export interface AgentStartEvent { agentType: AgentType; iteration: number }
export interface AgentCompleteEvent { agentType: AgentType; iteration: number; output: AgentOutput }
export interface ConflictsEvent { conflicts: Conflict[]; iteration: number }
export interface IterationEvent { iteration: number; similarity: number; converged: boolean }

export type SSEEvent =
  | { type: 'workflow-start'; data: WorkflowStartEvent }
  | { type: 'step'; data: StepEvent }
  | { type: 'agent-start'; data: AgentStartEvent }
  | { type: 'agent-complete'; data: AgentCompleteEvent }
  | { type: 'conflicts'; data: ConflictsEvent }
  | { type: 'iteration'; data: IterationEvent }
  | { type: 'complete'; data: SocialSystemModel }
  | { type: 'error'; data: { message: string } };

// UI state
export interface AgentExecution {
  agentType: AgentType;
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: AgentOutput;
  iteration: number;
}

export interface WorkflowProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentStep: number;
  stepName: string;
  iteration: number;
  maxIterations: number;
  agents: AgentExecution[];
  conflicts: Conflict[];
  convergenceHistory: { iteration: number; similarity: number }[];
  model?: SocialSystemModel;
  error?: string;
}

export interface HistorySummary {
  id: number;
  hypothesisId: number;
  hash: string;
  createdAt: string;
  summary: {
    iterations: number;
    confidence: number;
    agentCount: number;
    conflictCount: number;
  };
}

export interface HistoryDetail {
  id: number;
  hypothesisId: number;
  hash: string;
  createdAt: string;
  model: SocialSystemModel;
}
