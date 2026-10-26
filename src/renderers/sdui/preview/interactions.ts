// §7 — simulated actions. No network calls, no tracking: every action is only logged.
import { UNCONFIRMED } from './approx'
import type { Action, Platform } from './types'

export type CallApiOutcome = 'fail' | 'success' | 'success-cta'

export interface InteractionSettings {
  callApi: CallApiOutcome
  /** `data.cta` returned by a simulated successful CALL_API (template `cta` format, docs/sdui/components/button.md §4). */
  cta: Record<string, unknown>
}

export const DEFAULT_SIMULATED_CTA = {
  title: 'Dùng ngay', ctaType: 'BUTTON', type: 'text',
  actions: [{ actionType: 'REDIRECT', featureCode: 'ScanQRCode', params: {} }],
}

export interface LogEntry {
  id: number
  platform: Platform
  path: string
  source: 'onTap' | 'button'
  actionType: Action['actionType']
  status: 'ok' | 'failed' | 'skipped' | 'pending'
  detail: string
  payload?: unknown
}

export interface RunResult { success: boolean; data?: Record<string, any> }
export interface RunMeta { platform: Platform; path: string; source: LogEntry['source'] }

export interface Interactions {
  run(actions: Action[], meta: RunMeta): Promise<RunResult>
}

/** `log` receives new entries and later updates of the same `id`. */
export function createInteractions(settings: () => InteractionSettings, log: (entry: LogEntry) => void, latencyMs = UNCONFIRMED.callApiLatencyMs): Interactions {
  let nextId = 1
  const wait = () => new Promise(resolve => setTimeout(resolve, latencyMs))
  return {
    async run(actions, meta) {
      let result: RunResult = { success: true }
      // spec §7: actions run in order; the next one only runs when the previous one succeeded.
      for (let index = 0; index < actions.length; index++) {
        const action = actions[index]
        const base = { ...meta, actionType: action.actionType }
        if (action.actionType === 'REDIRECT') {
          // spec §7: onPress(refId = featureCode, params + { sourceFromForTracking: "service_widget" }).
          const params = { ...(action.params || {}), sourceFromForTracking: 'service_widget' }
          log({ ...base, id: nextId++, status: 'ok', detail: `REDIRECT → ${action.featureCode ?? '(thiếu featureCode)'}`, payload: { refId: action.featureCode, params } })
          result = { success: true }
          continue
        }
        const id = nextId++
        const request = { endpoint: action.endpoint, params: action.params || {} }
        log({ ...base, id, status: 'pending', detail: `CALL_API → ${action.endpoint ?? '(thiếu endpoint)'} …`, payload: request })
        await wait()
        const outcome = settings().callApi
        if (outcome === 'fail') {
          log({ ...base, id, status: 'failed', detail: `CALL_API ${action.endpoint ?? ''} thất bại (giả lập) → dừng chuỗi action`, payload: request })
          return { success: false }
        }
        // button.md §4: success = response_status.code 200 with `data`; `data.cta` replaces the button.
        const data: Record<string, any> = { itemId: 'preview-item', ...(outcome === 'success-cta' ? { cta: settings().cta } : {}) }
        log({ ...base, id, status: 'ok', detail: `CALL_API ${action.endpoint ?? ''} thành công${outcome === 'success-cta' ? ' + cta' : ''} (giả lập)`, payload: { request, response: { response_status: { code: 200 }, data } } })
        result = { success: true, data }
        if (meta.platform === 'android' && index < actions.length - 1) {
          // spec §6.7: Android ActionHandler does not wait for the CALL_API callback, so with an asynchronous
          // host the actions after CALL_API never run. iOS waits (withCheckedThrowingContinuation).
          for (const skipped of actions.slice(index + 1)) {
            log({ ...meta, actionType: skipped.actionType, id: nextId++, status: 'skipped', detail: `${skipped.actionType} không chạy trên Android (không chờ response CALL_API, spec §6.7)` })
          }
          return result
        }
      }
      return result
    },
  }
}
