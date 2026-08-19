import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
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
      options: { data: { full_name: name, role: 'staff', department_id: deptId } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id, full_name: name, role: 'staff', department_id: deptId,
      email,
      title: 'Staff'
    })
    if (profileError) setError(profileError.message)
    setLoading(false)
  }

 return (
  <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
    
    {/* Ambient blobs */}
    <div style={{ position: 'absolute', top: '15%', left: '20%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,86,219,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

    {/* Left panel — hidden on mobile */}
    <div style={{ 
      width: 440, 
      background: 'var(--navy-light, #132338)', 
      borderRight: '1px solid rgba(255,255,255,0.05)', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between', 
      padding: '48px 44px', 
      flexShrink: 0,
      position: 'relative',
    }}
    className="login-left-panel">
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/new_logo_trans.png" alt="Acti-Tech" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em' }}>ACTI-TECH LTD.</div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, letterSpacing: '0.12em' }}>OPERATIONS PORTAL</div>
        </div>
      </div>

      <div className="fade-in">
        <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
          <div style={{ color: '#fff' }}>Request.</div>
          <div style={{ color: 'var(--cyan-light, #38BDF8)' }}>Approve.</div>
          <div style={{ color: '#fff' }}>Record.</div>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, maxWidth: 300 }}>
          The internal operations platform for Acti-Tech Limited.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
          {[
            { dot: 'var(--cyan, #0EA5E9)', text: 'Real-time approval workflow' },
            { dot: 'var(--green, #16A34A)', text: 'Email notifications at every stage' },
            { dot: 'var(--yellow, #D97706)', text: 'PDF receipts for every transaction' },
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

    {/* Right panel — full width on mobile */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', minHeight: '100vh' }}>
      
      {/* Mobile logo — only shows on mobile */}
      <div className="login-mobile-logo" style={{ display: 'none', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <img src="/new_logo_trans.png" alt="Acti-Tech" style={{ width: 36, height: 36, objectFit: 'contain' }} />
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em' }}>ACTI-TECH LTD.</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.1em' }}>OPERATIONS PORTAL</div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 380 }} className="fade-in">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4, marginBottom: 32 }}>
          {['signin', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, transition: 'all var(--t-fast, 120ms ease)',
                background: mode === m ? 'var(--blue, #1A56DB)' : 'transparent',
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
              {loading ? 'Signing in...' : 'Sign In →'}
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
              <select className="input input-dark" value={deptId} onChange={e => setDeptId(e.target.value)}
                style={{ color: deptId ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                <option value="" style={{ background: '#0D1B2E', color: '#fff' }}>Select department</option>
                {depts.map(d => <option key={d.id} value={d.id} style={{ background: '#0D1B2E', color: '#fff' }}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
              New accounts are created as <strong style={{ color: '#fff' }}>Staff</strong>. Departmental and approval roles are assigned by an administrator.
            </div>
            {error && <div style={{ fontSize: 11, color: '#F87171', background: 'rgba(248,113,113,0.08)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #F87171' }}>{error}</div>}
            <button onClick={handleSignUp} disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
  )
}
