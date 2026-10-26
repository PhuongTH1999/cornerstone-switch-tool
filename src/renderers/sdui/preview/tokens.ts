// The only place in the SDUI preview that holds colours, font sizes, line heights and fixed sizes.
// Every value comes from docs/sdui/sdui-preview.md (spec 1.1.1); the section is noted next to each group.
// Values marked ≈ / 🔎 in the doc live in approx.ts instead.

export const SPEC_VERSION = '1.1.1'

/** §0 P2 / P4 */
export const CANVAS_WIDTH = 375
export const FONT_STACK = '-apple-system, "SF Pro Text", system-ui, sans-serif'

/** §3.2 — size, CSS weight, Android (kits) line-height. iOS line-height is size × APPROX.iosLineHeightFactor. */
export const TYPOGRAPHY = {
  headlineDefaultBold: { size: 24, weight: 700, androidLineHeight: 34 },
  headerDefaultBold: { size: 16, weight: 700, androidLineHeight: 22 },
  headerSSemibold: { size: 14, weight: 600, androidLineHeight: 20 },
  headerXsSemibold: { size: 12, weight: 600, androidLineHeight: 18 },
  descriptionDefaultRegular: { size: 12, weight: 400, androidLineHeight: 18 },
  descriptionXsRegular: { size: 10, weight: 400, androidLineHeight: 14 },
  labelSMedium: { size: 12, weight: 500, androidLineHeight: 18 },
  labelXsMedium: { size: 10, weight: 500, androidLineHeight: 14 },
  actionDefaultBold: { size: 16, weight: 700, androidLineHeight: 22 },
  actionSBold: { size: 14, weight: 700, androidLineHeight: 20 },
  actionXsBold: { size: 12, weight: 700, androidLineHeight: 18 },
} as const
export type TypographyName = keyof typeof TYPOGRAPHY
/** §3.2 — default, and the fallback for unknown values. */
export const DEFAULT_TYPOGRAPHY: TypographyName = 'descriptionDefaultRegular'

/** §3.3 — MoMo kits colour tokens (same on both platforms). */
export const COLOR = {
  black_01: '#FFFFFF', black_04: '#E8E8E8', black_08: '#C6C6C6', black_12: '#727272', black_17: '#303233',
  blue_03: '#007AFF', blue_08: '#CCE4FF',
  green_03: '#34C759', green_08: '#D6F4DE',
  red_03: '#F5222D', red_08: '#FDD3D5',
  orange_03: '#FA541C', orange_08: '#FEDDD2',
  gold_03: '#FA8C16', gold_09: '#FEF3E7',
  pink_03: '#EB2F96', pink_09: '#FDEAF4',
} as const

/** §3.3 — light theme defaults. */
export const THEME = {
  surface: '#FFFFFF',
  disabledBackground: '#EBEBF2',
  textDefault: '#303233',
  textDisabled: '#C6C6C6',
  borderDefault: '#E8E8E8',
  primary: COLOR.pink_03,
  tonal: COLOR.pink_09,
} as const

/** §3.1 [A] — colour names accepted by android.graphics.Color.parseColor (case-insensitive). */
export const ANDROID_COLOR_NAMES: Record<string, string> = {
  black: '#000000', darkgray: '#444444', darkgrey: '#444444', gray: '#888888', grey: '#888888',
  lightgray: '#CCCCCC', lightgrey: '#CCCCCC', white: '#FFFFFF', red: '#FF0000', green: '#00FF00',
  blue: '#0000FF', yellow: '#FFFF00', cyan: '#00FFFF', magenta: '#FF00FF', aqua: '#00FFFF',
  fuchsia: '#FF00FF', lime: '#00FF00', maroon: '#800000', navy: '#000080', olive: '#808000',
  purple: '#800080', silver: '#C0C0C0', teal: '#008080',
}

/** Plain colours used by the fallback tables (§3.1). */
export const BLACK = '#000000'
export const TRANSPARENT = 'transparent'

/** §3.4 */
export const SPACING = { XXS: 2, XS: 4, S: 8, M: 12, L: 16, XL: 24, XXL: 32 } as const

/** §6.1 / spec §5.3 */
export const TEXT_DEFAULT_COLOR = THEME.textDefault

