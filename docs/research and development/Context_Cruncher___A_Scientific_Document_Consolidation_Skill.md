# Context Cruncher — A Scientific Document Consolidation Skill  
**Tagline:** *Binary consolidation engine powered by MMR, SemDeDup, HOMER, QA‑Align, MergeRAG, and SQLite.*

## 1. Skill Overview

**Context Cruncher** is a CLI tool and Python library that ingests an arbitrary number of markdown/text documents, applies the full zero‑redundancy consolidation pipeline, and produces:

- **A SQLite database** containing all original facts, deduplicated propositions, merged canonical statements, and a final master text.
- **A binary‑compressed knowledge file** (`consolidated.kb`) that can be loaded directly into BookFlow’s assistant (replacing `knowledge.bin`).
- **Audit trail tables** proving faithfulness and coverage.

It is designed to run offline, with minimal dependencies, and can be integrated into any CI/CD pipeline.

---

## 2. High‑Level Architecture

```
Input: N markdown/doc files
  ↓
[Phase 1] Semantic Deduplication (SemDeDup)
  ↓
[Phase 2] Hierarchical Chunking & Topic Clustering (HOMER)
  ↓
[Phase 3] Proposition‑Level Alignment (QA‑Align)
  ↓
[Phase 4] Entropy‑Guided Asymmetric Merging (MergeRAG)
  ↓
[Phase 5] Faithfulness Verification (ECC + FENICE)
  ↓
[Phase 6] Structural Coherence & Binary Compression
  ↓
Output: SQLite DB + consolidated.kb (gzipped)
```

All intermediate state is stored in SQLite tables, ensuring reproducibility and incremental updates.

---

## 3. Technology Stack

- **Python 3.11+** (primary language)
- **SQLite** with `sqlite3` (built‑in) + `sqlite-vec` extension for vector similarity
- **sentence‑transformers** (`all-MiniLM-L6-v2`) for embedding‑based similarity
- **spaCy** (`en_core_web_lg`) for sentence splitting, NER, and entity extraction
- **spacy‑alignments** & **QA‑SRL** (*heuristic*) for proposition alignment
- **gzip / zlib** for binary compression
- **pydantic** for data models and validation

All models run locally; no external API calls are needed.

---

## 4. SQLite Schema Design

The database acts as the single source of truth throughout the pipeline.

### Table: `source_documents`
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | |
| filepath | TEXT UNIQUE | |
| content | TEXT | raw markdown |
| char_length | INTEGER | |
| imported_at | TIMESTAMP | |

### Table: `raw_chunks`
| Column | Type |
|--------|------|
| id | INTEGER PK |
| document_id | FK → source_documents |
| chunk_text | TEXT |
| start_char | INTEGER |
| end_char | INTEGER |
| embedding | BLOB (float32, 384‑dim) |

Chunks are paragraphs or fixed‑size segments (200 words). Embeddings stored as binary blobs for fast similarity searches using `sqlite-vec`.

### Table: `atomic_propositions`
| Column | Type |
|--------|------|
| id | INTEGER PK |
| chunk_id | FK → raw_chunks |
| proposition_text | TEXT |
| predicate | TEXT |
| arguments | JSON |
| embedding | BLOB |

Propositions are individual factual statements extracted from chunks (e.g., “BookFlow uses iron-session v7”).

### Table: `dedup_clusters`
| Column | Type |
|--------|------|
| cluster_id | INTEGER |
| proposition_id | FK → atomic_propositions |
| similarity_score | REAL |

Records the grouping of semantically identical propositions across documents.

### Table: `canonical_statements`
| Column | Type |
|--------|------|
| id | INTEGER PK |
| cluster_id | FK |
| final_text | TEXT |
| entropy_score | REAL |
| source_ids | JSON (list of source proposition IDs) |

The selected canonical version for each cluster, chosen via entropy‑guided asymmetric merging.

### Table: `entity_audit`
| Column | Type |
|--------|------|
| id | INTEGER PK |
| canonical_id | FK |
| entity_type | TEXT |
| entity_value | TEXT |
| present_in_source | BOOLEAN |

Used for Phase 5 verification.

### Table: `final_outputs`
| Column | Type |
|--------|------|
| id | INTEGER PK |
| version | INTEGER |
| consolidated_text | TEXT |
| compressed_binary | BLOB (gzip) |
| created_at | TIMESTAMP |

Stores the final master document and its binary compressed form.

---

## 5. The Six‑Phase Pipeline (Implementation Details)

### Phase 1: Semantic Deduplication (SemDeDup)

*Research basis:* Abbas et al. “SemDeDup”, using embeddings to identify near‑duplicate passages.

**Implementation steps:**
1. Chunk all source documents into paragraphs (preserve header contexts).
2. Compute embeddings for each chunk via `sentence-transformers` and store as binary blobs.
3. Use `sqlite-vec` to build a virtual table on `raw_chunks.embedding`.
4. For each chunk, find its nearest neighbor using cosine similarity with a `MATCH` query. If similarity > 0.95, mark as duplicate of the earlier chunk.
5. Duplicate chunks are **not deleted** but flagged; they will not be passed to proposition extraction.

**Why this removes redundancy:** Identical content (e.g., the tech‑debt tracker copied in three files) is reduced to a single representative chunk.

### Phase 2: Hierarchical Chunking & Topic Clustering (HOMER)

*Research basis:* Song et al. “HOMER” – hierarchical merging of context chunks.

