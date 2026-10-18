// 앱 껍데기(로그인 화면)만 저장. 앱 본체는 로그인 뒤 서버에서 받음. 데이터는 항상 네트워크
// 지시서 013: 껍데기는 저장본을 바로 쓰고 새 것은 뒤에서 받아 둔다(다음에 열 때 반영). 새로고침 버튼은 저장본을 지우고 다시 받음
const C = 'll-clinic-83465a96';
const SHELL = ['./', './index.html', './manifest.webmanifest', '../assets/logo.png', '../assets/logo-dark.png', '../assets/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ll-clinic-') && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== 'GET') return;
  const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); } return r; });
  e.respondWith(caches.match(e.request).then(hit => { if (hit) { e.waitUntil(net.catch(() => {})); return hit; } return net; }));
});
