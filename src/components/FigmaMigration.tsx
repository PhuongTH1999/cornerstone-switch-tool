import { resolveExportAssets } from '../lib/exportAssets'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import importGuide from '../../docs/sdui/figma-import-guide.md?raw'
import voucherReference from '../templates/voucher-reference.json'
import figmaSample from '../templates/figma-sample.json'
import { useMemo, useState } from 'react'
import { copyText } from '../lib/clipboard'
import { groupMigrationWarnings, migrateFigmaJson, unresolvedAssets, type MigrationResult, type WarningGroupId } from '../lib/figmaMigration'
import SDUIDocExample from './SDUIDocExample'
import { lint } from '../renderers/sdui/preview/lint'

const MOMO_DESIGN_URL = 'https://momo-design.mservice.com.vn/'
const DEFAULT_MAPPING = '{"tokens": {}, "assets": {}}'
const GROUP_TEXT: Record<WarningGroupId, { title: string; hint: string }> = {
  asset: { title: 'Ảnh & icon chưa có URL', hint: 'Đang hiển thị ảnh placeholder. Nhập URL ảnh thật ở mục "Thay ảnh placeholder" bên trên, hoặc sửa trong Editor.' },
  token: { title: 'Token chưa map', hint: 'Màu / khoảng cách dùng token chưa có trong bảng MoMo. Bổ sung trong Token & asset mapping rồi chuyển đổi lại.' },
  unsupported: { title: 'Thuộc tính chưa hỗ trợ', hint: 'Các giá trị này không được chuyển sang SDUI. So sánh preview với thiết kế và chỉnh lại trong Editor nếu cần.' },
  screen: { title: 'Cấu hình cấp màn hình', hint: 'Template chỉ gồm phần nội dung (body). Header, tracking, localization… cần cấu hình riêng nếu cần.' },
  other: { title: 'Cảnh báo khác', hint: 'Kiểm tra từng mục trong danh sách.' },
}
const STEPS = [
  { title: 'Lấy JSON từ MoMo Design', text: 'Dán link Figma vào MoMo Design, chọn một màn hình rồi bấm Copy JSON.' },
  { title: 'Chuyển đổi', text: 'Dán JSON hoặc kéo thả file .json vào ô bên dưới, rồi bấm Convert to SDUI.' },
  { title: 'Kiểm tra & mở Editor', text: 'Xem preview Android / iOS, xử lý cảnh báo, rồi Open in Editor để lưu.' },
]

const countNodes = (node: any): number => 1 + (Array.isArray(node?.value?.children) ? node.value.children.reduce((total: number, child: any) => total + countNodes(child), 0) : 0)
// Live check while typing: same format rule as migrateFigmaJson, without converting.
function checkInput(text: string): { ok: boolean; message: string } | null {
  if (!text.trim()) return null
  try {
    const value = JSON.parse(text)
    if (!Array.isArray(value?.body?.children)) return { ok: false, message: 'JSON hợp lệ nhưng chưa đúng định dạng MoMo Design: cần body.children (dùng Copy JSON ở bước 1).' }
    return { ok: true, message: `JSON hợp lệ · ${value.meta?.screenName || 'màn hình chưa đặt tên'} · ${value.body.children.length} khối nội dung` }
  } catch (reason) { return { ok: false, message: `JSON lỗi cú pháp: ${reason instanceof Error ? reason.message : ''}` } }
}

