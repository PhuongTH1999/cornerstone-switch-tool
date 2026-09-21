import { DESIGN_TOKENS, IMAGE_PLACEHOLDER } from './designTokens'
/** Migrates the exported meta/components/body format, not the raw Figma REST document. */
type ObjectValue = Record<string, any>
export interface MigrationNode {
  type: 'container' | 'text' | 'image' | 'button' | 'tag' | 'spacer'
  style: ObjectValue
  property: ObjectValue
  modifier?: ObjectValue
  value: string | ObjectValue
}
export interface MigrationOptions {
  tokens?: Record<string, string | number>
  assets?: Record<string, string>
  assetBaseUrl?: string
}
export interface MigrationIssue { path: string; message: string }
export interface MigrationResult {
  name: string
  template: { type: 'template_widget'; templateType: 'SDUI_WIDGET'; data: MigrationNode[] }
  warnings: MigrationIssue[]
}
const object = (value: unknown): ObjectValue => value && typeof value === 'object' && !Array.isArray(value) ? value : {}
const typography: Record<string, string> = Object.fromEntries([
  'labelXsMedium', 'labelSMedium', 'headerXsSemibold', 'headerSSemibold', 'headerDefaultBold',
  'descriptionXsRegular', 'descriptionDefaultRegular', 'actionSBold',
].flatMap(value => [[value, value], [value.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), value]]))
const alignment: Record<string, string> = { 'flex-start': 'start', 'flex-end': 'end', 'space-between': 'spaceBetween', 'space-around': 'spaceAround', 'space-evenly': 'spaceEvenly' }

