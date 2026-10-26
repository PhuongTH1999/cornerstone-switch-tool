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

export const areSiblings = (root: TreeNode, a: number, b: number) => {
  const first = parentOf(root, a), second = parentOf(root, b)
  return !!first && !!second && first.parent.id === second.parent.id
}
