import { test } from 'node:test'
import assert from 'node:assert/strict'
import { request, apiClient, REQUEST_TIMEOUT_MS, REQUEST_MAX_RETRIES } from '../src/lib/http'
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

  await t.test('each 5s deadline retries stalled headers and body up to the limit', async () => {
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
    assert.ok(Date.now() - started >= REQUEST_TIMEOUT_MS * (REQUEST_MAX_RETRIES + 1) - 50)
    assert.equal(aborted, 2 * (REQUEST_MAX_RETRIES + 1))
    assert.equal(getRequestSnapshot().pending, 0)
    assert.equal(getRequestSnapshot().toasts.length, 1)
    clearToasts()
  })

  await t.test('fetch retries a cold server without clearing loading or showing a toast', async () => {
    let attempts = 0
    globalThis.fetch = async (_input, init) => {
      attempts++
      assert.equal(getRequestSnapshot().pending, 1)
      assert.equal(getRequestSnapshot().toasts.length, 0)
      if (attempts === 1) return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
      })
      return new Response('{"ready":true}')
    }
    assert.deepEqual(await (await request('/cold-start')).json(), { ready: true })
    assert.equal(attempts, 2)
    assert.equal(getRequestSnapshot().pending, 0)
    assert.equal(getRequestSnapshot().toasts.length, 0)
  })

  await t.test('Axios retries timeout codes and preserves request data', async () => {
    let attempts = 0
    await apiClient.post('/cold-start', { value: 1 }, { adapter: async config => {
      attempts++
      assert.equal(config.data, '{"value":1}')
      assert.equal(getRequestSnapshot().pending, 1)
      assert.equal(getRequestSnapshot().toasts.length, 0)
      if (attempts <= REQUEST_MAX_RETRIES) {
        throw Object.assign(new Error('timeout'), {
          isAxiosError: true, config, code: attempts === 1 ? 'ECONNABORTED' : 'ETIMEDOUT',
        })
      }
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    } })
    assert.equal(attempts, REQUEST_MAX_RETRIES + 1)
    assert.equal(getRequestSnapshot().pending, 0)
  })

  await t.test('Axios does not retry non-timeout errors or caller cancellation', async () => {
    for (const cancel of [false, true]) {
      let attempts = 0
      const controller = new AbortController()
      await assert.rejects(apiClient.get('/failure', { signal: controller.signal, adapter: async config => {
        attempts++
        if (cancel) controller.abort()
        throw Object.assign(new Error('failure'), {
          isAxiosError: true, config, code: cancel ? 'ECONNABORTED' : 'ERR_NETWORK',
        })
      } }))
      assert.equal(attempts, 1)
      assert.equal(getRequestSnapshot().pending, 0)
      assert.equal(getRequestSnapshot().toasts.length, cancel ? 0 : 1)
      clearToasts()
    }
  })

  await t.test('Axios uses 5s timeout and clears loading on success and failure', async () => {
    assert.equal(apiClient.defaults.timeout, 5000)
    await apiClient.get('/success', { adapter: async config => {
      assert.equal(getRequestSnapshot().pending, 1)
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
    } })
    assert.equal(getRequestSnapshot().pending, 0)
    let attempts = 0
    await assert.rejects(apiClient.get('/timeout', { adapter: async config => {
      attempts++
      throw Object.assign(new Error('timeout'), { isAxiosError: true, config, code: 'ECONNABORTED' })
    } }))
    assert.equal(getRequestSnapshot().pending, 0)
    assert.equal(attempts, REQUEST_MAX_RETRIES + 1)
    assert.match(getRequestSnapshot().toasts[0].message, /3 lần thử/)
  })
})
