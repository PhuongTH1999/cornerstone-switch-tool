import { IMAGE_PLACEHOLDER } from './designTokens'
/** Resolve image fields only; text and action URLs are not rewritten. */
export function resolveExportAssets<T>(input: T, baseUrl: string): T {
  const imageUrl = (value: unknown) => {
    if (typeof value !== 'string' || !value) return value
    if (/\/assets\/sdui\/brand-placeholder\.(svg|png)(?:[?#].*)?$/.test(value)) return IMAGE_PLACEHOLDER
    const path = value
    if (/^\//.test(path) || !/^[a-z][a-z\d+.-]*:/i.test(path)) return new URL(path, baseUrl).href
    return path
  }
  const visit = (value: any): any => {
    if (Array.isArray(value)) return value.map(visit)
    if (!value || typeof value !== 'object') return value
    const output = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, visit(child)]))
    if (value.type === 'image') output.value = imageUrl(value.value)
    if (value.type === 'button' && output.value && typeof output.value === 'object') {
      for (const key of ['iconLeft', 'iconRight']) if (output.value[key]) output.value[key] = imageUrl(output.value[key])
    }
    if (value.type === 'tag' && output.property?.iconUrl) output.property.iconUrl = imageUrl(output.property.iconUrl)
    return output
  }
  return visit(input)
}
