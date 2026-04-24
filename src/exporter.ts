import { SDUINode } from './types';

// ─────────────────────────────────────────────
// Export utilities
// ─────────────────────────────────────────────

export function toJSON(nodes: SDUINode[]): string {
  // Map root nodes to the expected SDUI schema wrapper
  const schemas = nodes.map(node => ({
    dataSchema: {
      header: {
        showHeader: false,
        backgroundImage: ""
      },
      content: {
        value: {
          modifier: {}, // Can leave empty at root, or extract from node if needed
          body: node
        }
      }
    }
  }));

  // Return a single object if there's only one root, otherwise return array
  const payload = schemas.length === 1 ? schemas[0] : schemas;
  
  return JSON.stringify(payload, null, 2);
}

// Send schema to a local dev server (optional pipeline)
export async function sendToAPI(
  payload: any,
  endpoint = 'http://localhost:3000/design',
): Promise<void> {
  await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload, timestamp: Date.now() }),
  });
}
