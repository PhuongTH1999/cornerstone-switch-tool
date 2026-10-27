import { test } from 'node:test'
import assert from 'node:assert/strict'
import { areSiblings, moveNode, moveNodeTo, parentOf } from '../src/lib/builderTree'

// 1 > [2 > [4, 5, 6], 3]
const tree = () => ({ id: 1, children: [{ id: 2, children: [{ id: 4 }, { id: 5 }, { id: 6 }] }, { id: 3 }] })
const ids = (node: any): any => node.children ? [node.id, node.children.map(ids)] : node.id

test('swap with the next / previous sibling', () => {
  assert.deepEqual(ids(moveNode(tree(), 4, 1)), [1, [[2, [5, 4, 6]], 3]])
  assert.deepEqual(ids(moveNode(tree(), 6, -1)), [1, [[2, [4, 6, 5]], 3]])
  assert.deepEqual(ids(moveNode(tree(), 2, 1)), [1, [3, [2, [4, 5, 6]]]])
})
test('no change at either end, for the root or an unknown id', () => {
  const root = tree()
  assert.equal(moveNode(root, 4, -1), root)
  assert.equal(moveNode(root, 6, 1), root)
  assert.equal(moveNode(root, 1, 1), root)
  assert.equal(moveNode(root, 99, 1), root)
})
test('drop before / after a sibling', () => {
  assert.deepEqual(ids(moveNodeTo(tree(), 6, 4, 'before')), [1, [[2, [6, 4, 5]], 3]])
  assert.deepEqual(ids(moveNodeTo(tree(), 4, 6, 'after')), [1, [[2, [5, 6, 4]], 3]])
  assert.deepEqual(ids(moveNodeTo(tree(), 4, 5, 'after')), [1, [[2, [5, 4, 6]], 3]])
})
test('drop on a node with another parent does nothing', () => {
  const root = tree()
  assert.equal(moveNodeTo(root, 4, 3, 'before'), root)
  assert.equal(areSiblings(root, 4, 3), false)
  assert.equal(areSiblings(root, 4, 6), true)
})
test('the original tree is not mutated', () => {
  const root = tree()
  moveNode(root, 4, 1)
  moveNodeTo(root, 6, 4, 'before')
  assert.deepEqual(ids(root), [1, [[2, [4, 5, 6]], 3]])
  assert.deepEqual(parentOf(root, 5), { parent: root.children[0], index: 1 })
})

import { ancestorIds, cloneWithNewIds, findNode, insertNode, insertionPoint, maxId, removeNode, searchTree } from '../src/lib/builderTree'
import { layerContent, layerMeta } from '../src/lib/layerSummary'

// 1 container > [2 container > [4 text, 5 text, 6 image], 3 text]
const typed = () => ({ id: 1, type: 'container', children: [
  { id: 2, type: 'container', children: [{ id: 4, type: 'text', variable: 'title' }, { id: 5, type: 'text' }, { id: 6, type: 'image' }] },
  { id: 3, type: 'text' },
] })

test('ancestors, find, max id', () => {
  assert.deepEqual(ancestorIds(typed(), 5), [1, 2])
  assert.deepEqual(ancestorIds(typed(), 1), [])
  assert.deepEqual(ancestorIds(typed(), 99), [])
  assert.equal(findNode(typed(), 6)?.type, 'image')
  assert.equal(maxId(typed()), 6)
})
test('insertion point: inside a parent at the end, after a leaf', () => {
  assert.deepEqual(insertionPoint(typed(), 2, ['container']), { parentId: 2, index: 3 })
  assert.deepEqual(insertionPoint(typed(), 4, ['container']), { parentId: 2, index: 1 })
  assert.equal(insertionPoint({ id: 1, type: 'text' }, 1, ['container']), null)
})
test('duplicate: new ids everywhere, variables dropped, inserted after the original', () => {
  const root = typed()
  let next = maxId(root)
  const copy = cloneWithNewIds(root.children[0] as any, () => ++next) as any
  assert.deepEqual([copy.id, ...copy.children.map((child: any) => child.id)], [7, 8, 9, 10])
  assert.equal(copy.children[0].variable, undefined)
  assert.equal((root.children[0] as any).children[0].variable, 'title', 'original untouched')
  const result = insertNode(root, insertionPoint(root, 2, [])!, copy)
  assert.deepEqual(ids(result), [1, [[2, [4, 5, 6]], [7, [8, 9, 10]], 3]])
})
test('remove and search', () => {
  assert.deepEqual(ids(removeNode(typed(), 2)), [1, [3]])
  assert.deepEqual([...searchTree(typed(), node => node.type === 'image')!].sort(), [1, 2, 6])
})
test('layer summary', () => {
  assert.equal(layerContent({ id: 1, type: 'text', name: 'a', value: 'Phúc Long  Coffee\n& Tea' }), '"Phúc Long Coffee & Tea"')
  assert.equal(layerContent({ id: 1, type: 'text', name: 'a', value: 'x', variable: 'brand' }), '{brand}')
  assert.equal(layerContent({ id: 1, type: 'image', name: 'a', url: 'https://static.momocdn.net/app/img/0_promotion/image425.png?v=2' }), 'image425.png')
  assert.equal(layerMeta({ id: 1, type: 'container', name: 'a', nativeStyle: { width: 72, height: 76 }, nativeProperty: { layout: 'row' }, children: [] }), 'row · 0 · 72×76')
  assert.equal(layerMeta({ id: 1, type: 'container', name: 'a', children: [{ id: 2, type: 'text', name: 'b' }] }), 'column · 1')
})
