// Clip Flow Service Worker
// Handles offline video processing, caching, and background sync

// Workbox manifest injection point
self.__WB_MANIFEST

const CACHE_VERSION = 'clipflow-v1';
const CORE_CACHE = `${CACHE_VERSION}-core`;
const VIDEO_CACHE = `${CACHE_VERSION}-videos`;
const API_CACHE = `${CACHE_VERSION}-api`;
const FFMPEG_CACHE = `${CACHE_VERSION}-ffmpeg`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// Install: Cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Clip Flow Service Worker...');
  
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then((cache) => {
        console.log('[SW] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Core assets cached');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Core cache failed:', err);
      })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('clipflow-') && name !== CORE_CACHE && name !== VIDEO_CACHE && name !== API_CACHE && name !== FFMPEG_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch: Handle all requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for static assets
  if (request.method !== 'GET') {
    // Handle background sync for video uploads
    if (request.method === 'POST' && url.pathname.includes('/upload')) {
      event.respondWith(handleUploadWithFallback(request));
    }
    return;
  }
  
  // 1. FFmpeg WASM files - Cache First (critical for offline video processing)
  if (url.hostname.includes('unpkg.com') && url.pathname.includes('@ffmpeg')) {
    event.respondWith(cacheFirst(request, FFMPEG_CACHE, 30 * 24 * 60 * 60 * 1000)); // 30 days
    return;
  }
  
  // 2. Video files - Cache First with streaming support
  if (isVideoFile(url.pathname)) {
    event.respondWith(videoCacheStrategy(request));
    return;
  }
  
  // 3. API calls (Supabase/Firebase) - Network First
  if (url.hostname.includes('supabase.co') || url.hostname.includes('firebaseapp.com')) {
    event.respondWith(networkFirst(request, API_CACHE, 24 * 60 * 60 * 1000)); // 24 hours
    return;
  }
  
  // 4. Static assets (JS/CSS) - Stale While Revalidate
  if (isStaticAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, CORE_CACHE));
    return;
  }
  
  // 5. Navigation requests (HTML) - Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html') || caches.match('/offline.html'))
    );
    return;
  }
  
  // Default: Cache First
  event.respondWith(cacheFirst(request, CORE_CACHE));
});

// Background Sync: Handle video uploads when connection returns
self.addEventListener('sync', (event) => {
  if (event.tag === 'video-upload') {
    console.log('[SW] Background sync triggered: video-upload');
    event.waitUntil(processPendingUploads());
  }
});

// Push Notifications (optional - for clip ready notifications)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Your video clip is ready!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'clip-ready',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open Clip' },
      { action: 'share', title: 'Share' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Clip Flow', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'share') {
    // Trigger share action
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].postMessage({ type: 'SHARE_CLIP' });
        }
      })
    );
  }
});

// ==================== STRATEGY FUNCTIONS ====================

async function cacheFirst(request, cacheName, maxAge = null) {
  // Don't cache API requests - let them go through directly
  if (request.url.includes('/api/')) {
    try {
      const response = await fetch(request);
      return response;
    } catch (err) {
      console.log('[SW] API request failed:', err);
      throw err;
    }
  }

  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Check freshness if maxAge specified
    if (maxAge) {
      const dateHeader = cached.headers.get('date');
      if (dateHeader) {
        const age = Date.now() - new Date(dateHeader).getTime();
        if (age < maxAge) {
          return cached;
        }
      } else {
        return cached;
      }
    } else {
      return cached;
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirst(request, cacheName, maxAge = 5 * 60 * 1000) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) {
      // Check if stale
      const dateHeader = cached.headers.get('date');
      if (dateHeader) {
        const age = Date.now() - new Date(dateHeader).getTime();
        if (age < maxAge) {
          return cached;
        }
      }
      // Return stale cache with warning header
      const headers = new Headers(cached.headers);
      headers.set('X-SW-Cache', 'stale');
      return new Response(cached.body, { 
        status: cached.status, 
        statusText: cached.statusText, 
        headers 
      });
    }
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((err) => {
    console.log('[SW] Revalidate failed, using cache:', err);
    return cached;
  });
  
  return cached || fetchPromise;
}

