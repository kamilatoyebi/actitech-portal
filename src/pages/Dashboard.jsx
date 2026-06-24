import HODDashboard from './Dashboards/HODDashboard'
import ManagementDashboard from './Dashboards/ManagementDashboard'
import StoresDashboard from './Dashboards/StoresDashboard'
import StaffDashboard from './Dashboards/StaffDashboard'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import { LogOut } from 'lucide-react'
import { sendEmail, emailTemplates } from '../lib/sendEmail'

const C = {
  primary: '#1565D8', light: '#3AACEE', dark: '#080F1A',
  navy: '#0C1A2E', bg: '#F2F5FB', card: '#FFFFFF',
  border: '#DDE5F0', text: '#18243A', muted: '#7A8EAB',
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
  return <span style={{ background:s.bg, color:s.c, padding:'3px 9px', borderRadius:20, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>{s.l}</span>
}

function ComingSoon({ title }) {
  return (
    <div style={{ padding:'28px 32px' }}>
      <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:8 }}>{title}</div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
        padding:'60px 24px', textAlign:'center', color:C.muted, fontSize:13 }}>
        This section is coming soon.
      </div>
    </div>
  )
}

export default function Dashboard({ profile }) {
  const [page, setPage] = useState('dashboard')

  async function signOut() {
    await supabase.auth.signOut()
  }

  const canAccessOS = ['hod', 'management', 'admin'].includes(profile.role)

  const renderPage = () => {
    switch(page) {
      case 'new_request': return <NewRequest profile={profile} setPage={setPage} />
      case 'my_requests': return <MyRequests profile={profile} setPage={setPage} />
      case 'employees':   return canAccessOS ? <ComingSoon title="Employee Directory" /> : <StaffDashboard profile={profile} setPage={setPage} />
      case 'departments': return canAccessOS ? <ComingSoon title="Departments" /> : <StaffDashboard profile={profile} setPage={setPage} />
      case 'analytics':   return canAccessOS ? <ComingSoon title="Analytics" /> : <StaffDashboard profile={profile} setPage={setPage} />
      case 'admin':       return profile.role === 'admin' ? <ComingSoon title="Admin Panel" /> : <StaffDashboard profile={profile} setPage={setPage} />
      default:
        if (profile.role === 'hod') return <HODDashboard profile={profile} />
        if (profile.role === 'management') return <ManagementDashboard profile={profile} />
        if (profile.role === 'stores') return <StoresDashboard profile={profile} />
        return <StaffDashboard profile={profile} setPage={setPage} />
    }
  }

  const pageTitle = () => {
    switch(page) {
      case 'new_request': return 'New Requisition'
      case 'my_requests': return 'My Requests'
      case 'employees': return 'Employee Directory'
      case 'departments': return 'Department Management'
      case 'analytics': return 'Analytics'
      case 'admin': return 'Admin Panel'
      default: return 'Dashboard'
    }
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.bg, fontFamily:'system-ui, sans-serif' }}>
      <Sidebar profile={profile} page={page} setPage={setPage} onSignOut={signOut} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ height:52, background:C.card, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', padding:'0 28px', gap:14, flexShrink:0, justifyContent:'space-between' }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{pageTitle()}</div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:C.primary+'20', border:`1.5px solid ${C.primary}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:C.primary }}>
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <button onClick={signOut}
              style={{ background:'transparent', border:'none', color:C.muted, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:12, padding:'4px 8px' }}
              title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

