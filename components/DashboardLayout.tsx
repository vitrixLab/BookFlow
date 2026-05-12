// components/DashboardLayout.tsx
import { ReactNode, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import componentsJson from '../schema/components.json'
import Toast from './Toast'

// ── Skeleton imports ─────────────────────────────────
import {
  AdminDashboardSkeleton, AdminServicesSkeleton, AdminUsersSkeleton, AdminAppointmentsSkeleton,
  AdminKnowledgeBaseSkeleton, AdminLoggingSkeleton, AdminTracesSkeleton, AdminAIAssistantSkeleton,
} from './skeleton/admin'
import { EmployeeDashboardSkeleton, EmployeeAppointmentsSkeleton, EmployeeCreateAppointmentsSkeleton } from './skeleton/employee'
import { ClientDashboardSkeleton, ClientBookingsSkeleton, ClientBookAppointmentsSkeleton } from './skeleton/client'
import SettingsSkeleton from './skeleton/settings/SettingsSkeleton'
import AIAssistantSkeleton from './skeleton/AIAssistantSkeleton'

// Note: The base Skeleton component is only used inside the role skeletons; not needed here.

interface DashboardLayoutProps {
  children: ReactNode
  user: {
    id: number
    name: string
    email: string
    role: string
    photo?: string | null
    isSuperAdmin?: boolean    // <-- add this
  }
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const role = user.role.toLowerCase()
  const superAdmin = user.isSuperAdmin

  // ── Labels from components.json ──
  const labels = componentsJson.dashboardLayout

  // ── Skeleton selector ──────────────────────────
  const getSkeleton = (): ReactNode => {
  // use the captured destination route if a transition is happening
  const route = loadingRoute ?? router.pathname

    // 1. Catch ALL settings paths first
    if (
      route.startsWith('/settings') ||
      route.startsWith('/admin/settings') ||
      route.startsWith('/employee/settings') ||
      route.startsWith('/client/settings')
    ) {
      return <SettingsSkeleton />
    } 

    // 2. Then role‑specific pages
    if (role === 'admin') { 
      if (route.startsWith('/admin/services')) return <AdminServicesSkeleton />
      if (route.startsWith('/admin/users')) return <AdminUsersSkeleton />
      if (route.startsWith('/admin/appointments')) return <AdminAppointmentsSkeleton />
        // skeleton selector
        if (superAdmin) {
          if (route.startsWith('/admin/knowledge-base')) return <AdminKnowledgeBaseSkeleton />
          if (route.startsWith('/admin/logging')) return <AdminLoggingSkeleton />
          if (route.startsWith('/admin/traces')) return <AdminTracesSkeleton />
          if (route.startsWith('/admin/ai-assistant')) return <AdminAIAssistantSkeleton />
        }
      return <AdminDashboardSkeleton />
    }
    if (role === 'employee') { 
      if (route.startsWith('/employee/create-appointment')) return <EmployeeCreateAppointmentsSkeleton />
      if (route.startsWith('/employee/appointments')) return <EmployeeAppointmentsSkeleton />
      if (route.startsWith('/ai-assistant')) return <AIAssistantSkeleton />
      return <EmployeeDashboardSkeleton />
    }
    if (role === 'client') { 
      if (route.startsWith('/client/book-appointment')) return <ClientBookAppointmentsSkeleton />
      if (route.startsWith('/client/my-bookings')) return <ClientBookingsSkeleton /> 
      if (route.startsWith('/ai-assistant')) return <AIAssistantSkeleton />
      return <ClientDashboardSkeleton />
    }
    return null
  }

  // ── Page loading state for skeleton views ──
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null)

  useEffect(() => {
      const handleStart = (url: string) => {
        // Never show skeleton when navigating to login / register
        if (url === '/login' || url === '/register') {
          setIsPageLoading(false)
          return
        }
        setIsPageLoading(true)
        setLoadingRoute(url)
      }
      const handleEnd = () => {
        setIsPageLoading(false)
        setLoadingRoute(null)
      }
      const handleError = () => {
        setIsPageLoading(false)
        setLoadingRoute(null)
      }
    
      router.events.on('routeChangeStart', handleStart)
      router.events.on('routeChangeComplete', handleEnd)
      router.events.on('routeChangeError', handleError)
    
      return () => {
        router.events.off('routeChangeStart', handleStart)
        router.events.off('routeChangeComplete', handleEnd)
        router.events.off('routeChangeError', handleError)
      }
    }, [router])

  // ── Toast (replaces old sidebar toast) ──
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setToastVisible(true)
  }

  // ── Chat state ──
  const [chatOpen, setChatOpen] = useState(false)

  const CHAT_STORAGE_KEY = `bookflow_chat_${user.id}`
  const defaultGreeting = [{ role: 'assistant', content: labels.chat.greetingMessage }] as ChatMessage[]

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(defaultGreeting)

  useEffect(() => {
    // Load saved chat after hydration – prevents server/client mismatch
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed)
        }
      }
    } catch (_) {}
  }, [])

  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [typingMessage, setTypingMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [fullResponse, setFullResponse] = useState('')
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom whenever messages or typing text change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, typingMessage])

  // Typewriter effect
  useEffect(() => {
    if (!isTyping || !fullResponse) return

    let i = 0
    const interval = setInterval(() => {
      setTypingMessage(fullResponse.slice(0, i + 1))
      i++
      if (i >= fullResponse.length) {
        clearInterval(interval)
        setIsTyping(false)
        setChatMessages(prev => [...prev, { role: 'assistant', content: fullResponse }])
        setTypingMessage('')
        setFullResponse('')
      }
    }, 20) // speed in ms per character

    typingIntervalRef.current = interval
    return () => clearInterval(interval)
  }, [isTyping, fullResponse])

  const sendChat = async () => {
    const question = chatInput.trim()
    if (!question || chatLoading || isTyping) return

    // If a typewriter is running, immediately commit the full message
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      setIsTyping(false)
      setChatMessages(prev => [...prev, { role: 'assistant', content: fullResponse }])
      setTypingMessage('')
      setFullResponse('')
    }

    const userMsg: ChatMessage = { role: 'user', content: question }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      const answer = data.answer || "I couldn't find an answer."

      setChatLoading(false)
      // Start typewriter
      setIsTyping(true)
      setFullResponse(answer)
      setTypingMessage('')
    } catch (e) {
      setChatLoading(false)
      setIsTyping(true)
      setFullResponse('Something went wrong. Please try again.')
    }
  }

  const warmChatbot = () => {
    // Fire‑and‑forget warmup – no UI feedback needed
    fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'warmup' }),
    }).catch(() => {})
  }

  // ── Notifications (from components.json) ──
  const [notifications] = useState(labels.notifications)
  const unreadCount = notifications.filter(n => !n.read).length

  // ── Avatar & notification dropdown refs ──
  const avatarRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  // ── Navigation helpers ──────────────────────────
  const getDashboardUrl = () => {
    if (role === 'admin') return '/admin/dashboard'
    if (role === 'employee') return '/employee/dashboard'
    return '/client/dashboard'
  }

  const getMenuItems = () => {
    const side = labels.sidebar
    if (role === 'admin') { 
        // inside getMenuItems, for role === 'admin'
        const adminItems = [
          { href: '/admin/dashboard',    icon: 'fas fa-tachometer-alt', label: side.admin.dashboard },
          { href: '/admin/services',     icon: 'fas fa-cogs',           label: side.admin.services },
          { href: '/admin/users',        icon: 'fas fa-users',          label: side.admin.users },
          { href: '/admin/appointments', icon: 'fas fa-calendar-alt',   label: side.admin.appointments },
          { href: '/admin/ai-assistant', icon: 'fas fa-robot',          label: side.admin.ai_assistant },
        ]
        
        // only add these if the user is a super‑admin
        if (user.isSuperAdmin) {
          adminItems.push(
            { type: 'separator' },    // <-- this renders as <hr/>
            { href: '/admin/logging',        icon: 'fas fa-history',   label: side.admin.logging },
            { href: '/admin/knowledge-base', icon: 'fas fa-database',  label: side.admin.knowledge_base },
            { href: '/admin/traces',         icon: 'fas fa-list-alt',  label: side.admin.traces },
          )
        }
        
        return adminItems
        
    } else if (role === 'employee') {
      return [
        { href: '/employee/dashboard',            icon: 'fas fa-tachometer-alt', label: side.employee.dashboard          },
        { href: '/employee/appointments',         icon: 'fas fa-calendar-alt',   label: side.employee.appointments       },
        { href: '/employee/create-appointment',   icon: 'fas fa-plus-circle',    label: side.employee.create_appointment },
        { href: '/ai-assistant',                  icon: 'fas fa-robot',           label: side.employee.ai_assistant       },
      ]
    } else {
      return [
        { href: '/client/dashboard',         icon: 'fas fa-tachometer-alt', label: side.client.dashboard          },
        { href: '/client/book-appointment',  icon: 'fas fa-calendar-plus',  label: side.client.book_appointment   },
        { href: '/client/my-bookings',       icon: 'fas fa-bookmark',       label: side.client.my_bookings        },
        { href: '/ai-assistant',             icon: 'fas fa-robot',           label: side.client.ai_assistant      },
      ]
    }
  }

  const handleLogout = async () => {
      // Clear all BookFlow localStorage keys
      const keys = Object.keys(localStorage).filter(k => k.startsWith('bookflow_'))
      keys.forEach(k => localStorage.removeItem(k))
    
      setIsPageLoading(false)
      setLoadingRoute(null)
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    }

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="layout">
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <a href={getDashboardUrl()} className="logo-link" aria-label={`${labels.siteName} home`}>
            <img
              src="/image/bookflow_primary_logo.png"
              alt="BookFlow logo"
              className="header-logo"
              width="188"
              height="55"
              loading="eager"
              decoding="async"
              style={{
                filter: 'brightness(0) invert(1)',
                marginTop: '-15px',
                marginLeft: '-9px',
              }}
            />
          </a>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '14px',
            paddingBottom: '14px',
            borderBottom: '0.5px solid rgba(255,255,255,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ marginTop: '-5px' }}>
              <rect x="2" y="3" width="20" height="19" rx="2" stroke="lightblue" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 9h20M7 3v3M17 3v3" stroke="lightblue" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ color: 'lightblue', margin: 0 }}>{labels.subName}</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
        {getMenuItems().map((item, idx) => {
          // Render a horizontal rule for separator items
          if (item.type === 'separator') {
            return (
              <>
                <hr key={`sep-${idx}`}
                  style={{ border: 'none', borderTop: '1px solid #334', margin: '0.4rem 0.8rem',}}
                />
                <p style={{ color: '#888', fontSize: '0.7rem', margin: '0 0.8rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Analytics
                </p>
              </>
            )
          }
        
          const active = router.pathname === item.href
          return (
            <button
              key={item.href}
              className={`nav-item${active ? ' nav-item--active' : ''}`}
              onClick={() => {
                if (active) return
                router.push(item.href)
                setSidebarOpen(false)
              }}
            >
              <span className="nav-icon" aria-hidden="true">
                <i className={item.icon} />
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          )
        })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="util-btn"
            data-active={router.pathname.startsWith('/support') ? 'true' : 'false'}
            aria-label="Support"
            onClick={() => {
              if (router.pathname.startsWith('/support')) return;
              showToast(labels.supportToastMessage);
            }}
          >
            <i className="fas fa-comment-dots" />
          </button>
          <button
            className="util-btn"
            data-active={router.pathname.startsWith('/settings') ? 'true' : 'false'}
            aria-label="Settings"
            onClick={() => {
              if (router.pathname.startsWith('/settings')) return;
              router.push('/settings');
            }}
          >
            <i className="fas fa-cog" />
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="layout-body">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <i className="fas fa-bars" />
          </button>

          <div className="topbar-search">
            <i className="fas fa-search search-icon" aria-hidden="true" />
            <input type="search" placeholder={labels.searchPlaceholder} className="search-input" />
          </div>

          <div className="topbar-right">
            <button
              className="create-btn"
              onClick={() => {
                if (router.pathname !== '/employee/create-appointment')
                  router.push('/employee/create-appointment')
              }}
            >
              <i className="fas fa-plus" aria-hidden="true" /> {labels.createButtonLabel}
            </button>

            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                aria-label={`Notifications (${unreadCount})`}
                onClick={() => { setNotifOpen(!notifOpen); setAvatarMenuOpen(false) }}
              >
                <i className="fas fa-bell" />
                {unreadCount > 0 && <span className="notif-badge" aria-hidden="true">{unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="notif-dropdown">
                  {notifications.map(n => (
                    <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                      <span className={`notif-dot ${n.type === 'success' ? 'dot--success' : n.type === 'error' ? 'dot--error' : 'dot--info'}`} />
                      <span>{n.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className={`icon-btn${router.pathname.startsWith('/support') ? ' active' : ''}`}
              aria-label="Support"
              onClick={() => {
                if (router.pathname.startsWith('/support')) return;
                showToast(labels.supportToastMessage);
              }}
            >
              <i className="fas fa-comment" />
            </button>

            <div className="user-avatar-wrapper" ref={avatarRef}>
              <button
                className="user-avatar"
                aria-label={`Account menu for ${user.name}`}
                onClick={() => {
                  setAvatarMenuOpen(!avatarMenuOpen);
                  setNotifOpen(false);
                  setChatOpen(false);
                }}
              >
                {user.photo ? (
                  <img src={`/${user.photo}`} alt={user.name} className="avatar-img" />
                ) : (
                  <span className="avatar-initials">{initials}</span>
                )}
              </button>
              {avatarMenuOpen && (
                <div className="avatar-dropdown" role="menu">
                  <div className="avatar-dropdown-header">
                    
                    {superAdmin && 
                      <div className="avatar-dropdown-header" 
                        style={{ height: '33px' , marginBottom: '15px'}}
                      >
                        <h3 style={{ color: '#0a6ed1', marginTop: '-10px', marginLeft: '-15px' }}>
                          Superadmin* &nbsp;&nbsp; 
                        </h3>
                      </div>
                     }
                       
                    <strong>
                      {user.name}
                    </strong>
                    <span>{user.email}</span>
                  </div>
                  <button className="avatar-dropdown-item" onClick={() => { setAvatarMenuOpen(false); router.push(getDashboardUrl()); }}>
                    <i className="fas fa-th-large" /> {labels.avatarMenu.dashboard}
                  </button>
                  <button className="avatar-dropdown-item" onClick={() => { setAvatarMenuOpen(false); router.push('/settings'); }}>
                    <i className="fas fa-cog" /> {labels.avatarMenu.settings}
                  </button>
                  <button className="avatar-dropdown-item" onClick={() => { setAvatarMenuOpen(false); handleLogout(); }}>
                    <i className="fas fa-sign-out-alt" /> {labels.avatarMenu.logout}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={`main-content ${!isPageLoading ? 'content-ready' : ''}`}>
          {isPageLoading ? getSkeleton() : children}
        </main>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
      <nav className={`mobile-drawer${sidebarOpen ? ' mobile-drawer--open' : ''}`} aria-label="Mobile navigation">
        <div className="mobile-drawer-header">
          <a href={getDashboardUrl()} className="logo-link" aria-label={`${labels.siteName} home`}>
            <img src="/image/bookflow_primary_logo.png" alt="BookFlow logo" width="157" height="42" style={{ filter: 'brightness(0) invert(1)' }} />
          </a>
          <button className="mobile-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" title="Close sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
              <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" stroke-width="2"/>
              <path d="M9 4V20" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
        </div>
        <div className="mobile-drawer-sidebar-nav">
          {getMenuItems().map(item => {
            const active = router.pathname === item.href
            return (
              <button
                key={item.href}
                className={`nav-item${active ? ' nav-item--active' : ''}`}
                onClick={() => {
                  if (active) return;
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
              >
                <span className="nav-icon" aria-hidden="true"><i className={item.icon} /></span>
                <span className="nav-label">{item.label}</span>
              </button>
            )
          })}
        </div>
        <div className="mobile-drawer-footer">
          <button className="logout-link" onClick={handleLogout}>
            <svg viewBox="0 0 512 512" width="18" height="21" xmlns="http://w3.org">
              <path fill="currentColor" d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 432v32c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V48c0-13.3 10.7-24 24-24h144c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H48v336h120c13.3 0 24 10.7 24 24z"/>
            </svg>
            {labels.mobile.signOut}
          </button>
        </div>
      </nav>

      {/* ── CHAT WIDGET ── */}
      {router.pathname !== '/admin/ai-assistant' && router.pathname !== '/ai-assistant' && (
        <div className="chat-root">
          <button
            className={`chat-bubble ${chatOpen ? 'chat-bubble--open' : ''}`}
            onClick={() => {
              const opening = !chatOpen;
              setChatOpen(opening);
              setAvatarMenuOpen(false);
              setNotifOpen(false);
              setTimeout(() => {
                chatInputRef.current?.focus();
              }, 300);
              if (opening) {
                warmChatbot();
              }
            }}
            aria-label={chatOpen ? labels.chat.bubbleAriaClose : labels.chat.bubbleAriaOpen}
          >
            {chatOpen ? (
              <span className="chat-bubble-x">✕</span>
            ) : (
              <i className="fas fa-robot" />
            )}
          </button>

          {chatOpen && (
            <div className="chat-panel">
              <div className="chat-panel-header">
                <span>{labels.chat.title}</span>
                <button
                  onClick={() => setChatOpen(false)}
                  aria-label="Minimize assistant"
                  className="chat-minimize-btn"
                >
                  <i className="fas fa-chevron-down" />
                </button>
              </div>
              <div className="chat-messages">
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`chat-msg ${m.role === 'user' ? 'chat-msg--user' : 'chat-msg--bot'}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {m.content}
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-msg chat-msg--bot">
                    {typingMessage}
                  </div>
                )}
                {chatLoading && !isTyping && (
                  <div className="chat-msg chat-msg--bot typing-indicator">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-area">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder={labels.chat.inputPlaceholder}
                  disabled={chatLoading || isTyping}
                  className="chat-input"
                />
                <button
                  onClick={sendChat}
                  disabled={chatLoading || isTyping}
                  className="chat-send-btn"
                >
                  <i className="fas fa-paper-plane" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TOAST (replaces old sidebar toast) ── */}
      <Toast
        message={toastMessage}
        type="info"
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      {/* ── STYLES ── */}
      <style jsx>{`
        /* ── TOKENS ── */
        :global(:root) {
          --sidebar-w: 220px;
          --topbar-h: 64px;
          --bg-page: #f1f1f1;
          --bg-card: #ffffff;
          --bg-sidebar: #001e4a;
          --border: #e8e8e8;
          --text-primary: #111111;
          --text-secondary: #666666;
          --text-muted: #aaaaaa;
          --accent: #111111;
          --accent-green: #22c55e;
          --radius-card: 16px;
          --radius-btn: 10px;
          --navy: #001e4a;
          --sap-primary: #0a6ed1;
          --sap-primary-hover: #0854a0;
        }

        .layout { display: flex; min-height: 100vh; background: var(--bg-page); font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; }

        /* ── SIDEBAR ── */
        .sidebar { width: var(--sidebar-w); background: var(--bg-sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 50; overflow-y: auto; }
        .sidebar-logo { padding: 1.25rem 1.25rem 1rem; border-bottom: 1px solid var(--border); }
        .logo-link { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; }
        .logo-icon { background: transparent; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.9rem; flex-shrink: 0; }
        .logo-text { font-size: 0.95rem; font-weight: 700; color: var(--bg-card); letter-spacing: -0.01em; }

        .sidebar-nav { flex: 1; padding: 0.75rem 0.75rem; display: flex; flex-direction: column; gap: 0.15rem; }
        .nav-item {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0.55rem 0.85rem; border-radius: 0;
          text-decoration: none; color: #b0c4de; font-size: 1rem;
          font-weight: 500;
          transition: background 0.15s ease, color 0.15s ease, transform 0.16s var(--ease-out);
          cursor: pointer; background: none; border: none; width: 100%; text-align: left;
        }
        .nav-item:active { transform: scale(0.97); }
        .nav-item:hover { background: rgba(255, 255, 255, 0.04); color: #ffffff; }
        .nav-item--active {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff; font-weight: 600;
          pointer-events: none;
          cursor: default;
        }
        .nav-item--active:active { transform: scale(0.97); }
        .nav-item--mobile { padding: 0.75rem 1.5rem; border-radius: 0; }
        .nav-icon { width: 18px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0; }
        .nav-label { font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; }

        .sidebar-footer { padding: 0.75rem; border-top: 1px solid var(--border); display: flex; gap: 0.5rem; }
        .util-btn {
          flex: 1; padding: 0.6rem; background: none; border: none;
          border-radius: 10px; color: lightblue; cursor: pointer;
          font-size: 1rem;
          transition: background 0.15s, color 0.15s, transform 0.16s var(--ease-out);
        }
        .util-btn:active { transform: scale(0.97); }
        .util-btn:hover { background: #f5f5f5; color: var(--text-primary); }
        .util-btn.active,
        .util-btn[data-active="true"] { background: #e6f0ff; color: #0a6ed1; font-weight: 600; pointer-events: none; cursor: default; }

        /* ── LAYOUT BODY ── */
        .layout-body { flex: 1; margin-left: var(--sidebar-w); display: flex; flex-direction: column; min-height: 100vh; width: calc(100vw - var(--sidebar-w)); }
        .topbar { height: var(--topbar-h); display: flex; align-items: center; gap: 1rem; padding: 0 1.5rem; position: sticky; top: 0; z-index: 40; background: rgba(214,234,255,0.5); backdrop-filter: blur(20px) saturate(2); -webkit-backdrop-filter: blur(20px) saturate(2); border-bottom: 1px solid rgba(10,110,209,0.12); box-shadow: 0 4px 20px rgba(0,30,74,0.06); }
        .mobile-menu-btn { display: none; background: none; border: none; font-size: 1.25rem; cursor: pointer; color: var(--text-primary); padding: 0.4rem; }
        .topbar-search { flex: 1; max-width: 420px; position: relative; }
        .search-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.8rem; pointer-events: none; }
        .search-input { width: 100%; padding: 0.55rem 0.85rem 0.55rem 2.3rem; background: #f5f5f5; border: 1px solid transparent; border-radius: 10px; font-size: 0.875rem; color: var(--text-primary); outline: none; transition: border-color 0.15s, background 0.15s; }
        .search-input:focus { background: #fff; border-color: #d0d0d0; }
        .search-input::placeholder { color: var(--text-muted); }
        .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 0.5rem; }
        .create-btn {
          display: flex; align-items: center; gap: 0.4rem;
          background: var(--sap-primary); color: #fff; border: none;
          border-radius: 10px; padding: 0.5rem 1rem; font-size: 0.85rem;
          font-weight: 600; cursor: pointer; text-decoration: none;
          transition: opacity 0.15s, transform 0.16s var(--ease-out);
        }
        .create-btn:active { transform: scale(0.97); }
        .create-btn:hover { opacity: 0.85; }
        .icon-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: transparent; border: none; cursor: pointer;
          color: var(--text-secondary); font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          position: relative;
          transition: background 0.15s ease, color 0.15s ease, transform 0.16s var(--ease-out);
        }
        .icon-btn:active { transform: scale(0.93); }
        .icon-btn:hover { background: #f5f5f5; color: var(--text-primary); }
        .notif-dot { position: absolute; top: 5px; right: 5px; width: 7px; height: 7px; background: var(--accent-green); border-radius: 50%; border: 1.5px solid #fff; }

        .user-avatar-wrapper { position: relative; }
        .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: #e5e7eb; overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; padding: 0; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-initials { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.02em; }

        .notif-badge { position: absolute; top: 2px; right: 2px; min-width: 18px; height: 18px; background: var(--accent-green); color: #fff; border-radius: 50%; font-size: 0.7rem; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 4px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

        .notif-dropdown, .avatar-dropdown {
          position: absolute; top: 40px; right: 0;
          background: #fff; border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15); z-index: 200;
          overflow: hidden;
          animation: slideDown 0.2s var(--ease-out);
        }
        .notif-dropdown { width: 320px; }
        .avatar-dropdown { width: 240px; top: 44px; }
        .notif-item { padding: 0.75rem 1rem; border-bottom: 1px solid #f0f0f0; display: flex; gap: 0.5rem; align-items: center; font-size: 0.85rem; color: #333; }
        .notif-item.unread { background: #f8faff; font-weight: 600; }
        .dot--success { background: #22c55e; }
        .dot--error   { background: #ef4444; }
        .dot--info    { background: #3b82f6; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .avatar-dropdown-header { padding: 1rem; border-bottom: 1px solid #f0f0f0; }
        .avatar-dropdown-header strong { display: block; color: #111; font-size: 0.95rem; }
        .avatar-dropdown-header span { display: block; color: #666; font-size: 0.8rem; margin-top: 0.2rem; }
        .avatar-dropdown-item { width: 100%; background: none; border: none; padding: 0.75rem 1rem; text-align: left; cursor: pointer; font-size: 0.88rem; color: #333; display: flex; align-items: center; gap: 0.5rem; transition: background 0.15s; }
        .avatar-dropdown-item:hover { background: #f5f5f5; }

        .main-content { flex: 1; padding: 2rem; overflow-y: auto; overflow-x: hidden; }
        .main-content.content-ready > :first-child {
          animation: fadeIn 0.25s var(--ease-out) both;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 199; }
        .mobile-drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; background: #001e4a; z-index: 200; transform: translateX(-100%); transition: transform 0.25s ease; display: flex; flex-direction: column; box-shadow: 4px 0 24px rgba(0,0,0,0.12); }
        .mobile-drawer--open { transform: translateX(0); }
        .mobile-drawer-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
        .mobile-drawer-sidebar-nav { flex: 1; padding: 0.75rem 0.75rem; display: flex; flex-direction: column; gap: 0.15rem; }
        .mobile-close-btn { margin-left: auto; background: none; border: none; font-size: 1.3rem; font-weight: 10; cursor: pointer; color: lightgray; padding: 0.3rem; }
        .mobile-drawer-footer { padding: 1rem 1.25rem; border-top: 1px solid var(--border); }
        .logout-link { background: none; border: none; cursor: pointer; color: #b0c4de; font-size: 0.875rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.85rem; border-radius: 0px; width: 100%; text-align: left; transition: background 0.15s; }
        .logout-link:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }

        /* ── SKELETON / SHIMMER (from preload) ── */
        :global(.skeleton) {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite ease-in-out;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        :global(.card) {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        :global(.stats-grid) {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        :global(.stat-card) {
          padding: 1.5rem;
        }

        /* ── CHAT WIDGET ── */
        .chat-root { position: fixed; bottom: 24px; right: 24px; z-index: 1100; }

        .chat-bubble {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--sap-primary); color: #fff; border: none;
          font-size: 24px; cursor: pointer;
          box-shadow: 0 6px 20px rgba(10,110,209,0.25);
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.2s var(--ease-out), box-shadow 0.2s ease, background 0.2s ease;
          animation: gentle-pulse 2s infinite;
        }
        .chat-bubble:active { transform: scale(0.93); }
        .chat-bubble:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 28px rgba(10,110,209,0.35);
        }
        .chat-bubble--open {
          background: #fff; color: var(--text-secondary);
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
          animation: none;
        }
        .chat-bubble-x { font-size: 20px; font-weight: 400; }
        @keyframes gentle-pulse {
          0% { box-shadow: 0 0 0 0 rgba(10,110,209,0.4); }
          70% { box-shadow: 0 0 0 12px rgba(10,110,209,0); }
          100% { box-shadow: 0 0 0 0 rgba(10,110,209,0); }
        }

        .chat-panel {
          position: absolute; bottom: 72px; right: 0;
          width: 360px; height: 480px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(20px) saturate(2);
          -webkit-backdrop-filter: blur(20px) saturate(2);
          border: 1px solid rgba(10,110,209,0.15);
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,30,74,0.15);
          display: flex; flex-direction: column; overflow: hidden;
          animation: popIn 0.25s var(--ease-out);
        }
        @keyframes popIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .chat-panel-header {
          padding: 0.9rem 1.25rem;
          background: rgba(10,110,209,0.08);
          border-bottom: 1px solid rgba(10,110,209,0.12);
          display: flex; align-items: center; justify-content: space-between;
          font-weight: 650; font-size: 0.95rem; color: var(--navy);
        }
        .chat-minimize-btn {
          background: none; border: none; font-size: 1.1rem;
          color: var(--text-secondary); cursor: pointer;
          padding: 0.2rem 0.4rem; border-radius: 6px; transition: background 0.15s;
        }
        .chat-minimize-btn:hover { background: rgba(0,0,0,0.05); }

        .chat-messages {
          flex: 1; overflow-y: auto; padding: 1rem;
          display: flex; flex-direction: column; gap: 0.5rem;
          will-change: scroll-position; contain: content;
          -webkit-overflow-scrolling: touch;
        }
        .chat-msg {
          max-width: 85%; padding: 0.6rem 1rem;
          border-radius: 18px; font-size: 0.85rem; line-height: 1.4;
          white-space: pre-wrap; word-break: break-word;
          opacity: 1; animation: none; transform: none;
        }
        .chat-msg--user {
          align-self: flex-end; background: var(--sap-primary);
          color: #fff; border-bottom-right-radius: 6px;
        }
        .chat-msg--bot {
          align-self: flex-start; background: rgba(10,110,209,0.07);
          color: var(--text-primary); border-bottom-left-radius: 6px;
        }

        .typing-indicator {
          display: flex; align-items: center; gap: 4px;
          padding: 0.6rem 1rem; width: fit-content; will-change: contents;
        }
        .typing-indicator .dot {
          width: 6px; height: 6px; background: var(--sap-primary);
          border-radius: 50%; opacity: 0.4;
          will-change: transform;
          animation: bounce 1.2s infinite ease-in-out;
        }
        .typing-indicator .dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-indicator .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); }
          40% { transform: scale(1); }
        }

        .chat-input-area {
          padding: 0.7rem 1rem; border-top: 1px solid rgba(10,110,209,0.12);
          display: flex; gap: 0.5rem; align-items: center; contain: layout style;
        }
        .chat-input {
          flex: 1; padding: 0.6rem 0.9rem;
          border: 1px solid rgba(10,110,209,0.2); border-radius: 14px;
          background: rgba(255,255,255,0.7); outline: none;
          font-size: 0.85rem; color: var(--text-primary);
          transition: border-color 0.1s, box-shadow 0.1s;
          will-change: border-color, box-shadow;
        }
        .chat-input:focus {
          border-color: var(--sap-primary);
          box-shadow: 0 0 0 3px rgba(10,110,209,0.1);
        }
        .chat-send-btn {
          background: var(--sap-primary); color: #fff;
          border: none; border-radius: 50%; width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 0.95rem;
          transition: opacity 0.1s ease, transform 0.16s var(--ease-out);
          will-change: opacity;
        }
        .chat-send-btn:active { transform: scale(0.93); }
        .chat-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .layout-body { margin-left: 0; width: 100vw; }
          .mobile-menu-btn { display: flex; }
          .topbar-search { max-width: none; }
          .main-content { padding: 1rem; }
          .chat-root { right: 16px; bottom: 16px; }
          .chat-panel { width: calc(100vw - 32px); height: 55vh; }
          .chat-bubble { right: 16px; bottom: 16px; }
        }
        @media (max-width: 480px) {
          .topbar-search { display: none; }
        }
      `}</style>
    </div>
  )
}