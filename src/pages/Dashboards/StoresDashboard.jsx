import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { sendEmail, emailTemplates } from '../../lib/sendEmail'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const C = { primary:'#1565D8', card:'#fff', border:'#DDE5F0', text:'#18243A', muted:'#7A8EAB' }

function PrintView({ req, approverName }) {
  return (
    <div id="print-view-stores" style={{ padding:32, fontFamily:'system-ui,sans-serif', background:'#fff', width:700 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, paddingBottom:16, borderBottom:'2px solid #18243A' }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, color:'#18243A' }}>ACTI-TECH LIMITED</div>
          <div style={{ fontSize:11, color:'#7A8EAB', marginTop:2 }}>Store Fulfillment Receipt</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:11, color:'#7A8EAB' }}>Ref No.</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#1565D8' }}>{req.req_number}</div>
          <div style={{ fontSize:11, color:'#7A8EAB', marginTop:4 }}>{new Date().toLocaleDateString('en-GB')}</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div><div style={{ fontSize:9, color:'#7A8EAB', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Collected By</div>
          <div style={{ fontSize:13, color:'#18243A', fontWeight:600 }}>{req.profiles?.full_name}</div></div>
        <div><div style={{ fontSize:9, color:'#7A8EAB', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Purpose</div>
          <div style={{ fontSize:13, color:'#18243A', fontWeight:600 }}>{req.purpose}</div></div>
        <div><div style={{ fontSize:9, color:'#7A8EAB', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Location</div>
          <div style={{ fontSize:13, color:'#18243A', fontWeight:600 }}>{req.location || '—'}</div></div>
        <div><div style={{ fontSize:9, color:'#7A8EAB', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Priority</div>
          <div style={{ fontSize:13, color:'#18243A', fontWeight:600 }}>{req.priority}</div></div>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:24 }}>
        <thead>
          <tr style={{ background:'#18243A' }}>
            {['S/N','Item Description','Qty','Remarks'].map(h =>
              <th key={h} style={{ padding:'8px 12px', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.7)', textAlign:'left', textTransform:'uppercase' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {req.req_items?.map((item, i) => (
            <tr key={i} style={{ borderBottom:'1px solid #DDE5F0' }}>
              <td style={{ padding:'8px 12px', fontSize:12, color:'#7A8EAB' }}>{i+1}</td>
              <td style={{ padding:'8px 12px', fontSize:12, color:'#18243A' }}>{item.item_name}</td>
              <td style={{ padding:'8px 12px', fontSize:12, color:'#18243A' }}>{item.quantity}</td>
              <td style={{ padding:'8px 12px', fontSize:12, color:'#7A8EAB' }}>{item.remarks || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:24, marginTop:32 }}>
        <div style={{ borderTop:'1.5px solid #18243A', paddingTop:8 }}>
          <div style={{ fontSize:10, color:'#7A8EAB' }}>Collected By</div>
          <div style={{ fontSize:11, color:'#18243A', fontWeight:600, marginTop:2 }}>{req.profiles?.full_name}</div>
        </div>
        <div style={{ borderTop:'1.5px solid #18243A', paddingTop:8 }}>
          <div style={{ fontSize:10, color:'#7A8EAB' }}>Issued By (Stores)</div>
          <div style={{ fontSize:11, color:'#18243A', fontWeight:600, marginTop:2 }}>{approverName}</div>
        </div>
        <div style={{ borderTop:'1.5px solid #18243A', paddingTop:8 }}>
          <div style={{ fontSize:10, color:'#7A8EAB' }}>Date Fulfilled</div>
          <div style={{ fontSize:11, color:'#18243A', fontWeight:600, marginTop:2 }}>{new Date().toLocaleDateString('en-GB')}</div>
        </div>
      </div>
    </div>
  )
}

export default function StoresDashboard({ profile }) {
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [printing, setPrinting] = useState(false)

  useEffect(() => { fetchReqs() }, [])

  async function fetchReqs() {
    setLoading(true)
    const { data } = await supabase
      .from('requisitions')
      .select('*, profiles(full_name, id, email), departments(name), req_items(*)')
      .in('status', ['approved', 'fulfilled'])
      .order('created_at', { ascending: false })
    if (data) setReqs(data)
    setLoading(false)
  }

  async function fulfill(req) {
    setActing(req.id)
    await supabase.from('requisitions').update({ status: 'fulfilled' }).eq('id', req.id)
    await supabase.from('approvals').insert({
      requisition_id: req.id, approver_id: profile.id,
      stage: 'stores', action: 'fulfilled'
    })
    if (req.profiles?.email) {
      const t = emailTemplates.fulfilled(req.profiles.full_name, req.req_number, req.purpose)
      await sendEmail({ to: req.profiles.email, ...t })
    }
    setSelected(null)
    await fetchReqs()
    setActing(null)
  }

  async function handlePrint(req) {
    setPrinting(true)
    setTimeout(async () => {
      const el = document.getElementById('print-view-stores')
      if (!el) return
      const canvas = await html2canvas(el, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const w = pdf.internal.pageSize.getWidth()
      const h = (canvas.height * w) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, w, h)
      pdf.save(`${req.req_number}-fulfillment.pdf`)
      setPrinting(false)
    }, 300)
  }

  return (
    <div style={{ padding:'28px 32px', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>Stores Dashboard</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:24 }}>Approved requisitions ready for fulfillment</div>

      {loading
        ? <div style={{ color:C.muted }}>Loading...</div>
        : reqs.length === 0
        ? <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
            padding:'40px', textAlign:'center', color:C.muted, fontSize:13 }}>
            No approved requisitions yet
          </div>
        : reqs.map(r => (
          <div key={r.id}>
            <div onClick={() => setSelected(selected?.id === r.id ? null : r)}
              style={{ background:C.card, border:`1px solid ${selected?.id === r.id ? C.primary : C.border}`,
                borderRadius:10, padding:'16px 20px', marginBottom: selected?.id === r.id ? 0 : 12,
                cursor:'pointer', borderBottomLeftRadius: selected?.id === r.id ? 0 : 10,
                borderBottomRightRadius: selected?.id === r.id ? 0 : 10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:11, color:C.primary, fontWeight:700, marginBottom:4 }}>{r.req_number}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:3 }}>{r.purpose}</div>
                  <div style={{ fontSize:11, color:C.muted }}>
                    {r.profiles?.full_name} · {r.req_items?.length} item(s)
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {r.status === 'fulfilled' &&
                    <span style={{ fontSize:11, color:'#15803D', fontWeight:700 }}>✓ Fulfilled</span>}
                  <div style={{ fontSize:11, color:C.muted }}>{selected?.id === r.id ? '▲' : '▼'}</div>
                </div>
              </div>
            </div>

            {selected?.id === r.id && (
              <div style={{ background:'#F8FAFC', border:`1px solid ${C.primary}`,
                borderTop:'none', borderRadius:'0 0 10px 10px', padding:'20px', marginBottom:12 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16 }}>
                  <thead>
                    <tr style={{ background:'#18243A' }}>
                      {['S/N','Item','Qty','Remarks'].map(h =>
                        <th key={h} style={{ padding:'8px 12px', fontSize:9, fontWeight:700,
                          color:'rgba(255,255,255,0.6)', textAlign:'left', textTransform:'uppercase' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {r.req_items?.map((item, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background:'#fff' }}>
                        <td style={{ padding:'8px 12px', fontSize:11, color:C.muted }}>{i+1}</td>
                        <td style={{ padding:'8px 12px', fontSize:12, color:C.text }}>{item.item_name}</td>
                        <td style={{ padding:'8px 12px', fontSize:12, color:C.text }}>{item.quantity}</td>
                        <td style={{ padding:'8px 12px', fontSize:11, color:C.muted }}>{item.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                  <button onClick={() => handlePrint(r)} disabled={printing}
                    style={{ padding:'7px 14px', background:'#F1F5F9', border:`1px solid ${C.border}`,
                      borderRadius:7, fontSize:11, fontWeight:700, color:C.text, cursor:'pointer' }}>
                    {printing ? 'Generating...' : '🖨 Print Receipt'}
                  </button>
                  {r.status === 'approved' && (
                    <button onClick={() => fulfill(r)} disabled={acting === r.id}
                      style={{ padding:'7px 16px', background:C.primary, border:'none', borderRadius:7,
                        fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer',
                        opacity: acting === r.id ? 0.6 : 1 }}>
                      {acting === r.id ? 'Processing...' : 'Mark Fulfilled'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      }

      {printing && selected && (
        <div style={{ position:'fixed', left:'-9999px', top:0 }}>
          <PrintView req={selected} approverName={profile.full_name} />
        </div>
      )}
    </div>
  )
}