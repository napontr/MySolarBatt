/* service worker ขั้นต่ำ + cache เปลือกแอป
   ข้อมูลย้อนหลังไม่ได้อยู่ในนี้ — อยู่ใน localStorage (ดู STORE ใน index.html)
   ที่ cache คือไฟล์หน้าเว็บ เพื่อให้เปิดแอปได้แม้ไม่มีเน็ต แล้วค่อยอ่านคลังในเครื่อง */
var CACHE = "solar-v3-12";   // ขยับเลขทุกครั้งที่อัป ไม่งั้นมือถือค้างหน้าเก่า
var SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];

/* 🔴 2026-09-22 บั๊กที่ทำให้ "อัปขึ้น Pages แล้วยังเห็นของเก่า" เกิดซ้ำ 2 รอบ
   🟢 พิสูจน์แล้ว: ดึง index.html จาก Pages ด้วย ?cb=<เวลา> + cache:'reload' ได้ "ของใหม่"
      แต่หน้าที่เรนเดอร์จริงเป็น "ของเก่า" ⇒ ไฟล์บนเซิร์ฟเวอร์ใหม่ แต่เบราว์เซอร์ไม่ได้ไปเอา
   🔑 ต้นเหตุ: GitHub Pages ส่ง Cache-Control max-age ⇒ fetch() ธรรมดาใน sw หยิบจาก
      HTTP cache ของเบราว์เซอร์ (ของเก่า) แล้ว sw เอาของเก่านั้นไป put ทับใน cache ตัวเองอีกชั้น
      = ของเก่าถูกตอกย้ำ 2 ชั้น ขยับเลข CACHE อย่างเดียวไม่พอ
   ⇒ ไฟล์เปลือกแอปต้องยิงด้วย cache:"no-store" ให้ข้าม HTTP cache ทุกครั้งที่ออนไลน์ */
function isShell_(req){
  if(req.mode === "navigate") return true;
  try { return /\.(html|js|json)$/i.test(new URL(req.url).pathname); } catch(e){ return false; }
}

self.addEventListener("install", function(e){
  // เติม cache ตอนติดตั้งก็ต้องข้าม HTTP cache ด้วย ไม่งั้นติดตั้งมาพร้อมของเก่าตั้งแต่แรก
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(SHELL.map(function(u){
      return fetch(u, { cache: "no-store" }).then(function(r){ return c.put(u, r); }).catch(function(){});
    }));
  }).catch(function(){}));
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
  // เปลือกแอป (หน้าเว็บ/js/json) = ข้าม HTTP cache เสมอ · ไฟล์อื่น (รูป) ใช้ปกติได้
  var net = isShell_(e.request) ? fetch(e.request.url, { cache: "no-store" }) : fetch(e.request);
  e.respondWith(
    net.then(function(r){
      var copy = r.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
      return r;
    /* ออฟไลน์ค่อยใช้ของใน cache
       2026-09-22 ignoreSearch:true — หน้าตั้งค่าย้ายมาเปิดด้วย index.html?cfg=1 (v3.10.0)
       ถ้าเทียบ URL ทั้งดุ้น query จะไม่ตรงกับ "index.html" ที่ cache ไว้ ⇒ ออฟไลน์แล้วเปิดไม่ขึ้นเลย */
    }).catch(function(){ return caches.match(e.request, { ignoreSearch:true }); })
  );
});
