import { ChangeEvent, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import '../styles/sdui.scss'
import { useSearchParams } from 'react-router-dom'
import SDUIIcon from '../components/SDUIIcon'
import { createSDUITemplate, deleteSDUITemplate, getSDUITemplate, updateSDUITemplate, useSDUITemplates, templateKey, TEMPLATE_CHANGED_EVENT, type SavedSchema } from '../hooks/useSDUITemplates'
import API_BASE_URL from '../config/api'

interface BuilderNode { source?: any; id: number; type: string; name: string; value?: string; url?: string; title?: string; buttonType?: string; ctaType?: string; iconLeft?: string; iconRight?: string; layout?: string; spacing?: number; padding?: any; radius?: number; bg?: string; width?: number; height?: number; border?: { width?: number; color?: string }; alignment?: string; textAlignment?: string; contentMode?: string; fillMaxWidth?: boolean; fillMaxHeight?: boolean; weight?: number; nativeStyle?: any; nativeProperty?: any; children?: BuilderNode[] }

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
  const result: CSSProperties = {}
  if (box.backgroundColor) result.backgroundColor = box.backgroundColor
  if (box.cornerRadius != null) result.borderRadius = box.cornerRadius
  if (box.border && (box.border.width != null || box.border.color)) result.border = `${box.border.width ?? 1}px solid ${box.border.color || '#e0e0e0'}`
  if (box.width != null && box.width !== '') result.width = box.width
  if (box.height != null && box.height !== '') result.height = box.height
  if (padding != null) {
    result.padding = typeof padding === 'number'
      ? padding
      : padding.all != null
        ? padding.all
        : `${padding.top ?? padding.vertical ?? 0}px ${padding.right ?? padding.horizontal ?? 0}px ${padding.bottom ?? padding.vertical ?? 0}px ${padding.left ?? padding.horizontal ?? 0}px`
  }
  return result
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
  if (node.type === 'image') return <img key={key} className="schema-preview-image" src={node.url || (typeof node.value === 'string' && /^(https?:|data:|\/\/)/i.test(node.value) ? node.value : '/assets/widget/template_image.png')} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/assets/widget/template_image.png' }} alt="" style={{ width: node.width || style.width || 48, height: node.height || style.height || 48, aspectRatio: property.aspectRatio, objectFit: (node.contentMode || property.contentMode) === 'fill' ? 'cover' : (node.contentMode || property.contentMode) === 'center' ? 'none' : 'contain', background: property.tintColor || '#eee', flexShrink: 0, ...boxStyle({ ...style, width: node.width ?? style.width, height: node.height ?? style.height, border: style.border || node.border }) }} />
  if (node.type === 'button') return <PreviewButton key={key} title={node.title || value.title || 'Button'} type={node.buttonType || value.type || property.type || 'primary'} style={{ ...property, ...style }} iconLeft={node.iconLeft || value.iconLeft} iconRight={node.iconRight || value.iconRight} />
  if (node.type === 'tag') return <PreviewTag key={key} value={typeof node.value === 'string' ? node.value : 'TAG'} type={property.tagType} style={property} />
  if (node.type === 'spacer') return <div key={key} style={{ flex: 1, minWidth: property.minLength, minHeight: property.minLength }} />
  return null
}

function PreviewButton({ title, type, style, iconLeft, iconRight }: { title: string; type: string; style?: any; iconLeft?: string; iconRight?: string }) {
  const colors: Record<string, CSSProperties> = { primary: { background: '#a50064', color: '#fff', borderColor: '#a50064' }, secondary: { background: '#f0f0f3', color: '#333', borderColor: '#f0f0f3' }, tonal: { background: '#fce4f1', color: '#a50064', borderColor: '#fce4f1' }, outline: { background: 'transparent', color: style?.color || '#a50064', borderColor: style?.color || '#a50064' }, danger: { background: '#e53935', color: '#fff', borderColor: '#e53935' }, text: { background: 'transparent', color: style?.color || '#a50064', borderColor: 'transparent' }, disabled: { background: '#eaeaea', color: '#aaa', borderColor: '#eaeaea' } }
  return <button disabled={type === 'disabled'} className="schema-preview-button" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid transparent', flexShrink: 0, ...(colors[type] || colors.primary) }}>{iconLeft && <img src={iconLeft} alt="" width="14" height="14" />}{title}{iconRight && <img src={iconRight} alt="" width="14" height="14" />}</button>
}

