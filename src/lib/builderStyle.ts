/** Copy / paste the appearance of an SDUI editor node and find the nodes to paste it onto. */

export interface StyledNode {
  id: number
  type: string
  children?: StyledNode[]
  nativeStyle?: Record<string, any>
  nativeProperty?: Record<string, any>
}

/** Editor fields that mirror `style` keys (they win over nativeStyle when the schema is generated). */
const STYLE_FIELDS = ['bg', 'padding', 'radius', 'width', 'height', 'border', 'fillMaxWidth', 'fillMaxHeight', 'weight']

/** Appearance per type: editor fields and `property` keys. Content (text, URL, title, actions, values) is never copied. */
const TYPE_FIELDS: Record<string, string[]> = {
  container: ['layout', 'spacing', 'alignment'], text: ['textAlignment'], image: ['contentMode'], button: ['buttonType', 'ctaType'],
}
const TYPE_PROPERTIES: Record<string, string[]> = {
  container: ['layout', 'spacing', 'alignment', 'arrangement'],
  text: ['typography', 'color', 'lineLimit', 'textAlignment', 'truncationMode', 'lineSpacing'],
  image: ['contentMode', 'tintColor', 'aspectRatio', 'cornerRadius'],
  button: ['color', 'ctaType'],
  tag: ['tagType', 'backgroundColor', 'textColor'],
  spacer: ['minLength'],
  box: ['contentAlignment'],
  pager: ['showIndicator', 'activeColor', 'inactiveColor', 'indicatorBackgroundColor', 'alignmentIndicator', 'paddingIndicator'],
  pageIndicator: ['activeColor', 'inactiveColor'],
  progressBar: ['color', 'barHeight', 'barWidth'],
}

export interface StyleSnapshot {
  type: string
  fields: Record<string, unknown>
  nativeStyle: Record<string, any>
  property: Record<string, unknown>
}

export function captureStyle(node: StyledNode): StyleSnapshot {
  const source = node as unknown as Record<string, unknown>
  const pick = (keys: string[], from: Record<string, unknown> = {}) => Object.fromEntries(keys.filter(key => from[key] !== undefined).map(key => [key, structuredClone(from[key])]))
  return {
    type: node.type,
    fields: pick([...STYLE_FIELDS, ...(TYPE_FIELDS[node.type] || [])], source),
    nativeStyle: structuredClone(node.nativeStyle || {}),
    property: pick(TYPE_PROPERTIES[node.type] || [], node.nativeProperty),
  }
}

/**
 * Same type: `style` + type appearance (property keys missing in the snapshot are removed, so the target matches).
 * Other type: only `style`, since property keys mean different things per type.
 */
export function applyStyle<T extends StyledNode>(target: T, snapshot: StyleSnapshot): T {
  const sameType = target.type === snapshot.type
  const fieldKeys = [...STYLE_FIELDS, ...(sameType ? TYPE_FIELDS[snapshot.type] || [] : [])]
  const next: Record<string, any> = { ...target, nativeStyle: structuredClone(snapshot.nativeStyle) }
  for (const key of fieldKeys) {
    if (snapshot.fields[key] === undefined) delete next[key]
    else next[key] = structuredClone(snapshot.fields[key])
  }
  if (sameType) {
    const property = { ...(target.nativeProperty || {}) }
    for (const key of TYPE_PROPERTIES[snapshot.type] || []) {
      if (snapshot.property[key] === undefined) delete property[key]
      else property[key] = structuredClone(snapshot.property[key])
    }
    next.nativeProperty = property
  }
  return next as T
}

/** A node's style plus the styles of everything inside it, by child position. */
export interface StyleTree { style: StyleSnapshot; children: StyleTree[] }

export function captureStyleTree(node: StyledNode): StyleTree {
  return { style: captureStyle(node), children: (node.children || []).map(captureStyleTree) }
}

export interface ApplyResult<T> { root: T; inside: number; skipped: number }

/**
 * Applies `tree.style` to the target, and with `deep` also each child style to the target's child at the same
 * position. Inside items only take a style from the same type; a different type there means the structure
 * differs, so that item and everything below it are skipped.
 */
function applyTree<T extends StyledNode>(target: T, tree: StyleTree, deep: boolean, count: { inside: number; skipped: number }): T {
  const styled = applyStyle(target, tree.style)
  if (!deep || !styled.children || !tree.children.length) return styled
  const children = (styled.children as T[]).map((child, index) => {
    const childTree = tree.children[index]
    if (!childTree) return child
    if (child.type !== childTree.style.type) { count.skipped++; return child }
    count.inside++
    return applyTree(child, childTree, true, count)
  })
  count.skipped += Math.max(0, tree.children.length - children.length)
  return { ...styled, children }
}

/** Applies the style (and with `deep` the styles inside it) to every node whose id is in `ids`. */
export function applyStyleTo<T extends StyledNode>(root: T, ids: Set<number>, tree: StyleTree, deep = false): ApplyResult<T> {
  const count = { inside: 0, skipped: 0 }
  const visit = (node: T): T => {
    const updated = ids.has(node.id) ? applyTree(node, tree, deep, count) : node
    // Keep walking: a target may sit inside another target.
    return updated.children ? { ...updated, children: (updated.children as T[]).map(visit) } : updated
  }
  return { root: visit(root), ...count }
}

function pathTo<T extends StyledNode>(root: T, id: number): T[] | null {
  if (root.id === id) return [root]
  for (const child of (root.children || []) as T[]) {
    const path = pathTo(child, id)
    if (path) return [root, ...path]
  }
  return null
}

/** Other nodes of the same type in the same parent. */
export function siblingsOf<T extends StyledNode>(root: T, id: number): T[] {
  const path = pathTo(root, id)
  if (!path || path.length < 2) return []
  const [parent, node] = path.slice(-2)
  return ((parent.children || []) as T[]).filter(child => child.id !== id && child.type === node.type)
}

/**
 * The same item in the other entries of a list: walk up to the nearest ancestor whose parent has other children
 * of the same type (e.g. the other cards of a scrollRow), then follow the same child indexes inside each of them.
 * Only nodes of the selected node's type are returned. Selecting a list entry itself is covered by `siblingsOf`.
 */
export function sameItemInList<T extends StyledNode>(root: T, id: number): T[] {
  const path = pathTo(root, id)
  if (!path) return []
  const selected = path[path.length - 1]
  // path[level] is a list entry, path[level - 1] the list; the selected node sits below the entry.
  for (let level = path.length - 2; level >= 1; level--) {
    const list = path[level - 1], entry = path[level]
    const relative = path.slice(level + 1).map((node, index) => ((path[level + index].children || []) as T[]).indexOf(node))
    const matches = ((list.children || []) as T[])
      .filter(other => other.id !== entry.id && other.type === entry.type)
      .map(other => relative.reduce<T | undefined>((node, index) => (node?.children as T[] | undefined)?.[index], other))
      .filter((node): node is T => !!node && node.type === selected.type)
    if (matches.length) return matches
  }
  return []
}

export function allOfType<T extends StyledNode>(root: T, type: string, exceptId: number): T[] {
  const found: T[] = []
  const visit = (node: T) => { if (node.type === type && node.id !== exceptId) found.push(node); ((node.children || []) as T[]).forEach(visit) }
  visit(root)
  return found
}
