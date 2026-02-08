import { useEffect, useState } from 'react';
import { fetchHistory } from '../lib/api';
import { ResultsPanel } from '../components/visualizations/ResultsPanel';
import type { HistoryItem } from '../types';
import { Clock, ChevronRight } from 'lucide-react';

export function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    return (
      <div className="history-page">
        <div className="page-header">
          <button className="btn btn-ghost" onClick={() => setSelected(null)}>
            ← 返回列表
          </button>
          <h2>分析详情 #{selected.id}</h2>
        </div>
        <ResultsPanel model={selected.model} />
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="page-header">
        <h2>历史记录</h2>
      </div>

      {loading && <div className="loading-state">加载中...</div>}
      {error && <div className="card card-error"><p>{error}</p></div>}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <Clock size={48} />
          <h3>暂无历史记录</h3>
          <p>运行一次推演分析后,结果会自动保存在这里</p>
        </div>
      )}

      <div className="history-list">
        {items.map(item => (
          <div key={item.id} className="card history-card" onClick={() => setSelected(item)}>
            <div className="history-card-content">
              <div className="history-meta">
                <span className="history-id">#{item.id}</span>
                <span className="history-date">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <div className="history-stats">
                <span>置信度: {Math.round(item.model.metadata.confidence * 100)}%</span>
                <span>迭代: {item.model.metadata.iterations}</span>
                <span>Agent: {item.model.agentOutputs.length}</span>
                <span>冲突: {item.model.conflicts.length}</span>
              </div>
              <div className="history-hypothesis">
                {item.model.hypothesis.assumptions.slice(0, 2).map((a, i) => (
                  <span key={i} className="hyp-tag">{a.slice(0, 30)}...</span>
                ))}
              </div>
            </div>
            <ChevronRight size={20} className="history-arrow" />
          </div>
        ))}
      </div>
    </div>
  );
}
