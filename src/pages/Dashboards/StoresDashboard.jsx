import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function StoresDashboard({ profile }) {
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReqs() }, [])

  async function fetchReqs() {
    const { data } = await supabase
      .from('requisitions')
      .select('*, profiles(full_name), req_items(*)')
      .in('status', ['approved', 'fulfilled'])
      .order('created_at', { ascending: false })
    if (data) setReqs(data)
    setLoading(false)
  }

  async function fulfill(id) {
    await supabase.from('requisitions').update({ status: 'fulfilled' }).eq('id', id)
    await supabase.from('approvals').insert({
      requisition_id: id, approver_id: profile.id,
      stage: 'stores', action: 'fulfilled'
    })
    fetchReqs()
  }

  const C = { primary:'#1565D8', card:'#fff', border:'#DDE5F0', text:'#18243A', muted:'#7A8EAB' }

  return (
    <div style={{ padding:'28px 32px', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>Stores Dashboard</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:24 }}>
        Approved requisitions ready for fulfillment
      </div>

      {loading
        ? <div style={{ color:C.muted }}>Loading...</div>
        : reqs.length === 0
        ? <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
            padding:'40px', textAlign:'center', color:C.muted, fontSize:13 }}>
            No approved requisitions yet
          </div>
        : reqs.map(r => (
          <div key={r.id} style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:10, padding:'16px 20px', marginBottom:12,
            display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color:C.primary, fontWeight:700, marginBottom:4 }}>
                {r.req_number}
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:3 }}>
                {r.purpose}
              </div>
              <div style={{ fontSize:11, color:C.muted }}>
                {r.profiles?.full_name} · {r.req_items?.length} item(s)
              </div>
            </div>
            {r.status === 'approved'
              ? <button onClick={() => fulfill(r.id)} style={{ padding:'7px 16px',
                  background:C.primary, border:'none', borderRadius:7,
                  fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer', flexShrink:0 }}>
                  🖨 Print & Fulfil
                </button>
              : <span style={{ fontSize:11, color:'#15803D', fontWeight:700, flexShrink:0 }}>
                  ✓ Fulfilled
                </span>
            }
          </div>
        ))
      }
    </div>
  )
}