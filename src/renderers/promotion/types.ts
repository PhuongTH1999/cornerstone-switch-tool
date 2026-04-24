// ─────────────────────────────────────────────
// React Native types for Promotion Hub
// ─────────────────────────────────────────────

export type RNComponentType = 'View' | 'Text' | 'Image' | 'TouchableOpacity' | 'ScrollView' | 'FlatList';

export interface RNStyle {
  flexDirection?: 'row' | 'column';
  flex?: number;
  width?: number | string;
  height?: number | string;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  alignItems?: string;
  justifyContent?: string;
  // Text-specific
  fontSize?: number;
  color?: string;
  fontWeight?: string;
}

export interface RNNode {
  type: RNComponentType;
  field?: string;       // binds to API data key
  style?: RNStyle;
  text?: string;        // static label if any
  children?: RNNode[];
}
