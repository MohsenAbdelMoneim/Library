/* ==========================================================
   orders.js — v18
   حجوزات الطالب + تأكيد المالك (تفعيل تلقائي للكورسات)
   ✅ v18: خصوصية — الطالب بينزّل حجوزاته هو بس (query مفلتر على السيرفر)
   ✅ v18: ترتيب في JS بدل orderBy — مفيش حجوزات بتختفي بصمت
   ✅ v18: onSnapshot — الطالب بيشوف التأكيد لحظيًا والمالك بيشوف الطلبات الجديدة لحظيًا
   ✅ v18: الباقات بتتحل من الكتالوج لو courseIds ناقصة + courseTitle في الenrollment
   ✅ v18: إخفاء #view-orders عند التنقل لأي فيو تاني (مفيش محتوى مزدوج)
   ✅ v18: حارس مالك على فيو الأدمن + إزالة أزرار الناف عند الخروج
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Orders — v18 ', 'background:#e8961e;color:#161204;font-weight:bold');

  if (typeof firebase === 'undefined') {
    console.error('[ORDERS] Firebase SDK مش محمّل');
    return;
  }

  const firebaseConfig = window.__FIREBASE_CONFIG__ || {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const OWNER_EMAIL = (window.__OWNER_EMAIL__) || 'owner@gymzone.com';

  /* ---------- أدوات ---------- */
  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('ar-EG-u-nu-latn') + ' جنيه';

  /* ✅ v18: تاريخ آمن */
  function fmtDate(iso) {
    const t = iso && Date.parse(iso);
    if (!Number.isFinite(t)) return '—';
    try { return new Date(t).toLocaleDateString('ar-EG-u-nu-latn'); }
    catch { return '—'; }
  }

  function notify(msg, type = 'info', duration = 4500) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type, { duration });
      return;
    }
    console.log('[ORDERS]', msg);
  }

  function askConfirm(opts) {
    if (typeof window.openConfirm === 'function') { window.openConfirm(opts); return; }
    if (window.confirm(opts.message)) opts.onConfirm();
  }

  let orders = [];
  let currentUser = null;
  let ordersUnsub = null;   /* ✅ v18: إدارة الاشتراك اللحظي */
  let activeView = null;    /* 'admin' | 'student' | null */

  const isOwnerUser = (user) =>
    !!user && (user.email === OWNER_EMAIL || (window.MCL && MCL.isAdminActive()));

  /* ✅ v18: عنوان كورس من الكتالوج (للـcourseTitle في الenrollment) */
  function courseTitleOf(courseId) {
    const src = window.__NEXORA_CATALOG__ || {};
    const c = (src.byId && src.byId[courseId]) ||
              (src.courses || []).find((x) => x.id === courseId);
    return c ? c.title : courseId;
  }

  /* ✅ v18: حل courseIds للباقة من الكتالوج لو العنصر ناقصها */
  function resolvePackCourseIds(packId) {
    const src = window.__NEXORA_CATALOG__ || {};
    const p = (src.packById && src.packById[packId]) ||
              (src.packages || []).find((x) => x.id === packId);
    return (p && Array.isArray(p.courseIds)) ? p.courseIds : [];
  }

  /* ✅ v18: ترتيب في JS — بدل orderBy اللي كان بيسقط وثائق بأنواع تواريخ مختلطة */
  function sortOrdersDesc(list) {
    return list.slice().sort((a, b) => {
      const ta = Date.parse(a.createdAt) || 0;
      const tb = Date.parse(b.createdAt) || 0;
      return tb - ta;
    });
  }

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
.od-btn[aria-busy="true"]{opacity:.6;pointer-events:none}
.od-empty{text-align:center;padding:44px;color:var(--dim,#66666f);font-size:13px}
@media (max-width:640px){
  .od-actions{flex-direction:column}
  .od-btn{width:100%}
  .od-head{gap:8px}
}
`;

  function ensureDOM() {
    if (qs('#view-orders')) return true;
    const main = qs('main#content') || qs('main');
    if (!main) {
      console.warn('[ORDERS] main#content مش موجود — هستنى…');
      return false;
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
    section.innerHTML = '<div class="od-wrap" id="ordersInner"></div>';
    main.appendChild(section);
    console.info('[ORDERS] ✅ #view-orders اتعمل');
    return true;
  }

  function statusChip(s) {
    const map = {
      pending:   ['بانتظار المراجعة ⏳', 'pending'],
      confirmed: ['مؤكد ومفعّل ✅', 'confirmed'],
      rejected:  ['مرفوض ❌', 'rejected']
    };
    const m = map[s] || map.pending;
    return '<span class="od-status ' + m[1] + '">' + m[0] + '</span>';
  }

  function itemsHTML(o) {
    if (!o.items || !o.items.length) return '—';
    return o.items.map((i) =>
      '• ' + (i.type === 'pack' ? '📦 باقة' : '🎓') + ' ' + esc(i.title) + ' — <b style="color:#4ade80">' + fmt(i.price) + '</b>'
    ).join('<br>');
  }

  /* ==========================================================
     ✅ v18: التحميل — كل واحد بينزّل اللي يخصه بس:
     الطالب: query مفلتر على السيرفر where userId==uid
     المالك: كل الحجوزات
     ========================================================== */
  function unsubscribeOrders() {
    if (ordersUnsub) { try { ordersUnsub(); } catch { /* تجاهل */ } ordersUnsub = null; }
  }

  function subscribeOrders(user) {
    unsubscribeOrders();

    if (!user) { orders = []; return; }

    if (isOwnerUser(user)) {
      /* المالك: كل الحجوزات — لحظيًا (بيشوف الطلبات الجديدة وهي نازلة) */
      ordersUnsub = db.collection('orders').onSnapshot((snap) => {
        orders = sortOrdersDesc(snap.docs.map((d) => ({ docId: d.id, ...d.data() })));
        if (activeView === 'admin') renderOwner();
      }, (err) => {
        console.warn('[ORDERS] استماع المالك:', err.code);
        notify('مش قادرين نتابع الحجوزات لحظيًا — راجع Firestore Rules', 'error');
      });
    } else {
      /* ✅ الطالب: حجوزاته هو بس — الفلترة على السيرفر مش في المتصفح */
      ordersUnsub = db.collection('orders')
        .where('userId', '==', user.uid)
        .onSnapshot((snap) => {
          orders = sortOrdersDesc(snap.docs.map((d) => ({ docId: d.id, ...d.data() })));
          if (activeView === 'student') renderStudent();
        }, (err) => {
          console.warn('[ORDERS] استماع الطالب:', err.code);
          if (err.code === 'permission-denied') {
            notify('مش قادرين نحمّل حجوزاتك — راجع Firestore Rules (orders: read own)', 'error', 8000);
          }
        });
    }
  }

  /* ---------- عرض المالك ---------- */
  function renderOwner() {
    const inner = qs('#ordersInner');
    if (!inner) return;
    const pending = orders.filter((o) => o.status === 'pending');
    const done = orders.filter((o) => o.status !== 'pending');
    inner.innerHTML =
      '<div style="padding:4px 0 16px">' +
        '<h2 style="font-size:20px;font-weight:800">الحجوزات 🧾</h2>' +
        '<p style="font-size:12.5px;color:var(--mut,#9c9cab);margin-top:4px">' +
          '«تأكيد وتفعيل» = إضافة كل كورسات الطلب لحساب الطالب فورًا — القايمة بتتحدث لحظيًا</p>' +
      '</div>' +
      (pending.length ? pending.map(orderAdminHTML).join('') : '<p class="od-empty">مفيش حجوزات جديدة.</p>') +
      (done.length ? '<h3 style="font-size:14px;font-weight:800;margin:22px 0 10px">سجل الحجوزات السابقة</h3>' + done.map(orderAdminHTML).join('') : '');
    /* ✅ مفيش bind فردي — الـdelegation مربوطة مرة واحدة */
  }

  function orderAdminHTML(o) {
    return '' +
    '<div class="od-card">' +
      '<div class="od-head">' +
        '<span class="od-name">' + esc(o.name || 'طالب') + '</span>' +
        '<span class="od-meta">' + esc(o.phone || '') + '</span>' +
        statusChip(o.status) +
        '<span class="od-meta" style="margin-inline-start:auto">' + fmtDate(o.createdAt) + '</span>' +
      '</div>' +
      '<div class="od-items">' + itemsHTML(o) + '</div>' +
      '<div class="od-total">الإجمالي: ' + fmt(o.totalCash || 0) + '</div>' +
      (o.status === 'pending' ?
      '<div class="od-actions">' +
        '<button type="button" class="od-btn ok" data-confirm="' + esc(o.docId) + '"><i class="bi bi-check2-circle"></i>تأكيد وتفعيل الكورسات</button>' +
        '<button type="button" class="od-btn no" data-reject="' + esc(o.docId) + '"><i class="bi bi-x-circle"></i>رفض</button>' +
      '</div>' : '') +
    '</div>';
  }

  /* ---------- عرض الطالب ---------- */
  function renderStudent() {
    const inner = qs('#ordersInner');
    if (!inner || !currentUser) return;
    const mine = orders; /* ✅ السيرفر فلترها أصلًا — مفيش فلترة متصفح */
    inner.innerHTML =
      '<div style="padding:4px 0 16px">' +
        '<h2 style="font-size:20px;font-weight:800">حجوزاتي 🧾</h2>' +
        '<p style="font-size:12.5px;color:var(--mut,#9c9cab);margin-top:4px">تابع حالة حجوزاتك هنا — أول ما الدفع يتأكد الكورسات تظهر في «حسابي» فورًا</p>' +
      '</div>' +
      (mine.length ? mine.map((o) =>
        '<div class="od-card">' +
          '<div class="od-head">' +
            '<span class="od-name">' + itemsOneLine(o) + '</span>' +
            statusChip(o.status) +
            '<span class="od-meta" style="margin-inline-start:auto">' + fmtDate(o.createdAt) + '</span>' +
          '</div>' +
          '<div class="od-total">الإجمالي: ' + fmt(o.totalCash || 0) + '</div>' +
        '</div>').join('')
      : '<p class="od-empty">مفيش حجوزات لسه — اختار كورس من «الكورسات والباقات» واضغط «أضف للسلة» 🛒</p>');
  }

  function itemsOneLine(o) {
    if (!o.items || !o.items.length) return '—';
    return o.items.map((i) => esc(i.title)).join(' + ');
  }

  /* ---------- Event Delegation (مرة واحدة) ---------- */
  function bindInnerEvents() {
    const inner = qs('#ordersInner');
    if (!inner || inner.__odBound) return;
    inner.__odBound = true;

    inner.addEventListener('click', (e) => {
      const c = e.target.closest('[data-confirm]');
      if (c) { confirmOrder(c.dataset.confirm); return; }
      const r = e.target.closest('[data-reject]');
      if (r) { rejectOrder(r.dataset.reject); return; }
    });
  }

  /* ---------- تأكيد الطلب ---------- */
  function confirmOrder(docId) {
    /* ✅ v18: حارس — التأكيد للمالك بس */
    if (!isOwnerUser(currentUser)) { notify('العملية دي لوضع المالك فقط.', 'error'); return; }

    const o = orders.find((x) => x.docId === docId);
    if (!o || o.status !== 'pending') return;

    askConfirm({
      title: 'تأكيد الحجز',
      message: 'تأكيد حجز «' + (o.name || 'طالب') + '»؟ هيتم تفعيل كل كورسات الطلب على حسابه فورًا.',
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

      /* ✅ v18: حل courseIds مع fallback للكتالوج —
         قبل كده باقة من غير courseIds كانت بتتأكد من غير تفعيل أي كورس بصمت! */
      const courseIds = [];
      let unresolvable = 0;
      (o.items || []).forEach((i) => {
        if (i.type === 'course') {
          if (i.id) courseIds.push(i.id);
        } else if (i.type === 'pack') {
          const ids = (Array.isArray(i.courseIds) && i.courseIds.length)
            ? i.courseIds
            : resolvePackCourseIds(i.id);
          if (ids.length) courseIds.push(...ids);
          else unresolvable++;
        }
      });

      if (!courseIds.length) {
        notify('⚠️ معرفناش نحدد كورسات من الطلب — راجع عناصره قبل التأكيد. الحجز لسه معلّق.', 'error', 9000);
        return;
      }
      if (unresolvable) {
        console.warn('[ORDERS]', unresolvable, 'باقة مفيش ليها courseIds في الكتالوج');
      }

      const batch = db.batch();
      const seen = new Set();
      let added = 0;
      courseIds.forEach((cid) => {
        if (active.has(cid) || seen.has(cid)) return;
        seen.add(cid);
        added++;
        const ref = db.collection('enrollments').doc();
        batch.set(ref, {
          userId: o.userId,
          courseId: cid,
          courseTitle: courseTitleOf(cid),   /* ✅ v18: عشان profile.html يعرض الاسم مش الـID */
          status: 'active',
          enrolledAt: new Date().toISOString(),
          expiresAt: null,
          paymentType: 'cash', paymentStatus: 'paid',
          paidInstallments: 0, notes: 'حجز #' + docId.slice(0, 6)
        });
      });
      batch.update(db.collection('orders').doc(docId), {
        status: 'confirmed', confirmedAt: new Date().toISOString()
      });
      await batch.commit();

      console.info('[ORDERS] ✅ اتأكد —', added, 'كورس جديد اتفعّل (',
        courseIds.length - added, 'كانوا مفعّلين بالفعل )');
      notify('تم التأكيد — ' + added + ' كورس ظهروا لحساب الطالب ✅', 'success');
      /* الـsnapshot هيحدّث القايمة لوحده */
    } catch (e) {
      console.error('[ORDERS]', e.code);
      notify(e.code === 'permission-denied'
        ? 'السحابة رفضت التفعيل — راجع Firestore Rules على enrollments'
        : 'فشل التأكيد: ' + e.code, 'error', 8000);
    }
  }

  /* ---------- رفض الطلب ---------- */
  function rejectOrder(docId) {
    if (!isOwnerUser(currentUser)) { notify('العملية دي لوضع المالك فقط.', 'error'); return; }
    askConfirm({
      title: 'رفض الحجز',
      message: 'رفض الحجز ده؟ يُفضّل تكلّم الطالب على واتساب لتوضيح السبب.',
      confirmLabel: 'رفض الحجز',
      danger: true,
      onConfirm: async () => {
        try {
          await db.collection('orders').doc(docId).update({
            status: 'rejected', rejectedAt: new Date().toISOString()
          });
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

    const ownerNow = isOwnerUser(currentUser);
    const studentNow = currentUser && currentUser.email !== OWNER_EMAIL;

    /* ✅ v18: البند بيتشال لو الحالة اتغيرت (خروج/تغيير صلاحيات) */
    const adminBtn = qs('[data-nav="view:orders-admin"]');
    if (ownerNow && !adminBtn) {
      const anchor = qs('[data-nav="view:admin"]') || qs('[data-nav="view:data"]');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.nav = 'view:orders-admin';
      btn.className = 'nav-item';
      btn.innerHTML = '<i class="bi bi-receipt text-[13.5px] w-4 text-center shrink-0 text-accent" aria-hidden="true"></i>' +
                      '<span class="grow text-start truncate">الحجوزات</span>';
      if (anchor) anchor.after(btn);
      else nav.appendChild(btn);
    } else if (!ownerNow && adminBtn) {
      adminBtn.remove();
    }

    const mineBtn = qs('[data-nav="view:orders-mine"]');
    if (studentNow && !mineBtn) {
      const me = qs('[data-nav="view:student"]');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.nav = 'view:orders-mine';
      btn.className = 'nav-item';
      btn.innerHTML = '<i class="bi bi-receipt-cutoff text-[13.5px] w-4 text-center shrink-0" aria-hidden="true"></i>' +
                      '<span class="grow text-start truncate">حجوزاتي</span>';
      if (me) me.after(btn);
      else nav.appendChild(btn);
    } else if (!studentNow && mineBtn) {
      mineBtn.remove();
    }
  }

  function showOrders(mode) {
    /* ✅ v18: حارس — فيو الأدمن للمالك بس */
    if (mode === 'admin' && !isOwnerUser(currentUser)) mode = 'student';

    if (!qs('#view-orders')) ensureDOM();
    qsa('main#content > section:not(#view-orders)').forEach((s) => s.classList.add('hidden'));
    const view = qs('#view-orders');
    if (view) view.classList.remove('hidden');
    const isOwnerView = mode === 'admin';
    activeView = mode;
    const pt = qs('#pageTitle'); if (pt) pt.textContent = isOwnerView ? 'الحجوزات' : 'حجوزاتي';
    const ps = qs('#pageSub');   if (ps) ps.textContent = isOwnerView ? 'مراجعة وتفعيل طلبات الاشتراك' : 'حالة حجوزاتك';
    window.scrollTo(0, 0);
    const sb = qs('#sidebar'); if (sb) sb.classList.remove('open');
    const ov = qs('#overlay'); if (ov) ov.classList.add('hidden');

    if (isOwnerView) renderOwner();
    else renderStudent();
    /* البيانات نفسها بتيجي من الـsnapshot اللحظي */
  }

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

  /* ✅ v18: الخروج من فيو الحجوزات لأي فيو تاني → نخبيه
     (app.js v19 مش بيعرف #view-orders فكان بيفضل ظاهر جنب المكتبة) */
  function bindGlobalNavWatch() {
    if (document.__ordersNavWatch) return;
    document.__ordersNavWatch = true;
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav]');
      if (!b) return;
      const v = b.dataset.nav || '';
      if (v.indexOf('view:orders') === 0) return; /* فيو تبعنا */
      const sec = qs('#view-orders');
      if (sec) sec.classList.add('hidden');
      if (activeView) activeView = null;
    }, true);
  }

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

  function observeAdminState() {
    const chip = qs('#adminChip');
    if (!chip) {
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

  function observeSideNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__ordersObserver) return;
    nav.__ordersObserver = new MutationObserver(() => {
      ensureNav();
      bindOrdersNav();
    });
    nav.__ordersObserver.observe(nav, { childList: true });
  }

  function boot() {
    ensureDOM();
    bindInnerEvents();     /* ✅ v18 */
    bindGlobalNavWatch();  /* ✅ v18 */
    installHook();
    ensureNav();
    bindOrdersNav();
    observeAdminState();
    observeSideNav();
  }

  function waitForDOM(retries = 50) {
    const main = qs('main#content') || qs('main');
    const nav = qs('#sideNav');
    if (main && nav) {
      console.info('[ORDERS] DOM جاهز — boot');
      boot();
      return;
    }
    if (retries <= 0) {
      console.warn('[ORDERS] ⚠️ DOM مش جاهز — boot');
      boot();
      return;
    }
    setTimeout(() => waitForDOM(retries - 1), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForDOM(), { once: true });
  } else {
    waitForDOM();
  }

  auth.onAuthStateChanged((user) => {
    currentUser = user;
    ensureNav();
    bindOrdersNav();
    /* ✅ v18: اشتراك لحظي حسب الدور — الطالب حجوزاته بس، المالك الكل */
    subscribeOrders(user);
    if (!user && activeView) {
      const sec = qs('#view-orders');
      if (sec) sec.classList.add('hidden');
      activeView = null;
    }
  });

  window.NexoraOrders = {
    show: showOrders,
    get count() { return orders.length; },
    get pendingCount() { return orders.filter((o) => o.status === 'pending').length; }
  };
})();