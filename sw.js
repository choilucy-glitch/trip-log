// 오프라인에서도 일정 화면이 열리도록 화면 파일을 저장해 둬요. (데이터는 Firestore가 따로 저장해요)
const CACHE = 'triplog-v3';
const SHELL = ['./', 'index.html', 'css/style.css', 'css/site.css', 'css/trip.css', 'js/app.js', 'js/home.js', 'js/util.js', 'js/firebase-config.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  // 로그인·데이터베이스 요청은 건드리지 않기
  if (/googleapis\.com$|firebaseapp\.com$|identitytoolkit|securetoken|accounts\.google/.test(url.hostname) && !url.hostname.startsWith('fonts.')) return;
  const sameOrigin = url.origin === location.origin;
  const cacheable = sameOrigin || url.hostname === 'www.gstatic.com' || url.hostname.startsWith('fonts.');
  if (!cacheable) return;
  // 내 파일은 최신 우선(인터넷 없으면 저장본), 라이브러리·글꼴은 저장본 우선
  if (sameOrigin) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
  }
});
