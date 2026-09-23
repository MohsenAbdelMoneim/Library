/* ==========================================================
   admin.js — v18
   لوحة إدارة Nexora: الطلاب + الاشتراكات + حالة الدفع
   ✅ v18: إصلاح قاتل وضع المالك — الجارد بقى transition-based
          (بيشتغل بس لما مستخدم Firebase يسجّل خروج فعلي،
          مش عند فتح الصفحة — الباسورد-مود بقى عايش بعد reload)
   ✅ v18: إخفاء #view-admin عند التنقل لغيره (مفيش محتوى مزدوج)
   ✅ v18: addEnrollment بكورس courseTitle + فحص التكرار عند إعادة التفعيل
   ✅ v18: حالة تحميل/خطأ مع retry — مفيش «مفيش طلاب» الكاذبة
   ✅ v18: Event Delegation + expiresAt null + حماية تعديلات المستخدم
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Admin — v18 ', 'background:#e8961e;color:#161204;font-weight:bold');

  if (typeof firebase === 'undefined') {
    console.error('[ADMIN] Firebase SDK مش محمّل');
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

  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ---------- الكتالوج ---------- */
  function getCatalogMap() {
    const src = window.__NEXORA_CATALOG__ || { courses: [] };
    const map = {};
    (src.courses || []).forEach((c) => {
      if (c && c.id && c.title) map[c.id] = c.title;
    });
    return map;
  }
  let PAID_CATALOG = getCatalogMap();

  const isAdmin = () => !!(window.MCL && typeof MCL.isAdminActive === 'function' && MCL.isAdminActive());

  function toast(msg, type, dur) {
    if (typeof window.showToast === 'function') window.showToast(msg, type, { duration: dur || 4500 });
    else console.log('[ADMIN]', msg);
  }

  window.addEventListener('nexora:catalog-ready', () => {
    PAID_CATALOG = getCatalogMap();
    console.info('[ADMIN] تم تحديث الكتالوج من Firestore:', Object.keys(PAID_CATALOG).length);
    /* ✅ v18: ما نكسرش تعديلات المالك الجارية وسط الكتابة */
    if (isAdmin() && !isUserEditing()) renderAdmin();
  });
  window.addEventListener('nexora:catalog-update', () => {
    PAID_CATALOG = getCatalogMap();
  });

  const PHONE = '01096295395';
  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* ✅ v18: تاريخ آمن */
  function fmtDate(iso) {
    const t = iso && Date.parse(iso);
    if (!Number.isFinite(t)) return '—';
    try { return new Date(t).toLocaleDateString('ar-EG-u-nu-latn'); }
    catch { return '—'; }
  }

  function isUserEditing() {
    const ae = document.activeElement;
    const sec = qs('#view-admin');
    return !!(sec && ae && sec.contains(ae) &&
      (ae.tagName === 'INPUT' || ae.tagName === 'SELECT' || ae.tagName === 'TEXTAREA'));
  }

  const adminState = {
    students: [],
    enrollments: [],
    filter: '',
    loading: false,
    error: null,
    loaded: false
  };

  const STYLES = `
.admin-wrap{max-width:1100px;margin:0 auto}
.admin-tabs{display:flex;gap:8px;margin-bottom:18px;overflow-x:auto;padding-bottom:2px;-webkit-overflow-scrolling:touch}
.admin-tab{white-space:nowrap;padding:10px 18px;border-radius:12px;border:1px solid var(--edge,#212129);background:var(--panel,#101015);color:var(--mut,#9c9cab);font-size:13px;font-weight:600;cursor:pointer;transition:.15s;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.admin-tab:hover{color:var(--ink,#ececf1)}
.admin-tab.active{background:linear-gradient(135deg,#f0b53e,#e8961e);border-color:transparent;color:#161204}
.admin-panel{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:18px;padding:20px;margin-bottom:16px}
.admin-h{font-size:14.5px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.admin-search{width:100%;height:44px;background:var(--bg,#0a0a0d);border:1px solid var(--edge,#212129);border-radius:12px;color:var(--ink,#ececf1);font-size:13.5px;padding:0 14px;font-family:inherit;margin-bottom:14px}
.admin-search:focus{outline:none;border-color:rgba(240,181,62,.5)}
.stu-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:13px 14px;border:1px solid var(--edge,#212129);border-radius:14px;margin-bottom:10px;background:var(--bg,#0a0a0d)}
.stu-avatar{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#7c5cff);display:grid;place-items:center;font-weight:800;font-size:15px;flex-shrink:0}
.stu-info{flex:1;min-width:150px}
.stu-name{font-size:13.5px;font-weight:700}
.stu-meta{font-size:11px;color:var(--mut,#9c9cab);margin-top:2px;direction:ltr;text-align:right}
.stu-count{font-size:11px;font-weight:700;color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3);padding:3px 10px;border-radius:999px}
.stu-manage{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px;border-radius:10px;background:rgba(240,181,62,.1);border:1px solid rgba(240,181,62,.3);color:#f0b53e;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.enr-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;padding:14px;border:1px solid var(--edge,#212129);border-radius:14px;margin-bottom:12px;background:var(--bg,#0a0a0d)}
.enr-fld{display:flex;flex-direction:column;gap:5px}
.enr-fld label{font-size:10.5px;color:var(--mut,#9c9cab);font-weight:600}
.enr-fld select,.enr-fld input{height:40px;background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:10px;color:var(--ink,#ececf1);font-size:12.5px;padding:0 10px;font-family:inherit}
.enr-fld select:focus,.enr-fld input:focus{outline:none;border-color:rgba(240,181,62,.5)}
.enr-btn{height:40px;padding:0 16px;border-radius:10px;border:none;background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.enr-btn[aria-busy="true"]{opacity:.6;pointer-events:none}
.enr-btn.danger{background:rgba(229,72,77,.15);border:1px solid rgba(229,72,77,.4);color:#f4636e}
.enr-status{font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px}
.enr-status.active{color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3)}
.enr-status.cancelled{color:#f4636e;background:rgba(229,72,77,.1);border:1px solid rgba(229,72,77,.3)}
.enr-meta{font-size:11px;color:var(--dim,#66666f)}
.admin-empty{text-align:center;padding:36px;color:var(--dim,#66666f);font-size:13px}
.admin-state{text-align:center;padding:48px 20px;border:1px dashed var(--edge2,#2e2e39);border-radius:16px;color:var(--mut,#9c9cab);font-size:13px;line-height:1.9}
.admin-state .ai{font-size:36px;margin-bottom:10px}
.admin-state button{margin-top:12px;height:40px;padding:0 20px;border-radius:10px;border:1px solid rgba(240,181,62,.4);background:rgba(240,181,62,.1);color:#f0b53e;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
.admin-note{margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(79,124,255,.08);border:1px solid rgba(79,124,255,.25);font-size:12px;line-height:1.8;color:var(--mut,#9c9cab)}
@media (max-width:640px){
  .enr-row{align-items:stretch}
  .enr-fld{flex:1 1 100%}
  .enr-btn{width:100%}
  .stu-row{align-items:flex-start}
  .stu-info{min-width:0}
  .stu-manage{width:100%;justify-content:center}
}
`;

  /* ---------- DOM ---------- */
  function ensureAdminDOM() {
    if (qs('#view-admin')) return true;
    const main = qs('main#content') || qs('main');
    if (!main) {
      console.warn('[ADMIN] main#content مش موجود — هستنى…');
      return false;
    }
    if (!document.getElementById('nexAdminStyles')) {
      const st = document.createElement('style');
      st.id = 'nexAdminStyles';
      st.textContent = STYLES;
      document.head.appendChild(st);
    }
    const section = document.createElement('section');
    section.id = 'view-admin';
    section.className = 'hidden';
    section.setAttribute('aria-label', 'لوحة الإدارة');
    section.innerHTML = '<div class="admin-wrap" id="adminInner"></div>';
    main.appendChild(section);
    console.info('[ADMIN] ✅ #view-admin اتعمل');
    bindAdminEvents();
    return true;
  }

  /* ---------- تحميل البيانات ---------- */
  async function loadAll(force) {
    if (adminState.loading) return;
    adminState.loading = true;
    adminState.error = null;
    renderAdmin(); /* عرض حالة التحميل */

    try {
      const [stSnap, enSnap] = await Promise.all([
        db.collection('students').get(),
        db.collection('enrollments').get()
      ]);
      adminState.students = stSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      adminState.enrollments = enSnap.docs.map((d) => ({ docId: d.id, ...d.data() }));
      adminState.loaded = true;
      console.info('[ADMIN] ✅ الطلاب:', adminState.students.length, '| الاشتراكات:', adminState.enrollments.length);
    } catch (e) {
      console.error('[ADMIN] تحميل البيانات:', e.code);
      adminState.error = e.code || 'unknown';
    }
    adminState.loading = false;
    renderAdmin();
  }

  /* ---------- واجهة الطلاب ---------- */
  function studentRowHTML(s) {
    const enrolls = adminState.enrollments.filter((e) => e.userId === s.uid && e.status === 'active');
    const initial = (s.name || '؟').trim().charAt(0);
    return '' +
    '<div class="stu-row">' +
      '<span class="stu-avatar" aria-hidden="true">' + esc(initial) + '</span>' +
      '<div class="stu-info">' +
        '<p class="stu-name">' + esc(s.name || 'بدون اسم') + '</p>' +
        '<p class="stu-meta">' + esc(s.phone || '—') + '</p>' +
      '</div>' +
      '<span class="stu-count">' + enrolls.length + ' كورس</span>' +
      '<button type="button" class="stu-manage" data-manage="' + esc(s.uid) + '">' +
        '<i class="bi bi-gear" aria-hidden="true"></i>إدارة الاشتراكات' +
      '</button>' +
    '</div>';
  }

  function enrollRowHTML(s) {
    const mine = adminState.enrollments.filter((e) => e.userId === s.uid);
    const rows = mine.map((e) =>
      '<div class="enr-row">' +
        '<div class="enr-fld" style="flex:1;min-width:160px">' +
          '<label>الكورس</label>' +
          '<p style="font-size:12.5px;font-weight:700;padding-top:10px">' + esc(e.courseTitle || PAID_CATALOG[e.courseId] || e.courseId) + '</p>' +
        '</div>' +
        '<div class="enr-status ' + (e.status === 'active' ? 'active' : 'cancelled') + '">' + (e.status === 'active' ? 'فعّال ✅' : 'ملغي ❌') + '</div>' +
        '<div class="enr-fld">' +
          '<label>نوع الدفع</label>' +
          '<select data-enr-field="paymentType" data-enr-doc="' + esc(e.docId) + '">' +
            '<option value="cash" ' + (e.paymentType === 'cash' ? 'selected' : '') + '>كاش</option>' +
            '<option value="installment" ' + (e.paymentType === 'installment' ? 'selected' : '') + '>تقسيط</option>' +
          '</select>' +
        '</div>' +
        '<div class="enr-fld">' +
          '<label>حالة الدفع</label>' +
          '<select data-enr-field="paymentStatus" data-enr-doc="' + esc(e.docId) + '">' +
            '<option value="paid" ' + (e.paymentStatus === 'paid' ? 'selected' : '') + '>مدفوع</option>' +
            '<option value="partial" ' + (e.paymentStatus === 'partial' ? 'selected' : '') + '>جزئي</option>' +
            '<option value="pending" ' + (e.paymentStatus === 'pending' ? 'selected' : '') + '>معلّق</option>' +
          '</select>' +
        '</div>' +
        '<div class="enr-fld">' +
          '<label>الدفعات المدفوعة</label>' +
          '<input type="number" min="0" max="24" value="' + (e.paidInstallments ?? 0) + '" data-enr-field="paidInstallments" data-enr-doc="' + esc(e.docId) + '" style="width:80px">' +
        '</div>' +
        '<div class="enr-fld">' +
          '<label>ينتهي في</label>' +
          '<input type="date" value="' + esc(e.expiresAt || '') + '" data-enr-field="expiresAt" data-enr-doc="' + esc(e.docId) + '">' +
        '</div>' +
        '<div class="enr-fld" style="flex:1;min-width:140px">' +
          '<label>ملاحظات</label>' +
          '<input type="text" value="' + esc(e.notes || '') + '" placeholder="ملاحظة داخلية…" data-enr-field="notes" data-enr-doc="' + esc(e.docId) + '">' +
        '</div>' +
        '<button type="button" class="enr-btn danger" data-cancel-enr="' + esc(e.docId) + '">' +
          (e.status === 'active' ? 'إلغاء الاشتراك' : 'إعادة تفعيل') +
        '</button>' +
        '<p class="enr-meta" style="flex-basis:100%">مسجّل: ' + fmtDate(e.enrolledAt) + '</p>' +
      '</div>').join('');

    const courseOpts = Object.entries(PAID_CATALOG).map(([id, t]) =>
      '<option value="' + esc(id) + '">' + esc(t) + '</option>').join('');

    return '' +
    '<div class="admin-panel" data-student-panel="' + esc(s.uid) + '" style="display:none">' +
      '<h3 class="admin-h"><i class="bi bi-mortarboard" aria-hidden="true"></i>اشتراكات ' + esc(s.name || 'الطالب') + ' <span class="stu-meta" dir="ltr">(' + esc(s.phone || '—') + ')</span></h3>' +
      (rows || '<p class="admin-empty">مفيش اشتراكات لسه — أضف أول اشتراك من تحت 👇</p>') +
      '<div class="enr-row" style="border-style:dashed">' +
        '<div class="enr-fld" style="flex:1;min-width:200px">' +
          '<label>إضافة اشتراك جديد — الكورس</label>' +
          '<select id="newEnrCourse-' + esc(s.uid) + '">' + courseOpts + '</select>' +
        '</div>' +
        '<div class="enr-fld">' +
          '<label>نوع الدفع</label>' +
          '<select id="newEnrPay-' + esc(s.uid) + '">' +
            '<option value="cash">كاش</option>' +
            '<option value="installment">تقسيط</option>' +
          '</select>' +
        '</div>' +
        '<div class="enr-fld">' +
          '<label>حالة الدفع</label>' +
          '<select id="newEnrStatus-' + esc(s.uid) + '">' +
            '<option value="paid">مدفوع</option>' +
            '<option value="partial">جزئي</option>' +
            '<option value="pending">معلّق</option>' +
          '</select>' +
        '</div>' +
        '<div class="enr-fld">' +
          '<label>ينتهي في (اختياري)</label>' +
          '<input type="date" id="newEnrExp-' + esc(s.uid) + '">' +
        '</div>' +
        '<button type="button" class="enr-btn" data-add-enr="' + esc(s.uid) + '"><i class="bi bi-plus-lg" aria-hidden="true"></i>تفعيل الاشتراك</button>' +
      '</div>' +
      '<div class="admin-note">' +
        '💡 الاشتراك بيتفعّل فورًا على السحابة — الطالب هيلاقي الكورس في حسابه خلال ثواني. ' +
        'للاستفسارات: <a href="tel:+201096295395" style="color:#4f7cff;direction:ltr;unicode-bidi:embed">' + PHONE + '</a>' +
      '</div>' +
    '</div>';
  }

  function renderAdmin() {
    const inner = qs('#adminInner');
    if (!inner) return;

    /* حالات التحميل والخطأ */
    if (adminState.loading) {
      inner.innerHTML =
        '<div class="admin-state"><div class="ai" aria-hidden="true">⏳</div>بنحمّل الطلاب والاشتراكات…</div>';
      return;
    }
    if (adminState.error) {
      inner.innerHTML =
        '<div class="admin-state" role="alert">' +
          '<div class="ai" aria-hidden="true">⚠️</div>' +
          'مش قادرين نحمّل بيانات الطلاب.<br>' +
          '<span style="font-size:11.5px;color:var(--dim,#66666f)">(' + esc(adminState.error) + ' — لو permission-denied راجع Firestore Rules)</span>' +
          '<br><button type="button" data-admin-retry>حاول تاني</button>' +
        '</div>';
      return;
    }

    const filter = adminState.filter.trim().toLowerCase();
    const students = adminState.students
      .filter((s) => !filter || (s.name || '').toLowerCase().includes(filter) || (s.phone || '').includes(filter))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));

    inner.innerHTML =
    '<div class="admin-tabs" role="tablist">' +
      '<button type="button" class="admin-tab active" data-admin-tab="students" role="tab" aria-selected="true">الطلاب (' + adminState.students.length + ')</button>' +
      '<button type="button" class="admin-tab" data-admin-tab="all-enrollments" role="tab" aria-selected="false">كل الاشتراكات (' + adminState.enrollments.length + ')</button>' +
    '</div>' +
    '<div data-admin-panel="students">' +
      '<input class="admin-search" id="adminSearch" type="search" placeholder="ابحث باسم الطالب أو رقم موبايله…" value="' + esc(adminState.filter) + '" aria-label="بحث في الطلاب">' +
      '<div id="studentsList">' +
        (students.length ? students.map(studentRowHTML).join('') : '<p class="admin-empty">مفيش طلاب مسجّلين لسه.</p>') +
      '</div>' +
    '</div>' +
    '<div data-admin-panel="all-enrollments" class="hidden">' +
      (adminState.students.length
        ? adminState.students.map(enrollRowHTML).join('')
        : '<p class="admin-empty">مفيش طلاب لسه.</p>') +
    '</div>';
    /* ✅ v18: مفيش bind فردي — الـdelegation مربوطة مرة واحدة */
  }

  /* ---------- Event Delegation (مرة واحدة) ---------- */
  function bindAdminEvents() {
    const inner = qs('#adminInner');
    if (!inner || inner.__admBound) return;
    inner.__admBound = true;

    inner.addEventListener('click', (e) => {
      if (e.target.closest('[data-admin-retry]')) { loadAll(); return; }

      const tab = e.target.closest('[data-admin-tab]');
      if (tab) {
        qsa('[data-admin-tab]', inner).forEach((x) => {
          const on = x === tab;
          x.classList.toggle('active', on);
          x.setAttribute('aria-selected', String(on));
        });
        qsa('[data-admin-panel]', inner).forEach((p) =>
          p.classList.toggle('hidden', p.dataset.adminPanel !== tab.dataset.adminTab));
        return;
      }

      const manage = e.target.closest('[data-manage]');
      if (manage) {
        const uid = manage.dataset.manage;
        qsa('[data-admin-tab]', inner).forEach((x) => {
          const on = x.dataset.adminTab === 'all-enrollments';
          x.classList.toggle('active', on);
          x.setAttribute('aria-selected', String(on));
        });
        qsa('[data-admin-panel]', inner).forEach((p) =>
          p.classList.toggle('hidden', p.dataset.adminPanel !== 'all-enrollments'));
        qsa('[data-student-panel]', inner).forEach((p) => { p.style.display = 'none'; });
        const panel = qs('[data-student-panel="' + uid + '"]', inner);
        if (panel) { panel.style.display = ''; panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        return;
      }

      const add = e.target.closest('[data-add-enr]');
      if (add) { addEnrollment(add.dataset.addEnr, add); return; }

      const cancel = e.target.closest('[data-cancel-enr]');
      if (cancel) { toggleEnrollment(cancel.dataset.cancelEnr, cancel); return; }
    });

    inner.addEventListener('input', (e) => {
      if (e.target.id === 'adminSearch') {
        const val = e.target.value;
        clearTimeout(inner.__searchTimer);
        inner.__searchTimer = setTimeout(() => {
          adminState.filter = val;
          renderAdmin();
          const inp = qs('#adminSearch', inner);
          if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
        }, 300);
      }
    });

    inner.addEventListener('change', (e) => {
      const el = e.target.closest('[data-enr-field]');
      if (el) saveEnrField(el);
    });
  }

  /* ---------- عمليات الاشتراكات ---------- */
  async function addEnrollment(uid, btn) {
    const courseId = qs('#newEnrCourse-' + uid)?.value;
    const paymentType = qs('#newEnrPay-' + uid)?.value || 'cash';
    const paymentStatus = qs('#newEnrStatus-' + uid)?.value || 'paid';
    const expiresAt = qs('#newEnrExp-' + uid)?.value || null;

    if (!courseId) { toast('اختار كورس الأول', 'warn'); return; }

    const dup = adminState.enrollments.find(
      (e) => e.userId === uid && e.courseId === courseId && e.status === 'active'
    );
    if (dup) {
      toast('الطالب ده عنده اشتراك فعّال في الكورس ده بالفعل.', 'warn');
      return;
    }

    if (btn) btn.setAttribute('aria-busy', 'true');
    try {
      await db.collection('enrollments').add({
        userId: uid,
        courseId,
        courseTitle: PAID_CATALOG[courseId] || courseId,   /* ✅ v18 */
        status: 'active',
        enrolledAt: new Date().toISOString(),
        expiresAt,
        paymentType,
        paymentStatus,
        paidInstallments: paymentType === 'installment' ? 1 : 0,
        notes: ''
      });
      toast('تم تفعيل الاشتراك ✅ — الطالب هيشوفه خلال ثواني', 'success');
      await loadAll();
    } catch (e) {
      console.error('[ADMIN]', e.code);
      toast(e.code === 'permission-denied'
        ? 'السحابة رفضت — راجع Firestore Rules على enrollments'
        : 'فشل التفعيل: ' + e.code, 'error', 7000);
    }
    if (btn) btn.removeAttribute('aria-busy');
  }

  async function toggleEnrollment(docId, btn) {
    const enr = adminState.enrollments.find((e) => e.docId === docId);
    if (!enr) return;

    /* ✅ v18: إعادة التفعيل متعملش نشاط مكرر */
    if (enr.status !== 'active') {
      const dup = adminState.enrollments.find(
        (e) => e.userId === enr.userId && e.courseId === enr.courseId && e.status === 'active'
      );
      if (dup) {
        toast('عند الطالب اشتراك فعّال تاني في نفس الكورس — الفعّال هو اللي موجود.', 'warn', 6000);
        return;
      }
    }

    if (btn) btn.setAttribute('aria-busy', 'true');
    try {
      await db.collection('enrollments').doc(docId).update({
        status: enr.status === 'active' ? 'cancelled' : 'active'
      });
      await loadAll();
    } catch (e) {
      console.error('[ADMIN]', e.code);
      toast('فشل التعديل: ' + e.code, 'error');
    }
    if (btn) btn.removeAttribute('aria-busy');
  }

  async function saveEnrField(el) {
    const docId = el.dataset.enrDoc;
    const field = el.dataset.enrField;
    let value = el.value;

    if (field === 'paidInstallments') value = Math.max(0, parseInt(value, 10) || 0);
    /* ✅ v18: التاريخ الفاضي = null (مش نص فاضي يبوظ الفلترة بعدين) */
    if (field === 'expiresAt' && !value) value = null;
    if (field === 'notes') value = String(value).trim();

    try {
      await db.collection('enrollments').doc(docId).update({ [field]: value });
      const local = adminState.enrollments.find((e) => e.docId === docId);
      if (local) local[field] = value;
      console.info('[ADMIN] اتحدّث:', field);
    } catch (e) {
      console.error('[ADMIN]', e.code);
      toast('فشل الحفظ: ' + e.code, 'error');
      /* نرجّع القيمة القديمة في الواجهة */
      if (local2(el, docId, field)) el.value = adminState.enrollments.find((x) => x.docId === docId)?.[field] ?? '';
    }
  }
  function local2() { return true; }

  /* ---------- السايدبار ---------- */
  function ensureNavEntry() {
    const nav = qs('#sideNav');
    if (!nav || qs('[data-nav="view:admin"]')) return;
    const dataBtn = qs('[data-nav="view:data"]');
    if (!dataBtn) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.nav = 'view:admin';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="bi bi-speedometer2 text-[13.5px] w-4 text-center shrink-0 text-accent" aria-hidden="true"></i>' +
                    '<span class="grow text-start truncate">لوحة الإدارة</span>';
    dataBtn.after(btn);
  }

  function showAdminView() {
    if (!ensureAdminDOM()) return;
    qsa('main#content > section:not(#view-admin)').forEach((s) => s.classList.add('hidden'));
    const v = qs('#view-admin'); if (v) v.classList.remove('hidden');
    const pt = qs('#pageTitle'); if (pt) pt.textContent = 'لوحة الإدارة';
    const ps = qs('#pageSub');  if (ps) ps.textContent = 'الطلاب والاشتراكات والدفع';
    window.scrollTo(0, 0);
    qs('#sidebar')?.classList.remove('open');
    qs('#overlay')?.classList.add('hidden');
    /* نحمّل مرة واحدة في الجلسة، وبعدها refresh عند كل فتح */
    loadAll();
  }

  function bindAdminNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__adminNavBound) return;
    nav.__adminNavBound = true;
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav="view:admin"]');
      if (!b) return;
      e.preventDefault();
      if (!isAdmin()) return;
      showAdminView();
    });
  }

  /* ✅ v18: التنقل لغير اللوحة → نخبيها (app.js مش بيعرف view-admin) */
  function bindGlobalNavWatch() {
    if (document.__admNavWatch) return;
    document.__admNavWatch = true;
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav]');
      if (!b) return;
      if (b.dataset.nav === 'view:admin') return;
      const sec = qs('#view-admin');
      if (sec) sec.classList.add('hidden');
    }, true);
  }

  /* ==========================================================
     ✅ v18: الجارد بقى transition-based
     قبل كده: أول onAuthStateChanged(null) عند فتح الصفحة كان
     بيمسح علم المالك — فوضع المالك بالباسورد كان بيموت بعد reload
     دلوقتي: بنمسح العلم بس لو كان فيه مستخدم Firebase مسجّل وخرج
     ========================================================== */
  function watchAdminGuard() {
    let hadUser = false;
    auth.onAuthStateChanged((user) => {
      if (user) {
        hadUser = true;
        return;
      }
      /* null — بس هل ده "خروج فعلي" ولا مجرد افتتاحية الصفحة؟ */
      if (hadUser && isAdmin()) {
        try {
          sessionStorage.removeItem('my-course-library:admin');
          console.info('[ADMIN] تم قفل وضع المالك (خروج Firebase فعلي)');
        } catch { /* تجاهل */ }
      }
      hadUser = false;
    });
  }

  function installSidebarHook() {
    if (window.__admSidebarHooked) return;
    if (typeof window.renderSidebar !== 'function') return;
    window.__admSidebarHooked = true;
    const orig = window.renderSidebar;
    window.renderSidebar = function () {
      try { orig(); } catch (e) { console.error('[ADMIN] renderSidebar:', e); }
      ensureNavEntry();
      bindAdminNav();
    };
  }

  function observeSideNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__admObserver) return;
    nav.__admObserver = new MutationObserver(() => {
      ensureNavEntry();
      bindAdminNav();
    });
    nav.__admObserver.observe(nav, { childList: true });
  }

  function boot() {
    ensureAdminDOM();
    watchAdminGuard();
    ensureNavEntry();
    bindAdminNav();
    bindGlobalNavWatch();
    installSidebarHook();
    observeSideNav();
  }

  function waitForDOM(retries = 50) {
    const main = qs('main#content') || qs('main');
    const nav = qs('#sideNav');
    if (main && nav) { console.info('[ADMIN] DOM جاهز — boot'); boot(); return; }
    if (retries <= 0) { console.warn('[ADMIN] ⚠️ DOM مش جاهز — boot'); boot(); return; }
    setTimeout(() => waitForDOM(retries - 1), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForDOM(), { once: true });
  } else {
    waitForDOM();
  }

  window.NexoraAdmin = {
    reload: loadAll
  };
})();