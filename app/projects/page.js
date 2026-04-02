'use client';
import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Page, Badge, Btn, Input, Select, Modal, Loading, EmptyState } from '@/components/UI';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const statusColor = { active:'var(--green)', planning:'var(--accent)', 'on-hold':'var(--yellow)', completed:'var(--text-muted)' };

export default function Projects() {
  const { hasRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({ name:'', location:'', client:'', startDate:'', expectedEndDate:'', budget:'', status:'planning', description:'' });

  const fetchData = useCallback(async () => {
    try { const res = await api.get('/projects'); setProjects(res.data); }
    catch(e){ console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', { ...form, budget:Number(form.budget||0) });
      toast.success('Project created'); setShowAdd(false);
      setForm({ name:'', location:'', client:'', startDate:'', expectedEndDate:'', budget:'', status:'planning', description:'' }); fetchData();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  const loadDetail = async (id) => {
    try { const res = await api.get(`/projects/${id}`); setShowDetail(res.data); }
    catch(e){ console.error(e); }
  };

  const updateStatus = async (id, status) => {
    try { await api.put(`/projects/${id}`, { status }); toast.success('Status updated'); fetchData(); if(showDetail) loadDetail(id); }
    catch(e){ toast.error('Error'); }
  };

  if (loading) return <Layout><Loading/></Layout>;

  return (
    <Layout>
      <Page title="Projects & Sites" subtitle={`${projects.length} project${projects.length!==1?'s':''}`}
        actions={hasRole('admin')&&<Btn icon={<span style={{fontSize:16}}>+</span>} onClick={()=>setShowAdd(true)}>New Project</Btn>}>

        {projects.length===0 ? (
          <EmptyState icon="🏗️" title="No projects" description="Create projects to organize work" action={hasRole('admin')&&<Btn onClick={()=>setShowAdd(true)}>Create Project</Btn>}/>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {projects.map((p,i) => {
              const pct = p.budget>0 ? Math.round((p.spent/p.budget)*100) : 0;
              const color = statusColor[p.status]||'var(--text-muted)';
              const barColor = pct>90?'var(--red)':pct>70?'var(--yellow)':'var(--green)';
              return (
                <div key={p._id} className={`animate-in delay-${(i%6)+1}`} style={{ background:'var(--bg-card)', borderRadius:'var(--radius)', border:'1px solid var(--border)', cursor:'pointer', transition:'all 0.25s', overflow:'hidden' }}
                  onMouseOver={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 12px 40px ${color}20`; }}
                  onMouseOut={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
                  onClick={()=>loadDetail(p._id)}
                >
                  <div style={{ height:3, background:`linear-gradient(90deg,${color},${color}66)` }}/>
                  <div style={{ padding:22 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:'var(--text)', marginBottom:5 }}>{p.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>📍 {p.location}</div>
                      </div>
                      <Badge status={p.status}/>
                    </div>
                    {p.client&&<div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:14 }}>Client: <span style={{color:'var(--text-secondary)',fontWeight:500}}>{p.client}</span></div>}
                    <div style={{ marginBottom:14 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:7 }}>
                        <span style={{color:'var(--text-muted)'}}>Budget Used</span>
                        <span style={{fontWeight:700,color:barColor,fontFamily:'var(--mono)'}}>{pct}%</span>
                      </div>
                      <div style={{ height:6, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ width:`${Math.min(100,pct)}%`, height:'100%', borderRadius:3, background:barColor, transition:'width 0.8s ease' }}/>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginTop:5, color:'var(--text-muted)', fontFamily:'var(--mono)' }}>
                        <span>Spent: {formatCurrency(p.spent)}</span>
                        <span>Budget: {formatCurrency(p.budget)}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)' }}>
                      <span>Start: {formatDate(p.startDate)}</span>
                      <span>End: {formatDate(p.expectedEndDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal isOpen={!!showDetail} onClose={()=>setShowDetail(null)} title={showDetail?.name} size="lg">
          {showDetail&&(
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {[{label:'Location',value:showDetail.location},{label:'Client',value:showDetail.client||'—'},{label:'Status',value:<Badge status={showDetail.status}/>},{label:'Manager',value:showDetail.manager?.name||'—'}].map((item,i)=>(
                  <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:10, padding:14 }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:5 }}>{item.label}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                {[{label:'Budget',value:formatCurrency(showDetail.budget),color:'var(--accent-light)'},{label:'Spent',value:formatCurrency(showDetail.calculatedSpent||showDetail.spent),color:'var(--yellow)'},{label:'Remaining',value:formatCurrency(showDetail.budget-(showDetail.calculatedSpent||showDetail.spent)),color:'var(--green)'}].map((item,i)=>(
                  <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:10, padding:16, textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>{item.label}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:item.color, fontFamily:'var(--mono)' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {showDetail.workers?.length>0&&(
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>Workers ({showDetail.workers.length})</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {showDetail.workers.map(w=>(
                      <span key={w._id} style={{ fontSize:12, background:'var(--bg-elevated)', border:'1px solid var(--border)', padding:'4px 12px', borderRadius:20, color:'var(--text-secondary)' }}>{w.name} <span style={{color:'var(--text-muted)'}}>({w.skill})</span></span>
                    ))}
                  </div>
                </div>
              )}
              {hasRole('admin','engineer')&&(
                <div style={{ display:'flex', gap:8, paddingTop:16, borderTop:'1px solid var(--border)' }}>
                  {showDetail.status!=='active'&&<Btn size="sm" variant="success" onClick={()=>updateStatus(showDetail._id,'active')}>Set Active</Btn>}
                  {showDetail.status!=='on-hold'&&<Btn size="sm" variant="secondary" onClick={()=>updateStatus(showDetail._id,'on-hold')}>Hold</Btn>}
                  {showDetail.status!=='completed'&&<Btn size="sm" variant="secondary" onClick={()=>updateStatus(showDetail._id,'completed')}>Complete</Btn>}
                </div>
              )}
            </div>
          )}
        </Modal>

        <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Create Project">
          <form onSubmit={handleAdd}>
            <Input label="Project Name" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g., Nashik Heights Tower B" style={{marginBottom:16}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Location" required value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/>
              <Input label="Client" value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Start Date" type="date" required value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/>
              <Input label="Expected End Date" type="date" value={form.expectedEndDate} onChange={e=>setForm(f=>({...f,expectedEndDate:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Budget (₹)" type="number" value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))}/>
              <Select label="Status" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} options={[{value:'planning',label:'Planning'},{value:'active',label:'Active'},{value:'on-hold',label:'On Hold'}]}/>
            </div>
            <Input label="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{marginBottom:24}}/>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn type="submit">Create Project</Btn>
            </div>
          </form>
        </Modal>
      </Page>
    </Layout>
  );
}
