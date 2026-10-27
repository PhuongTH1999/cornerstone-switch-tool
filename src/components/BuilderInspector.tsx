import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { exportStyle, propertyOf, type BuilderNode } from '../lib/builderNode'
import { isBindable } from '../lib/dynamicFields'
import type { Issue } from '../renderers/sdui/preview/types'

type Option = { value: string; label?: string }
const options = (...values: (string | Option)[]): Option[] => values.map(value => typeof value === 'string' ? { value } : value)

const TYPOGRAPHY = options('headlineDefaultBold', 'headerDefaultBold', 'headerSSemibold', 'headerXsSemibold', 'descriptionDefaultRegular', 'descriptionXsRegular', 'labelSMedium', 'labelXsMedium', 'actionDefaultBold', 'actionSBold', 'actionXsBold')
const ALIGNMENT9 = options('topStart', 'topCenter', 'topEnd', 'centerStart', 'center', 'centerEnd', 'bottomStart', 'bottomCenter', 'bottomEnd')
const BUTTON_TYPES = options('primary', 'secondary', 'tonal', 'outline', 'danger', 'text', 'disabled')
/** spec §6.5 — alignment values that mean something for each layout. */
const CONTAINER_ALIGNMENT: Record<string, Option[]> = {
  column: options({ value: 'center', label: 'center — giữa (Android: cả nhóm giữa cột)' }, { value: 'trailing', label: 'trailing — phải' }, { value: 'right', label: 'right — phải' }, { value: 'bottom', label: 'bottom — Android dồn đáy, iOS không đổi (D31)' }, { value: 'end', label: 'end — Android dồn đáy, iOS không đổi (D31)' }),
  row: options({ value: 'center', label: 'center — giữa theo chiều dọc' }, { value: 'bottom', label: 'bottom — đáy' }, { value: 'end', label: 'end — đáy' }),
}
const LEVEL_ICON: Record<Issue['level'], string> = { error: '❌', warning: '⚠️', info: 'ℹ️' }
const isHex = (value: unknown) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)

export interface InspectorProps {
  node: BuilderNode
  isRoot: boolean
  path: string
  duplicateVariable: boolean
  /** Lint issues whose path is this node. */
  issues: Issue[]
  styleTools: ReactNode
  onCopyPath: () => void
  /** `field` names the edit, so a burst of typing in one field is one undo step. */
  onNode: (patch: Partial<BuilderNode>, field: string) => void
  onStyle: (key: string, value: unknown) => void
  onProperty: (key: string, value: unknown) => void
  onValue: (key: string, value: unknown) => void
}

