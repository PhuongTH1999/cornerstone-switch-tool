// The preview panel: platform switch + compare (P1), select / tap modes (§7), action log, CALL_API simulator, lint (§8).
import { useMemo, useRef, useState } from 'react'
import { SDUICanvas } from './Canvas'
import { PreviewContext } from './context'
import type { PreviewMode } from './context'
import { createInteractions, DEFAULT_SIMULATED_CTA } from './interactions'
import type { CallApiOutcome, InteractionSettings, LogEntry } from './interactions'
import { lint } from './lint'
import { SPEC_VERSION } from './tokens'
import type { Issue, Platform } from './types'

type View = Platform | 'compare'
const PLATFORM_LABEL: Record<Platform, string> = { android: 'Android', ios: 'iOS' }
const LEVEL_ICON: Record<Issue['level'], string> = { error: '❌', warning: '⚠️', info: 'ℹ️' }

export interface SDUIPreviewProps {
  /** Zone JSON or a bare node. Nodes may carry `__ref` to link back to the editor. */
  input: unknown
  selectedRef?: string
  onSelect?: (ref: string) => void
}

export default function SDUIPreview({ input, selectedRef, onSelect }: SDUIPreviewProps) {
  const [view, setView] = useState<View>('compare')
  const [mode, setMode] = useState<PreviewMode>('select')
  const [callApi, setCallApi] = useState<CallApiOutcome>('success')
  const [ctaText, setCtaText] = useState(() => JSON.stringify(DEFAULT_SIMULATED_CTA, null, 2))
  const [log, setLog] = useState<LogEntry[]>([])
  const [focusPath, setFocusPath] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  let ctaError = ''
  let cta: Record<string, unknown> = DEFAULT_SIMULATED_CTA
  try { cta = JSON.parse(ctaText) } catch { ctaError = 'cta không phải JSON hợp lệ — đang dùng cta mặc định.' }
  const settings = useRef<InteractionSettings>({ callApi, cta })
  settings.current = { callApi, cta }
  const interactions = useMemo(() => createInteractions(() => settings.current, entry => setLog(current => {
    const index = current.findIndex(item => item.id === entry.id && item.platform === entry.platform)
    return index === -1 ? [entry, ...current].slice(0, 100) : current.map((item, i) => i === index ? entry : item)
  })), [])

  const issues = useMemo(() => lint(input), [input])
  const visibleIssues = issues.filter(issue => showInfo || issue.level !== 'info')
  const counts = { error: 0, warning: 0, info: 0 }
  for (const issue of issues) counts[issue.level]++
  const platforms: Platform[] = view === 'compare' ? ['android', 'ios'] : [view]

  return <PreviewContext.Provider value={{ mode, selectedRef, interactions, animate: true }}>
    <div className={`sdui-preview-panel mode-${mode}`}>
      <div className="sdui-preview-toolbar">
        <div className="sdui-segmented" role="group" aria-label="Nền tảng">
          {(['android', 'ios', 'compare'] as View[]).map(item => <button key={item} type="button" aria-pressed={view === item} onClick={() => setView(item)}>{item === 'compare' ? 'So sánh' : PLATFORM_LABEL[item]}</button>)}
        </div>
        <div className="sdui-segmented" role="group" aria-label="Chế độ">
          <button type="button" aria-pressed={mode === 'select'} onClick={() => setMode('select')}>Chọn node</button>
          <button type="button" aria-pressed={mode === 'tap'} onClick={() => setMode('tap')}>Bấm thử</button>
        </div>
        <span className="sdui-spec-badge" title="Renderer implement theo docs/sdui/sdui-preview.md">SDUI spec {SPEC_VERSION}</span>
      </div>
      {focusPath && <style>{`.sdui-preview-panel [data-sdui-path="${focusPath.replace(/["\\]/g, '\\$&')}"] { outline: 2px dashed var(--sdui-unconfirmed); outline-offset: -2px; }`}</style>}
      <div className="sdui-preview-canvases">
        {platforms.map(platform => <figure key={platform} className="sdui-preview-device">
          <figcaption>{PLATFORM_LABEL[platform]} · 375</figcaption>
          <SDUICanvas input={input} platform={platform} onSelect={mode === 'select' ? onSelect : undefined} />
        </figure>)}
      </div>
      {mode === 'tap' && <section className="sdui-interactions" aria-label="Tương tác giả lập">
        <p className="sdui-muted">Không gọi API thật, không bắn tracking. Vùng bấm tô theo nền tảng (D25): Android cả khung; iOS chỉ chỗ có vẽ nếu node không có nền.</p>
        <label className="sdui-label">Kết quả CALL_API giả lập
          <select value={callApi} onChange={event => setCallApi(event.target.value as CallApiOutcome)}>
            <option value="fail">Thất bại</option>
            <option value="success">Thành công, không có cta</option>
            <option value="success-cta">Thành công, có cta → nút đổi</option>
          </select>
        </label>
        {callApi === 'success-cta' && <label className="sdui-label">data.cta trả về<textarea value={ctaText} onChange={event => setCtaText(event.target.value)} rows={6} /></label>}
        {ctaError && <p role="alert" className="sdui-muted">{ctaError}</p>}
        <div className="sdui-log-heading"><strong>Action log</strong>{log.length > 0 && <button type="button" className="sdui-quiet" onClick={() => setLog([])}>Xoá</button>}</div>
        {log.length === 0 ? <p className="sdui-muted">Bấm vào vùng có onTap hoặc button để xem action.</p> : <ol className="sdui-log">
          {log.map(entry => <li key={`${entry.platform}-${entry.id}`} className={`status-${entry.status}`}>
            <span className="sdui-log-meta">{PLATFORM_LABEL[entry.platform]} · {entry.source} · <code>{entry.path}</code></span>
            <span>{entry.detail}</span>
            {entry.payload !== undefined && <details><summary>payload</summary><pre>{JSON.stringify(entry.payload, null, 2)}</pre></details>}
          </li>)}
        </ol>}
      </section>}
      <section className="sdui-lint" aria-label="Cảnh báo SDUI">
        <div className="sdui-log-heading">
          <strong>Lint · {LEVEL_ICON.error} {counts.error} · {LEVEL_ICON.warning} {counts.warning} · {LEVEL_ICON.info} {counts.info}</strong>
          <label className="sdui-lint-toggle"><input type="checkbox" checked={showInfo} onChange={event => setShowInfo(event.target.checked)} /> Hiện info</label>
        </div>
        {visibleIssues.length === 0 ? <p className="sdui-muted">Không có cảnh báo.</p> : <ul className="sdui-lint-list">
          {visibleIssues.map((issue, index) => <li key={index}>
            <button type="button" className={`level-${issue.level}`} aria-pressed={focusPath === issue.path} onClick={() => setFocusPath(current => current === issue.path ? '' : issue.path)}>
              <span aria-label={issue.level}>{LEVEL_ICON[issue.level]}</span>
              <code className="sdui-lint-code">{issue.code}</code>
              <code className="sdui-lint-path">{issue.path}</code>
              {issue.platforms && <span className="sdui-lint-platform">{issue.platforms.map(platform => PLATFORM_LABEL[platform]).join(', ')}</span>}
              <span className="sdui-lint-message">{issue.message}</span>
            </button>
          </li>)}
        </ul>}
      </section>
    </div>
  </PreviewContext.Provider>
}
