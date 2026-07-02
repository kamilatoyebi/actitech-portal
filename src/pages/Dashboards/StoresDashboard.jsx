import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import RequestDetail from '../RequestDetail'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { Package, Clock, CheckCircle, Eye } from 'lucide-react'

const STATUS = {
  approved:  { l: 'Approved',   c: 'var(--green)', bg: 'var(--green-bg)' },
  fulfilled: { l: 'Fulfilled',  c: 'var(--teal)',  bg: 'var(--teal-bg)' },
}

function Pill({ status }) {
  const s = STATUS[status] || { l: status, c: 'var(--text-3)', bg: 'var(--surface-2)' }
  return <span className="pill" style={{ background: s.bg, color: s.c }}>{s.l}</span>
}

export default function StoresDashboard({ profile, toast }) {
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReqId, setSelectedReqId] = useState(null)
  const [tab, setTab] = useState('pending')

  useEffect(() => { fetchReqs() }, [])

  async function fetchReqs() {
    setLoading(true)
    const { data } = await supabase.from('requisitions')
      .select('*, profiles(full_name, id, email), departments(name), req_items(*)')
      .in('status', ['approved', 'fulfilled'])
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

  const pending   = reqs.filter(r => r.status === 'approved')
  const fulfilled = reqs.filter(r => r.status === 'fulfilled')
  const displayed = tab === 'pending' ? pending : fulfilled

  const tabs = [
    { key: 'pending',   label: 'Awaiting Fulfillment', count: pending.length },
    { key: 'fulfilled', label: 'Fulfilled',             count: fulfilled.length },
  ]

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="page-header">
        <div className="page-title">Stores Dashboard</div>
        <div className="page-sub">Stock issuance and fulfillment</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Awaiting Fulfillment', val: pending.length,    icon: Clock,         color: 'var(--yellow)' },
          { label: 'Fulfilled',            val: fulfilled.length,  icon: CheckCircle,   color: 'var(--green)' },
          { label: 'Total Items Out',      val: fulfilled.reduce((a, r) => a + (r.req_items?.length || 0), 0), icon: Package, color: 'var(--blue)' },
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
          <Package size={36} style={{ opacity: 0.3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>
            {tab === 'pending' ? 'No requests awaiting fulfillment' : 'No fulfilled requests yet'}
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