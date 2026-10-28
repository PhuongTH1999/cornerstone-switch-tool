import { buildMiniAppUrl, DEFAULT_MINI_APP_URL } from '../lib/miniAppUrl'
import { resolveExportAssets } from '../lib/exportAssets'
import { copyText } from '../lib/clipboard'
import { resolveSDUIDesignTokens } from '../lib/designTokens'
import { applyDynamicFields, buildDynamicFields, contentPath, duplicateVariables, findDynamicFields, indexesOf } from '../lib/dynamicFields'
import { ancestorIds } from '../lib/builderTree'
import { allOfType, applyStyleTo, captureStyleTree, sameItemInList, siblingsOf, type StyleTree } from '../lib/builderStyle'
import FigmaMigration from '../components/FigmaMigration'
import SDUIDocumentation from '../components/SDUIDocumentation'
import SDUIPreview from '../renderers/sdui/preview/SDUIPreview'
import { lint } from '../renderers/sdui/preview/lint'
import BuilderInspector from '../components/BuilderInspector'
import LayersPanel from '../components/LayersPanel'
import { PARENT_TYPES, setProperty, setStyle, setValueKey, toSchemaNode, type BuilderNode } from '../lib/builderNode'
import { createHistory, record, redo, undo, type History } from '../lib/history'
import VelocityTemplatePanel from '../components/VelocityTemplatePanel'
import { SDUI_TYPES } from '../renderers/sdui/preview/types'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import '../styles/sdui.scss'
import { useSearchParams } from 'react-router-dom'
import SDUIIcon from '../components/SDUIIcon'
import { createSDUITemplate, deleteSDUITemplate, getSDUITemplate, updateSDUITemplate, useSDUITemplates, templateKey, TEMPLATE_CHANGED_EVENT, type SavedSchema } from '../hooks/useSDUITemplates'
import API_BASE_URL from '../config/api'



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

type SDUITab = 'builder' | 'templates' | 'document' | 'migration'
const SDUI_TABS: { id: SDUITab; label: string; icon: 'library' | 'editor' | 'document' | 'figma' }[] = [
  { id: 'templates', label: 'Schema library', icon: 'library' },
  { id: 'builder', label: 'Editor', icon: 'editor' },
  { id: 'document', label: 'Document', icon: 'document' },
  { id: 'migration', label: 'Figma migration', icon: 'figma' },
]

// ARIA tabs pattern: arrow keys / Home / End move between tabs and select them.
function moveTabFocus(event: React.KeyboardEvent<HTMLElement>) {
  const tabs = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
  const index = tabs.indexOf(document.activeElement as HTMLButtonElement)
  if (index < 0) return
  const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key]
  if (next === undefined) return
  event.preventDefault()
  const target = tabs[(next + tabs.length) % tabs.length]
  target.focus(); target.click()
}

const countNodes = (node: BuilderNode): number => 1 + (node.children || []).reduce((total, child) => total + countNodes(child), 0)

