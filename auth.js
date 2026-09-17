/* ==========================================================
   auth.js — v16
   حسابات الطلاب: تسجيل بدليل رقم الموبايل + دخول + استرجاع
   ✅ v16: التحويل بعد الدخول على library.html
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Auth — v16 ', 'background:#7c5cff;color:#fff;font-weight:bold');

  const firebaseConfig = window.__FIREBASE_CONFIG__ || {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };

  if (typeof firebase === 'undefined') {
    console.error('[AUTH] Firebase SDK مش محمّل — تأكد من السكريبتات في HTML.');
    return;
  }

  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];

  function on(sel, evt, fn) {
    const el = qs(sel);
    if (el) el.addEventListener(evt, fn);
    else console.warn('[AUTH][WIRE] عنصر غير موجود:', sel);
    return el;
  }

  const normPhone = (s) => {
    let v = String(s || '')
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
      .replace(/\s+/g, '')
      .replace(/^\+?20/, '');
    if (v.length === 10 && v.startsWith('1')) v = '0' + v;
    return v;
  };
  const isEgyptPhone = (v) => /^01\d{9}$/.test(v);
  const phoneToEmail = (p) => p + '@students.nexora.local';

  const ERRORS_AR = {
    'auth/invalid-credential': 'الرقم أو كلمة المرور غير صحيحة.',
    'auth/wrong-password': 'كلمة المرور غير صحيحة.',
    'auth/user-not-found': 'مفيش حساب بالرقم ده — أنشئ حساب جديد.',
    'auth/email-already-in-use': 'الرقم ده مسجّل بالفعل — سجّل دخول.',
    'auth/weak-password': 'كلمة المرور ضعيفة — 6 أحرف على الأقل.',
    'auth/too-many-requests': 'محاولات كتير — استنى دقيقة وجرب تاني.',
    'auth/network-request-failed': 'مشكلة اتصال — اتأكد من النت.'
  };
  const errAr = (code) => ERRORS_AR[code] || 'حصل خطأ غير متوقع — جرب تاني.';

  /* ✅ التحويل على library.html */
  let redirecting = false;
  function goToApp() {
    if (redirecting) return;
    redirecting = true;
    try {
      location.replace('library.html');
    } catch (e) {
      location.href = 'library.html';
    }
  }

  function safeGoToApp(delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        if (!document.hidden) goToApp();
      }, delay);
    } else {
      goToApp();
    }
  }

  function show(view) {
    const lv = qs('#loginView');
    const rv = qs('#registerView');
    if (lv) lv.style.display = view === 'login' ? '' : 'none';
    if (rv) rv.style.display = view === 'register' ? '' : 'none';
  }

  function setErr(inputId, errId, on) {
    const inp = qs('#' + inputId);
    const err = qs('#' + errId);
    if (inp) inp.classList.toggle('invalid', on);
    if (err) err.classList.toggle('show', on);
  }

  function notice(id, msg, type) {
    const el = qs('#' + id);
    if (!el) return;
    el.className = 'notice ' + (type || 'err');
    el.textContent = msg || '';
  }

  function busy(btnId, on, label) {
    const b = qs('#' + btnId);
    if (!b) return;
    b.disabled = on;
    b.textContent = on ? 'لحظة…' : label;
  }

  /* ---------- التسجيل ---------- */
  on('#registerForm', 'submit', async (e) => {
    e.preventDefault();
    notice('regNotice');

    const nameEl  = qs('#regName');
    const phoneEl = qs('#regPhone');
    const passEl  = qs('#regPass');
    if (!nameEl || !phoneEl || !passEl) return;

    const name  = nameEl.value.trim();
    const phone = normPhone(phoneEl.value);
    const pass  = passEl.value;

    let bad = false;
    if (name.length < 2) { setErr('regName', 'regNameErr', true); bad = true; }
    else setErr('regName', 'regNameErr', false);

    if (!isEgyptPhone(phone)) { setErr('regPhone', 'regPhoneErr', true); bad = true; }
    else setErr('regPhone', 'regPhoneErr', false);

    if (pass.length < 6) { setErr('regPass', 'regPassErr', true); bad = true; }
    else setErr('regPass', 'regPassErr', false);

    if (bad) return;

    busy('regBtn', true, 'إنشاء الحساب');
    try {
      const cred = await auth.createUserWithEmailAndPassword(phoneToEmail(phone), pass);
      await cred.user.updateProfile({ displayName: name });
      await db.collection('students').doc(cred.user.uid).set({
        name, phone, role: 'student', createdAt: new Date().toISOString()
      });
      notice('regNotice', 'تم إنشاء حسابك بنجاح! بنحوّلك لمنصتك…', 'ok');
      safeGoToApp(1200);
    } catch (e) {
      console.warn('[AUTH]', e.code);
      if (e.code === 'auth/email-already-in-use') {
        notice('regNotice', 'الرقم ده مسجّل بالفعل — سجّل دخول، ولو نسيت الباسورد استخدم "نسيت كلمة المرور".');
      } else {
        notice('regNotice', errAr(e.code));
      }
    }
    busy('regBtn', false, 'إنشاء الحساب');
  });

  /* ---------- الدخول ---------- */
  on('#loginForm', 'submit', async (e) => {
    e.preventDefault();
    notice('loginNotice');

    const phoneEl = qs('#loginPhone');
    const passEl  = qs('#loginPass');
    if (!phoneEl || !passEl) return;

    const phone = normPhone(phoneEl.value);
    const pass  = passEl.value;

    let bad = false;
    if (!isEgyptPhone(phone)) { setErr('loginPhone', 'loginPhoneErr', true); bad = true; }
    else setErr('loginPhone', 'loginPhoneErr', false);

    if (!pass) { setErr('loginPass', 'loginPassErr', true); bad = true; }
    else setErr('loginPass', 'loginPassErr', false);

    if (bad) return;

    busy('loginBtn', true, 'دخول');
    try {
      await auth.signInWithEmailAndPassword(phoneToEmail(phone), pass);
      notice('loginNotice', 'تم الدخول بنجاح! بنحوّلك…', 'ok');
      safeGoToApp(800);
    } catch (e) {
      console.warn('[AUTH]', e.code);
      notice('loginNotice', errAr(e.code));
    }
    busy('loginBtn', false, 'دخول');
  });

  /* ---------- نسيت كلمة المرور ---------- */
  on('#forgotBtn', 'click', () => {
    const phoneEl = qs('#loginPhone');
    if (!phoneEl) return;
    const phone = normPhone(phoneEl.value);
    if (!isEgyptPhone(phone)) {
      notice('loginNotice', 'اكتب رقم موبايلك في الخانة الأول، وبعدين دوس "نسيت كلمة المرور".');
      return;
    }
    notice('loginNotice',
      'لإعادة تعيين كلمة المرور: كلّمنا واتساب أو اتصل على 01096295395 وهنعملها لك فورًا. تأكد إنك كاتب رقمك صح: ' + phone,
      'ok');
  });

  /* ---------- التنقل بين النماذج ---------- */
  on('#toRegister', 'click', () => show('register'));
  on('#toLogin',    'click', () => show('login'));

  /* ---------- مراقبة حالة الدخول ---------- */
  auth.onAuthStateChanged((user) => {
    if (redirecting) return;
    if (user) {
      console.info('[AUTH] المستخدم مسجّل دخول — تحويل للمنصة');
      safeGoToApp(0);
    }
  });

  /* ✅ شاشة التحميل */
  const body = document.body;
  if (body) {
    body.style.opacity = '0';
    body.style.transition = 'opacity .2s ease';
    setTimeout(() => { body.style.opacity = '1'; }, 100);
  }
})();