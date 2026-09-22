/* ==========================================================
   catalog.js — v21
   ✅ v21: إصلاح تكرار الإشعارات (bindAll مرة واحدة بس)
   ✅ v21: قلب ❤️ + شريط سلة سفلي + واتساب
   ✅ v21: بيقرأ من window.__NEXORA_CATALOG__ (Firestore)
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Catalog — v21 ', 'background:#7c5cff;color:#fff;font-weight:bold');

  const PHONE = '01096295395';
  const WA = 'https://wa.me/201096295395';
  const fmt = (n) => Number(n).toLocaleString('ar-EG-u-nu-latn') + ' جنيه';

  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  function getCatalog() {
    return window.__NEXORA_CATALOG__ || { courses: [], packages: [] };
  }

  const STYLES = `
.nex-catalog{max-width:1100px;margin:0 auto;padding-bottom:100px}
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
.nex-cta{display:flex;gap:8px;margin-top:4px;align-items:center}
.nex-heart{flex:0 0 44px;height:44px;border-radius:12px;border:1px solid var(--edge2,#2e2e39);background:var(--bg,#0a0a0d);color:var(--dim,#66666f);display:inline-flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;transition:.15s;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.nex-heart:hover{border-color:#f4636e;color:#f4636e;transform:scale(1.05)}
.nex-heart.on{background:rgba(244,99,110,.15);border-color:#f4636e;color:#f4636e}
.nex-heart.on i{animation:heartPop .35s cubic-bezier(.34,1.56,.64,1)}
@keyframes heartPop{0%{transform:scale(.6)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
.nex-buy{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:44px;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff;font-size:13.5px;font-weight:700;text-decoration:none;transition:.15s;border:none;cursor:pointer;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.nex-buy:hover{opacity:.9}
.nex-buy.gold{background:linear-gradient(135deg,#f0b53e,#e8961e);color:#161204}
.nex-buy.added{background:linear-gradient(135deg,#4ade80,#22c55e);color:#052e12}
.nex-contact{font-size:11.5px;color:var(--mut,#9c9cab);text-align:center}
.nex-contact a{color:#4f7cff;text-decoration:none;font-weight:700;direction:ltr;unicode-bidi:embed}
.nex-pack-list{font-size:12px;color:var(--mut,#9c9cab);line-height:1.9;padding:10px 12px;background:var(--bg,#0a0a0d);border-radius:12px;border:1px solid var(--edge,#212129)}
.nex-cartbar{position:fixed;bottom:0;left:0;right:0;z-index:200;background:rgba(16,16,21,.98);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);border-top:1px solid var(--edge2,#2e2e39);padding:12px 16px calc(12px + env(safe-area-inset-bottom, 0px));box-shadow:0 -8px 30px rgba(0,0,0,.6);transform:translateY(120%);transition:transform .3s cubic-bezier(.4,0,.2,1)}
.nex-cartbar.show{transform:translateY(0)}
.nex-cartbar-inner{max-width:900px;margin:0 auto;display:flex;align-items:center;gap:12px}
.nex-cartbar-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.nex-cartbar-count{font-size:11.5px;color:var(--mut,#9c9cab);font-weight:600}
.nex-cartbar-total{font-size:19px;font-weight:900;color:#4ade80;font-variant-numeric:tabular-nums}
.nex-cartbar-total small{font-size:11.5px;font-weight:600;color:var(--mut,#9c9cab);margin-inline-start:4px}
.nex-cartbar-btn{display:inline-flex;align-items:center;gap:8px;height:48px;padding:0 22px;border-radius:13px;background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff;font-size:14px;font-weight:800;border:none;cursor:pointer;font-family:inherit;text-decoration:none;transition:.15s;box-shadow:0 8px 24px rgba(79,124,255,.35);touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.nex-cartbar-btn:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(79,124,255,.5)}
.nex-cartbar-btn.wa{background:linear-gradient(135deg,#25D366,#1fa855);color:#04310f;box-shadow:0 8px 24px rgba(37,211,102,.35)}
.nex-cartbar-btn.wa:hover{box-shadow:0 12px 32px rgba(37,211,102,.5)}
.nex-cartbar-clear{background:none;border:none;color:var(--dim,#66666f);font-size:18px;cursor:pointer;padding:8px;border-radius:10px;transition:.15s;font-family:inherit;touch-action:manipulation}
.nex-cartbar-clear:hover{color:#f4636e;background:rgba(229,72,77,.1)}
@media (max-width:640px){
  .nex-catalog{padding-bottom:120px}
  .nex-grid{grid-template-columns:1fr}
  .price-value{font-size:19px}
  .nex-tabs{gap:6px}
  .nex-tab{padding:9px 14px;font-size:12px}
  .nex-cartbar-inner{flex-wrap:wrap;gap:8px}
  .nex-cartbar-info{flex-basis:100%;text-align:center}
  .nex-cartbar-btn{flex:1;justify-content:center;height:46px;padding:0 12px;font-size:13px}
  .nex-cartbar-clear{position:absolute;top:8px;inset-inline-end:8px}
}
`;

  function shopReady() {
    return !!(window.NexoraShop && typeof window.NexoraShop.addToCart === 'function');
  }
  function inCart(id) {
    if (!shopReady() || typeof window.NexoraShop.inCart !== 'function') return false;
    try { return window.NexoraShop.inCart(id); } catch (e) { return false; }
  }

  function courseCardHTML(c) {
    const isIn = inCart(c.id);
    const btnLabel = isIn ? 'في السلة ✓' : 'أضف للسلة 🛒';
    const btnClass = isIn ? 'nex-buy added' : 'nex-buy';
    const heartClass = isIn ? 'nex-heart on' : 'nex-heart';
    const heartIcon = isIn ? 'bi bi-heart-fill' : 'bi bi-heart';
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
          <button type="button" class="${btnClass}" data-add-cart-course="${esc(c.id)}">${btnLabel}</button>
          <button type="button" class="${heartClass}" data-heart="${esc(c.id)}" title="إضافة/إزالة" aria-label="إضافة/إزالة">
            <i class="${heartIcon}"></i>
          </button>
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
    const isIn = inCart(p.id);
    const btnLabel = isIn ? 'في السلة ✓' : 'أضف للسلة 🛒';
    const btnClass = `nex-buy ${p.featured ? 'gold' : ''} ${isIn ? 'added' : ''}`;
    const heartClass = isIn ? 'nex-heart on' : 'nex-heart';
    const heartIcon = isIn ? 'bi bi-heart-fill' : 'bi bi-heart';
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
          <button type="button" class="${btnClass}" data-add-cart-pack="${esc(p.id)}">${btnLabel}</button>
          <button type="button" class="${heartClass}" data-heart="${esc(p.id)}" title="إضافة/إزالة" aria-label="إضافة/إزالة">
            <i class="${heartIcon}"></i>
          </button>
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
    if (qs('#view-catalog')) {
      bindAll();
      return true;
    }
    const main = qs('main#content') || qs('main');
    if (!main) {
      console.warn('[CATALOG] main#content مش موجود — هستنى…');
      return false;
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

    console.info('[CATALOG] ✅ #view-catalog اتعمل');
    bindAll();
    return true;
  }

  /* ✅ bindAll بتتنادى مرة واحدة بس للـ section */
  function bindAll() {
    const section = qs('#view-catalog');
    if (!section) return;

    if (section.__cartBound) return; /* ✅ لو مربوطة، مانعملش حاجة */
    section.__cartBound = true;

    section.addEventListener('click', (e) => {
      const cBtn = e.target.closest('[data-add-cart-course]');
      if (cBtn) {
        e.preventDefault(); e.stopPropagation();
        handleAddToCart(cBtn.dataset.addCartCourse, cBtn);
        return;
      }
      const pBtn = e.target.closest('[data-add-cart-pack]');
      if (pBtn) {
        e.preventDefault(); e.stopPropagation();
        handleAddToCart(pBtn.dataset.addCartPack, pBtn);
        return;
      }
      const heart = e.target.closest('[data-heart]');
      if (heart) {
        e.preventDefault(); e.stopPropagation();
        handleHeart(heart.dataset.heart, heart);
        return;
      }
    });

    buildCartBar();
  }

  function handleAddToCart(id, btn) {
    if (!id) return;
    if (!shopReady()) {
      if (typeof window.showToast === 'function') window.showToast('السلة مش جاهزة', 'warn');
      return;
    }
    const wasIn = inCart(id);
    if (!wasIn) {
      window.NexoraShop.addToCart(id);
      if (typeof window.showToast === 'function') window.showToast('اتضاف للسلة 🛒', 'success');
    }
    /* ✅ لو كان في السلة → مفيش حاجة (زرار أضف للسلة مش بيشيل) */
    syncAllHearts();
    syncAllCartBtns();
    updateCartBar();
  }

  function handleHeart(id, heartBtn) {
    if (!id) return;
    if (!shopReady()) return;

    const wasIn = inCart(id);
    if (!wasIn) {
      window.NexoraShop.addToCart(id);
      if (typeof window.showToast === 'function') window.showToast('اتضاف للسلة ❤️', 'success');
    } else {
      if (typeof window.NexoraShop.toggleCart === 'function') window.NexoraShop.toggleCart(id);
      if (typeof window.showToast === 'function') window.showToast('اتشال من السلة', 'info');
    }

    syncAllHearts();
    syncAllCartBtns();
    updateCartBar();
  }

  function syncAllHearts() {
    qsa('#view-catalog [data-heart]').forEach((btn) => {
      const id = btn.dataset.heart;
      const isIn = inCart(id);
      btn.classList.toggle('on', isIn);
      const ic = btn.querySelector('i');
      if (ic) ic.className = isIn ? 'bi bi-heart-fill' : 'bi bi-heart';
    });
  }

  function syncAllCartBtns() {
    qsa('#view-catalog [data-add-cart-course]').forEach((btn) => {
      const id = btn.dataset.addCartCourse;
      const isIn = inCart(id);
      btn.classList.toggle('added', isIn);
      btn.textContent = isIn ? 'في السلة ✓' : 'أضف للسلة 🛒';
    });
    qsa('#view-catalog [data-add-cart-pack]').forEach((btn) => {
      const id = btn.dataset.addCartPack;
      const isIn = inCart(id);
      btn.classList.toggle('added', isIn);
      btn.textContent = isIn ? 'في السلة ✓' : 'أضف للسلة 🛒';
    });
  }

  function buildCartBar() {
    if (qs('#nexCartBar')) {
      updateCartBar();
      return;
    }
    const bar = document.createElement('div');
    bar.id = 'nexCartBar';
    bar.className = 'nex-cartbar';
    bar.innerHTML = `
      <div class="nex-cartbar-inner">
        <div class="nex-cartbar-info">
          <span class="nex-cartbar-count" id="nexCartCount">0 كورس</span>
          <span class="nex-cartbar-total" id="nexCartTotal">0 جنيه<small>الإجمالي</small></span>
        </div>
        <button type="button" class="nex-cartbar-btn wa" id="nexCartWA">
          <i class="bi bi-whatsapp"></i>
          اشتري الآن
        </button>
        <button type="button" class="nex-cartbar-btn" id="nexCartView" style="display:none">
          <i class="bi bi-cart3"></i>
          السلة
        </button>
        <button type="button" class="nex-cartbar-clear" id="nexCartClear" aria-label="مسح السلة">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;
    document.body.appendChild(bar);

    qs('#nexCartWA')?.addEventListener('click', sendToWhatsApp);
    qs('#nexCartView')?.addEventListener('click', () => {
      if (window.NexoraShop && typeof window.NexoraShop.openCart === 'function') {
        window.NexoraShop.openCart();
      }
    });
    qs('#nexCartClear')?.addEventListener('click', () => {
      if (!confirm('مسح كل عناصر السلة؟')) return;
      if (window.NexoraShop && typeof window.NexoraShop.clearCart === 'function') {
        window.NexoraShop.clearCart();
      }
      updateCartBar();
      syncAllHearts();
      syncAllCartBtns();
      if (typeof window.showToast === 'function') window.showToast('تم مسح السلة', 'info');
    });

    updateCartBar();
  }

  function updateCartBar() {
    const bar = qs('#nexCartBar');
    if (!bar) return;
    if (!shopReady()) { bar.classList.remove('show'); return; }

    const count = window.NexoraShop.getCartCount ? window.NexoraShop.getCartCount() : 0;
    const total = window.NexoraShop.getCartTotal ? window.NexoraShop.getCartTotal() : 0;

    const countEl = qs('#nexCartCount');
    const totalEl = qs('#nexCartTotal');
    if (countEl) countEl.textContent = count + ' كورس';
    if (totalEl) totalEl.innerHTML = fmt(total) + '<small>الإجمالي</small>';

    if (count > 0) bar.classList.add('show');
    else bar.classList.remove('show');
  }

  function sendToWhatsApp() {
    if (!shopReady()) return;
    const items = window.NexoraShop.getCartItems ? window.NexoraShop.getCartItems() : [];
    if (!items.length) {
      if (typeof window.showToast === 'function') window.showToast('السلة فاضية', 'warn');
      return;
    }
    const total = window.NexoraShop.getCartTotal ? window.NexoraShop.getCartTotal() : 0;

    let msg = 'أهلاً 👋 عايز أشترك في:\n\n';
    items.forEach((it, i) => {
      const icon = it.type === 'pack' ? '📦' : '🎓';
      msg += (i + 1) + '. ' + icon + ' ' + it.title + '\n';
      msg += '   السعر: ' + fmt(it.price) + '\n\n';
    });
    msg += '━━━━━━━━━━━━━━\n';
    msg += '💰 *الإجمالي: ' + fmt(total) + '*\n\n';
    msg += 'مستني ردك للتفاصيل 🙏';

    const url = WA + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function refreshCatalog() {
    const section = qs('#view-catalog');
    if (!section) {
      ensureCatalogDOM();
      return;
    }
    const activeTab = section.querySelector('.nex-tab.active')?.dataset.nexTab || 'paid';
    section.innerHTML = buildCatalogViewHTML();
    const tab = section.querySelector(`[data-nex-tab="${activeTab}"]`);
    if (tab) {
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      section.querySelectorAll('[data-nex-panel]').forEach((p) =>
        p.classList.toggle('hidden', p.dataset.nexPanel !== activeTab));
    }
    /* ✅ لا نلمس __cartBound — الـ listener لسه مربوط */
    syncAllHearts();
    syncAllCartBtns();
    updateCartBar();
  }

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

  function showCatalog() {
    if (!qs('#view-catalog')) ensureCatalogDOM();
    qsa('main#content > section:not(#view-catalog)').forEach((s) => s.classList.add('hidden'));
    const cat = qs('#view-catalog');
    if (cat) cat.classList.remove('hidden');
    const t = qs('#pageTitle'), s = qs('#pageSub');
    if (t) t.textContent = 'الكورسات والباقات';
    if (s) s.textContent = 'اختار كورسك واشترك بالتقسيط';
    window.scrollTo(0, 0);
    updateCartBar();
    syncAllHearts();
    syncAllCartBtns();
  }

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

  function observeSideNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__catalogObserver) return;
    nav.__catalogObserver = new MutationObserver(() => {
      ensureNavEntries();
      bindCatalogNav();
    });
    nav.__catalogObserver.observe(nav, { childList: true });
  }

  function waitForDOM(retries = 50) {
    const main = qs('main#content') || qs('main');
    const nav = qs('#sideNav');
    if (main && nav) {
      console.info('[CATALOG] DOM جاهز — boot');
      boot();
      return;
    }
    if (retries <= 0) {
      console.warn('[CATALOG] ⚠️ DOM مش جاهز بعد 5 ثواني');
      boot();
      return;
    }
    setTimeout(() => waitForDOM(retries - 1), 100);
  }

  function boot() {
    ensureCatalogDOM();
    ensureNavEntries();
    bindCatalogNav();
    hookRenderSidebar();
    observeSideNav();
  }

  window.addEventListener('nexora:shop-ready', () => {
    console.info('[CATALOG] shop.js جاهز');
    if (!qs('#view-catalog')) ensureCatalogDOM();
    syncAllHearts();
    syncAllCartBtns();
    updateCartBar();
  });

  window.addEventListener('nexora:catalog-ready', () => {
    console.info('[CATALOG] بيانات Firestore جاهزة');
    if (!qs('#view-catalog')) ensureCatalogDOM();
    refreshCatalog();
  });

  window.addEventListener('nexora:catalog-update', () => {
    if (!qs('#view-catalog')) ensureCatalogDOM();
    refreshCatalog();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForDOM(), { once: true });
  } else {
    waitForDOM();
  }

  window.NexoraCatalog = {
    show: showCatalog,
    refresh: () => { refreshCatalog(); boot(); }
  };
})();