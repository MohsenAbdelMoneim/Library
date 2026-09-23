/* ==========================================================
   roadmap.js — v19 (Comprehensive Edition)
   ✅ v19: مسارات موسّعة (DevOps / قواعد بيانات / ألعاب / تسويق / ICDL)
   ✅ v19: حفظ تقدّم الزوار في localStorage + دمج تلقائي عند تسجيل الدخول
   ✅ v19: بحث فوري في كل المسارات + فلاتر (الكل / المتبقي / المكتمل)
   ✅ v19: Gamification — XP + مستويات + شارات
   ✅ v19: توصية "الخطوة الجاية" + تنقّل مباشر ليها
   ✅ v19: ملاحظات شخصية لكل خطوة (تتزامن مع Firestore)
   ✅ v19: شهادة إتمام المسار قابلة للطباعة/PDF
   ✅ v19: تصدير/استيراد التقدّم (JSON) + تصفير
   ✅ v19: Toasts بدل alert
   ✅ v19: إصلاحات v18: role مكرر على <ol>، gradient مكسور، ترقيم الأقساط
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Roadmap — v19 Comprehensive ', 'background:#2684fc;color:#fff;font-weight:bold');

  /* ---------- Firebase ---------- */
  const firebaseConfig = window.__FIREBASE_CONFIG__ || {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };

  if (typeof firebase === 'undefined') {
    console.error('[RM] Firebase SDK مش محمّل');
    return;
  }
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  /* ---------- Helpers ---------- */
  const qs  = (s, el) => (el || document).querySelector(s);
  const qsa = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const truncate = (s, n) => (s && s.length > n) ? s.slice(0, n - 1) + '…' : String(s || '');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fmtNum(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return '0';
    try { return v.toLocaleString('ar-EG-u-nu-latn'); }
    catch { return String(v); }
  }

  function waLinkFor(title) {
    const phone = (window.MCL && MCL.CONTACT_PHONE) || '01096295395';
    const intl = String(phone).replace(/^0/, '20');
    const text = `أهلاً 👋 عايز أشترك في كورس «${title}»`;
    return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
  }

  /* ---------- Toast ---------- */
  function toast(msg, type) {
    let holder = qs('#rmToasts');
    if (!holder) {
      holder = document.createElement('div');
      holder.id = 'rmToasts';
      document.body.appendChild(holder);
    }
    const t = document.createElement('div');
    t.className = 'rm-toast' + (type ? ' ' + type : '');
    t.setAttribute('role', 'status');
    t.textContent = msg;
    holder.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 3200);
  }

  /* ---------- بناء المسارات ---------- */
  let _catalogCacheKey = '';
  let _catalogCache = null;

  function catalogCacheKey(courses) {
    return courses.map((c) => `${c.id}:${c.category}:${c.order ?? ''}`).join('|');
  }

  const PATHS = [
    { id:'frontend-path',  icon:'🎨', title:'مسار Frontend', desc:'من HTML لحد React و Next.js',
      categories:['Frontend','HTML','CSS','JavaScript','Tailwind CSS','Bootstrap','React','Next.js'],
      color:'var(--rm-c-frontend,#4f7cff)' },
    { id:'backend-path',   icon:'⚙️', title:'مسار Backend', desc:'ابنِ الخدمات الخلفية وقواعد البيانات',
      categories:['Backend','Node.js','PHP','Laravel','Python'],
      color:'var(--rm-c-backend,#22c55e)' },
    { id:'fullstack-path', icon:'🚀', title:'مسار Full Stack', desc:'الواجهة والخلفية مع بعض',
      categories:['Full Stack'], color:'var(--rm-c-fullstack,#f0b53e)' },
    { id:'mobile-path',    icon:'📱', title:'مسار الموبايل', desc:'تطوير تطبيقات الموبايل',
      categories:['Mobile App','Flutter','React Native'], color:'var(--rm-c-mobile,#a855f7)' },
    { id:'design-path',    icon:'🖌️', title:'مسار التصميم', desc:'من مبادئ UI/UX لحد إتقان أدوبي',
      categories:['UI/UX','Graphic Design','Video Editing','Motion Graphics'],
      color:'var(--rm-c-design,#ec4899)' },
    { id:'data-path',      icon:'📊', title:'مسار تحليل البيانات', desc:'اتخذ قراراتك بالأرقام',
      categories:['Data Analysis','Excel','Power BI'], color:'var(--rm-c-data,#06b6d4)' },
    { id:'ai-path',        icon:'🤖', title:'مسار الذكاء الاصطناعي', desc:'من أساسيات AI لحد بناء أنظمة ذكية',
      categories:['AI','Machine Learning','Deep Learning'], color:'var(--rm-c-ai,#8b5cf6)' },
    { id:'cyber-path',     icon:'🔐', title:'مسار الأمن السيبراني', desc:'أساسيات وعمق الأمن السيبراني',
      categories:['Cyber Security','Ethical Hacking'], color:'var(--rm-c-cyber,#ef4444)' },
    { id:'devops-path',    icon:'🐳', title:'مسار DevOps', desc:'Linux و Git و Docker والنشر في السحابة',
      categories:['DevOps','Linux','Git','Docker','CI/CD','AWS'], color:'var(--rm-c-devops,#0ea5e9)' },
    { id:'db-path',        icon:'🗄️', title:'مسار قواعد البيانات', desc:'تصميم وإدارة قواعد البيانات SQL و NoSQL',
      categories:['Database','SQL','MySQL','MongoDB','PostgreSQL'], color:'var(--rm-c-db,#14b8a6)' },
    { id:'game-path',      icon:'🎮', title:'مسار تطوير الألعاب', desc:'من الفكرة لنسخة قابلة للّعب',
      categories:['Game Dev','Unity','Unreal','Game Development'], color:'var(--rm-c-game,#f97316)' },
    { id:'marketing-path', icon:'📈', title:'مسار التسويق الرقمي', desc:'SEO وسوشيال ميديا والإعلانات المدفوعة',
      categories:['Digital Marketing','Marketing','SEO','Social Media','Ads'],
      color:'var(--rm-c-marketing,#d946ef)' },
    { id:'icdl-path',      icon:'💻', title:'مسار ICDL والأوفيس', desc:'مهارات الكمبيوتر الأساسية بثقة',
      categories:['ICDL','Office','Word','PowerPoint','Computer Basics'],
      color:'var(--rm-c-icdl,#84cc16)' },
    { id:'other-path',     icon:'📦', title:'كورسات متنوعة', desc:'كورسات في مجالات مختلفة',
      categories:['Other'], color:'var(--rm-c-other,#64748b)' }
  ];

  function buildRoadmapsFromCatalog() {
    const src = window.__NEXORA_CATALOG__ || { courses: [] };
    const courses = src.courses || [];
    if (!courses.length) return [];

    const key = catalogCacheKey(courses);
    if (key === _catalogCacheKey && _catalogCache) return _catalogCache;

    const result = [];
    const usedCourseIds = new Set();

    PATHS.forEach((path) => {
      const matching = courses.filter((c) =>
        path.categories.includes(c.category) && !usedCourseIds.has(c.id)
      );
      if (matching.length === 0) return;

      matching.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      matching.forEach((c) => usedCourseIds.add(c.id));

      result.push({
        id: path.id, icon: path.icon, title: path.title, desc: path.desc,
        color: path.color, steps: matching.map(mapCourseToStep)
      });
    });

    const orphans = courses.filter((c) => !usedCourseIds.has(c.id));
    if (orphans.length) {
      orphans.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      result.push({
        id: 'misc-path', icon: '🎓', title: 'كورسات إضافية', desc: 'كورسات متنوعة',
        color: 'var(--rm-c-other,#64748b)', steps: orphans.map(mapCourseToStep)
      });
    }

    _catalogCacheKey = key;
    _catalogCache = result;
    return result;
  }

  function mapCourseToStep(c) {
    return {
      courseId: c.id,
      title: c.title,
      description: c.description || '',
      category: c.category || '',
      duration: c.duration || '',           /* اختياري: لو الكتالوج فيه مدة */
      cashPrice: c.cashPrice || 0,
      installmentAmount: c.installmentAmount || 0,
      installmentCount: c.installmentCount || 0,
      installmentTotal: c.installmentTotal || 0
    };
  }

  /* ---------- حالة ---------- */
  let currentUser = null;
  let progress = {};        /* { roadmapId: { 0: true, 3: true } } */
  let notes = {};           /* { roadmapId: { 0: 'نص الملاحظة' } } */
  let ROADMAPS = [];
  let activeTabId = null;
  let searchQuery = '';
  let filterMode = 'all';   /* all | todo | done */
  let loadState = 'idle';   /* idle | loading | ready | error */
  let loadError = '';
  let authUnsub = null;

  /* ---------- التخزين المحلي (زوار + نسخة احتياطية) ---------- */
  const GUEST_KEY = 'nexora_roadmap_guest_v1';

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(GUEST_KEY) || '{}') || {}; }
    catch { return {}; }
  }
  function persistLocal() {
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(
        { steps: progress, notes, updatedAt: Date.now() }
      ));
    } catch { /* التخزين ممتلئ أو ممنوع */ }
  }

  async function persistAll() {
    if (!currentUser) { persistLocal(); return { ok: true, local: true }; }
    try {
      await db.collection('roadmapProgress').doc(currentUser.uid)
        .set({ steps: progress, notes }, { merge: true });
      return { ok: true };
    } catch (e) {
      console.warn('[RM] حفظ التقدّم:', e.code);
      persistLocal(); /* نسخة احتياطية لحد ما الاتصال يرجع */
      return { ok: false, reason: e.code };
    }
  }

  /* ---------- Progress ---------- */
  async function loadProgress() {
    if (!currentUser) {
      const g = readLocal();
      progress = g.steps || {};
      notes = g.notes || {};
      loadState = 'ready';
      return;
    }
    loadState = 'loading';
    loadError = '';
    try {
      const doc = await db.collection('roadmapProgress').doc(currentUser.uid).get();
      const remote = doc.exists ? doc.data() : {};
      const remoteSteps = remote.steps || {};
      const remoteNotes = remote.notes || {};

      /* ⚡ دمج تقدّم الزائر اللي اشتغل بدون تسجيل */
      const g = readLocal();
      let hadGuest = false;
      Object.keys(g.steps || {}).forEach((rid) => {
        remoteSteps[rid] = Object.assign({}, g.steps[rid], remoteSteps[rid] || {});
        hadGuest = true;
      });
      Object.keys(g.notes || {}).forEach((rid) => {
        remoteNotes[rid] = Object.assign({}, g.notes[rid], remoteNotes[rid] || {});
        hadGuest = true;
      });

      progress = remoteSteps;
      notes = remoteNotes;

      if (hadGuest) {
        try {
          await db.collection('roadmapProgress').doc(currentUser.uid)
            .set({ steps: progress, notes }, { merge: true });
          try { localStorage.removeItem(GUEST_KEY); } catch {}
          toast('✅ اتمزام تقدّمك اللي اشتغلته كزائر مع حسابك', 'ok');
        } catch (e) { console.warn('[RM] دمج الزائر:', e.code); }
      }
      loadState = 'ready';
    } catch (e) {
      console.warn('[RM] تحميل التقدّم:', e.code);
      const g = readLocal();
      progress = g.steps || {};
      notes = g.notes || {};
      loadState = 'error';
      loadError = e.code || 'unknown';
    }
  }

  async function saveStep(rmId, idx, on) {
    progress[rmId] = progress[rmId] || {};
    if (on) progress[rmId][idx] = true;
    else delete progress[rmId][idx];
    return persistAll();
  }

  /* ---------- ملاحظات (Debounce) ---------- */
  const _noteTimers = {};
  function saveNoteDebounced(rmId, idx, text) {
    notes[rmId] = notes[rmId] || {};
    const t = String(text || '').trim();
    if (t) notes[rmId][idx] = t;
    else delete notes[rmId][idx];
    const key = rmId + ':' + idx;
    clearTimeout(_noteTimers[key]);
    _noteTimers[key] = setTimeout(() => { persistAll(); }, 700);
  }

  /* ---------- Gamification ---------- */
  const STEP_XP = 10, PATH_BONUS = 50;

  function computeStats() {
    let totalDone = 0, pathsDone = 0;
    ROADMAPS.forEach((rm) => {
      const p = progress[rm.id] || {};
      const d = rm.steps.filter((_, i) => p[i]).length;
      totalDone += d;
      if (rm.steps.length && d === rm.steps.length) pathsDone++;
    });
    const xp = totalDone * STEP_XP + pathsDone * PATH_BONUS;
    return {
      totalDone, pathsDone, xp,
      level: Math.floor(xp / 100) + 1,
      inLevel: xp % 100
    };
  }

  function computeBadges(st) {
    const b = [];
    if (st.totalDone >= 1)  b.push({ icon:'🌱', label:'أول خطوة' });
    if (st.totalDone >= 5)  b.push({ icon:'🔥', label:'5 خطوات' });
    if (st.totalDone >= 25) b.push({ icon:'⭐', label:'25 خطوة' });
    if (st.pathsDone >= 1)  b.push({ icon:'🏆', label:'أول مسار كامل' });
    if (st.pathsDone >= 3)  b.push({ icon:'👑', label:'3 مسارات كاملة' });
    if (st.level >= 5)      b.push({ icon:'🚀', label:'مستوى 5' });
    return b;
  }

  function getPathProgress(rm) {
    const p = progress[rm.id] || {};
    const done = rm.steps.filter((_, i) => p[i]).length;
    const total = rm.steps.length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function getNextStep(rm) {
    const p = progress[rm.id] || {};
    for (let i = 0; i < rm.steps.length; i++) {
      if (!p[i]) return { step: rm.steps[i], idx: i };
    }
    return null;
  }

  /* ---------- أنماط ---------- */
  const STYLES = `
:root{
  --rm-c-frontend:#4f7cff; --rm-c-backend:#22c55e; --rm-c-fullstack:#f0b53e;
  --rm-c-design:#ec4899;   --rm-c-mobile:#a855f7;  --rm-c-data:#06b6d4;
  --rm-c-ai:#8b5cf6;       --rm-c-cyber:#ef4444;   --rm-c-other:#64748b;
  --rm-c-devops:#0ea5e9;   --rm-c-db:#14b8a6;      --rm-c-game:#f97316;
  --rm-c-marketing:#d946ef;--rm-c-icdl:#84cc16;
}
.rm-wrap{max-width:1000px;margin:0 auto;padding-bottom:40px}
.rm-header{padding:4px 0 20px}
.rm-header h2{font-size:24px;font-weight:900;margin-bottom:6px}
.rm-header p{font-size:13.5px;color:var(--mut,#9c9cab);line-height:1.8}

.rm-search{display:flex;align-items:center;gap:10px;background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:14px;padding:0 14px;margin-bottom:18px;transition:border-color .15s}
.rm-search:focus-within{border-color:#4f7cff66}
.rm-search i{color:var(--mut,#9c9cab);font-size:14px}
.rm-search input{flex:1;background:none;border:none;outline:none;color:var(--ink,#ececf1);font:inherit;font-size:13.5px;height:44px;min-width:0}
.rm-search button{background:none;border:none;color:var(--mut,#9c9cab);cursor:pointer;font-size:14px;padding:6px}
.rm-search button:hover{color:var(--ink,#ececf1)}

.rm-statsbar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:linear-gradient(135deg,rgba(79,124,255,.08),rgba(124,92,255,.06));border:1px solid rgba(79,124,255,.25);border-radius:16px;padding:14px 18px;margin-bottom:18px}
.rm-stats-main{display:flex;align-items:center;gap:14px;flex-wrap:wrap;flex:1}
.rm-level{display:flex;align-items:center;gap:10px}
.rm-level-num{font-weight:900;font-size:15px;background:linear-gradient(135deg,#4f7cff,#7c5cff);-webkit-background-clip:text;background-clip:text;color:transparent}
.rm-xpbar{width:110px;height:6px;background:var(--bg,#0a0a0d);border:1px solid var(--edge,#212129);border-radius:999px;overflow:hidden}
.rm-xpbar>div{height:100%;background:linear-gradient(90deg,#4f7cff,#7c5cff);border-radius:999px;transition:width .4s ease}
.rm-xp-txt{font-size:10.5px;color:var(--dim,#66666f);font-weight:700}
.rm-mini{font-size:12px;color:var(--mut,#9c9cab)}
.rm-mini b{color:var(--ink,#ececf1);font-size:14px}
.rm-badges{display:flex;gap:6px;flex-wrap:wrap}
.rm-badge{font-size:16px;width:30px;height:30px;display:grid;place-items:center;background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:10px}
.rm-tools{display:flex;gap:6px;flex-wrap:wrap}
.rm-tool{display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 12px;border-radius:9px;border:1px solid var(--edge,#212129);background:var(--panel,#101015);color:var(--mut,#9c9cab);font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:.15s}
.rm-tool:hover{color:var(--ink,#ececf1);border-color:#4f7cff66}

.rm-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:24px;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.rm-tab{white-space:nowrap;display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:14px;border:1px solid var(--edge,#212129);background:var(--panel,#101015);color:var(--mut,#9c9cab);font-size:13px;font-weight:600;cursor:pointer;transition:.15s;font-family:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.rm-tab:hover{color:var(--ink,#ececf1);border-color:#4f7cff66}
.rm-tab:focus-visible{outline:2px solid #4f7cff;outline-offset:2px}
.rm-tab.active{background:linear-gradient(135deg,#4f7cff,#7c5cff);border-color:transparent;color:#fff}
.rm-tab .rm-tab-count{font-size:10.5px;font-weight:700;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:999px}

.rm-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
.rm-fchip{padding:7px 14px;border-radius:10px;border:1px solid var(--edge,#212129);background:var(--panel,#101015);color:var(--mut,#9c9cab);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:.15s}
.rm-fchip:hover{color:var(--ink,#ececf1)}
.rm-fchip.active{background:rgba(79,124,255,.15);border-color:rgba(79,124,255,.45);color:#7ea2ff}

.rm-hero{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:20px;padding:26px;margin-bottom:20px;position:relative;overflow:hidden}
.rm-hero::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 100% 0%,var(--hero-color,#4f7cff),transparent 60%);pointer-events:none;opacity:.12}
.rm-hero-content{position:relative;z-index:1}
.rm-hero-icon{font-size:44px;margin-bottom:10px;line-height:1}
.rm-hero-title{font-size:24px;font-weight:900;margin-bottom:6px}
.rm-hero-desc{font-size:14px;color:var(--mut,#9c9cab);line-height:1.8;max-width:600px}
.rm-hero-meta{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.rm-hero-cta{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.rm-next{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;border:1px solid rgba(79,124,255,.35);background:rgba(79,124,255,.1);color:#7ea2ff;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;transition:.15s;max-width:100%;text-align:start}
.rm-next:hover{background:rgba(79,124,255,.18)}
.rm-chip{font-size:11.5px;font-weight:700;padding:5px 14px;border-radius:999px;display:inline-flex;align-items:center;gap:6px}
.rm-chip.prog{color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3)}
.rm-chip.count{color:#7ea2ff;background:rgba(79,124,255,.1);border:1px solid rgba(79,124,255,.3)}
.rm-chip.gold{color:#f0b53e;background:rgba(240,181,62,.1);border:1px solid rgba(240,181,62,.3)}
.rm-progress-bar{height:6px;background:var(--bg,#0a0a0d);border-radius:999px;overflow:hidden;margin-top:14px;border:1px solid var(--edge,#212129)}
.rm-progress-fill{height:100%;background:linear-gradient(90deg,#4ade80,#22c55e);border-radius:999px;transition:width .4s ease}

.rm-steps{position:relative;padding-inline-start:34px;list-style:none;margin:0}
.rm-steps::before{content:'';position:absolute;inset-inline-start:11px;top:24px;bottom:24px;width:2px;background:linear-gradient(180deg,var(--hero-color,#4f7cff),var(--edge,#212129))}
.rm-step{position:relative;margin-bottom:16px}
.rm-step-dot{position:absolute;inset-inline-start:-34px;top:24px;width:24px;height:24px;border-radius:50%;background:var(--bg,#0a0a0d);border:2px solid var(--edge2,#2e2e39);display:grid;place-items:center;font-size:11px;font-weight:800;color:var(--dim,#66666f);z-index:1;transition:.2s}
.rm-step.done .rm-step-dot{background:#4ade80;border-color:#4ade80;color:#052e12}
.rm-step-card{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:16px;padding:18px 20px;transition:.2s;position:relative;overflow:hidden}
.rm-step-card:hover{border-color:var(--hero-color,#4f7cff)}
.rm-step.done .rm-step-card{border-color:rgba(74,222,128,.35)}
.rm-step-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.rm-step-num{font-size:10.5px;font-weight:800;color:var(--dim,#66666f);text-transform:uppercase;letter-spacing:.5px}
.rm-step-head-chips{display:flex;gap:6px;flex-wrap:wrap}
.rm-step-cat{font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.3);color:#7ea2ff;align-self:flex-start}
.rm-step-dur{font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(124,92,255,.12);border:1px solid rgba(124,92,255,.3);color:#b79cff;align-self:flex-start}
.rm-step-hint{font-size:11px;color:#f0b53e;background:rgba(240,181,62,.08);border:1px dashed rgba(240,181,62,.3);border-radius:9px;padding:6px 10px;margin-bottom:10px;display:inline-block}
.rm-step-title{flex:1;font-size:15px;font-weight:800;line-height:1.5;min-width:180px}
.rm-step-desc{font-size:12.5px;color:var(--mut,#9c9cab);line-height:1.7;margin-bottom:12px}
.rm-step-prices{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;font-size:12.5px;align-items:baseline}
.rm-price-cash{font-size:16px;font-weight:900;color:#4ade80}
.rm-price-inst{color:var(--mut,#9c9cab);font-size:11.5px}
.rm-step-actions{display:flex;gap:8px;flex-wrap:wrap}
.rm-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:40px;padding:0 16px;border-radius:11px;font-size:12.5px;font-weight:700;cursor:pointer;border:none;font-family:inherit;text-decoration:none;transition:.15s;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.rm-btn:focus-visible{outline:2px solid #4f7cff;outline-offset:2px}
.rm-btn.open{background:var(--hero-color,#4f7cff);color:#fff}
.rm-btn.open:hover{opacity:.9}
.rm-btn.done-btn{background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.35);color:#4ade80}
.rm-btn.done-btn:hover{background:rgba(74,222,128,.2)}
.rm-btn.undone-btn{background:rgba(240,181,62,.1);border:1px solid rgba(240,181,62,.3);color:#f0b53e}
.rm-btn.wa{background:#25D366;color:#04310f}
.rm-btn.cert{background:linear-gradient(135deg,#f0b53e,#e08e0b);color:#231400}
.rm-btn[aria-busy="true"]{opacity:.6;pointer-events:none}

.rm-note{margin-top:10px}
.rm-note-toggle{display:inline-flex;align-items:center;gap:6px;background:none;border:none;color:var(--dim,#66666f);font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;padding:4px 0}
.rm-note-toggle:hover,.rm-note-toggle[aria-expanded="true"]{color:#7ea2ff}
.rm-note-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block}
.rm-note-area{width:100%;margin-top:8px;background:var(--bg,#0a0a0d);border:1px solid var(--edge,#212129);border-radius:10px;padding:10px 12px;color:var(--ink,#ececf1);font:inherit;font-size:12.5px;line-height:1.6;resize:vertical;min-height:60px}
.rm-note-area:focus{outline:none;border-color:#4f7cff66}
.rm-note-area.hidden{display:none}

.rm-sr-group{margin-bottom:26px}
.rm-sr-title{font-size:15px;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.rm-sr-title .rm-tab-count{font-size:10.5px;font-weight:700;background:rgba(79,124,255,.15);color:#7ea2ff;padding:2px 8px;border-radius:999px}

.rm-empty{text-align:center;padding:60px 20px;background:var(--panel,#101015);border:1px dashed var(--edge2,#2e2e39);border-radius:20px}
.rm-empty-sm{padding:34px 20px}
.rm-empty .rm-empty-icon{font-size:52px;margin-bottom:14px}
.rm-empty .rm-empty-title{font-size:18px;font-weight:800;margin-bottom:8px}
.rm-empty .rm-empty-desc{font-size:13.5px;color:var(--mut,#9c9cab);line-height:1.8;margin-bottom:16px}
.rm-state-actions{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}

.rm-guest{background:rgba(79,124,255,.08);border:1px solid rgba(79,124,255,.3);color:#7ea2ff;padding:12px 16px;border-radius:12px;font-size:12.5px;font-weight:600;margin-bottom:20px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.rm-guest a,.rm-guest button{color:#7ea2ff;text-decoration:underline;font-weight:700;background:none;border:none;cursor:pointer;font:inherit;padding:0}

.rm-skel{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:16px;padding:20px;margin-bottom:16px}
.rm-skel-line{height:12px;background:linear-gradient(90deg,var(--edge,#212129),var(--raise,#16161d),var(--edge,#212129));background-size:200% 100%;border-radius:6px;animation:rmShimmer 1.4s infinite}
.rm-skel-line.w-40{width:40%} .rm-skel-line.w-70{width:70%} .rm-skel-line.w-90{width:90%}
.rm-skel-line+.rm-skel-line{margin-top:10px}
@keyframes rmShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

#rmToasts{position:fixed;bottom:16px;inset-inline-start:16px;z-index:10000;display:flex;flex-direction:column;gap:8px;max-width:min(360px,calc(100vw - 32px))}
.rm-toast{background:#16161d;color:#ececf1;border:1px solid #2e2e39;border-inline-start:3px solid #4f7cff;border-radius:12px;padding:11px 14px;font-size:12.5px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.4);animation:rmToastIn .25s ease}
.rm-toast.err{border-inline-start-color:#ef4444}
.rm-toast.ok{border-inline-start-color:#4ade80}
.rm-toast.out{opacity:0;transform:translateY(6px);transition:.3s}
@keyframes rmToastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.rm-cert-overlay{position:fixed;inset:0;z-index:9999;background:rgba(5,5,10,.82);display:grid;place-items:center;padding:16px;backdrop-filter:blur(4px)}
.rm-cert-card{background:#fffdf6;color:#191713;border-radius:16px;max-width:560px;width:100%;padding:36px 30px;text-align:center;border:1px solid #d9c58a;outline:4px double #c9a227;outline-offset:-14px;position:relative;box-shadow:0 24px 64px rgba(0,0,0,.5)}
.rm-cert-close{position:absolute;top:10px;inset-inline-end:10px;background:none;border:none;font-size:17px;cursor:pointer;color:#8a8371;width:32px;height:32px;border-radius:8px}
.rm-cert-close:hover{background:rgba(0,0,0,.06)}
.rm-cert-brand{font-weight:900;letter-spacing:3px;font-size:13px;color:#c9a227;margin-bottom:14px}
.rm-cert-title{font-size:26px;font-weight:900;margin-bottom:6px}
.rm-cert-sub{font-size:13px;color:#6b6455;margin-bottom:12px}
.rm-cert-name{width:100%;max-width:320px;margin:0 auto 12px;display:block;text-align:center;border:none;border-bottom:2px dashed #c9a227;background:transparent;font:inherit;font-size:20px;font-weight:800;padding:6px 10px;color:#191713}
.rm-cert-name:focus{outline:none;border-bottom-style:solid}
.rm-cert-name::placeholder{color:#b3ab97;font-weight:600;font-size:15px}
.rm-cert-path{font-size:18px;font-weight:900;margin:8px 0;color:#7a5d00}
.rm-cert-meta{font-size:11.5px;color:#6b6455;margin-top:10px}
.rm-cert-actions{display:flex;gap:8px;justify-content:center;margin-top:20px;flex-wrap:wrap}
.rm-cert-actions .rm-btn{height:38px}
.rm-cert-actions .rm-btn.grey{background:#e8e2d0;color:#191713}

@media (max-width:640px){
  .rm-header h2{font-size:20px}
  .rm-hero{padding:20px}
  .rm-hero-title{font-size:19px}
  .rm-hero-icon{font-size:36px}
  .rm-step-card{padding:14px 16px}
  .rm-step-title{font-size:14px}
  .rm-step-actions{flex-direction:column}
  .rm-btn{width:100%;min-height:44px}
  .rm-tab{padding:9px 14px;font-size:12px}
  .rm-statsbar{padding:12px 14px}
  .rm-xpbar{width:80px}
}
@media print{
  body.rm-printing *{visibility:hidden!important}
  body.rm-printing #rmCertOverlay,body.rm-printing #rmCertOverlay *{visibility:visible!important}
  body.rm-printing #rmCertOverlay{position:static!important;background:#fff!important;backdrop-filter:none!important;padding:0!important}
  body.rm-printing .rm-cert-card{box-shadow:none!important;max-width:100%!important}
  body.rm-printing .rm-cert-actions,body.rm-printing .rm-cert-close{display:none!important}
}
@media (prefers-reduced-motion:reduce){
  .rm-progress-fill,.rm-xpbar>div,.rm-step-dot,.rm-step-card,.rm-tab,.rm-btn,.rm-fchip{transition:none!important}
  .rm-skel-line{animation:none}
  .rm-toast{animation:none}
}
`;

  /* ---------- DOM Setup ---------- */
  function ensureRoadmapDOM() {
    if (qs('#view-roadmap')) return true;
    const main = qs('main#content') || qs('main');
    if (!main) { console.warn('[RM] main مش موجود — هستنى'); return false; }

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
    section.innerHTML = '<div class="rm-wrap" id="rmInner"></div>';
    main.appendChild(section);
    console.info('[RM] ✅ #view-roadmap اتعمل');
    return true;
  }

  /* ---------- Render: أجزاء ثابتة ---------- */
  function headerHTML(loading) {
    return '<div class="rm-header"><h2>خرائط التعلم 🗺️</h2>' +
      '<p>' + (loading ? 'بنجهّز مساراتك…' : 'مسارات مرتبة بخطوات واضحة — علّم على اللي خلصته، وخد شهادتك لما تكمل') + '</p></div>';
  }

  function skeletonHTML() {
    return '<div class="rm-skel"><div class="rm-skel-line w-40"></div><div class="rm-skel-line w-90"></div><div class="rm-skel-line w-70"></div></div>'.repeat(3);
  }

  function emptyHTML() {
    return '<div class="rm-empty">' +
      '<div class="rm-empty-icon" aria-hidden="true">🗺️</div>' +
      '<p class="rm-empty-title">مفيش مسارات لسه</p>' +
      '<p class="rm-empty-desc">لما نضيف كورسات، المسارات هتظهر هنا تلقائيًا</p>' +
    '</div>';
  }

  function errorHTML() {
    return '<div class="rm-empty" role="alert">' +
      '<div class="rm-empty-icon" aria-hidden="true">⚠️</div>' +
      '<p class="rm-empty-title">مش قادرين نحمّل تقدّمك</p>' +
      '<p class="rm-empty-desc">حصلت مشكلة في الاتصال. جرّب تاني — وتقدّمك محفوظ محليًا في نفس الوقت.</p>' +
      '<div class="rm-state-actions">' +
        '<button type="button" class="rm-btn open" data-rm-retry><i class="bi bi-arrow-clockwise"></i>حاول تاني</button>' +
      '</div>' +
    '</div>';
  }

  function guestBannerHTML() {
    if (currentUser) return '';
    return '<div class="rm-guest" role="status">' +
      '<i class="bi bi-info-circle" aria-hidden="true"></i>' +
      '<span>أنت شغال كزائر — تقدّمك بيتحفظ على جهازك. سجّل دخولك عشان يتزامن على حسابك وترجع له من أي جهاز.</span>' +
      '<a href="auth.html">تسجيل الدخول</a>' +
    '</div>';
  }

  function statsBarHTML(st, badges) {
    return '<div class="rm-statsbar">' +
      '<div class="rm-stats-main">' +
        '<div class="rm-level">' +
          '<span class="rm-level-num">Lv.' + st.level + '</span>' +
          '<div class="rm-xpbar" role="progressbar" aria-label="التقدّم للمستوى الجاي"' +
            ' aria-valuenow="' + st.inLevel + '" aria-valuemin="0" aria-valuemax="100">' +
            '<div style="width:' + st.inLevel + '%"></div>' +
          '</div>' +
          '<span class="rm-xp-txt">' + st.inLevel + '/100 XP</span>' +
        '</div>' +
        '<span class="rm-mini"><b>' + fmtNum(st.xp) + '</b> XP</span>' +
        '<span class="rm-mini"><b>' + fmtNum(st.totalDone) + '</b> خطوة مكتملة</span>' +
        '<span class="rm-mini"><b>' + fmtNum(st.pathsDone) + '</b> مسار كامل</span>' +
      '</div>' +
      (badges.length
        ? '<div class="rm-badges" aria-label="شاراتك">' +
            badges.map((b) => '<span class="rm-badge" title="' + esc(b.label) + '" aria-label="' + esc(b.label) + '">' + b.icon + '</span>').join('') +
          '</div>'
        : '') +
      '<div class="rm-tools">' +
        '<button type="button" class="rm-tool" data-rm-export title="نزّل تقدّمك كملف"><i class="bi bi-download" aria-hidden="true"></i>تصدير</button>' +
        '<button type="button" class="rm-tool" data-rm-import-btn title="ارفع ملف تقدّم"><i class="bi bi-upload" aria-hidden="true"></i>استيراد</button>' +
        '<button type="button" class="rm-tool" data-rm-reset title="مسح كل التقدّم"><i class="bi bi-trash3" aria-hidden="true"></i>تصفير</button>' +
        '<input type="file" id="rmImportFile" accept=".json,application/json" hidden>' +
      '</div>' +
    '</div>';
  }

  function searchHTML() {
    return '<div class="rm-search">' +
      '<i class="bi bi-search" aria-hidden="true"></i>' +
      '<input type="search" data-rm-search value="' + esc(searchQuery) + '"' +
        ' placeholder="ابحث في كل المسارات: HTML، React، Excel…"' +
        ' aria-label="ابحث في المسارات والكورسات">' +
      (searchQuery
        ? '<button type="button" data-rm-search-clear aria-label="مسح البحث"><i class="bi bi-x-lg" aria-hidden="true"></i></button>'
        : '') +
    '</div>';
  }

  /* ---------- Render: Tabs ---------- */
  function tabsHTML() {
    return '<div class="rm-tabs" role="tablist" aria-label="مسارات التعلم">' +
      ROADMAPS.map((rm) => {
        const pr = getPathProgress(rm);
        const selected = rm.id === activeTabId;
        return '<button type="button" class="rm-tab ' + (selected ? 'active' : '') + '"' +
          ' role="tab" aria-selected="' + selected + '"' +
          ' tabindex="' + (selected ? '0' : '-1') + '"' +
          ' data-rm-tab="' + esc(rm.id) + '"' +
          ' id="rmtab-' + esc(rm.id) + '"' +
          ' aria-controls="rmpanel-' + esc(rm.id) + '">' +
          '<span aria-hidden="true">' + rm.icon + '</span>' +
          '<span>' + esc(rm.title) + '</span>' +
          '<span class="rm-tab-count" aria-label="' + pr.done + ' من ' + pr.total + ' مكتمل">' + pr.done + '/' + pr.total + '</span>' +
        '</button>';
      }).join('') + '</div>';
  }

  /* ---------- Render: Hero ---------- */
  function heroHTML(rm, pr) {
    const nx = pr.pct < 100 ? getNextStep(rm) : null;
    return '<div class="rm-hero" style="--hero-color:' + rm.color + '">' +
      '<div class="rm-hero-content">' +
        '<div class="rm-hero-icon" aria-hidden="true">' + rm.icon + '</div>' +
        '<h2 class="rm-hero-title">' + esc(rm.title) + '</h2>' +
        '<p class="rm-hero-desc">' + esc(rm.desc) + '</p>' +
        '<div class="rm-hero-meta">' +
          '<span class="rm-chip count">📚 ' + rm.steps.length + ' كورس</span>' +
          (pr.pct === 100
            ? '<span class="rm-chip gold">🏆 مكتمل بالكامل!</span>'
            : '<span class="rm-chip prog" aria-live="polite">✅ تقدّمك: ' + pr.done + '/' + pr.total + ' (' + pr.pct + '%)</span>') +
        '</div>' +
        '<div class="rm-progress-bar" role="progressbar" aria-valuenow="' + pr.pct + '" aria-valuemin="0" aria-valuemax="100">' +
          '<div class="rm-progress-fill" style="width:' + pr.pct + '%"></div>' +
        '</div>' +
        '<div class="rm-hero-cta">' +
          (nx
            ? '<button type="button" class="rm-next" data-rm-jump="' + esc(rm.id) + ':' + nx.idx + '">' +
                '🎯 الخطوة الجاية: ' + esc(truncate(nx.step.title, 44)) +
              '</button>'
            : '') +
          (pr.pct === 100
            ? '<button type="button" class="rm-btn cert" data-rm-cert="' + esc(rm.id) + '">' +
                '<i class="bi bi-award" aria-hidden="true"></i>احصل على شهادتك 🏆</button>'
            : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function filtersHTML(pr) {
    const mk = (mode, label) =>
      '<button type="button" class="rm-fchip ' + (filterMode === mode ? 'active' : '') + '"' +
      ' data-rm-filter="' + mode + '" aria-pressed="' + (filterMode === mode) + '">' + label + '</button>';
    return '<div class="rm-filters" role="group" aria-label="فلترة الخطوات">' +
      mk('all',  'الكل (' + pr.total + ')') +
      mk('todo', 'المتبقي (' + (pr.total - pr.done) + ')') +
      mk('done', 'المكتمل (' + pr.done + ')') +
    '</div>';
  }

  /* ---------- Render: Step ---------- */
  function stepHTML(rm, step, i, done, withHint) {
    const cls = done ? 'done' : '';
    const dot = done ? '✓' : (i + 1);

    const actions =
      '<a class="rm-btn open" href="library.html" data-rm-open="' + esc(step.courseId) + '">' +
        '<i class="bi bi-play-circle" aria-hidden="true"></i>' + (done ? 'افتح تاني' : 'ابدأ الكورس') +
      '</a>' +
      '<a class="rm-btn wa" href="' + waLinkFor(step.title) + '" target="_blank" rel="noopener noreferrer">' +
        '<i class="bi bi-whatsapp" aria-hidden="true"></i>اشترك' +
      '</a>' +
      (done
        ? '<button type="button" class="rm-btn undone-btn" data-rm-undone="' + esc(rm.id) + '" data-rm-idx="' + i + '">' +
            '<i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i>رجّعها' +
          '</button>'
        : '<button type="button" class="rm-btn done-btn" data-rm-done="' + esc(rm.id) + '" data-rm-idx="' + i + '">' +
            '<i class="bi bi-check2-circle" aria-hidden="true"></i>خلصت ✓' +
          '</button>'
      );

    const instText = step.installmentCount
      ? fmtNum(step.installmentAmount) + ' × ' + fmtNum(step.installmentCount) + ' = ' + fmtNum(step.installmentTotal) + ' جنيه'
      : '';

    const note = (notes[rm.id] || {})[i] || '';

    return '<li class="rm-step ' + cls + '" id="rmstep-' + esc(rm.id) + '-' + i + '">' +
      '<span class="rm-step-dot" aria-hidden="true">' + dot + '</span>' +
      '<div class="rm-step-card">' +
        '<div class="rm-step-head">' +
          '<span class="rm-step-num">خطوة ' + (i + 1) + ' من ' + rm.steps.length + '</span>' +
          '<span class="rm-step-head-chips">' +
            (step.category ? '<span class="rm-step-cat">' + esc(step.category) + '</span>' : '') +
            (step.duration ? '<span class="rm-step-dur">⏱ ' + esc(step.duration) + '</span>' : '') +
          '</span>' +
        '</div>' +
        (withHint ? '<div class="rm-step-hint">💡 الأفضل تخلّص الخطوة اللي قبله الأول</div>' : '') +
        '<h3 class="rm-step-title">' + esc(step.title) + '</h3>' +
        (step.description ? '<p class="rm-step-desc">' + esc(step.description) + '</p>' : '') +
        (step.cashPrice
          ? '<div class="rm-step-prices">' +
              '<span class="rm-price-cash">' + fmtNum(step.cashPrice) + ' جنيه</span>' +
              (instText ? '<span class="rm-price-inst">أو ' + instText + '</span>' : '') +
            '</div>'
          : '') +
        '<div class="rm-step-actions">' + actions + '</div>' +
        '<div class="rm-note">' +
          '<button type="button" class="rm-note-toggle" data-rm-note-toggle' +
            ' aria-expanded="false" aria-controls="rmnote-' + esc(rm.id) + '-' + i + '">' +
            '📝 ملاحظة' + (note ? '<span class="rm-note-dot" title="عندك ملاحظة محفوظة"></span>' : '') +
          '</button>' +
          '<textarea id="rmnote-' + esc(rm.id) + '-' + i + '" class="rm-note-area hidden"' +
            ' data-rm-note="' + esc(rm.id) + '" data-rm-idx="' + i + '" rows="2"' +
            ' placeholder="اكتب ملاحظتك: لينكات، أكواد، خطط…">' + esc(note) + '</textarea>' +
        '</div>' +
      '</div>' +
    '</li>';
  }

  /* ---------- Render: قائمة الخطوات + الفلترة ---------- */
  function stepsListHTML(rm) {
    const p = progress[rm.id] || {};
    const items = [];
    rm.steps.forEach((s, i) => {
      const done = !!p[i];
      if (filterMode === 'todo' && done) return;
      if (filterMode === 'done' && !done) return;
      const prevDone = i === 0 || !!p[i - 1];
      items.push(stepHTML(rm, s, i, done, filterMode === 'all' && !done && !prevDone));
    });

    if (!items.length) {
      const allDone = filterMode === 'todo' || getPathProgress(rm).pct === 100;
      return '<div class="rm-empty rm-empty-sm">' +
        '<div class="rm-empty-icon" aria-hidden="true">' + (allDone ? '🎉' : '📭') + '</div>' +
        '<p class="rm-empty-title">' + (allDone ? 'مبروك! خلّصت كل الخطوات هنا' : 'لسه مفيش خطوات مكتملة هنا') + '</p>' +
      '</div>';
    }

    return '<div id="rmpanel-' + esc(rm.id) + '" role="tabpanel" aria-labelledby="rmtab-' + esc(rm.id) + '">' +
      '<ol class="rm-steps" role="list">' + items.join('') + '</ol>' +
    '</div>';
  }

  /* ---------- Render: نتايج البحث ---------- */
  function searchResultsHTML() {
    const q = searchQuery.trim().toLowerCase();
    const results = [];
    ROADMAPS.forEach((rm) => {
      const p = progress[rm.id] || {};
      const hits = [];
      rm.steps.forEach((s, i) => {
        const hay = (s.title + ' ' + s.description + ' ' + s.category).toLowerCase();
        if (hay.includes(q)) hits.push({ s, i, done: !!p[i] });
      });
      if (hits.length) results.push({ rm, hits });
    });

    if (!results.length) {
      return '<div class="rm-empty">' +
        '<div class="rm-empty-icon" aria-hidden="true">🔍</div>' +
        '<p class="rm-empty-title">مفيش نتايج لـ«' + esc(searchQuery.trim()) + '»</p>' +
        '<p class="rm-empty-desc">جرّب كلمة تانية أو امسح البحث</p>' +
      '</div>';
    }

    return results.map(({ rm, hits }) =>
      '<section class="rm-sr-group" style="--hero-color:' + rm.color + '">' +
        '<h3 class="rm-sr-title"><span aria-hidden="true">' + rm.icon + '</span> ' + esc(rm.title) +
          ' <span class="rm-tab-count">' + hits.length + '</span></h3>' +
        '<ol class="rm-steps" role="list">' +
          hits.map(({ s, i, done }) => stepHTML(rm, s, i, done, false)).join('') +
        '</ol>' +
      '</section>'
    ).join('');
  }

  /* ---------- Render: Detail ---------- */
  function renderRoadmap(rmId) {
    const rm = ROADMAPS.find((r) => r.id === rmId) || ROADMAPS[0];
    if (!rm) return;
    activeTabId = rm.id;

    try {
      const next = '#roadmap/' + rm.id;
      if (location.hash !== next) history.replaceState(null, '', next);
    } catch { /* Safari file:// */ }

    const detail = qs('#rmDetail', qs('#rmInner') || document);
    if (!detail) return;
    const pr = getPathProgress(rm);
    detail.innerHTML = heroHTML(rm, pr) + filtersHTML(pr) + stepsListHTML(rm);
  }

  /* ---------- Render: All ---------- */
  function renderAll() {
    const inner = qs('#rmInner');
    if (!inner) return;

    if (loadState === 'loading') { inner.innerHTML = headerHTML(true) + skeletonHTML(); return; }
    if (loadState === 'error')   { inner.innerHTML = headerHTML() + errorHTML(); return; }
    if (!ROADMAPS.length)        { inner.innerHTML = headerHTML() + emptyHTML(); return; }

    const st = computeStats();
    const badges = computeBadges(st);
    const searching = !!searchQuery.trim();

    inner.innerHTML =
      headerHTML() +
      statsBarHTML(st, badges) +
      guestBannerHTML() +
      searchHTML() +
      (searching
        ? searchResultsHTML()
        : tabsHTML() + '<div id="rmDetail"></div>');

    if (!searching) renderRoadmap(activeTabId || ROADMAPS[0].id);
  }

  /* ---------- شهادة الإتمام ---------- */
  function openCert(rmId) {
    const rm = ROADMAPS.find((r) => r.id === rmId);
    if (!rm) return;
    const pr = getPathProgress(rm);
    if (pr.pct < 100) { toast('كمّل المسار الأول عشان تاخد شهادتك 😉'); return; }

    qs('#rmCertOverlay')?.remove();
    const st = computeStats();
    let savedName = '';
    try { savedName = localStorage.getItem('nexora_cert_name') || ''; } catch {}
    const name = savedName || (currentUser && currentUser.displayName) || '';
    let dateStr;
    try { dateStr = new Date().toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' }); }
    catch { dateStr = new Date().toISOString().slice(0, 10); }

    const ov = document.createElement('div');
    ov.id = 'rmCertOverlay';
    ov.className = 'rm-cert-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', 'شهادة إتمام المسار');
    ov.innerHTML =
      '<div class="rm-cert-card">' +
        '<button type="button" class="rm-cert-close" data-rm-cert-close aria-label="إغلاق">✕</button>' +
        '<div class="rm-cert-brand">NEXORA ACADEMY</div>' +
        '<h3 class="rm-cert-title">شهادة إتمام</h3>' +
        '<p class="rm-cert-sub">تشهد منصة Nexora بأن</p>' +
        '<input id="rmCertName" class="rm-cert-name" placeholder="اكتب اسمك هنا" maxlength="60" value="' + esc(name) + '" />' +
        '<p class="rm-cert-sub">قد أتمّ بنجاح جميع خطوات مسار</p>' +
        '<div class="rm-cert-path"><span aria-hidden="true">' + rm.icon + '</span> ' + esc(rm.title) + '</div>' +
        '<div class="rm-cert-meta">' + rm.steps.length + ' كورس • ' + fmtNum(st.xp) + ' XP • ' + esc(dateStr) + '</div>' +
        '<div class="rm-cert-actions">' +
          '<button type="button" class="rm-btn cert" data-rm-cert-print><i class="bi bi-printer" aria-hidden="true"></i>طباعة / حفظ PDF</button>' +
          '<button type="button" class="rm-btn grey" data-rm-cert-close>إغلاق</button>' +
        '</div>' +
      '</div>';

    ov.addEventListener('click', (e) => {
      if (e.target === ov || e.target.closest('[data-rm-cert-close]')) { ov.remove(); return; }
      if (e.target.closest('[data-rm-cert-print]')) printCert();
    });
    document.body.appendChild(ov);

    const inp = qs('#rmCertName', ov);
    inp.addEventListener('input', () => {
      try { localStorage.setItem('nexora_cert_name', inp.value); } catch {}
    });
    inp.focus();
  }

  function printCert() {
    document.body.classList.add('rm-printing');
    const cleanup = () => document.body.classList.remove('rm-printing');
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(() => {
      try { window.print(); } catch {}
      setTimeout(cleanup, 1500);
    }, 60);
  }

  /* ---------- تصدير / استيراد ---------- */
  function exportProgress() {
    const data = { app:'nexora-roadmap', v:1, exportedAt:new Date().toISOString(), steps: progress, notes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'nexora-roadmap-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 800);
    toast('✅ اتصدّر ملف التقدّم', 'ok');
  }

  function importProgressFile(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        if (!data || typeof data !== 'object' || !data.steps) throw new Error('bad-file');
        Object.keys(data.steps).forEach((rid) => {
          progress[rid] = Object.assign({}, progress[rid], data.steps[rid]);
        });
        Object.keys(data.notes || {}).forEach((rid) => {
          notes[rid] = Object.assign({}, notes[rid], data.notes[rid]);
        });
        await persistAll();
        renderAll();
        toast('✅ تم استيراد تقدّمك', 'ok');
      } catch {
        toast('⚠️ الملف مش صالح', 'err');
      }
    };
    reader.readAsText(file);
  }

  /* ---------- Event Delegation (مفتاح الإصلاح) ---------- */
  let _searchTimer = null;

  function bindInnerEvents() {
    const inner = qs('#rmInner');
    if (!inner || inner.__rmBound) return;
    inner.__rmBound = true;

    /* Click delegation */
    inner.addEventListener('click', async (e) => {
      /* Tabs */
      const tab = e.target.closest('[data-rm-tab]');
      if (tab) {
        const id = tab.dataset.rmTab;
        if (id && id !== activeTabId) {
          activeTabId = id;
          qsa('[data-rm-tab]', inner).forEach((t) => {
            const sel = t.dataset.rmTab === id;
            t.classList.toggle('active', sel);
            t.setAttribute('aria-selected', String(sel));
            t.setAttribute('tabindex', sel ? '0' : '-1');
          });
          renderRoadmap(id);
          const detail = qs('#rmDetail', inner);
          if (detail) detail.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        }
        return;
      }

      /* فلاتر الخطوات */
      const fchip = e.target.closest('[data-rm-filter]');
      if (fchip) {
        filterMode = fchip.dataset.rmFilter;
        renderRoadmap(activeTabId);
        return;
      }

      /* Retry */
      if (e.target.closest('[data-rm-retry]')) {
        loadState = 'loading';
        renderAll();
        await loadProgress();
        renderAll();
        return;
      }

      /* قفز للخطوة الجاية */
      const jump = e.target.closest('[data-rm-jump]');
      if (jump) {
        const v = String(jump.dataset.rmJump || '');
        const ci = v.lastIndexOf(':');
        if (ci > 0) {
          activeTabId = v.slice(0, ci);
          const idx = v.slice(ci + 1);
          searchQuery = '';
          filterMode = 'all';
          renderAll();
          requestAnimationFrame(() => {
            const el = document.getElementById('rmstep-' + activeTabId + '-' + idx);
            if (el) el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
          });
        }
        return;
      }

      /* شهادة */
      const certBtn = e.target.closest('[data-rm-cert]');
      if (certBtn) { openCert(certBtn.dataset.rmCert); return; }

      /* Done */
      const doneBtn = e.target.closest('[data-rm-done]');
      if (doneBtn) {
        doneBtn.setAttribute('aria-busy', 'true');
        const res = await saveStep(doneBtn.dataset.rmDone, Number(doneBtn.dataset.rmIdx), true);
        if (res.local) toast('💾 اتحفظ على جهازك — سجّل دخولك عشان يتزامن');
        else if (!res.ok) toast('⚠️ حصلت مشكلة في الحفظ — اتحفظ محليًا مؤقتًا', 'err');
        renderAll();
        return;
      }

      /* Undone */
      const undoneBtn = e.target.closest('[data-rm-undone]');
      if (undoneBtn) {
        undoneBtn.setAttribute('aria-busy', 'true');
        const res = await saveStep(undoneBtn.dataset.rmUndone, Number(undoneBtn.dataset.rmIdx), false);
        if (res.local) toast('💾 اتحفظ على جهازك — سجّل دخولك عشان يتزامن');
        else if (!res.ok) toast('⚠️ حصلت مشكلة في الحفظ — اتحفظ محليًا مؤقتًا', 'err');
        renderAll();
        return;
      }

      /* ملاحظات: فتح/قفل */
      const nt = e.target.closest('[data-rm-note-toggle]');
      if (nt) {
        const area = nt.parentElement?.querySelector('.rm-note-area');
        if (area) {
          const nowHidden = area.classList.toggle('hidden');
          nt.setAttribute('aria-expanded', String(!nowHidden));
          if (!nowHidden) area.focus();
        }
        return;
      }

      /* تصدير / استيراد / تصفير */
      if (e.target.closest('[data-rm-export]')) { exportProgress(); return; }
      if (e.target.closest('[data-rm-import-btn]')) { qs('#rmImportFile', inner)?.click(); return; }
      if (e.target.closest('[data-rm-reset]')) {
        if (confirm('متأكد؟ هتتمسح كل الخطوات المكتملة والملاحظات. (صدّر نسخة قبلها لو محتاجها)')) {
          progress = {}; notes = {};
          await persistAll();
          renderAll();
          toast('🗑️ تم تصفير التقدّم', 'ok');
        }
        return;
      }

      /* مسح البحث */
      if (e.target.closest('[data-rm-search-clear]')) {
        searchQuery = '';
        renderAll();
        qs('[data-rm-search]', inner)?.focus();
        return;
      }

      /* فتح كورس: SPA الأول مع fallback لـlibrary.html */
      const openBtn = e.target.closest('[data-rm-open]');
      if (openBtn) {
        const courseId = openBtn.dataset.rmOpen;
        if (typeof window.openCourse === 'function') {
          e.preventDefault();
          try { window.openCourse(courseId); return; } catch (err) { console.warn('[RM] openCourse:', err); }
        }
      }
    });

    /* Input delegation: بحث + ملاحظات */
    inner.addEventListener('input', (e) => {
      const noteTa = e.target.closest('[data-rm-note]');
      if (noteTa) {
        saveNoteDebounced(noteTa.dataset.rmNote, Number(noteTa.dataset.rmIdx), noteTa.value);
        return;
      }
      const si = e.target.closest('[data-rm-search]');
      if (!si) return;
      clearTimeout(_searchTimer);
      _searchTimer = setTimeout(() => {
        searchQuery = si.value || '';
        renderAll();
        if (searchQuery.trim()) {
          const ni = qs('[data-rm-search]', inner);
          if (ni) {
            ni.focus();
            try { ni.setSelectionRange(ni.value.length, ni.value.length); } catch {}
          }
        }
      }, 220);
    });

    /* استيراد الملف */
    inner.addEventListener('change', (e) => {
      const fi = e.target.closest('#rmImportFile');
      if (fi && fi.files && fi.files[0]) {
        importProgressFile(fi.files[0]);
        fi.value = '';
      }
    });

    /* Keyboard nav للـtabs */
    inner.addEventListener('keydown', (e) => {
      const tab = e.target.closest('[data-rm-tab]');
      if (!tab) return;
      const tabs = qsa('[data-rm-tab]', inner);
      const idx = tabs.indexOf(tab);
      if (idx === -1) return;
      let next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      else if (e.key === 'Enter' || e.key === ' ') { tab.click(); return; }
      if (next >= 0) { e.preventDefault(); tabs[next].focus(); }
    });

    /* Esc يقفل الشهادة */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') qs('#rmCertOverlay')?.remove();
    });
  }

  /* ---------- Sidebar ---------- */
  function ensureNavEntry() {
    const nav = qs('#sideNav');
    if (!nav || qs('[data-nav="view:roadmap"]')) return;
    const cat = qs('[data-nav="view:catalog"]');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.nav = 'view:roadmap';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="bi bi-signpost-split text-[13.5px] w-4 text-center shrink-0" aria-hidden="true"></i>' +
                    '<span class="grow text-start truncate">خرائط التعلم</span>';
    if (cat) cat.after(btn);
    else nav.appendChild(btn);
  }

  function bindRoadmapNavOnce() {
    if (document.__rmNavBound) return;
    document.__rmNavBound = true;
    document.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-nav="view:roadmap"]');
      if (!b) return;
      e.preventDefault();
      await activateRoadmapView();
    });
  }

  async function activateRoadmapView() {
    if (!qs('#view-roadmap')) ensureRoadmapDOM();
    qsa('main#content > section:not(#view-roadmap)').forEach((s) => s.classList.add('hidden'));
    const v = qs('#view-roadmap');
    if (v) v.classList.remove('hidden');
    const pt = qs('#pageTitle'); if (pt) pt.textContent = 'خرائط التعلم';
    const ps = qs('#pageSub');   if (ps) ps.textContent = 'اختار مسارك واتبع الخطوات';
    window.scrollTo(0, 0);
    const sb = qs('#sidebar'); if (sb) sb.classList.remove('open');
    const ov = qs('#overlay'); if (ov) ov.classList.add('hidden');

    const hash = (location.hash || '').replace(/^#roadmap\//, '');
    if (hash && ROADMAPS.find((r) => r.id === hash)) activeTabId = hash;

    renderAll();
    await loadProgress();
    renderAll();
  }

  function observeSideNav() {
    const nav = qs('#sideNav');
    if (!nav || nav.__rmObserver) return;
    nav.__rmObserver = new MutationObserver(() => ensureNavEntry());
    nav.__rmObserver.observe(nav, { childList: true });
  }

  /* ---------- Boot ---------- */
  function rebuildRoadmaps() {
    const before = ROADMAPS.length;
    ROADMAPS = buildRoadmapsFromCatalog();
    if (!ROADMAPS.length) {
      console.info('[RM] مفيش كورسات — هستنى الكتالوج');
      return;
    }
    if (!activeTabId || !ROADMAPS.find((r) => r.id === activeTabId)) {
      activeTabId = ROADMAPS[0].id;
    }
    console.info('[RM] ✅ اتبنى', ROADMAPS.length, 'مسار (' + before + '→' + ROADMAPS.length + ') من',
                 ROADMAPS.reduce((s, r) => s + r.steps.length, 0), 'كورس');
  }

  function tryConsumeCatalog() {
    if (window.__NEXORA_CATALOG__ && (window.__NEXORA_CATALOG__.courses || []).length) {
      console.info('[RM] الكتالوج موجود مسبقًا — نبنيه فورًا');
      rebuildRoadmaps();
      if (qs('#view-roadmap') && !qs('#view-roadmap').classList.contains('hidden')) renderAll();
      return true;
    }
    return false;
  }

  function boot() {
    ensureRoadmapDOM();
    ensureNavEntry();
    bindInnerEvents();
    bindRoadmapNavOnce();
    observeSideNav();

    rebuildRoadmaps();
    tryConsumeCatalog();

    if (authUnsub) { try { authUnsub(); } catch {} }
    authUnsub = auth.onAuthStateChanged(async (user) => {
      currentUser = user;
      ensureNavEntry();
      if (user) {
        loadState = 'loading';
        renderAll();
        await loadProgress();
        renderAll();
      } else {
        /* زائر: نحمّل تقدّمه المحلي */
        const g = readLocal();
        progress = g.steps || {};
        notes = g.notes || {};
        loadState = 'ready';
        if (qs('#view-roadmap') && !qs('#view-roadmap').classList.contains('hidden')) renderAll();
      }
    });
  }

  /* Catalog events */
  window.addEventListener('nexora:catalog-ready', () => {
    console.info('[RM] الكتالوج جاهز — نعيد بناء المسارات');
    rebuildRoadmaps();
    if (qs('#view-roadmap') && !qs('#view-roadmap').classList.contains('hidden')) renderAll();
  });
  window.addEventListener('nexora:catalog-update', () => {
    rebuildRoadmaps();
    if (qs('#view-roadmap') && !qs('#view-roadmap').classList.contains('hidden')) renderAll();
  });

  /* Deep-link مباشر لـ#roadmap/... */
  window.addEventListener('hashchange', () => {
    const m = (location.hash || '').match(/^#roadmap\/(.+)$/);
    if (m && ROADMAPS.find((r) => r.id === m[1])) {
      if (!qs('#view-roadmap') || qs('#view-roadmap').classList.contains('hidden')) {
        activateRoadmapView();
      } else if (m[1] !== activeTabId) {
        activeTabId = m[1];
        renderAll();
      }
    }
  });

  function waitForDOM(retries = 50) {
    const main = qs('main#content') || qs('main');
    const nav = qs('#sideNav');
    if (main && nav) { console.info('[RM] DOM جاهز — boot'); boot(); return; }
    if (retries <= 0) { console.warn('[RM] DOM مش جاهز — boot'); boot(); return; }
    setTimeout(() => waitForDOM(retries - 1), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForDOM(), { once: true });
  } else {
    waitForDOM();
  }

  /* Public API */
  window.NexoraRoadmap = {
    reload: () => { rebuildRoadmaps(); renderAll(); },
    refresh: async () => { await loadProgress(); renderAll(); },
    go: (pathId) => { activeTabId = pathId; searchQuery = ''; filterMode = 'all'; renderAll(); },
    search: (q) => { searchQuery = String(q || ''); renderAll(); },
    stats: () => computeStats(),
    certificate: (pathId) => openCert(pathId)
  };
})();