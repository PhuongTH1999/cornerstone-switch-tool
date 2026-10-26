import axios, { type InternalAxiosRequestConfig } from 'axios'
import { beginRequest, notifyRequestError } from './requestFeedback'

export const REQUEST_TIMEOUT_MS = 5000
export const REQUEST_MAX_RETRIES = 2
const TIMEOUT_MESSAGE = `Yêu cầu quá thời gian chờ ${REQUEST_TIMEOUT_MS / 1000} giây sau ${REQUEST_MAX_RETRIES + 1} lần thử. Vui lòng thử lại.`
const isTimeout = (error: { code?: string }) => error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
export function requestErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (isTimeout(error)) return TIMEOUT_MESSAGE
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
interface RetryConfig extends InternalAxiosRequestConfig {
  timeoutRetry?: { count: number; finish: () => void }
}
apiClient.interceptors.request.use(config => {
  const retryConfig = config as RetryConfig
  retryConfig.timeoutRetry ??= { count: 0, finish: beginRequest() }
  return config
})
apiClient.interceptors.response.use(response => {
  const config = response.config as RetryConfig
  config.timeoutRetry?.finish()
  delete config.timeoutRetry
  return response
}, error => {
  const config = error.config as RetryConfig | undefined
  const retry = config?.timeoutRetry
  const canceled = axios.isCancel(error) || config?.signal?.aborted || config?.cancelToken?.reason
  if (!canceled && isTimeout(error) && config && retry && retry.count < REQUEST_MAX_RETRIES) {
    retry.count++
    return apiClient.request(config)
  }
  retry?.finish()
  if (config) delete config.timeoutRetry
  if (!canceled) notifyRequestError(requestErrorMessage(error))
  return Promise.reject(error)
})

/** Buffer the response body so the deadline covers download as well as headers. */
export async function request(input: string, init: RequestInit = {}): Promise<Response> {
  const finish = beginRequest()
  try {
    for (let attempt = 0; ; attempt++) {
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
        if (init.signal?.aborted) throw error
        if (timedOut && attempt < REQUEST_MAX_RETRIES) continue
        const message = timedOut ? TIMEOUT_MESSAGE : error instanceof TypeError
          ? 'Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.'
          : requestErrorMessage(error)
        notifyRequestError(message)
        throw new Error(message)
      } finally {
        clearTimeout(timer)
        init.signal?.removeEventListener('abort', abort)
      }
    }
  } finally {
    finish()
  }
}
