import { EnrichedNode } from '../../core/types';
import { TypographyMapper } from '../sdui/typography';
import { FigmaSDUIParser } from '../sdui/figmaParser';

interface SDUINode {
  type: string;
  style: Record<string, any>;
  property: Record<string, any>;
  value: any;
}

/**
 * Map Figma extracted node to SDUI component
 * Uses FigmaSDUIParser for primary parsing, with additional optimizations
 */
export function mapNode(node: EnrichedNode): SDUINode {
  // Use Figma parser for primary extraction
  const parsed = FigmaSDUIParser.parseNode(node);

  // Additional marketing-specific optimizations
  return optimizeForMarketing(parsed as SDUINode);
}

/**
 * Legacy mapNode implementation (kept for backward compatibility)
 * Consider deprecating in favor of FigmaSDUIParser
 */
export function mapNodeLegacy(node: EnrichedNode): SDUINode {
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
  let children = node.children.map((child: any) => mapNode(child as EnrichedNode));

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
  } as any;
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

  // Map typography using typography mapper
  property.typography = TypographyMapper.mapFontToTypography(
    fontSize,
    fontWeight,
    node.role
  );

  if (color) property.color = color;

  // Set lineLimit based on context (heading vs body text)
  const isHeading = node.role === 'heading' || node.role === 'subheading';
  property.lineLimit = isHeading ? 1 : -1; // -1 = unlimited per spec

  return property;
}

/**
 * Apply marketing-specific optimizations to parsed SDUI component
 */
function optimizeForMarketing(component: SDUINode): SDUINode {
  // Text nodes should NOT have layout/spacing properties
  if (component.type === 'text') {
    const cleaned = {
      typography: component.property?.typography,
      color: component.property?.color,
      lineLimit: component.property?.lineLimit,
    };
    // Remove undefined values
    const filtered: Record<string, any> = {};
    Object.keys(cleaned).forEach(key => {
      if (cleaned[key as keyof typeof cleaned] !== undefined) {
        filtered[key] = cleaned[key as keyof typeof cleaned];
      }
    });
    component.property = filtered;
    console.log('✅ Text cleaned:', component.property);
  }

  // Ensure responsive behavior for marketing cards
  if (component.type === 'container' && component.style && !component.style.fillMaxWidth) {
    // If no explicit width, make it responsive
    if (!component.style.width) {
      component.style.fillMaxWidth = true;
    }
  }

  // Optimize icon containers (common in marketing)
  if (component.type === 'container' && component.value?.children) {
    const children = component.value.children;
    const isIconContainer =
      component.style?.width === component.style?.height &&
      component.style?.width &&
      component.style.width <= 32;

    if (isIconContainer && children.every((c) => c.type === 'image') && children.length > 1) {
      component.value.children = [children[0]];
    }
  }

  return component;
}
