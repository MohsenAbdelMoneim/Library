/* ==========================================================
   cloud.js — v19
   إصلاح: "بسجل العميل مش بيتسجل على السحابة"
   ✅ v19: Outbox — أي تعديل وأنت مش مسجل كمالك بيتأجل ويتبعت أول ما تدخل
   ✅ v19: Poll كل 2.5ث بيلقط أي تغيير حتى لو مفتاح localStorage مختلف
   ✅ v19: منع الـWipe — مفيش push فاضي يمسح بيانات السحابة الموجودة
   ✅ v19: إعادة محاولة دخول المالك تلقائيًا بعد خروج الطالب
   ✅ v19: فلتر echo أدق — مقارنة محتوى بدل مؤقّت زمني (5 ثواني)
   ✅ v19: CloudSync.status() + CloudSync.pushNow() للتشخيص والدفن اليدوي
   ========================================================== */

'use strict';

(function () {
  console.log('%c MCL Cloud — v19 ', 'background:#2684fc;color:#fff;font-weight:bold');

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

  const snap = (o) => JSON.stringify(o);
  const isAppAdmin = () => !!(window.MCL && typeof MCL.isAdminActive === 'function' && MCL.isAdminActive());

  const CloudSync = window.CloudSync = {
    authed: false,
    ready: false,
    lastLocalSubsWrite: 0,
    lastPushTime: 0,
    justPushedSubs: false,
    /* ✅ v19 */
    pendingSubs: false,    /* في تعديلات مستنياين الدخول */
    pendingRes: false,
    lastError: '',
    lastAuthBlock: '',     /* آخر سبب منع للدخول */

    /* ✅ v19: تشخيص فوري — افتح Console واكتب CloudSync.status() */
    status() {
      const s = {
        authed: this.authed,
        ready: this.ready,
        ownerEmail: OWNER_EMAIL,
        hasPassword: !!OWNER_PASSWORD,
        lastError: this.lastError,
        lastAuthBlock: this.lastAuthBlock,
        pendingSubs: this.pendingSubs,
        pendingRes: this.pendingRes,
        appAdmin: isAppAdmin(),
        currentUser: auth.currentUser ? auth.currentUser.email : '(مفيش)',
        subsCount: (window.MCL && MCL.subscriptions) ? Object.keys(MCL.subscriptions).length : 0,
        lastPushTime: this.lastPushTime ? new Date(this.lastPushTime).toLocaleTimeString() : 'لسه'
      };
      console.table(s);
      return s;
    },

    /* ✅ v19: دفع يدوي */
    pushNow() { pushAll(true); }
  };

  let lastPushedRes = null;
  let lastPushedSubs = null;
  let lastCloudSubs = null;   /* آخر نسخة وصلت من السحابة */
  let lastCloudRes = null;
  let authAttempted = false;
  let authRetryTimer = null;
  let warnedReadOnly = false;

  function toast(msg, type, duration) {
    if (typeof window.showToast === 'function') window.showToast(msg, type, { duration: duration || 5000 });
    else console.log('[CLOUD]', msg);
  }

  /* ✅ v19: تسجيل تعديل مستني الدخول (Outbox) */
  function markPending(kind) {
    if (CloudSync.authed) return;
    if (kind === 'subs') CloudSync.pendingSubs = true;
    if (kind === 'res') CloudSync.pendingRes = true;
    console.warn('[CLOUD] 📤 التعديل اتحفظ محليًا — هيتبعت للسحابة أول ما تسجل بحساب المالك (' + OWNER_EMAIL + ')');
    if (isAppAdmin() && !warnedReadOnly) {
      warnedReadOnly = true;
      toast('أنت مش مسجل كمالك — التعديل محفوظ محليًا وهيتبعت للسحابة بعد تسجيل الدخول', 'warn', 8000);
    }
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

    const isOwner = !!CloudSync.authed;
    const now = Date.now();
    const lastLocalWrite = CloudSync.lastLocalSubsWrite || 0;
    const recentlyWritten = (now - lastLocalWrite) < 3000;

    if (isOwner && recentlyWritten) {
      console.info('[CLOUD] ⏸️ تجاهل تحديث لحظي — فيه تعديل محلي جديد (خلال 3 ثواني)');
      return;
    }

    /* دمج بدل استبدال */
    const local = { ...MCL.subscriptions };
const merged = CloudSync.authed ? { ...subs, ...local } : subs;
    if (isOwner) {
      const localOnly = Object.keys(local).filter((k) => !(k in subs));
      const cloudOnly = Object.keys(subs).filter((k) => !(k in local));
      if (localOnly.length > 0) console.info('[CLOUD] 🛡️', localOnly.length, 'رقم محلي مش على السحابة — محتفظ بيه');
      if (cloudOnly.length > 0) console.info('[CLOUD] 📥', cloudOnly.length, 'رقم جديد من السحابة');
    }

    Object.keys(MCL.subscriptions).forEach((k) => delete MCL.subscriptions[k]);
    Object.assign(MCL.subscriptions, merged);

    console.info('[CLOUD] الاشتراكات (' + source + '):', Object.keys(merged).length, 'مشترك');
    if (typeof MCL.emit === 'function') MCL.emit();
    if (typeof MCL.renderAll === 'function') MCL.renderAll();
  }

  /* ---------- الاستماع اللحظي: الموارد ---------- */
  resDoc.onSnapshot((doc) => {
    if (!doc.exists) return;
    const arr = doc.data().resources || [];
    lastCloudRes = JSON.stringify(arr);   /* ✅ v19 */
    const str = JSON.stringify(arr);
    if (str === lastPushedRes) return;
    try { localStorage.setItem(RES_KEY, str); } catch (e) { /* تجاهل */ }
    if (typeof window.__applyCloudResources === 'function') {
      window.__applyCloudResources(arr);
      console.info('[CLOUD] الموارد اتحدثت لحظيًا:', arr.length);
    }
  }, (err) => console.warn('[CLOUD] استماع الموارد:', err.code));

  /* ✅ v19: echo filter بالمقارنة الفعلية بدل المؤقّت الزمني */
  subsDoc.onSnapshot((doc) => {
    if (!doc.exists) return;
    const subs = sanitizeSubs(doc.data().subscriptions);
    if (!subs) return;

    lastCloudSubs = snap(subs);

    /* ده صدى لـpush بتاعنا — تجاهل */
    if (lastCloudSubs === lastPushedSubs) return;

    /* وصل تحديث حقيقي (حتى لو داخل نافذة justPushed — يعني جهاز تاني) */
    console.info('[CLOUD] 📥 snapshot جديد:', Object.keys(subs).length, 'مشترك');
    applySubs(subs, 'تحديث لحظي');
  }, (err) => console.warn('[CLOUD] استماع الاشتراكات:', err.code));

  /* ---------- مراقبة المالك ---------- */
  auth.onAuthStateChanged((user) => {
    const isOwner = !!user && user.email === OWNER_EMAIL;
    CloudSync.authed = isOwner;
    CloudSync.ready = true;

    if (isOwner) {
      CloudSync.lastAuthBlock = '';
      warnedReadOnly = false;
      console.info('[CLOUD] ✅ متصل كمالك — هنفّض التعديلات المستنية');
      /* ✅ v19: نستنى MCL يحمّل بياناته الأول عشان مانعملش push فاضي يمسح السحابة */
      flushWhenMCLReady();
    } else if (user) {
      CloudSync.lastAuthBlock = 'طالب مسجل: ' + user.email;
      console.info('[CLOUD] مستخدم طالب متصل (' + user.email + ') — وضع القراءة فقط');
    } else {
      /* ✅ v19: خروج → نسمح بإعادة محاولة دخول المالك */
      authAttempted = false;
      CloudSync.lastAuthBlock = 'مفيش مستخدم';
      console.info('[CLOUD] مفيش مستخدم — وضع القراءة فقط');
      /* لو الأدمن فاضل مفعّل، نجرب نرجّع دخول المالك */
      setTimeout(checkAdminState, 1500);
    }
  });

  /* ✅ v19: نستنى MCL يجهز قبل أول push — دي أهم حاجة منعت الـWipe */
  function flushWhenMCLReady(attempt = 0) {
    if (window.MCL && MCL.subscriptions) {
      pushAll(true);
      return;
    }
    if (attempt > 20) { console.warn('[CLOUD] MCL مظهرش خلال 6 ثواني — بنضغط على أي حال'); pushAll(true); return; }
    setTimeout(() => flushWhenMCLReady(attempt + 1), 300);
  }

  /* ---------- دخول المالك للسحابة ---------- */
  function attemptOwnerSignIn() {
    if (CloudSync.authed || authAttempted) return;

    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email !== OWNER_EMAIL) {
      CloudSync.lastAuthBlock = 'طالب مسجل يمنع دخول المالك: ' + currentUser.email;
      console.info('[CLOUD] فيه مستخدم مسجل (' + currentUser.email + ') — مانع دخول المالك. اعمل logout وهنجرب تاني');
      return;
    }

    if (!OWNER_PASSWORD) {
      CloudSync.lastAuthBlock = 'مفيش OWNER_PASSWORD في config';
      console.warn('[CLOUD] ⚠️ مفيش window.__OWNER_PASSWORD__ — الدخول التلقائي معطّل. ' +
        'سجّل دخول يدوي بـ' + OWNER_EMAIL + ' من صفحة تسجيل الدخول، أو ضيف الباسورد في الـconfig');
      return;
    }

    authAttempted = true;
    auth.signInWithEmailAndPassword(OWNER_EMAIL, OWNER_PASSWORD)
      .then(() => console.info('[CLOUD] ✅ دخول المالك نجح'))
      .catch((e) => {
        CloudSync.lastError = e.code;
        console.warn('[CLOUD] فشل دخول السحابة:', e.code);
        if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found') {
          toast('التعديلات هتشتغل محليًا بس مش هتنشر. افتح Firebase Console → Authentication وتأكد من مستخدم ' +
                OWNER_EMAIL, 'warn', 12000);
        }
        if (authRetryTimer) clearTimeout(authRetryTimer);
        authRetryTimer = setTimeout(() => {
          authAttempted = false;
          if (isAppAdmin()) attemptOwnerSignIn();
        }, 30000);
      });
  }

  /* ---------- مراقبة حالة المالك ---------- */
  let lastAdminState = false;
  function checkAdminState() {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email !== OWNER_EMAIL) return;

    const isAdmin = isAppAdmin();
    if (isAdmin && !lastAdminState) attemptOwnerSignIn();
    lastAdminState = isAdmin;
  }

  function observeAdminChip() {
    /* ✅ v19: الـinterval دايمًا شغال (مش بديل للـobserver) + observer لو الشيب موجود */
    setInterval(checkAdminState, 5000);
    const chip = document.querySelector('#adminChip');
    if (chip) {
      const observer = new MutationObserver(checkAdminState);
      observer.observe(chip, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    }
    checkAdminState();
  }

  /* ✅ v19: pushAll مع Outbox + حماية Wipe */
  function pushAll(force) {
    if (!CloudSync.authed) {
      markPending('subs');
      markPending('res');
      return;
    }
    try {
      /* نشر الموارد */
      const resStr = localStorage.getItem(RES_KEY);
      if (resStr && (force || resStr !== lastPushedRes)) {
        const arr = JSON.parse(resStr);
        /* ✅ حماية: منع مسح موارد موجودة على السحابة بنسخة فاضية */
        if (arr.length === 0 && lastCloudRes && lastCloudRes !== '[]') {
          console.warn('[CLOUD] 🛑 تجاهل push موارد فاضي — السحابة فيها', JSON.parse(lastCloudRes).length, 'مورد. لو عايز تمسحهم فعلًا: CloudSync.forceWipeResources()');
        } else {
          lastPushedRes = resStr;
          resDoc.set({ resources: arr, updatedAt: new Date().toISOString() })
            .then(() => { CloudSync.pendingRes = false; console.info('[CLOUD] ☁️ نُشرت الموارد:', arr.length); })
            .catch((err) => {
              lastPushedRes = null;
              CloudSync.lastError = err.code;
              toast('فشل نشر الموارد: ' + err.code, 'error');
            });
        }
      }

      /* نشر الاشتراكات */
      if (window.MCL && MCL.subscriptions) {
        const subsStr = snap(MCL.subscriptions);
        if (force || subsStr !== lastPushedSubs) {
          /* ✅ حماية Wipe — أهم إصلاح: منع مسح اشتراكات السحابة بنسخة فاضية */
          if (subsStr === '{}' && lastCloudSubs && lastCloudSubs !== '{}') {
            console.warn('[CLOUD] 🛑 تجاهل push فاضي — السحابة فيها',
              Object.keys(JSON.parse(lastCloudSubs)).length,
              'مشترك. لو فعلًا عايز تمسح الكل: CloudSync.forceWipeSubs()');
            return;
          }
          lastPushedSubs = subsStr;
          CloudSync.lastPushTime = Date.now();
          CloudSync.justPushedSubs = true;
          setTimeout(() => { CloudSync.justPushedSubs = false; }, 5000);

          subsDoc.set({
            subscriptions: JSON.parse(subsStr),
            updatedAt: new Date().toISOString()
          })
            .then(() => {
              CloudSync.pendingSubs = false;
              console.info('[CLOUD] ☁️ نُشرت الاشتراكات:', Object.keys(JSON.parse(subsStr)).length, 'مشترك');
            })
            .catch((err) => {
              lastPushedSubs = null;
              CloudSync.justPushedSubs = false;
              CloudSync.lastError = err.code;
              if (err.code === 'permission-denied') {
                toast('السحابة رفضت الكتابة — راجع Firestore Rules على config/subscriptions', 'error', 10000);
              } else {
                toast('فشل نشر الاشتراكات: ' + err.code, 'error');
              }
            });
        }
      }
    } catch (e) { console.warn('[CLOUD] push:', e); }
  }

  /* ✅ v19: مسح مقصود لما تكون عايزه فعلًا */
  CloudSync.forceWipeSubs = () => {
    lastCloudSubs = null;
    if (window.MCL) MCL.subscriptions = {};
    pushAll(true);
  };
  CloudSync.forceWipeResources = () => {
    lastCloudRes = null;
    try { localStorage.setItem(RES_KEY, '[]'); } catch {}
    pushAll(true);
  };

  /* ---------- setItem hook (استجابة فورية) ---------- */
  const ORIGINAL_SET_ITEM = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    ORIGINAL_SET_ITEM.call(this, key, value);

    if (key === SUBS_LOCAL_KEY) {
      CloudSync.lastLocalSubsWrite = Date.now();
    }

    /* ✅ v19: بيلقط أي مفتاح فيه "subs" — مش المفتاح المعروف بس */
    const isSubsKey = key === SUBS_LOCAL_KEY || /subs/i.test(String(key));
    const isResKey = key === RES_KEY;

    if (isSubsKey || isResKey) {
      if (!CloudSync.authed) {
        markPending(isResKey ? 'res' : 'subs');
        return;
      }
      clearTimeout(window.__cloudPushTimer);
      window.__cloudPushTimer = setTimeout(() => pushAll(false), 300);
    }
  };

  /* ✅ v19: Poll احتياطي — بيلقط أي تغيير حتى لو المفتاح مختلف خالص
     (ده اللي بيضمن إن تسجيل العميل عمره ما يضيع بصمت) */
  let lastSeenSubs = null;
  setInterval(() => {
    if (!window.MCL || !MCL.subscriptions || typeof MCL.subscriptions !== 'object') return;
    const s = snap(MCL.subscriptions);
    if (lastSeenSubs === null) { lastSeenSubs = s; return; }
    if (s !== lastSeenSubs) {
      lastSeenSubs = s;
      console.info('[CLOUD] 🔄 Poll لقى تغيير محلي في الاشتراكات');
      if (!CloudSync.authed) { markPending('subs'); return; }
      clearTimeout(window.__cloudPushTimer);
      window.__cloudPushTimer = setTimeout(() => pushAll(false), 300);
    }
  }, 2500);

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