import type { AgentType, AgentInstance } from "../types";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadPrompt(agentType: AgentType): Promise<string> {
  const promptPath = join(__dirname, 'prompts', `${agentType}-agent.md`);
  const content = readFileSync(promptPath, "utf-8");

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
    validation: "Validation Agent",
    environmental: "Environmental Agent",
    demographic: "Demographic Agent",
    infrastructure: "Infrastructure Agent",
    technology: "Technology Agent",
    historical: "Historical Agent"
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

  for (const type of agentTypes) {
    const agent = await createAgent(type);
    agents.set(type, agent);
  }

  return agents;
}
