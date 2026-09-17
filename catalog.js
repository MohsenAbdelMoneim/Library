/* ==========================================================
   catalog.js — v16
   صفحات الكورسات المدفوعة + الباقات + عرض الأسعار
   ✅ v16: بيقرأ من window.__NEXORA_CATALOG__ (Firestore)
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Catalog — v16 ', 'background:#7c5cff;color:#fff;font-weight:bold');

  const PHONE = '01096295395';
  const WA = 'https://wa.me/201096295395';
  const fmt = (n) => Number(n).toLocaleString('ar-EG-u-nu-latn') + ' جنيه';

  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* ✅ مساعد آمن */
  function on(sel, evt, fn, opts) {
    const el = typeof sel === 'string' ? qs(sel) : sel;
    if (el) el.addEventListener(evt, fn, opts);
    else console.warn('[CATALOG][WIRE] عنصر غير موجود:', sel);
    return el;
  }

  /* ✅ قراءة الكتالوج من المصدر الموحّد */
  function getCatalog() {
    return window.__NEXORA_CATALOG__ || { courses: [], packages: [] };
  }

  /* ---------- أنماط الكتالوج ---------- */
  const STYLES = `
.nex-catalog{max-width:1100px;margin:0 auto}
.nex-tabs{display:flex;gap:8px;margin-bottom:20px;overflow-x:auto;padding-bottom:2px;-webkit-overflow-scrolling:touch}
.nex-tab{white-space:nowrap;padding:10px 18px;border-radius:12px;border:1px solid var(--edge,#212129);background:var(--panel,#101015);color:var(--mut,#9c9cab);font-size:13px;font-weight:600;cursor:pointer;transition:.15s;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.nex-tab:hover{color:var(--ink,#ececf1)}
.nex-tab.active{background:linear-gradient(135deg,#4f7cff,#7c5cff);border-color:transparent;color:#fff}
.nex-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.nex-card{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:12px;position:relative;transition:.2s}
.nex-card:hover{border-color:#4f7cff66;transform:translateY(-2px)}
.nex-card.featured{border:1.5px solid #f0b53e;box-shadow:0 0 24px rgba(240,181,62,.18)}
.nex-badge-top{position:absolute;top:-10px;inset-inline-end:16px;background:linear-gradient(135deg,#f0b53e,#e8961e);color:#161204;font-size:10.5px;font-weight:800;padding:4px 12px;border-radius:999px}
.nex-cat{font-size:10.5px;font-weight:700;color:#7ea2ff;background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.3);padding:3px 10px;border-radius:999px;align-self:flex-start}
.nex-title{font-size:17px;font-weight:800;color:var(--ink,#ececf1);line-height:1.4}
.nex-desc{font-size:12.5px;color:var(--mut,#9c9cab);line-height:1.7}
.nex-prices{margin-top:auto;padding-top:14px;border-top:1px solid var(--edge,#212129);display:flex;flex-direction:column;gap:8px}
.price-cash{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.price-label{font-size:10.5px;font-weight:700;color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);padding:2px 8px;border-radius:6px}
.price-value{font-size:21px;font-weight:800;color:#4ade80;font-variant-numeric:tabular-nums}
.price-inst{display:flex;flex-direction:column;gap:2px}
.price-inst .price-label{color:#f0b53e;background:rgba(240,181,62,.08);border-color:rgba(240,181,62,.25)}
.price-value-sm{font-size:12px;color:var(--mut,#9c9cab)}
.nex-cta{display:flex;gap:8px;margin-top:4px}
.nex-buy{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:44px;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff;font-size:13.5px;font-weight:700;text-decoration:none;transition:.15s;border:none;cursor:pointer;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.nex-buy:hover{opacity:.9}
.nex-buy.gold{background:linear-gradient(135deg,#f0b53e,#e8961e);color:#161204}
.nex-contact{font-size:11.5px;color:var(--mut,#9c9cab);text-align:center}
.nex-contact a{color:#4f7cff;text-decoration:none;font-weight:700;direction:ltr;unicode-bidi:embed}
.nex-pack-list{font-size:12px;color:var(--mut,#9c9cab);line-height:1.9;padding:10px 12px;background:var(--bg,#0a0a0d);border-radius:12px;border:1px solid var(--edge,#212129)}
@media (max-width:640px){
  .nex-grid{grid-template-columns:1fr}
  .price-value{font-size:19px}
  .nex-cta{flex-direction:column}
  .nex-tabs{gap:6px}
  .nex-tab{padding:9px 14px;font-size:12px}
}
`;

  /* ---------- كروت الكتالوج ---------- */
  function courseCardHTML(c) {
    return `
    <article class="nex-card">
      <span class="nex-cat">${esc(c.category || '')}</span>
      <h3 class="nex-title">${esc(c.title)}</h3>
      <p class="nex-desc">${esc(c.description || '')}</p>
      <div class="nex-prices">
        <div class="price-cash">
          <span class="price-label">دفع كاش</span>
          <span class="price-value">${fmt(c.cashPrice)}</span>
        </div>
        <div class="price-inst">
          <span class="price-label">التقسيط متاح</span>
          <span class="price-value-sm">${fmt(c.installmentAmount)} × ${c.installmentCount} دفعات = ${fmt(c.installmentTotal)}</span>
        </div>
        <div class="nex-cta">
          <button type="button" class="nex-buy" data-add-cart-course="${esc(c.id)}">أضف للسلة 🛒</button>
          <a class="nex-buy wa2" href="${WA}?text=${encodeURIComponent('أهلاً 👋 عايز أشترك في ' + c.title)}" target="_blank" rel="noopener noreferrer" title="واتساب" style="flex:0 0 52px;background:#25D366;color:#04310f"><i class="bi bi-whatsapp" aria-hidden="true"></i></a>
        </div>
        <p class="nex-contact">للاستفسار عن التقسيط: <a href="tel:${PHONE}" dir="ltr">${PHONE}</a></p>
      </div>
    </article>`;
  }

  function packCardHTML(p) {
    const catalog = getCatalog();
    const courseTitles = (p.courseIds || []).map((cid) => {
      const c = catalog.byId?.[cid] || catalog.courses.find((x) => x.id === cid);
      return c ? c.title : cid;
    });
    return `
    <article class="nex-card ${p.featured ? 'featured' : ''}">
      ${p.featured ? '<span class="nex-badge-top">الباقة الأشمل</span>' : ''}
      <span class="nex-cat">${p.count || courseTitles.length} كورسات</span>
      <h3 class="nex-title">${esc(p.title)}</h3>
      <div class="nex-pack-list">${courseTitles.map((t) => '✓ ' + esc(t)).join('<br>')}</div>
      <div class="nex-prices">
        <div class="price-cash">
          <span class="price-label">دفع كاش</span>
          <span class="price-value">${fmt(p.cashPrice)}</span>
        </div>
        <div class="price-inst">
          <span class="price-label">التقسيط متاح</span>
          <span class="price-value-sm">${fmt(p.installmentAmount)} × ${p.installmentCount} دفعات = ${fmt(p.installmentTotal)}</span>
        </div>
        <div class="nex-cta">
          <button type="button" class="nex-buy ${p.featured ? 'gold' : ''}" data-add-cart-pack="${esc(p.id)}">أضف للسلة 🛒</button>
          <a class="nex-buy wa2" href="${WA}?text=${encodeURIComponent('أهلاً 👋 عايز أشترك في ' + p.title)}" target="_blank" rel="noopener noreferrer" title="واتساب" style="flex:0 0 52px;background:#25D366;color:#04310f"><i class="bi bi-whatsapp" aria-hidden="true"></i></a>
        </div>
        <p class="nex-contact">التقسيط متاح — <a href="tel:${PHONE}" dir="ltr">تواصل معنا</a></p>
      </div>
    </article>`;
  }

  function buildCatalogViewHTML() {
    const catalog = getCatalog();
    const courses = catalog.courses || [];
    const packages = catalog.packages || [];

    const tabs = `
      <div class="nex-tabs" role="tablist">
        <button class="nex-tab active" data-nex-tab="paid" role="tab" aria-selected="true">الكورسات المدفوعة</button>
        <button class="nex-tab" data-nex-tab="packs" role="tab" aria-selected="false">الباقات المميزة</button>
      </div>`;
    const paidGrid = `<div class="nex-grid" data-nex-panel="paid">${courses.map(courseCardHTML).join('')}</div>`;
    const packsGrid = `<div class="nex-grid hidden" data-nex-panel="packs">${packages.map(packCardHTML).join('')}</div>`;
    return `<div class="nex-catalog">${tabs}${paidGrid}${packsGrid}</div>`;
  }

  function ensureCatalogDOM() {
    if (qs('#view-catalog')) return;
    const main = qs('main#content') || qs('main');
    if (!main) {
      console.warn('[CATALOG] main#content مش موجود — الكتالوج مش هيتضاف.');
      return;
    }

    if (!document.getElementById('nexCatalogStyles')) {
      const st = document.createElement('style');
      st.id = 'nexCatalogStyles';
      st.textContent = STYLES;
      document.head.appendChild(st);
    }

    const section = document.createElement('section');
    section.id = 'view-catalog';
    section.className = 'hidden';
    section.setAttribute('aria-label', 'الكورسات والباقات');
    section.innerHTML = buildCatalogViewHTML();
    main.appendChild(section);

    /* listener للـ tabs */
    section.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-nex-tab]');
      if (!tab) return;
      qsa('#view-catalog .nex-tab').forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      qsa('#view-catalog [data-nex-panel]').forEach((p) =>
        p.classList.toggle('hidden', p.dataset.nexPanel !== tab.dataset.nexTab));
    });
  }

  /* ✅ إعادة بناء الكتالوج لو البيانات اتغيرت */
  function refreshCatalog() {
    const section = qs('#view-catalog');
    if (!section) return;
    const activeTab = section.querySelector('.nex-tab.active')?.dataset.nexTab || 'paid';
    section.innerHTML = buildCatalogViewHTML();
    /* إعادة تفعيل التاب النشط */
    const tab = section.querySelector(`[data-nex-tab="${activeTab}"]`);
    if (tab) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      section.querySelectorAll('[data-nex-panel]').forEach((p) =>
        p.classList.toggle('hidden', p.dataset.nexPanel !== activeTab));
    }
  }

  /* ---------- بند القايمة الجانبية ---------- */
  function ensureNavEntries() {
    const nav = qs('#sideNav');
    if (!nav || qs('[data-nav="view:catalog"]')) return;
    const filesBtn = qs('[data-nav="view:files"]');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.nav = 'view:catalog';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="bi bi-mortarboard text-[13.5px] w-4 text-center shrink-0" aria-hidden="true"></i>' +
                    '<span class="grow text-start truncate">الكورسات والباقات</span>';
    if (filesBtn) filesBtn.after(btn);
    else nav.appendChild(btn);
  }

  /* ---------- عرض الكتالوج ---------- */
  function showCatalog() {
    qsa('main#content > section:not(#view-catalog)').forEach((s) => s.classList.add('hidden'));
    const cat = qs('#view-catalog');
    if (cat) cat.classList.remove('hidden');
    const t = qs('#pageTitle'), s = qs('#pageSub');
    if (t) t.textContent = 'الكورسات والباقات';
    if (s) s.textContent = 'اختار كورسك واشترك بالتقسيط';
    window.scrollTo(0, 0);
  }

  /* ✅ listener على #sideNav بس بدل document */
  function bindCatalogNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__catalogNavBound) return;
    nav.__catalogNavBound = true;
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav="view:catalog"]');
      if (!b) return;
      e.preventDefault();
      showCatalog();
      qs('#sidebar')?.classList.remove('open');
      qs('#overlay')?.classList.add('hidden');
    });
  }

  /* ✅ ربط renderSidebar مع حماية من التعريف المزدوج */
  function hookRenderSidebar() {
    if (window.__catSidebarHooked) return;
    if (typeof window.renderSidebar !== 'function') return;
    window.__catSidebarHooked = true;
    const orig = window.renderSidebar;
    window.renderSidebar = function () {
      try { orig(); } catch (e) { console.error('[CATALOG] renderSidebar:', e); }
      ensureNavEntries();
      bindCatalogNav();
    };
  }

  /* ✅ boot — معرّفة مرة واحدة بس */
  function boot() {
    ensureCatalogDOM();
    ensureNavEntries();
    bindCatalogNav();
    hookRenderSidebar();
    observeSideNav();
  }

  /* ✅ MutationObserver بدل polling كل 60ms */
  function observeSideNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__catalogObserver) return;
    nav.__catalogObserver = new MutationObserver(() => {
      ensureNavEntries();
      bindCatalogNav();
    });
    nav.__catalogObserver.observe(nav, { childList: true });
  }

  /* ✅ التشغيل */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  /* ✅ إعادة بناء الكتالوج لما Firestore يجيب البيانات */
  window.addEventListener('nexora:catalog-ready', () => {
    console.info('[CATALOG] تم استلام بيانات Firestore — إعادة بناء الكتالوج');
    refreshCatalog();
  });

  window.addEventListener('nexora:catalog-update', () => {
    console.info('[CATALOG] تحديث الكتالوج لحظيًا');
    refreshCatalog();
  });

  /* ✅ API عام */
  window.NexoraCatalog = {
    show: showCatalog,
    refresh: () => { refreshCatalog(); boot(); }
  };
})();