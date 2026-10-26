// §6.8 pageIndicator
import { resolveColor } from '../color'
import { PAGE_INDICATOR, TRANSPARENT } from '../tokens'
import type { ContentProps } from '../Node'
import type { Platform } from '../types'

/** §3.1: invalid active / inactive colour → [A] the default, [I] transparent. */
export function indicatorColors(property: Record<string, any>, platform: Platform) {
  return {
    active: resolveColor(property.activeColor, platform, PAGE_INDICATOR.activeColor, { android: PAGE_INDICATOR.activeColor, ios: TRANSPARENT })!,
    inactive: resolveColor(property.inactiveColor, platform, PAGE_INDICATOR.inactiveColor, { android: PAGE_INDICATOR.inactiveColor, ios: TRANSPARENT })!,
  }
}

/** §6.8 — dots 4 apart, vertically centred: active 12 × 4, inactive 4 × 4, capsule. */
export function Dots({ total, active, colors }: { total: number; active: number; colors: { active: string; inactive: string } }) {
  return <span className="sdui-drawn sdui-dots" style={{ display: 'inline-flex', alignItems: 'center', gap: PAGE_INDICATOR.gap }}>
    {Array.from({ length: total }, (_, index) => <span key={index} style={{
      width: index === active ? PAGE_INDICATOR.activeWidth : PAGE_INDICATOR.inactiveWidth, height: PAGE_INDICATOR.dotHeight,
      borderRadius: PAGE_INDICATOR.dotHeight / 2, backgroundColor: index === active ? colors.active : colors.inactive, flex: '0 0 auto',
    }} />)}
  </span>
}

/** Standalone and static (§6.8); `total <= 1` is filtered out before the frame is drawn. */
export function PageIndicatorContent({ node, inner, style }: ContentProps) {
  const total = Math.floor(node.property.total ?? 0)
  const active = Math.floor(node.property.activeIndex ?? 0)
  return <span style={{ display: 'inline-flex', ...style }}><Dots total={total} active={active} colors={indicatorColors(node.property, inner.platform)} /></span>
}
