import containerDocument from '../../docs/sdui/components/container.md?raw'
import textDocument from '../../docs/sdui/components/text.md?raw'
import imageDocument from '../../docs/sdui/components/image.md?raw'
import buttonDocument from '../../docs/sdui/components/button.md?raw'
import tagDocument from '../../docs/sdui/components/tag.md?raw'
import spacerDocument from '../../docs/sdui/components/spacer.md?raw'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import editorReference from '../../docs/sdui/overview.md?raw'
import commonReference from '../../docs/sdui/common.md?raw'
import manifest from '../../docs/sdui/manifest.json'
import schemaReference from '../../sdui-json-schema.md?raw'

const componentDocuments: Record<string, string> = {
  'components/container.md': containerDocument,
  'components/text.md': textDocument,
  'components/image.md': imageDocument,
  'components/button.md': buttonDocument,
  'components/tag.md': tagDocument,
  'components/spacer.md': spacerDocument,
}

const sections = [
  { id: 'editor', title: 'Tổng quan & hỗ trợ editor', content: editorReference },
  { id: 'common', title: 'Common — style & hành vi chung', content: commonReference },
  ...manifest.components.map(component => ({
    id: component.id,
    title: component.title,
    content: componentDocuments[component.file],
  })),
  { id: 'reference', title: 'Schema & ví dụ tổng hợp', content: schemaReference },
]

export default function SDUIDocumentation() {
  const [selected, setSelected] = useState('editor')
  const [query, setQuery] = useState('')
  const current = sections.find(section => section.id === selected) || sections[0]
  const matches = sections.filter(section => `${section.title} ${section.content}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  return <section className="sdui-documentation sdui-wide-card" aria-label="SDUI documentation">
    <aside className="sdui-doc-sidebar sdui-card">
      <h2>SDUI Document</h2>
      <label className="sdui-label">Tìm component, props hoặc style<input type="search" placeholder="Ví dụ: button, padding, onTap…" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <nav aria-label="Mục lục SDUI">
        {matches.map(section => <button key={section.id} type="button" aria-current={selected === section.id ? 'page' : undefined} onClick={() => setSelected(section.id)}>{section.title}</button>)}
        {!matches.length && <p className="sdui-muted">Không có mục phù hợp.</p>}
      </nav>
    </aside>
    <article className="sdui-doc-content sdui-card" key={current.id}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        a: ({ href, children }) => href === '../common.md'
          ? <button className="sdui-quiet" onClick={() => setSelected('common')}>{children}</button>
          : <a href={href}>{children}</a>,
      }}>{current.content}</ReactMarkdown>
    </article>
  </section>
}
