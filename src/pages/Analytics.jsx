import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart3, TrendingUp, Users } from 'lucide-react'

const C = {
  primary: '#1565D8', light: '#3AACEE', dark: '#080F1A',
  navy: '#0C1A2E', bg: '#F2F5FB', card: '#FFFFFF',
  border: '#DDE5F0', text: '#18243A', muted: '#7A8EAB',
}

function StatCard({ label, value, icon, color = C.primary }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16,
      display: 'flex', alignItems: 'center', gap: 16
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 8, background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>
          {value}
        </div>
      </div>
    </div>
  )
}

function ChartBar({ label, value, max, color = C.primary }) {
  const percentage = (value / max) * 100
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, padding: '2px 8px', borderRadius: 4 }}>
          {value}
        </span>
      </div>
      <div style={{
        width: '100%', height: 6, background: C.border, borderRadius: 3, overflow: 'hidden'
      }}>
        <div style={{
          height: '100%', width: `${percentage}%`, background: color, transition: 'width 0.3s'
        }} />
      </div>
    </div>
  )
}

export default function Analytics() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    departments: 0,
    avgLoginCount: 0,
    departmentStats: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    try {
      // Get total employees
      const { count: total } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      // Get active employees
      const { count: active } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('status', 'active')

      // Get inactive employees
      const { count: inactive } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('status', 'inactive')

      // Get total departments
      const { count: deptCount } = await supabase
        .from('departments')
        .select('*', { count: 'exact' })

      // Get department stats
      const { data: employees } = await supabase
        .from('profiles')
        .select('department_id')

      const deptStats = {}
      employees?.forEach(emp => {
        deptStats[emp.department_id] = (deptStats[emp.department_id] || 0) + 1
      })

      const { data: depts } = await supabase
        .from('departments')
        .select('id, name')

      const departmentStats = depts?.map(dept => ({
        name: dept.name,
        count: deptStats[dept.id] || 0
      })) || []

      const maxCount = Math.max(...departmentStats.map(d => d.count), 1)

      setStats({
        totalEmployees: total,
        activeEmployees: active,
        inactiveEmployees: inactive,
        departments: deptCount,
        departmentStats,
        maxCount
      })
    } catch (error) {
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ flex: 1, background: C.bg, padding: '24px', overflow: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 24 }}>
          Analytics Dashboard
        </h1>

        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total Employees" value={stats.totalEmployees} icon={<Users size={24} />} />
          <StatCard label="Active" value={stats.activeEmployees} icon={<TrendingUp size={24} />} color="#15803D" />
          <StatCard label="Inactive" value={stats.inactiveEmployees} icon={<Users size={24} />} color="#B91C1C" />
          <StatCard label="Departments" value={stats.departments} icon={<BarChart3 size={24} />} />
        </div>

        {/* Department Distribution */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 20 }}>
            Employees by Department
          </h2>
          <div style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
            {stats.departmentStats.length > 0 ? (
              stats.departmentStats.map((dept, idx) => (
                <ChartBar
                  key={idx}
                  label={dept.name}
                  value={dept.count}
                  max={stats.maxCount}
                  color={[C.primary, '#7C3AED', '#15803D', '#B45309'][idx % 4]}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', color: C.muted, paddingY: 40 }}>
                No department data available
              </div>
            )}
          </div>
        </div>

        {/* Employee Status Summary */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16,
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20
        }}>
          <div style={{ textAlign: 'center', borderRight: `1px solid ${C.border}`, paddingRight: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.primary, marginBottom: 8 }}>
              {((stats.activeEmployees / stats.totalEmployees) * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
              Active Rate
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#15803D', marginBottom: 8 }}>
              {stats.departments > 0 ? (stats.totalEmployees / stats.departments).toFixed(1) : 0}
            </div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
              Avg per Department
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
