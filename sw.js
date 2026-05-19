/* ==========================================================================
   MVX STORE V4.0 - SECURE SERVICE WORKER & NOTIFICATION ENGINE
   ========================================================================== */

const CACHE_NAME = 'mvx-store-v4-cache';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/style.css',
    '/main.js'
];

// ==========================================================================
// 1. INSTALLATION & CACHING (সিস্টেম ইনস্টল ও ক্যাশ তৈরি)
// ==========================================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('[MVX SYSTEM] Caching Core Assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
        .then(() => self.skipWaiting())
    );
});

// ==========================================================================
// 2. ACTIVATION & CLEANUP (পুরোনো ক্যাশ ডিলিট করে নতুন আপডেট আনা)
// ==========================================================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[MVX SYSTEM] Clearing Old Cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ==========================================================================
// 3. PUSH NOTIFICATION RECEIVER (ব্যাকগ্রাউন্ডে নোটিফিকেশন রিসিভ করা)
// ==========================================================================
self.addEventListener('push', (event) => {
    let data = { title: 'MVX STORE', body: 'New application available!', url: '/index.html' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: 'https://via.placeholder.com/192/020617/00e6b8?text=MVX',
        badge: 'https://via.placeholder.com/96/020617/00e6b8?text=V4',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: { url: data.url },
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Open Store' },
            { action: 'close', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ==========================================================================
// 4. NOTIFICATION CLICK HANDLER (নোটিফিকেশনে ক্লিক করলে অ্যাপ ওপেন করা)
// ==========================================================================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action !== 'close') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                const urlToOpen = event.notification.data.url || '/index.html';
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    }
});

// ==========================================================================
// 5. OFFLINE FETCH HANDLER (ইন্টারনেট না থাকলেও সাইট লোড করানো)
// ==========================================================================
self.addEventListener('fetch', (event) => {
    // শুধুমাত্র লোকাল রিকোয়েস্টগুলো ক্যাশ থেকে সার্ভ করবে
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});
