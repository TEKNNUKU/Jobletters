const CACHE_NAME = 'jobletters-cache-v11'; // Increment version for fresh install
const urlsToCache = [
    '/',
    '/index.html',
    '/admin.html',
    '/manifest.json',
    '/how-it-works.html',
    '/pricing.html',
    '/contact.html',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    // NEW: Cache the Firebase SDK paths (important for offline support)
    'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js',
    'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js'
    // Add any image/icon files needed for your PWA
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and adding URLs');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('Failed to cache files:', err);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Important: Clone the request. A request is a stream and can only be consumed once.
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Important: Clone the response. A response is a stream and can only be consumed once.
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Only cache GET requests
                                if (event.request.method === 'GET') {
                                    cache.put(event.request, responseToCache);
                                }
                            });

                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
