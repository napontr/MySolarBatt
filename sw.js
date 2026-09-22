/* service worker ขั้นต่ำ + cache เปลือกแอป
   ข้อมูลย้อนหลังไม่ได้อยู่ในนี้ — อยู่ใน localStorage (ดู STORE ใน index.html)
   ที่ cache คือไฟล์หน้าเว็บ เพื่อให้เปิดแอปได้แม้ไม่มีเน็ต แล้วค่อยอ่านคลังในเครื่อง */
var CACHE = "solar-v3-1";
var SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).catch(function(){}));
  self.skipWaiting();
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener("fetch", function(e){
  var url = e.request.url;
  // เรียก API ต้องสดเสมอ ห้าม cache — ไม่งั้นจะเห็นตัวเลขค้าง
  if(url.indexOf("script.google.com") > -1 || e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(function(r){
      var copy = r.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
      return r;
    }).catch(function(){ return caches.match(e.request); })
  );
});
