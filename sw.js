const CACHE = 'hp-conta-v3';
const NEVER_CACHE = ['/index.html', '/', '/empresas', '/funcionario', '/set-password.html', '/set-password-func.html'];

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML nunca vem do cache — sempre da rede
  if (NEVER_CACHE.some(p => url.pathname === p || url.pathname.endsWith('.html'))) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Demais recursos: rede primeiro, cache como fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
