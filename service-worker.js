var CACHE_PREFIX = 'kiska-kitna-shell-';
var CACHE_VERSION = 'v13';
var CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
var APP_SHELL = [
  './index.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './icons/app-icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];
var SHELL_CACHE_KEYS = new Map(APP_SHELL.map(function(path) {
  return [
    new URL(path, self.registration.scope).href,
    path + (path.indexOf('?') === -1 ? '?' : '&') + 'shell=' + CACHE_VERSION
  ];
}));
var SHELL_URLS = new Set(SHELL_CACHE_KEYS.keys());
var SCOPE_URL = new URL('./', self.registration.scope).href;
var INDEX_URL = new URL('./index.html', self.registration.scope).href;

function fetchAndRepair(cache, request) {
  return fetch(request).then(function(response) {
    if (!response.ok) return response;
    return cache.addAll(Array.from(SHELL_CACHE_KEYS.values())).then(function() {
      return response;
    }, function() {
      return response;
    });
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(Array.from(SHELL_CACHE_KEYS.values())); })
      .catch(function(error) {
        return caches.delete(CACHE_NAME).then(function() { throw error; });
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(names) {
        return Promise.all(names.map(function(name) {
          if (name.indexOf(CACHE_PREFIX) === 0 && name !== CACHE_NAME) return caches.delete(name);
        }));
      })
      .then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    var navigationUrl = new URL(request.url);
    var navigationPath = navigationUrl.origin + navigationUrl.pathname;
    if (navigationPath !== SCOPE_URL.replace(/\/$/, '')
        && navigationPath !== SCOPE_URL
        && navigationPath !== INDEX_URL) return;
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(SHELL_CACHE_KEYS.get(INDEX_URL)).then(function(cached) {
          return cached || fetchAndRepair(cache, request);
        });
      })
    );
    return;
  }

  if (!SHELL_URLS.has(request.url)) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(SHELL_CACHE_KEYS.get(request.url)).then(function(cached) {
        return cached || fetchAndRepair(cache, request);
      });
    })
  );
});