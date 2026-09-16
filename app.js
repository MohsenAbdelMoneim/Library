/* ==========================================================
   My Course Library — app.js (v5)
   باسورد مستقل لكل كورس Drive + وضع المالك للأدوات الإدارية
   ========================================================== */

'use strict';

console.log('%c My Course Library — v5 (owner mode) ', 'background:#f0b53e;color:#161204;font-weight:bold');

/* ---------- الثوابت ---------- */
const STORAGE_KEY = 'my-course-library:resources:v1';
const SETTINGS_KEY = 'my-course-library:settings:v1';
const ADMIN_KEY = 'my-course-library:admin';

/* ---------- كلمات المرور ---------- */
const LOCK = {
  passwords: {
    'Into The Program':          '748201',
    'AI Automation':             '392615',
    'Back End 2024':             '581347',
    'Mobile App':                '926480',
    'React JS':                  '173952',
    'AI Data Science / ML':      '640728',
    'Back End 2025':             '815093',
    'Front End 2026':            '267341',
    'Front End 2023':            '904685',
    'Cyber Security':            '352179',
    'Data Analysis 2026':        '738264',
    'Front End 2022':            '419537',
    'Data Analysis 2025':        '086912',
    'Back End 2024 - Version 2': '572846',
    'Mobile App 2026':           '693158',
    'UI/UX':                     '827403',
    'React & Tailwind Review':   '164925',
    'React 2026':                '450873'
  },
  adminPassword: '01096295395',
  key: 'my-course-library:unlocked-ids'
};
const MASKED_URL = '••••••••••••••••';

const CATEGORIES = [
  'Frontend', 'Backend', 'UI/UX', 'HTML', 'CSS', 'JavaScript',
  'Tailwind CSS', 'Bootstrap', 'React', 'Next.js', 'Node.js',
  'Mobile App', 'AI', 'Data Analysis', 'Cyber Security', 'Excel',
  'Video Editing', 'Graphic Design', 'Computer Science', 'Other'
];
const SOURCES  = ['Google Drive', 'YouTube'];
const STATUSES = ['Not Started', 'In Progress', 'Completed'];

const STATUS_META = {
  'Not Started': { label: 'غير مبدوء',   color: '#8b8b98', pulse: false },
  'In Progress': { label: 'قيد التنفيذ', color: '#f0b53e', pulse: true  },
  'Completed':   { label: 'مكتمل',       color: '#4ade80', pulse: false }
};

const CATEGORY_HUES = {
  'Frontend': 152, 'Backend': 24,  'UI/UX': 318,   'HTML': 8,    'CSS': 210,
  'JavaScript': 50, 'Tailwind CSS': 187, 'Bootstrap': 262, 'React': 197,
  'Next.js': 220, 'Node.js': 95,  'Mobile App': 282, 'AI': 174,
  'Data Analysis': 130, 'Cyber Security': 356, 'Excel': 108,
  'Video Editing': 340, 'Graphic Design': 44, 'Computer Science': 205,
  'Other': null
};

/* ---------- البيانات الأولية: الـ30 مورد ---------- */
const INITIAL_CREATED_AT = '2025-01-15T09:00:00.000Z';

const INITIAL_RESOURCES = (() => {
  const rows = [
    ['Into The Program',                 'Other',            'Google Drive', 'https://drive.google.com/drive/folders/1bp1CnLGqI4In26PIO2feOWFE7cBeFjKb'],
    ['AI Automation',                    'AI',               'Google Drive', 'https://drive.google.com/drive/folders/1PpkJc_58IkYlvqIESckmpO098R53WPKM'],
    ['Back End 2024',                    'Backend',          'Google Drive', 'https://drive.google.com/drive/folders/18yYotMh5aLc4uHiiAqyM2tIKFowba31y'],
    ['Mobile App',                       'Mobile App',       'Google Drive', 'https://drive.google.com/drive/folders/1rz9tRRps95A0eyulOVWTbVm_8R4ZPsVW'],
    ['React JS',                         'React',            'Google Drive', 'https://drive.google.com/drive/folders/1wZ9Xbij1pkEVg1GC5c-Mry7WvIxyONCQ'],
    ['AI Data Science / ML',             'AI',               'Google Drive', 'https://drive.google.com/drive/folders/1e1PnYrObt311aOS2mCK5ik9pPkVYi0_x'],
    ['Back End 2025',                    'Backend',          'Google Drive', 'https://drive.google.com/drive/folders/1y_DhYIGSn8DBNVtdCO2Iz8QAvwk8ZUKt'],
    ['Front End 2026',                   'Frontend',         'Google Drive', 'https://drive.google.com/drive/folders/118OKf7I392bw4W_j10zujjakSH_AF8AK'],
    ['Front End 2023',                   'Frontend',         'Google Drive', 'https://drive.google.com/drive/folders/1CEDQi07MMwLUOeyJmHvD1qG6RyAkIb2j'],
    ['Cyber Security',                   'Cyber Security',   'Google Drive', 'https://drive.google.com/drive/folders/1LeO2Y5ZiuXMoqP7WJM74egZ2FSz0kiua'],
    ['Data Analysis 2026',               'Data Analysis',    'Google Drive', 'https://drive.google.com/drive/folders/1T0PAAPvKEJgAsflB9a29awhZA0EAi74J'],
    ['Front End 2022',                   'Frontend',         'Google Drive', 'https://drive.google.com/drive/folders/1buWjALzg6Uq-kJ6BYKAMvsryrMBybIJp'],
    ['Data Analysis 2025',               'Data Analysis',    'Google Drive', 'https://drive.google.com/drive/folders/1ZXFeWWCEgu_dHM2H2sK0owJKjahdRNLQ'],
    ['Back End 2024 - Version 2',        'Backend',          'Google Drive', 'https://drive.google.com/drive/folders/1fRzucVIQdCm6FIkpRRs5xcPrYEJADn9K'],
    ['Mobile App 2026',                  'Mobile App',       'Google Drive', 'https://drive.google.com/drive/folders/1Kl35k1JmnC-kUoI4qMlU7Wf0sr5YQWVD'],
    ['UI/UX',                            'UI/UX',            'Google Drive', 'https://drive.google.com/drive/folders/1scecT3CZq8rzKe-iR0g-of3yHNlHbgtS'],
    ['React & Tailwind Review',          'React',            'Google Drive', 'https://drive.google.com/drive/folders/1TR4KHqtfJ7LWZPOAq_ZQr-UCggsXQcLM'],
    ['React 2026',                       'React',            'Google Drive', 'https://drive.google.com/drive/folders/1U2RhG7BsM6MvxDXnppEgjxKKAWRNOqTi'],
    ['React Course - Abdelrahman Gamal', 'React',            'YouTube',      'https://youtube.com/playlist?list=PLaC7IVwu2bhw&si=Pk_dkRTszhswCqSC'],
    ['AI',                               'AI',               'YouTube',      'https://youtube.com/playlist?list=PLPTwNK7t-94A&si=d4maJO_aTSxgFrJY'],
    ['React Applications',               'React',            'YouTube',      'https://youtube.com/playlist?list=PLxRvAw0S16C4QdxQkcIuKTTPyHL-BwkzP&si=TKjlpNv3TfPp7XoV'],
    ['React Projects',                   'React',            'YouTube',      'https://youtube.com/playlist?list=PLnjYx96bVSpt9BgyXHfawMlThP0a_-DOV&si=gdvnMEFyiZ2wpR86'],
    ['Next.js Course',                   'Next.js',          'YouTube',      'https://youtu.be/r76jFwctQM8?si=FnizgI9Kdw6jyeol'],
    ['React & Tailwind Project',         'React',            'YouTube',      'https://youtu.be/5aP4odws9iw?si=av8XvPiekwJBeVhG'],
    ['Crash Course UI/UX',               'UI/UX',            'YouTube',      'https://youtube.com/playlist?list=PLu0P-6m1MD_6EtH2gxgO97Z5iKxuxS3In&si=vDCYohNEZ5vZJFuR'],
    ['CapCut',                           'Video Editing',    'YouTube',      'https://youtu.be/bSiemfHdFtI?si=M5-VzGNZnHLR692L'],
    ['Photoshop',                        'Graphic Design',   'YouTube',      'https://youtu.be/yD66BBLtcM8?si=Tjb9KHtZxzLUHWHw'],
    ['Photoshop 2',                      'Graphic Design',   'YouTube',      'https://youtu.be/va-MZOPrJ0s?si=91f15UigdzCr_iB8'],
    ['Illustrator',                      'Graphic Design',   'YouTube',      'https://youtu.be/Fe_oEDD8Kus?si=Yy5gTWPG2NyVGrdV'],
    ['CS50 - Computer Science Fundamentals', 'Computer Science', 'YouTube',  'https://youtube.com/playlist?list=PLknwEmKsW8OvMsFbU9zo8oJCprAsgc4LO&si=EIeS-4HGd_CX778k']
  ];
  return rows.map(([title, category, source, url], i) => ({
    id: 'res-' + String(i + 1).padStart(3, '0'),
    title,
    category,
    source,
    description: '',
    url,
    cover: '',
    status: 'Not Started',
    notes: '',
    createdAt: new Date(Date.parse(INITIAL_CREATED_AT) + i * 60000).toISOString(),
    lastOpenedAt: null,
    favorite: false
  }));
})();

