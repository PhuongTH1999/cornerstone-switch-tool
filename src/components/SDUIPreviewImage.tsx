import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { IMAGE_PLACEHOLDER } from '../lib/designTokens'

export default function SDUIPreviewImage({ src, style, alt = '' }: { src: string; style: CSSProperties; alt?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const placeholder = !src || src === IMAGE_PLACEHOLDER || /\/assets\/sdui\/brand-placeholder\.(svg|png)/.test(src) || failedSource === src
  useEffect(() => {
    const element = host.current
    if (!element) return
    const update = () => setSize({ width: Math.round(element.getBoundingClientRect().width), height: Math.round(element.getBoundingClientRect().height) })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const label = `${size.width} × ${size.height}`
  return <div ref={host} className={`sdui-preview-image${placeholder ? ' is-placeholder' : ''}`} style={{ ...style, position: 'relative', overflow: 'hidden' }} title={placeholder ? `${label} px (preview)` : alt}>
    {placeholder ? <span className="sdui-image-size" role="img" aria-label={`Ảnh mẫu ${label} pixels`} style={{ fontSize: size.width < 48 ? 7 : size.width < 90 ? 10 : 13 }}>{label}</span>
      : <img src={src} alt={alt} onError={() => setFailedSource(src)} style={{ display: 'block', width: '100%', height: '100%', objectFit: style.objectFit || 'contain' }} />}
  </div>
}
