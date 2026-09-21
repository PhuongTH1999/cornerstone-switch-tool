/** MoMo design tokens supplied by the design system owner. */
const palettes: Record<string, string> = {
  black: 'ffffff f9f9f9 f0f0f0 e8e8e8 e5e5e5 d8d8d8 cccccc c6c6c6 b9b9b9 a0a0a0 878787 727272 646464 565656 484848 404040 303233 242424 18191a 000000',
  pink: 'bc2678 d42a87 eb2f96 ed43a0 ef59ab f382c0 f7acd5 fbd5ea fdeaf4 fef4fa fef8fc',
  violet: '7822c0 8726d8 962af0 a03ff1 ab55f3 c07ff6 d5aaf9 ead4fc f4e9fd faf4fe fcf8fe',
  indigo: '3e3ccc 4644e6 4e4bff 5f5dff 716fff 9593ff b8b7ff dcdbff ededff f6f6ff f9f9ff',
  blue: '0062cc 006ee6 007aff 1987ff 3395ff 66afff 99caff cce4ff e5f1ff f2f8ff f7fbff',
  mint: '0f9b9b 11afaf 13c2c2 2ac8c8 42cece 71dada a1e7e7 d0f3f3 e7f8f8 f3fcfc f8fdfd',
  green: '2a9f47 2fb350 34c759 48cc69 5dd27a 85dd9b aee9bd d6f4de eaf9ee f5fcf6 f9fdfa',
  lime: '80ae0e 90c30f a0d911 a9dc28 b3e141 c6e870 d9f0a0 ecf7cf f5fbe7 fafdf3 fcfef8',
  yellow: 'cca300 e6b800 ffcc00 ffd119 ffd633 ffe066 ffeb99 fff5cc fff9e5 fffcf2 fffdf7',
  gold: 'c87012 e17e14 fa8c16 fa972d fba345 fcba73 fdd1a2 fee8d0 fef3e7 fff9f3 fefbf8',
  orange: 'c84316 e14c19 fa541c fa6532 fb7649 fc9877 fdbba4 feddd2 feede8 fff6f3 fefaf8',
  red: 'c41b24 dd1f29 f5222d f63842 f74e57 f97a81 fba7ab fdd3d5 fee8ea fef4f4 fef8f8',
}
export const DESIGN_TOKENS: Record<string, string | number> = {
  ...Object.fromEntries(Object.entries(palettes).flatMap(([name, values]) => values.split(' ').map((value, i) => [`Colors.${name}_${String(i + 1).padStart(2, '0')}`, `#${value}`]))),
  'Colors.pink_MoMo_Branding': '#a50064', 'Colors.violet_11_stroke': '#dfe1e5',
  ...Object.fromEntries(Object.entries({ XXS: 2, XS: 4, S: 8, M: 12, L: 16, XL: 24, XXL: 32, Size3XL: 48, Size4XL: 56, Size5XL: 64 }).map(([key, value]) => [`Spacing.${key}`, value])),
  ...Object.fromEntries(Object.entries({ XXS: 2, XS: 4, S: 8, M: 12, L: 16, XL: 24 }).map(([key, value]) => [`Radius.${key}`, value])),
}
export const IMAGE_PLACEHOLDER = 'https://placehold.co/84x84/png'
/** Resolve tokens in SDUI style/property without changing text values or identifiers. */
export function resolveSDUIDesignTokens(input: any): any {
  const resolveFields = (value: any): any => {
    if (typeof value === 'string') return DESIGN_TOKENS[value] ?? value
    if (Array.isArray(value)) return value.map(resolveFields)
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveFields(item)]))
    return value
  }
  if (Array.isArray(input)) return input.map(resolveSDUIDesignTokens)
  if (!input || typeof input !== 'object') return input
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key,
    ['style', 'property', 'modifier', 'nativeStyle', 'nativeProperty'].includes(key)
      ? resolveFields(value) : resolveSDUIDesignTokens(value),
  ]))
}

// Platform-specific source values; not emitted as SDUI style because the common
// contract does not yet define shadow/elevation semantics for both runtimes.
export const SHADOW_TOKENS = {
  Dark: {
    ios: { shadowColor: '#303233', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.25, shadowRadius: 10 },
    android: { shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.29, shadowRadius: 4.65, elevation: 7 },
  },
  Light: {
    ios: { shadowColor: '#303233', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 },
    android: { shadowColor: '#a0a0a0', shadowOffset: { width: 1, height: 3 }, shadowOpacity: 0.29, shadowRadius: 4.65, elevation: 6 },
  },
  Pink: {
    ios: { shadowColor: '#e27eb5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 8 },
    android: { elevation: 16, shadowColor: '#e27eb5', shadowOpacity: 0.25 },
  },
}
