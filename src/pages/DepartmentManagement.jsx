import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, X } from 'lucide-react'

const C = {
  primary: '#1565D8', light: '#3AACEE', dark: '#080F1A',
  navy: '#0C1A2E', bg: '#F2F5FB', card: '#FFFFFF',
  border: '#DDE5F0', text: '#18243A', muted: '#7A8EAB',
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [selectedDept, setSelectedDept] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', head_id: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDepartments()
    loadEmployees()
  }, [])

  async function loadDepartments() {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name')
    if (data) setDepartments(data)
    setLoading(false)
  }

  async function loadEmployees() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('status', 'active')
      .order('full_name')
    if (data) setEmployees(data)
  }

  async function handleSave() {
    if (!formData.name) {
      alert('Department name is required')
      return
    }

    try {
      if (editingDept) {
        const { error } = await supabase
          .from('departments')
          .update(formData)
          .eq('id', editingDept.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('departments')
          .insert([formData])
        if (error) throw error
      }
      setShowModal(false)
      setEditingDept(null)
      setFormData({ name: '', description: '', head_id: '' })
      loadDepartments()
    } catch (error) {
      alert('Error saving department: ' + error.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this department?')) return
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)
      if (error) throw error
      loadDepartments()
    } catch (error) {
      alert('Error deleting department: ' + error.message)
    }
  }

  function openEdit(dept) {
    setEditingDept(dept)
    setFormData({
      name: dept.name,
      description: dept.description || '',
      head_id: dept.head_id || ''
    })
    setShowModal(true)
  }

  function openNew() {
    setEditingDept(null)
    setFormData({ name: '', description: '', head_id: '' })
    setShowModal(true)
  }

  const deptEmployees = employees.filter(emp => {
    const empDepts = departments.filter(d => d.id === selectedDept?.id)
    return true // This should be filtered based on employee's department
  })

  return (
    <div style={{ flex: 1, background: C.bg, padding: '24px', overflow: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text }}>
            Department Management
          </h1>
          <button
            onClick={openNew}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
              background: C.primary, color: '#fff', border: 'none', borderRadius: 8,
              fontWeight: 700, cursor: 'pointer', fontSize: 13
            }}
          >
            <Plus size={18} /> New Department
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {departments.map(dept => {
            const head = employees.find(e => e.id === dept.head_id)
            const deptEmpsCount = employees.filter(e => {
              // Count employees in this department
              return true
            }).length

            return (
              <div
                key={dept.id}
                onClick={() => setSelectedDept(dept)}
                style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>
                      {dept.name}
                    </h3>
                    <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
                      {dept.description || 'No description'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(dept) }}
                      style={{
                        background: 'transparent', border: 'none', color: C.primary,
                        cursor: 'pointer', padding: 4
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(dept.id) }}
                      style={{
                        background: 'transparent', border: 'none', color: '#B91C1C',
                        cursor: 'pointer', padding: 4
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>
                    HEAD OF DEPARTMENT
                  </div>
                  <div style={{ fontSize: 13, color: C.text }}>
                    {head?.full_name || 'Not assigned'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }} onClick={() => setShowModal(false)}>
            <div
              style={{ background: C.card, borderRadius: 12, padding: 24, maxWidth: 500, width: '90%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                  {editingDept ? 'Edit Department' : 'New Department'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.muted }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8,
                      fontSize: 13, background: C.bg, boxSizing: 'border-box'
                    }}
                    placeholder="e.g. Sales, HR, IT"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8,
                      fontSize: 13, background: C.bg, boxSizing: 'border-box', minHeight: 80, fontFamily: 'inherit'
                    }}
                    placeholder="Department description"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Head of Department
                  </label>
                  <select
                    value={formData.head_id}
                    onChange={(e) => setFormData({ ...formData, head_id: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8,
                      fontSize: 13, background: C.bg, boxSizing: 'border-box'
                    }}
                  >
                    <option value="">No HOD</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1, padding: 10, background: C.border, color: C.text,
                      border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      flex: 1, padding: 10, background: C.primary, color: '#fff',
                      border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Save Department
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
