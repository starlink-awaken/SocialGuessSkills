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

export interface SocialSystemModel {
  hypothesis: Hypothesis;
  agentOutputs: AgentOutput[];
  conflicts: Conflict[];
  structure: SystemStructure;
  metadata: {
    iterations: number;
    confidence: number;
    generatedAt: string;
    failures?: AgentFailure[];
    convergedAtIteration?: number;
    finalSimilarity?: number;
  };
}

export interface AgentFailure {
  agentType: AgentType;
  error: string;
  iteration: number;
  timestamp: string;
}

export interface SystemStructure {
  overall: {
    resourceLayer: string[];
    behaviorLayer: string[];
    organizationLayer: string[];
    institutionalLayer: string[];
    governanceLayer: string[];
    culturalLayer: string[];
  };
  workflow: {
    demandGeneration: string[];
    resourceAllocation: string[];
    production: string[];
    ruleEnforcement: string[];
    publicGoods: string[];
    feedback: string[];
  };
  institutions: {
    propertyRights: string[];
    contracts: string[];
    publicGoods: string[];
    disputeResolution: string[];
    riskSharing: string[];
  };
  governance: {
    layeredGovernance: string[];
    accountability: string[];
    transparency: string[];
    crisis: string[];
  };
  culture: {
    narrative: string[];
    rituals: string[];
    values: string[];
    education: string[];
  };
  innovation: {
    experimentation: string[];
    balance: string[];
    adaptability: string[];
  };
  risks: {
    scarcity: string[];
    trust: string[];
    power: string[];
    culture: string[];
  };
  metrics: {
    stability: string[];
    fairness: string[];
    efficiency: string[];
    cooperation: string[];
    resilience: string[];
    legitimacy: string[];
  };
  optimization: {
    indicators: string[];
    mechanisms: string[];
    decisionLoop: string[];
  };
}

export interface WorkflowConfig {
  maxIterations?: number;
  convergenceThreshold?: number;
}

export interface WorkflowState {
  currentStep: number;
  iteration: number;
  maxIterations: number;
  agentResults: Map<AgentType, AgentOutput>;
  conflicts: Conflict[];
  history: WorkflowSnapshot[];
  failures: AgentFailure[];
}

interface WorkflowSnapshot {
  iteration: number;
  agentOutputs: AgentOutput[];
  conflicts: Conflict[];
  timestamp: string;
}

export interface AnalysisContext {
  hypothesis: Hypothesis;
  previousOutputs?: Map<AgentType, AgentOutput>;
  iteration: number;
  conflicts: Conflict[];
  agentType?: AgentType;
}

export interface AgentInstance {
  name: string;
  agentType: AgentType;
  systemPrompt: string;
  outputSchema: {
    conclusion: string;
    evidence: string[];
    risks: string[];
    suggestions: string[];
    falsifiable: string;
  };
}
