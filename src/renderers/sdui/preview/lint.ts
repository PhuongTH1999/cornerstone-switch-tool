// §8 — warnings the tool shows. Each issue: level, D-code (or doc section when the row has none), node path.
import { buildTree } from './Canvas'
import { isPortableColor } from './color'
import { layoutOf } from './components/Container'
import { classifyRowChild } from './layout/android'
import { contentGreedy } from './layout/ios'
import { PARENT_TYPES, PROPERTY_SCHEMA, STRING_VALUE_TYPES, parseExpireTime } from './parse'
import { BUTTON_KINDS } from './tokens'
import { SDUI_TYPES } from './types'
import type { Issue, Platform, SduiNode, SduiType } from './types'
import { unwrapZone } from './unwrap'

const LEVEL_ORDER = { error: 0, warning: 1, info: 2 }
const NODE_KEYS = new Set(['type', 'style', 'property', 'value', 'onTap', 'trackTypes', 'expire_time', '__ref'])
const ON_TAP_KEYS = new Set(['actionType', 'actions'])
const ACTION_KEYS = new Set(['actionType', 'featureCode', 'endpoint', 'params'])
const isObject = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value)

export function lint(input: unknown, now = Date.now()): Issue[] {
  const issues: Issue[] = []
  const add = (level: Issue['level'], code: string, path: string, message: string, platforms?: Platform[]) => issues.push({ level, code, path, message, ...(platforms ? { platforms } : {}) })

  // §2 — what each platform drops. A node iOS drops while Android draws it is an error (§8 row 1).
  const trees = { android: buildTree(input, 'android', now), ios: buildTree(input, 'ios', now) }
  for (const platform of ['android', 'ios'] as Platform[]) for (const warning of trees[platform].warnings) issues.push(warning)

  // Static checks on the JSON (the iOS root is used because iOS unwraps more zone shapes, D1).
  const root = unwrapZone(input, 'ios').root
  if (isObject(root) && parseExpireTime(root.expire_time) !== undefined) add('info', 'D16', 'root', 'Root có expire_time nhưng root không bị kiểm tra hết hạn — vẫn vẽ.')
  walkRaw(root, 'root', add)

  // Layout checks on the Android tree (constraints matter there).
  if (trees.android.node) walkAndroid(trees.android.node, { boundedWidth: true, boundedHeight: false }, add)
  if (trees.ios.node) walkParsed(trees.ios.node, add)

  return mergePlatforms(issues).sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.path.localeCompare(b.path, undefined, { numeric: true }))
}

type Add = (level: Issue['level'], code: string, path: string, message: string, platforms?: Platform[]) => void

