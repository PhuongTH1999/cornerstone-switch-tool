// §2 — decide which nodes get drawn. Pure: same input, platform and clock → same output.
// `node: null` means the node and its subtree are not drawn and take no space.

import { SDUI_TYPES } from './types'
import type { Action, Issue, NodeStyle, ParseResult, Platform, SduiNode, SduiType, TrackTypes } from './types'

type Kind = 'string' | 'number' | 'boolean' | 'object' | 'array'

/** Property keys per type and their JSON type (docs/sdui/components/*.md). Unknown keys are ignored. */
export const PROPERTY_SCHEMA: Record<SduiType, Record<string, Kind>> = {
  text: { typography: 'string', color: 'string', lineLimit: 'number', textAlignment: 'string', truncationMode: 'string', lineSpacing: 'number' },
  image: { contentMode: 'string', tintColor: 'string', cornerRadius: 'number', aspectRatio: 'number' },
  spacer: { minLength: 'number' },
  tag: { tagType: 'string', backgroundColor: 'string', textColor: 'string', iconUrl: 'string' },
  container: { layout: 'string', spacing: 'number', alignment: 'string' },
  box: { contentAlignment: 'string' },
  button: { ctaType: 'string', actionType: 'string', actions: 'array', type: 'string', iconLeft: 'string', iconRight: 'string', color: 'string' },
  pager: { showIndicator: 'boolean', activeColor: 'string', inactiveColor: 'string', indicatorBackgroundColor: 'string', alignmentIndicator: 'string', paddingIndicator: 'object' },
  pageIndicator: { total: 'number', activeIndex: 'number', activeColor: 'string', inactiveColor: 'string' },
  progressBar: { color: 'string', barHeight: 'number', barWidth: 'number' },
}

/** §2 — `value` is a string for these types… */
export const STRING_VALUE_TYPES: SduiType[] = ['text', 'image', 'tag', 'spacer', 'pageIndicator']
/** …and must be an object for these. */
export const OBJECT_VALUE_TYPES: SduiType[] = ['container', 'box', 'pager', 'button', 'progressBar']
export const PARENT_TYPES: SduiType[] = ['container', 'box', 'pager']

/** §2 — types whose `property` iOS decodes key by key (a bad key is dropped, not the node). */
const IOS_LENIENT_PROPERTY: SduiType[] = ['container', 'button']

const isObject = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value)
const kindOf = (value: unknown): Kind | 'other' =>
  Array.isArray(value) ? 'array' : value === null ? 'other' : typeof value === 'object' ? 'object'
    : typeof value === 'number' && Number.isFinite(value) ? 'number' : typeof value === 'string' ? 'string' : typeof value === 'boolean' ? 'boolean' : 'other'
const num = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined

/** spec §2.1 — epoch ms as number or numeric string; -1 = never expires. */
export function parseExpireTime(value: unknown): number | undefined {
  const time = typeof value === 'number' ? value : typeof value === 'string' && /^-?\d+$/.test(value.trim()) ? Number(value) : undefined
  return time === undefined || time === -1 ? undefined : time
}

/** §2 [chung] — style is decoded key by key; a key with the wrong type is dropped. */
function parseStyle(raw: unknown): NodeStyle {
  if (!isObject(raw)) return {}
  const style: NodeStyle = {}
  const width = num(raw.width), height = num(raw.height), cornerRadius = num(raw.cornerRadius)
  if (width !== undefined) style.width = width
  if (height !== undefined) style.height = height
  if (cornerRadius !== undefined) style.cornerRadius = cornerRadius
  // §2 [chung]: fillMaxWidth / fillMaxHeight accept true/false and 0/1.
  for (const key of ['fillMaxWidth', 'fillMaxHeight'] as const) {
    const value = raw[key]
    if (typeof value === 'boolean') style[key] = value
    else if (value === 0 || value === 1) style[key] = value === 1
  }
  if (isObject(raw.padding)) {
    // spec §4: a side wins over `all`; `all` is the default for undeclared sides.
    const all = num(raw.padding.all) ?? 0
    style.padding = {
      top: num(raw.padding.top) ?? all, left: num(raw.padding.left) ?? all,
      right: num(raw.padding.right) ?? all, bottom: num(raw.padding.bottom) ?? all,
    }
  }
  if (typeof raw.backgroundColor === 'string') style.backgroundColor = raw.backgroundColor
  // §2 [chung]: border without width or color → no border.
  if (isObject(raw.border) && num(raw.border.width) !== undefined && typeof raw.border.color === 'string') {
    style.border = { width: raw.border.width, color: raw.border.color }
  }
  return style
}

/** §2 / spec §7 — actions with a missing or unknown actionType (case-insensitive) are dropped one by one. */
export function parseActions(raw: unknown): Action[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item): Action[] => {
    if (!isObject(item) || typeof item.actionType !== 'string') return []
    const actionType = item.actionType.toUpperCase()
    if (actionType !== 'REDIRECT' && actionType !== 'CALL_API') return []
    return [{
      actionType,
      ...(typeof item.featureCode === 'string' ? { featureCode: item.featureCode } : {}),
      ...(typeof item.endpoint === 'string' ? { endpoint: item.endpoint } : {}),
      ...(isObject(item.params) ? { params: item.params } : {}),
    }]
  })
}

export interface ParseOptions { now?: number }

export function parse(raw: unknown, platform: Platform, options: ParseOptions = {}, path = 'root'): ParseResult {
  const warnings: Issue[] = []
  const node = parseNode(raw, platform, options.now ?? Date.now(), path, warnings)
  return { node, warnings }
}

