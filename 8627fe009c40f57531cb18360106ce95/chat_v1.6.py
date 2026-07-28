import os, math, random, pickle, time, sqlite3, json, string, re
import numpy as np
import nltk
from nltk import pos_tag, word_tokenize, RegexpParser
from nltk.corpus import wordnet as wn
from wordnet_loader import build_definition_cache

# --------------------------------------------------------------------
# 1. Config – MUST match training
# --------------------------------------------------------------------
n_layer = 1
n_embd = 16
block_size = 32
n_head = 4
head_dim = n_embd // n_head

# --------------------------------------------------------------------
# 2. Load vocabulary
# --------------------------------------------------------------------
if not os.path.exists("vocab.pkl"):
    print("Error: vocab.pkl missing. Run microgpt.py first.")
    exit()
with open("vocab.pkl", "rb") as f:
    uchars = pickle.load(f)
BOS = len(uchars)
vocab_size = len(uchars) + 1

# --------------------------------------------------------------------
# 3. Autograd engine (unchanged)
# --------------------------------------------------------------------
class Value:
    __slots__ = ('data', 'grad', '_children', '_local_grads')
    def __init__(self, data, children=(), local_grads=()):
        self.data = data
        self.grad = 0
        self._children = children
        self._local_grads = local_grads

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return Value(self.data + other.data, (self, other), (1, 1))
    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return Value(self.data * other.data, (self, other), (other.data, self.data))
    def __pow__(self, other): return Value(self.data**other, (self,), (other * self.data**(other-1),))
    def log(self): return Value(math.log(self.data), (self,), (1/self.data,))
    def exp(self): return Value(math.exp(self.data), (self,), (math.exp(self.data),))
    def relu(self): return Value(max(0, self.data), (self,), (float(self.data > 0),))
    def __neg__(self): return self * -1
    def __radd__(self, other): return self + other
    def __sub__(self, other): return self + (-other)
    def __rsub__(self, other): return other + (-self)
    def __rmul__(self, other): return self * other
    def __truediv__(self, other): return self * other**-1
    def __rtruediv__(self, other): return other * self**-1

    def backward(self):
        topo = []
        visited = set()
        stack = [(self, 0)]
        while stack:
            v, idx = stack[-1]
            if idx == 0:
                visited.add(v)
            if idx < len(v._children):
                child = v._children[idx]
                stack[-1] = (v, idx+1)
                if child not in visited:
                    stack.append((child, 0))
            else:
                topo.append(v)
                stack.pop()
        self.grad = 1.0
        for v in reversed(topo):
            for child, local_grad in zip(v._children, v._local_grads):
                child.grad += local_grad * v.grad