/** §6.4 */
export const TAG = {
  iconSize: 12,
  iconGap: SPACING.XXS,
  paddingHorizontal: SPACING.S,
  paddingVertical: 1,
  radius: SPACING.S,
  typography: 'labelSMedium' as TypographyName,
  presets: {
    info: { background: COLOR.blue_08, text: COLOR.blue_03 },
    success: { background: COLOR.green_08, text: COLOR.green_03 },
    error: { background: COLOR.red_08, text: COLOR.red_03 },
    warning: { background: COLOR.orange_08, text: COLOR.orange_03 },
    highlight: { background: COLOR.gold_09, text: COLOR.gold_03 },
  } as Record<string, { background: string; text: string }>,
  fallbackPreset: { background: COLOR.black_17, text: COLOR.black_01 },
}

/** §6.6 — button kinds (case-insensitive `type`). */
export const BUTTON_KINDS: Record<string, { background: string; text: string; border?: string }> = {
  primary: { background: THEME.primary, text: COLOR.black_01 },
  secondary: { background: THEME.surface, text: THEME.textDefault, border: THEME.borderDefault },
  tonal: { background: THEME.tonal, text: THEME.primary },
  outline: { background: THEME.surface, text: THEME.primary, border: THEME.primary },
  danger: { background: COLOR.red_03, text: COLOR.black_01 },
  text: { background: TRANSPARENT, text: THEME.primary },
  disabled: { background: THEME.disabledBackground, text: THEME.textDisabled },
}

/** §6.6 — size SMALL. The iOS height is derived from APPROX (≈). */
export const BUTTON = {
  androidHeight: 28,
  androidRadius: 8,
  iosRadius: 6,
  paddingHorizontal: 8,
  borderWidth: 1,
  typography: 'actionXsBold' as TypographyName,
  iconSize: 16,
  iconGap: 4,
  /** [A] loading: background opacity; [I] disabled: whole-button opacity. */
  androidLoadingOpacity: 0.75,
  iosDisabledOpacity: 0.75,
  /** spec §6.7 D34 — iOS TOGGLE loading spinner. */
  iosToggleSpinnerSize: 20,
}

/** §6.8 */
export const PAGE_INDICATOR = {
  gap: 4,
  activeWidth: 12,
  inactiveWidth: 4,
  dotHeight: 4,
  activeColor: '#A50064',
  inactiveColor: '#DFDFE6',
}

/** §6.7 */
export const PAGER = {
  pillPaddingHorizontal: 6,
  pillPaddingVertical: 4,
  pillRadius: 8,
  /** [A] `#33000000` (alpha first) — written as CSS rgba. */
  androidIndicatorBackground: 'rgba(0, 0, 0, 0.2)',
  /** [I] `black.opacity(0.2)`. */
  iosIndicatorBackground: 'rgba(0, 0, 0, 0.2)',
  defaultAlignment: 'bottomCenter',
  /** paddingIndicator not sent: left, top, right, bottom. */
  paddingNotSent: { left: 6, top: 4, right: 6, bottom: 4 },
  /** paddingIndicator sent with sides missing. D12: iOS left default is 4. */
  paddingMissingSide: { androidLeft: 6, iosLeft: 4, right: 0, top: 0, bottom: 4 },
}

/** §6.9 */
export const PROGRESS = {
  gap: 2,
  trackColor: '#F2F2F6',
  radius: 2,
  defaultBarHeight: 4,
  defaultColor: COLOR.black_12,
  labelColor: COLOR.black_12,
  labelTypography: 'descriptionXsRegular' as TypographyName,
  subDes1MaxLength: 23,
  ellipsis: '...',
  minRatio: 0.02,
  animationMs: 800,
}

/** Colours of the tool itself (selection, tap areas, markers) — not part of the SDUI contract. */
export const TOOL = {
  canvasBackground: '#F2F2F6',
  canvasBorder: '#DDDDE3',
  selection: '#2563EB',
  tapArea: 'rgba(37, 99, 235, 0.18)',
  tapOutline: '#2563EB',
  needsConfirmation: '#DC2626',
  switchOn: COLOR.pink_03,
  switchOff: COLOR.black_08,
  switchKnob: COLOR.black_01,
}
