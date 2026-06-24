import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('staff')
  const [deptId, setDeptId] = useState('')
  const [depts, setDepts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('departments').select('*').order('name')
      .then(({ data }) => { if (data) setDepts(data) })
  }, [])

  async function handleSignIn() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignUp() {
    if (!name || !deptId) { setError('Please fill all fields'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role,
          department_id: deptId
        }
      }
    })
    if (error) { setError(error.message); setLoading(false); return }
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: name,
      role,
      department_id: deptId,
      title: role === 'staff' ? 'Staff' : role === 'hod' ? 'Head of Department' :
             role === 'management' ? 'Management' : 'Store Manager'
    })
    if (profileError) setError(profileError.message)
    setLoading(false)
  }

  const B = {
    dark: '#080F1A', navy: '#0A1628', primary: '#1565D8',
    light: '#3AACEE', ghost: '#3A5270', muted: '#7A8EAB',
    border: 'rgba(255,255,255,0.08)', text: '#E2E8F0'
  }

  const input = {
    width: '100%', padding: '10px 13px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, fontSize: 13, color: B.text,
    outline: 'none', boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif'
  }

  const label = {
    fontSize: 9, fontWeight: 700, color: B.muted,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    display: 'block', marginBottom: 5
  }

  return (
    <div style={{ minHeight: '100vh', background: B.dark, display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', left: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(21,101,216,0.15) 0%, transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(58,172,238,0.1) 0%, transparent 70%)', pointerEvents: 'none' }}/>

      {/* Left panel */}
      <div style={{ width: 420, background: B.navy, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 44px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="36" height="36" viewBox="0 0 36 36">
            <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1565D8"/><stop offset="100%" stopColor="#3AACEE"/>
            </linearGradient></defs>
            <circle cx="18" cy="18" r="17" fill="rgba(21,101,216,0.18)"/>
            <text x="18" y="25" textAnchor="middle" fill="url(#lg)" fontSize="22" fontWeight="900" fontFamily="Arial Black,sans-serif">A</text>
            <ellipse cx="18" cy="18" rx="15" ry="7" fill="none" stroke="#3AACEE" strokeWidth="1.5" opacity="0.5" transform="rotate(-20 18 18)"/>
          </svg>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em' }}>ACTI-TECH LTD.</div>
            <div style={{ color: B.ghost, fontSize: 9, letterSpacing: '0.1em' }}>OPERATIONS PORTAL</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>
            <div style={{ color: '#fff' }}>Request.</div>
            <div><span style={{ color: B.light }}>Approve.</span> <span style={{ color: '#fff' }}>Record.</span></div>
          </div>
          <div style={{ fontSize: 13, color: B.muted, lineHeight: 1.7 }}>
            The internal operations platform for Acti-Tech Limited. Submit requisitions, track approvals, and communicate across departments.
          </div>
        </div>

        <div style={{ fontSize: 10, color: B.ghost }}>Acti-Tech Limited · Confidential Internal System</div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {['signin', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: mode === m ? B.primary : 'transparent',
                  color: mode === m ? '#fff' : B.muted, fontSize: 12, fontWeight: 700,
                  fontFamily: 'system-ui, sans-serif' }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {mode === 'signin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={label}>Email Address</label>
                <input style={input} placeholder="you@actitech.ng" value={email} onChange={e => setEmail(e.target.value)}/></div>
              <div><label style={label}>Password</label>
                <input style={input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}/></div>
              {error && <div style={{ fontSize: 11, color: '#F87171' }}>{error}</div>}
              <button onClick={handleSignIn} disabled={loading}
                style={{ width: '100%', padding: '11px', background: B.primary, border: 'none', borderRadius: 9,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'system-ui, sans-serif', marginTop: 4 }}>
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={label}>Full Name</label>
                <input style={input} placeholder="Your full name" value={name} onChange={e => setName(e.target.value)}/></div>
              <div><label style={label}>Email Address</label>
                <input style={input} placeholder="you@actitech.ng" value={email} onChange={e => setEmail(e.target.value)}/></div>
              <div><label style={label}>Password</label>
                <input style={input} type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)}/></div>
              <div><label style={label}>Department</label>
                <select style={{ ...input, color: deptId ? '#E2E8F0' : '#7A8EAB' }} value={deptId} onChange={e => setDeptId(e.target.value)}>
                  <option value="">Select department</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div><label style={label}>Your Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['staff','Staff'],['hod','HOD'],['management','Management'],['stores','Stores']].map(([k, l]) => (
                    <button key={k} onClick={() => setRole(k)}
                      style={{ padding: '9px', border: `1.5px solid ${role === k ? B.primary : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: 8, background: role === k ? 'rgba(21,101,216,0.2)' : 'transparent',
                        color: role === k ? '#fff' : B.muted, fontSize: 11, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'system-ui, sans-serif' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {error && <div style={{ fontSize: 11, color: '#F87171' }}>{error}</div>}
              <button onClick={handleSignUp} disabled={loading}
                style={{ width: '100%', padding: '11px', background: B.primary, border: 'none', borderRadius: 9,
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'system-ui, sans-serif', marginTop: 4 }}>
                {loading ? 'Creating account...' : 'Create Account →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}