import { EnrichedNode } from '../core/types';

export interface PluginRenderer {
  render(nodes: EnrichedNode[], config: any): string;
}
