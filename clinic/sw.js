// 앱 껍데기(로그인 화면)만 저장. 앱 본체는 로그인 뒤 서버에서 받음. 데이터는 항상 네트워크
const C = 'll-clinic-fbe7de39';
const SHELL = ['./', './index.html', './manifest.webmanifest', '../assets/logo.png', '../assets/logo-dark.png', '../assets/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ll-clinic-') && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request)));
});