export function migrateFigmaJson(input: unknown, options: MigrationOptions = {}): MigrationResult {
  const tokens = { ...DESIGN_TOKENS, ...options.tokens }
  const source = object(input)
  if (!Array.isArray(source.body?.children)) throw new Error('JSON Figma cần body.children dạng array (format meta/components/body).')
  const warnings: MigrationIssue[] = []
  const warn = (path: string, message: string) => warnings.push({ path, message })
  const definitions = new Map<string, ObjectValue>()
  for (const definition of source.components || []) {
    if (!definition?.type) throw new Error('Component definition thiếu type.')
    definitions.set(definition.type, definition)
    if (definition.figma?.componentSetKey) definitions.set(definition.figma.componentSetKey, definition)
  }
  let count = 0
  function resolve(value: any, path: string, numeric = false): any {
    if (value == null) return undefined
    if (typeof value === 'string' && /^(Colors|Spacing|Radius|Shadow)\./.test(value)) {
      if (!Object.prototype.hasOwnProperty.call(tokens, value)) { warn(path, `Chưa map token ${value}; bỏ field này trong bản nháp.`); return undefined }
      value = tokens[value]
    }
    if (numeric && (typeof value !== 'number' || !Number.isFinite(value))) { warn(path, 'Cần giá trị số; field chưa được chuyển.'); return undefined }
    return value
  }
  function asset(value: unknown, path: string): string {
    const key = typeof value === 'string' ? value : ''
    const mapped = options.assets?.[path] || options.assets?.[key] || key
    if (mapped === IMAGE_PLACEHOLDER) return mapped
    try {
      const url = options.assetBaseUrl ? new URL(mapped, options.assetBaseUrl) : new URL(mapped)
      if (mapped && /^https?:$/.test(url.protocol)) return url.href
    } catch { /* Report unresolved asset below. */ }
    warn(path, `Cần URL ảnh HTTP(S) hoặc asset mapping cho ${key || path}; đang dùng ảnh PNG placeholder online.`)
    return IMAGE_PLACEHOLDER
  }
  function convert(raw: any, path: string, stack: string[] = [], parentRow = false): MigrationNode {
    if (!raw || typeof raw !== 'object' || typeof raw.type !== 'string') throw new Error(`${path}: node cần type dạng string.`)
    if (++count > 2000 || stack.length > 60) throw new Error('JSON quá lớn hoặc lồng quá sâu (tối đa 2000 node / 60 cấp component).')
    let node = raw
    const definition = definitions.get(raw.figma?.componentSetKey) || definitions.get(raw.type)
    if (definition && raw.children === undefined) {
      if (stack.includes(definition.type)) throw new Error(`${path}: component reference bị vòng lặp (${definition.type}).`)
      node = { ...definition, ...raw, props: { ...definition.props, ...raw.props }, styles: { ...definition.styles, ...raw.styles }, children: definition.children }
      stack = [...stack, definition.type]
    }
    const props = object(node.props)
    const styles = { ...object(node.style), ...object(node.styles) }
    const style: ObjectValue = {}
    const property: ObjectValue = { id: path.replace(/[^a-zA-Z0-9_]/g, '_') }
    for (const [from, to] of Object.entries({ width: 'width', height: 'height', backgroundColor: 'backgroundColor', borderRadius: 'cornerRadius' })) {
      const value = resolve(styles[from] ?? (node.type === 'Svg' ? props[from] : undefined), `${path}.styles.${from}`, from !== 'backgroundColor')
      if (value !== undefined) style[to] = value
    }
    const padding: ObjectValue = {}
    for (const [from, to] of Object.entries({ padding: 'all', paddingHorizontal: 'horizontal', paddingVertical: 'vertical', paddingTop: 'top', paddingBottom: 'bottom', paddingLeft: 'left', paddingRight: 'right' })) {
      const value = resolve(styles[from], `${path}.styles.${from}`, true)
      if (value !== undefined) padding[to] = value
    }
    if (Object.keys(padding).length) style.padding = padding
    if (styles.borderWidth != null || styles.borderColor != null) {
      const width = resolve(styles.borderWidth, `${path}.styles.borderWidth`, true)
      const color = resolve(styles.borderColor, `${path}.styles.borderColor`)
      style.border = { ...(width !== undefined ? { width } : {}), ...(color !== undefined ? { color } : {}) }
    }
    if (styles.alignSelf === 'stretch') style[parentRow ? 'fillMaxHeight' : 'fillMaxWidth'] = true
    const modifier: ObjectValue = {}
    if (typeof styles.flex === 'number' && styles.flex > 0) modifier.weight = styles.flex
    const supportedStyles = new Set(['width','height','backgroundColor','borderRadius','padding','paddingHorizontal','paddingVertical','paddingTop','paddingBottom','paddingLeft','paddingRight','borderWidth','borderColor','alignSelf','flex','gap','flexDirection','alignItems','justifyContent','color','textAlign'])
    Object.keys(styles).filter(key => !supportedStyles.has(key)).forEach(key => warn(`${path}.styles.${key}`, 'Style chưa có mapping.'))
    const base = (type: MigrationNode['type'], value: MigrationNode['value']): MigrationNode => ({ type, style, property, ...(Object.keys(modifier).length ? { modifier } : {}), value })
    const type = node.type.toLowerCase()
    const supportedProps: Record<string, string[]> = {
      text: ['children','typography','color','numberOfLines','ellipsizeMode'], image: ['source','resizeMode'],
      button: ['title','type','iconLeft','iconRight','ctaType','color'], tag: ['children','title','tagType','backgroundColor','textColor','iconUrl'],
      spacer: ['minLength'], title: ['title','description'], scrollview: ['horizontal','contentContainerStyle','showsHorizontalScrollIndicator','showsVerticalScrollIndicator'],
      svg: ['width','height','viewBox','fill'],
    }
    Object.keys(props).filter(key => !(supportedProps[type] || []).includes(key)).forEach(key => warn(`${path}.props.${key}`, 'Prop chưa có mapping; cần bổ sung thủ công.'))
    if (type === 'text') {
      const value = props.children ?? node.value ?? ''
      if (typeof value !== 'string' && typeof value !== 'number') throw new Error(`${path}.props.children: text cần string hoặc number.`)
      if (props.typography) {
        if (typography[props.typography]) property.typography = typography[props.typography]
        else warn(`${path}.props.typography`, `Typography chưa map: ${props.typography}`)
      }
      const color = resolve(props.color ?? styles.color, `${path}.props.color`)
      if (color !== undefined) property.color = color
      const limit = resolve(props.numberOfLines, `${path}.props.numberOfLines`, true)
      if (limit !== undefined) property.lineLimit = limit
      if (props.ellipsizeMode) property.truncationMode = props.ellipsizeMode
      if (styles.textAlign) property.textAlignment = styles.textAlign
      return base('text', String(value))
    }
    if (type === 'image' || type === 'svg') {
      property.contentMode = props.resizeMode === 'cover' ? 'fill' : 'fit'
      if (type === 'svg') warn(path, 'SVG/Path cần export thành asset. Không suy đoán nội dung vector thành text/button.')
      return base('image', asset(type === 'svg' ? '' : props.source?.uri ?? props.source, path))
    }
    if (type === 'button') {
      const variants = ['primary','secondary','tonal','outline','danger','text','disabled']
      if (props.type && !variants.includes(props.type)) warn(`${path}.props.type`, 'Button type không hỗ trợ; dùng primary.')
      property.ctaType = props.ctaType || 'BUTTON'
      const value: ObjectValue = { title: String(props.title ?? 'Button'), type: variants.includes(props.type) ? props.type : 'primary' }
      const color = resolve(props.color, `${path}.props.color`)
      if (color !== undefined) property.color = color
      for (const key of ['iconLeft', 'iconRight']) if (props[key]) value[key] = asset(props[key], `${path}.props.${key}`)
      return base('button', value)
    }
    if (type === 'tag') {
      property.tagType = props.tagType || 'highlight'
      for (const key of ['backgroundColor','textColor']) { const value = resolve(props[key], `${path}.props.${key}`); if (value !== undefined) property[key] = value }
      if (props.iconUrl) property.iconUrl = asset(props.iconUrl, `${path}.props.iconUrl`)
      return base('tag', String(props.children ?? props.title ?? ''))
    }
    if (type === 'spacer') { property.minLength = resolve(props.minLength ?? 0, `${path}.props.minLength`, true); return base('spacer', '') }
    if (type === 'title') {
      property.layout = 'column'
      return base('container', { children: [props.title, props.description].filter(v => v != null && v !== '').map((v, i) => ({ type: 'text', style: {}, property: { typography: i === 0 ? 'headerSSemibold' : 'descriptionDefaultRegular' }, value: String(v) })) })
    }
    if (!['view','scrollview','container'].includes(type) && !definition) warn(path, `Type ${node.type} chưa biết; chuyển thành container và giữ cây con.`)
    const layout = { ...styles, ...object(props.contentContainerStyle) }
    const row = type === 'scrollview' ? !!props.horizontal : layout.flexDirection === 'row'
    property.layout = type === 'scrollview' ? row ? 'scrollRow' : 'scrollColumn' : row ? 'row' : 'column'
    const gap = resolve(layout.gap, `${path}.styles.gap`, true)
    if (gap !== undefined) property.spacing = gap
    if (layout.alignItems) property.alignment = alignment[layout.alignItems] || layout.alignItems
    if (layout.justifyContent) property.arrangement = alignment[layout.justifyContent] || layout.justifyContent
    for (const key of Object.keys(object(props.contentContainerStyle))) if (!['gap','flexDirection','alignItems','justifyContent'].includes(key)) warn(`${path}.props.contentContainerStyle.${key}`, 'Style nội dung cuộn chưa có mapping.')
    if (node.children != null && !Array.isArray(node.children)) throw new Error(`${path}.children phải là array.`)
    return base('container', { children: (node.children || []).map((child: any, index: number) => convert(child, `${path}.children[${index}]`, stack, row)) })
  }
  for (const key of ['overlays','footer','tabs','tracking','localization','actions']) if (source[key] && Object.keys(source[key]).length) warn(`$.${key}`, 'Cấu hình cấp màn hình chưa chuyển sang template; cần kiểm tra thủ công.')
  if (source.header && source.header.props?.headerType !== 'none') warn('$.header', 'Header màn hình không được đưa vào template.')
  const root = convert({ type: source.body.scrollable ? 'ScrollView' : 'View', styles: source.body.style, children: source.body.children }, '$.body')
  return { name: source.meta?.screenName || 'Migrated Figma template', template: { type: 'template_widget', templateType: 'SDUI_WIDGET', data: [root] }, warnings }
}
