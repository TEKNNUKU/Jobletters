// service-worker.js

// 1. Define the cache name and the list of core assets to cache
const CACHE_NAME = 'jobletters-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/how-it-works.html',
    '/pricing.html',
    '/contact.html',
    '/admin.html',
    '/manifest.json',
    // The main script containing all logic (since it's inline in index.html, we cache index.html)
    // The main styles (since they are inline, we cache the HTML files)
    
    // Add external assets (critical ones only, if needed for offline function)
    // For this mock, the only external critical assets are the fonts/icons:
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js' 
];

// --- 2. Install Event: Cache Core Assets ---
self.addEventListener('install', event => {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker installed. Caching core assets.');
                return cache.addAll(urlsToCache);
            })
    );
});

// --- 3. Activate Event: Clean up old caches ---
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// --- 4. Fetch Event: Serve from cache, then network (Cache First strategy) ---
self.addEventListener('fetch', event => {
    // We only intercept requests that are NOT chrome extensions or data URIs
    if (event.request.url.startsWith('chrome-extension://') || event.request.url.startsWith('data:')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // If the file is in the cache, return it immediately
                if (response) {
                    return response;
                }

                // If not in cache, fetch from the network
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and can only be consumed once. We consume it once to cache it
                        // and once to return it to the browser.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Only cache GET requests and files that aren't too large/special
                                if (event.request.method === 'GET') {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return networkResponse;
                    }
                );
            })
    );
});
