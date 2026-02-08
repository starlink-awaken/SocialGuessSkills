import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ModelRanking {
  rank: number;
  modelId: string;
  score: number;
  metrics: {
    confidence: number;
    conflicts: number;
    iterations: number;
  };
}

interface BatchComparisonChartProps {
  data: ModelRanking[];
}

export function BatchComparisonChart({ data }: BatchComparisonChartProps) {
  // 按排名排序（升序）
  const sortedData = [...data].sort((a, b) => a.rank - b.rank);

  // 转换数据格式用于图表显示
  const chartData = sortedData.map((item) => ({
    name: `#${item.rank} ${item.modelId}`,
    confidence: Number((item.metrics.confidence * 100).toFixed(1)),
    conflicts: item.metrics.conflicts,
    score: Number((item.score * 100).toFixed(1)),
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">批量对比结果</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="confidence" fill="#4CAF50" name="置信度 (%)" />
          <Bar dataKey="conflicts" fill="#F44336" name="冲突数" />
          <Bar dataKey="score" fill="#2196F3" name="综合得分 (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
