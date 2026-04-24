import { RawNode, EnrichedNode, SemanticRole } from './types';

// ─────────────────────────────────────────────
// Step 1: Clean — remove invisible nodes
// ─────────────────────────────────────────────

export function cleanNode(node: RawNode): RawNode | null {
  if (!node.visible) return null;
  const children = node.children
    .map(cleanNode)
    .filter((c): c is RawNode => c !== null);

  return { ...node, visible: true, children };
}

// ─────────────────────────────────────────────
// Step 2: Flatten — collapse single-child wrappers
// ─────────────────────────────────────────────

export function flattenNode(node: RawNode): RawNode {
  const flatChildren = node.children.map(flattenNode);

  // Merge passthrough wrapper into its only child
  if (flatChildren.length === 1 && !node.text && !hasSignificantStyle(node)) {
    return flatChildren[0];
  }
  return { ...node, children: flatChildren };
}

function hasSignificantStyle(node: RawNode): boolean {
  const { backgroundColor, borderRadius, borderWidth } = node.style;
  return !!(
    backgroundColor ||
    (borderRadius && borderRadius > 0) ||
    (borderWidth && borderWidth > 0)
  );
}

// ─────────────────────────────────────────────
// Step 3: Enrich — add semantic role hints
// ─────────────────────────────────────────────

export function enrichNode(node: RawNode): EnrichedNode {
  const children = node.children.map(enrichNode);
  const role = detectRole(node);
  return { ...node, children, ...(role ? { role } : {}) };
}

function detectRole(node: RawNode): SemanticRole | undefined {
  if (node.type === 'TEXT' && node.text) {
    const size = node.text.fontSize;
    if (size >= 24) return 'heading';
    if (size >= 18) return 'subheading';
    if (size <= 11) return 'caption';
    return 'body';
  }

  const name = node.name.toLowerCase();
  if (/\bbtn\b|button|\bcta\b/.test(name)) return 'button';
  if (/input|field|textfield/.test(name)) return 'input';
  if (/\bimg\b|image|photo|avatar|icon/.test(name)) return 'image';
  if (/\bcard\b/.test(name)) return 'card';
  if (/list|flatlist/.test(name)) return 'list';
  if (/scroll/.test(name)) return 'container';

  return undefined;
}

// ─────────────────────────────────────────────
// Full pipeline: clean → flatten → enrich
// ─────────────────────────────────────────────

export function normalize(node: RawNode): EnrichedNode | null {
  const cleaned = cleanNode(node);
  if (!cleaned) return null;
  const flattened = flattenNode(cleaned);
  return enrichNode(flattened);
}
