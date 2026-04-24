/// <reference types="@figma/plugin-typings" />

import { extractNode } from './extractor';
import { normalize } from './normalizer';
import { mapToSDUI } from './schema';
import { toJSON } from './exporter';
import { PluginMessage, UIMessage } from './types';

// ─────────────────────────────────────────────
// Entry point — runs in Figma main thread
// ─────────────────────────────────────────────

figma.showUI(__html__, { width: 440, height: 360, title: 'Design Extractor — SDUI' });

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

    // Pipeline: extract → normalize (clean + flatten + enrich) → map to SDUI schema
    const sduiNodes = nodes
      .map(extractNode)
      .map(normalize)
      .filter((n): n is NonNullable<typeof n> => n !== null)
      .map(mapToSDUI);

    const json = toJSON(sduiNodes);

    sendToUI({
      type: 'RESULT',
      json: json,
      nodeCount: sduiNodes.length,
    });
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
