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
  '/assets/index-1719355a.css',
  '/assets/main-29da0e2f.js',
  '/icons/site.webmanifest',
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
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon.ico'
];

// インストール時にリソースをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
});

// キャッシュからのリソース取得
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュヒットした場合はそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュにない場合はネットワークから取得
        return fetch(event.request).then(
          (response) => {
            // 無効なレスポンスの場合はそのまま返す
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスをクローンしてキャッシュに追加
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});