// [I] SwiftUI layout as CSS — §4.2, §5.1 [I], §5.2 [I].
import type { CSSProperties } from 'react'
import { APPROX } from '../approx'
import type { SduiNode } from '../types'

export interface Greedy { width: boolean; height: boolean }

/**
 * §4.2 [I] — content that fills its frame on an axis instead of being centred in it. The doc lists: containers
 * with a `spacer` or a `fillMax*` child on the main axis, `pager`, `progressBar`, images with width + height.
 * A node with `fillMax*` is greedy on that axis (its frame is maxWidth/maxHeight ∞, §4.1 step 1), and a stack
 * containing a greedy child becomes greedy on that axis too.
 */
export function greedy(node: SduiNode): Greedy {
  const own = { width: node.style.fillMaxWidth === true, height: node.style.fillMaxHeight === true }
  const content = contentGreedy(node)
  return { width: own.width || content.width, height: own.height || content.height }
}

export function contentGreedy(node: SduiNode): Greedy {
  const children = node.children.map(greedy)
  const anyChild = (axis: keyof Greedy) => children.some(child => child[axis])
  switch (node.type) {
    case 'container': {
      const layout = node.property.layout
      const hasSpacer = node.children.some(child => child.type === 'spacer')
      if (layout === 'row') return { width: hasSpacer || anyChild('width'), height: anyChild('height') }
      // A ScrollView takes the space it is offered along its scroll axis.
      if (layout === 'scrollRow') return { width: true, height: anyChild('height') }
      if (layout === 'scrollColumn') return { width: anyChild('width'), height: true }
      return { width: anyChild('width'), height: hasSpacer || anyChild('height') }
    }
    case 'box': return { width: anyChild('width'), height: anyChild('height') }
    case 'pager': return { width: true, height: true }
    case 'progressBar': return { width: true, height: false }
    case 'image': return { width: node.style.width !== undefined && node.style.height !== undefined, height: node.style.width !== undefined && node.style.height !== undefined }
    default: return { width: false, height: false }
  }
}

/** §5.1 [I] — CSS flex item for a child of an HStack (`row`). */
export function iosRowItem(child: SduiNode): CSSProperties {
  if (child.type === 'spacer') return { flex: '1 1 0', minWidth: child.property.minLength ?? APPROX.iosSpacerMinLength }
  const stretchHeight = greedy(child).height ? { alignSelf: 'stretch' as const } : {}
  if (child.style.fillMaxWidth === true) return { flex: '1 1 0', minWidth: 0, ...stretchHeight }
  return { flex: '0 1 auto', minWidth: 0, ...stretchHeight }
}

/** §5.2 [I] — CSS flex item for a child of a VStack (`column`). */
export function iosColumnItem(child: SduiNode): CSSProperties {
  if (child.type === 'spacer') return { flex: '1 1 0', minHeight: child.property.minLength ?? APPROX.iosSpacerMinLength }
  const stretchWidth = greedy(child).width ? { alignSelf: 'stretch' as const } : {}
  if (child.style.fillMaxHeight === true) return { flex: '1 1 auto', minHeight: 0, ...stretchWidth }
  return { flex: '0 0 auto', ...stretchWidth }
}