/* ---------- الحالة العامة ---------- */
const state = {
  resources: [],
  view: 'library',
  layout: 'grid',
  search: '',
  category: 'all',
  source: 'all',
  status: 'all',
  favoritesOnly: false,
  sort: 'newest',
  editingId: null,
  confirmedDup: false,
  urlMasked: false,
  editingOriginalUrl: ''
};

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let statsAnimated = false;

/* ---------- أدوات مساعدة ---------- */
const qs  = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function uid() {
  return 'res-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function isValidUrl(u) {
  if (typeof u !== 'string' || !u.trim()) return false;
  try {
    const x = new URL(u.trim());
    return x.protocol === 'http:' || x.protocol === 'https:';
  } catch { return false; }
}

function cloneInitial() {
  return JSON.parse(JSON.stringify(INITIAL_RESOURCES));
}

const dateFmt = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtDate = (iso) => dateFmt.format(new Date(iso));

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 45) return 'الآن';
  const rtf = new Intl.RelativeTimeFormat('ar-EG-u-nu-latn', { numeric: 'auto' });
  if (diff < 3600)    return rtf.format(-Math.round(diff / 60), 'minute');
  if (diff < 86400)   return rtf.format(-Math.round(diff / 3600), 'hour');
  if (diff < 604800)  return rtf.format(-Math.round(diff / 86400), 'day');
  if (diff < 2629800) return rtf.format(-Math.round(diff / 604800), 'week');
  if (diff < 31557600) return rtf.format(-Math.round(diff / 2629800), 'month');
  return fmtDate(iso);
}

function isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
}