function walkRaw(raw: unknown, path: string, add: Add) {
  if (!isObject(raw) || !SDUI_TYPES.includes(raw.type)) return
  const type = raw.type as SduiType
  const property = isObject(raw.property) ? raw.property : {}
  const style = isObject(raw.style) ? raw.style : {}
  const value = raw.value

  // ⚠️ D18 / D10 — missing property / value.
  if (raw.property === undefined) add('warning', 'D18', path, 'Thiếu property — gửi {} (iOS bỏ node nếu thiếu, trừ button).')
  if (value === undefined) add('warning', 'D10', path, `Thiếu value — gửi ${STRING_VALUE_TYPES.includes(type) ? '""' : 'object'}.`)

  // ❌ D8 — colours that are not #RRGGBB.
  const colors: [string, unknown][] = [
    ['style.backgroundColor', style.backgroundColor], ['style.border.color', isObject(style.border) ? style.border.color : undefined],
    ...['color', 'backgroundColor', 'textColor', 'tintColor', 'activeColor', 'inactiveColor', 'indicatorBackgroundColor']
      .filter(key => key in (PROPERTY_SCHEMA[type] || {})).map(key => [`property.${key}`, property[key]] as [string, unknown]),
    ...(type === 'button' && isObject(value) ? [['value.color', value.color] as [string, unknown]] : []),
  ]
  for (const [key, color] of colors) if (color !== undefined && !isPortableColor(color)) add('error', 'D8', path, `${key} = ${JSON.stringify(color)} không phải #RRGGBB — 2 nền tảng đọc khác nhau (§3.1).`)

  // ⚠️ D2 / D3
  if (type === 'container' && property.spacing === undefined) add('warning', 'D2', path, 'container không gửi spacing — Android 0, iOS ≈ 8.')
  if (type === 'spacer' && property.minLength === undefined) add('warning', 'D3', path, 'spacer không gửi minLength — Android 0, iOS ≈ 8.')

  // ⚠️ §6.2 — image size.
  if (type === 'image') {
    const hasWidth = typeof style.width === 'number', hasHeight = typeof style.height === 'number'
    const ratio = typeof property.aspectRatio === 'number'
    if (!hasWidth && !hasHeight && !(style.fillMaxWidth && ratio)) add('warning', '§6.2', path, 'image không có width/height — preview vẽ kích thước gốc của ảnh; app có thể khác.')
    else if (!hasWidth && hasHeight) add('warning', '§6.2', path, 'image chỉ có height — tài liệu chưa mô tả (G2, cần xác nhận).')
    if (hasWidth && hasHeight && ratio) add('warning', '§6.2', path, 'aspectRatio cùng width + height: Android bỏ qua aspectRatio, iOS giữ tỉ lệ và căn giữa.')
  }

  // ⚠️ D32 / D34 — button.
  if (type === 'button') {
    const valueType = isObject(value) && typeof value.type === 'string' && value.type ? value.type : undefined
    const kind = valueType ?? (typeof property.type === 'string' && property.type ? property.type : undefined)
    if (kind === undefined) add('warning', 'D32', path, 'button không gửi type — Android vẽ "text", iOS vẽ "outline".')
    else if (!(kind.toLowerCase() in BUTTON_KINDS)) add('warning', 'D32', path, `button type "${kind}" lạ — Android vẽ "text", iOS vẽ "primary".`)
    if (typeof property.ctaType === 'string' && property.ctaType.toUpperCase() === 'TOGGLE' && (raw.style !== undefined || raw.onTap !== undefined || raw.trackTypes !== undefined)) {
      add('warning', 'D34', path, 'TOGGLE có style / onTap / trackTypes — Android bỏ hết (modifier không truyền vào toggle).', ['android'])
    }
  }

  // ⚠️ D28 / D6 / D7 — text.
  if (type === 'text') {
    if (['center', 'trailing', 'right'].includes(property.textAlignment) && (style.width !== undefined || style.fillMaxWidth) && property.lineLimit === 1) {
      add('warning', 'D28', path, `textAlignment "${property.textAlignment}" với chữ 1 dòng trong khung cố định: iOS bỏ qua (width → giữa, fillMaxWidth → trái).`, ['ios'])
    }
    if (property.truncationMode !== undefined && property.truncationMode !== 'tail') {
      const multiline = typeof property.lineLimit !== 'number' || property.lineLimit > 1
      add('warning', 'D6', path, `truncationMode "${property.truncationMode}": Android luôn cắt cuối.${multiline ? ' Nhiều dòng trên iOS: preview vẽ như tail (G3, cần xác nhận).' : ''}`)
    }
    if (property.lineSpacing !== undefined) add('warning', 'D7', path, 'lineSpacing: Android đặt line-height = lineSpacing, iOS cộng thêm giữa các dòng.')
  }

  // ⚠️ D15 — progressBar.barWidth.
  if (type === 'progressBar' && property.barWidth !== undefined) add('warning', 'D15', path, 'barWidth: Android rộng cố định sát trái, iOS là độ rộng tối đa căn giữa.')

  // ⚠️ D25 — onTap without background.
  if (raw.onTap !== undefined && !isPortableColor(style.backgroundColor)) add('warning', 'D25', path, 'onTap trên node không có backgroundColor — iOS chỉ bấm được phần có vẽ, Android bấm cả khung.')

  // ⚠️ spec §8 — trackTypes without trackId.
  if (isObject(raw.trackTypes) && !raw.trackTypes.trackId) add('warning', 'spec §8', path, 'trackTypes không có trackId — mọi node như vậy dùng chung impression id "_100per".')

  // ℹ️ spec §2.1 — keys the renderer ignores.
  const unused = [
    ...Object.keys(raw).filter(key => !NODE_KEYS.has(key)),
    ...Object.keys(property).filter(key => !(key in PROPERTY_SCHEMA[type])).map(key => `property.${key}`),
    ...(isObject(raw.onTap) ? Object.keys(raw.onTap).filter(key => !ON_TAP_KEYS.has(key)).map(key => `onTap.${key}`) : []),
    ...[...(isObject(raw.onTap) && Array.isArray(raw.onTap.actions) ? raw.onTap.actions : []), ...(Array.isArray(property.actions) ? property.actions : [])]
      .flatMap((action: unknown) => isObject(action) ? Object.keys(action).filter(key => !ACTION_KEYS.has(key)).map(key => `actions[].${key}`) : []),
  ]
  if (unused.length) add('info', 'spec §2.1', path, `Key không có tác dụng: ${[...new Set(unused)].join(', ')}.`)

  if (PARENT_TYPES.includes(type) && isObject(value) && Array.isArray(value.children)) {
    value.children.forEach((child: unknown, index: number) => walkRaw(child, `${path}.children[${index}]`, add))
  }
}

