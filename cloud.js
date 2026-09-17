/* ==========================================================
   cloud.js — v16
   المزامنة السحابية: الكورسات + الاشتراكات على Firestore
   القراءة للجميع — النشر للمالك فقط (owner@gymzone.com)
   ✅ النشر لحظي عند أي تغيير (كورسات أو اشتراكات) بدون polling
   ========================================================== */

'use strict';

(function () {
  console.log('%c MCL Cloud — v16 ', 'background:#2684fc;color:#fff;font-weight:bold');

  /* المفاتيح تيجي من config.js (بفولباك للقيم المباشرة لو config مش محمّل) */
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

  /* تهيئة آمنة — باقي الملفات ممكن تكون مهيئة قبله */
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

  /* ---------- تنظيف الاشتراكات الواردة (متسامح — يتجاهل الخاطئ مش يرفض الكل) ---------- */
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

  /* ---------- محمّل الاشتراكات: السحابة أولًا ثم الملف الاحتياطي ---------- */
  if (window.MCL) {
    MCL.loadSubscriptions = async function () {
      try {
        const doc = await subsDoc.get();
        if (doc.exists) {
          const subs = sanitizeSubs(doc.data().subscriptions);
          if (subs && Object.keys(subs).length > 0) {
            applySubs(subs, 'من السحابة');
            return;
          }
        }
        console.info('[CLOUD] السحابة فاضية من الاشتراكات — محاولة الملف الاحتياطي');
      } catch (e) {
        console.warn('[CLOUD] قراءة الاشتراكات من السحابة فشلت (' + e.code + ') — محاولة الملف الاحتياطي');
      }
      try {
        const r = await fetch('subscriptions.json?t=' + Date.now(), { cache: 'no-store' });
        if (r.ok) {
          const d = await r.json();
          const subs = sanitizeSubs(d && d.subscriptions);
          if (subs) applySubs(subs, 'من الملف الاحتياطي');
        }
      } catch (e) { /* تجاهل */ }
    };
  }

  /* ---------- الاستماع اللحظي (القراءة آمنة للجميع) ---------- */
  resDoc.onSnapshot((doc) => {
    if (!doc.exists) {
      console.info('[CLOUD] مفيش كورسات منشورة على السحابة لسه — أول دخول للمالك هينشرها تلقائيًا');
      return;
    }
    const arr = doc.data().resources || [];
    const str = JSON.stringify(arr);
    if (str === lastPushedRes) return; /* صدى — تجاهل */
    try { localStorage.setItem(RES_KEY, str); } catch (e) { /* تجاهل */ }
    if (typeof window.__applyCloudResources === 'function') {
      window.__applyCloudResources(arr);
      console.info('[CLOUD] الكورسات اتحدثت لحظيًا:', arr.length);
    }
  }, (err) => console.warn('[CLOUD] استماع الكورسات:', err.code));

  subsDoc.onSnapshot((doc) => {
    if (!doc.exists) return;
    const subs = sanitizeSubs(doc.data().subscriptions);
    if (!subs) return;
    if (snap(subs) === lastPushedSubs) return;
    applySubs(subs, 'تحديث لحظي');
  }, (err) => console.warn('[CLOUD] استماع الاشتراكات:', err.code));

  /* ---------- 🛡️ نقطة الحماية الحرجة ----------
     onAuthStateChanged بيشتغل لكل مستخدم (طلاب كمان) —
     بنتحقق أن المستخدم هو المالك بالإيميل قبل اعتباره قادرًا على النشر. */
  auth.onAuthStateChanged((user) => {
    const isOwner = !!user && user.email === OWNER_EMAIL;
    CloudSync.authed = isOwner;
    CloudSync.ready = true;

    if (isOwner) {
      console.info('[CLOUD] ✅ متصل بالسحابة كمالك — كل تعديلاتك بتنشر تلقائيًا');
      pushAll(true);
    } else if (user) {
      console.info('[CLOUD] مستخدم طالب متصل — وضع القراءة فقط (مفيش نشر)');
    } else {
      console.info('[CLOUD] مفيش مستخدم — وضع القراءة فقط');
    }
  });

  /* ---------- دخول المالك للسحابة (مرة واحدة + retry واحد بعد 30 ثانية) ---------- */
  function attemptOwnerSignIn() {
    if (CloudSync.authed || authAttempted) return;
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

  /* ---------- مراقبة حالة المالك (MutationObserver بدل polling) ---------- */
  let lastAdminState = false;
  function checkAdminState() {
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
          .then(() => console.info('[CLOUD] ☁️ نُشرت الكورسات:', arr.length))
          .catch((err) => { lastPushedRes = null; toast('فشل نشر الكورسات: ' + err.code, 'error'); });
      }
      if (window.MCL) {
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

  /* ---------- 🔔 النشر عند تغيّر البيانات (بدون polling) ----------
     نراقب مفتاحين في localStorage عبر Storage.prototype:
     • RES_KEY        → الكورسات (app.js بيكتبها)
     • SUBS_LOCAL_KEY → الاشتراكات (gate.js بيكتبها)
     أي إضافة/تعديل/حذف مشترك → يتنشر خلال أقل من ثانية. */
  const ORIGINAL_SET_ITEM = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    ORIGINAL_SET_ITEM.call(this, key, value);
    if (CloudSync.authed && (key === RES_KEY || key === SUBS_LOCAL_KEY)) {
      clearTimeout(window.__cloudPushTimer);
      window.__cloudPushTimer = setTimeout(() => pushAll(false), 800);
    }
  };

  /* MCL.on مش معرّف في gate.js — نعرّفه هنا احتياطيًا */
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