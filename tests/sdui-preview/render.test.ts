// Render checks for each component, both platforms (server render: no DOM measuring).
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { SDUICanvas } from '../../src/renderers/sdui/preview/Canvas'
import { PreviewContext } from '../../src/renderers/sdui/preview/context'
import { buttonKind } from '../../src/renderers/sdui/preview/components/Button'
import { progressRatio, truncateSubDes1 } from '../../src/renderers/sdui/preview/components/ProgressBar'
import { indicatorPadding } from '../../src/renderers/sdui/preview/components/Pager'
import type { Platform } from '../../src/renderers/sdui/preview/types'

export const render = (input: unknown, platform: Platform) => renderToStaticMarkup(
  createElement(PreviewContext.Provider, { value: { mode: 'select', animate: false } }, createElement(SDUICanvas, { input, platform, now: 1_800_000_000_000 })))

const text = (property: object, style = {}) => ({ type: 'text', property, value: 'Hello', style })

describe('text', () => {
  test('line-height: Android kits vs iOS natural (D27)', () => {
    assert.match(render(text({ typography: 'headerDefaultBold' }), 'android'), /font-size:16px;font-weight:700;line-height:22px/)
    assert.match(render(text({ typography: 'headerDefaultBold' }), 'ios'), /font-size:16px;font-weight:700;line-height:19.09px/)
  })
  test('unknown typography → descriptionDefaultRegular', () => {
    assert.match(render(text({ typography: 'HeaderDefaultBold' }), 'android'), /font-size:12px;font-weight:400;line-height:18px/)
  })
  test('invalid colour → Android #303233, iOS black (§3.1)', () => {
    assert.match(render(text({ color: 'A50064' }), 'android'), /color:#303233/)
    assert.match(render(text({ color: 'A50064' }), 'ios'), /color:#A50064/)
    assert.match(render(text({ color: '#80A50064' }), 'ios'), /color:#000000/)
  })
  test('lineSpacing replaces line-height on Android (D7)', () => {
    assert.match(render(text({ lineSpacing: 4 }), 'android'), /line-height:4px/)
    assert.match(render(text({ lineSpacing: 4 }), 'ios'), /line-height:18.32px/)
  })
  test('truncationMode head: only iOS (D6)', () => {
    assert.doesNotMatch(render(text({ lineLimit: 1, truncationMode: 'head' }), 'android'), /direction:rtl/)
    assert.match(render(text({ lineLimit: 1, truncationMode: 'head' }), 'ios'), /direction:rtl/)
  })
})

describe('frame (§4)', () => {
  const box = { type: 'container', property: { layout: 'column', spacing: 0 }, value: { children: [text({})] }, style: { width: 150, height: 124 } }
  test('content placement D24: Android top-left, iOS centred', () => {
    assert.match(render(box, 'android'), /justify-content:flex-start;align-items:flex-start/)
    assert.match(render(box, 'ios'), /align-items:center;justify-content:center/)
  })
  test('clip D26: Android only with cornerRadius > 0, iOS always', () => {
    assert.doesNotMatch(render(box, 'android'), /overflow:hidden/)
    assert.match(render(box, 'ios'), /overflow:hidden/)
    assert.match(render({ ...box, style: { ...box.style, cornerRadius: 8 } }, 'android'), /overflow:hidden/)
  })
  test('tap area D25: iOS without background paints-only', () => {
    const tappable = { ...box, onTap: { actions: [{ actionType: 'REDIRECT', featureCode: 'x' }] } }
    assert.doesNotMatch(render(tappable, 'android'), /sdui-tap-painted-only/)
    assert.match(render(tappable, 'ios'), /sdui-tap-painted-only/)
    assert.doesNotMatch(render({ ...tappable, style: { ...box.style, backgroundColor: '#FFFFFF' } }, 'ios'), /sdui-tap-painted-only/)
  })
})

describe('tag', () => {
  test('preset colours and fallback (§6.4)', () => {
    const html = render({ type: 'tag', property: { tagType: 'info' }, value: 'Mới' }, 'android')
    assert.match(html, /background-color:#CCE4FF;color:#007AFF/)
    assert.match(render({ type: 'tag', property: {}, value: 'x' }, 'ios'), /background-color:#303233;color:#FFFFFF/)
  })
  test('invalid override: Android preset, iOS transparent / black', () => {
    const tag = { type: 'tag', property: { tagType: 'success', backgroundColor: 'red', textColor: 'blue' }, value: 'x' }
    assert.match(render(tag, 'android'), /background-color:#FF0000;color:#0000FF/)
    assert.match(render(tag, 'ios'), /background-color:transparent;color:#000000/)
  })
})

describe('button', () => {
  test('type fallback D32', () => {
    assert.equal(buttonKind(undefined, 'android'), 'text')
    assert.equal(buttonKind(undefined, 'ios'), 'outline')
    assert.equal(buttonKind('abc', 'android'), 'text')
    assert.equal(buttonKind('abc', 'ios'), 'primary')
    assert.equal(buttonKind('OUTLINE', 'ios'), 'outline')
  })
  test('size D33', () => {
    const button = { type: 'button', property: {}, value: { title: 'Thu thập', type: 'primary' } }
    assert.match(render(button, 'android'), /height:28px;border-radius:8px/)
    assert.match(render(button, 'ios'), /height:26.32px;border-radius:6px/)
  })
  test('title "" → Android empty button, iOS nothing (D33); no title → nothing', () => {
    const empty = { type: 'button', property: {}, value: { title: '' } }
    assert.match(render(empty, 'android'), /sdui-button/)
    assert.doesNotMatch(render(empty, 'ios'), /sdui-button/)
    assert.doesNotMatch(render({ type: 'button', property: {}, value: {} }, 'android'), /sdui-button/)
  })
  test('ICON draws nothing; TOGGLE on Android drops the frame (D34)', () => {
    assert.doesNotMatch(render({ type: 'button', property: { ctaType: 'icon' }, value: { title: 'x' } }, 'ios'), /sdui-button/)
    const toggle = { type: 'button', property: { ctaType: 'TOGGLE' }, value: { title: 'x' }, style: { backgroundColor: '#123456' } }
    assert.doesNotMatch(render(toggle, 'android'), /background-color:#123456/)
    assert.match(render(toggle, 'ios'), /background-color:#123456/)
  })
})

describe('pager / pageIndicator / progressBar', () => {
  test('paddingIndicator D12', () => {
    assert.deepEqual(indicatorPadding(undefined, 'ios'), { left: 6, top: 4, right: 6, bottom: 4 })
    assert.deepEqual(indicatorPadding({ bottom: 8 }, 'android'), { left: 6, top: 0, right: 0, bottom: 8 })
    assert.deepEqual(indicatorPadding({ bottom: 8, top: -2 }, 'ios'), { left: 4, top: 0, right: 0, bottom: 8 })
  })
  test('pageIndicator total ≤ 1 draws nothing', () => {
    assert.doesNotMatch(render({ type: 'pageIndicator', property: { total: 1 }, value: '' }, 'android'), /sdui-dots/)
    assert.match(render({ type: 'pageIndicator', property: { total: 3, activeIndex: 1 }, value: '' }, 'android'), /width:12px;height:4px/)
  })
  test('empty pager: Android nothing, iOS empty frame', () => {
    const pager = { type: 'pager', property: {}, value: { children: [] }, style: { height: 100 } }
    assert.doesNotMatch(render(pager, 'android'), /sdui-pager/)
    assert.match(render(pager, 'ios'), /sdui-pager/)
  })
  test('progress ratio and subDes1 truncation', () => {
    assert.equal(progressRatio(30, 100, 'android'), 0.3)
    assert.equal(progressRatio(-5, 100, 'android'), 0.02)
    assert.equal(progressRatio(5, 0, 'ios'), 0.02)
    assert.equal(progressRatio(500, 100, 'ios'), 1)
    assert.equal(truncateSubDes1('abcdefghijklmnopqrstuvwxyz', 'android'), 'abcdefghijklmnopqrstuvw...')
    // "ệ" written as e + two combining marks: 3 UTF-16 units, 1 visible character.
    const vietnamese = 'Tiện'.repeat(5)
    assert.equal(truncateSubDes1(vietnamese, 'ios'), vietnamese)
    assert.notEqual(truncateSubDes1(vietnamese, 'android'), vietnamese)
  })
  test('barWidth D15', () => {
    const bar = { type: 'progressBar', property: { barWidth: 200 }, value: { currentValue: 1, maxValue: 2 } }
    assert.match(render(bar, 'android'), /width:200px;align-self:flex-start/)
    assert.match(render(bar, 'ios'), /width:100%;max-width:200px;align-self:center/)
  })
})
