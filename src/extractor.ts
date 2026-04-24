/// <reference types="@figma/plugin-typings" />

import { RawNode, LayoutInfo, StyleInfo, TextInfo } from './types';

// ─────────────────────────────────────────────
// Core extractor — Figma SceneNode → RawNode
// ─────────────────────────────────────────────

export function extractNode(node: SceneNode): RawNode {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible,
    layout: getLayout(node),
    style: getStyle(node),
    text: getTextInfo(node),
    children: 'children' in node
      ? (node.children as readonly SceneNode[]).map(extractNode)
      : [],
  };
}

// ─────────────────────────────────────────────
// Layout: Auto Layout → Flex / Absolute fallback
// ─────────────────────────────────────────────

function getLayout(node: SceneNode): LayoutInfo {
  let fillMaxWidth = false;
  let fillMaxHeight = false;
  let isFixedWidth = false;
  let isFixedHeight = false;

  const n = node as any;
  if ('layoutSizingHorizontal' in n) {
    if (n.layoutSizingHorizontal === 'FILL') fillMaxWidth = true;
    if (n.layoutSizingHorizontal === 'FIXED') isFixedWidth = true;
    
    if (n.layoutSizingVertical === 'FILL') fillMaxHeight = true;
    if (n.layoutSizingVertical === 'FIXED') isFixedHeight = true;
  } else {
    if (n.layoutAlign === 'STRETCH') {
      if (n.parent?.layoutMode === 'VERTICAL') fillMaxWidth = true;
      if (n.parent?.layoutMode === 'HORIZONTAL') fillMaxHeight = true;
    }
    if (n.layoutGrow === 1) {
      if (n.parent?.layoutMode === 'HORIZONTAL') fillMaxWidth = true;
      if (n.parent?.layoutMode === 'VERTICAL') fillMaxHeight = true;
    }
    isFixedWidth = !fillMaxWidth;
    isFixedHeight = !fillMaxHeight;
  }

  // Text usually hugs content. Buttons shouldn't have hardcoded dimensions per rules.
  if (node.type === 'TEXT') {
    isFixedWidth = false;
    isFixedHeight = false;
  } else if (/\bbtn\b|button|\bcta\b/.test(node.name.toLowerCase())) {
    isFixedWidth = false;
    isFixedHeight = false;
  }

  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    return {
      flexDirection: node.layoutMode === 'HORIZONTAL' ? 'row' : 'column',
      gap: node.itemSpacing,
      padding: {
        top: node.paddingTop,
        bottom: node.paddingBottom,
        left: node.paddingLeft,
        right: node.paddingRight,
      },
      alignItems: mapAlignment(node.counterAxisAlignItems),
      justifyContent: mapAlignment(node.primaryAxisAlignItems),
      width: isFixedWidth ? node.width : undefined,
      height: isFixedHeight ? node.height : undefined,
      fillMaxWidth: fillMaxWidth ? true : undefined,
      fillMaxHeight: fillMaxHeight ? true : undefined,
    };
  }
  return {
    x: node.x,
    y: node.y,
    width: isFixedWidth ? node.width : undefined,
    height: isFixedHeight ? node.height : undefined,
    fillMaxWidth: fillMaxWidth ? true : undefined,
    fillMaxHeight: fillMaxHeight ? true : undefined,
  };
}

function mapAlignment(align: string): string {
  const map: Record<string, string> = {
    MIN: 'flex-start',
    CENTER: 'center',
    MAX: 'flex-end',
    SPACE_BETWEEN: 'space-between',
    BASELINE: 'baseline',
  };
  return map[align] ?? 'flex-start';
}

// ─────────────────────────────────────────────
// Style: fills, strokes, corner radius, opacity
// ─────────────────────────────────────────────

function getStyle(node: SceneNode): StyleInfo {
  const fills = 'fills' in node ? (node.fills as Paint[]) : [];
  const strokes = 'strokes' in node ? (node.strokes as Paint[]) : [];
  const strokeWeight = 'strokeWeight' in node && typeof node.strokeWeight === 'number'
    ? node.strokeWeight
    : 0;

  return {
    backgroundColor: extractColor(fills),
    borderRadius: 'cornerRadius' in node && typeof node.cornerRadius === 'number'
      ? node.cornerRadius
      : 0,
    opacity: 'opacity' in node ? (node.opacity as number) : 1,
    borderColor: strokeWeight > 0 ? extractColor(strokes) : null,
    borderWidth: strokeWeight > 0 ? strokeWeight : 0,
  };
}

function extractColor(fills: readonly Paint[]): string | null {
  if (!fills || fills.length === 0) return null;

  const fill = fills.find(f => f.visible !== false);
  if (!fill || fill.type !== 'SOLID') return null;

  const { r, g, b } = fill.color;
  const alpha = fill.opacity ?? 1;

  if (alpha < 1) {
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha.toFixed(2)})`;
  }

  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ─────────────────────────────────────────────
// Text: characters, fontSize, fontWeight, align
// ─────────────────────────────────────────────

function getTextInfo(node: SceneNode): TextInfo | null {
  if (node.type !== 'TEXT') return null;

  const fills = node.fills as Paint[];
  const fontSize = typeof node.fontSize === 'number' ? node.fontSize : 14;
  const fontName = typeof node.fontName !== 'symbol' ? node.fontName : null;
  const lineHeight = typeof node.lineHeight !== 'symbol' ? node.lineHeight : undefined;

  return {
    characters: node.characters,
    fontSize,
    fontWeight: fontName?.style,
    lineHeight,
    textAlign: node.textAlignHorizontal?.toLowerCase(),
    color: extractColor(fills),
  };
}
