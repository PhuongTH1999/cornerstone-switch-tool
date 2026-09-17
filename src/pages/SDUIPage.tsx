import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { supabaseHeaders, supabaseTable } from '../config/supabase'
import '../styles/sdui.scss'

interface HistoryItem { id: number; title: string; output: string }
interface BuilderPadding { all?: number; top?: number; bottom?: number; left?: number; right?: number }
interface BuilderNode { id: number; type: string; name: string; value?: string; url?: string; title?: string; buttonType?: string; layout?: string; spacing?: number; padding?: any; radius?: number; bg?: string; width?: number; height?: number; border?: { width?: number; color?: string }; alignment?: string; textAlignment?: string; contentMode?: string; fillMaxWidth?: boolean; fillMaxHeight?: boolean; weight?: number; nativeStyle?: any; nativeProperty?: any; children?: BuilderNode[] }
interface SavedSchema { id?: string; name: string; tree: unknown; ts?: number }

const templates: Record<string, string> = {
  'Content info': '{\n  "type": "content_info",\n  "items": []\n}',
  'Content ranking': '{\n  "type": "content_ranking",\n  "items": []\n}',
  'Promotion horizontal': '{\n  "type": "promotion_horizontal",\n  "title": "",\n  "image": ""\n}',
  'Custom component': '{\n  "type": "container",\n  "children": []\n}',
}

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

const flexAlignment: Record<string, CSSProperties['justifyContent']> = {
  start: 'flex-start', top: 'flex-start', left: 'flex-start', leading: 'flex-start',
  center: 'center', end: 'flex-end', bottom: 'flex-end', right: 'flex-end', trailing: 'flex-end',
  spaceBetween: 'space-between', spaceAround: 'space-around', spaceEvenly: 'space-evenly',
}

const typography: Record<string, CSSProperties> = {
  labelXsMedium: { fontSize: 11, fontWeight: 500 }, labelSMedium: { fontSize: 12, fontWeight: 500 },
  headerXsSemibold: { fontSize: 13, fontWeight: 600 }, headerSSemibold: { fontSize: 15, fontWeight: 600 },
  headerDefaultBold: { fontSize: 17, fontWeight: 700 }, descriptionXsRegular: { fontSize: 11, fontWeight: 400 },
  descriptionDefaultRegular: { fontSize: 13, fontWeight: 400 }, actionSBold: { fontSize: 13, fontWeight: 700 },
}

function boxStyle(input: any): CSSProperties {
  const box = input || {}
  const padding = box.padding
  return {
    backgroundColor: box.backgroundColor,
    borderRadius: box.cornerRadius,
    border: box.border ? `${box.border.width || 1}px solid ${box.border.color || '#e0e0e0'}` : undefined,
    width: box.width,
    height: box.height,
    padding: typeof padding === 'number' ? padding : padding?.all != null ? padding.all : padding ? `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px` : undefined,
  }
}

function fillStyle(node: any, row: boolean): CSSProperties {
  const style = node?.style || {}
  const modifier = node?.modifier || {}
  const fillWidth = node?.fillMaxWidth || style.fillMaxWidth || modifier.fillMaxWidth || modifier.fillMaxSize
  const fillHeight = node?.fillMaxHeight || style.fillMaxHeight || modifier.fillMaxHeight || modifier.fillMaxSize
  return {
    ...(modifier.weight != null ? { flex: modifier.weight, minWidth: row ? 0 : undefined, minHeight: row ? undefined : 0 } : {}),
    ...(fillWidth || (row && node?.type === 'spacer') ? { flex: row ? 1 : undefined, minWidth: row ? 0 : undefined, alignSelf: row ? undefined : 'stretch' } : {}),
    ...(fillHeight || (!row && node?.type === 'spacer') ? { flex: row ? undefined : 1, minHeight: row ? undefined : 0, alignSelf: row ? 'stretch' : undefined } : {}),
    ...(node?.width != null || style.width != null || modifier.width != null ? { flexShrink: 0 } : {}),
  }
}

