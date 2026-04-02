'use client';
import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Page, Card, StatCard, DataTable, Badge, Btn, Input, Select, Modal, Loading, EmptyState } from '@/components/UI';
import { formatCurrency, formatDateShort } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const skills = ['helper','mason','carpenter','plumber','electrician','painter','other'];

export default function Workers() {
  const { hasRole } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showPayment, setShowPayment] = useState(null);
  const [filter, setFilter] = useState({ project:'', skill:'' });
  const [form, setForm] = useState({ name:'', phone:'', dailyWage:'', skill:'helper', project:'' });
  const [payForm, setPayForm] = useState({ weekStartDate:'', weekEndDate:'', daysWorked:'', overtime:0, deductions:0, notes:'' });

  const fetchData = useCallback(async () => {
    try {
      const [wRes, pRes] = await Promise.all([api.get('/workers', { params: filter }), api.get('/projects')]);
      setWorkers(wRes.data); setProjects(pRes.data);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/workers', { ...form, dailyWage: Number(form.dailyWage) });
      toast.success('Worker added'); setShowAdd(false);
      setForm({ name:'', phone:'', dailyWage:'', skill:'helper', project:'' }); fetchData();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/workers/${showPayment._id}/payments`, { ...payForm, daysWorked:Number(payForm.daysWorked), overtime:Number(payForm.overtime), deductions:Number(payForm.deductions) });
      toast.success('Payment entry added'); setShowPayment(null); fetchData();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  const markPaid = async (wId, pId) => {
    try { await api.put(`/workers/${wId}/payments/${pId}`, { status:'paid' }); toast.success('Marked as paid'); fetchData(); }
    catch(e){ toast.error('Error'); }
  };

  if (loading) return <Layout><Loading/></Layout>;

  const totalPaid = workers.reduce((s,w) => s+(w.totalPaid||0), 0);
  const totalPending = workers.reduce((s,w) => s+(w.totalPending||0), 0);

  return (
    <Layout>
      <Page title="Labor Payments" subtitle={`${workers.length} workers registered`}
        actions={hasRole('admin','accountant') && <Btn icon={<span style={{fontSize:16}}>+</span>} onClick={()=>setShowAdd(true)}>Add Worker</Btn>}>

        <div className="grid-4" style={{ marginBottom:24 }}>
          <StatCard title="Total Workers"   value={workers.length}              icon="👷" color="var(--accent)"  delay={1}/>
          <StatCard title="Total Paid"      value={formatCurrency(totalPaid)}   icon="✅" color="var(--green)"   delay={2}/>
          <StatCard title="Pending Amount"  value={formatCurrency(totalPending)} icon="⏳" color="var(--red)"    delay={3}/>
          <StatCard title="Active Projects" value={projects.length}             icon="🏗️" color="var(--yellow)" delay={4}/>
        </div>

        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <Select value={filter.project} onChange={e=>setFilter(f=>({...f,project:e.target.value}))} style={{ maxWidth:220 }}
            options={[{value:'',label:'All Projects'},...projects.map(p=>({value:p._id,label:p.name}))]}/>
          <Select value={filter.skill} onChange={e=>setFilter(f=>({...f,skill:e.target.value}))} style={{ maxWidth:180 }}
            options={[{value:'',label:'All Skills'},...skills.map(s=>({value:s,label:s.charAt(0).toUpperCase()+s.slice(1)}))]}/>
        </div>

        {workers.length===0 ? (
          <EmptyState icon="👷" title="No workers found" description="Add workers to start tracking payments" action={hasRole('admin','accountant')&&<Btn onClick={()=>setShowAdd(true)}>Add Worker</Btn>}/>
        ) : (
          <Card className="animate-in delay-5" noPad>
            <DataTable
              columns={[
                { key:'name', label:'Worker', render:(v,r)=><div><div style={{fontWeight:600,color:'var(--text)'}}>{v}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{r.phone}</div></div> },
                { key:'skill',      label:'Skill',      render:v=><Badge status={v}/> },
                { key:'dailyWage',  label:'Daily Wage', render:v=><span style={{fontFamily:'var(--mono)',fontWeight:600}}>{formatCurrency(v)}</span> },
                { key:'project',    label:'Project',    render:v=>v?.name||'—' },
                { key:'totalPaid',  label:'Total Paid', render:v=><span style={{fontFamily:'var(--mono)',color:'var(--green)',fontWeight:600}}>{formatCurrency(v)}</span> },
                { key:'totalPending',label:'Pending',   render:v=><span style={{fontFamily:'var(--mono)',color:v>0?'var(--red)':'var(--text-muted)',fontWeight:600}}>{formatCurrency(v)}</span> },
              ]}
              data={workers}
              actions={w=>hasRole('admin','accountant')&&(
                <Btn size="sm" variant="outline" onClick={()=>{ setShowPayment(w); setPayForm({weekStartDate:'',weekEndDate:'',daysWorked:'',overtime:0,deductions:0,notes:''}); }}>+ Pay</Btn>
              )}
            />
          </Card>
        )}

        {/* Recent payments */}
        {workers.some(w=>w.payments?.length>0) && (
          <div style={{ marginTop:24 }}>
            {workers.filter(w=>w.payments?.length>0).map(w=>(
              <div key={w._id} style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>{w.name} — Recent Payments</div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {w.payments.slice(-4).map(p=>(
                    <div key={p._id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'12px 16px', minWidth:160 }}>
                      <div style={{ color:'var(--text-muted)', fontSize:11, marginBottom:4 }}>{formatDateShort(p.weekStartDate)} – {formatDateShort(p.weekEndDate)}</div>
                      <div style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--text)', marginBottom:8, fontSize:15 }}>{formatCurrency(p.totalAmount)}</div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <Badge status={p.status}/>
                        {p.status!=='paid'&&hasRole('admin','accountant')&&(
                          <button onClick={()=>markPaid(w._id,p._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--green)', fontSize:11, fontWeight:600, fontFamily:'var(--font)' }}>Mark Paid</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Add New Worker">
          <form onSubmit={handleAdd}>
            <Input label="Full Name" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{marginBottom:16}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
              <Input label="Daily Wage (₹)" type="number" required value={form.dailyWage} onChange={e=>setForm(f=>({...f,dailyWage:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
              <Select label="Skill" value={form.skill} onChange={e=>setForm(f=>({...f,skill:e.target.value}))} options={skills.map(s=>({value:s,label:s.charAt(0).toUpperCase()+s.slice(1)}))}/>
              <Select label="Project" value={form.project} onChange={e=>setForm(f=>({...f,project:e.target.value}))} options={[{value:'',label:'None'},...projects.map(p=>({value:p._id,label:p.name}))]}/>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn type="submit">Add Worker</Btn>
            </div>
          </form>
        </Modal>

        <Modal isOpen={!!showPayment} onClose={()=>setShowPayment(null)} title={`Add Payment — ${showPayment?.name}`}>
          <form onSubmit={handlePayment}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Week Start" type="date" required value={payForm.weekStartDate} onChange={e=>setPayForm(f=>({...f,weekStartDate:e.target.value}))}/>
              <Input label="Week End"   type="date" required value={payForm.weekEndDate}   onChange={e=>setPayForm(f=>({...f,weekEndDate:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Days Worked" type="number" required min="0" max="7" value={payForm.daysWorked} onChange={e=>setPayForm(f=>({...f,daysWorked:e.target.value}))}/>
              <Input label="Overtime (₹)" type="number" value={payForm.overtime} onChange={e=>setPayForm(f=>({...f,overtime:e.target.value}))}/>
              <Input label="Deductions (₹)" type="number" value={payForm.deductions} onChange={e=>setPayForm(f=>({...f,deductions:e.target.value}))}/>
            </div>
            <Input label="Notes" value={payForm.notes} onChange={e=>setPayForm(f=>({...f,notes:e.target.value}))} style={{marginBottom:16}}/>
            {payForm.daysWorked&&showPayment&&(
              <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 16px',marginBottom:20,fontSize:13}}>
                <span style={{color:'var(--text-muted)'}}>Estimated Total: </span>
                <span style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--accent-light)',fontSize:16}}>{formatCurrency(Number(payForm.daysWorked)*showPayment.dailyWage+Number(payForm.overtime||0)-Number(payForm.deductions||0))}</span>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowPayment(null)}>Cancel</Btn>
              <Btn type="submit">Add Payment</Btn>
            </div>
          </form>
        </Modal>
      </Page>
    </Layout>
  );
}
