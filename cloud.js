/* ==========================================================
   cloud.js — v17
   المزامنة السحابية: الموارد + الاشتراكات
   ✅ v17: مفيش تعارض مع gate.js (Auth)
   ✅ v17: مفيش sign-in تلقائي لو فيه طالب مسجل
   ✅ v17: MCL.loadSubscriptions من gate.js مسؤول عن الاشتراكات
   ========================================================== */

'use strict';

(function () {
  console.log('%c MCL Cloud — v17 ', 'background:#2684fc;color:#fff;font-weight:bold');

  const firebaseConfig = window.__FIREBASE_CONFIG__ || {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };
  const OWNER_EMAIL = window.__OWNER_EMAIL__ || 'owner@gymzone.com';
  const OWNER_PASSWORD = window.__OWNER_PASSWORD__ || null;
  const RES_KEY = 'my-course-library:resources:v1';
  const SUBS_LOCAL_KEY = 'my-course-library:subs-local';

  if (!window.firebase) {
    console.error('[CLOUD] مكتبة Firebase مش محمّلة — راجع سطور السكربت في index.html');
    return;
  }

  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const resDoc = db.doc('library/main');
  const subsDoc = db.doc('config/subscriptions');

  const CloudSync = window.CloudSync = { authed: false, ready: false };

  const snap = (o) => JSON.stringify(o);
  let lastPushedRes = null;
  let lastPushedSubs = null;
  let authAttempted = false;
  let authRetryTimer = null;

  function toast(msg, type, duration) {
    if (typeof window.showToast === 'function') window.showToast(msg, type, { duration: duration || 5000 });
    else console.log('[CLOUD]', msg);
  }

  /* ---------- تنظيف الاشتراكات الواردة ---------- */
  function sanitizeSubs(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out = {};
    const normPhone = (window.MCL && MCL.normPhone)
      ? MCL.normPhone
      : (s) => String(s || '').replace(/\s+/g, '').trim();

    let invalidCount = 0;
    for (const [k, v] of Object.entries(raw)) {
      const p = normPhone(k);
      if (!/^01\d{9}$/.test(p)) { invalidCount++; continue; }
      if (v === 'all') { out[p] = 'all'; continue; }
      if (Array.isArray(v) && v.every((x) => typeof x === 'string' && x.trim())) { out[p] = v; continue; }
      invalidCount++;
    }
    if (invalidCount > 0) {
      console.warn('[CLOUD] اشتراكات غير صالحة تم تجاهلها:', invalidCount);
    }
    return out;
  }

  function applySubs(subs, source) {
    if (!window.MCL) return;
    Object.keys(MCL.subscriptions).forEach((k) => delete MCL.subscriptions[k]);
    Object.assign(MCL.subscriptions, subs);
    console.info('[CLOUD] الاشتراكات (' + source + '):', Object.keys(subs).length, 'مشترك');
    if (typeof MCL.emit === 'function') MCL.emit();
    if (typeof MCL.renderAll === 'function') MCL.renderAll();
  }

  /* ---------- ⚠️ مفيش تعريف MCL.loadSubscriptions هنا ----------
     gate.js مسؤول عن تعريف MCL.loadSubscriptions.
     cloud.js بس بيوفّر قراءة من السحابة كـ fallback. */

  /* ---------- الاستماع اللحظي (القراءة آمنة للجميع) ---------- */
  resDoc.onSnapshot((doc) => {
    if (!doc.exists) {
      console.info('[CLOUD] مفيش موارد منشورة على السحابة لسه');
      return;
    }
    const arr = doc.data().resources || [];
    const str = JSON.stringify(arr);
    if (str === lastPushedRes) return;
    try { localStorage.setItem(RES_KEY, str); } catch (e) { /* تجاهل */ }
    if (typeof window.__applyCloudResources === 'function') {
      window.__applyCloudResources(arr);
      console.info('[CLOUD] الموارد اتحدثت لحظيًا:', arr.length);
    }
  }, (err) => console.warn('[CLOUD] استماع الموارد:', err.code));

  subsDoc.onSnapshot((doc) => {
    if (!doc.exists) return;
    const subs = sanitizeSubs(doc.data().subscriptions);
    if (!subs) return;
    if (snap(subs) === lastPushedSubs) return;
    applySubs(subs, 'تحديث لحظي');
  }, (err) => console.warn('[CLOUD] استماع الاشتراكات:', err.code));

  /* ---------- مراقبة المالك ---------- */
  auth.onAuthStateChanged((user) => {
    const isOwner = !!user && user.email === OWNER_EMAIL;
    CloudSync.authed = isOwner;
    CloudSync.ready = true;

    if (isOwner) {
      console.info('[CLOUD] ✅ متصل بالسحابة كمالك — كل تعديلاتك بتنشر تلقائيًا');
      pushAll(true);
    } else if (user) {
      console.info('[CLOUD] مستخدم طالب متصل (' + user.email + ') — وضع القراءة فقط');
    } else {
      console.info('[CLOUD] مفيش مستخدم — وضع القراءة فقط');
    }
  });

  /* ---------- دخول المالك للسحابة (آمن) ---------- */
  function attemptOwnerSignIn() {
    if (CloudSync.authed || authAttempted) return;

    /* ⚠️ مهم: مفيش sign-in لو فيه مستخدم تاني مسجل */
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email !== OWNER_EMAIL) {
      console.info('[CLOUD] فيه مستخدم مسجل (' + currentUser.email + ') — مانع دخول المالك');
      return;
    }

    if (!OWNER_PASSWORD) {
      console.info('[CLOUD] مفيش OWNER_PASSWORD في config — النشر التلقائي معطّل.');
      return;
    }

    authAttempted = true;
    auth.signInWithEmailAndPassword(OWNER_EMAIL, OWNER_PASSWORD)
      .then(() => {
        console.info('[CLOUD] ✅ دخول المالك نجح');
      })
      .catch((e) => {
        console.warn('[CLOUD] فشل دخول السحابة:', e.code);
        if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') {
          toast('التعديلات هتشتغل محليًا بس مش هتنشر. افتح Firebase Console → Authentication → Users وتأكد إن فيه مستخدم ' +
                OWNER_EMAIL, 'warn', 12000);
        }
        if (authRetryTimer) clearTimeout(authRetryTimer);
        authRetryTimer = setTimeout(() => {
          authAttempted = false;
          if (window.MCL && typeof MCL.isAdminActive === 'function' && MCL.isAdminActive()) {
            attemptOwnerSignIn();
          }
        }, 30000);
      });
  }

  /* ---------- مراقبة حالة المالك ---------- */
  let lastAdminState = false;
  function checkAdminState() {
    /* ⚠️ متعملش sign-in لو فيه مستخدم مسجل */
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email !== OWNER_EMAIL) {
      return;
    }

    const isAdmin = !!(window.MCL && typeof MCL.isAdminActive === 'function' && MCL.isAdminActive());
    if (isAdmin && !lastAdminState) {
      attemptOwnerSignIn();
    }
    lastAdminState = isAdmin;
  }

  function observeAdminChip() {
    const chip = document.querySelector('#adminChip');
    if (!chip) {
      setInterval(checkAdminState, 5000);
      return;
    }
    const observer = new MutationObserver(checkAdminState);
    observer.observe(chip, { attributes: true, attributeFilter: ['class'] });
    checkAdminState();
  }

  /* ---------- النشر (للمالك فقط) ---------- */
  function pushAll(force) {
    if (!CloudSync.authed) return;
    try {
      const resStr = localStorage.getItem(RES_KEY);
      if (resStr && (force || resStr !== lastPushedRes)) {
        const arr = JSON.parse(resStr);
        lastPushedRes = resStr;
        resDoc.set({ resources: arr, updatedAt: new Date().toISOString() })
          .then(() => console.info('[CLOUD] ☁️ نُشرت الموارد:', arr.length))
          .catch((err) => { lastPushedRes = null; toast('فشل نشر الموارد: ' + err.code, 'error'); });
      }
      if (window.MCL && MCL.subscriptions) {
        const subsStr = snap(MCL.subscriptions);
        if (force || subsStr !== lastPushedSubs) {
          lastPushedSubs = subsStr;
          subsDoc.set({ subscriptions: JSON.parse(subsStr), updatedAt: new Date().toISOString() })
            .then(() => console.info('[CLOUD] ☁️ نُشرت الاشتراكات'))
            .catch((err) => { lastPushedSubs = null; toast('فشل نشر الاشتراكات: ' + err.code, 'error'); });
        }
      }
    } catch (e) { console.warn('[CLOUD] push:', e); }
  }

  /* ---------- النشر عند تغيّر البيانات ---------- */
  const ORIGINAL_SET_ITEM = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    ORIGINAL_SET_ITEM.call(this, key, value);
    if (CloudSync.authed && (key === RES_KEY || key === SUBS_LOCAL_KEY)) {
      clearTimeout(window.__cloudPushTimer);
      window.__cloudPushTimer = setTimeout(() => pushAll(false), 800);
    }
  };

  if (window.MCL && typeof MCL.on !== 'function') {
    MCL.on = (fn) => { MCL._onPush = fn; };
  }

  /* ---------- الإقلاع ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observeAdminChip();
      setTimeout(checkAdminState, 1000);
    }, { once: true });
  } else {
    observeAdminChip();
    setTimeout(checkAdminState, 1000);
  }
})();