**Implementation steps:**
1. After dedup, take the unique chunks and cluster them by topic using unsupervised clustering (K‑Means on embeddings, k = number of broad topics, e.g., Security, Performance, Design, etc.). Alternatively, use a simple keyword‑based grouping (e.g., “security headers”, “font loading”) if topics are known.
2. Within each topic cluster, sort chunks by document priority (e.g., Analysis Report before Migration Report) and by logical flow (findings → recommendations → status).
3. This produces an ordered list of chunks per topic, ready for proposition extraction.

**Why this helps:** Instead of processing files sequentially, we group related information, preventing the system from scattering the same fact across multiple sections.

### Phase 3: Proposition‑Level Alignment (QA‑Align)

*Research basis:* Roit et al. “QA‑Align” – align QA‑pairs to find cross‑text overlap.

**Implementation steps:**
1. For each deduplicated chunk, use a heuristic QA‑SRL extractor (e.g., a fine‑tuned T5 model for predicate‑argument extraction, or a rule‑based system) to generate a set of (Subject, Predicate, Object) triples.
2. Store these as `atomic_propositions` with embeddings.
3. Perform a pairwise similarity search across all propositions (within each topic cluster) using `sqlite-vec`; group propositions whose embeddings are within 0.9 cosine distance.
4. This creates clusters of semantically equivalent statements, regardless of phrasing.

**Why this matters:** “Missing security headers (CSP, HSTS)” and “Add security headers via next.config.js” end up in the same cluster.

### Phase 4: Entropy‑Guided Asymmetric Merging (MergeRAG)

*Research basis:* Guo et al. “MergeRAG” – asymmetric merging retains the most information‑dense version.

**Implementation steps:**
1. For each cluster of equivalent propositions, compute an **entropy score** based on:
   - Number of named entities (spaCy NER)
   - Specificity of numbers/dates (count of numeric tokens)
   - Sentence length (normalized)
   - Source reliability score (e.g., Analysis Report > Tech‑Debt tracker > Phase plan)
2. Select the proposition with the highest entropy as the `canonical_statement`.
3. Record the mapping of source propositions to the canonical statement.

**Why this works:** The most informative, detailed version survives; the vague summary is dropped.

### Phase 5: Faithfulness Verification (ECC + FENICE)

*Research basis:* Nan et al. “Entity Coverage Control”, FENICE factuality metric.

**Implementation steps:**
1. Extract all named entities (ORGs, PRODUCTs, dates, numbers) from the canonical statements.
2. For each canonical statement, verify that its entities appear in the source documents (by querying `source_documents.content` with SQL LIKE). If an entity is not found, flag it as a potential hallucination.
3. Additionally, use a lightweight NLI model (e.g., `roberta-large-mnli`) to check if the canonical statement is entailed by its corresponding source chunks. (Optional, but recommended for high accuracy.)
4. Any statement that fails is marked for manual review or replaced by the next best alternative from the cluster.

**Why this is critical:** It guarantees that our consolidated output does not invent facts.

### Phase 6: Structural Coherence & Binary Compression (FiC + gzip)

*Research basis:* Slobodkin et al. “FiC” – coherent ordering, non‑redundant.

**Implementation steps:**
1. Order the canonical statements within each topic according to the flow defined in Phase 2.
2. Concatenate them with topic headers, forming the final master text.
3. Write the text to `final_outputs.consolidated_text`.
4. Compress the text using gzip (level 9) and store as BLOB in `compressed_binary`.
5. Optionally, generate a `consolidated.kb` file identical to BookFlow’s `knowledge.bin` but derived from the fully deduplicated, verified content.

**Why binary compression:** The final compressed blob can be loaded by the chatbot with minimal I/O, and it reflects the absolute minimal representation preserving all information.

---

## 6. Command‑Line Interface

```bash
# Consolidate all markdown files in a directory
context-cruncher consolidate \
  --input /path/to/docs/ \
  --db output/consolidation.db \
  --output-bin output/consolidated.kb \
  --entropy-threshold 0.85

# Query the database for a specific fact
context-cruncher query "What is the LCP score?" --db consolidation.db

# Export audit report
context-cruncher audit --db consolidation.db --format json
```

---

## 7. Performance & Scalability

- All embeddings computed once and cached in SQLite.
- `sqlite-vec` enables efficient similarity searches on thousands of chunks without a vector database server.
- Incremental updates: when a new document is added, only its chunks/propositions are computed; duplicate detection and merging are re‑run only on affected clusters.
- Memory usage stays low because propositions are processed in batches.

---

## 8. Integration with BookFlow

The output binary `consolidated.kb` can directly overwrite `public/knowledge.bin`. The consolidated SQLite database can serve as the backend for a new “Supervised Knowledge” admin page, showing exactly what facts the assistant knows and their provenance.

---

## 9. Why This Is “Highly Technical” and “Scientific”

This skill is not a simple script; it implements **six independent NLP research papers** in a unified pipeline, each phase backed by a specific, peer‑reviewed technique. It employs:

- Vector similarity (SemDeDup, QA‑Align)
- Information‑theoretic criteria (entropy‑guided merging)
- Entity‑level verification (ECC)
- Natural language inference (FENICE)
- Hierarchical context management (HOMER)
- Database‑backed state with binary compression

It solves the exact problem described in the literature—producing a fully accurate, zero‑redundancy consolidation of overlapping documents—in a reproducible, auditable way.