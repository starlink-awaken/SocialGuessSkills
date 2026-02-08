import type { AgentMeta, Hypothesis, HistorySummary, HistoryDetail, SocialSystemModel, SSEEvent } from '../types';

const API_BASE = '/api';

export async function fetchAgents(): Promise<AgentMeta[]> {
  const res = await fetch(`${API_BASE}/agents`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

export async function fetchHistory(): Promise<HistorySummary[]> {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function fetchModel(id: number): Promise<HistoryDetail> {
  const res = await fetch(`${API_BASE}/model/${id}`);
  if (!res.ok) throw new Error('Failed to fetch model');
  return res.json();
}

export function startAnalysis(
  hypothesis: Hypothesis,
  options: { maxIterations?: number; extendedAgents?: boolean } = {},
  onEvent: (event: SSEEvent) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): AbortController {
  const controller = new AbortController();

  fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hypothesis, options }),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) {
      onError(new Error(`HTTP ${res.status}`));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let eventType = '';
      let eventData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6);
        } else if (line === '' && eventType && eventData) {
          try {
            const data = JSON.parse(eventData);
            onEvent({ type: eventType, data } as SSEEvent);
          } catch {
            // skip malformed events
          }
          eventType = '';
          eventData = '';
        }
      }
    }

    onDone();
  }).catch((err) => {
    if (err.name !== 'AbortError') {
      onError(err);
    }
  });

  return controller;
}
