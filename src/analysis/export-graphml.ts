import type { SocialSystemModel } from '../types.js';

const STRUCTURE_LAYERS = [
  'overall',
  'workflow',
  'institutions',
  'governance',
  'culture',
  'innovation',
  'risks',
  'metrics',
  'optimization',
] as const;

const GRAPHML_HEADER = `<?xml version="1.0" encoding="UTF-8"?>
<graphml xmlns="http://graphml.graphdrawing.org/xmlns"  
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns 
     http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  <key id="d0" for="node" attr.name="label" attr.type="string"/>
  <key id="d4" for="node" attr.name="color" attr.type="string"/>
  <graph id="G" edgedefault="undirected">`;

const GRAPHML_FOOTER = `  </graph>
</graphml>`;

function escapeGraphMLText(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function exportToGraphML(model: SocialSystemModel): string {
  const nodes: string[] = [];
  const edges: string[] = [];

  nodes.push(`  <node id="social_system">
    <data key="d0">${escapeGraphMLText('社会体系')}</data>
    <data key="d4">#4CAF50</data>
  </node>`);

  STRUCTURE_LAYERS.forEach((layer, index) => {
    const layerId = `layer_${index}`;
    nodes.push(`  <node id="${layerId}">
      <data key="d0">${escapeGraphMLText(layer)}</data>
      <data key="d4">#2196F3</data>
    </node>`);
    edges.push(`  <edge source="social_system" target="${layerId}"/>`);

    const layerData = model.structure[layer];
    if (Array.isArray(layerData)) {
      layerData.forEach((field, fieldIndex) => {
        const fieldId = `${layerId}_${fieldIndex}`;
        nodes.push(`  <node id="${fieldId}">
          <data key="d0">${escapeGraphMLText(field)}</data>
          <data key="d4">#FFC107</data>
        </node>`);
        edges.push(`  <edge source="${layerId}" target="${fieldId}"/>`);
      });
    }
  });

  return `${GRAPHML_HEADER}
    ${nodes.join('\n    ')}
    ${edges.join('\n    ')}
${GRAPHML_FOOTER}`;
}
