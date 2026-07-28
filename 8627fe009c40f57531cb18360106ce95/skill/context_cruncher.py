#!/usr/bin/env python3
"""
Context Cruncher — Multi-Document Consolidation Engine
======================================================
Based on peer-reviewed research: MMR, SemDeDup, HOMER, QA-Align, MergeRAG, FENICE.
Converts a directory of markdown/text files into a single redundancy-free SQLite DB
and a binary compressed knowledge file.

Usage:
    python context_cruncher.py consolidate --input docs/ --db out.db --output-bin out.kb
    python context_cruncher.py query "What is the LCP score?" --db out.db
    python context_cruncher.py audit --db out.db
"""

import argparse
import gzip
import json
import logging
import os
import re
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

import numpy as np
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
import spacy

# Optional: for vector similarity in SQLite (pure Python fallback included)
try:
    import sqlite_vec
    VEC_AVAILABLE = True
except ImportError:
    VEC_AVAILABLE = False
    logging.warning("sqlite-vec not available; using in-memory similarity. Install 'sqlite-vec' for efficiency.")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ----- Pydantic Models -----
class Chunk(BaseModel):
    id: Optional[int] = None
    doc_id: int
    text: str
    start_char: int
    end_char: int
    embedding: Optional[np.ndarray] = None

class Proposition(BaseModel):
    id: Optional[int] = None
    chunk_id: int
    text: str
    predicate: str = ""
    args: Dict = {}
    embedding: Optional[np.ndarray] = None

class CanonicalStatement(BaseModel):
    id: Optional[int] = None
    cluster_id: int
    final_text: str
    entropy_score: float
    source_ids: List[int]


