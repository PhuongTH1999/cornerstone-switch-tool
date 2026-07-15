// ─────────────────────────────────────────────
// SDUI Template Validator
// Validates SDUI templates against spec requirements
// ─────────────────────────────────────────────

import type { SDUITemplate } from './converter';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  level: 'error';
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  level: 'warning';
  path: string;
  message: string;
  code: string;
}

export class SDUIValidator {
  /**
   * Validate complete SDUI template
   */
  static validate(template: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!template || typeof template !== 'object') {
      return {
        valid: false,
        errors: [
          {
            level: 'error',
            path: '$',
            message: 'Template must be an object',
            code: 'INVALID_TYPE',
          },
        ],
        warnings: [],
      };
    }

    const t = template as any;

    // Check lazy_loads
    if (!t.lazy_loads || !Array.isArray(t.lazy_loads)) {
      errors.push({
        level: 'error',
        path: '$.lazy_loads',
        message: 'lazy_loads must be an array',
        code: 'MISSING_LAZY_LOADS',
      });
    } else if (t.lazy_loads.length === 0) {
      warnings.push({
        level: 'warning',
        path: '$.lazy_loads',
        message: 'lazy_loads is empty',
        code: 'EMPTY_LAZY_LOADS',
      });
    } else {
      // Validate each lazy load
      t.lazy_loads.forEach((ll, idx) => {
        const llErrors = this.validateLazyLoad(ll, `$.lazy_loads[${idx}]`);
        errors.push(...llErrors.errors);
        warnings.push(...llErrors.warnings);
      });
    }

