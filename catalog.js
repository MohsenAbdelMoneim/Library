/* ==========================================================
   catalog.js — v15.1
   صفحات الكورسات المدفوعة + الباقات + عرض الأسعار
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Catalog — v15.1 ', 'background:#7c5cff;color:#fff;font-weight:bold');

  const PAID = [
    { id: 'frontend-diploma',   title: 'Frontend Diploma',        category: 'Frontend',      cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'تعلم تطوير واجهات المواقع باحتراف من الصفر للاحتراف.' },
    { id: 'backend-course',     title: 'Backend Course',          category: 'Backend',       cashPrice: 2000, installmentAmount: 525,  installmentCount: 4, installmentTotal: 2100, description: 'ابنِ الخدمات الخلفية وقواعد البيانات باحتراف.' },
    { id: 'uiux-course',        title: 'UI/UX Course',            category: 'UI/UX',         cashPrice: 1500, installmentAmount: 400,  installmentCount: 4, installmentTotal: 1600, description: 'تصميم تجارب وواجهات استخدام عصرية.' },
    { id: 'mobile-app-course',  title: 'Mobile App Course',       category: 'Mobile App',    cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'تطوير تطبيقات الموبايل خطوة بخطوة.' },
    { id: 'data-diploma',       title: 'Data Analysis Diploma',   category: 'Data Analysis', cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'تحليل البيانات واتخاذ القرار بالأرقام.' },
    { id: 'ai-ds-ml',           title: 'AI / Data Science / ML',  category: 'AI',            cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'الذكاء الاصطناعي وعلم البيانات وتعلم الآلة.' },
    { id: 'cyber-course',       title: 'Cyber Security Course',   category: 'Cyber Security',cashPrice: 2999, installmentAmount: 775,  installmentCount: 4, installmentTotal: 3100, description: 'أساسيات وعمق الأمن السيبراني.' },
    { id: 'media-buying',       title: 'Media Buying Course',     category: 'Other',         cashPrice: 2000, installmentAmount: 525,  installmentCount: 4, installmentTotal: 2100, description: 'الإعلانات الممولة وإدارة الحملات.' },
    { id: 'fullstack-diploma',  title: 'Full Stack Diploma',      category: 'Full Stack',    cashPrice: 4500, installmentAmount: 1150, installmentCount: 4, installmentTotal: 4600, description: 'الواجهة والخلفية في دبلومة واحدة شاملة.' }
  ];

  const PACKS = [
    { id: 'starter-pack',      title: 'Starter Pack',      count: 2, courses: ['Frontend Diploma','UI/UX Course'],            cashPrice: 3500, installmentAmount: 875,  installmentCount: 4, installmentTotal: 3500,  featured: false },
    { id: 'developer-pack',    title: 'Developer Pack',    count: 4, courses: ['Frontend Diploma','Backend Course','UI/UX Course','Git & GitHub'], cashPrice: 6000, installmentAmount: 1500, installmentCount: 4, installmentTotal: 6000,  featured: false },
    { id: 'professional-pack', title: 'Professional Pack', count: 6, courses: ['Frontend Diploma','Backend Course','Mobile App Course','Data Analysis Diploma','UI/UX Course','Media Buying Course'], cashPrice: 7999, installmentAmount: 2000, installmentCount: 4, installmentTotal: 8000, featured: false },
    { id: 'tech-master-pack',  title: 'Tech Master Pack',  count: 9, courses: ['Frontend Diploma','Backend Course','Full Stack Diploma','Mobile App Course','Data Analysis Diploma','AI / Data Science / ML','Cyber Security Course','UI/UX Course','Media Buying Course'], cashPrice: 9999, installmentAmount: 2500, installmentCount: 4, installmentTotal: 10000, featured: true }
  ];

  const PHONE = '01096295395';
  const WA = 'https://wa.me/201096295395';
  const fmt = (n) => Number(n).toLocaleString('ar-EG-u-nu-latn') + ' جنيه';

  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* ---------- أنماط الكتالوج ---------- */
  const STYLES = `
.nex-catalog{max-width:1100px;margin:0 auto}
.nex-tabs{display:flex;gap:8px;margin-bottom:20px;overflow-x:auto;padding-bottom:2px}
.nex-tab{white-space:nowrap;padding:10px 18px;border-radius:12px;border:1px solid var(--edge,#212129);background:var(--panel,#101015);color:var(--mut,#9c9cab);font-size:13px;font-weight:600;cursor:pointer;transition:.15s}
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
.nex-buy{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:44px;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff;font-size:13.5px;font-weight:700;text-decoration:none;transition:.15s;border:none;cursor:pointer}
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
      <span class="nex-cat">${esc(c.category)}</span>
      <h3 class="nex-title">${esc(c.title)}</h3>
      <p class="nex-desc">${esc(c.description)}</p>
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
          <a class="nex-buy" href="${WA}?text=${encodeURIComponent('أهلاً 👋 عايز أشترك في ' + c.title)}" target="_blank" rel="noopener noreferrer">اشترك الآن</a>
        </div>
        <p class="nex-contact">للاستفسار عن التقسيط: <a href="tel:${PHONE}" dir="ltr">${PHONE}</a></p>
      </div>
    </article>`;
  }

  function packCardHTML(p) {
    return `
    <article class="nex-card ${p.featured ? 'featured' : ''}">
      ${p.featured ? '<span class="nex-badge-top">الباقة الأشمل</span>' : ''}
      <span class="nex-cat">${p.count} كورسات</span>
      <h3 class="nex-title">${esc(p.title)}</h3>
      <div class="nex-pack-list">${p.courses.map((t) => '✓ ' + esc(t)).join('<br>')}</div>
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
          <a class="nex-buy ${p.featured ? 'gold' : ''}" href="${WA}?text=${encodeURIComponent('أهلاً 👋 عايز أشترك في ' + p.title)}" target="_blank" rel="noopener noreferrer">اشترك في الباقة</a>
        </div>
        <p class="nex-contact">التقسيط متاح — <a href="tel:${PHONE}" dir="ltr">تواصل معنا</a></p>
      </div>
    </article>`;
  }

  function buildCatalogViewHTML() {
    const tabs = `
      <div class="nex-tabs" role="tablist">
        <button class="nex-tab active" data-nex-tab="paid" role="tab">الكورسات المدفوعة</button>
        <button class="nex-tab" data-nex-tab="packs" role="tab">الباقات المميزة</button>
      </div>`;
    const paidGrid = `<div class="nex-grid" data-nex-panel="paid">${PAID.map(courseCardHTML).join('')}</div>`;
    const packsGrid = `<div class="nex-grid hidden" data-nex-panel="packs">${PACKS.map(packCardHTML).join('')}</div>`;
    return `<div class="nex-catalog">${tabs}${paidGrid}${packsGrid}</div>`;
  }

  function ensureCatalogDOM() {
    if (qs('#view-catalog')) return;
    const main = qs('main#content') || qs('main');
    if (!main) return;

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
      qsa('#view-catalog .nex-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      qsa('#view-catalog [data-nex-panel]').forEach((p) =>
        p.classList.toggle('hidden', p.dataset.nexPanel !== tab.dataset.nexTab));
    });
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
    btn.innerHTML = '<i class="bi bi-mortarboard text-[13.5px] w-4 text-center shrink-0"></i>' +
                    '<span class="grow text-start truncate">الكورسات والباقات</span>';
    if (filesBtn) filesBtn.after(btn);
    else nav.appendChild(btn);
  }

  /* ---------- تكامل مع نظام العرض — بطريقة قوية ضد توقيت التحميل ----------
     بدل تعديل window.applyViewVisibility / window.switchView (اللي ممكن يلقطهم
     undefined لو التوقيت اتفلسف)، بنستمع على مستوى الصفحة لأي كليك على بند
     الكتالوج، وبنطبق العرض بأنفسنا — مفيش اعتماد على دوال app.js خالص. */
  function showCatalog() {
    qsa('main#content > section:not(#view-catalog)').forEach((s) => s.classList.add('hidden'));
    const cat = qs('#view-catalog');
    if (cat) cat.classList.remove('hidden');
    const t = qs('#pageTitle'), s = qs('#pageSub');
    if (t) t.textContent = 'الكورسات والباقات';
    if (s) s.textContent = 'اختار كورسك واشترك بالتقسيط';
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-nav="view:catalog"]');
    if (!b) return;
    e.stopPropagation();      /* نمنع app.js يشتغل على نفس البند */
    e.preventDefault();
    showCatalog();
    qs('#sidebar')?.classList.remove('open');
    qs('#overlay')?.classList.add('hidden');
  }, true); /* capture phase — بنشتغل قبل app.js */

  /* لما app.js يرسم السايدبار تاني، نرجّع بندنا */
   function boot() {
    ensureCatalogDOM();
    ensureNavEntries();
    /* هوك السايدبار — مؤجَّل لحد ما app.js يعرّف renderSidebar */
    if (!window.__catSidebarHooked) {
      const orig = window.renderSidebar;
      if (typeof orig === 'function') {
        window.__catSidebarHooked = true;
        window.renderSidebar = function () {
          orig();
          ensureNavEntries();
        };
      }
    }
  }

  /* ---------- تشغيل (مؤجَّل لحد ما app.js يكون موجود) ---------- */
  function boot() {
    ensureCatalogDOM();
    ensureNavEntries();
  }

  /* التوقيت: سكربت catalog بيحمل قبل app.js، فنستنى الأول بتاعه */
  function waitForApp(tries) {
    if (window.__nexoraAppReady || typeof window.init === 'function' || document.readyState !== 'loading') {
      boot();
      return;
    }
    if (tries <= 0) { boot(); return; } /* أمان — نشغل على أي حال */
    setTimeout(() => waitForApp(tries - 1), 60);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForApp(50));
  } else {
    waitForApp(50);
  }
})();