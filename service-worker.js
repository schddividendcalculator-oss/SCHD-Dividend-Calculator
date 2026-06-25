const CACHE_NAME = 'schd-calculator-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/index.tsx',
  '/App.tsx',
  '/constants.ts',
  '/types.ts',
];

// Install: pre-cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache. Caching app shell.');
        const promises = URLS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err);
          });
        });
        return Promise.all(promises);
      })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: handle requests
self.addEventListener('fetch', event => {
  // For the API, use a network-first strategy to get fresh data
  if (event.request.url.includes('/.netlify/functions/get-schd-price')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If fetch is successful, clone the response and cache it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If the network fails, try to get the response from the cache
          return caches.match(event.request);
        })
    );
    return; // End execution for this request
  }
  
  // For all other requests (app assets, CDNs), use a stale-while-revalidate strategy
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        // Fetch from network in the background to update the cache
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Check for a valid response before caching
          // Opaque responses (from cross-origin requests like CDNs) don't have a status we can read
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            console.warn(`Fetch failed for ${event.request.url}; serving from cache if available.`, err);
        });

        // Return the cached response immediately if it exists, otherwise wait for the network response
        return cachedResponse || fetchPromise;
      });
    })
  );
});
