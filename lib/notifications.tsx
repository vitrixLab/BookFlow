import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  read: boolean
  timestamp: number
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (message: string, type?: Notification['type']) => void
  markAllRead: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  markAllRead: () => {},
  unreadCount: 0,
})

export const useNotifications = () => useContext(NotificationContext)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((message: string, type: Notification['type'] = 'success') => {
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(2, 11),
      message,
      type,
      read: false,
      timestamp: Date.now(),
    }
    setNotifications(prev => [newNotif, ...prev].slice(0, 50)) // keep last 50
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  )
}
