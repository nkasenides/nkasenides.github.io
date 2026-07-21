const CACHE_NAME = 'grade-tools-v1';
const FILES_TO_CACHE = [
  '/',
  'index.html',
  'calculator.html',
  'analysis.html',
  'manifest.json',
  'icons/icon-192.svg',
  'icons/icon-512.svg'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  // For navigation requests, try network first then cache fallback for up-to-date app shell
  if(evt.request.mode === 'navigate'){
    evt.respondWith(
      fetch(evt.request).then(res => {
        // put a copy in cache
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  // For other requests - try cache first then network
  evt.respondWith(
    caches.match(evt.request).then(cached => cached || fetch(evt.request).then(res => {
      // put successful GET responses in cache
      if(evt.request.method === 'GET' && res && res.status === 200){
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(evt.request, resClone));
      }
      return res;
    }).catch(() => {
      // fallback for images/icons
      if(evt.request.destination === 'image') return caches.match('icons/icon-192.svg');
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }))
  );
});
