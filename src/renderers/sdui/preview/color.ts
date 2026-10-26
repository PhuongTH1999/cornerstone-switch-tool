import { ANDROID_COLOR_NAMES } from './tokens'
import type { Platform } from './types'

/**
 * §3.1 — parse a colour string the way each platform does. Returns a CSS colour, or null when the platform
 * cannot parse it (the caller then applies the fallback of its own row in the §3.1 table).
 */
export function parseColor(input: unknown, platform: Platform): string | null {
  if (typeof input !== 'string') return null
  if (platform === 'android') {
    // D8: android.graphics.Color.parseColor — `#RRGGBB`, `#AARRGGBB` (alpha first) and colour names; no bare hex.
    if (/^#[0-9a-f]{6}$/i.test(input)) return input.toUpperCase()
    if (/^#[0-9a-f]{8}$/i.test(input)) {
      const [a, r, g, b] = [1, 3, 5, 7].map(index => parseInt(input.slice(index, index + 2), 16))
      return `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`
    }
    return ANDROID_COLOR_NAMES[input.toLowerCase()] ?? null
  }
  // D8: iOS Color(default:ofHex:) — exactly 6 hex digits, `#` optional; no alpha, no names.
  const match = /^#?([0-9a-f]{6})$/i.exec(input)
  return match ? `#${match[1].toUpperCase()}` : null
}

/**
 * §3.1 — colour for one use site: `missing` when the key is absent, the parsed colour when valid,
 * otherwise this site's fallback on this platform (null = draw nothing).
 */
export function resolveColor(input: unknown, platform: Platform, missing: string | null, invalid: Record<Platform, string | null>): string | null {
  if (input === undefined) return missing
  return parseColor(input, platform) ?? invalid[platform]
}

/** §8 lint: the only format that is safe on both platforms. */
export const isPortableColor = (input: unknown) => typeof input === 'string' && /^#[0-9a-f]{6}$/i.test(input)
