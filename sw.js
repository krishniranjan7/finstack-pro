const CACHE_NAME = 'finstack-v2-elite-heavy';
const assetsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './icon.png',
  './manifest.json',
  // Add your 3D images or background textures here to increase "Weight"
];

self.addEventListener('install', (event) => {
  // This "Force-Downloads" the app into the phone's system
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 FinStack: Synchronizing 50MB+ Experience...');
      return cache.addAll(assetsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Serve from system memory first (Instant Load)
      return response || fetch(event.request);
    })
  );
});