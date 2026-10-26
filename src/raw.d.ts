declare module '*.md?raw' {
  const content: string
  export default content
}

// Only Vite's glob import is declared here; `vite/client` would clash with the ImportMeta in LoginPage.tsx.
interface ImportMeta {
  glob<T = unknown>(pattern: string, options?: { query?: string; import?: string; eager?: boolean }): Record<string, T>
}