async function videoCacheStrategy(request) {
  const cache = await caches.open(VIDEO_CACHE);
  
  // Check if we have this video cached
  const cached = await cache.match(request, { ignoreVary: true });
  
  if (cached) {
    // Return cached video with proper range support
    return handleRangeRequest(request, cached);
  }
  
  // Not cached - fetch and store
  try {
    const response = await fetch(request);
    if (response.ok && response.status === 200) {
      // Only cache successful full responses
      const responseToCache = response.clone();
      
      // Store with size check (don't cache if > 500MB)
      const contentLength = response.headers.get('content-length');
      if (!contentLength || parseInt(contentLength) < 500 * 1024 * 1024) {
        cache.put(request, responseToCache);
      }
    }
    return response;
  } catch (err) {
    console.error('[SW] Video fetch failed:', err);
    return new Response('Video unavailable offline', { status: 503 });
  }
}

async function handleRangeRequest(request, cachedResponse) {
  const rangeHeader = request.headers.get('range');
  
  if (!rangeHeader) {
    return cachedResponse;
  }
  
  // Parse range header (e.g., "bytes=0-1024")
  const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!matches) {
    return cachedResponse;
  }
  
  const start = parseInt(matches[1], 10);
  const end = matches[2] ? parseInt(matches[2], 10) : undefined;
  
  const blob = await cachedResponse.blob();
  const total = blob.size;
  const actualEnd = end || (total - 1);
  
  const slicedBlob = blob.slice(start, actualEnd + 1);
  
  return new Response(slicedBlob, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cachedResponse.headers.get('content-type') || 'video/mp4',
      'Content-Length': slicedBlob.size,
      'Content-Range': `bytes ${start}-${actualEnd}/${total}`,
      'Accept-Ranges': 'bytes'
    }
  });
}

async function handleUploadWithFallback(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (err) {
    // Network failed - store for background sync
    const formData = await request.formData();
    const videoFile = formData.get('video');
    
    if (videoFile) {
      // Store in IndexedDB via background sync
      await storeForSync(videoFile, formData);
      
      return new Response(JSON.stringify({ 
        queued: true, 
        message: 'Video queued for upload when online' 
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw err;
  }
}

// ==================== HELPER FUNCTIONS ====================

function isVideoFile(pathname) {
  return /\.(mp4|webm|mov|avi|mkv|flv|wmv|m4v|3gp)$/i.test(pathname);
}

function isStaticAsset(pathname) {
  return /\.(js|css|svg|png|jpg|jpeg|gif|woff2?|ttf|otf|eot)$/i.test(pathname);
}

// Store video for background sync (uses IndexedDB)
async function storeForSync(videoFile, formData) {
  // This will be handled by the main app via message channel
  // or we can use IndexedDB directly here
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => {
    client.postMessage({
      type: 'STORE_FOR_SYNC',
      payload: {
        filename: videoFile.name,
        size: videoFile.size,
        type: videoFile.type,
        timestamp: Date.now()
      }
    });
  });
}

async function processPendingUploads() {
  // Notify app to process pending uploads
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => {
    client.postMessage({ type: 'PROCESS_PENDING_UPLOADS' });
  });
}

// ==================== MESSAGE HANDLING ====================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'CLEAR_CACHES':
        event.waitUntil(
          caches.keys().then(names => {
            return Promise.all(names.map(name => caches.delete(name)));
          }).then(() => {
            event.ports[0].postMessage({ success: true });
          })
        );
        break;
        
      case 'GET_CACHE_STATS':
        event.waitUntil(
          getCacheStats().then(stats => {
            event.ports[0].postMessage(stats);
          })
        );
        break;
    }
  }
});

async function getCacheStats() {
  const stats = {};
  const cacheNames = [CORE_CACHE, VIDEO_CACHE, API_CACHE, FFMPEG_CACHE];
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const requests = await cache.keys();
    let size = 0;
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        size += blob.size;
      }
    }
    
    stats[name] = {
      items: requests.length,
      size: formatBytes(size)
    };
  }
  
  return stats;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}