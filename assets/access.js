/* access.js — สิทธิ์ดูหน้าราย user (ABP) ใช้ร่วมทุกหน้า
 * - ซ่อนลิงก์เมนูของหน้าที่ไม่มีสิทธิ์ · admin เห็นลิงก์ ⚙️ จัดการผู้ใช้ (admin.html)
 * - เปิดหน้าที่ไม่มีสิทธิ์ → ไปหน้าแรกที่มีสิทธิ์ · ไม่มีสิทธิ์สักหน้า → แสดงข้อความแทนเนื้อหา
 * - ตัวจริงตรวจที่ API (ตอบ 403) — ไฟล์นี้แค่ทำให้หน้าเว็บตรงกับสิทธิ์
 */
(function () {
  var API_BASE = "https://abp-cafe-sale.mobile1234.site";
  var tok = null;
  try { tok = localStorage.getItem("abp_token"); } catch (e) {}
  if (!tok) return;                                   // ยังไม่ login — หน้าเดิมพาไป login.html เอง
  var here = location.pathname.split("/").pop() || "index.html";

  function toLogin() {
    try { ["abp_token", "abp_token_exp", "abp_full_name"].forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
    location.replace("login.html");
  }

  function noAccess() {
    var main = document.querySelector("main");
    if (!main) return;
    main.innerHTML = '<div style="max-width:520px;margin:12vh auto;padding:28px 24px;background:#fff;border:1px solid #e4e2dc;' +
      'border-radius:14px;text-align:center;font-family:Sarabun,sans-serif;color:#2B2E33">' +
      '<div style="font-size:40px;margin-bottom:8px">🔒</div>' +
      '<div style="font-size:18px;font-weight:700;margin-bottom:6px">บัญชีนี้ยังไม่ได้รับสิทธิ์ดูหน้าใด</div>' +
      '<div style="color:#8f949a">ติดต่อผู้ดูแลระบบให้เปิดสิทธิ์</div></div>';
  }

  function apply(me) {
    var allowed = {}, known = {};
    (me.pages || []).forEach(function (p) { allowed[p.href] = true; });
    (me.all_pages || []).forEach(function (p) { known[p.href] = true; });

    var links = document.querySelectorAll(".sb-link");
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      if (known[href] && !allowed[href]) a.style.display = "none";
    });
    if (me.role === "admin" && links.length && !document.querySelector('.sb-link[href="admin.html"]')) {
      var last = links[links.length - 1];
      var adm = document.createElement("a");
      adm.href = "admin.html"; adm.className = "sb-link"; adm.textContent = "⚙️ จัดการผู้ใช้";
      last.parentNode.insertBefore(adm, last.nextSibling);
    }
    if (known[here] && !allowed[here]) {
      if (me.pages && me.pages.length) location.replace(me.pages[0].href);
      else noAccess();
    }
  }

  function run() {
    fetch(API_BASE + "/api/me", { headers: { Authorization: "Bearer " + tok } })
      .then(function (r) {
        if (r.status === 401) { toLogin(); return null; }
        return r.ok ? r.json() : null;
      })
      .then(function (me) { if (me) apply(me); })
      .catch(function () {});                         // เน็ตหลุด — หน้าเดิมแจ้ง error เอง
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
