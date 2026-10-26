import type { Issue, Platform } from './types'

export interface UnwrapResult {
  /** Root node JSON to parse, or undefined when the platform renders nothing. */
  root: unknown
  /** §1 [chung]: when parsing `root` fails, the renderer retries with this (template_widget only). */
  retry?: unknown
  warnings: Issue[]
}

const isObject = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value)

/** §1 — extract the root node from a zone. Anything that is not a known zone is treated as a bare node. */
export function unwrapZone(input: unknown, platform: Platform): UnwrapResult {
  if (!isObject(input)) return { root: input, warnings: [] }
  if (input.type === 'template_widget' && input.templateType === 'SDUI_WIDGET') {
    // [chung] object or [object] (first element); on failure try data["data"].
    const root = Array.isArray(input.data) ? input.data[0] : input.data
    return { root, retry: isObject(input.data) ? input.data.data : undefined, warnings: [] }
  }
  if (input.type === 'server_driven_widget') {
    if (platform === 'android') {
      // D1: Android needs `data` to be an object; an array renders nothing.
      if (Array.isArray(input.data)) {
        return { root: undefined, warnings: [{ level: 'error', code: 'D1', path: 'root', platforms: ['android'], message: 'server_driven_widget.data là mảng → Android không vẽ gì.' }] }
      }
      return { root: input.data, warnings: [] }
    }
    // D1: iOS accepts an object or [object] (first element).
    return { root: Array.isArray(input.data) ? input.data[0] : input.data, warnings: [] }
  }
  return { root: input, warnings: [] }
}
