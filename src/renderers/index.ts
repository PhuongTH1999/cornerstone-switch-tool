import { PluginRenderer } from './types';
import { MarketingSduiRenderer } from './marketing/index';
import { PromotionRnRenderer } from './promotion/index';

// ─────────────────────────────────────────────
// Renderer Factory
// Add new flavors here as the platform grows
// ─────────────────────────────────────────────

export function getRenderer(flavor?: string): PluginRenderer {
  switch (flavor) {
    case 'promotion_rn':
      return new PromotionRnRenderer();
    case 'marketing_sdui':
    default:
      return new MarketingSduiRenderer();
  }
}
