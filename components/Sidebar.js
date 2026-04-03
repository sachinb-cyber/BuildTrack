'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Logo from './Logo';

const nav = [
  { path:'/',          label:'Dashboard',      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
  { path:'/workers',   label:'Labor',          icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { path:'/staff',     label:'Staff',          icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { path:'/inventory', label:'Inventory',      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></svg> },
  { path:'/invoices',  label:'Invoices',       icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { path:'/expenses',  label:'Finance',        icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { path:'/projects',  label:'Projects',       icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
  { path:'/geo-capture', label:'Geo Photo',      icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> },
  { path:'/deliveries', label:'Deliveries',     icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { path:'/forecast',  label:'AI Forecast',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase()||'?';

  const w = expanded ? 'var(--sidebar-expanded)' : 'var(--sidebar-w)';

  return (
    <>
      {/* Overlay on mobile when expanded */}
      {expanded && <div onClick={()=>setExpanded(false)} style={{ position:'fixed', inset:0, zIndex:98, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)' }}/>}

      <aside style={{
        width:w, background:'var(--bg-card)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0,
        zIndex:99, transition:'width 0.3s cubic-bezier(0.2,0,0,1)', overflow:'hidden',
      }}>
        {/* Logo + toggle */}
        <div style={{ padding:'18px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:72 }}>
          <div style={{ overflow:'hidden', whiteSpace:'nowrap' }}>
            {expanded ? <Logo size={36} showText={true}/> : <Logo size={36} showText={false}/>}
          </div>
          <button onClick={()=>setExpanded(e=>!e)} style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)', flexShrink:0, transition:'all 0.2s', marginLeft:expanded?8:0 }}
            onMouseOver={e=>e.currentTarget.style.borderColor='var(--accent)'}
            onMouseOut={e=>e.currentTarget.style.borderColor='var(--border)'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              {expanded ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto', overflowX:'hidden' }}>
          {nav.map(item => {
            const active = item.path==='/' ? pathname==='/' : pathname.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path} style={{ textDecoration:'none' }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
                  borderRadius:10, marginBottom:2, cursor:'pointer', transition:'all 0.2s',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent-light)' : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400, fontSize:14, whiteSpace:'nowrap',
                  position:'relative',
                }}
                  onMouseOver={e=>{ if(!active){ e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='var(--text-secondary)'; }}}
                  onMouseOut={e=>{ if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; }}}
                >
                  {/* Active indicator */}
                  {active && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:20, background:'var(--accent)', borderRadius:'0 3px 3px 0' }}/>}
                  <span style={{ flexShrink:0 }}>{item.icon}</span>
                  {expanded && <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding:'12px 10px', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, background:'var(--bg-elevated)', border:'1px solid var(--border)' }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,var(--accent),var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white', flexShrink:0 }}>{initials}</div>
            {expanded && (
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' }}>{user?.name}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>{user?.role}</div>
              </div>
            )}
            {expanded && (
              <button onClick={()=>{ logout(); router.push('/login'); }} title="Sign out" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4, borderRadius:6, display:'flex', transition:'color 0.2s' }}
                onMouseOver={e=>e.currentTarget.style.color='var(--red)'}
                onMouseOut={e=>e.currentTarget.style.color='var(--text-muted)'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
