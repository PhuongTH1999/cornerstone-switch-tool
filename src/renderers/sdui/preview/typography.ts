import type { CSSProperties } from 'react'
import { APPROX } from './approx'
import { DEFAULT_TYPOGRAPHY, FONT_STACK, TYPOGRAPHY } from './tokens'
import type { TypographyName } from './tokens'
import type { Platform } from './types'

/** §3.2 — unknown names fall back to the default. */
export const typographyOf = (name: unknown) => TYPOGRAPHY[(typeof name === 'string' && name in TYPOGRAPHY ? name : DEFAULT_TYPOGRAPHY) as TypographyName]

/**
 * D27 — single-line height: [A] the kits line-height; [I] the font's natural line-height (≈ size × 1.193).
 * This is also the height of one line of MomoText (tag, progressBar, button) on iOS.
 */
export function lineHeight(name: unknown, platform: Platform): number {
  const spec = typographyOf(name)
  return platform === 'android' ? spec.androidLineHeight : +(spec.size * APPROX.iosLineHeightFactor).toFixed(2)
}

/** Font CSS for one line of text (§3.2, P3: no font scaling at width 375). */
export function fontCss(name: unknown, platform: Platform): CSSProperties {
  const spec = typographyOf(name)
  return { fontFamily: FONT_STACK, fontSize: spec.size, fontWeight: spec.weight, lineHeight: `${lineHeight(name, platform)}px` }
}
