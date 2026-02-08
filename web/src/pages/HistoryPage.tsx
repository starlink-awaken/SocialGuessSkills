import { useEffect, useState } from 'react';
import { fetchHistory, fetchModel } from '../lib/api';
import { ResultsPanel } from '../components/visualizations/ResultsPanel';
import type { HistorySummary, SocialSystemModel } from '../types';
import { Clock, ChevronRight } from 'lucide-react';

export function HistoryPage() {
  const [items, setItems] = useState<HistorySummary[]>([]);
  const [selectedModel, setSelectedModel] = useState<SocialSystemModel | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await fetchModel(id);
      setSelectedModel(detail.model);
      setSelectedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model');
    } finally {
      setDetailLoading(false);
    }
  };

  if (selectedModel && selectedId) {
    return (
      <div className="history-page">
        <div className="page-header">
          <button className="btn btn-ghost" onClick={() => { setSelectedModel(null); setSelectedId(null); }}>
            ← 返回列表
          </button>
          <h2>分析详情 #{selectedId}</h2>
        </div>
        <ResultsPanel model={selectedModel} />
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

      {detailLoading && <div className="loading-state">加载模型详情...</div>}

      <div className="history-list">
        {items.map(item => (
          <div key={item.id} className="card history-card" onClick={() => handleSelect(item.id)}>
            <div className="history-card-content">
              <div className="history-meta">
                <span className="history-id">#{item.id}</span>
                <span className="history-date">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <div className="history-stats">
                <span>置信度: {Math.round(item.summary.confidence * 100)}%</span>
                <span>迭代: {item.summary.iterations}</span>
                <span>Agent: {item.summary.agentCount}</span>
                <span>冲突: {item.summary.conflictCount}</span>
              </div>
            </div>
            <ChevronRight size={20} className="history-arrow" />
          </div>
        ))}
      </div>
    </div>
  );
}
