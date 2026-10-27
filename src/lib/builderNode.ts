/**
 * SDUI editor node and its export to SDUI JSON.
 *
 * Imported nodes keep shortcut fields (`width`, `bg`, `layout`…) next to the original `nativeStyle` /
 * `nativeProperty`; the shortcut wins on export. Inspector edits go through `setStyle` / `setProperty`, which fold
 * the shortcuts into `nativeStyle` / `nativeProperty` first, so clearing a field really removes the key.
 */
import { SDUI_TYPES } from '../renderers/sdui/preview/types'

export interface BuilderNode {
  source?: any; id: number; type: string; name: string
  value?: string; url?: string; title?: string; buttonType?: string; ctaType?: string; iconLeft?: string; iconRight?: string
  layout?: string; spacing?: number; padding?: any; radius?: number; bg?: string; width?: number; height?: number
  border?: { width?: number; color?: string }; alignment?: string; textAlignment?: string; contentMode?: string
  fillMaxWidth?: boolean; fillMaxHeight?: boolean; weight?: number
  nativeStyle?: any; nativeProperty?: any; nativeValue?: any
  variable?: string
  /** Node-level keys, editable in the Inspector (taken out of `source` on import). */
  onTap?: any; trackTypes?: any; expireTime?: number | string
  children?: BuilderNode[]
}

/** Types whose `value.children` the editor shows as layers (spec §2.2). */
export const PARENT_TYPES = ['container', 'box', 'pager']

const STYLE_SHORTCUTS = ['bg', 'padding', 'radius', 'width', 'height', 'border', 'fillMaxWidth', 'fillMaxHeight'] as const
const PROPERTY_SHORTCUTS = ['layout', 'spacing', 'alignment', 'textAlignment', 'contentMode', 'ctaType'] as const

/** `style` as exported. */
export function exportStyle(node: BuilderNode): Record<string, any> {
  return {
    ...(node.nativeStyle || {}),
    ...(node.bg ? { backgroundColor: node.bg } : {}),
    ...(node.padding != null ? { padding: typeof node.padding === 'number' ? { all: node.padding } : node.padding } : {}),
    ...(node.radius != null ? { cornerRadius: node.radius } : {}),
    ...(node.width != null ? { width: node.width } : {}),
    ...(node.height != null ? { height: node.height } : {}),
    ...(node.border ? { border: node.border } : {}),
    ...(node.fillMaxWidth ? { fillMaxWidth: true } : {}),
    ...(node.fillMaxHeight ? { fillMaxHeight: true } : {}),
  }
}

/** `property` without the editor-only additions (`id`, button defaults). */
export function propertyOf(node: BuilderNode): Record<string, any> {
  return {
    ...(node.nativeProperty || {}),
    ...(node.layout ? { layout: node.layout } : {}),
    ...(node.spacing != null ? { spacing: node.spacing } : {}),
    ...(node.alignment ? { alignment: node.alignment } : {}),
    ...(node.textAlignment ? { textAlignment: node.textAlignment } : {}),
    ...(node.contentMode ? { contentMode: node.contentMode } : {}),
    ...(node.ctaType ? { ctaType: node.ctaType } : {}),
  }
}

/** `property` as exported: the layer name goes to `property.id`; a button always sends a ctaType. */
export function exportProperty(node: BuilderNode): Record<string, any> {
  const property = propertyOf(node)
  return { ...property, ...(node.type === 'button' ? { type: undefined, ctaType: property.ctaType || 'BUTTON' } : {}), id: node.name }
}

const without = <T extends object>(object: T, keys: readonly string[]) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key))) as T

/** Sets (or with `undefined` removes) one `style` key. */
export function setStyle(node: BuilderNode, key: string, value: unknown): BuilderNode {
  const style = exportStyle(node)
  if (value === undefined) delete style[key]
  else style[key] = value
  return { ...without(node, STYLE_SHORTCUTS), nativeStyle: style }
}

/** Sets (or with `undefined` removes) one `property` key. */
export function setProperty(node: BuilderNode, key: string, value: unknown): BuilderNode {
  const property = propertyOf(node)
  if (value === undefined) delete property[key]
  else property[key] = value
  return { ...without(node, PROPERTY_SHORTCUTS), nativeProperty: property }
}

/** Sets (or removes) one key of an object `value` (progressBar). */
export function setValueKey(node: BuilderNode, key: string, value: unknown): BuilderNode {
  const next = { ...(node.nativeValue || {}) }
  if (value === undefined) delete next[key]
  else next[key] = value
  return { ...node, nativeValue: next }
}

/** SDUI JSON for a node; `withRef` adds `__ref` so the preview can link back to the layer. */
export function toSchemaNode(node: BuilderNode, withRef = false): any {
  const { onTap: _onTap, trackTypes: _trackTypes, expire_time: _expire, ...source } = node.source || {}
  const sourceValue = node.source?.value && typeof node.source.value === 'object' ? node.source.value : {}
  const modifier = node.source?.modifier || node.weight != null ? { modifier: { ...(node.source?.modifier || {}), ...(node.weight != null ? { weight: node.weight } : {}) } } : {}
  const value = PARENT_TYPES.includes(node.type) ? { ...sourceValue, children: (node.children || []).map(child => toSchemaNode(child, withRef)) }
    : node.type === 'image' ? node.url || ''
    : node.type === 'button' ? { ...sourceValue, title: node.title || 'Button', type: node.buttonType || 'primary', ...(node.iconLeft ? { iconLeft: node.iconLeft } : {}), ...(node.iconRight ? { iconRight: node.iconRight } : {}) }
    : node.type === 'progressBar' ? node.nativeValue || node.source?.value || {}
    : (SDUI_TYPES as readonly string[]).includes(node.type) ? node.value || ''
    : node.source?.value
  return {
    ...source, ...(withRef ? { __ref: node.id } : {}), type: node.type,
    style: exportStyle(node), property: exportProperty(node), ...modifier, value,
    ...(node.onTap !== undefined ? { onTap: node.onTap } : {}),
    ...(node.trackTypes !== undefined ? { trackTypes: node.trackTypes } : {}),
    ...(node.expireTime !== undefined ? { expire_time: node.expireTime } : {}),
  }
}
