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
