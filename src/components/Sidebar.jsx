import { useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard, FilePlus, FileText, Users, Building2,
  BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  Package, ClipboardCheck
} from 'lucide-react'

export default function Sidebar({ profile, page, setPage, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false)

  const canAccessOS = ['hod', 'management', 'admin'].includes(profile.role)

  const reqNav = [
    { icon: LayoutDashboard, label: 'Dashboard',       key: 'dashboard' },
    { icon: FilePlus,        label: 'New Requisition', key: 'new_request' },
    { icon: FileText,        label: 'My Requests',     key: 'my_requests' },
  ]

  const osNav = [
    { icon: Users,     label: 'Employee Directory', key: 'employees' },
    { icon: Building2, label: 'Departments',         key: 'departments' },
    { icon: BarChart3, label: 'Analytics',           key: 'analytics' },
  ]

  const adminNav = profile.role === 'admin' ? [
    { icon: Settings, label: 'Admin Panel', key: 'admin' },
  ] : []

  const NavItem = ({ icon: Icon, label, navKey }) => {
    const active = page === navKey
    return (
      <button onClick={() => setPage(navKey)}
        title={collapsed ? label : ''}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 10, padding: collapsed ? '10px' : '9px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 'var(--r)', border: 'none', cursor: 'pointer',
          marginBottom: 2, transition: 'all var(--t-fast)',
          background: active ? 'rgba(26,86,219,0.2)' : 'transparent',
          color: active ? '#fff' : 'rgba(255,255,255,0.5)',
          fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 600 : 400,
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)' }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}>
        <Icon size={16} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
        {!collapsed && <span style={{ transition: 'opacity var(--t)' }}>{label}</span>}
        {active && !collapsed && (
          <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)' }} />
        )}
      </button>
    )
  }

  const SectionLabel = ({ label }) => collapsed ? (
    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 8px' }} />
  ) : (
    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', margin: '16px 0 6px' }}>{label}</div>
  )

  return (
    <div style={{
      width: collapsed ? 60 : 220, flexShrink: 0,
      background: 'var(--navy)', display: 'flex', flexDirection: 'column',
      transition: 'width var(--t-slow)', overflow: 'hidden',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '16px 10px' : '16px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <img src="/new_logo_trans.png" alt="Acti-Tech" style={{ width: collapsed ? 32 : 28, height: collapsed ? 32 : 28, objectFit: 'contain', flexShrink: 0 }} />
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 12, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>ACTI-TECH</div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>OPERATIONS PORTAL</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        <SectionLabel label="Requisitions" />
        {reqNav.map(item => <NavItem key={item.key} icon={item.icon} label={item.label} navKey={item.key} />)}

        {canAccessOS && (
          <>
            <SectionLabel label="Operations" />
            {osNav.map(item => <NavItem key={item.key} icon={item.icon} label={item.label} navKey={item.key} />)}
          </>
        )}

        {adminNav.length > 0 && (
          <>
            <SectionLabel label="Admin" />
            {adminNav.map(item => <NavItem key={item.key} icon={item.icon} label={item.label} navKey={item.key} />)}
          </>
        )}
      </div>

      {/* User + collapse */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setCollapsed(!collapsed)}
          style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div style={{ padding: collapsed ? '8px' : '10px 14px 14px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.full_name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{profile.departments?.name || profile.role}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={onSignOut} className="btn btn-ghost btn-icon btn-sm" title="Sign out"
              style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}