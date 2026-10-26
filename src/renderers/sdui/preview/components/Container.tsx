// §5 container: row / column / scrollRow / scrollColumn
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { APPROX } from '../approx'
import type { Constraints } from '../context'
import { androidWeights, classifyColumnChild, classifyRowChild } from '../layout/android'
import type { Slot } from '../layout/android'
import { iosColumnItem, iosRowItem } from '../layout/ios'
import { RenderNode } from '../Node'
import type { ContentProps } from '../Node'
import type { SduiNode } from '../types'

// Layout effects do not run during server rendering (tests); avoid React's warning there.
const useMeasureEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type Layout = 'column' | 'row' | 'scrollRow' | 'scrollColumn'
/** §5: `column` is the default, also for unknown values. */
export const layoutOf = (node: SduiNode): Layout => (['row', 'scrollRow', 'scrollColumn'].includes(node.property.layout) ? node.property.layout : 'column')

/** D2: missing spacing → [A] 0, [I] the SwiftUI default (≈). Applies between every pair of children, spacers included. */
export const spacingOf = (node: SduiNode, platform: Constraints['platform']) =>
  typeof node.property.spacing === 'number' ? node.property.spacing : platform === 'android' ? 0 : APPROX.iosDefaultSpacing

/** §5.1 [chung] cross-axis alignment of a row: center → middle; bottom | end → bottom; else top. */
const rowCross = (alignment: unknown) => alignment === 'center' ? 'center' : alignment === 'bottom' || alignment === 'end' ? 'flex-end' : 'flex-start'
/** §5.2 [chung] cross-axis alignment of a column: center → middle; trailing | right → right; else left. */
const columnCross = (alignment: unknown) => alignment === 'center' ? 'center' : alignment === 'trailing' || alignment === 'right' ? 'flex-end' : 'flex-start'
/** D31: Android column also moves the whole group: center → middle, bottom | end → bottom. iOS: no effect. */
const androidColumnMain = (alignment: unknown) => alignment === 'center' ? 'center' : alignment === 'bottom' || alignment === 'end' ? 'flex-end' : 'flex-start'

const spacerLength = (node: SduiNode, platform: Constraints['platform']) =>
  node.property.minLength ?? (platform === 'android' ? 0 : APPROX.iosSpacerMinLength)

export function ContainerContent({ node, inner, style }: ContentProps) {
  const layout = layoutOf(node)
  if (layout === 'scrollRow' || layout === 'scrollColumn') return <ScrollStack node={node} inner={inner} style={style} horizontal={layout === 'scrollRow'} />
  if (inner.platform === 'android') return <AndroidStack node={node} inner={inner} style={style} horizontal={layout === 'row'} />
  return <IosStack node={node} inner={inner} style={style} horizontal={layout === 'row'} />
}

