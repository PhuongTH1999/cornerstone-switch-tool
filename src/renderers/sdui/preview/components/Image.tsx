// §6.2 image
import type { CSSProperties } from 'react'
import { parseColor } from '../color'
import { TRANSPARENT } from '../tokens'
import type { ContentProps } from '../Node'

export function ImageContent({ node, inner, style }: ContentProps) {
  const { property, value: url } = node
  const platform = inner.platform
  const { width, height, padding } = node.style
  const innerWidth = width !== undefined ? width - (padding?.left ?? 0) - (padding?.right ?? 0) : undefined
  const innerHeight = height !== undefined ? height - (padding?.top ?? 0) - (padding?.bottom ?? 0) : undefined
  const ratio = typeof property.aspectRatio === 'number' && property.aspectRatio > 0 ? property.aspectRatio : undefined
  // [chung] fill / scaleAspectFill → cover; anything else → contain.
  const fit = property.contentMode === 'fill' || property.contentMode === 'scaleAspectFill' ? 'cover' : 'contain'

  let box: CSSProperties
  if (innerWidth !== undefined && innerHeight !== undefined) {
    if (ratio && platform === 'ios') {
      // §6.2 [I]: aspectRatio with width + height → the image keeps the ratio, centred in the frame.
      const [w, h] = innerWidth / innerHeight > ratio ? [innerHeight * ratio, innerHeight] : [innerWidth, innerWidth / ratio]
      box = { width: w, height: h, alignSelf: 'center', margin: 'auto' }
    } else {
      // §6.2 [A]: aspectRatio is ignored when width + height are both set.
      box = { width: '100%', height: '100%' }
    }
  } else if (innerWidth !== undefined) {
    // [chung] width without height: height = width / aspectRatio.
    box = ratio ? { width: '100%', height: innerWidth / ratio } : { width: '100%' }
  } else if (node.style.fillMaxWidth === true && innerHeight === undefined) {
    box = ratio ? { width: '100%', aspectRatio: String(ratio) } : { width: '100%' }
  } else {
    // §6.2: no size → the downloaded image's own size (lint warns). Height only / ratio only: G2, needs confirmation.
    box = { ...(innerHeight !== undefined ? { height: '100%' } : {}), ...(ratio ? { aspectRatio: String(ratio) } : {}) }
  }

  const radius = typeof property.cornerRadius === 'number' ? property.cornerRadius : 0
  const imageCss: CSSProperties = { display: 'block', objectFit: fit, borderRadius: radius, minWidth: 0, minHeight: 0, maxWidth: '100%', ...box }
  // §6.2: no placeholder / error image — an empty URL leaves the frame empty.
  if (!url) return <div className="sdui-image-empty" style={{ ...box, ...style }} />

  if (property.tintColor !== undefined) {
    // D36: invalid tintColor → Android does not tint; iOS tints with a transparent colour (the image disappears).
    const tint = parseColor(property.tintColor, platform) ?? (platform === 'ios' ? TRANSPARENT : null)
    if (tint) {
      const mask = `url("${url}") center / ${fit} no-repeat`
      return <div className="sdui-drawn sdui-image" style={{ position: 'relative', ...style, ...box, alignSelf: box.alignSelf ?? style.alignSelf }}>
        <img src={url} alt="" style={{ ...imageCss, visibility: 'hidden' }} />
        <span style={{ position: 'absolute', inset: 0, backgroundColor: tint, borderRadius: radius, WebkitMask: mask, mask }} />
      </div>
    }
  }
  return <img className="sdui-drawn sdui-image" src={url} alt="" style={{ ...style, ...imageCss }} />
}
