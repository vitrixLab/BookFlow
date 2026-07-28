import sqlite3, json, collections, math, datetime, re, string
from itertools import groupby

DB_NAME = "chat_analysis.db"

def ascii_histogram(data, bins=10, width=40):
    """Simple ASCII histogram for a list of numbers."""
    if not data:
        return ""
    min_val, max_val = min(data), max(data)
    bin_width = (max_val - min_val) / bins if max_val > min_val else 1
    counts = [0]*bins
    for v in data:
        idx = min(int((v - min_val) / bin_width), bins-1)
        counts[idx] = counts[idx] + 1
    max_count = max(counts) if counts else 1
    lines = []
    for i in range(bins):
        low = min_val + i*bin_width
        high = low + bin_width
        bar = '#' * int(counts[i] / max_count * width)
        lines.append(f"{low:7.1f}-{high:7.1f} | {bar} {counts[i]}")
    return '\n'.join(lines)

def top_words(texts, n=15, min_len=2):
    """Extract most common words from a list of strings."""
    word_counts = collections.Counter()
    for text in texts:
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        word_counts.update(w for w in words if len(w) >= min_len)
    return word_counts.most_common(n)

def sessionize(timestamps, gap_seconds=300):
    """Group timestamps into sessions based on a time gap."""
    if not timestamps:
        return []
    sorted_ts = sorted(timestamps)
    sessions = [[sorted_ts[0]]]
    for ts in sorted_ts[1:]:
        if (ts - sessions[-1][-1]).total_seconds() > gap_seconds:
            sessions.append([ts])
        else:
            sessions[-1].append(ts)
    return sessions

conn = sqlite3.connect(DB_NAME)
c = conn.cursor()

# ========== Model Configurations ==========
c.execute('SELECT run_id, n_layer, n_embd, block_size, n_head, vocab_size, num_params FROM model_info')
models = c.fetchall()
if not models:
    print("No model data found.")
    exit()

print("=" * 70)
print(" MODEL CONFIGURATIONS & WEIGHT STATISTICS ")
print("=" * 70)
for m in models:
    print(f"Run {m[0]}: {m[1]} layers, {m[2]} dim, block={m[3]}, heads={m[4]}, vocab={m[5]}, params={m[6]}")
c.execute('SELECT run_id, weight_min, weight_max, weight_mean, weight_std FROM model_info')
for row in c.fetchall():
    print(f"Run {row[0]} weights → min: {row[1]:.4f}, max: {row[2]:.4f}, mean: {row[3]:.4f}, std: {row[4]:.4f}")

# ========== Fetch all chat data ==========
c.execute('SELECT run_id, timestamp, user_question, source, answer, temperature FROM chat_log ORDER BY timestamp')
rows = c.fetchall()
if not rows:
    print("\nNo chat logs yet. Run chat.py and interact first.")
    conn.close()
    exit()

print(f"\nTotal logged interactions: {len(rows)}")

# Convert timestamps to datetime objects
ts_list = []
questions = []
answers = []
sources = []
temperatures = []
for r in rows:
    try:
        ts = datetime.datetime.fromisoformat(r[1])
    except:
        ts = datetime.datetime.now()  # fallback
    ts_list.append(ts)
    questions.append(r[2])
    sources.append(r[3])
    answers.append(r[4])
    temperatures.append(r[5])

# ========== QUANTITATIVE ANALYSIS ==========
print("\n" + "=" * 70)
print(" QUANTITATIVE ANALYSIS ")
print("=" * 70)

# 1. Per-source counts
source_counts = collections.Counter(sources)
for src, cnt in source_counts.items():
    pct = 100 * cnt / len(sources)
    print(f"{src}: {cnt} interactions ({pct:.1f}%)")

# 2. Basic timing
if ts_list:
    print(f"\nTime span: {min(ts_list)} to {max(ts_list)}")
    print(f"Duration: {max(ts_list) - min(ts_list)}")

# 3. Hourly activity
hour_counts = collections.Counter()
for ts in ts_list:
    hour_counts[ts.hour] += 1
print("\nHourly activity (top 5 hours):")
for hour, cnt in hour_counts.most_common(5):
    print(f"  {hour:02d}:00 - {hour:02d}:59  → {cnt} chats")

# 4. Question length stats
q_lens = [len(q) for q in questions]
print(f"\nQuestion length (chars): min={min(q_lens)}, max={max(q_lens)}, "
      f"avg={sum(q_lens)/len(q_lens):.1f}, median={sorted(q_lens)[len(q_lens)//2]}")

# 5. Answer length stats by source
ans_lens_cache = [len(a) for a, s in zip(answers, sources) if s == 'cache']
ans_lens_slm = [len(a) for a, s in zip(answers, sources) if s == 'slm']
for label, lens in [("Cache", ans_lens_cache), ("SLM", ans_lens_slm)]:
    if lens:
        print(f"{label} answer length: min={min(lens)}, max={max(lens)}, "
              f"avg={sum(lens)/len(lens):.1f}, median={sorted(lens)[len(lens)//2]}")
    else:
        print(f"{label} answers: none yet")

# 6. Session analysis
sessions = sessionize(ts_list, gap_seconds=300)
print(f"\nEstimated sessions (gap > 5 min): {len(sessions)}")
session_lengths = [len(s) for s in sessions]
if session_lengths:
    print(f"Chats per session: avg={sum(session_lengths)/len(session_lengths):.1f}, "
          f"max={max(session_lengths)}, min={min(session_lengths)}")

# 7. Most frequent questions (with source breakdown)
q_counter = collections.Counter(zip(questions, sources))
print("\nTop 10 frequent question + source pairs:")
for (q, src), cnt in q_counter.most_common(10):
    print(f"  [{src}] '{q}' – {cnt} times")

