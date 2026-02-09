import type { AgentType, AgentInstance } from "../types";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_AGENT_TYPES: AgentType[] = [
  "systems", "econ", "socio", "governance", "culture", "risk", "validation"
];

const EXTENDED_AGENT_TYPES: AgentType[] = [
  "environmental", "demographic", "infrastructure", "technology", "historical"
];

const ADVANCED_AGENT_TYPES: AgentType[] = [
  "geopolitics", "ethnicity", "religion", "military", "disaster", "emergency"
];

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
  historical: "Historical Agent",
  geopolitics: "Geopolitics Agent",
  ethnicity: "Ethnicity Agent",
  religion: "Religion Agent",
  military: "Military Agent",
  disaster: "Disaster Agent",
  emergency: "Emergency Agent"
};

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

export interface CreateAllAgentsOptions {
  /** Include extended agents (environmental...historical) AND advanced agents (geopolitics...emergency) */
  extended?: boolean;
  /** Include advanced agents (geopolitics, ethnicity, religion, military, disaster, emergency) */
  advanced?: boolean;
}

export async function createAllAgents(
  options: CreateAllAgentsOptions = {}
): Promise<Map<AgentType, AgentInstance>> {
  const types = options.advanced
    ? [...BASE_AGENT_TYPES, ...EXTENDED_AGENT_TYPES, ...ADVANCED_AGENT_TYPES]
    : options.extended
      ? [...BASE_AGENT_TYPES, ...EXTENDED_AGENT_TYPES]
      : BASE_AGENT_TYPES;

  const results = await Promise.all(types.map(type => createAgent(type)));
  const agents = new Map<AgentType, AgentInstance>();
  results.forEach((agent, i) => {
    const t = types[i];
    if (t) agents.set(t, agent);
  });
  return agents;
}
