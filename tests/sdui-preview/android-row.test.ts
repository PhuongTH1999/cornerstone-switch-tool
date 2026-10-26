// §5.1 [A] — Compose Row weight algorithm.
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { androidWeights, classifyColumnChild, classifyRowChild } from '../../src/renderers/sdui/preview/layout/android'
import { parse } from '../../src/renderers/sdui/preview/parse'

const node = (raw: unknown) => parse(raw, 'android').node!
const text = (value: string, style = {}) => ({ type: 'text', property: {}, value, style })
const spacer = (minLength?: number) => ({ type: 'spacer', property: minLength === undefined ? {} : { minLength }, value: '' })
const icon = { type: 'image', property: {}, value: 'https://x/i.png', style: { width: 16, height: 16 } }
const container = (style = {}) => ({ type: 'container', property: { layout: 'column', spacing: 0 }, value: { children: [] }, style })
const row = (children: unknown[]) => node({ type: 'container', property: { layout: 'row', spacing: 0 }, value: { children } })
const slots = (rawChildren: unknown[]) => { const parsed = row(rawChildren); return parsed.children.map(child => classifyRowChild(child, parsed.children)) }

describe('§5.1 classification', () => {
  test('[long text, spacer, icon] → W(fill=false), W(fill=true), FIXED', () => {
    assert.deepEqual(slots([text('long'), spacer(0), icon]), [{ kind: 'weight', fill: false }, { kind: 'weight', fill: true }, { kind: 'fixed' }])
  })
  test('spacer is FIXED when the row has a weightable container', () => {
    assert.deepEqual(slots([container(), spacer(0), icon]), [{ kind: 'weight', fill: false }, { kind: 'fixed' }, { kind: 'fixed' }])
  })
  test('container with width or fillMaxWidth is not weightable', () => {
    assert.deepEqual(slots([container({ width: 50 }), spacer(0)]), [{ kind: 'fixed' }, { kind: 'weight', fill: true }])
    assert.deepEqual(slots([container({ fillMaxWidth: true }), spacer(0)]), [{ kind: 'weight', fill: true }, { kind: 'weight', fill: true }])
  })
  test('text with width is FIXED; fillMaxWidth wins over everything', () => {
    assert.deepEqual(slots([text('a', { width: 40 }), { ...icon, style: { ...icon.style, fillMaxWidth: true } }]), [{ kind: 'fixed' }, { kind: 'weight', fill: true }])
  })
  test('§5.2 column: spacer and fillMaxHeight are weighted', () => {
    const column = node({ type: 'container', property: {}, value: { children: [spacer(), text('a', { fillMaxHeight: true }), text('b')] } })
    assert.deepEqual(column.children.map(classifyColumnChild), [{ kind: 'weight', fill: true }, { kind: 'weight', fill: true }, { kind: 'fixed' }])
  })
})

describe('§5.1 androidWeights', () => {
  test('[long text, spacer, icon] in 343: text capped at ½ of the remaining space (D29)', () => {
    const result = androidWeights({ maxMain: 343, spacing: 0, children: [
      { slot: { kind: 'weight', fill: false }, natural: 500 },
      { slot: { kind: 'weight', fill: true }, natural: 0 },
      { slot: { kind: 'fixed' }, natural: 16 },
    ] })
    assert.equal(result.share, (343 - 16) / 2)
    assert.deepEqual(result.sizes, [163.5, 163.5, 16])
  })
  test('[short text, spacer, icon]: short text keeps its natural width, the leftover is not redistributed', () => {
    const result = androidWeights({ maxMain: 343, spacing: 8, children: [
      { slot: { kind: 'weight', fill: false }, natural: 60 },
      { slot: { kind: 'weight', fill: true }, natural: 0 },
      { slot: { kind: 'fixed' }, natural: 16 },
    ] })
    assert.equal(result.share, (343 - 16 - 16) / 2)
    assert.deepEqual(result.sizes, [60, 155.5, 16])
  })
  test('[text, text]: each text at most ½', () => {
    const result = androidWeights({ maxMain: 300, spacing: 0, children: [
      { slot: { kind: 'weight', fill: false }, natural: 400 },
      { slot: { kind: 'weight', fill: false }, natural: 90 },
    ] })
    assert.deepEqual(result.sizes, [150, 90])
  })
  test('row inside scrollRow (unbounded): weighted children get 0 (D30)', () => {
    const result = androidWeights({ maxMain: Infinity, spacing: 4, children: [
      { slot: { kind: 'weight', fill: false }, natural: 120 },
      { slot: { kind: 'fixed' }, natural: 16 },
    ] })
    assert.equal(result.share, 0)
    assert.deepEqual(result.sizes, [0, 16])
  })
  test('fixed children wider than the row: remaining is clamped to 0', () => {
    const result = androidWeights({ maxMain: 100, spacing: 0, children: [
      { slot: { kind: 'fixed' }, natural: 150 },
      { slot: { kind: 'weight', fill: true }, natural: 0 },
    ] })
    assert.deepEqual(result.sizes, [150, 0])
  })
})
