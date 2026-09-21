import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveExportAssets } from '../src/lib/exportAssets'
test('export uses absolute PNG placeholder and preserves text/external assets', () => {
  const input = [{ type: 'image', value: '/assets/sdui/brand-placeholder.svg' }, { type: 'text', value: '/assets/example' }, { type: 'image', value: 'https://cdn.example/a.png' }, { type: 'button', value: { iconLeft: '/icon.png' } }]
  const result = resolveExportAssets(input, 'https://tool.example')
  assert.equal(result[0].value, 'https://placehold.co/84x84/png')
  assert.equal(result[1].value, input[1].value)
  assert.equal(result[2].value, input[2].value)
  assert.equal((result[3].value as any).iconLeft, 'https://tool.example/icon.png')
  assert.equal(input[0].value, '/assets/sdui/brand-placeholder.svg')
})