function renderPreviewNode(rawNode: any, key?: string | number, selectedNodeId?: number, onSelect?: (id: number) => void): ReactNode {
  if (!rawNode || typeof rawNode !== 'object') return null
  const node = rawNode.type === 'template_widget' ? unwrapSchema(rawNode) : rawNode
  const style = node.nativeStyle || node.style || {}
  const property = node.nativeProperty || node.property || {}
  const modifier = node.modifier || {}
  const value = typeof node.value === 'object' ? node.value || {} : {}

  if (node.type === 'container') {
    const layout = node.layout || property.layout || 'column'
    const row = /row/i.test(layout) && !/column/i.test(layout)
    const scroll = /scroll/i.test(layout)
    const children = node.children || value.children || []
    const alignment = node.alignment || property.alignment || modifier.alignment
    const arrangement = property.arrangement || modifier.arrangement
    const nodeBox = { ...style, backgroundColor: style.backgroundColor || node.bg, width: node.width ?? style.width, height: node.height ?? style.height, padding: node.padding ?? style.padding, cornerRadius: node.radius ?? style.cornerRadius, border: style.border || node.border }
    const styleProps: CSSProperties = { display: 'flex', flexDirection: row ? 'row' : 'column', gap: node.spacing ?? property.spacing, justifyContent: flexAlignment[arrangement] || 'flex-start', alignItems: flexAlignment[alignment] || (row ? 'center' : 'stretch'), ...(scroll ? (row ? { overflowX: 'auto', flexWrap: 'nowrap' } : { overflowY: 'auto' }) : {}), ...boxStyle(nodeBox), ...boxStyle(modifier) }
    return <div key={key} className={`schema-preview-container ${selectedNodeId === node.id ? 'preview-node-selected' : ''}`} data-node-id={node.id} onClick={(event) => { if (node.id && onSelect) { event.stopPropagation(); onSelect(node.id) } }} style={styleProps}>{children.map((child: any, index: number) => <div key={child._id || child.id || index} className={`preview-node-shell ${selectedNodeId === child.id ? 'preview-node-shell-selected' : ''}`} data-node-id={child.id} onClick={(event) => { if (child.id && onSelect) { event.stopPropagation(); onSelect(child.id) } }} style={fillStyle(child, row)}>{renderPreviewNode(child, child._id || child.id || index, selectedNodeId, onSelect)}</div>)}</div>
  }

  if (node.componentType) {
    const componentType = node.componentType
    if (componentType === 'ITEM_LIST') return <div key={key} className="schema-preview-list" style={{ width: '100%', ...boxStyle(modifier) }}>{Array.from({ length: Math.min(node.maxItems || 2, 3) }, (_, index) => renderPreviewNode(node.itemTemplate, `${key}-${index}`))}</div>
    if (componentType === 'TEXT') return <div key={key} className="schema-preview-text" style={{ ...typography[style.typography] || typography.descriptionDefaultRegular, color: style.color || '#222', fontWeight: style.fontWeight, fontStyle: 'italic', opacity: .85, ...boxStyle(modifier) }}>{`{${node.field || 'text'}}`}</div>
    if (componentType === 'ICON' || componentType === 'IMAGE') return <img key={key} className="schema-preview-image" src="/assets/widget/template_image.png" alt={node.field || 'image'} style={{ width: componentType === 'ICON' ? node.iconSize || 24 : '100%', height: componentType === 'ICON' ? node.iconSize || 24 : 80, objectFit: 'cover', ...boxStyle(modifier) }} />
    if (componentType === 'CTA_BUTTON') return <PreviewButton key={key} title="Action" type="primary" style={modifier} />
    if (componentType === 'TAG') return <PreviewTag key={key} value={`{${node.field || 'tag'}}`} type={style.tagType} />
  }

  if (node.type === undefined && (node.layout || node.children)) return <div key={key}>{renderPreviewNode({ type: 'container', property: { ...modifier, layout: node.layout, spacing: modifier.spacing }, value: { children: node.children }, style: modifier }, key)}</div>
  if (node.body || node.footer || node.header) return <div key={key} className="schema-preview-sections">{['header', 'body', 'footer'].map((section) => node[section] ? renderPreviewNode(node[section], `${key}-${section}`) : null)}</div>
  if (node.type === 'text') return <div key={key} className="schema-preview-text" style={{ ...(typography[property.typography] || typography.descriptionDefaultRegular), color: property.color || '#222', textAlign: property.textAlignment || node.textAlignment, ...(property.lineLimit ? { display: '-webkit-box', WebkitLineClamp: property.lineLimit, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}), ...boxStyle({ ...style, width: node.width ?? style.width, height: node.height ?? style.height }) }}>{typeof node.value === 'string' ? node.value : ''}</div>
  if (node.type === 'image') return <img key={key} className="schema-preview-image" src={typeof node.value === 'string' && /^(https?:|data:|\/\/)/i.test(node.value) ? node.value : '/assets/widget/template_image.png'} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/assets/widget/template_image.png' }} alt="" style={{ width: node.width || style.width || 48, height: node.height || style.height || 48, objectFit: node.contentMode || property.contentMode === 'fill' ? 'cover' : 'contain', background: '#eee', flexShrink: 0, ...boxStyle({ ...style, width: node.width ?? style.width, height: node.height ?? style.height, border: style.border || node.border }) }} />
  if (node.type === 'button') return <PreviewButton key={key} title={node.title || value.title || 'Button'} type={node.buttonType || value.type || property.type || 'primary'} style={{ ...property, ...style }} />
  if (node.type === 'tag') return <PreviewTag key={key} value={typeof node.value === 'string' ? node.value : 'TAG'} type={property.tagType} />
  if (node.type === 'spacer') return <div key={key} style={{ flex: 1, minWidth: property.minLength, minHeight: property.minLength }} />
  return null
}

