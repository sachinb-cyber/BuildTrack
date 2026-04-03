'use client';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Page, Card, StatCard, DataTable, Badge, AlertCard, Loading, MiniBarChart } from '@/components/UI';
import { formatCurrency, formatDate, getMonthName } from '@/lib/helpers';
import api from '@/lib/api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><Loading/></Layout>;
  if (!data) return <Layout><div style={{ color:'var(--red)', padding:20 }}>Failed to load dashboard</div></Layout>;

  const monthlyAmounts = data.expenses?.monthly?.map(m => m.total) || [];
  const expenseRows = (data.recentExpenses || []).map(e => ({
    title: e.title, category: e.category,
    amount: formatCurrency(e.amount), date: formatDate(e.date), project: e.project?.name || '—',
  }));

  const criticalOverrun = (data.overrunProjects || []).filter(p => p.pct >= 100);
  const warningOverrun  = (data.overrunProjects || []).filter(p => p.pct >= 80 && p.pct < 100);

  return (
    <Layout>
      <Page title="Dashboard" subtitle="Real-time overview of all operations">

        {/* Cost Overrun Alerts */}
        {criticalOverrun.length > 0 && (
          <div style={{ background:'rgba(232,74,95,0.08)', border:'1px solid rgba(232,74,95,0.3)', borderRadius:'var(--radius)', padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:12 }}>
            <span style={{ fontSize:20 }}>🚨</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'var(--red)', fontSize:14, marginBottom:6 }}>Budget Overrun — {criticalOverrun.length} project{criticalOverrun.length > 1 ? 's' : ''} exceeded budget</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {criticalOverrun.map(p => (
                  <span key={p._id} style={{ fontSize:12, background:'rgba(232,74,95,0.12)', border:'1px solid rgba(232,74,95,0.25)', padding:'3px 10px', borderRadius:20, color:'var(--red)', fontWeight:600 }}>
                    {p.name} — {p.pct}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {warningOverrun.length > 0 && (
          <div style={{ background:'rgba(226,183,20,0.08)', border:'1px solid rgba(226,183,20,0.3)', borderRadius:'var(--radius)', padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'flex-start', gap:12 }}>
            <span style={{ fontSize:20 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, color:'var(--yellow)', fontSize:14, marginBottom:6 }}>Budget Warning — {warningOverrun.length} project{warningOverrun.length > 1 ? 's' : ''} above 80%</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {warningOverrun.map(p => (
                  <span key={p._id} style={{ fontSize:12, background:'rgba(226,183,20,0.12)', border:'1px solid rgba(226,183,20,0.25)', padding:'3px 10px', borderRadius:20, color:'var(--yellow)', fontWeight:600 }}>
                    {p.name} — {p.pct}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Inventory / Invoice Alerts */}
        {(data.inventory?.lowStockCount > 0 || data.invoices?.pendingCount > 0) && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:12, marginBottom:24 }}>
            {data.inventory?.lowStockCount > 0 && <AlertCard type="warning" title={`${data.inventory.lowStockCount} Low Stock Items`} items={data.inventory.lowStockItems?.map(i => `${i.name}: ${i.currentStock} ${i.unit} (min: ${i.minStock})`)}/>}
            {data.invoices?.pendingCount > 0 && <AlertCard type="danger" title={`${data.invoices.pendingCount} Pending / Overdue Invoices`} items={[`Total pending: ${formatCurrency(data.invoices.pendingAmount)}`]}/>}
          </div>
        )}

        <div className="grid-4" style={{ marginBottom:16 }}>
          <StatCard title="Total Expenses" value={formatCurrency(data.expenses?.total)} icon="💰" color="var(--accent)" delay={1} chart={<MiniBarChart data={monthlyAmounts.slice(-7)} color="var(--accent)" />}/>
          <StatCard title="Pending Payments" value={formatCurrency(data.pendingTotal)} sub={`Workers: ${formatCurrency(data.workers?.pendingPayments)}`} icon="⏳" color="var(--red)" delay={2}/>
          <StatCard title="Active Projects" value={data.projects?.active} sub={`Budget: ${formatCurrency(data.projects?.totalBudget)}`} icon="🏗️" color="var(--green)" delay={3}/>
          <StatCard title="Low Stock Items" value={data.inventory?.lowStockCount} sub={`of ${data.inventory?.totalMaterials} materials`} icon="📦" color={data.inventory?.lowStockCount > 0 ? 'var(--red)' : 'var(--green)'} delay={4}/>
        </div>

        <div className="grid-4" style={{ marginBottom:24 }}>
          <StatCard title="Active Workers" value={data.workers?.total} icon="👷" color="var(--yellow)" delay={1}/>
          <StatCard title="Staff Members" value={data.staff?.total} sub={`Pending: ${formatCurrency(data.staff?.pendingSalary)}`} icon="👨‍💼" color="var(--purple)" delay={2}/>
          <StatCard title="Pending Invoices" value={data.invoices?.pendingCount} sub={formatCurrency(data.invoices?.pendingAmount)} icon="🧾" color="var(--red)" delay={3}/>
          <StatCard title="Pending Deliveries" value={data.pendingDeliveries || 0} sub="Awaiting arrival" icon="🚚" color="var(--cyan)" delay={4}/>
        </div>

        <div className="grid-2" style={{ marginBottom:20 }}>
          <Card title="Monthly Expenses Trend" className="animate-in delay-5">
            <div style={{ padding:'0 4px' }}>
              {monthlyAmounts.length > 0 ? (
                <>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:160 }}>
                    {data.expenses.monthly.map((m, i) => {
                      const max = Math.max(...monthlyAmounts, 1);
                      const pct = (m.total / max) * 100;
                      return (
                        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%', justifyContent:'flex-end' }}>
                          <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--mono)' }}>{(m.total/1000).toFixed(0)}K</div>
                          <div style={{ width:'100%', borderRadius:'2px 2px 0 0', height:`${Math.max(pct,4)}%`, background:'var(--accent)', opacity: 0.9, transition:'height 0.6s cubic-bezier(0.2,0,0,1)', transitionDelay:`${i*40}ms` }}/>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:8, borderTop:'1px solid var(--border)', paddingTop:8 }}>
                    {data.expenses.monthly.map((m,i) => <div key={i} style={{ flex:1, textAlign:'center', fontSize:10, color:'var(--text-muted)' }}>{getMonthName(m._id.month)}</div>)}
                  </div>
                </>
              ) : <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'40px 0', fontSize:13 }}>No expense data yet</div>}
            </div>
          </Card>

          <Card title="Budget vs Actual" className="animate-in delay-5">
            {[
              { label:'Total Budget', value:data.projects?.totalBudget||0, color:'var(--border-hover)' },
              { label:'Amount Spent', value:data.projects?.totalSpent||0, color:'var(--accent)' },
            ].map((item,i) => (
              <div key={i} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontFamily:'var(--mono)', fontWeight:600, color:'var(--text)' }}>{formatCurrency(item.value)}</span>
                </div>
                <div style={{ height:6, background:'var(--bg-elevated)', borderRadius:3, overflow:'hidden', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.2)' }}>
                  <div style={{ width:`${Math.min((item.value/(data.projects?.totalBudget||1))*100,100)}%`, height:'100%', borderRadius:3, background:item.color, transition:'width 0.8s cubic-bezier(0.2,0,0,1)' }}/>
                </div>
              </div>
            ))}
            {/* Project overrun list */}
            {(data.overrunProjects||[]).length > 0 && (
              <div style={{ marginTop:8, borderTop:'1px solid var(--border)', paddingTop:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>Budget Status by Project</div>
                {data.overrunProjects.map(p => (
                  <div key={p._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:12, color:'var(--text-secondary)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:8 }}>{p.name}</span>
                    <span style={{ fontSize:12, fontWeight:700, fontFamily:'var(--mono)', color: p.pct >= 100 ? 'var(--red)' : p.pct >= 80 ? 'var(--yellow)' : 'var(--green)', flexShrink:0 }}>{p.pct}%</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
              {data.projects?.totalBudget > 0 ? `${Math.round((data.projects.totalSpent/data.projects.totalBudget)*100)}% utilized` : 'No budget set'}
            </div>
          </Card>
        </div>

        <Card title="Recent Expenses" className="animate-in delay-6" noPad>
          <DataTable
            columns={[
              { key:'title',    label:'Title',    render:v=><span style={{ fontWeight:500, color:'var(--text)' }}>{v}</span> },
              { key:'category', label:'Category', render:v=><Badge status={v}/> },
              { key:'amount',   label:'Amount',   render:v=><span style={{ fontFamily:'var(--mono)', fontWeight:600, color:'var(--text)' }}>{v}</span> },
              { key:'date',     label:'Date' },
              { key:'project',  label:'Project' },
            ]}
            data={expenseRows}
          />
        </Card>
      </Page>
    </Layout>
  );
}
