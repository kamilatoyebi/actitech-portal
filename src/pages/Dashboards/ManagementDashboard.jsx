import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import RequestDetail from '../RequestDetail'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { Clock, TrendingUp, ClipboardList, CheckCircle, Eye } from 'lucide-react'

const STATUS = {
  submitted:         { l: 'Submitted',    c: 'var(--purple)',  bg: 'var(--purple-bg)' },
  hod_review:        { l: 'HOD Review',   c: 'var(--yellow)',  bg: 'var(--yellow-bg)' },
  management_review: { l: 'Mgmt Review',  c: 'var(--blue)',    bg: '#DBEAFE' },
  approved:          { l: 'Approved',     c: 'var(--green)',   bg: 'var(--green-bg)' },
  fulfilled:         { l: 'Fulfilled',    c: 'var(--teal)',    bg: 'var(--teal-bg)' },
  rejected:          { l: 'Rejected',     c: 'var(--red)',     bg: 'var(--red-bg)' },
}

function Pill({ status }) {
  const s = STATUS[status] || { l: status, c: 'var(--text-3)', bg: 'var(--surface-2)' }
  return <span className="pill" style={{ background: s.bg, color: s.c }}>{s.l}</span>
}

export default function ManagementDashboard({ profile, toast }) {
  const [reqs, setReqs] = useState([])
  const [allReqs, setAllReqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReqId, setSelectedReqId] = useState(null)
  const [tab, setTab] = useState('pending')

  useEffect(() => { fetchReqs() }, [])

  async function fetchReqs() {
    setLoading(true)
    const [{ data: pending }, { data: all }] = await Promise.all([
      supabase.from('requisitions')
        .select('*, profiles(full_name, id, email), departments(name), req_items(*)')
        .eq('status', 'management_review')
        .order('created_at', { ascending: false }),
      supabase.from('requisitions')
        .select('*, profiles(full_name, id, email), departments(name), req_items(*)')
        .in('status', ['approved', 'fulfilled', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(20)
    ])
    if (pending) setReqs(pending)
    if (all) setAllReqs(all)
    setLoading(false)
  }

  if (selectedReqId) return (
    <RequestDetail
      reqId={selectedReqId}
      profile={profile}
      onBack={() => { setSelectedReqId(null); fetchReqs() }}
    />
  )

  const displayed = tab === 'pending' ? reqs : allReqs

  const tabs = [
    { key: 'pending',  label: 'Pending Approval', count: reqs.length },
    { key: 'history',  label: 'Recent History',   count: allReqs.length },
  ]

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="page-header">
        <div className="page-title">Management Dashboard</div>
        <div className="page-sub">{profile.title || 'Management'} · Approval Queue</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Pending Approval',  val: reqs.length, icon: Clock,         color: 'var(--blue)' },
          { label: 'Urgent',            val: reqs.filter(r => r.priority === 'Urgent').length, icon: TrendingUp, color: 'var(--red)' },
          { label: 'Total Items',       val: reqs.reduce((a, r) => a + (r.req_items?.length || 0), 0), icon: ClipboardList, color: 'var(--green)' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{s.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} color={s.color} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{s.val}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? 'var(--blue)' : 'var(--text-3)', borderBottom: tab === t.key ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1, transition: 'all var(--t-fast)' }}>
            {t.label}
            {t.count > 0 && <span style={{ fontSize: 10, background: tab === t.key ? 'var(--blue)' : 'var(--surface-2)', color: tab === t.key ? '#fff' : 'var(--text-3)', padding: '1px 6px', borderRadius: 99, fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div>{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      ) : displayed.length === 0 ? (
        <div className="card empty-state">
          <CheckCircle size={36} color="var(--green)" style={{ opacity: 0.4 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>
            {tab === 'pending' ? 'No pending approvals' : 'No recent history'}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr><th>Ref No.</th><th>Purpose</th><th>Requester</th><th>Department</th><th>Items</th><th>Priority</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {displayed.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedReqId(r.id)}>
                  <td style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>{r.req_number}</td>
                  <td style={{ fontWeight: 500 }}>{r.purpose}</td>
                  <td style={{ color: 'var(--text-2)' }}>{r.profiles?.full_name}</td>
                  <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{r.departments?.name}</td>
                  <td style={{ color: 'var(--text-3)' }}>{r.req_items?.length}</td>
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