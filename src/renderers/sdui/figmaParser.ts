// ─────────────────────────────────────────────
// Figma to SDUI Parser
// Extracts Figma design properties and maps to SDUI components
// ─────────────────────────────────────────────

import { EnrichedNode } from '../../core/types';
import { TypographyMapper } from './typography';
import { SDUIComponent, SDUIStyle, SDUIProperty } from './converter';

export class FigmaSDUIParser {
  /**
   * Parse EnrichedNode to SDUI component
   * Handles role detection, style extraction, and property mapping
   */
  static parseNode(node: EnrichedNode): SDUIComponent {
    // Detect component type by role or node type
    const componentType = this.detectComponentType(node);

    switch (componentType) {
      case 'text':
        return this.parseTextNode(node);
      case 'image':
        return this.parseImageNode(node);
      case 'button':
        return this.parseButtonNode(node);
      case 'spacer':
        return this.parseSpacerNode(node);
      case 'container':
      default:
        return this.parseContainerNode(node);
    }
  }

  /**
   * Detect component type from role and node properties
   */
  private static detectComponentType(
    node: EnrichedNode
  ): 'text' | 'image' | 'button' | 'spacer' | 'container' {
    // Spacer detection
    if (node.type === 'ELLIPSE' && node.layout?.width === node.layout?.height) {
      if (node.layout.width && node.layout.width <= 4) return 'spacer';
    }
    if (node.name?.toLowerCase().includes('spacer') && !node.children.length) {
      return 'spacer';
    }

    // Text detection
    if (node.type === 'TEXT' || node.role === 'heading' || node.role === 'caption') {
      return 'text';
    }

    // Image/Icon detection
    if (
      node.role === 'image' ||
      node.type === 'VECTOR' ||
      node.type === 'COMPONENT' ||
      (node.name?.toLowerCase().includes('icon') && !node.children.length)
    ) {
      return 'image';
    }

    // Button detection
    if (
      node.role === 'button' ||
      node.name?.toLowerCase().includes('button') ||
      node.name?.toLowerCase().includes('btn') ||
      (node.children.length > 0 && this.isButtonLike(node))
    ) {
      return 'button';
    }

    return 'container';
  }

  /**
   * Check if node looks like a button (has text + bg color)
   */
  private static isButtonLike(node: EnrichedNode): boolean {
    if (!node.children.length) return false;
    const hasText = node.children.some((c) => c.type === 'TEXT');
    const hasBackground = node.style?.backgroundColor !== null && node.style?.backgroundColor !== undefined;
    return hasText && hasBackground;
  }

  /**
   * Parse text node to SDUI text component
   */
  private static parseTextNode(node: EnrichedNode): SDUIComponent {
    const { text } = node;

    console.log('📝 Parsing TEXT node:', { name: node.name, hasLayout: !!node.layout?.flexDirection });

    const result = {
      type: 'text',
      style: this.extractStyle(node),
      property: {
        typography: text
          ? TypographyMapper.mapFontToTypography(text.fontSize, text.fontWeight, node.role)
          : 'descriptionDefaultRegular',
        color: text?.color || node.style?.backgroundColor || '#303233',
        lineLimit: node.role === 'heading' || node.role === 'subheading' ? 1 : -1,
      },
      value: node.name || text?.characters || 'Text',
    };

    console.log('  → Property:', result.property);
    return result;
  }

  /**
   * Parse image node to SDUI image component
   */
  private static parseImageNode(node: EnrichedNode): SDUIComponent {
    const { layout, style } = node;

    return {
      type: 'image',
      style: {
        width: layout?.width ? Math.round(layout.width) : 52,
        height: layout?.height ? Math.round(layout.height) : 52,
        cornerRadius: style?.borderRadius || 0,
      },
      property: {
        contentMode: 'fill',
      },
      value: node.name || 'https://placeholder.com/52x52',
    };
  }

