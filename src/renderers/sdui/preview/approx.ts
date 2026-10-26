// Every value the doc marks ≈ (approximate) or 🔎 (inferred from engine source, needs a device check),
// plus the placeholders for cases the doc does not cover yet ("needs confirmation").
// Adjust here after comparing with real devices (docs/sdui/sdui-preview.md §9), then update the doc.

export const APPROX = {
  /** §3.2 ≈ — iOS natural SF line height = size × 1.193 (16 → 19.1). Used by `text` and single-line MomoText. */
  iosLineHeightFactor: 1.193,
  /** §5 / D2 ≈ — SwiftUI stack spacing when `spacing` is missing ("≈ 8, tuỳ cặp view"). */
  iosDefaultSpacing: 8,
  /** §5.1, §5.3 / D3 ≈ — SwiftUI Spacer minLength when `minLength` is missing. */
  iosSpacerMinLength: 8,
  /** §6.6 ≈ — iOS button vertical padding (height ≈ 6 + 14.3 + 6). */
  iosButtonPaddingVertical: 6,
  /** §6.6 — iOS `.padding(0.5)` around the button (height ≈ 27.3). */
  iosButtonOuterPadding: 0.5,
  /** D29 🔎 (T4) — Android: weighted children each get an equal share; leftover is not redistributed. */
  androidRowEqualShare: true,
  /** D30 🔎 (T5, T6) — Android: weighted children get 0 when the main axis is unbounded. */
  androidUnboundedWeightIsZero: true,
}

/** Placeholders for cases the doc does not cover. Each one renders a red dashed marker and is listed in lint. */
export const UNCONFIRMED = {
  /** G1 — iOS `pager` without `style.height`: drawn at the current page height, with a marker. */
  iosPagerWithoutHeight: 'page-height-with-marker' as const,
  /** G3 — iOS `truncationMode` head/middle when `lineLimit` > 1: drawn as tail, with a marker. */
  iosMultilineHeadMiddle: 'tail-with-marker' as const,
  /** G4 — `TOGGLE` switch geometry; the doc only says "system switch, initially off". */
  toggle: { width: 40, height: 24, knobInset: 2 },
  /** G4 — Android button loading spinner size; the doc only gives the iOS TOGGLE spinner (20). */
  androidButtonSpinnerSize: 16,
  /** Tool only: simulated CALL_API latency so the loading state is visible. Not from the doc. */
  callApiLatencyMs: 500,
}
