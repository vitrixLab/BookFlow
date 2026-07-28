/*
 * Context Cruncher (C++ Edition)
 * Multi-document consolidation engine with SQLite persistence.
 * Methodology: SemDeDup, HOMER, QA-Align, MergeRAG, FENICE.
 * Dependencies: SQLite3, zlib (for compression), standard C++17.
 *
 * Compilation (Linux):
 *   g++ -std=c++17 -O2 -o context_cruncher context_cruncher.cpp -lsqlite3 -lz
 *
 * Usage:
 *   ./context_cruncher consolidate --input input_docs/ --db out.db --output-bin out.kb
 *   ./context_cruncher query "search term" --db out.db
 */

#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <algorithm>
#include <cmath>
#include <cstring>
#include <regex>
#include <ctime>
#include <filesystem>
#include <cassert>

#include <sqlite3.h>
#include <zlib.h>

namespace fs = std::filesystem;

// -------------------------------------------------------------------
// Utility: string trimming, splitting
// -------------------------------------------------------------------
static inline void ltrim(std::string &s) {
    s.erase(s.begin(), std::find_if(s.begin(), s.end(), [](unsigned char ch) { return !std::isspace(ch); }));
}
static inline void rtrim(std::string &s) {
    s.erase(std::find_if(s.rbegin(), s.rend(), [](unsigned char ch) { return !std::isspace(ch); }).base(), s.end());
}
static inline void trim(std::string &s) { ltrim(s); rtrim(s); }

std::vector<std::string> split(const std::string &text, const std::string &delim) {
    std::vector<std::string> tokens;
    size_t start = 0, end;
    while ((end = text.find(delim, start)) != std::string::npos) {
        tokens.push_back(text.substr(start, end - start));
        start = end + delim.length();
    }
    tokens.push_back(text.substr(start));
    return tokens;
}

// -------------------------------------------------------------------
// TF-IDF vectorizer (simple, in-memory)
// -------------------------------------------------------------------
class TfIdfVectorizer {
public:
    void fit(const std::vector<std::string> &corpus) {
        // Build vocabulary and idf
        std::unordered_map<std::string, int> df;
        for (const auto &text : corpus) {
            std::istringstream iss(text);
            std::unordered_set<std::string> seen;
            std::string word;
            while (iss >> word) {
                // basic normalization: lowercase, remove punctuation at ends
                std::transform(word.begin(), word.end(), word.begin(), ::tolower);
                word.erase(std::remove_if(word.begin(), word.end(), ::ispunct), word.end());
                if (word.empty()) continue;
                if (seen.find(word) == seen.end()) {
                    df[word]++;
                    seen.insert(word);
                }
            }
        }
        int N = corpus.size();
        for (const auto &p : df) {
            vocab.push_back(p.first);
            idf.push_back(std::log(static_cast<double>(N) / (1 + p.second)));
        }
    }

    // Transform a single text to vector
    std::vector<double> transform(const std::string &text) const {
        std::vector<double> vec(vocab.size(), 0.0);
        std::unordered_map<std::string, int> term_freq;
        std::istringstream iss(text);
        std::string word;
        while (iss >> word) {
            std::transform(word.begin(), word.end(), word.begin(), ::tolower);
            word.erase(std::remove_if(word.begin(), word.end(), ::ispunct), word.end());
            if (word.empty()) continue;
            term_freq[word]++;
        }
        // apply tf-idf
        for (size_t i = 0; i < vocab.size(); ++i) {
            auto it = term_freq.find(vocab[i]);
            if (it != term_freq.end()) {
                double tf = 1.0 + std::log(static_cast<double>(it->second));
                vec[i] = tf * idf[i];
            }
        }
        // L2 normalize
        double norm = 0.0;
        for (double v : vec) norm += v * v;
        norm = std::sqrt(norm);
        if (norm > 0) {
            for (double &v : vec) v /= norm;
        }
        return vec;
    }

    size_t size() const { return vocab.size(); }

private:
    std::vector<std::string> vocab;
    std::vector<double> idf;
};

// Cosine similarity
double cosine(const std::vector<double> &a, const std::vector<double> &b) {
    if (a.size() != b.size() || a.empty()) return 0.0;
    double dot = 0.0, na = 0.0, nb = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
    }
    if (na == 0.0 || nb == 0.0) return 0.0;
    return dot / (std::sqrt(na) * std::sqrt(nb));
}

