// lib/chat_db.ts
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { getCached, setCached } from './cache'          // new import

// ── Configuration ──────────────────────────────────
const DB_PATH = process.env.CONSOLIDATED_DB_PATH || path.join(process.cwd(), 'out.db')

// Single base URL for all knowledge & chat endpoints (if set)
const BASE = process.env.KNOWLEDGE_CHAT_BASE_API_URL || ''

// Derive individual URLs, allowing old env vars as overrides
const KNOWLEDGE_API_URL = process.env.KNOWLEDGE_API_URL || (BASE ? `${BASE}knowledge/search` : '')
const KNOWLEDGE_SOURCES_URL = BASE ? `${BASE}knowledge/sources` : ''
const KNOWLEDGE_STATEMENTS_URL = BASE ? `${BASE}knowledge/statements` : ''
const CHATLOG_API_URL = process.env.CHATLOG_API_URL || (BASE ? `${BASE}chat-logs` : '')
const CHATLOG_API_KEY = process.env.KNOWLEDGE_CHAT_API_KEY || process.env.CHATLOG_API_KEY || ''

const DEBUG_API = process.env.DEBUG_API === 'true'

// Cache TTL for knowledge endpoints (default 10 minutes)
const CACHE_TTL_KNOWLEDGE = Number(process.env.KNOWLEDGE_CACHE_TTL) || 10 * 60 * 1000

let db: SqlJsDatabase | null = null

async function getDb(): Promise<SqlJsDatabase> {
  if (!db) {
    const SQL = await initSqlJs()
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH)
      db = new SQL.Database(buffer)
    } else {
      db = new SQL.Database()
    }
  }
  return db
}

// ── Types ───────────────────────────────────────────
export interface SourceDocument {
  id: number
  filepath: string
  content: string
  charLength: number
}

export interface CanonicalStatement {
  id: number
  clusterId: number
  finalText: string
  entropyScore: number
}

export interface ChatMessage {
  role: string
  content: string
  timestamp: string
}

export interface ChatInteraction {
  id: number
  question: string
  answer: string
  source: string
  userId: number | null
  role: string | null
  timestamp: string
}

export interface ApiTraceEntry {
  timestamp: string
  url: string
  method: string
  status: number | null
  responseBody?: unknown
  error?: string
}

const MAX_TRACE_ENTRIES = 200
export const apiTraceRing: ApiTraceEntry[] = []

function logTrace(entry: ApiTraceEntry) {
  if (DEBUG_API) {
    console.log(`[API TRACE] ${entry.method} ${entry.url} → ${entry.status ?? 'ERR'}`, entry.error ?? '')
  }
  apiTraceRing.push(entry)
  if (apiTraceRing.length > MAX_TRACE_ENTRIES) apiTraceRing.shift()
}

async function tracedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const entry: ApiTraceEntry = {
    timestamp: new Date().toISOString(),
    url,
    method: options.method || 'GET',
    status: null,
  }
  try {
    const res = await fetch(url, options)
    entry.status = res.status
    const cloned = res.clone()
    try { entry.responseBody = await cloned.json() } catch { entry.responseBody = null }
    logTrace(entry)
    return res
  } catch (err: any) {
    entry.status = null
    entry.error = err.message
    logTrace(entry)
    throw err
  }
}

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (CHATLOG_API_KEY) headers['X-API-Key'] = CHATLOG_API_KEY
  return headers
}

// ═══════════════════════════════════════════════════════
//  Hybrid data fetchers (API‑first, cache + local SQLite fallback)
// ═══════════════════════════════════════════════════════

export async function getSourceDocuments(): Promise<SourceDocument[]> {
  // 1. Try remote API with caching
  if (KNOWLEDGE_SOURCES_URL) {
    const cacheKey = 'api:sources'
    const cached = getCached(cacheKey, CACHE_TTL_KNOWLEDGE)
    if (cached) return cached as SourceDocument[]

    try {
      const res = await tracedFetch(KNOWLEDGE_SOURCES_URL, { method: 'GET', headers: apiHeaders() })
      if (res.ok) {
        const data: { id: number; filepath: string; charLength: number }[] = await res.json()
        const result = data.map(d => ({ id: d.id, filepath: d.filepath, content: '', charLength: d.charLength }))
        setCached(cacheKey, result, CACHE_TTL_KNOWLEDGE)
        return result
      }
    } catch { console.warn('Remote source documents unavailable, using local DB') }
  }

  // 2. Fallback to local SQLite
  const database = await getDb()
  try {
    const results: SourceDocument[] = []
    const rows = database.exec('SELECT id, filepath, content, char_length FROM source_documents')
    if (rows.length > 0) {
      for (const row of rows[0].values) {
        results.push({ id: row[0] as number, filepath: row[1] as string, content: row[2] as string, charLength: row[3] as number })
      }
    }
    return results
  } catch (err) { console.error('Error reading source documents:', err); return [] }
}

