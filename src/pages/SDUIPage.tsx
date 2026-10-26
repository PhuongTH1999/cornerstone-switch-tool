import { buildMiniAppUrl, DEFAULT_MINI_APP_URL } from '../lib/miniAppUrl'
import { resolveExportAssets } from '../lib/exportAssets'
import { copyText } from '../lib/clipboard'
import { resolveSDUIDesignTokens } from '../lib/designTokens'
import { applyDynamicFields, buildDynamicFields, contentPath, duplicateVariables, findDynamicFields, indexesOf, isBindable } from '../lib/dynamicFields'
import { areSiblings, moveNode, moveNodeTo, parentOf } from '../lib/builderTree'
import { allOfType, applyStyleTo, captureStyleTree, sameItemInList, siblingsOf, type StyleTree } from '../lib/builderStyle'
import FigmaMigration from '../components/FigmaMigration'
import SDUIDocumentation from '../components/SDUIDocumentation'
import SDUIPreview from '../renderers/sdui/preview/SDUIPreview'
import { SDUI_TYPES } from '../renderers/sdui/preview/types'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
import '../styles/sdui.scss'
import { useSearchParams } from 'react-router-dom'
import SDUIIcon from '../components/SDUIIcon'
import { createSDUITemplate, deleteSDUITemplate, getSDUITemplate, updateSDUITemplate, useSDUITemplates, templateKey, TEMPLATE_CHANGED_EVENT, type SavedSchema } from '../hooks/useSDUITemplates'
import API_BASE_URL from '../config/api'

interface BuilderNode { source?: any; id: number; type: string; name: string; value?: string; url?: string; title?: string; buttonType?: string; ctaType?: string; iconLeft?: string; iconRight?: string; layout?: string; spacing?: number; padding?: any; radius?: number; bg?: string; width?: number; height?: number; border?: { width?: number; color?: string }; alignment?: string; textAlignment?: string; contentMode?: string; fillMaxWidth?: boolean; fillMaxHeight?: boolean; weight?: number; nativeStyle?: any; nativeProperty?: any; nativeValue?: any; variable?: string; children?: BuilderNode[] }

/** Types whose `value.children` the editor shows as layers (spec §2.2). */
const PARENT_TYPES = ['container', 'box', 'pager']
const TYPE_ICON: Record<string, string> = { container: '▦', text: 'T', image: '▧', button: '▣', tag: '⌑', spacer: '·', box: '⧉', pager: '⇆', pageIndicator: '•', progressBar: '▬' }
const TYPOGRAPHY_OPTIONS = ['', 'headlineDefaultBold', 'headerDefaultBold', 'headerSSemibold', 'headerXsSemibold', 'descriptionDefaultRegular', 'descriptionXsRegular', 'labelSMedium', 'labelXsMedium', 'actionDefaultBold', 'actionSBold', 'actionXsBold']
const ALIGNMENT9_OPTIONS = ['topStart', 'topCenter', 'topEnd', 'centerStart', 'center', 'centerEnd', 'bottomStart', 'bottomCenter', 'bottomEnd']

const initialBuilderTree: BuilderNode = {
  id: 1,
  type: 'container',
  name: 'root',
  layout: 'column',
  spacing: 12,
  padding: 16,
  radius: 12,
  bg: '#FFFFFF',
  children: [
    { id: 2, type: 'container', name: 'content_row', layout: 'row', spacing: 10, children: [
      { id: 3, type: 'image', name: 'hero_image', url: 'https://static.momocdn.net/app/icon/promotion/logo.png', radius: 24 },
      { id: 4, type: 'container', name: 'content_column', layout: 'column', spacing: 4, children: [
        { id: 5, type: 'text', name: 'headline', value: 'Highlands Coffee' },
        { id: 6, type: 'text', name: 'description', value: 'Giảm 50.000đ cho hóa đơn từ 150.000đ' },
      ] },
      { id: 7, type: 'button', name: 'primary_action', title: 'Thu thập' },
    ] },
  ],
}

function unwrapSchema(input: any): any {
  let root = input
  if (root?.dataSchema) {
    const key = Object.keys(root.dataSchema).find((item) => item.startsWith('content'))
    root = key ? root.dataSchema[key]?.value : root
  }
  if (root?.lazy_loads?.[0]?.data?.[0]) root = root.lazy_loads[0].data[0]
  if (root?.type === 'template_widget') root = Array.isArray(root.data) ? root.data[0] : root.data
  if (Array.isArray(root)) root = root[0]
  return root
}

function SchemaTreeNode({ node, selected, onSelect }: { node: BuilderNode; selected: number; onSelect: (id: number) => void }) {
  const description = node.type === 'text' ? node.value : node.type === 'button' ? node.title : node.type === 'image' ? node.url : node.layout
  const dimensions = node.width || node.height ? `${node.width || 'auto'} × ${node.height || 'auto'}` : ''
  return <div className="generated-tree-node">
    <button className={`generated-tree-row ${selected === node.id ? 'selected' : ''}`} onClick={() => onSelect(node.id)}>
      <span className={`generated-tree-type type-${node.type}`}>{TYPE_ICON[node.type] || '·'}</span>
      <span className="generated-tree-label"><strong>{node.name}</strong>{node.variable && <span className="variable-badge">{node.variable}</span>}<small>{node.type}</small></span>
      {description && <code title={description}>{description}</code>}
      {dimensions && <span className="generated-tree-chip">{dimensions}</span>}
      {node.children && <span className="generated-tree-count">{node.children.length}</span>}
    </button>
    {node.children && node.children.length > 0 && <div className="generated-tree-children">{node.children.map(child => <SchemaTreeNode key={child.id} node={child} selected={selected} onSelect={onSelect} />)}</div>}
  </div>
}

const countBuilderNodes = (node: BuilderNode): number => 1 + (node.children || []).reduce((total, child) => total + countBuilderNodes(child), 0)

