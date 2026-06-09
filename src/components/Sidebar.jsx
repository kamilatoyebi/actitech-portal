import { supabase } from '../lib/supabase'

const C = {
  primary: '#1565D8', light: '#3AACEE',
  sidebar: '#0C1A2E', ghost: '#3A5270', muted: '#7A8EAB',
}

export default function Sidebar({ profile, page, setPage, onSignOut }) {
  const baseNav = [
    { icon:'🏠', label:'Dashboard',       key:'dashboard' },
    { icon:'➕', label:'New Requisition', key:'new_request' },
    { icon:'📋', label:'My Requests',     key:'my_requests' },
  ]

  // OS Portal menu items
  const osNav = [
    { icon:'👥', label:'Employee Directory', key:'employees' },
    { icon:'🏢', label:'Departments',        key:'departments' },
    { icon:'📊', label:'Analytics',          key:'analytics' },
  ]

  // Admin menu (only for admins)
  const adminNav = profile.role === 'admin' ? [
    { icon:'⚙️', label:'Admin Panel',     key:'admin' },
  ] : []

  return (
    <div style={{ width:220, background:C.sidebar, display:'flex', flexDirection:'column', flexShrink:0 }}>
      {/* Logo */}
      <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <defs><linearGradient id="sl" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1565D8"/><stop offset="100%" stopColor="#3AACEE"/>
            </linearGradient></defs>
            <circle cx="14" cy="14" r="13" fill="rgba(21,101,216,0.2)"/>
            <text x="14" y="20" textAnchor="middle" fill="url(#sl)" fontSize="17" fontWeight="900" fontFamily="Arial Black,sans-serif">A</text>
          </svg>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:11, letterSpacing:'0.05em' }}>ACTI-TECH</div>
            <div style={{ color:C.ghost, fontSize:8, letterSpacing:'0.1em' }}>OPERATIONS PORTAL</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex:1, padding:'12px 8px', overflowY: 'auto' }}>
        {/* Requisition Section */}
        <div style={{ fontSize:7.5, fontWeight:700, color:C.ghost, textTransform:'uppercase', letterSpacing:'0.1em', padding:'0 8px', marginBottom:6 }}>Requisitions</div>
        {baseNav.map(item => (
          <button key={item.key} onClick={() => setPage(item.key)}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:7, border:'none', cursor:'pointer', marginBottom:2, textAlign:'left',
              background: page===item.key ? 'rgba(21,101,216,0.25)' : 'transparent',
              color: page===item.key ? '#fff' : C.muted, fontSize:12, fontWeight: page===item.key ? 600 : 400 }}>
            <span>{item.icon}</span> {item.label}
          </button>
        ))}

        {/* OS Portal Section */}
        <div style={{ fontSize:7.5, fontWeight:700, color:C.ghost, textTransform:'uppercase', letterSpacing:'0.1em', padding:'0 8px', marginTop:16, marginBottom:6 }}>OS Portal</div>
        {osNav.map(item => (
          <button key={item.key} onClick={() => setPage(item.key)}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:7, border:'none', cursor:'pointer', marginBottom:2, textAlign:'left',
              background: page===item.key ? 'rgba(21,101,216,0.25)' : 'transparent',
              color: page===item.key ? '#fff' : C.muted, fontSize:12, fontWeight: page===item.key ? 600 : 400 }}>
            <span>{item.icon}</span> {item.label}
          </button>
        ))}

        {/* Admin Section */}
        {adminNav.length > 0 && (
          <>
            <div style={{ fontSize:7.5, fontWeight:700, color:C.ghost, textTransform:'uppercase', letterSpacing:'0.1em', padding:'0 8px', marginTop:16, marginBottom:6 }}>Admin</div>
            {adminNav.map(item => (
              <button key={item.key} onClick={() => setPage(item.key)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:7, border:'none', cursor:'pointer', marginBottom:2, textAlign:'left',
                  background: page===item.key ? 'rgba(21,101,216,0.25)' : 'transparent',
                  color: page===item.key ? '#fff' : C.muted, fontSize:12, fontWeight: page===item.key ? 600 : 400 }}>
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* User */}
      <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#fff', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile.full_name}</div>
        <div style={{ fontSize:9, color:C.ghost, marginBottom:10 }}>{profile.departments?.name}</div>
        <button onClick={onSignOut} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, color:C.muted, fontSize:11, padding:'5px 12px', cursor:'pointer', width:'100%' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}