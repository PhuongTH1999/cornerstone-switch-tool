import { test } from 'node:test'
import assert from 'node:assert/strict'
import { request, apiClient, REQUEST_TIMEOUT_MS } from '../src/lib/http'
import { getRequestSnapshot, dismissToast } from '../src/lib/requestFeedback'

function clearToasts() {
  getRequestSnapshot().toasts.forEach(toast => dismissToast(toast.id))
}

test('request feedback, failures and deadlines', async t => {
  const originalFetch = globalThis.fetch
  t.after(() => { globalThis.fetch = originalFetch; clearToasts() })

  await t.test('loading stays active until every concurrent request completes', async () => {
    const resolve: Array<(value: Response) => void> = []
    globalThis.fetch = () => new Promise<Response>(done => resolve.push(done))
    const first = request('/first')
    const second = request('/second')
    assert.equal(getRequestSnapshot().pending, 2)
    resolve[0](new Response('{}'))
    await first
    assert.equal(getRequestSnapshot().pending, 1)
    resolve[1](new Response(null, { status: 204 }))
    assert.equal((await second).status, 204)
    assert.equal(getRequestSnapshot().pending, 0)
  })

  await t.test('HTTP and network errors reject and show a deduplicated toast', async () => {
    globalThis.fetch = async () => new Response('{"message":"Cannot save template"}', { status: 400 })
    await assert.rejects(request('/save'), /Cannot save template/)
    await assert.rejects(request('/save'), /Cannot save template/)
    assert.equal(getRequestSnapshot().toasts.length, 1)
    clearToasts()
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
    await assert.rejects(request('/offline'), /Không thể kết nối/)
    assert.equal(getRequestSnapshot().pending, 0)
    assert.equal(getRequestSnapshot().toasts.length, 1)
    clearToasts()
  })

  await t.test('caller cancellation clears loading without an error toast', async () => {
    globalThis.fetch = async (_input, init) => {
      throw init?.signal?.reason
    }
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(request('/cancel', { signal: controller.signal }))
    assert.equal(getRequestSnapshot().pending, 0)
    assert.equal(getRequestSnapshot().toasts.length, 0)
  })

  await t.test('5s deadline aborts both stalled headers and stalled response body', async () => {
    let aborted = 0
    globalThis.fetch = async (input, init) => {
      if (input === '/headers') return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => { aborted++; reject(init.signal?.reason) })
      })
      return new Response(new ReadableStream({ start(controller) {
        init?.signal?.addEventListener('abort', () => { aborted++; controller.error(init.signal?.reason) })
      } }))
    }
    const started = Date.now()
    await Promise.all([
      assert.rejects(request('/headers'), /5 giây/),
      assert.rejects(request('/body'), /5 giây/),
    ])
    assert.ok(Date.now() - started >= REQUEST_TIMEOUT_MS - 50)
    assert.equal(aborted, 2)
    assert.equal(getRequestSnapshot().pending, 0)
    assert.equal(getRequestSnapshot().toasts.length, 1)
    clearToasts()
  })

  await t.test('Axios uses 5s timeout and clears loading on success and failure', async () => {
    assert.equal(apiClient.defaults.timeout, 5000)
    await apiClient.get('/success', { adapter: async config => {
      assert.equal(getRequestSnapshot().pending, 1)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    } })
    assert.equal(getRequestSnapshot().pending, 0)
    await assert.rejects(apiClient.get('/timeout', { adapter: async config => {
      throw Object.assign(new Error('timeout'), { isAxiosError: true, config, code: 'ECONNABORTED' })
    } }))
    assert.equal(getRequestSnapshot().pending, 0)
    assert.match(getRequestSnapshot().toasts[0].message, /5 giây/)
  })
})