function NewRequest({ profile, setPage }) {
  const [items, setItems] = useState([{ item_name:'', quantity:1, remarks:'' }])
  const [form, setForm] = useState({ purpose:'', purpose_type:'Project/Job', priority:'Normal', location:'', supervisor:'', comments:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const updateItem = (i, field, val) => {
    setItems(prev => prev.map((it, idx) => idx === i ? {...it, [field]: val} : it))
  }

  async function submit() {
    if (!form.purpose || items[0].item_name === '') {
      setError('Please fill in the purpose and at least one item'); return
    }
    setLoading(true); setError('')

    const month = String(new Date().getMonth()+1).padStart(2,'0')
    const year  = String(new Date().getFullYear()).slice(-2)
    const rand  = String(Math.floor(Math.random()*900)+100)
    const req_number = `Acti//${month}/${year}/${rand}`

    const { data: req, error: reqErr } = await supabase
      .from('requisitions')
      .insert({
        req_number,
        requester_id: profile.id,
        department_id: profile.department_id,
        purpose: form.purpose,
        purpose_type: form.purpose_type,
        priority: form.priority,
        location: form.location,
        supervisor: form.supervisor,
        comments: form.comments,
        status: 'submitted'
      })
      .select()
      .single()

    if (reqErr) { setError(reqErr.message); setLoading(false); return }

    await supabase.from('req_items').insert(
      items.filter(i => i.item_name).map(i => ({ ...i, requisition_id: req.id }))
    )

    // Notify HOD by email
    const { data: hods } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('department_id', profile.department_id)
      .eq('role', 'hod')

    if (hods && hods.length > 0 && hods[0].email) {
      const t = emailTemplates.submitted(
        profile.full_name,
        req_number,
        form.purpose,
        hods[0].full_name
      )
      await sendEmail({ to: hods[0].email, ...t })
    }

    setSuccess(true); setLoading(false)
  }

  const inp = { width:'100%', padding:'9px 12px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, color:C.text, boxSizing:'border-box', fontFamily:'system-ui,sans-serif', outline:'none' }
  const lbl = { fontSize:9, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:5 }

  if (success) return (
    <div style={{ padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
        <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:8 }}>Requisition Submitted</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:24 }}>Your HOD has been notified and will review shortly.</div>
        <button onClick={() => setPage('my_requests')} style={{ background:C.primary, color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
          View My Requests →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'28px 32px', maxWidth:820 }}>
      <button onClick={() => setPage('dashboard')} style={{ background:'none', border:'none', color:C.muted, fontSize:11, cursor:'pointer', padding:0, marginBottom:12 }}>← Back</button>
      <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:4 }}>New Store Requisition</div>
      <div style={{ fontSize:12, color:C.muted, marginBottom:22 }}>Your HOD will be notified immediately on submission.</div>

      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
        <div style={{ background:'#18243A', padding:'14px 24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ color:'#fff', fontWeight:700, fontSize:12, letterSpacing:'0.05em' }}>STORE REQUISITION · ACTI-TECH LIMITED</div>
          <div style={{ fontSize:10, color:'#5A7A9A' }}>Ref: Auto-generated</div>
        </div>
        <div style={{ padding:'24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:16 }}>
            <div><label style={lbl}>Requester</label><input style={{...inp, background:'#F8FAFC'}} value={profile.full_name} readOnly/></div>
            <div><label style={lbl}>Department</label><input style={{...inp, background:'#F8FAFC'}} value={profile.departments?.name || ''} readOnly/></div>
            <div><label style={lbl}>Date</label><input style={{...inp, background:'#F8FAFC'}} value={new Date().toLocaleDateString('en-GB')} readOnly/></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <div><label style={lbl}>Purpose</label>
              <input style={inp} placeholder="e.g. MD's Residence — Cameras" value={form.purpose} onChange={e => setForm(p => ({...p, purpose: e.target.value}))}/>
            </div>
            <div><label style={lbl}>Location / Site</label>
              <input style={inp} placeholder="e.g. Olympia Estate, Kaura Abuja" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))}/>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <div><label style={lbl}>Project Supervisor</label>
              <input style={inp} placeholder="Supervisor name" value={form.supervisor} onChange={e => setForm(p => ({...p, supervisor: e.target.value}))}/>
            </div>
            <div><label style={lbl}>Purpose Type</label>
              <select style={inp} value={form.purpose_type} onChange={e => setForm(p => ({...p, purpose_type: e.target.value}))}>
                <option>Project/Job</option><option>Office Use</option><option>Maintenance</option><option>Other</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <span style={{ fontSize:11, fontWeight:600, color:C.text }}>Priority:</span>
            {['Normal','Urgent'].map(p => (
              <button key={p} onClick={() => setForm(prev => ({...prev, priority: p}))}
                style={{ padding:'5px 14px', borderRadius:20, border:`1.5px solid ${form.priority===p ? (p==='Urgent'?'#D97706':C.primary) : C.border}`, background:'transparent', color: form.priority===p ? (p==='Urgent'?'#D97706':C.primary) : C.muted, fontSize:11, fontWeight:600, cursor:'pointer' }}>
                {p}
              </button>
            ))}
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <label style={lbl}>Items Requested</label>
              <button onClick={() => setItems(p => [...p, {item_name:'', quantity:1, remarks:''}])}
                style={{ background:C.primary+'15', border:`1px solid ${C.primary}30`, color:C.primary, borderRadius:6, padding:'4px 10px', fontSize:10, fontWeight:700, cursor:'pointer' }}>
                + Add Row
              </button>
            </div>
            <div style={{ border:`1px solid ${C.border}`, borderRadius:8, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#18243A' }}>
                    {['S/N','Item Description','Qty','Remarks'].map(h =>
                      <th key={h} style={{ padding:'8px 12px', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.5)', textAlign:'left', letterSpacing:'0.07em', textTransform:'uppercase' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: i < items.length-1 ? `1px solid ${C.border}` : 'none' }}>
                      <td style={{ padding:'6px 12px', fontSize:11, color:C.muted, width:36 }}>{i+1}</td>
                      <td style={{ padding:'4px 6px' }}><input value={it.item_name} onChange={e => updateItem(i,'item_name',e.target.value)} placeholder="Item description" style={{...inp, padding:'6px 8px'}}/></td>
                      <td style={{ padding:'4px 6px', width:70 }}><input type="number" value={it.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} style={{...inp, padding:'6px 8px'}}/></td>
                      <td style={{ padding:'4px 6px' }}><input value={it.remarks} onChange={e => updateItem(i,'remarks',e.target.value)} placeholder="Notes" style={{...inp, padding:'6px 8px'}}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Additional Comments</label>
            <textarea rows={3} value={form.comments} onChange={e => setForm(p => ({...p, comments: e.target.value}))} placeholder="Any extra context..." style={{...inp, resize:'vertical'}}/>
          </div>
          {error && <div style={{ fontSize:11, color:'#DC2626', marginBottom:12 }}>{error}</div>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => setPage('dashboard')} style={{ padding:'9px 18px', border:`1px solid ${C.border}`, borderRadius:8, background:'#fff', fontSize:12, color:C.muted, cursor:'pointer' }}>Cancel</button>
            <button onClick={submit} disabled={loading} style={{ padding:'9px 22px', border:'none', borderRadius:8, background:C.primary, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
              {loading ? 'Submitting...' : '→ Submit Requisition'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MyRequests({ profile }) {
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('requisitions')
      .select('*, req_items(*)')
      .eq('requester_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if(data) setReqs(data); setLoading(false) })
  }, [])

  return (
    <div style={{ padding:'28px 32px' }}>
      <div style={{ fontSize:20, fontWeight:800, color:C.text, marginBottom:20 }}>My Requests</div>
      {loading ? <div style={{ color:C.muted, fontSize:13 }}>Loading...</div> :
       reqs.length === 0 ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:'40px 24px', textAlign:'center', color:C.muted, fontSize:13 }}>
          No requests yet
        </div>
       ) : (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#18243A' }}>
                {['Req No.','Purpose','Items','Priority','Status','Date'].map(h =>
                  <th key={h} style={{ padding:'10px 14px', fontSize:9, fontWeight:700, color:'rgba(255,255,255,0.5)', textAlign:'left', letterSpacing:'0.07em', textTransform:'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {reqs.map((r,i) => (
                <tr key={r.id} style={{ borderBottom: i < reqs.length-1 ? `1px solid ${C.border}` : 'none' }}>
                  <td style={{ padding:'11px 14px', fontSize:11, fontWeight:700, color:C.primary }}>{r.req_number}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:C.text }}>{r.purpose}</td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:C.muted }}>{r.req_items?.length} item{r.req_items?.length !== 1 ? 's':''}</td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ background: r.priority==='Urgent'?'#FEF3C7':'#F1F5F9', color: r.priority==='Urgent'?'#B45309':'#7A8EAB', padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700 }}>{r.priority}</span>
                  </td>
                  <td style={{ padding:'11px 14px' }}><Pill status={r.status}/></td>
                  <td style={{ padding:'11px 14px', fontSize:11, color:C.muted }}>{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
       )}
    </div>
  )
}