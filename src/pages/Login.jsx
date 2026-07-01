import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

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
  const [showPw, setShowPw] = useState(false)

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
      email, password,
      options: { data: { full_name: name, role, department_id: deptId } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id, full_name: name, role, department_id: deptId,
      email,
      title: role === 'staff' ? 'Staff' : role === 'hod' ? 'Head of Department' :
             role === 'management' ? 'Management' : 'Store Manager'
    })
    if (profileError) setError(profileError.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Ambient blobs */}
      <div style={{ position: 'absolute', top: '15%', left: '20%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,86,219,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Left panel */}
      <div style={{ width: 440, background: 'var(--navy-light)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 44px', flexShrink: 0, position: 'relative' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/new_logo_trans.png" alt="Acti-Tech" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em' }}>ACTI-TECH LTD.</div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.12em' }}>OPERATIONS PORTAL</div>
          </div>
        </div>

        {/* Hero text */}
        <div className="fade-in">
          <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            <div style={{ color: '#fff' }}>Request.</div>
            <div style={{ color: 'var(--cyan-light)' }}>Approve.</div>
            <div style={{ color: '#fff' }}>Record.</div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, maxWidth: 300 }}>
            The internal operations platform for Acti-Tech Limited. Submit requisitions, track approvals, and coordinate across departments.
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
            {[
              { dot: 'var(--cyan)', text: 'Real-time approval workflow' },
              { dot: 'var(--green)', text: 'Email notifications at every stage' },
              { dot: 'var(--yellow)', text: 'PDF receipts for every transaction' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: f.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.05em' }}>
          © 2025 Acti-Tech Limited · Confidential
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 380 }} className="fade-in">
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 32 }}>
            {['signin', 'signup'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, transition: 'all var(--t-fast)',
                  background: mode === m ? 'var(--blue)' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {mode === 'signin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label" style={{ color: 'rgba(255,255,255,0.4)' }}>Email Address</label>
                <input className="input input-dark" placeholder="you@actitech.ng" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()} />
              </div>
              <div>
                <label className="label" style={{ color: 'rgba(255,255,255,0.4)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input input-dark" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSignIn()} style={{ paddingRight: 40 }} />
                  <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {error && <div style={{ fontSize: 11, color: '#F87171', background: 'rgba(248,113,113,0.08)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #F87171' }}>{error}</div>}
              <button onClick={handleSignIn} disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }}>
                {loading ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Signing in...</> : 'Sign In →'}
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label" style={{ color: 'rgba(255,255,255,0.4)' }}>Full Name</label>
                <input className="input input-dark" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="label" style={{ color: 'rgba(255,255,255,0.4)' }}>Email Address</label>
                <input className="input input-dark" placeholder="you@actitech.ng" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label" style={{ color: 'rgba(255,255,255,0.4)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="input input-dark" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 40 }} />
                  <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label" style={{ color: 'rgba(255,255,255,0.4)' }}>Department</label>
                <select className="input input-dark" value={deptId} onChange={e => setDeptId(e.target.value)}>
                  <option value="">Select department</option>
                  {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" style={{ color: 'rgba(255,255,255,0.4)' }}>Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['staff','Staff'],['hod','HOD'],['management','Management'],['stores','Stores']].map(([k, l]) => (
                    <button key={k} onClick={() => setRole(k)}
                      style={{ padding: '9px', border: `1.5px solid ${role === k ? 'var(--blue)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, background: role === k ? 'rgba(26,86,219,0.2)' : 'transparent', color: role === k ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all var(--t-fast)' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {error && <div style={{ fontSize: 11, color: '#F87171', background: 'rgba(248,113,113,0.08)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #F87171' }}>{error}</div>}
              <button onClick={handleSignUp} disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }}>
                {loading ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Creating account...</> : 'Create Account →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}