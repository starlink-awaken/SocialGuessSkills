import { useNavigate } from 'react-router-dom';
import { Cpu, Zap, Layers, GitBranch } from 'lucide-react';
import { AgentNetwork } from '../components/visualizations/AgentNetwork';
import { CORE_AGENTS, EXTENDED_AGENTS, WORKFLOW_STEPS, STRUCTURE_LAYERS } from '../lib/constants';

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>系统总览</h2>
        <p className="subtitle">多Agent社会体系推演框架 · 7核心 + 5扩展Agent</p>
      </div>

      <div className="stats-row">
        <div className="stat-card glow-blue">
          <Cpu size={24} />
          <div>
            <div className="stat-value">{CORE_AGENTS.length + EXTENDED_AGENTS.length}</div>
            <div className="stat-label">Agent 总数</div>
          </div>
        </div>
        <div className="stat-card glow-purple">
          <Zap size={24} />
          <div>
            <div className="stat-value">{WORKFLOW_STEPS.length}</div>
            <div className="stat-label">推演步骤</div>
          </div>
        </div>
        <div className="stat-card glow-cyan">
          <Layers size={24} />
          <div>
            <div className="stat-value">{STRUCTURE_LAYERS.length}</div>
            <div className="stat-label">模型层级</div>
          </div>
        </div>
        <div className="stat-card glow-green">
          <GitBranch size={24} />
          <div>
            <div className="stat-value">6</div>
            <div className="stat-label">冲突类型</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card agent-network-card">
          <div className="card-header">
            <h3>🧠 Agent 网络拓扑</h3>
            <span className="badge badge-blue">实时</span>
          </div>
          <AgentNetwork />
        </div>

        <div className="card workflow-card">
          <div className="card-header">
            <h3>⚡ 推演流程</h3>
          </div>
          <div className="workflow-steps-preview">
            {WORKFLOW_STEPS.map((step, i) => (
              <div key={step.id} className="step-preview">
                <div className="step-num">{step.icon}</div>
                <div className="step-info">
                  <div className="step-name">{step.name}</div>
                  <div className="step-desc">Step {step.id}</div>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && <div className="step-connector" />}
              </div>
            ))}
          </div>

          <button className="btn btn-primary btn-lg" onClick={() => navigate('/analysis')}>
            <Cpu size={18} /> 开始推演分析
          </button>
        </div>

        <div className="card layers-card">
          <div className="card-header">
            <h3>📐 9层模型架构</h3>
          </div>
          <div className="layers-grid">
            {STRUCTURE_LAYERS.map(layer => (
              <div key={layer.key} className="layer-item" style={{ borderLeftColor: layer.color }}>
                <span className="layer-icon">{layer.icon}</span>
                <span className="layer-name">{layer.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