function PreviewTag({ value, type, style }: { value: string; type?: string; style?: any }) {
  const colors: Record<string, CSSProperties> = { info: { background: '#e3f2fd', color: '#1565c0' }, success: { background: '#e6f7ed', color: '#1b873f' }, error: { background: '#fdecea', color: '#c62828' }, warning: { background: '#fff3e0', color: '#e65100' }, highlight: { background: '#fde7f1', color: '#a50064' } }
  return <span className="schema-preview-tag" style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, alignSelf: 'flex-start', ...colors[type || 'highlight'], ...(style?.backgroundColor ? { background: style.backgroundColor } : {}), ...(style?.textColor ? { color: style.textColor } : {}) }}>{value}</span>
}

let activePreviewLink: { selectedNodeId?: number; onSelect?: (id: number) => void } = {}

function PreviewNode({ node, selectedNodeId, onSelect }: { node: any; selectedNodeId?: number; onSelect?: (id: number) => void }) {
  return <>{renderPreviewNode(unwrapSchema(node), 'preview-root', selectedNodeId ?? activePreviewLink.selectedNodeId, onSelect || activePreviewLink.onSelect)}</>
}

function SchemaTreeNode({ node, selected, onSelect }: { node: BuilderNode; selected: number; onSelect: (id: number) => void }) {
  const description = node.type === 'text' ? node.value : node.type === 'button' ? node.title : node.type === 'image' ? node.url : node.layout
  const dimensions = node.width || node.height ? `${node.width || 'auto'} × ${node.height || 'auto'}` : ''
  return <div className="generated-tree-node">
    <button className={`generated-tree-row ${selected === node.id ? 'selected' : ''}`} onClick={() => onSelect(node.id)}>
      <span className={`generated-tree-type type-${node.type}`}>{node.type === 'container' ? '▦' : node.type === 'text' ? 'T' : node.type === 'image' ? '▧' : node.type === 'button' ? '▣' : '·'}</span>
      <span className="generated-tree-label"><strong>{node.name}</strong><small>{node.type}</small></span>
      {description && <code title={description}>{description}</code>}
      {dimensions && <span className="generated-tree-chip">{dimensions}</span>}
      {node.children && <span className="generated-tree-count">{node.children.length}</span>}
    </button>
    {node.children && node.children.length > 0 && <div className="generated-tree-children">{node.children.map(child => <SchemaTreeNode key={child.id} node={child} selected={selected} onSelect={onSelect} />)}</div>}
  </div>
}

const countBuilderNodes = (node: BuilderNode): number => 1 + (node.children || []).reduce((total, child) => total + countBuilderNodes(child), 0)

function normalizeBuilderTree(tree: any): BuilderNode | null {
  const root = unwrapSchema(tree)
  if (!root || typeof root !== 'object' || !['container', 'text', 'image', 'button', 'tag', 'spacer'].includes(root.type)) return null
  let nextId = 1
  const convert = (node: any): BuilderNode => {
    if (!node || typeof node !== 'object' || !['container', 'text', 'image', 'button', 'tag', 'spacer'].includes(node.type)) throw new Error('Unsupported component')
    const value = node.value && typeof node.value === 'object' ? node.value : {}
    const id = nextId++
    return { source: node.source || node, id, type: node.type || 'text', name: node.name || node.property?.id || (typeof node.value === 'string' ? node.value : `${node.type || 'component'}_${id}`), value: typeof node.value === 'string' ? node.value : undefined, url: node.url || (node.type === 'image' && typeof node.value === 'string' ? node.value : undefined), title: node.title || value.title || node.property?.title, buttonType: node.buttonType || value.type || node.property?.type, ctaType: node.ctaType || node.property?.ctaType, iconLeft: node.iconLeft || value.iconLeft, iconRight: node.iconRight || value.iconRight, layout: node.layout || node.property?.layout, spacing: node.spacing ?? node.property?.spacing, padding: node.padding ?? node.style?.padding, radius: node.radius ?? node.style?.cornerRadius, bg: node.bg || node.style?.backgroundColor, width: node.width ?? node.style?.width, height: node.height ?? node.style?.height, border: node.border || node.style?.border, alignment: node.alignment || node.property?.alignment, textAlignment: node.textAlignment || node.property?.textAlignment, contentMode: node.contentMode || node.property?.contentMode, fillMaxWidth: node.fillMaxWidth ?? node.style?.fillMaxWidth ?? node.modifier?.fillMaxWidth, fillMaxHeight: node.fillMaxHeight ?? node.style?.fillMaxHeight ?? node.modifier?.fillMaxHeight, weight: node.weight ?? node.modifier?.weight, nativeStyle: node.nativeStyle || node.style || {}, nativeProperty: node.nativeProperty || node.property || {}, children: node.type === 'container' ? (node.children || value.children || []).map(convert) : undefined }
  }
  try { return convert(root) } catch { return null }
}