function normalizeBuilderTree(tree: any): BuilderNode | null {
  const root = unwrapSchema(resolveSDUIDesignTokens(tree))
  if (!root || typeof root !== 'object' || !(SDUI_TYPES as readonly string[]).includes(root.type)) return null
  let nextId = 1
  // Children with an unknown type are kept as-is so their JSON survives a round trip; the preview and lint show they are not drawn.
  const convert = (node: any): BuilderNode => {
    if (!node || typeof node !== 'object') throw new Error('Unsupported component')
    const value = node.value && typeof node.value === 'object' ? node.value : {}
    const id = nextId++
    return { source: node.source || node, id, type: node.type || 'text', name: node.name || node.property?.id || (typeof node.value === 'string' ? node.value : `${node.type || 'component'}_${id}`), value: typeof node.value === 'string' ? node.value : undefined, url: node.url || (node.type === 'image' && typeof node.value === 'string' ? node.value : undefined), title: node.title || value.title || node.property?.title, buttonType: node.buttonType || value.type || node.property?.type, ctaType: node.ctaType || node.property?.ctaType, iconLeft: node.iconLeft || value.iconLeft, iconRight: node.iconRight || value.iconRight, layout: node.layout || node.property?.layout, spacing: node.spacing ?? node.property?.spacing, padding: node.padding ?? node.style?.padding, radius: node.radius ?? node.style?.cornerRadius, bg: node.bg || node.style?.backgroundColor, width: node.width ?? node.style?.width, height: node.height ?? node.style?.height, border: node.border || node.style?.border, alignment: node.alignment || node.property?.alignment, textAlignment: node.textAlignment || node.property?.textAlignment, contentMode: node.contentMode || node.property?.contentMode, fillMaxWidth: node.fillMaxWidth ?? node.style?.fillMaxWidth ?? node.modifier?.fillMaxWidth, fillMaxHeight: node.fillMaxHeight ?? node.style?.fillMaxHeight ?? node.modifier?.fillMaxHeight, weight: node.weight ?? node.modifier?.weight, nativeStyle: node.nativeStyle || node.style || {}, nativeProperty: node.nativeProperty || node.property || {}, nativeValue: node.type === 'progressBar' ? node.nativeValue || value : undefined, onTap: node.onTap, trackTypes: node.trackTypes, expireTime: node.expireTime ?? node.expire_time, children: PARENT_TYPES.includes(node.type) ? (node.children || value.children || []).map(convert) : undefined }
  }
  try { return applyDynamicFields(convert(root), findDynamicFields(tree)).root } catch { return null }
}