/** §5.1 / §5.2 [A] — Compose Row / Column: CSS places the children, a JS measure pass computes the weight share. */
function AndroidStack({ node, inner, style, horizontal }: ContentProps & { horizontal: boolean }) {
  const children = node.children
  const slots: Slot[] = children.map(child => horizontal ? classifyRowChild(child, children) : classifyColumnChild(child))
  const spacing = spacingOf(node, 'android')
  const maxMain = horizontal ? inner.maxWidth : inner.maxHeight
  const elements = useRef<(HTMLElement | null)[]>([])
  const [share, setShare] = useState(0)

  useMeasureEffect(() => {
    const measure = () => {
      const measured = slots.map((slot, index) => {
        const rect = elements.current[index]?.getBoundingClientRect()
        return { slot, natural: slot.kind === 'fixed' && rect ? (horizontal ? rect.width : rect.height) : 0 }
      })
      const next = androidWeights({ maxMain, spacing, children: measured }).share
      setShare(previous => Math.abs(previous - next) > 0.5 ? next : previous)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    elements.current.forEach((element, index) => { if (element && slots[index].kind === 'fixed') observer.observe(element) })
    return () => observer.disconnect()
  })

  const css: CSSProperties = {
    display: 'flex', flexDirection: horizontal ? 'row' : 'column', gap: spacing,
    alignItems: horizontal ? rowCross(node.property.alignment) : columnCross(node.property.alignment),
    justifyContent: horizontal ? 'flex-start' : androidColumnMain(node.property.alignment),
    ...style,
  }
  return <div className="sdui-stack" data-share={slots.some(slot => slot.kind === 'weight') ? share.toFixed(1) : undefined} style={css}>
    {children.map((child, index) => {
      const slot = slots[index]
      const c: Constraints = { platform: 'android', maxWidth: inner.maxWidth, maxHeight: inner.maxHeight }
      const item: CSSProperties = { flex: '0 0 auto' }
      if (slot.kind === 'weight') {
        if (horizontal) c.maxWidth = share
        else c.maxHeight = share
        // W(fill=true) → exactly the share; W(fill=false) → at most the share (the child's own constraint).
        if (slot.fill) item[horizontal ? 'width' : 'height'] = share
        else item.overflow = 'hidden'
      } else if (child.type === 'spacer') {
        item[horizontal ? 'width' : 'height'] = spacerLength(child, 'android')
      }
      // D35: Android spacer `defaultMinSize(minLength, minLength)` — the minimum applies on both axes.
      if (child.type === 'spacer') Object.assign(item, { minWidth: spacerLength(child, 'android'), minHeight: spacerLength(child, 'android') })
      return <RenderNode key={child.path} node={child} c={c} slot={item} slotRef={element => { elements.current[index] = element }} />
    })}
  </div>
}

/** §5.1 / §5.2 [I] — HStack / VStack with layoutPriority, approximated with CSS flex as the doc describes. */
function IosStack({ node, inner, style, horizontal }: ContentProps & { horizontal: boolean }) {
  const css: CSSProperties = {
    display: 'flex', flexDirection: horizontal ? 'row' : 'column', gap: spacingOf(node, 'ios'),
    // D31: iOS ignores the vertical alignment of a column; the group is placed by the frame (§4.2).
    alignItems: horizontal ? rowCross(node.property.alignment) : columnCross(node.property.alignment),
    ...style,
  }
  return <div className="sdui-stack" style={css}>
    {node.children.map(child => <RenderNode key={child.path} node={child} c={inner} slot={horizontal ? iosRowItem(child) : iosColumnItem(child)} />)}
  </div>
}

/** §5.3 [chung] — scroll, hidden scrollbar, no weights: children at natural size, spacer = minLength. */
function ScrollStack({ node, inner, style, horizontal }: ContentProps & { horizontal: boolean }) {
  const platform = inner.platform
  const css: CSSProperties = {
    display: 'flex', flexDirection: horizontal ? 'row' : 'column', gap: spacingOf(node, platform),
    alignItems: horizontal ? rowCross(node.property.alignment) : columnCross(node.property.alignment),
    ...(horizontal ? { overflowX: 'auto', overflowY: 'hidden', maxWidth: '100%' } : { overflowY: 'auto', overflowX: 'hidden', maxHeight: '100%', minHeight: 0 }),
    ...style,
  }
  // The scroll axis is unbounded for the children (D30).
  const c: Constraints = horizontal ? { ...inner, maxWidth: Infinity } : { ...inner, maxHeight: Infinity }
  return <div className="sdui-stack sdui-scroll" style={css}>
    {node.children.map(child => {
      const item: CSSProperties = { flex: '0 0 auto' }
      if (child.type === 'spacer') {
        const length = spacerLength(child, platform)
        item[horizontal ? 'width' : 'height'] = length
        // D35: Android min on both axes; iOS only along the main axis.
        if (platform === 'android') Object.assign(item, { minWidth: length, minHeight: length })
      }
      return <RenderNode key={child.path} node={child} c={c} slot={item} />
    })}
  </div>
}
