/* ==========================================================
   orders.js — v16.1
   حجوزات الطالب: المالك يراجع ويؤكد (تفعيل تلقائي للكورسات)
   والطالب يتابع حالة حجوزه
   إصلاحات: setInterval→MutationObserver، confirm/alert→openConfirm
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Orders — v16.1 ', 'background:#e8961e;color:#161204;font-weight:bold');

  /* ✅ فحص Firebase */
  if (typeof firebase === 'undefined') {
    console.error('[ORDERS] Firebase SDK مش محمّل');
    return;
  }

  /* ⚠️ انقل المفاتيح لملف config خارجي */
  const firebaseConfig = window.__FIREBASE_CONFIG__ || {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const auth = firebase.auth();
  const db = firebase.firestore();
  const OWNER_EMAIL = (window.__OWNER_EMAIL__) || 'owner@gymzone.com';

  /* ---------- أدوات مساعدة ---------- */
  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('ar-EG-u-nu-latn') + ' جنيه';
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('ar-EG-u-nu-latn') : '—';

  /* ✅ مساعد آمن */
  function on(sel, evt, fn, opts) {
    const el = typeof sel === 'string' ? qs(sel) : sel;
    if (el) el.addEventListener(evt, fn, opts);
    else console.warn('[ORDERS][WIRE] عنصر غير موجود:', sel);
    return el;
  }

  /* ✅ مساعد تأكيد — يستخدم openConfirm لو موجودة */
  function askConfirm(opts) {
    if (typeof window.openConfirm === 'function') {
      window.openConfirm(opts);
      return;
    }
    /* fallback */
    if (window.confirm(opts.message)) opts.onConfirm();
  }

  /* ✅ مساعد إشعار — يستخدم showToast لو موجودة */
  function notify(msg, type = 'info', duration = 4500) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type, { duration });
      return;
    }
    console.log('[ORDERS]', msg);
  }

  let orders = [];
  let currentUser = null;

  const STYLES = `
.od-wrap{max-width:900px;margin:0 auto}
.od-card{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:16px;padding:16px 18px;margin-bottom:12px}
.od-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:10px}
.od-name{font-size:14px;font-weight:800}
.od-meta{font-size:11px;color:var(--mut,#9c9cab);direction:ltr}
.od-status{font-size:10.5px;font-weight:700;padding:3px 12px;border-radius:999px}
.od-status.pending{color:#f0b53e;background:rgba(240,181,62,.1);border:1px solid rgba(240,181,62,.3)}
.od-status.confirmed{color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3)}
.od-status.rejected{color:#f4636e;background:rgba(229,72,77,.1);border:1px solid rgba(229,72,77,.3)}
.od-items{font-size:12.5px;color:var(--mut,#9c9cab);line-height:2;background:var(--bg,#0a0a0d);border:1px solid var(--edge,#212129);border-radius:12px;padding:10px 14px;margin:8px 0}
.od-total{font-size:15px;font-weight:800;color:#4ade80}
.od-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.od-btn{height:40px;padding:0 18px;border-radius:10px;border:none;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.od-btn.ok{background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff}
.od-btn.no{background:rgba(229,72,77,.12);border:1px solid rgba(229,72,77,.4);color:#f4636e}
.od-empty{text-align:center;padding:44px;color:var(--dim,#66666f);font-size:13px}
@media (max-width:640px){
  .od-actions{flex-direction:column}
  .od-btn{width:100%}
  .od-head{gap:8px}
}
`;

  function ensureDOM() {
    if (qs('#view-orders')) return;
    const main = qs('main#content') || qs('main');
    if (!main) {
      console.warn('[ORDERS] main#content مش موجود — مش هيتضاف');
      return;
    }
    if (!document.getElementById('nexOrdersStyles')) {
      const st = document.createElement('style');
      st.id = 'nexOrdersStyles';
      st.textContent = STYLES;
      document.head.appendChild(st);
    }
    const section = document.createElement('section');
    section.id = 'view-orders';
    section.className = 'hidden';
    section.setAttribute('aria-label', 'الحجوزات');
    section.innerHTML = `<div class="od-wrap" id="ordersInner"></div>`;
    main.appendChild(section);
  }

  async function loadOrders() {
    try {
      const snap = await db.collection('orders').orderBy('createdAt', 'desc').get();
      orders = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
    } catch (e) {
      console.warn('[ORDERS]', e.code);
      orders = [];
    }
  }

  function statusChip(s) {
    const map = {
      pending:   ['بانتظار المراجعة ⏳', 'pending'],
      confirmed: ['مؤكد ومفعّل ✅', 'confirmed'],
      rejected:  ['مرفوض ❌', 'rejected']
    };
    const m = map[s] || map.pending;
    return `<span class="od-status ${m[1]}">${m[0]}</span>`;
  }

  function itemsHTML(o) {
    return o.items.map((i) =>
      `• ${i.type === 'pack' ? '📦 باقة' : '🎓'} ${esc(i.title)} — <b style="color:#4ade80">${fmt(i.price)}</b>`
    ).join('<br>');
  }

  /* ---------- عرض المالك ---------- */
  function renderOwner() {
    const inner = qs('#ordersInner');
    if (!inner) return;
    const pending = orders.filter((o) => o.status === 'pending');
    const done = orders.filter((o) => o.status !== 'pending');
    inner.innerHTML = `
    <div style="padding:4px 0 16px">
      <h2 style="font-size:20px;font-weight:800">الحجوزات 🧾</h2>
      <p style="font-size:12.5px;color:var(--mut,#9c9cab);margin-top:4px">
        "تأكيد وتفعيل" = إضافة كل كورسات الطلب لحساب الطالب فورًا</p>
    </div>
    ${pending.length ? pending.map(orderAdminHTML).join('') : '<p class="od-empty">مفيش حجوزات جديدة.</p>'}
    ${done.length ? `<h3 style="font-size:14px;font-weight:800;margin:22px 0 10px">سجل الحجوزات السابقة</h3>${done.map(orderAdminHTML).join('')}` : ''}`;

    qsa('#ordersInner [data-confirm]').forEach((b) =>
      b.addEventListener('click', () => confirmOrder(b.dataset.confirm)));
    qsa('#ordersInner [data-reject]').forEach((b) =>
      b.addEventListener('click', () => rejectOrder(b.dataset.reject)));
  }

  function orderAdminHTML(o) {
    return `
    <div class="od-card">
      <div class="od-head">
        <span class="od-name">${esc(o.name || 'طالب')}</span>
        <span class="od-meta">${esc(o.phone || '')}</span>
        ${statusChip(o.status)}
        <span class="od-meta" style="margin-inline-start:auto">${fmtDate(o.createdAt)}</span>
      </div>
      <div class="od-items">${itemsHTML(o)}</div>
      <div class="od-total">الإجمالي: ${fmt(o.totalCash)}</div>
      ${o.status === 'pending' ? `
      <div class="od-actions">
        <button type="button" class="od-btn ok" data-confirm="${esc(o.docId)}"><i class="bi bi-check2-circle" aria-hidden="true"></i>تأكيد وتفعيل الكورسات</button>
        <button type="button" class="od-btn no" data-reject="${esc(o.docId)}"><i class="bi bi-x-circle" aria-hidden="true"></i>رفض</button>
      </div>` : ''}
    </div>`;
  }

  /* ---------- عرض الطالب ---------- */
  function renderStudent() {
    const inner = qs('#ordersInner');
    if (!inner || !currentUser) return;
    const mine = orders.filter((o) => o.userId === currentUser.uid);
    inner.innerHTML = `
    <div style="padding:4px 0 16px">
      <h2 style="font-size:20px;font-weight:800">حجوزاتي 🧾</h2>
      <p style="font-size:12.5px;color:var(--mut,#9c9cab);margin-top:4px">تابع حالة حجوزاتك هنا — بعد تأكيد الدفع الكورسات تظهر في "حسابي"</p>
    </div>
    ${mine.length ? mine.map((o) => `
      <div class="od-card">
        <div class="od-head">
          <span class="od-name">${itemsOneLine(o)}</span>
          ${statusChip(o.status)}
          <span class="od-meta" style="margin-inline-start:auto">${fmtDate(o.createdAt)}</span>
        </div>
        <div class="od-total">الإجمالي: ${fmt(o.totalCash)}</div>
      </div>`).join('')
    : '<p class="od-empty">مفيش حجوزات لسه — اختار كورس من "الكورسات والباقات" واضغط "أضف للسلة" 🛒</p>'}`;
  }

  function itemsOneLine(o) {
    return o.items.map((i) => esc(i.title)).join(' + ');
  }

  /* ---------- تأكيد الطلب ---------- */
  function confirmOrder(docId) {
    const o = orders.find((x) => x.docId === docId);
    if (!o || o.status !== 'pending') return;

    askConfirm({
      title: 'تأكيد الحجز',
      message: `تأكيد حجز «${o.name}»؟ هيتم تفعيل كل كورسات الطلب على حسابه فورًا.`,
      confirmLabel: 'تأكيد وتفعيل',
      danger: false,
      onConfirm: () => performConfirmOrder(o)
    });
  }

  async function performConfirmOrder(o) {
    const docId = o.docId;
    try {
      /* الاشتراكات الفعالة حاليًا — لمنع التكرار */
      const existing = await db.collection('enrollments')
        .where('userId', '==', o.userId).where('status', '==', 'active').get();
      const active = new Set(existing.docs.map((d) => d.data().courseId));

      const courseIds = [];
      o.items.forEach((i) => {
        if (i.type === 'course') courseIds.push(i.id);
        else if (i.type === 'pack' && Array.isArray(i.courseIds)) courseIds.push(...i.courseIds);
      });

      const batch = db.batch();
      courseIds.forEach((cid) => {
        if (active.has(cid)) return;
        const ref = db.collection('enrollments').doc();
        batch.set(ref, {
          userId: o.userId, courseId: cid, status: 'active',
          enrolledAt: new Date().toISOString(), expiresAt: null,
          paymentType: 'cash', paymentStatus: 'paid',
          paidInstallments: 0, notes: 'حجز #' + docId.slice(0, 6)
        });
      });
      batch.update(db.collection('orders').doc(docId), {
        status: 'confirmed', confirmedAt: new Date().toISOString()
      });
      await batch.commit();

      console.info('[ORDERS] ✅ الحجز اتأكد والكورسات اتفعّلت');
      await loadOrders();
      renderOwner();
      notify('تم التأكيد — الكورسات ظهرت لحساب الطالب ✅', 'success');
    } catch (e) {
      console.error('[ORDERS]', e.code);
      notify('فشل التأكيد: ' + e.code, 'error');
    }
  }

  /* ---------- رفض الطلب ---------- */
  function rejectOrder(docId) {
    askConfirm({
      title: 'رفض الحجز',
      message: 'رفض الحجز ده؟ الطالب هيتشاور معاه بشكل منفصل.',
      confirmLabel: 'رفض الحجز',
      danger: true,
      onConfirm: async () => {
        try {
          await db.collection('orders').doc(docId).update({
            status: 'rejected', rejectedAt: new Date().toISOString()
          });
          await loadOrders();
          renderOwner();
          notify('تم رفض الحجز', 'warn');
        } catch (e) {
          notify('فشل الرفض: ' + e.code, 'error');
        }
      }
    });
  }

  /* ---------- بند القايمة ---------- */
  function ensureNav() {
    const nav = qs('#sideNav');
    if (!nav) return;

    const isOwner = window.MCL && MCL.isAdminActive();
    const isStudent = currentUser && currentUser.email !== OWNER_EMAIL;

    if (isOwner && !qs('[data-nav="view:orders-admin"]')) {
      const anchor = qs('[data-nav="view:admin"]') || qs('[data-nav="view:data"]');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.nav = 'view:orders-admin';
      btn.className = 'nav-item';
      btn.innerHTML = '<i class="bi bi-receipt text-[13.5px] w-4 text-center shrink-0 text-accent" aria-hidden="true"></i>' +
                      '<span class="grow text-start truncate">الحجوزات</span>';
      if (anchor) anchor.after(btn);
      else nav.appendChild(btn);
    }

    if (isStudent && !qs('[data-nav="view:orders-mine"]')) {
      const me = qs('[data-nav="view:student"]');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.nav = 'view:orders-mine';
      btn.className = 'nav-item';
      btn.innerHTML = '<i class="bi bi-receipt-cutoff text-[13.5px] w-4 text-center shrink-0" aria-hidden="true"></i>' +
                      '<span class="grow text-start truncate">حجوزاتي</span>';
      if (me) me.after(btn);
      else nav.appendChild(btn);
    }
  }

  function showOrders(mode) {
    qsa('main#content > section:not(#view-orders)').forEach((s) => s.classList.add('hidden'));
    const view = qs('#view-orders');
    if (view) view.classList.remove('hidden');
    const isOwnerView = mode === 'admin';
    const pt = qs('#pageTitle'); if (pt) pt.textContent = isOwnerView ? 'الحجوزات' : 'حجوزاتي';
    const ps = qs('#pageSub');   if (ps) ps.textContent = isOwnerView ? 'مراجعة وتفعيل طلبات الاشتراك' : 'حالة حجوزاتك';
    window.scrollTo(0, 0);
    const sb = qs('#sidebar'); if (sb) sb.classList.remove('open');
    const ov = qs('#overlay'); if (ov) ov.classList.add('hidden');
    loadOrders().then(() => { isOwnerView ? renderOwner() : renderStudent(); });
  }

  /* ✅ listener واحد على #sideNav بدل document */
  function bindOrdersNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__ordersNavBound) return;
    nav.__ordersNavBound = true;
    nav.addEventListener('click', (e) => {
      const a = e.target.closest('[data-nav="view:orders-admin"]');
      const m = e.target.closest('[data-nav="view:orders-mine"]');
      if (!a && !m) return;
      e.preventDefault();
      showOrders(a ? 'admin' : 'student');
    });
  }

  /* ✅ إعادة حقن البنود بعد كل رسم للسايدبار */
  function installHook() {
    if (window.__ordersSidebarHooked) return;
    if (typeof window.renderSidebar !== 'function') return;
    window.__ordersSidebarHooked = true;
    const orig = window.renderSidebar;
    window.renderSidebar = function () {
      try { orig(); } catch (e) { console.error('[ORDERS] renderSidebar:', e); }
      ensureNav();
      bindOrdersNav();
    };
  }

  /* ✅ MutationObserver بدل setInterval كل ثانيتين */
  function observeAdminState() {
    /* نراقب تغيّر adminChip في الهيدر */
    const chip = qs('#adminChip');
    if (!chip) {
      /* fallback: polling أبطأ (10 ثواني) */
      setInterval(() => {
        if (window.MCL && MCL.isAdminActive()) {
          ensureNav();
          bindOrdersNav();
        }
      }, 10000);
      return;
    }
    const observer = new MutationObserver(() => {
      ensureNav();
      bindOrdersNav();
    });
    observer.observe(chip, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- التشغيل ---------- */
    /* ---------- التشغيل ---------- */
  function boot() {
    ensureDOM();

    /* الهوك والبنود: مؤجّلين لحد ما app.js يعرّف renderSidebar ويملأ sideNav */
    let waited = 0;
    const readyTimer = setInterval(() => {
      waited++;
      const ready = typeof window.renderSidebar === 'function' && qs('#sideNav')?.children.length;
      if (ready || waited > 100) {   /* أمان: 10 ثواني كحد أقصى */
        clearInterval(readyTimer);
        installHook();
        ensureNav();
        bindOrdersNav();
      }
    }, 100);

    auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      installHook();
      ensureNav();
      bindOrdersNav();
      if (user && user.email !== OWNER_EMAIL) await loadOrders();
    });

    observeAdminState();

    /* مراقبة السايدبار للتغييرات */
    const tryNav = setInterval(() => {
      const nav = qs('#sideNav');
      if (!nav) return;
      clearInterval(tryNav);
      if (!nav.__ordersObserver) {
        nav.__ordersObserver = new MutationObserver(() => {
          ensureNav();
          bindOrdersNav();
        });
        nav.__ordersObserver.observe(nav, { childList: true });
      }
    }, 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();