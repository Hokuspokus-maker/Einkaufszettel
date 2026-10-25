// Einfacher Service Worker: immer zuerst das Netz fragen (damit Änderungen sofort ankommen),
// ohne Netz die zuletzt geladene Version zeigen.
const CACHE = 'einkaufszettel-v1';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var okHost = url.origin === self.location.origin || url.hostname === 'www.gstatic.com' ||
    url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!okHost) return;
  e.respondWith(
    fetch(req).then(function(res){
      if (res && (res.status === 200 || res.type === 'opaque')){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){ return hit || (req.mode === 'navigate' ? caches.match('./') : undefined); });
    })
  );
});
