// §7 simulated actions (spec §6.7, §7).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createInteractions } from '../../src/renderers/sdui/preview/interactions'
import type { CallApiOutcome, LogEntry } from '../../src/renderers/sdui/preview/interactions'
import type { Action, Platform } from '../../src/renderers/sdui/preview/types'

const ACTIONS: Action[] = [{ actionType: 'CALL_API', endpoint: 'voucher_promotion' }, { actionType: 'REDIRECT', featureCode: 'ScanQRCode' }]
async function run(outcome: CallApiOutcome, platform: Platform, actions = ACTIONS) {
  const log = new Map<number, LogEntry>()
  const interactions = createInteractions(() => ({ callApi: outcome, cta: { title: 'Dùng ngay' } }), entry => log.set(entry.id, entry), 0)
  const result = await interactions.run(actions, { platform, path: 'root', source: 'button' })
  return { result, log: [...log.values()].map(entry => `${entry.actionType}:${entry.status}`) }
}

test('REDIRECT adds sourceFromForTracking', async () => {
  const log: LogEntry[] = []
  await createInteractions(() => ({ callApi: 'success', cta: {} }), entry => log.push(entry), 0)
    .run([{ actionType: 'REDIRECT', featureCode: 'x', params: { a: 1 } }], { platform: 'ios', path: 'root', source: 'onTap' })
  assert.deepEqual(log[0].payload, { refId: 'x', params: { a: 1, sourceFromForTracking: 'service_widget' } })
})
test('CALL_API failure stops the chain [both]', async () => {
  for (const platform of ['android', 'ios'] as Platform[]) {
    const { result, log } = await run('fail', platform)
    assert.equal(result.success, false)
    assert.deepEqual(log, ['CALL_API:failed'])
  }
})
test('iOS waits for CALL_API, then runs the next action', async () => {
  const { result, log } = await run('success-cta', 'ios')
  assert.deepEqual(log, ['CALL_API:ok', 'REDIRECT:ok'])
  assert.equal(result.success, true)
})
test('Android does not wait for CALL_API: the next action does not run (spec §6.7)', async () => {
  const { result, log } = await run('success-cta', 'android')
  assert.deepEqual(log, ['CALL_API:ok', 'REDIRECT:skipped'])
  assert.deepEqual(result.data?.cta, { title: 'Dùng ngay' })
})
test('success without cta returns data without cta', async () => {
  const { result } = await run('success', 'ios', [ACTIONS[0]])
  assert.ok(result.data)
  assert.equal(result.data!.cta, undefined)
})
