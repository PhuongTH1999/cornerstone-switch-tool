// One test per row of docs/sdui/sdui-preview.md §2, each run for both platforms.
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { parse } from '../../src/renderers/sdui/preview/parse'
import { unwrapZone } from '../../src/renderers/sdui/preview/unwrap'
import { parseColor } from '../../src/renderers/sdui/preview/color'
import type { Platform } from '../../src/renderers/sdui/preview/types'

const NOW = 1_800_000_000_000
const run = (raw: unknown, platform: Platform) => parse(raw, platform, { now: NOW }).node
const text = (extra: Record<string, unknown> = {}) => ({ type: 'text', property: {}, value: 'Hi', ...extra })
const column = (children: unknown) => ({ type: 'container', property: { layout: 'column', spacing: 0 }, value: { children } })

/** Expected outcome per platform: 'drawn' or 'null'. */
function both(name: string, raw: () => unknown, expected: Record<Platform, 'drawn' | 'null'>, check?: (node: any, platform: Platform) => void) {
  for (const platform of ['android', 'ios'] as Platform[]) {
    test(`${name} [${platform}] → ${expected[platform]}`, () => {
      const node = run(raw(), platform)
      assert.equal(node ? 'drawn' : 'null', expected[platform])
      if (node && check) check(node, platform)
    })
  }
}

describe('§2 type', () => {
  both('type missing', () => ({ property: {}, value: 'x' }), { android: 'null', ios: 'null' })
  both('type unknown', () => ({ type: 'divider', property: {}, value: '' }), { android: 'null', ios: 'null' })
  both('type is case-sensitive', () => ({ type: 'Text', property: {}, value: 'x' }), { android: 'null', ios: 'null' })
  both('all 10 types are known', () => ({ type: 'pageIndicator', property: {}, value: '' }), { android: 'drawn', ios: 'drawn' })
})

describe('§2 property missing / not an object (D18)', () => {
  both('text without property', () => ({ type: 'text', value: 'Hi' }), { android: 'drawn', ios: 'null' }, node => assert.deepEqual(node.property, {}))
  both('text with property: []', () => text({ property: [] }), { android: 'drawn', ios: 'null' })
  both('container without property', () => ({ type: 'container', value: { children: [] } }), { android: 'drawn', ios: 'null' })
  both('button without property → {}', () => ({ type: 'button', value: { title: 'Go' } }), { android: 'drawn', ios: 'drawn' }, node => assert.deepEqual(node.property, { actions: [] }))
  both('button with property: "x" → {}', () => ({ type: 'button', property: 'x', value: { title: 'Go' } }), { android: 'drawn', ios: 'drawn' })
})

describe('§2 property key with the wrong type', () => {
  both('text lineLimit: "1"', () => text({ property: { lineLimit: '1', color: '#303233' } }), { android: 'drawn', ios: 'null' },
    node => { assert.equal(node.property.lineLimit, undefined); assert.equal(node.property.color, '#303233') })
  both('image aspectRatio: "16:9"', () => ({ type: 'image', property: { aspectRatio: '16:9' }, value: 'https://a/b.png' }), { android: 'drawn', ios: 'null' })
  both('box contentAlignment: 1', () => ({ type: 'box', property: { contentAlignment: 1 }, value: { children: [] } }), { android: 'drawn', ios: 'null' })
  both('container spacing: "8" (iOS lenient)', () => ({ type: 'container', property: { spacing: '8', layout: 'row' }, value: { children: [] } }), { android: 'drawn', ios: 'drawn' },
    node => { assert.equal(node.property.spacing, undefined); assert.equal(node.property.layout, 'row') })
  both('button type: 1 (iOS lenient)', () => ({ type: 'button', property: { type: 1, ctaType: 'BUTTON' }, value: { title: 'Go' } }), { android: 'drawn', ios: 'drawn' },
    node => { assert.equal(node.property.type, undefined); assert.equal(node.property.ctaType, 'BUTTON') })
  both('unknown property keys are ignored', () => text({ property: { id: 'x', fancy: 1 } }), { android: 'drawn', ios: 'drawn' }, node => assert.deepEqual(node.property, {}))
})

