/**
 * I3DION Spatial Hub PWA Service Worker (v1.0)
 * Provides offline card browsing, 3D model tier caching, and trade show resilience.
 */

const HUB_CACHE_NAME = 'i3dion-hub-static-v1';
const HUB_API_CACHE = 'i3dion-hub-api-v1';

const STATIC_PRECACHE = [
  '/',
  '/hub',
  '/hub/feed',
  '/manifest.json',
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(HUB_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch(() => {
        // Tolerant of missing individual dev assets during hot-reload
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== HUB_CACHE_NAME && key !== HUB_API_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Hub Public Feed & Product Detail API (Network First, Cache Fallback for offline trade show viewing)
  if (url.pathname.startsWith('/api/hub/feed') || url.pathname.startsWith('/api/hub/products/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(HUB_API_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return new Response(
              JSON.stringify({
                status: 'offline',
                message: 'Offline catalog mode active. Previously viewed models are cached.'
              }),
              { headers: { 'Content-Type': 'application/json' }, status: 200 }
            );
          });
        })
    );
    return;
  }

  // 2. Static 3D Models & Posters (Cache First, Network Fallback)
  if (
    url.pathname.includes('/models/') ||
    url.pathname.endsWith('.glb') ||
    url.pathname.endsWith('.gltf') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.png')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(HUB_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // 3. Navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/hub/feed').then((cached) => cached || caches.match('/'));
      })
    );
  }
});
