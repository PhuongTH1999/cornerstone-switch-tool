/** Reordering layers in the SDUI editor tree. Only siblings move: a node never changes parent. */

interface TreeNode { id: number; children?: TreeNode[] }

/** Parent of `id` and the node's index in it, or null for the root / an unknown id. */
export function parentOf<T extends TreeNode>(root: T, id: number): { parent: T; index: number } | null {
  const children = (root.children || []) as T[]
  const index = children.findIndex(child => child.id === id)
  if (index !== -1) return { parent: root, index }
  for (const child of children) {
    const found = parentOf(child, id)
    if (found) return found
  }
  return null
}

function withChildren<T extends TreeNode>(root: T, parentId: number, reorder: (children: T[]) => T[]): T {
  if (root.id === parentId) return { ...root, children: reorder([...((root.children || []) as T[])]) }
  return root.children ? { ...root, children: (root.children as T[]).map(child => withChildren(child, parentId, reorder)) } : root
}

/** Moves a node up (-1) or down (+1) among its siblings. Unchanged at either end. */
export function moveNode<T extends TreeNode>(root: T, id: number, delta: -1 | 1): T {
  const found = parentOf(root, id)
  if (!found) return root
  const target = found.index + delta
  if (target < 0 || target >= (found.parent.children || []).length) return root
  return withChildren(root, found.parent.id, children => {
    ;[children[found.index], children[target]] = [children[target], children[found.index]]
    return children
  })
}

/** Drops `id` before / after its sibling `targetId`. Unchanged when they do not share a parent. */
export function moveNodeTo<T extends TreeNode>(root: T, id: number, targetId: number, place: 'before' | 'after'): T {
  const from = parentOf(root, id), to = parentOf(root, targetId)
  if (!from || !to || id === targetId || from.parent.id !== to.parent.id) return root
  return withChildren(root, from.parent.id, children => {
    const [moved] = children.splice(from.index, 1)
    const targetIndex = children.findIndex(child => child.id === targetId)
    children.splice(place === 'before' ? targetIndex : targetIndex + 1, 0, moved)
    return children
  })
}

/** Ids of the ancestors of `id`, root first (empty for the root or an unknown id). */
export function ancestorIds(root: TreeNode, id: number): number[] {
  if (root.id === id) return []
  for (const child of root.children || []) {
    const below = ancestorIds(child, id)
    if (child.id === id || below.length) return [root.id, ...below]
  }
  return []
}

export function findNode<T extends TreeNode>(root: T, id: number): T | null {
  if (root.id === id) return root
  for (const child of (root.children || []) as T[]) {
    const found = findNode(child, id)
    if (found) return found
  }
  return null
}

export const maxId = (root: TreeNode): number => Math.max(root.id, ...(root.children || []).map(maxId))

/**
 * Deep copy with fresh ids from `nextId`. Bound variables are removed: two layers with the same BE key would get
 * the same value (dynamic fields).
 */
export function cloneWithNewIds<T extends TreeNode & { variable?: string }>(node: T, nextId: () => number): T {
  const { variable: _variable, ...copy } = structuredClone(node)
  const id = nextId()   // parent before children, so ids follow the tree order
  const children = (node.children as T[] | undefined)?.map(child => cloneWithNewIds(child, nextId))
  return { ...copy, id, ...(children ? { children } : {}) } as T
}

export interface InsertionPoint { parentId: number; index: number }

/** Where a new / pasted layer goes: inside the selection when it can hold children (at the end), otherwise right after it. */
export function insertionPoint<T extends TreeNode & { type: string }>(root: T, selectedId: number, parentTypes: string[]): InsertionPoint | null {
  const selected = findNode(root, selectedId)
  if (!selected) return null
  if (parentTypes.includes(selected.type)) return { parentId: selected.id, index: (selected.children || []).length }
  const position = parentOf(root, selectedId)
  return position ? { parentId: position.parent.id, index: position.index + 1 } : null
}

export function insertNode<T extends TreeNode>(root: T, point: InsertionPoint, node: T): T {
  return withChildren(root, point.parentId, children => { children.splice(point.index, 0, node); return children })
}

export function removeNode<T extends TreeNode>(root: T, id: number): T {
  if (!root.children) return root
  return { ...root, children: (root.children as T[]).filter(child => child.id !== id).map(child => removeNode(child, id)) }
}

/** Ids to show for a search: every match and its ancestors. Null when the query is empty. */
export function searchTree<T extends TreeNode>(root: T, matches: (node: T) => boolean): Set<number> | null {
  const visible = new Set<number>()
  const visit = (node: T, ancestors: number[]) => {
    if (matches(node)) [...ancestors, node.id].forEach(id => visible.add(id))
    ;((node.children || []) as T[]).forEach(child => visit(child, [...ancestors, node.id]))
  }
  visit(root, [])
  return visible
}

export const areSiblings = (root: TreeNode, a: number, b: number) => {
  const first = parentOf(root, a), second = parentOf(root, b)
  return !!first && !!second && first.parent.id === second.parent.id
}
