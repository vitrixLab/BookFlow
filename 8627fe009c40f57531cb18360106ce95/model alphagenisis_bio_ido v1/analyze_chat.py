import sqlite3, json, collections, math, datetime, re
from itertools import groupby

DB_NAME = "chat_analysis.db"

def ascii_histogram(data, bins=10, width=40):
    if not data: return ""
    min_val, max_val = min(data), max(data)
    bin_width = (max_val - min_val) / bins if max_val > min_val else 1
    counts = [0]*bins
    for v in data:
        idx = min(int((v - min_val)/bin_width), bins-1)
        counts[idx] += 1
    max_count = max(counts) if counts else 1
    lines = []
    for i in range(bins):
        low = min_val + i*bin_width
        bar = '#' * int(counts[i]/max_count*width)
        lines.append(f"{low:7.1f}-{low+bin_width:7.1f} | {bar} {counts[i]}")
    return '\n'.join(lines)

def top_words(texts, n=15, min_len=2):
    wc = collections.Counter()
    for t in texts:
        words = re.findall(r'\b[a-zA-Z]+\b', t.lower())
        wc.update(w for w in words if len(w)>=min_len)
    return wc.most_common(n)

def sessionize(ts_list, gap=300):
    if not ts_list: return []
    sorted_ts = sorted(ts_list)
    sessions = [[sorted_ts[0]]]
    for ts in sorted_ts[1:]:
        if (ts - sessions[-1][-1]).total_seconds() > gap:
            sessions.append([ts])
        else:
            sessions[-1].append(ts)
    return sessions

conn = sqlite3.connect(DB_NAME)
c = conn.cursor()

# --- Model info ---
c.execute('SELECT run_id, n_layer, n_embd, block_size, n_head, vocab_size, num_params FROM model_info')
models = c.fetchall()
if not models:
    print("No model data.")
    exit()
print("="*70)
print(" MODEL CONFIGURATIONS & WEIGHT STATISTICS")
print("="*70)
for m in models:
    print(f"Run {m[0]}: {m[1]} layers, {m[2]} dim, block={m[3]}, heads={m[4]}, vocab={m[5]}, params={m[6]}")
c.execute('SELECT run_id, weight_min, weight_max, weight_mean, weight_std FROM model_info')
for row in c.fetchall():
    print(f"Run {row[0]} weights → min: {row[1]:.4f}, max: {row[2]:.4f}, mean: {row[3]:.4f}, std: {row[4]:.4f}")

# --- Fetch all chats ---
c.execute('SELECT run_id, timestamp, user_question, source, answer, temperature, method, intent FROM chat_log ORDER BY timestamp')
rows = c.fetchall()
if not rows:
    print("\nNo chat logs yet.")
    conn.close()
    exit()

print(f"\nTotal interactions: {len(rows)}")
ts_list, questions, sources, answers, temperatures, methods, intents = [], [], [], [], [], [], []
for r in rows:
    try: ts = datetime.datetime.fromisoformat(r[1])
    except: ts = datetime.datetime.now()
    ts_list.append(ts)
    questions.append(r[2])
    sources.append(r[3])
    answers.append(r[4])
    temperatures.append(r[5])
    methods.append(r[6])
    intents.append(r[7])

# --- Quantitative ---
print("\n" + "="*70)
print(" QUANTITATIVE ANALYSIS ")
print("="*70)
src_counts = collections.Counter(sources)
for src, cnt in src_counts.items():
    print(f"{src}: {cnt} ({100*cnt/len(sources):.1f}%)")

# Intents
intent_counts = collections.Counter(intents)
print("\nIntent distribution:")
for intent, cnt in intent_counts.items():
    print(f"  {intent}: {cnt} ({100*cnt/len(intents):.1f}%)")

if ts_list:
    print(f"\nTime span: {min(ts_list)} to {max(ts_list)}")
    print(f"Duration: {max(ts_list)-min(ts_list)}")

hour_counts = collections.Counter(ts.hour for ts in ts_list)
print("\nHourly activity (top 5):")
for h, cnt in hour_counts.most_common(5):
    print(f"  {h:02d}:00 - {cnt} chats")

q_lens = [len(q) for q in questions]
print(f"\nQuestion length: min={min(q_lens)}, max={max(q_lens)}, avg={sum(q_lens)/len(q_lens):.1f}, median={sorted(q_lens)[len(q_lens)//2]}")