function BuilderInspector({ node, onField, onStyle, onProperty, onApplyToAll }: { node: BuilderNode; onField: (key: keyof BuilderNode, value: string) => void; onStyle: (key: string, value: string) => void; onProperty: (key: string, value: string) => void; onApplyToAll: () => void }) {
  const style = node.nativeStyle || {}
  const property = node.nativeProperty || {}
  const applyAllControl = <button className="inspector-apply-button" onClick={onApplyToAll}>Apply appearance to all {node.type}s</button>
  const input = (label: string, key: keyof BuilderNode, value: string | number = '') => <><label className="sdui-label">{label}<input value={value} onChange={(event) => onField(key, event.target.value)} /></label>{node.type === 'image' && label === 'Corner radius' && applyAllControl}</>
  const styleInput = (label: string, key: string, value: string | number = '') => <label className="sdui-label">{label}<input value={value} onChange={(event) => onStyle(key, event.target.value)} /></label>
  const propertyInput = (label: string, key: string, value: string | number = '') => <><label className="sdui-label">{label}<input value={value} onChange={(event) => onProperty(key, event.target.value)} /></label>{((node.type === 'tag' && label === 'Icon URL') || (node.type === 'spacer' && label === 'Minimum length')) && applyAllControl}</>
  const propertySelect = (label: string, key: string, value: string, options: string[]) => <><label className="sdui-label">{label}<select value={value} onChange={(event) => onProperty(key, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option || 'Default'}</option>)}</select></label>{node.type === 'text' && label === 'Text alignment' && applyAllControl}</>
  const onApplyToSiblings = onApplyToAll
  const onApplyToAllButtons = onApplyToAll

  return <aside className="sdui-card figma-inspector-dock"><div className="sdui-card-title">Inspector <span>{node.type.toUpperCase()}</span></div>{input('Layer name', 'name', node.name)}{node.type === 'container' && <><label className="sdui-label">Background color<div className="inspector-color-row"><input className="inspector-color" type="color" value={/^#[0-9a-f]{6}$/i.test(node.bg || style.backgroundColor || '') ? (node.bg || style.backgroundColor) : '#ffffff'} onChange={(event) => onStyle('backgroundColor', event.target.value)} /><input value={node.bg || style.backgroundColor || ''} onChange={(event) => onStyle('backgroundColor', event.target.value)} placeholder="#FFFFFF" /></div></label><label className="sdui-label">Layout<select className="inspector-select" value={node.layout || property.layout || 'column'} onChange={(event) => onField('layout', event.target.value)}><option value="column">Vertical / Column</option><option value="row">Horizontal / Row</option><option value="scrollRow">Horizontal scroll</option><option value="scrollColumn">Vertical scroll</option></select></label>{input('Spacing', 'spacing', node.spacing ?? property.spacing ?? 0)}{input('Padding', 'padding', typeof node.padding === 'number' ? node.padding : node.padding?.all ?? 0)}{input('Width', 'width', node.width ?? style.width ?? '')}{input('Height', 'height', node.height ?? style.height ?? '')}{input('Corner radius', 'radius', node.radius ?? style.cornerRadius ?? 0)}{styleInput('Border color', 'border.color', style.border?.color || '')}{styleInput('Border width', 'border.width', style.border?.width || 0)}{propertySelect('Alignment', 'alignment', node.alignment || property.alignment || '', ['', 'leading', 'center', 'trailing', 'left', 'right', 'top', 'bottom'])}<button className="inspector-apply-button" onClick={onApplyToSiblings}>Apply appearance to all containers</button></>}{node.type === 'text' && <>{<label className="sdui-label">Text content<textarea value={node.value || ''} onChange={(event) => onField('value', event.target.value)} /></label>}{propertySelect('Typography', 'typography', property.typography || '', ['', 'labelXsMedium', 'labelSMedium', 'headerXsSemibold', 'headerSSemibold', 'headerDefaultBold', 'descriptionXsRegular', 'descriptionDefaultRegular', 'actionSBold'])}{propertyInput('Text color', 'color', property.color || '')}{propertyInput('Line limit', 'lineLimit', property.lineLimit || '')}{propertySelect('Text alignment', 'textAlignment', property.textAlignment || '', ['', 'leading', 'center', 'trailing'])}</>}{node.type === 'image' && <>{input('Image URL', 'url', node.url || '')}{propertySelect('Content mode', 'contentMode', node.contentMode || property.contentMode || 'fit', ['fit', 'fill', 'center'])}{propertyInput('Tint color', 'tintColor', property.tintColor || '')}{propertyInput('Aspect ratio', 'aspectRatio', property.aspectRatio || '')}{input('Width', 'width', node.width ?? style.width ?? '')}{input('Height', 'height', node.height ?? style.height ?? '')}{input('Corner radius', 'radius', node.radius ?? property.cornerRadius ?? style.cornerRadius ?? 0)}</>}{node.type === 'button' && <>{input('Button title', 'title', node.title || '')}<label className="sdui-label">Button type<select value={node.buttonType || 'primary'} onChange={(event) => onField('buttonType', event.target.value)}>{['primary', 'secondary', 'tonal', 'outline', 'danger', 'text', 'disabled'].map(type => <option key={type} value={type}>{type}</option>)}</select></label>{propertySelect('CTA type', 'ctaType', node.ctaType || property.ctaType || 'BUTTON', ['BUTTON', 'TOGGLE', 'ICON'])}{propertyInput('Button color', 'color', property.color || '')}{input('Left icon URL', 'iconLeft', node.iconLeft || '')}{input('Right icon URL', 'iconRight', node.iconRight || '')}{propertyInput('Action type', 'actionType', property.actionType || '')}{propertyInput('Feature code', 'actions.0.featureCode', property.actions?.[0]?.featureCode || '')}<button className="inspector-apply-button" onClick={onApplyToAllButtons}>Apply appearance to all buttons</button></>}{node.type === 'tag' && <>{input('Tag value', 'value', node.value || '')}{propertySelect('Tag type', 'tagType', property.tagType || 'highlight', ['info', 'success', 'error', 'warning', 'highlight'])}{propertyInput('Tag background', 'backgroundColor', property.backgroundColor || '')}{propertyInput('Tag text color', 'textColor', property.textColor || '')}{propertyInput('Icon URL', 'iconUrl', property.iconUrl || '')}</>}{node.type === 'spacer' && propertyInput('Minimum length', 'minLength', property.minLength || 0)}</aside>
}

export default function SDUIPage() {
  const [activeTab, setActiveTab] = useState<'builder' | 'templates'>('templates')
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
  const [previewWidth, setPreviewWidth] = useState(480)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showQr, setShowQr] = useState(false)
  const [qrGenerating, setQrGenerating] = useState(false)

  const copy = async (value: string, label: string) => {
    try { await navigator.clipboard.writeText(value); setStatus(label) }
    catch { setStatus('Could not copy. Download the JSON instead.') }
  }
  const download = (value: string, name: string) => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([value], { type: 'application/json' }))
    link.download = name; link.click(); URL.revokeObjectURL(link.href)
    setStatus('JSON downloaded')
  }
  const findBuilderNode = (node: BuilderNode, id: number): BuilderNode | null => node.id === id ? node : (node.children || []).reduce<BuilderNode | null>((found, child) => found || findBuilderNode(child, id), null)
  const updateBuilderTree = (node: BuilderNode, id: number, update: (target: BuilderNode) => BuilderNode): BuilderNode => node.id === id ? update(node) : { ...node, children: node.children?.map((child) => updateBuilderTree(child, id, update)) }
  const toSchemaNode = (node: BuilderNode): any => ({ ...(node.source || {}), type: node.type, style: { ...(node.nativeStyle || {}), ...(node.bg ? { backgroundColor: node.bg } : {}), ...(node.padding != null ? { padding: typeof node.padding === 'number' ? { all: node.padding } : node.padding } : {}), ...(node.radius != null ? { cornerRadius: node.radius } : {}), ...(node.width != null ? { width: node.width } : {}), ...(node.height != null ? { height: node.height } : {}), ...(node.border ? { border: node.border } : {}), ...(node.fillMaxWidth ? { fillMaxWidth: true } : {}), ...(node.fillMaxHeight ? { fillMaxHeight: true } : {}) }, property: { ...(node.nativeProperty || {}), ...(node.layout ? { layout: node.layout } : {}), ...(node.spacing != null ? { spacing: node.spacing } : {}), ...(node.alignment ? { alignment: node.alignment } : {}), ...(node.textAlignment ? { textAlignment: node.textAlignment } : {}), ...(node.contentMode ? { contentMode: node.contentMode } : {}), ...(node.type === 'button' ? { type: undefined, ctaType: node.ctaType || node.nativeProperty?.ctaType || 'BUTTON' } : {}), id: node.name }, modifier: { ...(node.source?.modifier || {}), ...(node.weight != null ? { weight: node.weight } : {}) }, value: node.type === 'container' ? { ...(node.source?.value && typeof node.source.value === 'object' ? node.source.value : {}), children: (node.children || []).map(toSchemaNode) } : node.type === 'image' ? node.url || '' : node.type === 'button' ? { ...(node.source?.value && typeof node.source.value === 'object' ? node.source.value : {}), title: node.title || 'Button', type: node.buttonType || 'primary', ...(node.iconLeft ? { iconLeft: node.iconLeft } : {}), ...(node.iconRight ? { iconRight: node.iconRight } : {}) } : node.value || '' })
  const generatedSchema = { type: 'template_widget', templateType: 'SDUI_WIDGET', data: [toSchemaNode(builderRoot)] }
  const builderSchema = JSON.stringify(generatedSchema, null, 2)
  const templateJsonUrl = editingSchema?.id
    ? `${API_BASE_URL.replace(/\/+$/, '')}/cornerstone-package/sdui/templates/${encodeURIComponent(editingSchema.id)}/json`
    : ''
  const generateQr = async () => {
    if (!templateJsonUrl) { setStatus('Save this template before generating its QR code.'); return }
    if (dirty) { setStatus('Save your changes first so the QR opens the latest JSON.'); return }
    setQrGenerating(true)
    try {
      const { default: QRCode } = await import('qrcode')
      setQrDataUrl(await QRCode.toDataURL(templateJsonUrl, { width: 420, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#111827', light: '#FFFFFF' } }))
      setShowQr(true)
    } catch { setStatus('Could not generate QR code.') }
    finally { setQrGenerating(false) }
  }
  const downloadQr = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `${schemaName.trim().replace(/[^a-z0-9_-]+/gi, '-') || 'sdui-template'}-qr.png`
    link.click()
  }
  const copyBuilderSchema = () => { setBuilderJsonInput(builderSchema); copy(builderSchema, 'Builder JSON copied') }
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
    if (findBuilderNode(builderRoot, parentId)?.type !== 'container') return
    const child: BuilderNode = { id: Date.now(), type, name: `${type}_${Date.now().toString().slice(-4)}`, value: type === 'text' ? 'New text' : undefined, title: type === 'button' ? 'Button' : undefined, buttonType: type === 'button' ? 'primary' : undefined, ctaType: type === 'button' ? 'BUTTON' : undefined, nativeProperty: type === 'button' ? { ctaType: 'BUTTON' } : {}, children: type === 'container' ? [] : undefined }
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
      if (path.startsWith('actions.') && !nextRoot.actions) nextRoot.actions = [{}]
      let target = nextRoot
      keys.slice(0, -1).forEach((key) => { target[key] = Array.isArray(target[key]) ? [...target[key]] : { ...(target[key] || {}) }; target = target[key] })
      const lastKey = keys[keys.length - 1]
      target[lastKey] = /^(-?\d+(\.\d+)?)$/.test(value) ? Number(value) : value
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
  const applySelectedAppearanceToAll = () => {
    const source = findBuilderNode(builderRoot, selectedNode)
    if (!source) return
    const fieldKeys: Record<string, (keyof BuilderNode)[]> = {
      container: ['layout', 'spacing', 'padding', 'radius', 'bg', 'width', 'height', 'border', 'alignment', 'fillMaxWidth', 'fillMaxHeight', 'weight'],
      text: ['textAlignment'], image: ['width', 'height', 'radius', 'contentMode'],
      button: ['buttonType', 'ctaType'], tag: [], spacer: [],
    }
    const propertyKeys: Record<string, string[]> = {
      container: ['layout', 'spacing', 'alignment', 'arrangement'], text: ['typography', 'color', 'lineLimit', 'textAlignment'],
      image: ['contentMode', 'tintColor', 'aspectRatio', 'cornerRadius'], button: ['color', 'ctaType'],
      tag: ['tagType', 'backgroundColor', 'textColor'], spacer: ['minLength'],
    }
    const copyAppearance = (target: BuilderNode): BuilderNode => {
      if (target.type !== source.type || target.id === source.id) return target
      const nextProperty = { ...(target.nativeProperty || {}) }
      for (const key of propertyKeys[source.type] || []) {
        if (source.nativeProperty?.[key] === undefined) delete nextProperty[key]
        else nextProperty[key] = structuredClone(source.nativeProperty[key])
      }
      return { ...target, ...Object.fromEntries((fieldKeys[source.type] || []).map(key => [key, structuredClone(source[key])])), nativeStyle: structuredClone(source.nativeStyle || {}), nativeProperty: nextProperty }
    }
    let affected = 0
    const apply = (node: BuilderNode): BuilderNode => {
      if (node.type === source.type && node.id !== source.id) affected++
      const updated = copyAppearance(node)
      return { ...updated, children: updated.children?.map(apply) }
    }
    setNativePreviewJson(null)
    setBuilderRoot(current => apply(current))
    setStatus(affected ? `Applied appearance to ${affected} other ${source.type}${affected === 1 ? '' : 's'}.` : `No other ${source.type} components found.`)
  }
  const selectBuilderNode = (id: number) => { setSelectedNode(id); requestAnimationFrame(() => document.querySelector(`[data-tree-node-id="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })) }
  const renderBuilderTree = (node: BuilderNode, depth = 0): ReactNode => <div key={node.id} className="figma-tree-branch"><div data-tree-node-id={node.id} className={`figma-tree-row ${selectedNode === node.id ? 'selected' : ''}`} style={{ paddingLeft: `${10 + depth * 18}px` }} onClick={() => selectBuilderNode(node.id)}><button className="figma-tree-chevron" onClick={(event) => { event.stopPropagation(); setExpandedNodes((current) => { const next = new Set(current); next.has(node.id) ? next.delete(node.id) : next.add(node.id); return next }) }}>{node.children?.length ? (expandedNodes.has(node.id) ? '▾' : '▸') : '·'}</button><span className={`figma-tree-icon type-${node.type}`}>{node.type === 'container' ? '▦' : node.type === 'text' ? 'T' : node.type === 'image' ? '▧' : node.type === 'button' ? '▣' : '·'}</span><strong>{node.name}</strong><small>{node.type}</small>{node.id !== builderRoot.id && <button className="figma-tree-delete" onClick={(event) => { event.stopPropagation(); removeBuilderNode(node.id) }}>×</button>}</div>{expandedNodes.has(node.id) && node.children?.map((child) => renderBuilderTree(child, depth + 1))}</div>

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
  activePreviewLink = { selectedNodeId: selectedNode, onSelect: selectBuilderNode }

  return (
    <main className="sdui-page">
      <header className="sdui-header">
        <div><a className="sdui-kicker" href="/">← Cornerstone</a><h1>Server-driven UI</h1><p>Create, edit and manage your native UI schemas.</p></div>
        <div className="sdui-pills"><span className="sdui-pill">{cloudStatus === 'connected' ? 'Templates API connected' : cloudStatus === 'loading' ? 'Loading API…' : 'Templates API unavailable'}</span><span className="sdui-pill sdui-pill-muted">{savedSchemas.length} schemas</span></div>
      </header>
      <nav className="sdui-tabs" aria-label="SDUI workspace">
        <button className={activeTab === 'templates' ? 'active' : ''} onClick={() => setActiveTab('templates')}>Schema library</button>
        <button className={activeTab === 'builder' ? 'active' : ''} onClick={() => setActiveTab('builder')}>Editor {dirty && baseline ? '•' : ''}</button>
      </nav>
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
            <div className="figma-add-row"><select id="builder-type" aria-label="Component type" defaultValue="text"><option value="container">Container</option><option value="text">Text</option><option value="image">Image</option><option value="button">Button</option><option value="spacer">Spacer</option></select><button className="sdui-primary" disabled={selectedBuilderNode.type !== 'container'} onClick={() => addBuilderChild(selectedNode, (document.getElementById('builder-type') as HTMLSelectElement).value)}>+ Add</button></div><p className="sdui-muted">Select a container to add a component inside it.</p>
          </section>
          <div className="sdui-editor-main">
            <section className="sdui-card figma-canvas-panel">
              <div className="sdui-card-title">Preview <span>UPDATES AS YOU EDIT</span><label className="preview-size-control">Canvas<select value={previewWidth} onChange={event => setPreviewWidth(Number(event.target.value))}><option value={360}>Compact</option><option value={480}>Regular</option><option value={640}>Wide</option></select></label></div>
              <div className="sdui-preview figma-canvas"><div className="preview-viewport" style={{ width: previewWidth }}><PreviewNode node={builderRoot} /></div></div>
              <p className="native-preview-hint">Click a component to edit its properties. Visual fields update here immediately; actions and feature codes are reflected in Generated schema.</p>
            </section>
            <section className="sdui-card sdui-generated-panel">
              <div className="sdui-generated-header"><div><div className="sdui-card-title">Generated schema <span>LIVE OUTPUT</span></div><p className="sdui-muted">Inspector changes are serialized here before saving.</p></div><div className="preview-actions"><button className="sdui-quiet" onClick={copyBuilderSchema}>Copy</button><button className="sdui-quiet" onClick={() => download(builderSchema, 'sdui-schema.json')}>Download</button><button className="sdui-quiet" disabled={!editingSchema?.id || dirty || qrGenerating} title={!editingSchema?.id ? 'Save the template first' : dirty ? 'Save changes before generating QR' : 'Generate QR for the JSON endpoint'} onClick={() => void generateQr()}>{qrGenerating ? 'Generating…' : 'QR code'}</button><button className="sdui-native-export" onClick={downloadNativeMockData}>Export Native</button></div></div>
              <div className="sdui-output-tabs" role="tablist" aria-label="Generated schema format"><button role="tab" aria-selected={outputView === 'tree'} className={outputView === 'tree' ? 'active' : ''} onClick={() => setOutputView('tree')}>Component tree</button><button role="tab" aria-selected={outputView === 'json'} className={outputView === 'json' ? 'active' : ''} onClick={() => setOutputView('json')}>Raw JSON</button></div>
              {outputView === 'tree' ? <div className="schema-component-tree"><div className="schema-tree-meta"><span>template_widget</span><span>SDUI_WIDGET</span><span>{countBuilderNodes(builderRoot)} components</span></div><SchemaTreeNode node={builderRoot} selected={selectedNode} onSelect={selectBuilderNode} /></div> : <pre className="builder-schema builder-schema-expanded">{builderSchema}</pre>}
            </section>
          </div>
          <BuilderInspector node={selectedBuilderNode} onField={setBuilderField} onStyle={setBuilderStyle} onProperty={setBuilderProperty} onApplyToAll={applySelectedAppearanceToAll} />
        </fieldset>
      </>}
      {showQr && <div className="sdui-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowQr(false) }}><section className="sdui-qr-modal" role="dialog" aria-modal="true" aria-labelledby="sdui-qr-title"><button className="sdui-modal-close" aria-label="Close QR dialog" onClick={() => setShowQr(false)}>×</button><div><span className="sdui-kicker">Live template JSON</span><h2 id="sdui-qr-title">{schemaName}</h2><p>Scan to open the latest saved SDUI JSON from the Templates API.</p></div><div className="sdui-qr-image">{qrDataUrl && <img src={qrDataUrl} alt={`QR code for ${schemaName}`} />}</div><code className="sdui-qr-url">{templateJsonUrl}</code><div className="sdui-qr-actions"><button className="sdui-quiet" onClick={() => void copy(templateJsonUrl, 'QR URL copied')}>Copy URL</button><button className="sdui-primary" onClick={downloadQr}>Download PNG</button></div></section></div>}
    </main>
  )
}
