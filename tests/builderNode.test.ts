import { test } from 'node:test'
import assert from 'node:assert/strict'
import { exportProperty, exportStyle, setProperty, setStyle, setValueKey, toSchemaNode, type BuilderNode } from '../src/lib/builderNode'
import { createHistory, record, redo, undo } from '../src/lib/history'

// An imported node keeps shortcut fields next to nativeStyle / nativeProperty.
const imported = (): BuilderNode => ({
  id: 1, type: 'container', name: 'card', width: 142, bg: '#FFFFFF', padding: 8, layout: 'row',
  nativeStyle: { width: 142, backgroundColor: '#FFFFFF', padding: { all: 8 } }, nativeProperty: { layout: 'row', spacing: 4 },
  source: { type: 'container', widgetId: 'w', onTap: { actions: [] }, trackTypes: { trackId: 't' }, expire_time: 1 },
  onTap: { actions: [] }, trackTypes: { trackId: 't' }, expireTime: 1, children: [],
})

test('B1: clearing a style key removes it from the export (shortcut and nativeStyle)', () => {
  const node = setStyle(imported(), 'width', undefined)
  assert.equal(exportStyle(node).width, undefined)
  assert.equal(toSchemaNode(node).style.width, undefined)
  assert.equal(exportStyle(node).backgroundColor, '#FFFFFF', 'other keys stay')
  assert.deepEqual(exportStyle(node).padding, { all: 8 })
})
test('setStyle sets typed values; setProperty removes and sets', () => {
  let node = setStyle(imported(), 'fillMaxWidth', true)
  node = setStyle(node, 'padding', { top: 4, left: 12 })
  assert.equal(exportStyle(node).fillMaxWidth, true)
  assert.deepEqual(exportStyle(node).padding, { top: 4, left: 12 })
  node = setProperty(node, 'layout', undefined)
  node = setProperty(node, 'alignment', 'center')
  assert.deepEqual(exportProperty(node), { spacing: 4, alignment: 'center', id: 'card' })
})
test('button export keeps the ctaType default; progressBar value keys', () => {
  const button = setProperty({ id: 2, type: 'button', name: 'b', title: 'Go' }, 'color', '#EB2F96')
  assert.deepEqual(exportProperty(button), { color: '#EB2F96', type: undefined, ctaType: 'BUTTON', id: 'b' })
  const bar = setValueKey(setValueKey({ id: 3, type: 'progressBar', name: 'p', nativeValue: { currentValue: 1, maxValue: 2 } }, 'subDes1', 'a'), 'maxValue', undefined)
  assert.deepEqual(toSchemaNode(bar).value, { currentValue: 1, subDes1: 'a' })
})
test('onTap / trackTypes / expire_time come from the node fields, not source', () => {
  const node = { ...imported(), onTap: undefined, trackTypes: { trackId: 'new' }, expireTime: undefined }
  const json = toSchemaNode(node)
  assert.equal('onTap' in json, false)
  assert.equal('expire_time' in json, false)
  assert.deepEqual(json.trackTypes, { trackId: 'new' })
  assert.equal(json.widgetId, 'w', 'other source keys are kept')
})
test('history: undo / redo, typing burst merged, limit and no-op', () => {
  let history = createHistory('a')
  history = record(history, 'b', 1000)
  history = record(history, 'bc', 1100, 'node1:text')
  history = record(history, 'bcd', 1300, 'node1:text')      // same key within the window → same step
  history = record(history, 'bcde', 5000, 'node1:text')     // after the window → new step
  assert.deepEqual(history.past, ['a', 'b', 'bcd'])
  history = undo(history)
  assert.equal(history.present, 'bcd')
  history = undo(undo(history))
  assert.equal(history.present, 'a')
  assert.equal(undo(history), history)
  history = redo(history)
  assert.equal(history.present, 'b')
  assert.equal(record(history, 'b', 9000), history, 'same value is not recorded')
  assert.deepEqual(record(history, 'x', 9000).future, [], 'a new edit clears redo')
})