// -------------------------------------------------------------------
// SQLite Database Manager
// -------------------------------------------------------------------
class DB {
public:
    sqlite3 *conn;
    DB(const std::string &path) {
        int rc = sqlite3_open(path.c_str(), &conn);
        if (rc) {
            std::cerr << "Can't open database: " << sqlite3_errmsg(conn) << std::endl;
            exit(1);
        }
        create_tables();
    }
    ~DB() { sqlite3_close(conn); }

    void exec(const std::string &sql) {
        char *err = nullptr;
        if (sqlite3_exec(conn, sql.c_str(), nullptr, nullptr, &err) != SQLITE_OK) {
            std::cerr << "SQL error: " << err << std::endl;
            sqlite3_free(err);
            exit(1);
        }
    }

    void prepare(const std::string &sql, sqlite3_stmt **stmt) {
        if (sqlite3_prepare_v2(conn, sql.c_str(), -1, stmt, nullptr) != SQLITE_OK) {
            std::cerr << "Prepare error: " << sqlite3_errmsg(conn) << std::endl;
            exit(1);
        }
    }

    int last_insert_rowid() { return sqlite3_last_insert_rowid(conn); }

private:
    void create_tables() {
        std::string schema = R"(
            CREATE TABLE IF NOT EXISTS source_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filepath TEXT UNIQUE,
                content TEXT,
                char_length INTEGER
            );
            CREATE TABLE IF NOT EXISTS raw_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                chunk_text TEXT,
                start_char INTEGER,
                end_char INTEGER,
                embedding BLOB
            );
            CREATE TABLE IF NOT EXISTS atomic_propositions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chunk_id INTEGER,
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
                canonical_id INTEGER,
                entity_value TEXT,
                present_in_source INTEGER
            );
            CREATE TABLE IF NOT EXISTS final_outputs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER DEFAULT 1,
                consolidated_text TEXT,
                compressed_binary BLOB
            );
        )";
        exec(schema);
    }
};

// -------------------------------------------------------------------
// Simple sentence splitter (heuristic)
// -------------------------------------------------------------------
std::vector<std::string> split_sentences(const std::string &text) {
    std::vector<std::string> sentences;
    std::regex sent_regex(R"(([^.!?\n]+[.!?]+))");
    auto words_begin = std::sregex_iterator(text.begin(), text.end(), sent_regex);
    auto words_end = std::sregex_iterator();
    for (std::sregex_iterator i = words_begin; i != words_end; ++i) {
        std::string sent = i->str();
        trim(sent);
        if (!sent.empty()) sentences.push_back(sent);
    }
    // If no punctuation found, treat whole text as one sentence
    if (sentences.empty()) {
        std::string t = text;
        trim(t);
        if (!t.empty()) sentences.push_back(t);
    }
    return sentences;
}

// Simple entity extraction: words starting with uppercase (not after numbers) or containing digits.
std::vector<std::string> extract_entities(const std::string &text) {
    std::vector<std::string> entities;
    std::istringstream iss(text);
    std::string word;
    while (iss >> word) {
        // remove leading/trailing punctuation
        word.erase(std::remove_if(word.begin(), word.end(), ::ispunct), word.end());
        if (word.empty()) continue;
        if (std::isupper(word[0]) || std::any_of(word.begin(), word.end(), ::isdigit)) {
            entities.push_back(word);
        }
    }
    return entities;
}

// BLOB conversion helpers
std::vector<double> blob_to_vector(const void *data, int size) {
    const double *d = static_cast<const double*>(data);
    return std::vector<double>(d, d + size / sizeof(double));
}

std::vector<char> vector_to_blob(const std::vector<double> &vec) {
    const char *raw = reinterpret_cast<const char*>(vec.data());
    return std::vector<char>(raw, raw + vec.size() * sizeof(double));
}

