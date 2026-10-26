import { Children, isValidElement, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import editorReference from '../../docs/sdui/overview.md?raw'
import commonReference from '../../docs/sdui/common.md?raw'
import manifest from '../../docs/sdui/manifest.json'
import schemaReference from '../../sdui-json-schema.md?raw'

// Every file listed in manifest.json is loaded from here; adding a document only needs a manifest entry.
const documents = import.meta.glob('../../docs/sdui/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const documentFor = (file: string) => documents[`../../docs/sdui/${file}`] ?? `Không tìm thấy \`docs/sdui/${file}\`.`

const sections = [
  { id: 'editor', title: 'Tổng quan & hỗ trợ editor', file: 'overview.md', content: editorReference },
  ...manifest.references.map(item => ({ id: item.id, title: item.title, file: item.file, content: documentFor(item.file) })),
  ...manifest.components.map(item => ({ id: item.id, title: item.title, file: item.file, content: documentFor(item.file) })),
  { id: 'common', title: 'Common (bản cũ)', file: 'common.md', content: commonReference },
  { id: 'reference', title: 'Schema & ví dụ tổng hợp (bản cũ)', file: 'sdui-json-schema.md', content: schemaReference },
]

// The docs are shared with the native-widget repo, where paths differ (`sdui/README.md`, `sdui/button.md`),
// so links are matched by file name. The only README the tab shows is the component contract.
const sectionByFileName = new Map(sections.map(section => [section.file.split('/').pop()!, section.id]))

/** GitHub-style heading slug, so the docs' own `#…` anchors keep working. */
const slug = (text: string) => text.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-')
const textOf = (children: ReactNode): string => Children.toArray(children).map(child =>
  typeof child === 'string' || typeof child === 'number' ? String(child) : isValidElement<{ children?: ReactNode }>(child) ? textOf(child.props.children) : '').join('')

export default function SDUIDocumentation() {
  const [selected, setSelected] = useState('editor')
  const [anchor, setAnchor] = useState('')
  const [query, setQuery] = useState('')
  const current = sections.find(section => section.id === selected) || sections[0]
  const matches = sections.filter(section => `${section.title} ${section.content}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  useEffect(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [anchor, selected])
  const open = (id: string, hash = '') => { setSelected(id); setAnchor(decodeURIComponent(hash)) }
  const heading = (Tag: 'h1' | 'h2' | 'h3' | 'h4') => ({ children }: { children?: ReactNode }) => <Tag id={slug(textOf(children))}>{children}</Tag>
  return <section className="sdui-documentation sdui-wide-card" aria-label="SDUI documentation">
    <aside className="sdui-doc-sidebar sdui-card">
      <h2>SDUI Document</h2>
      <p className="sdui-muted">SDUI spec {manifest.specVersion}</p>
      <label className="sdui-label">Tìm component, props hoặc style<input type="search" placeholder="Ví dụ: button, padding, onTap…" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <nav aria-label="Mục lục SDUI">
        {matches.map(section => <button key={section.id} type="button" aria-current={selected === section.id ? 'page' : undefined} onClick={() => open(section.id)}>{section.title}</button>)}
        {!matches.length && <p className="sdui-muted">Không có mục phù hợp.</p>}
      </nav>
    </aside>
    <article className="sdui-doc-content sdui-card" key={current.id}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        h1: heading('h1'), h2: heading('h2'), h3: heading('h3'), h4: heading('h4'),
        a: ({ href = '', children }) => {
          if (/^[a-z]+:/i.test(href)) return <a href={href} target="_blank" rel="noreferrer">{children}</a>
          const [path, hash = ''] = href.split('#')
          const target = path ? sectionByFileName.get(path.split('/').pop()!) : current.id
          // Links to files that only exist in the native-widget repo stay as plain text.
          if (!target) return <span title={`${href} (không có trong tool)`}>{children}</span>
          return <a href={`#${hash}`} onClick={event => { event.preventDefault(); open(target, hash) }}>{children}</a>
        },
      }}>{current.content}</ReactMarkdown>
    </article>
  </section>
}
