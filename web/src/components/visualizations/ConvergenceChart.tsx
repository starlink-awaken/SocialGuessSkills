import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  data: { iteration: number; similarity: number }[];
}

export function ConvergenceChart({ data }: Props) {
  const chartData = data.map(d => ({
    ...d,
    percentage: Math.round(d.similarity * 100),
  }));

  return (
    <div className="convergence-chart">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="iteration"
            stroke="var(--text-tertiary)"
            fontSize={12}
            label={{ value: '迭代次数', position: 'insideBottom', offset: -5, fill: 'var(--text-tertiary)', fontSize: 11 }}
          />
          <YAxis
            stroke="var(--text-tertiary)"
            fontSize={12}
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
            }}
            formatter={(value: number) => [`${value}%`, '相似度']}
          />
          <ReferenceLine y={95} stroke="#22c55e" strokeDasharray="6 4" label={{ value: '收敛阈值 95%', fill: '#22c55e', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="percentage"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2 }}
            activeDot={{ r: 7, strokeWidth: 0, fill: '#60a5fa' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
