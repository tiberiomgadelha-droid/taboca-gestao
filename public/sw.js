const CACHE_NAME = 'taboca-gestao-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png',
  '/Logomarca_Taboca.png',
];

// Instalacao - faz cache dos assets principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativacao - limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - tenta rede primeiro, cai no cache se offline
// IMPORTANTE: NAO interceptar chamadas API (Supabase, Anthropic, etc)
self.addEventListener('fetch', event => {
  // Ignora requisicoes nao-GET
  if (event.request.method !== 'GET') return;

  // NAO interceptar chamadas de API externas
  const url = event.request.url;
  if (url.includes('supabase.co')) return;
  if (url.includes('api.anthropic.com')) return;
  if (url.includes('fonts.googleapis.com')) return;
  if (url.includes('graph.instagram.com')) return;
  if (url.includes('graph.facebook.com')) return;

  // Apenas cachear assets estaticos do proprio dominio
  if (!url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
