// [A] Compose Row / Column + weight — §5.1, §5.2. Pure functions; the renderer feeds them DOM measurements.
import { APPROX } from '../approx'
import type { SduiNode } from '../types'

export type Slot = { kind: 'fixed' } | { kind: 'weight'; fill: boolean }

/** A container that can take a share in a row: no `width`, no `fillMaxWidth`. */
const isWeightableContainer = (node: SduiNode) => node.type === 'container' && node.style.width === undefined && node.style.fillMaxWidth !== true

/** §5.1 [A] — classify one child of a `row`. */
export function classifyRowChild(child: SduiNode, siblings: SduiNode[]): Slot {
  if (child.style.fillMaxWidth === true) return { kind: 'weight', fill: true }
  // §5.1: a spacer only stretches when the row has no weightable container.
  if (child.type === 'spacer') return siblings.some(isWeightableContainer) ? { kind: 'fixed' } : { kind: 'weight', fill: true }
  if (isWeightableContainer(child)) return { kind: 'weight', fill: false }
  if (child.type === 'text' && child.style.width === undefined) return { kind: 'weight', fill: false }
  return { kind: 'fixed' }
}

/** §5.2 [A] — classify one child of a `column`. */
export function classifyColumnChild(child: SduiNode): Slot {
  return child.type === 'spacer' || child.style.fillMaxHeight === true ? { kind: 'weight', fill: true } : { kind: 'fixed' }
}

export interface WeightInput {
  /** The container's max main-axis size (content box); Infinity = unbounded. */
  maxMain: number
  spacing: number
  /** Per child: its slot and its natural main-axis size (for weight fill=false: size when measured without the cap). */
  children: { slot: Slot; natural: number }[]
}

export interface WeightResult {
  share: number
  /** Main-axis size of each child. */
  sizes: number[]
}

/**
 * §5.1 [A] — the Compose weight algorithm:
 *   fixed     = Σ natural size of FIXED children + spacing × (n − 1)
 *   remaining = bounded ? max(0, maxMain − fixed) : 0          (D30 🔎)
 *   share     = remaining / number of weighted children        (D29 🔎: equal share, leftover not redistributed)
 *   W(fill=true) → share; W(fill=false) → min(natural, share); FIXED → natural
 */
export function androidWeights({ maxMain, spacing, children }: WeightInput): WeightResult {
  const weighted = children.filter(child => child.slot.kind === 'weight').length
  const fixed = children.reduce((total, child) => total + (child.slot.kind === 'fixed' ? child.natural : 0), 0) + spacing * Math.max(0, children.length - 1)
  const bounded = Number.isFinite(maxMain)
  // D30 🔎: an unbounded main axis gives weighted children 0.
  const remaining = bounded ? Math.max(0, maxMain - fixed) : APPROX.androidUnboundedWeightIsZero ? 0 : Infinity
  // D29 🔎: every weighted child gets the same share.
  const share = weighted ? remaining / weighted : 0
  const sizes = children.map(({ slot, natural }) => slot.kind === 'fixed' ? natural : slot.fill ? share : Math.min(natural, share))
  return { share, sizes }
}
