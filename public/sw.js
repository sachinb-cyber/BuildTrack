const CACHE = 'buildtrack-v2';
const STATIC = ['/', '/login', '/inventory', '/deliveries', '/geo-capture', '/projects'];

/* ── IndexedDB helpers for offline queue ── */
const DB_NAME = 'buildtrack-offline';
const STORE   = 'uploads';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = () => reject(req.error);
  });
}

async function enqueue(entry) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(entry);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}

async function dequeueAll() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const all = []; const req = store.openCursor();
    req.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) { all.push({ id: cursor.key, data: cursor.value }); cursor.continue(); }
      else res(all);
    };
    req.onerror = () => rej(req.error);
  });
}

async function removeQueued(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}

/* ── Install ── */
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {})));
});

/* ── Activate ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

/* ── Fetch ── */
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Offline queue for geo-photo upload
  if (url.pathname === '/api/upload' && request.method === 'POST') {
    e.respondWith(
      fetch(request.clone()).catch(async () => {
        // Offline — queue the request
        try {
          const body = await request.clone().json();
          const auth = request.headers.get('Authorization');
          await enqueue({ body, auth, timestamp: Date.now() });
          // Notify client
          self.clients.matchAll().then(clients =>
            clients.forEach(c => c.postMessage({ type: 'QUEUED_OFFLINE', count: 1 }))
          );
        } catch {}
        return new Response(JSON.stringify({ message: 'Saved offline — will sync when online', offline: true }), {
          status: 202, headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // API calls: network-first, no cache
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ message: 'Offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Navigation: network-first, fallback to cache
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => { caches.open(CACHE).then(c => c.put(request, res.clone())); return res; })
        .catch(async () => (await caches.match(request)) || caches.match('/'))
    );
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(res => {
      if (res.ok && request.method === 'GET') caches.open(CACHE).then(c => c.put(request, res.clone()));
      return res;
    }))
  );
});

/* ── Push notifications ── */
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon.svg',
      badge: '/icon.svg',
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const existing = clientList.find(c => c.url.includes(url) && 'focus' in c);
      return existing ? existing.focus() : clients.openWindow(url);
    })
  );
});

/* ── Background Sync (when back online) ── */
self.addEventListener('sync', e => {
  if (e.tag === 'sync-uploads') e.waitUntil(syncUploads());
});

/* ── Online event from client ── */
self.addEventListener('message', e => {
  if (e.data?.type === 'SYNC_UPLOADS') syncUploads();
});

async function syncUploads() {
  const queued = await dequeueAll();
  if (!queued.length) return;

  let synced = 0;
  for (const item of queued) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(item.data.auth ? { Authorization: item.data.auth } : {}) },
        body: JSON.stringify(item.data.body),
      });
      if (res.ok) { await removeQueued(item.id); synced++; }
    } catch {}
  }

  if (synced > 0) {
    self.clients.matchAll().then(clients =>
      clients.forEach(c => c.postMessage({ type: 'SYNCED_UPLOADS', count: synced }))
    );
  }
}
