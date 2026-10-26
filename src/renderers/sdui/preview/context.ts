import { createContext, useContext } from 'react'
import type { Interactions } from './interactions'
import type { Platform } from './types'

/** Layout constraints flowing down the tree (Compose-style max constraints; iOS uses CSS and ignores them). */
export interface Constraints {
  platform: Platform
  /** Max width of the node's frame; Infinity = unbounded (e.g. inside `scrollRow`). */
  maxWidth: number
  /** Max height of the node's frame; Infinity = unbounded (the Home feed, `scrollColumn`). */
  maxHeight: number
}

export type PreviewMode = 'select' | 'tap'

export interface PreviewEnvironment {
  mode: PreviewMode
  selectedRef?: string
  interactions?: Interactions
  /** Test switch: render without the progress animation. */
  animate: boolean
}

export const PreviewContext = createContext<PreviewEnvironment>({ mode: 'select', animate: true })
export const usePreview = () => useContext(PreviewContext)
