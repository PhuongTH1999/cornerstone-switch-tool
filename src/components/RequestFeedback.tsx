import { useEffect, useRef, useSyncExternalStore } from 'react'
import { dismissToast, getRequestSnapshot, subscribeRequests } from '../lib/requestFeedback'
import '../styles/request-feedback.scss'

export default function RequestFeedback() {
  const { pending, toasts } = useSyncExternalStore(subscribeRequests, getRequestSnapshot)
  const loadingDialog = useRef<HTMLDialogElement>(null)
  const isLoading = pending > 0

  useEffect(() => {
    const dialog = loadingDialog.current
    if (!isLoading || !dialog) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
    }
  }, [isLoading])

  return <>
    <dialog
      ref={loadingDialog}
      className="request-loading"
      aria-labelledby="request-loading-label"
      aria-modal="true"
      onCancel={event => event.preventDefault()}
    >
      <div className="request-loading-content" role="status" aria-live="polite">
        <span className="request-spinner" aria-hidden="true" />
        <p id="request-loading-label">Đang xử lý yêu cầu…</p>
        <span className="request-loading-hint">Vui lòng chờ trong giây lát</span>
      </div>
    </dialog>
    <div className="request-toasts" aria-live="polite" aria-relevant="additions">
      {toasts.map(toast => <div className="request-toast" role="alert" key={toast.id}>
        <span>{toast.message}</span><button type="button" onClick={() => dismissToast(toast.id)} aria-label="Đóng thông báo">×</button>
      </div>)}
    </div>
  </>
}
