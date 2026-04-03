'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Page, Btn, Select, Modal, DataTable } from '@/components/UI';
import { formatDate } from '@/lib/helpers';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const GEOFENCE_RADIUS = 100; // metres

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function GeoCapturePage() {
  const { user } = useAuth();
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [projects, setProjects]         = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [notes, setNotes]               = useState('');
  const [step, setStep]                 = useState('camera'); // camera | preview | gallery
  const [capturedImage, setCapturedImage] = useState(null);
  const [geo, setGeo]                   = useState(null);
  const [geoError, setGeoError]         = useState(null);
  const [geoLoading, setGeoLoading]     = useState(false);
  const [geofenceWarn, setGeofenceWarn] = useState(null);
  const [cameraReady, setCameraReady]   = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [gallery, setGallery]           = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [showGallery, setShowGallery]   = useState(false);
  const [zoomImg, setZoomImg]           = useState(null);

  /* ── Load projects ── */
  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(console.error);
  }, []);

  /* ── Camera ── */
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
    } catch (err) {
      toast.error('Camera access denied. Please allow camera permission.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  /* ── Geolocation ── */
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported'); return; }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy) };
        setGeo(coords);
        setGeoLoading(false);
        // Geofence check
        const proj = projects.find(p => p._id === selectedProject);
        if (proj?.siteCoords?.lat) {
          const dist = Math.round(haversine(coords.lat, coords.lng, proj.siteCoords.lat, proj.siteCoords.lng));
          setGeofenceWarn(dist > GEOFENCE_RADIUS ? `⚠️ You are ${dist}m from the site (limit: ${GEOFENCE_RADIUS}m)` : null);
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

  /* ── Watermark via Canvas ── */
  const applyWatermark = (canvas, video) => {
    const W = video.videoWidth, H = video.videoHeight;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, W, H);

    const proj = projects.find(p => p._id === selectedProject);
    const projectName = proj?.name || 'Samarth Developers';
    const userName    = user?.name || 'Unknown';
    const now         = new Date();
    const timestamp   = now.toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'medium' });
    const latLng      = geo ? `${geo.lat.toFixed(6)}° N, ${geo.lng.toFixed(6)}° E` : 'Location unavailable';

    const barH  = Math.max(110, H * 0.15);
    const fs    = Math.max(18, W * 0.019);
    const lineH = fs * 1.6;
    const pad   = Math.max(20, W * 0.022);

    // Semi-transparent footer bar
    const grad = ctx.createLinearGradient(0, H - barH, 0, H);
    grad.addColorStop(0, 'rgba(0,0,0,0.0)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0.75)');
    grad.addColorStop(1,   'rgba(0,0,0,0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, H - barH - 30, W, barH + 30);

    // Blue accent bar left
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, H - barH, Math.max(6, W * 0.005), barH);

    // Text lines
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

    // Accuracy badge
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

  /* ── Capture ── */
  const capture = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;
    if (!geo) { toast.error('Waiting for location…'); return; }
    applyWatermark(canvasRef.current, videoRef.current);
    setCapturedImage(canvasRef.current.toDataURL('image/jpeg', 0.88));
    stopCamera();
    setStep('preview');
  };

  const retake = () => { setCapturedImage(null); setStep('camera'); };

  /* ── Upload ── */
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
      toast.success('Photo uploaded successfully!');
      setCapturedImage(null);
      setNotes('');
      setStep('camera');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  /* ── Gallery ── */
  const loadGallery = async () => {
    setGalleryLoading(true);
    try { const r = await api.get('/upload'); setGallery(r.data); }
    catch { toast.error('Failed to load gallery'); }
    finally { setGalleryLoading(false); }
  };

  const openGallery = () => { setShowGallery(true); loadGallery(); };

  /* ── Styles ── */
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
    <Layout>
      <Page
        title="Geo-tagged Photo"
        subtitle="Live camera capture with GPS watermark"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={openGallery}>📷 View Gallery</Btn>
          </div>
        }
      >
        <div style={S.wrap}>

          {/* ── CAMERA STEP ── */}
          {step === 'camera' && (
            <div>
              {/* Project selector */}
              <div style={{ marginBottom: 16 }}>
                <Select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  options={[{ value: '', label: '— Select Project / Site —' }, ...projects.map(p => ({ value: p._id, label: p.name }))]}
                />
              </div>

              {/* Geofence warning */}
              {geofenceWarn && (
                <div style={{ background: 'rgba(232,74,95,0.1)', border: '1px solid rgba(232,74,95,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>
                  {geofenceWarn}
                </div>
              )}

              {/* Camera preview */}
              <div style={S.card}>
                <div style={S.camBox}>
                  <video ref={videoRef} autoPlay playsInline muted style={S.video}/>
                  <canvas ref={canvasRef} style={{ display: 'none' }}/>

                  {/* Not ready overlay */}
                  {!cameraReady && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'rgba(0,0,0,0.7)' }}>
                      <div style={{ width: 40, height: 40, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Starting camera…</span>
                    </div>
                  )}

                  {/* GPS indicator top-left */}
                  <div style={{ position: 'absolute', top: 14, left: 14, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: geo ? 'rgba(31,223,100,0.15)' : 'rgba(232,74,95,0.15)', border: `1px solid ${geo ? 'rgba(31,223,100,0.4)' : 'rgba(232,74,95,0.4)'}`, color: geo ? 'var(--green)' : 'var(--red)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: geo ? 'var(--green)' : 'var(--red)', animation: 'pulse 2s infinite' }}/>
                    {geoLoading ? 'Getting GPS…' : geo ? `GPS ±${geo.accuracy}m` : 'No GPS'}
                  </div>

                  {/* Capture button */}
                  {cameraReady && (
                    <button
                      style={S.capture}
                      onMouseDown={e => e.currentTarget.style.transform = 'translateX(-50%) scale(0.93)'}
                      onMouseUp={e => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                      onClick={capture}
                    >
                      <div style={S.inner}/>
                    </button>
                  )}

                  {/* Scan-line overlay for depth */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)', pointerEvents: 'none' }}/>
                </div>

                {/* Location info bar */}
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

              {/* Hint */}
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 14 }}>
                Tap the circle to capture · GPS coordinates will be watermarked
              </p>
            </div>
          )}

          {/* ── PREVIEW STEP ── */}
          {step === 'preview' && capturedImage && (
            <div>
              <div style={S.card}>
                {/* Captured image */}
                <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setZoomImg(capturedImage)}>
                  <img src={capturedImage} alt="Captured" style={{ width: '100%', display: 'block' }}/>
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(31,223,100,0.15)', border: '1px solid rgba(31,223,100,0.4)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: 'var(--green)', backdropFilter: 'blur(6px)' }}>
                    ✓ CAPTURED
                  </div>
                </div>

                {/* Metadata */}
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
                      <div style={S.label}>🕐 Timestamp</div>
                      <div style={S.value}>{new Date().toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div style={S.label}>🏗️ Project</div>
                      <div style={{ ...S.value, color: 'var(--text)' }}>{projects.find(p => p._id === selectedProject)?.name || '—'}</div>
                    </div>
                  </div>

                  {/* Notes */}
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

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Btn variant="secondary" style={{ flex: 1 }} onClick={retake}>↩ Retake</Btn>
                    <Btn variant="success" style={{ flex: 2 }} onClick={upload} disabled={uploading}>
                      {uploading ? '⏳ Uploading…' : '⬆ Upload Photo'}
                    </Btn>
                  </div>

                  {/* Google Maps link */}
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
        </div>

        {/* ── GALLERY MODAL ── */}
        <Modal isOpen={showGallery} onClose={() => setShowGallery(false)} title="Photo Gallery" size="lg">
          {galleryLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</div>
          ) : gallery.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>No photos uploaded yet.</div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                {gallery.map((g, i) => (
                  <div key={g._id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--bg-elevated)', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    onClick={() => setZoomImg(g.imageUrl || g.imageData)}
                  >
                    <img src={g.imageUrl || g.imageData} alt="geo" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}/>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.projectName || 'No project'}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(g.timestamp)}</div>
                      <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--mono)', marginTop: 2 }}>{g.lat?.toFixed(4)}, {g.lng?.toFixed(4)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>

        {/* ── ZOOM / LIGHTBOX ── */}
        {zoomImg && (
          <div
            onClick={() => setZoomImg(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, cursor: 'zoom-out' }}
          >
            <img src={zoomImg} alt="full" style={{ maxWidth: '100%', maxHeight: '92vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}/>
            <button onClick={() => setZoomImg(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 40, height: 40, color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        )}
      </Page>
    </Layout>
  );
}
