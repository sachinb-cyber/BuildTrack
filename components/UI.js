'use client';
import React from 'react';

/* ── Page Wrapper ── */
export const Page = ({ title, subtitle, actions, children }) => (
  <div style={{ maxWidth: 1200, margin: '0 auto' }}>
    <div className="animate-in delay-1" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:40, flexWrap:'wrap', gap:16, borderBottom:'1px solid var(--border)', paddingBottom:20 }}>
      <div>
        <h1 style={{ fontSize:30, fontWeight:600, letterSpacing:'-0.03em', lineHeight:1.1, color:'var(--text)' }}>{title}</h1>
        {subtitle && <p style={{ color:'var(--text-secondary)', fontSize:14, marginTop:8, fontWeight:400, letterSpacing:'-0.01em' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>{actions}</div>}
    </div>
    {children}
  </div>
);

/* ── Card ── */
export const Card = ({ title, extra, children, style: s, className, noPad }) => (
  <div className={`precision-border ${className || ''}`} style={{
    background:'var(--bg-card)', borderRadius:'var(--radius)',
    border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)',
    transition:'background 0.2s, transform 0.2s', ...s,
  }}>
    {title && (
      <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:500, fontSize:14, color:'var(--text)' }}>{title}</span>
        {extra}
      </div>
    )}
    <div style={{ padding: noPad ? 0 : (title ? 20 : 20) }}>{children}</div>
  </div>
);