  /**
   * Parse button node to SDUI button component
   */
  private static parseButtonNode(node: EnrichedNode): SDUIComponent {
    const buttonText = node.children
      .find((c) => c.type === 'TEXT')
      ?.name || node.name || 'Button';

    const buttonColor = node.style?.backgroundColor || '#303233';

    return {
      type: 'button',
      style: this.extractStyle(node),
      property: {
        ctaType: 'BUTTON',
        color: buttonColor,
      },
      value: {
        title: buttonText,
        type: 'primary',
      },
    };
  }

  /**
   * Parse spacer node to SDUI spacer component
   */
  private static parseSpacerNode(node: EnrichedNode): SDUIComponent {
    return {
      type: 'spacer',
      style: {
        height: node.layout?.height || 8,
      },
      property: {},
      value: '',
    };
  }

  /**
   * Parse container node to SDUI container component
   */
  private static parseContainerNode(node: EnrichedNode): SDUIComponent {
    const children = node.children
      .map((child) => this.parseNode(child as EnrichedNode))
      .filter((comp) => comp !== null);

    return {
      type: 'container',
      style: this.extractStyle(node),
      property: this.extractProperty(node),
      value:
        children.length > 0
          ? {
              children,
            }
          : undefined,
    };
  }

  /**
   * Extract SDUI style from node
   */
  private static extractStyle(node: EnrichedNode): SDUIStyle | undefined {
    const { layout, style } = node;
    const result: SDUIStyle = {};

    // Background color
    if (style?.backgroundColor) {
      result.backgroundColor = style.backgroundColor;
    }

    // Border radius
    if (style?.borderRadius && style.borderRadius > 0) {
      result.cornerRadius = Math.round(style.borderRadius);
    }

    // Dimensions
    if (layout?.width) result.width = Math.round(layout.width);
    if (layout?.height) result.height = Math.round(layout.height);

    // Padding
    if (layout?.padding) {
      const { top, bottom, left, right } = layout.padding;
      if (top === bottom && left === right && top === left) {
        if (top > 0) result.padding = top;
      } else {
        const padding: any = {};
        if (top && top > 0) padding.top = top;
        if (bottom && bottom > 0) padding.bottom = bottom;
        if (left && left > 0) padding.left = left;
        if (right && right > 0) padding.right = right;
        if (Object.keys(padding).length > 0) result.padding = padding;
      }
    }

    // Fill behavior
    if (layout?.fillMaxWidth) result.fillMaxWidth = true;
    if (layout?.fillMaxHeight) result.fillMaxHeight = true;

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Extract SDUI property from node
   */
  private static extractProperty(node: EnrichedNode): SDUIProperty | undefined {
    const { layout } = node;
    const result: SDUIProperty = {};

    // Layout direction
    if (layout?.flexDirection) {
      result.layout = layout.flexDirection === 'row' ? 'row' : 'column';
    }

    // Spacing
    if (layout?.gap) {
      result.spacing = Math.round(layout.gap);
    }

    // Alignment
    if (layout?.alignItems) {
      const align = layout.alignItems;
      if (align === 'flex-start') result.alignment = 'start';
      else if (align === 'flex-end') result.alignment = 'end';
      else if (align === 'center') result.alignment = 'center';
      else if (align === 'space-between') result.alignment = 'spaceBetween';
    }

    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Parse multiple nodes and handle frame extraction
   */
  static parseFrame(nodes: EnrichedNode[]): SDUIComponent[] {
    return nodes
      .map((node) => this.parseNode(node))
      .filter((comp) => comp !== null);
  }

  /**
   * Validate and clean component name for export
   */
  static sanitizeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .toLowerCase()
      .substring(0, 50);
  }

  /**
   * Generate metadata for exported design
   */
  static generateMetadata(nodes: EnrichedNode[], flavor: string) {
    return {
      flavor,
      timestamp: new Date().toISOString(),
      nodeCount: nodes.length,
      names: nodes.map((n) => n.name),
    };
  }
}
