/* ==========================================================
   roadmap.js — v15.1
   خرائط التعلم: مسارات بخطوات + تقدم محفوظ سحابيًا لكل طالب
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Roadmap — v15.1 ', 'background:#2684fc;color:#fff;font-weight:bold');

  const firebaseConfig = {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };

  /* تهيئة آمنة — cloud.js بيمر قبلنا وبيبدأ التطبيق بالفعل */
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ---------- الخرائط (بياناتك الفعلية بالترتيب) ---------- */
  const ROADMAPS = [
    {
      id: 'frontend-path',
      icon: '🎨',
      title: 'مسار Frontend الكامل',
      desc: 'من أول سطر HTML لحد مشاريع React حقيقية',
      mode: 'linear',
      steps: [
        { courseId: 'lib-html',      title: 'HTML — أساسيات البنية',        libTitle: 'HTML' },
        { courseId: 'lib-css',       title: 'CSS — التصميم والتنسيق',       libTitle: 'CSS' },
        { courseId: 'lib-js',        title: 'JavaScript — البرمجة الفعلية', libTitle: 'JavaScript' },
        { courseId: 'lib-tailwind',  title: 'Tailwind CSS — تصميم سريع',    libTitle: 'Tailwind CSS' },
        { courseId: 'lib-react',     title: 'React — بناء الواجهات الحديثة', libTitle: 'React' },
        { courseId: 'lib-react-proj',title: 'مشاريع React العملية',         libTitle: 'React Projects' },
        { courseId: 'lib-nextjs',    title: 'Next.js — الاحتراف الكامل',    libTitle: 'Next.js' }
      ]
    },
    {
      id: 'backend-path',
      icon: '⚙️',
      title: 'مسار Backend',
      desc: 'ابنِ الخدمات الخلفية وقواعد البيانات باحتراف',
      mode: 'linear',
      steps: [
        { courseId: 'lib-be-2024', title: 'أساسيات الباك إند',  libTitle: 'Back End 2024' },
        { courseId: 'lib-be-2025', title: 'الباك إند المتقدم',  libTitle: 'Back End 2025' }
      ]
    },
    {
      id: 'design-path',
      icon: '🖌️',
      title: 'مسار التصميم',
      desc: 'من مبادئ UI/UX لحد إتقان أدوبي',
      mode: 'free',
      steps: [
        { courseId: 'lib-uiux',       title: 'أساسيات UI/UX',     libTitle: 'Crash Course UI/UX' },
        { courseId: 'lib-photoshop',  title: 'Photoshop',         libTitle: 'Photoshop' },
        { courseId: 'lib-ps2',        title: 'Photoshop المتقدم', libTitle: 'Photoshop 2' },
        { courseId: 'lib-illustrator',title: 'Illustrator',       libTitle: 'Illustrator' }
      ]
    },
    {
      id: 'data-path',
      icon: '📊',
      title: 'مسار تحليل البيانات',
      desc: 'اتخذ قراراتك بالأرقام مش بالتخمين',
      mode: 'linear',
      steps: [
        { courseId: 'lib-da-2025', title: 'تحليل البيانات — المستوى الأول', libTitle: 'Data Analysis 2025' },
        { courseId: 'lib-da-2026', title: 'تحليل البيانات — المتقدم',       libTitle: 'Data Analysis 2026' }
      ]
    },
    {
      id: 'ai-path',
      icon: '🤖',
      title: 'مسار الذكاء الاصطناعي',
      desc: 'من أساسيات AI لحد بناء أنظمة ذكية',
      mode: 'linear',
      steps: [
        { courseId: 'lib-ai',      title: 'أساسيات الذكاء الاصطناعي',        libTitle: 'AI' },
        { courseId: 'lib-ai-ml',   title: 'Data Science و Machine Learning', libTitle: 'AI Data Science / ML' },
        { courseId: 'lib-ai-auto', title: 'أتمتة الأعمال بالذكاء الاصطناعي', libTitle: 'AI Automation' }
      ]
    },
    {
      id: 'cs-path',
      icon: '💻',
      title: 'أساسيات علوم الحاسب',
      desc: 'ابدأ من الصفر الصحيح — أساسات قوية قبل أي تخصص',
      mode: 'free',
      steps: [
        { courseId: 'lib-into', title: 'Into The Program — البداية', libTitle: 'Into The Program' },
        { courseId: 'lib-cs50', title: 'CS50 — علوم الحاسب',         libTitle: 'CS50 - Computer Science Fundamentals' }
      ]
    }
  ];

  /* ---------- حالة التقدم ---------- */
  let currentUser = null;
  let progress = {};

  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* ---------- أنماط ---------- */
  const STYLES = `
.rm-wrap{max-width:900px;margin:0 auto}
.rm-tabs{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;margin-bottom:20px}
.rm-tab{white-space:nowrap;display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:14px;border:1px solid var(--edge,#212129);background:var(--panel,#101015);color:var(--mut,#9c9cab);font-size:13px;font-weight:600;cursor:pointer;transition:.15s;font-family:inherit}
.rm-tab:hover{color:var(--ink,#ececf1);border-color:#4f7cff66}
.rm-tab.active{background:linear-gradient(135deg,#4f7cff,#7c5cff);border-color:transparent;color:#fff}
.rm-hero{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:20px;padding:24px;margin-bottom:22px}
.rm-hero-icon{font-size:40px;margin-bottom:8px}
.rm-hero-title{font-size:22px;font-weight:800;margin-bottom:6px}
.rm-hero-desc{font-size:13.5px;color:var(--mut,#9c9cab);line-height:1.8}
.rm-hero-meta{display:flex;gap:12px;margin-top:12px;flex-wrap:wrap}
.rm-chip{font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px}
.rm-chip.mode{color:#7ea2ff;background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.3)}
.rm-chip.prog{color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3)}
.rm-steps{position:relative;padding-inline-start:28px}
.rm-steps::before{content:'';position:absolute;inset-inline-start:9px;top:12px;bottom:12px;width:2px;background:var(--edge,#212129)}
.rm-step{position:relative;margin-bottom:14px}
.rm-step-dot{position:absolute;inset-inline-start:-28px;top:22px;width:20px;height:20px;border-radius:50%;background:var(--bg,#0a0a0d);border:2px solid var(--edge2,#2e2e39);display:grid;place-items:center;font-size:10px;z-index:1}
.rm-step.done .rm-step-dot{background:#4ade80;border-color:#4ade80;color:#052e12}
.rm-step-card{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:16px;padding:16px 18px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;transition:.15s}
.rm-step.done .rm-step-card{border-color:rgba(74,222,128,.35)}
.rm-step.locked .rm-step-card{opacity:.55}
.rm-step-num{font-size:10.5px;font-weight:800;color:var(--dim,#66666f);min-width:52px}
.rm-step-title{flex:1;min-width:140px;font-size:14px;font-weight:700;line-height:1.5}
.rm-step-actions{display:flex;gap:8px;flex-wrap:wrap}
.rm-btn{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;border:none;font-family:inherit;text-decoration:none;transition:.15s}
.rm-btn.open{background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.35);color:#7ea2ff}
.rm-btn.open:hover{background:rgba(79,124,255,.22)}
.rm-btn.done-btn{background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.35);color:#4ade80}
.rm-btn.done-btn:hover{background:rgba(74,222,128,.2)}
.rm-btn.wa{background:#25D366;color:#04310f}
.rm-hint{font-size:11px;color:var(--dim,#66666f);margin-top:4px}
@media (max-width:640px){
  .rm-hero{padding:18px}
  .rm-hero-title{font-size:19px}
  .rm-step-card{padding:14px}
  .rm-step-title{min-width:100%}
  .rm-step-actions{width:100%}
  .rm-btn{flex:1;justify-content:center}
}
`;

  /* ---------- الربط بكورسات المكتبة ----------
     ملاحظة مهمة: state معرّف بـconst في app.js (global lexical) —
     بنوصل له بالاسم المباشر، مش window.state (اللي مش موجود أبدًا). */
  function findLibResource(libTitle) {
    try {
      if (typeof state !== 'undefined' && state && Array.isArray(state.resources)) {
        return state.resources.find((r) => r.title === libTitle) || null;
      }
    } catch (e) { /* app.js لسه محمّلش — نرجّع null بهدوء */ }
    return null;
  }

  function stepLockInfo(step) {
    const r = findLibResource(step.libTitle);
    if (!r) return { resource: null, locked: false, reason: '' };
    if (r.source !== 'Google Drive') return { resource: r, locked: false };
    if (window.MCL && !MCL.isResourceLocked(r)) return { resource: r, locked: false };
    return { resource: r, locked: true, reason: 'اشترك في الكورس ده الأول' };
  }

  /* ---------- DOM ---------- */
  function ensureRoadmapDOM() {
    if (qs('#view-roadmap')) return;
    const main = qs('main#content') || qs('main');
    if (!main) return;
    if (!document.getElementById('nexRoadmapStyles')) {
      const st = document.createElement('style');
      st.id = 'nexRoadmapStyles';
      st.textContent = STYLES;
      document.head.appendChild(st);
    }
    const section = document.createElement('section');
    section.id = 'view-roadmap';
    section.className = 'hidden';
    section.setAttribute('aria-label', 'خرائط التعلم');
    section.innerHTML = `<div class="rm-wrap" id="rmInner"></div>`;
    main.appendChild(section);
  }

  /* ---------- التقدم: تحميل وحفظ ---------- */
  async function loadProgress() {
    if (!currentUser) { progress = {}; return; }
    try {
      const doc = await db.collection('roadmapProgress').doc(currentUser.uid).get();
      progress = (doc.exists && doc.data().steps) ? doc.data().steps : {};
    } catch (e) {
      console.warn('[RM] تحميل التقدم:', e.code);
      progress = {};
    }
  }

  async function saveStep(roadmapId, idx, on) {
    progress[roadmapId] = progress[roadmapId] || {};
    progress[roadmapId][idx] = on;
    if (!currentUser) return; /* مش مسجل → محلي مؤقت بس */
    try {
      await db.collection('roadmapProgress').doc(currentUser.uid).set({ steps: progress }, { merge: true });
    } catch (e) {
      console.warn('[RM] حفظ التقدم:', e.code);
    }
  }

  function roadmapProgress(rm) {
    const p = progress[rm.id] || {};
    const done = rm.steps.filter((_, i) => p[i]).length;
    return { done, total: rm.steps.length, pct: Math.round((done / rm.steps.length) * 100) };
  }

  /* ---------- الرسم ---------- */
  function tabsHTML() {
    return `<div class="rm-tabs">${ROADMAPS.map((rm, i) => `
      <button class="rm-tab ${i === 0 ? 'active' : ''}" data-rm-tab="${esc(rm.id)}">
        <span>${rm.icon}</span>${esc(rm.title)}
      </button>`).join('')}</div>`;
  }

  function heroHTML(rm) {
    const pr = roadmapProgress(rm);
    return `
    <div class="rm-hero">
      <div class="rm-hero-icon">${rm.icon}</div>
      <h2 class="rm-hero-title">${esc(rm.title)}</h2>
      <p class="rm-hero-desc">${esc(rm.desc)}</p>
      <div class="rm-hero-meta">
        <span class="rm-chip mode">${rm.mode === 'linear' ? '🔗 مسار متسلسل — ماشي بالترتيب' : '🧭 مسار مرن — ابدأ من أي مكان'}</span>
        <span class="rm-chip prog">تقدّمك: ${pr.done}/${pr.total} (${pr.pct}%)</span>
      </div>
    </div>`;
  }

  function stepHTML(rm, step, i) {
    const p = progress[rm.id] || {};
    const done = !!p[i];
    const info = stepLockInfo(step);
    let lockedBySeq = false;
    if (rm.mode === 'linear' && !done && i > 0 && !p[i - 1]) lockedBySeq = true;
    const locked = info.locked || lockedBySeq;

    const cls = done ? 'done' : (locked ? 'locked' : '');
    const dot = done ? '✓' : (i + 1);

    let actions = '';
    if (info.resource && !locked) {
      actions += `<a class="rm-btn open" href="${esc(info.resource.url)}" target="_blank" rel="noopener noreferrer">
        <i class="bi bi-play-circle"></i>افتح الكورس</a>`;
    } else if (locked && info.locked) {
      actions += `<a class="rm-btn wa" href="https://wa.me/201096295395?text=${encodeURIComponent('أهلاً 👋 عايز أشترك في كورس «' + step.libTitle + '» عشان أكمل المسار')}" target="_blank" rel="noopener noreferrer">
        <i class="bi bi-whatsapp"></i>اشترك</a>`;
    }
    if (done) {
      actions += `<button type="button" class="rm-btn done-btn" data-rm-undone="${esc(rm.id)}" data-rm-idx="${i}">
        <i class="bi bi-arrow-counterclockwise"></i>رجّعها</button>`;
    } else if (!locked) {
      actions += `<button type="button" class="rm-btn done-btn" data-rm-done="${esc(rm.id)}" data-rm-idx="${i}">
        <i class="bi bi-check2-circle"></i>خلصت الخطوة دي ✓</button>`;
    }

    const hint = lockedBySeq && !info.locked ? '<p class="rm-hint">🔗 خلّص الخطوة اللي قبلها الأول</p>'
      : (info.locked ? '<p class="rm-hint">🔒 ' + esc(info.reason) + '</p>' : '');

    return `
    <div class="rm-step ${cls}">
      <span class="rm-step-dot">${dot}</span>
      <div class="rm-step-card">
        <span class="rm-step-num">خطوة ${i + 1}</span>
        <h3 class="rm-step-title">${esc(step.title)}</h3>
        <div class="rm-step-actions">${actions}</div>
        ${hint}
      </div>
    </div>`;
  }

  function renderRoadmap(rmId) {
    const rm = ROADMAPS.find((r) => r.id === rmId) || ROADMAPS[0];
    const inner = qs('#rmInner');
    if (!inner) return;
    inner.innerHTML = heroHTML(rm) + `<div class="rm-steps">${rm.steps.map((s, i) => stepHTML(rm, s, i)).join('')}</div>`;

    qsa('#rmInner [data-rm-done]').forEach((b) => b.addEventListener('click', async () => {
      await saveStep(b.dataset.rmDone, Number(b.dataset.rmIdx), true);
      renderRoadmap(rm.id);
    }));
    qsa('#rmInner [data-rm-undone]').forEach((b) => b.addEventListener('click', async () => {
      await saveStep(b.dataset.rmUndone, Number(b.dataset.rmIdx), false);
      renderRoadmap(rm.id);
    }));
  }

  function renderAll() {
    const inner = qs('#rmInner');
    if (!inner) return;
    inner.innerHTML = `
    <div style="padding:20px 0 16px">
      <h2 style="font-size:22px;font-weight:800">خرائط التعلم 🗺️</h2>
      <p style="font-size:13px;color:var(--mut,#9c9cab);margin-top:4px">
        مسارات مرتبة بخطوات واضحة — اختار مسارك وابدأ، وتقدّمك بيتحفظ معاك</p>
    </div>
    ${tabsHTML()}
    <div id="rmDetail"></div>`;
    renderRoadmap(ROADMAPS[0].id);
    qsa('[data-rm-tab]').forEach((t) => t.addEventListener('click', () => {
      qsa('[data-rm-tab]').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      renderRoadmap(t.dataset.rmTab);
    }));
  }

  /* ---------- بند القايمة + إعادة الحقن بعد كل رسم ---------- */
  function ensureNavEntry() {
    const nav = qs('#sideNav');
    if (!nav || qs('[data-nav="view:roadmap"]')) return;
    const cat = qs('[data-nav="view:catalog"]');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.nav = 'view:roadmap';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="bi bi-signpost-split text-[13.5px] w-4 text-center shrink-0"></i>' +
                    '<span class="grow text-start truncate">خرائط التعلم</span>';
    if (cat) cat.after(btn);
    else nav.appendChild(btn);
  }

  /* الهوك بيتنصّب مؤجَّلًا (من boot) — بعد ما app.js يعرّف renderSidebar */
  function installSidebarHook() {
    if (window.__rmSidebarHooked) return;
    const orig = window.renderSidebar;
    if (typeof orig !== 'function') return;
    window.__rmSidebarHooked = true;
    window.renderSidebar = function () {
      orig();
      ensureNavEntry();
    };
  }

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-nav="view:roadmap"]');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    qsa('main#content > section:not(#view-roadmap)').forEach((s) => s.classList.add('hidden'));
    qs('#view-roadmap')?.classList.remove('hidden');
    qs('#pageTitle').textContent = 'خرائط التعلم';
    qs('#pageSub').textContent = 'اختار مسارك واتبع الخطوات';
    window.scrollTo(0, 0);
    qs('#sidebar')?.classList.remove('open');
    qs('#overlay')?.classList.add('hidden');
    await loadProgress();
    renderAll();
  }, true);

  /* ---------- تشغيل (مؤجَّل — بعد جاهزية app.js) ---------- */
  function boot() {
    ensureRoadmapDOM();
    ensureNavEntry();
    installSidebarHook(); /* ← هنا بتلقائي: renderSidebar مبقى موجود */
    auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      ensureNavEntry();
      if (user) await loadProgress();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();