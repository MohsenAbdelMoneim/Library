/* ==========================================================
   nav.js — v3
   ✅ v3: CSS حقيقي بدل Tailwind (مش محمّل)
   ✅ v3: Active link detection
   ✅ v3: Dropdown click-based على الموبايل + hover على Desktop
   ✅ v3: Close on outside click + Escape
   ✅ v3: CustomEvent للتكامل مع باقي الصفحات
   ✅ v3: aria-expanded + aria-controls على الـMenu
   ✅ v3: بدون تكرار padding + بدون delays
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Nav — v3 ', 'background:#f0b53e;color:#161204;font-weight:bold');

  /* ---------- Helpers ---------- */
  const qs  = (s, el) => (el || document).querySelector(s);
  const qsa = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  const NAV_LINKS = [
    { href: 'landing.html',         label: 'الرئيسية',  icon: 'bi-house',             match: ['', 'index.html', 'landing.html'] },
    { href: 'library.html',         label: 'المكتبة',   icon: 'bi-mortarboard',       match: ['library.html'] },
    { href: 'library.html#roadmap', label: 'المسارات',  icon: 'bi-signpost-split',    match: [] }, /* hash-based */
    { href: 'about.html',           label: 'من نحن',    icon: 'bi-info-circle',       match: ['about.html'] },
    { href: 'contact.html',         label: 'اتصل بنا',  icon: 'bi-telephone',         match: ['contact.html'] }
  ];

  const NAV_H = 64;
  let lastUid;
  let outsideClickBound = false;
  let escBound = false;

  /* ---------- قراءة السلة ---------- */
  function getCartCount() {
    try { return JSON.parse(localStorage.getItem('nexora:cart:v1') || '[]').length; }
    catch { return 0; }
  }

  /* ---------- Active link ---------- */
  function currentPage() {
    const p = location.pathname.split('/').pop();
    return p || 'landing.html';
  }
  function isActive(link) {
    const cur = currentPage();
    /* المسارات: لو الـhash هو roadmap */
    if (link.href.endsWith('#roadmap')) {
      return cur === 'library.html' && location.hash.startsWith('#roadmap');
    }
    /* المكتبة: مش active لو إحنا في library.html#roadmap */
    if (link.href === 'library.html') {
      return cur === 'library.html' && !location.hash.startsWith('#roadmap');
    }
    return link.match.includes(cur);
  }

  /* ---------- Styles (CSS حقيقي) ---------- */
  function ensureNavStyles() {
    if (qs('#nexNavStyles')) return;
    const st = document.createElement('style');
    st.id = 'nexNavStyles';
    st.textContent = `
:root { --nav-h: 64px; }

#nexNavbar {
  position: fixed; top: 0; inset-inline: 0; z-index: 40;
  background: rgba(10,10,13,.85);
  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--edge, #212129);
  font-family: 'IBM Plex Sans Arabic', sans-serif;
}
#nexNavbar * { box-sizing: border-box; }
#nexNavbar .nv-inner {
  max-width: 1440px; margin: 0 auto; padding: 0 16px;
  display: flex; align-items: center; gap: 12px;
  height: var(--nav-h, 64px);
}
#nexNavbar .nv-logo {
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0; text-decoration: none; color: inherit;
}
#nexNavbar .nv-logo-mark {
  width: 38px; height: 38px; border-radius: 12px;
  background: linear-gradient(135deg, #4f7cff, #7c5cff);
  display: grid; place-items: center; font-size: 18px; color: #fff;
}
#nexNavbar .nv-brand { line-height: 1.15; }
#nexNavbar .nv-brand-title {
  font-size: 13.5px; font-weight: 800; color: var(--ink, #ececf1); margin: 0;
  background: linear-gradient(135deg, #fff, var(--accent, #f0b53e));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
#nexNavbar .nv-brand-sub { font-size: 10px; color: var(--dim, #66666f); margin: 0; letter-spacing: .5px; }

#nexNavbar .nv-links {
  display: none; align-items: center; gap: 4px;
  margin-inline-start: 24px;
}
#nexNavbar .nv-link {
  display: flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 12px; border-radius: 10px;
  font-size: 12.5px; color: var(--mut, #9c9cab);
  text-decoration: none; transition: .15s; white-space: nowrap;
  font-family: inherit;
}
#nexNavbar .nv-link:hover { color: var(--ink, #ececf1); background: var(--raise, #16161d); }
#nexNavbar .nv-link.active {
  color: var(--accent, #f0b53e);
  background: rgba(240,181,62,.08);
  border: 1px solid rgba(240,181,62,.25);
}
#nexNavbar .nv-link i { font-size: 13px; }

#nexNavbar .nv-actions {
  margin-inline-start: auto;
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0;
}
#nexNavbar .nv-icon-btn {
  width: 36px; height: 36px; border-radius: 10px;
  border: 1px solid var(--edge, #212129);
  background: transparent; color: var(--mut, #9c9cab);
  display: grid; place-items: center;
  cursor: pointer; transition: .15s; text-decoration: none;
  font-family: inherit;
}
#nexNavbar .nv-icon-btn:hover {
  color: var(--ink, #ececf1);
  border-color: var(--edge2, #2e2e39);
  background: var(--raise, #16161d);
}
#nexNavbar .nv-icon-btn i { font-size: 15px; }
#nexNavbar .nv-cart-badge {
  position: absolute; top: -4px; inset-inline-end: -4px;
  min-width: 18px; height: 18px; border-radius: 999px;
  background: var(--red, #e5484d); color: #fff;
  font-size: 10px; font-weight: 700;
  display: grid; place-items: center; padding: 0 4px;
  border: 2px solid var(--bg, #0a0a0d);
}

#nexNavbar .nv-user-btn {
  display: flex; align-items: center; gap: 8px;
  height: 36px; padding: 0 12px; border-radius: 10px;
  border: 1px solid var(--edge, #212129);
  background: transparent; color: var(--mut, #9c9cab);
  font-size: 12px; font-weight: 600;
  cursor: pointer; transition: .15s; font-family: inherit;
}
#nexNavbar .nv-user-btn:hover { color: var(--ink, #ececf1); border-color: var(--edge2, #2e2e39); }
#nexNavbar .nv-user-btn i { font-size: 16px; }

#nexNavbar .nv-auth-btn {
  display: flex; align-items: center; gap: 8px;
  height: 36px; padding: 0 12px; border-radius: 10px;
  background: linear-gradient(135deg, #4f7cff, #7c5cff);
  color: #fff; text-decoration: none;
  font-size: 12px; font-weight: 700; transition: .15s;
}
#nexNavbar .nv-auth-btn:hover { opacity: .9; }
#nexNavbar .nv-auth-btn i { font-size: 14px; }

#nexNavbar .nv-user-wrap { position: relative; }
#nexNavbar .nv-user-menu {
  position: absolute; top: calc(100% + 6px); inset-inline-end: 0;
  min-width: 200px; border-radius: 12px;
  border: 1px solid var(--edge2, #2e2e39);
  background: var(--panel, #101015);
  box-shadow: 0 16px 40px rgba(0,0,0,.5);
  padding: 6px;
  opacity: 0; visibility: hidden; transform: translateY(-4px);
  transition: opacity .15s, visibility .15s, transform .15s;
  z-index: 50;
}
#nexNavbar .nv-user-wrap.open .nv-user-menu { opacity: 1; visibility: visible; transform: translateY(0); }
#nexNavbar .nv-user-menu a,
#nexNavbar .nv-user-menu button {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 12px; border-radius: 8px;
  font-size: 12.5px; color: var(--mut, #9c9cab);
  text-decoration: none; transition: .15s;
  width: 100%; background: none; border: none; cursor: pointer;
  font-family: inherit; text-align: start;
}
#nexNavbar .nv-user-menu a:hover,
#nexNavbar .nv-user-menu button:hover {
  color: var(--ink, #ececf1);
  background: var(--raise, #16161d);
}
#nexNavbar .nv-user-menu .danger { color: #f4636e; }
#nexNavbar .nv-user-menu .danger:hover { background: rgba(229,72,77,.1); }
#nexNavbar .nv-user-menu hr { border: none; border-top: 1px solid var(--edge, #212129); margin: 6px 0; }
#nexNavbar .nv-user-menu i { font-size: 14px; }

#nexNavbar .nv-mobile-menu {
  display: none;
  border-top: 1px solid var(--edge, #212129);
  background: var(--panel, #101015);
}
#nexNavbar .nv-mobile-menu.open { display: block; }
#nexNavbar .nv-mobile-menu .nv-mm-inner { padding: 12px 16px; }
#nexNavbar .nv-mobile-menu a,
#nexNavbar .nv-mobile-menu button {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 12px; border-radius: 10px;
  font-size: 13.5px; color: var(--mut, #9c9cab);
  text-decoration: none; transition: .15s;
  width: 100%; background: none; border: none; cursor: pointer;
  font-family: inherit; text-align: start;
}
#nexNavbar .nv-mobile-menu a:hover,
#nexNavbar .nv-mobile-menu button:hover { background: var(--raise, #16161d); color: var(--ink, #ececf1); }
#nexNavbar .nv-mobile-menu a.active { color: var(--accent, #f0b53e); background: rgba(240,181,62,.08); }
#nexNavbar .nv-mobile-menu .danger { color: #f4636e; }
#nexNavbar .nv-mobile-menu hr { border: none; border-top: 1px solid var(--edge, #212129); margin: 8px 0; }
#nexNavbar .nv-mobile-menu .nv-mm-auth {
  background: linear-gradient(135deg, #4f7cff, #7c5cff) !important;
  color: #fff !important; font-weight: 700;
}

/* Desktop */
@media (min-width: 1024px) {
  #nexNavbar .nv-links { display: flex; }
  #nexNavbar #navMenuBtn { display: none; }
}
@media (max-width: 640px) {
  #nexNavbar .nv-brand { display: none; }
}

/* Focus */
#nexNavbar a:focus-visible,
#nexNavbar button:focus-visible {
  outline: 2px solid var(--accent, #f0b53e);
  outline-offset: 2px;
}
`;
    document.head.appendChild(st);
  }

  /* ---------- SVG icons via Bootstrap Icons (class-based) ---------- */
  function iconClass(name) { return 'bi ' + name; }

  /* ---------- بناء الـ Navbar ---------- */
  function buildNavbar() {
    /* شيل القديم */
    const old = qs('#nexNavbar');
    if (old) old.remove();

    ensureNavStyles();

    let user = null;
    try {
      user = (typeof firebase !== 'undefined' && firebase.auth)
        ? firebase.auth().currentUser
        : null;
    } catch (e) { /* تجاهل */ }

    lastUid = user ? user.uid : null;

    const cartCount = getCartCount();

    const userMenuHTML = user
      ? `
        <div class="nv-user-wrap" id="navUserWrap">
          <button type="button" class="nv-user-btn" id="navUserBtn"
                  aria-haspopup="true" aria-expanded="false" aria-controls="navUserMenu">
            <i class="${iconClass('bi-person-circle')}" aria-hidden="true"></i>
            <span class="hidden-mobile">${esc(user.displayName || 'حسابي')}</span>
          </button>
          <div class="nv-user-menu" id="navUserMenu" role="menu">
            <a href="profile.html" role="menuitem">
              <i class="${iconClass('bi-person')}" aria-hidden="true"></i>الملف الشخصي
            </a>
            <a href="library.html" role="menuitem">
              <i class="${iconClass('bi-receipt')}" aria-hidden="true"></i>حجوزاتي
            </a>
            <a href="library.html" role="menuitem">
              <i class="${iconClass('bi-book')}" aria-hidden="true"></i>كورساتي
            </a>
            <hr>
            <button type="button" class="danger" id="navLogout" role="menuitem">
              <i class="${iconClass('bi-box-arrow-left')}" aria-hidden="true"></i>تسجيل الخروج
            </button>
          </div>
        </div>`
      : `
        <a href="auth.html" class="nv-auth-btn">
          <i class="${iconClass('bi-person-plus')}" aria-hidden="true"></i>
          <span class="hidden-mobile">دخول / تسجيل</span>
        </a>`;

    const linksHTML = NAV_LINKS.map((l) => {
      const active = isActive(l) ? ' active' : '';
      return `<a href="${esc(l.href)}" class="nv-link${active}">
        <i class="${iconClass(l.icon)}" aria-hidden="true"></i>${esc(l.label)}
      </a>`;
    }).join('');

    const mobileLinksHTML = NAV_LINKS.map((l) => {
      const active = isActive(l) ? ' active' : '';
      return `<a href="${esc(l.href)}" class="${active}">
        <i class="${iconClass(l.icon)}" aria-hidden="true"></i>${esc(l.label)}
      </a>`;
    }).join('');

    const mobileAuthHTML = user
      ? `
        <hr>
        <a href="profile.html">
          <i class="${iconClass('bi-person')}" aria-hidden="true"></i>الملف الشخصي
        </a>
        <button type="button" class="danger" id="navLogoutMobile">
          <i class="${iconClass('bi-box-arrow-left')}" aria-hidden="true"></i>تسجيل الخروج
        </button>`
      : `
        <hr>
        <a href="auth.html" class="nv-mm-auth">
          <i class="${iconClass('bi-person-plus')}" aria-hidden="true"></i>دخول / تسجيل
        </a>`;

    const nav = document.createElement('nav');
    nav.id = 'nexNavbar';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'القائمة الرئيسية');

    nav.innerHTML = `
      <div class="nv-inner">
        <a href="landing.html" class="nv-logo" aria-label="Nexora Academy — الصفحة الرئيسية">
          <span class="nv-logo-mark" aria-hidden="true"><i class="${iconClass('bi-mortarboard')}"></i></span>
          <div class="nv-brand">
            <div class="nv-brand-title">Nexora Academy</div>
            <p class="nv-brand-sub">Learn · Build · Grow</p>
          </div>
        </a>

        <div class="nv-links">${linksHTML}</div>

        <div class="nv-actions">
          <button type="button" class="nv-icon-btn" id="navSearchBtn" aria-label="بحث">
            <i class="${iconClass('bi-search')}" aria-hidden="true"></i>
          </button>

          <a href="library.html" class="nv-icon-btn" style="position:relative;" aria-label="السلة">
            <i class="${iconClass('bi-cart3')}" aria-hidden="true"></i>
            <span class="nv-cart-badge" id="navCartBadge" ${cartCount > 0 ? '' : 'hidden'}>${cartCount}</span>
          </a>

          ${userMenuHTML}

          <button type="button" class="nv-icon-btn" id="navMenuBtn"
                  aria-label="القائمة" aria-expanded="false" aria-controls="navMobileMenu">
            <i class="${iconClass('bi-list')}" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <div class="nv-mobile-menu" id="navMobileMenu">
        <div class="nv-mm-inner">
          ${mobileLinksHTML}
          ${mobileAuthHTML}
        </div>
      </div>
    `;

    /* ضبط padding-top للـbody بدون تكرار */
    document.documentElement.style.setProperty('--nav-h', NAV_H + 'px');
    if (!document.body.style.paddingTop) {
      document.body.style.paddingTop = NAV_H + 'px';
    }

    /* إدراج الـnav كأول عنصر — بعد skip-link لو موجود */
    const skip = qs('.skip-link');
    if (skip && skip.parentNode === document.body) {
      skip.insertAdjacentElement('afterend', nav);
    } else {
      document.body.insertBefore(nav, document.body.firstChild);
    }

    /* ====== Events ====== */
    bindNavEvents();
    builtOnce = true;
    console.info('[NAV] ✅ الـ Navbar اتبنى');
    return true;
  }

  /* ---------- ربط الأحداث (delegation على nav) ---------- */
  function bindNavEvents() {
    const nav = qs('#nexNavbar');
    if (!nav) return;

    /* Menu toggle */
    const menuBtn = qs('#navMenuBtn', nav);
    const mobileMenu = qs('#navMobileMenu', nav);
    menuBtn && menuBtn.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });

    /* إغلاق القائمة عند الدوس على رابط داخلها */
    mobileMenu && mobileMenu.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        mobileMenu.classList.remove('open');
        menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
      }
    });

    /* User dropdown — click-based (يشتغل على Desktop + Mobile) */
    const userBtn = qs('#navUserBtn', nav);
    const userWrap = qs('#navUserWrap', nav);
    if (userBtn && userWrap) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = userWrap.classList.toggle('open');
        userBtn.setAttribute('aria-expanded', String(open));
      });
      /* Hover على Desktop */
      if (matchMedia('(hover: hover)').matches) {
        let hoverTimer = null;
        userWrap.addEventListener('mouseenter', () => {
          clearTimeout(hoverTimer);
          userWrap.classList.add('open');
          userBtn.setAttribute('aria-expanded', 'true');
        });
        userWrap.addEventListener('mouseleave', () => {
          hoverTimer = setTimeout(() => {
            userWrap.classList.remove('open');
            userBtn.setAttribute('aria-expanded', 'false');
          }, 200);
        });
      }
    }

    /* Close on outside click */
    if (!outsideClickBound) {
      outsideClickBound = true;
      document.addEventListener('click', (e) => {
        const wrap = qs('#navUserWrap');
        const menu = qs('#navMobileMenu');
        const mBtn = qs('#navMenuBtn');
        if (wrap && !wrap.contains(e.target)) {
          wrap.classList.remove('open');
          const b = qs('#navUserBtn');
          b && b.setAttribute('aria-expanded', 'false');
        }
        /* Mobile menu close لو داس بره */
        if (menu && menu.classList.contains('open') && mBtn &&
            !menu.contains(e.target) && e.target !== mBtn && !mBtn.contains(e.target)) {
          menu.classList.remove('open');
          mBtn.setAttribute('aria-expanded', 'false');
        }
      }, true);
    }

    /* Escape يغلق كل حاجة */
    if (!escBound) {
      escBound = true;
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const wrap = qs('#navUserWrap');
        const menu = qs('#navMobileMenu');
        const mBtn = qs('#navMenuBtn');
        if (wrap) {
          wrap.classList.remove('open');
          const b = qs('#navUserBtn');
          b && b.setAttribute('aria-expanded', 'false');
        }
        if (menu && menu.classList.contains('open')) {
          menu.classList.remove('open');
          mBtn && mBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* Logout */
    const doLogout = async () => {
      if (!confirm('تسجيل الخروج؟')) return;
      try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
          await firebase.auth().signOut();
        }
      } catch (err) { console.warn('[NAV] signOut:', err); }
      location.href = 'landing.html';
    };
    qs('#navLogout', nav)?.addEventListener('click', doLogout);
    qs('#navLogoutMobile', nav)?.addEventListener('click', doLogout);

    /* Search — dispatch event بدل ما تبقى فاضية */
    qs('#navSearchBtn', nav)?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('nexora:search-open'));
    });
  }

  /* ---------- مراقبة Auth ---------- */
  function watchAuthState() {
    if (typeof firebase === 'undefined' || !firebase.auth) return false;
    try {
      firebase.auth().onAuthStateChanged((user) => {
        const newUid = user ? user.uid : null;
        if (newUid !== lastUid) {
          console.info('[NAV] حالة الدخول اتغيرت — إعادة بناء الـ navbar');
          buildNavbar();
        }
      });
      return true;
    } catch (e) {
      console.warn('[NAV] watchAuthState:', e.message);
      return false;
    }
  }

  /* ---------- السلة ---------- */
  function updateCartBadge(count) {
    const badge = qs('#navCartBadge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count;
      badge.removeAttribute('hidden');
    } else {
      badge.textContent = '';
      badge.setAttribute('hidden', '');
    }
  }
  window.addEventListener('nexora:cart-update', (e) => {
    updateCartBadge(e.detail?.count ?? getCartCount());
  });
  window.addEventListener('storage', (e) => {
    if (e.key === 'nexora:cart:v1') updateCartBadge(getCartCount());
  });

  /* ---------- انتظر DOM + Firebase ---------- */
  function waitForReady(retries) {
    retries = retries == null ? 50 : retries;
    if (document.body && document.readyState !== 'loading') {
      console.info('[NAV] DOM جاهز — build');
      buildNavbar();
      let tries = 0;
      const t = setInterval(() => {
        tries++;
        if (watchAuthState()) {
          clearInterval(t);
          console.info('[NAV] ✅ بيستمع لحالة الدخول');
        } else if (tries > 50) {
          clearInterval(t);
          console.warn('[NAV] ⚠️ Firebase مش جاهز');
        }
      }, 100);
      return;
    }
    if (retries <= 0) { console.warn('[NAV] ⚠️ DOM مش جاهز'); return; }
    setTimeout(() => waitForReady(retries - 1), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForReady(), { once: true });
  } else {
    waitForReady();
  }

  /* ---------- API عام ---------- */
  window.NexoraNav = {
    rebuild: buildNavbar,
    updateCart: updateCartBadge,
    setUser: () => { /* for future */ }
  };
})();