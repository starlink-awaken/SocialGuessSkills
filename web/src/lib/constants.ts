import type { AgentMeta, AgentType } from '../types';

export const AGENT_COLORS: Record<AgentType, string> = {
  systems: '#3b82f6',
  econ: '#10b981',
  socio: '#8b5cf6',
  governance: '#f59e0b',
  culture: '#ec4899',
  risk: '#ef4444',
  validation: '#06b6d4',
  environmental: '#22c55e',
  demographic: '#a855f7',
  infrastructure: '#64748b',
  technology: '#0ea5e9',
  historical: '#d97706',
};

export const AGENT_ICONS: Record<AgentType, string> = {
  systems: '⚙️',
  econ: '📊',
  socio: '👥',
  governance: '🏛️',
  culture: '🎭',
  risk: '⚠️',
  validation: '✅',
  environmental: '🌿',
  demographic: '📈',
  infrastructure: '🏗️',
  technology: '💻',
  historical: '📜',
};

export const AGENT_NAMES: Record<AgentType, string> = {
  systems: '系统论',
  econ: '经济学',
  socio: '社会学',
  governance: '治理',
  culture: '文化',
  risk: '风险',
  validation: '验证',
  environmental: '环境',
  demographic: '人口',
  infrastructure: '基础设施',
  technology: '技术',
  historical: '历史',
};

export const CORE_AGENTS: AgentType[] = ['systems', 'econ', 'socio', 'governance', 'culture', 'risk', 'validation'];
export const EXTENDED_AGENTS: AgentType[] = ['environmental', 'demographic', 'infrastructure', 'technology', 'historical'];
export const ALL_AGENTS: AgentType[] = [...CORE_AGENTS, ...EXTENDED_AGENTS];

export const SEVERITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

export const CONFLICT_TYPE_NAMES: Record<string, string> = {
  logical: '逻辑矛盾',
  priority: '优先级冲突',
  risk_amplification: '风险叠加',
  goal: '目标冲突',
  constraint: '约束冲突',
  evidence: '证据矛盾',
};

export const WORKFLOW_STEPS = [
  { id: 1, name: '假设验证', icon: '🔍' },
  { id: 2, name: 'Agent执行', icon: '🤖' },
  { id: 3, name: '冲突检测', icon: '⚡' },
  { id: 4, name: '模型合成', icon: '🔧' },
  { id: 5, name: '模型验证', icon: '✅' },
  { id: 6, name: '迭代收敛', icon: '🎯' },
];

export const STRUCTURE_LAYERS = [
  { key: 'overall', name: '总体结构', icon: '🏗️', color: '#3b82f6' },
  { key: 'workflow', name: '工作流程', icon: '🔄', color: '#10b981' },
  { key: 'institutions', name: '制度体系', icon: '📋', color: '#8b5cf6' },
  { key: 'governance', name: '治理架构', icon: '🏛️', color: '#f59e0b' },
  { key: 'culture', name: '文化体系', icon: '🎭', color: '#ec4899' },
  { key: 'innovation', name: '创新机制', icon: '💡', color: '#06b6d4' },
  { key: 'risks', name: '风险控制', icon: '🛡️', color: '#ef4444' },
  { key: 'metrics', name: '指标体系', icon: '📊', color: '#22c55e' },
  { key: 'optimization', name: '优化机制', icon: '🎯', color: '#a855f7' },
];
