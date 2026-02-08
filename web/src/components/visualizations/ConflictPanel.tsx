import type { Conflict } from '../../types';
import { SEVERITY_COLORS, CONFLICT_TYPE_NAMES, AGENT_NAMES } from '../../lib/constants';

interface Props {
  conflicts: Conflict[];
}

export function ConflictPanel({ conflicts }: Props) {
  const bySeverity = {
    high: conflicts.filter(c => c.severity === 'high'),
    medium: conflicts.filter(c => c.severity === 'medium'),
    low: conflicts.filter(c => c.severity === 'low'),
  };

  return (
    <div className="conflict-panel">
      <div className="conflict-summary">
        {(['high', 'medium', 'low'] as const).map(s => (
          <div key={s} className="conflict-count" style={{ borderColor: SEVERITY_COLORS[s] }}>
            <span className="count">{bySeverity[s].length}</span>
            <span className="label">{s === 'high' ? '高' : s === 'medium' ? '中' : '低'}风险</span>
          </div>
        ))}
      </div>

      <div className="conflict-list">
        {conflicts.map((conflict, i) => (
          <div key={i} className="conflict-item" style={{ borderLeftColor: SEVERITY_COLORS[conflict.severity] }}>
            <div className="conflict-header">
              <span className="conflict-type">{CONFLICT_TYPE_NAMES[conflict.type] || conflict.type}</span>
              <span className="conflict-severity" style={{ color: SEVERITY_COLORS[conflict.severity] }}>
                {conflict.severity.toUpperCase()}
              </span>
            </div>
            <p className="conflict-desc">{conflict.description}</p>
            <div className="conflict-agents">
              {conflict.involvedAgents.map(a => (
                <span key={a} className="agent-tag">{AGENT_NAMES[a] || a}</span>
              ))}
            </div>
            {conflict.resolutionStrategy && (
              <p className="conflict-resolution">💡 {conflict.resolutionStrategy}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