ans_lens_cache = [len(a) for a,s in zip(answers,sources) if s=='cache']
ans_lens_slm = [len(a) for a,s in zip(answers,sources) if s=='slm']
for label, lens in [("Cache", ans_lens_cache), ("SLM", ans_lens_slm)]:
    if lens:
        print(f"{label} answer length: min={min(lens)}, max={max(lens)}, avg={sum(lens)/len(lens):.1f}, median={sorted(lens)[len(lens)//2]}")
    else:
        print(f"{label} answers: none")

sessions = sessionize(ts_list)
print(f"\nEstimated sessions (gap >5 min): {len(sessions)}")
slens = [len(s) for s in sessions]
print(f"Chats per session: avg={sum(slens)/len(slens):.1f}, max={max(slens)}, min={min(slens)}")

# Frequent questions
q_counter = collections.Counter(zip(questions, sources))
print("\nTop 10 frequent question + source pairs:")
for (q, src), cnt in q_counter.most_common(10):
    print(f"  [{src}] '{q}' – {cnt} times")

if ans_lens_slm:
    print("\nSLM answer length histogram:")
    print(ascii_histogram(ans_lens_slm))

# Method breakdown (cache only)
print("\nCache method breakdown (linguistic vs model_probe):")
method_counts = collections.Counter(m for m,s in zip(methods,sources) if s=='cache')
for met, cnt in method_counts.items():
    print(f"  {met}: {cnt}")

# --- Qualitative ---
print("\n" + "="*70)
print(" QUALITATIVE ANALYSIS ")
print("="*70)
print("\nTop 15 words in questions:")
for w, cnt in top_words(questions):
    print(f"  {w}: {cnt}")
print("\nTop 15 words in answers:")
for w, cnt in top_words(answers):
    print(f"  {w}: {cnt}")

cache_words, slm_words = collections.Counter(), collections.Counter()
for q, src in zip(questions, sources):
    words = re.findall(r'\b[a-zA-Z]+\b', q.lower())
    if src=='cache': cache_words.update(words)
    else: slm_words.update(words)
print("\nWords most associated with CACHE hits:")
for w, cnt in cache_words.most_common(10):
    slm_cnt = slm_words.get(w,0)
    print(f"  {w}: cache={cnt}, slm={slm_cnt} (cache ratio {cnt/(cnt+slm_cnt):.0%})")
print("\nWords most associated with SLM FALLBACKS:")
for w, cnt in slm_words.most_common(10):
    cache_cnt = cache_words.get(w,0)
    if cnt+cache_cnt>0:
        print(f"  {w}: slm={cnt}, cache={cache_cnt} (slm ratio {cnt/(cnt+cache_cnt):.0%})")

bad_slm = [(q,a) for q,s,a in zip(questions,sources,answers) if s=='slm' and len(a)<=5]
print("\nPotentially problematic SLM answers (very short):")
if bad_slm:
    for q,a in bad_slm[:5]: print(f"  Q: {q} → A: '{a}'")
else:
    print("  None")

# SLM politeness fallback
polite = [(q,a) for q,s,a in zip(questions,sources,answers) if s=='slm' and "I'm sorry" in a]
print(f"\nSLM polite fallback responses: {len(polite)}/{len(ans_lens_slm)}")

unique_q = len(set(questions))
print(f"\nQuestion diversity: {unique_q} unique / {len(questions)} total ({unique_q/len(questions):.1%})")

# Daily hit rate
day_groups = {}
for ts, src in zip(ts_list, sources):
    day = ts.date()
    if day not in day_groups: day_groups[day] = {'cache':0,'slm':0}
    day_groups[day][src] += 1
print("\nDaily cache hit rate:")
for day in sorted(day_groups.keys()):
    d = day_groups[day]
    total = d['cache']+d['slm']
    if total>0: print(f"  {day}: {d['cache']/total:.0%} cache ({d['cache']}/{total})")

print("\n" + "="*70)
print(" QUALITATIVE SUMMARY ")
print("="*70)
print(f"Cache hit rate: {src_counts.get('cache',0)/len(sources)*100:.1f}%")
if ans_lens_slm: print(f"SLM avg answer length: {sum(ans_lens_slm)/len(ans_lens_slm):.1f} chars")
print(f"SLM politeness fallbacks: {len(polite)}")
print(f"Unique questions: {unique_q} ({unique_q/len(questions):.1%})")
print(f"Estimated sessions: {len(sessions)}")
conn.close()