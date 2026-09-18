import axios from 'axios'
import { beginRequest, notifyRequestError } from './requestFeedback'

export const REQUEST_TIMEOUT_MS = 5000
const TIMEOUT_MESSAGE = 'Yêu cầu quá thời gian chờ 5 giây. Vui lòng thử lại.'
export function requestErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return TIMEOUT_MESSAGE
    if (!error.response) return 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.'
    return responseError(error.response.status, error.response.data)
  }
  return error instanceof Error ? error.message : 'Yêu cầu thất bại. Vui lòng thử lại.'
}
function responseError(status: number, body: unknown): string {
  const data = body as { message?: unknown; error?: unknown } | null
  const detail = data && typeof data === 'object' ? data.message || data.error : null
  if (typeof detail === 'string' && detail.length < 300) return detail
  if (status === 401) return 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status >= 500) return 'Máy chủ đang gặp lỗi. Vui lòng thử lại sau.'
  return `Yêu cầu thất bại (HTTP ${status}). Vui lòng thử lại.`
}

export const apiClient = axios.create({ timeout: REQUEST_TIMEOUT_MS })
const completions = new WeakMap<object, () => void>()
apiClient.interceptors.request.use(config => {
  completions.set(config, beginRequest())
  return config
})
apiClient.interceptors.response.use(response => {
  completions.get(response.config)?.()
  return response
}, error => {
  if (error.config) completions.get(error.config)?.()
  if (!axios.isCancel(error)) notifyRequestError(requestErrorMessage(error))
  return Promise.reject(error)
})

/** Buffer the response body so the deadline covers download as well as headers. */
export async function request(input: string, init: RequestInit = {}): Promise<Response> {
  const finish = beginRequest()
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort(init.signal?.reason)
  if (init.signal?.aborted) abort()
  else init.signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    const bytes = await response.arrayBuffer()
    const buffered = new Response([204, 205, 304].includes(response.status) ? null : bytes, {
      status: response.status, statusText: response.statusText, headers: response.headers,
    })
    if (!response.ok) {
      let body: unknown
      try { body = JSON.parse(new TextDecoder().decode(bytes)) } catch { /* Non-JSON error response */ }
      throw new Error(responseError(response.status, body))
    }
    return buffered
  } catch (error) {
    if (init.signal?.aborted && !timedOut) throw error
    const message = timedOut ? TIMEOUT_MESSAGE : error instanceof TypeError
      ? 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.'
      : requestErrorMessage(error)
    notifyRequestError(message)
    throw new Error(message)
  } finally {
    clearTimeout(timer)
    init.signal?.removeEventListener('abort', abort)
    finish()
  }
}
