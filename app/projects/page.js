'use client';
import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Page, Badge, Btn, Input, Select, Modal, Loading, EmptyState } from '@/components/UI';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const statusColor = { active:'var(--green)', planning:'var(--accent)', 'on-hold':'var(--yellow)', completed:'var(--text-muted)' };
const PHASES = ['Foundation', 'Structure', 'Finishing', 'Handover'];
const phaseStatusColor = { pending:'var(--text-muted)', active:'var(--accent)', completed:'var(--green)' };

export default function Projects() {
  const { hasRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [form, setForm] = useState({ name:'', location:'', client:'', startDate:'', expectedEndDate:'', budget:'', status:'planning', description:'' });
  const [phaseForm, setPhaseForm] = useState({ name:'Foundation', status:'pending', startDate:'', endDate:'', budget:'', description:'' });

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

  const updatePhaseStatus = async (phaseId, status) => {
    try {
      await api.put(`/projects/${showDetail._id}`, { _updatePhase: { phaseId, status } });
      toast.success('Phase updated'); loadDetail(showDetail._id);
    } catch(e){ toast.error('Error'); }
  };

  const handleAddPhase = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${showDetail._id}`, { _addPhase: { ...phaseForm, budget: Number(phaseForm.budget||0) } });
      toast.success('Phase added'); setShowPhaseModal(false);
      setPhaseForm({ name:'Foundation', status:'pending', startDate:'', endDate:'', budget:'', description:'' });
      loadDetail(showDetail._id);
    } catch(e){ toast.error(e.response?.data?.message||'Phase already exists or error'); }
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
              const barColor = pct>=100?'var(--red)':pct>=80?'var(--yellow)':'var(--green)';
              const completedPhases = (p.phases||[]).filter(ph=>ph.status==='completed').length;
              return (
                <div key={p._id} className={`animate-in delay-${(i%6)+1}`}
                  style={{ background:'var(--bg-card)', borderRadius:'var(--radius)', border:`1px solid ${pct>=100?'rgba(232,74,95,0.3)':pct>=80?'rgba(226,183,20,0.2)':'var(--border)'}`, cursor:'pointer', transition:'all 0.25s', overflow:'hidden' }}
                  onMouseOver={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 12px 40px ${color}20`; }}
                  onMouseOut={e=>{ e.currentTarget.style.borderColor=pct>=100?'rgba(232,74,95,0.3)':pct>=80?'rgba(226,183,20,0.2)':'var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
                  onClick={()=>loadDetail(p._id)}
                >
                  <div style={{ height:3, background:`linear-gradient(90deg,${color},${color}66)` }}/>
                  <div style={{ padding:22 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:'var(--text)', marginBottom:5 }}>{p.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4 }}>📍 {p.location}</div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                        <Badge status={p.status}/>
                        {pct>=100&&<span style={{ fontSize:10, fontWeight:700, color:'var(--red)', background:'rgba(232,74,95,0.1)', padding:'2px 6px', borderRadius:4 }}>OVER BUDGET</span>}
                        {pct>=80&&pct<100&&<span style={{ fontSize:10, fontWeight:700, color:'var(--yellow)', background:'rgba(226,183,20,0.1)', padding:'2px 6px', borderRadius:4 }}>WARNING</span>}
                      </div>
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
                    {/* Phase progress */}
                    {(p.phases||[]).length > 0 && (
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>Phases: {completedPhases}/{p.phases.length} completed</div>
                        <div style={{ display:'flex', gap:4 }}>
                          {p.phases.map(ph=>(
                            <div key={ph._id} style={{ flex:1, height:4, borderRadius:2, background:phaseStatusColor[ph.status]||'var(--border)', opacity:0.8 }} title={`${ph.name}: ${ph.status}`}/>
                          ))}
                        </div>
                      </div>
                    )}
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

        {/* Project Detail Modal */}
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
                {[
                  {label:'Budget',value:formatCurrency(showDetail.budget),color:'var(--accent-light)'},
                  {label:'Spent',value:formatCurrency(showDetail.calculatedSpent||showDetail.spent),color:'var(--yellow)'},
                  {label:'Remaining',value:formatCurrency(showDetail.budget-(showDetail.calculatedSpent||showDetail.spent)),color:'var(--green)'}
                ].map((item,i)=>(
                  <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:10, padding:16, textAlign:'center' }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>{item.label}</div>
                    <div style={{ fontSize:22, fontWeight:800, color:item.color, fontFamily:'var(--mono)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Phase Tracking */}
              <div style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Project Phases</div>
                  {hasRole('admin','engineer')&&<Btn size="sm" onClick={()=>setShowPhaseModal(true)}>+ Add Phase</Btn>}
                </div>
                {(showDetail.phases||[]).length===0 ? (
                  <div style={{ fontSize:13, color:'var(--text-muted)', padding:'12px 0' }}>No phases added yet. Add phases to track project progress.</div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
                    {showDetail.phases.map((ph,i)=>{
                      const phPct = ph.budget>0 ? Math.round((ph.spent/ph.budget)*100) : 0;
                      return (
                        <div key={ph._id} style={{ background:'var(--bg-elevated)', borderRadius:10, padding:14, border:`1px solid ${phaseStatusColor[ph.status]}22` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                            <div style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{ph.name}</div>
                            <span style={{ fontSize:11, fontWeight:600, color:phaseStatusColor[ph.status], background:`${phaseStatusColor[ph.status]}18`, padding:'2px 8px', borderRadius:12 }}>{ph.status}</span>
                          </div>
                          {ph.budget>0&&(
                            <div style={{ marginBottom:8 }}>
                              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>Budget: {formatCurrency(ph.budget)}</div>
                              <div style={{ height:4, background:'var(--bg-deep)', borderRadius:2, overflow:'hidden' }}>
                                <div style={{ width:`${Math.min(100,phPct)}%`, height:'100%', background:phPct>=100?'var(--red)':phPct>=80?'var(--yellow)':'var(--green)', borderRadius:2 }}/>
                              </div>
                            </div>
                          )}
                          {ph.startDate&&<div style={{ fontSize:11, color:'var(--text-muted)' }}>{formatDate(ph.startDate)} → {formatDate(ph.endDate)}</div>}
                          {hasRole('admin','engineer')&&ph.status!=='completed'&&(
                            <div style={{ display:'flex', gap:6, marginTop:10 }}>
                              {ph.status==='pending'&&<Btn size="sm" variant="secondary" style={{flex:1,fontSize:11}} onClick={()=>updatePhaseStatus(ph._id,'active')}>Start</Btn>}
                              {ph.status==='active'&&<Btn size="sm" variant="success" style={{flex:1,fontSize:11}} onClick={()=>updatePhaseStatus(ph._id,'completed')}>Complete</Btn>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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

        {/* Add Phase Modal */}
        <Modal isOpen={showPhaseModal} onClose={()=>setShowPhaseModal(false)} title="Add Project Phase">
          <form onSubmit={handleAddPhase}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Select label="Phase" value={phaseForm.name} onChange={e=>setPhaseForm(f=>({...f,name:e.target.value}))} options={PHASES.map(p=>({value:p,label:p}))}/>
              <Select label="Status" value={phaseForm.status} onChange={e=>setPhaseForm(f=>({...f,status:e.target.value}))} options={[{value:'pending',label:'Pending'},{value:'active',label:'Active'},{value:'completed',label:'Completed'}]}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Start Date" type="date" value={phaseForm.startDate} onChange={e=>setPhaseForm(f=>({...f,startDate:e.target.value}))}/>
              <Input label="End Date" type="date" value={phaseForm.endDate} onChange={e=>setPhaseForm(f=>({...f,endDate:e.target.value}))}/>
            </div>
            <Input label="Phase Budget (₹)" type="number" value={phaseForm.budget} onChange={e=>setPhaseForm(f=>({...f,budget:e.target.value}))} style={{marginBottom:16}}/>
            <Input label="Description" value={phaseForm.description} onChange={e=>setPhaseForm(f=>({...f,description:e.target.value}))} style={{marginBottom:24}}/>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowPhaseModal(false)}>Cancel</Btn>
              <Btn type="submit">Add Phase</Btn>
            </div>
          </form>
        </Modal>

        {/* Create Project Modal */}
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
