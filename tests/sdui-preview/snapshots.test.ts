// Snapshot fixtures T1–T17 (docs/sdui/sdui-preview.md §9), both platforms.
// A snapshot records the rendered HTML, the lint codes and the Android weight plan. Node has no layout engine,
// so the plan uses a stub text measurer: it pins the algorithm's inputs/outputs, not pixels — pixels are
// checked on real devices (§9). Regenerate after an intended change: UPDATE_SNAPSHOTS=1 npm test
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildTree, SDUICanvas } from '../../src/renderers/sdui/preview/Canvas'
import { PreviewContext } from '../../src/renderers/sdui/preview/context'
import { layoutOf, spacingOf } from '../../src/renderers/sdui/preview/components/Container'
import { androidWeights, classifyColumnChild, classifyRowChild } from '../../src/renderers/sdui/preview/layout/android'
import { lint } from '../../src/renderers/sdui/preview/lint'
import { CANVAS_WIDTH } from '../../src/renderers/sdui/preview/tokens'
import { typographyOf } from '../../src/renderers/sdui/preview/typography'
import type { Platform, SduiNode } from '../../src/renderers/sdui/preview/types'
import { CASES } from './fixtures/cases'

const NOW = 1_800_000_000_000
const SNAPSHOT_DIR = new URL('./__snapshots__/', import.meta.url)

function matchSnapshot(name: string, value: unknown) {
  const file = new URL(`${name}.json`, SNAPSHOT_DIR)
  const text = JSON.stringify(value, null, 2) + '\n'
  if (process.env.UPDATE_SNAPSHOTS || !existsSync(file)) {
    mkdirSync(SNAPSHOT_DIR, { recursive: true })
    writeFileSync(file, text)
    return
  }
  assert.equal(text, readFileSync(file, 'utf8'), `snapshot ${name} changed — run UPDATE_SNAPSHOTS=1 npm test if intended`)
}

const render = (input: unknown, platform: Platform) => renderToStaticMarkup(
  createElement(PreviewContext.Provider, { value: { mode: 'select', animate: false } }, createElement(SDUICanvas, { input, platform, now: NOW })))

/** Stub natural width (Android): a character is 0.55 × font size wide. Only used to pin the weight plan. */
function stubWidth(node: SduiNode): number {
  const pad = (node.style.padding?.left ?? 0) + (node.style.padding?.right ?? 0)
  if (node.style.width !== undefined) return node.style.width
  const textWidth = (value: string, typography: unknown) => Math.max(...value.split('\n').map(line => line.length)) * typographyOf(typography).size * 0.55
  switch (node.type) {
    case 'text': return textWidth(node.value, node.property.typography) + pad
    case 'tag': return textWidth(node.value, 'labelSMedium') + 16 + pad
    case 'button': return textWidth(node.value.title ?? '', 'actionXsBold') + 16 + pad
    case 'spacer': return node.property.minLength ?? 0
    case 'container': {
      const widths = node.children.map(stubWidth)
      return (layoutOf(node) === 'row' || layoutOf(node) === 'scrollRow' ? widths.reduce((a, b) => a + b, 0) + spacingOf(node, 'android') * Math.max(0, widths.length - 1) : Math.max(0, ...widths)) + pad
    }
    default: return pad
  }
}

/** Android weight plan for every row / column, with the frame max-width constraints of Node.tsx. */
function weightPlan(node: SduiNode, maxWidth: number, plans: unknown[] = []) {
  const pad = (node.style.padding?.left ?? 0) + (node.style.padding?.right ?? 0)
  const frameMax = Math.min(node.style.width ?? Infinity, maxWidth)
  const inner = Number.isFinite(frameMax) ? Math.max(0, frameMax - pad) : Infinity
  const layout = node.type === 'container' ? layoutOf(node) : undefined
  if (layout === 'row') {
    const slots = node.children.map(child => classifyRowChild(child, node.children))
    const result = androidWeights({ maxMain: inner, spacing: spacingOf(node, 'android'), children: slots.map((slot, i) => ({ slot, natural: stubWidth(node.children[i]) })) })
    plans.push({ path: node.path, axis: 'row', maxMain: Number.isFinite(inner) ? inner : 'unbounded', slots: slots.map(slot => slot.kind === 'fixed' ? 'FIXED' : slot.fill ? 'W(fill)' : 'W'), share: +result.share.toFixed(2), sizes: result.sizes.map(size => +size.toFixed(2)) })
    node.children.forEach((child, i) => weightPlan(child, slots[i].kind === 'weight' ? result.share : inner, plans))
    return plans
  }
  if (layout === 'column' && node.children.some(child => classifyColumnChild(child).kind === 'weight')) {
    const maxHeight = node.style.height !== undefined ? node.style.height - (node.style.padding?.top ?? 0) - (node.style.padding?.bottom ?? 0) : 'from parent'
    plans.push({ path: node.path, axis: 'column', maxMain: maxHeight, slots: node.children.map(child => classifyColumnChild(child).kind === 'fixed' ? 'FIXED' : 'W(fill)') })
  }
  node.children.forEach(child => weightPlan(child, layout === 'scrollRow' ? Infinity : inner, plans))
  return plans
}

describe('§9 snapshot fixtures', () => {
  for (const testCase of CASES) {
    for (const platform of ['android', 'ios'] as Platform[]) {
      test(`${testCase.id} [${platform}] — ${testCase.checks}`, () => {
        const tree = buildTree(testCase.input, platform, NOW)
        assert.ok(tree.node, `${testCase.id} renders something on ${platform}`)
        matchSnapshot(`${testCase.id}.${platform}`, {
          checks: testCase.checks,
          html: render(testCase.input, platform),
          ...(platform === 'android' ? { weightPlan: weightPlan(tree.node!, CANVAS_WIDTH) } : {}),
          lint: lint(testCase.input, NOW).filter(issue => !issue.platforms || issue.platforms.includes(platform)).map(issue => `${issue.level} ${issue.code} ${issue.path}`),
        })
      })
    }
  }
})
