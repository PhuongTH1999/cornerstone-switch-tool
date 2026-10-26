import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyDynamicFields, buildDynamicFields, contentPath, duplicateVariables, findDynamicFields, indexesOf } from '../src/lib/dynamicFields'

// Same shape as the demo: root > [description, scrollRow > card > [row > [column > [image, brand], column > [prefix, suffix]], row > [distance, button]]]
const tree = () => ({ type: 'container', children: [
  { type: 'text', variable: 'description' },
  { type: 'container', children: [
    { type: 'container', children: [
      { type: 'container', children: [
        { type: 'container', children: [{ type: 'image', variable: 'imageUrl' }, { type: 'text', variable: 'brandName' }] },
        { type: 'container', children: [{ type: 'text', variable: 'giftPrefix' }, { type: 'text', variable: 'giftSuffix' }] },
      ] },
      { type: 'container', children: [{ type: 'text', variable: 'distance' }, { type: 'button', variable: 'buttonTitle' }] },
    ] },
  ] },
] })

const DEMO = [
  { path: '$.data[0].value.children[0].value', variable: 'description' },
  { path: '$.data[0].value.children[1].value.children[0].value.children[0].value.children[0].value.children[0].value', variable: 'imageUrl' },
  { path: '$.data[0].value.children[1].value.children[0].value.children[0].value.children[0].value.children[1].value', variable: 'brandName' },
  { path: '$.data[0].value.children[1].value.children[0].value.children[0].value.children[1].value.children[0].value', variable: 'giftPrefix' },
  { path: '$.data[0].value.children[1].value.children[0].value.children[0].value.children[1].value.children[1].value', variable: 'giftSuffix' },
  { path: '$.data[0].value.children[1].value.children[0].value.children[1].value.children[0].value', variable: 'distance' },
  { path: '$.data[0].value.children[1].value.children[0].value.children[1].value.children[1].value.title', variable: 'buttonTitle' },
]

test('builds the demo dynamic_fields exactly', () => {
  assert.deepEqual(buildDynamicFields(tree()), DEMO)
})
test('button binds value.title; containers are not bindable', () => {
  assert.equal(contentPath('button', [2]), '$.data[0].value.children[2].value.title')
  assert.equal(contentPath('container', [2]), '$.data[0].value.children[2]')
  assert.deepEqual(buildDynamicFields({ type: 'container', variable: 'x', children: [] } as any), [])
})
test('round trip: applying the export restores every variable', () => {
  const stripped = JSON.parse(JSON.stringify(tree()).replace(/,?"variable":"\w+"/g, '').replace(/\{,/g, '{'))
  const { root, unmatched } = applyDynamicFields(stripped, DEMO)
  assert.deepEqual(buildDynamicFields(root), DEMO)
  assert.deepEqual(unmatched, [])
})
test('fields that point nowhere are reported, invalid entries ignored', () => {
  const { unmatched } = applyDynamicFields(tree(), [{ path: '$.data[0].value.children[9].value', variable: 'x' }, { path: 1, variable: 'y' }, { path: 'a', variable: ' ' }])
  assert.deepEqual(unmatched, [{ path: '$.data[0].value.children[9].value', variable: 'x' }])
})
test('indexesOf, findDynamicFields, duplicates', () => {
  const root = tree()
  assert.deepEqual(indexesOf(root, (root.children[1] as any).children[0].children[1].children[1]), [1, 0, 1, 1])
  assert.equal(findDynamicFields({ type: 'template_widget', dynamic_fields: DEMO }), DEMO)
  assert.equal(findDynamicFields([{ dynamic_fields: DEMO }]), DEMO)
  assert.deepEqual([...duplicateVariables([...DEMO, DEMO[0]])], ['description'])
})
