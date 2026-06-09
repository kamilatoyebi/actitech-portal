import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, BarChart3, Settings, LogOut } from 'lucide-react'

const C = {
  primary: '#1565D8', light: '#3AACEE', dark: '#080F1A',
  navy: '#0C1A2E', bg: '#F2F5FB', card: '#FFFFFF',
  border: '#DDE5F0', text: '#18243A', muted: '#7A8EAB',
}

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  useEffect(() => {
    loadEmployees()
    loadDepartments()
  }, [])

  useEffect(() => {
    let result = employees
    if (search) {
      result = result.filter(e =>
        e.full_name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (deptFilter) {
      result = result.filter(e => e.department_id === deptFilter)
    }
    setFiltered(result)
  }, [employees, search, deptFilter])

  async function loadEmployees() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    if (data) setEmployees(data)
    setLoading(false)
  }

  async function loadDepartments() {
    const { data } = await supabase.from('departments').select('*').order('name')
    if (data) setDepartments(data)
  }

  return (
    <div style={{ flex: 1, background: C.bg, padding: '24px', overflow: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 24 }}>
          Employee Directory
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Search Employee
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email..."
              style={{
                width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, background: C.card, boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Filter by Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8,
                fontSize: 13, background: C.card, boxSizing: 'border-box'
              }}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(emp => {
            const dept = departments.find(d => d.id === emp.department_id)
            return (
              <div
                key={emp.id}
                onClick={() => setSelectedEmployee(emp)}
                style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16,
                  cursor: 'pointer', transition: 'all 0.2s', hover: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: C.primary,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 16
                  }}>
                    {emp.full_name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                      {emp.full_name}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {emp.role}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
                  {emp.email}
                </div>
                <div style={{
                  fontSize: 10, padding: '4px 8px', background: '#DBEAFE',
                  color: C.primary, borderRadius: 6, display: 'inline-block'
                }}>
                  {dept?.name || 'No Department'}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
            No employees found
          </div>
        )}
      </div>

      {selectedEmployee && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setSelectedEmployee(null)}>
          <div
            style={{ background: C.card, borderRadius: 12, padding: 24, maxWidth: 400, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: C.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 24
              }}>
                {selectedEmployee.full_name[0]}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                  {selectedEmployee.full_name}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {selectedEmployee.role}
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>EMAIL</span>
                <div style={{ fontSize: 13, color: C.text }}>{selectedEmployee.email}</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>DEPARTMENT</span>
                <div style={{ fontSize: 13, color: C.text }}>
                  {departments.find(d => d.id === selectedEmployee.department_id)?.name}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>STATUS</span>
                <div style={{ fontSize: 13, color: C.text }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4,
                    background: selectedEmployee.status === 'active' ? '#DCFCE7' : '#FEE2E2',
                    color: selectedEmployee.status === 'active' ? '#15803D' : '#B91C1C',
                    fontSize: 11, fontWeight: 700
                  }}>
                    {selectedEmployee.status}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEmployee(null)}
              style={{
                width: '100%', padding: 10, background: C.primary, color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 700, marginTop: 16, cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
