import { resolveExportAssets } from '../lib/exportAssets'
import ReactMarkdown from 'react-markdown'
import importGuide from '../../docs/sdui/figma-import-guide.md?raw'
import voucherReference from '../templates/voucher-reference.json'
import { useState } from 'react'
import { migrateFigmaJson, type MigrationResult } from '../lib/figmaMigration'

export default function FigmaMigration({ onImport }: { onImport: (result: MigrationResult) => void }) {
  const [input, setInput] = useState('')
  const [mapping, setMapping] = useState('{"tokens": {}, "assets": {}}')
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const reset = () => { setResult(null); setError(''); setAccepted(false) }
  const convert = () => {
    reset()
    try {
      const options = JSON.parse(mapping)
      if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('Mapping phải là object.')
      for (const key of ['tokens', 'assets']) if (options[key] && (typeof options[key] !== 'object' || Array.isArray(options[key]))) throw new Error(`${key} phải là object.`)
      if (options.tokens && Object.values(options.tokens).some(value => typeof value !== 'string' && typeof value !== 'number')) throw new Error('Token value phải là string hoặc number.')
      if (options.assets && Object.values(options.assets).some(value => typeof value !== 'string')) throw new Error('Asset value phải là URL string.')
      if (options.assetBaseUrl && !/^https?:\/\//.test(options.assetBaseUrl)) throw new Error('assetBaseUrl cần bắt đầu bằng http:// hoặc https://.')
      const converted = migrateFigmaJson(JSON.parse(input), options)
      converted.template = resolveExportAssets(converted.template, import.meta.env.VITE_PUBLIC_ASSET_URL || window.location.origin)
      setResult(converted)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể chuyển JSON.') }
  }
  const download = () => {
    if (!result) return
    const url = URL.createObjectURL(new Blob([JSON.stringify(result.template, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'migrated-sdui-template.json'; link.click(); URL.revokeObjectURL(url)
  }
  return <section className="sdui-card sdui-wide-card">
    <h2>Figma JSON → SDUI template</h2>
    <p className="sdui-muted">Tạo UI từ link Figma trên MoMo Design, sau đó dán JSON vào đây để chuyển sang SDUI template.</p>
    <details className="sdui-migration-guide" open>
      <summary>Hướng dẫn: Figma → MoMo Design → SDUI</summary>
      <div className="sdui-doc-content"><ReactMarkdown>{importGuide}</ReactMarkdown></div>
    </details>
    <div className="sdui-library-actions" style={{ marginTop: 16 }}><button className="sdui-quiet" onClick={() => onImport({ name: 'Voucher carousel — reference', template: voucherReference as MigrationResult['template'], warnings: [] })}>Mở mẫu voucher theo ảnh</button></div>
    <p className="sdui-muted">Mẫu tham chiếu: card 142 × 140, logo minh họa, CTA outline hồng. Thay logo và nội dung trước khi sử dụng.</p>
    <label className="sdui-label">Upload JSON<input type="file" accept=".json,application/json" onChange={async event => {
      const file = event.target.files?.[0]; if (!file) return
      reset()
      try { setInput(await file.text()) } catch { setError('Không đọc được file.') }
      event.target.value = ''
    }} /></label>
    <label className="sdui-label">JSON Figma<textarea className="sdui-output" value={input} onChange={event => { setInput(event.target.value); reset() }} placeholder='{"meta": {}, "components": [], "body": {"children": []}}' /></label>
    <details><summary>Token & asset mapping</summary>
      <p className="sdui-muted">Đã có sẵn Colors, Spacing và Radius của MoMo. tokens: ghi đè giá trị mặc định khi cần. assets: map URL cũ hoặc đường dẫn node trong cảnh báo sang URL ảnh HTTP(S). assetBaseUrl: domain chứa ảnh tương đối. Ảnh/SVG chưa có URL dùng ảnh PNG placeholder online và có cảnh báo; token chưa biết vẫn được báo rõ.</p>
      <label className="sdui-label">Mapping JSON<textarea className="builder-json-input" value={mapping} onChange={event => { setMapping(event.target.value); reset() }} /></label>
    </details>
    <button className="sdui-primary" disabled={!input.trim()} onClick={convert}>Convert to SDUI</button>
    {error && <p className="sdui-import-error" role="alert">{error}</p>}
    {result && <>
      <h3>{result.name}</h3>
      <p role="status">Đã tạo template_widget / SDUI_WIDGET · {result.warnings.length} cảnh báo</p>
      {!!result.warnings.length && <div className="sdui-migration-warnings"><ul>{result.warnings.map((warning, index) => <li key={index}><code>{warning.path}</code>: {warning.message}</li>)}</ul></div>}
      <label className="sdui-label">SDUI output<textarea className="sdui-output" readOnly value={JSON.stringify(result.template, null, 2)} /></label>
      {!!result.warnings.length && <label><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} /> Tôi đã xem cảnh báo và sẽ bổ sung các phần còn thiếu.</label>}
      <div className="sdui-library-actions">
        <button className="sdui-quiet" disabled={!!result.warnings.length && !accepted} onClick={download}>Download JSON</button>
        <button className="sdui-primary" disabled={!!result.warnings.length && !accepted} onClick={() => onImport(result)}>Open in Editor</button>
      </div>
      <p className="sdui-muted">Mở editor để kiểm tra preview; chỉ ghi lên API khi bạn chọn Save schema.</p>
    </>}
  </section>
}
