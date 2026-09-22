/* ==========================================================
   student.js — v16
   Dashboard الطالب: أهلاً بيك يا [فلان] + كورساته المفعلة هو بس
   ✅ v16: انتظار DOM + استخدام __NEXORA_CATALOG__
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Student — v16 ', 'background:#7c5cff;color:#fff;font-weight:bold');

  const firebaseConfig = window.__FIREBASE_CONFIG__ || {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };

  const OWNER_EMAIL = (window.__OWNER_EMAIL__) || 'owner@gymzone.com';

  if (typeof firebase === 'undefined') {
    console.error('[STUDENT] Firebase SDK مش محمّل');
    return;
  }

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const PHONE = '01096295395';
  const WA = 'https://wa.me/201096295395';

  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  function on(sel, evt, fn, opts) {
    const el = typeof sel === 'string' ? qs(sel) : sel;
    if (el) el.addEventListener(evt, fn, opts);
    else console.warn('[STUDENT][WIRE] عنصر غير موجود:', sel);
    return el;
  }

  function getAppState() {
    if (window.__nexoraState && Array.isArray(window.__nexoraState.resources)) {
      return window.__nexoraState;
    }
    return null;
  }

  /* ✅ نستخدم الكتالوج من Firestore */
  function getCatalog() {
    const src = window.__NEXORA_CATALOG__ || { courses: [], byId: {} };
    const map = {};
    (src.courses || []).forEach((c) => {
      if (c && c.id) {
        map[c.id] = {
          title: c.title,
          category: c.category || '—',
          description: c.description || ''
        };
      }
    });
    return map;
  }

  /* Fallback لو Firestore مش جاهز */
  const FALLBACK_CATALOG = {
    'frontend-diploma':  { title: 'Frontend Diploma',      category: 'Frontend',      description: 'تطوير واجهات المواقع من الصفر للاحتراف.' },
    'backend-course':    { title: 'Backend Course',        category: 'Backend',       description: 'الخدمات الخلفية وقواعد البيانات.' },
    'uiux-course':       { title: 'UI/UX Course',          category: 'UI/UX',         description: 'تصميم تجارب وواجهات استخدام.' },
    'mobile-app-course': { title: 'Mobile App Course',     category: 'Mobile App',    description: 'تطوير تطبيقات الموبايل.' },
    'data-diploma':      { title: 'Data Analysis Diploma', category: 'Data Analysis', description: 'تحليل البيانات واتخاذ القرار.' },
    'ai-ds-ml':          { title: 'AI / Data Science / ML',category: 'AI',            description: 'الذكاء الاصطناعي وتعلم الآلة.' },
    'cyber-course':      { title: 'Cyber Security Course', category: 'Cyber Security',description: 'الأمن السيبراني من الأساس.' },
    'media-buying':      { title: 'Media Buying Course',   category: 'Other',         description: 'الإعلانات الممولة والحملات.' },
    'fullstack-diploma': { title: 'Full Stack Diploma',    category: 'Full Stack',    description: 'واجهة + خلفية في دبلومة واحدة.' }
  };

  function catInfo(courseId) {
    const live = getCatalog();
    return live[courseId] || FALLBACK_CATALOG[courseId] || { title: courseId, category: '—', description: '' };
  }

  const STYLES = `
.nex-dash{max-width:1100px;margin:0 auto}
.dash-hero{padding:24px 0 20px}
.dash-hello{font-size:24px;font-weight:800;line-height:1.4}
.dash-sub{font-size:13.5px;color:var(--mut,#9c9cab);margin-top:6px}
.dash-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.stu-card{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:18px;padding:20px;display:flex;flex-direction:column;gap:10px}
.stu-top{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.stu-cat{font-size:10.5px;font-weight:700;color:#7ea2ff;background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.3);padding:3px 10px;border-radius:999px}
.stu-status{font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px}
.stu-status.active{color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3)}
.stu-status.done{color:#f0b53e;background:rgba(240,181,62,.1);border:1px solid rgba(240,181,62,.3)}
.stu-title{font-size:17px;font-weight:800;line-height:1.4}
.stu-desc{font-size:12.5px;color:var(--mut,#9c9cab);line-height:1.7}
.prog-wrap{margin-top:4px}
.prog-bar{height:6px;background:var(--bg,#0a0a0d);border-radius:999px;overflow:hidden;border:1px solid var(--edge,#212129)}
.prog-fill{height:100%;background:linear-gradient(90deg,#4f7cff,#7c5cff);border-radius:999px;transition:width .3s}
.prog-txt{font-size:10.5px;color:var(--dim,#66666f);margin-top:5px}
.stu-cta{display:flex;gap:8px;margin-top:auto;padding-top:6px}
.stu-open{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:44px;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff;font-size:13.5px;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.stu-open:hover{opacity:.9}
.stu-open.wa{background:#25D366;color:#04310f;text-decoration:none}
.empty-dash{text-align:center;padding:56px 20px;background:var(--panel,#101015);border:1px dashed var(--edge2,#2e2e39);border-radius:20px}
.empty-icon{font-size:44px;margin-bottom:12px}
.empty-t{font-size:17px;font-weight:800;margin-bottom:6px}
.empty-d{font-size:13px;color:var(--mut,#9c9cab);line-height:1.8;margin-bottom:18px}
.empty-btn{display:inline-flex;align-items:center;gap:7px;height:46px;padding:0 22px;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff;font-size:14px;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.top-nav-row{display:flex;gap:8px;margin-top:16px;flex-wrap:wrap}
.top-nav-chip{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 16px;border-radius:999px;border:1px solid var(--edge,#212129);background:var(--panel,#101015);color:var(--mut,#9c9cab);font-size:12.5px;font-weight:600;text-decoration:none;cursor:pointer;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.top-nav-chip:hover{color:var(--ink,#ececf1);border-color:#4f7cff66}
.top-nav-chip.out{color:#f4636e;border-color:rgba(229,72,77,.3)}
@media (max-width:640px){
  .dash-hello{font-size:20px}
  .dash-grid{grid-template-columns:1fr}
  .top-nav-chip{flex:1;justify-content:center;height:44px}
}
`;

  function injectStyles() {
    if (document.getElementById('nexStudentStyles')) return;
    const st = document.createElement('style');
    st.id = 'nexStudentStyles';
    st.textContent = STYLES;
    document.head.appendChild(st);
  }

  function ensureDashDOM() {
    if (qs('#view-student')) return true;
    const main = qs('main#content') || qs('main');
    if (!main) {
      console.warn('[STUDENT] main#content مش موجود — هستنى…');
      return false;
    }
    const section = document.createElement('section');
    section.id = 'view-student';
    section.className = 'hidden';
    section.setAttribute('aria-label', 'لوحة الطالب');
    section.innerHTML = '<div class="nex-dash" id="studentDashInner"></div>';
    main.appendChild(section);
    console.info('[STUDENT] ✅ #view-student اتعمل');
    return true;
  }

  function emptyStateHTML() {
    return '' +
    '<div class="empty-dash">' +
      '<div class="empty-icon">📚</div>' +
      '<p class="empty-t">لسه مفيش كورسات مضافة لحسابك</p>' +
      '<p class="empty-d">تقدر تتصفح الكورسات المتاحة وتختار المجال المناسب ليك.<br>ولو دفعت بالفعل، كلمنا ونفعّل الكورس لحسابك فورًا.</p>' +
      '<button type="button" class="empty-btn" id="goCatalogBtn"><i class="bi bi-compass" aria-hidden="true"></i>تصفح الكورسات</button>' +
    '</div>';
  }

  function resolveCourseLink(enroll) {
    const c = catInfo(enroll.courseId);
    const appState = getAppState();
    if (appState) {
      const r = appState.resources.find((x) => x.title === c.title);
      if (r) {
        const locked = window.MCL ? MCL.isResourceLocked(r) : false;
        return { resource: r, url: r.url, locked };
      }
    }
    return { resource: null, url: null, locked: false };
  }

  function courseCardHTML(enroll) {
    const c = catInfo(enroll.courseId);
    const done = enroll.progress === 100;
    const pct = Number(enroll.progress || 0);
    return '' +
    '<article class="stu-card">' +
      '<div class="stu-top">' +
        '<span class="stu-cat">' + esc(c.category) + '</span>' +
        '<span class="stu-status ' + (done ? 'done' : 'active') + '">' + (done ? 'مكتمل 🏆' : 'متاح ليك ✅') + '</span>' +
      '</div>' +
      '<h3 class="stu-title">' + esc(c.title) + '</h3>' +
      '<p class="stu-desc">' + esc(c.description) + '</p>' +
      (pct > 0 ?
      '<div class="prog-wrap">' +
        '<div class="prog-bar"><div class="prog-fill" style="width:' + pct + '%"></div></div>' +
        '<p class="prog-txt">تقدّمك: ' + pct + '%</p>' +
      '</div>' : '') +
      '<div class="stu-cta">' +
        '<button type="button" class="stu-open" data-course-id="' + esc(enroll.courseId) + '" data-course-title="' + esc(c.title) + '">' +
          '<i class="bi bi-play-circle" aria-hidden="true"></i>ابدأ التعلم' +
        '</button>' +
      '</div>' +
    '</article>';
  }

  function openCourse(courseId, courseTitle) {
    const link = resolveCourseLink({ courseId });
    if (link.resource && link.url) {
      const openIt = () => window.open(link.url, '_blank', 'noopener,noreferrer');
      if (link.locked && window.MCL) {
        MCL.requireUnlock(link.resource, openIt);
      } else {
        openIt();
      }
      return;
    }
    window.open(WA + '?text=' + encodeURIComponent('أهلاً 👋 فعّلوا لي كورس «' + courseTitle + '» في حسابي'), '_blank', 'noopener,noreferrer');
  }

  function renderDash(user, profile, enrollments) {
    const inner = qs('#studentDashInner');
    if (!inner) return;
    const firstName = ((profile && profile.name) || user.displayName || 'صديقنا').split(' ')[0];
    const list = enrollments || [];

    const cards = list.length
      ? '<div class="dash-grid">' + list.map(courseCardHTML).join('') + '</div>'
      : emptyStateHTML();

    inner.innerHTML =
      '<div class="dash-hero">' +
        '<h2 class="dash-hello">أهلاً بيك يا ' + esc(firstName) + ' 👋</h2>' +
        '<p class="dash-sub">دي الكورسات المتاحة ليك — ' + list.length + ' كورس</p>' +
        '<div class="top-nav-row">' +
          '<a class="top-nav-chip" href="' + WA + '?text=' + encodeURIComponent('أهلاً 👋 عايز أشترك في كورس جديد') + '" target="_blank" rel="noopener noreferrer"><i class="bi bi-whatsapp" aria-hidden="true"></i>اشترك في كورس جديد</a>' +
          '<button type="button" class="top-nav-chip out" id="studentLogout"><i class="bi bi-box-arrow-left" aria-hidden="true"></i>خروج</button>' +
        '</div>' +
      '</div>' +
      cards;

    on('#studentLogout', 'click', async () => {
      await auth.signOut();
      location.reload();
    });

    on('#goCatalogBtn', 'click', () => {
      const btn = qs('[data-nav="view:catalog"]');
      if (btn) btn.click();
    });

    qsa('#studentDashInner [data-course-id]').forEach((b) =>
      b.addEventListener('click', () => openCourse(b.dataset.courseId, b.dataset.courseTitle)));
  }

  async function loadStudentData(user) {
    let profile = null;
    try {
      const doc = await db.collection('students').doc(user.uid).get();
      if (doc.exists) profile = doc.data();
    } catch (e) { console.warn('[STUDENT] البروفايل:', e.code); }

    let enrollments = [];
    try {
      const snap = await db.collection('enrollments')
        .where('userId', '==', user.uid)
        .where('status', '==', 'active')
        .get();
      enrollments = snap.docs.map((d) => d.data());

      /* 🗝️ فتح كورسات Drive المرتبطة باشتراكات الطالب */
      const map = (window.__COURSE_LIBRARY_MAP__ || {});
      const titles = enrollments
        .map((en) => map[en.courseId])
        .filter(Boolean);
      window.__accountAccess = {
        logged: true,
        allowedTitles: new Set(titles),
        has(title) { return this.allowedTitles.has(title); }
      };
      console.info('[STUDENT] ✅ حمّل', enrollments.length, 'كورس للطالب');
    } catch (e) {
      console.warn('[STUDENT] الاشتراكات:', e.code);
    }
    renderDash(user, profile, enrollments);
  }

  function ensureNav() {
    const nav = qs('#sideNav');
    if (!nav || qs('[data-nav="view:student"]')) return;
    const filesBtn = qs('[data-nav="view:files"]');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.nav = 'view:student';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="bi bi-person-circle text-[13.5px] w-4 text-center shrink-0" aria-hidden="true"></i>' +
                    '<span class="grow text-start truncate">حسابي</span>';
    if (filesBtn) filesBtn.after(btn);
    else nav.appendChild(btn);
  }

  function installSidebarHook() {
    if (window.__stuSidebarHooked) return;
    if (typeof window.renderSidebar !== 'function') return;
    window.__stuSidebarHooked = true;
    const orig = window.renderSidebar;
    window.renderSidebar = function () {
      try { orig(); } catch (e) { console.error('[STUDENT] renderSidebar:', e); }
      ensureNav();
      bindStudentNav();
    };
  }

  function showStudentView() {
    if (!qs('#view-student')) ensureDashDOM();
    qsa('main#content > section:not(#view-student)').forEach((s) => s.classList.add('hidden'));
    const v = qs('#view-student');
    if (v) v.classList.remove('hidden');
    const pt = qs('#pageTitle'); if (pt) pt.textContent = 'حسابي';
    const ps = qs('#pageSub');   if (ps) ps.textContent = 'كورساتك وتقدّمك';
    window.scrollTo(0, 0);
    const sb = qs('#sidebar'); if (sb) sb.classList.remove('open');
    const ov = qs('#overlay'); if (ov) ov.classList.add('hidden');
  }

  function bindStudentNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__studentNavBound) return;
    nav.__studentNavBound = true;
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('[data-nav="view:student"]');
      if (!b) return;
      e.preventDefault();
      showStudentView();
    });
  }

  function observeSideNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__studentObserver) return;
    nav.__studentObserver = new MutationObserver(() => {
      ensureNav();
      bindStudentNav();
    });
    nav.__studentObserver.observe(nav, { childList: true });
  }

  function boot() {
    injectStyles();
    ensureDashDOM();
    ensureNav();
    bindStudentNav();
    installSidebarHook();
    observeSideNav();

    let autoOpened = false;
    auth.onAuthStateChanged((user) => {
      /* 🛡️ المالك مالوش الداشبورد ده */
      if (user && user.email === OWNER_EMAIL) return;

      if (user) {
        ensureNav();
        bindStudentNav();
        loadStudentData(user);
        if (!autoOpened) {
          autoOpened = true;
          setTimeout(() => {
            const pt = qs('#pageTitle');
            const stillOnLibrary = pt && pt.textContent === 'المكتبة';
            if (stillOnLibrary) showStudentView();
          }, 300);
        }
      } else {
        const inner = qs('#studentDashInner');
        if (inner) {
          inner.innerHTML =
          '<div class="dash-hero">' +
            '<h2 class="dash-hello">أهلاً بيك في Nexora Academy 👋</h2>' +
            '<p class="dash-sub">أنشئ حسابك أو سجّل دخولك لتشوف كورساتك وتقدّمك</p>' +
            '<div class="top-nav-row">' +
              '<a class="top-nav-chip" style="color:#fff;background:linear-gradient(135deg,#4f7cff,#7c5cff);border:none" href="auth.html"><i class="bi bi-person-plus" aria-hidden="true"></i>تسجيل / دخول</a>' +
            '</div>' +
          '</div>';
        }
      }
    });
  }

  function waitForDOM(retries = 50) {
    const main = qs('main#content') || qs('main');
    const nav = qs('#sideNav');
    if (main && nav) {
      console.info('[STUDENT] DOM جاهز — boot');
      boot();
      return;
    }
    if (retries <= 0) {
      console.warn('[STUDENT] ⚠️ DOM مش جاهز — boot');
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

  window.NexoraStudent = {
    show: showStudentView,
    reload: () => {
      if (auth.currentUser) loadStudentData(auth.currentUser);
    }
  };
})();