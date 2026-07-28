import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import RequestDetail from '../RequestDetail'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { Clock, AlertTriangle, Eye, Send } from 'lucide-react'

function Pill({ status }) {
  const labels = { outsourcing: 'Outsourcing', payment_review: 'Payment Review', completed: 'Completed' }
  return <span className="pill" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)' }}>{labels[status] || status}</span>
}

export default function AdminDashboard({ profile }) {
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReqId, setSelectedReqId] = useState(null)

  useEffect(() => { fetchReqs() }, [])

  async function fetchReqs() {
    setLoading(true)
    const { data } = await supabase.from('requisitions')
      .select('*, profiles(full_name, id, email), departments(name), req_items(*)')
      .eq('status', 'outsourcing')
      .order('created_at', { ascending: false })
    if (data) setReqs(data)
    setLoading(false)
  }

  if (selectedReqId) return <RequestDetail reqId={selectedReqId} profile={profile} onBack={() => { setSelectedReqId(null); fetchReqs() }} />

  const urgent = reqs.filter(r => r.priority === 'Urgent').length

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="page-header">
        <div className="page-title">Admin Dashboard</div>
        <div className="page-sub">Outsourcing queue</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Awaiting Outsourcing', val: reqs.length, icon: Clock, color: 'var(--yellow)' },
          { label: 'Urgent', val: urgent, icon: AlertTriangle, color: 'var(--red)' },
          { label: 'Items to Source', val: reqs.reduce((total, req) => total + (req.req_items?.length || 0), 0), icon: Send, color: 'var(--blue)' },
        ].map(stat => {
          const Icon = stat.icon
          return <div key={stat.label} className="stat-card"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}><span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{stat.label}</span><div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: stat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={15} color={stat.color} /></div></div><div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{stat.val}</div></div>
        })}
      </div>

      {loading ? <div>{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div> : reqs.length === 0 ? (
        <div className="card empty-state"><Send size={36} color="var(--blue)" style={{ opacity: 0.4 }} /><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>No requests awaiting outsourcing</div></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}><table className="table"><thead><tr><th>Ref No.</th><th>Purpose</th><th>Requester</th><th>Department</th><th>Items</th><th>Priority</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>
          {reqs.map(r => <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedReqId(r.id)}><td style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 12 }}>{r.req_number}</td><td style={{ fontWeight: 500 }}>{r.purpose}</td><td style={{ color: 'var(--text-2)' }}>{r.profiles?.full_name}</td><td style={{ color: 'var(--text-3)', fontSize: 12 }}>{r.departments?.name}</td><td style={{ color: 'var(--text-3)' }}>{r.req_items?.length}</td><td><span className="pill" style={{ background: r.priority === 'Urgent' ? 'var(--yellow-bg)' : 'var(--surface-2)', color: r.priority === 'Urgent' ? 'var(--yellow)' : 'var(--text-3)' }}>{r.priority}</span></td><td><Pill status={r.status} /></td><td style={{ color: 'var(--text-3)', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('en-GB')}</td><td><Eye size={14} color="var(--text-3)" /></td></tr>)}
        </tbody></table></div>
      )}
    </div>
  )
}
