import type { SocialSystemModel, Hypothesis } from '../types';

export function exportToJSON(model: SocialSystemModel, hypothesis: Hypothesis): string {
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      tool: 'SocialGuess',
    },
    hypothesis,
    model: {
      confidenceScore: model.confidenceScore,
      iterationCount: model.iterationCount,
      systemStructure: model.systemStructure,
      agentOutputs: model.agentOutputs,
      conflicts: model.conflicts,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

export function downloadJSON(data: string, filename: string = 'social-model.json') {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToMarkdown(model: SocialSystemModel, hypothesis: Hypothesis): string {
  const lines: string[] = [];

  lines.push('# Social System Model');
  lines.push('');
  lines.push(`**Exported**: ${new Date().toISOString()}`);
  lines.push(`**Confidence Score**: ${(model.confidenceScore * 100).toFixed(1)}%`);
  lines.push(`**Iterations**: ${model.iterationCount}`);
  lines.push('');

  lines.push('## Hypothesis');
  lines.push('');
  lines.push('### Assumptions');
  hypothesis.assumptions.forEach((a: string) => lines.push(`- ${a}`));
  lines.push('');

  lines.push('### Constraints');
  hypothesis.constraints.forEach((c: string) => lines.push(`- ${c}`));
  lines.push('');

  lines.push('### Goals');
  hypothesis.goals.forEach((g: string) => lines.push(`- ${g}`));
  lines.push('');

  lines.push('## System Structure');
  lines.push('');
  lines.push(`### Technology Level: ${model.systemStructure.technologyLevel}`);
    lines.push('');
    lines.push('### Core Agents');
    model.systemStructure.coreAgents.forEach((agent: unknown) => {
      lines.push(`- ${JSON.stringify(agent)}`);
    });
    lines.push('');

    lines.push('### Cultural Norms');
    model.systemStructure.culturalNorms.forEach((norm: string) => lines.push(`- ${norm}`));
  lines.push('');

  lines.push('## Agent Outputs');
  lines.push('');
  model.agentOutputs.forEach((output: any, index: number) => {
    lines.push(`### ${index + 1}. ${output.agentType}`);
    lines.push(`**Conclusion**: ${output.conclusion}`);
    lines.push('');
    lines.push('**Evidence**:');
    output.evidence.forEach((e: string) => {
      lines.push(`  - ${e}`);
    });
    lines.push('');
    lines.push('**Risks**:');
    output.risks.forEach((r: string) => {
      lines.push(`  - ${r}`);
    });
    lines.push('');
    lines.push('**Suggestions**:');
    output.suggestions.forEach((s: string) => {
      lines.push(`  - ${s}`);
    });
    lines.push('');
  });

  lines.push('## Conflicts');
  lines.push('');
  model.conflicts.forEach((conflict: any) => {
    lines.push(`### ${conflict.type} Conflict`);
    lines.push(`**Agents**: ${conflict.agents.join(', ')}`);
    lines.push(`**Description**: ${conflict.description}`);
    lines.push('');
  });

  return lines.join('\n');
}

export function downloadMarkdown(content: string, filename: string = 'social-model.md') {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