    // Check first_loads (optional)
    if (t.first_loads !== undefined && !Array.isArray(t.first_loads)) {
      errors.push({
        level: 'error',
        path: '$.first_loads',
        message: 'first_loads must be an array if provided',
        code: 'INVALID_FIRST_LOADS',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate lazy load entry
   */
  private static validateLazyLoad(
    lazyLoad: any,
    path: string
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (lazyLoad.type !== 'server_driven_widget') {
      errors.push({
        level: 'error',
        path: `${path}.type`,
        message: "type must be 'server_driven_widget'",
        code: 'INVALID_TYPE',
      });
    }

    if (!lazyLoad.block_id || typeof lazyLoad.block_id !== 'string') {
      errors.push({
        level: 'error',
        path: `${path}.block_id`,
        message: 'block_id must be a non-empty string',
        code: 'MISSING_BLOCK_ID',
      });
    } else if (!/^[a-zA-Z0-9_-]+$/.test(lazyLoad.block_id)) {
      warnings.push({
        level: 'warning',
        path: `${path}.block_id`,
        message: 'block_id should only contain alphanumeric, underscore, and hyphen',
        code: 'INVALID_BLOCK_ID_FORMAT',
      });
    }

    if (!Array.isArray(lazyLoad.data)) {
      errors.push({
        level: 'error',
        path: `${path}.data`,
        message: 'data must be an array',
        code: 'INVALID_DATA',
      });
    } else {
      lazyLoad.data.forEach((item: any, idx: number) => {
        if (item.type !== 'template_widget') {
          errors.push({
            level: 'error',
            path: `${path}.data[${idx}].type`,
            message: "type must be 'template_widget'",
            code: 'INVALID_TEMPLATE_WIDGET_TYPE',
          });
        }
        if (item.templateType !== 'SDUI_WIDGET') {
          errors.push({
            level: 'error',
            path: `${path}.data[${idx}].templateType`,
            message: "templateType must be 'SDUI_WIDGET'",
            code: 'INVALID_TEMPLATE_TYPE',
          });
        }
        if (!Array.isArray(item.data)) {
          errors.push({
            level: 'error',
            path: `${path}.data[${idx}].data`,
            message: 'data must be an array of components',
            code: 'INVALID_COMPONENTS',
          });
        } else {
          item.data.forEach((comp: any, cIdx: number) => {
            const compErrors = this.validateComponent(comp, `${path}.data[${idx}].data[${cIdx}]`);
            errors.push(...compErrors.errors);
            warnings.push(...compErrors.warnings);
          });
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate individual component
   */
  private static validateComponent(
    component: any,
    path: string
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const self = this;
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const validTypes = ['container', 'text', 'image', 'button', 'spacer'];
    if (!validTypes.includes(component.type)) {
      errors.push({
        level: 'error',
        path: `${path}.type`,
        message: `type must be one of: ${validTypes.join(', ')}`,
        code: 'INVALID_COMPONENT_TYPE',
      });
      return { errors, warnings }; // Can't validate further without knowing type
    }

    // Type-specific validation
    switch (component.type) {
      case 'text':
        if (typeof component.value !== 'string') {
          errors.push({
            level: 'error',
            path: `${path}.value`,
            message: 'Text component value must be a string',
            code: 'INVALID_TEXT_VALUE',
          });
        }
        break;

      case 'image':
        if (typeof component.value !== 'string') {
          errors.push({
            level: 'error',
            path: `${path}.value`,
            message: 'Image component value must be a URL string',
            code: 'INVALID_IMAGE_VALUE',
          });
        } else if (!this.isValidUrl(component.value) && component.value.length > 0) {
          warnings.push({
            level: 'warning',
            path: `${path}.value`,
            message: 'Image URL may be invalid',
            code: 'INVALID_IMAGE_URL',
          });
        }
        break;

      case 'button':
        if (!component.value || typeof component.value !== 'object') {
          errors.push({
            level: 'error',
            path: `${path}.value`,
            message: 'Button value must be an object',
            code: 'INVALID_BUTTON_VALUE',
          });
        } else if (!component.value.title) {
          errors.push({
            level: 'error',
            path: `${path}.value.title`,
            message: 'Button must have a title',
            code: 'MISSING_BUTTON_TITLE',
          });
        }
        break;

      case 'container':
        if (component.value && typeof component.value === 'object' && 'children' in component.value) {
          const children = (component.value as any).children;
          if (Array.isArray(children)) {
            children.forEach((child: any, idx: number) => {
              const childErrors = self.validateComponent(
                child,
                `${path}.value.children[${idx}]`
              );
              errors.push(...childErrors.errors);
              warnings.push(...childErrors.warnings);
            });
          }
        }
        break;
    }

    // Validate style properties
    if (component.style) {
      this.validateStyle(component.style, `${path}.style`, errors, warnings);
    }

    // Validate property
    if (component.property) {
      this.validateProperty(component.property, `${path}.property`, errors, warnings);
    }

    return { errors, warnings };
  }

  /**
   * Validate style object
   */
  private static validateStyle(
    style: any,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const validKeys = [
      'backgroundColor',
      'cornerRadius',
      'padding',
      'width',
      'height',
      'fillMaxWidth',
      'fillMaxHeight',
    ];

    Object.keys(style).forEach((key: string) => {
      if (!validKeys.includes(key)) {
        warnings.push({
          level: 'warning',
          path: `${path}.${key}`,
          message: `Unknown style property: ${key}`,
          code: 'UNKNOWN_STYLE_PROPERTY',
        });
      }

      // Validate specific properties
      if (key === 'cornerRadius' && typeof style[key] !== 'number') {
        errors.push({
          level: 'error',
          path: `${path}.${key}`,
          message: 'cornerRadius must be a number',
          code: 'INVALID_CORNER_RADIUS',
        });
      }

      if ((key === 'width' || key === 'height') && typeof style[key] !== 'number') {
        errors.push({
          level: 'error',
          path: `${path}.${key}`,
          message: `${key} must be a number`,
          code: 'INVALID_DIMENSION',
        });
      }

      if ((key === 'fillMaxWidth' || key === 'fillMaxHeight') && typeof style[key] !== 'boolean') {
        errors.push({
          level: 'error',
          path: `${path}.${key}`,
          message: `${key} must be a boolean`,
          code: 'INVALID_FILL_PROPERTY',
        });
      }
    });
  }

  /**
   * Validate property object
   */
  private static validateProperty(
    property: any,
    path: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const validKeys = [
      'layout',
      'spacing',
      'alignment',
      'typography',
      'color',
      'lineLimit',
      'ctaType',
      'contentMode',
    ];

    Object.keys(property).forEach((key: string) => {
      if (!validKeys.includes(key)) {
        warnings.push({
          level: 'warning',
          path: `${path}.${key}`,
          message: `Unknown property: ${key}`,
          code: 'UNKNOWN_PROPERTY',
        });
      }

      if (key === 'layout' && !['row', 'column', 'scrollRow'].includes(property[key])) {
        errors.push({
          level: 'error',
          path: `${path}.${key}`,
          message: "layout must be one of: row, column, scrollRow",
          code: 'INVALID_LAYOUT',
        });
      }
    });
  }

  /**
   * Simple URL validation
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // Allow placeholder URLs
      return url.includes('placeholder') || url.includes('example');
    }
  }

  /**
   * Format validation result as readable string
   */
  static formatResult(result: ValidationResult): string {
    const lines: string[] = [];

    if (result.valid) {
      lines.push('✓ Template is valid');
    } else {
      lines.push('✗ Template is invalid');
      lines.push('\nErrors:');
      result.errors.forEach((e) => {
        lines.push(`  ${e.path}: ${e.message} [${e.code}]`);
      });
    }

    if (result.warnings.length > 0) {
      lines.push('\nWarnings:');
      result.warnings.forEach((w) => {
        lines.push(`  ${w.path}: ${w.message} [${w.code}]`);
      });
    }

    return lines.join('\n');
  }
}
