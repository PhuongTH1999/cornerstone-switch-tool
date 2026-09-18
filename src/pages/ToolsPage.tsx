import { request } from '../lib/http'

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import '../styles/tools.scss'

type Flow = 'native' | 'rn'
type Filter = 'all' | Flow | 'ios' | 'android'

interface FlowRule {
  id: string
  platform: '' | 'ios' | 'android'
  platformVersion: string
  packageVersion: string
  device: string
  refId: string
  blockId: string
  flow: Flow
  enabled: boolean
  note: string
}

const initialRules: FlowRule[] = [
  { id: 'r1', platform: 'android', platformVersion: '', packageVersion: '2.0.0-2.3.0', device: 'Pixel 6', refId: 'ref_checkout', blockId: 'block_002', flow: 'rn', enabled: true, note: 'Native crash on Pixel 6 - fallback RN' },
  { id: 'r2', platform: 'ios', platformVersion: '16.0-16.5', packageVersion: '', device: 'iPhone 12', refId: 'ref_profile', blockId: 'block_003', flow: 'rn', enabled: true, note: 'Native unstable on iOS 16.0-16.5' },
]

const emptyRule: Omit<FlowRule, 'id'> = {
  platform: '', platformVersion: '', packageVersion: '', device: '', refId: '', blockId: '', flow: 'rn', enabled: true, note: '',
}

interface SimulatorInput {
  platform: '' | 'ios' | 'android'
  platformVersion: string
  packageVersion: string
  device: string
  refId: string
  blockId: string
}

const emptySimulator: SimulatorInput = { platform: '', platformVersion: '', packageVersion: '', device: '', refId: '', blockId: '' }

function compareVersion(left: string, right: string) {
  const a = left.split('.').map(Number)
  const b = right.split('.').map(Number)
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) - (b[index] || 0)
  }
  return 0
}

function versionMatches(version: string, range: string) {
  if (!range || !version) return true
  if (range.startsWith('>=')) return compareVersion(version, range.slice(2).trim()) >= 0
  if (range.startsWith('<=')) return compareVersion(version, range.slice(2).trim()) <= 0
  if (range.includes('-')) {
    const [min, max] = range.split('-').map((value) => value.trim())
    return compareVersion(version, min) >= 0 && compareVersion(version, max) <= 0
  }
  return compareVersion(version, range) === 0
}

function ruleMatches(rule: FlowRule, input: SimulatorInput) {
  return (!rule.platform || !input.platform || rule.platform === input.platform) &&
    (!rule.device || !input.device || rule.device.toLowerCase() === input.device.toLowerCase()) &&
    (!rule.refId || !input.refId || rule.refId === input.refId) &&
    (!rule.blockId || !input.blockId || rule.blockId === input.blockId) &&
    versionMatches(input.platformVersion, rule.platformVersion) &&
    versionMatches(input.packageVersion, rule.packageVersion)
}

