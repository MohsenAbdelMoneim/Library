/* ==========================================================
   cloud.js — v15.1
   المزامنة السحابية: الكورسات والاشتراكات على Firestore
   القراءة للجميع — النشر للمالك فقط (owner@gymzone.com)
   ========================================================== */

'use strict';

(function () {
  console.log('%c MCL Cloud — v15.1 ', 'background:#2684fc;color:#fff;font-weight:bold');

  const firebaseConfig = {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };
  const OWNER_EMAIL = 'owner@gymzone.com';
  const RES_KEY = 'my-course-library:resources:v1';

  if (!window.firebase) {
    console.error('[CLOUD] مكتبة Firebase مش محمّلة — راجع سطور السكربت في index.html');
    return;
  }

  /* تهيئة آمنة — catalog/student/roadmap/auth ممكن يبدأوا قبله أو بعده */
  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const resDoc = db.doc('library/main');
  const subsDoc = db.doc('config/subscriptions');

  const CloudSync = window.CloudSync = { authed: false };

  const snap = (o) => JSON.stringify(o);
  let lastPushedRes = null;
  let lastPushedSubs = null;
  let authAttempted = false;

  function toast(msg, type, duration) {
    if (typeof window.showToast === 'function') window.showToast(msg, type, { duration: duration || 5000 });
    else console.log('[CLOUD]', msg);
  }

  /* ---------- تنظيف الاشتراكات الواردة ---------- */
  function sanitizeSubs(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out = {};
    const normPhone = (window.MCL && MCL.normPhone) ? MCL.normPhone : (s) => String(s).replace(/\s+/g, '').trim();
    for (const [k, v] of Object.entries(raw)) {
      const p = normPhone(k);
      if (!/^01\d{9}$/.test(p)) return null;
      if (v === 'all') { out[p] = 'all'; continue; }
      if (Array.isArray(v) && v.every((x) => typeof x === 'string' && x.trim())) { out[p] = v; continue; }
      return null;
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

  /* محمّل الاشتراكات: يقرا من السحابة بدل الملف */
  if (window.MCL) {
    MCL.loadSubscriptions = async function () {
      try {
        const doc = await subsDoc.get();
        if (doc.exists) {
          const subs = sanitizeSubs(doc.data().subscriptions);
          if (subs) { applySubs(subs, 'من السحابة'); return; }
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
    if (str === lastPushedRes) return; /* صدى لتعديلنا بنفسنا — تجاهل */
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
     onAuthStateChanged بيرن لكل مستخدم (طلاب كمان!) —
     فبنتحقق أن المستخدم هو المالك بالإيميل قبل اعتباره قادرًا على النشر.
     الطالب العادي: authed = false → مفيش push خالص من جهازه. */
  auth.onAuthStateChanged((user) => {
    const isOwner = !!user && user.email === OWNER_EMAIL;
    CloudSync.authed = isOwner;
    if (isOwner) {
      console.info('[CLOUD] ✅ متصل بالسحابة كمالك — كل تعديلاتك بتنشر تلقائيًا');
      pushAll(true);
    } else if (user) {
      /* مستخدم مسجّل لكنه مش المالك (طالب) — قراية بس */
      console.info('[CLOUD] مستخدم طالب متصل — وضع القراءة فقط (مفيش نشر)');
    }
  });

  setInterval(() => {
    if (authAttempted || CloudSync.authed) return;
    if (!(window.MCL && typeof MCL.isAdminActive === 'function' && MCL.isAdminActive())) return;
    authAttempted = true;
    auth.signInWithEmailAndPassword(OWNER_EMAIL, MCL.ADMIN_PASSWORD)
      .catch((e) => {
        console.warn('[CLOUD] فشل دخول السحابة:', e.code);
        if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') {
          toast('التعديلات هتشتغل محليًا بس مش هتنشر. افتح Firebase Console → Authentication → Users وتأكد إن فيه مستخدم owner@gymzone.com والباسورد بتاعه 01096295395mo بالظبط.', 'warn', 12000);
        }
        setTimeout(() => { authAttempted = false; }, 30000);
      });
  }, 2000);

  /* ---------- النشر التلقائي (للمالك فقط — مضمون بالتحقق فوق + Rules) ---------- */
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

  setInterval(() => {
    if (!(window.MCL && typeof MCL.isAdminActive === 'function' && MCL.isAdminActive())) return;
    if (!CloudSync.authed) return;
    pushAll(false);
  }, 2500);
})();