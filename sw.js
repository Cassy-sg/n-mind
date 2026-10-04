// N-Mind オフライン用：画面のファイルを保存しておき、ネットが無いときはそれを使う
const CACHE = 'nmind-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './favicon.png', './favicon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// ネットにつながっていれば最新を取って保存し直す。つながらない（3秒で返らない）ときは保存した版を出す
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([fetch(req), new Promise((_, ng) => setTimeout(() => ng(new Error('timeout')), 3000))]);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./index.html'));
    }
  })());
});
