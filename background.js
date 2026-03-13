const CACHE_NAME = 'salman-pwa-v3'; // Change v2 to v3
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icon-192.png',  // Added local icons
  './icon-512.png'   // Added local icons
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Shelves are full!");
      return cache.addAll(urlsToCache).catch(err => console.log("Cache error:", err));
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If we have it in the 'shelf' (cache), return it. 
      // Otherwise, go to the internet.
      return response || fetch(event.request);
    }).catch(() => {
      // If the user is offline and the file isn't cached
      return new Response("You are offline. Please connect to update shop status.");
    })
  );
});

// After generating the code, immediately create entry in Firebase
window.__fbSet(window.__fbRef('shops/' + code), {
  status: 'unknown',
  registeredAt: new Date().toISOString(),
  openTime: '--:--',
  closeTime: '--:--',
  lastUpdated: '--'
});