// service worker ขั้นต่ำ — มีไว้ให้ Chrome ยอมให้ "Install" เป็น PWA
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ self.clients.claim(); });
self.addEventListener('fetch', function(e){ /* ผ่านตรงไป network ตามปกติ */ });
