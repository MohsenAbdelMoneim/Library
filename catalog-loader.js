/* ==========================================================
   catalog-loader.js — v2.0
   تحميل الكتالوج من Firestore (courses + packages) — لحظيًا
   بيوفر: window.__NEXORA_CATALOG__ لكل الملفات

   ✅ v2.0: إلغاء الـFallback الأسعاري — البداية فاضية.
      ليه؟ لو Firestore فشل والأسعار الاحتياطية ظهرت، الطالب
      كان بيحجز بأسعار قديمة غلط والسعر الغلط بيتسجل في الطلب.
      دلوقتي: فاضي صادق (والصفحات كلها فيها empty states جاهزة).
   ✅ v2.0: catalog-ready بيتطلق على أول snapshot فعلي
      (مش مؤقّت ثابت 2 ثانية عشوائي)
   ✅ v2.0: الحذف بينزل — السنابشوت الفاضي بيتطبق
      (قبل كده كان بيتجاهل فالمسح مش كان بيوصّل للأجهزة)
   ✅ v2.0: permission-denied بيتنادى بتوست + status API للتشخيص
   ✅ v2.0: تطبيع الأرقام + حماية init + offline persistence
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Catalog Loader — v2.0 ', 'background:#4f7cff;color:#fff;font-weight:bold');

  /* ---------- أدوات ---------- */
  const num = (v, fb) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fb;
  };

  function normalizeCourse(d, docId) {
    return {
      id: String(d.id),
      title: String(d.title),
      category: d.category || 'Other',
      accessType: d.accessType || 'paid',
      cashPrice: num(d.cashPrice, 0),
      installmentAmount: num(d.installmentAmount, 0),
      installmentCount: num(d.installmentCount, 0),
      installmentTotal: num(d.installmentTotal, 0),
      description: d.description || '',
      icon: d.icon || '🎓',
      order: num(d.order, 999),
      _docId: docId
    };
  }

  function normalizePackage(d, docId) {
    return {
      id: String(d.id),
      title: String(d.title),
      courseIds: Array.isArray(d.courseIds) ? d.courseIds : [],
      cashPrice: num(d.cashPrice, 0),
      installmentAmount: num(d.installmentAmount, 0),
      installmentCount: num(d.installmentCount, 0),
      installmentTotal: num(d.installmentTotal, 0),
      featured: d.featured === true,
      count: num(d.count, (Array.isArray(d.courseIds) ? d.courseIds.length : 0)),
      order: num(d.order, 999),
      _docId: docId
    };
  }

  /* ==========================================================
     ✅ v2.0: البداية فاضية — مش مليانة أسعار مكتوبة يدويًا
     ========================================================== */
  const Catalog = window.__NEXORA_CATALOG__ = {
    ready: false,
    source: 'empty',     /* empty | firestore */
    courses: [],
    packages: [],
    byId: {},
    packById: {},
    error: null,

    getCourse: function (id) { return Catalog.byId[id] || null; },
    getPackage: function (id) { return Catalog.packById[id] || null; },

    /* ✅ v2.0: تشخيص من الـConsole — NexoraCatalogLoader.status() */
    _meta: { listenersAttached: false, firstSnapshotAt: null, lastSnapshotAt: null }
  };

  function rebuildIndexes() {
    Catalog.byId = {};
    Catalog.packById = {};
    Catalog.courses.forEach((c) => { Catalog.byId[c.id] = c; });
    Catalog.packages.forEach((p) => { Catalog.packById[p.id] = p; });
  }

  /* ---------- أحداث ---------- */
  let readyFired = false;

  function fireReady() {
    if (readyFired) return;
    readyFired = true;
    Catalog.ready = true;
    window.dispatchEvent(new CustomEvent('nexora:catalog-ready', {
      detail: { source: Catalog.source, courses: Catalog.courses.length, packages: Catalog.packages.length }
    }));
    console.info('[CATALOG-LOADER] ✅ جاهز —', Catalog.courses.length, 'كورس،', Catalog.packages.length, 'باقة (', Catalog.source, ')');
  }

  function fireUpdate(kind, count) {
    window.dispatchEvent(new CustomEvent('nexora:catalog-update', {
      detail: { type: kind, count }
    }));
  }

  let warnedPermission = false;
  function handleListenError(kind, err) {
    Catalog.error = err.code || 'unknown';
    console.warn('[CATALOG-LOADER] استماع ' + kind + ':', err.code);
    if (err.code === 'permission-denied' && !warnedPermission) {
      warnedPermission = true;
      if (typeof window.showToast === 'function') {
        window.showToast('الكاتالوج مقفول — راجع Firestore Rules على courses/packages', 'error', 9000);
      }
    }
  }

  /* ---------- Firestore ---------- */
  let db = null;

  function initFirebase() {
    if (typeof firebase === 'undefined' || !firebase.initializeApp) return null;
    try {
      if (!firebase.apps.length) {
        const cfg = window.__FIREBASE_CONFIG__;
        if (!cfg || !cfg.projectId) {
          console.warn('[CATALOG-LOADER] مفيش __FIREBASE_CONFIG__ صالح — الكتالوج هيفضل فاضي');
          return null;
        }
        firebase.initializeApp(cfg);
      }
      return firebase.firestore();
    } catch (e) {
      console.warn('[CATALOG-LOADER] init فشل:', e.message);
      return null;
    }
  }

  function startListeners() {
    /* ✅ v2.0: أول snapshot (حتى لو فاضي) بيطلق ready —
       والمسح بينزل — قبل كده الفاضي بيتجاهل فالحذف مش كان بيوصّل */

    db.collection('courses').onSnapshot((snap) => {
      Catalog._meta.firstSnapshotAt = Catalog._meta.firstSnapshotAt || Date.now();
      Catalog._meta.lastSnapshotAt = Date.now();

      const courses = [];
      snap.forEach((doc) => {
        const d = doc.data();
        if (!d || !d.id || !d.title) return; /* وثيقة ناقصة — تتجاهل بس ما تكسرش */
        courses.push(normalizeCourse(d, doc.id));
      });
      courses.sort((a, b) => a.order - b.order);

      const changed = JSON.stringify(courses.map(c => c.id + ':' + c.cashPrice)) !==
                      JSON.stringify(Catalog.courses.map(c => c.id + ':' + c.cashPrice));
      Catalog.courses = courses;
      Catalog.source = 'firestore';
      Catalog.error = null;
      rebuildIndexes();

      if (!readyFired) { fireReady(); return; }
      if (changed) {
        console.info('[CATALOG-LOADER] 🔄 كورسات اتحدّثت:', courses.length);
        fireUpdate('courses', courses.length);
      }
    }, (err) => { handleListenError('الكورسات', err); fireReady(); });

    db.collection('packages').onSnapshot((snap) => {
      const packages = [];
      snap.forEach((doc) => {
        const d = doc.data();
        if (!d || !d.id || !d.title) return;
        packages.push(normalizePackage(d, doc.id));
      });
      packages.sort((a, b) => a.order - b.order);

      Catalog.packages = packages;
      rebuildIndexes();

      if (!readyFired) { fireReady(); return; }
      console.info('[CATALOG-LOADER] 🔄 باقات اتحدّثت:', packages.length);
      fireUpdate('packages', packages.length);
    }, (err) => { handleListenError('الباقات', err); fireReady(); });

    Catalog._meta.listenersAttached = true;
  }

  /* ---------- الإقلاع ---------- */
  (async function init() {
    /* استنى Firebase SDK (بحد أقصى ~6 ثواني) */
    const start = Date.now();
    while (typeof firebase === 'undefined' && Date.now() - start < 6000) {
      await new Promise((r) => setTimeout(r, 100));
    }

    db = initFirebase();
    if (!db) {
      /* ✅ فاضي صادق — الصفحات هتعرض empty states بتاعتها */
      Catalog.ready = true;
      fireReady();
      console.warn('[CATALOG-LOADER] Firebase مش متاح — الكتالوج فاضي (مفيش أسعار وهمية ✅)');
      return;
    }

    /* كاش أوفلاين — أفضل جهد */
    try { await db.enablePersistence({ synchronizeTabs: true }); }
    catch { /* مش مدعوم أو فيه تاب تاني — عادي */ }

    try {
      startListeners();
    } catch (err) {
      console.error('[CATALOG-LOADER] فشل التشغيل:', err.message);
      Catalog.ready = true;
      fireReady();
    }
  })();

  /* ---------- API للتشخيص ---------- */
  window.NexoraCatalogLoader = {
    status() {
      const s = {
        ready: Catalog.ready,
        source: Catalog.source,
        error: Catalog.error,
        courses: Catalog.courses.length,
        packages: Catalog.packages.length,
        listenersAttached: Catalog._meta.listenersAttached,
        firstSnapshotAt: Catalog._meta.firstSnapshotAt
          ? new Date(Catalog._meta.firstSnapshotAt).toLocaleTimeString() : 'لسه',
        lastSnapshotAt: Catalog._meta.lastSnapshotAt
          ? new Date(Catalog._meta.lastSnapshotAt).toLocaleTimeString() : 'لسه'
      };
      console.table(s);
      return s;
    }
  };
})();