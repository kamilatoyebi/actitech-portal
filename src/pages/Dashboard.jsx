import HODDashboard from './Dashboards/HODDashboard'
import ManagementDashboard from './Dashboards/ManagementDashboard'
import StoresDashboard from './Dashboards/StoresDashboard'
import StaffDashboard from './Dashboards/StaffDashboard'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import { sendEmail, emailTemplates } from '../lib/sendEmail'
import { useToast } from '../components/ui/Toast'
import { LogOut, Bell, Plus, Trash2 } from 'lucide-react'

const STATUS = {
  draft:             { l:'Draft',        c:'var(--text-3)',  bg:'var(--surface-2)' },
  submitted:         { l:'Submitted',    c:'var(--purple)',  bg:'var(--purple-bg)' },
  hod_review:        { l:'HOD Review',   c:'var(--yellow)',  bg:'var(--yellow-bg)' },
  management_review: { l:'Mgmt Review',  c:'var(--blue)',    bg:'#DBEAFE' },
  approved:          { l:'Approved',     c:'var(--green)',   bg:'var(--green-bg)' },
  fulfilled:         { l:'Fulfilled',    c:'var(--teal)',    bg:'var(--teal-bg)' },
  rejected:          { l:'Rejected',     c:'var(--red)',     bg:'var(--red-bg)' },
}

export function Pill({ status }) {
  const s = STATUS[status] || STATUS.draft
  return <span className="pill" style={{ background: s.bg, color: s.c }}>{s.l}</span>
}

function ComingSoon({ title }) {
  return (
    <div style={{ padding: '28px 32px' }}>
      <div className="page-header">
        <div className="page-title">{title}</div>
      </div>
      <div className="card empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>Coming Soon</div>
        <p>This section is being built and will be available shortly.</p>
      </div>
    </div>
  )
}

