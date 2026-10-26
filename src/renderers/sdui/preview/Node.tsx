// §4 — common style → the node's frame, then the component inside it (§6).
import type { CSSProperties, ReactNode } from 'react'
import { resolveColor } from './color'
import { usePreview } from './context'
import type { Constraints } from './context'
import { contentGreedy } from './layout/ios'
import { TRANSPARENT } from './tokens'
import type { SduiNode } from './types'
import { BoxContent } from './components/Box'
import { ButtonContent, buttonDrawsNothing, isAndroidToggle } from './components/Button'
import { ContainerContent } from './components/Container'
import { ImageContent } from './components/Image'
import { PageIndicatorContent } from './components/PageIndicator'
import { PagerContent } from './components/Pager'
import { ProgressBarContent } from './components/ProgressBar'
import { TagContent } from './components/Tag'
import { TextContent } from './components/Text'

export interface NodeProps {
  node: SduiNode
  c: Constraints
  /** Flex / grid item style decided by the parent layout. */
  slot?: CSSProperties
  slotRef?: (element: HTMLElement | null) => void
}

/** Props every component's content receives from its frame. */
export interface ContentProps {
  node: SduiNode
  /** Constraints for the content box (frame minus padding). */
  inner: Constraints
  /** Placement of the content element inside the frame; merge into the component's root element. */
  style: CSSProperties
}

const finite = (value: number) => Number.isFinite(value)
const ZERO = { top: 0, left: 0, right: 0, bottom: 0 }

/**
 * [A] Components whose Compose layout receives the node modifier, so their content fills the frame
 * (a text frame is the text box, D28). Tag, button and pageIndicator keep their natural size at top-left (D24).
 */
const ANDROID_FILLS_FRAME = new Set(['container', 'box', 'text', 'image', 'pager', 'progressBar'])
/** [A] pager always fills the width the parent offers (§6.7). progressBar: its bar is `fillMaxWidth` (interpretation, see report). */
const ANDROID_ALWAYS_FILL_WIDTH = new Set(['pager', 'progressBar'])

export function RenderNode({ node, c, slot, slotRef }: NodeProps) {
  // §6.6: buttons with no title, ICON buttons, pageIndicator total ≤ 1 and an empty Android pager draw nothing.
  if (node.type === 'button' && buttonDrawsNothing(node, c.platform)) return null
  if (node.type === 'pageIndicator' && !((node.property.total ?? 0) > 1)) return null
  if (node.type === 'pager' && node.children.length === 0 && c.platform === 'android') return null
  // D34: Android does not pass the modifier to TemplateToggle → the node's style, onTap and impression are lost.
  if (isAndroidToggle(node, c.platform)) return <ButtonContent node={node} inner={c} style={slot || {}} />
  return <Frame node={node} c={c} slot={slot} slotRef={slotRef} render={content => renderContent(node, content.inner, content.style)} />
}

function renderContent(node: SduiNode, inner: Constraints, style: CSSProperties): ReactNode {
  const props = { node, inner, style }
  switch (node.type) {
    case 'container': return <ContainerContent {...props} />
    case 'box': return <BoxContent {...props} />
    case 'text': return <TextContent {...props} />
    case 'image': return <ImageContent {...props} />
    case 'tag': return <TagContent {...props} />
    case 'button': return <ButtonContent {...props} />
    case 'pager': return <PagerContent {...props} />
    case 'pageIndicator': return <PageIndicatorContent {...props} />
    case 'progressBar': return <ProgressBarContent {...props} />
    case 'spacer': return null
  }
}

