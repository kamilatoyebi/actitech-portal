import { useState } from 'react'
import {
  LayoutDashboard, FilePlus, FileText, Users, Building2,
  BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  Package, ClipboardCheck, Bell
} from 'lucide-react'

export default function Sidebar({ profile, page, setPage, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false)

  const canAccessOS = ['hod', 'management', 'admin'].includes(profile.role)

  const reqNav = [
    { icon: LayoutDashboard, label: 'Dashboard',       key: 'dashboard' },
    { icon: FilePlus,        label: 'New Requisition', key: 'new_request' },
    { icon: FileText,        label: 'My Requests',     key: 'my_requests' },
  ]

  const osNav = canAccessOS ? [
    { icon: Users,     label: 'Employee Directory', key: 'employees',   soon: true },
    { icon: Building2, label: 'Departments',         key: 'departments', soon: true },
    { icon: BarChart3, label: 'Analytics',           key: 'analytics',  soon: true },
  ] : []

  const adminNav = profile.role === 'admin' ? [
    { icon: Settings, label: 'Admin Panel', key: 'admin', soon: true },
  ] : []

  const NavItem = ({ icon: Icon, label, navKey, soon }) => {
    const active = page === navKey
    return (
      <button onClick={() => setPage(navKey)}
        title={collapsed ? label : ''}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 10, padding: collapsed ? '10px' : '9px 12px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderRadius: 'var(--r)', border: 'none', cursor: soon ? 'default' : 'pointer',
          marginBottom: 2, transition: 'all var(--t-fast)',
          background: active ? 'rgba(26,86,219,0.2)' : 'transparent',
          color: active ? '#fff' : soon ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
          fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 600 : 400,
          opacity: soon ? 0.5 : 1,
        }}>
        <Icon size={16} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        )}
        {!collapsed && soon && (
          <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', padding: '2px 6px', borderRadius: 99, fontWeight: 600 }}>SOON</span>
        )}
        {active && !collapsed && !soon && (
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cyan)' }} />
        )}
      </button>
    )
  }

  const SectionLabel = ({ label }) => collapsed ? (
    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 6px' }} />
  ) : (
    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', margin: '14px 0 5px' }}>{label}</div>
  )

  return (
    <div style={{
      width: collapsed ? 60 : 220, flexShrink: 0,
      background: 'var(--navy)', display: 'flex', flexDirection: 'column',
      transition: 'width var(--t-slow)', overflow: 'hidden',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '14px 10px' : '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', minHeight: 58 }}>
        <img
          src="/new_logo_trans.png"
          alt="Acti-Tech"
          style={{ width: 30, height: 30, objectFit: 'contain', flexShrink: 0 }}
          onError={e => { e.target.style.display = 'none' }}
        />
        {!collapsed && (
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 12, letterSpacing: '0.05em', lineHeight: 1.2 }}>ACTI-TECH</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, letterSpacing: '0.1em' }}>OPERATIONS PORTAL</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '8px', overflowY: 'auto', overflowX: 'hidden' }}>
        <SectionLabel label="Requisitions" />
        {reqNav.map(item => (
          <NavItem key={item.key} icon={item.icon} label={item.label} navKey={item.key} />
        ))}

        {osNav.length > 0 && (
          <>
            <SectionLabel label="Operations" />
            {osNav.map(item => (
              <NavItem key={item.key} icon={item.icon} label={item.label} navKey={item.key} soon={item.soon} />
            ))}
          </>
        )}

        {adminNav.length > 0 && (
          <>
            <SectionLabel label="Admin" />
            {adminNav.map(item => (
              <NavItem key={item.key} icon={item.icon} label={item.label} navKey={item.key} soon={item.soon} />
            ))}
          </>
        )}
      </div>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ width: '100%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', transition: 'color var(--t-fast)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <div style={{ padding: collapsed ? '6px 8px 12px' : '6px 12px 14px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.full_name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.departments?.name || profile.role}</div>
              </div>
              <button onClick={onSignOut}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 4, borderRadius: 'var(--r)', display: 'flex', transition: 'color var(--t-fast)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                title="Sign out">
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}