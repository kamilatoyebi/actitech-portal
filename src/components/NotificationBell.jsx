import { useState, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react'
import { getUnreadNotifications, getAllNotifications, markAsRead, markAllAsRead, deleteNotification, subscribeToNotifications } from '../lib/supabaseNotifications'

const C = {
  primary: '#1565D8',
  light: '#3AACEE',
  success: '#15803D',
  error: '#B91C1C',
  border: '#DDE5F0',
  bg: '#F2F5FB',
  card: '#FFFFFF',
  text: '#18243A',
  muted: '#7A8EAB',
  navy: '#0C1A2E',
}

export default function NotificationBell({ userId }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Load notifications on mount
  useEffect(() => {
    if (!userId) return

    const loadNotifications = async () => {
      setLoading(true)
      try {
        const all = await getAllNotifications(userId, 20)
        setNotifications(all)
        setUnreadCount(all.filter(n => !n.read).length)
      } catch (err) {
        console.error('Error loading notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Subscribe to real-time updates
    const subscription = subscribeToNotifications(userId, (newNotif, event) => {
      if (event === 'update') {
        // Update existing notification
        setNotifications(prev => 
          prev.map(n => n.id === newNotif.id ? newNotif : n)
        )
      } else {
        // Add new notification
        setNotifications(prev => [newNotif, ...prev])
      }
      
      // Update unread count
      setNotifications(prev => {
        const count = prev.filter(n => !n.read).length
        setUnreadCount(count)
        return prev
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation()
    try {
      await markAsRead(id)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(userId)
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await deleteNotification(id)
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id)
        setUnreadCount(updated.filter(n => !n.read).length)
        return updated
      })
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const notificationTypeColor = (type) => {
    const colors = {
      new_request: { bg: '#EDE9FE', text: '#7C3AED', label: 'New Request' },
      hod_approved: { bg: '#FEF3C7', text: '#B45309', label: 'HOD Approved' },
      management_approved: { bg: '#DCFCE7', text: '#15803D', label: 'Approved' },
      request_rejected: { bg: '#FEE2E2', text: '#B91C1C', label: 'Rejected' },
      request_fulfilled: { bg: '#E0F2FE', text: '#0369A1', label: 'Fulfilled' },
    }
    return colors[type] || { bg: '#F1F5F9', text: '#7A8EAB', label: type }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          color: C.primary,
          fontSize: '20px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(21, 101, 216, 0.1)'}
        onMouseLeave={(e) => e.target.style.background = 'none'}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            background: C.error,
            color: '#fff',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '0',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          minWidth: '360px',
          maxHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: C.text }}>
                Notifications
              </div>
              <div style={{ fontSize: '12px', color: C.muted, marginTop: '2px' }}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </div>
            </div>
            <button
              onClick={() => setShowDropdown(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.muted,
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Mark All As Read Button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                padding: '8px 12px',
                borderBottom: `1px solid ${C.border}`,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.primary,
                fontSize: '12px',
                fontWeight: '500',
                textAlign: 'left',
              }}
            >
              <CheckCheck size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Mark all as read
            </button>
          )}

          {/* Notifications List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: C.muted }}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: C.muted }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => {
                const typeInfo = notificationTypeColor(notif.type)
                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) {
                        handleMarkAsRead(notif.id, { stopPropagation: () => {} })
                      }
                      if (notif.action_url) {
                        // Navigate to action URL
                        window.location.href = notif.action_url
                      }
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${C.border}`,
                      background: notif.read ? C.card : 'rgba(21, 101, 216, 0.02)',
                      cursor: notif.action_url ? 'pointer' : 'default',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!notif.read) e.currentTarget.style.background = 'rgba(21, 101, 216, 0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.read ? C.card : 'rgba(21, 101, 216, 0.02)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{
                        background: typeInfo.bg,
                        color: typeInfo.text,
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        minWidth: 'fit-content',
                      }}>
                        {typeInfo.label}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: notif.read ? '400' : '600',
                          color: C.text,
                          marginBottom: '4px',
                        }}>
                          {notif.title}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: C.muted,
                          marginBottom: '6px',
                        }}>
                          {notif.message}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: C.muted,
                        }}>
                          {new Date(notif.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: C.primary,
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title="Mark as read"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notif.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: C.muted,
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  )
}
