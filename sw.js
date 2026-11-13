// Service worker : garde l'appli en cache pour qu'elle fonctionne sans internet.
const VERSION = 'v60';
const CACHE = `grimoire-${VERSION}`;
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/rules.js', 'js/store.js', 'js/cloud.js', 'js/config.js',
  'icons/favicon-64.png', 'icons/icon-192.png', 'icons/icon-512.png', 'img/chaos.webp', 'img/sigmar.webp', 'img/armure.webp',
  'img/carrieres/chasseur.webp', 'img/carrieres/marin.webp', 'img/carrieres/charlatan.webp', 'img/carrieres/sorcier.webp',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Polices et bibliothèque Firebase : mises en cache pour le hors-ligne.
  // Tout le reste venant d'ailleurs (connexion Google, base de données) passe directement.
  const cacheable = url.origin === location.origin
    || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'
    || (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'));
  if (!cacheable) return;

  // Fichiers de l'appli : réseau d'abord (toujours la dernière version), cache si pas de réseau (ou réseau trop lent).
  // Polices et Firebase (versions figées) : cache d'abord.
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const sameOrigin = url.origin === location.origin;
    const cached = await cache.match(e.request, { ignoreSearch: sameOrigin });
    const fallback = cached || (e.request.mode === 'navigate' ? await cache.match('index.html') : undefined);
    // Fichiers de l'appli : toujours revalider auprès du serveur (évite une vieille copie du cache HTTP)
    const req = sameOrigin && e.request.mode !== 'navigate' ? new Request(e.request, { cache: 'no-cache' }) : e.request;
    const network = fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') cache.put(e.request, res.clone());
      return res;
    });
    if (!sameOrigin && cached) return cached;
    if (!fallback) return network;
    const timeout = new Promise((resolve) => setTimeout(() => resolve(fallback), 3000));
    return Promise.race([network.catch(() => fallback), timeout]);
  }));
});
