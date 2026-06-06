const CACHE_NAME = 'datecalc-pro-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/duration.html',
  '/weekday.html',
  '/arithmetic.html',
  '/business-days.html',
  '/week-number.html',
  '/countdown.html',
  '/timezone.html',
  '/batch.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/glassmorphism.css',
  '/css/animations.css',
  '/css/navigation.css',
  '/css/responsive.css',
  '/css/themes/dark.css',
  '/css/themes/light.css',
  '/js/app.js',
  '/js/core/date-parser.js',
  '/js/core/date-calc.js',
  '/js/core/validators.js',
  '/js/core/timezone-db.js',
  '/js/core/holiday-db.js',
  '/js/ui/theme-manager.js',
  '/js/ui/navigation.js',
  '/js/ui/keyboard-shortcuts.js',
  '/js/ui/animation-manager.js',
  '/js/ui/toast.js',
  '/js/ui/date-input.js',
  '/js/calculators/day-of-week.js',
  '/js/calculators/duration.js',
  '/js/calculators/weekday.js',
  '/js/calculators/arithmetic.js',
  '/js/calculators/business-days.js',
  '/js/calculators/week-number.js',
  '/js/calculators/countdown.js',
  '/js/calculators/timezone.js',
  '/js/features/history-manager.js',
  '/js/features/share-manager.js',
  '/js/features/smart-suggestions.js',
  '/js/features/batch-calculator.js',
  '/manifest.json'
];

// Install: pre-cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: cache-first for static, network-first for dynamic
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Offline fallback for navigation
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
