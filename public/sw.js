const CACHE_NAME = 'readbookai-v1';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first strategy
self.addEventListener('fetch', (event) => {
    // Only handle http/https requests (skip chrome-extension://, etc.)
    if (!event.request.url.startsWith('http')) return;
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    // Skip API requests
    if (event.request.url.includes('supabase.co')) return;
    if (event.request.url.includes('generativelanguage.googleapis.com')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