export default function BuilderInspector(props: InspectorProps) {
  const { node, isRoot, path, duplicateVariable, issues, styleTools, onCopyPath, onNode, onStyle, onProperty, onValue } = props
  const style = exportStyle(node)
  const property = propertyOf(node)
  const type = node.type
  const layout = property.layout === 'row' || property.layout === 'scrollRow' ? 'row' : 'column'
  const errors = issues.filter(issue => issue.level !== 'info').length

  return <aside className="sdui-card figma-inspector-dock inspector">
    <div className="sdui-card-title">Inspector <span>{type.toUpperCase()}</span></div>

    <Group title="Định danh" defaultOpen>
      <div className="sdui-label">Path<div className="inspector-path-row"><code title={path}>{path}</code><button type="button" className="sdui-quiet" onClick={onCopyPath}>Copy</button></div></div>
      {isBindable(type)
        ? <TextField label="Variable" value={node.variable} placeholder="Key BE trả về, vd. giftPrefix" onChange={value => onNode({ variable: value }, 'variable')}
          error={duplicateVariable ? 'Variable này đang gắn ở node khác — BE chỉ trả một giá trị cho mỗi key.' : undefined} />
        : <p className="sdui-muted inspector-note">Chỉ text, image, tag, button gắn được variable.</p>}
      <TextField label="Layer name" value={node.name} hint="Xuất thành property.id (native bỏ qua)." onChange={value => onNode({ name: value ?? '' }, 'name')} />
    </Group>

    {hasContent(type) && <Group title="Nội dung" defaultOpen>
      {type === 'text' && <TextField label="Text" multiline value={node.value} onChange={value => onNode({ value }, 'value')} />}
      {type === 'tag' && <TextField label="Nhãn" value={node.value} onChange={value => onNode({ value }, 'value')} />}
      {type === 'image' && <TextField label="Image URL" value={node.url} placeholder="https://…" onChange={value => onNode({ url: value }, 'url')} />}
      {type === 'button' && <>
        <TextField label="Title" value={node.title} placeholder="Button" hint="Bỏ trống → xuất 'Button'." onChange={value => onNode({ title: value }, 'title')} />
        <TextField label="Icon trái (URL)" value={node.iconLeft} onChange={value => onNode({ iconLeft: value }, 'iconLeft')} />
        <TextField label="Icon phải (URL)" value={node.iconRight} onChange={value => onNode({ iconRight: value }, 'iconRight')} />
      </>}
      {type === 'progressBar' && <>
        <NumberField label="currentValue" value={node.nativeValue?.currentValue} onChange={value => onValue('currentValue', value)} error={node.nativeValue?.currentValue === undefined ? 'Bắt buộc — thiếu thì node bị bỏ.' : undefined} />
        <NumberField label="maxValue" value={node.nativeValue?.maxValue} onChange={value => onValue('maxValue', value)} error={node.nativeValue?.maxValue === undefined ? 'Bắt buộc — thiếu thì node bị bỏ.' : undefined} />
        <TextField label="subDes1 (trái, tối đa 23 ký tự)" value={node.nativeValue?.subDes1} onChange={value => onValue('subDes1', value)} />
        <TextField label="subDes2 (phải)" value={node.nativeValue?.subDes2} onChange={value => onValue('subDes2', value)} />
      </>}
      {type === 'pageIndicator' && <>
        <NumberField label="Total" value={property.total} placeholder="0" hint="≤ 1 → không vẽ." onChange={value => onProperty('total', value)} />
        <NumberField label="Active index" value={property.activeIndex} placeholder="0" onChange={value => onProperty('activeIndex', value)} />
      </>}
    </Group>}

    <Group title="Bố cục" defaultOpen>
      {type === 'container' && <>
        <SelectField label="Layout" value={property.layout} placeholder="column (mặc định)" options={options('column', 'row', 'scrollColumn', 'scrollRow')} onChange={value => onProperty('layout', value)} />
        <NumberField label="Spacing" value={property.spacing} placeholder="Android 0 · iOS ≈ 8" hint={property.spacing === undefined ? 'D2: luôn gửi spacing để 2 nền tảng giống nhau.' : undefined} onChange={value => onProperty('spacing', value)} />
        <SelectField label="Alignment" value={property.alignment} placeholder="Mặc định (đầu)" options={CONTAINER_ALIGNMENT[layout]} onChange={value => onProperty('alignment', value)} />
      </>}
      {type === 'box' && <SelectField label="Content alignment" value={property.contentAlignment} placeholder="topStart (mặc định)" options={ALIGNMENT9} onChange={value => onProperty('contentAlignment', value)} />}
      {type === 'spacer' && <NumberField label="Min length" value={property.minLength} placeholder="Android 0 · iOS ≈ 8" hint={property.minLength === undefined ? 'D3: luôn gửi minLength.' : undefined} onChange={value => onProperty('minLength', value)} />}
      <div className="inspector-pair">
        <NumberField label="Width" value={style.width} placeholder="auto" onChange={value => onStyle('width', value)} />
        <NumberField label="Height" value={style.height} placeholder="auto" onChange={value => onStyle('height', value)} />
      </div>
      <div className="inspector-pair">
        <CheckField label="fillMaxWidth" checked={style.fillMaxWidth === true || style.fillMaxWidth === 1} onChange={checked => onStyle('fillMaxWidth', checked || undefined)} />
        <CheckField label="fillMaxHeight" checked={style.fillMaxHeight === true || style.fillMaxHeight === 1} onChange={checked => onStyle('fillMaxHeight', checked || undefined)} />
      </div>
      {style.fillMaxWidth && style.width !== undefined && <p className="inspector-hint">D17: có cả width và fillMaxWidth — Android lấy width, iOS khung rộng hết.</p>}
      {type === 'pager' && style.height === undefined && <p className="inspector-hint is-error">D13: pager cần style.height (iOS không tự co).</p>}
      <PaddingField value={style.padding} onChange={value => onStyle('padding', value)} />
    </Group>

    <Group title="Giao diện" defaultOpen>
      {type === 'text' && <>
        <SelectField label="Typography" value={property.typography} placeholder="descriptionDefaultRegular (mặc định)" options={TYPOGRAPHY} onChange={value => onProperty('typography', value)} />
        <ColorField label="Text color" value={property.color} placeholder="#303233" onChange={value => onProperty('color', value)} />
        <NumberField label="Line limit" value={property.lineLimit} placeholder="không giới hạn" onChange={value => onProperty('lineLimit', value)} />
        <SelectField label="Text alignment" value={property.textAlignment} placeholder="leading (mặc định)" options={options('leading', 'center', 'trailing', 'right')} onChange={value => onProperty('textAlignment', value)} />
        <SelectField label="Truncation mode" value={property.truncationMode} placeholder="tail (mặc định)" options={options('tail', 'head', 'middle')} hint={property.truncationMode && property.truncationMode !== 'tail' ? 'D6: Android luôn cắt cuối.' : undefined} onChange={value => onProperty('truncationMode', value)} />
        <NumberField label="Line spacing" value={property.lineSpacing} placeholder="không" hint={property.lineSpacing !== undefined ? 'D7: Android = line-height, iOS cộng thêm.' : undefined} onChange={value => onProperty('lineSpacing', value)} />
      </>}
      {type === 'image' && <>
        <SelectField label="Content mode" value={property.contentMode} placeholder="fit (mặc định)" options={options('fit', 'fill', 'scaleAspectFill')} onChange={value => onProperty('contentMode', value)} />
        <ColorField label="Tint color" value={property.tintColor} hint="Tô cả ảnh một màu (icon đơn sắc)." onChange={value => onProperty('tintColor', value)} />
        <NumberField label="Aspect ratio (width / height)" value={property.aspectRatio} step="0.01" onChange={value => onProperty('aspectRatio', value)} />
        <NumberField label="Bo góc ảnh (property.cornerRadius)" value={property.cornerRadius} placeholder="0" hint="Bo riêng ảnh; bo cả khung dùng Corner radius bên dưới." onChange={value => onProperty('cornerRadius', value)} />
      </>}
      {type === 'button' && <>
        <SelectField label="Button type" value={node.buttonType} placeholder="primary (xuất mặc định)" options={BUTTON_TYPES} onChange={value => onNode({ buttonType: value }, 'buttonType')} />
        <SelectField label="CTA type" value={property.ctaType} placeholder="BUTTON (mặc định)" options={options('BUTTON', 'TOGGLE', 'ICON')}
          hint={property.ctaType === 'TOGGLE' ? 'D34: Android bỏ style / onTap / tracking của node TOGGLE.' : property.ctaType === 'ICON' ? 'ICON → không vẽ gì.' : undefined} onChange={value => onProperty('ctaType', value)} />
        <ColorField label="Button color" value={property.color} hint="Không ảnh hưởng hình — màu theo Button type (spec §6.7)." onChange={value => onProperty('color', value)} />
      </>}
      {type === 'tag' && <>
        <SelectField label="Tag type" value={property.tagType} placeholder="Xám (mặc định)" options={options('info', 'success', 'error', 'warning', 'highlight')} onChange={value => onProperty('tagType', value)} />
        <ColorField label="Nền tag" value={property.backgroundColor} placeholder="theo tag type" onChange={value => onProperty('backgroundColor', value)} />
        <ColorField label="Màu chữ tag" value={property.textColor} placeholder="theo tag type" onChange={value => onProperty('textColor', value)} />
        <TextField label="Icon URL (12×12)" value={property.iconUrl} onChange={value => onProperty('iconUrl', value)} />
      </>}
      {type === 'pager' && <>
        <CheckField label="Show indicator" checked={property.showIndicator !== false} onChange={checked => onProperty('showIndicator', checked)} />
        <SelectField label="Indicator alignment" value={property.alignmentIndicator} placeholder="bottomCenter (mặc định)" options={ALIGNMENT9} onChange={value => onProperty('alignmentIndicator', value)} />
        <ColorField label="Active color" value={property.activeColor} placeholder="#A50064" onChange={value => onProperty('activeColor', value)} />
        <ColorField label="Inactive color" value={property.inactiveColor} placeholder="#DFDFE6" onChange={value => onProperty('inactiveColor', value)} />
        <ColorField label="Indicator background" value={property.indicatorBackgroundColor} placeholder="đen 20%" onChange={value => onProperty('indicatorBackgroundColor', value)} />
        <SidesField label="Padding indicator" value={property.paddingIndicator} hint="Gửi đủ 4 cạnh (D12)." onChange={value => onProperty('paddingIndicator', value)} />
      </>}
      {type === 'pageIndicator' && <>
        <ColorField label="Active color" value={property.activeColor} placeholder="#A50064" onChange={value => onProperty('activeColor', value)} />
        <ColorField label="Inactive color" value={property.inactiveColor} placeholder="#DFDFE6" onChange={value => onProperty('inactiveColor', value)} />
      </>}
      {type === 'progressBar' && <>
        <ColorField label="Bar color" value={property.color} placeholder="#727272" onChange={value => onProperty('color', value)} />
        <div className="inspector-pair">
          <NumberField label="Bar height" value={property.barHeight} placeholder="4" onChange={value => onProperty('barHeight', value)} />
          <NumberField label="Bar width" value={property.barWidth} placeholder="full" onChange={value => onProperty('barWidth', value)} />
        </div>
        {property.barWidth !== undefined && <p className="inspector-hint">D15: Android sát trái, iOS căn giữa.</p>}
      </>}
      <ColorField label="Background" value={style.backgroundColor} onChange={value => onStyle('backgroundColor', value)} />
      <NumberField label="Corner radius (khung)" value={style.cornerRadius} placeholder="0" onChange={value => onStyle('cornerRadius', value)} />
      <div className="inspector-pair">
        <NumberField label="Border width" value={style.border?.width} placeholder="không" onChange={value => onStyle('border', mergeBorder(style.border, { width: value }))} />
        <ColorField label="Border color" value={style.border?.color} onChange={value => onStyle('border', mergeBorder(style.border, { color: value }))} />
      </div>
      {style.border && (style.border.width === undefined || !style.border.color) && <p className="inspector-hint is-error">Viền cần cả width và color, thiếu một trong hai → không vẽ viền.</p>}
    </Group>

    <Group title="Hành động" defaultOpen={!!node.onTap || type === 'button'} badge={(property.actions?.length ?? 0) + (node.onTap?.actions?.length ?? 0) || undefined}>
      {type === 'button' && <ActionsField label="Actions của nút" value={property.actions} onChange={value => onProperty('actions', value)} />}
      {node.onTap === undefined
        ? <button type="button" className="inspector-apply-button" onClick={() => onNode({ onTap: { actions: [] } }, 'onTap')}>+ Thêm onTap (bấm cả vùng node)</button>
        : <>
          <ActionsField label="onTap" value={node.onTap.actions} onChange={value => onNode({ onTap: { ...node.onTap, actions: value ?? [] } }, 'onTap')} />
          {!isHex(style.backgroundColor) && <p className="inspector-hint">D25: không có Background → iOS chỉ bấm được phần có vẽ.</p>}
          <button type="button" className="sdui-quiet inspector-remove" onClick={() => onNode({ onTap: undefined }, 'onTap')}>Xoá onTap</button>
        </>}
    </Group>

    <Group title="Tracking & hết hạn" defaultOpen={!!node.trackTypes || node.expireTime !== undefined}>
      {node.trackTypes === undefined
        ? <button type="button" className="inspector-apply-button" onClick={() => onNode({ trackTypes: { trackId: '' } }, 'trackTypes')}>+ Thêm trackTypes</button>
        : <>
          <TextField label="trackId" value={node.trackTypes.trackId} placeholder="uuid" error={!node.trackTypes.trackId ? 'Thiếu trackId → mọi node dùng chung impression id (spec §8).' : undefined}
            onChange={value => onNode({ trackTypes: withKey(node.trackTypes, 'trackId', value) }, 'trackTypes.trackId')} />
          <SelectField label="containerType" value={node.trackTypes.containerType} placeholder="không khai báo (= item)" options={options({ value: 'widget', label: 'widget — impression không gửi itemTracking' }, 'item')}
            onChange={value => onNode({ trackTypes: withKey(node.trackTypes, 'containerType', value) }, 'trackTypes.containerType')} />
          {(['tracking', 'trackify', 'itemTracking'] as const).map(key => <JsonField key={key} label={key} value={node.trackTypes[key]}
            onChange={value => onNode({ trackTypes: withKey(node.trackTypes, key, value) }, `trackTypes.${key}`)} />)}
          <button type="button" className="sdui-quiet inspector-remove" onClick={() => onNode({ trackTypes: undefined }, 'trackTypes')}>Xoá trackTypes</button>
        </>}
      <NumberField label="expire_time (epoch ms)" value={typeof node.expireTime === 'string' ? Number(node.expireTime) : node.expireTime} placeholder="không hết hạn"
        hint={isRoot ? 'D16: root không bị kiểm tra hết hạn.' : expireHint(node.expireTime)} onChange={value => onNode({ expireTime: value }, 'expireTime')} />
    </Group>

    <Group title="Cảnh báo" defaultOpen={errors > 0} badge={issues.length || undefined}>
      {issues.length === 0 ? <p className="sdui-muted inspector-note">Không có cảnh báo cho node này.</p> : <ul className="inspector-issues">
        {issues.map((issue, index) => <li key={index}><span>{LEVEL_ICON[issue.level]}</span><code>{issue.code}</code>{issue.platforms && <small>{issue.platforms.join(', ')}</small>}<span>{issue.message}</span></li>)}
      </ul>}
    </Group>

    <Group title="Style tools">{styleTools}</Group>
  </aside>
}