# 8. Answer length histogram (SLM only)
if ans_lens_slm:
    print("\nSLM answer length distribution (ASCII histogram):")
    print(ascii_histogram(ans_lens_slm, bins=8))

# 9. Temperature distribution (for SLM calls)
slm_temps = [t for t, s in zip(temperatures, sources) if s == 'slm']
if slm_temps:
    print(f"\nSLM temperature values: always {slm_temps[0]} (constant 0.4)" if len(set(slm_temps))==1
          else f"SLM temperature range: {min(slm_temps)}-{max(slm_temps)}")

# ========== QUALITATIVE ANALYSIS ==========
print("\n" + "=" * 70)
print(" QUALITATIVE ANALYSIS ")
print("=" * 70)

# 1. Word frequency – questions
print("\nTop 15 words in user questions:")
for word, cnt in top_words(questions):
    print(f"  {word}: {cnt}")

# 2. Word frequency – answers (overall)
print("\nTop 15 words in answers:")
for word, cnt in top_words(answers):
    print(f"  {word}: {cnt}")

# 3. Cache hit / SLM miss word triggers – compare question words for each source
cache_words = collections.Counter()
slm_words = collections.Counter()
for q, src in zip(questions, sources):
    words = re.findall(r'\b[a-zA-Z]+\b', q.lower())
    if src == 'cache':
        cache_words.update(words)
    else:
        slm_words.update(words)
print("\nWords most associated with CACHE hits:")
for word, cnt in cache_words.most_common(10):
    slm_cnt = slm_words.get(word, 0)
    total = cnt + slm_cnt
    print(f"  {word}: cache={cnt}, slm={slm_cnt} (cache ratio {cnt/total:.0%})")
print("\nWords most associated with SLM FALLBACKS:")
for word, cnt in slm_words.most_common(10):
    cache_cnt = cache_words.get(word, 0)
    total = cnt + cache_cnt
    if total > 0:
        print(f"  {word}: slm={cnt}, cache={cache_cnt} (slm ratio {cnt/total:.0%})")

# 4. Potentially poor SLM answers: very short or just punctuation
print("\nPotentially problematic SLM answers (very short or repetitive):")
short_thresh = 5  # answers <= this many characters may be useless
bad_slm = [(q, a) for q, s, a in zip(questions, sources, answers) if s == 'slm' and len(a) <= short_thresh]
if bad_slm:
    for q, a in bad_slm[:10]:
        print(f"  Q: {q}  →  A: '{a}'")
else:
    print("  None found (all SLM answers > 5 chars)")

# 5. Outlier answers – longest SLM answers
if ans_lens_slm:
    print("\nLongest SLM answers (potential verbose noise):")
    slm_pairs = [(q, a) for q, s, a in zip(questions, sources, answers) if s == 'slm']
    slm_pairs.sort(key=lambda x: len(x[1]), reverse=True)
    for q, a in slm_pairs[:5]:
        print(f"  Q: {q}\n  A: {a[:150]}{'...' if len(a) > 150 else ''}")

# 6. Presence of uncertain phrases (e.g., "?", "sorry", "i don't know")
uncertain_phrases = ["?", "sorry", "i don't know", "i'm not sure", "i cannot"]
print("\nAnswers containing uncertain/fallback phrases:")
uncertain_count = 0
for q, s, a in zip(questions, sources, answers):
    if any(phrase in a.lower() for phrase in uncertain_phrases):
        uncertain_count += 1
        print(f"  [{s}] Q: {q}  →  A: {a}")
if uncertain_count == 0:
    print("  (none)")

# 7. Question diversity – unique questions vs total
unique_q = len(set(questions))
print(f"\nQuestion diversity: {unique_q} unique out of {len(questions)} total ({unique_q/len(questions):.1%})")

# 8. Time‑based cache hit rate (if enough data)
if len(ts_list) > 10:
    # Group by day and compute hit rate
    day_groups = {}
    for ts, src in zip(ts_list, sources):
        day = ts.date()
        if day not in day_groups:
            day_groups[day] = {'cache': 0, 'slm': 0}
        day_groups[day][src] += 1
    print("\nDaily cache hit rate:")
    for day in sorted(day_groups.keys()):
        d = day_groups[day]
        total_day = d['cache'] + d['slm']
        if total_day > 0:
            hit = d['cache'] / total_day
            print(f"  {day}: {hit:.0%} cache ({d['cache']}/{total_day})")

# 9. SLM answers that may be truncated (if they end with a letter, no punctuation)
print("\nSLM answers that end abruptly (no final punctuation):")
abrupt = []
for q, s, a in zip(questions, sources, answers):
    if s == 'slm' and a and a[-1].isalpha():
        abrupt.append((q, a))
if abrupt:
    for q, a in abrupt[:5]:
        print(f"  Q: {q}  →  A: '{a}'")
else:
    print("  (none)")

# 10. Overall quality summary
print("\n" + "=" * 70)
print(" QUALITATIVE SUMMARY ")
print("=" * 70)
cache_pct = source_counts.get('cache', 0) / len(sources) * 100
print(f"Cache hit rate: {cache_pct:.1f}%")
if ans_lens_slm:
    print(f"SLM average answer length: {sum(ans_lens_slm)/len(ans_lens_slm):.1f} chars")
print(f"Uncertain phrases in answers: {uncertain_count}/{len(answers)} ({uncertain_count/len(answers):.1%})")
print(f"Unique user questions: {unique_q} (diversity {unique_q/len(questions):.1%})")
print(f"Estimated user sessions: {len(sessions)}")

conn.close()