import latestFixture from './fixtures/figma-template-latest.json'
import { DESIGN_TOKENS, resolveSDUIDesignTokens } from '../src/lib/designTokens'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/figma-template.json'
import { migrateFigmaJson } from '../src/lib/figmaMigration'

test('user sample expands repeated references and maps text, layout and SVG warnings', () => {
  const result = migrateFigmaJson(fixture)
  assert.equal(result.template.templateType, 'SDUI_WIDGET')
  const root = result.template.data[0]
  assert.equal(root.property.layout, 'scrollColumn')
  const cards = (root.value as any).children[1]
  assert.equal(cards.property.layout, 'scrollRow')
  assert.equal(cards.value.children.length, 3)
  assert.equal(cards.value.children[0].value.children[0].value.children[0].value.children[1].property.typography, 'labelSMedium')
  assert.equal(cards.value.children[0].value.children[1].type, 'image')
  assert.ok(result.warnings.some(w => w.message.includes('SVG/Path')))
  assert.ok(!result.warnings.some(w => w.message.includes('Colors.black_01')))
  assert.equal(root.style.backgroundColor, '#ffffff')
  assert.ok(!JSON.stringify(result.template).includes('ActionBaseNewHubPromotion'))
})
test('resolves explicit token mapping, relative assets and SVG replacement', () => {
  const options = { tokens: { 'Spacing.S': 8, 'Colors.black_01': '#ffffff' }, assetBaseUrl: 'https://assets.example.com', assets: { '$.body.children[1].children[0].children[1]': 'https://assets.example.com/vector.png' } }
  const result = migrateFigmaJson(fixture, options)
  const root = result.template.data[0]
  assert.equal(root.style.backgroundColor, '#ffffff')
  const card = (root.value as any).children[1].value.children[0]
  assert.equal(card.style.padding.top, 8)
  assert.equal(card.value.children[1].value, 'https://assets.example.com/vector.png')
  assert.match(card.value.children[0].value.children[0].value.children[0].value, /^https:\/\/assets.example.com\/api\//)
})
test('rejects bad format and recursive references', () => {
  assert.throws(() => migrateFigmaJson({}), /body.children/)
  assert.throws(() => migrateFigmaJson({ components: [{ type: 'A', children: [{ type: 'A' }] }], body: { children: [{ type: 'A' }] } }), /vòng lặp/)
})
test('button is semantic only when source is Button; reports unsupported props', () => {
  const result = migrateFigmaJson({ body: { children: [{ type: 'Button', props: { title: 'Save', type: 'outline', size: 'small' } }] } })
  const button = (result.template.data[0].value as any).children[0]
  assert.equal(button.type, 'button')
  assert.deepEqual(button.value, { title: 'Save', type: 'outline' })
  assert.ok(result.warnings.some(w => w.path.endsWith('.size')))
})


test('default MoMo palette and missing assets resolve for latest user fixture', () => {
  const result = migrateFigmaJson(latestFixture)
  assert.equal(result.template.data[0].style.backgroundColor, '#ffffff')
  assert.ok(!result.warnings.some(w => /Chưa map token (Colors|Spacing|Radius)/.test(w.message)))
  assert.ok(JSON.stringify(result.template).includes('https://placehold.co/84x84/png'))
})
test('design tokens resolve on SDUI import without changing text or input object', () => {
  const input = { type: 'text', style: { backgroundColor: 'Colors.black_01', padding: { all: 'Spacing.M' } }, property: { color: 'Colors.pink_03' }, value: 'Colors.black_01' }
  const output = resolveSDUIDesignTokens(input)
  assert.equal(output.style.backgroundColor, '#ffffff')
  assert.equal(output.style.padding.all, 12)
  assert.equal(output.property.color, '#eb2f96')
  assert.equal(output.value, 'Colors.black_01')
  assert.equal(input.style.backgroundColor, 'Colors.black_01')
  assert.equal(DESIGN_TOKENS['Colors.red_11'], '#fef8f8')
  assert.equal(DESIGN_TOKENS['Spacing.Size5XL'], 64)
})
