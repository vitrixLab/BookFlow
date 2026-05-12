import { useState, useEffect, useCallback } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  visible: boolean
  onClose: () => void
  autoDismissMs?: number   // default 3000
}

export default function Toast({
  message,
  type = 'info',
  visible,
  onClose,
  autoDismissMs = 3000,
}: ToastProps) {
  const [dismissing, setDismissing] = useState(false)

  const handleClose = useCallback(() => {
    setDismissing(true)
    // Wait for exit animation then call onClose
    setTimeout(() => {
      onClose()
      setDismissing(false)
    }, 250) // matches CSS exit animation duration
  }, [onClose])

  // Auto‑dismiss
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(handleClose, autoDismissMs)
    return () => clearTimeout(timer)
  }, [visible, autoDismissMs, handleClose])

  if (!visible && !dismissing) return null

  const icon = type === 'success' ? 'fa-check-circle' :
               type === 'error' ? 'fa-exclamation-circle' :
               'fa-info-circle'

  return (
    <div
      className={`toast toast--${type}${dismissing ? ' toast--dismissing' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <i className={`fas ${icon}`} />
      <span>{message}</span>
      <button onClick={handleClose} aria-label="Dismiss">
        <i className="fas fa-times" />
      </button>

      <style jsx>{`
        .toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 1200;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: #fff;
          color: #111;
          font-size: 0.85rem;
          font-weight: 500;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
          border: 1px solid #ebebeb;
          animation: toastIn 0.25s ease;
        }
        .toast--success {
          border-left: 4px solid #22c55e;
        }
        .toast--error {
          border-left: 4px solid #ef4444;
        }
        .toast--info {
          border-left: 4px solid #0a6ed1;
        }
        .toast button {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 0;
          margin-left: 0.5rem;
          font-size: 0.9rem;
        }
        .toast button:hover {
          color: #111;
        }
        .toast--dismissing {
          animation: toastOut 0.25s ease forwards;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(20px); }
        }
      `}</style>
    </div>
  )
}