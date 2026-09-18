import { useCallback, useEffect, useState } from 'react'
import API_BASE_URL from '../config/api'

export interface SavedSchema {
  id?: string
  name: string
  tree?: unknown
  ts?: number
  createdAt?: string
  updatedAt?: string
}

export const TEMPLATE_CHANGED_EVENT = 'sdui-templates-changed'
export const templateKey = (schema: SavedSchema) => String(schema.id || `name:${schema.name}`)
const TEMPLATES_URL = `${API_BASE_URL.replace(/\/+$/, '')}/cornerstone-package/sdui/templates`

function requestHeaders(json = false) {
  const token = localStorage.getItem('cornerstone_access_token')
  return { Accept: 'application/json', ...(json ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

async function readResponse(response: Response) {
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('json') ? await response.json() : await response.text()
  if (!response.ok) {
    const message = typeof body === 'object' && body ? body.message || body.error : body
    throw new Error(message || `Request failed (HTTP ${response.status})`)
  }
  return body
}

const unwrapPayload = (payload: any): any => payload?.data ?? payload?.result ?? payload?.template ?? payload
const schemaJson = (payload: any): unknown => {
  const value = unwrapPayload(payload)
  return value?.json ?? value?.schema ?? value?.tree ?? value?.data_schema ?? value?.dataSchema ?? value
}

function normalizeTemplate(payload: any): SavedSchema {
  const value = unwrapPayload(payload) || {}
  const date = value.updated_at || value.updatedAt || value.created_at || value.createdAt
  return {
    id: value.id == null ? undefined : String(value.id),
    name: value.name ?? value.template_name ?? value.templateName ?? value.title ?? 'Untitled template',
    tree: value.tree ?? value.json ?? value.schema ?? value.data_schema ?? value.dataSchema,
    ts: value.ts ?? (date ? new Date(date).getTime() : undefined),
    createdAt: value.created_at ?? value.createdAt,
    updatedAt: value.updated_at ?? value.updatedAt,
  }
}

function normalizeList(payload: any): SavedSchema[] {
  const value = unwrapPayload(payload)
  const rows = Array.isArray(value) ? value : value?.items ?? value?.templates ?? value?.content ?? []
  if (!Array.isArray(rows)) throw new Error('Template list response is invalid')
  return rows.map(normalizeTemplate)
}

export async function listSDUITemplates() {
  return normalizeList(await readResponse(await fetch(TEMPLATES_URL, { headers: requestHeaders() })))
}

export async function getSDUITemplate(id: string): Promise<SavedSchema> {
  const url = `${TEMPLATES_URL}/${encodeURIComponent(id)}`
  const [detail, rawJson] = await Promise.all([
    readResponse(await fetch(url, { headers: requestHeaders() })),
    readResponse(await fetch(`${url}/json`, { headers: requestHeaders() })),
  ])
  const template = normalizeTemplate(detail)
  return { ...template, id: template.id || id, tree: schemaJson(rawJson) }
}

export async function createSDUITemplate(name: string, tree: unknown): Promise<SavedSchema> {
  const payload = { name, schema: tree }
  const template = normalizeTemplate(await readResponse(await fetch(TEMPLATES_URL, { method: 'POST', headers: requestHeaders(true), body: JSON.stringify(payload) })))
  return { ...template, name: template.name || name, tree: template.tree ?? tree }
}

export async function updateSDUITemplate(id: string, name: string, tree: unknown): Promise<SavedSchema> {
  const payload = { name, schema: tree }
  const template = normalizeTemplate(await readResponse(await fetch(`${TEMPLATES_URL}/${encodeURIComponent(id)}`, { method: 'PUT', headers: requestHeaders(true), body: JSON.stringify(payload) })))
  return { ...template, id: template.id || id, name: template.name || name, tree: template.tree ?? tree }
}

export async function deleteSDUITemplate(id: string) {
  await readResponse(await fetch(`${TEMPLATES_URL}/${encodeURIComponent(id)}`, { method: 'DELETE', headers: requestHeaders() }))
}

export function useSDUITemplates() {
  const [savedSchemas, setSavedSchemas] = useState<SavedSchema[]>([])
  const [cloudStatus, setCloudStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    setCloudStatus('loading')
    try { setSavedSchemas(await listSDUITemplates()); setCloudStatus('connected'); setError('') }
    catch (reason) { setCloudStatus('error'); setError(reason instanceof Error ? reason.message : 'Could not load templates') }
  }, [])
  useEffect(() => {
    const reload = () => { void refresh() }
    void refresh(); window.addEventListener(TEMPLATE_CHANGED_EVENT, reload)
    return () => window.removeEventListener(TEMPLATE_CHANGED_EVENT, reload)
  }, [refresh])
  return { savedSchemas, setSavedSchemas, cloudStatus, error, refresh }
}
