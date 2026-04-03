'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@/components/Layout';
import { Page, StatCard, DataTable, Badge, Btn, Input, Select, Modal, Loading, EmptyState } from '@/components/UI';
import { formatDate } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const PHASES = ['', 'Foundation', 'Structure', 'Finishing', 'Handover'];
const statusColor = { pending:'var(--yellow)', delivered:'var(--green)', partial:'var(--accent)', cancelled:'var(--red)' };

/* ── Watermark helper ── */
function applyWatermark(canvas, video, { geo, delivery, user }) {
  const W = video.videoWidth, H = video.videoHeight;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, W, H);

  const supplierName = delivery?.supplier?.name || 'Unknown Supplier';
  const projectName  = delivery?.project?.name  || 'Samarth Developers';
  const userName     = user?.name || 'Unknown';
  const now          = new Date();
  const timestamp    = now.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'medium' });
  const latLng       = geo ? `${geo.lat.toFixed(6)}° N,  ${geo.lng.toFixed(6)}° E` : 'Location unavailable';

  const barH  = Math.max(120, H * 0.16);
  const fs    = Math.max(18, W * 0.019);
  const lineH = fs * 1.6;
  const pad   = Math.max(20, W * 0.022);

  // Gradient footer bar
  const grad = ctx.createLinearGradient(0, H - barH - 20, 0, H);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.25, 'rgba(0,0,0,0.72)');
  grad.addColorStop(1,    'rgba(0,0,0,0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, H - barH - 20, W, barH + 20);

  // Blue accent stripe
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, H - barH, Math.max(5, W * 0.005), barH);

  const drawLine = (text, color, y, bold = false) => {
    ctx.font = `${bold ? '700' : '400'} ${fs}px 'Segoe UI', Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 5;
    ctx.fillText(text, pad, y);
    ctx.shadowBlur = 0;
  };

  const base = H - barH + lineH * 0.85;
  drawLine(`🚚  ${supplierName}  →  ${projectName}`, '#ffffff', base, true);
  drawLine(`📍  ${latLng}`, '#22d3ee', base + lineH * 1.1);
  drawLine(`🕐  ${timestamp}`, '#a0a0a0', base + lineH * 2.1);
  drawLine(`👤  ${userName}`, '#a0a0a0', base + lineH * 3.1);

  // GPS accuracy badge
  if (geo?.accuracy) {
    const badge = `±${geo.accuracy}m`;
    ctx.font = `600 ${fs * 0.78}px 'Segoe UI', Arial, sans-serif`;
    const tw = ctx.measureText(badge).width;
    const bx = W - pad - tw - 20;
    const by = H - barH + lineH * 0.4;
    const badgeColor = geo.accuracy < 20 ? '#1fdf64' : geo.accuracy < 50 ? '#e2b714' : '#e84a5f';
    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, tw + 20, fs * 1.3, [6]);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText(badge, bx + 10, by + fs * 1.0);
  }
}

export default function Deliveries() {
  const { user, hasRole } = useAuth();
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [deliveries, setDeliveries] = useState([]);
  const [projects, setProjects]     = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [materials, setMaterials]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  // Confirm delivery modal state
  const [confirmDelivery, setConfirmDelivery] = useState(null);
  const [camStep, setCamStep]   = useState('capture'); // 'capture' | 'preview'
  const [capturedImg, setCapturedImg] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [geo, setGeo]           = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const initItem = { material:'', materialName:'', quantity:'', unit:'', unitPrice:'' };
  const [form, setForm] = useState({ supplier:'', project:'', phase:'', deliveryDate:'', items:[{...initItem}], notes:'' });

  const fetchData = useCallback(async () => {
    try {
      const [dRes, pRes, sRes, mRes] = await Promise.all([
        api.get('/deliveries', { params:{ status:filterStatus } }),
        api.get('/projects'), api.get('/suppliers'), api.get('/inventory'),
      ]);
      setDeliveries(dRes.data); setProjects(pRes.data); setSuppliers(sRes.data); setMaterials(mRes.data);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Camera controls ── */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch (err) {
      setCameraError('Camera access denied. Please allow camera permission and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  /* ── Geolocation ── */
  const captureGeo = useCallback(() => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported on this device'); return; }
    setGeoLoading(true); setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) });
        setGeoLoading(false);
      },
      err => { setGeoError(err.message); setGeoLoading(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  /* ── Open confirm modal ── */
  const openConfirm = (delivery) => {
    setConfirmDelivery(delivery);
    setCamStep('capture');
    setCapturedImg(null);
    setGeo(null);
    setGeoError(null);
  };

  useEffect(() => {
    if (confirmDelivery && camStep === 'capture') {
      startCamera();
      captureGeo();
    }
    if (!confirmDelivery) stopCamera();
  }, [confirmDelivery, camStep]);

  /* ── Capture photo with watermark ── */
  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;
    if (!geo) { toast.error('Waiting for GPS location…'); return; }
    applyWatermark(canvasRef.current, videoRef.current, { geo, delivery: confirmDelivery, user });
    setCapturedImg(canvasRef.current.toDataURL('image/jpeg', 0.88));
    stopCamera();
    setCamStep('preview');
  };

  const retake = () => {
    setCapturedImg(null);
    setCamStep('capture');
  };

  /* ── Final confirm ── */
  const handleConfirmDelivery = async () => {
    if (!capturedImg) { toast.error('Photo is required to confirm delivery'); return; }
    if (!geo)         { toast.error('GPS location is required');             return; }
    setConfirming(true);
    try {
      await api.put(`/deliveries/${confirmDelivery._id}`, {
        status: 'delivered',
        geo,
        photo: capturedImg,
      });
      toast.success('Delivery confirmed — inventory auto-updated!');
      setConfirmDelivery(null); setShowDetail(null); fetchData();
    } catch(e) {
      toast.error('Error confirming delivery');
    } finally {
      setConfirming(false);
    }
  };

  const closeConfirm = () => { stopCamera(); setConfirmDelivery(null); };

  /* ── Schedule delivery ── */
  const updateItem = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: value };
      if (field === 'material') {
        const mat = materials.find(m => m._id === value);
        if (mat) { items[idx].materialName = mat.name; items[idx].unit = mat.unit; items[idx].unitPrice = mat.unitPrice || ''; }
      }
      return { ...f, items };
    });
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/deliveries/${id}`, { status });
      toast.success(`Status updated to ${status}`);
      setShowDetail(null); fetchData();
    } catch(e){ toast.error('Error updating status'); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const items = form.items.map(i => ({ ...i, quantity:Number(i.quantity), unitPrice:Number(i.unitPrice||0), materialName: i.materialName || i.material }));
      await api.post('/deliveries', { ...form, items });
      toast.success('Delivery scheduled'); setShowAdd(false);
      setForm({ supplier:'', project:'', phase:'', deliveryDate:'', items:[{...initItem}], notes:'' }); fetchData();
    } catch(e){ toast.error(e.response?.data?.message||'Error'); }
  };

  if (loading) return <Layout><Loading/></Layout>;

  const pending   = deliveries.filter(d=>d.status==='pending').length;
  const delivered = deliveries.filter(d=>d.status==='delivered').length;
  const partial   = deliveries.filter(d=>d.status==='partial').length;

  return (
    <Layout>
      <Page title="Supplier Deliveries" subtitle={`${deliveries.length} deliveries tracked`}
        actions={hasRole('admin','engineer','accountant')&&<Btn icon={<span style={{fontSize:16}}>+</span>} onClick={()=>setShowAdd(true)}>Schedule Delivery</Btn>}>

        <div className="grid-4" style={{ marginBottom:24 }}>
          <StatCard title="Total Deliveries" value={deliveries.length} icon="🚚" color="var(--accent)"  delay={1}/>
          <StatCard title="Pending"           value={pending}           icon="⏳" color="var(--yellow)"  delay={2}/>
          <StatCard title="Delivered"         value={delivered}         icon="✅" color="var(--green)"   delay={3}/>
          <StatCard title="Partial"           value={partial}           icon="📦" color="var(--purple)"  delay={4}/>
        </div>

        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <Select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ maxWidth:200 }}
            options={[{value:'',label:'All Status'},{value:'pending',label:'Pending'},{value:'delivered',label:'Delivered'},{value:'partial',label:'Partial'},{value:'cancelled',label:'Cancelled'}]}/>
        </div>

        {deliveries.length===0 ? (
          <EmptyState icon="🚚" title="No deliveries" description="Schedule supplier deliveries to track material arrivals"
            action={hasRole('admin','engineer')&&<Btn onClick={()=>setShowAdd(true)}>Schedule Delivery</Btn>}/>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {deliveries.map((d,i) => {
              const color = statusColor[d.status]||'var(--text-muted)';
              return (
                <div key={d._id} className={`animate-in delay-${(i%6)+1}`}
                  style={{ background:'var(--bg-card)', borderRadius:'var(--radius)', border:`1px solid ${color}22`, padding:20, cursor:'pointer', transition:'all 0.25s' }}
                  onMouseOver={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 32px ${color}15`; }}
                  onMouseOut={e=>{ e.currentTarget.style.borderColor=`${color}22`; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
                  onClick={()=>setShowDetail(d)}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:'var(--text)', marginBottom:4 }}>{d.supplier?.name||'—'}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{d.supplier?.company||''}</div>
                    </div>
                    <span style={{ fontSize:11, fontWeight:700, color, background:`${color}18`, padding:'3px 10px', borderRadius:12, textTransform:'uppercase' }}>{d.status}</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:8 }}>
                    🏗️ <span style={{ fontWeight:500 }}>{d.project?.name||'—'}</span>
                    {d.phase&&<span style={{ marginLeft:8, fontSize:12, color:'var(--accent-light)', fontWeight:600 }}>· {d.phase}</span>}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
                    {d.items?.length} item{d.items?.length!==1?'s':''} · Due {formatDate(d.deliveryDate)}
                  </div>
                  {d.geo?.lat&&<div style={{ fontSize:11, color:'var(--cyan)', marginBottom:10 }}>📍 {d.geo.lat.toFixed(5)}, {d.geo.lng.toFixed(5)}</div>}
                  <div style={{ display:'flex', gap:6 }}>
                    {d.status==='pending'&&hasRole('admin','engineer','accountant')&&(
                      <Btn variant="success" size="sm" style={{flex:1}} onClick={e=>{ e.stopPropagation(); openConfirm(d); }}>
                        📷 Confirm Delivered
                      </Btn>
                    )}
                    {d.status==='pending'&&hasRole('admin','engineer','accountant')&&(
                      <Btn variant="secondary" size="sm" onClick={e=>{ e.stopPropagation(); updateStatus(d._id,'partial'); }}>Partial</Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Delivery Detail Modal ── */}
        <Modal isOpen={!!showDetail} onClose={()=>setShowDetail(null)} title="Delivery Details" size="lg">
          {showDetail&&(
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {[{l:'Supplier',v:showDetail.supplier?.name||'—'},{l:'Project',v:showDetail.project?.name||'—'},{l:'Phase',v:showDetail.phase||'—'},{l:'Date',v:formatDate(showDetail.deliveryDate)}].map((item,i)=>(
                  <div key={i} style={{ background:'var(--bg-elevated)', borderRadius:10, padding:12 }}>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{item.l}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{item.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:10 }}>Materials</div>
                <DataTable
                  columns={[{key:'materialName',label:'Material'},{key:'quantity',label:'Qty',render:(v,r)=>`${v} ${r.unit||''}`},{key:'unitPrice',label:'Unit Price',render:v=>v?`₹${v.toLocaleString('en-IN')}`:'—'}]}
                  data={showDetail.items||[]}
                />
              </div>
              {showDetail.notes&&<div style={{ fontSize:13, color:'var(--text-secondary)', padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:8, marginBottom:16 }}><strong>Notes:</strong> {showDetail.notes}</div>}
              {showDetail.geo?.lat&&(
                <div style={{ marginBottom:16, padding:'10px 14px', background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:10 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--cyan)', marginBottom:4 }}>📍 Delivery Location</div>
                  <div style={{ fontSize:13, color:'var(--text-secondary)', fontFamily:'var(--mono)' }}>
                    {showDetail.geo.lat.toFixed(6)}, {showDetail.geo.lng.toFixed(6)}
                    {showDetail.geo.accuracy&&<span style={{ color:'var(--text-muted)', fontSize:11 }}> ±{showDetail.geo.accuracy}m</span>}
                  </div>
                  <a href={`https://maps.google.com/?q=${showDetail.geo.lat},${showDetail.geo.lng}`} target="_blank" rel="noreferrer"
                    style={{ fontSize:12, color:'var(--accent-light)', textDecoration:'none', display:'inline-block', marginTop:4 }}>
                    Open in Google Maps →
                  </a>
                </div>
              )}
              {showDetail.photo&&(
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:8 }}>📷 Delivery Photo</div>
                  <img src={showDetail.photo} alt="Delivery" style={{ width:'100%', maxHeight:300, objectFit:'cover', borderRadius:10, border:'1px solid var(--border)' }}/>
                </div>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:12, paddingTop:16, borderTop:'1px solid var(--border)', flexWrap:'wrap' }}>
                <span style={{ fontSize:13, fontWeight:600, color:statusColor[showDetail.status]||'var(--text)' }}>Status: {showDetail.status?.toUpperCase()}</span>
                {showDetail.status==='pending'&&hasRole('admin','engineer','accountant')&&(
                  <>
                    <Btn variant="success" onClick={()=>{ openConfirm(showDetail); setShowDetail(null); }}>📷 Confirm Delivered</Btn>
                    <Btn variant="secondary" onClick={()=>updateStatus(showDetail._id,'partial')}>Partial</Btn>
                    <Btn variant="danger" onClick={()=>updateStatus(showDetail._id,'cancelled')}>Cancel</Btn>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* ── Confirm Delivery: Geo-tagged Camera Modal ── */}
        <Modal isOpen={!!confirmDelivery} onClose={closeConfirm} title={camStep==='capture'?'📷 Take Delivery Photo':'Preview & Confirm'} size="lg">
          {confirmDelivery&&(
            <div>
              {/* Delivery info header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'var(--bg-elevated)', borderRadius:10, marginBottom:16 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:'var(--text)' }}>{confirmDelivery.supplier?.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{confirmDelivery.project?.name}{confirmDelivery.phase&&` · ${confirmDelivery.phase}`}</div>
                </div>
                <div style={{ fontSize:11, padding:'3px 10px', borderRadius:12, background:'rgba(226,183,20,0.15)', color:'var(--yellow)', fontWeight:700 }}>PENDING</div>
              </div>

              {/* ── CAPTURE STEP ── */}
              {camStep==='capture'&&(
                <div>
                  {/* Camera viewport */}
                  <div style={{ position:'relative', background:'#000', borderRadius:12, overflow:'hidden', aspectRatio:'4/3', marginBottom:14 }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                    <canvas ref={canvasRef} style={{ display:'none' }}/>

                    {/* Loading overlay */}
                    {!cameraReady&&!cameraError&&(
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, background:'rgba(0,0,0,0.8)' }}>
                        <div style={{ width:36, height:36, border:'3px solid var(--accent)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
                        <span style={{ fontSize:13, color:'var(--text-muted)' }}>Starting camera…</span>
                      </div>
                    )}

                    {/* Error overlay */}
                    {cameraError&&(
                      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, background:'rgba(0,0,0,0.85)', padding:24 }}>
                        <span style={{ fontSize:32 }}>📷</span>
                        <span style={{ fontSize:13, color:'var(--red)', textAlign:'center' }}>{cameraError}</span>
                        <Btn onClick={startCamera}>Retry Camera</Btn>
                      </div>
                    )}

                    {/* GPS indicator */}
                    <div style={{ position:'absolute', top:12, left:12, padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, backdropFilter:'blur(8px)', display:'flex', alignItems:'center', gap:6, background: geo?'rgba(31,223,100,0.15)':'rgba(232,74,95,0.15)', border:`1px solid ${geo?'rgba(31,223,100,0.4)':'rgba(232,74,95,0.4)'}`, color: geo?'var(--green)':'var(--red)' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background: geo?'var(--green)':'var(--red)', animation:'pulse 2s infinite' }}/>
                      {geoLoading?'Getting GPS…':geo?`GPS ±${geo.accuracy}m`:geoError?'GPS Failed':'No GPS'}
                    </div>

                    {/* Mandatory badge */}
                    <div style={{ position:'absolute', top:12, right:12, padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(232,74,95,0.2)', border:'1px solid rgba(232,74,95,0.4)', color:'var(--red)', backdropFilter:'blur(8px)' }}>
                      📷 Photo Mandatory
                    </div>

                    {/* Scan-line texture */}
                    <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px)', pointerEvents:'none' }}/>

                    {/* Capture button */}
                    {cameraReady&&(
                      <button
                        onClick={capture}
                        disabled={!geo}
                        style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', width:68, height:68, borderRadius:'50%', border:'5px solid rgba(255,255,255,0.5)', background:'white', cursor:geo?'pointer':'not-allowed', opacity:geo?1:0.5, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.5)', transition:'transform 0.1s' }}
                        onMouseDown={e=>{ if(geo) e.currentTarget.style.transform='translateX(-50%) scale(0.92)'; }}
                        onMouseUp={e=>{ e.currentTarget.style.transform='translateX(-50%) scale(1)'; }}
                        title={geo?'Capture photo':'Waiting for GPS…'}
                      >
                        <div style={{ width:50, height:50, borderRadius:'50%', background:'white', border:'3px solid #1a1a1a' }}/>
                      </button>
                    )}
                  </div>

                  {/* GPS retry if failed */}
                  {(geoError||(!geo&&!geoLoading))&&(
                    <div style={{ background:'rgba(232,74,95,0.08)', border:'1px solid rgba(232,74,95,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:12, color:'var(--red)' }}>{geoError||'GPS not yet acquired'}</span>
                      <Btn size="sm" onClick={captureGeo}>Retry GPS</Btn>
                    </div>
                  )}

                  <p style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>
                    GPS watermark will be stamped on the photo · Photo is required to confirm delivery
                  </p>
                </div>
              )}

              {/* ── PREVIEW STEP ── */}
              {camStep==='preview'&&capturedImg&&(
                <div>
                  {/* Watermarked preview */}
                  <div style={{ position:'relative', borderRadius:12, overflow:'hidden', marginBottom:16, cursor:'default' }}>
                    <img src={capturedImg} alt="Delivery proof" style={{ width:'100%', display:'block', borderRadius:12 }}/>
                    <div style={{ position:'absolute', top:12, right:12, padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:'rgba(31,223,100,0.2)', border:'1px solid rgba(31,223,100,0.5)', color:'var(--green)', backdropFilter:'blur(8px)' }}>
                      ✓ PHOTO CAPTURED
                    </div>
                  </div>

                  {/* GPS info */}
                  {geo&&(
                    <div style={{ padding:'10px 14px', background:'rgba(34,211,238,0.08)', border:'1px solid rgba(34,211,238,0.2)', borderRadius:10, marginBottom:14 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--cyan)', marginBottom:3 }}>📍 Captured Location</div>
                      <div style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'var(--mono)' }}>
                        {geo.lat.toFixed(6)}, {geo.lng.toFixed(6)}
                        <span style={{ color:'var(--text-muted)', marginLeft:8 }}>±{geo.accuracy}m</span>
                      </div>
                      <a href={`https://maps.google.com/?q=${geo.lat},${geo.lng}`} target="_blank" rel="noreferrer"
                        style={{ fontSize:11, color:'var(--accent-light)', textDecoration:'none', display:'inline-block', marginTop:4 }}>
                        Open in Google Maps →
                      </a>
                    </div>
                  )}

                  <div style={{ display:'flex', gap:10 }}>
                    <Btn variant="secondary" style={{flex:1}} onClick={retake}>↩ Retake</Btn>
                    <Btn variant="success" style={{flex:2}} onClick={handleConfirmDelivery} disabled={confirming}>
                      {confirming ? '⏳ Confirming…' : '✓ Confirm Delivery'}
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* ── Schedule Delivery Modal ── */}
        <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="Schedule Delivery" size="lg">
          <form onSubmit={handleAdd}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Select label="Supplier" required value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} options={[{value:'',label:'Select Supplier'},...suppliers.map(s=>({value:s._id,label:s.name}))]}/>
              <Select label="Project" required value={form.project} onChange={e=>setForm(f=>({...f,project:e.target.value}))} options={[{value:'',label:'Select Project'},...projects.map(p=>({value:p._id,label:p.name}))]}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <Select label="Phase" value={form.phase} onChange={e=>setForm(f=>({...f,phase:e.target.value}))} options={PHASES.map(p=>({value:p,label:p||'None'}))}/>
              <Input label="Expected Delivery Date" type="date" required value={form.deliveryDate} onChange={e=>setForm(f=>({...f,deliveryDate:e.target.value}))}/>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)' }}>Materials</label>
                <button type="button" onClick={()=>setForm(f=>({...f,items:[...f.items,{...initItem}]}))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent-light)', fontSize:12, fontWeight:600, fontFamily:'var(--font)' }}>+ Add Item</button>
              </div>
              {form.items.map((item,idx)=>(
                <div key={idx} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1.5fr 1.5fr auto', gap:8, marginBottom:8, alignItems:'flex-end' }}>
                  <Select value={item.material} onChange={e=>updateItem(idx,'material',e.target.value)} options={[{value:'',label:'Select Material'},...materials.map(m=>({value:m._id,label:m.name}))]}/>
                  <input placeholder="Material Name" value={item.materialName} onChange={e=>updateItem(idx,'materialName',e.target.value)} required style={{ padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'var(--font)' }}/>
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={e=>updateItem(idx,'quantity',e.target.value)} required style={{ padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'var(--font)' }}/>
                  <input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={e=>updateItem(idx,'unitPrice',e.target.value)} style={{ padding:'10px 12px', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'var(--font)' }}/>
                  {form.items.length>1&&<button type="button" onClick={()=>setForm(f=>({...f,items:f.items.filter((_,i)=>i!==idx)}))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--red)', fontSize:16, paddingBottom:8 }}>✕</button>}
                </div>
              ))}
            </div>
            <Input label="Notes" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} style={{marginBottom:24}}/>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              <Btn type="submit">Schedule Delivery</Btn>
            </div>
          </form>
        </Modal>
      </Page>
    </Layout>
  );
}
