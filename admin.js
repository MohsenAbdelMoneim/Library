/* ==========================================================
   admin.js — v15.1
   لوحة إدارة Nexora: الطلاب + الاشتراكات + حالة الدفع
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Admin — v15.1 ', 'background:#e8961e;color:#161204;font-weight:bold');

  const firebaseConfig = {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };

  /* تهيئة آمنة — متكررة لو cloud.js أو student.js مهيئينها قبل كده */
  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const PAID_CATALOG = {
    'frontend-diploma':  'Frontend Diploma',
    'backend-course':    'Backend Course',
    'uiux-course':       'UI/UX Course',
    'mobile-app-course': 'Mobile App Course',
    'data-diploma':      'Data Analysis Diploma',
    'ai-ds-ml':          'AI / Data Science / ML',
    'cyber-course':      'Cyber Security Course',
    'media-buying':      'Media Buying Course',
    'fullstack-diploma': 'Full Stack Diploma',
    'git-github':        'Git & GitHub'
  };

  const PHONE = '01096295395';
  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('ar-EG-u-nu-latn') : '—';

  /* ---------- الحالة ---------- */
  const adminState = {
    students: [],
    enrollments: [],
    filter: ''
  };

  /* ---------- أنماط ---------- */
  const STYLES = `
.admin-wrap{max-width:1100px;margin:0 auto}
.admin-tabs{display:flex;gap:8px;margin-bottom:18px;overflow-x:auto;padding-bottom:2px}
.admin-tab{white-space:nowrap;padding:10px 18px;border-radius:12px;border:1px solid var(--edge,#212129);background:var(--panel,#101015);color:var(--mut,#9c9cab);font-size:13px;font-weight:600;cursor:pointer;transition:.15s;font-family:inherit}
.admin-tab:hover{color:var(--ink,#ececf1)}
.admin-tab.active{background:linear-gradient(135deg,#f0b53e,#e8961e);border-color:transparent;color:#161204}
.admin-panel{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:18px;padding:20px;margin-bottom:16px}
.admin-h{font-size:14.5px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.admin-search{width:100%;height:44px;background:var(--bg,#0a0a0d);border:1px solid var(--edge,#212129);border-radius:12px;color:var(--ink,#ececf1);font-size:13.5px;padding:0 14px;font-family:inherit;margin-bottom:14px}
.admin-search:focus{outline:none;border-color:rgba(240,181,62,.5)}
.stu-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:13px 14px;border:1px solid var(--edge,#212129);border-radius:14px;margin-bottom:10px;background:var(--bg,#0a0a0d)}
.stu-avatar{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#7c5cff);display:grid;place-items:center;font-weight:800;font-size:15px;flex-shrink:0}
.stu-info{flex:1;min-width:150px}
.stu-name{font-size:13.5px;font-weight:700}
.stu-meta{font-size:11px;color:var(--mut,#9c9cab);margin-top:2px;direction:ltr;text-align:right}
.stu-count{font-size:11px;font-weight:700;color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3);padding:3px 10px;border-radius:999px}
.stu-manage{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px;border-radius:10px;background:rgba(240,181,62,.1);border:1px solid rgba(240,181,62,.3);color:#f0b53e;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit}
.enr-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;padding:14px;border:1px solid var(--edge,#212129);border-radius:14px;margin-bottom:12px;background:var(--bg,#0a0a0d)}
.enr-fld{display:flex;flex-direction:column;gap:5px}
.enr-fld label{font-size:10.5px;color:var(--mut,#9c9cab);font-weight:600}
.enr-fld select,.enr-fld input{height:40px;background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:10px;color:var(--ink,#ececf1);font-size:12.5px;padding:0 10px;font-family:inherit}
.enr-fld select:focus,.enr-fld input:focus{outline:none;border-color:rgba(240,181,62,.5)}
.enr-btn{height:40px;padding:0 16px;border-radius:10px;border:none;background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.enr-btn.danger{background:rgba(229,72,77,.15);border:1px solid rgba(229,72,77,.4);color:#f4636e}
.enr-status{font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px}
.enr-status.active{color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3)}
.enr-status.cancelled{color:#f4636e;background:rgba(229,72,77,.1);border:1px solid rgba(229,72,77,.3)}
.enr-meta{font-size:11px;color:var(--dim,#66666f)}
.admin-empty{text-align:center;padding:36px;color:var(--dim,#66666f);font-size:13px}
.admin-note{margin-top:14px;padding:12px 14px;border-radius:12px;background:rgba(79,124,255,.08);border:1px solid rgba(79,124,255,.25);font-size:12px;line-height:1.8;color:var(--mut,#9c9cab)}
@media (max-width:640px){
  .enr-row{align-items:stretch}
  .enr-fld{flex:1 1 100%}
  .enr-btn{width:100%}
  .stu-row{align-items:flex-start}
}
`;

  /* ---------- DOM ---------- */
  function ensureAdminDOM() {
    if (qs('#view-admin')) return;
    const main = qs('main#content') || qs('main');
    if (!main) return;
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
    section.innerHTML = `<div class="admin-wrap" id="adminInner"></div>`;
    main.appendChild(section);
  }

  /* ---------- تحميل البيانات ---------- */
  async function loadAll() {
    try {
      const [stSnap, enSnap] = await Promise.all([
        db.collection('students').get(),
        db.collection('enrollments').get()
      ]);
      adminState.students = stSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      adminState.enrollments = enSnap.docs.map((d) => ({ docId: d.id, ...d.data() }));
      console.info('[ADMIN] الطلاب:', adminState.students.length, '| الاشتراكات:', adminState.enrollments.length);
    } catch (e) {
      console.error('[ADMIN] تحميل البيانات:', e.code);
    }
    renderAdmin();
  }

  /* ---------- واجهة الطلاب ---------- */
  function studentRowHTML(s) {
    const enrolls = adminState.enrollments.filter((e) => e.userId === s.uid && e.status === 'active');
    const initial = (s.name || '؟').trim().charAt(0);
    return `
    <div class="stu-row">
      <span class="stu-avatar">${esc(initial)}</span>
      <div class="stu-info">
        <p class="stu-name">${esc(s.name || 'بدون اسم')}</p>
        <p class="stu-meta">${esc(s.phone || '—')}</p>
      </div>
      <span class="stu-count">${enrolls.length} كورس</span>
      <button type="button" class="stu-manage" data-manage="${esc(s.uid)}">
        <i class="bi bi-gear"></i>إدارة الاشتراكات
      </button>
    </div>`;
  }

  function enrollRowHTML(s) {
    const mine = adminState.enrollments.filter((e) => e.userId === s.uid);
    const rows = mine.map((e) => `
      <div class="enr-row">
        <div class="enr-fld" style="flex:1;min-width:160px">
          <label>الكورس</label>
          <p style="font-size:12.5px;font-weight:700;padding-top:10px">${esc(PAID_CATALOG[e.courseId] || e.courseId)}</p>
        </div>
        <div class="enr-status ${e.status === 'active' ? 'active' : 'cancelled'}">${e.status === 'active' ? 'فعّال ✅' : 'ملغي ❌'}</div>
        <div class="enr-fld">
          <label>نوع الدفع</label>
          <select data-enr-field="paymentType" data-enr-doc="${esc(e.docId)}">
            <option value="cash" ${e.paymentType === 'cash' ? 'selected' : ''}>كاش</option>
            <option value="installment" ${e.paymentType === 'installment' ? 'selected' : ''}>تقسيط</option>
          </select>
        </div>
        <div class="enr-fld">
          <label>حالة الدفع</label>
          <select data-enr-field="paymentStatus" data-enr-doc="${esc(e.docId)}">
            <option value="paid" ${e.paymentStatus === 'paid' ? 'selected' : ''}>مدفوع</option>
            <option value="partial" ${e.paymentStatus === 'partial' ? 'selected' : ''}>جزئي</option>
            <option value="pending" ${e.paymentStatus === 'pending' ? 'selected' : ''}>معلّق</option>
          </select>
        </div>
        <div class="enr-fld">
          <label>الدفعات المدفوعة</label>
          <input type="number" min="0" max="10" value="${e.paidInstallments ?? 0}" data-enr-field="paidInstallments" data-enr-doc="${esc(e.docId)}" style="width:80px">
        </div>
        <div class="enr-fld">
          <label>ينتهي في</label>
          <input type="date" value="${e.expiresAt || ''}" data-enr-field="expiresAt" data-enr-doc="${esc(e.docId)}">
        </div>
        <div class="enr-fld" style="flex:1;min-width:140px">
          <label>ملاحظات</label>
          <input type="text" value="${esc(e.notes || '')}" placeholder="ملاحظة داخلية…" data-enr-field="notes" data-enr-doc="${esc(e.docId)}">
        </div>
        <button type="button" class="enr-btn danger" data-cancel-enr="${esc(e.docId)}">
          ${e.status === 'active' ? 'إلغاء الاشتراك' : 'إعادة تفعيل'}
        </button>
        <p class="enr-meta" style="flex-basis:100%">مسجّل: ${fmtDate(e.enrolledAt)}</p>
      </div>`).join('');

    return `
    <div class="admin-panel" data-student-panel="${esc(s.uid)}" style="display:none">
      <h3 class="admin-h"><i class="bi bi-mortarboard"></i>اشتراكات ${esc(s.name || 'الطالب')} <span class="stu-meta" dir="ltr">(${esc(s.phone)})</span></h3>
      ${rows || '<p class="admin-empty">مفيش اشتراكات لسه — أضف أول اشتراك من تحت 👇</p>'}

      <div class="enr-row" style="border-style:dashed">
        <div class="enr-fld" style="flex:1;min-width:200px">
          <label>إضافة اشتراك جديد — الكورس</label>
          <select id="newEnrCourse-${esc(s.uid)}">
            ${Object.entries(PAID_CATALOG).map(([id, t]) => `<option value="${esc(id)}">${esc(t)}</option>`).join('')}
          </select>
        </div>
        <div class="enr-fld">
          <label>نوع الدفع</label>
          <select id="newEnrPay-${esc(s.uid)}">
            <option value="cash">كاش</option>
            <option value="installment">تقسيط</option>
          </select>
        </div>
        <div class="enr-fld">
          <label>حالة الدفع</label>
          <select id="newEnrStatus-${esc(s.uid)}">
            <option value="paid">مدفوع</option>
            <option value="partial">جزئي</option>
            <option value="pending">معلّق</option>
          </select>
        </div>
        <div class="enr-fld">
          <label>ينتهي في (اختياري)</label>
          <input type="date" id="newEnrExp-${esc(s.uid)}">
        </div>
        <button type="button" class="enr-btn" data-add-enr="${esc(s.uid)}"><i class="bi bi-plus-lg"></i>تفعيل الاشتراك</button>
      </div>

      <div class="admin-note">
        💡 الاشتراك بيتفعّل فورًا على السحابة — الطالب هيلاقي الكورس في حسابه خلال ثواني.
        للاستفسارات: <a href="tel:${PHONE}" style="color:#4f7cff;direction:ltr;unicode-bidi:embed">${PHONE}</a>
      </div>
    </div>`;
  }

  function renderAdmin() {
    const inner = qs('#adminInner');
    if (!inner) return;
    const filter = adminState.filter.trim().toLowerCase();
    const students = adminState.students
      .filter((s) => !filter || (s.name || '').toLowerCase().includes(filter) || (s.phone || '').includes(filter))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));

    inner.innerHTML = `
    <div class="admin-tabs">
      <button class="admin-tab active" data-admin-tab="students">الطلاب (${adminState.students.length})</button>
      <button class="admin-tab" data-admin-tab="all-enrollments">كل الاشتراكات (${adminState.enrollments.length})</button>
    </div>

    <div data-admin-panel="students">
      <input class="admin-search" id="adminSearch" type="search"
             placeholder="ابحث باسم الطالب أو رقم موبايله…" value="${esc(adminState.filter)}">
      <div id="studentsList">
        ${students.length ? students.map(studentRowHTML).join('') : '<p class="admin-empty">مفيش طلاب مسجّلين لسه.</p>'}
      </div>
    </div>

    <div data-admin-panel="all-enrollments" class="hidden">
      ${adminState.students.length
        ? adminState.students.map(enrollRowHTML).join('')
        : '<p class="admin-empty">مفيش طلاب لسه.</p>'}
    </div>`;

    /* الأحداث */
    qs('#adminSearch').addEventListener('input', debounceAdmin((e) => {
      adminState.filter = e.target.value;
      renderAdmin();
      const inp = qs('#adminSearch');
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }, 300));

    qsa('[data-admin-tab]').forEach((t) => t.addEventListener('click', () => {
      qsa('[data-admin-tab]').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      qsa('[data-admin-panel]').forEach((p) =>
        p.classList.toggle('hidden', p.dataset.adminPanel !== t.dataset.adminTab));
    }));

    qsa('[data-manage]').forEach((b) => b.addEventListener('click', () => {
      const uid = b.dataset.manage;
      qsa('[data-admin-tab]').forEach((x) => x.classList.toggle('active', x.dataset.adminTab === 'all-enrollments'));
      qsa('[data-admin-panel]').forEach((p) =>
        p.classList.toggle('hidden', p.dataset.adminPanel !== 'all-enrollments'));
      qsa('[data-student-panel]').forEach((p) => { p.style.display = 'none'; });
      const panel = qs(`[data-student-panel="${uid}"]`);
      if (panel) { panel.style.display = ''; panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }));

    qsa('[data-add-enr]').forEach((b) => b.addEventListener('click', () => addEnrollment(b.dataset.addEnr)));
    qsa('[data-cancel-enr]').forEach((b) => b.addEventListener('click', () => toggleEnrollment(b.dataset.cancelEnr)));
    qsa('[data-enr-field]').forEach((el) => el.addEventListener('change', () => saveEnrField(el)));
  }

  function debounceAdmin(fn, ms) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  /* ---------- عمليات الاشتراكات ---------- */
  async function addEnrollment(uid) {
    const courseId = qs(`#newEnrCourse-${uid}`).value;
    const paymentType = qs(`#newEnrPay-${uid}`).value;
    const paymentStatus = qs(`#newEnrStatus-${uid}`).value;
    const expiresAt = qs(`#newEnrExp-${uid}`).value || null;

    /* منع التكرار: اشتراك فعّال لنفس الطالب في نفس الكورس */
    const dup = adminState.enrollments.find(
      (e) => e.userId === uid && e.courseId === courseId && e.status === 'active'
    );
    if (dup) {
      alert('الطالب ده عنده اشتراك فعّال في الكورس ده بالفعل.');
      return;
    }

    try {
      await db.collection('enrollments').add({
        userId: uid,
        courseId,
        status: 'active',
        enrolledAt: new Date().toISOString(),
        expiresAt,
        paymentType,
        paymentStatus,
        paidInstallments: paymentType === 'installment' ? 1 : 0,
        notes: ''
      });
      console.info('[ADMIN] ✅ الاشتراك اتفعّل — هيوصل للطالب خلال ثواني');
      await loadAll();
    } catch (e) {
      console.error('[ADMIN]', e.code);
      alert('فشل التفعيل: ' + e.code);
    }
  }

  async function toggleEnrollment(docId) {
    const enr = adminState.enrollments.find((e) => e.docId === docId);
    if (!enr) return;
    try {
      await db.collection('enrollments').doc(docId).update({
        status: enr.status === 'active' ? 'cancelled' : 'active'
      });
      await loadAll();
    } catch (e) {
      console.error('[ADMIN]', e.code);
      alert('فشل التعديل: ' + e.code);
    }
  }

  async function saveEnrField(el) {
    const docId = el.dataset.enrDoc;
    const field = el.dataset.enrField;
    let value = el.value;
    if (field === 'paidInstallments') value = Math.max(0, parseInt(value, 10) || 0);
    try {
      await db.collection('enrollments').doc(docId).update({ [field]: value });
      const local = adminState.enrollments.find((e) => e.docId === docId);
      if (local) local[field] = value;
      console.info('[ADMIN] اتحدّث:', field);
    } catch (e) {
      console.error('[ADMIN]', e.code);
      alert('فشل الحفظ: ' + e.code);
    }
  }

  /* ---------- بند القايمة + العرض (للمالك فقط) ---------- */
  function ensureNavEntry() {
    const nav = qs('#sideNav');
    if (!nav || qs('[data-nav="view:admin"]')) return;
    const dataBtn = qs('[data-nav="view:data"]');
    if (!dataBtn) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.nav = 'view:admin';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="bi bi-speedometer2 text-[13.5px] w-4 text-center shrink-0 text-accent"></i>' +
                    '<span class="grow text-start truncate">لوحة الإدارة</span>';
    dataBtn.after(btn);
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-nav="view:admin"]');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    if (!(window.MCL && MCL.isAdminActive())) return;
    qsa('main#content > section:not(#view-admin)').forEach((s) => s.classList.add('hidden'));
    qs('#view-admin')?.classList.remove('hidden');
    qs('#pageTitle').textContent = 'لوحة الإدارة';
    qs('#pageSub').textContent = 'الطلاب والاشتراكات والدفع';
    window.scrollTo(0, 0);
    loadAll();
    qs('#sidebar')?.classList.remove('open');
    qs('#overlay')?.classList.add('hidden');
  }, true);

   /* ---------- تشغيل ---------- */
  ensureAdminDOM();
  ensureNavEntry();
  if (!window.__admSidebarHooked) {
    const orig = window.renderSidebar;
    if (typeof orig === 'function') {
      window.__admSidebarHooked = true;
      window.renderSidebar = function () {
        orig();
        ensureNavEntry();
      };
    }
  }
  auth.onAuthStateChanged((user) => { if (user) ensureNavEntry(); });{
    window.renderSidebar = function () {
      origRenderSidebar();
      ensureNavEntry();
    };
  }

  /* ---------- حماية عرض اللوحة: امسح المحتوى لو وضع المالك اتقفل ---------- */
  setInterval(() => {
    const sec = qs('#view-admin');
    if (sec && window.MCL && !MCL.isAdminActive()) {
      const inner = qs('#adminInner');
      if (inner && inner.innerHTML.length > 50) {
        inner.innerHTML = '<p class="admin-empty">اللوحة متاحة لوضع المالك فقط — ادخل من 🛡️ فوق.</p>';
      }
    }
  }, 3000);

  /* ---------- تشغيل ---------- */
  ensureAdminDOM();
  ensureNavEntry();
  auth.onAuthStateChanged((user) => { if (user) ensureNavEntry(); });
})();