import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function HODDashboard({ profile }) {
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReqs() }, [])

  async function fetchReqs() {
    const { data } = await supabase
      .from('requisitions')
      .select('*, profiles(full_name), req_items(*)')
      .eq('department_id', profile.department_id)
      .eq('status', 'submitted')
      .order('created_at', { ascending: false })
    if (data) setReqs(data)
    setLoading(false)
  }

  async function authorize(id) {
    await supabase.from('requisitions').update({ status: 'management_review' }).eq('id', id)
    await supabase.from('approvals').insert({
      requisition_id: id, approver_id: profile.id,
      stage: 'hod', action: 'approved'
    })
    fetchReqs()
  }

  async function reject(id) {
    await supabase.from('requisitions').update({ status: 'rejected' }).eq('id', id)
    await supabase.from('approvals').insert({
      requisition_id: id, approver_id: profile.id,
      stage: 'hod', action: 'rejected'
    })
    fetchReqs()
  }

  const C = { primary:'#1565D8', card:'#fff', border:'#DDE5F0', text:'#18243A', muted:'#7A8EAB' }

  return (
    <div style={{ padding:'28px 32px', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>HOD Dashboard</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:24 }}>
        {profile.departments?.name} · Pending Authorizations
      </div>

      {loading
        ? <div style={{ color:C.muted }}>Loading...</div>
        : reqs.length === 0
        ? <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
            padding:'40px', textAlign:'center', color:C.muted, fontSize:13 }}>
            No pending authorizations 🎉
          </div>
        : reqs.map(r => (
          <div key={r.id} style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:10, padding:'16px 20px', marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:11, color:C.primary, fontWeight:700, marginBottom:4 }}>
                  {r.req_number}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:3 }}>
                  {r.purpose}
                </div>
                <div style={{ fontSize:11, color:C.muted }}>
                  By {r.profiles?.full_name} · {r.req_items?.length} item(s) · {r.priority} · {r.location}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button onClick={() => reject(r.id)} style={{ padding:'7px 14px',
                  background:'#FEE2E2', border:'none', borderRadius:7,
                  fontSize:11, fontWeight:700, color:'#B91C1C', cursor:'pointer' }}>
                  Reject
                </button>
                <button onClick={() => authorize(r.id)} style={{ padding:'7px 14px',
                  background:'#DCFCE7', border:'none', borderRadius:7,
                  fontSize:11, fontWeight:700, color:'#15803D', cursor:'pointer' }}>
                  Authorize
                </button>
              </div>
            </div>
          </div>
        ))
      }
    </div>
  )
}