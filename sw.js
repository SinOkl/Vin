const CACHE_NAVN = 'vinkjeller-v25';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './db.js',
  './auth.js',
  './skann.js',
  './firebase-init.js',
  './firebase-config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAVN).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((navn) =>
      Promise.all(navn.filter((n) => n !== CACHE_NAVN).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // La alt utenfor vår egen origin (Firebase Auth, Firestore, gstatic-CDN-en SDK-en
  // lastes fra) gå helt uinnblandet til nettverket — vi cacher kun selve app-skallet.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const nettverk = fetch(event.request)
        .then((svar) => {
          if (svar && svar.status === 200 && svar.type === 'basic') {
            const kopi = svar.clone();
            caches.open(CACHE_NAVN).then((cache) => cache.put(event.request, kopi));
          }
          return svar;
        })
        .catch(() => cached);
      return cached || nettverk;
    })
  );
});
