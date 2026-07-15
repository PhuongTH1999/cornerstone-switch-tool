// ─────────────────────────────────────────────
// SDUI Template Converter
// Converts component tree to SDUI template format per spec
// ─────────────────────────────────────────────

export interface SDUIStyle {
  backgroundColor?: string;
  cornerRadius?: number;
  padding?: number | { top?: number; bottom?: number; left?: number; right?: number };
  width?: number;
  height?: number;
  fillMaxWidth?: boolean;
  fillMaxHeight?: boolean;
}

export interface SDUIProperty {
  layout?: 'row' | 'column' | 'scrollRow';
  spacing?: number;
  alignment?: 'start' | 'center' | 'end' | 'spaceBetween';
  typography?: string;
  color?: string;
  lineLimit?: number;
  ctaType?: string;
  contentMode?: 'fill' | 'fit' | 'center';
}

export interface SDUIComponentValue {
  children?: SDUIComponent[];
  title?: string;
  type?: string;
  [key: string]: any;
}

export interface SDUIComponent {
  type: 'container' | 'text' | 'image' | 'button' | 'spacer';
  style?: SDUIStyle;
  property?: SDUIProperty;
  value?: SDUIComponentValue | string;
}

export interface SDUITemplateWidget {
  type: 'template_widget';
  templateType: 'SDUI_WIDGET';
  data: SDUIComponent[];
}

export interface SDUILazyLoad {
  type: 'server_driven_widget';
  block_id: string;
  data: SDUITemplateWidget[];
}

export interface SDUITemplate {
  lazy_loads: SDUILazyLoad[];
  first_loads: any[];
}

// ─────────────────────────────────────────────
// Main Converter
// ─────────────────────────────────────────────

export class SDUIConverter {
  /**
   * Convert component tree to SDUI template format
   */
  static toTemplate(
    components: SDUIComponent[],
    blockId: string = `block_${Date.now().toString(36)}`
  ): SDUITemplate {
    return {
      lazy_loads: [
        {
          type: 'server_driven_widget',
          block_id: blockId,
          data: [
            {
              type: 'template_widget',
              templateType: 'SDUI_WIDGET',
              data: components,
            },
          ],
        },
      ],
      first_loads: [],
    };
  }

  /**
   * Normalize padding object to consistent format
   */
  static normalizePadding(
    padding: number | { top?: number; bottom?: number; left?: number; right?: number } | undefined
  ): number | { top?: number; bottom?: number; left?: number; right?: number } | undefined {
    if (typeof padding === 'number') return padding;
    if (!padding) return undefined;

    // If all sides equal, simplify to number
    const { top = 0, bottom = 0, left = 0, right = 0 } = padding;
    if (top === bottom && left === right && top === left) {
      return top;
    }

    // Return object with only non-zero values
    const result: any = {};
    if (top > 0) result.top = top;
    if (bottom > 0) result.bottom = bottom;
    if (left > 0) result.left = left;
    if (right > 0) result.right = right;
    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Validate component structure
   */
  static validate(component: SDUIComponent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check type
    if (!['container', 'text', 'image', 'button', 'spacer'].includes(component.type)) {
      errors.push(`Invalid component type: ${component.type}`);
    }

    // Type-specific validation
    switch (component.type) {
      case 'text':
        if (typeof component.value !== 'string') {
          errors.push('Text component value must be a string');
        }
        break;

      case 'image':
        if (typeof component.value !== 'string') {
          errors.push('Image component value must be a URL string');
        }
        break;

      case 'button':
        if (typeof component.value !== 'object' || !component.value || !('title' in component.value)) {
          errors.push('Button component must have value.title');
        }
        break;

      case 'container':
        if (component.value && typeof component.value === 'object' && 'children' in component.value) {
          const children = (component.value as any).children;
          if (!Array.isArray(children)) {
            errors.push('Container children must be an array');
          } else {
            children.forEach((child: any, idx: number) => {
              const validation = this.validate(child);
              if (!validation.valid) {
                errors.push(`Child ${idx}: ${validation.errors.join(', ')}`);
              }
            });
          }
        }
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate complete template
   */
  static validateTemplate(template: SDUITemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.lazy_loads || !Array.isArray(template.lazy_loads)) {
      errors.push('Template must have lazy_loads array');
      return { valid: false, errors };
    }

    template.lazy_loads.forEach((lazyLoad: any, idx: number) => {
      if (lazyLoad.type !== 'server_driven_widget') {
        errors.push(`LazyLoad ${idx}: invalid type`);
      }
      if (!lazyLoad.block_id) {
        errors.push(`LazyLoad ${idx}: missing block_id`);
      }
      if (!lazyLoad.data || !Array.isArray(lazyLoad.data)) {
        errors.push(`LazyLoad ${idx}: missing data array`);
      } else {
        lazyLoad.data.forEach((tw: any, twIdx: number) => {
          if (tw.type !== 'template_widget') {
            errors.push(`LazyLoad ${idx}, TemplateWidget ${twIdx}: invalid type`);
          }
          if (tw.templateType !== 'SDUI_WIDGET') {
            errors.push(`LazyLoad ${idx}, TemplateWidget ${twIdx}: invalid templateType`);
          }
          if (!tw.data || !Array.isArray(tw.data)) {
            errors.push(`LazyLoad ${idx}, TemplateWidget ${twIdx}: missing data array`);
          } else {
            tw.data.forEach((comp: any, cIdx: number) => {
              const validation = this.validate(comp as SDUIComponent);
              if (!validation.valid) {
                errors.push(
                  `LazyLoad ${idx}, Component ${cIdx}: ${validation.errors.join(', ')}`
                );
              }
            });
          }
        });
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate unique block_id
   */
  static generateBlockId(prefix: string = 'block'): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Optimize component tree (remove empty containers, merge single-child containers)
   */
  static optimize(component: SDUIComponent): SDUIComponent | null {
    // Remove empty spacers
    if (component.type === 'spacer') {
      return component;
    }

    // Process container children
    if (component.type === 'container' && component.value && typeof component.value === 'object' && 'children' in component.value) {
      const children = (component.value as any).children as SDUIComponent[];
      const optimizedChildren = children
        .map((child: SDUIComponent) => this.optimize(child))
        .filter((child: SDUIComponent | null): child is SDUIComponent => child !== null);

      // Remove containers with no children
      if (optimizedChildren.length === 0 && !children.some((c) => c.type === 'spacer')) {
        return null;
      }

      return {
        ...component,
        value: {
          ...(component.value as any),
          children: optimizedChildren.length > 0 ? optimizedChildren : undefined,
        },
      };
    }

    return component;
  }
}