const hasContent = (type: string) => ['text', 'tag', 'image', 'button', 'progressBar', 'pageIndicator'].includes(type)
const withKey = (object: Record<string, unknown>, key: string, value: unknown) => {
  const next = { ...object }
  if (value === undefined) delete next[key]
  else next[key] = value
  return next
}
function mergeBorder(border: { width?: number; color?: string } | undefined, patch: { width?: number; color?: string }) {
  const next = withKey(border || {}, Object.keys(patch)[0], Object.values(patch)[0])
  return Object.keys(next).length ? next : undefined
}
function expireHint(value: number | string | undefined) {
  const time = Number(value)
  if (value === undefined || !Number.isFinite(time)) return 'Bỏ trống = không hết hạn. -1 cũng là không hết hạn.'
  if (time === -1) return 'Không hết hạn.'
  return `${new Date(time).toLocaleString()}${time <= Date.now() ? ' — đã hết hạn, child sẽ bị ẩn' : ''}`
}

function Group({ title, defaultOpen = false, badge, children }: { title: string; defaultOpen?: boolean; badge?: number; children: ReactNode }) {
  return <details className="inspector-group" open={defaultOpen || undefined}>
    <summary>{title}{badge !== undefined && <span className="inspector-badge">{badge}</span>}</summary>
    <div className="inspector-group-body">{children}</div>
  </details>
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return <label className="sdui-label inspector-field">{label}{children}
    {error ? <small className="inspector-hint is-error">{error}</small> : hint ? <small className="inspector-hint">{hint}</small> : null}
  </label>
}

