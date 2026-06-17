// ─────────────────────────────────────────────────────────────────────
// sw.js — minimal service worker for offline app-shell support.
//
// Strategy:
//   • Navigations  → network-first, fall back to cached index.html (offline).
//   • Same-origin GET assets (hashed JS/CSS, CSVs, icons) → stale-while-
//     revalidate, so repeat loads work offline and update in the background.
//
// Firestore handles its own offline data cache, so we deliberately do NOT
// touch cross-origin/Firebase requests here.
// ─────────────────────────────────────────────────────────────────────

const CACHE = 'workout-tracker-v1';
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle our own origin; let Firebase/Google/CDN requests pass through.
  if (url.origin !== self.location.origin) return;

  // App navigations: network-first with offline fallback to the shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