function PreviewButton({ title, type, style }: { title: string; type: string; style?: any }) {
  const colors: Record<string, CSSProperties> = { primary: { background: '#a50064', color: '#fff', borderColor: '#a50064' }, secondary: { background: '#f0f0f3', color: '#333', borderColor: '#f0f0f3' }, tonal: { background: '#fce4f1', color: '#a50064', borderColor: '#fce4f1' }, outline: { background: 'transparent', color: style?.color || '#a50064', borderColor: style?.color || '#a50064' }, danger: { background: '#e53935', color: '#fff', borderColor: '#e53935' }, text: { background: 'transparent', color: style?.color || '#a50064', borderColor: 'transparent' } }
  return <button className="schema-preview-button" style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid transparent', flexShrink: 0, ...colors[type] || colors.primary }}>{title}</button>
}

function PreviewTag({ value, type }: { value: string; type?: string }) {
  const colors: Record<string, CSSProperties> = { info: { background: '#e3f2fd', color: '#1565c0' }, success: { background: '#e6f7ed', color: '#1b873f' }, error: { background: '#fdecea', color: '#c62828' }, warning: { background: '#fff3e0', color: '#e65100' }, highlight: { background: '#fde7f1', color: '#a50064' } }
  return <span className="schema-preview-tag" style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, alignSelf: 'flex-start', ...colors[type || 'highlight'] }}>{value}</span>
}

let activePreviewLink: { selectedNodeId?: number; onSelect?: (id: number) => void } = {}

function PreviewNode({ node, selectedNodeId, onSelect }: { node: any; selectedNodeId?: number; onSelect?: (id: number) => void }) {
  return <>{renderPreviewNode(unwrapSchema(node), 'preview-root', selectedNodeId ?? activePreviewLink.selectedNodeId, onSelect || activePreviewLink.onSelect)}</>
}

function normalizeBuilderTree(tree: any): BuilderNode | null {
  const root = unwrapSchema(tree)
  if (!root) return null
  let nextId = 1
  const convert = (node: any): BuilderNode => {
    const value = typeof node.value === 'object' ? node.value : {}
    const id = nextId++
    return { id, type: node.type || 'text', name: node.name || (typeof node.value === 'string' ? node.value : `${node.type || 'component'}_${id}`), value: typeof node.value === 'string' ? node.value : undefined, url: node.url || (node.type === 'image' && typeof node.value === 'string' ? node.value : undefined), title: node.title || value.title || node.property?.title, buttonType: node.buttonType || value.type || node.property?.type, layout: node.layout || node.property?.layout, spacing: node.spacing ?? node.property?.spacing, padding: node.padding ?? node.style?.padding, radius: node.radius ?? node.style?.cornerRadius, bg: node.bg || node.style?.backgroundColor, width: node.width ?? node.style?.width, height: node.height ?? node.style?.height, border: node.border || node.style?.border, alignment: node.alignment || node.property?.alignment, textAlignment: node.textAlignment || node.property?.textAlignment, contentMode: node.contentMode || node.property?.contentMode, fillMaxWidth: node.fillMaxWidth ?? node.style?.fillMaxWidth ?? node.modifier?.fillMaxWidth, fillMaxHeight: node.fillMaxHeight ?? node.style?.fillMaxHeight ?? node.modifier?.fillMaxHeight, weight: node.weight ?? node.modifier?.weight, nativeStyle: node.style || {}, nativeProperty: node.property || {}, children: node.type === 'container' ? (node.children || value.children || []).map(convert) : undefined }
  }
  return convert(root)
}

