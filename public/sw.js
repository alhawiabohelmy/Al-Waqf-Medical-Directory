const CACHE_NAME = "alwaqf-medical-v1.0.0";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("SW: Pre-caching static assets");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("SW: Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip browser extensions or other protocols
  if (!url.protocol.startsWith("http")) return;

  // Skip third-party databases, api routes, and firebase auth/storage
  if (
    url.pathname.startsWith("/api") || 
    url.hostname.includes("firestore.googleapis.com") || 
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-While-Revalidate strategy: serve cache, update from network in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => { /* ignore background sync errors */ });
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          // Cache on-the-fly for JS, CSS, fonts, and images from our origin
          const isCacheable = 
            url.origin === self.location.origin && (
              url.pathname.endsWith(".js") || 
              url.pathname.endsWith(".css") || 
              url.pathname.includes("/assets/") ||
              url.pathname.endsWith(".woff2") ||
              url.pathname.endsWith(".png") ||
              url.pathname.endsWith(".jpg") ||
              url.pathname.endsWith(".svg")
            );

          if (isCacheable) {
            const responseCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseCopy);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting navigation, return index.html shell
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
        });
    })
  );
});

// Listen for force-update / skipWaiting message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
