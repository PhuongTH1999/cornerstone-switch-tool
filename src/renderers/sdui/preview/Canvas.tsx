// Pipeline for one platform: unwrapZone (§1) → parse (§2) → layout + render (§4–§6).
import { useMemo } from 'react'
import type { MouseEvent } from 'react'
import { RenderNode } from './Node'
import { parseRoot } from './parse'
import { CANVAS_WIDTH, FONT_STACK, TOOL } from './tokens'
import type { Issue, Platform, SduiNode } from './types'
import { unwrapZone } from './unwrap'

export interface CanvasResult { node: SduiNode | null; warnings: Issue[] }

export function buildTree(input: unknown, platform: Platform, now = Date.now()): CanvasResult {
  const unwrapped = unwrapZone(input, platform)
  if (unwrapped.root === undefined) return { node: null, warnings: unwrapped.warnings }
  const parsed = parseRoot(unwrapped.root, unwrapped.retry, platform, { now })
  return { node: parsed.node, warnings: [...unwrapped.warnings, ...parsed.warnings] }
}

export interface CanvasProps {
  input: unknown
  platform: Platform
  now?: number
  /** Called with the `__ref` of the clicked node (select mode). */
  onSelect?: (ref: string) => void
}

export function SDUICanvas({ input, platform, now, onSelect }: CanvasProps) {
  const { node } = useMemo(() => buildTree(input, platform, now), [input, platform, now])
  const select = onSelect && ((event: MouseEvent) => {
    const target = (event.target as HTMLElement).closest('[data-sdui-ref]')
    if (target) onSelect(target.getAttribute('data-sdui-ref')!)
  })
  return <div className={`sdui-canvas sdui-${platform}`} data-platform={platform} onClick={select} style={{
    width: CANVAS_WIDTH, fontFamily: FONT_STACK, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    backgroundColor: TOOL.canvasBackground, ['--sdui-tap' as string]: TOOL.tapArea, ['--sdui-tap-outline' as string]: TOOL.tapOutline,
    ['--sdui-selection' as string]: TOOL.selection, ['--sdui-unconfirmed' as string]: TOOL.needsConfirmation, ['--sdui-canvas-border' as string]: TOOL.canvasBorder,
  }}>
    {/* The root sits at the top-left of a 375-wide screen with an unbounded height (the Home feed). */}
    {node ? <RenderNode node={node} c={{ platform, maxWidth: CANVAS_WIDTH, maxHeight: Infinity }} /> : <p className="sdui-canvas-empty">Không có gì được vẽ trên {platform === 'android' ? 'Android' : 'iOS'}.</p>}
  </div>
}