function normalizeBuilderTree(tree: any): BuilderNode | null {
  const root = unwrapSchema(resolveSDUIDesignTokens(tree))
  if (!root || typeof root !== 'object' || !(SDUI_TYPES as readonly string[]).includes(root.type)) return null
  let nextId = 1
  // Children with an unknown type are kept as-is so their JSON survives a round trip; the preview and lint show they are not drawn.
  const convert = (node: any): BuilderNode => {
    if (!node || typeof node !== 'object') throw new Error('Unsupported component')
    const value = node.value && typeof node.value === 'object' ? node.value : {}
    const id = nextId++
    return { source: node.source || node, id, type: node.type || 'text', name: node.name || node.property?.id || (typeof node.value === 'string' ? node.value : `${node.type || 'component'}_${id}`), value: typeof node.value === 'string' ? node.value : undefined, url: node.url || (node.type === 'image' && typeof node.value === 'string' ? node.value : undefined), title: node.title || value.title || node.property?.title, buttonType: node.buttonType || value.type || node.property?.type, ctaType: node.ctaType || node.property?.ctaType, iconLeft: node.iconLeft || value.iconLeft, iconRight: node.iconRight || value.iconRight, layout: node.layout || node.property?.layout, spacing: node.spacing ?? node.property?.spacing, padding: node.padding ?? node.style?.padding, radius: node.radius ?? node.style?.cornerRadius, bg: node.bg || node.style?.backgroundColor, width: node.width ?? node.style?.width, height: node.height ?? node.style?.height, border: node.border || node.style?.border, alignment: node.alignment || node.property?.alignment, textAlignment: node.textAlignment || node.property?.textAlignment, contentMode: node.contentMode || node.property?.contentMode, fillMaxWidth: node.fillMaxWidth ?? node.style?.fillMaxWidth ?? node.modifier?.fillMaxWidth, fillMaxHeight: node.fillMaxHeight ?? node.style?.fillMaxHeight ?? node.modifier?.fillMaxHeight, weight: node.weight ?? node.modifier?.weight, nativeStyle: node.nativeStyle || node.style || {}, nativeProperty: node.nativeProperty || node.property || {}, nativeValue: node.type === 'progressBar' ? node.nativeValue || value : undefined, children: PARENT_TYPES.includes(node.type) ? (node.children || value.children || []).map(convert) : undefined }
  }
  try { return applyDynamicFields(convert(root), findDynamicFields(tree)).root } catch { return null }
}

