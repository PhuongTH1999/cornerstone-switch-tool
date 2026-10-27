/** Client for SduiTemplateService.GenerateVelocityTemplate, through the dev bridge in server/sduiTemplateBridge.ts. */
import type { DynamicField } from './dynamicFields'

export const VELOCITY_ENDPOINT = import.meta.env?.VITE_SDUI_GRPC_BRIDGE_URL || '/grpc/sdui-template/generate-velocity-template'

export interface RepeatDetection {
  container_path: string
  widget_id: string
  strategy: string
  data_variable: string
  loop_variable: string
  item_count: number
}

/** GenerateVelocityTemplateResponse (proto/sduitemplate.proto). The string fields hold JSON / Velocity text. */
export interface VelocityResponse {
  success: boolean
  message: string
  velocity_template: string
  data_schema: string
  sample_data: string
  repeat_detections: RepeatDetection[]
  rendered_json: string
}

export interface VelocityRequest {
  raw_json: string
  dynamic_fields: DynamicField[]
  container_name?: string
  loop_variable?: string
}

/**
 * Same request as the grpcurl call: `raw_json` is the template without `dynamic_fields`
 * (they travel in their own field).
 */
export function buildVelocityRequest(schema: Record<string, unknown>, options: { containerName?: string; loopVariable?: string } = {}): VelocityRequest {
  const { dynamic_fields: fields, ...template } = schema
  return {
    raw_json: JSON.stringify(template),
    dynamic_fields: Array.isArray(fields) ? fields as DynamicField[] : [],
    ...(options.containerName?.trim() ? { container_name: options.containerName.trim() } : {}),
    ...(options.loopVariable?.trim() ? { loop_variable: options.loopVariable.trim() } : {}),
  }
}

export interface StructureMismatch {
  /** JSON path of the scrollRow, e.g. `$.data[0].value.children[1]`. */
  listPath: string
  /** Index of the item that differs from item [0]. */
  item: number
  /** JSON path where the difference starts. */
  path: string
  /** Child indexes from the root node to `path` (to select the layer in the editor). */
  indexes: number[]
  reason: string
}

const childrenOf = (node: any): any[] => Array.isArray(node?.value?.children) ? node.value.children : []
const childPath = (path: string, index: number) => `${path}.value.children[${index}]`

/** First structural difference between two nodes (type and children, recursively), or null. */
function firstDifference(sample: any, item: any, path: string, indexes: number[]): Omit<StructureMismatch, 'listPath' | 'item'> | null {
  if (sample?.type !== item?.type) return { path, indexes, reason: `type "${item?.type}" thay vì "${sample?.type}"` }
  const a = childrenOf(sample), b = childrenOf(item)
  if (a.length !== b.length) return { path, indexes, reason: `${b.length} child thay vì ${a.length}` }
  for (let index = 0; index < a.length; index++) {
    const found = firstDifference(a[index], b[index], childPath(path, index), [...indexes, index])
    if (found) return found
  }
  return null
}

/**
 * BE (GenerateVelocityTemplate) turns each scrollRow into a #foreach over item [0], so every other item must have
 * the same structure. Lists the first difference of each item that does not, before calling BE.
 */
export function findScrollRowMismatches(template: Record<string, unknown>): StructureMismatch[] {
  const mismatches: StructureMismatch[] = []
  const visit = (node: any, path: string, indexes: number[]) => {
    const children = childrenOf(node)
    if (node?.property?.layout === 'scrollRow') {
      children.slice(1).forEach((child, offset) => {
        const item = offset + 1
        const found = firstDifference(children[0], child, childPath(path, item), [...indexes, item])
        if (found) mismatches.push({ listPath: path, item, ...found })
      })
    }
    children.forEach((child, index) => visit(child, childPath(path, index), [...indexes, index]))
  }
  const data = Array.isArray(template.data) ? template.data : []
  if (data[0]) visit(data[0], '$.data[0]', [])
  return mismatches
}

/**
 * Keeps only item [0] of every scrollRow (BE accepts a single sample item). Dynamic fields that pointed into the
 * removed items are dropped and returned.
 */
export function keepFirstScrollRowItem(schema: Record<string, unknown>): { schema: Record<string, unknown>; dropped: DynamicField[] } {
  const removed: string[] = []
  const trim = (node: any, path: string): any => {
    const children = childrenOf(node)
    if (!children.length) return node
    const keep = node?.property?.layout === 'scrollRow' ? children.slice(0, 1) : children
    if (keep.length < children.length) children.slice(1).forEach((_, offset) => removed.push(childPath(path, offset + 1)))
    return { ...node, value: { ...node.value, children: keep.map((child: any, index: number) => trim(child, childPath(path, index))) } }
  }
  const data = Array.isArray(schema.data) ? schema.data : []
  const fields = Array.isArray(schema.dynamic_fields) ? schema.dynamic_fields as DynamicField[] : []
  const inside = (field: DynamicField) => removed.some(prefix => field.path === prefix || field.path.startsWith(`${prefix}.`))
  return {
    schema: { ...schema, data: data.map((node, index) => index === 0 ? trim(node, '$.data[0]') : node), ...(Array.isArray(schema.dynamic_fields) ? { dynamic_fields: fields.filter(field => !inside(field)) } : {}) },
    dropped: fields.filter(inside),
  }
}

/** Parses a JSON string field; returns undefined when it is empty or not JSON (e.g. velocity_template). */
export function parseJsonField(text: string | undefined): unknown {
  if (!text) return undefined
  try { return JSON.parse(text) } catch { return undefined }
}

export async function generateVelocityTemplate(request: VelocityRequest, fetcher: typeof fetch = fetch): Promise<VelocityResponse> {
  let response: Response
  try {
    response = await fetcher(VELOCITY_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) })
  } catch {
    throw new Error('Không gọi được bridge gRPC. Chạy tool bằng `npm run dev` trên máy có VPN.')
  }
  const body = await response.json().catch(() => null)
  if (response.status === 404 || (!body && !response.ok)) {
    throw new Error('Bridge gRPC chỉ có khi chạy `npm run dev` / `vite preview` trên máy local (có VPN), không có trên bản deploy.')
  }
  if (!response.ok) throw new Error(body?.error || `Bridge lỗi HTTP ${response.status}`)
  return {
    success: !!body.success, message: body.message ?? '', velocity_template: body.velocity_template ?? '',
    data_schema: body.data_schema ?? '', sample_data: body.sample_data ?? '',
    repeat_detections: Array.isArray(body.repeat_detections) ? body.repeat_detections : [], rendered_json: body.rendered_json ?? '',
  }
}
