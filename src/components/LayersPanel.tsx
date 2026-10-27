import { useRef, useState } from 'react'
import type { DragEvent, KeyboardEvent, ReactNode } from 'react'
import { PARENT_TYPES, type BuilderNode } from '../lib/builderNode'
import { ancestorIds, areSiblings, cloneWithNewIds, findNode, insertNode, insertionPoint, maxId, moveNode, moveNodeTo, parentOf, removeNode, searchTree } from '../lib/builderTree'
import { layerContent, layerMeta, layerSearchText } from '../lib/layerSummary'
import { SDUI_TYPES } from '../renderers/sdui/preview/types'
import type { Issue } from '../renderers/sdui/preview/types'

const TYPE_ICON: Record<string, string> = { container: '▦', text: 'T', image: '▧', button: '▣', tag: '⌑', spacer: '·', box: '⧉', pager: '⇆', pageIndicator: '•', progressBar: '▬' }

/** New layers start with values that are safe on both platforms (spacing / minLength sent, image and pager sized). */
const NEW_LAYER: Record<string, Partial<BuilderNode>> = {
  container: { layout: 'column', spacing: 0 }, text: { value: 'New text' }, tag: { value: 'Tag', nativeProperty: { tagType: 'info' } },
  image: { width: 48, height: 48 }, button: { title: 'Button', buttonType: 'primary', ctaType: 'BUTTON', nativeProperty: { ctaType: 'BUTTON' } },
  spacer: { nativeProperty: { minLength: 0 } }, box: { nativeProperty: { contentAlignment: 'topStart' } },
  pager: { height: 120, nativeProperty: { showIndicator: true } }, pageIndicator: { nativeProperty: { total: 3, activeIndex: 0 } },
  progressBar: { nativeValue: { currentValue: 30, maxValue: 100, subDes1: '', subDes2: '' } },
}

export interface LayersPanelProps {
  root: BuilderNode
  selectedId: number
  expanded: Set<number>
  onExpandedChange: (next: Set<number>) => void
  /** Selects a layer; the page also reveals it (opens its parents) and scrolls to it. */
  onSelect: (id: number) => void
  /** Lint issues of the exported JSON (paths `root.children[i]…`). */
  issues: Issue[]
  /** Replaces the tree (one undo step) and shows `message`; `selectId` is selected and revealed. */
  onChange: (next: BuilderNode, message: string, selectId?: number) => void
  onStatus: (message: string) => void
  /** Import JSON form, shown at the bottom of the panel. */
  footer?: ReactNode
}

type Row = { node: BuilderNode; depth: number; path: string; index: number; siblings: number }