export default function SDUIPage() {
  const [activeTab, setActiveTab] = useState<SDUITab>('templates')
  const [status, setStatus] = useState('')
  useEffect(() => {
    if (!status || status.endsWith('…') || /lỗi|error|cannot|could not|không/i.test(status)) return
    const timer = window.setTimeout(() => setStatus(''), 6000)
    return () => window.clearTimeout(timer)
  }, [status])
  const [schemaName, setSchemaName] = useState('Untitled schema')
  const [editingSchema, setEditingSchema] = useState<SavedSchema | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [baseline, setBaseline] = useState('')
  const savingRef = useRef(false)
  const [history, setHistory] = useState<History<BuilderNode>>(() => createHistory(initialBuilderTree))
  const builderRoot = history.present
  /** Every tree edit goes through here (undoable). `mergeKey` merges a burst of typing in one field into one step. */
  const setBuilderRoot = (update: BuilderNode | ((current: BuilderNode) => BuilderNode), mergeKey?: string) =>
    setHistory(current => record(current, typeof update === 'function' ? update(current.present) : update, Date.now(), mergeKey))
  /** Loading another template starts a new history. */
  const resetBuilderRoot = (tree: BuilderNode) => setHistory(createHistory(tree))
  const stepHistory = (direction: 'undo' | 'redo') => {
    setNativePreviewJson(null)
    setHistory(current => direction === 'undo' ? undo(current) : redo(current))
  }
  useEffect(() => {
    // Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z, Ctrl+Y on the editor. Inside a text field the browser's own text undo is kept.
    const onKey = (event: KeyboardEvent) => {
      if (activeTab !== 'builder' || !(event.metaKey || event.ctrlKey)) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      const key = event.key.toLowerCase()
      if (key === 'z') { event.preventDefault(); stepHistory(event.shiftKey ? 'redo' : 'undo') }
      else if (key === 'y') { event.preventDefault(); stepHistory('redo') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTab])
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
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showQr, setShowQr] = useState(false)
  const [qrGenerating, setQrGenerating] = useState(false)
  const [styleClipboard, setStyleClipboard] = useState<{ tree: StyleTree; from: string } | null>(null)
  const [styleDeep, setStyleDeep] = useState(true)
  // rendered_json from BE shown in the preview instead of the editor JSON (null = editor JSON).
  const [renderedPreview, setRenderedPreview] = useState<unknown | null>(null)
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
  // Content nodes bound to a BE data key; the path points into this exported JSON.
  const dynamicFields = buildDynamicFields(builderRoot)
  const generatedSchema = resolveExportAssets({ type: 'template_widget', templateType: 'SDUI_WIDGET', dynamic_fields: dynamicFields, data: [toSchemaNode(builderRoot)] }, import.meta.env.VITE_PUBLIC_ASSET_URL || window.location.origin)
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
    let parsed: unknown
    try { parsed = JSON.parse(builderJsonInput) } catch { setStatus('JSON không hợp lệ — kiểm tra cú pháp.'); return }
    const imported = normalizeBuilderTree(parsed)
    if (!imported) { setStatus('Import cần một cây SDUI hợp lệ (node, template_widget hoặc dataSchema).'); return }
    if (!window.confirm('Thay toàn bộ layer hiện tại bằng JSON này? Có thể hoàn tác bằng Undo (Ctrl/⌘ Z).')) return
    // Recorded as one undo step (not a new history), so a wrong paste can be undone.
    setNativePreviewJson(Array.isArray(parsed) ? parsed : [parsed]); setBuilderRoot(imported)
    setSelectedNode(imported.id); setExpandedNodes(new Set([imported.id])); setStatus('Đã áp dụng JSON — Ctrl/⌘ Z để quay lại cây cũ.')
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
    resetBuilderRoot(imported)
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
  const selectedIndexes = indexesOf(builderRoot, selectedBuilderNode) ?? []
  const selectedPath = contentPath(selectedBuilderNode.type, selectedIndexes)
  /** Edits the selected node; `field` makes a burst of typing in one field a single undo step. */
  const editSelected = (edit: (node: BuilderNode) => BuilderNode, field: string) => {
    setNativePreviewJson(null)
    setBuilderRoot(current => updateBuilderTree(current, selectedNode, edit), `${selectedNode}:${field}`)
  }
  // Lint of the exported JSON; the Inspector shows the issues of the selected node (same paths as the preview lint).
  const lintIssues = useMemo(() => lint(generatedSchema), [builderSchema])
  const selectedLintPath = 'root' + selectedIndexes.map(index => `.children[${index}]`).join('')
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
  /** Selects a layer and reveals it in Layers: opens every parent, then scrolls the row into view. */
  const selectBuilderNode = (id: number) => {
    setSelectedNode(id)
    const parents = ancestorIds(builderRoot, id)
    if (parents.some(parent => !expandedNodes.has(parent))) setExpandedNodes(current => new Set([...current, ...parents]))
    requestAnimationFrame(() => document.querySelector(`[data-tree-node-id="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }
  /** Tree edits from the Layers panel: one undo step each. */
  const changeLayers = (next: BuilderNode, message: string, selectId?: number) => {
    if (next !== builderRoot) { setNativePreviewJson(null); setBuilderRoot(next) }
    setStatus(message)
    if (selectId !== undefined) {
      setSelectedNode(selectId)
      requestAnimationFrame(() => document.querySelector(`[data-tree-node-id="${selectId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
    }
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
    resetBuilderRoot(structuredClone(initialBuilderTree)); setSchemaName('Untitled schema')
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
        resetBuilderRoot(structuredClone(initialBuilderTree)); setActiveTab('templates')
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
      resetBuilderRoot(tree); setSchemaName(importName.trim()); setEditingSchema(null)
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
        <div className="sdui-title-row">
          <span className="sdui-title-icon"><SDUIIcon kind="library" /></span>
          <div><h1>Server-driven UI</h1><p>Create, edit and manage your native UI schemas.</p></div>
        </div>
        <div className="sdui-pills">
          <span className={`sdui-api-status is-${cloudStatus}`} role="status">
            <i aria-hidden="true" />{cloudStatus === 'connected' ? 'Templates API connected' : cloudStatus === 'loading' ? 'Connecting to API…' : 'Templates API unavailable'}
            {cloudStatus === 'error' && <button type="button" onClick={() => void refresh()}>Retry</button>}
          </span>
        </div>
      </header>
      <div className="sdui-tabs-bar">
        <nav className="sdui-tabs" role="tablist" aria-label="SDUI workspace" onKeyDown={moveTabFocus}>
          {SDUI_TABS.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} tabIndex={activeTab === tab.id ? 0 : -1}
            className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
            <SDUIIcon kind={tab.icon} /><span className="sdui-tab-label">{tab.label}</span>
            {tab.id === 'templates' && cloudStatus === 'connected' && <span className="sdui-tab-count">{savedSchemas.length}</span>}
            {tab.id === 'builder' && dirty && baseline && <span className="sdui-tab-dirty" title="Unsaved changes"><span className="sr-only">Unsaved changes</span></span>}
          </button>)}
        </nav>
      </div>
      {activeTab === 'migration' && <FigmaMigration onImport={result => {
        const tree = normalizeBuilderTree(result.template)
        if (!tree || !canReplaceDraft()) return
        resetBuilderRoot(tree); setSchemaName(result.name); setEditingSchema(null); setBaseline('')
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
          <div className="sdui-undo-group" role="group" aria-label="Lịch sử chỉnh sửa">
            <button className="sdui-quiet" disabled={!history.past.length} title="Undo (Ctrl/⌘ Z)" onClick={() => stepHistory('undo')}>↶ Undo</button>
            <button className="sdui-quiet" disabled={!history.future.length} title="Redo (Shift Ctrl/⌘ Z)" onClick={() => stepHistory('redo')}>↷ Redo</button>
          </div>
          <button className="sdui-quiet" disabled={saving || !schemaName.trim() || cloudStatus === 'loading'} onClick={() => saveSchema(true)}>Save as copy</button>
          <button className="sdui-primary" disabled={saving || !schemaName.trim() || !dirty || cloudStatus === 'loading'} onClick={() => saveSchema()}>{saving ? 'Saving…' : editingSchema ? 'Save changes' : 'Save schema'}</button>
        </section>
        <fieldset className="sdui-builder-workspace" disabled={saving}>
          <LayersPanel root={builderRoot} selectedId={selectedNode} expanded={expandedNodes} onExpandedChange={setExpandedNodes} onSelect={selectBuilderNode}
            issues={lintIssues} onChange={changeLayers} onStatus={setStatus}
            footer={<details className="sdui-import"><summary>Import JSON</summary><label className="builder-json-label">Paste schema<textarea className="builder-json-input" value={builderJsonInput} onChange={event => setBuilderJsonInput(event.target.value)} placeholder="Paste component tree or template_widget JSON…" /></label><label className="sdui-quiet file-button">Choose JSON file<input hidden type="file" accept=".json,application/json" onChange={importBuilderFile} /></label><button disabled={!builderJsonInput.trim()} className="sdui-primary builder-import-button" onClick={importBuilder}>Apply JSON</button></details>} />
          <div className="sdui-editor-main">
            <section className="sdui-card figma-canvas-panel">
              <div className="sdui-card-title">Preview <span>ANDROID · IOS</span></div>
              {renderedPreview !== null && <div className="velocity-preview-banner"><span>Đang xem <code>rendered_json</code> từ BE — không chọn / sửa layer được ở chế độ này.</span><button className="sdui-quiet" onClick={() => setRenderedPreview(null)}>Quay lại JSON editor</button></div>}
              <SDUIPreview input={renderedPreview ?? previewSchema} selectedRef={renderedPreview === null ? String(selectedNode) : undefined} onSelect={renderedPreview === null ? ref => selectBuilderNode(Number(ref)) : undefined} />
              <p className="native-preview-hint">“Chọn node” để sửa thuộc tính; “Bấm thử” để chạy onTap / button giả lập. Preview vẽ đúng JSON được export, theo docs/sdui/sdui-preview.md.</p>
            </section>
            <section className="sdui-card sdui-generated-panel">
              <div className="sdui-generated-header"><div><div className="sdui-card-title">Generated schema <span>LIVE OUTPUT</span></div><p className="sdui-muted">Inspector changes are serialized here before saving.</p></div><div className="preview-actions"><button type="button" className="sdui-quiet" onClick={copyBuilderSchema}>Copy</button><button className="sdui-quiet" onClick={() => download(builderSchema, 'sdui-schema.json')}>Download</button><button className="sdui-quiet" disabled={!editingSchema?.id || dirty || qrGenerating} title={!editingSchema?.id ? 'Save the template first' : dirty ? 'Save changes before generating QR' : 'Generate QR to open Mini App'} onClick={() => void generateQr()}>{qrGenerating ? 'Generating…' : 'Mini App QR'}</button><button className="sdui-native-export" onClick={downloadNativeMockData}>Export Native</button></div></div>
              {copyFeedback && <p role="status" aria-live="polite" className="sdui-copy-feedback">{copyFeedback}</p>}
              <p className="schema-summary"><span>template_widget · SDUI_WIDGET</span><span>{countNodes(builderRoot)} components</span><span>{dynamicFields.length} dynamic field</span><span>❌ {lintIssues.filter(issue => issue.level === 'error').length} · ⚠️ {lintIssues.filter(issue => issue.level === 'warning').length}</span></p>
              <pre className="builder-schema builder-schema-expanded">{builderSchema}</pre>
            </section>
            <VelocityTemplatePanel schema={generatedSchema} previewing={renderedPreview !== null} onPreview={setRenderedPreview} onStatus={setStatus} onSelectPath={indexes => {
              const node = indexes.reduce<BuilderNode | undefined>((current, index) => current?.children?.[index], builderRoot)
              if (node) selectBuilderNode(node.id)
            }} />
          </div>
          <BuilderInspector key={selectedBuilderNode.id} node={selectedBuilderNode} isRoot={selectedBuilderNode.id === builderRoot.id} path={selectedPath}
            duplicateVariable={!!selectedBuilderNode.variable?.trim() && duplicateVariables(dynamicFields).has(selectedBuilderNode.variable.trim())}
            issues={lintIssues.filter(issue => issue.path === selectedLintPath)} styleTools={styleTools} onCopyPath={() => void copy(selectedPath, 'Path copied')}
            onNode={(patch, field) => editSelected(node => ({ ...node, ...patch }), field)}
            onStyle={(key, value) => editSelected(node => setStyle(node, key, value), `style.${key}`)}
            onProperty={(key, value) => editSelected(node => setProperty(node, key, value), `property.${key}`)}
            onValue={(key, value) => editSelected(node => setValueKey(node, key, value), `value.${key}`)} />
        </fieldset>
      </>}
      {showQr && <div className="sdui-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowQr(false) }}><section className="sdui-qr-modal" role="dialog" aria-modal="true" aria-labelledby="sdui-qr-title"><button className="sdui-modal-close" aria-label="Close QR dialog" onClick={() => setShowQr(false)}>×</button><div><span className="sdui-kicker">Mini App preview</span><h2 id="sdui-qr-title">{schemaName}</h2><p>Scan to open the Mini App with this template ID.</p></div><label className="sdui-label">Mini App URL / deep link<input value={miniAppBaseUrl} onChange={event => { setMiniAppBaseUrl(event.target.value); setQrDataUrl('') }} placeholder="momo://action=marketing&refId=..." /></label><p>Tool sẽ thêm <code>templateId={editingSchema?.id}</code>. Nếu Mini App dùng params JSON, đặt <code>{'{templateId}'}</code> trong URL cấu hình.</p><div className="sdui-qr-image">{qrDataUrl && <img src={qrDataUrl} alt={`QR code for ${schemaName}`} />}</div>{copyFeedback && <p role="status">{copyFeedback}</p>}<code className="sdui-qr-url">{miniAppUrl || 'Nhập URL rồi chọn Generate QR'}</code><small className="sdui-muted">Template JSON API: {templateJsonUrl}</small><div className="sdui-qr-actions"><button className="sdui-quiet" disabled={!miniAppUrl} onClick={() => void copy(miniAppUrl, 'Mini App URL copied')}>Copy URL</button><button className="sdui-quiet" disabled={!miniAppBaseUrl.trim() || qrGenerating} onClick={() => void generateQr()}>{qrGenerating ? 'Generating…' : 'Generate QR'}</button><button className="sdui-primary" disabled={!qrDataUrl} onClick={downloadQr}>Download PNG</button></div></section></div>}
    </main>
  )
}
