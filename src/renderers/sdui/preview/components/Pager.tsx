// §6.7 pager
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { resolveColor } from '../color'
import type { Constraints } from '../context'
import { RenderNode } from '../Node'
import type { ContentProps } from '../Node'
import { PAGER, TRANSPARENT } from '../tokens'
import type { Platform } from '../types'
import { alignment9 } from './Box'
import { Dots, indicatorColors } from './PageIndicator'

const useMeasureEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
const FLEX = { start: 'flex-start', center: 'center', end: 'flex-end' } as const

/** §6.7 — paddingIndicator: not sent → 6, 4, 6, 4; sent with missing sides → see table (D12). */
export function indicatorPadding(raw: unknown, platform: Platform) {
  if (!raw || typeof raw !== 'object') return PAGER.paddingNotSent
  const side = (key: string) => typeof (raw as any)[key] === 'number' ? (raw as any)[key] as number : undefined
  const missing = PAGER.paddingMissingSide
  const padding = {
    // D12: missing `left` → Android 6, iOS 4.
    left: side('left') ?? (platform === 'android' ? missing.androidLeft : missing.iosLeft),
    top: side('top') ?? missing.top, right: side('right') ?? missing.right, bottom: side('bottom') ?? missing.bottom,
  }
  // §6.7 [I]: negative values → 0.
  if (platform === 'ios') for (const key of Object.keys(padding) as (keyof typeof padding)[]) padding[key] = Math.max(0, padding[key])
  return padding
}

export function PagerContent({ node, inner, style }: ContentProps) {
  const platform = inner.platform
  const pages = node.children
  const [index, setIndex] = useState(0)
  const [pageHeight, setPageHeight] = useState<number>()
  const pageElements = useRef<(HTMLElement | null)[]>([])
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  const current = Math.min(index, Math.max(0, pages.length - 1))
  const fixedHeight = node.style.height !== undefined
  // D13: [A] height follows the current page; [I] TabView takes the height it is given → needs style.height.
  // G1 (needs confirmation): iOS without style.height is drawn at the current page height with a marker.
  const followsPage = platform === 'android' || !fixedHeight

  useMeasureEffect(() => {
    if (!followsPage) return
    const height = pageElements.current[current]?.getBoundingClientRect().height
    if (height !== undefined && height !== pageHeight) setPageHeight(height)
  })

  const go = (next: number) => setIndex(Math.max(0, Math.min(pages.length - 1, next)))
  const onPointerDown = (event: PointerEvent) => { drag.current = { x: event.clientX, moved: false } }
  const onPointerUp = (event: PointerEvent) => {
    if (!drag.current) return
    const dx = event.clientX - drag.current.x
    if (Math.abs(dx) > 30) { drag.current.moved = true; go(current + (dx < 0 ? 1 : -1)) }
  }

  // Pages: [A] content at top-left; [I] centred (D24).
  const pageSlot: CSSProperties = {
    flex: '0 0 100%', minWidth: 0, display: 'flex', flexDirection: 'column',
    ...(platform === 'android' ? { alignItems: 'flex-start', justifyContent: 'flex-start' } : { alignItems: 'center', justifyContent: 'center', ...(followsPage ? {} : { height: '100%' }) }),
  }
  const c: Constraints = { platform, maxWidth: inner.maxWidth, maxHeight: inner.maxHeight }
  // §6.7: the indicator shows when showIndicator != false and there are at least 2 pages.
  const showIndicator = node.property.showIndicator !== false && pages.length >= 2
  const padding = indicatorPadding(node.property.paddingIndicator, platform)
  const [justify, align] = alignment9(node.property.alignmentIndicator, PAGER.defaultAlignment)
  // §3.1: invalid indicatorBackgroundColor → [A] #33000000, [I] transparent.
  const pill = resolveColor(node.property.indicatorBackgroundColor, platform,
    platform === 'android' ? PAGER.androidIndicatorBackground : PAGER.iosIndicatorBackground,
    { android: PAGER.androidIndicatorBackground, ios: TRANSPARENT })!

  const unconfirmed = platform === 'ios' && !fixedHeight
  return <div className={`sdui-pager${unconfirmed ? ' sdui-unconfirmed' : ''}`} title={unconfirmed ? 'D13 / G1: pager không có style.height — iOS cần xác nhận' : undefined}
    tabIndex={0} onKeyDown={event => { if (event.key === 'ArrowRight') go(current + 1); if (event.key === 'ArrowLeft') go(current - 1) }}
    onPointerDown={onPointerDown} onPointerUp={onPointerUp}
    onClickCapture={event => { if (drag.current?.moved) { event.stopPropagation(); drag.current = null } }}
    style={{ position: 'relative', overflow: 'hidden', width: '100%', ...(followsPage ? { height: pageHeight } : {}), touchAction: 'pan-y', ...style }}>
    <div style={{ display: 'flex', height: '100%', alignItems: followsPage ? 'flex-start' : 'stretch', transform: `translateX(-${current * 100}%)`, transition: 'transform 300ms ease' }}>
      {pages.map((page, pageIndex) => <div key={page.path} ref={element => { pageElements.current[pageIndex] = element }} style={pageSlot}>
        <RenderNode node={page} c={c} />
      </div>)}
    </div>
    {showIndicator && <div style={{
      position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none', justifyContent: FLEX[justify], alignItems: FLEX[align],
      padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`,
    }}>
      <span className="sdui-drawn" style={{ display: 'inline-flex', padding: `${PAGER.pillPaddingVertical}px ${PAGER.pillPaddingHorizontal}px`, borderRadius: PAGER.pillRadius, backgroundColor: pill }}>
        <Dots total={pages.length} active={current} colors={indicatorColors(node.property, platform)} />
      </span>
    </div>}
  </div>
}
