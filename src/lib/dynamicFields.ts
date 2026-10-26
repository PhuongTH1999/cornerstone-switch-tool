/**
 * Dynamic fields: content nodes bound to a key of the data BE returns. A binding is identified by the JSON path of
 * the content in the exported template (`{ type: "template_widget", data: [root] }`), e.g.
 * `$.data[0].value.children[1].value.title`.
 */

export interface DynamicField { path: string; variable: string }

interface BindableNode { type: string; variable?: string; children?: BindableNode[] }

/** Where the bindable content lives in each node type. Other types have no dynamic content. */
export const CONTENT_SUFFIX: Record<string, string> = { text: '.value', image: '.value', tag: '.value', button: '.value.title' }

export const isBindable = (type: string) => type in CONTENT_SUFFIX

/** JSON path of a node from the child indexes leading to it (root = []). */
export const nodePath = (indexes: number[]) => indexes.reduce((path, index) => `${path}.value.children[${index}]`, '$.data[0]')

/** JSON path of the node's bindable content, or its node path when it has none. */
export const contentPath = (type: string, indexes: number[]) => nodePath(indexes) + (CONTENT_SUFFIX[type] ?? '')

/** Child indexes of the node `target` inside `root`, or null. */
export function indexesOf<T extends BindableNode>(root: T, target: T): number[] | null {
  if (root === target) return []
  for (const [index, child] of (root.children || []).entries()) {
    const rest = indexesOf(child, target as BindableNode)
    if (rest) return [index, ...rest]
  }
  return null
}

/** `dynamic_fields` for the export, in tree order. Nodes without a variable are skipped. */
export function buildDynamicFields(root: BindableNode): DynamicField[] {
  const fields: DynamicField[] = []
  const visit = (node: BindableNode, indexes: number[]) => {
    const variable = node.variable?.trim()
    if (variable && isBindable(node.type)) fields.push({ path: contentPath(node.type, indexes), variable })
    node.children?.forEach((child, index) => visit(child, [...indexes, index]))
  }
  visit(root, [])
  return fields
}

/** Sets `variable` on the nodes the fields point to. Returns the new tree and the fields that matched no node. */
export function applyDynamicFields<T extends BindableNode>(root: T, fields: unknown): { root: T; unmatched: DynamicField[] } {
  const valid = (Array.isArray(fields) ? fields : []).filter((field): field is DynamicField =>
    !!field && typeof field.path === 'string' && typeof field.variable === 'string' && field.variable.trim() !== '')
  const byPath = new Map(valid.map(field => [field.path, field.variable.trim()]))
  const used = new Set<string>()
  const visit = (node: T, indexes: number[]): T => {
    const path = contentPath(node.type, indexes)
    const variable = isBindable(node.type) ? byPath.get(path) : undefined
    if (variable) used.add(path)
    const children = node.children?.map((child, index) => visit(child as T, [...indexes, index]))
    return { ...node, ...(variable ? { variable } : {}), ...(children ? { children } : {}) }
  }
  const next = visit(root, [])
  return { root: next, unmatched: valid.filter(field => !used.has(field.path)) }
}

/** `dynamic_fields` of an imported / saved template: on the zone itself, or on the first zone of an array / lazy_loads. */
export function findDynamicFields(input: any): unknown {
  const zone = Array.isArray(input) ? input[0] : input?.lazy_loads?.[0]?.data?.[0] ?? input
  return zone?.dynamic_fields ?? input?.dynamic_fields
}

/** Variable keys used more than once (BE returns one value per key). */
export function duplicateVariables(fields: DynamicField[]): Set<string> {
  const seen = new Set<string>(), duplicates = new Set<string>()
  for (const { variable } of fields) (seen.has(variable) ? duplicates : seen).add(variable)
  return duplicates
}
