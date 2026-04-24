// ─────────────────────────────────────────────
// Core types shared across all renderers
// ─────────────────────────────────────────────

export interface LayoutInfo {
  flexDirection?: 'row' | 'column';
  gap?: number;
  padding?: { top: number; bottom: number; left: number; right: number };
  alignItems?: string;
  justifyContent?: string;
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

export type EnrichedNode = RawNode & { role?: SemanticRole };

// ─────────────────────────────────────────────
// Plugin IPC — ui.html ↔ code.ts messages
// ─────────────────────────────────────────────

export type PluginMessage =
  | { type: 'EXTRACT' }
  | { type: 'CLOSE' }
  | { type: 'RESIZE'; width: number; height: number }
  | { type: 'SET_CONFIG'; config: any };

export type UIMessage =
  | { type: 'RESULT'; json: string; nodeCount: number }
  | { type: 'ERROR'; message: string };
