// §6.5 box
import type { CSSProperties } from 'react'
import { RenderNode } from '../Node'
import type { ContentProps } from '../Node'

type Edge = 'start' | 'center' | 'end'
/** §6.5 — contentAlignment → [horizontal, vertical]; unknown values → topStart. Also used by pager.alignmentIndicator. */
const ALIGNMENT: Record<string, [Edge, Edge]> = {
  topStart: ['start', 'start'], topCenter: ['center', 'start'], top: ['center', 'start'], topEnd: ['end', 'start'],
  centerStart: ['start', 'center'], start: ['start', 'center'], center: ['center', 'center'], centerEnd: ['end', 'center'], end: ['end', 'center'],
  bottomStart: ['start', 'end'], bottomCenter: ['center', 'end'], bottom: ['center', 'end'], bottomEnd: ['end', 'end'],
}
export const alignment9 = (value: unknown, fallback = 'topStart'): [Edge, Edge] => ALIGNMENT[typeof value === 'string' && value in ALIGNMENT ? value : fallback]

export function BoxContent({ node, inner, style }: ContentProps) {
  const [justify, align] = alignment9(node.property.contentAlignment)
  // Children stack in one grid cell (later children on top). D24: [A] the grid fills the frame, so children are
  // aligned in the whole frame; [I] the grid is as big as the largest child and is centred in the frame (§4.2).
  const css: CSSProperties = { display: 'grid', gridTemplate: 'minmax(0, 1fr) / minmax(0, 1fr)', ...style }
  return <div className="sdui-box" style={css}>
    {node.children.map(child => {
      const item: CSSProperties = {
        gridArea: '1 / 1', justifySelf: child.style.fillMaxWidth ? 'stretch' : justify, alignSelf: child.style.fillMaxHeight ? 'stretch' : align,
      }
      if (child.type === 'spacer') {
        // §6.3: in a box [A] 0 × 0 (+ minLength on both axes, D35); [I] takes no significant space.
        const length = inner.platform === 'android' ? child.property.minLength ?? 0 : 0
        Object.assign(item, { width: 0, height: 0, minWidth: length, minHeight: length })
      }
      return <RenderNode key={child.path} node={child} c={inner} slot={item} />
    })}
  </div>
}
