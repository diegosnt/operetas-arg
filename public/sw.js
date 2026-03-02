const CACHE_NAME = 'operetas-v1';
const ASSETS = [
  '/',
  '/css/styles.css',
  '/js/app.js',
  '/js/chart.min.js',
  '/favicon.svg',
  '/manifest.json'
];

// Instalación: Cachear archivos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activación: Limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
});

// Estrategia de respuesta
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Para la API: Intentar red primero, si falla usar caché (Network First)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedRes = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedRes));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para archivos estáticos: Usar caché primero, si no ir a la red (Cache First)
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
