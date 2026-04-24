/// <reference types="@figma/plugin-typings" />

import { extractNode } from './core/extractor';
import { normalize } from './core/normalizer';
import { getRenderer } from './renderers/index';
import { PluginMessage, UIMessage } from './core/types';

// ─────────────────────────────────────────────
// Entry point — runs in Figma main thread
// ─────────────────────────────────────────────

figma.showUI(__html__, { width: 440, height: 360, title: 'Design Extractor' });

let currentConfig: any = null;

figma.ui.onmessage = (msg: PluginMessage) => {
  switch (msg.type) {
    case 'EXTRACT':
      handleExtract();
      break;
    case 'RESIZE':
      if (msg.width && msg.height) {
        figma.ui.resize(msg.width, msg.height);
      }
      break;
    case 'SET_CONFIG':
      currentConfig = msg.config;
      break;
    case 'CLOSE':
      figma.closePlugin();
      break;
  }
};

function handleExtract(): void {
  try {
    const selection = figma.currentPage.selection;
    const nodes = selection.length > 0
      ? selection
      : figma.currentPage.children as readonly SceneNode[];

    if (nodes.length === 0) {
      sendToUI({ type: 'ERROR', message: 'No nodes selected or found on page.' });
      return;
    }

    // Pipeline: extract → normalize (clean + flatten + enrich)
    const enrichedNodes = nodes
      .map(extractNode)
      .map(normalize)
      .filter((n): n is NonNullable<typeof n> => n !== null);

    // Delegate to the strategy renderer based on active config flavor
    const renderer = getRenderer(currentConfig?.flavor);
    const json = renderer.render(enrichedNodes, currentConfig);

    sendToUI({ type: 'RESULT', json, nodeCount: enrichedNodes.length });
  } catch (err) {
    sendToUI({
      type: 'ERROR',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

function sendToUI(msg: UIMessage): void {
  figma.ui.postMessage(msg);
}