export default function FigmaMigration({ onImport }: { onImport: (result: MigrationResult) => void }) {
  const [input, setInput] = useState('')
  const [mapping, setMapping] = useState(DEFAULT_MAPPING)
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const inputCheck = useMemo(() => checkInput(input), [input])
  const groups = useMemo(() => result ? groupMigrationWarnings(result.warnings) : [], [result])
  const assets = useMemo(() => result ? unresolvedAssets(result.warnings) : [], [result])
  const output = useMemo(() => result ? JSON.stringify(result.template, null, 2) : '', [result])
  // Same Android / iOS checks as the Editor preview, so differences show up before opening the Editor.
  const platformIssues = useMemo(() => result ? lint(result.template).filter(issue => issue.level !== 'info') : [], [result])
  const step = !input.trim() ? 0 : !result ? 1 : 2

  const reset = () => { setResult(null); setError(''); setAccepted(false); setCopied(false) }
  const convert = (mappingText = mapping, source = input) => {
    reset()
    try {
      const options = JSON.parse(mappingText)
      if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('Mapping phải là object.')
      for (const key of ['tokens', 'assets']) if (options[key] && (typeof options[key] !== 'object' || Array.isArray(options[key]))) throw new Error(`${key} phải là object.`)
      if (options.tokens && Object.values(options.tokens).some(value => typeof value !== 'string' && typeof value !== 'number')) throw new Error('Token value phải là string hoặc number.')
      if (options.assets && Object.values(options.assets).some(value => typeof value !== 'string')) throw new Error('Asset value phải là URL string.')
      if (options.assetBaseUrl && !/^https?:\/\//.test(options.assetBaseUrl)) throw new Error('assetBaseUrl cần bắt đầu bằng http:// hoặc https://.')
      const converted = migrateFigmaJson(JSON.parse(source), options)
      converted.template = resolveExportAssets(converted.template, import.meta.env.VITE_PUBLIC_ASSET_URL || window.location.origin)
      setResult(converted)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể chuyển JSON.') }
  }
  const loadText = (text: string) => { setInput(text); setAssetUrls({}); reset() }
  const readFile = async (file?: File) => {
    if (!file) return
    try { loadText(await file.text()) } catch { reset(); setError('Không đọc được file.') }
  }
  const trySample = () => { const text = JSON.stringify(figmaSample, null, 2); loadText(text); convert(DEFAULT_MAPPING, text); setMapping(DEFAULT_MAPPING) }
  // Merge the URLs typed for placeholder images into the mapping JSON, then convert again.
  const applyAssets = () => {
    let options: Record<string, any>
    try { options = JSON.parse(mapping) } catch { setError('Mapping JSON không hợp lệ; sửa trong Token & asset mapping trước.'); return }
    const filled = Object.fromEntries(Object.entries(assetUrls).map(([key, url]) => [key, url.trim()]).filter(([, url]) => url))
    const next = JSON.stringify({ ...options, assets: { ...options.assets, ...filled } }, null, 2)
    setMapping(next); convert(next)
  }
  const download = () => {
    if (!result) return
    const url = URL.createObjectURL(new Blob([output], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'migrated-sdui-template.json'; link.click(); URL.revokeObjectURL(url)
  }
  const blocked = !!result?.warnings.length && !accepted

  return <section className="sdui-card sdui-wide-card fm">
    <header className="fm-head">
      <div><h2>Figma → SDUI template</h2><p className="sdui-muted">Chuyển một màn hình thiết kế trên MoMo Design thành SDUI template, xem trước trên Android / iOS rồi mở trong Editor để hoàn thiện.</p></div>
      <button type="button" className="sdui-quiet" aria-expanded={showGuide} onClick={() => setShowGuide(!showGuide)}>{showGuide ? 'Ẩn hướng dẫn' : 'Hướng dẫn chi tiết'}</button>
    </header>

    <ol className="fm-steps">
      {STEPS.map((item, index) => <li key={item.title} className={index < step ? 'is-done' : index === step ? 'is-current' : ''} aria-current={index === step ? 'step' : undefined}>
        <span className="fm-step-num">{index < step ? '✓' : index + 1}</span>
        <div><strong>{item.title}</strong><p>{item.text}{index === 0 && <> <a href={MOMO_DESIGN_URL} target="_blank" rel="noopener noreferrer">Mở MoMo Design ↗</a></>}</p></div>
      </li>)}
    </ol>
    {showGuide && <div className="fm-guide sdui-doc-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{importGuide}</ReactMarkdown></div>}

    <div className={`fm-workspace${result ? ' has-result' : ''}`}>
      <div className="fm-panel">
        <div className="fm-panel-head">
          <h3>JSON từ MoMo Design</h3>
          <div className="fm-panel-actions">
            <label className="sdui-quiet file-button">Chọn file .json<input hidden type="file" accept=".json,application/json" onChange={event => { void readFile(event.target.files?.[0]); event.target.value = '' }} /></label>
            {input && <button type="button" className="sdui-quiet" onClick={() => loadText('')}>Xoá</button>}
          </div>
        </div>
        <div className={`fm-drop${dragging ? ' is-dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); void readFile(event.dataTransfer.files[0]) }}>
          <textarea className="fm-input" aria-label="JSON Figma" spellCheck={false} value={input} onChange={event => { setInput(event.target.value); reset() }}
            onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && inputCheck?.ok) { event.preventDefault(); convert() } }}
            placeholder={'Dán JSON đã Copy từ MoMo Design, hoặc kéo thả file .json vào đây.\n\n{\n  "meta": { "screenName": "…" },\n  "components": [ … ],\n  "body": { "children": [ … ] }\n}'} />
          {dragging && <div className="fm-drop-hint">Thả file .json để tải lên</div>}
        </div>
        {inputCheck && <p className={`fm-check ${inputCheck.ok ? 'is-ok' : 'is-error'}`} role="status">{inputCheck.ok ? '✓' : '✕'} {inputCheck.message}</p>}

        <details className="fm-mapping">
          <summary>Token & asset mapping <span>nâng cao</span></summary>
          <ul className="sdui-muted">
            <li>Màu, khoảng cách, bo góc MoMo (<code>Colors.*</code>, <code>Spacing.*</code>, <code>Radius.*</code>) đã được map sẵn.</li>
            <li><code>tokens</code>: ghi đè hoặc bổ sung giá trị token, ví dụ <code>{'{"Colors.pink_03": "#EB2F96"}'}</code>.</li>
            <li><code>assets</code>: map URL ảnh cũ (hoặc đường dẫn node trong cảnh báo) sang URL ảnh HTTP(S).</li>
            <li><code>assetBaseUrl</code>: domain cho các đường dẫn ảnh tương đối.</li>
          </ul>
          <textarea className="builder-json-input" aria-label="Mapping JSON" spellCheck={false} value={mapping} onChange={event => { setMapping(event.target.value); reset() }} />
        </details>

        <div className="fm-convert">
          <button type="button" className="sdui-primary" disabled={!inputCheck?.ok} onClick={() => convert()}>Convert to SDUI</button>
          <span className="sdui-muted"><kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>Enter</kbd></span>
        </div>
      </div>

      <div className="fm-panel fm-result" aria-live="polite">
        {error ? <div className="fm-empty is-error" role="alert"><strong>Chưa chuyển được</strong><p>{error}</p></div>
          : !result ? <div className="fm-empty">
            <strong>Kết quả sẽ hiện ở đây</strong>
            <p>Preview Android / iOS, danh sách cảnh báo và JSON SDUI. Chưa có file? Thử một trong hai ví dụ:</p>
            <div className="fm-examples">
              <button type="button" onClick={trySample}><strong>Dùng JSON mẫu</strong><span>Carousel thẻ voucher xuất từ MoMo Design (tiêu đề + 3 thẻ Gift), có ảnh và icon thiếu URL để thử quy trình xử lý cảnh báo.</span></button>
              <button type="button" onClick={() => onImport({ name: 'Voucher carousel — reference', template: voucherReference as MigrationResult['template'], warnings: [] })}>
                <strong>Mở mẫu Voucher card</strong><span>Template đã hoàn thiện (card 142 × 140, logo, CTA viền hồng). Mở thẳng trong Editor; thay logo và nội dung trước khi dùng.</span></button>
            </div>
          </div>
          : <>
            <div className="fm-panel-head">
              <div><h3>{result.name}</h3><p className="sdui-muted">template_widget · SDUI_WIDGET · {countNodes(result.template.data[0])} component</p></div>
              <span className={`fm-badge ${result.warnings.length ? 'is-warn' : 'is-ok'}`}>{result.warnings.length ? `${result.warnings.length} cảnh báo` : 'Không có cảnh báo'}</span>
            </div>
            <SDUIDocExample source={output} />

            {!!assets.length && <form className="fm-assets" onSubmit={event => { event.preventDefault(); applyAssets() }}>
              <strong>Thay ảnh placeholder ({assets.length})</strong>
              <p className="sdui-muted">Nhập URL ảnh PNG / JPG cho từng ảnh; để trống nếu muốn thay sau trong Editor. Rê chuột vào tên để xem vị trí đầy đủ.</p>
              {assets.map(({ key, count }) => {
                const vector = key.startsWith('$.')
                const name = vector ? `Vector / icon #${assets.filter(asset => asset.key.startsWith('$.')).findIndex(asset => asset.key === key) + 1}` : key.split('/').pop()
                return <label key={key} className="fm-asset-row">
                  <span title={key}>{name}<em>{count > 1 ? `dùng ${count} lần` : vector ? 'cần export PNG' : 'dùng 1 lần'}</em></span>
                  <input type="url" aria-label={`URL cho ${name}`} placeholder="https://…" value={assetUrls[key] || ''} onChange={event => setAssetUrls({ ...assetUrls, [key]: event.target.value })} />
                </label>
              })}
              <button type="submit" className="sdui-quiet" disabled={!Object.values(assetUrls).some(url => url.trim())}>Áp dụng & chuyển đổi lại</button>
            </form>}

            {groups.map(group => <details key={group.id} className={`fm-group is-${group.id}`} open={group.id === 'asset' || group.id === 'token'}>
              <summary><strong>{GROUP_TEXT[group.id].title}</strong><span className="fm-count">{group.warnings.length}</span></summary>
              <p className="sdui-muted">{GROUP_TEXT[group.id].hint}</p>
              {!!group.keys.length && <div className="fm-keys">{group.keys.map(([key, count]) => <code key={key}>{key}{count > 1 && ` ×${count}`}</code>)}</div>}
              <ul>{group.warnings.map((warning, index) => <li key={index}><code>{warning.path}</code> {warning.message}</li>)}</ul>
            </details>)}

            {!!platformIssues.length && <details className="fm-group is-platform">
              <summary><strong>Khác biệt Android / iOS</strong><span className="fm-count">{platformIssues.length}</span></summary>
              <p className="sdui-muted">Kiểm tra giống tab Preview trong Editor: những chỗ hai nền tảng hiển thị khác nhau hoặc có thể lỗi. Sửa trong Editor, mục lint sẽ khoanh đúng node.</p>
              <ul>{platformIssues.map((issue, index) => <li key={index}>{issue.level === 'error' ? '❌' : '⚠️'} <code>{issue.path}</code> {issue.message}</li>)}</ul>
            </details>}

            <details className="fm-json">
              <summary>JSON SDUI <span>{(output.length / 1024).toFixed(1)} KB</span></summary>
              <button type="button" className="sdui-quiet" onClick={() => void copyText(output).then(() => setCopied(true))}>{copied ? 'Đã copy' : 'Copy'}</button>
              <pre>{output}</pre>
            </details>

            <div className="fm-footer">
              {!!result.warnings.length && <label className="fm-accept"><input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} /> Tôi đã xem cảnh báo và sẽ bổ sung phần còn thiếu trong Editor.</label>}
              <div className="sdui-library-actions">
                <button type="button" className="sdui-quiet" disabled={blocked} onClick={download}>Download JSON</button>
                <button type="button" className="sdui-primary" disabled={blocked} onClick={() => onImport(result)}>Open in Editor</button>
              </div>
              <p className="sdui-muted">Open in Editor chỉ mở bản nháp; template được lưu lên API khi bạn chọn Save schema.</p>
            </div>
          </>}
      </div>
    </div>
  </section>
}