/* تحويل الأرقام العربية/الفارسية إلى إنجليزية + إزالة المسافات */
function normalizePassword(s) {
  return String(s ?? '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/\s+/g, '')
    .trim();
}

function catColor(cat) {
  const h = CATEGORY_HUES[cat];
  return h == null ? 'hsl(240 5% 62%)' : `hsl(${h} 68% 66%)`;
}
function categoryChip(cat) {
  const h = CATEGORY_HUES[cat];
  const c  = catColor(cat);
  const bg = h == null ? 'hsl(240 5% 62% / .09)' : `hsl(${h} 60% 55% / .12)`;
  const bd = h == null ? 'hsl(240 5% 62% / .22)' : `hsl(${h} 60% 55% / .25)`;
  return `<span class="cat-chip" style="color:${c};background:${bg};border-color:${bd}">${escapeHtml(cat)}</span>`;
}

const DRIVE_SVG = `<svg viewBox="0 0 87.3 78" width="16" height="14" aria-hidden="true"><path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25 29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44A9.06 9.06 0 0 0 0 53h27.5z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.798l5.852 11.5z" fill="#ea4335"/><path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/></svg>`;

function sourceTile(source) {
  const inner = source === 'YouTube'
    ? `<i class="bi bi-youtube" style="color:#ff5b52;font-size:17px" aria-hidden="true"></i>`
    : DRIVE_SVG;
  return `<span class="source-tile" title="${escapeHtml(source)}" aria-label="${escapeHtml(source)}">${inner}</span>`;
}

function statusBadge(status) {
  const m = STATUS_META[status];
  return `<span class="inline-flex items-center gap-1.5 text-[11px] font-medium" style="color:${m.color}">
    <span class="w-1.5 h-1.5 rounded-full ${m.pulse ? 'pulse-dot' : ''}" style="background:${m.color}"></span>${m.label}</span>`;
}

/* ==========================================================
   وضع المالك (Admin)
   ========================================================== */

let adminMem = false;

function isAdminActive() {
  try { return sessionStorage.getItem(ADMIN_KEY) === '1'; }
  catch { return adminMem; }
}

function setAdminMode(on) {
  adminMem = on;
  try {
    if (on) sessionStorage.setItem(ADMIN_KEY, '1');
    else sessionStorage.removeItem(ADMIN_KEY);
  } catch { /* التخزين غير متاح */ }
}

/* بوابة المالك: لو مش أدمن يطلب كلمة المرور الأول ثم ينفّذ العملية */
function requireAdmin(run) {
  if (isAdminActive()) { run(); return; }
  pendingSecureAction = { run };
  openLockModal({ mode: 'login' });
  showToast('هذه العملية لوضع المالك — أدخل كلمة مرور المالك.', 'info');
}

/* ==========================================================
   القفل: كلمة مرور مستقلة لكل كورس Drive
   ========================================================== */

let memUnlocked = new Set();
let pendingSecureAction = null;
let lockMode = null; // 'course' | 'login'

function getUnlockedIds() {
  try {
    const arr = JSON.parse(sessionStorage.getItem(LOCK.key) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return [...memUnlocked]; }
}

function setUnlockedIds(ids) {
  memUnlocked = new Set(ids);
  try { sessionStorage.setItem(LOCK.key, JSON.stringify(ids)); } catch { /* التخزين غير متاح */ }
}

function unlockResource(id) {
  const s = new Set(getUnlockedIds());
  s.add(id);
  setUnlockedIds([...s]);
}

function unlockAllLocked() {
  setUnlockedIds(protectedResources().map((r) => r.id));
}

function lockAll() {
  setUnlockedIds([]);
}

function getPasswordFor(r) {
  return LOCK.passwords[r.id] ?? LOCK.passwords[r.title] ?? null;
}

function isProtected(r) {
  return !!r && r.source === 'Google Drive' && getPasswordFor(r) !== null;
}

/* المالك يتخطى أقفال الكورسات كلها طالما وضع المالك مفعّل */
function isResourceLocked(r) {
  return isProtected(r) && !isAdminActive() && !getUnlockedIds().includes(r.id);
}

function protectedResources() {
  return state.resources.filter(isProtected);
}

function lockedCount() {
  return protectedResources().filter((r) => !isResourceLocked(r) === false).length;
}

function requireUnlock(resource, run) {
  if (!isResourceLocked(resource)) { run(); return; }
  pendingSecureAction = { resource, run };
  openLockModal({ mode: 'course', resource });
}

function openLockModal({ mode = 'course', resource = null } = {}) {
  lockMode = mode;
  const courseEl = qs('#lockCourse');
  const descEl = qs('#lockDesc');
  if (mode === 'login') {
    if (qs('#lockTitle')) qs('#lockTitle').textContent = 'دخول المالك';
    if (courseEl) courseEl.classList.add('hidden');
    if (descEl) descEl.textContent = 'ادخل كلمة مرور المالك لتفعيل أدوات الإضافة والتعديل والحذف والتصدير.';
  } else {
    if (qs('#lockTitle')) qs('#lockTitle').textContent = 'الكورس محمي بكلمة مرور';
    if (courseEl) {
      courseEl.classList.remove('hidden');
      courseEl.textContent = resource ? `«${resource.title}»` : '';
    }
    if (descEl) descEl.textContent = 'لكل كورس على Google Drive كلمة مرور خاصة به. أدخل كلمة مرور هذا الكورس لفتحه حتى نهاية الجلسة.';
  }
  const form = qs('#lockForm');
  if (form) form.reset();
  hideLockError();
  resetLockToggle();
  openModal(qs('#lockModal'), qs('#lockPassword'));
  console.info('[LOCK] نافذة كلمة المرور فتحت — الوضع:', mode, resource ? '| ' + resource.title : '');
}

function closeLockModal() {
  closeModal(qs('#lockModal'));
  pendingSecureAction = null;
  lockMode = null;
}

function hideLockError() {
  const err = qs('#lockError');
  const input = qs('#lockPassword');
  if (err) err.classList.add('hidden');
  if (input) input.classList.remove('invalid');
}

function showLockError() {
  const err = qs('#lockError');
  const input = qs('#lockPassword');
  if (err) err.classList.remove('hidden');
  if (input) {
    input.classList.add('invalid');
    input.focus();
    input.select();
  }
  const panel = qs('#lockModal .modal-panel');
  if (panel) {
    panel.classList.remove('shake');
    void panel.offsetWidth;
    panel.classList.add('shake');
  }
}

function resetLockToggle() {
  const input = qs('#lockPassword');
  const btn = qs('#lockToggle');
  if (input) input.type = 'password';
  if (btn) {
    const ic = btn.querySelector('i');
    if (ic) ic.className = 'bi bi-eye';
    btn.setAttribute('aria-label', 'إظهار كلمة المرور');
  }
}

function renderLockStatus() {
  const chip = qs('#lockChip');
  if (!chip) return;
  const total = protectedResources().length;
  if (!total) { chip.classList.add('hidden'); return; }
  chip.classList.remove('hidden');
  const locked = lockedCount();
  const allOpen = locked === 0;
  chip.classList.toggle('locked', !allOpen);
  chip.classList.toggle('unlocked', allOpen);
  const txt = qs('#lockChipText');
  if (txt) txt.textContent = allOpen ? 'الكل مفتوح' : `${locked} مقفلة`;
  const ic = chip.querySelector('i');
  if (ic) ic.className = allOpen ? 'bi bi-unlock-fill text-[12px]' : 'bi bi-lock-fill text-[12px]';
  chip.title = 'انقر لإعادة قفل كل كورسات Drive';
  chip.setAttribute('aria-label', chip.title);
}

function renderAdminUI() {
  const admin = isAdminActive();
  const addBtn = qs('#addResourceBtn');
  if (addBtn) addBtn.classList.toggle('hidden', !admin);
  const qExp = qs('#quickExportBtn');
  if (qExp) qExp.classList.toggle('hidden', !admin);

  const chip = qs('#adminChip');
  if (chip) {
    chip.classList.toggle('unlocked', admin);
    const ic = chip.querySelector('i');
    if (ic) ic.className = (admin ? 'bi bi-shield-check' : 'bi bi-shield-lock') + ' text-[12px]';
    const txt = qs('#adminChipText');
    if (txt) txt.textContent = admin ? 'وضع المالك' : 'دخول المالك';
    chip.title = admin ? 'انقر للخروج من وضع المالك' : 'دخول وضع المالك (إضافة · تعديل · حذف · تصدير)';
    chip.setAttribute('aria-label', chip.title);
  }
}

/* ---------- المعالج المركزي لكلمة المرور ---------- */
function handleLockSubmit(formEl) {
  try {
    const input = (formEl && formEl.querySelector('#lockPassword')) || qs('#lockPassword');
    const raw = input ? input.value : '';
    const val = normalizePassword(raw);
    const adminPass = normalizePassword(LOCK.adminPassword);
    console.info('[LOCK] استلمت كلمة مرور — عدد الأحرف:', val.length, '| الوضع:', lockMode);

    const pending = pendingSecureAction;
    let ok = false, msg = '';

    if (lockMode === 'login') {
      // دخول المالك: يفتح الأدوات الإدارية فقط
      if (val === adminPass) {
        setAdminMode(true);
        ok = true;
        msg = 'وضع المالك مفعّل — كل أدوات الإدارة متاحة الآن.';
      }
    } else {
      // وضع الكورس: كلمة الكورس تفتحه هو فقط، وكلمة المالك تفتح الكل
      const r = pending && pending.resource ? getResourceById(pending.resource.id) : null;
      if (r && val === normalizePassword(getPasswordFor(r))) {
        unlockResource(r.id);
        ok = true;
        msg = `تم فتح «${r.title}» حتى نهاية الجلسة.`;
      } else if (val === adminPass) {
        unlockAllLocked();
        ok = true;
        msg = 'وضع المالك: تم فتح كل الكورسات المقفلة.';
      }
    }

    if (!ok) {
      console.warn('[LOCK] كلمة مرور غير مطابقة. الوضع:', lockMode,
        '| الكورس:', pending && pending.resource ? pending.resource.title : '—');
      showLockError();
      return;
    }

    const runPending = pending && pending.run ? pending.run : null;
    pendingSecureAction = null;
    lockMode = null;
    closeModal(qs('#lockModal'));
    renderAll();
    showToast(msg, 'success');
    console.info('[LOCK] نجح:', msg);
    if (runPending) runPending();
  } catch (err) {
    console.error('[LOCK] خطأ أثناء التحقق:', err);
    showToast('حدث خطأ غير متوقع — افتح الـConsole وأرسل لي الخطأ.', 'error');
  }
}

/* ==========================================================
   ضمان وجود عناصر القفل والأدمن (إصلاح تلقائي)
   ========================================================== */

const LOCK_STYLES = `
.lock-chip{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:10px;font-size:11.5px;font-weight:600;border:1px solid var(--edge,#212129);color:var(--mut,#9c9cab);transition:color .15s,border-color .15s,background .15s;cursor:pointer}
.lock-chip:hover{color:var(--ink,#ececf1);border-color:var(--edge2,#2e2e39)}
.lock-chip.locked{color:var(--acc,#f0b53e);border-color:rgba(240,181,62,.35);background:rgba(240,181,62,.07)}
.lock-chip.unlocked{color:#4ade80;border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.07)}
.lock-overlay{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:600;color:var(--acc,#f0b53e);background:rgba(10,10,13,.75);backdrop-filter:blur(4px);border:1px solid rgba(240,181,62,.35);padding:7px 13px;border-radius:999px}
.shake{animation:shake .4s cubic-bezier(.36,.07,.19,.97)}
@keyframes shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-4px)}40%,60%{transform:translateX(4px)}}
`;

function buildLockModalHTML() {
  return `
  <div class="modal-backdrop absolute inset-0 bg-black/70 backdrop-blur-[3px]" data-close-lock></div>
  <div class="absolute inset-0 overflow-y-auto">
    <div class="min-h-full flex items-center justify-center p-4">
      <div class="modal-panel relative w-full max-w-sm rounded-2xl border border-edge2 bg-panel shadow-2xl p-5">
        <div class="flex items-start gap-3">
          <span class="icon-tile !border-accent/30 !text-accent"><i class="bi bi-lock-fill"></i></span>
          <div class="min-w-0">
            <h2 id="lockTitle" class="text-[14.5px] font-semibold">الكورس محمي بكلمة مرور</h2>
            <p id="lockCourse" class="mt-1 text-[12.5px] font-semibold text-accent truncate"></p>
            <p id="lockDesc" class="mt-1.5 text-[12.5px] leading-relaxed text-mut"></p>
          </div>
        </div>
        <form id="lockForm" novalidate class="mt-4">
          <label for="lockPassword" class="field-label">كلمة المرور</label>
          <div class="relative">
            <input id="lockPassword" type="password" class="field pe-10" autocomplete="off"
                   placeholder="أدخل كلمة المرور…" aria-describedby="lockError">
            <button type="button" id="lockToggle" class="icon-btn absolute end-1.5 top-1/2 -translate-y-1/2"
                    aria-label="إظهار كلمة المرور"><i class="bi bi-eye"></i></button>
          </div>
          <p id="lockError" class="field-err hidden mt-1.5">كلمة المرور غير صحيحة — حاول مرة أخرى.</p>
          <div class="mt-4 flex items-center justify-end gap-2">
            <button type="button" class="btn-ghost" data-close-lock>إلغاء</button>
            <button type="submit" class="btn-accent">
              <i class="bi bi-unlock text-[12px]" aria-hidden="true"></i>تأكيد
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

function ensureLockDOM() {
  if (!document.getElementById('lockExtraStyles')) {
    const st = document.createElement('style');
    st.id = 'lockExtraStyles';
    st.textContent = LOCK_STYLES;
    document.head.appendChild(st);
  }

  /* نافذة القفل: نسخة نظيفة واحدة دائمًا */
  qsa('#lockModal').forEach((m) => m.remove());
  const modal = document.createElement('div');
  modal.id = 'lockModal';
  modal.className = 'modal fixed inset-0 z-[68] hidden';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'lockTitle');
  modal.innerHTML = buildLockModalHTML();
  document.body.appendChild(modal);

  const host = qs('header .ms-auto') || qs('header');
  if (host) {
    /* زر حالة القفل */
    let chip = qs('#lockChip');
    if (!chip) {
      chip = document.createElement('button');
      chip.id = 'lockChip';
      chip.type = 'button';
      chip.className = 'lock-chip locked';
      chip.innerHTML = '<i class="bi bi-lock-fill text-[12px]" aria-hidden="true"></i>' +
                       '<span id="lockChipText" class="hidden sm:inline">Drive مقفل</span>';
      host.insertBefore(chip, host.firstChild);
    }
    if (!qs('#lockChipText')) {
      const span = document.createElement('span');
      span.id = 'lockChipText';
      span.className = 'hidden sm:inline';
      span.textContent = 'Drive مقفل';
      chip.appendChild(span);
    }

    /* زر دخول المالك */
    let adminChip = qs('#adminChip');
    if (!adminChip) {
      adminChip = document.createElement('button');
      adminChip.id = 'adminChip';
      adminChip.type = 'button';
      adminChip.className = 'lock-chip';
      adminChip.innerHTML = '<i class="bi bi-shield-lock text-[12px]" aria-hidden="true"></i>' +
                            '<span id="adminChipText" class="hidden sm:inline">دخول المالك</span>';
      chip.after(adminChip);
    }
    if (!qs('#adminChipText')) {
      const span = document.createElement('span');
      span.id = 'adminChipText';
      span.className = 'hidden sm:inline';
      span.textContent = 'دخول المالك';
      adminChip.appendChild(span);
    }
  }
}

/* ==========================================================
   التخزين
   ========================================================== */

function loadResources() {
  let stored = null;
  try { stored = localStorage.getItem(STORAGE_KEY); } catch (err) { /* التخزين غير متاح */ }

  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) { state.resources = parsed; return; }
    } catch { /* بيانات تالفة */ }
    state.resources = cloneInitial();
    saveResources();
    showToast('كانت البيانات المحفوظة تالفة — تمت استعادة الـ30 مورد الأصلية.', 'warn');
  } else {
    state.resources = cloneInitial();
    saveResources();
  }
}

function saveResources() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.resources));
  } catch (err) {
    showToast('فشل الحفظ في التخزين المحلي — تحقق من مساحة التخزين.', 'error');
  }
}

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    if (s.layout === 'list' || s.layout === 'grid') state.layout = s.layout;
  } catch { /* تجاهل */ }
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ layout: state.layout })); } catch { /* تجاهل */ }
}

/* ==========================================================
   البحث / الفلترة / الترتيب
   ========================================================== */

function searchResources(resources, query) {
  if (!query) return resources.slice();
  const n = query.toLowerCase();
  return resources.filter((r) =>
    [r.title, r.category, r.source, r.description, r.notes]
      .some((v) => String(v ?? '').toLowerCase().includes(n))
  );
}

function filterResources(resources) {
  let out = searchResources(resources, state.search);
  if (state.category !== 'all')      out = out.filter((r) => r.category === state.category);
  if (state.source !== 'all')        out = out.filter((r) => r.source === state.source);
  if (state.status !== 'all')        out = out.filter((r) => r.status === state.status);
  if (state.favoritesOnly)           out = out.filter((r) => r.favorite);
  return out;
}

function sortResources(resources) {
  const arr = resources.slice();
  const comparators = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    az:     (a, b) => a.title.localeCompare(b.title, 'ar'),
    za:     (a, b) => b.title.localeCompare(a.title, 'ar'),
    opened: (a, b) => (b.lastOpenedAt ? Date.parse(b.lastOpenedAt) : 0) - (a.lastOpenedAt ? Date.parse(a.lastOpenedAt) : 0)
  };
  return arr.sort(comparators[state.sort] || comparators.newest);
}

const hasActiveFilters = () =>
  !!(state.search || state.category !== 'all' || state.source !== 'all' ||
     state.status !== 'all' || state.favoritesOnly);

function resetFilters() {
  state.search = '';
  state.category = 'all';
  state.source = 'all';
  state.status = 'all';
  state.favoritesOnly = false;
  renderAll();
}

/* ==========================================================
   عمليات CRUD
   ========================================================== */

function getResourceById(id) {
  return state.resources.find((r) => r.id === id) || null;
}

function createResource(data) {
  const resource = normalizeResource(data, uid());
  state.resources.push(resource);
  saveResources();
  renderAll();
  showToast(`تمت إضافة «${resource.title}» إلى المكتبة.`, 'success');
  return resource;
}

function updateResource(id, data) {
  const resource = getResourceById(id);
  if (!resource) return null;
  Object.assign(resource, data);
  saveResources();
  renderAll({ animate: false });
  showToast('تم حفظ التعديلات بنجاح.', 'success');
  return resource;
}

function deleteResource(id) {
  const resource = getResourceById(id);
  if (!resource) return;
  openConfirm({
    title: 'حذف المورد',
    message: `سيتم حذف «${resource.title}» نهائيًا من مكتبتك.`,
    confirmLabel: 'حذف نهائي',
    danger: true,
    onConfirm() {
      state.resources = state.resources.filter((r) => r.id !== id);
      saveResources();
      renderAll({ animate: false });
      showToast(`حُذف «${resource.title}».`, 'warn', {
        duration: 6500,
        action: {
          label: 'تراجع',
          onClick() {
            state.resources.push(resource);
            saveResources();
            renderAll({ animate: false });
            showToast('تمت استعادة المورد.', 'success');
          }
        }
      });
    }
  });
}

function openResource(id) {
  const resource = getResourceById(id);
  if (!resource) return;
  resource.lastOpenedAt = new Date().toISOString();
  saveResources();
  renderResources({ animate: false });
}

async function copyResourceUrl(id, btn) {
  const resource = getResourceById(id);
  if (!resource) return;
  try {
    await navigator.clipboard.writeText(resource.url);
  } catch {
    fallbackCopy(resource.url);
  }
  showToast('تم نسخ الرابط إلى الحافظة.', 'success');
  if (btn) {
    const ic = btn.querySelector('i');
    const prev = ic.className;
    ic.className = 'bi bi-check2';
    btn.style.color = '#4ade80';
    setTimeout(() => { ic.className = prev; btn.style.color = ''; }, 1400);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch { /* تجاهل */ }
  ta.remove();
}

function toggleFavorite(id) {
  const resource = getResourceById(id);
  if (!resource) return;
  resource.favorite = !resource.favorite;
  saveResources();
  renderResources({ animate: false });
  renderSidebar();
  updateDashboard();
}

/* ==========================================================
   التحقق من الصحة
   ========================================================== */

function fieldError(name, value) {
  switch (name) {
    case 'title':    return String(value ?? '').trim() ? null : 'عنوان المورد مطلوب.';
    case 'category': return CATEGORIES.includes(value) ? null : 'اختر تصنيفًا من القائمة المحددة.';
    case 'source':   return SOURCES.includes(value)   ? null : 'اختر المصدر: Google Drive أو YouTube.';
    case 'url':      return isValidUrl(value)          ? null : 'أدخل رابطًا صالحًا يبدأ بـ http:// أو https://';
    case 'status':   return STATUSES.includes(value)   ? null : 'الحالة يجب أن تكون: Not Started أو In Progress أو Completed.';
    default:         return null;
  }
}

function validateResource(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return 'العنصر ليس كائنًا صالحًا.';
  for (const f of ['title', 'category', 'source', 'url', 'status']) {
    const msg = fieldError(f, r[f]);
    if (msg) return `الحقل «${f}» — ${msg}`;
  }
  if (r.createdAt != null && (typeof r.createdAt !== 'string' || isNaN(Date.parse(r.createdAt))))
    return 'الحقل «createdAt» يجب أن يكون تاريخ ISO صالحًا.';
  if (r.lastOpenedAt != null && (typeof r.lastOpenedAt !== 'string' || isNaN(Date.parse(r.lastOpenedAt))))
    return 'الحقل «lastOpenedAt» يجب أن يكون تاريخ ISO أو null.';
  if (r.favorite != null && typeof r.favorite !== 'boolean')
    return 'الحقل «favorite» يجب أن يكون true أو false.';
  return null;
}

function normalizeResource(raw, id) {
  return {
    id,
    title: String(raw.title).trim(),
    category: raw.category,
    source: raw.source,
    description: typeof raw.description === 'string' ? raw.description : '',
    url: String(raw.url).trim(),
    cover: typeof raw.cover === 'string' ? raw.cover : '',
    status: raw.status,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
    lastOpenedAt: typeof raw.lastOpenedAt === 'string' ? raw.lastOpenedAt : null,
    favorite: raw.favorite === true
  };
}

function findDuplicateUrl(url, excludeId) {
  const n = String(url || '').trim().toLowerCase();
  if (!n) return null;
  return state.resources.find((r) => r.id !== excludeId && r.url.trim().toLowerCase() === n) || null;
}

/* ==========================================================
   العرض
   ========================================================== */

function navItem({ nav, icon, label, count, active, accent, dot }) {
  const lead = dot
    ? `<span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:${dot}"></span>`
    : `<i class="bi ${icon} text-[13.5px] w-4 text-center shrink-0 ${accent ? 'text-accent' : ''}"></i>`;
  return `<button type="button" data-nav="${nav}" class="nav-item ${active ? 'nav-active' : ''}" ${active ? 'aria-current="page"' : ''}>
    ${lead}<span class="grow text-start truncate">${escapeHtml(label)}</span>
    ${count != null ? `<span class="text-[10.5px] font-mono text-dim tabular-nums">${count}</span>` : ''}
  </button>`;
}

function renderSidebar() {
  const used = {};
  state.resources.forEach((r) => { used[r.category] = (used[r.category] || 0) + 1; });
  const favCount = state.resources.filter((r) => r.favorite).length;
  const cats = CATEGORIES.filter((c) => used[c])
    .sort((a, b) => used[b] - used[a] || a.localeCompare(b, 'ar'));
  const isLib = state.view === 'library';

  let html = '';
  html += navItem({ nav: 'library:all', icon: 'bi-collection', label: 'كل الموارد',
    count: state.resources.length, active: isLib && state.category === 'all' && !state.favoritesOnly });
  html += navItem({ nav: 'library:favorites', icon: 'bi-star', label: 'المفضلة',
    count: favCount, active: isLib && state.favoritesOnly, accent: true });

  html += `<p class="nav-label">التصنيفات</p>`;
  cats.forEach((c) => {
    html += navItem({ nav: 'cat:' + c, label: c, count: used[c], dot: catColor(c),
      active: isLib && state.category === c && !state.favoritesOnly });
  });

  html += `<div class="my-2.5 border-t border-edge"></div>`;
  html += navItem({ nav: 'view:files', icon: 'bi-file-earmark-word', label: 'ملفات مهمة', active: state.view === 'files' });
  /* إدارة البيانات لوضع المالك فقط */
  if (isAdminActive()) {
    html += navItem({ nav: 'view:data', icon: 'bi-database', label: 'إدارة البيانات', active: state.view === 'data' });
  }

  qs('#sideNav').innerHTML = html;
}

function animateCount(el, target) {
  const dur = 550, t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function updateDashboard() {
  const rs = state.resources;
  const values = {
    '#s-total': rs.length,
    '#s-ns':    rs.filter((r) => r.status === 'Not Started').length,
    '#s-ip':    rs.filter((r) => r.status === 'In Progress').length,
    '#s-cp':    rs.filter((r) => r.status === 'Completed').length,
    '#s-drive': rs.filter((r) => r.source === 'Google Drive').length,
    '#s-yt':    rs.filter((r) => r.source === 'YouTube').length,
    '#s-fav':   rs.filter((r) => r.favorite).length
  };
  const animate = !statsAnimated && !prefersReduced;
  for (const [sel, val] of Object.entries(values)) {
    const el = qs(sel);
    if (animate) animateCount(el, val); else el.textContent = val;
  }
  qs('#s-cats').textContent = new Set(rs.map((r) => r.category)).size;

  const clean = hasActiveFilters() === false;
  qsa('#statsBar [data-stat]').forEach((b) => {
    const k = b.dataset.stat;
    let on = false;
    if (k === 'total')                on = clean;
    else if (k === 'favorites')       on = state.favoritesOnly;
    else if (k.startsWith('status:')) on = state.status === k.slice(7);
    else if (k.startsWith('source:')) on = state.source === k.slice(7);
    b.classList.toggle('stat-active', on);
    b.setAttribute('aria-pressed', String(on));
  });
  statsAnimated = true;
}

function lockStateChip(r) {
  if (isProtected(r)) {
    if (isResourceLocked(r)) {
      return `<span class="cat-chip" style="color:#f0b53e;background:rgba(240,181,62,.1);border-color:rgba(240,181,62,.28)"><i class="bi bi-lock-fill" aria-hidden="true"></i>مقفل</span>`;
    }
    return `<span class="cat-chip" style="color:#4ade80;background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.25)"><i class="bi bi-unlock-fill" aria-hidden="true"></i>مفتوح</span>`;
  }
  return '';
}

/* أزرار التعديل والحذف — لوضع المالك فقط */
function adminBtnsHTML() {
  if (!isAdminActive()) return '';
  return `
    <button type="button" data-action="edit" class="icon-btn" aria-label="تعديل" title="تعديل"><i class="bi bi-pencil-square"></i></button>
    <button type="button" data-action="delete" class="icon-btn hover:!text-[#f4636e]" aria-label="حذف" title="حذف"><i class="bi bi-trash3"></i></button>`;
}

function cardHTML(r) {
  const locked = isResourceLocked(r);
  const favIcon = r.favorite ? 'bi-star-fill text-accent fav-pop' : 'bi-star';
  const stateChip = lockStateChip(r);
  const titleInner = escapeHtml(r.title);
  const titleEl = locked
    ? `<button type="button" data-action="open" title="يتطلب كلمة مرور هذا الكورس"
         class="block w-full text-start text-[15px] font-semibold leading-snug text-ink hover:text-accent transition-colors truncate">${titleInner}</button>`
    : `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" data-action="open"
         class="hover:text-accent transition-colors">${titleInner}</a>`;
  const openBtn = locked
    ? `<button type="button" data-action="open" class="open-btn" title="يتطلب كلمة مرور هذا الكورس">
         <i class="bi bi-lock-fill text-[10px]" aria-hidden="true"></i>فتح</button>`
    : `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" data-action="open" class="open-btn">
         <i class="bi bi-box-arrow-up-right text-[10px]" aria-hidden="true"></i>فتح</a>`;
  const cover = r.cover ? (locked
    ? `<div class="relative h-36 border-b border-edge overflow-hidden bg-canvas" aria-hidden="true">
         <img src="${escapeHtml(r.cover)}" alt="" loading="lazy" class="w-full h-full object-cover blur-md scale-110" onerror="this.remove()">
         <span class="absolute inset-0 grid place-items-center"><span class="lock-overlay"><i class="bi bi-lock-fill"></i>محمي بكلمة مرور</span></span>
       </div>`
    : `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" data-action="open"
         class="block h-36 border-b border-edge overflow-hidden bg-canvas">
         <img src="${escapeHtml(r.cover)}" alt="" loading="lazy" class="w-full h-full object-cover"
              onerror="this.parentElement.remove()"></a>`) : '';

  return `
  <article class="card-enter group relative flex flex-col rounded-2xl border border-edge bg-panel transition-all duration-200 hover:border-edge2 hover:-translate-y-0.5 overflow-hidden" data-id="${r.id}">
    ${cover}
    <div class="flex flex-col gap-3 p-4 grow">
      <div class="flex items-start justify-between gap-2">
        ${sourceTile(r.source)}
        <button type="button" data-action="favorite" aria-pressed="${r.favorite}"
                aria-label="${r.favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}" title="المفضلة"
                class="icon-btn ${r.favorite ? '!text-accent' : ''}">
          <i class="bi ${favIcon} text-[14px]"></i>
        </button>
      </div>
      <div class="min-w-0">
        <h3 class="text-[15px] font-semibold leading-snug truncate">${titleEl}</h3>
        <div class="mt-2 flex items-center gap-1.5 flex-wrap">
          ${categoryChip(r.category)}
          ${stateChip}
          <span class="text-[11px] text-dim">${escapeHtml(r.source)}</span>
        </div>
      </div>
      ${r.description ? `<p class="text-[12.5px] leading-relaxed text-mut line-clamp-2">${escapeHtml(r.description)}</p>` : ''}
      <div class="mt-auto pt-3 border-t border-edge/80 flex items-center justify-between gap-2">
        ${statusBadge(r.status)}
        <div class="flex items-center gap-0.5">
          ${openBtn}
          <button type="button" data-action="copy" class="icon-btn" aria-label="نسخ الرابط" title="نسخ الرابط"><i class="bi bi-clipboard"></i></button>
          ${adminBtnsHTML()}
        </div>
      </div>
      <div class="flex items-center gap-3 text-[10.5px] text-dim">
        <span class="inline-flex items-center gap-1"><i class="bi bi-clock-history" aria-hidden="true"></i>أُضيف ${fmtDate(r.createdAt)}</span>
        ${r.lastOpenedAt ? `<span class="inline-flex items-center gap-1"><i class="bi bi-eye" aria-hidden="true"></i>فُتح ${timeAgo(r.lastOpenedAt)}</span>` : ''}
      </div>
    </div>
  </article>`;
}

function rowHTML(r) {
  const locked = isResourceLocked(r);
  const favIcon = r.favorite ? 'bi-star-fill text-accent fav-pop' : 'bi-star';
  const stateChip = lockStateChip(r);
  const titleEl = locked
    ? `<button type="button" data-action="open" title="يتطلب كلمة مرور هذا الكورس"
         class="block truncate w-full text-start text-[13.5px] font-medium text-ink hover:text-accent transition-colors">${escapeHtml(r.title)}</button>`
    : `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" data-action="open"
         class="block truncate text-[13.5px] font-medium text-ink hover:text-accent transition-colors">${escapeHtml(r.title)}</a>`;
  const openBtn = locked
    ? `<button type="button" data-action="open" class="icon-btn" title="فتح — يتطلب كلمة مرور" aria-label="فتح"><i class="bi bi-lock-fill text-[12px]"></i></button>`
    : `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" data-action="open" class="icon-btn" aria-label="فتح" title="فتح"><i class="bi bi-box-arrow-up-right text-[12px]"></i></a>`;

  return `
  <div class="card-enter group grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1fr)_140px_125px_110px_auto] items-center gap-x-3 gap-y-1 px-4 py-3 border-b border-edge last:border-0 hover:bg-raise/60 transition-colors" data-id="${r.id}">
    ${sourceTile(r.source)}
    <div class="min-w-0">
      ${titleEl}
      <div class="md:hidden mt-1 flex items-center gap-2 flex-wrap">${categoryChip(r.category)}${stateChip}${statusBadge(r.status)}</div>
    </div>
    <div class="hidden md:flex items-center gap-1.5">${categoryChip(r.category)}${stateChip}</div>
    <div class="hidden md:block">${statusBadge(r.status)}</div>
    <div class="hidden lg:block text-[11px] text-dim whitespace-nowrap">${r.lastOpenedAt ? `فُتح ${timeAgo(r.lastOpenedAt)}` : '—'}</div>
    <div class="flex items-center gap-0.5 justify-end">
      <button type="button" data-action="favorite" aria-pressed="${r.favorite}"
              aria-label="${r.favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}" title="المفضلة"
              class="icon-btn ${r.favorite ? '!text-accent' : ''}"><i class="bi ${favIcon} text-[13px]"></i></button>
      ${openBtn}
      <button type="button" data-action="copy" class="icon-btn" aria-label="نسخ الرابط" title="نسخ الرابط"><i class="bi bi-clipboard"></i></button>
      ${adminBtnsHTML()}
    </div>
  </div>`;
}

function emptyStateHTML() {
  return `
  <div class="rounded-2xl border border-dashed border-edge2 bg-panel/40 px-6 py-16 flex flex-col items-center text-center gap-3">
    <span class="w-12 h-12 rounded-2xl bg-canvas border border-edge grid place-items-center text-dim text-[19px]"><i class="bi bi-funnel"></i></span>
    <div>
      <p class="text-[13.5px] font-medium text-ink">لا توجد موارد مطابقة</p>
      <p class="mt-1 text-[12px] text-mut">جرّب تعديل كلمة البحث أو الفلاتر الحالية.</p>
    </div>
    <button type="button" data-action="clear-filters" class="btn-ghost mt-1">
      <i class="bi bi-arrow-counterclockwise text-[12px]" aria-hidden="true"></i>مسح كل الفلاتر
    </button>
  </div>`;
}

function renderResources(opts = {}) {
  const animate = opts.animate !== false;
  const container = qs('#cardsContainer');
  const list = sortResources(filterResources(state.resources));

  qs('#resultsMeta').textContent = `يعرض ${list.length} من ${state.resources.length} مورد`;
  const clearBtn = qs('#clearFiltersBtn');
  clearBtn.classList.toggle('hidden', !hasActiveFilters());
  clearBtn.classList.toggle('flex', hasActiveFilters());
  updateHeaderMeta(list.length);

  if (!list.length) {
    container.className = '';
    container.innerHTML = emptyStateHTML();
    return;
  }
  container.className = state.layout === 'grid'
    ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
    : 'rounded-2xl border border-edge bg-panel overflow-hidden';
  container.classList.toggle('no-anim', !animate);
  container.innerHTML = state.layout === 'grid'
    ? list.map((r) => cardHTML(r)).join('')
    : list.map((r) => rowHTML(r)).join('');
}

function updateHeaderMeta(count) {
  const t = qs('#pageTitle'), s = qs('#pageSub');
  if (state.view === 'files') { t.textContent = 'ملفات مهمة';    s.textContent = 'مستندات Word المهمة الخاصة بك'; return; }
  if (state.view === 'data')  { t.textContent = 'إدارة البيانات'; s.textContent = 'نسخ احتياطي · استيراد · استرجاع'; return; }
  if (state.category !== 'all')   { t.textContent = state.category; s.textContent = `${count} مورد في هذا التصنيف`; }
  else if (state.favoritesOnly)   { t.textContent = 'المفضلة';      s.textContent = `${count} مورد محفوظ`; }
  else                            { t.textContent = 'المكتبة';      s.textContent = `${state.resources.length} مورد تعليمي في مكان واحد`; }
}

function syncControls() {
  const s = qs('#searchInput');
  if (document.activeElement !== s) s.value = state.search;
  qs('#filterSource').value = state.source;
  qs('#filterStatus').value = state.status;
  qs('#sortSelect').value = state.sort;
  qs('#viewGrid').setAttribute('aria-pressed', String(state.layout === 'grid'));
  qs('#viewList').setAttribute('aria-pressed', String(state.layout === 'list'));
}

function applyViewVisibility() {
  qs('#view-library').classList.toggle('hidden', state.view !== 'library');
  qs('#view-files').classList.toggle('hidden',   state.view !== 'files');
  qs('#view-data').classList.toggle('hidden',    state.view !== 'data');
}

function renderDataView() {
  qs('#exportCount').textContent = state.resources.length;
  qs('#restoreCount').textContent = state.resources.length;
}

function renderAll(opts = {}) {
  applyViewVisibility();
  renderSidebar();
  renderLockStatus();
  renderAdminUI();
  if (state.view === 'library') {
    updateDashboard();
    renderResources(opts);
    syncControls();
  } else if (state.view === 'data') {
    renderDataView();
  }
}

function switchView(v) {
  if (v === 'data' && !isAdminActive()) v = 'library'; // إدارة البيانات للمالك فقط
  state.view = v;
  renderAll();
  window.scrollTo(0, 0);
}

/* ==========================================================
   Toasts
   ========================================================== */

function showToast(message, type = 'success', { duration = 3800, action = null } = {}) {
  const meta = {
    success: ['bi-check-circle-fill', '#4ade80'],
    error:   ['bi-x-circle-fill', '#f4636e'],
    warn:    ['bi-exclamation-triangle-fill', '#f0b53e'],
    info:    ['bi-info-circle-fill', '#9c9cab']
  }[type] || ['bi-info-circle-fill', '#9c9cab'];

  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <i class="bi ${meta[0]} text-[15px] shrink-0 mt-0.5" style="color:${meta[1]}" aria-hidden="true"></i>
    <p class="grow text-[12.5px] leading-relaxed text-ink">${escapeHtml(message)}</p>
    ${action ? `<button type="button" class="toast-action text-[12px] font-semibold text-accent hover:text-accent2 shrink-0 px-1">${escapeHtml(action.label)}</button>` : ''}
    <button type="button" class="toast-x" aria-label="إغلاق التنبيه"><i class="bi bi-x-lg text-[10px]"></i></button>`;

  const remove = () => {
    if (!el.isConnected) return;
    el.classList.add('toast-out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };
  const timer = setTimeout(remove, duration);

  el.querySelector('.toast-x').addEventListener('click', () => { clearTimeout(timer); remove(); });
  const actBtn = el.querySelector('.toast-action');
  if (actBtn) actBtn.addEventListener('click', () => { clearTimeout(timer); remove(); action.onClick(); });

  const box = qs('#toasts');
  box.appendChild(el);
  while (box.children.length > 4) box.firstElementChild.remove();
}

/* ==========================================================
   المودالات
   ========================================================== */

let lastFocused = null;

function openModal(modal, focusEl) {
  lastFocused = document.activeElement;
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  setTimeout(() => (focusEl || modal.querySelector('button, input, select, textarea'))?.focus(), 60);
}

function closeModal(modal) {
  modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

let confirmCb = null;

function openConfirm({ title, message, confirmLabel = 'تأكيد', danger = false, onConfirm }) {
  qs('#confirmTitle').textContent = title;
  qs('#confirmMsg').textContent = message;
  const ok = qs('#confirmOk');
  ok.textContent = confirmLabel;
  ok.className = danger ? 'btn-danger' : 'btn-accent';
  const icon = qs('#confirmIcon');
  icon.className = 'icon-tile ' + (danger ? '!border-red/30 !text-red' : '!border-accent/30 !text-accent');
  icon.innerHTML = `<i class="bi ${danger ? 'bi-exclamation-triangle-fill' : 'bi-check2-circle'}"></i>`;
  confirmCb = onConfirm;
  openModal(qs('#confirmModal'), qs('#confirmCancel'));
}

/* ==========================================================
   نموذج إضافة / تعديل مورد
   ========================================================== */

function setFieldError(name, msg) {
  const errEl = qs('#e-' + name);
  const input = qs('#f-' + name);
  if (msg) {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
    input.classList.add('invalid');
  } else {
    errEl.classList.add('hidden');
    input.classList.remove('invalid');
  }
}

function clearFormErrors() {
  ['title', 'category', 'source', 'url', 'status'].forEach((f) => setFieldError(f, null));
  qs('#dupBox').classList.add('hidden');
  state.confirmedDup = false;
  state.urlMasked = false;
}

function openResourceModal(id = null) {
  state.editingId = id;
  clearFormErrors();
  const r = id ? getResourceById(id) : null;
  state.editingOriginalUrl = r ? r.url : '';
  state.urlMasked = !!(r && isResourceLocked(r));
  qs('#resourceModalTitle').textContent = r ? 'تعديل المورد' : 'إضافة مورد جديد';
  qs('#saveResourceBtn').textContent = r ? 'حفظ التعديلات' : 'إضافة المورد';
  qs('#f-title').value = r ? r.title : '';
  const hintEl = qs('#urlMaskHint');
  if (state.urlMasked) {
    qs('#f-url').value = MASKED_URL;
    if (hintEl) hintEl.classList.remove('hidden');
  } else {
    qs('#f-url').value = r ? r.url : '';
    if (hintEl) hintEl.classList.add('hidden');
  }
  qs('#f-category').value = r ? r.category : '';
  qs('#f-source').value = r ? r.source : '';
  qs('#f-status').value = r ? r.status : 'Not Started';
  qs('#f-cover').value = r ? r.cover : '';
  qs('#f-description').value = r ? r.description : '';
  qs('#f-notes').value = r ? r.notes : '';
  openModal(qs('#resourceModal'), qs('#f-title'));
}

/* ==========================================================
   إدارة البيانات (للمالك فقط)
   ========================================================== */

function exportData() {
  requireAdmin(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      resources: state.resources
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `course-library-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    showToast('تم تصدير نسخة احتياطية JSON بنجاح.', 'success');
  });
}

function validateBackupPayload(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data))
    return { ok: false, error: 'البنية غير صحيحة — يجب أن يكون الملف كائنًا يحتوي على version وresources.' };
  if (!('version' in data) || !('resources' in data))
    return { ok: false, error: 'البنية غير صحيحة — الحقول المطلوبة: version وresources.' };
  if (data.version !== 1)
    return { ok: false, error: `إصدار الملف (v${escapeHtml(String(data.version))}) غير مدعوم. الإصدار المدعوم: v1.` };
  if (!Array.isArray(data.resources))
    return { ok: false, error: 'الحقل resources يجب أن يكون مصفوفة.' };

  const seen = new Set();
  const out = [];
  for (let i = 0; i < data.resources.length; i++) {
    const raw = data.resources[i];
    const err = validateResource(raw);
    if (err)
      return { ok: false, error: `العنصر رقم ${i + 1}${raw && raw.title ? ` («${String(raw.title)}»)`:''} غير صالح — ${err}` };
    const id = (typeof raw.id === 'string' && raw.id.trim()) ? raw.id.trim() : uid();
    if (seen.has(id))
      return { ok: false, error: `العنصر رقم ${i + 1} يحمل معرّفًا (id) مكررًا: ${id}.` };
    seen.add(id);
    out.push(normalizeResource(raw, id));
  }
  return { ok: true, resources: out };
}