function parseNode(raw: unknown, platform: Platform, now: number, path: string, warnings: Issue[]): SduiNode | null {
  const drop = (code: string, message: string, platforms: Platform[] = [platform]) => {
    warnings.push({ level: 'error', code, path, message, platforms })
    return null
  }
  if (!isObject(raw)) return drop('§2', 'Node không phải object → không vẽ.')
  const type = raw.type as SduiType
  // [chung] type missing or not one of the 10 values (case-sensitive) → null.
  if (!SDUI_TYPES.includes(type)) return drop('§2', `type "${String(raw.type)}" không hợp lệ → không vẽ.`)

  // property
  let property: Record<string, any> = {}
  if (!isObject(raw.property)) {
    // D18: [A] missing / non-object property → {}. [I] → node dropped, except button → {}.
    if (platform === 'ios' && type !== 'button') return drop('D18', raw.property === undefined ? 'Thiếu property → iOS bỏ node.' : 'property không phải object → iOS bỏ node.')
  } else {
    const schema = PROPERTY_SCHEMA[type]
    for (const [key, kind] of Object.entries(schema)) {
      if (!(key in raw.property)) continue
      const value = raw.property[key]
      if (kindOf(value) === kind) { property[key] = value; continue }
      // §2: [A] drops the key. [I] drops the node, except container and button (decoded key by key).
      // pager.showIndicator not boolean: [A] treated as true (= the default once the key is dropped); [I] null.
      if (platform === 'ios' && !IOS_LENIENT_PROPERTY.includes(type)) return drop('§2', `property.${key} sai kiểu (cần ${kind}) → iOS bỏ node.`)
      warnings.push({ level: 'warning', code: '§2', path, message: `property.${key} sai kiểu (cần ${kind}) → bỏ key.`, platforms: [platform] })
    }
  }

  // value
  let value: any
  if (STRING_VALUE_TYPES.includes(type)) {
    if (typeof raw.value === 'string') value = raw.value
    // D10: [A] missing / non-string value → "". [I] → node dropped.
    else if (platform === 'ios') return drop('D10', raw.value === undefined ? 'Thiếu value → iOS bỏ node.' : 'value không phải chuỗi → iOS bỏ node.')
    else value = ''
  } else {
    // [chung] container/box/pager/button/progressBar: value must be an object.
    if (!isObject(raw.value)) return drop('§2', 'value phải là object → không vẽ.', ['android', 'ios'])
    if (type === 'progressBar') {
      // [chung] currentValue and maxValue must be numbers.
      if (num(raw.value.currentValue) === undefined || num(raw.value.maxValue) === undefined) return drop('§2', 'progressBar thiếu currentValue / maxValue (số) → không vẽ.', ['android', 'ios'])
      value = {
        currentValue: raw.value.currentValue, maxValue: raw.value.maxValue,
        ...(typeof raw.value.subDes1 === 'string' ? { subDes1: raw.value.subDes1 } : {}),
        ...(typeof raw.value.subDes2 === 'string' ? { subDes2: raw.value.subDes2 } : {}),
      }
    } else if (type === 'button') {
      value = Object.fromEntries(['title', 'type', 'iconLeft', 'iconRight', 'color', 'description']
        .filter(key => typeof raw.value[key] === 'string').map(key => [key, raw.value[key]]))
    } else value = {}
  }

  // trackTypes
  let trackTypes: TrackTypes | undefined
  if (raw.trackTypes !== undefined) {
    const valid = isObject(raw.trackTypes) && ['tracking', 'trackify', 'itemTracking'].every(key => raw.trackTypes[key] === undefined || isObject(raw.trackTypes[key]))
    if (valid) trackTypes = raw.trackTypes as TrackTypes
    // D11: [A] invalid trackTypes → tracking ignored. [I] → node dropped.
    else if (platform === 'ios') return drop('D11', 'trackTypes sai kiểu → iOS bỏ node.')
    else warnings.push({ level: 'warning', code: 'D11', path, message: 'trackTypes sai kiểu → Android bỏ tracking.', platforms: ['android'] })
  }

  // [chung] onTap with the wrong type is ignored; actions filtered one by one.
  const onTap = isObject(raw.onTap) ? { actions: parseActions(raw.onTap.actions) } : undefined
  if (type === 'button') property.actions = parseActions(property.actions)

  // children: [chung] missing / non-array → []; a bad child drops only itself; an expired child is dropped.
  const children: SduiNode[] = []
  if (PARENT_TYPES.includes(type) && Array.isArray(raw.value.children)) {
    raw.value.children.forEach((childRaw: unknown, index: number) => {
      const childPath = `${path}.children[${index}]`
      const expire = isObject(childRaw) ? parseExpireTime(childRaw.expire_time) : undefined
      if (expire !== undefined && now >= expire) {
        warnings.push({ level: 'info', code: '§2', path: childPath, message: 'Child đã hết hạn (expire_time) → không vẽ.' })
        return
      }
      const child = parseNode(childRaw, platform, now, childPath, warnings)
      if (child) children.push(child)
    })
  }

  return {
    type, path, style: parseStyle(raw.style), property, value, children,
    ...(onTap ? { onTap } : {}), ...(trackTypes ? { trackTypes } : {}),
    ...(raw.__ref !== undefined ? { ref: raw.__ref } : {}),
  }
}

/** §1 + §2 — parse a root, retrying with the template_widget fallback when the first attempt fails. */
export function parseRoot(root: unknown, retry: unknown, platform: Platform, options: ParseOptions = {}): ParseResult {
  const first = parse(root, platform, options)
  if (first.node || retry === undefined) return first
  const second = parse(retry, platform, options)
  return second.node ? second : first
}
