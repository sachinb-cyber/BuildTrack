'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  { path:'/geo-capture', label:'Geo Photo',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> },
  { path:'/deliveries', label:'Deliveries',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v4h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
  { path:'/forecast',  label:'AI Forecast',    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { path:'/users',     label:'Users',          icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10.67 20H14a2 2 0 0 0 2-2v-1a3.33 3.33 0 0 0-1.06-2.43"/><path d="M2 21v-1a4 4 0 0 1 4-4h5"/></svg>, adminOnly:true },
];

const typeIcon = { material:'📦', project:'🏗️', invoice:'🧾', worker:'👷', expense:'💰', delivery:'🚚' };

/* ── Global Search Overlay ── */
function SearchOverlay({ onClose }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const debounce = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = useCallback((val) => {
    clearTimeout(debounce.current);
    if (val.length < 2) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const stored = JSON.parse(localStorage.getItem('user') || 'null');
        const token = stored?.token;
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        setResults(data);
        setSelected(0);
      } catch {}
      finally { setLoading(false); }
    }, 280);
  }, []);

  const go = (item) => { router.push(item.href); onClose(); };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) go(results[selected]);
    if (e.key === 'Escape') onClose();
  };

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'10vh' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'min(600px,90vw)', background:'var(--bg-card)', borderRadius:16, border:'1px solid var(--border)', boxShadow:'0 24px 80px rgba(0,0,0,0.6)', overflow:'hidden' }}>
        {/* Search input */}
        <div style={{ display:'flex', alignItems:'center', padding:'14px 18px', gap:12, borderBottom:'1px solid var(--border)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ color:'var(--text-muted)', flexShrink:0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); search(e.target.value); }}
            onKeyDown={handleKey}
            placeholder="Search materials, projects, invoices, workers…"
            style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:15, color:'var(--text)', fontFamily:'var(--font)' }}
          />
          {loading && <div style={{ width:16, height:16, border:'2px solid var(--accent)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', flexShrink:0 }}/>}
          <kbd onClick={onClose} style={{ fontSize:11, padding:'2px 7px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:5, color:'var(--text-muted)', cursor:'pointer' }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight:'60vh', overflowY:'auto' }}>
          {results.length === 0 && q.length >= 2 && !loading && (
            <div style={{ padding:'32px 18px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No results for "{q}"</div>
          )}
          {results.length === 0 && q.length < 2 && (
            <div style={{ padding:'32px 18px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>
              Type at least 2 characters to search
            </div>
          )}
          {results.map((r, i) => (
            <div
              key={r._id || i}
              onClick={() => go(r)}
              onMouseEnter={() => setSelected(i)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', cursor:'pointer', background: i === selected ? 'var(--accent-soft)' : 'transparent', borderBottom:'1px solid var(--border)', transition:'background 0.1s' }}
            >
              <span style={{ fontSize:18, flexShrink:0 }}>{typeIcon[r.type] || '🔍'}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color: i === selected ? 'var(--accent-light)' : 'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.label}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{r.sub}</div>
              </div>
              <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', padding:'2px 8px', borderRadius:8, background:'var(--bg-elevated)', color:'var(--text-muted)', flexShrink:0 }}>{r.type}</span>
            </div>
          ))}
        </div>

        {results.length > 0 && (
          <div style={{ padding:'8px 18px', borderTop:'1px solid var(--border)', display:'flex', gap:16, fontSize:11, color:'var(--text-muted)' }}>
            <span>↑↓ Navigate</span><span>↵ Go</span><span>Esc Close</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase()||'?';

  // Keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const w = expanded ? 'var(--sidebar-expanded)' : 'var(--sidebar-w)';

  return (
    <>
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}

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

        {/* Search button */}
        <div style={{ padding:'10px 10px 4px' }}>
          <button onClick={() => setShowSearch(true)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--bg-elevated)', cursor:'pointer', color:'var(--text-muted)', fontSize:13, fontFamily:'var(--font)', transition:'all 0.2s' }}
            onMouseOver={e=>{ e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--text)'; }}
            onMouseOut={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-muted)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ flexShrink:0 }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            {expanded && <span style={{ flex:1, textAlign:'left' }}>Search…</span>}
            {expanded && <kbd style={{ fontSize:10, padding:'1px 5px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:4 }}>⌘K</kbd>}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px 10px', overflowY:'auto', overflowX:'hidden' }}>
          {nav.filter(item => !item.adminOnly || user?.role === 'admin').map(item => {
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
