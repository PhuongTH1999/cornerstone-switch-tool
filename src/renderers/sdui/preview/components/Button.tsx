// §6.6 button — drawn like the template `cta` (docs/sdui/components/button.md).
import { useEffect, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { APPROX, UNCONFIRMED } from '../approx'
import { usePreview } from '../context'
import { parseActions } from '../parse'
import { BUTTON, BUTTON_KINDS, TOOL, TRANSPARENT } from '../tokens'
import { fontCss, lineHeight } from '../typography'
import type { ContentProps } from '../Node'
import type { Action, Platform, SduiNode } from '../types'

interface Cta { title?: string; ctaType: string; type?: string; iconLeft?: string; iconRight?: string; actions: Action[] }

const str = (value: unknown) => typeof value === 'string' ? value : undefined
const nonEmpty = (value: unknown) => typeof value === 'string' && value !== '' ? value : undefined

/** §6.6: `type`/`iconLeft`/`iconRight` read `value` first and fall back to `property` when empty. */
function ctaOf(node: SduiNode): Cta {
  const { property, value } = node
  return {
    title: str(value.title),
    // §6.6: ctaType is case-insensitive; missing / unknown → BUTTON.
    ctaType: (str(property.ctaType) ?? 'BUTTON').toUpperCase(),
    type: nonEmpty(value.type) ?? nonEmpty(property.type),
    iconLeft: nonEmpty(value.iconLeft) ?? nonEmpty(property.iconLeft),
    iconRight: nonEmpty(value.iconRight) ?? nonEmpty(property.iconRight),
    actions: property.actions ?? [],
  }
}

/** spec §6.7: a `cta` returned by CALL_API replaces the button when it has a title or actions. */
function ctaFromResponse(raw: any): Cta | null {
  if (!raw || typeof raw !== 'object' || (raw.title === undefined && raw.actions === undefined)) return null
  return {
    title: str(raw.title), ctaType: (str(raw.ctaType) ?? 'BUTTON').toUpperCase(), type: nonEmpty(raw.type),
    iconLeft: nonEmpty(raw.iconLeft), iconRight: nonEmpty(raw.iconRight), actions: parseActions(raw.actions),
  }
}

const drawsNothing = (cta: Cta, platform: Platform) =>
  cta.ctaType === 'ICON' // §6.6: ICON → nothing
  || (cta.ctaType !== 'TOGGLE' && (cta.title === undefined || (cta.title === '' && platform === 'ios'))) // D33: title "" → iOS draws nothing, Android an empty button

export const buttonDrawsNothing = (node: SduiNode, platform: Platform) => drawsNothing(ctaOf(node), platform)
export const isAndroidToggle = (node: SduiNode, platform: Platform) => node.type === 'button' && platform === 'android' && ctaOf(node).ctaType === 'TOGGLE'

/** D32: missing type → [A] text, [I] outline; unknown type → [A] text, [I] primary. Case-insensitive. */
export function buttonKind(type: string | undefined, platform: Platform) {
  const key = type?.toLowerCase()
  if (key && key in BUTTON_KINDS) return key
  if (key === undefined) return platform === 'android' ? 'text' : 'outline'
  return platform === 'android' ? 'text' : 'primary'
}

export function ButtonContent({ node, inner, style }: ContentProps) {
  const env = usePreview()
  const platform = inner.platform
  const payload = JSON.stringify([node.property, node.value])
  const [cta, setCta] = useState<Cta>(() => ctaOf(node))
  const [loading, setLoading] = useState(false)
  const [toggled, setToggled] = useState(false)
  // spec §6.7: state belongs to the node payload — a new payload brings the node's own CTA back.
  useEffect(() => { setCta(ctaOf(node)); setToggled(false); setLoading(false) }, [payload])

  const press = async (event: MouseEvent) => {
    if (env.mode !== 'tap' || !env.interactions) return
    // The button consumes the tap; a parent onTap does not fire (Compose clickable / SwiftUI Button).
    event.stopPropagation()
    if (loading) return
    setLoading(cta.actions.some(action => action.actionType === 'CALL_API'))
    const result = await env.interactions.run(cta.actions, { platform, path: node.path, source: 'button' })
    setLoading(false)
    // spec §6.7: TOGGLE follows isSuccess (= the response has data); a returned `cta` replaces the button.
    if (cta.ctaType === 'TOGGLE') setToggled(!!result.data)
    const next = result.success ? ctaFromResponse(result.data?.cta) : null
    if (next) setCta(next)
  }

  if (drawsNothing(cta, platform)) return null
  if (cta.ctaType === 'TOGGLE') return <Toggle platform={platform} on={toggled} loading={loading} style={style} onClick={press} />

  const kind = BUTTON_KINDS[buttonKind(cta.type, platform)]
  const disabled = buttonKind(cta.type, platform) === 'disabled'
  const textHeight = lineHeight(BUTTON.typography, platform)
  const spinner = <Spinner size={UNCONFIRMED.androidButtonSpinnerSize} color={kind.text} />
  const body: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: BUTTON.iconGap, boxSizing: 'border-box',
    padding: platform === 'android' ? `0 ${BUTTON.paddingHorizontal}px` : `${APPROX.iosButtonPaddingVertical}px ${BUTTON.paddingHorizontal}px`,
    // D33: Android height 28 fixed, radius 8; iOS height from content (≈ 6 + 14.3 + 6), radius 6.
    height: platform === 'android' ? BUTTON.androidHeight : APPROX.iosButtonPaddingVertical * 2 + textHeight,
    borderRadius: platform === 'android' ? BUTTON.androidRadius : BUTTON.iosRadius,
    // §6.6: Android loading → background at .75 opacity + spinner.
    backgroundColor: platform === 'android' && loading ? `color-mix(in srgb, ${kind.background} ${BUTTON.androidLoadingOpacity * 100}%, ${TRANSPARENT})` : kind.background,
    color: kind.text,
    ...(kind.border ? { boxShadow: `inset 0 0 0 ${BUTTON.borderWidth}px ${kind.border}` } : {}),
    ...fontCss(BUTTON.typography, platform), whiteSpace: 'nowrap', cursor: env.mode === 'tap' ? 'pointer' : undefined,
  }
  // §6.6: iOS loading → the spinner replaces the left icon. Android: spinner position not given (G4), same place.
  const left = loading ? spinner : cta.iconLeft && <img src={cta.iconLeft} alt="" style={{ width: BUTTON.iconSize, height: BUTTON.iconSize }} />
  const button = <span className="sdui-drawn sdui-button" style={body} onClick={press}>
    {left}<span>{cta.title}</span>{cta.iconRight && <img src={cta.iconRight} alt="" style={{ width: BUTTON.iconSize, height: BUTTON.iconSize }} />}
  </span>
  if (platform === 'android') return <span style={{ display: 'inline-flex', flex: '0 0 auto', ...style }}>{button}</span>
  // §6.6 [I]: `.padding(0.5).fixedSize()`; disabled → whole button at .75 opacity.
  return <span style={{ display: 'inline-flex', flex: '0 0 auto', padding: APPROX.iosButtonOuterPadding, ...(disabled ? { opacity: BUTTON.iosDisabledOpacity } : {}), ...style }}>{button}</span>
}

