/* ==========================================================
   auth.js — v17
   حسابات الطلاب: تسجيل بدليل رقم الموبايل + دخول + استرجاع
   ✅ v17: إصلاح Race — التحويل عمره ما بيقطع كتابة بيانات الطالب
   ✅ v17: وثيقة الطالب بتتكتب دايمًا حتى لو updateProfile فشل
   ✅ v17: لوحة "أنت مسجل بالفعل" بدل الشدّ الإجباري (تبديل حساب متاح)
   ✅ v17: دعم ?next= للرجوع للصفحة المطلوبة + ?phone= للتعبئة
   ✅ v17: التحويل بيكمل لو التاب رجع ظاهر (visibilitychange)
   ✅ v17: زرار "سجّل دخول" سريع لما الرقم يكون مسجّل بالفعل
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Auth — v17 ', 'background:#7c5cff;color:#fff;font-weight:bold');

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
    'auth/invalid-credential':  'الرقم أو كلمة المرور غير صحيحة.',
    'auth/wrong-password':      'كلمة المرور غير صحيحة.',
    'auth/user-not-found':      'مفيش حساب بالرقم ده — أنشئ حساب جديد.',
    'auth/email-already-in-use':'الرقم ده مسجّل بالفعل — سجّل دخول.',
    'auth/weak-password':       'كلمة المرور ضعيفة — 6 أحرف على الأقل.',
    'auth/too-many-requests':   'محاولات كتير — استنى دقيقة وجرب تاني.',
    'auth/network-request-failed': 'مشكلة اتصال — اتأكد من النت.',
    'auth/operation-not-allowed':  'تسجيل الإيميل/الباسورد مقفول في Firebase — فعّله من Authentication → Sign-in method.'
  };
  const errAr = (code) => ERRORS_AR[code] || 'حصل خطأ غير متوقع — جرب تاني.';

  /* ---------- ✅ v17: الهدف من ?next= (مع منع open-redirect) ---------- */
  function getNextTarget() {
    try {
      const p = new URLSearchParams(location.search).get('next');
      /* مسار نسبي آمن فقط: pages.html — مفيش // أو :// أو js: */
      if (p && /^[\w\-\./]+\.html?$/.test(p) && !p.includes('//') && !p.includes(':')) return p;
    } catch { /* تجاهل */ }
    return 'library.html';
  }

  /* ✅ v17: التحويل — مع اكتمال لو التاب كان مخفي */
  let redirecting = false;
  let pendingRedirect = false;

  function goToApp() {
    if (redirecting) return;
    redirecting = true;
    const target = getNextTarget();
    try { location.replace(target); }
    catch { location.href = target; }
  }

  function safeGoToApp(delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        if (document.hidden) {
          /* ✅ v17: بدل ما يلغى للأبد — بيكمل أول ما التاب يرجع */
          pendingRedirect = true;
          console.info('[AUTH] التاب مخفي — التحويل هيكمل لما ترجع له');
        } else {
          goToApp();
        }
      }, delay);
    } else {
      goToApp();
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && pendingRedirect && !redirecting) {
      pendingRedirect = false;
      goToApp();
    }
  });

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

  /* ✅ v17: notice بدعم زرار إجراء اختياري */
  function notice(id, msg, type, action) {
    const el = qs('#' + id);
    if (!el) return;
    el.className = 'notice ' + (type || 'err');
    el.textContent = msg || '';

    /* نلمس أي زرار قديم */
    qsa('#' + id + ' [data-notice-action]').forEach((b) => b.remove());

    if (action && action.label && msg) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.noticeAction = '1';
      btn.textContent = action.label;
      btn.style.cssText =
        'margin-inline-start:8px;background:none;border:1px solid currentColor;' +
        'border-radius:6px;padding:2px 10px;font:inherit;font-size:11.5px;' +
        'font-weight:700;cursor:pointer;color:inherit';
      btn.addEventListener('click', () => { try { action.onClick(); } catch { /* تجاهل */ } });
      el.appendChild(btn);
    }
  }

  function busy(btnId, on, label) {
    const b = qs('#' + btnId);
    if (!b) return;
    b.disabled = on;
    b.textContent = on ? 'لحظة…' : label;
  }

  /* ==========================================================
     ✅ v17: لوحة "أنت مسجل بالفعل" — بدل الشدّ الإجباري
     المستخدم يقدر يكمّل للمنصة أو يعمل logout ويسجل بحساب تاني
     ========================================================== */
  function removeLoggedInPanel() {
    qs('#authLoggedInPanel')?.remove();
  }

  function showLoggedInPanel(user) {
    if (redirecting) return;
    removeLoggedInPanel();

    const who = (user.displayName || '').trim() ||
                (user.email || '').replace('@students.nexora.local', '');

    const p = document.createElement('div');
    p.id = 'authLoggedInPanel';
    p.style.cssText =
      'position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(5,5,10,.85);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);padding:16px';
    p.innerHTML =
      '<div style="background:#101015;border:1px solid #2e2e39;border-radius:18px;' +
      'padding:28px 24px;max-width:340px;width:100%;text-align:center;color:#ececf1;' +
      'font-family:inherit;direction:rtl">' +
        '<div style="font-size:40px;margin-bottom:10px" aria-hidden="true">✅</div>' +
        '<h2 style="font-size:17px;font-weight:800;margin-bottom:6px">أنت مسجّل دخول بالفعل</h2>' +
        '<p style="font-size:12.5px;color:#9c9cab;line-height:1.8;margin-bottom:4px">' +
          (who ? 'مرحبًا <b style="color:#ececf1">' + String(who).replace(/[<>&"']/g, '') + '</b>' : 'حسابك') +
        '</p>' +
        '<p style="font-size:11.5px;color:#66666f;margin-bottom:18px">' +
          'عايز تكمّل لمنصتك؟ ولا تسجل دخول بحساب تاني؟</p>' +
        '<div style="display:flex;flex-direction:column;gap:8px">' +
          '<button type="button" id="authPanelContinue" ' +
            'style="height:44px;border:none;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#7c5cff);' +
            'color:#fff;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer">متابعة للمنصة →</button>' +
          '<button type="button" id="authPanelLogout" ' +
            'style="height:44px;border:1px solid #2e2e39;border-radius:12px;background:none;' +
            'color:#f4636e;font:inherit;font-size:13px;font-weight:700;cursor:pointer">تسجيل الخروج وتبديل الحساب</button>' +
        '</div>' +
      '</div>';

    p.addEventListener('click', (e) => {
      if (e.target.id === 'authPanelContinue') { goToApp(); return; }
      if (e.target.id === 'authPanelLogout') {
        auth.signOut()
          .then(() => {
            removeLoggedInPanel();
            console.info('[AUTH] تم تسجيل الخروج — سجّل بالحساب الجديد');
          })
          .catch((err) => console.warn('[AUTH] signOut:', err.code));
      }
    });

    document.body.appendChild(p);
  }

  /* ---------- مراقبة حالة الدخول ----------
     ✅ v17: authBusy بيمنع الـlistener إنه يشدّ الصفحة أثناء
     عمليات التسجيل/الدخول — عشان الكتابة في Firestore تخلص الأول */
  let authBusy = false;

  auth.onAuthStateChanged((user) => {
    if (redirecting || authBusy) return;
    if (user) {
      console.info('[AUTH] مستخدم مسجّل — لوحة المتابعة');
      showLoggedInPanel(user);
    } else {
      removeLoggedInPanel();
    }
  });

  /* ---------- التسجيل ---------- */
  on('#registerForm', 'submit', async (e) => {
    e.preventDefault();
    notice('regNotice');

    const nameEl  = qs('#regName');
    const phoneEl = qs('#regPhone');
    const passEl  = qs('#regPass');
    if (!nameEl || !phoneEl || !passEl) return;

    const name  = nameEl.value.trim().slice(0, 60);
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
    authBusy = true; /* ✅ نمنع التحويل التلقائي أثناء الكتابة */

    try {
      const cred = await auth.createUserWithEmailAndPassword(phoneToEmail(phone), pass);

      /* ✅ v17: الاسم تحسين اختياري — فشله ما يوقفش باقي الخطوات */
      try { await cred.user.updateProfile({ displayName: name }); }
      catch (pe) { console.warn('[AUTH] updateProfile فشل (الحساب اتعمل عادي):', pe.code); }

      /* ✅ v17: وثيقة الطالب بتتكتب دايمًا — دي أهم خطوة */
      await db.collection('students').doc(cred.user.uid).set({
        name, phone, role: 'student',
        email: phoneToEmail(phone),
        createdAt: new Date().toISOString()
      });

      console.info('[AUTH] ✅ الحساب اتعمل ووثيقة الطالب اتكتبت');
      notice('regNotice', 'تم إنشاء حسابك بنجاح! بنحوّلك لمنصتك…', 'ok');
      authBusy = false;          /* نسمح بالتحويل تاني */
      safeGoToApp(1200);         /* دلوقتي بس الرسالة ظهرت والبيانات اتكتبت */
    } catch (e2) {
      console.warn('[AUTH]', e2.code);
      authBusy = false;

      if (e2.code === 'auth/email-already-in-use') {
        /* ✅ v17: زرار ينقلك للدخول ويعبّي الرقم */
        notice('regNotice',
          'الرقم ده مسجّل بالفعل — سجّل دخول، ولو نسيت الباسورد كلّمنا واتساب.',
          'err',
          {
            label: 'سجّل دخول ←',
            onClick() {
              show('login');
              const lp = qs('#loginPhone');
              if (lp) lp.value = phone;
              const lpass = qs('#loginPass');
              if (lpass) lpass.focus();
            }
          });
      } else {
        notice('regNotice', errAr(e2.code));
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
    authBusy = true; /* ✅ منع التحويل أثناء العملية */

    try {
      await auth.signInWithEmailAndPassword(phoneToEmail(phone), pass);
      notice('loginNotice', 'تم الدخول بنجاح! بنحوّلك…', 'ok');
      authBusy = false;
      safeGoToApp(800);
    } catch (e2) {
      console.warn('[AUTH]', e2.code);
      authBusy = false;

      if (e2.code === 'auth/user-not-found' || e2.code === 'auth/invalid-credential') {
        /* ✅ v17: مسار سريع للتسجيل لو الحساب مش موجود */
        notice('loginNotice', errAr(e2.code), 'err', {
          label: 'أنشئ حساب ←',
          onClick() {
            show('register');
            const rp = qs('#regPhone');
            if (rp) rp.value = phone;
            const rname = qs('#regName');
            if (rname) rname.focus();
          }
        });
      } else {
        notice('loginNotice', errAr(e2.code));
      }
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
    const waMsg = encodeURIComponent('أهلاً 👋 نسيت كلمة المرور لحسابي برقم: ' + phone + ' — محتاج إعادة تعيين');
    notice('loginNotice',
      'لإعادة تعيين كلمة المرور كلّمنا وهنعملها فورًا. رقمك: ' + phone,
      'ok',
      {
        label: 'واتساب',
        onClick() { window.open('https://wa.me/201096295395?text=' + waMsg, '_blank', 'noopener,noreferrer'); }
      });
  });

  /* ---------- التنقل بين النماذج ---------- */
  on('#toRegister', 'click', () => show('register'));
  on('#toLogin',    'click', () => show('login'));

  /* ---------- ✅ v17: تعبئة مسبقة من الرابط ---------- */
  (function prefillFromURL() {
    try {
      const params = new URLSearchParams(location.search);
      const ph = normPhone(params.get('phone') || '');
      if (isEgyptPhone(ph)) {
        const lp = qs('#loginPhone');
        if (lp) lp.value = ph;
      }
    } catch { /* تجاهل */ }
  })();

  /* ---------- شاشة التحميل ---------- */
  const body = document.body;
  if (body) {
    body.style.opacity = '0';
    body.style.transition = 'opacity .2s ease';
    setTimeout(() => { body.style.opacity = '1'; }, 100);
  }
})();