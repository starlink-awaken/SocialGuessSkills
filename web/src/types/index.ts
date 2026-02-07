export interface Hypothesis {
  assumptions: string[];
  constraints: string[];
  goals: string[];
}

export interface AgentExecution {
  agentType: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: {
    conclusion: string;
    evidence: string[];
    risks: string[];
    suggestions: string[];
  };
  error?: string;
}

export interface SocialSystemModel {
  hypothesis: Hypothesis;
  systemStructure: {
    coreAgents: any[];
    interactionPatterns: any[];
    governanceStructure: any[];
    economicModel: any;
    culturalNorms: string[];
    technologyLevel: string;
  };
  agentOutputs: any[];
  conflicts: any[];
  confidenceScore: number;
  iterationCount: number;
}

export interface WorkflowProgress {
  iteration: number;
  converged: boolean;
  agents: AgentExecution[];
}