function importData(file) {
  if (!file) return;
  requireAdmin(() => {
    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try { data = JSON.parse(reader.result); }
      catch {
        showToast('فشل الاستيراد: الملف ليس JSON صالحًا.', 'error', { duration: 6000 });
        return;
      }
      const result = validateBackupPayload(data);
      if (!result.ok) {
        showToast('فشل الاستيراد: ' + result.error, 'error', { duration: 7000 });
        return;
      }
      openConfirm({
        title: 'استيراد واستبدال البيانات',
        message: `تم التحقق من الملف: ${result.resources.length} مورد سليم. سيتم استبدال مواردك الحالية (${state.resources.length} مورد) بالكامل. لا يمكن التراجع بعد التأكيد.`,
        confirmLabel: 'استبدال البيانات',
        danger: true,
        onConfirm() {
          state.resources = result.resources;
          saveResources();
          switchView('library');
          showToast(`تم استيراد ${result.resources.length} مورد بنجاح.`, 'success');
        }
      });
    };
    reader.onerror = () => showToast('تعذّر قراءة الملف.', 'error');
    reader.readAsText(file);
  });
}

function restoreInitialResources() {
  requireAdmin(() => {
    openConfirm({
      title: 'استرجاع الموارد الأصلية',
      message: `سيتم حذف جميع بياناتك الحالية (${state.resources.length} مورد) نهائيًا واستبدالها بالـ30 مورد الأصلية. يُنصح بتصدير نسخة احتياطية قبل المتابعة. هل أنت متأكد؟`,
      confirmLabel: 'نعم، استرجاع البيانات الأصلية',
      danger: true,
      onConfirm() {
        state.resources = cloneInitial();
        saveResources();
        switchView('library');
        showToast('تمت استعادة الـ30 مورد الأصلية.', 'success');
      }
    });
  });
}

