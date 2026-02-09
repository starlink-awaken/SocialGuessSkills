import { useEffect, useRef, useState } from 'react';
import type { AgentType, Conflict } from '../../types';
import { CORE_AGENTS, EXTENDED_AGENTS, ADVANCED_AGENTS, AGENT_COLORS, AGENT_ICONS, AGENT_NAMES } from '../../lib/constants';

interface Props {
  activeAgents?: Set<AgentType>;
  completedAgents?: Set<AgentType>;
  conflicts?: Conflict[];
  showExtended?: boolean;
  showAdvanced?: boolean;
}

interface NodePos { x: number; y: number; type: AgentType }

export function AgentNetwork({ activeAgents, completedAgents, conflicts, showExtended = false, showAdvanced = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredAgent, setHoveredAgent] = useState<AgentType | null>(null);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(function animate() {
      setTime(t => t + 0.02);
      requestAnimationFrame(animate);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const agents = showAdvanced
    ? [...CORE_AGENTS, ...EXTENDED_AGENTS, ...ADVANCED_AGENTS]
    : showExtended ? [...CORE_AGENTS, ...EXTENDED_AGENTS] : CORE_AGENTS;
  const cx = 200, cy = showAdvanced ? 210 : 180;
  const coreR = showAdvanced ? 90 : 120, extR = showAdvanced ? 145 : 170, advR = 195;

  const nodes: NodePos[] = CORE_AGENTS.map((type, i) => {
    const angle = (i / CORE_AGENTS.length) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * coreR, y: cy + Math.sin(angle) * coreR, type };
  });

  if (showExtended || showAdvanced) {
    EXTENDED_AGENTS.forEach((type, i) => {
      const angle = (i / EXTENDED_AGENTS.length) * Math.PI * 2 - Math.PI / 2 + 0.3;
      nodes.push({ x: cx + Math.cos(angle) * extR, y: cy + Math.sin(angle) * extR, type });
    });
  }

  if (showAdvanced) {
    ADVANCED_AGENTS.forEach((type, i) => {
      const angle = (i / ADVANCED_AGENTS.length) * Math.PI * 2 - Math.PI / 2 + 0.5;
      nodes.push({ x: cx + Math.cos(angle) * advR, y: cy + Math.sin(angle) * advR, type });
    });
  }

  const getNodeStatus = (type: AgentType) => {
    if (completedAgents?.has(type)) return 'completed';
    if (activeAgents?.has(type)) return 'active';
    return 'idle';
  };

  const conflictPairs = (conflicts || []).flatMap(c => {
    const pairs: [AgentType, AgentType][] = [];
    for (let i = 0; i < c.involvedAgents.length; i++) {
      for (let j = i + 1; j < c.involvedAgents.length; j++) {
        pairs.push([c.involvedAgents[i], c.involvedAgents[j]]);
      }
    }
    return pairs.map(p => ({ pair: p, severity: c.severity }));
  });

  return (
    <svg ref={svgRef} viewBox={showAdvanced ? "0 0 400 420" : "0 0 400 360"} className="agent-network-svg">
      <defs>
        <radialGradient id="bg-glow">
          <stop offset="0%" stopColor="rgba(59,130,246,0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-strong">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r={coreR + 30} fill="url(#bg-glow)" />

      {/* Connection lines between core agents */}
      {CORE_AGENTS.map((_, i) => {
        const next = (i + 1) % CORE_AGENTS.length;
        const a = nodes[i], b = nodes[next];
        if (!a || !b) return null;
        return (
          <line key={`conn-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="rgba(100,130,200,0.15)" strokeWidth="1" strokeDasharray="4 4" />
        );
      })}

      {/* Conflict arcs */}
      {conflictPairs.map(({ pair, severity }, i) => {
        const a = nodes.find(n => n.type === pair[0]);
        const b = nodes.find(n => n.type === pair[1]);
        if (!a || !b) return null;
        const color = severity === 'high' ? '#ef4444' : severity === 'medium' ? '#f59e0b' : '#22c55e';
        return (
          <line key={`conflict-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={color} strokeWidth="2" strokeDasharray="6 4"
            opacity={0.5 + Math.sin(time * 3 + i) * 0.3}
            filter="url(#glow)" />
        );
      })}

      {/* Agent nodes */}
      {nodes.map(({ x, y, type }) => {
        const status = getNodeStatus(type);
        const color = AGENT_COLORS[type];
        const isHovered = hoveredAgent === type;
        const isCore = CORE_AGENTS.includes(type);
        const r = isCore ? 24 : 20;
        const pulseR = r + 6 + Math.sin(time * 2) * 3;

        return (
          <g key={type}
            onMouseEnter={() => setHoveredAgent(type)}
            onMouseLeave={() => setHoveredAgent(null)}
            style={{ cursor: 'pointer' }}>
            {/* Pulse ring for active */}
            {status === 'active' && (
              <circle cx={x} cy={y} r={pulseR} fill="none" stroke={color}
                strokeWidth="2" opacity={0.4} filter="url(#glow-strong)" />
            )}
            {/* Completed glow */}
            {status === 'completed' && (
              <circle cx={x} cy={y} r={r + 4} fill="none" stroke={color}
                strokeWidth="1.5" opacity={0.6} filter="url(#glow)" />
            )}
            {/* Node circle */}
            <circle cx={x} cy={y} r={r}
              fill={status === 'completed' ? color : `${color}22`}
              stroke={color} strokeWidth={isHovered ? 3 : 2}
              filter={isHovered ? 'url(#glow-strong)' : undefined}
              opacity={status === 'idle' ? 0.7 : 1} />
            {/* Icon */}
            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central"
              fontSize={isCore ? 16 : 14} style={{ pointerEvents: 'none' }}>
              {AGENT_ICONS[type]}
            </text>
            {/* Label */}
            <text x={x} y={y + r + 14} textAnchor="middle" fontSize="10"
              fill="var(--text-secondary)" style={{ pointerEvents: 'none' }}>
              {AGENT_NAMES[type]}
            </text>
          </g>
        );
      })}

      {/* Center label */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="12" fill="var(--text-tertiary)">
        Multi-Agent
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11" fill="var(--text-tertiary)">
        Reasoning
      </text>

      {/* Hover tooltip */}
      {hoveredAgent && (() => {
        const node = nodes.find(n => n.type === hoveredAgent);
        if (!node) return null;
        const tx = node.x > cx ? node.x + 40 : node.x - 40;
        const ty = node.y - 10;
        return (
          <g>
            <rect x={tx - 45} y={ty - 12} width="90" height="24" rx="6"
              fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="1" />
            <text x={tx} y={ty + 3} textAnchor="middle" fontSize="11" fill="var(--text-primary)">
              {AGENT_NAMES[hoveredAgent]} Agent
            </text>
          </g>
        );
      })()}
    </svg>
  );
}