function TextField({ label, value, onChange, placeholder, hint, error, multiline }: { label: string; value: string | undefined; onChange: (value: string | undefined) => void; placeholder?: string; hint?: string; error?: string; multiline?: boolean }) {
  const change = (text: string) => onChange(text === '' ? undefined : text)
  return <Field label={label} hint={hint} error={error}>
    {multiline ? <textarea value={value ?? ''} placeholder={placeholder} onChange={event => change(event.target.value)} />
      : <input value={value ?? ''} placeholder={placeholder} onChange={event => change(event.target.value)} />}
  </Field>
}

/** Empty = key removed (not 0). */
function NumberField({ label, value, onChange, placeholder, hint, error, step }: { label: string; value: number | undefined; onChange: (value: number | undefined) => void; placeholder?: string; hint?: string; error?: string; step?: string }) {
  return <Field label={label} hint={hint} error={error}>
    <input type="number" step={step ?? 'any'} value={value ?? ''} placeholder={placeholder ?? 'mặc định'} onChange={event => {
      const text = event.target.value
      if (text === '') return onChange(undefined)
      const number = Number(text)
      if (Number.isFinite(number)) onChange(number)
    }} />
  </Field>
}

/** D8: only #RRGGBB is read the same on both platforms. */
function ColorField({ label, value, onChange, placeholder, hint }: { label: string; value: string | undefined; onChange: (value: string | undefined) => void; placeholder?: string; hint?: string }) {
  const invalid = value !== undefined && !isHex(value)
  return <Field label={label} hint={hint} error={invalid ? 'D8: chỉ dùng #RRGGBB (không alpha, không tên màu).' : undefined}>
    <span className="inspector-color-row">
      <input className="inspector-color" type="color" aria-label={`${label} picker`} value={isHex(value) ? value!.toLowerCase() : '#ffffff'} onChange={event => onChange(event.target.value.toUpperCase())} />
      <input value={value ?? ''} placeholder={placeholder ?? 'không'} onChange={event => onChange(event.target.value === '' ? undefined : event.target.value)} />
    </span>
  </Field>
}

