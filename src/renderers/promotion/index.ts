import { EnrichedNode } from '../../core/types';
import { PluginRenderer } from '../types';
import { mapNode } from './mapper';

export class PromotionRnRenderer implements PluginRenderer {
  render(nodes: EnrichedNode[], config: any): string {
    const isScrollable = config?.settings?.rootContainer === 'scrollable';

    const schemas = nodes.map(node => ({
      rnSchema: {
        renderEngine: 'React Native',
        _pluginProfile: config?.flavor ?? 'promotion_rn',
        _notes: config?.settings?.notes ?? '',
        // RN Promotions always wrap root in a SafeArea
        root: {
          type: 'SafeAreaView',
          scrollEnabled: isScrollable || undefined,
          style: { flex: 1 },
          body: mapNode(node),
        },
      },
    }));

    const payload = schemas.length === 1 ? schemas[0] : schemas;
    return JSON.stringify(payload, null, 2);
  }
}