# --------------------------------------------------------------------
# 4. Rebuild model & load weights
# --------------------------------------------------------------------
random.seed(42)
matrix = lambda nout, nin, std=0.08: [[Value(random.gauss(0, std)) for _ in range(nin)] for _ in range(nout)]
state_dict = {
    'wte': matrix(vocab_size, n_embd),
    'wpe': matrix(block_size, n_embd),
    'lm_head': matrix(vocab_size, n_embd)
}
for i in range(n_layer):
    state_dict[f'layer{i}.attn_wq'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.attn_wk'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.attn_wv'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.attn_wo'] = matrix(n_embd, n_embd)
    state_dict[f'layer{i}.mlp_fc1'] = matrix(4 * n_embd, n_embd)
    state_dict[f'layer{i}.mlp_fc2'] = matrix(n_embd, 4 * n_embd)

params = [p for mat in state_dict.values() for row in mat for p in row]

if not os.path.exists("model_weights.pkl"):
    print("Error: model_weights.pkl missing. Train first.")
    exit()
with open("model_weights.pkl", "rb") as f:
    saved = pickle.load(f)
if len(saved) != len(params):
    print(f"Mismatch: {len(saved)} vs {len(params)} parameters.")
    exit()
for p, val in zip(params, saved):
    p.data = val
print(f"Loaded {len(params)} parameters.")

weights = np.array([p.data for p in params])
print("\n--- Weight Statistics ---")
print(f"Min: {weights.min():.4f}  Max: {weights.max():.4f}")
print(f"Mean: {weights.mean():.4f}  Std: {weights.std():.4f}")
hist, bins = np.histogram(weights, bins=5)
print(f"Histogram: {hist} (bins: {bins})\n")

# --------------------------------------------------------------------
# 5. Model helpers (unchanged)
# --------------------------------------------------------------------
def linear(x, w):
    return [sum(wi * xi for wi, xi in zip(wo, x)) for wo in w]

def softmax(logits):
    max_val = max(val.data for val in logits)
    exps = [(val - max_val).exp() for val in logits]
    total = sum(exps)
    return [e / total for e in exps]

def rmsnorm(x):
    ms = sum(xi * xi for xi in x) / len(x)
    scale = (ms + 1e-5) ** -0.5
    return [xi * scale for xi in x]

def gpt(token_id, pos_id, keys, values):
    tok_emb = state_dict['wte'][token_id]
    pos_emb = state_dict['wpe'][pos_id]
    x = [t + p for t, p in zip(tok_emb, pos_emb)]
    x = rmsnorm(x)
    for li in range(n_layer):
        x_residual = x
        x = rmsnorm(x)
        q = linear(x, state_dict[f'layer{li}.attn_wq'])
        k = linear(x, state_dict[f'layer{li}.attn_wk'])
        v = linear(x, state_dict[f'layer{li}.attn_wv'])
        keys[li].append(k)
        values[li].append(v)
        x_attn = []
        for h in range(n_head):
            hs = h * head_dim
            q_h = q[hs:hs+head_dim]
            k_h = [ki[hs:hs+head_dim] for ki in keys[li]]
            v_h = [vi[hs:hs+head_dim] for vi in values[li]]
            attn_logits = [sum(q_h[j] * k_h[t][j] for j in range(head_dim)) / head_dim**0.5 for t in range(len(k_h))]
            attn_weights = softmax(attn_logits)
            head_out = [sum(attn_weights[t] * v_h[t][j] for t in range(len(v_h))) for j in range(head_dim)]
            x_attn.extend(head_out)
        x = linear(x_attn, state_dict[f'layer{li}.attn_wo'])
        x = [a + b for a, b in zip(x, x_residual)]
        x_residual = x
        x = rmsnorm(x)
        x = linear(x, state_dict[f'layer{li}.mlp_fc1'])
        x = [xi.relu() for xi in x]
        x = linear(x, state_dict[f'layer{li}.mlp_fc2'])
        x = [a + b for a, b in zip(x, x_residual)]
    return linear(x, state_dict['lm_head'])

# --------------------------------------------------------------------
# 6. WordNet cache + linguistic / semiotic helpers
# --------------------------------------------------------------------
definition_cache = build_definition_cache()

# ----- 6.1 Intent detection -----
GREETINGS = {"hi", "hello", "hey", "good morning", "good afternoon", "good evening",
             "how are you", "how do you do", "what's up", "sup", "yo"}
def get_intent(question):
    q = question.lower().strip().replace("?", "")
    if any(greet in q for greet in GREETINGS):
        return "greeting"
    if any(phrase in q for phrase in ["what is", "what are", "define", "meaning of", "explain", "who is", "what does"]):
        return "definition"
    if any(op in q for op in ["+", "-", "*", "plus", "minus", "times", "divided by"]):
        return "arithmetic"
    return "unknown"

# ----- 6.2 Linguistic noun-phrase extraction (improved) -----
def extract_head_noun(question):
    """
    Uses POS tagging and a simple noun‑phrase chunker to find the main subject.
    Returns the first noun phrase after 'what is' etc., or the last noun phrase.
    Strips leading determiners like 'a', 'an', 'the'.
    """
    q = question.lower().replace("?", "").replace(",", "")
    for prefix in ["what is ", "what are ", "define ", "meaning of ", "definition of ", "explain ", "who is "]:
        if q.startswith(prefix):
            q = q[len(prefix):]
            break
    tokens = word_tokenize(q)
    tagged = pos_tag(tokens)
    grammar = r"NP: {<DT>?<JJ.*>*<NN.*>+}"
    cp = RegexpParser(grammar)
    tree = cp.parse(tagged)
    nps = []
    for subtree in tree.subtrees():
        if subtree.label() == 'NP':
            # Get the words from the leaves, then filter out determiners
            words = [word for word, tag in subtree.leaves() if tag != 'DT']
            if words:
                nps.append(" ".join(words))
    return nps[-1] if nps else None

# ----- 6.3 Cache lookup (linguistic + semantic) -----
def lookup_cache(word):
    w = word.lower().strip(string.punctuation)
    if w in definition_cache:
        return f"{w}: {definition_cache[w]}"
    return None

def semantic_cache(word):
    """
    If the exact word isn't in the cache, try to find a WordNet synonym that is.
    Returns (definition, used_synonym) or (None, None).
    """
    w = word.lower().strip(string.punctuation)
    # exact match first
    if w in definition_cache:
        return (f"{w}: {definition_cache[w]}", w)
    # WordNet synonym lookup
    synsets = wn.synsets(w)
    if not synsets:
        return (None, None)
    synonyms = set()
    for syn in synsets:
        for lemma in syn.lemmas():
            name = lemma.name().replace('_', ' ').lower()
            synonyms.add(name)
    for synonym in synonyms:
        if synonym in definition_cache:
            return (f"{synonym}: {definition_cache[synonym]}  (via synonym of '{w}')", synonym)
    return (None, None)

def model_guided_cache(question, temperature=0.2, probe_tokens=5):
    """
    Use the trained GPT to guess the subject word.
    Returns (answer, word) or (None, None).
    """
    prompt = f" Q: {question} A:"
    tokens = [BOS] + [uchars.index(c) for c in prompt if c in uchars]
    keys = [[] for _ in range(n_layer)]
    values = [[] for _ in range(n_layer)]
    logits = None
    for pos, tok in enumerate(tokens):
        logits = gpt(tok, pos, keys, values)

    probe_chars = []
    while len(probe_chars) < probe_tokens and len(tokens) + len(probe_chars) < block_size:
        scaled = [l / temperature for l in logits]
        probs = softmax(scaled)
        probs_data = [p.data for p in probs]
        max_idx = max(range(len(probs_data)), key=lambda i: probs_data[i])
        next_token = max_idx
        if next_token == BOS:
            break
        probe_chars.append(uchars[next_token])
        if len(tokens) + len(probe_chars) >= block_size:
            break
        logits = gpt(next_token, len(tokens) + len(probe_chars), keys, values)

    probe_str = ''.join(probe_chars).strip()
    for w in probe_str.split():
        clean = w.lower().strip(string.punctuation)
        if clean in definition_cache:
            return (f"{clean}: {definition_cache[clean]}", clean)
    return (None, None)

def intelligent_cache(question):
    """
    Tries in order:
      1. Linguistic head noun → exact cache
      2. Linguistic head noun → semantic (synonym) cache
      3. Model‑guided probe → exact cache
    """
    head = extract_head_noun(question)
    if head:
        # exact match
        ans = lookup_cache(head)
        if ans:
            return (ans, head, "linguistic_exact")
        # semantic fallback
        ans, used_word = semantic_cache(head)
        if ans:
            return (ans, used_word, "linguistic_synonym")

    # model-guess
    ans, word = model_guided_cache(question)
    if ans:
        return (ans, word, "model_probe")
    return (None, None, "none")

# --------------------------------------------------------------------
# 7. SLM generation (safety‑netted)
# --------------------------------------------------------------------
def ask_slm(question, temperature=0.4):
    prompt = f" Q: {question} A:"
    tokens = [BOS] + [uchars.index(c) for c in prompt if c in uchars]
    keys = [[] for _ in range(n_layer)]
    values = [[] for _ in range(n_layer)]
    logits = None
    for pos, tok in enumerate(tokens):
        logits = gpt(tok, pos, keys, values)

    answer_tokens = []
    while len(tokens) + len(answer_tokens) < block_size:
        scaled = [l / temperature for l in logits]
        probs = softmax(scaled)
        next_token = random.choices(range(vocab_size), weights=[p.data for p in probs])[0]
        if next_token == BOS:
            break
        answer_tokens.append(uchars[next_token])
        if len(tokens) + len(answer_tokens) >= block_size:
            break
        logits = gpt(next_token, len(tokens) + len(answer_tokens), keys, values)

    raw = ''.join(answer_tokens).strip()
    # Safety check: if output is too short or seems garbled, give polite fallback
    if len(raw) < 10 or raw.count(' ') < 2 or (raw.isalpha() and len(set(raw)) < 4):
        return "I'm sorry, I'm still learning and can't answer that yet. Please try asking about a common word."
    return raw

# --------------------------------------------------------------------
# 8. Database setup
# --------------------------------------------------------------------
DB_NAME = "chat_analysis.db"
conn = sqlite3.connect(DB_NAME)
c = conn.cursor()
c.execute('''
    CREATE TABLE IF NOT EXISTS model_info (
        run_id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT DEFAULT (datetime('now')),
        n_layer INTEGER, n_embd INTEGER, block_size INTEGER, n_head INTEGER,
        vocab_size INTEGER, num_params INTEGER,
        weight_min REAL, weight_max REAL, weight_mean REAL, weight_std REAL,
        histogram_bins TEXT, histogram_counts TEXT
    )
''')
c.execute('''
    CREATE TABLE IF NOT EXISTS chat_log (
        chat_id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        timestamp TEXT DEFAULT (datetime('now')),
        user_question TEXT,
        source TEXT,
        answer TEXT,
        temperature REAL,
        method TEXT,
        intent TEXT,
        FOREIGN KEY(run_id) REFERENCES model_info(run_id)
    )
''')

c.execute('''
    SELECT run_id FROM model_info
    WHERE n_layer=? AND n_embd=? AND block_size=? AND n_head=?
          AND vocab_size=? AND num_params=?
    ORDER BY run_id DESC LIMIT 1
''', (n_layer, n_embd, block_size, n_head, vocab_size, len(params)))
row = c.fetchone()
if row is None:
    c.execute('''
        INSERT INTO model_info (n_layer, n_embd, block_size, n_head,
                                vocab_size, num_params,
                                weight_min, weight_max, weight_mean, weight_std,
                                histogram_bins, histogram_counts)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    ''', (n_layer, n_embd, block_size, n_head, vocab_size, len(params),
          weights.min(), weights.max(), weights.mean(), weights.std(),
          json.dumps(bins.tolist()), json.dumps(hist.tolist())))
    conn.commit()
    run_id = c.lastrowid
    print(f"New model run registered with run_id={run_id}")
else:
    run_id = row[0]
    print(f"Using existing model run_id={run_id}")

def log_chat(question, source, answer, temperature, method, intent):
    c.execute('''
        INSERT INTO chat_log (run_id, user_question, source, answer, temperature, method, intent)
        VALUES (?,?,?,?,?,?,?)
    ''', (run_id, question, source, answer, temperature, method, intent))
    conn.commit()

# --------------------------------------------------------------------
# 9. Main chat loop
# --------------------------------------------------------------------
print("\nChatbot ready. Ask anything (or type 'quit').\n")
while True:
    user = input("You: ")
    if user.lower() in ("quit", "exit"):
        break

    intent = get_intent(user)

    # -- greetings --
    if intent == "greeting":
        answer = "Hello! I'm a tiny dictionary bot. Ask me to define a word, like 'what is python?'."
        print(f"Bot (greeting): {answer}")
        log_chat(user, "greeting", answer, 0.0, "rule_greeting", intent)
        continue

    # -- unknown / definition (try cache first, then SLM) --
    if intent in ("unknown", "definition"):
        cached, word, method = intelligent_cache(user)
        if cached:
            print(f"Bot ({method} cache)[{word}]: {cached}")
            log_chat(user, "cache", cached, 0.0, method, intent)
        else:
            answer = ask_slm(user)
            print(f"Bot (SLM): {answer}")
            log_chat(user, "slm", answer, 0.4, "none", intent)
        continue

    # -- arithmetic (placeholder) --
    if intent == "arithmetic":
        answer = "Arithmetic isn't supported yet in this demo."
        print(f"Bot: {answer}")
        log_chat(user, "greeting", answer, 0.0, "rule_greeting", intent)
        continue

conn.close()
print("Chat session saved to database.")