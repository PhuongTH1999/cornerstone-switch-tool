// ─────────────────────────────────────────────
// SDUI-Native types for Marketing Platform
// ─────────────────────────────────────────────

export type SDUIComponentType = 'TEXT' | 'ICON' | 'CTA_BUTTON' | 'ITEM_LIST';

export interface SDUIModifier {
  width?: number;
  height?: number;
  fillMaxWidth?: boolean;
  fillMaxHeight?: boolean;
  weight?: number;
  padding?: number | { top?: number; bottom?: number; left?: number; right?: number };
  backgroundColor?: string;
  cornerRadius?: number;
  border?: { width: number; color: string };
  alignment?: string;
  arrangement?: string;
}

export interface SDUIStyle {
  typography?: string;
  color?: string;
  fontWeight?: string;
  maxLines?: number;
}

export interface SDUINode {
  layout?: 'row' | 'column';
  componentType?: SDUIComponentType;
  field?: string;
  iconSize?: number;
  modifier?: SDUIModifier;
  style?: SDUIStyle;
  children?: SDUINode[];
}
