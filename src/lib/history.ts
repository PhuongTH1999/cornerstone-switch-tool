/** Undo / redo history for the editor tree. Edits with the same key in quick succession (typing) form one step. */

export interface History<T> {
  past: T[]
  present: T
  future: T[]
  /** Key and time of the last recorded edit, to merge a burst of typing into one step. */
  lastKey?: string
  lastAt: number
}

export const HISTORY_LIMIT = 100
export const MERGE_WINDOW_MS = 800

export const createHistory = <T>(present: T): History<T> => ({ past: [], present, future: [], lastAt: 0 })

export function record<T>(history: History<T>, next: T, now: number, key?: string): History<T> {
  if (next === history.present) return history
  const merge = key !== undefined && key === history.lastKey && now - history.lastAt < MERGE_WINDOW_MS && history.past.length > 0
  return {
    past: merge ? history.past : [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next, future: [], lastKey: key, lastAt: now,
  }
}

export function undo<T>(history: History<T>): History<T> {
  if (!history.past.length) return history
  return { past: history.past.slice(0, -1), present: history.past[history.past.length - 1], future: [history.present, ...history.future], lastAt: 0 }
}

export function redo<T>(history: History<T>): History<T> {
  if (!history.future.length) return history
  return { past: [...history.past, history.present], present: history.future[0], future: history.future.slice(1), lastAt: 0 }
}
