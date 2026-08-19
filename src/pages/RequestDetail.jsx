import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { sendEmail, emailTemplates } from '../lib/sendEmail'
import { useToast } from '../components/ui/Toast'
import { ConfirmModal } from '../components/ui/Modal'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import {
  ArrowLeft, Clock, CheckCircle, XCircle, RotateCcw,
  Printer, Send, Package, ChevronDown, ChevronUp,
  User, Calendar, MapPin, Tag, MessageSquare, Activity,
  AlertTriangle, FileText, Building2
} from 'lucide-react'

const STATUS = {
  draft:             { l: 'Draft',         c: 'var(--text-3)',  bg: 'var(--surface-2)' },
  submitted:         { l: 'Submitted',     c: 'var(--purple)',  bg: 'var(--purple-bg)' },
  revision_required: { l: 'Revision Required', c: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  hod_review:        { l: 'HOD Review',    c: 'var(--yellow)',  bg: 'var(--yellow-bg)' },
  management_review: { l: 'Mgmt Review',   c: 'var(--blue)',    bg: '#DBEAFE' },
  approved:          { l: 'Approved',      c: 'var(--green)',   bg: 'var(--green-bg)' },
  fulfilled:         { l: 'Fulfilled',     c: 'var(--teal)',    bg: 'var(--teal-bg)' },
  outsourcing:       { l: 'Outsourcing',   c: 'var(--yellow)',  bg: 'var(--yellow-bg)' },
  payment_review:    { l: 'Payment Review', c: 'var(--blue)',   bg: '#DBEAFE' },
  completed:         { l: 'Completed',     c: 'var(--green)',   bg: 'var(--green-bg)' },
  rejected:          { l: 'Rejected',      c: 'var(--red)',     bg: 'var(--red-bg)' },
}

function Pill({ status }) {
  const s = STATUS[status] || STATUS.draft
  return (
    <span className="pill" style={{ background: s.bg, color: s.c, fontSize: 11, padding: '4px 10px' }}>
      {s.l}
    </span>
  )
}

function TimelineEvent({ event }) {
  const icons = {
    submitted:         <FileText size={14} color="var(--purple)" />,
    hod_approved:      <CheckCircle size={14} color="var(--green)" />,
    hod_rejected:      <XCircle size={14} color="var(--red)" />,
    management_approved: <CheckCircle size={14} color="var(--green)" />,
    management_rejected: <XCircle size={14} color="var(--red)" />,
    management_resubmit: <RotateCcw size={14} color="var(--yellow)" />,
    hod_returned_for_revision: <RotateCcw size={14} color="var(--yellow)" />,
    staff_resubmitted: <Send size={14} color="var(--purple)" />,
    fulfilled:         <Package size={14} color="var(--teal)" />,
    stores_unavailable: <AlertTriangle size={14} color="var(--yellow)" />,
    admin_forwarded_to_accounts: <Send size={14} color="var(--blue)" />,
    accounts_payment_approved: <CheckCircle size={14} color="var(--green)" />,
    accounts_payment_rejected: <RotateCcw size={14} color="var(--yellow)" />,
    resubmit:          <RotateCcw size={14} color="var(--yellow)" />,
    approved:          <CheckCircle size={14} color="var(--green)" />,
    rejected:          <XCircle size={14} color="var(--red)" />,
  }

  const labels = {
    submitted:           'Submitted by requester',
    hod_approved:        'Authorized by HOD',
    hod_rejected:        'Rejected by HOD',
    management_approved: 'Approved by Management',
    management_rejected: 'Rejected by Management',
    management_resubmit: 'Returned to HOD by Management',
    hod_returned_for_revision: 'Returned to requester for revision',
    staff_resubmitted: 'Revised and resubmitted to HOD',
    fulfilled:           'Fulfilled by Stores',
    stores_unavailable:  'Items marked unavailable — sent for outsourcing',
    admin_forwarded_to_accounts: 'Outsourcing details forwarded to Accounts',
    accounts_payment_approved: 'Payment approved — request completed',
    accounts_payment_rejected: 'Payment returned to Admin for review',
    resubmit:            'Returned for revision',
    approved:            'Approved',
    rejected:            'Rejected',
  }

  const key = `${event.stage}_${event.action}`
  const label = labels[key] || labels[event.action] || `${event.action} at ${event.stage}`

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        {icons[key] || icons[event.action] || <Activity size={14} color="var(--text-3)" />}
      </div>
      <div style={{ flex: 1, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{label}</div>
        {event.profiles?.full_name && (
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: event.comment ? 6 : 0 }}>
            by {event.profiles.full_name}
          </div>
        )}
        {event.comment && (
          <div style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 'var(--r)', borderLeft: '3px solid var(--border)', marginTop: 6 }}>
            "{event.comment}"
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
          {new Date(event.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

function CommentThread({ requisitionId, profile }) {
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    let active = true

    fetchComments()

    const channel = supabase
      .channel(`comments:${requisitionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `requisition_id=eq.${requisitionId}`,
      }, () => {
        if (active) fetchComments(false)
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [requisitionId])

  async function fetchComments(scrollToLatest = true) {
    setLoading(true)
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name, role)')
      .eq('requisition_id', requisitionId)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
    setLoading(false)
    if (scrollToLatest) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function sendComment() {
    if (!content.trim()) return
    setSending(true)
    await supabase.from('comments').insert({
      requisition_id: requisitionId,
      author_id: profile.id,
      content: content.trim()
    })
    setContent('')
    await fetchComments()
    setSending(false)
  }

  const roleColors = {
    staff:      { bg: 'var(--surface-2)', border: 'var(--border)' },
    hod:        { bg: '#EFF6FF', border: '#BFDBFE' },
    management: { bg: '#F0FDF4', border: '#BBF7D0' },
    stores:     { bg: '#FFF7ED', border: '#FED7AA' },
  }

  const roleLabels = {
    staff: 'Staff', hod: 'HOD', management: 'Management', stores: 'Stores'
  }

  return (
    <div>
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
          <MessageSquare size={24} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
          No comments yet. Start the conversation.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {comments.map(c => {
            const isOwn = c.author_id === profile.id
            const colors = roleColors[c.profiles?.role] || roleColors.staff
            return (
              <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '80%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{c.profiles?.full_name}</span>
                    <span className="pill" style={{ background: colors.bg, color: 'var(--text-2)', border: `1px solid ${colors.border}`, fontSize: 9 }}>{roleLabels[c.profiles?.role] || c.profiles?.role}</span>
                  </div>
                  <div style={{ background: isOwn ? 'var(--blue)' : 'var(--surface)', border: `1px solid ${isOwn ? 'var(--blue)' : 'var(--border)'}`, color: isOwn ? '#fff' : 'var(--text-1)', padding: '10px 14px', borderRadius: isOwn ? '12px 12px 2px 12px' : '12px 12px 12px 2px', fontSize: 13, lineHeight: 1.6 }}>
                    {c.content}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3, textAlign: isOwn ? 'right' : 'left' }}>
                    {new Date(c.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment() } }}
          placeholder="Write a comment... (Enter to send, Shift+Enter for new line)"
          className="input"
          rows={2}
          style={{ flex: 1, resize: 'none', fontSize: 13 }}
        />
        <button onClick={sendComment} disabled={sending || !content.trim()} className="btn btn-primary" style={{ flexShrink: 0 }}>
          <Send size={14} /> {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

function PrintView({ req, profile, id }) {
  return (
    <div id={id} style={{ padding: 40, fontFamily: 'Inter, system-ui, sans-serif', background: '#fff', width: 740 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 20, borderBottom: '2px solid #0D1B2E' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/new_logo_trans.png" alt="" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0D1B2E' }}>ACTI-TECH LIMITED</div>
            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Store Requisition Form</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: '#94A3B8' }}>Reference Number</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1A56DB', marginTop: 2 }}>{req.req_number}</div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>{new Date(req.created_at).toLocaleDateString('en-GB')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[
          ['Requested By', req.profiles?.full_name],
          ['Department', req.departments?.name],
          ['Date Submitted', new Date(req.created_at).toLocaleDateString('en-GB')],
          ['Purpose', req.purpose],
          ['Location', req.location || '—'],
          ['Priority', req.priority],
          ['Supervisor', req.supervisor || '—'],
          ['Purpose Type', req.purpose_type],
          ['Status', STATUS[req.status]?.l || req.status],
        ].map(([label, value]) => (
          <div key={label}>
            <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28 }}>
        <thead>
          <tr style={{ background: '#0D1B2E' }}>
            {['S/N', 'Item Description', 'Quantity', 'Remarks'].map(h =>
              <th key={h} style={{ padding: '9px 14px', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {req.req_items?.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
              <td style={{ padding: '9px 14px', fontSize: 12, color: '#94A3B8' }}>{i + 1}</td>
              <td style={{ padding: '9px 14px', fontSize: 13, color: '#0F172A', fontWeight: 500 }}>{item.item_name}</td>
              <td style={{ padding: '9px 14px', fontSize: 13, color: '#0F172A' }}>{item.quantity}</td>
              <td style={{ padding: '9px 14px', fontSize: 12, color: '#94A3B8' }}>{item.remarks || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {req.comments && (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', marginBottom: 28 }}>
          <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Additional Comments</div>
          <div style={{ fontSize: 13, color: '#0F172A' }}>{req.comments}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, marginTop: 40 }}>
        {[
          ['Requested By', req.profiles?.full_name],
          ['Printed By', profile.full_name],
          ['Date Printed', new Date().toLocaleDateString('en-GB')],
        ].map(([label, value]) => (
          <div key={label} style={{ borderTop: '1.5px solid #0D1B2E', paddingTop: 10 }}>
            <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 20 }}>{label}</div>
            <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 600 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RequestDetail({ reqId, profile, onBack }) {
  const [req, setReq] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [printing, setPrinting] = useState(false)
  const [actionComment, setActionComment] = useState('')
  const [showCommentForAction, setShowCommentForAction] = useState(null)
  const [outsourcingItems, setOutsourcingItems] = useState([])
  const [paymentReference, setPaymentReference] = useState('')
  const [editingRevision, setEditingRevision] = useState(false)
  const [revisionDraft, setRevisionDraft] = useState(null)
  const [editingHodRequest, setEditingHodRequest] = useState(false)
  const [hodDraft, setHodDraft] = useState(null)
  const [savingEdits, setSavingEdits] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const toast = useToast()

  useEffect(() => { fetchAll() }, [reqId])

  async function fetchAll() {
    setLoading(true)
    const [{ data: reqData }, { data: timelineData }] = await Promise.all([
      supabase.from('requisitions')
        .select('*, profiles(full_name, id, email, role), departments(name), req_items(*)')
        .eq('id', reqId)
        .single(),
      supabase.from('approvals')
        .select('*, profiles(full_name, role)')
        .eq('requisition_id', reqId)
        .order('created_at', { ascending: true })
    ])
    if (reqData) {
      setReq(reqData)
      setOutsourcingItems(reqData.req_items?.map(item => ({
        id: item.id,
        outsourcing_vendor: item.outsourcing_vendor || '',
        outsourcing_cost: item.outsourcing_cost ?? '',
        outsourcing_reason: item.outsourcing_reason || '',
        outsourcing_notes: item.outsourcing_notes || '',
      })) || [])
      setRevisionDraft({
        purpose: reqData.purpose || '',
        location: reqData.location || '',
        priority: reqData.priority || 'Normal',
        items: reqData.req_items?.map(item => ({ id: item.id, item_name: item.item_name, quantity: item.quantity, remarks: item.remarks || '' })) || [],
      })
      setHodDraft({
        purpose: reqData.purpose || '',
        location: reqData.location || '',
        priority: reqData.priority || 'Normal',
        items: reqData.req_items?.map(item => ({ id: item.id, item_name: item.item_name, quantity: item.quantity, remarks: item.remarks || '' })) || [],
      })
    }
    if (timelineData) setTimeline(timelineData)
    setLoading(false)
  }

  async function takeAction(action, comment = '', reference = '') {
    setActing(true)
    const statusMap = {
      hod_authorize:          'management_review',
      hod_reject:             'rejected',
      hod_return:             'revision_required',
      staff_resubmit:         'submitted',
      management_approve:     'approved',
      management_reject:      'rejected',
      management_return:      'submitted',
      stores_fulfill:         'fulfilled',
      stores_return:          'outsourcing',
      admin_forward_accounts: 'payment_review',
      accounts_approve_payment: 'completed',
      accounts_reject_payment: 'outsourcing',
    }

    const stageMap = {
      hod_authorize: 'hod', hod_reject: 'hod', hod_return: 'hod',
      staff_resubmit: 'staff',
      management_approve: 'management', management_reject: 'management', management_return: 'management',
      stores_fulfill: 'stores', stores_return: 'stores',
      admin_forward_accounts: 'admin',
      accounts_approve_payment: 'accounts', accounts_reject_payment: 'accounts',
    }

    const actionLabelMap = {
      hod_authorize: 'approved', hod_reject: 'rejected', hod_return: 'returned_for_revision',
      staff_resubmit: 'resubmitted',
      management_approve: 'approved', management_reject: 'rejected', management_return: 'resubmit',
      stores_fulfill: 'fulfilled', stores_return: 'unavailable',
      admin_forward_accounts: 'forwarded_to_accounts',
      accounts_approve_payment: 'payment_approved', accounts_reject_payment: 'payment_rejected',
    }

    const newStatus = statusMap[action]
    const stage = stageMap[action]
    const actionLabel = actionLabelMap[action]

    if (action === 'staff_resubmit') {
      const draft = revisionDraft
      if (!draft?.purpose.trim() || draft.items.some(item => !item.item_name.trim() || Number(item.quantity) < 1)) {
        toast('Add a purpose and a valid name and quantity for every item', 'error'); setActing(false); return
      }
      const { error: requestError } = await supabase.from('requisitions').update({
        purpose: draft.purpose.trim(), location: draft.location.trim(), priority: draft.priority,
      }).eq('id', reqId)
      if (requestError) { toast(requestError.message, 'error'); setActing(false); return }
      const itemResults = await Promise.all(draft.items.map(item => supabase.from('req_items').update({
        item_name: item.item_name.trim(), quantity: Number(item.quantity), remarks: item.remarks.trim() || null,
      }).eq('id', item.id)))
      const itemError = itemResults.find(result => result.error)?.error
      if (itemError) { toast(itemError.message, 'error'); setActing(false); return }
    }

    if (action === 'admin_forward_accounts') {
      const results = await Promise.all(outsourcingItems.map(item =>
        supabase.from('req_items').update({
          outsourcing_vendor: item.outsourcing_vendor || null,
          outsourcing_cost: item.outsourcing_cost === '' ? null : Number(item.outsourcing_cost),
          outsourcing_reason: item.outsourcing_reason || null,
          outsourcing_notes: item.outsourcing_notes || null,
        }).eq('id', item.id)
      ))
      const error = results.find(result => result.error)?.error
      if (error) { toast(error.message, 'error'); setActing(false); return }
    }

    if (action === 'accounts_approve_payment') {
      const results = await Promise.all(req.req_items.map(item =>
        supabase.from('req_items').update({ payment_reference: reference }).eq('id', item.id)
      ))
      const error = results.find(result => result.error)?.error
      if (error) { toast(error.message, 'error'); setActing(false); return }
    }

    const { error: statusError } = await supabase.from('requisitions').update({ status: newStatus }).eq('id', reqId)
    if (statusError) { toast(statusError.message, 'error'); setActing(false); return }
    const { error: approvalError } = await supabase.from('approvals').insert({
      requisition_id: reqId,
      approver_id: profile.id,
      stage,
      action: actionLabel,
      comment: comment || null,
    })
    if (approvalError) { toast(approvalError.message, 'error'); setActing(false); return }

    // Emails
    if (action === 'hod_authorize') {
      const { data: mgmt } = await supabase.from('profiles').select('email, full_name').eq('role', 'management')
      if (mgmt?.[0]?.email) {
        const t = emailTemplates.submitted(req.profiles?.full_name, req.req_number, req.purpose, mgmt[0].full_name)
        await sendEmail({ to: mgmt[0].email, ...t })
      }
      toast('Authorized and forwarded to management', 'success')
    } else if (action === 'management_approve') {
      if (req.profiles?.email) {
        const t = emailTemplates.approved(req.profiles.full_name, req.req_number, req.purpose)
        await sendEmail({ to: req.profiles.email, ...t })
      }
      toast('Approved and sent to stores', 'success')
    } else if (action === 'stores_fulfill') {
      if (req.profiles?.email) {
        const t = emailTemplates.fulfilled(req.profiles.full_name, req.req_number, req.purpose)
        await sendEmail({ to: req.profiles.email, ...t })
      }
      toast('Marked as fulfilled — requester notified', 'success')
    } else if (action === 'stores_return') {
      toast('Marked unavailable and sent to Admin for outsourcing', 'warning')
    } else if (action === 'hod_return') {
      if (req.profiles?.email) {
        const t = emailTemplates.revisionRequired(req.profiles.full_name, req.req_number, req.purpose, comment, reqId)
        await sendEmail({ to: req.profiles.email, ...t })
      }
      toast('Returned for revision — requester notified', 'warning')
    } else if (action === 'staff_resubmit') {
      toast('Requisition revised and resubmitted to your HOD', 'success')
    } else if (action === 'admin_forward_accounts') {
      toast('Outsourcing details saved and sent to Accounts', 'success')
    } else if (action === 'accounts_approve_payment') {
      toast('Payment approved — request completed', 'success')
    } else if (action === 'accounts_reject_payment') {
      toast('Payment returned to Admin for review', 'warning')
    } else if (action.includes('reject')) {
      if (req.profiles?.email) {
        const t = emailTemplates.rejected(req.profiles.full_name, req.req_number, req.purpose, stage)
        await sendEmail({ to: req.profiles.email, ...t })
      }
      toast('Rejected — requester notified', 'info')
    } else if (action.includes('return')) {
      toast('Returned for revision', 'warning')
    }

    setActionComment('')
    setEditingRevision(false)
    setPaymentReference('')
    setShowCommentForAction(null)
    setConfirm(null)
    await fetchAll()
    setActing(false)
  }

  async function saveHodEdits() {
    if (!hodDraft?.purpose.trim() || hodDraft.items.some(item => !item.item_name.trim() || Number(item.quantity) < 1)) {
      toast('Add a purpose and a valid name and quantity for every item', 'error'); return
    }

    setSavingEdits(true)
    const { error: requestError } = await supabase.from('requisitions').update({
      purpose: hodDraft.purpose.trim(), location: hodDraft.location.trim(), priority: hodDraft.priority,
    }).eq('id', reqId)
    if (requestError) { toast(requestError.message, 'error'); setSavingEdits(false); return }

    const itemResults = await Promise.all(hodDraft.items.map(item => supabase.from('req_items').update({
      item_name: item.item_name.trim(), quantity: Number(item.quantity), remarks: item.remarks.trim() || null,
    }).eq('id', item.id)))
    const itemError = itemResults.find(result => result.error)?.error
    if (itemError) { toast(itemError.message, 'error'); setSavingEdits(false); return }

    setEditingHodRequest(false)
    await fetchAll()
    setSavingEdits(false)
    toast('Request changes saved', 'success')
  }

  async function handlePrint() {
    setPrinting(true)
    await new Promise(r => setTimeout(r, 300))
    const el = document.getElementById('req-print-view')
    if (!el) { setPrinting(false); return }
    const canvas = await html2canvas(el, { scale: 2, useCORS: true })
    const pdf = new jsPDF('p', 'mm', 'a4')
    const w = pdf.internal.pageSize.getWidth()
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, (canvas.height * w) / canvas.width)
    pdf.save(`${req.req_number}.pdf`)
    setPrinting(false)
  }

  if (loading) return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div className="skeleton" style={{ width: 80, height: 32 }} />
      </div>
      <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 300, height: 14, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 14, marginBottom: 12 }} />)}
        </div>
        <div className="card" style={{ padding: 20 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 14, marginBottom: 12 }} />)}
        </div>
      </div>
    </div>
  )

  if (!req) return (
    <div style={{ padding: '28px 32px' }}>
      <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back
      </button>
      <div className="card empty-state">
        <AlertTriangle size={32} color="var(--yellow)" />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Request not found</div>
      </div>
    </div>
  )

  // Role-specific action buttons
  const ActionBar = () => {
    const role = profile.role
    const status = req.status

    const ActionWithComment = ({ actionKey, label, btnClass, icon: Icon, confirmTitle, confirmMsg }) => (
      <div>
        {showCommentForAction === actionKey ? (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 10 }}>
            <label className="label">Add a note (optional)</label>
            <textarea
              className="input"
              rows={3}
              value={actionComment}
              onChange={e => setActionComment(e.target.value)}
              placeholder="Explain your decision, recommend alternatives, or add context..."
              style={{ marginBottom: 10, resize: 'none' }}
            />
            {actionKey === 'accounts_approve_payment' && (
              <input
                className="input"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="Payment reference"
                style={{ marginBottom: 10 }}
              />
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowCommentForAction(null); setActionComment('') }} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={() => {
                if (actionKey === 'accounts_approve_payment' && !paymentReference.trim()) {
                  toast('Enter the payment reference before approving', 'error'); return
                }
                setConfirm({ actionKey, comment: actionComment, paymentReference })
              }} className={`btn ${btnClass} btn-sm`} disabled={acting}>
                <Icon size={13} /> Confirm {label}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCommentForAction(actionKey)} className={`btn ${btnClass} btn-sm`} disabled={acting}>
            <Icon size={13} /> {label}
          </button>
        )}
      </div>
    )

    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button onClick={handlePrint} disabled={printing} className="btn btn-secondary btn-sm">
          <Printer size={13} /> {printing ? 'Generating...' : 'Print PDF'}
        </button>

        {role === 'hod' && status === 'submitted' && (
          <>
            <button onClick={() => setEditingHodRequest(value => !value)} className="btn btn-secondary btn-sm">
              {editingHodRequest ? 'Continue Editing' : 'Edit Request'}
            </button>
            <ActionWithComment actionKey="hod_return" label="Return for Revision" btnClass="btn-warning" icon={RotateCcw}
              confirmTitle="Return for Revision" confirmMsg="Return this request to the staff member for revision?" />
            <ActionWithComment actionKey="hod_reject" label="Reject" btnClass="btn-danger" icon={XCircle}
              confirmTitle="Reject Request" confirmMsg="Reject this request? The requester will be notified." />
            <ActionWithComment actionKey="hod_authorize" label="Authorize" btnClass="btn-success" icon={CheckCircle}
              confirmTitle="Authorize Request" confirmMsg="Authorize and forward to management?" />
          </>
        )}

        {role === 'management' && status === 'management_review' && (
          <>
            <ActionWithComment actionKey="management_return" label="Return to HOD" btnClass="btn-warning" icon={RotateCcw}
              confirmTitle="Return to HOD" confirmMsg="Return this request to the HOD for review?" />
            <ActionWithComment actionKey="management_reject" label="Reject" btnClass="btn-danger" icon={XCircle}
              confirmTitle="Reject Request" confirmMsg="Reject this request? The requester will be notified." />
            <ActionWithComment actionKey="management_approve" label="Approve" btnClass="btn-success" icon={CheckCircle}
              confirmTitle="Approve Request" confirmMsg="Approve this request and send to stores?" />
          </>
        )}

        {role === 'stores' && status === 'approved' && (
          <>
            <ActionWithComment actionKey="stores_return" label="Flag Unavailable" btnClass="btn-warning" icon={AlertTriangle}
              confirmTitle="Flag as Unavailable" confirmMsg="Flag items as unavailable and send to Admin for outsourcing?" />
            <ActionWithComment actionKey="stores_fulfill" label="Mark Fulfilled" btnClass="btn-primary" icon={Package}
              confirmTitle="Mark as Fulfilled" confirmMsg="Confirm all items have been issued to the requester?" />
          </>
        )}

        {role === 'staff' && req.requester_id === profile.id && status === 'revision_required' && (
          <button onClick={() => setEditingRevision(value => !value)} className="btn btn-primary btn-sm">
            {editingRevision ? 'Continue Editing' : 'Edit & Resubmit'}
          </button>
        )}

        {role === 'admin' && status === 'outsourcing' && (
          <ActionWithComment actionKey="admin_forward_accounts" label="Forward to Accounts" btnClass="btn-primary" icon={Send}
            confirmTitle="Forward to Accounts" confirmMsg="Save outsourcing details and send this request to Accounts for payment review?" />
        )}

        {role === 'accounts' && status === 'payment_review' && (
          <>
            <ActionWithComment actionKey="accounts_reject_payment" label="Return to Admin" btnClass="btn-warning" icon={RotateCcw}
              confirmTitle="Return to Admin" confirmMsg="Return this request to Admin for outsourcing review?" />
            <ActionWithComment actionKey="accounts_approve_payment" label="Approve Payment" btnClass="btn-success" icon={CheckCircle}
              confirmTitle="Approve Payment" confirmMsg="Record the payment reference and complete this request?" />
          </>
        )}
      </div>
    )
  }

  const tabs = [
    { key: 'details',  label: 'Details',  icon: FileText },
    { key: 'timeline', label: 'Timeline', icon: Activity },
    { key: 'comments', label: 'Comments', icon: MessageSquare },
  ]

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Back + header */}
      <button onClick={onBack} className="btn btn-ghost btn-sm" style={{ marginBottom: 16, paddingLeft: 0 }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{req.req_number}</span>
            <Pill status={req.status} />
            <span className="pill" style={{ background: req.priority === 'Urgent' ? 'var(--yellow-bg)' : 'var(--surface-2)', color: req.priority === 'Urgent' ? 'var(--yellow)' : 'var(--text-3)' }}>{req.priority}</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>{req.purpose}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={12} /> {req.profiles?.full_name}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} /> {req.departments?.name}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {new Date(req.created_at).toLocaleDateString('en-GB')}</span>
            {req.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {req.location}</span>}
          </div>
        </div>
        <ActionBar />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 700 : 500, color: active ? 'var(--blue)' : 'var(--text-3)', borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent', marginBottom: -1, transition: 'all var(--t-fast)' }}>
              <Icon size={14} /> {tab.label}
              {tab.key === 'comments' && (
                <span style={{ fontSize: 10, background: 'var(--surface-2)', color: 'var(--text-3)', padding: '1px 6px', borderRadius: 99, fontWeight: 600 }}>
                  {/* comment count shown via CommentThread */}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Request info */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Request Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Requester', req.profiles?.full_name],
                ['Department', req.departments?.name],
                ['Purpose Type', req.purpose_type],
                ['Supervisor', req.supervisor || '—'],
                ['Location', req.location || '—'],
                ['Submitted', new Date(req.created_at).toLocaleDateString('en-GB')],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Requested ({req.req_items?.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {req.req_items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', marginBottom: 2 }}>{item.item_name}</div>
                    {item.remarks && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.remarks}</div>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: '#DBEAFE', padding: '2px 8px', borderRadius: 99, flexShrink: 0, marginLeft: 8 }}>×{item.quantity}</span>
                </div>
              ))}
            </div>
            {req.comments && (
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--yellow-bg)', borderRadius: 'var(--r)', borderLeft: '3px solid var(--yellow)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Additional Notes</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{req.comments}</div>
              </div>
            )}
          </div>

          {editingRevision && profile.role === 'staff' && req.requester_id === profile.id && req.status === 'revision_required' && revisionDraft && (
            <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revise and resubmit</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Update the request, then send it back to your HOD.</div>
                </div>
                <button onClick={() => setEditingRevision(false)} className="btn btn-secondary btn-sm">Cancel</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label className="label">Purpose *</label><input className="input" value={revisionDraft.purpose} onChange={e => setRevisionDraft(draft => ({ ...draft, purpose: e.target.value }))} /></div>
                <div><label className="label">Location / Site</label><input className="input" value={revisionDraft.location} onChange={e => setRevisionDraft(draft => ({ ...draft, location: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>Priority:</span>
                {['Normal', 'Urgent'].map(priority => <button key={priority} onClick={() => setRevisionDraft(draft => ({ ...draft, priority }))} className={`btn btn-sm ${revisionDraft.priority === priority ? 'btn-primary' : 'btn-secondary'}`}>{priority}</button>)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {revisionDraft.items.map((item, index) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 90px minmax(0, 1fr)', gap: 10 }}>
                    <input className="input" value={item.item_name} onChange={e => setRevisionDraft(draft => ({ ...draft, items: draft.items.map((current, i) => i === index ? { ...current, item_name: e.target.value } : current) }))} placeholder="Item description" />
                    <input className="input" type="number" min="1" value={item.quantity} onChange={e => setRevisionDraft(draft => ({ ...draft, items: draft.items.map((current, i) => i === index ? { ...current, quantity: e.target.value } : current) }))} />
                    <input className="input" value={item.remarks} onChange={e => setRevisionDraft(draft => ({ ...draft, items: draft.items.map((current, i) => i === index ? { ...current, remarks: e.target.value } : current) }))} placeholder="Remarks" />
                  </div>
                ))}
              </div>
              <button onClick={() => setConfirm({ actionKey: 'staff_resubmit', comment: 'Request updated and resubmitted.' })} className="btn btn-primary" disabled={acting}><Send size={14} /> Resubmit to HOD</button>
            </div>
          )}

          {editingHodRequest && profile.role === 'hod' && req.status === 'submitted' && hodDraft && (
            <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HOD Request Review</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>Update request details before authorization.</div>
                </div>
                <button onClick={() => setEditingHodRequest(false)} className="btn btn-secondary btn-sm" disabled={savingEdits}>Cancel</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label className="label">Purpose *</label><input className="input" value={hodDraft.purpose} onChange={e => setHodDraft(draft => ({ ...draft, purpose: e.target.value }))} /></div>
                <div><label className="label">Location / Site</label><input className="input" value={hodDraft.location} onChange={e => setHodDraft(draft => ({ ...draft, location: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>Priority:</span>
                {['Normal', 'Urgent'].map(priority => <button key={priority} onClick={() => setHodDraft(draft => ({ ...draft, priority }))} className={`btn btn-sm ${hodDraft.priority === priority ? 'btn-primary' : 'btn-secondary'}`}>{priority}</button>)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {hodDraft.items.map((item, index) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 90px minmax(0, 1fr)', gap: 10 }}>
                    <input className="input" value={item.item_name} onChange={e => setHodDraft(draft => ({ ...draft, items: draft.items.map((current, i) => i === index ? { ...current, item_name: e.target.value } : current) }))} placeholder="Item description" />
                    <input className="input" type="number" min="1" value={item.quantity} onChange={e => setHodDraft(draft => ({ ...draft, items: draft.items.map((current, i) => i === index ? { ...current, quantity: e.target.value } : current) }))} />
                    <input className="input" value={item.remarks} onChange={e => setHodDraft(draft => ({ ...draft, items: draft.items.map((current, i) => i === index ? { ...current, remarks: e.target.value } : current) }))} placeholder="Remarks" />
                  </div>
                ))}
              </div>
              <button onClick={saveHodEdits} className="btn btn-primary" disabled={savingEdits}>{savingEdits ? 'Saving...' : 'Save Changes'}</button>
            </div>
          )}

          {profile.role === 'admin' && req.status === 'outsourcing' && (
            <div className="card" style={{ padding: 20, gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outsourcing Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {req.req_items?.map((item, index) => {
                  const details = outsourcingItems[index] || {}
                  const updateDetails = (field, value) => setOutsourcingItems(items => items.map((current, itemIndex) => itemIndex === index ? { ...current, [field]: value } : current))
                  return (
                    <div key={item.id} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface-2)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>{item.item_name}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 10, marginBottom: 10 }}>
                        <input className="input" value={details.outsourcing_vendor || ''} onChange={e => updateDetails('outsourcing_vendor', e.target.value)} placeholder="Vendor" />
                        <input className="input" type="number" min="0" step="0.01" value={details.outsourcing_cost ?? ''} onChange={e => updateDetails('outsourcing_cost', e.target.value)} placeholder="Cost" />
                      </div>
                      <input className="input" value={details.outsourcing_reason || ''} onChange={e => updateDetails('outsourcing_reason', e.target.value)} placeholder="Outsourcing reason" style={{ marginBottom: 10 }} />
                      <textarea className="input" rows={2} value={details.outsourcing_notes || ''} onChange={e => updateDetails('outsourcing_notes', e.target.value)} placeholder="Notes" style={{ resize: 'vertical' }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approval Timeline</div>
          {timeline.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, padding: '20px 0' }}>No timeline events yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Submitted event */}
              <TimelineEvent event={{ stage: 'staff', action: 'submitted', profiles: req.profiles, created_at: req.created_at, comment: null }} />
              {timeline.map((event, i) => (
                <TimelineEvent key={i} event={event} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Discussion</div>
          <CommentThread requisitionId={reqId} profile={profile} />
        </div>
      )}

      {/* Confirm modal */}
      <ConfirmModal
        open={!!confirm}
        onClose={() => { setConfirm(null); setShowCommentForAction(null) }}
        onConfirm={() => takeAction(confirm.actionKey, confirm.comment, confirm.paymentReference)}
        title={
          confirm?.actionKey?.includes('authorize') ? 'Authorize Request' :
          confirm?.actionKey?.includes('approve') ? 'Approve Request' :
          confirm?.actionKey?.includes('reject') ? 'Reject Request' :
          confirm?.actionKey?.includes('return') ? 'Return for Revision' :
          confirm?.actionKey === 'staff_resubmit' ? 'Resubmit Request' :
          confirm?.actionKey?.includes('fulfill') ? 'Mark as Fulfilled' :
          confirm?.actionKey === 'admin_forward_accounts' ? 'Forward to Accounts' :
          confirm?.actionKey === 'accounts_approve_payment' ? 'Approve Payment' :
          confirm?.actionKey === 'accounts_reject_payment' ? 'Return to Admin' :
          confirm?.actionKey?.includes('unavailable') ? 'Flag as Unavailable' : 'Confirm Action'
        }
        message={
          confirm?.actionKey === 'hod_authorize' ? 'Authorize this requisition and forward to management for final approval?' :
          confirm?.actionKey === 'hod_return' ? 'Return this requisition to the requester for revision?' :
          confirm?.actionKey === 'staff_resubmit' ? 'Submit your revised requisition to your HOD for review?' :
          confirm?.actionKey === 'hod_reject' ? 'Reject this requisition? The requester will be notified by email.' :
          confirm?.actionKey === 'management_approve' ? 'Approve this requisition and send to stores for fulfillment?' :
          confirm?.actionKey === 'management_return' ? 'Return this requisition to the HOD for further review?' :
          confirm?.actionKey === 'management_reject' ? 'Reject this requisition? The requester will be notified by email.' :
          confirm?.actionKey === 'stores_fulfill' ? 'Confirm all items have been issued to the requester? They will be notified by email.' :
          confirm?.actionKey === 'stores_return' ? 'Flag items as unavailable and send this request to Admin for outsourcing?' :
          confirm?.actionKey === 'admin_forward_accounts' ? 'Save the outsourcing details and send this request to Accounts for payment review?' :
          confirm?.actionKey === 'accounts_approve_payment' ? 'Approve payment and complete this request?' :
          confirm?.actionKey === 'accounts_reject_payment' ? 'Return this request to Admin for outsourcing review?' :
          'Are you sure?'
        }
        confirmLabel={
          confirm?.actionKey?.includes('authorize') ? 'Authorize' :
          confirm?.actionKey?.includes('approve') ? 'Approve' :
          confirm?.actionKey?.includes('reject') ? 'Reject' :
          confirm?.actionKey?.includes('return') || confirm?.actionKey?.includes('flag') ? 'Confirm' :
          confirm?.actionKey === 'staff_resubmit' ? 'Resubmit' :
          confirm?.actionKey?.includes('fulfill') ? 'Mark Fulfilled' :
          confirm?.actionKey === 'admin_forward_accounts' ? 'Forward' :
          confirm?.actionKey === 'accounts_approve_payment' ? 'Approve Payment' :
          confirm?.actionKey === 'accounts_reject_payment' ? 'Return to Admin' : 'Confirm'
        }
        danger={confirm?.actionKey?.includes('reject')}
      />

      {/* Hidden print view */}
      {printing && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <PrintView req={req} profile={profile} id="req-print-view" />
        </div>
      )}
    </div>
  )
}
