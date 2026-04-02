'use client';
import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Page, Card, StatCard, DataTable, Badge, Btn, Input, Select, Modal, Loading, EmptyState } from '@/components/UI';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function Invoices() {
  const { hasRole } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const initItem = { description:'', quantity:1, unit:'', unitPrice:'', totalPrice:'' };
  const [form, setForm] = useState({ type:'daily', supplier:'', project:'', items:[{...initItem}], tax:0, dueDate:'', notes:'' });

  const fetchData = useCallback(async () => {
    try {
      const [iRes, pRes, sRes] = await Promise.all([api.get('/invoices', { params:{ type:filterType, status:filterStatus } }), api.get('/projects'), api.get('/suppliers')]);
      setInvoices(iRes.data); setProjects(pRes.data); setSuppliers(sRes.data);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }, [filterType, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateItem = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]:value };
      if (field==='quantity'||field==='unitPrice') items[idx].totalPrice = Number(items[idx].quantity||0)*Number(items[idx].unitPrice||0);
      return { ...f, items };
    });
  };

  const subtotal = form.items.reduce((s,i) => s+Number(i.totalPrice||0), 0);
  const total = subtotal + Number(form.tax||0);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const items = form.items.map(i => ({ ...i, quantity:Number(i.quantity), unitPrice:Number(i.unitPrice), totalPrice:Number(i.totalPrice) }));
      await api.post('/invoices', { type:form.type, supplier:form.supplier||undefined, project:form.project||undefined, items, subtotal, tax:Number(form.tax), totalAmount:total, dueDate:form.dueDate||undefined, notes:form.notes });
      toast.success('Invoice created'); setShowAdd(false);
      setForm({ type:'daily', supplier:'', project:'', items:[{...initItem}], tax:0, dueDate:'', notes:'' }); fetchData();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/invoices/${id}`, { status, ...(status==='paid'?{ paidDate:new Date() }:{}) });
      toast.success(`Invoice marked as ${status}`); setShowDetail(null); fetchData();
    } catch(e){ toast.error('Error'); }
  };

  if (loading) return <Layout><Loading/></Layout>;

  const totalAmt = invoices.reduce((s,i)=>s+i.totalAmount,0);
  const paidAmt  = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.totalAmount,0);
  const pendAmt  = invoices.filter(i=>i.status==='pending').reduce((s,i)=>s+i.totalAmount,0);
  const overdueAmt = invoices.filter(i=>i.status==='overdue').reduce((s,i)=>s+i.totalAmount,0);

  return (
    <Layout>
      <Page title="Invoices" subtitle={`${invoices.length} invoices`}
        actions={hasRole('admin','accountant')&&<Btn icon={<span style={{fontSize:16}}>+</span>} onClick={()=>setShowAdd(true)}>Create Invoice</Btn>}>

        <div className="grid-4" style={{ marginBottom:24 }}>
          <StatCard title="Total Invoiced" value={formatCurrency(totalAmt)}   icon="🧾" color="var(--accent)"  delay={1}/>
          <StatCard title="Collected"      value={formatCurrency(paidAmt)}    icon="✅" color="var(--green)"   delay={2}/>
          <StatCard title="Pending"        value={formatCurrency(pendAmt)}    icon="⏳" color="var(--yellow)"  delay={3}/>
          <StatCard title="Overdue"        value={formatCurrency(overdueAmt)} icon="⚠️" color="var(--red)"     delay={4}/>
        </div>

        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <Select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ maxWidth:180 }} options={[{value:'',label:'All Types'},{value:'daily',label:'Daily'},{value:'temporary',label:'Temporary'},{value:'supplier',label:'Supplier'},{value:'generated',label:'Generated'}]}/>
          <Select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ maxWidth:180 }} options={[{value:'',label:'All Status'},{value:'pending',label:'Pending'},{value:'paid',label:'Paid'},{value:'overdue',label:'Overdue'},{value:'draft',label:'Draft'}]}/>
        </div>

        {invoices.length===0 ? (
          <EmptyState icon="🧾" title="No invoices" description="Create invoices to track payments" action={hasRole('admin','accountant')&&<Btn onClick={()=>setShowAdd(true)}>Create Invoice</Btn>}/>
        ) : (
          <Card className="animate-in delay-5" noPad>
            <DataTable
              columns={[
                { key:'invoiceNumber', label:'Invoice #', render:v=><span style={{fontFamily:'var(--mono)',fontWeight:700,color:'var(--accent-light)'}}>{v}</span> },
                { key:'type',   label:'Type',   render:v=><Badge status={v}/> },
                { key:'supplier', label:'Party', render:(v,r)=><div><div style={{fontWeight:500,color:'var(--text)'}}>{r.supplier?.name||r.project?.name||'—'}</div>{r.supplier?.company&&<div style={{fontSize:11,color:'var(--text-muted)'}}>{r.supplier.company}</div>}</div> },
                { key:'totalAmount', label:'Amount', render:v=><span style={{fontFamily:'var(--mono)',fontWeight:600,color:'var(--text)'}}>{formatCurrency(v)}</span> },
                { key:'status', label:'Status', render:v=><Badge status={v}/> },
                { key:'dueDate', label:'Due Date', render:v=>formatDate(v) },
              ]}
              data={invoices}
              actions={row=>(
                <div style={{display:'flex',gap:6}}>
                  <Btn variant="ghost" size="sm" onClick={()=>setShowDetail(row)}>View</Btn>
                  {row.status!=='paid'&&hasRole('admin','accountant')&&<Btn variant="success" size="sm" onClick={e=>{ e.stopPropagation(); updateStatus(row._id,'paid'); }}>Paid</Btn>}
                </div>
              )}
            />
          </Card>
        )}

        <Modal isOpen={!!showDetail} onClose={()=>setShowDetail(null)} title={`Invoice ${showDetail?.invoiceNumber}`} size="lg">
          {showDetail&&(
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {[{l:'Type',v:<Badge status={showDetail.type}/>},{l:'Status',v:<Badge status={showDetail.status}/>},{l:'Created',v:formatDate(showDetail.createdAt)},{l:'Due',v:formatDate(showDetail.dueDate)}].map((item,i)=>(
                  <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:10, padding:12 }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{item.l}</div>
                    <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{item.v}</div>
                  </div>
                ))}
              </div>
              <DataTable
                columns={[
                  { key:'description', label:'Description' },
                  { key:'quantity',    label:'Qty',   render:(v,r)=>`${v} ${r.unit||''}` },
                  { key:'unitPrice',   label:'Rate',  render:v=><span style={{fontFamily:'var(--mono)'}}>{formatCurrency(v)}</span> },
                  { key:'totalPrice',  label:'Total', render:v=><span style={{fontFamily:'var(--mono)',fontWeight:600}}>{formatCurrency(v)}</span> },
                ]}
                data={showDetail.items}
              />
              <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
                <div style={{ minWidth:220 }}>
                  {[['Subtotal',showDetail.subtotal],['Tax',showDetail.tax]].map(([l,v])=>(
                    <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13, color:'var(--text-secondary)' }}>
                      <span>{l}</span><span style={{fontFamily:'var(--mono)'}}>{formatCurrency(v)}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 4px', borderTop:'1px solid var(--border)', fontSize:16, fontWeight:700, color:'var(--text)' }}>
                    <span>Total</span><span style={{fontFamily:'var(--mono)',color:'var(--accent-light)'}}>{formatCurrency(showDetail.totalAmount)}</span>
                  </div>
                </div>
              </div>
              {showDetail.status!=='paid'&&hasRole('admin','accountant')&&(
                <div style={{ display:'flex', gap:10, marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)' }}>
                  <Btn variant="success" onClick={()=>updateStatus(showDetail._id,'paid')}>Mark Paid</Btn>
                  {showDetail.status!=='overdue'&&<Btn variant="danger" onClick={()=>updateStatus(showDetail._id,'overdue')}>Mark Overdue</Btn>}
                </div>
              )}
            </div>
          )}
        </Modal>

        <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Create Invoice" size="lg">
          <form onSubmit={handleAdd}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
              <Select label="Type" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} options={[{value:'daily',label:'Daily'},{value:'temporary',label:'Temporary'},{value:'supplier',label:'Supplier'},{value:'generated',label:'Generated'}]}/>
              <Select label="Supplier" value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} options={[{value:'',label:'None'},...suppliers.map(s=>({value:s._id,label:s.name}))]}/>
              <Select label="Project" value={form.project} onChange={e=>setForm(f=>({...f,project:e.target.value}))} options={[{value:'',label:'None'},...projects.map(p=>({value:p._id,label:p.name}))]}/>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>Line Items</label>
                <button type="button" onClick={()=>setForm(f=>({...f,items:[...f.items,{...initItem}]}))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent-light)', fontSize:12, fontWeight:600, fontFamily:'var(--font)' }}>+ Add Item</button>
              </div>
              {form.items.map((item,idx)=>(
                <div key={idx} style={{ display:'grid', gridTemplateColumns:'4fr 1.5fr 1fr 2fr auto auto', gap:8, marginBottom:8, alignItems:'flex-end' }}>
                  <input placeholder="Description" value={item.description} onChange={e=>updateItem(idx,'description',e.target.value)} required style={{ padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'var(--font)' }}/>
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e=>updateItem(idx,'quantity',e.target.value)} required style={{ padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'var(--font)' }}/>
                  <input placeholder="Unit" value={item.unit} onChange={e=>updateItem(idx,'unit',e.target.value)} style={{ padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'var(--font)' }}/>
                  <input type="number" placeholder="Price" value={item.unitPrice} onChange={e=>updateItem(idx,'unitPrice',e.target.value)} required style={{ padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'var(--font)' }}/>
                  <span style={{ fontSize:13, fontFamily:'var(--mono)', fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', paddingBottom:10 }}>{formatCurrency(item.totalPrice||0)}</span>
                  {form.items.length>1&&<button type="button" onClick={()=>setForm(f=>({...f,items:f.items.filter((_,i)=>i!==idx)}))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:16, paddingBottom:8 }}>✕</button>}
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Input label="Tax (₹)" type="number" value={form.tax} onChange={e=>setForm(f=>({...f,tax:e.target.value}))}/>
              <Input label="Due Date" type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/>
            </div>
            <Input label="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{marginBottom:16}}/>
            <div style={{ background:'var(--bg-elevated)', borderRadius:10, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Subtotal: <span style={{fontFamily:'var(--mono)',fontWeight:600,color:'var(--text)'}}>{formatCurrency(subtotal)}</span></span>
              <span style={{ fontSize:20, fontWeight:800, color:'var(--accent-light)', fontFamily:'var(--mono)' }}>{formatCurrency(total)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn type="submit">Create Invoice</Btn>
            </div>
          </form>
        </Modal>
      </Page>
    </Layout>
  );
}
