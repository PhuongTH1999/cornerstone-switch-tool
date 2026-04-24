import { EnrichedNode } from '../../core/types';
import { RNNode, RNStyle } from './types';

// ─────────────────────────────────────────────
// Map EnrichedNode → React Native component tree
// ─────────────────────────────────────────────

export function mapNode(node: EnrichedNode): RNNode {
  // CTA Button → TouchableOpacity
  if (node.role === 'button') {
    return {
      type: 'TouchableOpacity',
      field: node.name,
      style: buildBaseStyle(node),
    };
  }

  // Image / Icon → Image
  if (node.role === 'image' || node.type === 'VECTOR') {
    return {
      type: 'Image',
      field: node.name,
      style: {
        width: node.layout?.width ? Math.round(node.layout.width) : undefined,
        height: node.layout?.height ? Math.round(node.layout.height) : undefined,
      },
    };
  }

  // Flat list → FlatList
  if (node.role === 'list') {
    return {
      type: 'FlatList',
      field: 'items',
      style: buildBaseStyle(node),
    };
  }

  // Text nodes
  if (node.type === 'TEXT' || node.role === 'heading' || node.role === 'subheading' || node.role === 'caption' || node.role === 'body') {
    const style: RNStyle = {};
    if (node.text?.fontSize) style.fontSize = node.text.fontSize;
    if (node.text?.color) style.color = node.text.color;
    if (node.text?.fontWeight) style.fontWeight = node.text.fontWeight;
    return {
      type: 'Text',
      field: node.name,
      style,
    };
  }

  // Layout container → View
  const style = buildBaseStyle(node);
  const children = node.children.map(child => mapNode(child as EnrichedNode));
  return {
    type: 'View',
    style,
    children: children.length > 0 ? children : undefined,
  };
}

// ─────────────────────────────────────────────
// Style builder from Figma layout/style info
// ─────────────────────────────────────────────

function buildBaseStyle(node: EnrichedNode): RNStyle {
  const { layout, style } = node;
  const result: RNStyle = {};

  if (layout?.flexDirection) result.flexDirection = layout.flexDirection;
  if (layout?.fillMaxWidth) result.flex = 1;
  if (layout?.width) result.width = Math.round(layout.width);
  if (layout?.height) result.height = Math.round(layout.height);

  if (layout?.padding) {
    const { top, bottom, left, right } = layout.padding;
    if (top === bottom && left === right && top === left && top > 0) {
      result.padding = top;
    } else {
      if (top > 0) result.paddingTop = top;
      if (bottom > 0) result.paddingBottom = bottom;
      if (left > 0) result.paddingLeft = left;
      if (right > 0) result.paddingRight = right;
    }
  }

  if (layout?.alignItems) result.alignItems = layout.alignItems;
  if (layout?.justifyContent) result.justifyContent = layout.justifyContent;
  if (style?.backgroundColor) result.backgroundColor = style.backgroundColor;
  if (style?.borderRadius && style.borderRadius > 0) result.borderRadius = style.borderRadius;
  if (style?.borderWidth && style.borderWidth > 0) {
    result.borderWidth = style.borderWidth;
    if (style.borderColor) result.borderColor = style.borderColor;
  }

  return result;
}
