// Live preview for a ```sdui block in a docs page: the block's JSON drawn by the SDUI preview renderer on both platforms.
import { useMemo } from 'react'
import { SDUICanvas } from '../renderers/sdui/preview/Canvas'
import { PLATFORMS } from '../renderers/sdui/preview/types'

const PLATFORM_LABEL = { android: 'Android', ios: 'iOS' }

export default function SDUIDocExample({ source }: { source: string }) {
  const input = useMemo(() => {
    try { return JSON.parse(source) as unknown } catch { return undefined }
  }, [source])
  if (input === undefined) return <pre><code>{source}</code></pre>

  return <div className="sdui-preview-canvases sdui-doc-example">
    {PLATFORMS.map(platform => <figure key={platform} className="sdui-preview-device">
      <figcaption>{PLATFORM_LABEL[platform]}</figcaption>
      <SDUICanvas input={input} platform={platform} />
    </figure>)}
  </div>
}
