/* ==========================================================
   My Course Library — app.js (v15)
   نواة المكتبة — الحماية في gate.js — المزامنة السحابية في cloud.js
   كتالوج الكورسات المدفوعة + الباقات + الأسعار
   ========================================================== */

'use strict';

const STORAGE_KEY = 'my-course-library:resources:v1';
const SETTINGS_KEY = 'my-course-library:settings:v1';

/* ---------- Nexora: نظام الكورسات المجانية والمدفوعة ---------- */
const CATALOG_KEY = 'nexora:catalog:v1';
const PACKAGES_KEY = 'nexora:packages:v1';

/* الكورسات المدفوعة بالأسعار الرسمية — متغيرش أي رقم */
const PAID_CATALOG = [
  { id: 'frontend-diploma',   title: 'Frontend Diploma',        category: 'Frontend',      accessType: 'paid', cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'تعلم تطوير واجهات المواقع باحتراف من الصفر للاحتراف.' },
  { id: 'backend-course',     title: 'Backend Course',          category: 'Backend',       accessType: 'paid', cashPrice: 2000, installmentAmount: 525,  installmentCount: 4, installmentTotal: 2100, description: 'ابنِ الخدمات الخلفية وقواعد البيانات باحتراف.' },
  { id: 'uiux-course',        title: 'UI/UX Course',            category: 'UI/UX',         accessType: 'paid', cashPrice: 1500, installmentAmount: 400,  installmentCount: 4, installmentTotal: 1600, description: 'تصميم تجارب وواجهات استخدام عصرية.' },
  { id: 'mobile-app-course',  title: 'Mobile App Course',       category: 'Mobile App',    accessType: 'paid', cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'تطوير تطبيقات الموبايل خطوة بخطوة.' },
  { id: 'data-diploma',       title: 'Data Analysis Diploma',   category: 'Data Analysis', accessType: 'paid', cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'تحليل البيانات واتخاذ القرار بالأرقام.' },
  { id: 'ai-ds-ml',           title: 'AI / Data Science / ML',  category: 'AI',            accessType: 'paid', cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'الذكاء الاصطناعي وعلم البيانات وتعلم الآلة.' },
  { id: 'cyber-course',       title: 'Cyber Security Course',   category: 'Cyber Security',accessType: 'paid', cashPrice: 2999, installmentAmount: 775,  installmentCount: 4, installmentTotal: 3100, description: 'أساسيات وعمق الأمن السيبراني.' },
  { id: 'media-buying',       title: 'Media Buying Course',     category: 'Other',         accessType: 'paid', cashPrice: 2000, installmentAmount: 525,  installmentCount: 4, installmentTotal: 2100, description: 'الإعلانات الممولة وإدارة الحملات.' },
  { id: 'fullstack-diploma',  title: 'Full Stack Diploma',      category: 'Full Stack',    accessType: 'paid', cashPrice: 4500, installmentAmount: 1150, installmentCount: 4, installmentTotal: 4600, description: 'الواجهة والخلفية في دبلومة واحدة شاملة.' }
];

/* الباقات الرسمية — متغيرش أي رقم */
const PACKAGES = [
  { id: 'starter-pack',      title: 'Starter Pack',      courseIds: ['frontend-diploma','uiux-course'],              cashPrice: 3500, installmentAmount: 875,  installmentCount: 4, installmentTotal: 3500,  featured: false },
  { id: 'developer-pack',    title: 'Developer Pack',    courseIds: ['frontend-diploma','backend-course','uiux-course','git-github'], cashPrice: 6000, installmentAmount: 1500, installmentCount: 4, installmentTotal: 6000,  featured: false },
  { id: 'professional-pack', title: 'Professional Pack', courseIds: ['frontend-diploma','backend-course','mobile-app-course','data-diploma','uiux-course','media-buying'], cashPrice: 7999, installmentAmount: 2000, installmentCount: 4, installmentTotal: 8000,  featured: false },
  { id: 'tech-master-pack',  title: 'Tech Master Pack',  courseIds: ['frontend-diploma','backend-course','fullstack-diploma','mobile-app-course','data-diploma','ai-ds-ml','cyber-course','uiux-course','media-buying'], cashPrice: 9999, installmentAmount: 2500, installmentCount: 4, installmentTotal: 10000, featured: true }
];