function SelectField({ label, value, options: items, onChange, placeholder, hint }: { label: string; value: string | undefined; options: Option[]; onChange: (value: string | undefined) => void; placeholder: string; hint?: string }) {
  const known = value === undefined || items.some(item => item.value === value)
  return <Field label={label} hint={hint}>
    <select value={value ?? ''} onChange={event => onChange(event.target.value === '' ? undefined : event.target.value)}>
      <option value="">{placeholder}</option>
      {items.map(item => <option key={item.value} value={item.value}>{item.label ?? item.value}</option>)}
      {!known && <option value={value}>{value} (giá trị hiện tại, không có tác dụng)</option>}
    </select>
  </Field>
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="inspector-check"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /> {label}</label>
}

const SIDES = ['top', 'right', 'bottom', 'left'] as const

function SidesField({ label, value, onChange, hint }: { label: string; value: Record<string, number> | undefined; onChange: (value: Record<string, number> | undefined) => void; hint?: string }) {
  const set = (side: string, number: number | undefined) => { const next = withKey(value || {}, side, number) as Record<string, number>; onChange(Object.keys(next).length ? next : undefined) }
  return <div className="sdui-label inspector-field">{label}
    <div className="inspector-sides">{SIDES.map(side => <NumberField key={side} label={side} value={value?.[side]} placeholder="–" onChange={number => set(side, number)} />)}</div>
    {hint && <small className="inspector-hint">{hint}</small>}
  </div>
}

