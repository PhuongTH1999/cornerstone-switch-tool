export default function SDUIIcon({ name = '', kind }: { name?: string; kind?: 'import' | 'plus' | 'edit' | 'library' }) {
  const type = kind || (/image/i.test(name) ? 'image' : /carousel|banner/i.test(name) ? 'carousel' : /promotion/i.test(name) ? 'promotion' : /insight/i.test(name) ? 'insight' : 'library')
  const paths: Record<string, React.ReactNode> = {
    image: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/></>,
    carousel: <><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M2 7v10M22 7v10m-12-5 4 0"/></>,
    promotion: <><path d="M20 13 11 22 2 13V3h10l8 8Z"/><circle cx="7" cy="8" r="1.5"/></>,
    insight: <><path d="M4 20V4M4 20h17M8 16v-4m5 4V8m5 8V5"/></>,
    import: <><path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    edit: <><path d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z"/></>,
    library: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  }
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>
}
