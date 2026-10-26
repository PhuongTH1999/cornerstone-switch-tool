export type Platform = 'android' | 'ios'
export const PLATFORMS: Platform[] = ['android', 'ios']

export const SDUI_TYPES = ['text', 'image', 'spacer', 'tag', 'container', 'box', 'button', 'pager', 'pageIndicator', 'progressBar'] as const
export type SduiType = typeof SDUI_TYPES[number]

export interface Padding { top: number; left: number; right: number; bottom: number }

/** `style` after parsing. Colours stay raw strings; each use site parses them with its own fallback (§3.1). */
export interface NodeStyle {
  width?: number
  height?: number
  fillMaxWidth?: boolean
  fillMaxHeight?: boolean
  padding?: Padding
  backgroundColor?: string
  cornerRadius?: number
  border?: { width: number; color: string }
}

export interface Action {
  actionType: 'REDIRECT' | 'CALL_API'
  featureCode?: string
  endpoint?: string
  params?: Record<string, unknown>
}

export interface TrackTypes {
  trackId?: string
  containerType?: string
  tracking?: Record<string, unknown>
  trackify?: Record<string, unknown>
  itemTracking?: Record<string, unknown>
}

export interface SduiNode {
  type: SduiType
  /** Lint/debug path, e.g. `root.children[1].children[0]`. */
  path: string
  style: NodeStyle
  /** Only the keys of this type with the right JSON type survive (§2). */
  property: Record<string, any>
  /** string for text/image/tag/spacer/pageIndicator; object for button/progressBar; {} for parents. */
  value: any
  children: SduiNode[]
  onTap?: { actions: Action[] }
  trackTypes?: TrackTypes
  /** Editor link (`__ref` in the input); never part of the shipped JSON. */
  ref?: unknown
}

export type LintLevel = 'error' | 'warning' | 'info'

export interface Issue {
  level: LintLevel
  /** D-code from spec §10 when there is one, otherwise the doc section (e.g. `§6.2`). */
  code: string
  path: string
  message: string
  /** Platforms the issue applies to; omitted = both. */
  platforms?: Platform[]
}

export interface ParseResult { node: SduiNode | null; warnings: Issue[] }