/** spec §4: `all` is the default for undeclared sides; a side wins over `all`. */
function PaddingField({ value, onChange }: { value: Record<string, number> | undefined; onChange: (value: Record<string, number> | undefined) => void }) {
  const [perSide, setPerSide] = useState(() => SIDES.some(side => value?.[side] !== undefined))
  const set = (key: string, number: number | undefined) => { const next = withKey(value || {}, key, number) as Record<string, number>; onChange(Object.keys(next).length ? next : undefined) }
  return <div className="sdui-label inspector-field">
    <span className="inspector-field-head">Padding<label className="inspector-check"><input type="checkbox" checked={perSide} onChange={event => setPerSide(event.target.checked)} /> từng cạnh</label></span>
    <NumberField label="all" value={value?.all} placeholder="0" onChange={number => set('all', number)} />
    {perSide && <div className="inspector-sides">{SIDES.map(side => <NumberField key={side} label={side} value={value?.[side]} placeholder={value?.all !== undefined ? `all (${value.all})` : '0'} onChange={number => set(side, number)} />)}</div>}
  </div>
}

/** JSON object editor: keeps the draft while it is not valid JSON. Empty = key removed. */
function JsonField({ label, value, onChange }: { label: string; value: unknown; onChange: (value: Record<string, unknown> | undefined) => void }) {
  const serialized = value === undefined ? '' : JSON.stringify(value, null, 2)
  const [draft, setDraft] = useState(serialized)
  const [error, setError] = useState('')
  useEffect(() => { setDraft(serialized); setError('') }, [serialized])
  return <Field label={label} error={error || undefined}>
    <textarea className="inspector-json" rows={3} value={draft} placeholder="{ }" onChange={event => {
      const text = event.target.value
      setDraft(text)
      if (!text.trim()) { setError(''); onChange(undefined); return }
      try {
        const parsed = JSON.parse(text)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) { setError('Cần một object JSON { … }.'); return }
        setError(''); onChange(parsed)
      } catch { setError('JSON chưa hợp lệ — chưa lưu.') }
    }} />
  </Field>
}

