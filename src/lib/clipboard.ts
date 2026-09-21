/** Copy from a user gesture, including browsers without the Clipboard API. */
export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(value); return } catch { /* Try selection-based copy. */ }
  }
  const focused = document.activeElement as HTMLElement | null
  const selection = window.getSelection()
  const ranges = selection ? Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i).cloneRange()) : []
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.readOnly = true
  textarea.style.cssText = 'position:fixed;left:0;top:0;opacity:0;font-size:16px;pointer-events:none;'
  // A native modal makes the rest of the document inert.
  const host = document.querySelector('dialog[open]') || document.body
  host.appendChild(textarea)
  try {
    textarea.focus({ preventScroll: true })
    textarea.select()
    textarea.setSelectionRange(0, value.length)
    if (!document.execCommand('copy')) throw new Error('Clipboard permission denied')
  } finally {
    textarea.remove()
    focused?.focus({ preventScroll: true })
    if (selection) { selection.removeAllRanges(); ranges.forEach(range => selection.addRange(range)) }
  }
}