const fmtEGP = (n) => Number(n).toLocaleString('ar-EG-u-nu-latn') + ' جنيه';
function getPaidCourse(id) { return PAID_CATALOG.find((c) => c.id === id) || null; }
function renderPriceBlock(c, compact) {
  if (c.accessType !== 'paid') return '';
  const cash = `
    <div class="price-cash">
      <span class="price-label">دفع كاش</span>
      <span class="price-value">${fmtEGP(c.cashPrice)}</span>
    </div>`;
  const inst = `
    <div class="price-inst">
      <span class="price-label">التقسيط متاح</span>
      <span class="price-value-sm">${fmtEGP(c.installmentAmount)} × ${c.installmentCount} دفعات = ${fmtEGP(c.installmentTotal)}</span>
    </div>`;
  return `<div class="price-block ${compact ? 'compact' : ''}">${cash}${inst}</div>`;
}

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
    ['CS50 - Computer Science Fundamentals', 'Computer Science', 'YouTube', 'https://youtube.com/playlist?list=PLknwEmKsW8OvMsFbU9zo8oJCprAsgc4LO&si=EIeS-4HGd_CX778k'],
    ['إنجليزية للمبتدئين',               'Other',            'YouTube',      'https://youtu.be/9ayf1XuXrVg'],
  ];
  return rows.map(([title, category, source, url], i) => ({
    id: 'res-' + String(i + 1).padStart(3, '0'),
    title, category, source, description: '', url, cover: '',
    status: 'Not Started', notes: '',
    createdAt: new Date(Date.parse(INITIAL_CREATED_AT) + i * 60000).toISOString(),
    lastOpenedAt: null, favorite: false
  }));
})();

const state = {
  resources: [], view: 'library', layout: 'grid',
  search: '', category: 'all', source: 'all', status: 'all',
  favoritesOnly: false, sort: 'newest',
  editingId: null, confirmedDup: false, urlMasked: false, editingOriginalUrl: ''
};

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let statsAnimated = false;

/* ---------- أدوات ---------- */
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
  try { const x = new URL(u.trim()); return x.protocol === 'http:' || x.protocol === 'https:'; }
  catch { return false; }
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
  if (diff < 3600)     return rtf.format(-Math.round(diff / 60), 'minute');
  if (diff < 86400)    return rtf.format(-Math.round(diff / 3600), 'hour');
  if (diff < 604800)   return rtf.format(-Math.round(diff / 604800), 'week');
  if (diff < 2629800)  return rtf.format(-Math.round(diff / 2629800), 'month');
  return fmtDate(iso);
}

function isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
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

/* ---------- روابط مساعدة لـ gate.js و cloud.js ---------- */
function protectedResources() {
  return state.resources.filter((r) => MCL.isProtected(r));
}
if (window.MCL) {
  MCL.hasProtected = () => state.resources.some((r) => MCL.isProtected(r));
}

function countLockedVisible() {
  return protectedResources().filter((r) => MCL.isResourceLocked(r)).length;
}

/* ---------- التخزين ---------- */
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
    showToast('كانت البيانات المحفوظة تالفة — تمت استعادة القايمة الأصلية.', 'warn');
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

/* ---------- البحث / الفلترة / الترتيب ---------- */
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
  if (state.category !== 'all') out = out.filter((r) => r.category === state.category);
  if (state.source !== 'all')   out = out.filter((r) => r.source === state.source);
  if (state.status !== 'all')   out = out.filter((r) => r.status === state.status);
  if (state.favoritesOnly)      out = out.filter((r) => r.favorite);
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

/* ---------- CRUD ---------- */
function getResourceById(id) {
  return state.resources.find((r) => r.id === id) || null;
}

