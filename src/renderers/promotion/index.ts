import { EnrichedNode } from '../../core/types';
import { PluginRenderer } from '../types';
import { mapNode } from './mapper';
import { optimizeData } from '../optimizer';

export class PromotionRnRenderer implements PluginRenderer {
  render(nodes: EnrichedNode[], config: any): string {
    const data = nodes.map(node => mapNode(node));
    const optimized = optimizeData(data);

    const payload = {
      type: 'template_widget',
      templateType: 'SDUI_WIDGET',
      data: optimized,
    };

    return JSON.stringify(payload, null, 2);
  }
}
