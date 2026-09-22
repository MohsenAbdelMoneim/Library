/* ==========================================================
   cloud.js — v18
   المزامنة السحابية: الموارد + الاشتراكات
   ✅ v18: إصلاح Race Condition — الرقم مبيختفيش بعد الإضافة
   ✅ v18: حماية من Overwrite للتعديلات المحلية الحديثة
   ✅ v18: دمج بدل استبدال + علامة justPushed
   ✅ v18: 300ms بدل 800ms للـpush
   ✅ v17: مفيش تعارض مع gate.js (Auth)
   ✅ v17: مفيش sign-in تلقائي لو فيه طالب مسجل
   ========================================================== */

'use strict';

(function () {
  console.log('%c MCL Cloud — v18 ', 'background:#2684fc;color:#fff;font-weight:bold');

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

  const CloudSync = window.CloudSync = {
    authed: false,
    ready: false,
    lastLocalSubsWrite: 0,   /* وقت آخر كتابة محلية للاشتراكات */
    lastPushTime: 0,         /* وقت آخر push للسحابة */
    justPushedSubs: false    /* علامة: إحنا اللي دفعنا snapshot */
  };

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

  /* ✅ v18: حماية من Overwrite + دمج بدل استبدال */
  function applySubs(subs, source) {
    if (!window.MCL) return;

    const isOwner = !!CloudSync.authed;
    const now = Date.now();
    const lastLocalWrite = CloudSync.lastLocalSubsWrite || 0;
    const recentlyWritten = (now - lastLocalWrite) < 3000; /* 3 ثواني */

    /* ✅ حماية 1: تجاهل التحديث اللحظي لو فيه تعديل محلي حديث */
    if (isOwner && recentlyWritten) {
      console.info('[CLOUD] ⏸️ تجاهل تحديث لحظي — فيه تعديل محلي جديد (خلال 3 ثواني)');
      return;
    }

    /* ✅ حماية 2: دمج بدل استبدال — أي رقم محلي محفوظ */
    const local = { ...MCL.subscriptions };
    const merged = { ...subs, ...local };

    /* ✅ تسجيل الفروقات في Console */
    if (isOwner) {
      const localKeys = Object.keys(local);
      const cloudKeys = Object.keys(subs);
      const localOnly = localKeys.filter((k) => !(k in subs));
      const cloudOnly = cloudKeys.filter((k) => !(k in local));
      if (localOnly.length > 0) {
        console.info('[CLOUD] 🛡️', localOnly.length, 'رقم محلي مش على السحابة — محتفظ بيه');
      }
      if (cloudOnly.length > 0) {
        console.info('[CLOUD] 📥', cloudOnly.length, 'رقم جديد من السحابة');
      }
    }

    /* نطبّق النسخة المدمجة */
    Object.keys(MCL.subscriptions).forEach((k) => delete MCL.subscriptions[k]);
    Object.assign(MCL.subscriptions, merged);

    console.info('[CLOUD] الاشتراكات (' + source + '):', Object.keys(merged).length, 'مشترك');
    if (typeof MCL.emit === 'function') MCL.emit();
    if (typeof MCL.renderAll === 'function') MCL.renderAll();
  }

  /* ---------- الاستماع اللحظي: الموارد ---------- */
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

  /* ✅ v18: onSnapshot الاشتراكات مع حماية أقوى */
  subsDoc.onSnapshot((doc) => {
    if (!doc.exists) return;

    /* ✅ حماية 1: علامة justPushed — إحنا اللي دفعنا النسخة دي */
    if (CloudSync.justPushedSubs) {
      console.info('[CLOUD] ⏭️ تجاهل snapshot — إحنا اللي دفعناها');
      return;
    }

    const subs = sanitizeSubs(doc.data().subscriptions);
    if (!subs) return;

    /* ✅ حماية 2: لو مفيش تغيير فعلي */
    if (snap(subs) === lastPushedSubs) {
      console.info('[CLOUD] ⏭️ snapshot مطابق — تجاهل');
      return;
    }

    console.info('[CLOUD] 📥 snapshot جديد:', Object.keys(subs).length, 'مشترك');
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

  /* ---------- دخول المالك للسحابة ---------- */
  function attemptOwnerSignIn() {
    if (CloudSync.authed || authAttempted) return;

    /* ⚠️ مفيش sign-in لو فيه مستخدم تاني مسجل */
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
    if (currentUser && currentUser.email !== OWNER_EMAIL) return;

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

  /* ✅ v18: pushAll مع علامة justPushed */
  function pushAll(force) {
    if (!CloudSync.authed) return;
    try {
      /* نشر الموارد */
      const resStr = localStorage.getItem(RES_KEY);
      if (resStr && (force || resStr !== lastPushedRes)) {
        const arr = JSON.parse(resStr);
        lastPushedRes = resStr;
        resDoc.set({ resources: arr, updatedAt: new Date().toISOString() })
          .then(() => console.info('[CLOUD] ☁️ نُشرت الموارد:', arr.length))
          .catch((err) => {
            lastPushedRes = null;
            toast('فشل نشر الموارد: ' + err.code, 'error');
          });
      }

      /* نشر الاشتراكات */
      if (window.MCL && MCL.subscriptions) {
        const subsStr = snap(MCL.subscriptions);
        if (force || subsStr !== lastPushedSubs) {
          lastPushedSubs = subsStr;
          CloudSync.lastPushTime = Date.now();

          /* ✅ علامة justPushed لمدة 5 ثواني */
          CloudSync.justPushedSubs = true;
          setTimeout(() => { CloudSync.justPushedSubs = false; }, 5000);

          subsDoc.set({
            subscriptions: JSON.parse(subsStr),
            updatedAt: new Date().toISOString()
          })
            .then(() => console.info('[CLOUD] ☁️ نُشرت الاشتراكات:',
              Object.keys(JSON.parse(subsStr)).length, 'مشترك'))
            .catch((err) => {
              lastPushedSubs = null;
              CloudSync.justPushedSubs = false;
              toast('فشل نشر الاشتراكات: ' + err.code, 'error');
            });
        }
      }
    } catch (e) { console.warn('[CLOUD] push:', e); }
  }

  /* ✅ v18: setItem مع تتبع الوقت + 300ms */
  const ORIGINAL_SET_ITEM = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    ORIGINAL_SET_ITEM.call(this, key, value);

    /* تتبع وقت آخر كتابة محلية للاشتراكات */
    if (key === SUBS_LOCAL_KEY) {
      CloudSync.lastLocalSubsWrite = Date.now();
    }

    if (CloudSync.authed && (key === RES_KEY || key === SUBS_LOCAL_KEY)) {
      clearTimeout(window.__cloudPushTimer);
      window.__cloudPushTimer = setTimeout(() => pushAll(false), 300); /* ✅ 300ms بدل 800ms */
    }
  };

  /* ---------- توافق مع MCL.on ---------- */
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