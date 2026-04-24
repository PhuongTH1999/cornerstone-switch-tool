import { EnrichedNode, SDUINode, SDUIModifier, SDUIStyle, SDUIComponentType } from './types';

// ─────────────────────────────────────────────
// Map EnrichedNode → SDUI schema
// ─────────────────────────────────────────────

export function mapToSDUI(node: EnrichedNode): SDUINode {
  if (node.role === 'button') {
    const rawMod = mapModifier(node);
    const modifier: SDUIModifier = {};
    if (rawMod.alignment) modifier.alignment = rawMod.alignment;
    if (rawMod.weight) modifier.weight = rawMod.weight;
    
    return {
      componentType: 'CTA_BUTTON',
      modifier: Object.keys(modifier).length > 0 ? modifier : undefined
    };
  }

  if (node.role === 'image' || node.type === 'VECTOR') {
    const modifier = mapModifier(node);
    const size = node.layout?.width ? Math.round(node.layout.width) : undefined;
    return {
      componentType: 'ICON',
      field: node.name,
      iconSize: size,
      modifier: Object.keys(modifier).length > 0 ? modifier : undefined
    };
  }

  if (node.role === 'list') {
    return {
      componentType: 'ITEM_LIST',
      field: 'items',
      modifier: mapModifier(node),
    };
  }

  if (node.type === 'TEXT' || node.role === 'heading' || node.role === 'subheading' || node.role === 'caption' || node.role === 'body') {
    const modifier = mapModifier(node);
    delete modifier.width;
    delete modifier.height;
    delete modifier.padding;
    delete modifier.backgroundColor;
    delete modifier.cornerRadius;
    delete modifier.border;
    
    return {
      componentType: 'TEXT',
      field: node.name,
      modifier: Object.keys(modifier).length > 0 ? modifier : undefined,
      style: mapSDUITextStyle(node)
    };
  }

  // Otherwise, it's a layout container
  const modifier = mapModifier(node);
  const children = node.children.map(child => mapToSDUI(child as EnrichedNode));
  
  return {
    layout: node.layout?.flexDirection || 'column',
    modifier: Object.keys(modifier).length > 0 ? modifier : undefined,
    children: children.length > 0 ? children : undefined
  };
}

// ─────────────────────────────────────────────
// Modifier mapping: LayoutInfo + StyleInfo → SDUIModifier
// ─────────────────────────────────────────────

function mapModifier(node: EnrichedNode): SDUIModifier {
  const result: SDUIModifier = {};
  const { layout, style } = node;

  // Dimensions & Fill
  if (layout?.width !== undefined) {
    result.width = Math.round(layout.width);
  }
  if (layout?.height !== undefined) {
    result.height = Math.round(layout.height);
  }
  if (layout?.fillMaxWidth) {
    result.fillMaxWidth = true;
  }
  if (layout?.fillMaxHeight) {
    result.fillMaxHeight = true;
  }

  if (layout?.padding) {
    const { top, bottom, left, right } = layout.padding;
    if (top === bottom && left === right && top === left && top > 0) {
      result.padding = top;
    } else if (top > 0 || bottom > 0 || left > 0 || right > 0) {
      result.padding = {};
      if (top > 0) result.padding.top = top;
      if (bottom > 0) result.padding.bottom = bottom;
      if (left > 0) result.padding.left = left;
      if (right > 0) result.padding.right = right;
    }
  }

  // Alignment and Arrangement
  if (layout?.alignItems) {
    const a = layout.alignItems;
    if (a === 'flex-start') result.alignment = 'start';
    else if (a === 'flex-end') result.alignment = 'end';
    else result.alignment = a;
  }
  if (layout?.justifyContent) {
    const a = layout.justifyContent;
    if (a === 'flex-start') result.arrangement = 'start';
    else if (a === 'flex-end') result.arrangement = 'end';
    else if (a === 'space-between') result.arrangement = 'spaceBetween';
    else result.arrangement = a;
  }

  // Style
  if (style?.backgroundColor) result.backgroundColor = style.backgroundColor;
  if (style?.borderRadius && style.borderRadius > 0) result.cornerRadius = style.borderRadius;
  if (style?.borderColor && style?.borderWidth && style.borderWidth > 0) {
    result.border = {
      width: style.borderWidth,
      color: style.borderColor
    };
  }

  return result;
}

// ─────────────────────────────────────────────
// Text style mapping: TextInfo → SDUIStyle
// ─────────────────────────────────────────────

function mapSDUITextStyle(node: EnrichedNode): SDUIStyle {
  if (!node.text) return {};
  const { fontSize, color, fontWeight } = node.text;

  const result: SDUIStyle = {};

  // Infer typography from fontSize
  let typography = 'descriptionDefaultRegular';
  if (fontSize >= 18) typography = 'headerSSemibold';
  else if (fontSize >= 16) typography = 'actionSBold';
  else if (fontSize >= 14) typography = 'descriptionDefaultRegular';
  else typography = 'labelXsMedium';
  
  result.typography = typography;

  if (color) result.color = color;
  if (fontWeight) result.fontWeight = mapFontWeight(fontWeight);

  return result;
}

function mapFontWeight(style: string): string | undefined {
  const map: Record<string, string> = {
    Thin: '100',
    ExtraLight: '200',
    Light: '300',
    Regular: '400',
    Medium: '500',
    SemiBold: '600',
    Bold: '700',
    ExtraBold: '800',
    Black: '900',
  };
  return map[style];
}
