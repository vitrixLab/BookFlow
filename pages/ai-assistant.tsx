// pages/ai-assistant.tsx
import { useState, useRef, useEffect } from 'react'
import { withSsrAuth } from '../lib/withAuth'
import DashboardLayout from '../components/DashboardLayout'
import { getRecentMessages, type ChatMessage } from '../lib/chat_db'
import chatLabels from '../chat.json'
import Head from 'next/head'
import { formatDate } from '../lib/formatDate'   // adjust path if needed
import Footer from '../components/Footer'

/* ─── Types ─────────────────────────────────────── */
interface UIMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

/* ─── Server‑side load (optional SQLite history) ─── */
export const getServerSideProps = withSsrAuth(async ({ req }) => {
  const user = req.session.user
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  let dbMessages: ChatMessage[] = []
  try {
    dbMessages = await getRecentMessages(30)
  } catch (_) { /* table may not exist */ }

  // Build initial messages on the server – no client‑side drift
  const initialMessages: UIMessage[] = dbMessages.length > 0
    ? dbMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp,
      }))
    : [{
        role: 'assistant',
        content: 'Hi! Ask me anything about BookFlow.',
        timestamp: new Date().toISOString(), // generated once on the server
      }]

  return {
    props: {
      user,
      initialMessages: JSON.parse(JSON.stringify(initialMessages)),
    },
  }
})

/* ─── Main component ────────────────────────────── */
export default function AIAssistant({ user, initialMessages }: {
  user: any
  initialMessages: UIMessage[]
}) {
  const LABELS = chatLabels as any
  const PAGE = LABELS.pages?.aiAssistant || {}

  const CHAT_STORAGE_KEY = `bookflow_chat_${user.id}`

  // Start with the server‑provided messages – no more mismatch
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages)

  // Override with localStorage data after mount (client only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed)
      }
    } catch (_) {}
  }, [])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages])

  // Auto‑scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const question = input.trim()
    if (!question || loading) return

    const userMsg: UIMessage = { role: 'user', content: question, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      const assistantMsg: UIMessage = { role: 'assistant', content: data.answer || "I couldn't find an answer.", timestamp: new Date().toISOString() }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong.', timestamp: new Date().toISOString() }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>{PAGE.title || 'AI Assistant'} | BookFlow</title>
      </Head>
      <DashboardLayout user={user}>
        <div className="ai-fullpage">
          <header className="ai-header">
            <h1 className="ai-title">{PAGE.title || 'AI Assistant'}</h1>
            <span className="ai-subtitle">{PAGE.subtitle || 'Your chat history is saved automatically and cleared on logout.'}</span>
          </header>

          <div className="ai-chat-panel">
            <div className="ai-messages">
              {messages.length === 0 && (
                <div className="ai-empty">
                  <i className="fas fa-robot" />
                  <p>{PAGE.emptyText || 'No messages yet. Start a conversation below.'}</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`ai-msg ${msg.role === 'user' ? 'ai-msg--user' : 'ai-msg--assistant'}`}>
                  <div className="ai-msg-content">{msg.content}</div>
                  <div className="ai-msg-time">
                    {formatDate(msg.timestamp, 'M/d/yyyy, h:mm:ss a')}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="ai-msg ai-msg--assistant">
                  <div className="ai-msg-content">
                    <span className="typing-indicator"><span className="dot" /><span className="dot" /><span className="dot" /></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="ai-input-area">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={PAGE.inputPlaceholder || 'Ask about your appointments, clients, or services...'}
                disabled={loading}
                className="ai-input"
              />
              <button onClick={sendMessage} disabled={loading} className="ai-send-btn">
                <i className="fas fa-paper-plane" />
              </button>
            </div>
          </div>

        <Footer />
        
        </div>

        <style jsx>{`
          .ai-fullpage { max-width: 900px; margin: 0 auto; height: calc(100vh - 64px - 4rem); display: flex; flex-direction: column; }
          .ai-header { margin-bottom: 1.5rem; text-align: center; }
          .ai-title { font-size: 2rem; font-weight: 800; color: #111; margin: 0 0 0.3rem; }
          .ai-subtitle { font-size: 0.9rem; color: #888; }

          .ai-chat-panel { flex: 1; background: #fff; border-radius: 16px; border: 1px solid #ebebeb; display: flex; flex-direction: column; overflow: hidden; }
          .ai-messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
          .ai-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; color: #aaa; height: 100%; }
          .ai-empty i { font-size: 3rem; margin-bottom: 0.5rem; }

          .ai-msg { max-width: 70%; display: flex; flex-direction: column; }
          .ai-msg--user { align-self: flex-end; align-items: flex-end; }
          .ai-msg--assistant { align-self: flex-start; }

          .ai-msg-content { padding: 0.75rem 1rem; border-radius: 18px; font-size: 0.9rem; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }
          .ai-msg--user .ai-msg-content { background: var(--sap-primary, #0a6ed1); color: #fff; border-bottom-right-radius: 6px; }
          .ai-msg--assistant .ai-msg-content { background: rgba(10,110,209,0.07); color: #111; border-bottom-left-radius: 6px; }
          .ai-msg-time { font-size: 0.7rem; color: #aaa; margin-top: 0.2rem; padding: 0 0.5rem; }

          .ai-input-area { padding: 1rem 1.5rem; border-top: 1px solid #f0f0f0; display: flex; gap: 0.75rem; align-items: center; }
          .ai-input { flex: 1; padding: 0.7rem 1rem; border: 1px solid #d1d5db; border-radius: 12px; font-size: 0.9rem; outline: none; transition: border-color 0.15s; }
          .ai-input:focus { border-color: var(--sap-primary, #0a6ed1); box-shadow: 0 0 0 3px rgba(10,110,209,0.1); }
          .ai-send-btn { background: var(--sap-primary, #0a6ed1); color: #fff; border: none; border-radius: 50%; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; transition: opacity 0.1s; }
          .ai-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

          .typing-indicator { display: flex; align-items: center; gap: 4px; padding: 0.3rem 0; }
          .typing-indicator .dot { width: 6px; height: 6px; background: var(--sap-primary); border-radius: 50%; opacity: 0.4; animation: bounce 1.2s infinite ease-in-out; }
          .typing-indicator .dot:nth-child(2) { animation-delay: 0.15s; }
          .typing-indicator .dot:nth-child(3) { animation-delay: 0.3s; }
          @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); } 40% { transform: scale(1); } }
        `}</style>
      </DashboardLayout>
    </>
  )
}