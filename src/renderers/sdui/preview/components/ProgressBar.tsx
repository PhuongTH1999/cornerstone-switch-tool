// §6.9 progressBar
import type { CSSProperties } from 'react'
import { resolveColor } from '../color'
import { usePreview } from '../context'
import { BLACK, PROGRESS } from '../tokens'
import { fontCss, lineHeight } from '../typography'
import type { ContentProps } from '../Node'
import type { Platform } from '../types'

/** §6.9: subDes1 longer than 23 → first 23 + "...". [A] counts UTF-16 units, [I] visible characters. */
export function truncateSubDes1(text: string, platform: Platform) {
  if (platform === 'android') return text.length > PROGRESS.subDes1MaxLength ? text.slice(0, PROGRESS.subDes1MaxLength) + PROGRESS.ellipsis : text
  // Intl.Segmenter is not in the ES2020 lib typings this project compiles against.
  const Segmenter = (Intl as unknown as { Segmenter?: new () => { segment(input: string): Iterable<{ segment: string }> } }).Segmenter
  const graphemes = Segmenter ? [...new Segmenter().segment(text)].map(part => part.segment) : [...text]
  return graphemes.length > PROGRESS.subDes1MaxLength ? graphemes.slice(0, PROGRESS.subDes1MaxLength).join('') + PROGRESS.ellipsis : text
}

/** §6.9: ratio = clamp(current / max, 0, 1) (max ≤ 0 → 0), drawn at least 2%. iOS does not clamp below 0 — same picture. */
export function progressRatio(current: number, max: number, platform: Platform) {
  const raw = max <= 0 ? 0 : current / max
  const ratio = platform === 'android' ? Math.min(1, Math.max(0, raw)) : Math.min(1, raw)
  return Math.max(PROGRESS.minRatio, ratio)
}

export function ProgressBarContent({ node, inner, style }: ContentProps) {
  const env = usePreview()
  const platform = inner.platform
  const { currentValue, maxValue, subDes1 = '', subDes2 = '' } = node.value
  const { color, barHeight, barWidth } = node.property
  // §3.1: invalid colour → [A] #727272, [I] black (D9).
  const fill = resolveColor(color, platform, PROGRESS.defaultColor, { android: PROGRESS.defaultColor, ios: BLACK })!
  const height = typeof barHeight === 'number' ? barHeight : PROGRESS.defaultBarHeight
  // D15: barWidth → [A] exact width, left-aligned; [I] max width, centred in the column.
  const track: CSSProperties = typeof barWidth === 'number'
    ? platform === 'android' ? { width: barWidth, alignSelf: 'flex-start' } : { width: '100%', maxWidth: barWidth, alignSelf: 'center' }
    : { width: '100%', alignSelf: 'stretch' }
  const label = { ...fontCss(PROGRESS.labelTypography, platform), color: PROGRESS.labelColor }
  return <div className="sdui-progress" style={{ display: 'flex', flexDirection: 'column', gap: PROGRESS.gap, ...style }}>
    {/* The label row is always there, even with both texts empty (one line high). */}
    <div className="sdui-drawn" style={{ display: 'flex', justifyContent: 'space-between', minHeight: lineHeight(PROGRESS.labelTypography, platform), ...label }}>
      <span style={platform === 'android' ? { whiteSpace: 'nowrap' } : undefined}>{truncateSubDes1(subDes1, platform)}</span>
      <span>{subDes2}</span>
    </div>
    <div className="sdui-drawn" style={{ height, borderRadius: PROGRESS.radius, backgroundColor: PROGRESS.trackColor, overflow: 'hidden', ...track }}>
      <div className={env.animate ? 'sdui-progress-fill' : undefined} style={{
        height: '100%', borderRadius: PROGRESS.radius, backgroundColor: fill,
        width: `${progressRatio(currentValue, maxValue, platform) * 100}%`, animationDuration: `${PROGRESS.animationMs}ms`,
      }} />
    </div>
  </div>
}
