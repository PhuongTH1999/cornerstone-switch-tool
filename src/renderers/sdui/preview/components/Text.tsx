// §6.1 text
import type { CSSProperties } from 'react'
import { resolveColor } from '../color'
import { BLACK, TEXT_DEFAULT_COLOR } from '../tokens'
import { fontCss, lineHeight } from '../typography'
import type { ContentProps } from '../Node'

const alignOf = (value: unknown): CSSProperties['textAlign'] =>
  value === 'center' ? 'center' : value === 'trailing' || value === 'right' ? 'right' : 'left'

export function TextContent({ node, inner, style }: ContentProps) {
  const { property, value } = node
  const platform = inner.platform
  // §3.1: invalid colour → [A] #303233, [I] black.
  const color = resolveColor(property.color, platform, TEXT_DEFAULT_COLOR, { android: TEXT_DEFAULT_COLOR, ios: BLACK })!
  const lineLimit = typeof property.lineLimit === 'number' && property.lineLimit > 0 ? Math.floor(property.lineLimit) : undefined
  const clamp: CSSProperties = lineLimit ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lineLimit, overflow: 'hidden' } : {}
  const base: CSSProperties = { ...fontCss(property.typography, platform), color, textAlign: alignOf(property.textAlignment), whiteSpace: 'pre-wrap', overflowWrap: 'break-word', margin: 0 }

  if (platform === 'android') {
    // D7: Android sets line-height = lineSpacing. D6: Android always truncates at the end.
    const lh = typeof property.lineSpacing === 'number' ? { lineHeight: `${property.lineSpacing}px` } : {}
    // D28: the text box is the node frame, so textAlignment always applies (the frame makes this element fill it).
    return <div className="sdui-drawn sdui-text" style={{ ...base, ...lh, ...clamp, ...style }}>{value}</div>
  }

  // D7: iOS adds lineSpacing between lines on top of the natural line-height; the negative margins keep a
  // single line at its natural height.
  const spacing = typeof property.lineSpacing === 'number' ? property.lineSpacing : 0
  const lh: CSSProperties = spacing ? { lineHeight: `${lineHeight(property.typography, platform) + spacing}px`, marginBlock: -spacing / 2 } : {}
  // D28: iOS text is only as wide as its content; textAlignment only aligns the lines of multi-line text.
  // Its placement in the frame comes from §4.2 (centre with `width`, left with `fillMaxWidth`).
  const iosBox: CSSProperties = { ...base, ...lh, maxWidth: '100%', ...style }
  const mode = property.truncationMode
  if (lineLimit === 1 && mode === 'head') {
    // D6: iOS `.truncationMode(.head)` — "…" at the start, the end of the text stays visible.
    return <div className="sdui-drawn sdui-text" style={{ ...iosBox, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl' }}><bdi dir="ltr">{value}</bdi></div>
  }
  if (lineLimit === 1 && mode === 'middle') {
    // D6: iOS `.truncationMode(.middle)` — two halves, "…" between them (CSS has no middle truncation).
    const half = Math.ceil(value.length / 2)
    return <div className="sdui-drawn sdui-text" style={{ ...iosBox, display: 'flex', whiteSpace: 'pre', minWidth: 0 }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: '0 1 auto' }}>{value.slice(0, half)}</span>
      <span style={{ overflow: 'hidden', minWidth: 0, flex: '0 1 auto', direction: 'rtl' }}><bdi dir="ltr">{value.slice(half)}</bdi></span>
    </div>
  }
  // G3 (needs confirmation): head/middle with lineLimit > 1 is drawn as tail, flagged by lint.
  const unconfirmed = lineLimit !== undefined && lineLimit > 1 && (mode === 'head' || mode === 'middle')
  return <div className={`sdui-drawn sdui-text${unconfirmed ? ' sdui-unconfirmed' : ''}`} title={unconfirmed ? `G3: truncationMode ${mode} nhiều dòng — cần xác nhận` : undefined} style={{ ...iosBox, ...clamp }}>{value}</div>
}
