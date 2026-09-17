/* ==========================================================
   nav.js — v2.1
   Navbar موحّد: Cart + User + Search + Mobile Menu
   ✅ v2.1: مراقبة أفضل لحالة الدخول + تحديث فوري للـ navbar
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Nav — v2.1 ', 'background:#f0b53e;color:#161204;font-weight:bold');

  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* عناصر الـ navbar */
  const NAV_LINKS = [
    { href: 'landing.html',         label: 'الرئيسية',      icon: 'bi-house' },
    { href: 'library.html',         label: 'المكتبة',       icon: 'bi-mortarboard' },
    { href: 'library.html#roadmap', label: 'المسارات',      icon: 'bi-signpost-split' },
    { href: 'about.html',           label: 'من نحن',        icon: 'bi-info-circle' },
    { href: 'contact.html',         label: 'اتصل بنا',      icon: 'bi-telephone' }
  ];

  let builtOnce = false;
  let lastUid = undefined;

  /* ✅ أنشئ الـ Navbar لو مش موجود */
  function ensureNavbar(force) {
    const old = qs('#nexNavbar');
    if (old && !force) return; /* موجود بالفعل ومش محتاج نعيد البناء */

    /* امسح القديم */
    if (old) old.remove();

    const header = qs('header');
    if (!header) {
      /* حاول تاني بعد لحظة */
      setTimeout(() => ensureNavbar(force), 150);
      return;
    }

    /* خد الـ user من Firebase */
    let user = null;
    try {
      user = (window.firebase && firebase.auth) ? firebase.auth().currentUser : null;
    } catch (e) { /* تجاهل */ }

    lastUid = user ? user.uid : null;

    const cartCount = JSON.parse(localStorage.getItem('nexora:cart:v1') || '[]').length;

    const userMenu = user
      ? `<div class="relative group">
           <button class="flex items-center gap-2 h-9 px-3 rounded-[10px] border border-edge text-mut hover:text-ink hover:border-edge2 transition">
             <i class="bi bi-person-circle text-[16px]"></i>
             <span class="hidden sm:inline text-[12px] font-medium">${esc(user.displayName || 'حسابي')}</span>
           </button>
           <div class="absolute top-full end-0 mt-1 w-48 rounded-xl border border-edge2 bg-panel shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
             <a href="profile.html" class="flex items-center gap-2 px-3 py-2.5 text-[12px] text-mut hover:text-ink hover:bg-raise transition rounded-t-xl">
               <i class="bi bi-person"></i>الملف الشخصي
             </a>
             <a href="library.html" class="flex items-center gap-2 px-3 py-2.5 text-[12px] text-mut hover:text-ink hover:bg-raise transition">
               <i class="bi bi-receipt"></i>حجوزاتي
             </a>
             <a href="library.html" class="flex items-center gap-2 px-3 py-2.5 text-[12px] text-mut hover:text-ink hover:bg-raise transition">
               <i class="bi bi-book"></i>كورساتي
             </a>
             <hr class="border-edge">
             <button id="navLogout" class="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] text-red hover:bg-raise transition rounded-b-xl">
               <i class="bi bi-box-arrow-left"></i>تسجيل الخروج
             </button>
           </div>
         </div>`
      : `<a href="auth.html" class="flex items-center gap-2 h-9 px-3 rounded-[10px] bg-gradient-to-br from-blue-500 to-purple-500 text-white text-[12px] font-bold">
           <i class="bi bi-person-plus"></i>
           <span class="hidden sm:inline">دخول / تسجيل</span>
         </a>`;

    const nav = document.createElement('nav');
    nav.id = 'nexNavbar';
    nav.className = 'fixed top-0 inset-x-0 z-40 border-b border-edge bg-canvas/85 backdrop-blur';
    nav.innerHTML = `
      <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3 h-16">
          <!-- Logo -->
          <a href="landing.html" class="flex items-center gap-2.5 shrink-0">
            <span class="logo-mark"><i class="bi bi-mortarboard"></i></span>
            <div class="leading-tight hidden sm:block">
              <h1 class="text-[13.5px] font-bold text-ink">Nexora Academy</h1>
              <p class="text-[10px] text-dim">Learn · Build · Grow</p>
            </div>
          </a>

          <!-- Desktop Links -->
          <div class="hidden lg:flex items-center gap-1 ms-6">
            ${NAV_LINKS.map(l => `
              <a href="${l.href}" class="flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[12.5px] text-mut hover:text-ink hover:bg-raise transition">
                <i class="bi ${l.icon} text-[13px]"></i>${l.label}
              </a>
            `).join('')}
          </div>

          <!-- Actions -->
          <div class="ms-auto flex items-center gap-2 shrink-0">
            <!-- Search -->
            <button id="navSearchBtn" class="w-9 h-9 grid place-items-center rounded-[10px] border border-edge text-mut hover:text-ink hover:border-edge2 transition" aria-label="بحث">
              <i class="bi bi-search text-[14px]"></i>
            </button>

            <!-- Cart -->
            <a href="library.html" class="relative w-9 h-9 grid place-items-center rounded-[10px] border border-edge text-mut hover:text-ink hover:border-edge2 transition" aria-label="السلة">
              <i class="bi bi-cart3 text-[15px]"></i>
              ${cartCount > 0 ? `<span class="absolute -top-1 -end-1 min-w-[18px] h-[18px] rounded-full bg-red text-white text-[10px] font-bold grid place-items-center px-1 border-2 border-canvas">${cartCount}</span>` : ''}
            </a>

            <!-- User -->
            ${userMenu}

            <!-- Mobile Menu -->
            <button id="navMenuBtn" class="lg:hidden w-9 h-9 grid place-items-center rounded-[10px] border border-edge text-mut hover:text-ink hover:border-edge2 transition" aria-label="القائمة">
              <i class="bi bi-list text-[18px]"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div id="navMobileMenu" class="lg:hidden hidden border-t border-edge bg-panel">
        <div class="px-4 py-3 space-y-1">
          ${NAV_LINKS.map(l => `
            <a href="${l.href}" class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] text-mut hover:text-ink hover:bg-raise transition">
              <i class="bi ${l.icon} text-[15px]"></i>${l.label}
            </a>
          `).join('')}
          ${user ? `
            <hr class="border-edge my-2">
            <a href="profile.html" class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] text-mut hover:text-ink hover:bg-raise transition">
              <i class="bi bi-person"></i>الملف الشخصي
            </a>
            <a href="library.html" class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] text-mut hover:text-ink hover:bg-raise transition">
              <i class="bi bi-receipt"></i>حجوزاتي
            </a>
            <button id="navLogoutMobile" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] text-red hover:bg-raise transition">
              <i class="bi bi-box-arrow-left"></i>تسجيل الخروج
            </button>
          ` : `
            <hr class="border-edge my-2">
            <a href="auth.html" class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] text-white bg-gradient-to-br from-blue-500 to-purple-500">
              <i class="bi bi-person-plus"></i>دخول / تسجيل
            </a>
          `}
        </div>
      </div>
    `;

    /* ✅ دخل الـ navbar قبل الـ header القديم */
    header.style.marginTop = '64px';
    document.body.insertBefore(nav, document.body.firstChild);

    /* Events */
    qs('#navMenuBtn')?.addEventListener('click', () => {
      qs('#navMobileMenu')?.classList.toggle('hidden');
    });

    qs('#navLogout')?.addEventListener('click', async () => {
      if (confirm('تسجيل الخروج؟')) {
        try { await firebase.auth().signOut(); } catch (e) {}
        location.href = 'landing.html';
      }
    });

    qs('#navLogoutMobile')?.addEventListener('click', async () => {
      if (confirm('تسجيل الخروج؟')) {
        try { await firebase.auth().signOut(); } catch (e) {}
        location.href = 'landing.html';
      }
    });

    builtOnce = true;
  }

  /* ✅ شغّل */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ensureNavbar(false), { once: true });
  } else {
    ensureNavbar(false);
  }

  /* ✅ استمع لتغيّر حالة الدخول — أعد بناء الـ navbar */
  function watchAuthState() {
    if (!window.firebase || !firebase.auth) return false;
    try {
      firebase.auth().onAuthStateChanged((user) => {
        const newUid = user ? user.uid : null;
        /* لو الحالة اتغيرت فعلاً → أعد البناء */
        if (newUid !== lastUid) {
          console.info('[NAV] حالة الدخول اتغيرت — إعادة بناء الـ navbar');
          setTimeout(() => ensureNavbar(true), 200);
        }
      });
      return true;
    } catch (e) {
      console.warn('[NAV] watchAuthState:', e.message);
      return false;
    }
  }

  /* ✅ حاول تشغيل watchAuthState لحد ما Firebase يجهز */
  let navAuthTries = 0;
  const navAuthInterval = setInterval(() => {
    navAuthTries++;
    if (watchAuthState()) {
      clearInterval(navAuthInterval);
      console.info('[NAV] ✅ بيستمع لحالة الدخول');
    } else if (navAuthTries > 50) {
      clearInterval(navAuthInterval);
      console.warn('[NAV] ⚠️ Firebase مش جاهز — Navbar مش هيتحدّث تلقائيًا');
    }
  }, 100);

  /* ✅ استمع لتحديث السلة */
  window.addEventListener('storage', (e) => {
    if (e.key === 'nexora:cart:v1') {
      const cart = JSON.parse(e.newValue || '[]');
      const badge = qs('#nexNavbar .bg-red');
      if (badge && cart.length > 0) badge.textContent = cart.length;
    }
  });
})();