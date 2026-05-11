import fs from 'fs'
import path from 'path'

interface KnowledgeChunk {
  source: string
  text: string
}

let knowledgeCache: KnowledgeChunk[] | null = null

export function loadKnowledge(): KnowledgeChunk[] {
  if (knowledgeCache) return knowledgeCache

  const binPath = path.join(process.cwd(), 'public', 'knowledge.bin')
  if (!fs.existsSync(binPath)) {
    // If the binary hasn’t been built yet, return an empty array so the assistant won’t break.
    knowledgeCache = []
    return knowledgeCache
  }

  const buffer = fs.readFileSync(binPath)
  const chunks: KnowledgeChunk[] = []
  let offset = 0

  while (offset < buffer.length) {
    // source length (UInt16LE)
    if (offset + 2 > buffer.length) break
    const sourceLen = buffer.readUInt16LE(offset)
    offset += 2

    // source string
    const source = buffer.toString('utf-8', offset, offset + sourceLen)
    offset += sourceLen

    // text length (UInt32LE)
    if (offset + 4 > buffer.length) break
    const textLen = buffer.readUInt32LE(offset)
    offset += 4

    // text string
    const text = buffer.toString('utf-8', offset, offset + textLen)
    offset += textLen

    chunks.push({ source, text })
  }

  knowledgeCache = chunks
  return knowledgeCache
}

function simpleTokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function searchKnowledge(query: string, topK = 3): KnowledgeChunk[] {
  const chunks = loadKnowledge()
  if (chunks.length === 0) return []

  const qTokens = new Set(simpleTokenize(query))
  const scored = chunks.map((chunk) => {
    const chunkTokens = simpleTokenize(chunk.text)
    let matches = 0
    for (const t of chunkTokens) if (qTokens.has(t)) matches++
    return { chunk, score: matches / Math.max(qTokens.size, 1) }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK).map((s) => s.chunk)
}