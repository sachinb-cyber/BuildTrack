'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';

const bottomNav = [
  { path:'/',          label:'Home',      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { path:'/workers',   label:'Labor',     icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { path:'/inventory', label:'Stock',     icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { path:'/expenses',  label:'Finance',   icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { path:'/projects',  label:'Projects',  icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
];

export default function Layout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-deep)', flexDirection:'column', gap:16 }}>
      <div style={{ width:44, height:44, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <span style={{ fontSize:13, color:'var(--text-muted)' }}>Loading…</span>
    </div>
  );

  if (!user) return null;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'transparent' }}>
      {/* Desktop sidebar */}
      <div className="desktop-sidebar">
        <Sidebar/>
      </div>

      {/* Main content */}
      <main className="main-content" style={{ marginLeft:'var(--sidebar-w)', flex:1, padding:'32px 28px', transition:'margin-left 0.3s', minWidth:0 }}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {bottomNav.map(item => {
          const active = item.path==='/' ? pathname==='/' || pathname==='/dashboard' : pathname.startsWith(item.path);
          return (
            <Link key={item.path} href={item.path==='/'?'/dashboard':item.path} style={{ flex:1, textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, padding:'6px 4px', color: active?'var(--accent-light)':'var(--text-muted)', transition:'color 0.2s' }}>
              <div style={{ position:'relative' }}>
                {item.icon}
                {active && <div style={{ position:'absolute', bottom:-6, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:'50%', background:'var(--accent)' }}/>}
              </div>
              <span style={{ fontSize:10, fontWeight: active?700:500, letterSpacing:'0.02em' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
