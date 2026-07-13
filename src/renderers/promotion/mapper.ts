import { EnrichedNode } from '../../core/types';

interface SDUINode {
  type: string;
  style: Record<string, any>;
  property: Record<string, any>;
  value: any;
}

export function mapNode(node: EnrichedNode): SDUINode {
  // Button node
  if (node.role === 'button') {
    return {
      type: 'button',
      style: buildStyle(node),
      property: {
        ctaType: 'BUTTON',
        color: node.style?.backgroundColor || '#303233',
      },
      value: {
        title: node.name || 'Button',
        type: 'primary',
      },
    };
  }

  // Image/Icon node
  if (node.role === 'image' || node.type === 'VECTOR') {
    return {
      type: 'image',
      style: buildStyle(node),
      property: {
        contentMode: 'fill',
      },
      value: node.name || '',
    };
  }

  // Text node
  if (node.type === 'TEXT' || node.role === 'heading' || node.role === 'subheading' || node.role === 'caption') {
    return {
      type: 'text',
      style: buildStyle(node),
      property: buildTextProperty(node),
      value: node.name || '',
    };
  }

  // Container/Layout node (default)
  let children = node.children.map(child => mapNode(child as EnrichedNode));

  // Icon container optimization: if all children are images, keep only first
  const isIconContainer = node.layout?.width === node.layout?.height &&
                         node.layout?.width && node.layout?.width <= 32;
  const allImagesChildren = children.every(c => c.type === 'image');
  if (isIconContainer && allImagesChildren && children.length > 1) {
    children = [children[0]];
  }

  return {
    type: 'container',
    style: buildStyle(node),
    property: buildProperty(node),
    value: {
      children: children.length > 0 ? children : undefined,
    },
  };
}

function buildStyle(node: EnrichedNode): Record<string, any> {
  const style: Record<string, any> = {};
  const { layout, style: nodeStyle } = node;

  if (nodeStyle?.backgroundColor) style.backgroundColor = nodeStyle.backgroundColor;
  if (nodeStyle?.borderRadius && nodeStyle.borderRadius > 0) {
    style.cornerRadius = nodeStyle.borderRadius;
  }

  if (layout?.width) style.width = Math.round(layout.width);
  if (layout?.height) style.height = Math.round(layout.height);

  if (layout?.padding) {
    const { top, bottom, left, right } = layout.padding;
    if (top === bottom && left === right && top === left) {
      style.padding = { all: top };
    } else {
      style.padding = {};
      if (top > 0) style.padding.top = top;
      if (bottom > 0) style.padding.bottom = bottom;
      if (left > 0) style.padding.left = left;
      if (right > 0) style.padding.right = right;
    }
  }

  if (layout?.fillMaxWidth) style.fillMaxWidth = true;
  if (layout?.fillMaxHeight) style.fillMaxHeight = true;

  return style;
}

function buildProperty(node: EnrichedNode): Record<string, any> {
  const property: Record<string, any> = {};
  const { layout } = node;

  // Layout direction
  if (layout?.flexDirection) {
    property.layout = layout.flexDirection === 'row' ? 'row' : 'column';
  }

  // Spacing
  if (layout?.gap !== undefined) property.spacing = Math.round(layout.gap);

  // Alignment - force start for small icon containers
  const isSmallContainer = layout?.width === layout?.height && layout?.width && layout?.width <= 32;
  if (isSmallContainer) {
    property.alignment = 'start';
  } else if (layout?.alignItems) {
    const align = layout.alignItems;
    property.alignment = align === 'flex-start' ? 'start' : align === 'flex-end' ? 'end' : align;
  }

  return property;
}

function buildTextProperty(node: EnrichedNode): Record<string, any> {
  const property: Record<string, any> = {};
  const { text } = node;

  if (!text) return property;

  const { fontSize, color, fontWeight } = text;

  // Map typography
  let typography = 'descriptionDefaultRegular';
  if (fontSize && fontSize >= 18) typography = 'headerSSemibold';
  else if (fontSize && fontSize >= 16) typography = 'actionSBold';
  else if (fontSize && fontSize >= 14) typography = 'descriptionDefaultRegular';
  else typography = 'labelXsMedium';

  property.typography = typography;
  if (color) property.color = color;
  property.lineLimit = 1;

  return property;
}
