import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { ToastProvider } from './components/ui/Toast'

function Loader() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <img src="/new_logo_trans.png" alt="Acti-Tech" style={{ width: 64, height: 64, objectFit: 'contain', animation: 'spin 2s linear infinite' }} />
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: '0.1em' }}>LOADING...</div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*, departments(name)')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  return (
    <ToastProvider>
      {loading ? <Loader /> : (!session || !profile) ? <Login /> : <Dashboard profile={profile} />}
    </ToastProvider>
  )
}