function downloadJson(data: object) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'cornerstone-flow-config.json'
  link.click()
  URL.revokeObjectURL(url)
}

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'json' | 'plugin'>('rules')
  const [globalFlow, setGlobalFlow] = useState<Flow>('native')
  const [rules, setRules] = useState<FlowRule[]>(initialRules)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(emptyRule)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [showSimulator, setShowSimulator] = useState(false)
  const [simulator, setSimulator] = useState(emptySimulator)
  const [simulatorResult, setSimulatorResult] = useState('')
  const [pluginFlavor, setPluginFlavor] = useState('marketing_sdui')
  const [pluginNotes, setPluginNotes] = useState('')
  const importInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cornerstone-flow-state') || 'null')
      if (saved?.rules) setRules(saved.rules)
      if (saved?.globalDefaultFlow === 'native' || saved?.globalDefaultFlow === 'rn') setGlobalFlow(saved.globalDefaultFlow)
    } catch { /* Ignore malformed local state and use defaults. */ }
  }, [])

  useEffect(() => {
    localStorage.setItem('cornerstone-flow-state', JSON.stringify({ globalDefaultFlow: globalFlow, rules }))
  }, [globalFlow, rules])

  const config = useMemo(() => ({ version: '1.0', updatedAt: new Date().toISOString(), globalDefaultFlow: globalFlow, rules: rules.filter((rule) => rule.enabled).map(({ id, enabled, ...rule }) => rule) }), [globalFlow, rules])
  const visibleRules = rules.filter((rule) => {
    const matchesFilter = filter === 'all' || rule.flow === filter || rule.platform === filter
    const haystack = Object.values(rule).join(' ').toLowerCase()
    return matchesFilter && haystack.includes(query.toLowerCase())
  })

  const updateForm = (key: keyof typeof emptyRule, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const addRule = (event: FormEvent) => {
    event.preventDefault()
    const nextRule: FlowRule = { ...form, id: editingId || `r-${Date.now()}` }
    setRules((current) => editingId ? current.map((rule) => rule.id === editingId ? nextRule : rule) : [...current, nextRule])
    setForm(emptyRule)
    setEditingId(null)
    setShowForm(false)
    setMessage(editingId ? 'Rule updated successfully' : 'Rule added successfully')
  }

  const copyConfig = async () => {
    await navigator.clipboard?.writeText(JSON.stringify(config, null, 2))
    setMessage('JSON copied to clipboard')
  }

  const importConfig = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result))
        setGlobalFlow(imported.globalDefaultFlow === 'rn' ? 'rn' : 'native')
        setRules((imported.rules || []).map((rule: Partial<FlowRule>, index: number) => ({ ...emptyRule, ...rule, id: `import-${Date.now()}-${index}`, enabled: rule.enabled !== false })))
        setMessage('Config imported successfully')
      } catch { setMessage('Invalid JSON file') }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const downloadConfig = () => downloadJson(config)
  const editRule = (rule: FlowRule) => { setForm(rule); setEditingId(rule.id); setShowForm(true) }
  const runSimulator = (event: FormEvent) => {
    event.preventDefault()
    const match = rules.find((rule) => rule.enabled && ruleMatches(rule, simulator))
    setSimulatorResult(match ? `${match.flow === 'rn' ? 'React Native' : 'Native'} via ${match.refId || 'matching rule'}` : `${globalFlow === 'rn' ? 'React Native' : 'Native'} via global default`)
  }

  const exportPlugin = async () => {
    try {
      const [manifestResponse, uiResponse, codeResponse] = await Promise.all([request('/manifest.json'), request('/ui.html'), request('/dist/code.js')])
      if (!manifestResponse.ok || !uiResponse.ok || !codeResponse.ok) throw new Error('Plugin source files are unavailable. Run the plugin build first.')
      const manifest = await manifestResponse.json()
      const ui = await uiResponse.text()
      const code = await codeResponse.blob()
      const configData = { flavor: pluginFlavor, settings: { notes: pluginNotes } }
      manifest.name = pluginFlavor === 'marketing_sdui' ? 'SDUI Extractor (Marketing)' : 'RN Extractor (Promotion)'
      manifest.id = `extr-${pluginFlavor.replace('_', '-')}`
      const injectedUi = ui.replace('</head>', `<script>window.PLUGIN_CONFIG = ${JSON.stringify(configData)};</script></head>`)
      const zip = new JSZip()
      zip.file('manifest.json', JSON.stringify(manifest, null, 2))
      zip.file('ui.html', injectedUi)
      zip.folder('dist')?.file('code.js', code)
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = `figma-plugin-${pluginFlavor.replace('_', '-')}.zip`
      link.click()
      URL.revokeObjectURL(url)
      setMessage(`Exported ${pluginFlavor} plugin ZIP`)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Plugin export failed') }
  }

  return (
    <main className="tools-page">
      <header className="tools-header">
        <div><span className="eyebrow">Cornerstone / Workspace</span><h1>Flow tools</h1><p>Control native and React Native delivery rules from one focused workspace.</p></div>
        <div className={`active-flow active-flow-${globalFlow}`}><span className="status-dot" />{globalFlow === 'native' ? 'Native active' : 'React Native active'}</div>
      </header>

      <section className="flow-banner"><div><span className="banner-label">Global default flow</span><span className="banner-hint">Used when no rule matches the request.</span></div><div className="flow-switch" role="group" aria-label="Global default flow"><button className={globalFlow === 'native' ? 'selected' : ''} onClick={() => setGlobalFlow('native')}>Native</button><button className={globalFlow === 'rn' ? 'selected' : ''} onClick={() => setGlobalFlow('rn')}>React Native</button></div></section>

      <nav className="tools-tabs" aria-label="Flow tools">{([['rules', 'Switch rules'], ['json', 'JSON config'], ['plugin', 'Plugin config']] as const).map(([id, label]) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>{label}</button>)}</nav>

      {activeTab === 'rules' && <section className="tools-panel">
        <div className="panel-heading"><div><span className="eyebrow">Routing policy</span><h2>Switch rules</h2></div><div className="panel-actions"><button className="btn btn-ghost" onClick={() => setShowSimulator((current) => !current)}>Simulator</button><button className="btn btn-ghost" onClick={() => importInput.current?.click()}>Import</button><input ref={importInput} hidden type="file" accept=".json,application/json" onChange={importConfig} /><button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(emptyRule); setShowForm((current) => !current) }}>{showForm ? 'Close form' : '+ Add rule'}</button></div></div>
        <div className="stats-bar"><div><strong className="native-count">{rules.filter((rule) => rule.enabled && rule.flow === 'native').length}</strong><span>Native override</span></div><div><strong className="rn-count">{rules.filter((rule) => rule.enabled && rule.flow === 'rn').length}</strong><span>RN fallback</span></div><div><strong>{rules.filter((rule) => !rule.enabled).length}</strong><span>Disabled</span></div><div><strong>{rules.length}</strong><span>Total rules</span></div></div>
        <div className="rules-toolbar"><div className="filter-group">{(['all', 'rn', 'native', 'ios', 'android'] as Filter[]).map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item === 'rn' ? 'RN fallback' : item === 'all' ? 'All rules' : item === 'native' ? 'Native override' : item}</button>)}</div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search device, refId..." aria-label="Search rules" /></div>

        {showForm && <form className="rule-form" onSubmit={addRule}><div className="form-grid"><label>Platform<select value={form.platform} onChange={(event) => updateForm('platform', event.target.value)}><option value="">Any platform</option><option value="ios">iOS</option><option value="android">Android</option></select></label><label>Platform version<input value={form.platformVersion} onChange={(event) => updateForm('platformVersion', event.target.value)} placeholder=">= 17.0" /></label><label>Package version<input value={form.packageVersion} onChange={(event) => updateForm('packageVersion', event.target.value)} placeholder="2.0.0-2.5.0" /></label><label>Device model<input value={form.device} onChange={(event) => updateForm('device', event.target.value)} placeholder="iPhone 14, Pixel 7" /></label><label>refId<input value={form.refId} onChange={(event) => updateForm('refId', event.target.value)} placeholder="ref_checkout_v2" /></label><label>blockId<input value={form.blockId} onChange={(event) => updateForm('blockId', event.target.value)} placeholder="block_001" /></label></div><div className="form-footer"><div className="flow-switch"><button type="button" className={form.flow === 'native' ? 'selected' : ''} onClick={() => updateForm('flow', 'native')}>Native</button><button type="button" className={form.flow === 'rn' ? 'selected' : ''} onClick={() => updateForm('flow', 'rn')}>React Native</button></div><input value={form.note} onChange={(event) => updateForm('note', event.target.value)} placeholder="Optional note" /><button className="btn btn-primary">Save rule</button></div></form>}

        {showSimulator && <form className="simulator" onSubmit={runSimulator}><div><span className="eyebrow">Runtime check</span><h3>Simulate a request</h3></div><div className="form-grid"><label>Platform<select value={simulator.platform} onChange={(event) => setSimulator({ ...simulator, platform: event.target.value as SimulatorInput['platform'] })}><option value="">Any</option><option value="ios">iOS</option><option value="android">Android</option></select></label><label>OS version<input value={simulator.platformVersion} onChange={(event) => setSimulator({ ...simulator, platformVersion: event.target.value })} placeholder="17.2" /></label><label>Package version<input value={simulator.packageVersion} onChange={(event) => setSimulator({ ...simulator, packageVersion: event.target.value })} placeholder="2.2.0" /></label><label>Device<input value={simulator.device} onChange={(event) => setSimulator({ ...simulator, device: event.target.value })} placeholder="Pixel 6" /></label><label>refId<input value={simulator.refId} onChange={(event) => setSimulator({ ...simulator, refId: event.target.value })} placeholder="ref_checkout" /></label><label>blockId<input value={simulator.blockId} onChange={(event) => setSimulator({ ...simulator, blockId: event.target.value })} placeholder="block_002" /></label></div><button className="btn btn-primary">Run simulation</button>{simulatorResult && <strong className="simulator-result">Result: {simulatorResult}</strong>}</form>}

        <div className="rules-list">{visibleRules.length === 0 ? <div className="empty-state">No rules match the current filters.</div> : visibleRules.map((rule) => <article className={`rule-row ${rule.enabled ? '' : 'rule-disabled'}`} key={rule.id}><div className="rule-main"><div className="rule-title"><strong>{rule.refId || 'Global match'}</strong><span className={`flow-badge flow-badge-${rule.flow}`}>{rule.flow === 'rn' ? 'React Native' : 'Native'}</span></div><p>{[rule.platform || 'Any platform', rule.device || 'Any device', rule.platformVersion && `OS ${rule.platformVersion}`, rule.packageVersion && `Package ${rule.packageVersion}`].filter(Boolean).join(' · ')} </p>{rule.note && <small>{rule.note}</small>}</div><div className="rule-meta"><code>{rule.blockId || 'any block'}</code><button className="icon-button" title={rule.enabled ? 'Disable' : 'Enable'} onClick={() => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item))}>{rule.enabled ? 'Ⅱ' : '▶'}</button><button className="icon-button" title="Edit" onClick={() => editRule(rule)}>✎</button><button className="icon-button" aria-label={`Delete ${rule.refId || 'rule'}`} onClick={() => setRules((current) => current.filter((item) => item.id !== rule.id))}>×</button></div></article>)}</div>
      </section>}

      {activeTab === 'json' && <section className="tools-panel"><div className="panel-heading"><div><span className="eyebrow">Exportable state</span><h2>JSON config</h2></div><div className="panel-actions"><button className="btn btn-ghost" onClick={copyConfig}>Copy JSON</button><button className="btn btn-primary" onClick={downloadConfig}>Download</button></div></div><pre className="json-output">{JSON.stringify(config, null, 2)}</pre></section>}

      {activeTab === 'plugin' && <section className="tools-panel plugin-panel"><span className="eyebrow">Figma integration</span><h2>Plugin config</h2><p>Package the manifest, plugin UI, compiled code, and selected flavor into a loadable ZIP.</p><label>Platform flavor<select value={pluginFlavor} onChange={(event) => setPluginFlavor(event.target.value)}><option value="marketing_sdui">Marketing Platform - SDUI Native</option><option value="promotion_rn">Promotion Hub - React Native</option></select></label><label>Notes<textarea value={pluginNotes} onChange={(event) => setPluginNotes(event.target.value)} placeholder="Campaign Spring 2026" /></label><button className="btn btn-primary" onClick={exportPlugin}>Download plugin ZIP</button></section>}
      {message && <div className="tools-toast" role="status">{message}</div>}
    </main>
  )
}