/* ── Stat Card ── */
export const StatCard = ({ title, value, sub, icon, color='var(--accent)', delay=0, chart, trend }) => (
  <div className={`animate-in delay-${delay} precision-border`} style={{
    background:'var(--bg-card)', borderRadius:'var(--radius)', padding:20,
    border:'1px solid var(--border)', cursor:'default', position:'relative', overflow:'hidden',
    boxShadow:'var(--shadow-sm)', transition:'all 0.2s'
  }}
    onMouseOver={e => { e.currentTarget.style.background='var(--bg-card-hover)'; }}
    onMouseOut={e => { e.currentTarget.style.background='var(--bg-card)'; }}
  >
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
      <div style={{ width:36, height:36, borderRadius:8, background:'var(--bg-elevated)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, border:'1px solid var(--border)', color: 'var(--text-secondary)' }}>{icon}</div>
      {trend !== undefined && (
        <span style={{ fontSize:12, fontWeight:500, padding:'2px 8px', borderRadius:12, background: trend>=0?'var(--green-soft)':'var(--red-soft)', color: trend>=0?'var(--green)':'var(--red)' }}>
          {trend>=0?'↑':'↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div style={{ fontSize:32, fontWeight:600, letterSpacing:'-0.03em', color:'var(--text)', marginBottom:4, fontFamily:'var(--font)' }}>{value}</div>
    <div style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>{title}</div>
    {sub && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{sub}</div>}
    {chart && <div style={{ marginTop:16 }}>{chart}</div>}
  </div>
);

/* ── Data Table ── */
export const DataTable = ({ columns, data, actions }) => (
  <div style={{ overflowX:'auto' }}>
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
      <thead>
        <tr>
          {columns.map((c,i) => (
            <th key={i} style={{ padding:'12px 20px', textAlign:'left', fontWeight:500, color:'var(--text-muted)', borderBottom:'1px solid var(--border)', fontSize:12, letterSpacing:'0.02em', whiteSpace:'nowrap', background:'var(--bg-surface)' }}>{c.label}</th>
          ))}
          {actions && <th style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg-surface)' }}/>}
        </tr>
      </thead>
      <tbody>
        {data.map((row,ri) => (
          <tr key={ri} style={{ transition:'background 0.15s', borderBottom:'1px solid var(--border)' }}
            onMouseOver={e => e.currentTarget.style.background='var(--bg-card-hover)'}
            onMouseOut={e => e.currentTarget.style.background='transparent'}
          >
            {columns.map((c,ci) => (
              <td key={ci} style={{ padding:'14px 20px', color:'var(--text)', verticalAlign:'middle', fontSize:13 }}>
                {c.render ? c.render(row[c.key], row) : row[c.key]}
              </td>
            ))}
            {actions && <td style={{ padding:'14px 20px', textAlign:'right' }}>{actions(row)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
    {data.length===0 && <div style={{ padding:'48px 20px', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No records found</div>}
  </div>
);

/* ── Badge ── */
const badgeCfg = {
  paid:      { bg:'var(--green-soft)',  color:'var(--green)', border: 'transparent' },
  pending:   { bg:'var(--yellow-soft)', color:'var(--yellow)', border: 'transparent' },
  partial:   { bg:'var(--cyan-soft)',   color:'var(--cyan)', border: 'transparent' },
  overdue:   { bg:'var(--red-soft)',    color:'var(--red)', border: 'transparent' },
  active:    { bg:'var(--green-soft)',  color:'var(--green)', border: 'transparent' },
  planning:  { bg:'var(--purple-soft)', color:'var(--purple)', border: 'transparent' },
  'on-hold': { bg:'var(--yellow-soft)', color:'var(--yellow)', border: 'transparent' },
  completed: { bg:'var(--accent-soft)', color:'var(--accent-light)', border:'transparent' },
  draft:     { bg:'rgba(255,255,255,0.05)', color:'var(--text-secondary)', border:'transparent' },
  cancelled: { bg:'var(--red-soft)',    color:'var(--red)', border: 'transparent' },
  normal:    { bg:'var(--green-soft)',  color:'var(--green)', border: 'transparent' },
  low:       { bg:'var(--yellow-soft)', color:'var(--yellow)', border: 'transparent' },
  critical:  { bg:'var(--red-soft)',    color:'var(--red)', border: 'transparent' },
  in:        { bg:'var(--green-soft)',  color:'var(--green)', border: 'transparent' },
  out:       { bg:'var(--red-soft)',    color:'var(--red)', border: 'transparent' },
};

export const Badge = ({ status }) => {
  const key = (status||'').toLowerCase().replace(/\s+/g,'-');
  const cfg = badgeCfg[key] || { bg:'transparent', color:'var(--text-secondary)', border:'var(--border)' };
  return (
    <span style={{ padding:'2px 8px', borderRadius:'12px', fontSize:11, fontWeight:500, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, whiteSpace:'nowrap', textTransform:'capitalize' }}>{status}</span>
  );
};

/* ── Button ── */
const btnStyles = {
  primary:   { bg:'var(--text)', color:'#000', border:'1px solid transparent', shadow:'var(--shadow-sm)' },
  secondary: { bg:'var(--bg-elevated)', color:'var(--text)', border:'1px solid var(--border)', shadow:'var(--shadow-sm)' },
  ghost:     { bg:'transparent', color:'var(--text-secondary)', border:'1px solid transparent', shadow:'none' },
  danger:    { bg:'var(--red-soft)', color:'var(--red)', border:'1px solid rgba(232,74,95,0.3)', shadow:'none' },
  success:   { bg:'var(--green-soft)', color:'var(--green)', border:'1px solid rgba(31,223,100,0.3)', shadow:'none' },
};

export const Btn = ({ children, variant='primary', icon, onClick, size='md', type='button', disabled, style:s, className }) => {
  const st = btnStyles[variant] || btnStyles.primary;
  const pad = size==='sm' ? '6px 12px' : size==='lg' ? '12px 24px' : '8px 16px';
  const fs = size==='sm' ? 12 : size==='lg' ? 14 : 13;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`precision-border ${className||''}`} style={{
      padding:pad, borderRadius:'var(--radius-sm)', background:st.bg, color:st.color,
      border:st.border, fontSize:fs, fontWeight:500, cursor:disabled?'not-allowed':'pointer',
      opacity:disabled?0.5:1, display:'inline-flex', alignItems:'center', gap:8,
      fontFamily:'var(--font)', transition:'transform 0.1s, filter 0.2s', boxShadow:st.shadow,
      whiteSpace:'nowrap', ...s,
    }}
      onMouseDown={e => { if(!disabled) e.currentTarget.style.transform='scale(0.97)'; }}
      onMouseUp={e => { if(!disabled) e.currentTarget.style.transform='scale(1)'; }}
      onMouseLeave={e => { if(!disabled) e.currentTarget.style.transform='scale(1)'; }}
      onMouseOver={e => { if(!disabled) e.currentTarget.style.filter='brightness(1.1)'; }}
      onMouseOut={e => { if(!disabled) e.currentTarget.style.filter='brightness(1)'; }}
    >{icon}{children}</button>
  );
};
export const Button = Btn;

/* ── Input ── */
export const Input = ({ label, error, style:s, className, ...props }) => (
  <div className={className} style={s}>
    {label && <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:8 }}>{label}</label>}
    <input {...props} style={{
      width:'100%', padding:'10px 14px', background:'var(--bg-input)',
      border:`1px solid ${error?'var(--red)':'var(--border)'}`,
      borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:14, outline:'none',
      fontFamily:'var(--font)', transition:'border-color 0.2s, box-shadow 0.2s',
      boxShadow:'inset 0 1px 2px rgba(0,0,0,0.2)'
    }}
      onFocus={e => { e.target.style.borderColor='var(--text-muted)'; }}
      onBlur={e => { e.target.style.borderColor=error?'var(--red)':'var(--border)'; }}
    />
    {error && <p style={{ color:'var(--red)', fontSize:12, marginTop:4, fontWeight:500 }}>{error}</p>}
  </div>
);

/* ── Select ── */
export const Select = ({ label, options=[], className, style:s, ...props }) => (
  <div className={className} style={s}>
    {label && <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:8 }}>{label}</label>}
    <select {...props} style={{
      width:'100%', padding:'10px 14px', background:'var(--bg-input)',
      border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
      color:'var(--text)', fontSize:14, outline:'none', fontFamily:'var(--font)', cursor:'pointer',
      transition:'border-color 0.2s', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.2)',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      backgroundSize: '14px'
    }}
      onFocus={e => { e.target.style.borderColor='var(--text-muted)'; }}
      onBlur={e => { e.target.style.borderColor='var(--border)'; }}
    >
      {options.map(o => <option key={o.value} value={o.value} style={{ background:'var(--bg-elevated)', color:'var(--text)' }}>{o.label}</option>)}
    </select>
  </div>
);

/* ── Modal ── */
export const Modal = ({ isOpen, onClose, title, children, size='md' }) => {
  if (!isOpen) return null;
  const widths = { sm:440, md:500, lg:680, xl:840 };
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      className="modal-backdrop"
    >
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }} onClick={onClose}/>
      <div className="modal-inner precision-border" style={{
        position:'relative', background:'var(--bg-surface)', borderRadius:'var(--radius)',
        border:'1px solid var(--border)', width:'100%', maxWidth:widths[size],
        maxHeight:'85vh', overflowY:'auto', boxShadow:'var(--shadow-lg)',
        animation:'fadeInUp 0.3s cubic-bezier(0.2,0,0,1)',
      }}>
        <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'var(--bg-surface)', zIndex:1 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>{title}</h2>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, transition:'all 0.2s', padding:4, borderRadius:4 }}
            onMouseOver={e => { e.currentTarget.style.color='var(--text)'; e.currentTarget.style.background='var(--border)'; }}
            onMouseOut={e => { e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.background='transparent'; }}
          >✕</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
};

/* ── Loading ── */
export const Loading = () => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', gap:16 }}>
    <div style={{ width:24, height:24, border:'2px solid var(--border)', borderTopColor:'var(--text)', borderRadius:'50%', animation:'spin 0.6s linear infinite' }}/>
    <span style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:500 }}>Loading…</span>
  </div>
);

