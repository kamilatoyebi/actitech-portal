import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ManagementDashboard({ profile }) {
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReqs() }, [])

  async function fetchReqs() {
    const { data } = await supabase
      .from('requisitions')
      .select('*, profiles(full_name), req_items(*)')
      .eq('status', 'management_review')
      .order('created_at', { ascending: false })
    if (data) setReqs(data)
    setLoading(false)
  }

  async function approve(id) {
    await supabase.from('requisitions').update({ status: 'approved' }).eq('id', id)
    await supabase.from('approvals').insert({
      requisition_id: id, approver_id: profile.id,
      stage: 'management', action: 'approved'
    })
    fetchReqs()
  }

  async function reject(id) {
    await supabase.from('requisitions').update({ status: 'rejected' }).eq('id', id)
    await supabase.from('approvals').insert({
      requisition_id: id, approver_id: profile.id,
      stage: 'management', action: 'rejected'
    })
    fetchReqs()
  }

  async function resubmit(id) {
    await supabase.from('requisitions').update({ status: 'hod_review' }).eq('id', id)
    await supabase.from('approvals').insert({
      requisition_id: id, approver_id: profile.id,
      stage: 'management', action: 'resubmit'
    })
    fetchReqs()
  }

  const C = { primary:'#1565D8', card:'#fff', border:'#DDE5F0', text:'#18243A', muted:'#7A8EAB' }

  return (
    <div style={{ padding:'28px 32px', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>Management Dashboard</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:24 }}>
        {profile.title} · Final Approval Queue
      </div>

      {loading
        ? <div style={{ color:C.muted }}>Loading...</div>
        : reqs.length === 0
        ? <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
            padding:'40px', textAlign:'center', color:C.muted, fontSize:13 }}>
            No pending approvals 🎉
          </div>
        : reqs.map(r => (
          <div key={r.id} style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:10, padding:'16px 20px', marginBottom:12 }}>
            <div style={{ marginBottom:12 }}>
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
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end',
              paddingTop:12, borderTop:`1px solid ${C.border}` }}>
              <button onClick={() => reject(r.id)} style={{ padding:'7px 14px',
                background:'#FEE2E2', border:'none', borderRadius:7,
                fontSize:11, fontWeight:700, color:'#B91C1C', cursor:'pointer' }}>
                Reject
              </button>
              <button onClick={() => resubmit(r.id)} style={{ padding:'7px 14px',
                background:'#FEF3C7', border:'none', borderRadius:7,
                fontSize:11, fontWeight:700, color:'#B45309', cursor:'pointer' }}>
                Send Back
              </button>
              <button onClick={() => approve(r.id)} style={{ padding:'7px 18px',
                background:C.primary, border:'none', borderRadius:7,
                fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer' }}>
                ✓ Approve
              </button>
            </div>
          </div>
        ))
      }
    </div>
  )
}