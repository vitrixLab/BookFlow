// pages/api/chatbot.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../lib/session';
import { searchKnowledge } from '../../lib/knowledge';
import { handleDataQuery } from '../../lib/chatbotQueries';
import { withRateLimit } from '../../lib/rateLimit';
import conversationRules from '../../lib/chatbotConversations.json';
import chatLabels from '../../chat.json';
import { getCached, setCached } from '../../lib/cache';
import { logChatInteraction } from '../../lib/chatLogger';

import { withTrace } from '../../lib/trace';

// ── All configurable values from chat.json ────────────
const LABELS = chatLabels as any;
const WIDGET = LABELS.widget;
const SYSTEM_PROMPT = LABELS.systemPrompt?.content;
const KB_PROMPT_TEMPLATE = LABELS.knowledgeBasePromptTemplate;

const NVIDIA_API_BASE = WIDGET.nvidiaApiBase;
const MODEL_NAME = WIDGET.nvidiaModel;
const FALLBACK_ANSWER = WIDGET.fallbackAnswer;
const TEMP_UNAVAILABLE = WIDGET.tempUnavailable;
const GENERIC_ERROR = WIDGET.genericError;

// ─── Load & compile regex patterns from JSON ──────────
interface ConversationRule {
  intent: string;
  patterns: string[];
  replies: string[];
  emoji?: string;
}

const compiledRules: { regex: RegExp[]; replies: string[]; emoji?: string }[] =
  (conversationRules as ConversationRule[]).map(rule => ({
    regex: rule.patterns.map(p => new RegExp(p, 'i')),
    replies: rule.replies,
    emoji: rule.emoji,
  }));

function generateLocalReply(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  for (const rule of compiledRules) {
    if (rule.regex.some(r => r.test(normalized))) {
      const randomIndex = Math.floor(Math.random() * rule.replies.length);
      let reply = rule.replies[randomIndex];
      if (rule.emoji && !/[\u{1F600}-\u{1F64F}]/u.test(reply)) {
        reply += ` ${rule.emoji}`;
      }
      return reply;
    }
  }
  return null;
}

async function callNvidia(prompt: string): Promise<string | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error('Missing NVIDIA_API_KEY');
    return null;
  }
  try {
    const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });
    if (!response.ok) {
      console.error('NVIDIA API error:', await response.text());
      return null;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || null;
    
    // ✅ Console log for successful NVIDIA API call
    if (content) {
      console.log(`[NVIDIA API Success] ${content.length} chars: "${content.slice(0, 80)}..."`);
    }

    return content;
  } catch (err) {
    console.error('Error calling NVIDIA:', err);
    return null;
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing question' });
  }

  // 0. Local small‑talk & greetings – NO LOGGING
  const localReply = generateLocalReply(question);
  if (localReply) {
    return res.json({
      answer: localReply,
      source: 'local_reply',
      sourceLabel: LABELS.answerSources?.local_reply || 'Built‑in rules',
    });
  }

  const user = (req as any).session?.user;

  // 1. Live database queries (role‑scoped) – LOGGED
  if (user) {
    const queryCacheKey = `data:${question.toLowerCase().trim()}:${user.id}`;

    // 1a. Check query cache first (no logging for cache hits)
    const cachedDataAnswer = getCached(queryCacheKey, 90_000);
    if (cachedDataAnswer) {
      return res.json({
        answer: cachedDataAnswer,
        source: 'live_data',
        sourceLabel: LABELS.answerSources?.live_data || 'Live database',
      });
    }

    // 1b. Run the actual data query
    const dataAnswer = await handleDataQuery(
      question,
      user,
      (req as any).session?.chatCache
    );
    if (dataAnswer !== null) {
      // LOG live data answer (fire-and-forget)
      logChatInteraction({
        question,
        answer: dataAnswer,
        source: 'live_data',
        userId: user.id ?? null,
        role: user.role ?? null,
        timestamp: new Date().toISOString(),
      }).catch(err => console.error('Chat log error', err));

      setCached(queryCacheKey, dataAnswer, 90_000);
      return res.json({
        answer: dataAnswer,
        source: 'live_data',
        sourceLabel: LABELS.answerSources?.live_data || 'Live database',
      });
    }
  }

  // 2. LLM‑level cache (covers documentation responses)
  // NO LOGGING for cache hits – they are duplicates
  const llmCacheKey = `chat:${question.toLowerCase().trim()}`;
  const cachedLlmAnswer = getCached(llmCacheKey);
  if (cachedLlmAnswer) {
    return res.json(cachedLlmAnswer);
  }

  // 3. Binary documentation + NVIDIA LLM – LOGGED
  const chunks = searchKnowledge(question, 3);
  if (chunks.length === 0) {
    // Fallback – still log to capture missing knowledge
    logChatInteraction({
      question,
      answer: FALLBACK_ANSWER,
      source: 'fallback',
      userId: user?.id ?? null,
      role: user?.role ?? null,
      timestamp: new Date().toISOString(),
    }).catch(err => console.error('Chat log error', err));

    return res.json({
      answer: FALLBACK_ANSWER,
      source: 'fallback',
      sourceLabel: LABELS.answerSources?.fallback || 'No answer found',
    });
  }

  const docContext = chunks.map(c => `[Source: ${c.source}]\n${c.text}`).join('\n\n');
  const docPrompt = `${SYSTEM_PROMPT}

DOCUMENTATION:
${docContext}

USER QUESTION: ${question}

ANSWER:`;

  const llmAnswer = await callNvidia(docPrompt);
  const answerText = llmAnswer || GENERIC_ERROR;

  // LOG documentation answer
  logChatInteraction({
    question,
    answer: answerText,
    source: 'nvidia_llm',
    userId: user?.id ?? null,
    role: user?.role ?? null,
    timestamp: new Date().toISOString(),
  }).catch(err => console.error('Chat log error', err));

  const responsePayload = {
    answer: answerText,
    source: 'nvidia_llm',
    sourceLabel: LABELS.answerSources?.nvidia_llm || 'NVIDIA Llama',
  };
  if (llmAnswer) {
    setCached(llmCacheKey, responsePayload, 5 * 60 * 1000);
  }
  return res.json(responsePayload);
}

export default withIronSessionApiRoute(
  withRateLimit(withTrace(handler), { max: 30, windowMs: 60000 }),
  sessionOptions
);