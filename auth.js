/* ==========================================================
   auth.js — v15.1
   حسابات الطلاب: تسجيل بدليل رقم الموبايل + دخول + استرجاع
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Auth — v15.1 ', 'background:#7c5cff;color:#fff;font-weight:bold');

  const firebaseConfig = {
    apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
    authDomain: "gymzone-f53f1.firebaseapp.com",
    projectId: "gymzone-f53f1",
    storageBucket: "gymzone-f53f1.firebasestorage.app",
    messagingSenderId: "138864850130",
    appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
  };

  const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();

  const qs = (s) => document.querySelector(s);
  const normPhone = (s) => {
    let v = String(s || '').replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
      .replace(/\s+/g, '').replace(/^\+?20/, '');
    if (v.length === 10 && v.startsWith('1')) v = '0' + v;
    return v;
  };
  const isEgyptPhone = (v) => /^01\d{9}$/.test(v);

  /* Firebase Auth مش بيقبل رقم موبايل كإيميل — فنحوّله معرّف داخلي ثابت:
     01140059073  →  01140059073@students.nexora.local */
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

  let redirecting = false; /* منع الدبل-ريدايركت */
  function goToApp() {
    if (redirecting) return;
    redirecting = true;
    location.href = 'index.html';
  }

  function show(view) {
    qs('#loginView').style.display = view === 'login' ? '' : 'none';
    qs('#registerView').style.display = view === 'register' ? '' : 'none';
  }

  function setErr(inputId, errId, on) {
    qs('#' + inputId).classList.toggle('invalid', on);
    qs('#' + errId).classList.toggle('show', on);
  }

  function notice(id, msg, type) {
    const el = qs('#' + id);
    el.className = 'notice ' + (type || 'err');
    el.textContent = msg || '';
  }

  function busy(btnId, on, label) {
    const b = qs('#' + btnId);
    b.disabled = on;
    b.textContent = on ? 'لحظة…' : label;
  }

  /* ---------- التسجيل ---------- */
  qs('#registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    notice('regNotice');
    const name = qs('#regName').value.trim();
    const phone = normPhone(qs('#regPhone').value);
    const pass = qs('#regPass').value;

    let bad = false;
    if (name.length < 2) { setErr('regName', 'regNameErr', true); bad = true; } else setErr('regName', 'regNameErr', false);
    if (!isEgyptPhone(phone)) { setErr('regPhone', 'regPhoneErr', true); bad = true; } else setErr('regPhone', 'regPhoneErr', false);
    if (pass.length < 6) { setErr('regPass', 'regPassErr', true); bad = true; } else setErr('regPass', 'regPassErr', false);
    if (bad) return;

    busy('regBtn', true, 'إنشاء الحساب');
    try {
      const cred = await auth.createUserWithEmailAndPassword(phoneToEmail(phone), pass);
      await cred.user.updateProfile({ displayName: name });
      await db.collection('students').doc(cred.user.uid).set({
        name, phone, role: 'student', createdAt: new Date().toISOString()
      });
      notice('regNotice', 'تم إنشاء حسابك بنجاح! بنحوّلك لمنصتك…', 'ok');
      setTimeout(goToApp, 1200);
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
  qs('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    notice('loginNotice');
    const phone = normPhone(qs('#loginPhone').value);
    const pass = qs('#loginPass').value;

    let bad = false;
    if (!isEgyptPhone(phone)) { setErr('loginPhone', 'loginPhoneErr', true); bad = true; } else setErr('loginPhone', 'loginPhoneErr', false);
    if (!pass) { setErr('loginPass', 'loginPassErr', true); bad = true; } else setErr('loginPass', 'loginPassErr', false);
    if (bad) return;

    busy('loginBtn', true, 'دخول');
    try {
      await auth.signInWithEmailAndPassword(phoneToEmail(phone), pass);
      notice('loginNotice', 'تم الدخول بنجاح! بنحوّلك…', 'ok');
      setTimeout(goToApp, 800);
    } catch (e) {
      console.warn('[AUTH]', e.code);
      notice('loginNotice', errAr(e.code));
    }
    busy('loginBtn', false, 'دخول');
  });

  /* ---------- نسيت كلمة المرور ---------- */
  /* الإيميل الداخلي مش بيستقبل رسايل — إعادة التعيين بتتم يدويًا من المالك */
  qs('#forgotBtn').addEventListener('click', () => {
    const phone = normPhone(qs('#loginPhone').value);
    if (!isEgyptPhone(phone)) {
      notice('loginNotice', 'اكتب رقم موبايلك في الخانة الأول، وبعدين دوس "نسيت كلمة المرور".');
      return;
    }
    notice('loginNotice',
      'لإعادة تعيين كلمة المرور: كلّمنا واتساب أو اتصل على 01096295395 وهنعملها لك فورًا. تأكد إنك كاتب رقمك صح: ' + phone, 'ok');
  });

  /* ---------- التنقل بين النماذج ---------- */
  qs('#toRegister').addEventListener('click', () => show('register'));
  qs('#toLogin').addEventListener('click', () => show('login'));

  /* لو داخله من قبل — تحويل مباشر للمنصة */
  auth.onAuthStateChanged((user) => {
    if (user) goToApp();
  });
})();