function BuilderInspector({ node, onField, onStyle, onProperty, onValue, styleTools, path, duplicateVariable, onCopyPath }: { node: BuilderNode; onField: (key: keyof BuilderNode, value: string) => void; onStyle: (key: string, value: string) => void; onProperty: (key: string, value: string) => void; onValue: (key: string, value: string) => void; styleTools: ReactNode; path: string; duplicateVariable: boolean; onCopyPath: () => void }) {
  const style = node.nativeStyle || {}
  const property = node.nativeProperty || {}
  const input = (label: string, key: keyof BuilderNode, value: string | number = '') => <><label className="sdui-label">{label}<input value={value} onChange={(event) => onField(key, event.target.value)} /></label></>
  const styleInput = (label: string, key: string, value: string | number = '') => <label className="sdui-label">{label}<input value={value} onChange={(event) => onStyle(key, event.target.value)} /></label>
  const propertyInput = (label: string, key: string, value: string | number = '') => <><label className="sdui-label">{label}<input value={value} onChange={(event) => onProperty(key, event.target.value)} /></label></>
  const propertySelect = (label: string, key: string, value: string, options: string[]) => <><label className="sdui-label">{label}<select value={value} onChange={(event) => onProperty(key, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option || 'Default'}</option>)}</select></label></>

  return <aside className="sdui-card figma-inspector-dock"><div className="sdui-card-title">Inspector <span>{node.type.toUpperCase()}</span></div>{styleTools}<div className="sdui-label">Path<div className="inspector-path-row"><code title={path}>{path}</code><button type="button" className="sdui-quiet" onClick={onCopyPath}>Copy</button></div></div>{isBindable(node.type) ? <label className="sdui-label">Variable<input value={node.variable || ''} placeholder="Key BE trả về, vd. giftPrefix" onChange={(event) => onField('variable', event.target.value)} />{duplicateVariable && <small className="inspector-warning">Variable này đang gắn ở node khác — BE chỉ trả một giá trị cho mỗi key.</small>}</label> : <p className="sdui-muted inspector-note">Chỉ text, image, tag, button gắn được variable.</p>}{node.type === 'container' && <><label className="sdui-label">Background color<div className="inspector-color-row"><input className="inspector-color" type="color" value={/^#[0-9a-f]{6}$/i.test(node.bg || style.backgroundColor || '') ? (node.bg || style.backgroundColor) : '#ffffff'} onChange={(event) => onStyle('backgroundColor', event.target.value)} /><input value={node.bg || style.backgroundColor || ''} onChange={(event) => onStyle('backgroundColor', event.target.value)} placeholder="#FFFFFF" /></div></label><label className="sdui-label">Layout<select className="inspector-select" value={node.layout || property.layout || 'column'} onChange={(event) => onField('layout', event.target.value)}><option value="column">Vertical / Column</option><option value="row">Horizontal / Row</option><option value="scrollRow">Horizontal scroll</option><option value="scrollColumn">Vertical scroll</option></select></label>{input('Spacing', 'spacing', node.spacing ?? property.spacing ?? 0)}{input('Padding', 'padding', typeof node.padding === 'number' ? node.padding : node.padding?.all ?? 0)}{input('Width', 'width', node.width ?? style.width ?? '')}{input('Height', 'height', node.height ?? style.height ?? '')}{input('Corner radius', 'radius', node.radius ?? style.cornerRadius ?? 0)}{styleInput('Border color', 'border.color', style.border?.color || '')}{styleInput('Border width', 'border.width', style.border?.width || 0)}{propertySelect('Alignment', 'alignment', node.alignment || property.alignment || '', ['', 'leading', 'center', 'trailing', 'right', 'top', 'bottom', 'end'])}</>}{node.type === 'text' && <>{<label className="sdui-label">Text content<textarea value={node.value || ''} onChange={(event) => onField('value', event.target.value)} /></label>}{propertySelect('Typography', 'typography', property.typography || '', TYPOGRAPHY_OPTIONS)}{propertyInput('Text color', 'color', property.color || '')}{propertyInput('Line limit', 'lineLimit', property.lineLimit || '')}{propertySelect('Text alignment', 'textAlignment', property.textAlignment || '', ['', 'leading', 'center', 'trailing'])}</>}{node.type === 'image' && <>{input('Image URL', 'url', node.url || '')}{propertySelect('Content mode', 'contentMode', node.contentMode || property.contentMode || 'fit', ['fit', 'fill', 'scaleAspectFill'])}{propertyInput('Tint color', 'tintColor', property.tintColor || '')}{propertyInput('Aspect ratio', 'aspectRatio', property.aspectRatio || '')}{input('Width', 'width', node.width ?? style.width ?? '')}{input('Height', 'height', node.height ?? style.height ?? '')}{input('Corner radius', 'radius', node.radius ?? property.cornerRadius ?? style.cornerRadius ?? 0)}</>}{node.type === 'button' && <>{input('Button title', 'title', node.title || '')}<label className="sdui-label">Button type<select value={node.buttonType || 'primary'} onChange={(event) => onField('buttonType', event.target.value)}>{['primary', 'secondary', 'tonal', 'outline', 'danger', 'text', 'disabled'].map(type => <option key={type} value={type}>{type}</option>)}</select></label>{propertySelect('CTA type', 'ctaType', node.ctaType || property.ctaType || 'BUTTON', ['BUTTON', 'TOGGLE', 'ICON'])}{propertyInput('Button color', 'color', property.color || '')}{input('Left icon URL', 'iconLeft', node.iconLeft || '')}{input('Right icon URL', 'iconRight', node.iconRight || '')}{propertyInput('Action type', 'actionType', property.actionType || '')}{propertyInput('Feature code', 'actions.0.featureCode', property.actions?.[0]?.featureCode || '')}</>}{node.type === 'tag' && <>{input('Tag value', 'value', node.value || '')}{propertySelect('Tag type', 'tagType', property.tagType || '', ['', 'info', 'success', 'error', 'warning', 'highlight'])}{propertyInput('Tag background', 'backgroundColor', property.backgroundColor || '')}{propertyInput('Tag text color', 'textColor', property.textColor || '')}{propertyInput('Icon URL', 'iconUrl', property.iconUrl || '')}</>}{node.type === 'spacer' && propertyInput('Minimum length', 'minLength', property.minLength || 0)}{(node.type === 'box' || node.type === 'pager') && <>{input('Width', 'width', node.width ?? style.width ?? '')}{input('Height', 'height', node.height ?? style.height ?? '')}{input('Corner radius', 'radius', node.radius ?? style.cornerRadius ?? 0)}</>}{node.type === 'box' && propertySelect('Content alignment', 'contentAlignment', property.contentAlignment || 'topStart', ALIGNMENT9_OPTIONS)}{node.type === 'pager' && <>{propertySelect('Show indicator', 'showIndicator', String(property.showIndicator ?? true), ['true', 'false'])}{propertySelect('Indicator alignment', 'alignmentIndicator', property.alignmentIndicator || 'bottomCenter', ALIGNMENT9_OPTIONS)}{propertyInput('Active color', 'activeColor', property.activeColor || '')}{propertyInput('Inactive color', 'inactiveColor', property.inactiveColor || '')}{propertyInput('Indicator background', 'indicatorBackgroundColor', property.indicatorBackgroundColor || '')}</>}{node.type === 'pageIndicator' && <>{propertyInput('Total', 'total', property.total ?? 0)}{propertyInput('Active index', 'activeIndex', property.activeIndex ?? 0)}{propertyInput('Active color', 'activeColor', property.activeColor || '')}{propertyInput('Inactive color', 'inactiveColor', property.inactiveColor || '')}</>}{node.type === 'progressBar' && <>{(['currentValue', 'maxValue', 'subDes1', 'subDes2'] as const).map(key => <label key={key} className="sdui-label">{key}<input value={node.nativeValue?.[key] ?? ''} onChange={(event) => onValue(key, event.target.value)} /></label>)}{propertyInput('Bar color', 'color', property.color || '')}{propertyInput('Bar height', 'barHeight', property.barHeight ?? '')}{propertyInput('Bar width', 'barWidth', property.barWidth ?? '')}</>}</aside>
}

export default function SDUIPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'templates' | 'document' | 'migration'>('templates')
  const [status, setStatus] = useState('')
  const [schemaName, setSchemaName] = useState('Untitled schema')
  const [editingSchema, setEditingSchema] = useState<SavedSchema | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [baseline, setBaseline] = useState('')
  const savingRef = useRef(false)
  const [builderRoot, setBuilderRoot] = useState<BuilderNode>(initialBuilderTree)
  const [selectedNode, setSelectedNode] = useState(1)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1, 2, 4]))
  const [builderJsonInput, setBuilderJsonInput] = useState('')
  const [nativePreviewJson, setNativePreviewJson] = useState<any[] | null>(null)
  const { savedSchemas, setSavedSchemas, cloudStatus, error: libraryError, refresh } = useSDUITemplates()
  const [searchParams] = useSearchParams()
  const openedTemplate = useRef<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importName, setImportName] = useState('')
  const [importJson, setImportJson] = useState('')
  const [importError, setImportError] = useState('')
  const [outputView, setOutputView] = useState<'tree' | 'json'>('tree')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showQr, setShowQr] = useState(false)
  const [qrGenerating, setQrGenerating] = useState(false)
  const [styleClipboard, setStyleClipboard] = useState<{ tree: StyleTree; from: string } | null>(null)
  const [styleDeep, setStyleDeep] = useState(true)
  const draggedLayer = useRef<number | null>(null)
  const [dropHint, setDropHint] = useState<{ id: number; place: 'before' | 'after' } | null>(null)
  const [miniAppBaseUrl, setMiniAppBaseUrl] = useState(() => import.meta.env.VITE_MINIAPP_URL || DEFAULT_MINI_APP_URL)

  const [copyFeedback, setCopyFeedback] = useState('')
  useEffect(() => {
    if (!copyFeedback) return
    const timer = window.setTimeout(() => setCopyFeedback(''), 4000)
    return () => window.clearTimeout(timer)
  }, [copyFeedback])
  const copy = async (value: string, label: string) => {
    try { await copyText(value); setStatus(label); setCopyFeedback('Đã sao chép!') }
    catch { const message = 'Không thể sao chép. Hãy dùng Download để tải JSON.'; setStatus(message); setCopyFeedback(message) }
  }
  const download = (value: string, name: string) => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([value], { type: 'application/json' }))
    link.download = name; link.click(); URL.revokeObjectURL(link.href)
    setStatus('JSON downloaded')
  }
  const findBuilderNode = (node: BuilderNode, id: number): BuilderNode | null => node.id === id ? node : (node.children || []).reduce<BuilderNode | null>((found, child) => found || findBuilderNode(child, id), null)
  const updateBuilderTree = (node: BuilderNode, id: number, update: (target: BuilderNode) => BuilderNode): BuilderNode => node.id === id ? update(node) : { ...node, children: node.children?.map((child) => updateBuilderTree(child, id, update)) }
  const toSchemaNode = (node: BuilderNode, withRef = false): any => ({ ...(node.source || {}), ...(withRef ? { __ref: node.id } : {}), type: node.type, style: { ...(node.nativeStyle || {}), ...(node.bg ? { backgroundColor: node.bg } : {}), ...(node.padding != null ? { padding: typeof node.padding === 'number' ? { all: node.padding } : node.padding } : {}), ...(node.radius != null ? { cornerRadius: node.radius } : {}), ...(node.width != null ? { width: node.width } : {}), ...(node.height != null ? { height: node.height } : {}), ...(node.border ? { border: node.border } : {}), ...(node.fillMaxWidth ? { fillMaxWidth: true } : {}), ...(node.fillMaxHeight ? { fillMaxHeight: true } : {}) }, property: { ...(node.nativeProperty || {}), ...(node.layout ? { layout: node.layout } : {}), ...(node.spacing != null ? { spacing: node.spacing } : {}), ...(node.alignment ? { alignment: node.alignment } : {}), ...(node.textAlignment ? { textAlignment: node.textAlignment } : {}), ...(node.contentMode ? { contentMode: node.contentMode } : {}), ...(node.type === 'button' ? { type: undefined, ctaType: node.ctaType || node.nativeProperty?.ctaType || 'BUTTON' } : {}), id: node.name }, ...(node.source?.modifier || node.weight != null ? { modifier: { ...(node.source?.modifier || {}), ...(node.weight != null ? { weight: node.weight } : {}) } } : {}), value: PARENT_TYPES.includes(node.type) ? { ...(node.source?.value && typeof node.source.value === 'object' ? node.source.value : {}), children: (node.children || []).map(child => toSchemaNode(child, withRef)) } : node.type === 'image' ? node.url || '' : node.type === 'button' ? { ...(node.source?.value && typeof node.source.value === 'object' ? node.source.value : {}), title: node.title || 'Button', type: node.buttonType || 'primary', ...(node.iconLeft ? { iconLeft: node.iconLeft } : {}), ...(node.iconRight ? { iconRight: node.iconRight } : {}) } : node.type === 'progressBar' ? node.nativeValue || node.source?.value || {} : (SDUI_TYPES as readonly string[]).includes(node.type) ? node.value || '' : node.source?.value })
  // Content nodes bound to a BE data key; the path points into this exported JSON.
  const dynamicFields = buildDynamicFields(builderRoot)
  const generatedSchema = resolveExportAssets({ type: 'template_widget', templateType: 'SDUI_WIDGET', data: [toSchemaNode(builderRoot)], ...(dynamicFields.length ? { dynamic_fields: dynamicFields } : {}) }, import.meta.env.VITE_PUBLIC_ASSET_URL || window.location.origin)
  const builderSchema = JSON.stringify(generatedSchema, null, 2)
  // Same JSON as the export, plus `__ref` so a click in the preview selects the layer.
  const previewSchema = resolveExportAssets({ type: 'template_widget', templateType: 'SDUI_WIDGET', data: [toSchemaNode(builderRoot, true)] }, import.meta.env.VITE_PUBLIC_ASSET_URL || window.location.origin)
  const templateJsonUrl = editingSchema?.id
    ? new URL(`${API_BASE_URL.replace(/\/+$/, '')}/cornerstone-package/sdui/templates/${encodeURIComponent(editingSchema.id)}/json`, window.location.origin).href
    : ''
  const miniAppUrl = editingSchema?.id && miniAppBaseUrl.trim()
    ? (() => { try { return buildMiniAppUrl(miniAppBaseUrl, editingSchema.id) } catch { return '' } })()
    : ''
  const generateQr = async () => {
    if (!editingSchema?.id) { setStatus('Save this template before generating its QR code.'); return }
    if (dirty) { setStatus('Save your changes first so the QR opens the latest JSON.'); return }
    if (!miniAppBaseUrl.trim()) { setQrDataUrl(''); setShowQr(true); setStatus('Nhập Mini App URL để tạo QR.'); return }
    setQrGenerating(true)
    try {
      const targetUrl = buildMiniAppUrl(miniAppBaseUrl, editingSchema.id)
      const { default: QRCode } = await import('qrcode')
      setQrDataUrl(await QRCode.toDataURL(targetUrl, { width: 420, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#111827', light: '#FFFFFF' } }))
      localStorage.setItem('cornerstone_miniapp_url', miniAppBaseUrl.trim())
      setShowQr(true)
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not generate QR code.') }
    finally { setQrGenerating(false) }
  }
  const downloadQr = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `${schemaName.trim().replace(/[^a-z0-9_-]+/gi, '-') || 'sdui-template'}-qr.png`
    link.click()
  }
  const copyBuilderSchema = () => { void copy(builderSchema, 'Builder JSON copied') }
  const importBuilder = () => {
    try { const parsed = JSON.parse(builderJsonInput); const imported = normalizeBuilderTree(parsed); if (!imported) throw new Error('invalid'); setNativePreviewJson(Array.isArray(parsed) ? parsed : [parsed]); setBuilderRoot(imported); setSelectedNode(imported.id); setExpandedNodes(new Set([imported.id])); setStatus('Builder imported and preview updated') } catch { setStatus('Builder import expects a valid SDUI tree') }
  }
  const importBuilderFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBuilderJsonInput(String(reader.result))
    reader.onerror = () => setStatus('Could not read this file. Please try another JSON file.')
    reader.readAsText(file)
    event.target.value = ''
  }
  const loadSavedSchema = async (saved: SavedSchema) => {
    if (savingRef.current || !canReplaceDraft()) return
    if (!saved.id) { setStatus('Template ID is missing. Refresh the library and try again.'); return }
    setStatus(`Loading ${saved.name}…`)
    let complete: SavedSchema
    try { complete = await getSDUITemplate(saved.id) }
    catch (error) { setStatus(error instanceof Error ? error.message : `Cannot load ${saved.name}`); return }
    const imported = normalizeBuilderTree(complete.tree)
    if (!imported) { setStatus(`Cannot render ${complete.name}: invalid SDUI JSON`); return }
    setBuilderRoot(imported)
    setNativePreviewJson(Array.isArray(complete.tree) ? complete.tree : [complete.tree])
    setSelectedNode(imported.id)
    setExpandedNodes(new Set([imported.id]))
    setEditingSchema(complete)
    setSchemaName(complete.name)
    setBuilderJsonInput('')
    setBaseline(JSON.stringify({ name: complete.name, tree: imported }))
    setActiveTab('builder')
    setStatus(`Loaded ${complete.name}`)
  }
  const downloadNativeMockData = () => {
    const payload = nativePreviewJson || [JSON.parse(builderSchema)]
    download(JSON.stringify(payload, null, 2), 'MockData.json')
    setStatus('Native MockData.json downloaded')
  }
  const selectedBuilderNode = findBuilderNode(builderRoot, selectedNode) || builderRoot
  const addBuilderChild = (parentId: number, type: string) => {
    if (!PARENT_TYPES.includes(findBuilderNode(builderRoot, parentId)?.type || '')) return
    const defaults: Record<string, Partial<BuilderNode>> = {
      container: { layout: 'column', spacing: 0 }, text: { value: 'New text' }, tag: { value: 'Tag', nativeProperty: { tagType: 'info' } },
      image: { width: 48, height: 48 }, button: { title: 'Button', buttonType: 'primary', ctaType: 'BUTTON', nativeProperty: { ctaType: 'BUTTON' } },
      spacer: { nativeProperty: { minLength: 0 } }, box: { nativeProperty: { contentAlignment: 'topStart' } },
      pager: { height: 120, nativeProperty: { showIndicator: true } }, pageIndicator: { nativeProperty: { total: 3, activeIndex: 0 } },
      progressBar: { nativeValue: { currentValue: 30, maxValue: 100, subDes1: '', subDes2: '' } },
    }
    const child: BuilderNode = { id: Date.now(), type, name: `${type}_${Date.now().toString().slice(-4)}`, nativeProperty: {}, ...defaults[type], children: PARENT_TYPES.includes(type) ? [] : undefined }
    setBuilderRoot((current) => updateBuilderTree(current, parentId, (node) => ({ ...node, children: [...(node.children || []), child] })))
    setNativePreviewJson(null)
    setSelectedNode(child.id)
    setExpandedNodes((current) => new Set(current).add(parentId))
  }
  const removeBuilderNode = (id: number) => {
    if (id === builderRoot.id) return
    const remove = (node: BuilderNode): BuilderNode => ({ ...node, children: node.children?.filter((child) => child.id !== id).map(remove) })
    setBuilderRoot((current) => remove(current))
    setNativePreviewJson(null)
    setSelectedNode(builderRoot.id)
  }
  const setBuilderField = (key: keyof BuilderNode, value: string) => { setNativePreviewJson(null); setBuilderRoot((current) => updateBuilderTree(current, selectedNode, (node) => ({ ...node, [key]: ['spacing', 'padding', 'radius', 'width', 'height'].includes(key) ? Number(value) || 0 : value }))) }
  const setBuilderNested = (rootKey: 'nativeStyle' | 'nativeProperty' | 'nativeValue', path: string, value: string) => {
    setNativePreviewJson(null)
    setBuilderRoot((current) => updateBuilderTree(current, selectedNode, (node) => {
      const nextRoot = { ...(node[rootKey] || {}) }
      const keys = path.split('.')
      if (path.startsWith('actions.') && !nextRoot.actions) nextRoot.actions = [{}]
      let target = nextRoot
      keys.slice(0, -1).forEach((key) => { target[key] = Array.isArray(target[key]) ? [...target[key]] : { ...(target[key] || {}) }; target = target[key] })
      const lastKey = keys[keys.length - 1]
      // An emptied field removes the key: a '' left in a number field makes iOS drop the node (spec §2).
      if (value === '') delete target[lastKey]
      else if (path === 'showIndicator') target[lastKey] = value !== 'false'
      else target[lastKey] = /^(-?\d+(\.\d+)?)$/.test(value) && !/^subDes/.test(path) ? Number(value) : value
      const nextNode = { ...node, [rootKey]: nextRoot }
      if (rootKey === 'nativeProperty' && path === 'type') nextNode.buttonType = value
      if (rootKey === 'nativeProperty' && path === 'alignment') nextNode.alignment = value
      if (rootKey === 'nativeProperty' && path === 'contentMode') nextNode.contentMode = value
      if (rootKey === 'nativeStyle' && path === 'backgroundColor') nextNode.bg = value
      if (rootKey === 'nativeStyle' && path === 'cornerRadius') nextNode.radius = Number(value) || 0
      return nextNode
    }))
  }
  const setBuilderStyle = (key: string, value: string) => setBuilderNested('nativeStyle', key, value)
  const setBuilderProperty = (key: string, value: string) => setBuilderNested('nativeProperty', key, value)
  const setBuilderValue = (key: string, value: string) => setBuilderNested('nativeValue', key, value)
  const selectedPath = contentPath(selectedBuilderNode.type, indexesOf(builderRoot, selectedBuilderNode) ?? [])
  const pasteStyleOnto = (targets: BuilderNode[], tree: StyleTree, label: string, deep: boolean) => {
    if (!targets.length) return
    const result = applyStyleTo(builderRoot, new Set(targets.map(target => target.id)), tree, deep)
    setNativePreviewJson(null)
    setBuilderRoot(result.root)
    const crossType = targets.some(target => target.type !== tree.style.type)
    setStatus(`Style pasted to ${targets.length} ${label}`
      + (deep && result.inside ? ` + ${result.inside} items inside` : '')
      + (deep && result.skipped ? ` (${result.skipped} inside items skipped: structure differs)` : '')
      + (crossType ? ` (other type: only style was pasted, not ${tree.style.type} properties)` : '') + '.')
  }
  const styleTargets = {
    siblings: siblingsOf(builderRoot, selectedNode),
    list: sameItemInList(builderRoot, selectedNode),
    all: allOfType(builderRoot, selectedBuilderNode.type, selectedNode),
  }
  const styleTools = <div className="inspector-style-tools" aria-label="Style">
    <div className="inspector-style-row">
      <button className="inspector-apply-button" onClick={() => { setStyleClipboard({ tree: captureStyleTree(selectedBuilderNode), from: selectedBuilderNode.name }); setStatus(`Copied style of ${selectedBuilderNode.name}.`) }}>Copy style</button>
      <button className="inspector-apply-button" disabled={!styleClipboard} title={styleClipboard ? `From ${styleClipboard.from} (${styleClipboard.tree.style.type})` : 'Copy a style first'} onClick={() => styleClipboard && pasteStyleOnto([selectedBuilderNode], styleClipboard.tree, selectedBuilderNode.name, styleDeep)}>Paste style</button>
    </div>
    {styleClipboard && <small className="sdui-muted">Clipboard: {styleClipboard.from} · {styleClipboard.tree.style.type}</small>}
    {!!selectedBuilderNode.children?.length && <label className="inspector-style-deep" title="Also copy the style of every item inside, matched by position"><input type="checkbox" checked={styleDeep} onChange={event => setStyleDeep(event.target.checked)} /> Include items inside</label>}
    <button className="inspector-apply-button" disabled={!styleTargets.list.length} title="Same position inside the other entries of the list (e.g. the title of every card)" onClick={() => pasteStyleOnto(styleTargets.list, captureStyleTree(selectedBuilderNode), 'items in the list', styleDeep)}>Apply to same item in list ({styleTargets.list.length})</button>
    <button className="inspector-apply-button" disabled={!styleTargets.siblings.length} title={`Other ${selectedBuilderNode.type}s in the same parent`} onClick={() => pasteStyleOnto(styleTargets.siblings, captureStyleTree(selectedBuilderNode), 'siblings', styleDeep)}>Apply to siblings ({styleTargets.siblings.length})</button>
    <button className="inspector-apply-button" disabled={!styleTargets.all.length} title="Only the node's own style — items inside are not copied here" onClick={() => pasteStyleOnto(styleTargets.all, captureStyleTree(selectedBuilderNode), `${selectedBuilderNode.type}s`, false)}>Apply to all {selectedBuilderNode.type}s ({styleTargets.all.length})</button>
  </div>
  const selectBuilderNode = (id: number) => { setSelectedNode(id); requestAnimationFrame(() => document.querySelector(`[data-tree-node-id="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })) }
  // Reordering only swaps siblings; dynamic field paths follow automatically because they are computed from positions.
  const reorderLayers = (next: BuilderNode, label: string) => {
    if (next === builderRoot) return
    setNativePreviewJson(null); setBuilderRoot(next); setStatus(label)
  }
  const moveLayer = (id: number, delta: -1 | 1) => reorderLayers(moveNode(builderRoot, id, delta), delta < 0 ? 'Layer moved up.' : 'Layer moved down.')
  const layerDragProps = (node: BuilderNode) => node.id === builderRoot.id ? {} : {
    draggable: true,
    onDragStart: (event: DragEvent<HTMLDivElement>) => { draggedLayer.current = node.id; event.dataTransfer.effectAllowed = 'move' },
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      const dragged = draggedLayer.current
      if (dragged === null || dragged === node.id || !areSiblings(builderRoot, dragged, node.id)) return
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()
      const place = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
      if (dropHint?.id !== node.id || dropHint.place !== place) setDropHint({ id: node.id, place })
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const dragged = draggedLayer.current
      if (dragged !== null && dropHint) reorderLayers(moveNodeTo(builderRoot, dragged, node.id, dropHint.place), 'Layer moved.')
      draggedLayer.current = null; setDropHint(null)
    },
    onDragEnd: () => { draggedLayer.current = null; setDropHint(null) },
  }
  const renderBuilderTree = (node: BuilderNode, depth = 0): ReactNode => {
    const position = parentOf(builderRoot, node.id)
    const lastIndex = (position?.parent.children?.length ?? 1) - 1
    const hint = dropHint?.id === node.id ? ` drop-${dropHint.place}` : ''
    return <div key={node.id} className="figma-tree-branch"><div data-tree-node-id={node.id} className={`figma-tree-row ${selectedNode === node.id ? 'selected' : ''}${hint}`} style={{ paddingLeft: `${10 + depth * 18}px` }} onClick={() => selectBuilderNode(node.id)} {...layerDragProps(node)}><button className="figma-tree-chevron" onClick={(event) => { event.stopPropagation(); setExpandedNodes((current) => { const next = new Set(current); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next }) }}>{node.children?.length ? (expandedNodes.has(node.id) ? '▾' : '▸') : '·'}</button><span className={`figma-tree-icon type-${node.type}`}>{TYPE_ICON[node.type] || '·'}</span><strong>{node.name}</strong>{node.variable && <span className="variable-badge">{node.variable}</span>}<small>{node.type}</small>{position && <><button className="figma-tree-move" title="Move up" aria-label="Move layer up" disabled={position.index === 0} onClick={(event) => { event.stopPropagation(); moveLayer(node.id, -1) }}>↑</button><button className="figma-tree-move" title="Move down" aria-label="Move layer down" disabled={position.index === lastIndex} onClick={(event) => { event.stopPropagation(); moveLayer(node.id, 1) }}>↓</button></>}{node.id !== builderRoot.id && <button className="figma-tree-delete" onClick={(event) => { event.stopPropagation(); removeBuilderNode(node.id) }}>×</button>}</div>{expandedNodes.has(node.id) && node.children?.map((child) => renderBuilderTree(child, depth + 1))}</div>
  }

  const draft = JSON.stringify({ name: schemaName, tree: builderRoot })
  const dirty = baseline ? draft !== baseline : true
  const canReplaceDraft = () => (!baseline && activeTab === 'templates' && schemaName === 'Untitled schema' && builderRoot === initialBuilderTree) || !dirty || window.confirm('Discard unsaved changes and open another schema?')
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty && activeTab === 'builder') event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, activeTab])
  useEffect(() => {
    if (!showQr) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowQr(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [showQr])
  const newSchema = () => {
    if (savingRef.current || !canReplaceDraft()) return
    setBuilderRoot(structuredClone(initialBuilderTree)); setSchemaName('Untitled schema')
    setEditingSchema(null); setBaseline(''); setNativePreviewJson(null)
    setSelectedNode(1); setExpandedNodes(new Set([1, 2, 4])); setBuilderJsonInput('')
    setStatus(''); setActiveTab('builder')
  }
  const saveSchema = async (asCopy = false) => {
    if (savingRef.current || !schemaName.trim()) return
    savingRef.current = true; setSaving(true); setStatus('Saving…')
    const name = schemaName.trim()
    const renderedJson = JSON.parse(builderSchema)
    try {
      const id = !asCopy ? editingSchema?.id : undefined
      const item = id
        ? await updateSDUITemplate(id, name, renderedJson)
        : await createSDUITemplate(name, renderedJson)
      if (!item.id) throw new Error('The API did not return a template ID.')
      item.tree = renderedJson
      item.ts = item.ts || Date.now()
      const next = [item, ...savedSchemas.filter(row => asCopy || !editingSchema || (editingSchema.id ? row.id !== editingSchema.id : row !== editingSchema))]
      setSavedSchemas(next); window.dispatchEvent(new Event(TEMPLATE_CHANGED_EVENT)); setEditingSchema(item); setSchemaName(item.name)
      setBaseline(JSON.stringify({ name: item.name, tree: builderRoot }))
      setStatus(id ? 'Template updated.' : 'Template created.')
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not save. Please retry.') }
    finally { savingRef.current = false; setSaving(false) }
  }

  const removeTemplate = async (saved: SavedSchema) => {
    if (!saved.id || savingRef.current || !window.confirm(`Delete “${saved.name}”? This cannot be undone.`)) return
    savingRef.current = true; setSaving(true); setStatus(`Deleting ${saved.name}…`)
    try {
      await deleteSDUITemplate(saved.id)
      setSavedSchemas(current => current.filter(item => item.id !== saved.id))
      if (editingSchema?.id === saved.id) {
        setEditingSchema(null); setBaseline(''); setSchemaName('Untitled schema')
        setBuilderRoot(structuredClone(initialBuilderTree)); setActiveTab('templates')
      }
      window.dispatchEvent(new Event(TEMPLATE_CHANGED_EVENT))
      setStatus(`Deleted ${saved.name}.`)
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not delete template.') }
    finally { savingRef.current = false; setSaving(false) }
  }
  const templateId = searchParams.get('template')
  useEffect(() => {
    if (!templateId || openedTemplate.current === templateId || cloudStatus === 'loading') return
    openedTemplate.current = templateId
    const saved = savedSchemas.find(item => templateKey(item) === templateId)
    if (saved) void loadSavedSchema(saved)
    else setStatus('This template is no longer available in the library.')
  }, [templateId, savedSchemas, cloudStatus])

  const importTemplate = () => {
    setImportError('')
    if (!importName.trim()) { setImportError('Enter a template name.'); return }
    try {
      const parsed = JSON.parse(importJson)
      const tree = normalizeBuilderTree(parsed)
      if (!tree) throw new Error('Use a valid component tree, template_widget or dataSchema.')
      if (!canReplaceDraft()) return
      setBuilderRoot(tree); setSchemaName(importName.trim()); setEditingSchema(null)
      setBaseline(''); setNativePreviewJson(Array.isArray(parsed) ? parsed : [parsed])
      setSelectedNode(tree.id); setExpandedNodes(new Set([tree.id])); setBuilderJsonInput('')
      setActiveTab('builder'); setShowImport(false)
      setStatus('Template imported. Review the preview, then Save schema to add it to SDUI Templates on Home.')
    } catch (error) { setImportError(error instanceof SyntaxError ? 'Invalid JSON. Check the syntax and try again.' : error instanceof Error ? error.message : 'Could not import schema.') }
  }
  const readImportFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setImportJson(String(reader.result)); setImportName(current => current || file.name.replace(/\.json$/i, '')); setImportError('') }
    reader.onerror = () => setImportError('Could not read this file.')
    reader.readAsText(file); event.target.value = ''
  }

  return (
    <main className="sdui-page">
      <header className="sdui-header">
        <div><a className="sdui-kicker" href="/">← Cornerstone</a><h1>Server-driven UI</h1><p>Create, edit and manage your native UI schemas.</p></div>
        <div className="sdui-pills"><span className="sdui-pill">{cloudStatus === 'connected' ? 'Templates API connected' : cloudStatus === 'loading' ? 'Loading API…' : 'Templates API unavailable'}</span><span className="sdui-pill sdui-pill-muted">{savedSchemas.length} schemas</span></div>
      </header>
      <nav className="sdui-tabs" aria-label="SDUI workspace">
        <button className={activeTab === 'templates' ? 'active' : ''} onClick={() => setActiveTab('templates')}>Schema library</button>
        <button className={activeTab === 'builder' ? 'active' : ''} onClick={() => setActiveTab('builder')}>Editor {dirty && baseline ? '•' : ''}</button>
        <button className={activeTab === 'document' ? 'active' : ''} onClick={() => setActiveTab('document')}>Document</button>
        <button className={activeTab === 'migration' ? 'active' : ''} onClick={() => setActiveTab('migration')}>Figma migration</button>
      </nav>
      {activeTab === 'migration' && <FigmaMigration onImport={result => {
        const tree = normalizeBuilderTree(result.template)
        if (!tree || !canReplaceDraft()) return
        setBuilderRoot(tree); setSchemaName(result.name); setEditingSchema(null); setBaseline('')
        setNativePreviewJson([result.template]); setSelectedNode(tree.id); setExpandedNodes(new Set([tree.id]))
        setBuilderJsonInput(''); setActiveTab('builder')
        setStatus(`Figma migrated. ${result.warnings.length} warnings reviewed. Check preview before saving.`)
      }} />}
      {activeTab === 'document' && <SDUIDocumentation />}
      {status && <div className="sdui-feedback" role="status" aria-live="polite">{status}</div>}
      {activeTab === 'templates' && <section className="sdui-card sdui-wide-card">
        <div className="sdui-library-heading"><div><h2>SDUI Templates</h2><p className="sdui-muted">The same template library is available on Home. Open a template to edit it.</p></div><div className="sdui-library-actions"><button className="sdui-quiet" onClick={() => { setShowImport(!showImport); setImportError('') }}><SDUIIcon kind="import" /> Import schema</button><button className="sdui-primary" onClick={newSchema}><SDUIIcon kind="plus" /> Create template</button></div></div>
        {showImport && <form className="sdui-import-panel" onSubmit={event => { event.preventDefault(); importTemplate() }}>
          <h3>Import a template</h3><p className="sdui-muted">Give your template a name, then upload a JSON file or paste its schema.</p>
          <label className="sdui-label">Template name<input autoFocus required value={importName} onChange={event => setImportName(event.target.value)} placeholder="e.g. Promotion summer" /></label>
          <label className="sdui-label">JSON file<input type="file" accept=".json,application/json" onChange={readImportFile} /></label>
          <label className="sdui-label">Schema JSON<textarea required value={importJson} onChange={event => setImportJson(event.target.value)} placeholder='{"type": "container", "children": []}' /></label>
          {importError && <p role="alert" className="sdui-import-error">{importError}</p>}
          <div className="sdui-library-actions"><button type="button" className="sdui-quiet" onClick={() => setShowImport(false)}>Cancel</button><button className="sdui-primary" type="submit">Import & preview</button></div>
        </form>}
        <label className="sdui-label">Search schemas<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name…" /></label>
        {cloudStatus === 'error' && <div className="sdui-api-error" role="alert"><span>{libraryError || 'Could not load templates from the API.'}</span><button className="sdui-quiet" onClick={() => void refresh()}>Retry</button></div>}
        <div className="sdui-template-grid">{savedSchemas.filter(saved => saved.name.toLowerCase().includes(search.toLowerCase())).map((saved, index) => <article key={saved.id || index} className="sdui-template saved-template"><span className="sdui-template-icon"><SDUIIcon name={saved.name} /></span><strong>{saved.name}</strong><small>{saved.ts ? new Date(saved.ts).toLocaleDateString() : 'Saved schema'}</small><div className="sdui-template-actions"><button onClick={() => void loadSavedSchema(saved)}><SDUIIcon kind="edit" /> Edit</button><button className="danger" onClick={() => void removeTemplate(saved)}>Delete</button></div></article>)}</div>
        {cloudStatus === 'loading' ? <p className="sdui-empty">Loading schemas…</p> : cloudStatus !== 'error' && savedSchemas.length === 0 ? <div className="sdui-empty"><h3>Create your first schema</h3><p>Start with the sample layout, or import your existing JSON in the editor.</p></div> : !savedSchemas.some(saved => saved.name.toLowerCase().includes(search.toLowerCase())) && <p className="sdui-empty">No schemas match “{search}”.</p>}
      </section>}
      {activeTab === 'builder' && <>
        <section className="sdui-editor-toolbar">
          <label className="sdui-label">Template name<input disabled={saving} value={schemaName} onChange={event => setSchemaName(event.target.value)} placeholder="Enter a schema name" /></label>
          <span className="sdui-muted">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
          <button className="sdui-quiet" disabled={saving || !schemaName.trim() || cloudStatus === 'loading'} onClick={() => saveSchema(true)}>Save as copy</button>
          <button className="sdui-primary" disabled={saving || !schemaName.trim() || !dirty || cloudStatus === 'loading'} onClick={() => saveSchema()}>{saving ? 'Saving…' : editingSchema ? 'Save changes' : 'Save schema'}</button>
        </section>
        <fieldset className="sdui-builder-workspace" disabled={saving}>
          <section className="sdui-card figma-tree-panel"><div className="sdui-card-title">Layers <span>SELECT TO EDIT</span></div>
            <details className="sdui-import"><summary>Import JSON</summary><label className="builder-json-label">Paste schema<textarea className="builder-json-input" value={builderJsonInput} onChange={event => setBuilderJsonInput(event.target.value)} placeholder="Paste component tree or template_widget JSON…" /></label><label className="sdui-quiet file-button">Choose JSON file<input hidden type="file" accept=".json,application/json" onChange={importBuilderFile} /></label><button disabled={!builderJsonInput.trim()} className="sdui-primary builder-import-button" onClick={importBuilder}>Apply JSON</button></details>
            <div className="figma-tree">{renderBuilderTree(builderRoot)}</div>
            <div className="figma-add-row"><select id="builder-type" aria-label="Component type" defaultValue="text">{SDUI_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select><button className="sdui-primary" disabled={!PARENT_TYPES.includes(selectedBuilderNode.type)} onClick={() => addBuilderChild(selectedNode, (document.getElementById('builder-type') as HTMLSelectElement).value)}>+ Add</button></div><p className="sdui-muted">Select a container, box or pager to add a component inside it.</p>
          </section>
          <div className="sdui-editor-main">
            <section className="sdui-card figma-canvas-panel">
              <div className="sdui-card-title">Preview <span>ANDROID · IOS</span></div>
              <SDUIPreview input={previewSchema} selectedRef={String(selectedNode)} onSelect={ref => selectBuilderNode(Number(ref))} />
              <p className="native-preview-hint">“Chọn node” để sửa thuộc tính; “Bấm thử” để chạy onTap / button giả lập. Preview vẽ đúng JSON được export, theo docs/sdui/sdui-preview.md.</p>
            </section>
            <section className="sdui-card sdui-generated-panel">
              <div className="sdui-generated-header"><div><div className="sdui-card-title">Generated schema <span>LIVE OUTPUT</span></div><p className="sdui-muted">Inspector changes are serialized here before saving.</p></div><div className="preview-actions"><button type="button" className="sdui-quiet" onClick={copyBuilderSchema}>Copy</button><button className="sdui-quiet" onClick={() => download(builderSchema, 'sdui-schema.json')}>Download</button><button className="sdui-quiet" disabled={!editingSchema?.id || dirty || qrGenerating} title={!editingSchema?.id ? 'Save the template first' : dirty ? 'Save changes before generating QR' : 'Generate QR to open Mini App'} onClick={() => void generateQr()}>{qrGenerating ? 'Generating…' : 'Mini App QR'}</button><button className="sdui-native-export" onClick={downloadNativeMockData}>Export Native</button></div></div>
              {copyFeedback && <p role="status" aria-live="polite" className="sdui-copy-feedback">{copyFeedback}</p>}
              <div className="sdui-output-tabs" role="tablist" aria-label="Generated schema format"><button role="tab" aria-selected={outputView === 'tree'} className={outputView === 'tree' ? 'active' : ''} onClick={() => setOutputView('tree')}>Component tree</button><button role="tab" aria-selected={outputView === 'json'} className={outputView === 'json' ? 'active' : ''} onClick={() => setOutputView('json')}>Raw JSON</button></div>
              {outputView === 'tree' ? <div className="schema-component-tree"><div className="schema-tree-meta"><span>template_widget</span><span>SDUI_WIDGET</span><span>{countBuilderNodes(builderRoot)} components</span></div><SchemaTreeNode node={builderRoot} selected={selectedNode} onSelect={selectBuilderNode} /></div> : <pre className="builder-schema builder-schema-expanded">{builderSchema}</pre>}
            </section>
          </div>
          <BuilderInspector node={selectedBuilderNode} onField={setBuilderField} onStyle={setBuilderStyle} onProperty={setBuilderProperty} onValue={setBuilderValue} styleTools={styleTools} path={selectedPath} duplicateVariable={!!selectedBuilderNode.variable?.trim() && duplicateVariables(dynamicFields).has(selectedBuilderNode.variable.trim())} onCopyPath={() => void copy(selectedPath, 'Path copied')} />
        </fieldset>
      </>}
      {showQr && <div className="sdui-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowQr(false) }}><section className="sdui-qr-modal" role="dialog" aria-modal="true" aria-labelledby="sdui-qr-title"><button className="sdui-modal-close" aria-label="Close QR dialog" onClick={() => setShowQr(false)}>×</button><div><span className="sdui-kicker">Mini App preview</span><h2 id="sdui-qr-title">{schemaName}</h2><p>Scan to open the Mini App with this template ID.</p></div><label className="sdui-label">Mini App URL / deep link<input value={miniAppBaseUrl} onChange={event => { setMiniAppBaseUrl(event.target.value); setQrDataUrl('') }} placeholder="momo://action=marketing&refId=..." /></label><p>Tool sẽ thêm <code>templateId={editingSchema?.id}</code>. Nếu Mini App dùng params JSON, đặt <code>{'{templateId}'}</code> trong URL cấu hình.</p><div className="sdui-qr-image">{qrDataUrl && <img src={qrDataUrl} alt={`QR code for ${schemaName}`} />}</div>{copyFeedback && <p role="status">{copyFeedback}</p>}<code className="sdui-qr-url">{miniAppUrl || 'Nhập URL rồi chọn Generate QR'}</code><small className="sdui-muted">Template JSON API: {templateJsonUrl}</small><div className="sdui-qr-actions"><button className="sdui-quiet" disabled={!miniAppUrl} onClick={() => void copy(miniAppUrl, 'Mini App URL copied')}>Copy URL</button><button className="sdui-quiet" disabled={!miniAppBaseUrl.trim() || qrGenerating} onClick={() => void generateQr()}>{qrGenerating ? 'Generating…' : 'Generate QR'}</button><button className="sdui-primary" disabled={!qrDataUrl} onClick={downloadQr}>Download PNG</button></div></section></div>}
    </main>
  )
}