export default function Dashboard({ profile }) {
  const [page, setPage] = useState('dashboard')
  const toast = useToast()

  async function signOut() {
    await supabase.auth.signOut()
  }

  const canAccessOS = ['hod', 'management', 'admin'].includes(profile.role)

  const renderPage = () => {
    switch(page) {
      case 'new_request': return <NewRequest profile={profile} setPage={setPage} toast={toast} />
      case 'my_requests': return <MyRequests profile={profile} />
      case 'employees':   return canAccessOS ? <ComingSoon title="Employee Directory" /> : <StaffDashboard profile={profile} setPage={setPage} />
      case 'departments': return canAccessOS ? <ComingSoon title="Departments" /> : <StaffDashboard profile={profile} setPage={setPage} />
      case 'analytics':   return canAccessOS ? <ComingSoon title="Analytics" /> : <StaffDashboard profile={profile} setPage={setPage} />
      case 'admin':       return profile.role === 'admin' ? <ComingSoon title="Admin Panel" /> : <StaffDashboard profile={profile} setPage={setPage} />
      default:
        if (profile.role === 'hod') return <HODDashboard profile={profile} toast={toast} />
        if (profile.role === 'management') return <ManagementDashboard profile={profile} toast={toast} />
        if (profile.role === 'stores') return <StoresDashboard profile={profile} toast={toast} />
        return <StaffDashboard profile={profile} setPage={setPage} />
    }
  }

  const pageTitles = {
    dashboard: 'Dashboard', new_request: 'New Requisition', my_requests: 'My Requests',
    employees: 'Employee Directory', departments: 'Departments', analytics: 'Analytics', admin: 'Admin Panel'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar profile={profile} page={page} setPage={setPage} onSignOut={signOut} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ height: 54, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{pageTitles[page] || 'Dashboard'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {profile.role === 'staff' && (
              <button onClick={() => setPage('new_request')} className="btn btn-primary btn-sm">
                <Plus size={13} /> New Request
              </button>
            )}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{profile.full_name.split(' ')[0]}</div>
            <button onClick={signOut} className="btn btn-ghost btn-icon btn-sm" title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }} className="fade-in" key={page}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

function NewRequest({ profile, setPage, toast }) {
  const [items, setItems] = useState([{ item_name: '', quantity: 1, remarks: '' }])
  const [form, setForm] = useState({ purpose: '', purpose_type: 'Project/Job', priority: 'Normal', location: '', supervisor: '', comments: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const updateItem = (i, field, val) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))

  const removeItem = (i) =>
    setItems(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)

  async function submit() {
    if (!form.purpose || items[0].item_name === '') {
      setError('Please fill in the purpose and at least one item'); return
    }
    setLoading(true); setError('')

    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const year = String(new Date().getFullYear()).slice(-2)
    const rand = String(Math.floor(Math.random() * 900) + 100)
    const req_number = `Acti//${month}/${year}/${rand}`

    const { data: req, error: reqErr } = await supabase.from('requisitions').insert({
      req_number, requester_id: profile.id, department_id: profile.department_id,
      purpose: form.purpose, purpose_type: form.purpose_type, priority: form.priority,
      location: form.location, supervisor: form.supervisor, comments: form.comments,
      status: 'submitted'
    }).select().single()

    if (reqErr) { setError(reqErr.message); setLoading(false); return }

    await supabase.from('req_items').insert(
      items.filter(i => i.item_name).map(i => ({ ...i, requisition_id: req.id }))
    )

    const { data: hods } = await supabase.from('profiles').select('email, full_name')
      .eq('department_id', profile.department_id).eq('role', 'hod')

    if (hods && hods.length > 0 && hods[0].email) {
      const t = emailTemplates.submitted(profile.full_name, req_number, form.purpose, hods[0].full_name)
      await sendEmail({ to: hods[0].email, ...t })
    }

    toast('Requisition submitted successfully', 'success')
    setSuccess(true); setLoading(false)
  }

  const inp = 'input'
  const lbl = 'label'

  if (success) return (
    <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500 }}>
      <div style={{ textAlign: 'center' }} className="fade-in">
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 8 }}>Requisition Submitted</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 28 }}>Your HOD has been notified and will review shortly.</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setPage('my_requests')} className="btn btn-primary">View My Requests</button>
          <button onClick={() => { setSuccess(false); setForm({ purpose: '', purpose_type: 'Project/Job', priority: 'Normal', location: '', supervisor: '', comments: '' }); setItems([{ item_name: '', quantity: 1, remarks: '' }]) }} className="btn btn-secondary">New Request</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '28px 32px', maxWidth: 860 }}>
      <button onClick={() => setPage('dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>← Back to Dashboard</button>

      <div className="page-header">
        <div className="page-title">New Store Requisition</div>
        <div className="page-sub">Your HOD will be notified immediately on submission.</div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ background: 'var(--navy)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em' }}>STORE REQUISITION · ACTI-TECH LIMITED</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Reference auto-generated on submit</div>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div><label className={lbl}>Requester</label><input className={inp} value={profile.full_name} readOnly style={{ background: 'var(--surface-2)' }} /></div>
            <div><label className={lbl}>Department</label><input className={inp} value={profile.departments?.name || ''} readOnly style={{ background: 'var(--surface-2)' }} /></div>
            <div><label className={lbl}>Date</label><input className={inp} value={new Date().toLocaleDateString('en-GB')} readOnly style={{ background: 'var(--surface-2)' }} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div><label className={lbl}>Purpose *</label>
              <input className={inp} placeholder="e.g. MD's Residence — Cameras" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} /></div>
            <div><label className={lbl}>Location / Site</label>
              <input className={inp} placeholder="e.g. Olympia Estate, Kaura" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div><label className={lbl}>Project Supervisor</label>
              <input className={inp} placeholder="Supervisor name" value={form.supervisor} onChange={e => setForm(p => ({ ...p, supervisor: e.target.value }))} /></div>
            <div><label className={lbl}>Purpose Type</label>
              <select className={inp} value={form.purpose_type} onChange={e => setForm(p => ({ ...p, purpose_type: e.target.value }))}>
                <option>Project/Job</option><option>Office Use</option><option>Maintenance</option><option>Other</option>
              </select></div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>Priority:</span>
            {['Normal', 'Urgent'].map(p => (
              <button key={p} onClick={() => setForm(prev => ({ ...prev, priority: p }))}
                style={{ padding: '5px 16px', borderRadius: 99, border: `1.5px solid ${form.priority === p ? (p === 'Urgent' ? 'var(--yellow)' : 'var(--blue)') : 'var(--border)'}`, background: form.priority === p ? (p === 'Urgent' ? 'var(--yellow-bg)' : '#DBEAFE') : 'transparent', color: form.priority === p ? (p === 'Urgent' ? 'var(--yellow)' : 'var(--blue)') : 'var(--text-3)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--t-fast)' }}>
                {p}
              </button>
            ))}
          </div>

          {/* Items table */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label className={lbl}>Items Requested *</label>
              <button onClick={() => setItems(p => [...p, { item_name: '', quantity: 1, remarks: '' }])} className="btn btn-secondary btn-sm">
                <Plus size={12} /> Add Row
              </button>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr><th style={{ width: 36 }}>S/N</th><th>Item Description</th><th style={{ width: 80 }}>Qty</th><th>Remarks</th><th style={{ width: 40 }}></th></tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-3)', textAlign: 'center' }}>{i + 1}</td>
                      <td><input value={it.item_name} onChange={e => updateItem(i, 'item_name', e.target.value)} placeholder="Item description" className={inp} style={{ padding: '6px 8px' }} /></td>
                      <td><input type="number" value={it.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} className={inp} style={{ padding: '6px 8px' }} /></td>
                      <td><input value={it.remarks} onChange={e => updateItem(i, 'remarks', e.target.value)} placeholder="Notes" className={inp} style={{ padding: '6px 8px' }} /></td>
                      <td><button onClick={() => removeItem(i)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--text-3)' }}><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className={lbl}>Additional Comments</label>
            <textarea rows={3} value={form.comments} onChange={e => setForm(p => ({ ...p, comments: e.target.value }))} placeholder="Any extra context or special requirements..." className={inp} style={{ resize: 'vertical' }} />
          </div>

          {error && <div style={{ fontSize: 12, color: 'var(--red)', background: 'var(--red-bg)', padding: '10px 14px', borderRadius: 'var(--r)', borderLeft: '3px solid var(--red)', marginBottom: 16 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setPage('dashboard')} className="btn btn-secondary">Cancel</button>
            <button onClick={submit} disabled={loading} className="btn btn-primary">
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
      .then(({ data }) => { if (data) setReqs(data); setLoading(false) })
  }, [])

  return (
    <div style={{ padding: '28px 32px' }}>
      <div className="page-header">
        <div className="page-title">My Requests</div>
        <div className="page-sub">{reqs.length} total requisition{reqs.length !== 1 ? 's' : ''}</div>
      </div>

      {loading ? (
        <div>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: 18, marginBottom: 10 }}>
              <div className="skeleton" style={{ width: 120, height: 11, marginBottom: 10 }} />
              <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '35%', height: 11 }} />
            </div>
          ))}
        </div>
      ) : reqs.length === 0 ? (
        <div className="card empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)' }}>No requests yet</div>
          <p>Submit your first requisition using the New Request button above.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr><th>Ref No.</th><th>Purpose</th><th>Items</th><th>Priority</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {reqs.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>{r.req_number}</td>
                  <td style={{ fontWeight: 500 }}>{r.purpose}</td>
                  <td style={{ color: 'var(--text-3)' }}>{r.req_items?.length} item{r.req_items?.length !== 1 ? 's' : ''}</td>
                  <td><span className="pill" style={{ background: r.priority === 'Urgent' ? 'var(--yellow-bg)' : 'var(--surface-2)', color: r.priority === 'Urgent' ? 'var(--yellow)' : 'var(--text-3)' }}>{r.priority}</span></td>
                  <td><Pill status={r.status} /></td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}