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

  // Clean up property
  const property = cleanupProperty(node.property);

  // Optimize value
  let value = node.value;
  if (node.type === 'container' && value?.children) {
    value.children = value.children
      .map(child => optimizeNode(child))
      .filter((n): n is SDUINode => n !== null);

    // Remove children if empty
    if (value.children.length === 0) {
      return null;
    }

    // Flatten single-child containers
    if (value.children.length === 1 && !hasSignificantStyle(style)) {
      const child = value.children[0];
      // Merge spacing if parent has it
      if (property.spacing && !child.property.spacing) {
        child.property.spacing = property.spacing;
      }
      return child;
    }
  }

  return {
    type: node.type,
    style: Object.keys(style).length > 0 ? style : {},
    property: Object.keys(property).length > 0 ? property : {},
    value: value,
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
  // Check if style has meaningful properties (not just layout/size)
  for (const key of Object.keys(style)) {
    if (['backgroundColor', 'cornerRadius', 'borderWidth', 'borderColor', 'shadow'].includes(key)) {
      return true;
    }
  }
  return false;
}

function cleanupProperty(property: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(property)) {
    // Skip empty values
    if (value === false || value === 0 || value === '' || value === null || value === undefined) {
      continue;
    }

    // Skip default layout
    if (key === 'layout' && (value === 'column' || !value)) {
      continue;
    }

    // Skip zero spacing
    if (key === 'spacing' && value === 0) {
      continue;
    }

    // Skip default alignment
    if (key === 'alignment' && value === 'start') {
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
