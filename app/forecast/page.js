'use client';
import { useState } from 'react';
import Layout from '@/components/Layout';
import { Page, Card, Badge, Btn, Loading } from '@/components/UI';
import { formatCurrency } from '@/lib/helpers';
import api from '@/lib/api';

const urgencyColor = { immediate:'var(--red)', within_week:'var(--yellow)', within_month:'var(--accent)' };
const riskColor    = { high:'var(--red)', medium:'var(--yellow)', low:'var(--green)' };
const trendIcon    = { increasing:'↑', stable:'→', decreasing:'↓' };
const trendColor   = { increasing:'var(--red)', stable:'var(--text-muted)', decreasing:'var(--green)' };
const healthColor  = { good:'var(--green)', warning:'var(--yellow)', critical:'var(--red)' };

const Section = ({ title, children }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>{title}</div>
    {children}
  </div>
);

export default function Forecast() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState(null);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState({});

  const generate = async (type) => {
    setLoading(true); setError(null);
    try {
      const res = await api.get(`/forecast/${type}`);
      if (type==='inventory') setInventory(res.data);
      else setBudget(res.data);
      setLastUpdated(p=>({...p,[type]:new Date(res.data.generatedAt)}));
    } catch(e){ setError(e.response?.data?.message||'Forecast generation failed'); }
    finally { setLoading(false); }
  };

  const activeData = activeTab==='inventory' ? inventory : budget;

  return (
    <Layout>
      <Page title="AI Forecasting" subtitle="Powered by Gemini — inventory depletion & budget predictions"
        actions={<Btn onClick={()=>generate(activeTab)} disabled={loading} icon={<span style={{fontSize:14}}>✨</span>}>{loading?'Generating…':`Generate ${activeTab==='inventory'?'Inventory':'Budget'} Forecast`}</Btn>}>

        {/* Tabs */}
        <div style={{ display:'flex', gap:4, marginBottom:28, background:'var(--bg-card)', padding:4, borderRadius:12, width:'fit-content', border:'1px solid var(--border)' }}>
          {[{id:'inventory',label:'📦 Inventory Forecast'},{id:'budget',label:'💰 Budget Forecast'}].map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{ padding:'9px 22px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:13, fontWeight:600, transition:'all 0.2s', background:activeTab===tab.id?'linear-gradient(135deg,var(--accent),var(--accent-light))':'transparent', color:activeTab===tab.id?'white':'var(--text-secondary)', boxShadow:activeTab===tab.id?'0 4px 12px var(--accent-glow)':'none' }}>{tab.label}</button>
          ))}
        </div>

        {error&&<div style={{ background:'var(--red-soft)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:'var(--radius)', padding:'14px 18px', marginBottom:20, color:'var(--red)', fontSize:13 }}>⚠ {error}</div>}

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 20px', gap:16 }}>
            <div style={{ width:48, height:48, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
            <div style={{ fontSize:14, color:'var(--text-muted)' }}>Analysing data with Gemini AI…</div>
          </div>
        ) : !activeData ? (
          <div style={{ textAlign:'center', padding:'80px 20px' }}>
            <div style={{ width:80, height:80, borderRadius:20, background:'var(--accent-soft)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 20px' }}>{activeTab==='inventory'?'📦':'💰'}</div>
            <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:10 }}>{activeTab==='inventory'?'Inventory Forecast':'Budget Forecast'}</div>
            <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:32, maxWidth:440, margin:'0 auto 32px' }}>
              {activeTab==='inventory'?'Get AI-powered predictions on when materials will deplete, reorder recommendations, and 30-day consumption forecasts.':'Get AI-powered budget burn rate analysis, project overrun risks, savings opportunities, and spend trend insights.'}
            </div>
            <Btn onClick={()=>generate(activeTab)} icon={<span>✨</span>} size="lg">Generate {activeTab==='inventory'?'Inventory':'Budget'} Forecast</Btn>
          </div>
        ) : (
          <div>
            {lastUpdated[activeTab]&&<div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:20, textAlign:'right' }}>Last generated: {lastUpdated[activeTab].toLocaleString('en-IN')}</div>}

            {activeTab==='inventory' && inventory?.data && (() => {
              const d = inventory.data;
              return (
                <div>
                  <div style={{ background:`${healthColor[d.overall_health]}12`, border:`1px solid ${healthColor[d.overall_health]}40`, borderRadius:'var(--radius)', padding:'16px 20px', marginBottom:28, display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ fontSize:28 }}>{d.overall_health==='critical'?'🚨':d.overall_health==='warning'?'⚠️':'✅'}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:healthColor[d.overall_health], marginBottom:3, textTransform:'capitalize' }}>Inventory Health: {d.overall_health}</div>
                      <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{d.summary}</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>
                    <Section title={`Critical Items (${d.critical_items?.length||0})`}>
                      {d.critical_items?.length===0 ? <p style={{fontSize:13,color:'var(--text-muted)'}}>No critical items.</p> : d.critical_items?.map((item,i)=>(
                        <div key={i} style={{ background:'var(--bg-card)', border:`1px solid ${urgencyColor[item.urgency]||'var(--border)'}30`, borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                            <span style={{ fontWeight:600, color:'var(--text)', fontSize:13 }}>{item.name}</span>
                            <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:`${urgencyColor[item.urgency]||'var(--text-muted)'}20`, color:urgencyColor[item.urgency]||'var(--text-muted)', textTransform:'capitalize' }}>{item.urgency?.replace('_',' ')}</span>
                          </div>
                          <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>{item.issue}</div>
                          <div style={{ fontSize:12, color:'var(--accent-light)' }}>→ {item.action}</div>
                        </div>
                      ))}
                    </Section>
                    <Section title={`Reorder Recommendations (${d.reorder_recommendations?.length||0})`}>
                      {d.reorder_recommendations?.map((r,i)=>(
                        <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontWeight:600, color:'var(--text)', fontSize:13 }}>{r.name}</span>
                            <span style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--accent-light)' }}>{formatCurrency(r.estimated_cost)}</span>
                          </div>
                          <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>Order: <span style={{fontWeight:600,color:'var(--text)'}}>{r.recommended_order_qty} {r.unit}</span></div>
                          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{r.reason}</div>
                        </div>
                      ))}
                    </Section>
                  </div>
                  <Section title="30-Day Consumption Forecast">
                    <Card noPad>
                      <DataTable
                        columns={[
                          { key:'name', label:'Material', render:v=><span style={{fontWeight:500,color:'var(--text)'}}>{v}</span> },
                          { key:'predicted_consumption', label:'Predicted Consumption', render:v=><span style={{fontFamily:'var(--mono)'}}>{v}</span> },
                          { key:'predicted_stock_end', label:'Est. Stock End', render:v=><span style={{fontFamily:'var(--mono)'}}>{v}</span> },
                          { key:'will_deplete', label:'Will Deplete', render:v=><Badge status={v?'critical':'active'}/> },
                          { key:'depletion_date', label:'Depletion Date', render:v=><span style={{color:v?'var(--red)':'var(--text-muted)',fontSize:12}}>{v||'—'}</span> },
                        ]}
                        data={d['30_day_forecast']||[]}
                      />
                    </Card>
                  </Section>
                </div>
              );
            })()}

            {activeTab==='budget' && budget?.data && (() => {
              const d = budget.data;
              return (
                <div>
                  <div style={{ background:`${healthColor[d.overall_health]}12`, border:`1px solid ${healthColor[d.overall_health]}40`, borderRadius:'var(--radius)', padding:'16px 20px', marginBottom:28, display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ fontSize:28 }}>{d.overall_health==='critical'?'🚨':d.overall_health==='warning'?'⚠️':'✅'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:healthColor[d.overall_health], marginBottom:3, textTransform:'capitalize' }}>Budget Health: {d.overall_health}</div>
                      <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{d.summary}</div>
                    </div>
                    <div style={{ display:'flex', gap:24, flexShrink:0 }}>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>Monthly Burn Rate</div>
                        <div style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:16, color:'var(--text)' }}>{formatCurrency(d.monthly_burn_rate)}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>Next Month Forecast</div>
                        <div style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:16, color:'var(--accent-light)' }}>{formatCurrency(d.projected_next_month_spend)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                    <Section title="Project Budget Forecasts">
                      {d.project_forecasts?.map((p,i)=>(
                        <div key={i} style={{ background:'var(--bg-card)', border:`1px solid ${riskColor[p.budget_overrun_risk]||'var(--border)'}30`, borderRadius:10, padding:'14px 16px', marginBottom:10 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                            <span style={{ fontWeight:600, color:'var(--text)', fontSize:13 }}>{p.name}</span>
                            <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:`${riskColor[p.budget_overrun_risk]||'var(--text-muted)'}20`, color:riskColor[p.budget_overrun_risk]||'var(--text-muted)' }}>{p.budget_overrun_risk} risk</span>
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, marginBottom:8 }}>
                            <div><span style={{color:'var(--text-muted)'}}>Burn Rate: </span><span style={{fontFamily:'var(--mono)',color:'var(--text)'}}>{formatCurrency(p.current_burn_rate)}/mo</span></div>
                            <div><span style={{color:'var(--text-muted)'}}>Projected: </span><span style={{fontFamily:'var(--mono)',color:'var(--text)'}}>{formatCurrency(p.projected_completion_cost)}</span></div>
                          </div>
                          {p.estimated_overrun_amount>0&&<div style={{ fontSize:12, color:'var(--red)', marginBottom:4 }}>⚠ Overrun risk: {formatCurrency(p.estimated_overrun_amount)}</div>}
                          <div style={{ fontSize:12, color:'var(--accent-light)' }}>→ {p.recommendation}</div>
                        </div>
                      ))}
                    </Section>
                    <div>
                      <Section title="Top Risks">
                        {d.top_risks?.map((r,i)=>(
                          <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', marginBottom:8, display:'flex', gap:12, alignItems:'flex-start' }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background:riskColor[r.impact], marginTop:4, flexShrink:0 }}/>
                            <div>
                              <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:3 }}>{r.risk}</div>
                              <div style={{ fontSize:12, color:'var(--text-muted)' }}>Mitigation: {r.mitigation}</div>
                            </div>
                          </div>
                        ))}
                      </Section>
                      <Section title="Savings Opportunities">
                        {d.savings_opportunities?.map((s,i)=>(
                          <div key={i} style={{ background:'var(--bg-card)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:8 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                              <span style={{ fontWeight:600, color:'var(--text)', fontSize:13 }}>{s.area}</span>
                              <span style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--green)', fontSize:13 }}>-{formatCurrency(s.potential_saving)}</span>
                            </div>
                            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.how}</div>
                          </div>
                        ))}
                      </Section>
                    </div>
                  </div>
                  <Section title="Category Spend Trends">
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                      {d.category_insights?.map((c,i)=>(
                        <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                            <span style={{ fontWeight:600, color:'var(--text)', fontSize:13, textTransform:'capitalize' }}>{c.category}</span>
                            <span style={{ fontSize:14, fontWeight:700, color:trendColor[c.trend] }}>{trendIcon[c.trend]} {c.trend}</span>
                          </div>
                          <div style={{ fontFamily:'var(--mono)', fontWeight:700, color:'var(--accent-light)', marginBottom:4 }}>{formatCurrency(c.avg_monthly_spend)}/mo</div>
                          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>
              );
            })()}
          </div>
        )}
      </Page>
    </Layout>
  );
}

function DataTable({ columns, data }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:0, fontSize:13 }}>
        <thead>
          <tr>{columns.map((c,i)=><th key={i} style={{ padding:'11px 16px', textAlign:'left', fontWeight:600, color:'var(--text-muted)', borderBottom:'1px solid var(--border)', fontSize:11, textTransform:'uppercase', letterSpacing:'0.06em' }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((row,ri)=>(
            <tr key={ri} onMouseOver={e=>e.currentTarget.style.background='var(--bg-card-hover)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
              {columns.map((c,ci)=><td key={ci} style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', color:'var(--text-secondary)' }}>{c.render?c.render(row[c.key],row):row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
