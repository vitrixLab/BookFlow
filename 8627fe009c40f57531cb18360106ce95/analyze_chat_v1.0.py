import sqlite3, json
from collections import Counter

DB_NAME = "chat_analysis.db"

conn = sqlite3.connect(DB_NAME)
c = conn.cursor()

# --- Model summary ---
c.execute('SELECT run_id, n_layer, n_embd, block_size, n_head, vocab_size, num_params FROM model_info')
models = c.fetchall()
if not models:
    print("No model data found.")
    exit()
print("=== Model Configurations ===")
for m in models:
    print(f"Run {m[0]}: layers={m[1]}, embd={m[2]}, block={m[3]}, heads={m[4]}, vocab={m[5]}, params={m[6]}")

# For each run, show weight stats
c.execute('SELECT run_id, weight_min, weight_max, weight_mean, weight_std FROM model_info')
for row in c.fetchall():
    print(f"\nRun {row[0]} weight stats: min={row[1]:.4f}, max={row[2]:.4f}, mean={row[3]:.4f}, std={row[4]:.4f}")

# --- Overall chat statistics ---
c.execute('SELECT COUNT(*) FROM chat_log')
total = c.fetchone()[0]
print(f"\n=== Chat Logs (Total: {total}) ===")

# Total per source
c.execute('SELECT source, COUNT(*) FROM chat_log GROUP BY source')
sources = c.fetchall()
for src, cnt in sources:
    print(f"  {src}: {cnt} ({100*cnt/total:.1f}%)")

# Average answer length by source
c.execute('SELECT source, AVG(LENGTH(answer)) FROM chat_log GROUP BY source')
for src, avg_len in c.fetchall():
    print(f"  {src} avg answer length: {avg_len:.1f} chars")

# Top 10 most frequent questions
c.execute('SELECT user_question, COUNT(*) as cnt FROM chat_log GROUP BY user_question ORDER BY cnt DESC LIMIT 10')
print("\n=== Top 10 Frequent Questions ===")
for q, cnt in c.fetchall():
    print(f"  '{q}' – {cnt} times")

# Questions that went to SLM (not cache) – could be interesting failures
c.execute("SELECT user_question, answer FROM chat_log WHERE source='slm' LIMIT 10")
print("\n=== Recent SLM fallback answers ===")
for q, ans in c.fetchall():
    print(f"  Q: {q}  →  A: {ans}")

conn.close()