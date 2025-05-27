
// service-worker.js

const CACHE_NAME = 'vast-text-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/service-worker.js',
  '/js/app.js',
  '/js/document-manager.js',
  '/js/editor.js',
  '/js/keymap-extensions.js',
  '/js/minimap.js',
  '/js/ui.js',
  '/css/main.css',
  '/css/tailwind.output.css',
  '/css/autocomplete-style.css',
  '/css/core-cursor.css',
  '/css/cursor-fix.css',
  '/css/fix.css',
  '/css/horizontal-scroll-fix.css',
  '/css/tablet-support.css',
  '/css/tailwind.css',
  '/css/ultimate-cursor-fix.css',
  '/public/icons/android-chrome-192x192.png',
  '/public/icons/android-chrome-512x512.png',
  '/public/icons/apple-touch-icon.png',
  '/public/icons/favicon-16x16.png',
  '/public/icons/favicon-32x32.png',
  '/public/icons/favicon.ico'
];

// インストール時にキャッシュへファイルを追加
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(urlsToCache.map(url =>
        cache.add(url).catch((err) => console.warn(`キャッシュ失敗: ${url}`, err))
      ));
    })
  );
});

// fetchイベントでキャッシュから取得する（ネットワークは使わない）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || new Response('オフラインモード: リソースがありません', { status: 200 });
    })
  );
});

// 古いキャッシュの削除（バージョン管理対応）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});