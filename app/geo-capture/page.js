'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Page, Btn, Select, Modal } from '@/components/UI';
import { formatDate } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const GEOFENCE_RADIUS = 100;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─────────────────────────────── ADMIN PANEL ─────────────────────────────── */
function AdminPanel() {
  const [photos, setPhotos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('pending');
  const [zoomImg, setZoomImg]     = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // { id, action }
  const [reviewNote, setReviewNote]   = useState('');
  const [acting, setActing]       = useState(false);

  const load = useCallback(async (s) => {
    setLoading(true);
    try {
      const r = await api.get(`/upload${s ? `?status=${s}` : ''}`);
      setPhotos(r.data);
    } catch { toast.error('Failed to load photos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter]);

  const handleAction = async (id, action) => {
    setActing(true);
    try {
      if (action === 'delete') {
        await api.delete(`/upload/${id}`);
        toast.success('Photo deleted');
      } else {
        await api.patch(`/upload/${id}`, { status: action, reviewNote });
        toast.success(action === 'approved' ? 'Photo approved' : 'Photo rejected');
      }
      setReviewModal(null);
      setReviewNote('');
      load(filter);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally { setActing(false); }
  };

  const statusColor = s => s === 'approved' ? 'var(--green)' : s === 'rejected' ? 'var(--red)' : 'var(--yellow)';
  const statusBg    = s => s === 'approved' ? 'rgba(31,223,100,0.1)' : s === 'rejected' ? 'rgba(232,74,95,0.1)' : 'rgba(226,183,20,0.1)';

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '7px 18px', borderRadius: 8, border: '1px solid var(--border)',
            background: filter === s ? 'var(--accent-soft)' : 'var(--bg-elevated)',
            color: filter === s ? 'var(--accent-light)' : 'var(--text-muted)',
            fontWeight: filter === s ? 700 : 400, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
          }}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading…</div>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)', fontSize: 13 }}>No {filter} photos.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {photos.map(p => (
            <div key={p._id} style={{ background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Thumbnail */}
              <div style={{ position: 'relative', cursor: 'zoom-in' }} onClick={() => setZoomImg(p.imageUrl || p.imageData)}>
                <img src={p.imageUrl || p.imageData} alt="geo" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}/>
                {/* Status badge */}
                <div style={{ position: 'absolute', top: 10, right: 10, background: statusBg(p.status), border: `1px solid ${statusColor(p.status)}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: statusColor(p.status), backdropFilter: 'blur(6px)', textTransform: 'uppercase' }}>
                  {p.status}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.projectName || 'No project'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
                  👤 {p.userName || p.user?.name || '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'var(--mono)', marginBottom: 2 }}>
                  {p.lat?.toFixed(5)}, {p.lng?.toFixed(5)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  🕐 {formatDate(p.timestamp || p.createdAt)}
                </div>
                {p.notes && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, background: 'var(--bg-elevated)', borderRadius: 6, padding: '6px 8px' }}>{p.notes}</div>}
                {p.reviewNote && <div style={{ fontSize: 11, color: statusColor(p.status), marginBottom: 12, fontStyle: 'italic' }}>"{p.reviewNote}"</div>}

                {/* Actions */}
                {p.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn size="sm" variant="success" style={{ flex: 1 }} onClick={() => setReviewModal({ id: p._id, action: 'approved' })}>✓ Approve</Btn>
                    <Btn size="sm" variant="danger"  style={{ flex: 1 }} onClick={() => setReviewModal({ id: p._id, action: 'rejected' })}>✕ Reject</Btn>
                  </div>
                )}
                {p.status !== 'pending' && (
                  <Btn size="sm" variant="ghost" style={{ width: '100%' }} onClick={() => { setReviewModal({ id: p._id, action: 'delete' }); setReviewNote(''); }}>🗑 Delete</Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review / Delete confirmation modal */}
      <Modal
        isOpen={!!reviewModal}
        onClose={() => { setReviewModal(null); setReviewNote(''); }}
        title={reviewModal?.action === 'delete' ? 'Delete Photo' : reviewModal?.action === 'approved' ? 'Approve Photo' : 'Reject Photo'}
      >
        {reviewModal?.action !== 'delete' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Review Note (optional)</div>
            <textarea
              value={reviewNote}
              onChange={e => setReviewNote(e.target.value)}
              placeholder="Add a note for the engineer…"
              rows={3}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font)', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
        )}
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          {reviewModal?.action === 'delete' ? 'This photo will be permanently deleted.' : `Confirm ${reviewModal?.action} this photo?`}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" style={{ flex: 1 }} onClick={() => { setReviewModal(null); setReviewNote(''); }}>Cancel</Btn>
          <Btn
            variant={reviewModal?.action === 'approved' ? 'success' : 'danger'}
            style={{ flex: 1 }}
            disabled={acting}
            onClick={() => handleAction(reviewModal.id, reviewModal.action)}
          >
            {acting ? '…' : reviewModal?.action === 'delete' ? 'Delete' : reviewModal?.action === 'approved' ? 'Approve' : 'Reject'}
          </Btn>
        </div>
      </Modal>

      {/* Zoom lightbox */}
      {zoomImg && (
        <div onClick={() => setZoomImg(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
          <img src={zoomImg} alt="full" style={{ maxWidth: '100%', maxHeight: '92vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}/>
          <button onClick={() => setZoomImg(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 40, height: 40, color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── ENGINEER CAPTURE ─────────────────────────── */
function CapturePanel({ user, projects }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [selectedProject, setSelectedProject] = useState('');
  const [notes, setNotes]               = useState('');
  const [step, setStep]                 = useState('camera'); // camera | preview
  const [capturedImage, setCapturedImage] = useState(null);
  const [geo, setGeo]                   = useState(null);
  const [geoError, setGeoError]         = useState(null);
  const [geoLoading, setGeoLoading]     = useState(false);
  const [geofenceWarn, setGeofenceWarn] = useState(null);
  const [cameraReady, setCameraReady]   = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [zoomImg, setZoomImg]           = useState(null);

  const startCamera = useCallback(async () => {
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
    } catch {
      toast.error('Camera access denied. Please allow camera permission.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported'); return; }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) };
        setGeo(coords);
        setGeoLoading(false);
        const proj = projects.find(p => p._id === selectedProject);
        if (proj?.siteCoords?.lat) {
          const dist = Math.round(haversine(coords.lat, coords.lng, proj.siteCoords.lat, proj.siteCoords.lng));
          setGeofenceWarn(dist > GEOFENCE_RADIUS ? `You are ${dist}m from the site (limit: ${GEOFENCE_RADIUS}m)` : null);
        } else {
          setGeofenceWarn(null);
        }
      },
      err => { setGeoError(err.message); setGeoLoading(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [projects, selectedProject]);

  useEffect(() => {
    if (step === 'camera') { startCamera(); getLocation(); }
    return () => stopCamera();
  }, [step]);

  const applyWatermark = (canvas, video) => {
    const W = video.videoWidth, H = video.videoHeight;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, W, H);

    const proj = projects.find(p => p._id === selectedProject);
    const projectName = proj?.name || 'Samarth Developers';
    const userName    = user?.name || 'Unknown';
    const timestamp   = new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'medium' });
    const latLng      = geo ? `${geo.lat.toFixed(6)}° N, ${geo.lng.toFixed(6)}° E` : 'Location unavailable';

    const barH  = Math.max(110, H * 0.15);
    const fs    = Math.max(18, W * 0.019);
    const lineH = fs * 1.6;
    const pad   = Math.max(20, W * 0.022);

    const grad = ctx.createLinearGradient(0, H - barH, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.0)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0.75)');
    grad.addColorStop(1,   'rgba(0,0,0,0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - barH - 30, W, barH + 30);

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, H - barH, Math.max(6, W * 0.005), barH);

    const drawLine = (text, color, y, bold = false) => {
      ctx.font = `${bold ? '700' : '400'} ${fs}px 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(text, pad, y);
      ctx.shadowBlur = 0;
    };

    const base = H - barH + lineH * 0.9;
    drawLine(`🏗️  ${projectName}`, '#ffffff', base, true);
    drawLine(`📍  ${latLng}`, '#22d3ee', base + lineH * 1.1);
    drawLine(`🕐  ${timestamp}`, '#a0a0a0', base + lineH * 2.1);
    drawLine(`👤  ${userName}`, '#a0a0a0', base + lineH * 3.1);

    if (geo?.accuracy) {
      const badgeText = `±${geo.accuracy}m`;
      const bx = W - pad - 10;
      ctx.font = `600 ${fs * 0.8}px 'Segoe UI', Arial, sans-serif`;
      const tw = ctx.measureText(badgeText).width;
      ctx.fillStyle = geo.accuracy < 20 ? '#1fdf64' : geo.accuracy < 50 ? '#e2b714' : '#e84a5f';
      ctx.beginPath();
      ctx.roundRect(bx - tw - 16, base + lineH * 2.6, tw + 20, fs * 1.3, [6]);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillText(badgeText, bx - tw - 6, base + lineH * 2.6 + fs * 1.0);
    }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;
    if (!geo) { toast.error('Waiting for location…'); return; }
    applyWatermark(canvasRef.current, videoRef.current);
    const src = canvasRef.current;
    const MAX_W = 1280;
    let dataUrl;
    if (src.width > MAX_W) {
      const scale = MAX_W / src.width;
      const out = document.createElement('canvas');
      out.width = MAX_W; out.height = Math.round(src.height * scale);
      out.getContext('2d').drawImage(src, 0, 0, out.width, out.height);
      dataUrl = out.toDataURL('image/jpeg', 0.82);
    } else {
      dataUrl = src.toDataURL('image/jpeg', 0.82);
    }
    setCapturedImage(dataUrl);
    stopCamera();
    setStep('preview');
  };

  const retake = () => { setCapturedImage(null); setStep('camera'); };

  const upload = async () => {
    if (!geo) { toast.error('Location required'); return; }
    setUploading(true);
    try {
      const proj = projects.find(p => p._id === selectedProject);
      await api.post('/upload', {
        imageBase64: capturedImage,
        lat: geo.lat, lng: geo.lng, accuracy: geo.accuracy,
        timestamp: new Date().toISOString(),
        projectId: selectedProject || null,
        projectName: proj?.name || '',
        userId: user?._id,
        userName: user?.name,
        notes,
      });
      toast.success('Photo submitted for admin review!');
      setCapturedImage(null);
      setNotes('');
      setStep('camera');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const S = {
    wrap:    { maxWidth: 520, margin: '0 auto' },
    card:    { background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' },
    camBox:  { position: 'relative', background: '#000', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    video:   { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    capture: { position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', width: 70, height: 70, borderRadius: '50%', background: 'white', border: '5px solid rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', transition: 'transform 0.1s' },
    inner:   { width: 52, height: 52, borderRadius: '50%', background: 'white', border: '3px solid #1a1a1a' },
    info:    { padding: '16px 20px', borderTop: '1px solid var(--border)' },
    label:   { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 },
    value:   { fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--mono)' },
  };

  return (
    <div style={S.wrap}>
      {step === 'camera' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              options={[{ value: '', label: '— Select Project / Site —' }, ...projects.map(p => ({ value: p._id, label: p.name }))]}
            />
          </div>

          {geofenceWarn && (
            <div style={{ background: 'rgba(232,74,95,0.1)', border: '1px solid rgba(232,74,95,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>
              ⚠️ {geofenceWarn}
            </div>
          )}

          <div style={S.card}>
            <div style={S.camBox}>
              <video ref={videoRef} autoPlay playsInline muted style={S.video}/>
              <canvas ref={canvasRef} style={{ display: 'none' }}/>

              {!cameraReady && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'rgba(0,0,0,0.7)' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Starting camera…</span>
                </div>
              )}

              <div style={{ position: 'absolute', top: 14, left: 14, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: geo ? 'rgba(31,223,100,0.15)' : 'rgba(232,74,95,0.15)', border: `1px solid ${geo ? 'rgba(31,223,100,0.4)' : 'rgba(232,74,95,0.4)'}`, color: geo ? 'var(--green)' : 'var(--red)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: geo ? 'var(--green)' : 'var(--red)', animation: 'pulse 2s infinite' }}/>
                {geoLoading ? 'Getting GPS…' : geo ? `GPS ±${geo.accuracy}m` : 'No GPS'}
              </div>

              {cameraReady && (
                <button style={S.capture}
                  onMouseDown={e => e.currentTarget.style.transform = 'translateX(-50%) scale(0.93)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                  onClick={capture}
                >
                  <div style={S.inner}/>
                </button>
              )}

              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)', pointerEvents: 'none' }}/>
            </div>

            <div style={{ ...S.info, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={S.label}>📍 Location</div>
                {geo
                  ? <div style={S.value}>{geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</div>
                  : geoLoading
                    ? <div style={{ ...S.value, color: 'var(--yellow)' }}>Acquiring…</div>
                    : <div style={{ ...S.value, color: 'var(--red)' }}>{geoError || 'Unavailable'}</div>
                }
              </div>
              <div>
                <div style={S.label}>🕐 Time</div>
                <div style={S.value}>{new Date().toLocaleTimeString('en-IN')}</div>
              </div>
              {!geo && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <Btn size="sm" variant="secondary" onClick={getLocation} style={{ width: '100%' }}>
                    {geoLoading ? '⏳ Getting location…' : '🔄 Retry GPS'}
                  </Btn>
                </div>
              )}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 14 }}>
            Tap the circle to capture · GPS coordinates will be watermarked · Admin will review your photo
          </p>
        </div>
      )}

      {step === 'preview' && capturedImage && (
        <div>
          <div style={S.card}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setZoomImg(capturedImage)}>
              <img src={capturedImage} alt="Captured" style={{ width: '100%', display: 'block' }}/>
              <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(31,223,100,0.15)', border: '1px solid rgba(31,223,100,0.4)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: 'var(--green)', backdropFilter: 'blur(6px)' }}>
                ✓ CAPTURED
              </div>
            </div>

            <div style={S.info}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={S.label}>📍 Coordinates</div>
                  <div style={S.value}>{geo?.lat.toFixed(6)}, {geo?.lng.toFixed(6)}</div>
                </div>
                <div>
                  <div style={S.label}>🎯 Accuracy</div>
                  <div style={{ ...S.value, color: (geo?.accuracy || 0) < 20 ? 'var(--green)' : (geo?.accuracy || 0) < 50 ? 'var(--yellow)' : 'var(--red)' }}>±{geo?.accuracy}m</div>
                </div>
                <div>
                  <div style={S.label}>🏗️ Project</div>
                  <div style={{ ...S.value, color: 'var(--text)' }}>{projects.find(p => p._id === selectedProject)?.name || '—'}</div>
                </div>
                <div>
                  <div style={S.label}>📋 Status</div>
                  <div style={{ ...S.value, color: 'var(--yellow)' }}>Pending Review</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>📝 Notes (optional)</div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any site notes…"
                  rows={2}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font)', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="secondary" style={{ flex: 1 }} onClick={retake}>↩ Retake</Btn>
                <Btn variant="success" style={{ flex: 2 }} onClick={upload} disabled={uploading}>
                  {uploading ? '⏳ Uploading…' : '⬆ Submit for Review'}
                </Btn>
              </div>

              {geo && (
                <a href={`https://maps.google.com/?q=${geo.lat},${geo.lng}`} target="_blank" rel="noreferrer"
                  style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--accent-light)', textDecoration: 'none' }}>
                  📍 View on Google Maps →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {zoomImg && (
        <div onClick={() => setZoomImg(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}>
          <img src={zoomImg} alt="full" style={{ maxWidth: '100%', maxHeight: '92vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}/>
          <button onClick={() => setZoomImg(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 40, height: 40, color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── MAIN PAGE ─────────────────────────────── */
export default function GeoCapturePage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(console.error);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <Layout>
      <Page
        title={isAdmin ? 'Geo Photo Review' : 'Geo-tagged Photo'}
        subtitle={isAdmin ? 'Review and approve field photos submitted by engineers' : 'Live camera capture with GPS watermark'}
      >
        {isAdmin ? <AdminPanel /> : <CapturePanel user={user} projects={projects} />}
      </Page>
    </Layout>
  );
}
