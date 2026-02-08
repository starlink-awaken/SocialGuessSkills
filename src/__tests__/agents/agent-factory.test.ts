import { describe, test, expect, beforeEach } from "bun:test";
import { createAgent } from "../agent-factory.js";
import { AgentType } from "../../types";

describe("AgentFactory", () => {
  beforeEach(() => {
    // 测试前不做任何操作
  });

  describe("createAgent", () => {
    test("应该为所有 7 个原有 Agent 类型创建 Agent 实例", () => {
      const originalAgents: AgentType[] = ["systems", "econ", "socio", "governance", "culture", "risk", "validation"];
      
      for (const agentType of originalAgents) {
        const agent = createAgent(agentType);
        
        expect(agent).toBeDefined();
        expect(agent).toBeInstanceOf(Object);
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("agentType");
        expect(agent).toHaveProperty("systemPrompt");
        expect(agent).toHaveProperty("outputSchema");
        
        expect(agent.name).toBe(agent.name);
        expect(agent.agentType).toBe(agent.agentType);
        expect(typeof agent.systemPrompt).toBe("string");
        expect(typeof agent.systemPrompt).toBeGreaterThan(700); // 最小长度要求
      }
    });

    test("应该为 5 个新 Agent 类型创建 Agent 实例", () => {
      const newAgents: AgentType[] = ["environmental", "demographic", "infrastructure", "technology", "historical"];
      
      for (const agentType of newAgents) {
        const agent = createAgent(agentType);
        
        expect(agent).toBeDefined();
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("agentType");
        expect(agent).toHaveProperty("systemPrompt");
        expect(agent).toHaveProperty("outputSchema");
        
        expect(agent.name).toBe(agent.name);
        expect(agent.agentType).toBe(agent.agentType);
        expect(typeof agent.systemPrompt).toBe("string");
        expect(typeof agent.systemPrompt).toBeGreaterThan(700); // 新 Agent 最小长度要求
      }
    });

    test("新 Agent 的名称应该正确", () => {
      const agent = createAgent("environmental");
      expect(agent.name).toBe("Environmental Agent");
      
      const agent2 = createAgent("demographic");
      expect(agent2.name).toBe("Demographic Agent");
      
      const agent3 = createAgent("infrastructure");
      expect(agent3.name).toBe("Infrastructure Agent");
      
      const agent4 = createAgent("technology");
      expect(agent4.name).toBe("Technology Agent");
      
      const agent5 = createAgent("historical");
      expect(agent5.name).toBe("Historical Agent");
    });
  });

describe("createAllAgents", () => {
  beforeEach(() => {
    // 测试前不做任何操作
  });

  test("应该返回包含 12 个 Agent 的 Map", () => {
    const agents = createAllAgents();
    
    expect(agents).toBeDefined();
    expect(agents).toBeInstanceOf(Map);
    expect(agents.size).toBe(12); // 7 个原有 + 5 个新 Agent
  });

  test("Map 中应该包含所有 7 个原有 Agent 类型", () => {
    const agents = createAllAgents();
    
    const originalAgents: AgentType[] = ["systems", "econ", "socio", "governance", "culture", "risk", "validation"];
    for (const agentType of originalAgents) {
      expect(agents.has(agentType)).toBe(true);
    }
  });

  test("Map 中应该包含所有 5 个新 Agent 类型", () => {
    const agents = createAllAgents();
    
    const newAgents: AgentType[] = ["environmental", "demographic", "infrastructure", "technology", "historical"];
    for (const agentType of newAgents) {
      expect(agents.has(agentType)).toBe(true);
    }
  });
  });
});
