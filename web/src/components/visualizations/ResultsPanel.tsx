import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { SocialSystemModel, AgentOutput } from '../../types';
import { AGENT_COLORS, AGENT_NAMES, STRUCTURE_LAYERS } from '../../lib/constants';
import { Download } from 'lucide-react';

interface Props {
  model: SocialSystemModel;
}

type TabId = 'overview' | 'agents' | 'structure' | 'export';

export function ResultsPanel({ model }: Props) {
  const [tab, setTab] = useState<TabId>('overview');

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'overview', label: '总览', icon: '📊' },
    { id: 'agents', label: 'Agent输出', icon: '🤖' },
    { id: 'structure', label: '模型结构', icon: '🏗️' },
    { id: 'export', label: '导出', icon: '📤' },
  ];

  return (
    <div className="card results-panel">
      <div className="card-header">
        <h3>🎯 推演结果</h3>
        <div className="result-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && <OverviewTab model={model} />}
      {tab === 'agents' && <AgentsTab outputs={model.agentOutputs} />}
      {tab === 'structure' && <StructureTab model={model} />}
      {tab === 'export' && <ExportTab model={model} />}
    </div>
  );
}

function OverviewTab({ model }: { model: SocialSystemModel }) {
  const confidence = model.metadata.confidence;
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (confidence * circumference);

  // Radar data from structure layers
  const radarData = STRUCTURE_LAYERS.map(layer => {
    const section = model.structure[layer.key as keyof typeof model.structure];
    const items = section ? Object.values(section).flat().length : 0;
    return { subject: layer.name, value: Math.min(items * 10, 100), fullMark: 100 };
  });

  return (
    <div className="overview-tab">
      <div className="overview-grid">
        {/* Confidence Gauge */}
        <div className="gauge-card">
          <h4>置信度</h4>
          <div className="confidence-gauge">
            <svg viewBox="0 0 140 140" className="gauge-svg">
              <circle cx="70" cy="70" r="60" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle cx="70" cy="70" r="60" fill="none"
                stroke={confidence > 0.8 ? '#22c55e' : confidence > 0.6 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <text x="70" y="65" textAnchor="middle" fontSize="24" fontWeight="bold"
                fill="var(--text-primary)">
                {Math.round(confidence * 100)}%
              </text>
              <text x="70" y="85" textAnchor="middle" fontSize="11" fill="var(--text-tertiary)">
                confidence
              </text>
            </svg>
          </div>
        </div>

        {/* Meta stats */}
        <div className="meta-stats">
          <div className="meta-item">
            <span className="meta-label">迭代次数</span>
            <span className="meta-value">{model.metadata.iterations}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">收敛迭代</span>
            <span className="meta-value">{model.metadata.convergedAtIteration ?? '-'}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">最终相似度</span>
            <span className="meta-value">
              {model.metadata.finalSimilarity ? `${Math.round(model.metadata.finalSimilarity * 100)}%` : '-'}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Agent数量</span>
            <span className="meta-value">{model.agentOutputs.length}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">冲突数量</span>
            <span className="meta-value">{model.conflicts.length}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">生成时间</span>
            <span className="meta-value">{new Date(model.metadata.generatedAt).toLocaleString()}</span>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="radar-card">
          <h4>模型覆盖度</h4>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" fontSize={10} stroke="var(--text-secondary)" />
              <PolarRadiusAxis domain={[0, 100]} fontSize={9} stroke="var(--text-tertiary)" />
              <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function AgentsTab({ outputs }: { outputs: AgentOutput[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="agents-tab">
      {outputs.map(output => {
        const isExpanded = expanded === output.agentType;
        const color = AGENT_COLORS[output.agentType];
        return (
          <div key={output.agentType} className="agent-output-card" style={{ borderLeftColor: color }}
            onClick={() => setExpanded(isExpanded ? null : output.agentType)}>
            <div className="agent-output-header">
              <span className="agent-output-name" style={{ color }}>{AGENT_NAMES[output.agentType]}</span>
              <span className="agent-output-toggle">{isExpanded ? '▲' : '▼'}</span>
            </div>
            <p className="agent-conclusion-text">{output.conclusion}</p>
            {isExpanded && (
              <div className="agent-output-detail">
                <div className="detail-section">
                  <h5>📋 证据</h5>
                  <ul>{output.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
                <div className="detail-section">
                  <h5>⚠️ 风险</h5>
                  <ul>{output.risks.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
                <div className="detail-section">
                  <h5>💡 建议</h5>
                  <ul>{output.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div className="detail-section">
                  <h5>🔬 可证伪点</h5>
                  <p>{output.falsifiable}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StructureTab({ model }: { model: SocialSystemModel }) {
  return (
    <div className="structure-tab">
      {STRUCTURE_LAYERS.map(layer => {
        const section = model.structure[layer.key as keyof typeof model.structure];
        if (!section) return null;
        const entries = Object.entries(section).filter(([, v]) => v.length > 0);
        if (entries.length === 0) return null;

        return (
          <div key={layer.key} className="structure-layer" style={{ borderLeftColor: layer.color }}>
            <h4>
              <span className="layer-badge" style={{ background: `${layer.color}22`, color: layer.color }}>
                {layer.icon} {layer.name}
              </span>
            </h4>
            <div className="layer-content">
              {entries.map(([key, values]) => (
                <div key={key} className="layer-subsection">
                  <span className="subsection-key">{key}</span>
                  <ul>
                    {values.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExportTab({ model }: { model: SocialSystemModel }) {
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-model-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-tab">
      <button className="btn btn-primary" onClick={downloadJSON}>
        <Download size={16} /> 下载 JSON
      </button>
      <div className="json-preview">
        <pre>{JSON.stringify(model, null, 2)}</pre>
      </div>
    </div>
  );
}
