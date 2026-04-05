'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Logo from '@/components/Logo';

const demos = [
  { role:'Admin',      email:'admin@samarth.dev',      pass:'admin123' },
  { role:'Accountant', email:'accountant@samarth.dev', pass:'account123' },
  { role:'Engineer',   email:'engineer@samarth.dev',   pass:'engineer123' },
];

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [ready, setReady]       = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => { setTimeout(() => setReady(true), 60); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-deep)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{ position:'absolute', top:'5%', left:'50%', transform:'translateX(-50%)', width:'min(600px,100vw)', height:'min(600px,100vw)', borderRadius:'50%', background:'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:0, right:0, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }}/>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        position: 'relative',
        zIndex: 1,
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)',
      }}>

        {/* Logo + title */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <Logo size={48} showText={false}/>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1.2, marginBottom:6 }}>
            BuildTrack
          </div>
          <div style={{ fontSize:13, color:'var(--text-muted)', fontWeight:500 }}>
            Construction Management Suite
          </div>
        </div>

        {/* Login card */}
        <div style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--bg-card)',
          borderRadius: 20,
          padding: '32px 28px',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>
          <h2 style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:4, letterSpacing:'-0.02em' }}>
            Welcome back
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:28 }}>
            Sign in to your workspace
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-secondary)', marginBottom:7, letterSpacing:'0.03em', textTransform:'uppercase' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text)',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'var(--font)',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)'; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-secondary)', marginBottom:7, letterSpacing:'0.03em', textTransform:'uppercase' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text)',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'var(--font)',
                  boxSizing: 'border-box',
                  WebkitAppearance: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-soft)'; }}
                onBlur={e  => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                color: 'white',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font)',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
                boxShadow: loading ? 'none' : '0 6px 24px rgba(59,130,246,0.35)',
                letterSpacing: '0.01em',
                WebkitAppearance: 'none',
              }}
            >
              {loading ? (
                <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                  <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>
                  Signing in…
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Demo credentials toggle */}
          <div style={{ marginTop:20 }}>
            <button
              onClick={() => setShowDemo(d => !d)}
              style={{ width:'100%', background:'none', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', cursor:'pointer', color:'var(--text-muted)', fontSize:12, fontWeight:600, fontFamily:'var(--font)', textTransform:'uppercase', letterSpacing:'0.05em', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
            >
              <span>{showDemo ? '▲' : '▼'}</span> Demo Credentials
            </button>

            {showDemo && (
              <div style={{ marginTop:10, background:'var(--bg-elevated)', borderRadius:10, border:'1px solid var(--border)', overflow:'hidden' }}>
                {demos.map((d, i) => (
                  <button
                    key={d.role}
                    onClick={() => { setEmail(d.email); setPassword(d.pass); setShowDemo(false); }}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      borderBottom: i < demos.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: '12px 14px',
                      fontFamily: 'var(--font)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onTouchStart={e => e.currentTarget.style.background = 'var(--accent-soft)'}
                    onTouchEnd={e => e.currentTarget.style.background = 'none'}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--accent-soft)'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ fontSize:12, fontWeight:700, color:'var(--accent-light)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{d.role}</span>
                    <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--mono)' }}>{d.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feature row */}
        <div style={{ display:'flex', gap:16, marginTop:24, flexWrap:'wrap', justifyContent:'center' }}>
          {['👷 Labor', '📦 Inventory', '🧾 Invoices', '🚚 Deliveries', '✨ AI'].map(f => (
            <span key={f} style={{ fontSize:12, color:'var(--text-muted)', fontWeight:500 }}>{f}</span>
          ))}
        </div>

        <p style={{ marginTop:16, fontSize:11, color:'var(--text-muted)', textAlign:'center' }}>
          Samarth Developers © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
