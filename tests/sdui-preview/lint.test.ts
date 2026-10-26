// §8 lint rows.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lint } from '../../src/renderers/sdui/preview/lint'

const NOW = 1_800_000_000_000
const find = (input: unknown, code: string, path?: string) => lint(input, NOW).filter(issue => issue.code === code && (path === undefined || issue.path === path))
const column = (children: unknown[], extra = {}) => ({ type: 'container', property: { layout: 'column', spacing: 0 }, value: { children }, ...extra })
const text = (extra = {}) => ({ type: 'text', property: {}, value: 'x', ...extra })

test('❌ node dropped on iOS only', () => {
  const issues = find(column([{ type: 'text', value: 'no property' }]), 'D18', 'root.children[0]')
  assert.ok(issues.some(issue => issue.level === 'error' && issue.platforms?.join() === 'ios'))
  assert.ok(issues.some(issue => issue.level === 'warning'))
})
test('❌ colour not #RRGGBB (D8)', () => {
  const [issue] = find(text({ property: { color: '#80A50064' } }), 'D8')
  assert.equal(issue.level, 'error')
  assert.equal(issue.path, 'root')
})
test('❌ row without width inside scrollRow (D30)', () => {
  const input = { type: 'container', property: { layout: 'scrollRow', spacing: 0 }, value: { children: [
    { type: 'container', property: { layout: 'row', spacing: 0 }, value: { children: [text()] } },
  ] } }
  assert.equal(find(input, 'D30', 'root.children[0]')[0]?.level, 'error')
})
test('❌ spacer in a column with unbounded height (D30); bounded column is fine', () => {
  assert.equal(find(column([{ type: 'spacer', property: { minLength: 0 }, value: '' }]), 'D30', 'root.children[0]').length, 1)
  assert.equal(find(column([{ type: 'spacer', property: { minLength: 0 }, value: '' }], { style: { height: 100 } }), 'D30').length, 0)
})
test('❌ pager without height (D13)', () => {
  assert.equal(find({ type: 'pager', property: {}, value: { children: [] } }, 'D13')[0]?.level, 'error')
})
test('⚠️ D2, D3, §6.2, D32, D34, D28, D29, D24, D25, D6, D7, D15, spec §8', () => {
  const input = column([
    { type: 'container', property: {}, value: { children: [] } },
    { type: 'spacer', property: {}, value: '' },
    { type: 'image', property: {}, value: 'https://x/a.png' },
    { type: 'button', property: {}, value: { title: 'a' } },
    { type: 'button', property: { ctaType: 'toggle' }, value: { title: 'a', type: 'outline' }, style: { width: 10 } },
    text({ property: { textAlignment: 'center', lineLimit: 1 }, style: { fillMaxWidth: true } }),
    { type: 'container', property: { layout: 'row', spacing: 0 }, value: { children: [text(), text()] } },
    text({ style: { width: 200 } }),
    text({ onTap: { actions: [] } }),
    text({ property: { truncationMode: 'head', lineSpacing: 2 } }),
    { type: 'progressBar', property: { barWidth: 100 }, value: { currentValue: 1, maxValue: 2 } },
    text({ trackTypes: { tracking: {} } }),
  ])
  for (const code of ['D2', 'D3', '§6.2', 'D32', 'D34', 'D28', 'D29', 'D24', 'D25', 'D6', 'D7', 'D15', 'spec §8']) {
    assert.ok(find(input, code).some(issue => issue.level === 'warning'), `missing ${code}`)
  }
})
test('ℹ️ root expire_time (D16) and unused keys (spec §2.1)', () => {
  const issues = lint(text({ expire_time: NOW + 10, widgetId: 'w', property: { id: 'x' }, onTap: { title: 't', actions: [{ actionType: 'REDIRECT', ref_id: 'r' }] } }), NOW)
  assert.ok(issues.some(issue => issue.code === 'D16' && issue.level === 'info'))
  const unused = issues.find(issue => issue.code === 'spec §2.1')!
  assert.match(unused.message, /widgetId, property\.id, onTap\.title, actions\[\]\.ref_id/)
})
test('issues carry level, code and node path, errors first', () => {
  const issues = lint(column([text({ property: { color: 'red' } })], { style: { width: 'x' } }), NOW)
  assert.ok(issues.every(issue => issue.level && issue.code && issue.path.startsWith('root')))
  assert.equal(issues[0].level, 'error')
})
