interface SDUINode {
  type: string;
  style: Record<string, any>;
  property: Record<string, any>;
  value: any;
}

export function optimizeNode(node: SDUINode): SDUINode | null {
  // Remove empty containers
  if (node.type === 'container') {
    const children = node.value?.children;
    if (!children || children.length === 0) {
      return null;
    }
  }

  // Clean up style
  const style = cleanupStyle(node.style, node.type);

  // Clean up property - extra strict for text nodes
  let property = cleanupProperty(node.property);
  if (node.type === 'text') {
    property = {
      typography: property.typography,
      color: property.color,
      lineLimit: property.lineLimit,
    };
    // Remove undefined
    Object.keys(property).forEach(key => {
      if (property[key] === undefined) {
        delete property[key];
      }
    });
  }

  // Optimize value
  let value = node.value;
  if (node.type === 'container' && value && typeof value === 'object' && 'children' in value) {
    const children = Array.isArray(value.children) ? value.children : [];
    const optimizedChildren = children
      .map((child: any) => {
        try {
          return optimizeNode(child);
        } catch (err) {
          console.warn('Failed to optimize child node:', err);
          return null;
        }
      })
      .filter((n: SDUINode | null): n is SDUINode => n !== null);

    // Remove children if empty
    if (optimizedChildren.length === 0) {
      return null;
    }

    // Flatten single-child containers - more aggressive flattening
    if (optimizedChildren.length === 1) {
      const child = optimizedChildren[0];
      const shouldFlatten = !hasSignificantStyle(style) || isOnlyLayoutContainer(style);

      if (shouldFlatten) {
        // Merge properties into child - BUT NOT for text nodes
        if (child.type !== 'text') {
          if (property.spacing && child.property && !child.property.spacing) {
            child.property.spacing = property.spacing;
          }
          if (property.layout && child.property && !child.property.layout) {
            child.property.layout = property.layout;
          }
          if (property.alignment && child.property && !child.property.alignment) {
            child.property.alignment = property.alignment;
          }
        }
        // Merge padding into child style if child doesn't have it
        if (style.padding && child.style && !child.style.padding) {
          child.style.padding = style.padding;
        }
        return child;
      }
    }

    value = { ...value, children: optimizedChildren };
  }

  return {
    type: node.type,
    style: Object.keys(style).length > 0 ? style : {},
    property: Object.keys(property).length > 0 ? property : {},
    value: value || {},
  };
}

function cleanupStyle(style: Record<string, any>, nodeType: string): Record<string, any> {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    // Remove backgroundColor from text nodes (not needed)
    if (nodeType === 'text' && key === 'backgroundColor') {
      continue;
    }

    // Skip empty/zero padding/margin
    if (key === 'padding' || key === 'margin') {
      const pad = value as Record<string, number>;
      if (pad.all === 0 || (!pad.all && Object.values(pad).every(v => !v))) {
        continue;
      }
      cleaned[key] = pad;
      continue;
    }

    // Skip false/0/empty values
    if (value === false || value === 0 || value === '' || value === null || value === undefined) {
      continue;
    }

    // Skip fillMax if not true
    if ((key === 'fillMaxWidth' || key === 'fillMaxHeight' || key === 'fillMaxSize') && !value) {
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned;
}

function hasSignificantStyle(style: Record<string, any>): boolean {
  // Check if style has meaningful visual properties (not just layout/size)
  for (const key of Object.keys(style)) {
    if (['backgroundColor', 'cornerRadius', 'borderWidth', 'borderColor', 'shadow'].includes(key)) {
      return true;
    }
  }
  return false;
}

function isOnlyLayoutContainer(style: Record<string, any>): boolean {
  // Check if container only has layout-related styles (width, height, fillMax, padding)
  // These can be flattened into child
  const layoutOnlyKeys = ['width', 'height', 'fillMaxWidth', 'fillMaxHeight', 'padding'];
  for (const key of Object.keys(style)) {
    if (!layoutOnlyKeys.includes(key)) {
      return false; // Has non-layout property
    }
  }
  return true;
}

function cleanupProperty(property: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(property)) {
    // Skip empty values
    if (value === false || value === 0 || value === '' || value === null || value === undefined) {
      continue;
    }

    // Skip default layout (column is default)
    if (key === 'layout' && (value === 'column' || !value)) {
      continue;
    }

    // Skip zero/default spacing
    if (key === 'spacing' && value === 0) {
      continue;
    }

    // Skip default alignment (start is default)
    if (key === 'alignment' && (value === 'start' || value === 'flex-start')) {
      continue;
    }

    // Convert alignment to readable names if not already
    if (key === 'alignment') {
      if (value === 'flex-start') {
        cleaned[key] = 'start';
      } else if (value === 'flex-end') {
        cleaned[key] = 'end';
      } else {
        cleaned[key] = value;
      }
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned;
}

export function optimizeData(data: SDUINode[]): SDUINode[] {
  return data
    .map(node => optimizeNode(node))
    .filter((n): n is SDUINode => n !== null);
}
