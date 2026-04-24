// ─────────────────────────────────────────────
// Raw extracted node (mirrors Figma structure)
// ─────────────────────────────────────────────

export interface LayoutInfo {
  // Auto Layout → Flex
  flexDirection?: 'row' | 'column';
  gap?: number;
  padding?: { top: number; bottom: number; left: number; right: number };
  alignItems?: string;
  justifyContent?: string;
  // Absolute / fixed size
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fillMaxWidth?: boolean;
  fillMaxHeight?: boolean;
}

export interface StyleInfo {
  backgroundColor?: string | null;
  borderRadius?: number;
  opacity?: number;
  borderColor?: string | null;
  borderWidth?: number;
}

export interface TextInfo {
  characters: string;
  fontSize: number;
  fontWeight?: string;
  lineHeight?: LineHeight;
  textAlign?: string;
  color?: string | null;
}

export interface RawNode {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  layout: LayoutInfo;
  style: StyleInfo;
  text?: TextInfo | null;
  children: RawNode[];
}

// ─────────────────────────────────────────────
// SDUI schema
// ─────────────────────────────────────────────

export type SDUIComponentType = 'TEXT' | 'ICON' | 'CTA_BUTTON' | 'ITEM_LIST';

export type SemanticRole =
  | 'heading'
  | 'subheading'
  | 'body'
  | 'caption'
  | 'button'
  | 'input'
  | 'image'
  | 'list'
  | 'card'
  | 'container';

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

// ─────────────────────────────────────────────
// Enriched node (RawNode + semantic role)
// ─────────────────────────────────────────────

export type EnrichedNode = RawNode & { role?: SemanticRole };

// ─────────────────────────────────────────────
// Plugin message protocol (code.ts ↔ ui.html)
// ─────────────────────────────────────────────

export type PluginMessage =
  | { type: 'EXTRACT' }
  | { type: 'CLOSE' };

export type UIMessage =
  | { type: 'RESULT'; json: string; nodeCount: number }
  | { type: 'ERROR'; message: string };