/** D34 — system switch, initially off. Geometry is a placeholder (G4). */
function Toggle({ platform, on, loading, style, onClick }: { platform: Platform; on: boolean; loading: boolean; style: CSSProperties; onClick: (event: MouseEvent) => void }) {
  const { width, height, knobInset } = UNCONFIRMED.toggle
  // D34: while loading Android draws nothing; iOS shows a 20 × 20 spinner.
  if (loading) return platform === 'ios' ? <span style={style}><Spinner size={BUTTON.iosToggleSpinnerSize} color={TOOL.switchOn} /></span> : <span style={{ width, height, ...style }} />
  const knob = height - knobInset * 2
  return <span className="sdui-drawn sdui-toggle sdui-unconfirmed" title="G4: kích thước công tắc chưa có trong tài liệu" onClick={onClick} style={{
    position: 'relative', display: 'inline-block', flex: '0 0 auto', width, height, borderRadius: height / 2,
    backgroundColor: on ? TOOL.switchOn : TOOL.switchOff, ...style,
  }}>
    <span style={{ position: 'absolute', top: knobInset, left: on ? width - knob - knobInset : knobInset, width: knob, height: knob, borderRadius: knob / 2, backgroundColor: TOOL.switchKnob }} />
  </span>
}

function Spinner({ size, color }: { size: number; color: string }) {
  return <span className="sdui-spinner" style={{ width: size, height: size, borderColor: color, borderTopColor: TRANSPARENT }} />
}
