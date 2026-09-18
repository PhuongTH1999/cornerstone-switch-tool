export interface ErrorToast { id: number; message: string }
let snapshot = { pending: 0, toasts: [] as ErrorToast[] }
const listeners = new Set<() => void>()
let nextId = 0
const emit = () => listeners.forEach(listener => listener())
export const subscribeRequests = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export const getRequestSnapshot = () => snapshot
export function beginRequest() {
  snapshot = { ...snapshot, pending: snapshot.pending + 1 }; emit()
  let done = false
  return () => {
    if (done) return
    done = true
    snapshot = { ...snapshot, pending: Math.max(0, snapshot.pending - 1) }; emit()
  }
}
export function dismissToast(id: number) {
  snapshot = { ...snapshot, toasts: snapshot.toasts.filter(toast => toast.id !== id) }; emit()
}
export function notifyRequestError(message: string) {
  if (snapshot.toasts.some(toast => toast.message === message)) return
  const id = ++nextId
  snapshot = { ...snapshot, toasts: [...snapshot.toasts.slice(-3), { id, message }] }; emit()
  setTimeout(() => dismissToast(id), 6000)
}
