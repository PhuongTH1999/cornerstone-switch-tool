import { useState } from 'react'
import { copyText } from '../lib/clipboard'
import { buildVelocityRequest, findScrollRowMismatches, generateVelocityTemplate, keepFirstScrollRowItem, parseJsonField, type VelocityResponse } from '../lib/velocityTemplate'

type Tab = 'rendered_json' | 'velocity_template' | 'data_schema' | 'sample_data' | 'repeat_detections'
const TABS: Tab[] = ['rendered_json', 'velocity_template', 'data_schema', 'sample_data', 'repeat_detections']

const pretty = (text: string) => { const value = parseJsonField(text); return value === undefined ? text : JSON.stringify(value, null, 2) }

/** Calls SduiTemplateService.GenerateVelocityTemplate (via the dev gRPC bridge) with the exported schema. */
export default function VelocityTemplatePanel({ schema, previewing, onPreview, onStatus, onSelectPath }: {
  schema: Record<string, unknown>
  previewing: boolean
  /** Shows a JSON in the SDUI preview, or null to go back to the editor JSON. */
  onPreview: (json: unknown | null) => void
  onStatus: (message: string) => void
  /** Selects the editor layer at these child indexes from the root. */
  onSelectPath: (indexes: number[]) => void
}) {
  const [containerName, setContainerName] = useState('')
  const [loopVariable, setLoopVariable] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<VelocityResponse | null>(null)
  const [sentKey, setSentKey] = useState('')
  const [tab, setTab] = useState<Tab>('rendered_json')
  const [firstItemOnly, setFirstItemOnly] = useState(false)

  // BE builds one #foreach per scrollRow from item [0]: the other items must share its structure.
  const mismatches = findScrollRowMismatches(schema)
  const trimmed = firstItemOnly ? keepFirstScrollRowItem(schema) : null
  const request = buildVelocityRequest(trimmed?.schema ?? schema, { containerName, loopVariable })
  const requestKey = JSON.stringify(request)
  const stale = !!result && sentKey !== requestKey
  const rendered = parseJsonField(result?.rendered_json)
  const previewInput = Array.isArray(rendered) ? rendered[0] : rendered

  const generate = async () => {
    setLoading(true); setError('')
    try {
      const response = await generateVelocityTemplate(request)
      setResult(response); setSentKey(requestKey); setTab('rendered_json')
      if (previewing) onPreview(null)
      onStatus(response.success ? 'BE đã generate Velocity template.' : `BE trả success=false: ${response.message || 'không có message'}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không gọi được BE.')
    } finally { setLoading(false) }
  }

  const tabText = !result ? '' : tab === 'repeat_detections' ? JSON.stringify(result.repeat_detections, null, 2) : pretty(result[tab])
  const download = () => {
    const link = document.createElement('a')
    const json = tab !== 'velocity_template'
    link.href = URL.createObjectURL(new Blob([tabText], { type: json ? 'application/json' : 'text/plain' }))
    link.download = `${tab}.${json ? 'json' : 'vm'}`
    link.click(); URL.revokeObjectURL(link.href)
  }

  return <section className="sdui-card velocity-panel">
    <div className="sdui-generated-header">
      <div><div className="sdui-card-title">BE Velocity template <span>GRPC · GenerateVelocityTemplate</span></div>
        <p className="sdui-muted">Gửi JSON ở trên ({request.dynamic_fields.length} dynamic field) tới SduiTemplateService và nhận <code>rendered_json</code> — JSON app sẽ nhận.</p></div>
      <div className="preview-actions">
        <button className="sdui-primary" disabled={loading} onClick={() => void generate()}>{loading ? 'Generating…' : result ? 'Generate lại' : 'Generate'}</button>
      </div>
    </div>
    <div className="velocity-options">
      <label className="sdui-label">container_name<input value={containerName} onChange={event => setContainerName(event.target.value)} placeholder="items (mặc định)" /></label>
      <label className="sdui-label">loop_variable<input value={loopVariable} onChange={event => setLoopVariable(event.target.value)} placeholder="item (mặc định)" /></label>
    </div>
    {mismatches.length > 0 && <div className="velocity-mismatch" role="status">
      <strong>{firstItemOnly ? 'Các item khác cấu trúc sẽ không được gửi:' : 'BE sẽ từ chối: các item trong scrollRow phải cùng cấu trúc với item [0].'}</strong>
      <ul>{mismatches.map(mismatch => <li key={mismatch.path}>
        <button type="button" className="sdui-quiet" title="Chọn layer này" onClick={() => onSelectPath(mismatch.indexes)}><code>{mismatch.path}</code></button>
        <span>item [{mismatch.item}] của scrollRow <code>{mismatch.listPath}</code>: {mismatch.reason}</span>
      </li>)}</ul>
      <p className="sdui-muted">Sửa cho giống item [0] (thêm / xoá / đổi chỗ layer), hoặc chỉ gửi item [0] — BE chấp nhận scrollRow có 1 item mẫu.</p>
    </div>}
    <label className="inspector-style-deep"><input type="checkbox" checked={firstItemOnly} onChange={event => setFirstItemOnly(event.target.checked)} /> Chỉ gửi item [0] của mỗi scrollRow (item mẫu cho #foreach)</label>
    {trimmed && trimmed.dropped.length > 0 && <p className="inspector-warning">Bỏ {trimmed.dropped.length} dynamic field nằm trong các item bị bỏ: {trimmed.dropped.map(field => field.variable).join(', ')}.</p>}
    {!request.dynamic_fields.length && <p className="sdui-muted">Chưa có dynamic field — chọn text / image / tag / button và nhập Variable ở Inspector.</p>}
    {error && <p role="alert" className="sdui-import-error">{error}</p>}
    {result && <>
      <div className="velocity-result-head">
        <span className={`sdui-pill ${result.success ? '' : 'sdui-pill-muted'}`}>{result.success ? 'success' : 'success = false'}</span>
        {result.message && <span className="sdui-muted">{result.message}</span>}
        {stale && <span className="inspector-warning">JSON đã đổi sau lần generate — bấm Generate lại.</span>}
      </div>
      <div className="sdui-output-tabs" role="tablist" aria-label="Kết quả BE">
        {TABS.map(item => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>
          {item === 'repeat_detections' ? `repeat_detections (${result.repeat_detections.length})` : item}</button>)}
      </div>
      <div className="preview-actions velocity-actions">
        {tab === 'rendered_json' && <button className="sdui-native-export" disabled={previewInput === undefined} title={previewInput === undefined ? 'rendered_json không phải JSON' : undefined}
          onClick={() => onPreview(previewing ? null : previewInput)}>{previewing ? 'Quay lại JSON editor' : 'Xem trên Preview'}</button>}
        <button className="sdui-quiet" disabled={!tabText} onClick={() => void copyText(tabText).then(() => onStatus(`${tab} copied`), () => onStatus('Không thể sao chép.'))}>Copy</button>
        <button className="sdui-quiet" disabled={!tabText} onClick={download}>Download</button>
      </div>
      <pre className="builder-schema builder-schema-expanded">{tabText || '(rỗng)'}</pre>
    </>}
  </section>
}
