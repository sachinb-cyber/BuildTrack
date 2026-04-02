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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
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
    <div className="login-split" style={{ minHeight:'100vh', display:'flex', background:'var(--bg-deep)', position:'relative', overflow:'hidden' }}>
      {/* Animated background orbs */}
      <div style={{ position:'absolute', top:'10%', left:'20%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'10%', right:'15%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', filter:'blur(60px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'50%', left:'50%', width:800, height:2, background:'linear-gradient(90deg, transparent, rgba(99,102,241,0.1), transparent)', transform:'translateY(-50%)', pointerEvents:'none' }}/>

      {/* Grid overlay */}
      <div style={{ position:'absolute', inset:0, opacity:0.025, backgroundImage:'linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)', backgroundSize:'48px 48px', pointerEvents:'none' }}/>

      {/* Left branding panel */}
      <div className="login-brand" style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 80px',
        position:'relative', zIndex:1,
        opacity: ready?1:0, transform: ready?'translateX(0)':'translateX(-30px)',
        transition:'all 0.9s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ marginBottom:56 }}>
          <Logo size={48} showText={true}/>
        </div>

        <div style={{ marginBottom:24 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 14px', borderRadius:20, background:'var(--accent-soft)', border:'1px solid rgba(99,102,241,0.2)', marginBottom:20 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', animation:'pulse 2s infinite' }}/>
            <span style={{ fontSize:12, color:'var(--accent-light)', fontWeight:600, letterSpacing:'0.05em' }}>CONSTRUCTION MANAGEMENT SUITE</span>
          </div>
          <h1 style={{ fontSize:52, fontWeight:800, lineHeight:1.1, letterSpacing:'-0.04em', color:'var(--text)', marginBottom:20 }}>
            Build Smarter.<br/>
            <span style={{ background:'linear-gradient(135deg, var(--accent-light), var(--purple))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              Manage Better.
            </span>
          </h1>
          <p style={{ fontSize:16, color:'var(--text-secondary)', lineHeight:1.75, maxWidth:460 }}>
            Real-time payment tracking, inventory control, AI-powered forecasting, and invoice generation — all in one platform built for construction professionals.
          </p>
        </div>

        {/* Feature pills */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginBottom:48 }}>
          {['👷 Labor Payments','📦 Inventory','🧾 Invoices','💰 Finance','✨ AI Forecast'].map(f => (
            <span key={f} style={{ padding:'7px 14px', borderRadius:20, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>{f}</span>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:40 }}>
          {[{ n:'200+', l:'Workers Tracked' }, { n:'4', l:'Active Sites' }, { n:'Real-time', l:'Analytics' }].map(s => (
            <div key={s.l}>
              <div style={{ fontSize:26, fontWeight:800, color:'var(--accent-light)', letterSpacing:'-0.02em' }}>{s.n}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3, fontWeight:500 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div className="login-panel" style={{
        width:500, display:'flex', alignItems:'center', justifyContent:'center', padding:40,
        position:'relative', zIndex:1,
        opacity: ready?1:0, transform: ready?'translateY(0)':'translateY(24px)',
        transition:'all 0.9s cubic-bezier(0.22,1,0.36,1) 0.15s',
      }}>
        <div style={{ width:'100%' }}>
          {/* Card */}
          <div style={{ background:'var(--bg-card)', borderRadius:24, padding:'44px 40px', border:'1px solid var(--border)', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', position:'relative', overflow:'hidden' }}>
            {/* Card glow */}
            <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>

            <h2 style={{ fontSize:26, fontWeight:800, color:'var(--text)', marginBottom:6, letterSpacing:'-0.02em' }}>Welcome back</h2>
            <p style={{ color:'var(--text-muted)', fontSize:14, marginBottom:36 }}>Sign in to your workspace</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-secondary)', marginBottom:8, letterSpacing:'0.02em' }}>EMAIL ADDRESS</label>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@samarth.dev"
                  style={{ width:'100%', padding:'13px 16px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text)', fontSize:14, outline:'none', fontFamily:'var(--font)', transition:'all 0.2s' }}
                  onFocus={e=>{ e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px var(--accent-soft)'; }}
                  onBlur={e=>{ e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none'; }}
                />
              </div>

              <div style={{ marginBottom:32 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text-secondary)', marginBottom:8, letterSpacing:'0.02em' }}>PASSWORD</label>
                <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
                  style={{ width:'100%', padding:'13px 16px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:12, color:'var(--text)', fontSize:14, outline:'none', fontFamily:'var(--font)', transition:'all 0.2s' }}
                  onFocus={e=>{ e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px var(--accent-soft)'; }}
                  onBlur={e=>{ e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none'; }}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'14px', borderRadius:12, border:'none',
                background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                color:'white', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer',
                fontFamily:'var(--font)', transition:'all 0.2s', opacity:loading?0.7:1,
                boxShadow: loading ? 'none' : '0 8px 32px var(--accent-glow)',
                letterSpacing:'0.01em',
              }}>
                {loading ? (
                  <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                    <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }}/>
                    Signing in…
                  </span>
                ) : 'Sign In →'}
              </button>
            </form>

            {/* Demo credentials */}
            <div style={{ marginTop:28, padding:'16px', background:'var(--bg-elevated)', borderRadius:12, border:'1px solid var(--border)' }}>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>Demo Credentials</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {demos.map(d => (
                  <button key={d.role} onClick={()=>{ setEmail(d.email); setPassword(d.pass); }} style={{ background:'none', border:'none', cursor:'pointer', textAlign:'left', padding:'5px 8px', borderRadius:8, fontFamily:'var(--mono)', fontSize:11, color:'var(--text-secondary)', transition:'all 0.15s' }}
                    onMouseOver={e=>{ e.currentTarget.style.background='var(--accent-soft)'; e.currentTarget.style.color='var(--accent-light)'; }}
                    onMouseOut={e=>{ e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-secondary)'; }}
                  >
                    <span style={{ color:'var(--text-muted)', marginRight:6 }}>{d.role}:</span>{d.email}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
