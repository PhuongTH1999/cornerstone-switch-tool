import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Navbar from '../components/Navbar'
import '../styles/docs.css'

interface DocFile {
  name: string
  title: string
  path: string
  category: string
}

const docFiles: DocFile[] = [
  { name: 'introduction', title: '📖 Guides', path: 'introduction.md', category: 'Getting Started' },
  { name: 'api', title: '🔌 APIs', path: 'api.md', category: 'Development' },
  { name: 'INTEGRATION', title: '🏗️ Architecture', path: 'INTEGRATION.md', category: 'Development' },
  { name: 'changelog', title: '📝 ChangeLog', path: 'changelog.md', category: 'References' },
]

export default function DocsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(searchParams.get('doc') || 'introduction')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const loadDoc = async () => {
      setLoading(true)
      try {
        const doc = docFiles.find(d => d.name === selectedDoc)
        if (doc) {
          const response = await fetch(`/docs/${doc.path}`)
          const text = await response.text()
          setContent(text)
          setSearchParams({ doc: selectedDoc })
        }
      } catch (error) {
        setContent('# Error loading document\n\nFailed to load the documentation file.')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadDoc()
  }, [selectedDoc, setSearchParams])

  const currentDoc = docFiles.find(d => d.name === selectedDoc)
  const groupedDocs = docFiles.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, DocFile[]>)

  return (
    <div className="docs-container">
      <Navbar />

      <div className="docs-body">
        <aside className={`docs-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="docs-sidebar-header">
            <h3>Documentation</h3>
            <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <div className="docs-nav">
            {Object.entries(groupedDocs).map(([category, docs]) => (
              <div key={category} className="docs-category">
                <div className="docs-category-title">{category}</div>
                <div className="docs-links">
                  {docs.map(doc => (
                    <button
                      key={doc.name}
                      className={`docs-link ${selectedDoc === doc.name ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedDoc(doc.name)
                        setSidebarOpen(false)
                      }}
                    >
                      {doc.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {sidebarOpen && <div className="docs-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

        <main className="docs-main">
          <div className="docs-header">
            <button className="docs-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <h1>{currentDoc?.title}</h1>
          </div>

          <div className="docs-content">
            {loading ? (
              <div className="docs-loading">Loading...</div>
            ) : (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