/* ==========================================================
   ربط الأحداث
   ========================================================== */

function setLayout(layout) {
  if (state.layout === layout) return;
  state.layout = layout;
  saveSettings();
  renderResources();
  syncControls();
}

function openDrawer() {
  qs('#sidebar').classList.add('open');
  qs('#overlay').classList.remove('hidden');
  document.body.classList.add('overflow-hidden');
  qs('#menuBtn').setAttribute('aria-expanded', 'true');
}

function closeDrawer() {
  qs('#sidebar').classList.remove('open');
  qs('#overlay').classList.add('hidden');
  if (!qsa('.modal:not(.hidden)').length) document.body.classList.remove('overflow-hidden');
  qs('#menuBtn').setAttribute('aria-expanded', 'false');
}

function wireEvents() {
  /* ----- الهيدر ----- */
  qs('#menuBtn').addEventListener('click', openDrawer);
  qs('#closeSidebarBtn').addEventListener('click', closeDrawer);
  qs('#overlay').addEventListener('click', closeDrawer);
  qs('#addResourceBtn').addEventListener('click', () => requireAdmin(() => openResourceModal()));
  qs('#quickExportBtn').addEventListener('click', exportData);

  matchMedia('(min-width: 1024px)').addEventListener('change', (mq) => { if (mq.matches) closeDrawer(); });

  /* ----- التنقل الجانبي ----- */
  qs('#sideNav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-nav]');
    if (!btn) return;
    const raw = btn.dataset.nav;
    const i = raw.indexOf(':');
    const kind = raw.slice(0, i), val = raw.slice(i + 1);
    if (kind === 'view') {
      switchView(val);
    } else {
      state.view = 'library';
      if (kind === 'library') {
        state.category = 'all';
        state.favoritesOnly = val === 'favorites';
      } else {
        state.category = val;
        state.favoritesOnly = false;
      }
      switchView('library');
    }
    closeDrawer();
  });

  /* ----- الإحصائيات كفلاتر ----- */
  qs('#statsBar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-stat]');
    if (!b) return;
    const k = b.dataset.stat;
    if (k === 'total') { resetFilters(); return; }
    if (k === 'favorites') {
      state.favoritesOnly = !state.favoritesOnly;
    } else {
      const i = k.indexOf(':');
      const field = k.slice(0, i), value = k.slice(i + 1);
      state[field] = state[field] === value ? 'all' : value;
    }
    renderAll();
  });

  /* ----- شريط الأدوات ----- */
  qs('#searchInput').addEventListener('input', debounce((e) => {
    state.search = e.target.value.trim();
    renderAll();
  }, 180));
  qs('#searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (e.target.value) { e.target.value = ''; state.search = ''; renderAll(); }
      e.target.blur();
    }
  });
  qs('#filterSource').addEventListener('change', (e) => { state.source = e.target.value; renderAll(); });
  qs('#filterStatus').addEventListener('change', (e) => { state.status = e.target.value; renderAll(); });
  qs('#sortSelect').addEventListener('change',  (e) => { state.sort = e.target.value; renderAll(); });
  qs('#clearFiltersBtn').addEventListener('click', resetFilters);
  qs('#viewGrid').addEventListener('click', () => setLayout('grid'));
  qs('#viewList').addEventListener('click', () => setLayout('list'));

  /* ----- تفويض أحداث الكروت ----- */
  qs('#cardsContainer').addEventListener('click', (e) => {
    const clear = e.target.closest('[data-action="clear-filters"]');
    if (clear) { resetFilters(); return; }
    const card = e.target.closest('[data-id]');
    if (!card) return;
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const id = card.dataset.id;
    const r = getResourceById(id);
    switch (actionEl.dataset.action) {
      case 'open':
        if (r && isResourceLocked(r)) {
          e.preventDefault();
          requireUnlock(r, () => {
            openResource(id);
            window.open(r.url, '_blank', 'noopener,noreferrer');
          });
        } else {
          openResource(id);
        }
        break;
      case 'favorite':
        toggleFavorite(id);
        break;
      case 'copy':
        if (r && isResourceLocked(r)) requireUnlock(r, () => copyResourceUrl(id));
        else copyResourceUrl(id, actionEl);
        break;
      case 'edit':
        requireAdmin(() => openResourceModal(id));
        break;
      case 'delete':
        requireAdmin(() => deleteResource(id));
        break;
    }
  });

  /* ----- نموذج المورد ----- */
  const form = qs('#resourceForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const masked = !!state.editingId && state.urlMasked;
    const data = {
      title:       qs('#f-title').value.trim(),
      category:    qs('#f-category').value,
      source:      qs('#f-source').value,
      url:         masked ? state.editingOriginalUrl : qs('#f-url').value.trim(),
      cover:       qs('#f-cover').value.trim(),
      status:      qs('#f-status').value,
      description: qs('#f-description').value.trim(),
      notes:       qs('#f-notes').value.trim()
    };
    const checks = [['title', data.title], ['category', data.category], ['source', data.source]];
    if (!masked) checks.push(['url', data.url]);
    checks.push(['status', data.status]);
    let firstBad = null;
    checks.forEach(([f, v]) => {
      const msg = fieldError(f, v);
      setFieldError(f, msg);
      if (msg && !firstBad) firstBad = f;
    });
    if (firstBad) { qs('#f-' + firstBad).focus(); return; }

    const dup = masked ? null : findDuplicateUrl(data.url, state.editingId);
    if (dup && !state.confirmedDup) {
      qs('#dupMsg').innerHTML =
        `هذا الرابط مُسجَّل بالفعل في مكتبتك باسم «${escapeHtml(dup.title)}».` +
        ` هل ما زلت تريد ${state.editingId ? 'حفظ' : 'إضافة'} المورد بهذا الرابط؟`;
      qs('#dupBox').classList.remove('hidden');
      showToast('تنبيه: هذا الرابط موجود مسبقًا في المكتبة.', 'warn');
      return;
    }

    if (state.editingId) updateResource(state.editingId, data);
    else createResource(data);
    closeModal(qs('#resourceModal'));
  });

  qs('#f-url').addEventListener('focus', () => {
    if (state.urlMasked) qs('#f-url').select();
  });
  qs('#f-url').addEventListener('input', () => {
    if (state.urlMasked && qs('#f-url').value !== MASKED_URL) state.urlMasked = false;
    qs('#dupBox').classList.add('hidden');
    state.confirmedDup = false;
  });
  qs('#dupConfirmBtn').addEventListener('click', () => {
    state.confirmedDup = true;
    form.requestSubmit();
  });
  qsa('#resourceModal [data-close-resource]').forEach((el) =>
    el.addEventListener('click', () => closeModal(qs('#resourceModal'))));

  /* ----- نافذة التأكيد ----- */
  qs('#confirmOk').addEventListener('click', () => {
    const cb = confirmCb; confirmCb = null;
    closeModal(qs('#confirmModal'));
    if (cb) cb();
  });
  qs('#confirmCancel').addEventListener('click', () => { confirmCb = null; closeModal(qs('#confirmModal')); });
  qs('#confirmModal [data-close-confirm]').addEventListener('click', () => { confirmCb = null; closeModal(qs('#confirmModal')); });

  /* ----- القفل: توزيع أحداث على مستوى الصفحة ----- */
  document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'lockForm') {
      e.preventDefault();
      handleLockSubmit(e.target);
    }
  });
  document.addEventListener('click', (e) => {
    const submitBtn = e.target.closest('#lockModal button[type="submit"]');
    if (submitBtn) {
      e.preventDefault();
      handleLockSubmit(submitBtn.closest('form'));
      return;
    }
    if (e.target.closest('#lockModal [data-close-lock]')) {
      closeLockModal();
      return;
    }
    if (e.target.closest('#lockToggle')) {
      const input = qs('#lockPassword');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      qs('#lockToggle i').className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
      qs('#lockToggle').setAttribute('aria-label', show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
      input.focus();
    }
  });

  qs('#lockChip').addEventListener('click', () => {
    lockAll();
    renderAll();
    showToast('تمت إعادة قفل كل كورسات Google Drive.', 'info');
  });

  /* ----- دخول / خروج المالك ----- */
  qs('#adminChip').addEventListener('click', () => {
    if (isAdminActive()) {
      setAdminMode(false);
      if (state.view === 'data') state.view = 'library';
      renderAll();
      showToast('تم الخروج من وضع المالك — العودة لوضع الزائر.', 'info');
    } else {
      openLockModal({ mode: 'login' });
    }
  });

  qs('#lockPassword').addEventListener('input', hideLockError);

  /* ----- إدارة البيانات ----- */
  qs('#exportBtn').addEventListener('click', exportData);
  qs('#restoreBtn').addEventListener('click', restoreInitialResources);

  const dz = qs('#dropZone'), fi = qs('#importFile');
  dz.addEventListener('click', () => fi.click());
  dz.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); }
  });
  ['dragenter', 'dragover'].forEach((ev) =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) =>
    dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
  dz.addEventListener('drop', (e) => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) importData(f);
  });
  fi.addEventListener('change', () => {
    const f = fi.files[0];
    if (f) importData(f);
    fi.value = '';
  });

  /* ----- اختصارات لوحة المفاتيح ----- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModalEl = [qs('#confirmModal'), qs('#resourceModal'), qs('#lockModal')]
        .find((m) => !m.classList.contains('hidden'));
      if (openModalEl) {
        if (openModalEl.id === 'lockModal') closeLockModal();
        else closeModal(openModalEl);
        return;
      }
      if (qs('#sidebar').classList.contains('open')) { closeDrawer(); return; }
      return;
    }
    if (e.key === '/' && !isTypingTarget(e.target)
        && qs('#resourceModal').classList.contains('hidden')
        && qs('#confirmModal').classList.contains('hidden')
        && qs('#lockModal').classList.contains('hidden')) {
      e.preventDefault();
      const s = qs('#searchInput');
      s.focus();
      s.select();
    }
  });
}

/* ==========================================================
   الإقلاع
   ========================================================== */

function init() {
  ensureLockDOM();

  qs('#f-category').insertAdjacentHTML('beforeend',
    CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join(''));

  loadSettings();
  loadResources();
  wireEvents();
  switchView('library');
}

init();