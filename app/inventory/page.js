'use client';
import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Page, StatCard, DataTable, Badge, Btn, Input, Select, Modal, Loading, EmptyState } from '@/components/UI';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const categories = ['cement','steel','sand','aggregate','bricks','wood','paint','electrical','plumbing','hardware','tiles','other'];
const units = ['kg','bags','pieces','meters','sqft','cft','liters','tons','bundles'];
const PHASES = ['', 'Foundation', 'Structure', 'Finishing', 'Handover'];

export default function Inventory() {
  const { hasRole } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showStock, setShowStock] = useState(null);
  const [showLogs, setShowLogs] = useState(null);
  const [filterCat, setFilterCat] = useState('');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [form, setForm] = useState({ name:'', category:'cement', unit:'bags', currentStock:'', minStock:10, unitPrice:'' });
  const [stockForm, setStockForm] = useState({ type:'in', quantity:'', project:'', supplier:'', unitPrice:'', phase:'', notes:'' });

  const fetchData = useCallback(async () => {
    try {
      const [mRes, pRes, sRes] = await Promise.all([
        api.get('/inventory', { params:{ category:filterCat, lowStock:showLowOnly?'true':'' } }),
        api.get('/projects'), api.get('/suppliers'),
      ]);
      setMaterials(mRes.data); setProjects(pRes.data); setSuppliers(sRes.data);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }, [filterCat, showLowOnly]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', { ...form, currentStock:Number(form.currentStock), minStock:Number(form.minStock), unitPrice:Number(form.unitPrice) });
      toast.success('Material added'); setShowAdd(false); fetchData();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  const handleStock = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/inventory/${showStock._id}/stock`, {
        ...stockForm,
        quantity: Number(stockForm.quantity),
        unitPrice: stockForm.unitPrice ? Number(stockForm.unitPrice) : undefined,
        project: stockForm.project || undefined,
        supplier: stockForm.supplier || undefined,
        phase: stockForm.phase || undefined,
      });
      toast.success(`Stock ${stockForm.type==='in'?'added':'removed'}`); setShowStock(null); fetchData();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  if (loading) return <Layout><Loading/></Layout>;

  const lowCount = materials.filter(m=>m.isLowStock).length;
  const critCount = materials.filter(m=>m.currentStock===0).length;

  return (
    <Layout>
      <Page title="Inventory" subtitle={`${materials.length} materials · ${lowCount} low stock`}
        actions={hasRole('admin','engineer')&&<Btn icon={<span style={{fontSize:16}}>+</span>} onClick={()=>setShowAdd(true)}>Add Material</Btn>}>

        <div className="grid-4" style={{ marginBottom:24 }}>
          <StatCard title="Total Materials"  value={materials.length}  icon="📦" color="var(--accent)"  delay={1}/>
          <StatCard title="Low Stock Items"  value={lowCount}          icon="⚠️" color="var(--yellow)"  delay={2}/>
          <StatCard title="Critical (Empty)" value={critCount}         icon="🚨" color="var(--red)"     delay={3}/>
          <StatCard title="Total Value"      value={formatCurrency(materials.reduce((s,m)=>s+m.currentStock*m.unitPrice,0))} icon="💰" color="var(--green)" delay={4}/>
        </div>

        <div style={{ display:'flex', gap:10, marginBottom:24, flexWrap:'wrap', alignItems:'center' }}>
          <Select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ maxWidth:200 }} options={[{value:'',label:'All Categories'},...categories.map(c=>({value:c,label:c.charAt(0).toUpperCase()+c.slice(1)}))]}/>
          <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-secondary)', cursor:'pointer', padding:'9px 14px', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' }}>
            <input type="checkbox" checked={showLowOnly} onChange={e=>setShowLowOnly(e.target.checked)} style={{accentColor:'var(--accent)'}}/>
            Low Stock Only
          </label>
        </div>

        {materials.length===0 ? (
          <EmptyState icon="📦" title="No materials found" description="Add materials to start tracking inventory" action={hasRole('admin','engineer')&&<Btn onClick={()=>setShowAdd(true)}>Add Material</Btn>}/>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:16 }}>
            {materials.map((m,i) => {
              const pct = Math.min(100,(m.currentStock/Math.max(m.minStock*3,1))*100);
              const statusColor = m.currentStock===0?'var(--red)':m.isLowStock?'var(--yellow)':'var(--green)';
              const status = m.currentStock===0?'critical':m.isLowStock?'low':'normal';
              return (
                <div key={m._id} className={`animate-in delay-${(i%6)+1}`} style={{ background:'var(--bg-card)', borderRadius:'var(--radius)', border:`1px solid ${m.isLowStock?statusColor+'30':'var(--border)'}`, padding:20, transition:'all 0.25s' }}
                  onMouseOver={e=>{ e.currentTarget.style.borderColor=statusColor; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 32px ${statusColor}15`; }}
                  onMouseOut={e=>{ e.currentTarget.style.borderColor=m.isLowStock?statusColor+'30':'var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:14, color:'var(--text)', marginBottom:5 }}>{m.name}</div>
                      <Badge status={m.category}/>
                    </div>
                    <Badge status={status}/>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12 }}>
                    <div>
                      <div style={{ fontSize:32, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em' }}>{m.currentStock}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{m.unit} · min: {m.minStock}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:600, color:'var(--text-secondary)' }}>{formatCurrency(m.unitPrice)}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>per {m.unit}</div>
                    </div>
                  </div>
                  <div style={{ height:6, background:'var(--bg-elevated)', borderRadius:3, marginBottom:14, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', borderRadius:3, background:statusColor, transition:'width 0.6s ease' }}/>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <Btn variant="success" size="sm" style={{flex:1}} onClick={()=>{ setShowStock(m); setStockForm({type:'in',quantity:'',project:'',supplier:'',unitPrice:'',phase:'',notes:''}); }}>↓ IN</Btn>
                    <Btn variant="danger"  size="sm" style={{flex:1}} onClick={()=>{ setShowStock(m); setStockForm({type:'out',quantity:'',project:'',supplier:'',unitPrice:'',phase:'',notes:''}); }}>↑ OUT</Btn>
                    <Btn variant="ghost"   size="sm" onClick={()=>setShowLogs(m)}>📋</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Material Modal */}
        <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Add Material">
          <form onSubmit={handleAdd}>
            <Input label="Material Name" required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g., OPC Cement 53 Grade" style={{marginBottom:16}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
              <Select label="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} options={categories.map(c=>({value:c,label:c.charAt(0).toUpperCase()+c.slice(1)}))}/>
              <Select label="Unit" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} options={units.map(u=>({value:u,label:u}))}/>
              <Input label="Unit Price (₹)" type="number" value={form.unitPrice} onChange={e=>setForm(f=>({...f,unitPrice:e.target.value}))}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
              <Input label="Current Stock" type="number" required value={form.currentStock} onChange={e=>setForm(f=>({...f,currentStock:e.target.value}))}/>
              <Input label="Min Stock (Alert)" type="number" value={form.minStock} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))}/>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn type="submit">Add Material</Btn>
            </div>
          </form>
        </Modal>

        {/* Stock In/Out Modal */}
        <Modal isOpen={!!showStock} onClose={()=>setShowStock(null)} title={`Stock ${stockForm.type==='in'?'IN':'OUT'} — ${showStock?.name}`}>
          <form onSubmit={handleStock}>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {['in','out'].map(t=>(
                <button key={t} type="button" onClick={()=>setStockForm(f=>({...f,type:t}))} style={{ flex:1, padding:'10px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.2s', background:stockForm.type===t?(t==='in'?'var(--green)':'var(--red)'):'var(--bg-elevated)', color:stockForm.type===t?'white':'var(--text-secondary)' }}>
                  {t==='in'?'↓ Stock IN':'↑ Stock OUT'}
                </button>
              ))}
            </div>
            <Input label={`Quantity (${showStock?.unit})`} type="number" required value={stockForm.quantity} onChange={e=>setStockForm(f=>({...f,quantity:e.target.value}))} style={{marginBottom:16}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Select label="Project" value={stockForm.project} onChange={e=>setStockForm(f=>({...f,project:e.target.value}))} options={[{value:'',label:'None'},...projects.map(p=>({value:p._id,label:p.name}))]}/>
              <Select label="Project Phase" value={stockForm.phase} onChange={e=>setStockForm(f=>({...f,phase:e.target.value}))} options={PHASES.map(ph=>({value:ph,label:ph||'None'}))}/>
            </div>
            {stockForm.type==='in'&&(
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <Select label="Supplier" value={stockForm.supplier} onChange={e=>setStockForm(f=>({...f,supplier:e.target.value}))} options={[{value:'',label:'None'},...suppliers.map(s=>({value:s._id,label:s.name}))]}/>
                <Input label="Unit Price (₹)" type="number" value={stockForm.unitPrice} onChange={e=>setStockForm(f=>({...f,unitPrice:e.target.value}))}/>
              </div>
            )}
            <Input label="Notes" value={stockForm.notes} onChange={e=>setStockForm(f=>({...f,notes:e.target.value}))} style={{marginBottom:24}}/>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowStock(null)}>Cancel</Btn>
              <Btn type="submit" variant={stockForm.type==='in'?'success':'danger'}>{stockForm.type==='in'?'↓ Add Stock':'↑ Remove Stock'}</Btn>
            </div>
          </form>
        </Modal>

        {/* Stock Log Modal */}
        <Modal isOpen={!!showLogs} onClose={()=>setShowLogs(null)} title={`Stock Log — ${showLogs?.name}`} size="lg">
          {showLogs?.stockLog?.length===0 ? <p style={{color:'var(--text-muted)',fontSize:13}}>No stock movements recorded.</p> : (
            <DataTable
              columns={[
                { key:'type',        label:'Type',     render:v=><Badge status={v==='in'?'active':'overdue'}/> },
                { key:'quantity',    label:'Qty',      render:(v,r)=><span style={{fontFamily:'var(--mono)'}}>{v} {showLogs?.unit}</span> },
                { key:'phase',       label:'Phase',    render:v=>v?<span style={{fontSize:12,color:'var(--accent-light)',fontWeight:600}}>{v}</span>:<span style={{color:'var(--text-muted)'}}>—</span> },
                { key:'projectName', label:'Project',  render:v=>v||<span style={{color:'var(--text-muted)'}}>—</span> },
                { key:'supplierName',label:'Supplier', render:v=>v||<span style={{color:'var(--text-muted)'}}>—</span> },
                { key:'unitPrice',   label:'Price',    render:v=><span style={{fontFamily:'var(--mono)'}}>{formatCurrency(v)}</span> },
                { key:'totalCost',   label:'Total',    render:v=><span style={{fontFamily:'var(--mono)',fontWeight:600}}>{formatCurrency(v)}</span> },
                { key:'date',        label:'Date',     render:v=>formatDate(v) },
                { key:'notes',       label:'Notes',    render:v=>v||'—' },
              ]}
              data={(showLogs?.stockLog||[]).slice().reverse()}
            />
          )}
        </Modal>
      </Page>
    </Layout>
  );
}
