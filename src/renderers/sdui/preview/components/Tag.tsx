// §6.4 tag
import { resolveColor } from '../color'
import { BLACK, TAG, TRANSPARENT } from '../tokens'
import { fontCss } from '../typography'
import type { ContentProps } from '../Node'

export function TagContent({ node, inner, style }: ContentProps) {
  const { property, value } = node
  const platform = inner.platform
  const preset = TAG.presets[property.tagType] ?? TAG.fallbackPreset
  // §3.1: invalid override → [A] the tagType preset; [I] transparent background / black text.
  const background = resolveColor(property.backgroundColor, platform, preset.background, { android: preset.background, ios: TRANSPARENT })!
  const color = resolveColor(property.textColor, platform, preset.text, { android: preset.text, ios: BLACK })!
  const icon = typeof property.iconUrl === 'string' && property.iconUrl ? property.iconUrl : null
  // D27: height = one line of labelSMedium (+ 2): [A] 18 + 2 = 20, [I] ≈ 14.3 + 2.
  return <span className="sdui-drawn sdui-tag" style={{
    display: 'inline-flex', alignItems: 'center', gap: icon ? TAG.iconGap : 0, maxWidth: '100%', boxSizing: 'border-box',
    padding: `${TAG.paddingVertical}px ${TAG.paddingHorizontal}px`, borderRadius: TAG.radius, backgroundColor: background, color,
    ...fontCss(TAG.typography, platform), ...style,
  }}>
    {icon && <img src={icon} alt="" style={{ width: TAG.iconSize, height: TAG.iconSize, flex: '0 0 auto' }} />}
    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{value}</span>
  </span>
}
