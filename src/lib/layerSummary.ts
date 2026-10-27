/** What a layer row shows besides its name: its content and a short layout summary. */
import { exportStyle, propertyOf, type BuilderNode } from './builderNode'

const clip = (text: string, max = 48) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)
const fileName = (url: string) => { const name = url.split(/[?#]/)[0].split('/').filter(Boolean).pop(); return name || url }

/** Content preview: a bound variable first, then the text / title / file name / values. */
export function layerContent(node: BuilderNode): string | undefined {
  if (node.variable?.trim()) return `{${node.variable.trim()}}`
  switch (node.type) {
    case 'text': case 'tag': return node.value ? `"${clip(node.value.replace(/\s+/g, ' '))}"` : undefined
    case 'button': return `title: ${clip(node.title || 'Button', 36)}`
    case 'image': return node.url ? clip(fileName(node.url), 40) : 'chưa có URL'
    case 'progressBar': return `${node.nativeValue?.currentValue ?? '?'} / ${node.nativeValue?.maxValue ?? '?'}`
    case 'pageIndicator': return `${propertyOf(node).total ?? 0} chấm`
    default: return undefined
  }
}

/** Layout summary shown on the right of the row (instead of repeating the type the icon already shows). */
export function layerMeta(node: BuilderNode): string {
  const style = exportStyle(node)
  const property = propertyOf(node)
  const count = node.children?.length ?? 0
  const size = style.width != null || style.height != null ? `${style.width ?? 'auto'}×${style.height ?? 'auto'}` : style.fillMaxWidth ? 'full' : ''
  const kind = node.type === 'container' ? property.layout || 'column'
    : node.type === 'box' || node.type === 'pager' ? node.type
    : node.type === 'spacer' ? `spacer${property.minLength != null ? ` ${property.minLength}` : ''}`
    : node.type
  return [kind, node.children ? `${count}` : '', size].filter(Boolean).join(' · ')
}

/** Text the layer search matches: name, type, layout, content, variable. */
export const layerSearchText = (node: BuilderNode) =>
  [node.name, node.type, propertyOf(node).layout, node.variable, node.value, node.title, node.url].filter(Boolean).join(' ').toLocaleLowerCase()
