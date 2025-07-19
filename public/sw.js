// Service Worker for InSchoolz PWA
// 모바일 성능 최적화와 오프라인 지원

const CACHE_NAME = 'inschoolz-v1';
const STATIC_CACHE_NAME = 'inschoolz-static-v1';
const DYNAMIC_CACHE_NAME = 'inschoolz-dynamic-v1';

// 캐시할 정적 자원들
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/android-icon-192x192.png',
  '/favicon-32x32.png',
  // 주요 페이지들
  '/community',
  '/games',
  '/my',
];

// 네트워크 우선 캐시 전략을 사용할 경로들
const NETWORK_FIRST_PATHS = [
  '/api/',
  '/auth',
  '/notifications',
];

// 캐시 우선 전략을 사용할 경로들  
const CACHE_FIRST_PATHS = [
  '/images/',
  '/icons/',
  '/_next/static/',
  '/android-icon',
  '/apple-icon',
  '/favicon',
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // 즉시 새 Service Worker 활성화
        return self.skipWaiting();
      })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    // 이전 캐시 정리
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('inschoolz-')) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 즉시 모든 클라이언트에서 새 Service Worker 제어
        return self.clients.claim();
      })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Firebase 관련 요청은 캐시하지 않음
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('google')) {
    return;
  }
  
  // GET 요청만 캐시 처리
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

// 요청 처리 로직
async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // 네트워크 우선 전략
    if (NETWORK_FIRST_PATHS.some(path => pathname.startsWith(path))) {
      return await networkFirst(request);
    }
    
    // 캐시 우선 전략  
    if (CACHE_FIRST_PATHS.some(path => pathname.includes(path))) {
      return await cacheFirst(request);
    }
    
    // 기본: Stale While Revalidate 전략
    return await staleWhileRevalidate(request);
    
  } catch (error) {
    console.error('Request handling failed:', error);
    
    // 오프라인 폴백
    if (pathname === '/' || pathname.startsWith('/community') || 
        pathname.startsWith('/games') || pathname.startsWith('/my')) {
      return await getOfflineFallback();
    }
    
    throw error;
  }
}

// 네트워크 우선 전략
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 성공적인 응답을 동적 캐시에 저장
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 네트워크 실패 시 캐시에서 찾기
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 캐시 우선 전략
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 캐시에 없으면 네트워크에서 가져와서 캐시
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Stale While Revalidate 전략
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  // 백그라운드에서 네트워크 요청
  const networkPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // 캐시된 응답이 있으면 즉시 반환
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 캐시된 응답이 없으면 네트워크 응답 대기
  return await networkPromise;
}

// 오프라인 폴백 페이지
async function getOfflineFallback() {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const offlinePage = await cache.match('/offline');
  
  if (offlinePage) {
    return offlinePage;
  }
  
  // 기본 오프라인 응답
  return new Response(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>오프라인 - 인스쿨즈</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #86efac, #dcfce7);
          color: #166534;
          text-align: center;
          padding: 20px;
          box-sizing: border-box;
        }
        h1 { font-size: 2rem; margin-bottom: 1rem; }
        p { font-size: 1.1rem; margin-bottom: 2rem; }
        button {
          background: #22c55e;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          min-height: 44px;
        }
        button:hover { background: #16a34a; }
      </style>
    </head>
    <body>
      <h1>🌐 인터넷 연결을 확인해주세요</h1>
      <p>현재 오프라인 상태입니다.<br>인터넷 연결을 확인한 후 다시 시도해주세요.</p>
      <button onclick="window.location.reload()">다시 시도</button>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 백그라운드 동기화 (추후 구현 예정)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // 오프라인에서 작성한 데이터 동기화 로직
  }
});

// 푸시 메시지 처리 (추후 구현 예정)
self.addEventListener('push', (event) => {
  console.log('Push message received');
  
  const options = {
    body: '새로운 알림이 있습니다!',
    icon: '/android-icon-192x192.png',
    badge: '/android-icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/android-icon-96x96.png'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('인스쿨즈', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 