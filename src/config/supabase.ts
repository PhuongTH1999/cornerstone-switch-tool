const configuredUrl = import.meta.env.VITE_SUPABASE_URL
const configuredKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const SUPABASE_URL = configuredUrl || 'https://iwjtrafbyipovdepbqqg.supabase.co'
export const SUPABASE_ANON_KEY = configuredKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3anRyYWZieWlwb3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzNTY3NTksImV4cCI6MjA5NzkzMjc1OX0.5O7Sphv-1dXu1GykZX0jlKSOhp8faJOd1ODeBM59Drw'

export function supabaseHeaders(extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

export function supabaseTable(path: string) {
  return `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${path}`
}
