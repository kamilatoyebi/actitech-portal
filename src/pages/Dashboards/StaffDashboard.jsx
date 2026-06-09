import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const C = {
  primary:'#1565D8', light:'#3AACEE', bg:'#F2F5FB',
  card:'#fff', border:'#DDE5F0', text:'#18243A', muted:'#7A8EAB',
}

const STATUS = {
  draft:             { l:'Draft',        c:'#7A8EAB', bg:'#F1F5F9' },
  submitted:         { l:'Submitted',    c:'#7C3AED', bg:'#EDE9FE' },
  hod_review:        { l:'HOD Review',   c:'#B45309', bg:'#FEF3C7' },
  management_review: { l:'Mgmt Review',  c:'#1565D8', bg:'#DBEAFE' },
  approved:          { l:'Approved',     c:'#15803D', bg:'#DCFCE7' },
  fulfilled:         { l:'Fulfilled',    c:'#0369A1', bg:'#E0F2FE' },
  rejected:          { l:'Rejected',     c:'#B91C1C', bg:'#FEE2E2' },
}

function Pill({ status }) {
  const s = STATUS[status] || STATUS.draft
  return (
    <span style={{ background:s.bg, color:s.c, padding:'3px 9px',
      borderRadius:20, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
      {s.l}
    </span>
  )
}

export default function StaffDashboard({ profile, setPage }) {
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('requisitions')
      .select('*, req_items(*)')
      .eq('requester_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setReqs(data); setLoading(false) })
  }, [])

  const total    = reqs.length
  const pending  = reqs.filter(r => ['submitted','hod_review','management_review'].includes(r.status)).length
  const approved = reqs.filter(r => r.status === 'approved').length
  const fulfilled= reqs.filter(r => r.status === 'fulfilled').length

  return (
    <div style={{ padding:'28px 32px', fontFamily:'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:20, fontWeight:800, color:C.text }}>
          Good day, {profile.full_name.split(' ')[0]} 👋
        </div>
        <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>
          {profile.departments?.name} · {profile.title}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
        {[
          { label:'Total Requests', val:total,    sub:'All time',       icon:'📋', color:C.primary },
          { label:'In Progress',    val:pending,  sub:'Awaiting action',icon:'⏳', color:'#D97706' },
          { label:'Approved',       val:approved, sub:'This year',      icon:'✅', color:'#16A34A' },
          { label:'Fulfilled',      val:fulfilled,sub:'Items received',  icon:'📦', color:'#0891B2' },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'16px 18px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:9, color:C.muted, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</span>
              <span style={{ fontSize:18 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize:24, fontWeight:800, color:C.text, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:5 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* CTA Banner */}
      <div style={{ background:'#18243A', borderRadius:12, padding:'20px 24px', marginBottom:28,
        display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:3 }}>
            Need something from the store?
          </div>
          <div style={{ fontSize:11, color:'#5A7A9A' }}>
            Submit a requisition — your HOD is notified instantly
          </div>
        </div>
        <button onClick={() => setPage('new_request')}
          style={{ background:C.primary, color:'#fff', border:'none', borderRadius:8,
            padding:'9px 18px', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }}>
          + New Requisition
        </button>
      </div>

      {/* Requests Table */}
      <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:12 }}>My Requests</div>
      {loading
        ? <div style={{ color:C.muted, fontSize:13 }}>Loading...</div>
        : reqs.length === 0
        ? <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
            padding:'40px 24px', textAlign:'center', color:C.muted, fontSize:13 }}>
            No requests yet — submit your first one above
          </div>
        : <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#18243A' }}>
                  {['Req No.','Purpose','Items','Priority','Status','Date'].map(h =>
                    <th key={h} style={{ padding:'10px 14px', fontSize:9, fontWeight:700,
                      color:'rgba(255,255,255,0.5)', textAlign:'left',
                      letterSpacing:'0.07em', textTransform:'uppercase' }}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {reqs.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < reqs.length-1 ? `1px solid ${C.border}` : 'none' }}>
                    <td style={{ padding:'11px 14px', fontSize:11, fontWeight:700, color:C.primary }}>{r.req_number}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:C.text }}>{r.purpose}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:C.muted }}>{r.req_items?.length} item(s)</td>
                    <td style={{ padding:'11px 14px' }}>
                      <span style={{ background:r.priority==='Urgent'?'#FEF3C7':'#F1F5F9',
                        color:r.priority==='Urgent'?'#B45309':'#7A8EAB',
                        padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700 }}>
                        {r.priority}
                      </span>
                    </td>
                    <td style={{ padding:'11px 14px' }}><Pill status={r.status}/></td>
                    <td style={{ padding:'11px 14px', fontSize:11, color:C.muted }}>
                      {new Date(r.created_at).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </div>
  )
}