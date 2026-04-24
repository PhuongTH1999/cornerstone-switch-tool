import { EnrichedNode } from '../../core/types';
import { PluginRenderer } from '../types';
import { mapNode } from './mapper';

export class MarketingSduiRenderer implements PluginRenderer {
  render(nodes: EnrichedNode[], config: any): string {
    const isScrollable = config?.settings?.rootContainer === 'scrollable';

    const schemas = nodes.map(node => ({
      dataSchema: {
        renderEngine: 'Native SDUI',
        _pluginProfile: config?.flavor ?? 'marketing_sdui',
        _notes: config?.settings?.notes ?? '',
        scrollEnabled: isScrollable || undefined,
        header: {
          showHeader: false,
          backgroundImage: '',
        },
        content: {
          value: {
            modifier: {},
            body: mapNode(node),
          },
        },
      },
    }));

    const payload = schemas.length === 1 ? schemas[0] : schemas;
    return JSON.stringify(payload, null, 2);
  }
}