function Frame({ node, c, slot, slotRef, render }: NodeProps & { render: (content: { inner: Constraints; style: CSSProperties }) => ReactNode }) {
  const env = usePreview()
  const { style } = node
  const android = c.platform === 'android'
  const pad = style.padding ?? ZERO
  const fillWidth = style.fillMaxWidth === true || (android && ANDROID_ALWAYS_FILL_WIDTH.has(node.type))
  const fillHeight = style.fillMaxHeight === true

  // Constraints for the content: the frame size (coerced into the parent constraints, as Compose does) minus padding.
  const frameMaxWidth = Math.min(style.width ?? Infinity, c.maxWidth)
  const frameMaxHeight = Math.min(style.height ?? Infinity, c.maxHeight)
  const inner: Constraints = {
    platform: c.platform,
    maxWidth: finite(frameMaxWidth) ? Math.max(0, frameMaxWidth - pad.left - pad.right) : Infinity,
    maxHeight: finite(frameMaxHeight) ? Math.max(0, frameMaxHeight - pad.top - pad.bottom) : Infinity,
  }

  // §4.1 [chung]: width/height are the outer size (border-box); background, radius and border sit on the outer edge.
  const background = resolveColor(style.backgroundColor, c.platform, null, { android: null, ios: TRANSPARENT })
  const css: CSSProperties = {
    boxSizing: 'border-box', position: 'relative', display: 'flex', flexDirection: 'column',
    padding: `${pad.top}px ${pad.right}px ${pad.bottom}px ${pad.left}px`,
    ...(background ? { backgroundColor: background } : {}),
    ...(style.cornerRadius !== undefined ? { borderRadius: style.cornerRadius } : {}),
  }
  const content: CSSProperties = {}

  if (android) {
    // D17: Android — `width` wins over `fillMaxWidth` (applied later in the modifier chain).
    if (style.width !== undefined) css.width = style.width
    else if (fillWidth && finite(c.maxWidth)) css.width = c.maxWidth
    if (style.height !== undefined) css.height = style.height
    else if (fillHeight && finite(c.maxHeight)) css.height = c.maxHeight
    if (finite(c.maxWidth)) css.maxWidth = c.maxWidth
    if (finite(c.maxHeight)) css.maxHeight = c.maxHeight
    // D24: Android places content top-left in a bigger frame (then the component's own alignment).
    css.justifyContent = 'flex-start'
    css.alignItems = 'flex-start'
    if (ANDROID_FILLS_FRAME.has(node.type)) Object.assign(content, { alignSelf: 'stretch', flex: '1 1 auto', minWidth: 0, minHeight: 0 })
    // D26: Android clips only when cornerRadius > 0.
    if ((style.cornerRadius ?? 0) > 0) css.overflow = 'hidden'
  } else {
    if (style.fillMaxWidth === true) {
      // D17: iOS — with `width` too, the frame is full width and the content is `width` wide at top-left;
      // background, radius, border and tap area cover the full-width frame.
      css.width = '100%'
      if (style.width !== undefined) Object.assign(content, { width: style.width, alignSelf: 'flex-start' })
    } else if (style.width !== undefined) css.width = style.width
    if (style.height !== undefined) css.height = style.height
    // D24: iOS centres content in a bigger frame (`.frame` default alignment), except on an axis with fillMax*
    // and no fixed size on that axis → top-left.
    css.alignItems = style.fillMaxWidth === true && style.width === undefined ? 'flex-start' : 'center'
    css.justifyContent = style.fillMaxHeight === true && style.height === undefined ? 'flex-start' : 'center'
    // §4.2: greedy content fills its frame on that axis instead of being centred.
    const fills = contentGreedy(node)
    if (fills.width && content.width === undefined) Object.assign(content, { alignSelf: 'stretch', minWidth: 0 })
    if (fills.height) Object.assign(content, { flex: '1 1 auto', minHeight: 0 })
    // D26: iOS always clips to the frame.
    css.overflow = 'hidden'
  }

  // §4.5 tap area. D25: Android = whole frame incl. padding; iOS = only painted pixels unless the frame has a valid background.
  const tappable = !!node.onTap
  const paintedOnly = tappable && !android && !background
  const ref = node.ref === undefined ? undefined : String(node.ref)
  const className = ['sdui-node', `sdui-node-${node.type}`,
    background ? 'sdui-drawn' : '',
    tappable ? 'sdui-tappable' : '', paintedOnly ? 'sdui-tap-painted-only' : '',
    ref !== undefined && ref === env.selectedRef ? 'sdui-selected' : ''].filter(Boolean).join(' ')

  const onClick = tappable && env.mode === 'tap' && env.interactions
    ? (event: { stopPropagation(): void }) => { event.stopPropagation(); void env.interactions!.run(node.onTap!.actions, { platform: c.platform, path: node.path, source: 'onTap' }) }
    : undefined

  // Border is drawn inside the edge, over the content, without adding size (§4.1). Invalid colour → transparent (§3.1).
  const borderColor = style.border && resolveColor(style.border.color, c.platform, null, { android: TRANSPARENT, ios: TRANSPARENT })
  return <div ref={slotRef} className={className} data-sdui-path={node.path} data-sdui-ref={ref} style={{ ...css, ...slot }} onClick={onClick}>
    {render({ inner, style: content })}
    {style.border && <span className="sdui-border" style={{ borderWidth: style.border.width, borderStyle: 'solid', borderColor: borderColor ?? TRANSPARENT }} />}
  </div>
}