function createResource(data) {
  const resource = normalizeResource(data, uid());
  state.resources.push(resource);
  saveResources();
  renderAll();
  showToast(`تمت إضافة «${resource.title}» — هيتزامن سحابيًا مع كل الأجهزة.`, 'success');
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
    message: `سيتم حذف «${resource.title}» نهائيًا من المكتبة (وسيتحذف من كل الأجهزة بعد المزامنة).`,
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

/* ---------- التحقق ---------- */
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

/* ---------- العرض ---------- */
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
  if (window.MCL && MCL.isAdminActive()) {
    html += navItem({ nav: 'view:subs', icon: 'bi-people', label: 'المشتركون',
      count: Object.keys(MCL.subscriptions).length, active: state.view === 'subs' });
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
  if (MCL.isProtected(r)) {
    if (MCL.isResourceLocked(r)) {
      return `<span class="cat-chip" style="color:#f0b53e;background:rgba(240,181,62,.1);border-color:rgba(240,181,62,.28)"><i class="bi bi-lock-fill" aria-hidden="true"></i>مقفل</span>`;
    }
    return `<span class="cat-chip" style="color:#4ade80;background:rgba(74,222,128,.08);border-color:rgba(74,222,128,.25)"><i class="bi bi-unlock-fill" aria-hidden="true"></i>متاح</span>`;
  }
  return '';
}

function copyBtnHTML(r) {
  if (MCL.isProtected(r) && !MCL.isAdminActive()) return '';
  return `<button type="button" data-action="copy" class="icon-btn" aria-label="نسخ الرابط" title="نسخ الرابط"><i class="bi bi-clipboard"></i></button>`;
}

function adminBtnsHTML() {
  if (!MCL.isAdminActive()) return '';
  return `
    <button type="button" data-action="edit" class="icon-btn" aria-label="تعديل" title="تعديل"><i class="bi bi-pencil-square"></i></button>
    <button type="button" data-action="delete" class="icon-btn hover:!text-[#f4636e]" aria-label="حذف" title="حذف"><i class="bi bi-trash3"></i></button>`;
}

function cardHTML(r) {
  const locked = MCL.isResourceLocked(r);
  const favIcon = r.favorite ? 'bi-star-fill text-accent fav-pop' : 'bi-star';
  const stateChip = lockStateChip(r);
  const titleInner = escapeHtml(r.title);
  const titleEl = locked
    ? `<button type="button" data-action="open" title="يتطلب اشتراك"
         class="block w-full text-start text-[15px] font-semibold leading-snug text-ink hover:text-accent transition-colors truncate">${titleInner}</button>`
    : `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" data-action="open"
         class="hover:text-accent transition-colors">${titleInner}</a>`;
  const openBtn = locked
    ? `<button type="button" data-action="open" class="open-btn" title="يتطلب اشتراك">
         <i class="bi bi-lock-fill text-[10px]" aria-hidden="true"></i>فتح</button>`
    : `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" data-action="open" class="open-btn">
         <i class="bi bi-box-arrow-up-right text-[10px]" aria-hidden="true"></i>فتح</a>`;
  const cover = r.cover ? (locked
    ? `<div class="relative h-36 border-b border-edge overflow-hidden bg-canvas" aria-hidden="true">
         <img src="${escapeHtml(r.cover)}" alt="" loading="lazy" class="w-full h-full object-cover blur-md scale-110" onerror="this.remove()">
         <span class="absolute inset-0 grid place-items-center"><span class="lock-overlay"><i class="bi bi-lock-fill"></i>للمشتركين</span></span>
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
          ${copyBtnHTML(r)}
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
  const locked = MCL.isResourceLocked(r);
  const favIcon = r.favorite ? 'bi-star-fill text-accent fav-pop' : 'bi-star';
  const stateChip = lockStateChip(r);
  const titleEl = locked
    ? `<button type="button" data-action="open" title="يتطلب اشتراك"
         class="block truncate w-full text-start text-[13.5px] font-medium text-ink hover:text-accent transition-colors">${escapeHtml(r.title)}</button>`
    : `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" data-action="open"
         class="block truncate text-[13.5px] font-medium text-ink hover:text-accent transition-colors">${escapeHtml(r.title)}</a>`;
  const openBtn = locked
    ? `<button type="button" data-action="open" class="icon-btn" title="يتطلب اشتراك" aria-label="فتح"><i class="bi bi-lock-fill text-[12px]"></i></button>`
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
      ${copyBtnHTML(r)}
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
  if (state.view === 'subs')  { t.textContent = 'المشتركون';      s.textContent = 'إدارة اشتراكات أرقام الموبايل'; return; }
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
  const subs = qs('#view-subs');
  if (subs) subs.classList.toggle('hidden', state.view !== 'subs');
}

function renderDataView() {
  qs('#exportCount').textContent = state.resources.length;
  qs('#restoreCount').textContent = state.resources.length;
}

function renderAll(opts = {}) {
  applyViewVisibility();
  renderSidebar();
  if (state.view === 'library') {
    updateDashboard();
    renderResources(opts);
    syncControls();
  } else if (state.view === 'data') {
    renderDataView();
  }
  if (window.MCL) {
    MCL.countLockedVisible = countLockedVisible;
    if (typeof MCL.renderChips === 'function') MCL.renderChips();
    if (typeof MCL.onRender === 'function') MCL.onRender(state.view);
  }
}

function switchView(v) {
  if ((v === 'data' || v === 'subs') && !(window.MCL && MCL.isAdminActive())) v = 'library';
  state.view = v;
  renderAll();
  window.scrollTo(0, 0);
}

/* ---------- Toasts ---------- */
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

/* ---------- المودالات ---------- */
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

/* ---------- نموذج المورد ---------- */
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
  state.urlMasked = !!(r && MCL.isResourceLocked(r));
  qs('#resourceModalTitle').textContent = r ? 'تعديل المورد' : 'إضافة مورد جديد';
  qs('#saveResourceBtn').textContent = r ? 'حفظ التعديلات' : 'إضافة المورد';
  qs('#f-title').value = r ? r.title : '';
  const hintEl = qs('#urlMaskHint');
  if (state.urlMasked) {
    qs('#f-url').value = '••••••••••••••••';
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

/* ---------- إدارة البيانات (للمالك) ---------- */
function exportData() {
  MCL.requireAdmin(() => {
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
  MCL.requireAdmin(() => {
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
        message: `تم التحقق من الملف: ${result.resources.length} مورد سليم. سيتم استبدال الموارد الحالية (${state.resources.length} مورد) بالكامل، وستنشر على السحابة تلقائيًا. لا يمكن التراجع بعد التأكيد.`,
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
  MCL.requireAdmin(() => {
    openConfirm({
      title: 'استرجاع الموارد الأصلية',
      message: `سيتم حذف جميع البيانات الحالية (${state.resources.length} مورد) نهائيًا واستبدالها بالقايمة الأصلية، وستنشر التغييرات على السحابة. هل أنت متأكد؟`,
      confirmLabel: 'نعم، استرجاع البيانات الأصلية',
      danger: true,
      onConfirm() {
        state.resources = cloneInitial();
        saveResources();
        switchView('library');
        showToast('تمت استعادة القايمة الأصلية.', 'success');
      }
    });
  });
}

/* ---------- ربط الأحداث ---------- */
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
  qs('#menuBtn').addEventListener('click', openDrawer);
  qs('#closeSidebarBtn').addEventListener('click', closeDrawer);
  qs('#overlay').addEventListener('click', closeDrawer);
  qs('#addResourceBtn').addEventListener('click', () => MCL.requireAdmin(() => openResourceModal()));
  qs('#quickExportBtn').addEventListener('click', exportData);

  matchMedia('(min-width: 1024px)').addEventListener('change', (mq) => { if (mq.matches) closeDrawer(); });

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
        if (r && MCL.isResourceLocked(r)) {
          e.preventDefault();
          MCL.requireUnlock(r, () => {
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
        if (r && MCL.isProtected(r) && !MCL.isAdminActive()) return;
        copyResourceUrl(id, actionEl);
        break;
      case 'edit':
        MCL.requireAdmin(() => openResourceModal(id));
        break;
      case 'delete':
        MCL.requireAdmin(() => deleteResource(id));
        break;
    }
  });

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
        `هذا الرابط مُسجَّل بالفعل باسم «${escapeHtml(dup.title)}».` +
        ` هل ما زلت تريد ${state.editingId ? 'حفظ' : 'إضافة'} المورد بهذا الرابط؟`;
      qs('#dupBox').classList.remove('hidden');
      showToast('تنبيه: هذا الرابط موجود مسبقًا.', 'warn');
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
    if (state.urlMasked && qs('#f-url').value !== '••••••••••••••••') state.urlMasked = false;
    qs('#dupBox').classList.add('hidden');
    state.confirmedDup = false;
  });
  qs('#dupConfirmBtn').addEventListener('click', () => {
    state.confirmedDup = true;
    form.requestSubmit();
  });
  qsa('#resourceModal [data-close-resource]').forEach((el) =>
    el.addEventListener('click', () => closeModal(qs('#resourceModal'))));

  qs('#confirmOk').addEventListener('click', () => {
    const cb = confirmCb; confirmCb = null;
    closeModal(qs('#confirmModal'));
    if (cb) cb();
  });
  qs('#confirmCancel').addEventListener('click', () => { confirmCb = null; closeModal(qs('#confirmModal')); });
  qs('#confirmModal [data-close-confirm]').addEventListener('click', () => { confirmCb = null; closeModal(qs('#confirmModal')); });

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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModalEl = [qs('#confirmModal'), qs('#resourceModal'), qs('#lockModal')]
        .find((m) => m && !m.classList.contains('hidden'));
      if (openModalEl) {
        if (openModalEl.id === 'lockModal') {
          if (typeof MCL.closeLockModal === 'function') MCL.closeLockModal();
          else { openModalEl.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); }
        } else closeModal(openModalEl);
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

/* ---------- الإقلاع ---------- */
function init() {
  console.log('%c My Course Library — v15 ', 'background:#f0b53e;color:#161204;font-weight:bold');

  /* فحص التكامل مع gate.js */
  const required = ['isAdminActive', 'isProtected', 'isResourceLocked',
                    'requireAdmin', 'requireUnlock', 'loadSubscriptions',
                    'openLockModal', 'closeLockModal'];
  const missing = !window.MCL
    ? required
    : required.filter((k) => typeof MCL[k] !== 'function');
  if (missing.length) {
    console.error('%c[GATE] gate.js ناقص أو نسخة قديمة! الغائب: ' + missing.join(', '),
      'background:#e5484d;color:#fff;font-weight:bold;padding:4px 8px');
    showToast('خطأ: gate.js ناقص أو قديم — حدّث الملفات على نفس الرقم.', 'error', { duration: 10000 });
  }

  /* ربط الواجهتين */
  MCL.getCourses = () => [...new Set(state.resources.filter((r) => r.source === 'Google Drive').map((r) => r.title))];
  MCL.getView = () => state.view;
  MCL.renderAll = renderAll;
  MCL.onRender = (view) => {
    if (view === 'subs' && typeof window.renderSubsViewGate === 'function') window.renderSubsViewGate();
  };

  /* تطبيق الكورسات القادمة من السحابة */
  window.__applyCloudResources = (arr) => { state.resources = arr; renderAll(); };

  const fp = qs('footer p');
  if (fp && !qs('#mclVersionBadge')) {
    const b = document.createElement('span');
    b.id = 'mclVersionBadge';
    b.className = 'text-accent font-mono';
    b.textContent = ' — v15';
    fp.appendChild(b);
  }

  qs('#f-category').insertAdjacentHTML('beforeend',
    CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join(''));

  loadSettings();
  loadResources();
  wireEvents();
  switchView('library');
  if (!missing.length) {
    MCL.loadSubscriptions();
    if (protectedResources().length && !MCL.isAdminActive() && !MCL.getSubscriberPhone()) {
      MCL.openLockModal({ mode: 'gate' });
    }
  }
}

init();