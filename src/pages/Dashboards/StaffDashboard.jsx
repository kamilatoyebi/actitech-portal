import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import RequestDetail from '../RequestDetail'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { FileText, Clock, CheckCircle, Package, Plus, ArrowRight, Eye } from 'lucide-react'

const STATUS = {
  draft:             { l: 'Draft',        c: 'var(--text-3)',  bg: 'var(--surface-2)' },
  submitted:         { l: 'Submitted',    c: 'var(--purple)',  bg: 'var(--purple-bg)' },
  hod_review:        { l: 'HOD Review',   c: 'var(--yellow)',  bg: 'var(--yellow-bg)' },
  management_review: { l: 'Mgmt Review',  c: 'var(--blue)',    bg: '#DBEAFE' },
  approved:          { l: 'Approved',     c: 'var(--green)',   bg: 'var(--green-bg)' },
  fulfilled:         { l: 'Fulfilled',    c: 'var(--teal)',    bg: 'var(--teal-bg)' },
  rejected:          { l: 'Rejected',     c: 'var(--red)',     bg: 'var(--red-bg)' },
}

function Pill({ status }) {
  const s = STATUS[status] || STATUS.draft
  return <span className="pill" style={{ background: s.bg, color: s.c }}>{s.l}</span>
}

export default function StaffDashboard({ profile, setPage }) {
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReqId, setSelectedReqId] = useState(null)

  useEffect(() => { fetchReqs() }, [])

  async function fetchReqs() {
    setLoading(true)
    const { data } = await supabase.from('requisitions')
      .select('*, req_items(*)')
      .eq('requester_id', profile.id)
      .order('created_at', { ascending: false })
    if (data) setReqs(data)
    setLoading(false)
  }

  if (selectedReqId) return (
    <RequestDetail
      reqId={selectedReqId}
      profile={profile}
      onBack={() => { setSelectedReqId(null); fetchReqs() }}
    />
  )

  const total     = reqs.length
  const pending   = reqs.filter(r => ['submitted','hod_review','management_review'].includes(r.status)).length
  const approved  = reqs.filter(r => r.status === 'approved').length
  const fulfilled = reqs.filter(r => r.status === 'fulfilled').length

  const stats = [
    { label: 'Total Requests', val: total,     icon: FileText,    color: 'var(--blue)' },
    { label: 'In Progress',    val: pending,   icon: Clock,       color: 'var(--yellow)' },
    { label: 'Approved',       val: approved,  icon: CheckCircle, color: 'var(--green)' },
    { label: 'Fulfilled',      val: fulfilled, icon: Package,     color: 'var(--teal)' },
  ]

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>
          Good day, {profile.full_name.split(' ')[0]} 👋
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {profile.departments?.name} · {profile.title || 'Staff'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color={s.color} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{s.val}</div>
            </div>
          )
        })}
      </div>

      <div style={{ background: 'var(--navy)', borderRadius: 'var(--r-lg)', padding: '22px 28px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Need something from the store?</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Submit a requisition — your HOD is notified instantly</div>
        </div>
        <button onClick={() => setPage('new_request')} className="btn btn-primary">
          <Plus size={14} /> New Requisition
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>My Requests</div>
        {reqs.length > 0 && (
          <button onClick={() => setPage('my_requests')} className="btn btn-ghost btn-sm">
            View all <ArrowRight size={12} />
          </button>
        )}
      </div>

      {loading ? (
        <div>{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : reqs.length === 0 ? (
        <div className="card empty-state">
          <FileText size={40} style={{ opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>No requests yet</div>
          <p>Submit your first requisition using the button above.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr><th>Ref No.</th><th>Purpose</th><th>Items</th><th>Priority</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {reqs.slice(0, 8).map(r => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedReqId(r.id)}>
                  <td style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>{r.req_number}</td>
                  <td style={{ fontWeight: 500 }}>{r.purpose}</td>
                  <td style={{ color: 'var(--text-3)' }}>{r.req_items?.length} item{r.req_items?.length !== 1 ? 's' : ''}</td>
                  <td><span className="pill" style={{ background: r.priority === 'Urgent' ? 'var(--yellow-bg)' : 'var(--surface-2)', color: r.priority === 'Urgent' ? 'var(--yellow)' : 'var(--text-3)' }}>{r.priority}</span></td>
                  <td><Pill status={r.status} /></td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('en-GB')}</td>
                  <td><Eye size={14} color="var(--text-3)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}