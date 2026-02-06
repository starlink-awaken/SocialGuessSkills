import type { AgentType, AgentInstance } from "../types";
import { readFile } from "fs/promises";

export async function loadPrompt(agentType: AgentType): Promise<string> {
  const promptPath = `src/agents/prompts/${agentType}-agent.md`;
  const content = await readFile(promptPath, "utf-8");

  if (!content) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }

  return content;
}

export async function createAgent(agentType: AgentType): Promise<AgentInstance> {
  const systemPrompt = await loadPrompt(agentType);

  const agentNames: Record<AgentType, string> = {
    systems: "Systems Agent",
    econ: "Econ Agent",
    socio: "Socio Agent",
    governance: "Governance Agent",
    culture: "Culture Agent",
    risk: "Risk Agent",
    validation: "Validation Agent"
  };

  return {
    name: agentNames[agentType],
    agentType,
    systemPrompt,
    outputSchema: {
      conclusion: "",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: ""
    }
  };
}

export async function createAllAgents(): Promise<Map<AgentType, AgentInstance>> {
  const agentTypes: AgentType[] = [
    "systems", "econ", "socio", "governance", "culture", "risk", "validation"
  ];

  const agents = new Map<AgentType, AgentInstance>();

  const created = await Promise.all(agentTypes.map((type) => createAgent(type)));
  for (const agent of created) {
    agents.set(agent.agentType, agent);
  }

  return agents;
}