/* ── Empty State ── */
export const EmptyState = ({ icon, title, description, action }) => (
  <div style={{ textAlign:'center', padding:'64px 20px' }}>
    <div style={{ fontSize:32, marginBottom:16, color:'var(--text-muted)' }}>{icon}</div>
    <h3 style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:8 }}>{title}</h3>
    <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:24, maxWidth:300, margin:'0 auto 24px' }}>{description}</p>
    {action}
  </div>
);

/* ── Alert Card ── */
export const AlertCard = ({ type='warning', title, items }) => {
  const cfg = { warning:{ border:'var(--yellow-soft)', bg:'var(--yellow-soft)', color:'var(--yellow)' }, danger:{ border:'var(--red-soft)', bg:'var(--red-soft)', color:'var(--red)' }, info:{ border:'var(--border)', bg:'var(--bg-elevated)', color:'var(--text)' } }[type]||{};
  return (
    <div style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
      <h4 style={{ fontSize:13, fontWeight:600, color:cfg.color, marginBottom:items?.length?6:0 }}>{title}</h4>
      {items && <ul style={{ margin:0, paddingLinkStart:16, listStyleType:'circle' }}>{items.map((item,i) => <li key={i} style={{ fontSize:12, color:cfg.color, opacity:0.9, marginBottom:4 }}>{item}</li>)}</ul>}
    </div>
  );
};

/* ── Mini Bar Chart ── */
export const MiniBarChart = ({ data=[], color, height=48 }) => {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height }}>
      {data.map((v,i) => (
        <div key={i} style={{ flex:1, borderRadius:'1px 1px 0 0', height:`${(v/max)*100}%`, background:color, opacity:0.8, minHeight:2, transition:'height 0.4s cubic-bezier(0.2,0,0,1)' }}/>
      ))}
    </div>
  );
};

/* ── Divider ── */
export const Divider = ({ style:s }) => <div style={{ height:1, background:'var(--border)', margin:'16px 0', ...s }}/>;

/* ── Grid ── */
export const Grid = ({ cols=4, gap=16, children, style:s }) => (
  <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap, ...s }}>{children}</div>
);
