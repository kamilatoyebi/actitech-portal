import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Edit2, Trash2, X, Plus } from 'lucide-react'

const C = {
  primary: '#1565D8', light: '#3AACEE', dark: '#080F1A',
  navy: '#0C1A2E', bg: '#F2F5FB', card: '#FFFFFF',
  border: '#DDE5F0', text: '#18243A', muted: '#7A8EAB',
}

const ROLES = ['staff', 'hod', 'management', 'stores', 'admin']
const STATUSES = ['active', 'inactive', 'on_leave']

export default function AdminPanel() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    full_name: '', email: '', role: 'staff', status: 'active', department_id: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [activeTab])

  async function loadData() {
    if (activeTab === 'users') {
      const { data } = await supabase.from('profiles').select('*').order('full_name')
      if (data) setEmployees(data)
      const { data: depts } = await supabase.from('departments').select('*').order('name')
      if (depts) setDepartments(depts)
    } else if (activeTab === 'logs') {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50)
      if (data) setAuditLogs(data)
    }
    setLoading(false)
  }

  async function handleSaveUser() {
    if (!formData.full_name || !formData.email) {
      alert('Name and email required'); return
    }
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            status: formData.status,
            department_id: formData.department_id || null
          })
          .eq('id', editingUser.id)
        if (error) throw error
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: 'TempPassword123!'
        })
        if (signUpError) throw signUpError
        const { data: { user } } = await supabase.auth.getUser()
        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          department_id: formData.department_id || null
        })
        if (profileError) throw profileError
      }
      setShowModal(false)
      setEditingUser(null)
      setFormData({ full_name: '', email: '', role: 'staff', status: 'active', department_id: '' })
      loadData()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function handleDeleteUser(id) {
    if (!confirm('Delete this user? This action cannot be undone.')) return
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      loadData()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  function openEdit(user) {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      department_id: user.department_id || ''
    })
    setShowModal(true)
  }

  function openNew() {
    setEditingUser(null)
    setFormData({ full_name: '', email: '', role: 'staff', status: 'active', department_id: '' })
    setShowModal(true)
  }

  const roleColors = {
    admin:      { bg:'#DBEAFE', c:'#1565D8' },
    management: { bg:'#EDE9FE', c:'#7C3AED' },
    hod:        { bg:'#FEF3C7', c:'#B45309' },
    stores:     { bg:'#E0F2FE', c:'#0369A1' },
    staff:      { bg:'#F1F5F9', c:'#7A8EAB' },
  }

  const noDepRoles = ['management', 'admin']

  return (
    <div style={{ flex:1, background:C.bg, padding:'24px', overflow:'auto' }}>
      <div style={{ maxWidth:1200, margin:'0 auto' }}>
        <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginBottom:24 }}>Admin Panel</h1>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, background:C.card, borderRadius:10, padding:4, marginBottom:24, border:`1px solid ${C.border}` }}>
          {[{ key:'users', label:'👥 User Management' }, { key:'logs', label:'📋 Audit Logs' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ flex:1, padding:'12px', border:'none', borderRadius:8, cursor:'pointer',
                background: activeTab===tab.key ? C.primary : 'transparent',
                color: activeTab===tab.key ? '#fff' : C.muted,
                fontWeight: activeTab===tab.key ? 700 : 500, fontSize:13 }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div style={{ marginBottom:16 }}>
              <button onClick={openNew}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px',
                  background:C.primary, color:'#fff', border:'none', borderRadius:8,
                  fontWeight:700, cursor:'pointer', fontSize:13 }}>
                <Plus size={18}/> Add User
              </button>
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#18243A' }}>
                    {['Name','Email','Role','Department','Status','Actions'].map(h =>
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', fontSize:10, letterSpacing:'0.06em' }}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const rc = roleColors[emp.role] || roleColors.staff
                    const dept = departments.find(d => d.id === emp.department_id)
                    return (
                      <tr key={emp.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                        <td style={{ padding:'12px 16px', color:C.text, fontWeight:600 }}>{emp.full_name}</td>
                        <td style={{ padding:'12px 16px', color:C.muted, fontSize:12 }}>{emp.email}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:700, background:rc.bg, color:rc.c }}>
                            {emp.role}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px', color:C.muted, fontSize:12 }}>
                          {dept?.name || <span style={{ color:C.border }}>—</span>}
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:700,
                            background: emp.status==='active' ? '#DCFCE7' : emp.status==='on_leave' ? '#FEF3C7' : '#FEE2E2',
                            color: emp.status==='active' ? '#15803D' : emp.status==='on_leave' ? '#B45309' : '#B91C1C' }}>
                            {emp.status}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px', textAlign:'center' }}>
                          <button onClick={() => openEdit(emp)}
                            style={{ background:'transparent', border:'none', color:C.primary, cursor:'pointer', marginRight:8 }}>
                            <Edit2 size={16}/>
                          </button>
                          <button onClick={() => handleDeleteUser(emp.id)}
                            style={{ background:'transparent', border:'none', color:'#B91C1C', cursor:'pointer' }}>
                            <Trash2 size={16}/>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#18243A' }}>
                    {['Timestamp','Admin','Action','Details'].map(h =>
                      <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', fontSize:10 }}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:'12px 16px', color:C.muted, fontSize:11 }}>{new Date(log.created_at).toLocaleString()}</td>
                      <td style={{ padding:'12px 16px', color:C.text }}>{log.admin_id?.substring(0,8)}</td>
                      <td style={{ padding:'12px 16px', color:C.text, fontWeight:600 }}>{log.action}</td>
                      <td style={{ padding:'12px 16px', color:C.muted, fontSize:11 }}>{log.details || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLogs.length === 0 && (
                <div style={{ padding:'24px', textAlign:'center', color:C.muted }}>No audit logs available</div>
              )}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
            display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
            onClick={() => setShowModal(false)}>
            <div style={{ background:C.card, borderRadius:12, padding:24, maxWidth:500, width:'90%' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ fontSize:18, fontWeight:800, color:C.text }}>
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button onClick={() => setShowModal(false)}
                  style={{ background:'transparent', border:'none', cursor:'pointer', color:C.muted }}>
                  <X size={20}/>
                </button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Full Name</label>
                  <input type="text" value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, background:C.bg, boxSizing:'border-box' }}/>
                </div>

                <div>
                  <label style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Email</label>
                  <input type="email" value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    disabled={!!editingUser}
                    style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, background:C.bg, boxSizing:'border-box', opacity: editingUser ? 0.6 : 1 }}/>
                </div>

                <div>
                  <label style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Role</label>
                  <select value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, background:C.bg, boxSizing:'border-box' }}>
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Department — hidden for management and admin */}
                {!noDepRoles.includes(formData.role) && (
                  <div>
                    <label style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Department</label>
                    <select value={formData.department_id}
                      onChange={e => setFormData({...formData, department_id: e.target.value})}
                      style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, background:C.bg, boxSizing:'border-box' }}>
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ fontSize:11, color:C.muted, fontWeight:700, textTransform:'uppercase', display:'block', marginBottom:6 }}>Status</label>
                  <select value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, background:C.bg, boxSizing:'border-box' }}>
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display:'flex', gap:12, marginTop:20 }}>
                  <button onClick={() => setShowModal(false)}
                    style={{ flex:1, padding:10, background:C.border, color:C.text, border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveUser}
                    style={{ flex:1, padding:10, background:C.primary, color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}