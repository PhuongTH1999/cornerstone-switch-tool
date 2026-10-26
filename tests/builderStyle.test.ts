import { test } from 'node:test'
import assert from 'node:assert/strict'
import { allOfType, applyStyle, applyStyleTo, captureStyle, captureStyleTree, sameItemInList, siblingsOf } from '../src/lib/builderStyle'

const text = (id: number, extra = {}) => ({ id, type: 'text', value: `t${id}`, nativeStyle: {}, nativeProperty: {}, ...extra })
const card = (id: number, children: any[], extra = {}) => ({ id, type: 'container', layout: 'column', nativeStyle: {}, nativeProperty: {}, children, ...extra })
// root > scrollRow > 3 cards > [image, column > [title, subtitle]]
const tree = () => card(1, [card(2, [
  card(10, [{ id: 11, type: 'image', url: 'a' }, card(12, [text(13), text(14)])]),
  card(20, [{ id: 21, type: 'image', url: 'b' }, card(22, [text(23), text(24)])]),
  card(30, [{ id: 31, type: 'image', url: 'c' }, card(32, [text(33)])]),
], { layout: 'scrollRow' })])

test('same item in list: the title of every other card', () => {
  assert.deepEqual(sameItemInList(tree(), 13).map(node => node.id), [23, 33])
  assert.deepEqual(sameItemInList(tree(), 14).map(node => node.id), [24], 'card 30 has no second text')
  assert.deepEqual(sameItemInList(tree(), 12).map(node => node.id), [22, 32])
})
test('siblings: same type, same parent', () => {
  assert.deepEqual(siblingsOf(tree(), 10).map(node => node.id), [20, 30])
  assert.deepEqual(siblingsOf(tree(), 13).map(node => node.id), [14])
  assert.deepEqual(siblingsOf(tree(), 1), [])
})
test('all of type', () => {
  assert.deepEqual(allOfType(tree(), 'text', 13).map(node => node.id), [14, 23, 24, 33])
})
test('same type: style + appearance, content untouched, missing keys removed', () => {
  const source = text(1, { bg: '#FFFFFF', nativeStyle: { backgroundColor: '#FFFFFF', padding: { all: 4 } }, nativeProperty: { typography: 'headerDefaultBold', color: '#303233' }, textAlignment: 'center' })
  const target = text(2, { value: 'keep me', radius: 8, nativeProperty: { lineLimit: 2, id: 'name' } })
  const result = applyStyle(target, captureStyle(source)) as any
  assert.equal(result.value, 'keep me')
  assert.equal(result.bg, '#FFFFFF')
  assert.equal(result.radius, undefined)
  assert.equal(result.textAlignment, 'center')
  assert.deepEqual(result.nativeStyle, { backgroundColor: '#FFFFFF', padding: { all: 4 } })
  assert.deepEqual(result.nativeProperty, { typography: 'headerDefaultBold', color: '#303233', id: 'name' })
})
test('other type: only style is pasted', () => {
  const source = card(1, [], { bg: '#FEF8FC', radius: 12, nativeStyle: { backgroundColor: '#FEF8FC' }, nativeProperty: { layout: 'row', spacing: 8 } })
  const result = applyStyle(text(2, { nativeProperty: { typography: 'labelSMedium' } }), captureStyle(source)) as any
  assert.equal(result.bg, '#FEF8FC')
  assert.equal(result.radius, 12)
  assert.equal(result.layout, undefined)
  assert.deepEqual(result.nativeProperty, { typography: 'labelSMedium' })
})
test('applyStyleTo changes only the given ids and does not share objects', () => {
  const source = text(13, { nativeStyle: { border: { width: 1, color: '#E8EAED' } } })
  const result = applyStyleTo(tree(), new Set([23, 33]), captureStyleTree(source)).root as any
  const at = (...indexes: number[]) => indexes.reduce((node, index) => node.children[index], result)
  assert.deepEqual(at(0, 1, 1, 0).nativeStyle.border, { width: 1, color: '#E8EAED' })
  assert.deepEqual(at(0, 0, 1, 1).nativeStyle, {})
  assert.notEqual(at(0, 1, 1, 0).nativeStyle, at(0, 2, 1, 0).nativeStyle)
})

test('deep: the card style and every item inside go to the other cards, by position', () => {
  const styled = tree() as any
  const source = styled.children[0].children[0]                // card 10
  source.bg = '#FEF8FC'
  source.children[0].nativeStyle = { cornerRadius: 8 }          // image
  source.children[1].nativeProperty = { spacing: 4 }            // column
  source.children[1].children[0].nativeProperty = { typography: 'headerSSemibold' }  // title
  const result = applyStyleTo(styled, new Set([20, 30]), captureStyleTree(source), true)
  const card = (index: number) => (result.root as any).children[0].children[index]
  for (const index of [1, 2]) {
    assert.equal(card(index).bg, '#FEF8FC')
    assert.deepEqual(card(index).children[0].nativeStyle, { cornerRadius: 8 })
    assert.equal(card(index).children[0].url, index === 1 ? 'b' : 'c', 'content stays')
    assert.equal(card(index).children[1].nativeProperty.spacing, 4)
    assert.equal(card(index).children[1].children[0].nativeProperty.typography, 'headerSSemibold')
  }
  // card 20: image, column, 2 texts = 4 inside; card 30: image, column, 1 text = 3 inside
  assert.equal(result.inside, 7)
  assert.equal(result.skipped, 1, "card 30 has no second text for the source's subtitle style")
})
test('deep: an item of another type at the same position is skipped', () => {
  const other = card(40, [text(41), card(42, [])])            // text where the image is
  const root = card(1, [tree().children[0].children[0], other])
  const result = applyStyleTo(root, new Set([40]), captureStyleTree(root.children[0]), true)
  // text where the image is (1) + the empty column has no place for the 2 text styles (2)
  assert.equal(result.skipped, 3)
  assert.equal(result.inside, 1, 'only the column matches')
})
test('not deep: only the node itself', () => {
  const root = tree() as any
  root.children[0].children[0].children[0].nativeStyle = { cornerRadius: 8 }
  const result = applyStyleTo(root, new Set([20]), captureStyleTree(root.children[0].children[0]))
  assert.equal(result.inside, 0)
  assert.deepEqual((result.root as any).children[0].children[1].children[0].nativeStyle, undefined)
})
