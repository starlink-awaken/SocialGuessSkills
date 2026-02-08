import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone';

interface SystemStructure {
  overall: Record<string, string[]>;
  workflow: Record<string, string[]>;
  institutions: Record<string, string[]>;
  governance: Record<string, string[]>;
  culture: Record<string, string[]>;
  innovation: Record<string, string[]>;
  risks: Record<string, string[]>;
  metrics: Record<string, string[]>;
  optimization: Record<string, string[]>;
}

interface ModelVisualizationProps {
  structure: SystemStructure;
}

export function ModelVisualization({ structure }: ModelVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 构建节点与边
    const nodes: any[] = [];
    const edges: any[] = [];

    let nodeId = 0;

    // 添加中心节点 (社会体系)
    nodes.push({ id: nodeId++, label: '社会体系', level: 0, color: '#4CAF50' });
    const centerNodeId = 0;

    // 添加 9 层子节点
    const layers: (keyof SystemStructure)[] = [
      'overall',
      'workflow',
      'institutions',
      'governance',
      'culture',
      'innovation',
      'risks',
      'metrics',
      'optimization',
    ];
    const layerLabels: Record<keyof SystemStructure, string> = {
      overall: '总体结构',
      workflow: '工作流',
      institutions: '制度',
      governance: '治理',
      culture: '文化',
      innovation: '创新',
      risks: '风险',
      metrics: '指标',
      optimization: '优化',
    };

    for (const layer of layers) {
      const layerId = nodeId++;
      nodes.push({ id: layerId, label: layerLabels[layer], level: 1, color: '#2196F3' });
      edges.push({ from: centerNodeId, to: layerId });

      // 添加子字段节点
      const layerData = structure[layer];
      for (const key in layerData) {
        if (Array.isArray(layerData[key]) && layerData[key].length > 0) {
          const fieldId = nodeId++;
          nodes.push({
            id: fieldId,
            label: `${key} (${layerData[key].length})`,
            level: 2,
            color: '#FFC107',
            title: layerData[key].join('\n'), // 鼠标悬停显示详情
          });
          edges.push({ from: layerId, to: fieldId });
        }
      }
    }

    // 创建网络图
    const data = { nodes, edges };
    const options = {
      layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed',
          levelSeparation: 150,
        },
      },
      nodes: {
        shape: 'box',
        font: { size: 14 },
      },
      edges: {
        smooth: { type: 'cubicBezier' },
      },
      physics: false,
    };

    const network = new Network(containerRef.current, data, options);

    return () => {
      network.destroy();
    };
  }, [structure]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">9 层结构可视化</h2>
      <div ref={containerRef} className="w-full h-[600px] border border-gray-300 rounded" />
    </div>
  );
}
