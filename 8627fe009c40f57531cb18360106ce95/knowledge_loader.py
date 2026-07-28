import struct
from pathlib import Path

class KnowledgeChunk:
    def __init__(self, source: str, text: str):
        self.source = source
        self.text = text

def load_knowledge_bin(bin_path='public/knowledge.bin'):
    with open(bin_path, 'rb') as f:
        data = f.read()

    chunks = []
    offset = 0
    while offset < len(data):
        # 2-byte source length (little-endian)
        if offset + 2 > len(data):
            break
        source_len = struct.unpack_from('<H', data, offset)[0]
        offset += 2

        # source string
        source = data[offset:offset+source_len].decode('utf-8')
        offset += source_len

        # 4-byte text length
        if offset + 4 > len(data):
            break
        text_len = struct.unpack_from('<I', data, offset)[0]
        offset += 4

        # text string
        text = data[offset:offset+text_len].decode('utf-8')
        offset += text_len

        chunks.append(KnowledgeChunk(source, text))

    return chunks

def simple_tokenize(text: str):
    import re
    return set(re.findall(r'[a-z0-9]+', text.lower()))

def search_knowledge(query, chunks, top_k=3):
    q_tokens = simple_tokenize(query)
    scored = []
    for chunk in chunks:
        chunk_tokens = simple_tokenize(chunk.text)
        matches = len(q_tokens.intersection(chunk_tokens))
        score = matches / max(len(q_tokens), 1)
        scored.append((score, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]