describe('§2 value of string types (D10)', () => {
  for (const type of ['text', 'image', 'tag', 'spacer', 'pageIndicator']) {
    both(`${type} without value`, () => ({ type, property: {} }), { android: 'drawn', ios: 'null' }, node => assert.equal(node.value, ''))
    both(`${type} with value: 5`, () => ({ type, property: {}, value: 5 }), { android: 'drawn', ios: 'null' }, node => assert.equal(node.value, ''))
  }
})

describe('§2 value of object types', () => {
  for (const type of ['container', 'box', 'pager', 'button', 'progressBar']) {
    both(`${type} without value`, () => ({ type, property: {} }), { android: 'null', ios: 'null' })
    both(`${type} with value: []`, () => ({ type, property: {}, value: [] }), { android: 'null', ios: 'null' })
  }
})

describe('§2 progressBar.value', () => {
  both('missing currentValue', () => ({ type: 'progressBar', property: {}, value: { maxValue: 10 } }), { android: 'null', ios: 'null' })
  both('maxValue as string', () => ({ type: 'progressBar', property: {}, value: { currentValue: 1, maxValue: '10' } }), { android: 'null', ios: 'null' })
  both('both numbers', () => ({ type: 'progressBar', property: {}, value: { currentValue: 1, maxValue: 10, subDes1: 'a' } }), { android: 'drawn', ios: 'drawn' },
    node => assert.deepEqual(node.value, { currentValue: 1, maxValue: 10, subDes1: 'a' }))
})

describe('§2 style (lenient per key)', () => {
  both('bad keys dropped, good keys kept', () => text({ style: { width: '100', height: 20, cornerRadius: 'x', backgroundColor: '#FFFFFF' } }), { android: 'drawn', ios: 'drawn' },
    node => assert.deepEqual(node.style, { height: 20, backgroundColor: '#FFFFFF' }))
  both('fillMaxWidth / fillMaxHeight accept 0/1', () => text({ style: { fillMaxWidth: 1, fillMaxHeight: 0 } }), { android: 'drawn', ios: 'drawn' },
    node => { assert.equal(node.style.fillMaxWidth, true); assert.equal(node.style.fillMaxHeight, false) })
  both('fillMaxWidth: "true" is dropped', () => text({ style: { fillMaxWidth: 'true' } }), { android: 'drawn', ios: 'drawn' }, node => assert.equal(node.style.fillMaxWidth, undefined))
  both('padding: side wins over all', () => text({ style: { padding: { all: 12, left: 4 } } }), { android: 'drawn', ios: 'drawn' },
    node => assert.deepEqual(node.style.padding, { top: 12, left: 4, right: 12, bottom: 12 }))
  both('border without color → no border', () => text({ style: { border: { width: 1 } } }), { android: 'drawn', ios: 'drawn' }, node => assert.equal(node.style.border, undefined))
  both('border without width → no border', () => text({ style: { border: { color: '#E8EAED' } } }), { android: 'drawn', ios: 'drawn' }, node => assert.equal(node.style.border, undefined))
})

describe('§2 trackTypes (D11)', () => {
  both('trackTypes: "x"', () => text({ trackTypes: 'x' }), { android: 'drawn', ios: 'null' }, node => assert.equal(node.trackTypes, undefined))
  both('trackTypes.tracking: []', () => text({ trackTypes: { trackId: 'a', tracking: [] } }), { android: 'drawn', ios: 'null' })
  both('valid trackTypes kept', () => text({ trackTypes: { trackId: 'a', tracking: { id: '1' } } }), { android: 'drawn', ios: 'drawn' }, node => assert.equal(node.trackTypes.trackId, 'a'))
})

describe('§2 onTap', () => {
  both('onTap: "x" is ignored', () => text({ onTap: 'x' }), { android: 'drawn', ios: 'drawn' }, node => assert.equal(node.onTap, undefined))
  both('actions with missing / unknown actionType are dropped one by one', () => text({ onTap: { actions: [
    { featureCode: 'a' }, { actionType: 'OPEN', featureCode: 'b' }, { actionType: 'redirect', featureCode: 'c' }, { actionType: 'CALL_API', endpoint: '/x' },
  ] } }), { android: 'drawn', ios: 'drawn' }, node => assert.deepEqual(node.onTap.actions, [
    { actionType: 'REDIRECT', featureCode: 'c' }, { actionType: 'CALL_API', endpoint: '/x' },
  ]))
  both('button.property.actions use the same rule', () => ({ type: 'button', property: { actions: [{ actionType: 'x' }, { actionType: 'Call_Api', endpoint: 'e' }] }, value: { title: 'Go' } }),
    { android: 'drawn', ios: 'drawn' }, node => assert.deepEqual(node.property.actions, [{ actionType: 'CALL_API', endpoint: 'e' }]))
})