function BuilderInspector({ node, onField, onStyle, onProperty, onApplyToSiblings }: { node: BuilderNode; onField: (key: keyof BuilderNode, value: string) => void; onStyle: (key: string, value: string) => void; onProperty: (key: string, value: string) => void; onApplyToSiblings: () => void }) {
  const style = node.nativeStyle || {}
  const property = node.nativeProperty || {}
  const input = (label: string, key: keyof BuilderNode, value: string | number = '') => <label className="sdui-label">{label}<input value={value} onChange={(event) => onField(key, event.target.value)} /></label>
  const styleInput = (label: string, key: string, value: string | number = '') => <label className="sdui-label">{label}<input value={value} onChange={(event) => onStyle(key, event.target.value)} /></label>
  const propertyInput = (label: string, key: string, value: string | number = '') => <label className="sdui-label">{label}<input value={value} onChange={(event) => onProperty(key, event.target.value)} /></label>
  const select = (label: string, key: keyof BuilderNode, value: string, options: string[]) => <label className="sdui-label">{label}<select value={value} onChange={(event) => onField(key, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option || 'Default'}</option>)}</select></label>
  const propertySelect = (label: string, key: string, value: string, options: string[]) => <label className="sdui-label">{label}<select value={value} onChange={(event) => onProperty(key, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option || 'Default'}</option>)}</select></label>

  return <aside className="sdui-card figma-inspector-dock"><div className="sdui-card-title">Inspector <span>{node.type.toUpperCase()}</span></div>{input('Layer name', 'name', node.name)}{node.type === 'container' && <><label className="sdui-label">Background color<div className="inspector-color-row"><input className="inspector-color" type="color" value={/^#[0-9a-f]{6}$/i.test(node.bg || style.backgroundColor || '') ? (node.bg || style.backgroundColor) : '#ffffff'} onChange={(event) => onStyle('backgroundColor', event.target.value)} /><input value={node.bg || style.backgroundColor || ''} onChange={(event) => onStyle('backgroundColor', event.target.value)} placeholder="#FFFFFF" /></div></label><select className="inspector-select" value={node.layout || property.layout || 'column'} onChange={(event) => onField('layout', event.target.value)}><option value="column">Vertical / Column</option><option value="row">Horizontal / Row</option><option value="scrollRow">Horizontal scroll</option><option value="scrollColumn">Vertical scroll</option></select>{input('Spacing', 'spacing', node.spacing ?? property.spacing ?? 0)}{input('Padding', 'padding', typeof node.padding === 'number' ? node.padding : node.padding?.all ?? 0)}{input('Width', 'width', node.width ?? style.width ?? '')}{input('Height', 'height', node.height ?? style.height ?? '')}{input('Corner radius', 'radius', node.radius ?? style.cornerRadius ?? 0)}{styleInput('Border color', 'border.color', style.border?.color || '')}{styleInput('Border width', 'border.width', style.border?.width || 0)}{propertySelect('Alignment', 'alignment', node.alignment || property.alignment || '', ['', 'leading', 'center', 'trailing', 'left', 'right', 'top', 'bottom'])}<button className="inspector-apply-button" onClick={onApplyToSiblings}>Apply style to same-level items</button></>}{node.type === 'text' && <>{<label className="sdui-label">Text content<textarea value={node.value || ''} onChange={(event) => onField('value', event.target.value)} /></label>}{propertySelect('Typography', 'typography', property.typography || '', ['', 'labelXsMedium', 'labelSMedium', 'headerXsSemibold', 'headerSSemibold', 'headerDefaultBold', 'descriptionXsRegular', 'descriptionDefaultRegular', 'actionSBold'])}{propertyInput('Text color', 'color', property.color || '')}{propertyInput('Line limit', 'lineLimit', property.lineLimit || '')}{propertySelect('Text alignment', 'textAlignment', property.textAlignment || '', ['', 'leading', 'center', 'trailing'])}</>}{node.type === 'image' && <>{input('Image URL', 'url', node.url || '')}{propertySelect('Content mode', 'contentMode', node.contentMode || property.contentMode || 'fit', ['fit', 'fill', 'center'])}{propertyInput('Tint color', 'tintColor', property.tintColor || '')}{propertyInput('Aspect ratio', 'aspectRatio', property.aspectRatio || '')}{input('Width', 'width', node.width ?? style.width ?? '')}{input('Height', 'height', node.height ?? style.height ?? '')}{input('Corner radius', 'radius', node.radius ?? property.cornerRadius ?? style.cornerRadius ?? 0)}</>}{node.type === 'button' && <>{input('Button title', 'title', node.title || '')}{propertySelect('Button type', 'type', node.buttonType || property.type || 'primary', ['primary', 'secondary', 'tonal', 'outline', 'danger', 'text', 'disabled'])}{propertyInput('Button color', 'color', property.color || '')}{propertyInput('Action type', 'actionType', property.actionType || '')}{propertyInput('Feature code', 'featureCode', property.actions?.[0]?.featureCode || '')}</>}{node.type === 'tag' && <>{input('Tag value', 'value', node.value || '')}{propertySelect('Tag type', 'tagType', property.tagType || 'highlight', ['info', 'success', 'error', 'warning', 'highlight'])}{propertyInput('Tag background', 'backgroundColor', property.backgroundColor || '')}{propertyInput('Tag text color', 'textColor', property.textColor || '')}{propertyInput('Icon URL', 'iconUrl', property.iconUrl || '')}</>}{node.type === 'spacer' && propertyInput('Minimum length', 'minLength', property.minLength || 0)}</aside>
}

export default function SDUIPage() {
  const [activeTab, setActiveTab] = useState<'generator' | 'builder' | 'templates' | 'guide'>('generator')
  const [mode, setMode] = useState<'api' | 'prompt'>('api')
  const [schema, setSchema] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [context, setContext] = useState('')
  const [preset, setPreset] = useState('content_info')
  const [status, setStatus] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [builderRoot, setBuilderRoot] = useState<BuilderNode>(initialBuilderTree)
  const [selectedNode, setSelectedNode] = useState(1)
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1, 2, 4]))
  const [, setLoadedTree] = useState<unknown>(null)
  const [builderJsonInput, setBuilderJsonInput] = useState('')
  const [nativePreviewJson, setNativePreviewJson] = useState<any[] | null>(null)
  const [savedSchemas, setSavedSchemas] = useState<SavedSchema[]>([])
  const [cloudStatus, setCloudStatus] = useState<'loading' | 'connected' | 'local' | 'error'>('loading')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    const loadSchemas = async () => {
      try {
        const response = await fetch(supabaseTable('schemas?select=id,name,tree,ts&order=ts.desc'), { headers: supabaseHeaders() })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const rows = await response.json() as SavedSchema[]
        if (!cancelled) { setSavedSchemas(rows); setCloudStatus('connected') }
      } catch {
        try {
          const local = JSON.parse(localStorage.getItem('cs_builder_saved') || '[]') as SavedSchema[]
          if (!cancelled) { setSavedSchemas(local); setCloudStatus(local.length ? 'local' : 'error') }
        } catch { if (!cancelled) setCloudStatus('error') }
      }
    }
    loadSchemas()
    return () => { cancelled = true }
  }, [])

  const readImage = (file?: Blob) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => { setImage(String(reader.result)); setStatus('Image ready') }
    reader.readAsDataURL(file)
  }
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => readImage(event.target.files?.[0])
  const handleDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); readImage(event.dataTransfer.files[0]) }
  const copy = async (value: string, label: string) => { await navigator.clipboard?.writeText(value); setStatus(label) }
  const download = (value: string, name: string) => { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([value], { type: 'application/json' })); link.download = name; link.click(); setStatus('Downloaded') }
  const generate = () => {
    const output = JSON.stringify({ type: preset, context, imageAttached: Boolean(image), items: [] }, null, 2)
    setSchema(output)
    setHistory((current) => [{ id: Date.now(), title: `${preset} schema`, output }, ...current].slice(0, 8))
    setStatus(mode === 'api' ? 'Generated dataSchema' : 'Prompt copied to clipboard')
    if (mode === 'prompt') copy(`Generate a ${preset} dataSchema.\nContext: ${context}`, 'Prompt copied to clipboard')
  }
  const parseResponse = () => {
    try { const parsed = JSON.parse(schema.replace(/^```json\s*|\s*```$/g, '')); setSchema(JSON.stringify(parsed, null, 2)); setStatus('JSON response parsed') } catch { setStatus('Response is not valid JSON') }
  }
  const findBuilderNode = (node: BuilderNode, id: number): BuilderNode | null => node.id === id ? node : (node.children || []).reduce<BuilderNode | null>((found, child) => found || findBuilderNode(child, id), null)
  const findBuilderParent = (node: BuilderNode, id: number): BuilderNode | null => (node.children || []).some((child) => child.id === id) ? node : (node.children || []).reduce<BuilderNode | null>((found, child) => found || findBuilderParent(child, id), null)
  const updateBuilderTree = (node: BuilderNode, id: number, update: (target: BuilderNode) => BuilderNode): BuilderNode => node.id === id ? update(node) : { ...node, children: node.children?.map((child) => updateBuilderTree(child, id, update)) }
  const toSchemaNode = (node: BuilderNode): any => ({ type: node.type, style: { ...(node.nativeStyle || {}), ...(node.bg ? { backgroundColor: node.bg } : {}), ...(node.padding != null ? { padding: typeof node.padding === 'number' ? { all: node.padding } : node.padding } : {}), ...(node.radius != null ? { cornerRadius: node.radius } : {}), ...(node.width != null ? { width: node.width } : {}), ...(node.height != null ? { height: node.height } : {}), ...(node.border ? { border: node.border } : {}), ...(node.fillMaxWidth ? { fillMaxWidth: true } : {}), ...(node.fillMaxHeight ? { fillMaxHeight: true } : {}) }, property: { ...(node.nativeProperty || {}), ...(node.layout ? { layout: node.layout } : {}), ...(node.spacing != null ? { spacing: node.spacing } : {}), ...(node.alignment ? { alignment: node.alignment } : {}), ...(node.textAlignment ? { textAlignment: node.textAlignment } : {}), ...(node.contentMode ? { contentMode: node.contentMode } : {}), ...(node.buttonType ? { type: node.buttonType } : {}), id: node.name }, modifier: node.weight != null ? { weight: node.weight } : undefined, value: node.type === 'container' ? { children: (node.children || []).map(toSchemaNode) } : node.type === 'image' ? node.url || '' : node.type === 'button' ? { title: node.title || 'Button' } : node.value || '' })
  const builderSchema = JSON.stringify({ type: 'template_widget', templateType: 'SDUI_WIDGET', data: [toSchemaNode(builderRoot)] }, null, 2)
  const copyBuilderSchema = () => { setBuilderJsonInput(builderSchema); copy(builderSchema, 'Builder JSON copied') }
  const importBuilder = () => {
    try { const parsed = JSON.parse(builderJsonInput); const imported = normalizeBuilderTree(parsed); if (!imported) throw new Error('invalid'); setNativePreviewJson(Array.isArray(parsed) ? parsed : [parsed]); setBuilderRoot(imported); setSelectedNode(imported.id); setExpandedNodes(new Set([imported.id])); setLoadedTree(imported); setStatus('Builder imported and preview updated') } catch { setStatus('Builder import expects a valid SDUI tree') }
  }
  const importBuilderFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setBuilderJsonInput(String(reader.result))
    reader.readAsText(file)
    event.target.value = ''
  }
  const loadSavedSchema = (saved: SavedSchema) => {
    const imported = normalizeBuilderTree(saved.tree)
    if (!imported) { setStatus(`Cannot read ${saved.name}`); return }
    setBuilderRoot(imported)
    setNativePreviewJson(Array.isArray(saved.tree) ? saved.tree : [saved.tree])
    setSelectedNode(imported.id)
    setExpandedNodes(new Set([imported.id]))
    setSchema(JSON.stringify(saved.tree, null, 2))
    setActiveTab('builder')
    setStatus(`Loaded ${saved.name}`)
  }
  const downloadNativeMockData = () => {
    const payload = nativePreviewJson || [JSON.parse(builderSchema)]
    download(JSON.stringify(payload, null, 2), 'MockData.json')
    setStatus('Native MockData.json downloaded')
  }
  const selectedBuilderNode = findBuilderNode(builderRoot, selectedNode) || builderRoot
  const addBuilderChild = (parentId: number, type: string) => {
    const child: BuilderNode = { id: Date.now(), type, name: `${type}_${Date.now().toString().slice(-4)}`, value: type === 'text' ? 'New text' : undefined, title: type === 'button' ? 'Button' : undefined, children: type === 'container' ? [] : undefined }
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
  const setBuilderNested = (rootKey: 'nativeStyle' | 'nativeProperty', path: string, value: string) => {
    setNativePreviewJson(null)
    setBuilderRoot((current) => updateBuilderTree(current, selectedNode, (node) => {
      const nextRoot = { ...(node[rootKey] || {}) }
      const keys = path.split('.')
      let target = nextRoot
      keys.slice(0, -1).forEach((key) => { target[key] = { ...(target[key] || {}) }; target = target[key] })
      const lastKey = keys[keys.length - 1]
      target[lastKey] = /^(-?\d+(\.\d+)?)$/.test(value) ? Number(value) : value
      const nextNode = { ...node, [rootKey]: nextRoot }
      if (rootKey === 'nativeStyle' && path === 'backgroundColor') nextNode.bg = value
      if (rootKey === 'nativeStyle' && path === 'cornerRadius') nextNode.radius = Number(value) || 0
      return nextNode
    }))
  }
  const setBuilderStyle = (key: string, value: string) => setBuilderNested('nativeStyle', key, value)
  const setBuilderProperty = (key: string, value: string) => setBuilderNested('nativeProperty', key, value)
  const applySelectedStyleToSiblings = () => {
    const parent = findBuilderParent(builderRoot, selectedNode)
    const source = findBuilderNode(builderRoot, selectedNode)
    if (!parent || !source) { setStatus('Root has no same-level siblings'); return }
    const styleKeys: (keyof BuilderNode)[] = ['bg', 'width', 'height', 'padding', 'radius', 'border', 'fillMaxWidth', 'fillMaxHeight']
    const copyStyle = (target: BuilderNode): BuilderNode => ({ ...target, ...Object.fromEntries(styleKeys.map((key) => [key, source[key]])), nativeStyle: structuredClone(source.nativeStyle || {}) })
    setNativePreviewJson(null)
    setBuilderRoot((current) => updateBuilderTree(current, parent.id, (node) => ({ ...node, children: node.children?.map((child) => child.id === selectedNode ? child : copyStyle(child)) })))
    setStatus(`Applied style to ${Math.max(0, (parent.children?.length || 1) - 1)} sibling item(s)`)
  }
  const selectBuilderNode = (id: number) => { setSelectedNode(id); requestAnimationFrame(() => document.querySelector(`[data-tree-node-id="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })) }
  const renderBuilderTree = (node: BuilderNode, depth = 0): ReactNode => <div key={node.id} className="figma-tree-branch"><div data-tree-node-id={node.id} className={`figma-tree-row ${selectedNode === node.id ? 'selected' : ''}`} style={{ paddingLeft: `${10 + depth * 18}px` }} onClick={() => selectBuilderNode(node.id)}><button className="figma-tree-chevron" onClick={(event) => { event.stopPropagation(); setExpandedNodes((current) => { const next = new Set(current); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next }) }}>{node.children?.length ? (expandedNodes.has(node.id) ? '▾' : '▸') : '·'}</button><span className={`figma-tree-icon type-${node.type}`}>{node.type === 'container' ? '▦' : node.type === 'text' ? 'T' : node.type === 'image' ? '▧' : node.type === 'button' ? '▣' : '·'}</span><strong>{node.name}</strong><small>{node.type}</small>{node.id !== builderRoot.id && <button className="figma-tree-delete" onClick={(event) => { event.stopPropagation(); removeBuilderNode(node.id) }}>×</button>}</div>{expandedNodes.has(node.id) && node.children?.map((child) => renderBuilderTree(child, depth + 1))}</div>

  activePreviewLink = { selectedNodeId: selectedNode, onSelect: selectBuilderNode }

  return (
    <main className="sdui-page">
      <header className="sdui-header">
        <div><span className="sdui-kicker">Cornerstone / SDUI</span><h1>Server-driven UI</h1><p>Generate, shape, and preview native-ready data schemas.</p></div>
        <div className="sdui-pills"><span className="sdui-pill">Schemas: {cloudStatus === 'connected' ? 'Supabase' : cloudStatus === 'loading' ? 'Loading' : 'Local fallback'}</span><span className="sdui-pill sdui-pill-muted">{savedSchemas.length} saved</span></div>
      </header>
      <nav className="sdui-tabs" aria-label="SDUI workspace">{([['generator', 'Generator'], ['builder', 'Builder'], ['templates', 'Templates'], ['guide', 'Guide']] as const).map(([id, label]) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>{label}</button>)}</nav>

      {activeTab === 'generator' && <div className="sdui-grid"><section className="sdui-card"><div className="sdui-card-title">Input <span>IMAGE TO JSON</span></div><div className="sdui-mode-toggle"><button className={mode === 'api' ? 'active' : ''} onClick={() => setMode('api')}><strong>API mode</strong><small>Generate directly with an API key</small></button><button className={mode === 'prompt' ? 'active' : ''} onClick={() => setMode('prompt')}><strong>Prompt-based</strong><small>Build a prompt for Claude or ChatGPT</small></button></div><div className="sdui-dropzone" onClick={() => fileInput.current?.click()} onDragOver={(dragEvent) => dragEvent.preventDefault()} onDrop={handleDrop}>{image ? <img src={image} alt="UI mockup" /> : <><span>+</span><strong>Drop a UI mockup here</strong><small>PNG, JPG, WEBP up to 5MB · click to browse</small></>}<input ref={fileInput} hidden type="file" accept="image/*" onChange={handleFile} /></div><div className="sdui-input-actions"><button className="sdui-quiet" onClick={async () => { const items = await navigator.clipboard?.read?.(); const imageItem = items?.find((item) => item.types.some((type) => type.startsWith('image/'))); if (imageItem) readImage(await imageItem.getType(imageItem.types.find((type) => type.startsWith('image/')) || 'image/png')); }}>Paste from clipboard</button><button className="sdui-quiet" onClick={() => setImage(null)}>Clear image</button></div><label className="sdui-label">Format preset<select value={preset} onChange={(event) => setPreset(event.target.value)}><option value="content_info">content_info</option><option value="content_ranking">content_ranking</option><option value="content">content</option><option value="custom">custom</option></select></label><label className="sdui-label">Context / hints<textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="Describe content, colors, limits, or interaction details..." /></label><button className="sdui-primary" onClick={generate}>{mode === 'api' ? 'Generate dataSchema' : 'Build & copy prompt'}</button>{status && <div className="sdui-status">{status}</div>}</section><section className="sdui-card"><div className="sdui-card-title">Output <span>JSON SCHEMA</span><button className="sdui-quiet" onClick={() => copy(schema, 'JSON copied')}>Copy</button></div><div className="sdui-output-tabs"><button className="active">Full dataSchema</button><button onClick={parseResponse}>Parse response</button></div><textarea className="sdui-output" value={schema} onChange={(event) => setSchema(event.target.value)} placeholder="Generated dataSchema will appear here..." /><div className="sdui-output-footer"><span>{schema.length} chars</span><button className="sdui-quiet" onClick={() => download(schema, 'sdui-output.json')}>Download JSON</button></div><div className="sdui-history"><div className="sdui-card-title">History <button className="sdui-quiet" onClick={() => setHistory([])}>Clear</button></div>{history.length === 0 ? <small className="sdui-muted">No history yet</small> : history.map((item) => <button key={item.id} onClick={() => setSchema(item.output)}>{item.title}<small>{item.output.length} chars</small></button>)}</div></section></div>}

      {activeTab === 'builder' && <div className="sdui-builder-workspace"><section className="sdui-card figma-tree-panel"><div className="sdui-card-title">Layers <span>COMPONENT TREE</span></div><div className="figma-tree-toolbar"><button className="sdui-quiet" onClick={() => setExpandedNodes(new Set([builderRoot.id]))}>Collapse all</button><button className="sdui-quiet" onClick={copyBuilderSchema}>Copy JSON</button><button className="sdui-quiet" onClick={importBuilder}>Import JSON</button><label className="sdui-quiet file-button">Upload JSON<input hidden type="file" accept=".json,application/json" onChange={importBuilderFile} /></label><button className="sdui-quiet" onClick={() => { setBuilderRoot(initialBuilderTree); setSelectedNode(1); setExpandedNodes(new Set([1, 2, 4])); setBuilderJsonInput(''); setNativePreviewJson(null) }}>Reset</button></div><label className="builder-json-label">Paste schema to preview<textarea className="builder-json-input" value={builderJsonInput} onChange={(event) => setBuilderJsonInput(event.target.value)} placeholder="Paste template_widget, dataSchema, or component tree JSON here..." /></label><button className="sdui-primary builder-import-button" onClick={importBuilder}>Import JSON → Update preview</button><div className="figma-tree">{renderBuilderTree(builderRoot)}</div><div className="figma-add-row"><select id="builder-type" defaultValue="text"><option value="container">Frame / container</option><option value="text">Text</option><option value="image">Image</option><option value="button">Button</option><option value="spacer">Spacer</option></select><button className="sdui-primary" onClick={() => addBuilderChild(selectedNode, (document.getElementById('builder-type') as HTMLSelectElement).value)}>+ Add inside selected</button></div></section><section className="sdui-card figma-canvas-panel"><div className="sdui-card-title">Canvas <span>LIVE PREVIEW</span></div><div className="sdui-preview figma-canvas"><PreviewNode node={builderRoot} /></div><div className="preview-actions"><button className="sdui-quiet" onClick={copyBuilderSchema}>Copy current JSON</button><button className="sdui-quiet" onClick={() => download(builderSchema, 'sdui-builder.json')}>Download JSON</button><button className="sdui-native-export" onClick={downloadNativeMockData}>Export Native MockData</button></div><p className="native-preview-hint">Verify exact iOS/Android rendering with <code>native-widget/example/ios/PreviewApp/MockData.json</code>.</p><pre className="builder-schema">{builderSchema}</pre></section><aside className="sdui-card figma-inspector"><div className="sdui-card-title">Inspector <span>{selectedBuilderNode.type.toUpperCase()}</span></div><label className="sdui-label">Layer name<input value={selectedBuilderNode.name} onChange={(event) => setBuilderField('name', event.target.value)} /></label>{selectedBuilderNode.type === 'container' && <><label className="sdui-label">Layout<select value={selectedBuilderNode.layout || 'column'} onChange={(event) => setBuilderField('layout', event.target.value)}><option value="column">Vertical / Column</option><option value="row">Horizontal / Row</option></select></label><label className="sdui-label">Spacing<input type="number" value={selectedBuilderNode.spacing || 0} onChange={(event) => setBuilderField('spacing', event.target.value)} /></label><label className="sdui-label">Padding<input type="number" value={selectedBuilderNode.padding || 0} onChange={(event) => setBuilderField('padding', event.target.value)} /></label><label className="sdui-label">Background<input value={selectedBuilderNode.bg || ''} onChange={(event) => setBuilderField('bg', event.target.value)} placeholder="#FFFFFF" /></label></>}{selectedBuilderNode.type === 'text' && <label className="sdui-label">Text content<textarea value={selectedBuilderNode.value || ''} onChange={(event) => setBuilderField('value', event.target.value)} /></label>}{selectedBuilderNode.type === 'image' && <label className="sdui-label">Image URL<input value={selectedBuilderNode.url || ''} onChange={(event) => setBuilderField('url', event.target.value)} /></label>}{selectedBuilderNode.type === 'button' && <label className="sdui-label">Button title<input value={selectedBuilderNode.title || ''} onChange={(event) => setBuilderField('title', event.target.value)} /></label>}</aside></div>}

      {activeTab === 'templates' && <section className="sdui-card sdui-wide-card"><div className="sdui-card-title">JSON templates <span>{cloudStatus === 'connected' ? 'SUPABASE LIBRARY' : 'LOCAL LIBRARY'}</span></div><p className="sdui-muted">Schemas saved in Supabase are available here for preview and loading into Builder.</p><div className="sdui-template-grid">{Object.keys(templates).map((template) => <button key={template} className={`sdui-template ${selectedTemplate === template ? 'selected' : ''}`} onClick={() => { setSelectedTemplate(template); setLoadedTree(null); setSchema(templates[template]) }}><span>◇</span><strong>{template}</strong><small>built-in template</small></button>)}{savedSchemas.map((saved) => <button key={saved.id || saved.name} className="sdui-template saved-template" onClick={() => loadSavedSchema(saved)}><span>☁</span><strong>{saved.name}</strong><small>saved schema · Preview / Load</small></button>)}</div>{selectedTemplate && <div className="template-output"><div className="sdui-card-title">{selectedTemplate}<button className="sdui-quiet" onClick={() => copy(schema, 'Template copied')}>Copy</button><button className="sdui-quiet" onClick={() => download(schema, 'sdui-template.json')}>Download</button></div><pre>{schema}</pre></div>}</section>}

      {activeTab === 'guide' && <section className="sdui-card sdui-wide-card"><span className="sdui-kicker">Documentation</span><h2>Build once, render natively</h2><p className="sdui-muted">Use the Builder to compose a component tree, then inspect the JSON schema before sending it to the native renderer.</p><div className="sdui-steps"><div><b>01</b><strong>Compose</strong><span>Choose nested containers and content components.</span></div><div><b>02</b><strong>Inspect</strong><span>Validate properties and preview the result.</span></div><div><b>03</b><strong>Ship</strong><span>Export the schema for your integration.</span></div></div></section>}
      {activeTab === 'builder' && <BuilderInspector node={selectedBuilderNode} onField={setBuilderField} onStyle={setBuilderStyle} onProperty={setBuilderProperty} onApplyToSiblings={applySelectedStyleToSiblings} />}
    </main>
  )
}
