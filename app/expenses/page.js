'use client';
import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Page, Card, StatCard, DataTable, Badge, Btn, Input, Select, Modal, Loading, EmptyState } from '@/components/UI';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const categories = ['labor','material','transport','equipment','office','salary','utility','miscellaneous'];
const payMethods = ['cash','bank','upi','cheque'];
const BAR_COLORS = ['var(--accent)','var(--green)','var(--yellow)','var(--purple)','var(--orange)','var(--red)','var(--cyan)','var(--text-muted)'];

export default function Expenses() {
  const { hasRole } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [form, setForm] = useState({ title:'', category:'material', amount:'', project:'', date:new Date().toISOString().split('T')[0], paymentMethod:'cash', reference:'', notes:'' });

  const fetchData = useCallback(async () => {
    try {
      const [eRes, pRes] = await Promise.all([api.get('/expenses', { params:{ category:filterCat, project:filterProject } }), api.get('/projects')]);
      setExpenses(eRes.data); setProjects(pRes.data);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }, [filterCat, filterProject]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', { ...form, amount:Number(form.amount), project:form.project||undefined });
      toast.success('Expense recorded'); setShowAdd(false);
      setForm({ title:'', category:'material', amount:'', project:'', date:new Date().toISOString().split('T')[0], paymentMethod:'cash', reference:'', notes:'' }); fetchData();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  if (loading) return <Layout><Loading/></Layout>;

  const total = expenses.reduce((s,e) => s+e.amount, 0);
  const thisMonth = expenses.filter(e => new Date(e.date).getMonth()===new Date().getMonth()).reduce((s,e) => s+e.amount, 0);
  const byCategory = {};
  expenses.forEach(e => { byCategory[e.category]=(byCategory[e.category]||0)+e.amount; });
  const catEntries = Object.entries(byCategory).sort((a,b)=>b[1]-a[1]);
  const catMax = catEntries[0]?.[1]||1;

  return (
    <Layout>
      <Page title="Finance & Expenses" subtitle={`${expenses.length} records`}
        actions={hasRole('admin','accountant')&&<Btn icon={<span style={{fontSize:16}}>+</span>} onClick={()=>setShowAdd(true)}>Add Expense</Btn>}>

        <div className="grid-4" style={{ marginBottom:24 }}>
          <StatCard title="Total Expenses"  value={formatCurrency(total)}     icon="💰" color="var(--accent)"  delay={1}/>
          <StatCard title="This Month"      value={formatCurrency(thisMonth)} icon="📅" color="var(--purple)"  delay={2}/>
          <StatCard title="Categories Used" value={Object.keys(byCategory).length} icon="📊" color="var(--green)" delay={3}/>
          <StatCard title="Total Records"   value={expenses.length}           icon="📋" color="var(--yellow)"  delay={4}/>
        </div>

        <div className="grid-2" style={{ marginBottom:24 }}>
          <Card title="Expenses by Category" className="animate-in delay-5">
            {catEntries.map(([cat,amt],i)=>(
              <div key={cat} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)', textTransform:'capitalize' }}>{cat}</span>
                  <span style={{ fontFamily:'var(--mono)', fontWeight:600, color:'var(--text)' }}>{formatCurrency(amt)}</span>
                </div>
                <div style={{ height:6, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${(amt/catMax)*100}%`, height:'100%', borderRadius:3, background:BAR_COLORS[i%BAR_COLORS.length], transition:'width 0.8s ease' }}/>
                </div>
              </div>
            ))}
            {catEntries.length===0&&<div style={{ textAlign:'center', color:'var(--text-muted)', padding:'20px 0', fontSize:13 }}>No data</div>}
          </Card>

          <Card title="Expenses by Project" className="animate-in delay-5">
            {Object.entries(expenses.reduce((acc,e)=>{ const n=e.project?.name||'Unassigned'; acc[n]=(acc[n]||0)+e.amount; return acc; },{})).sort((a,b)=>b[1]-a[1]).map(([proj,amt],i)=>(
              <div key={proj} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)' }}>{proj}</span>
                  <span style={{ fontFamily:'var(--mono)', fontWeight:600, color:'var(--text)' }}>{formatCurrency(amt)}</span>
                </div>
                <div style={{ height:6, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${(amt/(total||1))*100}%`, height:'100%', borderRadius:3, background:BAR_COLORS[(i+2)%BAR_COLORS.length], transition:'width 0.8s ease' }}/>
                </div>
              </div>
            ))}
            {expenses.length===0&&<div style={{ textAlign:'center', color:'var(--text-muted)', padding:'20px 0', fontSize:13 }}>No data</div>}
          </Card>
        </div>

        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <Select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ maxWidth:200 }} options={[{value:'',label:'All Categories'},...categories.map(c=>({value:c,label:c.charAt(0).toUpperCase()+c.slice(1)}))]}/>
          <Select value={filterProject} onChange={e=>setFilterProject(e.target.value)} style={{ maxWidth:220 }} options={[{value:'',label:'All Projects'},...projects.map(p=>({value:p._id,label:p.name}))]}/>
        </div>

        {expenses.length===0 ? (
          <EmptyState icon="💰" title="No expenses" description="Record expenses to track spending" action={hasRole('admin','accountant')&&<Btn onClick={()=>setShowAdd(true)}>Add Expense</Btn>}/>
        ) : (
          <Card className="animate-in delay-6" noPad>
            <DataTable
              columns={[
                { key:'title',    label:'Title',    render:v=><span style={{fontWeight:500,color:'var(--text)'}}>{v}</span> },
                { key:'category', label:'Category', render:v=><Badge status={v}/> },
                { key:'amount',   label:'Amount',   render:v=><span style={{fontFamily:'var(--mono)',fontWeight:600,color:'var(--text)'}}>{formatCurrency(v)}</span> },
                { key:'project',  label:'Project',  render:(v,r)=>r.project?.name||'—' },
                { key:'paymentMethod', label:'Method', render:v=><span style={{textTransform:'capitalize',fontSize:12}}>{v}</span> },
                { key:'date',     label:'Date',     render:v=>formatDate(v) },
              ]}
              data={expenses}
            />
          </Card>
        )}

        <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Record Expense">
          <form onSubmit={handleAdd}>
            <Input label="Title" required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="e.g., Steel delivery charges" style={{marginBottom:16}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Select label="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} options={categories.map(c=>({value:c,label:c.charAt(0).toUpperCase()+c.slice(1)}))}/>
              <Input label="Amount (₹)" type="number" required value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Select label="Project" value={form.project} onChange={e=>setForm(f=>({...f,project:e.target.value}))} options={[{value:'',label:'None'},...projects.map(p=>({value:p._id,label:p.name}))]}/>
              <Select label="Payment Method" value={form.paymentMethod} onChange={e=>setForm(f=>({...f,paymentMethod:e.target.value}))} options={payMethods.map(m=>({value:m,label:m.charAt(0).toUpperCase()+m.slice(1)}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Date" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
              <Input label="Reference" value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))} placeholder="Receipt/Bill no."/>
            </div>
            <Input label="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{marginBottom:24}}/>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn type="submit">Record Expense</Btn>
            </div>
          </form>
        </Modal>
      </Page>
    </Layout>
  );
}