/** Android constraints: is the width / height of this node's content bounded? (D30) */
interface Bounds { boundedWidth: boolean; boundedHeight: boolean }

function walkAndroid(node: SduiNode, bounds: Bounds, add: Add) {
  const own: Bounds = {
    boundedWidth: bounds.boundedWidth || node.style.width !== undefined,
    boundedHeight: bounds.boundedHeight || node.style.height !== undefined,
  }
  const layout = node.type === 'container' ? layoutOf(node) : undefined
  if (layout === 'row') {
    const weighted = node.children.filter(child => classifyRowChild(child, node.children).kind === 'weight')
    // ❌ D30: a row without a bounded width (inside scrollRow) gives its weighted text / containers width 0.
    if (!own.boundedWidth && weighted.some(child => child.type === 'text' || child.type === 'container')) {
      add('error', 'D30', node.path, 'row không có width nằm trong scrollRow: text / container co giãn bên trong rộng 0 trên Android (🔎 cần xác nhận trên máy).', ['android'])
    }
    // ⚠️ D29: ≥ 2 weighted children share the space equally on Android.
    if (weighted.length >= 2) add('warning', 'D29', node.path, `row có ${weighted.length} child co giãn — Android chia đều phần còn lại (text tối đa 1/${weighted.length}), iOS theo nhu cầu.`, ['android'])
  }
  if (layout === 'column' && !own.boundedHeight) {
    // ❌ D30: weighted children of a column with an unbounded height get 0.
    for (const child of node.children) {
      if (child.type === 'spacer' || child.style.fillMaxHeight === true) {
        add('error', 'D30', child.path, `${child.type === 'spacer' ? 'spacer' : 'fillMaxHeight'} trong column không giới hạn chiều cao — Android cao 0${child.type === 'spacer' ? ' (chỉ còn minLength)' : ''} (🔎 cần xác nhận trên máy).`, ['android'])
      }
    }
  }
  const childBounds: Bounds = {
    boundedWidth: layout === 'scrollRow' ? false : own.boundedWidth,
    boundedHeight: layout === 'scrollColumn' ? false : own.boundedHeight,
  }
  for (const child of node.children) walkAndroid(child, childBounds, add)
}

function walkParsed(node: SduiNode, add: Add) {
  // ❌ D13 — iOS pager needs style.height.
  if (node.type === 'pager' && node.style.height === undefined) add('error', 'D13', node.path, 'pager không có style.height — iOS TabView không tự co (preview vẽ theo trang hiện tại, G1 cần xác nhận).', ['ios'])
  // ⚠️ D24 — fixed frame that its content may not fill (static estimate: the content is not greedy on that axis).
  if (['container', 'box', 'text', 'tag'].includes(node.type)) {
    const fills = contentGreedy(node)
    const axes = [node.style.width !== undefined && !fills.width ? 'width' : '', node.style.height !== undefined && !fills.height ? 'height' : ''].filter(Boolean)
    if (axes.length) add('warning', 'D24', node.path, `${axes.join(' + ')} cố định, nội dung có thể nhỏ hơn khung — Android đặt trên-trái, iOS đặt giữa.`)
  }
  for (const child of node.children) walkParsed(child, add)
}

/** The same issue reported for both platforms becomes one issue without `platforms`. */
function mergePlatforms(issues: Issue[]): Issue[] {
  const merged = new Map<string, Issue>()
  for (const issue of issues) {
    const key = `${issue.level}|${issue.code}|${issue.path}|${issue.message.replace(/ → (iOS|Android) /, ' → ')}`
    const existing = merged.get(key)
    if (!existing) { merged.set(key, { ...issue }); continue }
    const platforms = new Set([...(existing.platforms ?? ['android', 'ios']), ...(issue.platforms ?? ['android', 'ios'])])
    if (platforms.size === 2) delete existing.platforms
    else existing.platforms = [...platforms] as Platform[]
  }
  return [...merged.values()]
}
