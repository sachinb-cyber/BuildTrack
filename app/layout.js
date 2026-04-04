'use client';
import './globals.css';
import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function subscribeToPush(reg) {
  try {
    const res = await fetch('/api/push/subscribe');
    const { publicKey } = await res.json();
    if (!publicKey) return;

    const existing = await reg.pushManager.getSubscription();
    if (existing) return; // Already subscribed

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    const token = stored?.token;
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(subscription),
    });
  } catch (e) {
    console.error('Push subscription failed:', e);
  }
}

export default function RootLayout({ children }) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Listen for SW messages
      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data?.type === 'QUEUED_OFFLINE') {
          toast('Photo saved offline — will upload when connected', { icon: '📴', duration: 5000 });
        }
        if (e.data?.type === 'SYNCED_UPLOADS') {
          toast.success(`${e.data.count} photo(s) synced from offline queue`, { duration: 4000 });
        }
      });

      // When back online, trigger sync
      const onOnline = () => {
        if ('sync' in reg) {
          reg.sync.register('sync-uploads').catch(() => reg.active?.postMessage({ type: 'SYNC_UPLOADS' }));
        } else {
          reg.active?.postMessage({ type: 'SYNC_UPLOADS' });
        }
      };
      window.addEventListener('online', onOnline);

      // Auto-subscribe to push after login (delayed so user is logged in)
      setTimeout(() => {
        const stored = localStorage.getItem('user');
        if (stored && 'PushManager' in window) subscribeToPush(reg);
      }, 2000);

      return () => window.removeEventListener('online', onOnline);
    }).catch(console.error);
  }, []);

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="theme-color" content="#3b82f6"/>
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="BuildTrack"/>
        <meta name="application-name" content="BuildTrack"/>
        <link rel="manifest" href="/manifest.json"/>
        <link rel="apple-touch-icon" href="/icon.svg"/>
        <link rel="icon" type="image/svg+xml" href="/icon.svg"/>
      </head>
      <body>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1a2235', color: '#fff', fontSize: '14px', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' } }} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
