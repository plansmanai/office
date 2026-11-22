// P4's notifications (Lance, 20 Nov 2026: "I love the idea of the notification taking me right to the project page").
// A notification carries {title, body, url}; tapping it opens that page in P4 (or brings the open one to it).
var P4_SW = 3;      // raised when this file changes how a tap is handled
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('message', function (e) { if (e.data === 'p4-version' && e.source) e.source.postMessage({ p4Version: P4_SW }); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'P4', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'P4', {
    body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || undefined,
    data: { url: d.url || './' }
  }));
});

// A tap takes him to the thing itself (Lance, 22 Nov 2026: "These notifications don't jump me to the area they
// indicate ... They just open up the app where I currently am"). On an iPhone the installed app is simply brought to
// the front, wherever it was: asking the phone to open a page is not honoured there, and an open page cannot be
// steered from here. So the place to go is handed to the page two ways, and the page takes itself there
// (the "p4Open" lines in each page): a message to any open page, and a note left in the cache for a page that is
// only now waking up or starting.
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  var note = caches.open('p4-open').then(function (c) {
    return c.put('pending', new Response(JSON.stringify({ url: url, at: Date.now() }), { headers: { 'Content-Type': 'application/json' } }));
  }).catch(function () {});
  e.waitUntil(note.then(function () {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  }).then(function (list) {
    list.forEach(function (c) { try { c.postMessage({ p4Open: url }); } catch (err) {} });
    if (list.length && 'focus' in list[0]) return list[0].focus().catch(function () { return self.clients.openWindow(url); });
    return self.clients.openWindow(url);
  }));
});