describe('§2 pager.showIndicator not boolean', () => {
  both('showIndicator: 1', () => ({ type: 'pager', property: { showIndicator: 1 }, value: { children: [] } }), { android: 'drawn', ios: 'null' },
    node => assert.equal(node.property.showIndicator, undefined, 'Android: key dropped → default true'))
})

describe('§2 children', () => {
  both('children missing → []', () => ({ type: 'container', property: {}, value: {} }), { android: 'drawn', ios: 'drawn' }, node => assert.deepEqual(node.children, []))
  both('children not an array → []', () => ({ type: 'box', property: {}, value: { children: {} } }), { android: 'drawn', ios: 'drawn' }, node => assert.deepEqual(node.children, []))
  both('a bad child drops only itself', () => column([text(), { type: 'nope' }, text({ value: 'B' })]), { android: 'drawn', ios: 'drawn' },
    node => { assert.equal(node.children.length, 2); assert.equal(node.children[1].path, 'root.children[2]') })
  both('child invalid on iOS only', () => column([text(), { type: 'text', value: 'no property' }]), { android: 'drawn', ios: 'drawn' },
    (node, platform) => assert.equal(node.children.length, platform === 'android' ? 2 : 1))
})

describe('§2 expire_time', () => {
  both('expired child (number) is dropped', () => column([text({ expire_time: NOW - 1 }), text()]), { android: 'drawn', ios: 'drawn' }, node => assert.equal(node.children.length, 1))
  both('child expiring exactly now is dropped', () => column([text({ expire_time: String(NOW) })]), { android: 'drawn', ios: 'drawn' }, node => assert.equal(node.children.length, 0))
  both('future child (string) is kept', () => column([text({ expire_time: String(NOW + 1) })]), { android: 'drawn', ios: 'drawn' }, node => assert.equal(node.children.length, 1))
  both('-1 never expires', () => column([text({ expire_time: -1 })]), { android: 'drawn', ios: 'drawn' }, node => assert.equal(node.children.length, 1))
  both('root is not checked (D16)', () => text({ expire_time: NOW - 1 }), { android: 'drawn', ios: 'drawn' })
})

describe('§1 unwrapZone', () => {
  const node = text()
  test('template_widget with [node] [both]', () => {
    for (const platform of ['android', 'ios'] as Platform[]) assert.equal(unwrapZone({ type: 'template_widget', templateType: 'SDUI_WIDGET', data: [node] }, platform).root, node)
  })
  test('template_widget with object data, retry data.data [both]', () => {
    for (const platform of ['android', 'ios'] as Platform[]) {
      const result = unwrapZone({ type: 'template_widget', templateType: 'SDUI_WIDGET', data: { data: node } }, platform)
      assert.equal(result.retry, node)
    }
  })
  test('server_driven_widget with array (D1)', () => {
    assert.equal(unwrapZone({ type: 'server_driven_widget', data: [node] }, 'android').root, undefined)
    assert.equal(unwrapZone({ type: 'server_driven_widget', data: [node] }, 'ios').root, node)
  })
  test('server_driven_widget with object [both]', () => {
    for (const platform of ['android', 'ios'] as Platform[]) assert.equal(unwrapZone({ type: 'server_driven_widget', data: node }, platform).root, node)
  })
  test('bare node', () => assert.equal(unwrapZone(node, 'ios').root, node))
})

describe('§3.1 parseColor', () => {
  const cases: [string, string | null, string | null][] = [
    ['#a50064', '#A50064', '#A50064'],
    ['A50064', null, '#A50064'],
    ['#80A50064', 'rgba(165, 0, 100, 0.502)', null],
    ['red', '#FF0000', null],
    ['#FFF', null, null],
  ]
  for (const [input, android, ios] of cases) {
    test(`${input}`, () => {
      assert.equal(parseColor(input, 'android'), android)
      assert.equal(parseColor(input, 'ios'), ios)
    })
  }
})
