'use client';
import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Page, StatCard, Badge, Btn, Input, Select, Modal, Loading, EmptyState } from '@/components/UI';
import { formatCurrency, getMonthName } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const departments = ['engineering','accounts','admin','procurement','management','other'];

export default function Staff() {
  const { hasRole } = useAuth();
  const [staff, setStaff] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showSalary, setShowSalary] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({ name:'', phone:'', email:'', role:'', department:'engineering', baseSalary:'', project:'' });
  const [salForm, setSalForm] = useState({ month:new Date().getMonth()+1, year:new Date().getFullYear(), allowances:0, deductions:0, bonus:0, notes:'' });

  const fetchData = useCallback(async () => {
    try {
      const [sRes, pRes] = await Promise.all([api.get('/staff'), api.get('/projects')]);
      setStaff(sRes.data); setProjects(pRes.data);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff', { ...form, baseSalary:Number(form.baseSalary) });
      toast.success('Staff added'); setShowAdd(false);
      setForm({ name:'', phone:'', email:'', role:'', department:'engineering', baseSalary:'', project:'' }); fetchData();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  const handleSalary = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/staff/${showSalary._id}/salary`, { ...salForm, month:Number(salForm.month), year:Number(salForm.year), allowances:Number(salForm.allowances), deductions:Number(salForm.deductions), bonus:Number(salForm.bonus) });
      toast.success('Salary entry added'); setShowSalary(null); fetchData();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  const markPaid = async (sId, salId) => {
    try { await api.put(`/staff/${sId}/salary/${salId}`, { status:'paid' }); toast.success('Salary marked as paid'); fetchData(); }
    catch(e){ toast.error('Error'); }
  };

  if (loading) return <Layout><Loading/></Layout>;

  const totalMonthly = staff.reduce((s,m) => s+m.baseSalary, 0);
  const totalPending = staff.reduce((s,m) => s+(m.salaryHistory||[]).filter(h=>h.status==='pending').reduce((a,h)=>a+h.netSalary,0), 0);

  return (
    <Layout>
      <Page title="Staff Salary" subtitle={`${staff.length} staff members`}
        actions={hasRole('admin')&&<Btn icon={<span style={{fontSize:16}}>+</span>} onClick={()=>setShowAdd(true)}>Add Staff</Btn>}>

        <div className="grid-4" style={{ marginBottom:24 }}>
          <StatCard title="Total Staff"      value={staff.length}                icon="👨‍💼" color="var(--accent)"  delay={1}/>
          <StatCard title="Monthly Payroll"  value={formatCurrency(totalMonthly)} icon="💰" color="var(--green)"   delay={2}/>
          <StatCard title="Pending Salaries" value={formatCurrency(totalPending)} icon="⏳" color="var(--red)"     delay={3}/>
          <StatCard title="Departments"      value={[...new Set(staff.map(s=>s.department))].length} icon="🏢" color="var(--yellow)" delay={4}/>
        </div>

        {staff.length===0 ? (
          <EmptyState icon="👨‍💼" title="No staff found" description="Add staff members to manage salaries" action={hasRole('admin')&&<Btn onClick={()=>setShowAdd(true)}>Add Staff</Btn>}/>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {staff.map((s,i) => {
              const initials = s.name.split(' ').map(n=>n[0]).join('').toUpperCase();
              const isExpanded = expandedId===s._id;
              const pendingCount = (s.salaryHistory||[]).filter(h=>h.status==='pending').length;
              return (
                <div key={s._id} className={`animate-in delay-${(i%6)+1}`} style={{ background:'var(--bg-card)', borderRadius:'var(--radius)', border:'1px solid var(--border)', overflow:'hidden', transition:'border-color 0.2s' }}>
                  <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}
                    onClick={()=>setExpandedId(isExpanded?null:s._id)}
                    onMouseOver={e=>e.currentTarget.style.background='var(--bg-card-hover)'}
                    onMouseOut={e=>e.currentTarget.style.background='transparent'}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,var(--accent),var(--purple))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'white', flexShrink:0 }}>{initials}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{s.name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.role} · <span style={{textTransform:'capitalize'}}>{s.department}</span></div>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:20 }}>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>Base Salary</div>
                        <div style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--text)' }}>{formatCurrency(s.baseSalary)}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>Project</div>
                        <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{s.project?.name||'Unassigned'}</div>
                      </div>
                      {pendingCount>0&&<Badge status="pending"/>}
                      {hasRole('admin','accountant')&&(
                        <Btn size="sm" variant="outline" onClick={e=>{ e.stopPropagation(); setShowSalary(s); setSalForm({month:new Date().getMonth()+1,year:new Date().getFullYear(),allowances:0,deductions:0,bonus:0,notes:''}); }}>+ Salary</Btn>
                      )}
                      <span style={{ color:'var(--text-muted)', fontSize:12 }}>{isExpanded?'▲':'▼'}</span>
                    </div>
                  </div>
                  {isExpanded&&(
                    <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg-elevated)', padding:20 }}>
                      {!s.salaryHistory?.length ? <p style={{ fontSize:13, color:'var(--text-muted)' }}>No salary history yet.</p> : (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
                          {(s.salaryHistory||[]).slice().reverse().map(sal=>(
                            <div key={sal._id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                                <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{getMonthName(sal.month)} {sal.year}</span>
                                <Badge status={sal.status}/>
                              </div>
                              <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
                                {[['Base',formatCurrency(sal.baseSalary),null],sal.allowances>0&&['Allow',`+${formatCurrency(sal.allowances)}`,'var(--green)'],sal.deductions>0&&['Deduct',`-${formatCurrency(sal.deductions)}`,'var(--red)'],sal.bonus>0&&['Bonus',`+${formatCurrency(sal.bonus)}`,'var(--green)']].filter(Boolean).map(([l,v,c])=>(
                                  <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                                    <span>{l}</span><span style={{ fontFamily:'var(--mono)', color:c||'var(--text-secondary)' }}>{v}</span>
                                  </div>
                                ))}
                              </div>
                              <div style={{ borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                <span style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--text)' }}>{formatCurrency(sal.netSalary)}</span>
                                {sal.status!=='paid'&&hasRole('admin','accountant')&&(
                                  <button onClick={()=>markPaid(s._id,sal._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--green)', fontSize:11, fontWeight:600, fontFamily:'var(--font)' }}>Mark Paid</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Add Staff Member">
          <form onSubmit={handleAdd}>
            <Input label="Full Name" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{marginBottom:16}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
              <Input label="Email" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Role / Designation" required value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}/>
              <Input label="Base Salary (₹)" type="number" required value={form.baseSalary} onChange={e=>setForm(f=>({...f,baseSalary:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
              <Select label="Department" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} options={departments.map(d=>({value:d,label:d.charAt(0).toUpperCase()+d.slice(1)}))}/>
              <Select label="Project" value={form.project} onChange={e=>setForm(f=>({...f,project:e.target.value}))} options={[{value:'',label:'None'},...projects.map(p=>({value:p._id,label:p.name}))]}/>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn type="submit">Add Staff</Btn>
            </div>
          </form>
        </Modal>

        <Modal isOpen={!!showSalary} onClose={()=>setShowSalary(null)} title={`Add Salary — ${showSalary?.name}`}>
          <form onSubmit={handleSalary}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Select label="Month" value={salForm.month} onChange={e=>setSalForm(f=>({...f,month:e.target.value}))} options={Array.from({length:12},(_,i)=>({value:i+1,label:getMonthName(i+1)}))}/>
              <Input label="Year" type="number" value={salForm.year} onChange={e=>setSalForm(f=>({...f,year:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Allowances (₹)" type="number" value={salForm.allowances} onChange={e=>setSalForm(f=>({...f,allowances:e.target.value}))}/>
              <Input label="Deductions (₹)" type="number" value={salForm.deductions} onChange={e=>setSalForm(f=>({...f,deductions:e.target.value}))}/>
              <Input label="Bonus (₹)"      type="number" value={salForm.bonus}      onChange={e=>setSalForm(f=>({...f,bonus:e.target.value}))}/>
            </div>
            <Input label="Notes" value={salForm.notes} onChange={e=>setSalForm(f=>({...f,notes:e.target.value}))} style={{marginBottom:16}}/>
            {showSalary&&(
              <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:13}}>
                <span style={{color:'var(--text-muted)'}}>Net Salary: </span>
                <span style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--accent-light)',fontSize:16}}>{formatCurrency(showSalary.baseSalary+Number(salForm.allowances||0)+Number(salForm.bonus||0)-Number(salForm.deductions||0))}</span>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowSalary(null)}>Cancel</Btn>
              <Btn type="submit">Add Salary</Btn>
            </div>
          </form>
        </Modal>
      </Page>
    </Layout>
  );
}
