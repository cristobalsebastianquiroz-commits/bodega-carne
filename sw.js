// Cambia este número cada vez que subas una nueva versión
const VERSION = 'v26';
const CACHE = 'camara-control-' + VERSION;

// Al instalar: toma control inmediatamente sin esperar
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.add('./index.html'))
  );
});

// Al activar: borra todos los cachés viejos y toma control de todas las tabs
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: NETWORK FIRST para index.html, caché solo si no hay red
self.addEventListener('fetch', e => {
  // Solo interceptar GET del mismo origen
  if(e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Para index.html: siempre intentar red primero
  if(url.pathname.endsWith('index.html') || url.pathname.endsWith('/') || url.pathname === '') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Guardar la versión nueva en caché
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Para otros recursos (fuentes, etc): caché first
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Cuando hay nueva versión disponible, notificar a todos los clientes
self.addEventListener('message', e => {
  if(e.data === 'SKIP_WAITING') self.skipWaiting();
});