export default function LayersPanel({ root, selectedId, expanded, onExpandedChange, onSelect, issues, onChange, onStatus, footer }: LayersPanelProps) {
  const [query, setQuery] = useState('')
  const [addType, setAddType] = useState('text')
  const [clipboard, setClipboard] = useState<BuilderNode | null>(null)
  const [dropHint, setDropHint] = useState<{ id: number; place: 'before' | 'after' } | null>(null)
  const dragged = useRef<number | null>(null)
  const treeRef = useRef<HTMLDivElement>(null)

  const selected = findNode(root, selectedId) ?? root
  const search = query.trim().toLocaleLowerCase()
  const matches = search ? searchTree(root, node => layerSearchText(node).includes(search)) : null
  const isOpen = (node: BuilderNode) => !!matches || expanded.has(node.id)

  // Visible rows in order (used for rendering and for ↑ / ↓ keyboard navigation).
  const rows: Row[] = []
  const collect = (node: BuilderNode, depth: number, path: string, index: number, siblings: number) => {
    if (matches && !matches.has(node.id)) return
    rows.push({ node, depth, path, index, siblings })
    if (isOpen(node)) node.children?.forEach((child, i) => collect(child, depth + 1, `${path}.children[${i}]`, i, node.children!.length))
  }
  collect(root, 0, 'root', 0, 1)

  // Lint markers: the row's own issues, plus issues hidden inside a collapsed branch.
  const relevant = issues.filter(issue => issue.level !== 'info')
  const marker = (row: Row) => {
    const own = relevant.filter(issue => issue.path === row.path)
    const inside = isOpen(row.node) ? [] : relevant.filter(issue => issue.path.startsWith(`${row.path}.`))
    const list = own.length ? own : inside
    if (!list.length) return null
    const level = list.some(issue => issue.level === 'error') ? 'error' : 'warning'
    const title = list.slice(0, 6).map(issue => `${issue.code} ${issue.path}: ${issue.message}`).join('\n') + (list.length > 6 ? `\n… +${list.length - 6}` : '')
    return <span className={`layer-issue level-${level}${own.length ? '' : ' is-inside'}`} title={own.length ? title : `Trong nhánh:\n${title}`}>{level === 'error' ? '❌' : '⚠️'}{list.length > 1 ? list.length : ''}</span>
  }

  const nextIdFrom = (tree: BuilderNode) => { let next = maxId(tree); return () => ++next }
  const point = insertionPoint(root, selected.id, PARENT_TYPES)
  const pointLabel = !point ? 'Không thêm được vào node này' : point.parentId === selected.id ? `vào trong ${selected.name}` : `sau ${selected.name}`
  const insert = (node: BuilderNode, message: string) => {
    if (!point) return
    onExpandedChange(new Set([...expanded, point.parentId]))
    onChange(insertNode(root, point, node), message, node.id)
  }
  const add = () => insert({ id: nextIdFrom(root)(), type: addType, name: `${addType}_${maxId(root) + 1}`, nativeProperty: {}, ...NEW_LAYER[addType], children: PARENT_TYPES.includes(addType) ? [] : undefined }, `Đã thêm ${addType} ${pointLabel}.`)
  const duplicate = (id: number) => {
    const node = findNode(root, id)
    const position = parentOf(root, id)
    if (!node || !position) return
    const copy = cloneWithNewIds(node, nextIdFrom(root))
    const dropped = countVariables(node)
    onChange(insertNode(root, { parentId: position.parent.id, index: position.index + 1 }, copy), `Đã nhân bản ${node.name}${dropped ? ` (bỏ ${dropped} variable để không trùng key)` : ''}.`, copy.id)
  }
  const copy = (id: number) => { const node = findNode(root, id); if (node) { setClipboard(structuredClone(node)); onStatus(`Đã copy layer ${node.name} — chọn nơi đặt rồi Paste (Ctrl/⌘ V).`) } }
  const paste = () => { if (clipboard) insert(cloneWithNewIds(clipboard, nextIdFrom(root)), `Đã dán ${clipboard.name} ${pointLabel}.`) }
  const remove = (id: number) => {
    const node = findNode(root, id)
    const position = parentOf(root, id)
    if (!node || !position) return
    onChange(removeNode(root, id), `Đã xoá ${node.name} — Ctrl/⌘ Z để hoàn tác.`, position.parent.id)
  }
  const move = (id: number, delta: -1 | 1) => { const next = moveNode(root, id, delta); if (next !== root) onChange(next, delta < 0 ? 'Đã chuyển layer lên.' : 'Đã chuyển layer xuống.', id) }
  const toggle = (id: number) => { const next = new Set(expanded); next.has(id) ? next.delete(id) : next.add(id); onExpandedChange(next) }
  const expandAll = () => { const ids = new Set<number>(); const visit = (node: BuilderNode) => { if (node.children?.length) { ids.add(node.id); node.children.forEach(visit) } }; visit(root); onExpandedChange(ids) }

  /** Tree keyboard: ↑/↓ select, ←/→ collapse/expand, Alt+↑/↓ reorder, Delete, Ctrl/⌘ D / C / V. */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('input, textarea, select')) return
    const index = rows.findIndex(row => row.node.id === selected.id)
    const row = rows[index]
    const mod = event.metaKey || event.ctrlKey
    const key = event.key
    const handled = () => event.preventDefault()
    if (event.altKey && (key === 'ArrowUp' || key === 'ArrowDown')) { handled(); move(selected.id, key === 'ArrowUp' ? -1 : 1) }
    else if (key === 'ArrowDown' && rows[index + 1]) { handled(); onSelect(rows[index + 1].node.id) }
    else if (key === 'ArrowUp' && index > 0) { handled(); onSelect(rows[index - 1].node.id) }
    else if (key === 'ArrowRight' && row?.node.children?.length) { handled(); isOpen(row.node) ? onSelect(row.node.children[0].id) : toggle(row.node.id) }
    else if (key === 'ArrowLeft' && row) {
      handled()
      if (row.node.children?.length && isOpen(row.node) && !matches) toggle(row.node.id)
      else { const parent = ancestorIds(root, row.node.id).pop(); if (parent !== undefined) onSelect(parent) }
    }
    else if ((key === 'Delete' || key === 'Backspace') && selected.id !== root.id) { handled(); remove(selected.id) }
    else if (mod && key.toLowerCase() === 'd' && selected.id !== root.id) { handled(); duplicate(selected.id) }
    else if (mod && key.toLowerCase() === 'c') { handled(); copy(selected.id) }
    else if (mod && key.toLowerCase() === 'v' && clipboard) { handled(); paste() }
  }

  const dragProps = (node: BuilderNode) => node.id === root.id || matches ? {} : {
    draggable: true,
    onDragStart: (event: DragEvent<HTMLDivElement>) => { dragged.current = node.id; event.dataTransfer.effectAllowed = 'move' },
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (dragged.current === null || dragged.current === node.id || !areSiblings(root, dragged.current, node.id)) return
      event.preventDefault()
      const rect = event.currentTarget.getBoundingClientRect()
      const place = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
      if (dropHint?.id !== node.id || dropHint.place !== place) setDropHint({ id: node.id, place })
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      if (dragged.current !== null && dropHint) { const next = moveNodeTo(root, dragged.current, node.id, dropHint.place); if (next !== root) onChange(next, 'Đã chuyển layer.', dragged.current) }
      dragged.current = null; setDropHint(null)
    },
    onDragEnd: () => { dragged.current = null; setDropHint(null) },
  }

  const stop = (action: () => void) => (event: { stopPropagation(): void }) => { event.stopPropagation(); action() }
  return <section className="sdui-card figma-tree-panel layers-panel">
    <div className="layers-head">
      <div className="sdui-card-title">Layers <span>{countNodes(root)} node</span></div>
      <div className="layers-head-actions">
        <button type="button" className="sdui-quiet" title="Mở hết" onClick={expandAll}>⊞</button>
        <button type="button" className="sdui-quiet" title="Thu gọn hết" onClick={() => onExpandedChange(new Set([root.id]))}>⊟</button>
      </div>
    </div>
    <input className="layers-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên, type, nội dung, variable…" aria-label="Tìm layer" />
    {matches && <small className="sdui-muted">{matches.size ? `${rows.length} dòng khớp (gồm node cha)` : 'Không có layer khớp.'}</small>}

    <div className="layers-toolbar">
      <select aria-label="Loại component" value={addType} onChange={event => setAddType(event.target.value)}>{SDUI_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select>
      <button type="button" className="sdui-primary" disabled={!point} title={point ? `Thêm ${addType} ${pointLabel}` : pointLabel} onClick={add}>+ Add</button>
      <button type="button" className="sdui-quiet" disabled={selected.id === root.id} title="Nhân bản (Ctrl/⌘ D)" onClick={() => duplicate(selected.id)}>⧉</button>
      <button type="button" className="sdui-quiet" title="Copy layer (Ctrl/⌘ C)" onClick={() => copy(selected.id)}>Copy</button>
      <button type="button" className="sdui-quiet" disabled={!clipboard || !point} title={clipboard ? `Dán ${clipboard.name} ${pointLabel} (Ctrl/⌘ V)` : 'Copy một layer trước'} onClick={paste}>Paste</button>
    </div>
    <small className="sdui-muted layers-point">{point ? `Thêm / dán: ${pointLabel}` : pointLabel}</small>

    <div ref={treeRef} className="figma-tree layers-tree" role="tree" aria-label="Layers" tabIndex={0} onKeyDown={onKeyDown}>
      {rows.map(row => {
        const { node, depth } = row
        const content = layerContent(node)
        const showContent = content && content !== `"${node.name}"`
        const hint = dropHint?.id === node.id ? ` drop-${dropHint.place}` : ''
        return <div key={node.id} role="treeitem" aria-level={depth + 1} aria-selected={node.id === selected.id} aria-expanded={node.children?.length ? isOpen(node) : undefined}
          data-tree-node-id={node.id} className={`figma-tree-row layer-row${node.id === selected.id ? ' selected' : ''}${hint}`} style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => { onSelect(node.id); treeRef.current?.focus({ preventScroll: true }) }} {...dragProps(node)}>
          <button type="button" tabIndex={-1} className="figma-tree-chevron" aria-label={isOpen(node) ? 'Thu gọn' : 'Mở'} onClick={stop(() => toggle(node.id))}>{node.children?.length ? (isOpen(node) ? '▾' : '▸') : '·'}</button>
          <span className={`figma-tree-icon type-${node.type}`} title={node.type}>{TYPE_ICON[node.type] || '·'}</span>
          <span className="layer-text">
            <strong title={node.name}>{node.name}</strong>
            {showContent && <small className={`layer-content${node.variable ? ' is-variable' : ''}`} title={content}>{content}</small>}
          </span>
          {marker(row)}
          <small className="layer-meta" title={layerMeta(node)}>{layerMeta(node)}</small>
          {node.id !== root.id && <span className="layer-actions">
            <button type="button" tabIndex={-1} title="Nhân bản (Ctrl/⌘ D)" aria-label="Nhân bản layer" onClick={stop(() => duplicate(node.id))}>⧉</button>
            <button type="button" tabIndex={-1} title="Lên (Alt ↑)" aria-label="Chuyển layer lên" disabled={row.index === 0} onClick={stop(() => move(node.id, -1))}>↑</button>
            <button type="button" tabIndex={-1} title="Xuống (Alt ↓)" aria-label="Chuyển layer xuống" disabled={row.index === row.siblings - 1} onClick={stop(() => move(node.id, 1))}>↓</button>
            <button type="button" tabIndex={-1} className="is-danger" title="Xoá (Delete) — Ctrl/⌘ Z để hoàn tác" aria-label="Xoá layer" onClick={stop(() => remove(node.id))}>×</button>
          </span>}
        </div>
      })}
    </div>
    <small className="sdui-muted layers-keys">Phím: ↑↓ chọn · ←→ thu / mở · Alt ↑↓ đổi chỗ · Delete xoá · ⌘/Ctrl D nhân bản · C / V copy / dán · Z hoàn tác</small>
    {footer}
  </section>
}

const countNodes = (node: BuilderNode): number => 1 + (node.children || []).reduce((total, child) => total + countNodes(child), 0)
const countVariables = (node: BuilderNode): number => (node.variable?.trim() ? 1 : 0) + (node.children || []).reduce((total, child) => total + countVariables(child), 0)
