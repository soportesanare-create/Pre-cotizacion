/* Simple offline cache for static assets (GitHub Pages friendly). */
// Bump this value whenever you deploy changes, so browsers don't keep old HTML/JS.
const CACHE_NAME = "sanare-app-v1-5-r4";
const ASSETS = [
  "./",
  "./index.html",
  "./medico.html",
  "./kam.html",
  "./manifest.json",
  "./assets/css/styles.css",
  "./assets/css/pre-cotizador.css",
  "./assets/js/app.js",
  "./assets/js/pre-cotizador-data.js",
  "./assets/js/pre-cotizador-app.js",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png",
  "./assets/img/sanare-wordmark.png",
  "./assets/img/news/slide1.png?v=7",
  "./assets/img/news/slide2.png?v=7",
  "./assets/img/news/slide3.png?v=7",
  "./assets/img/news/slide4.png?v=7",
  "./assets/img/news/news1.png",
  "./assets/img/news/news2.png",
  "./assets/img/news/news3.png",
  "./assets/img/news/news4.png",
  "./cotizador/index.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Don't cache cross-origin (e.g. embedded external iframes)
  if(new URL(req.url).origin !== self.location.origin) return;

  // Network-first for HTML navigations (prevents stale pages after deployments)
  const accept = req.headers.get("accept") || "";
  const isHTML = req.mode === "navigate" || accept.includes("text/html");
  if(isHTML){
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(req).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
      return res;
    }).catch(()=>cached))
  );
});
