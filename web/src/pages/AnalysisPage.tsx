import { useState, useCallback, useRef } from 'react';
import { Play, Square, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { startAnalysis } from '../lib/api';
import { AgentNetwork } from '../components/visualizations/AgentNetwork';
import { WorkflowTimeline } from '../components/visualizations/WorkflowTimeline';
import { ConflictPanel } from '../components/visualizations/ConflictPanel';
import { ConvergenceChart } from '../components/visualizations/ConvergenceChart';
import { ResultsPanel } from '../components/visualizations/ResultsPanel';
import { CORE_AGENTS } from '../lib/constants';
import type { Hypothesis, AgentType, WorkflowProgress, SSEEvent, AgentExecution } from '../types';

const DEFAULT_HYPOTHESIS: Hypothesis = {
  assumptions: [
    '一个1000人的社区需要从零开始建立社会运行规则',
    '成员之间初始信任度低,需要通过协作建立信任',
    '协作能提升总产出30%,但需明确分配机制',
  ],
  constraints: [
    '资源有限,人均可用资源低于生存标准的1.5倍',
    '没有外部权威机构,规则需自行建立与执行',
    '信息不对称,需设计透明机制',
  ],
  goals: [
    '建立稳定可持续的社会运行体系',
    '实现公平的资源分配与有效的冲突解决',
    '培育协作文化,从陌生人网络转化为共同体',
  ],
};

function createInitialProgress(): WorkflowProgress {
  return {
    status: 'idle',
    currentStep: 0,
    stepName: '',
    iteration: 0,
    maxIterations: 3,
    agents: CORE_AGENTS.map(type => ({
      agentType: type, status: 'pending' as const, iteration: 0,
    })),
    conflicts: [],
    convergenceHistory: [],
  };
}

export function AnalysisPage() {
  const [hypothesis, setHypothesis] = useState<Hypothesis>({ ...DEFAULT_HYPOTHESIS });
  const [progress, setProgress] = useState<WorkflowProgress>(createInitialProgress());
  const [showForm, setShowForm] = useState(true);
  const [useExtended, setUseExtended] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const handleEvent = useCallback((event: SSEEvent) => {
    setProgress(prev => {
      const next = { ...prev };

      switch (event.type) {
        case 'workflow-start':
          next.status = 'running';
          next.maxIterations = event.data.maxIterations;
          break;

        case 'step':
          next.currentStep = event.data.step;
          next.stepName = event.data.name;
          break;

        case 'agent-start': {
          const agents = [...next.agents];
          const idx = agents.findIndex(a => a.agentType === event.data.agentType);
          if (idx >= 0) {
            agents[idx] = { ...agents[idx], status: 'running', iteration: event.data.iteration };
          } else {
            agents.push({ agentType: event.data.agentType, status: 'running', iteration: event.data.iteration });
          }
          next.agents = agents;
          next.iteration = event.data.iteration;
          break;
        }

        case 'agent-complete': {
          const agents = [...next.agents];
          const idx = agents.findIndex(a => a.agentType === event.data.agentType);
          if (idx >= 0) {
            agents[idx] = { ...agents[idx], status: 'completed', output: event.data.output, iteration: event.data.iteration };
          }
          next.agents = agents;
          break;
        }

        case 'conflicts':
          next.conflicts = event.data.conflicts;
          break;

        case 'iteration':
          next.convergenceHistory = [
            ...next.convergenceHistory,
            { iteration: event.data.iteration, similarity: event.data.similarity },
          ];
          break;

        case 'complete':
          next.status = 'completed';
          next.model = event.data;
          break;

        case 'error':
          next.status = 'error';
          next.error = event.data.message;
          break;
      }

      return next;
    });
  }, []);

  const handleStart = useCallback(() => {
    setProgress(createInitialProgress());
    setShowForm(false);

    const controller = startAnalysis(
      hypothesis,
      { maxIterations: 3, extendedAgents: useExtended },
      handleEvent,
      () => {},
      (err) => setProgress(p => ({ ...p, status: 'error', error: err.message })),
    );

    controllerRef.current = controller;
  }, [hypothesis, useExtended, handleEvent]);

  const handleStop = () => {
    controllerRef.current?.abort();
    setProgress(p => ({ ...p, status: 'error', error: '用户终止' }));
  };

  const handleReset = () => {
    controllerRef.current?.abort();
    setProgress(createInitialProgress());
    setShowForm(true);
  };

  const activeAgents = new Set(
    progress.agents.filter(a => a.status === 'running').map(a => a.agentType)
  );
  const completedAgents = new Set(
    progress.agents.filter(a => a.status === 'completed').map(a => a.agentType)
  );

  const updateField = (field: keyof Hypothesis, index: number, value: string) => {
    setHypothesis(prev => ({
      ...prev,
      [field]: prev[field].map((v, i) => i === index ? value : v),
    }));
  };

  const addField = (field: keyof Hypothesis) => {
    setHypothesis(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeField = (field: keyof Hypothesis, index: number) => {
    setHypothesis(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="analysis-page">
      <div className="page-header">
        <h2>推演分析</h2>
        <div className="header-actions">
          {progress.status === 'idle' && (
            <button className="btn btn-primary" onClick={handleStart}>
              <Play size={16} /> 开始推演
            </button>
          )}
          {progress.status === 'running' && (
            <button className="btn btn-danger" onClick={handleStop}>
              <Square size={16} /> 终止
            </button>
          )}
          {(progress.status === 'completed' || progress.status === 'error') && (
            <button className="btn btn-secondary" onClick={handleReset}>
              <RotateCcw size={16} /> 重新开始
            </button>
          )}
        </div>
      </div>

      {/* Hypothesis Input */}
      <div className="card">
        <div className="card-header clickable" onClick={() => setShowForm(!showForm)}>
          <h3>📝 假设输入</h3>
          {showForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        {showForm && (
          <div className="hypothesis-form">
            {(['assumptions', 'constraints', 'goals'] as const).map(field => (
              <div key={field} className="form-section">
                <label className="form-label">
                  {field === 'assumptions' ? '🔮 假设条件' : field === 'constraints' ? '🔒 约束条件' : '🎯 目标'}
                </label>
                {hypothesis[field].map((val, i) => (
                  <div key={`${field}-${i}`} className="input-row">
                    <input
                      className="input"
                      value={val}
                      onChange={(e) => updateField(field, i, e.target.value)}
                      placeholder={`输入${field === 'assumptions' ? '假设' : field === 'constraints' ? '约束' : '目标'}...`}
                      disabled={progress.status === 'running'}
                    />
                    {hypothesis[field].length > 1 && (
                      <button className="btn btn-icon btn-danger-ghost" onClick={() => removeField(field, i)}>×</button>
                    )}
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => addField(field)}
                  disabled={progress.status === 'running'}>
                  + 添加
                </button>
              </div>
            ))}
            <div className="form-footer">
              <label className="checkbox-label">
                <input type="checkbox" checked={useExtended}
                  onChange={e => setUseExtended(e.target.checked)}
                  disabled={progress.status === 'running'} />
                启用扩展Agent (12个)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Running / Completed */}
      {progress.status !== 'idle' && (
        <>
          {/* Workflow Timeline */}
          <div className="card">
            <div className="card-header">
              <h3>⚡ 推演流程</h3>
              <div className="iteration-badge">
                迭代 {progress.iteration}/{progress.maxIterations}
              </div>
            </div>
            <WorkflowTimeline currentStep={progress.currentStep} />
          </div>

          {/* Agent Execution Grid + Network */}
          <div className="analysis-grid">
            <div className="card">
              <div className="card-header">
                <h3>🤖 Agent 执行状态</h3>
                <span className="badge badge-green">
                  {completedAgents.size}/{progress.agents.length}
                </span>
              </div>
              <div className="agent-exec-grid">
                {progress.agents.map(agent => (
                  <AgentCard key={agent.agentType} agent={agent} />
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>🧠 网络拓扑</h3>
              </div>
              <AgentNetwork
                activeAgents={activeAgents}
                completedAgents={completedAgents}
                conflicts={progress.conflicts}
                showExtended={useExtended}
              />
            </div>
          </div>

          {/* Conflicts */}
          {progress.conflicts.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>⚡ 冲突检测</h3>
                <span className="badge badge-red">{progress.conflicts.length} 个冲突</span>
              </div>
              <ConflictPanel conflicts={progress.conflicts} />
            </div>
          )}

          {/* Convergence */}
          {progress.convergenceHistory.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>📈 收敛趋势</h3>
              </div>
              <ConvergenceChart data={progress.convergenceHistory} />
            </div>
          )}

          {/* Results */}
          {progress.model && (
            <ResultsPanel model={progress.model} />
          )}

          {/* Error */}
          {progress.status === 'error' && progress.error && (
            <div className="card card-error">
              <h3>❌ 错误</h3>
              <p>{progress.error}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentExecution }) {
  const [expanded, setExpanded] = useState(false);
  const statusClass = `agent-status-${agent.status}`;
  const statusText = { pending: '等待中', running: '执行中', completed: '已完成', error: '错误' };

  return (
    <div className={`agent-exec-card ${statusClass}`} onClick={() => agent.output && setExpanded(!expanded)}>
      <div className="agent-exec-header">
        <span className="agent-exec-type">{agent.agentType}</span>
        <span className={`status-dot ${agent.status}`} />
      </div>
      <div className="agent-exec-status">{statusText[agent.status]}</div>
      {expanded && agent.output && (
        <div className="agent-exec-detail">
          <p className="agent-conclusion">{agent.output.conclusion}</p>
          <div className="agent-meta-row">
            <span>📋 {agent.output.evidence.length} 证据</span>
            <span>⚠️ {agent.output.risks.length} 风险</span>
            <span>💡 {agent.output.suggestions.length} 建议</span>
          </div>
        </div>
      )}
    </div>
  );
}