# ----- SQLite Database Setup -----
SCHEMA = """
CREATE TABLE IF NOT EXISTS source_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filepath TEXT UNIQUE,
    content TEXT,
    char_length INTEGER,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raw_chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER REFERENCES source_documents(id),
    chunk_text TEXT,
    start_char INTEGER,
    end_char INTEGER,
    embedding BLOB
);

CREATE TABLE IF NOT EXISTS atomic_propositions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chunk_id INTEGER REFERENCES raw_chunks(id),
    proposition_text TEXT,
    predicate TEXT,
    arguments TEXT,
    embedding BLOB
);

CREATE TABLE IF NOT EXISTS dedup_clusters (
    cluster_id INTEGER NOT NULL,
    proposition_id INTEGER REFERENCES atomic_propositions(id),
    similarity_score REAL
);

CREATE TABLE IF NOT EXISTS canonical_statements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_id INTEGER NOT NULL,
    final_text TEXT,
    entropy_score REAL,
    source_ids TEXT
);

CREATE TABLE IF NOT EXISTS entity_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canonical_id INTEGER REFERENCES canonical_statements(id),
    entity_type TEXT,
    entity_value TEXT,
    present_in_source BOOLEAN
);

CREATE TABLE IF NOT EXISTS final_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER DEFAULT 1,
    consolidated_text TEXT,
    compressed_binary BLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

class Database:
    def __init__(self, db_path: str):
        self.conn = sqlite3.connect(db_path)
        self.conn.executescript(SCHEMA)
        if VEC_AVAILABLE:
            # Load sqlite-vec extension
            self.conn.enable_load_extension(True)
            sqlite_vec.load(self.conn)
            self.conn.enable_load_extension(False)
            # Create virtual table for embeddings
            self.conn.execute("CREATE VIRTUAL TABLE IF NOT EXISTS vec_chunks USING vec0(embedding float[384])")
            self.conn.execute("CREATE VIRTUAL TABLE IF NOT EXISTS vec_props USING vec0(embedding float[384])")

    def close(self):
        self.conn.close()

    def insert_document(self, filepath: str, content: str):
        self.conn.execute(
            "INSERT OR IGNORE INTO source_documents (filepath, content, char_length) VALUES (?, ?, ?)",
            (filepath, content, len(content))
        )
        self.conn.commit()
        return self.conn.execute("SELECT id FROM source_documents WHERE filepath = ?", (filepath,)).fetchone()[0]

    def insert_chunk(self, chunk: Chunk):
        emb = chunk.embedding.tobytes() if chunk.embedding is not None else None
        cur = self.conn.execute(
            "INSERT INTO raw_chunks (document_id, chunk_text, start_char, end_char, embedding) VALUES (?,?,?,?,?)",
            (chunk.doc_id, chunk.text, chunk.start_char, chunk.end_char, emb)
        )
        self.conn.commit()
        return cur.lastrowid

    def insert_proposition(self, prop: Proposition):
        emb = prop.embedding.tobytes() if prop.embedding is not None else None
        cur = self.conn.execute(
            "INSERT INTO atomic_propositions (chunk_id, proposition_text, predicate, arguments, embedding) VALUES (?,?,?,?,?)",
            (prop.chunk_id, prop.text, prop.predicate, json.dumps(prop.args), emb)
        )
        self.conn.commit()
        return cur.lastrowid

    def get_proposition_embeddings(self):
        rows = self.conn.execute("SELECT id, embedding FROM atomic_propositions WHERE embedding IS NOT NULL").fetchall()
        return [(r[0], np.frombuffer(r[1], dtype=np.float32)) for r in rows]

    def get_chunk_embeddings(self):
        rows = self.conn.execute("SELECT id, embedding FROM raw_chunks WHERE embedding IS NOT NULL").fetchall()
        return [(r[0], np.frombuffer(r[1], dtype=np.float32)) for r in rows]

    def store_canonical(self, cs: CanonicalStatement):
        self.conn.execute(
            "INSERT INTO canonical_statements (cluster_id, final_text, entropy_score, source_ids) VALUES (?,?,?,?)",
            (cs.cluster_id, cs.final_text, cs.entropy_score, json.dumps(cs.source_ids))
        )
        self.conn.commit()

    def add_entity_audit(self, canonical_id: int, entity_type: str, entity_value: str, found: bool):
        self.conn.execute(
            "INSERT INTO entity_audit (canonical_id, entity_type, entity_value, present_in_source) VALUES (?,?,?,?)",
            (canonical_id, entity_type, entity_value, found)
        )
        self.conn.commit()


# ----- Embedding Model -----
class Embedder:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.dim = self.model.get_sentence_embedding_dimension()

    def encode(self, texts: List[str]) -> np.ndarray:
        return self.model.encode(texts, show_progress_bar=False)

# ----- NLP Processor (proposition extraction, NER) -----
class NLPProcessor:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_lg")

    def split_sentences(self, text: str) -> List[str]:
        doc = self.nlp(text)
        return [sent.text.strip() for sent in doc.sents if sent.text.strip()]

    def extract_propositions(self, text: str) -> List[Proposition]:
        """Simplified heuristic: each sentence becomes a proposition with subject-verb-object."""
        props = []
        doc = self.nlp(text)
        for sent in doc.sents:
            subs = [tok for tok in sent if tok.dep_ in ("nsubj", "nsubjpass")]
            verbs = [tok for tok in sent if tok.pos_ == "VERB"]
            objs = [tok for tok in sent if tok.dep_ in ("dobj", "pobj", "attr")]
            pred = sent.text
            args = {
                "subjects": [t.text for t in subs],
                "verbs": [t.text for t in verbs],
                "objects": [t.text for t in objs]
            }
            props.append(Proposition(chunk_id=-1, text=sent.text, predicate=pred, args=args))
        return props

    def extract_entities(self, text: str) -> List[Tuple[str, str]]:
        doc = self.nlp(text)
        return [(ent.label_, ent.text) for ent in doc.ents]


# ----- Phase 1: Semantic Deduplication (SemDeDup) -----
def phase1_semdedup(db: Database, embedder: Embedder):
    logger.info("Phase 1: Semantic deduplication")
    chunks = db.get_chunk_embeddings()
    if not chunks:
        return
    ids, embs = zip(*chunks)
    embs = np.stack(embs)
    # Compute cosine similarity matrix (approximate via dot product on normalized vectors)
    norms = np.linalg.norm(embs, axis=1, keepdims=True)
    embs_norm = embs / norms
    similarity = np.dot(embs_norm, embs_norm.T)
    np.fill_diagonal(similarity, -1)  # ignore self
    # For each chunk, find max similarity; if >0.95, mark as duplicate (soft delete by ignoring later)
    # We'll store a flag in DB? Instead, we'll collect IDs of chunks to keep.
    keep_set = set(ids)
    duplicate_map = {}
    for i, chunk_id in enumerate(ids):
        max_idx = np.argmax(similarity[i])
        max_sim = similarity[i][max_idx]
        if max_sim > 0.95:
            # Keep the earlier one (lower ID) or whichever is first encountered
            other_id = ids[max_idx]
            if other_id < chunk_id:
                duplicate_map[chunk_id] = other_id
                keep_set.discard(chunk_id)
            else:
                duplicate_map[other_id] = chunk_id
                keep_set.discard(other_id)
    logger.info(f"Duplicate chunks: {len(duplicate_map)} removed, {len(keep_set)} kept.")
    # Store duplicate map for later use? We'll simply not process duplicate chunks in later phases.
    return keep_set, duplicate_map

# ----- Phase 2: Hierarchical Topic Clustering (HOMER-like) -----
def phase2_topic_clustering(db: Database, embedder: Embedder, keep_chunks: set):
    logger.info("Phase 2: Topic clustering (simplified)")
    # We'll group chunks by a simple keyword heuristic for known topics in BookFlow docs.
    topics = {
        "Security": ["security", "CSP", "HSTS", "XSS", "CSRF", "rate limit", "auth", "session"],
        "Performance": ["performance", "LCP", "bundle", "font", "loading", "TBT", "CLS"],
        "Design": ["design", "CSS", "typography", "color", "sidebar", "layout", "component", "token"],
        "Pricing": ["pricing", "plan", "tier", "Solo", "Studio", "Business", "subscription"],
        "Database": ["database", "Prisma", "PostgreSQL", "index", "Bloom filter", "query"],
        "AI Assistant": ["chatbot", "NVIDIA", "knowledge", "cache", "LLM", "assistant"],
        "Architecture": ["architecture", "stack", "Next.js", "Netlify", "Docker", "CI/CD"],
    }
    # We'll assign topic per chunk based on keyword frequency.
    topic_chunks = {t: [] for t in topics}
    unassigned = []
    rows = db.conn.execute("SELECT id, chunk_text FROM raw_chunks WHERE id IN ({})".format(','.join('?'*len(keep_chunks))), list(keep_chunks)).fetchall()
    for cid, text in rows:
        text_lower = text.lower()
        max_count = 0
        best_topic = None
        for topic, keywords in topics.items():
            count = sum(1 for kw in keywords if kw.lower() in text_lower)
            if count > max_count:
                max_count = count
                best_topic = topic
        if best_topic:
            topic_chunks[best_topic].append((cid, text))
        else:
            unassigned.append((cid, text))
    # Within each topic, order by document priority (Analysis first, etc.) later; for now just keep order.
    return topic_chunks, unassigned

# ----- Phase 3: Proposition Extraction & Alignment (QA-Align) -----
def phase3_propositions(db: Database, nlp: NLPProcessor, embedder: Embedder, topic_chunks: dict, keep_chunks: set):
    logger.info("Phase 3: Proposition extraction and alignment")
    # Extract propositions from each kept chunk (excluding duplicates)
    all_props = []  # list of Proposition objects
    for topic, chunk_list in topic_chunks.items():
        for cid, text in chunk_list:
            if cid not in keep_chunks:
                continue
            prop_list = nlp.extract_propositions(text)
            for prop in prop_list:
                prop.chunk_id = cid
                # embed proposition
                prop.embedding = embedder.encode([prop.text])[0]
                # store in DB
                prop_id = db.insert_proposition(prop)
                prop.id = prop_id
                all_props.append(prop)

    # Alignment: group semantically similar propositions
    if not all_props:
        return []
    embs = np.stack([p.embedding for p in all_props])
    norms = np.linalg.norm(embs, axis=1, keepdims=True)
    embs_norm = embs / norms
    similarity = np.dot(embs_norm, embs_norm.T)
    threshold = 0.9
    # Simple connected components clustering
    visited = set()
    clusters = []
    for i in range(len(all_props)):
        if i not in visited:
            # find all j where similarity[i,j] > threshold
            neighbors = set([i])
            # BFS to find connected component
            queue = [i]
            visited.add(i)
            while queue:
                cur = queue.pop(0)
                # find all unvisited with similarity > threshold
                for j in range(len(all_props)):
                    if j not in visited and similarity[cur, j] > threshold:
                        visited.add(j)
                        queue.append(j)
                        neighbors.add(j)
            clusters.append(neighbors)
    logger.info(f"Formed {len(clusters)} proposition clusters.")
    # Store clusters in dedup_clusters
    cluster_id = 0
    for cluster in clusters:
        cluster_id += 1
        for idx in cluster:
            prop = all_props[idx]
            db.conn.execute(
                "INSERT INTO dedup_clusters (cluster_id, proposition_id, similarity_score) VALUES (?,?,?)",
                (cluster_id, prop.id, 1.0)
            )
    db.conn.commit()
    return clusters

# ----- Phase 4: Entropy-Guided Asymmetric Merging (MergeRAG) -----
def phase4_merge(db: Database, nlp: NLPProcessor):
    logger.info("Phase 4: Entropy-guided merging")
    # Retrieve clusters
    cluster_map = {}
    rows = db.conn.execute("SELECT cluster_id, proposition_id FROM dedup_clusters").fetchall()
    for cid, pid in rows:
        cluster_map.setdefault(cid, []).append(pid)
    # For each cluster, compute entropy and pick best
    for cid, prop_ids in cluster_map.items():
        best_prop = None
        best_score = -1.0
        for pid in prop_ids:
            row = db.conn.execute("SELECT proposition_text, embedding FROM atomic_propositions WHERE id=?", (pid,)).fetchone()
            if not row:
                continue
            text, emb = row
            # Compute entropy score: number of entities * log(1+num_tokens) + specificity bonus
            entities = nlp.extract_entities(text)
            num_entities = len(entities)
            num_tokens = len(text.split())
            # bonus for numeric tokens
            num_numbers = len(re.findall(r'\b\d+\.?\d*\b', text))
            score = num_entities * np.log1p(num_tokens) + num_numbers * 2.0
            if score > best_score:
                best_score = score
                best_prop = (pid, text, prop_ids)
        if best_prop:
            cs = CanonicalStatement(
                cluster_id=cid,
                final_text=best_prop[1],
                entropy_score=best_score,
                source_ids=best_prop[2]
            )
            db.store_canonical(cs)

# ----- Phase 5: Faithfulness Verification (ECC + FENICE-light) -----
def phase5_verify(db: Database, nlp: NLPProcessor, source_contents: List[str]):
    logger.info("Phase 5: Faithfulness verification")
    rows = db.conn.execute("SELECT id, final_text, source_ids FROM canonical_statements").fetchall()
    for cs_id, text, src_ids_json in rows:
        src_ids = json.loads(src_ids_json)
        # Get the full source texts for those propositions
        source_text = ""
        for pid in src_ids:
            row = db.conn.execute("SELECT chunk_id FROM atomic_propositions WHERE id=?", (pid,)).fetchone()
            if row:
                chunk_row = db.conn.execute("SELECT chunk_text FROM raw_chunks WHERE id=?", (row[0],)).fetchone()
                if chunk_row:
                    source_text += " " + chunk_row[0]
        # Check entities in canonical text
        entities = nlp.extract_entities(text)
        all_found = True
        for ent_type, ent_value in entities:
            found = ent_value.lower() in source_text.lower()
            db.add_entity_audit(cs_id, ent_type, ent_value, found)
            if not found:
                all_found = False
                logger.warning(f"Entity '{ent_value}' ({ent_type}) not found in sources for canonical statement {cs_id}.")
        # Optional: NLI check (skipped for simplicity)
        if not all_found:
            logger.warning(f"Canonical statement {cs_id} may contain hallucinated entities.")

# ----- Phase 6: Structural Coherence & Binary Compression -----
def phase6_output(db: Database):
    logger.info("Phase 6: Assembly and binary compression")
    # Retrieve canonical statements ordered by cluster_id (topic ordering preserved)
    rows = db.conn.execute("SELECT cluster_id, final_text FROM canonical_statements ORDER BY cluster_id").fetchall()
    # Simple ordering: we already kept topic ordering from Phase 2 indirectly via chunk->proposition->cluster sequence.
    consolidated = []
    for cid, text in rows:
        consolidated.append(text)
    full_text = "\n\n".join(consolidated)
    # Compress
    compressed = gzip.compress(full_text.encode('utf-8'), compresslevel=9)
    # Store in final_outputs
    db.conn.execute(
        "INSERT INTO final_outputs (consolidated_text, compressed_binary) VALUES (?,?)",
        (full_text, compressed)
    )
    db.conn.commit()
    # Also write to file if output_bin path is set (handled in main)
    return full_text, compressed

# ----- Main Pipeline -----
def consolidate_documents(input_dir: str, db_path: str, output_bin: str):
    db = Database(db_path)
    embedder = Embedder()
    nlp = NLPProcessor()

    # 1. Load documents
    doc_dir = Path(input_dir)
    if not doc_dir.is_dir():
        raise ValueError("Input directory does not exist")
    markdown_files = list(doc_dir.glob("*.md")) + list(doc_dir.glob("*.txt")) + list(doc_dir.glob("*.json"))
    for filepath in markdown_files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        db.insert_document(str(filepath), content)

    # 2. Chunk documents
    rows = db.conn.execute("SELECT id, content FROM source_documents").fetchall()
    for doc_id, content in rows:
        # Simple paragraph chunking
        paragraphs = content.split('\n\n')
        start = 0
        for para in paragraphs:
            if para.strip():
                end = start + len(para)
                chunk = Chunk(doc_id=doc_id, text=para.strip(), start_char=start, end_char=end)
                chunk.embedding = embedder.encode([chunk.text])[0]
                db.insert_chunk(chunk)
                start = end + 2  # approximate

    # 3. Phase 1: Semantic Dedup
    keep_set, _ = phase1_semdedup(db, embedder)

    # 4. Phase 2: Topic Clustering
    topic_chunks, _ = phase2_topic_clustering(db, embedder, keep_set)

    # 5. Phase 3: Propositions and Alignment
    clusters = phase3_propositions(db, nlp, embedder, topic_chunks, keep_set)

    # 6. Phase 4: Asymmetric Merging
    phase4_merge(db, nlp)

    # 7. Phase 5: Faithfulness Verification
    source_texts = [r[1] for r in db.conn.execute("SELECT content FROM source_documents").fetchall()]
    phase5_verify(db, nlp, source_texts)

    # 8. Phase 6: Output generation
    full_text, compressed = phase6_output(db)

    # Save binary
    if output_bin:
        with open(output_bin, 'wb') as f:
            f.write(compressed)
        logger.info(f"Binary consolidated knowledge written to {output_bin}")

    logger.info("Consolidation complete.")
    return full_text

def query_database(query: str, db_path: str):
    db = Database(db_path)
    # Simple keyword search in canonical_statements
    rows = db.conn.execute("SELECT final_text FROM canonical_statements WHERE final_text LIKE ?", (f"%{query}%",)).fetchall()
    for r in rows:
        print(r[0])

def audit_database(db_path: str):
    db = Database(db_path)
    rows = db.conn.execute("SELECT canonical_id, entity_type, entity_value, present_in_source FROM entity_audit").fetchall()
    for r in rows:
        print(r)

# ----- CLI Interface -----
def main():
    parser = argparse.ArgumentParser(description="Context Cruncher - Document Consolidation Engine")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Consolidate command
    parser_cons = subparsers.add_parser("consolidate", help="Run full consolidation pipeline")
    parser_cons.add_argument("--input", required=True, help="Directory containing markdown/txt files")
    parser_cons.add_argument("--db", required=True, help="SQLite database output path")
    parser_cons.add_argument("--output-bin", help="Binary compressed knowledge file output")

    # Query command
    parser_query = subparsers.add_parser("query", help="Query canonical statements")
    parser_query.add_argument("query_text", help="Search string")
    parser_query.add_argument("--db", required=True)

    # Audit command
    parser_audit = subparsers.add_parser("audit", help="View entity audit trail")
    parser_audit.add_argument("--db", required=True)

    args = parser.parse_args()

    if args.command == "consolidate":
        consolidate_documents(args.input, args.db, args.output_bin)
    elif args.command == "query":
        query_database(args.query_text, args.db)
    elif args.command == "audit":
        audit_database(args.db)

if __name__ == "__main__":
    main()