interface ActionRow { actionType?: string; featureCode?: string; endpoint?: string; params?: Record<string, unknown>; [key: string]: unknown }

/** spec §7: every action needs actionType REDIRECT (featureCode) or CALL_API (endpoint); run in order. */
function ActionsField({ label, value, onChange }: { label: string; value: ActionRow[] | undefined; onChange: (value: ActionRow[] | undefined) => void }) {
  const actions = Array.isArray(value) ? value : []
  const update = (index: number, patch: Partial<ActionRow>) => onChange(actions.map((action, i) => {
    if (i !== index) return action
    const next = { ...action, ...patch }
    for (const key of Object.keys(patch)) if (next[key] === undefined) delete next[key]
    return next
  }))
  return <div className="sdui-label inspector-field">{label}
    {actions.map((action, index) => {
      const kind = typeof action.actionType === 'string' ? action.actionType.toUpperCase() : ''
      return <div key={index} className="inspector-action">
        <div className="inspector-action-head">
          <span>#{index + 1}</span>
          <select value={kind === 'REDIRECT' || kind === 'CALL_API' ? kind : ''} onChange={event => update(index, { actionType: event.target.value || undefined })}>
            <option value="">— chọn actionType —</option><option value="REDIRECT">REDIRECT — mở màn</option><option value="CALL_API">CALL_API — gọi API</option>
          </select>
          <button type="button" className="sdui-quiet" aria-label={`Xoá action ${index + 1}`} onClick={() => onChange(actions.filter((_, i) => i !== index))}>×</button>
        </div>
        {kind !== 'REDIRECT' && kind !== 'CALL_API' && <small className="inspector-hint is-error">Thiếu / sai actionType → action bị bỏ (spec §7).</small>}
        {kind === 'REDIRECT' && <TextField label="featureCode" value={action.featureCode} error={!action.featureCode ? 'Cần featureCode (màn đích).' : undefined} onChange={text => update(index, { featureCode: text })} />}
        {kind === 'CALL_API' && <TextField label="endpoint" value={action.endpoint} error={!action.endpoint ? 'Cần endpoint.' : undefined} onChange={text => update(index, { endpoint: text })} />}
        <JsonField label="params" value={action.params} onChange={params => update(index, { params })} />
      </div>
    })}
    <button type="button" className="inspector-apply-button" onClick={() => onChange([...actions, { actionType: 'REDIRECT', featureCode: '' }])}>+ Thêm action</button>
    {actions.length > 1 && <small className="inspector-hint">Chạy lần lượt; action sau chỉ chạy khi action trước thành công. Android không chờ CALL_API (spec §6.7).</small>}
  </div>
}