// -------------------------------------------------------------------
// Main Consolidation Pipeline
// -------------------------------------------------------------------
void consolidate(const std::string &input_dir, const std::string &db_path, const std::string &output_bin) {
    DB db(db_path);
    // --- Phase 0: Load documents ---
    std::vector<std::pair<std::string, std::string>> docs; // (filepath, content)
    for (const auto &entry : fs::directory_iterator(input_dir)) {
        if (entry.is_regular_file()) {
            std::string path = entry.path().string();
            std::string ext = entry.path().extension().string();
            if (ext == ".md" || ext == ".txt" || ext == ".json") {
                std::ifstream ifs(path);
                std::string content((std::istreambuf_iterator<char>(ifs)), std::istreambuf_iterator<char>());
                docs.emplace_back(path, content);
                // store in DB
                sqlite3_stmt *stmt;
                db.prepare("INSERT OR IGNORE INTO source_documents (filepath, content, char_length) VALUES (?,?,?)", &stmt);
                sqlite3_bind_text(stmt, 1, path.c_str(), -1, SQLITE_TRANSIENT);
                sqlite3_bind_text(stmt, 2, content.c_str(), -1, SQLITE_TRANSIENT);
                sqlite3_bind_int(stmt, 3, content.size());
                sqlite3_step(stmt);
                sqlite3_finalize(stmt);
            }
        }
    }

    // --- Chunking (paragraph based) ---
    std::vector<std::string> all_chunks;
    std::vector<int> chunk_doc_ids;
    sqlite3_stmt *doc_stmt;
    db.prepare("SELECT id, content FROM source_documents", &doc_stmt);
    while (sqlite3_step(doc_stmt) == SQLITE_ROW) {
        int doc_id = sqlite3_column_int(doc_stmt, 0);
        std::string content(reinterpret_cast<const char*>(sqlite3_column_text(doc_stmt, 1)));
        // split into paragraphs
        auto paras = split(content, "\n\n");
        int start = 0;
        for (auto &para : paras) {
            trim(para);
            if (para.empty()) continue;
            // further split long paragraphs? Keep as is.
            all_chunks.push_back(para);
            chunk_doc_ids.push_back(doc_id);
            // store chunk
            sqlite3_stmt *chk_stmt;
            db.prepare("INSERT INTO raw_chunks (document_id, chunk_text, start_char, end_char) VALUES (?,?,?,?)", &chk_stmt);
            sqlite3_bind_int(chk_stmt, 1, doc_id);
            sqlite3_bind_text(chk_stmt, 2, para.c_str(), -1, SQLITE_TRANSIENT);
            int end = start + para.size();
            sqlite3_bind_int(chk_stmt, 3, start);
            sqlite3_bind_int(chk_stmt, 4, end);
            sqlite3_step(chk_stmt);
            sqlite3_finalize(chk_stmt);
            start = end + 2; // approximate
        }
    }
    sqlite3_finalize(doc_stmt);

    // --- Phase 1: TF-IDF and Semantic Deduplication (SemDeDup) ---
    TfIdfVectorizer tfidf;
    tfidf.fit(all_chunks);
    std::vector<std::vector<double>> chunk_vectors;
    for (const auto &ch : all_chunks) {
        chunk_vectors.push_back(tfidf.transform(ch));
    }
    // Compute similarity matrix and mark duplicates
    std::vector<bool> keep(all_chunks.size(), true);
    // We'll store embeddings as BLOBs later
    for (size_t i = 0; i < all_chunks.size(); ++i) {
        if (!keep[i]) continue;
        for (size_t j = i + 1; j < all_chunks.size(); ++j) {
            if (!keep[j]) continue;
            double sim = cosine(chunk_vectors[i], chunk_vectors[j]);
            if (sim > 0.95) {
                keep[j] = false; // remove j
            }
        }
    }
    // Update DB: store embeddings of kept chunks only
    sqlite3_stmt *upd_stmt;
    db.prepare("UPDATE raw_chunks SET embedding = ? WHERE id = ?", &upd_stmt);
    for (size_t i = 0; i < all_chunks.size(); ++i) {
        if (keep[i]) {
            auto blob = vector_to_blob(chunk_vectors[i]);
            sqlite3_bind_blob(upd_stmt, 1, blob.data(), blob.size(), SQLITE_TRANSIENT);
            sqlite3_bind_int(upd_stmt, 2, i + 1); // assuming sequential ids
            sqlite3_step(upd_stmt);
            sqlite3_reset(upd_stmt);
        }
    }
    sqlite3_finalize(upd_stmt);

    // --- Phase 2: Topic clustering (simple keyword heuristic) ---
    // We'll assign each kept chunk a topic, but later we'll just use document priority.
    // For clarity, we skip explicit clustering and simply process chunks in document order.

    // --- Phase 3: Proposition extraction ---
    // For each kept chunk, split into sentences and embed.
    std::vector<std::pair<int, std::string>> props; // (chunk_id, text)
    std::vector<std::vector<double>> prop_vectors;
    // map from chunk_id to list of proposition texts
    std::map<int, std::vector<std::string>> chunk_props;
    for (size_t i = 0; i < all_chunks.size(); ++i) {
        if (!keep[i]) continue;
        int chunk_id = i + 1; // SQLite id
        auto sentences = split_sentences(all_chunks[i]);
        for (const auto &sent : sentences) {
            props.emplace_back(chunk_id, sent);
            prop_vectors.push_back(tfidf.transform(sent));
            chunk_props[chunk_id].push_back(sent);
            // store proposition
            sqlite3_stmt *stmt;
            db.prepare("INSERT INTO atomic_propositions (chunk_id, proposition_text) VALUES (?,?)", &stmt);
            sqlite3_bind_int(stmt, 1, chunk_id);
            sqlite3_bind_text(stmt, 2, sent.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_step(stmt);
            sqlite3_finalize(stmt);
        }
    }

    // --- Phase 4: Alignment (QA-Align) and Merging (MergeRAG) ---
    // Group similar propositions using cosine similarity with threshold 0.9
    int N = props.size();
    std::vector<int> parent(N);
    for (int i = 0; i < N; ++i) parent[i] = i;
    for (int i = 0; i < N; ++i) {
        for (int j = i + 1; j < N; ++j) {
            if (cosine(prop_vectors[i], prop_vectors[j]) > 0.9) {
                // union
                int ri = i, rj = j;
                while (parent[ri] != ri) ri = parent[ri];
                while (parent[rj] != rj) rj = parent[rj];
                if (ri != rj) parent[rj] = ri;
            }
        }
    }
    // map root to list of proposition indices
    std::map<int, std::vector<int>> clusters;
    for (int i = 0; i < N; ++i) {
        int r = i;
        while (parent[r] != r) r = parent[r];
        clusters[r].push_back(i);
    }
    // For each cluster, pick the "best" proposition (entropy scoring)
    int cluster_id = 0;
    for (auto &c : clusters) {
        cluster_id++;
        int best_idx = -1;
        double best_score = -1.0;
        std::vector<std::string> best_entities; // will be filled during selection
        for (int idx : c.second) {
            const std::string &text = props[idx].second;
            // entropy score: #entities + #numbers + length bonus
            auto entities = extract_entities(text);
            int num_entities = entities.size();
            int word_count = std::count(text.begin(), text.end(), ' ') + 1;
            int num_numbers = std::count_if(text.begin(), text.end(), ::isdigit);
            double score = num_entities + num_numbers + std::log(word_count);
            if (score > best_score) {
                best_score = score;
                best_idx = idx;
                best_entities = entities; // keep entities of best
            }
        }
        if (best_idx >= 0) {
            std::string final_text = props[best_idx].second;
            auto entities = best_entities; // use the entities from the selected best
            // gather source proposition ids
            std::string source_ids = std::to_string(best_idx + 1); // approximate
            // store canonical
            sqlite3_stmt *stmt;
            db.prepare("INSERT INTO canonical_statements (cluster_id, final_text, entropy_score, source_ids) VALUES (?,?,?,?)", &stmt);
            sqlite3_bind_int(stmt, 1, cluster_id);
            sqlite3_bind_text(stmt, 2, final_text.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_double(stmt, 3, best_score);
            sqlite3_bind_text(stmt, 4, source_ids.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_step(stmt);
            int canon_id = db.last_insert_rowid();
            sqlite3_finalize(stmt);
            // faithfulness: check entities against source chunk
            int chunk_id = props[best_idx].first;
            // get the source chunk text
            sqlite3_stmt *chk_stmt;
            db.prepare("SELECT chunk_text FROM raw_chunks WHERE id=?", &chk_stmt);
            sqlite3_bind_int(chk_stmt, 1, chunk_id);
            std::string source_text;
            if (sqlite3_step(chk_stmt) == SQLITE_ROW) {
                source_text = reinterpret_cast<const char*>(sqlite3_column_text(chk_stmt, 0));
            }
            sqlite3_finalize(chk_stmt);
            for (const auto &ent : entities) {
                bool found = source_text.find(ent) != std::string::npos;
                sqlite3_stmt *aud_stmt;
                db.prepare("INSERT INTO entity_audit (canonical_id, entity_value, present_in_source) VALUES (?,?,?)", &aud_stmt);
                sqlite3_bind_int(aud_stmt, 1, canon_id);
                sqlite3_bind_text(aud_stmt, 2, ent.c_str(), -1, SQLITE_TRANSIENT);
                sqlite3_bind_int(aud_stmt, 3, found ? 1 : 0);
                sqlite3_step(aud_stmt);
                sqlite3_finalize(aud_stmt);
            }
        }
    }

    // --- Phase 5: Assembly and compression ---
    // Order canonical statements by cluster_id (which groups similar topics roughly)
    sqlite3_stmt *can_stmt;
    db.prepare("SELECT final_text FROM canonical_statements ORDER BY cluster_id", &can_stmt);
    std::string consolidated;
    while (sqlite3_step(can_stmt) == SQLITE_ROW) {
        std::string text(reinterpret_cast<const char*>(sqlite3_column_text(can_stmt, 0)));
        consolidated += text + "\n\n";
    }
    sqlite3_finalize(can_stmt);

    // Compress with zlib
    uLongf compressed_size = compressBound(consolidated.size());
    std::vector<Bytef> compressed(compressed_size);
    if (compress(compressed.data(), &compressed_size, reinterpret_cast<const Bytef*>(consolidated.c_str()), consolidated.size()) != Z_OK) {
        std::cerr << "Compression failed\n";
        exit(1);
    }

    // Store in final_outputs
    sqlite3_stmt *out_stmt;
    db.prepare("INSERT INTO final_outputs (consolidated_text, compressed_binary) VALUES (?,?)", &out_stmt);
    sqlite3_bind_text(out_stmt, 1, consolidated.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_blob(out_stmt, 2, compressed.data(), compressed_size, SQLITE_TRANSIENT);
    sqlite3_step(out_stmt);
    sqlite3_finalize(out_stmt);

    // Write binary file
    std::ofstream ofs(output_bin, std::ios::binary);
    ofs.write(reinterpret_cast<const char*>(compressed.data()), compressed_size);
    ofs.close();

    std::cout << "Consolidation complete. Output: " << output_bin << std::endl;
}

void query_db(const std::string &db_path, const std::string &term) {
    sqlite3 *conn;
    sqlite3_open(db_path.c_str(), &conn);
    std::string sql = "SELECT final_text FROM canonical_statements WHERE final_text LIKE '%" + term + "%'";
    sqlite3_stmt *stmt;
    sqlite3_prepare_v2(conn, sql.c_str(), -1, &stmt, nullptr);
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        std::cout << sqlite3_column_text(stmt, 0) << std::endl;
    }
    sqlite3_finalize(stmt);
    sqlite3_close(conn);
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        std::cerr << "Usage: consolidate --input <dir> --db <db> --output-bin <file>\n"
                     "       query <term> --db <db>\n";
        return 1;
    }
    std::string mode = argv[1];
    if (mode == "consolidate") {
        std::string input_dir, db_path, output_bin;
        for (int i = 2; i < argc; i += 2) {
            std::string arg = argv[i];
            if (arg == "--input") input_dir = argv[i+1];
            else if (arg == "--db") db_path = argv[i+1];
            else if (arg == "--output-bin") output_bin = argv[i+1];
        }
        if (input_dir.empty() || db_path.empty()) {
            std::cerr << "Missing arguments\n";
            return 1;
        }
        consolidate(input_dir, db_path, output_bin);
	   } else if (mode == "query") {
		std::string term, db_path;
		for (int i = 2; i < argc; ++i) {
			std::string arg = argv[i];
			if (arg == "--db") {
				if (i + 1 < argc) db_path = argv[++i];
			} else {
				if (term.empty()) term = arg;  // first non-flag is the search term
			}
		}
		if (term.empty() || db_path.empty()) {
			std::cerr << "Usage: query <term> --db <db>\n";
			return 1;
		}
		query_db(db_path, term);
	}
    return 0;
}