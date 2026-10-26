import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildMiniAppUrl, DEFAULT_MINI_APP_URL } from '../src/lib/miniAppUrl'

test('adds templateId to an HTTPS Mini App URL', () => {
  assert.equal(
    buildMiniAppUrl('https://miniapp.example/open?source=cornerstone', 'abc-123'),
    'https://miniapp.example/open?source=cornerstone&templateId=abc-123',
  )
})

test('supports custom schemes and explicit params templates', () => {
  assert.equal(buildMiniAppUrl('momo://miniapp/open', 'abc-123'), 'momo://miniapp/open?templateId=abc-123')
  assert.equal(
    buildMiniAppUrl('momo://miniapp/open?params=%7B%22templateId%22%3A%22{templateId}%22%7D', 'abc-123'),
    'momo://miniapp/open?params=%7B%22templateId%22%3A%22abc-123%22%7D',
  )
})

test('adds encoded templateId params to the MoMo action deep link', () => {
  const result = buildMiniAppUrl(DEFAULT_MINI_APP_URL, '284a39cc-5e88-418a-bc23-d500c4e61837')
  assert.equal(
    result,
    'momo://action=marketing&refId=cornerstone_sdui&featureCode=cornerstone_sdui&params=%7B%22templateId%22%3A%22284a39cc-5e88-418a-bc23-d500c4e61837%22%7D',
  )
})

test('rejects missing configuration', () => {
  assert.throws(() => buildMiniAppUrl('', 'abc'), /Chưa cấu hình/)
  assert.throws(() => buildMiniAppUrl('not-a-url', 'abc'), /URL đầy đủ/)
})
