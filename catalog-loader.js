/* ==========================================================
   catalog-loader.js — v1.1
   تحميل الكتالوج من Firestore (courses + packages) — لحظيًا
   بيوفر: window.__NEXORA_CATALOG__ لكل الملفات
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Catalog Loader — v1.1 ', 'background:#4f7cff;color:#fff;font-weight:bold');

  /* انتظر لحد ما Firebase يتهيأ */
  let db = null;
  function initFirebase() {
    if (typeof firebase === 'undefined') return null;
    if (!firebase.apps.length) {
      const cfg = window.__FIREBASE_CONFIG__ || {};
      try { firebase.initializeApp(cfg); } catch (e) { /* already init */ }
    }
    return firebase.firestore();
  }

  /* الكتالوج الافتراضي — fallback لو Firestore فاضي */
  const FALLBACK_COURSES = [
    { id: 'frontend-diploma',   title: 'Frontend Diploma',        category: 'Frontend',      accessType: 'paid', cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'تعلم تطوير واجهات المواقع باحتراف من الصفر للاحتراف.', icon: '🌐', order: 1 },
    { id: 'backend-course',     title: 'Backend Course',          category: 'Backend',       accessType: 'paid', cashPrice: 2000, installmentAmount: 525,  installmentCount: 4, installmentTotal: 2100, description: 'ابنِ الخدمات الخلفية وقواعد البيانات باحتراف.', icon: '⚙️', order: 2 },
    { id: 'uiux-course',        title: 'UI/UX Course',            category: 'UI/UX',         accessType: 'paid', cashPrice: 1500, installmentAmount: 400,  installmentCount: 4, installmentTotal: 1600, description: 'تصميم تجارب وواجهات استخدام عصرية.', icon: '🎨', order: 3 },
    { id: 'mobile-app-course',  title: 'Mobile App Course',       category: 'Mobile App',    accessType: 'paid', cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'تطوير تطبيقات الموبايل خطوة بخطوة.', icon: '📱', order: 4 },
    { id: 'data-diploma',       title: 'Data Analysis Diploma',   category: 'Data Analysis', accessType: 'paid', cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'تحليل البيانات واتخاذ القرار بالأرقام.', icon: '📊', order: 5 },
    { id: 'ai-ds-ml',           title: 'AI / Data Science / ML',  category: 'AI',            accessType: 'paid', cashPrice: 2500, installmentAmount: 650,  installmentCount: 4, installmentTotal: 2600, description: 'الذكاء الاصطناعي وعلم البيانات وتعلم الآلة.', icon: '🤖', order: 6 },
    { id: 'cyber-course',       title: 'Cyber Security Course',   category: 'Cyber Security',accessType: 'paid', cashPrice: 2999, installmentAmount: 775,  installmentCount: 4, installmentTotal: 3100, description: 'أساسيات وعمق الأمن السيبراني.', icon: '🔐', order: 7 },
    { id: 'media-buying',       title: 'Media Buying Course',     category: 'Other',         accessType: 'paid', cashPrice: 2000, installmentAmount: 525,  installmentCount: 4, installmentTotal: 2100, description: 'الإعلانات الممولة وإدارة الحملات.', icon: '📣', order: 8 },
    { id: 'fullstack-diploma',  title: 'Full Stack Diploma',      category: 'Full Stack',    accessType: 'paid', cashPrice: 4500, installmentAmount: 1150, installmentCount: 4, installmentTotal: 4600, description: 'الواجهة والخلفية في دبلومة واحدة شاملة.', icon: '🚀', order: 9 },
    { id: 'git-github',         title: 'Git & GitHub',            category: 'Other',         accessType: 'paid', cashPrice: 500,  installmentAmount: 150,  installmentCount: 4, installmentTotal: 600,  description: 'أساسيات إدارة الإصدارات والعمل الجماعي.', icon: '📦', order: 10 }
  ];

  const FALLBACK_PACKAGES = [
    { id: 'starter-pack',      title: 'Starter Pack',      courseIds: ['frontend-diploma','uiux-course'],              cashPrice: 3500, installmentAmount: 875,  installmentCount: 4, installmentTotal: 3500,  featured: false, count: 2, order: 1 },
    { id: 'developer-pack',    title: 'Developer Pack',    courseIds: ['frontend-diploma','backend-course','uiux-course','git-github'], cashPrice: 6000, installmentAmount: 1500, installmentCount: 4, installmentTotal: 6000,  featured: false, count: 4, order: 2 },
    { id: 'professional-pack', title: 'Professional Pack', courseIds: ['frontend-diploma','backend-course','mobile-app-course','data-diploma','uiux-course','media-buying'], cashPrice: 7999, installmentAmount: 2000, installmentCount: 4, installmentTotal: 8000,  featured: false, count: 6, order: 3 },
    { id: 'tech-master-pack',  title: 'Tech Master Pack',  courseIds: ['frontend-diploma','backend-course','fullstack-diploma','mobile-app-course','data-diploma','ai-ds-ml','cyber-course','uiux-course','media-buying'], cashPrice: 9999, installmentAmount: 2500, installmentCount: 4, installmentTotal: 10000, featured: true,  count: 9, order: 4 }
  ];

  /* الحالة العامة */
  const Catalog = window.__NEXORA_CATALOG__ = {
    ready: false,
    source: 'fallback',
    courses: FALLBACK_COURSES.slice(),
    packages: FALLBACK_PACKAGES.slice(),
    byId: {},
    packById: {},
    _ready: null
  };

  /* تحديث الفهارس */
  function rebuildIndexes() {
    Catalog.byId = {};
    Catalog.packById = {};
    Catalog.courses.forEach((c) => { Catalog.byId[c.id] = c; });
    Catalog.packages.forEach((p) => { Catalog.packById[p.id] = p; });
  }
  rebuildIndexes();

  /* أدوات مساعدة */
  Catalog.getCourse = (id) => Catalog.byId[id] || null;
  Catalog.getPackage = (id) => Catalog.packById[id] || null;

  /* قراءة من Firestore — لحظيًا (onSnapshot) */
  function startFirestoreListeners() {
    /* كورسات */
    db.collection('courses').onSnapshot((snap) => {
      const courses = [];
      snap.forEach((doc) => {
        const d = doc.data();
        if (!d || !d.id || !d.title) return;
        courses.push({ ...d, _docId: doc.id });
      });
      courses.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      if (courses.length > 0) {
        Catalog.courses = courses;
        Catalog.source = 'firestore';
        rebuildIndexes();
        console.info('[CATALOG-LOADER] ✅ كورسات محدّثة من Firestore:', courses.length);
        window.dispatchEvent(new CustomEvent('nexora:catalog-update', { detail: { type: 'courses', count: courses.length } }));
      }
    }, (err) => console.warn('[CATALOG-LOADER] فشل الاستماع للكورسات:', err.code));

    /* باقات */
    db.collection('packages').onSnapshot((snap) => {
      const packages = [];
      snap.forEach((doc) => {
        const d = doc.data();
        if (!d || !d.id || !d.title) return;
        packages.push({ ...d, _docId: doc.id });
      });
      packages.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
      if (packages.length > 0) {
        Catalog.packages = packages;
        rebuildIndexes();
        console.info('[CATALOG-LOADER] ✅ باقات محدّثة من Firestore:', packages.length);
        window.dispatchEvent(new CustomEvent('nexora:catalog-update', { detail: { type: 'packages', count: packages.length } }));
      }
    }, (err) => console.warn('[CATALOG-LOADER] فشل الاستماع للباقات:', err.code));
  }

  /* التحميل الرئيسي */
  Catalog._ready = (async function init() {
    /* انتظر لحد ما Firebase يكون جاهز */
    await new Promise((resolve) => {
      if (typeof firebase !== 'undefined' && firebase.apps.length) return resolve();
      let tries = 0;
      const t = setInterval(() => {
        tries++;
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
          clearInterval(t); resolve();
        } else if (tries > 50) {
          clearInterval(t); resolve();
        }
      }, 100);
    });

    db = initFirebase();
    if (!db) {
      console.warn('[CATALOG-LOADER] Firebase مش جاهز — بنستخدم fallback');
      Catalog.ready = true;
      return;
    }

    /* ابدأ الاستماع اللحظي */
    try {
      startFirestoreListeners();
      Catalog.ready = true;

      /* إطلاق event مبدئي بعد ثانيتين */
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('nexora:catalog-ready', {
          detail: { source: Catalog.source, courses: Catalog.courses.length, packages: Catalog.packages.length }
        }));
      }, 2000);
    } catch (err) {
      console.error('[CATALOG-LOADER] فشل التشغيل:', err.message);
      Catalog.ready = true;
      Catalog.source = 'fallback';
    }
  })();

})();