export async function getCanonicalStatements(limit = 50): Promise<CanonicalStatement[]> {
  // 1. Try remote API with caching (cache key includes limit)
  if (KNOWLEDGE_STATEMENTS_URL) {
    const cacheKey = `api:statements:${limit}`
    const cached = getCached(cacheKey, CACHE_TTL_KNOWLEDGE)
    if (cached) return cached as CanonicalStatement[]

    try {
      const res = await tracedFetch(`${KNOWLEDGE_STATEMENTS_URL}?limit=${limit}`, { method: 'GET', headers: apiHeaders() })
      if (res.ok) {
        const data: { id: number; clusterId: number; finalText: string; entropyScore: number }[] = await res.json()
        const result = data.map(d => ({ id: d.id, clusterId: d.clusterId, finalText: d.finalText, entropyScore: d.entropyScore }))
        setCached(cacheKey, result, CACHE_TTL_KNOWLEDGE)
        return result
      }
    } catch { console.warn('Remote statements unavailable, using local DB') }
  }

  // 2. Fallback to local SQLite
  const database = await getDb()
  try {
    const results: CanonicalStatement[] = []
    const stmt = database.prepare('SELECT id, cluster_id, final_text, entropy_score FROM canonical_statements ORDER BY entropy_score DESC LIMIT ?')
    stmt.bind([limit])
    while (stmt.step()) {
      const row = stmt.getAsObject()
      results.push({ id: row.id as number, clusterId: row.cluster_id as number, finalText: row.final_text as string, entropyScore: row.entropy_score as number })
    }
    stmt.free()
    return results
  } catch (err) { console.error('Error reading canonical statements:', err); return [] }
}

export async function searchStatements(term: string, limit = 20): Promise<CanonicalStatement[]> {
  if (KNOWLEDGE_API_URL) {
    try {
      const res = await tracedFetch(KNOWLEDGE_API_URL, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ query: term, limit }),
      })
      if (res.ok) {
        const rows: string[] = await res.json()
        return rows.map((text, idx) => ({ id: idx, clusterId: idx, finalText: text, entropyScore: 0 }))
      }
    } catch { console.warn('Remote search unavailable, using local DB') }
  }
  // local LIKE search fallback
  const database = await getDb()
  try {
    const results: CanonicalStatement[] = []
    const stmt = database.prepare(`SELECT id, cluster_id, final_text, entropy_score FROM canonical_statements WHERE final_text LIKE '%${term}%' ORDER BY entropy_score DESC LIMIT ${limit}`)
    while (stmt.step()) {
      const row = stmt.getAsObject()
      results.push({ id: row.id as number, clusterId: row.cluster_id as number, finalText: row.final_text as string, entropyScore: row.entropy_score as number })
    }
    stmt.free()
    return results
  } catch (err) { console.error('Local search error:', err); return [] }
}

export async function getChatInteractions(limit = 100, offset = 0): Promise<ChatInteraction[]> {
  const remote = await getChatLogsRemote({ limit, offset })
  if (remote && remote.logs.length > 0) return remote.logs
  // local fallback
  const database = await getDb()
  try {
    const check = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='chat_interactions'")
    if (check.length === 0 || check[0].values.length === 0) return []
    const results: ChatInteraction[] = []
    const stmt = database.prepare('SELECT id, question, answer, source, user_id, role, timestamp FROM chat_interactions ORDER BY id DESC LIMIT ? OFFSET ?')
    stmt.bind([limit, offset])
    while (stmt.step()) {
      const row = stmt.getAsObject()
      results.push({ id: row.id as number, question: row.question as string, answer: row.answer as string, source: row.source as string, userId: row.user_id as number | null, role: row.role as string | null, timestamp: row.timestamp as string })
    }
    stmt.free()
    return results
  } catch (err) { console.error('Error reading chat interactions:', err); return [] }
}

// ── Remote chat‑log helpers ────────────────────────
export async function createChatLogRemote(data: { user_id: number; role: string; content: string; source?: string; metadata?: Record<string, unknown> }): Promise<{ id?: number; created_at?: string; error?: string } | null> {
  if (!CHATLOG_API_URL) return null
  try {
    const res = await tracedFetch(CHATLOG_API_URL, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ user_id: data.user_id, role: data.role, content: data.content, source: data.source || 'bookflow', metadata: data.metadata || {} }),
    })
    const json = await res.json()
    if (!res.ok) return { error: json.error || `Status ${res.status}` }
    return json
  } catch (err) { console.warn('Chat log API unreachable:', err); return null }
}

export async function getChatLogsRemote(params: { user_id?: number; limit?: number; offset?: number } = {}): Promise<{ logs: ChatInteraction[]; total: number } | null> {
  if (!CHATLOG_API_URL) return null
  try {
    const url = new URL(CHATLOG_API_URL)
    if (params.user_id) url.searchParams.set('user_id', String(params.user_id))
    if (params.limit) url.searchParams.set('limit', String(params.limit))
    if (params.offset) url.searchParams.set('offset', String(params.offset))
    const res = await tracedFetch(url.toString(), { method: 'GET', headers: apiHeaders() })
    if (!res.ok) throw new Error(`Chat log fetch returned ${res.status}`)
    const json = await res.json()
    return {
      logs: (json.logs || []).map((l: any) => ({
        id: l.id as number,
        question: (l.content as string) || '',
        answer: '',
        source: (l.source as string) || '',
        userId: l.user_id as number | null,
        role: l.role as string | null,
        timestamp: l.created_at as string,
      })),
      total: json.total as number,
    }
  } catch (err) { console.warn('Chat log fetch failed:', err); return null }
}

export async function deleteChatLogRemote(logId: number): Promise<boolean> {
  if (!CHATLOG_API_URL) return false
  try {
    const res = await tracedFetch(`${CHATLOG_API_URL}/${logId}`, { method: 'DELETE', headers: apiHeaders() })
    return res.ok
  } catch (err) { console.warn('Chat log delete failed:', err); return false }
}

// ═══════════════════════════════════════════════════════
export async function searchKnowledgeBase(question: string, topK = 5): Promise<CanonicalStatement[]> {
  if (KNOWLEDGE_API_URL) {
    const remote = await searchStatements(question, topK)
    if (remote.length > 0) return remote
  }
  return await getCanonicalStatements(topK) // local fallback
}