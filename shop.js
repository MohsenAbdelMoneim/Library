/* ==========================================================
   shop.js — v17
   Cart Page + Checkout + Wishlist + Course Details
   ✅ v17: بيقرأ من window.__NEXORA_CATALOG__ (Firestore)
   ✅ v17: إصلاح SyntaxError في renderCart
   ========================================================== */

'use strict';

(function () {
  console.log('%c Nexora Shop — v17 ', 'background:#e8961e;color:#161204;font-weight:bold');

  if (!window.firebase) { console.error('[SHOP] Firebase مش محمّل'); return; }
  if (!firebase.apps.length) {
    firebase.initializeApp(window.__FIREBASE_CONFIG__ || {
      apiKey: "AIzaSyBxPZmpUaRmRLkjwg2z-Vcbg-Z6s3G_V6A",
      authDomain: "gymzone-f53f1.firebaseapp.com",
      projectId: "gymzone-f53f1",
      storageBucket: "gymzone-f53f1.firebasestorage.app",
      messagingSenderId: "138864850130",
      appId: "1:138864850130:web:ae594e26d4eb36518ba90b"
    });
  }
  const auth = firebase.auth();
  const db = firebase.firestore();

  const CART_KEY = 'nexora:cart:v1';
  const WISH_KEY = 'nexora:wishlist:v1';
  const PHONE = '01096295395';
  const WA = 'https://wa.me/201096295395';

  /* ✅ الكتالوج بقى ييجي من Firestore */
  function getCatalogSource() {
    return window.__NEXORA_CATALOG__ || { courses: [], packages: [], byId: {}, packById: {} };
  }

  /* ✅ wrapper يبني CATALOG و PACKS بنفس شكل shop.js القديم */
  function buildCatalogMaps() {
    const src = getCatalogSource();
    const CATALOG = {};
    const PACKS = {};

    (src.courses || []).forEach((c) => {
      if (!c || !c.id) return;
      CATALOG[c.id] = {
        t: c.title,
        p: c.cashPrice,
        inst: c.installmentAmount,
        instN: c.installmentCount,
        instT: c.installmentTotal,
        cat: c.category || '',
        d: c.description || ''
      };
    });

    (src.packages || []).forEach((p) => {
      if (!p || !p.id) return;
      PACKS[p.id] = {
        t: p.title,
        p: p.cashPrice,
        inst: p.installmentAmount,
        instN: p.installmentCount,
        instT: p.installmentTotal,
        ids: p.courseIds || []
      };
    });

    return { CATALOG, PACKS };
  }

  /* ✅ نسخة متغيرة عشان تتحدث مع Firestore */
  let _maps = buildCatalogMaps();
  const CATALOG = new Proxy({}, {
    get: (_, k) => _maps.CATALOG[k]
  });
  const PACKS = new Proxy({}, {
    get: (_, k) => _maps.PACKS[k]
  });

  /* تحديث المابات لما Firestore يجيب البيانات */
  window.addEventListener('nexora:catalog-ready', () => {
    _maps = buildCatalogMaps();
    console.info('[SHOP] تم تحديث الكتالوج من Firestore');
    if (currentView === 'cart') renderCart();
    if (currentView === 'checkout') renderCheckout();
    if (currentView === 'wishlist') renderWishlist();
  });
  window.addEventListener('nexora:catalog-update', () => {
    _maps = buildCatalogMaps();
    if (currentView === 'cart') renderCart();
    if (currentView === 'checkout') renderCheckout();
    if (currentView === 'wishlist') renderWishlist();
  });

  const fmt = (n) => Number(n).toLocaleString('ar-EG-u-nu-latn') + ' جنيه';
  const qs  = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  /* ---------- التخزين ---------- */
  const load = (k, fb) => {
    try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? fb; }
    catch { return fb; }
  };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* تجاهل */ } };

  let cart = load(CART_KEY, []);
  let wishlist = load(WISH_KEY, []);
  cart = cart.filter((x) => typeof x === 'string');

  const saveCart = () => { save(CART_KEY, cart); updateBadges(); if (currentView === 'cart') renderCart(); };
  const saveWish = () => { save(WISH_KEY, wishlist); updateBadges(); };

  const inCart = (id) => cart.includes(id);
  const inWish = (id) => wishlist.includes(id);

  function toggleCart(id) {
    if (inCart(id)) cart = cart.filter((x) => x !== id);
    else cart.push(id);
    saveCart();
  }
  function toggleWish(id) {
    if (inWish(id)) wishlist = wishlist.filter((x) => x !== id);
    else wishlist.push(id);
    saveWish();
    notify(inWish(id) ? 'اتضافت للمفضلة ❤️' : 'اتشالت من المفضلة');
  }

  function calcTotal() {
    return cart.reduce((s, id) => {
      const p = CATALOG[id]?.p ?? PACKS[id]?.p;
      if (p == null) console.warn('[SHOP] عنصر بدون سعر في السلة:', id);
      return s + (p || 0);
    }, 0);
  }

  function notify(msg, type = 'success', dur = 4200) {
    if (typeof window.showToast === 'function') window.showToast(msg, type, { duration: dur });
    else console.log('[SHOP]', msg);
  }

  /* ---------- الأنماط ---------- */
  const STYLES = `
.shop-wrap{max-width:1000px;margin:0 auto}
.shop-toolbar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:20px}
.shop-toolbar input[type="search"],.shop-toolbar select{height:42px;background:var(--bg,#0a0a0d);border:1px solid var(--edge,#212129);border-radius:12px;color:var(--ink,#ececf1);font-size:13px;padding:0 12px;font-family:inherit}
.shop-toolbar input[type="search"]{flex:1;min-width:180px}
.shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px}
.shop-card{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:10px}
.shop-card .sc-top{display:flex;justify-content:space-between;align-items:flex-start}
.sc-cat{font-size:10.5px;font-weight:700;color:#7ea2ff;background:rgba(79,124,255,.12);border:1px solid rgba(79,124,255,.3);padding:3px 10px;border-radius:999px}
.sc-wish{background:none;border:none;font-size:19px;cursor:pointer;color:var(--dim,#66666f);padding:2px}
.sc-wish.on{color:#f4636e}
.sc-title{font-size:16.5px;font-weight:800;cursor:pointer;line-height:1.4}
.sc-title:hover{color:#7ea2ff}
.sc-desc{font-size:12.5px;color:var(--mut,#9c9cab);line-height:1.7}
.sc-price{font-size:19px;font-weight:900;color:#4ade80}
.sc-inst{font-size:11.5px;color:var(--mut,#9c9cab)}
.sc-btns{display:flex;gap:8px;margin-top:auto;padding-top:6px}
.btn-sc{flex:1;height:42px;border-radius:11px;border:none;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;transition:.15s}
.btn-sc.add{background:rgba(79,124,255,.15);border:1px solid rgba(79,124,255,.4);color:#7ea2ff}
.btn-sc.add:hover{background:rgba(79,124,255,.28)}
.btn-sc.add.added{background:linear-gradient(135deg,#4ade80,#22c55e);border-color:transparent;color:#052e12}
.btn-sc.buy{background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff}
.btn-sc.buy:hover{opacity:.9}
.sc-note{text-align:center;font-size:10.5px;color:var(--dim,#66666f)}
.shop-empty{text-align:center;padding:50px 16px;background:var(--panel,#101015);border:1px dashed var(--edge2,#2e2e39);border-radius:18px}
.shop-empty .ei{font-size:42px;margin-bottom:10px}
.shop-empty .et{font-size:16px;font-weight:800;margin-bottom:6px}
.shop-empty .ed{font-size:12.5px;color:var(--mut,#9c9cab);line-height:1.8;margin-bottom:16px}
.btn-main{display:inline-flex;align-items:center;gap:7px;height:44px;padding:0 22px;border-radius:12px;background:linear-gradient(135deg,#4f7cff,#7c5cff);color:#fff;font-size:13.5px;font-weight:700;text-decoration:none;border:none;cursor:pointer;font-family:inherit}
.ck-grid{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:900px){.ck-grid{grid-template-columns:1.2fr .8fr}}
.ck-box{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:18px;padding:20px}
.ck-box h3{font-size:14.5px;font-weight:800;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.ck-fld{margin-bottom:12px}
.ck-fld label{display:block;font-size:11.5px;color:var(--mut,#9c9cab);margin-bottom:5px;font-weight:600}
.ck-fld input,.ck-fld select,.ck-fld textarea{width:100%;height:44px;background:var(--bg,#0a0a0d);border:1px solid var(--edge,#212129);border-radius:11px;color:var(--ink,#ececf1);font-size:13px;padding:0 12px;font-family:inherit}
.ck-fld textarea{height:80px;padding:10px 12px;resize:vertical}
.ck-fld input:focus,.ck-fld select:focus,.ck-fld textarea:focus{outline:none;border-color:rgba(79,124,255,.55)}
.pay-opt{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--edge,#212129);border-radius:12px;margin-bottom:8px;cursor:pointer;background:var(--bg,#0a0a0d)}
.pay-opt:has(input:checked){border-color:rgba(79,124,255,.6);background:rgba(79,124,255,.06)}
.pay-opt input{accent-color:#4f7cff;width:16px;height:16px}
.pay-opt .po-t{font-size:13px;font-weight:700}
.pay-opt .po-d{font-size:10.5px;color:var(--mut,#9c9cab)}
.ck-line{display:flex;justify-content:space-between;font-size:12.5px;color:var(--mut,#9c9cab);padding:5px 0}
.ck-line.total{border-top:1px solid var(--edge,#212129);margin-top:8px;padding-top:12px;font-size:15px;font-weight:800;color:var(--ink,#ececf1)}
.ck-line.total b{color:#4ade80}
.ok-page{text-align:center;padding:50px 20px;background:var(--panel,#101015);border:1px solid rgba(74,222,128,.3);border-radius:20px}
.ok-page .oi{font-size:52px;margin-bottom:12px}
.ok-page .on{font-size:22px;font-weight:900;font-family:'IBM Plex Mono',monospace;direction:ltr;color:#4ade80;margin:10px 0}
.ok-page .ot{font-size:15px;font-weight:800;margin-bottom:8px}
.ok-page .od{font-size:13px;color:var(--mut,#9c9cab);line-height:1.9;margin-bottom:20px}
.detail-hero{background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:20px;padding:26px;margin-bottom:20px}
.detail-title{font-size:26px;font-weight:900;margin-bottom:8px;line-height:1.4}
.detail-desc{font-size:14px;color:var(--mut,#9c9cab);line-height:1.9;margin:10px 0 16px}
.detail-meta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.dmeta{font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;background:var(--bg,#0a0a0d);border:1px solid var(--edge,#212129);color:var(--mut,#9c9cab)}
@media (max-width:640px){
  .shop-grid{grid-template-columns:1fr}
  .shop-toolbar{flex-direction:column;align-items:stretch}
  .detail-title{font-size:20px}
  .btn-sc{height:46px}
}
`;

  /* ---------- DOM ---------- */
  function ensureShopDOM() {
    if (qs('#view-shop-cart')) return;
    if (!document.getElementById('nexShopStyles')) {
      const st = document.createElement('style');
      st.id = 'nexShopStyles';
      st.textContent = STYLES;
      document.head.appendChild(st);
    }
    const main = qs('main#content') || qs('main');
    ['cart', 'checkout', 'wishlist', 'detail'].forEach((v) => {
      const sec = document.createElement('section');
      sec.id = 'view-shop-' + v;
      sec.className = 'hidden';
      sec.setAttribute('aria-label', 'المتجر: ' + v);
      sec.innerHTML = '<div class="shop-wrap" id="shopInner-' + v + '"></div>';
      main.appendChild(sec);
    });
  }

  let currentView = null;
  let currentDetailId = null;

  function showView(v) {
    currentView = v;
    qsa('main#content > section').forEach((s) => s.classList.add('hidden'));
    const el = qs('#view-shop-' + v);
    if (el) el.classList.remove('hidden');
    window.scrollTo(0, 0);
    const sb = qs('#sidebar'); if (sb) sb.classList.remove('open');
    const ov = qs('#overlay'); if (ov) ov.classList.add('hidden');
  }

  /* ---------- Cart Page ---------- */
  function renderCart() {
    const inner = qs('#shopInner-cart');
    if (!inner) return;
    const total = calcTotal();

    const itemsHTML = cart.map(function (id) {
      const isPack = !!PACKS[id];
      const info = isPack
        ? { t: PACKS[id].t, p: PACKS[id].p, cat: 'باقة' }
        : { t: CATALOG[id]?.t, p: CATALOG[id]?.p, cat: CATALOG[id]?.cat };
      return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;background:var(--panel,#101015);border:1px solid var(--edge,#212129);border-radius:14px;padding:14px">' +
        '<span style="font-size:' + (isPack ? '22px' : '20px') + '">' + (isPack ? '📦' : '🎓') + '</span>' +
        '<div style="flex:1;min-width:150px">' +
          '<p style="font-size:13.5px;font-weight:700">' + esc(info.t || id) + '</p>' +
          '<p style="font-size:11px;color:var(--mut,#9c9cab)">' + esc(info.cat || '') + '</p>' +
        '</div>' +
        '<b style="color:#4ade80;font-size:14px">' + fmt(info.p) + '</b>' +
        '<button type="button" class="icon-btn" data-cart-remove="' + esc(id) + '" aria-label="إزالة" style="color:#f4636e"><i class="bi bi-trash3"></i></button>' +
      '</div>';
    }).join('');

    const emptyHTML =
      '<div class="shop-empty">' +
        '<div class="ei">🛒</div>' +
        '<p class="et">السلة فاضية</p>' +
        '<p class="ed">اختار كورس أو باقة من الكتالوج واضغط "أضف للسلة"</p>' +
        '<button type="button" class="btn-main" data-shop-nav="courses">تصفح الكورسات</button>' +
      '</div>';

    const filledHTML =
      '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px">' + itemsHTML + '</div>' +
      '<div class="ck-box">' +
        '<div class="ck-line"><span>عدد العناصر</span><span>' + cart.length + '</span></div>' +
        '<div class="ck-line"><span>الخصم</span><span>—</span></div>' +
        '<div class="ck-line total"><span>الإجمالي (دفع كاش)</span><b>' + fmt(total) + '</b></div>' +
        '<div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap">' +
          '<button type="button" class="btn-main" id="goCheckout" style="flex:1"><i class="bi bi-arrow-left-circle"></i>Proceed to Checkout</button>' +
          '<button type="button" class="btn-sc add" id="keepShopping" style="flex:1"><i class="bi bi-arrow-right-circle"></i>كمّل تصفح</button>' +
        '</div>' +
        '<p class="sc-note" style="margin-top:12px">التقسيط متاح — هننسّقه معاك بعد تأكيد الحجز • ' + PHONE + '</p>' +
      '</div>';

    inner.innerHTML =
      '<div style="padding:4px 0 16px">' +
        '<h2 style="font-size:21px;font-weight:800">سلة المشتريات 🛒 (' + cart.length + ')</h2>' +
        '<p style="font-size:12.5px;color:var(--mut,#9c9cab);margin-top:4px">راجع اختياراتك قبل تأكيد الحجز — كل كورس يُحجز مرة واحدة</p>' +
      '</div>' +
      (cart.length ? filledHTML : emptyHTML);

    const goBtn = qs('#goCheckout');
    if (goBtn) goBtn.addEventListener('click', () => {
      if (!auth.currentUser) {
        notify('سجّل دخول الأول عشان الحجز يتربط بحسابك', 'warn');
        setTimeout(() => { location.href = 'auth.html'; }, 1000);
        return;
      }
      showView('checkout'); renderCheckout();
    });
    const keepBtn = qs('#keepShopping');
    if (keepBtn) keepBtn.addEventListener('click', () => {
      const b = qs('[data-nav="view:catalog"]'); if (b) b.click();
    });
    qsa('#shopInner-cart [data-cart-remove]').forEach((b) =>
      b.addEventListener('click', () => {
        cart = cart.filter((x) => x !== b.dataset.cartRemove);
        saveCart(); renderCart();
      }));
  }

  /* ---------- Checkout Page ---------- */
  function renderCheckout() {
    const inner = qs('#shopInner-checkout');
    if (!inner) return;
    const total = calcTotal();
    const user = auth.currentUser;
    const phone0 = ((user?.email || '').split('@')[0]);

    const itemsRows = cart.map(function (id) {
      const t = CATALOG[id]?.t ?? PACKS[id]?.t ?? id;
      const p = CATALOG[id]?.p ?? PACKS[id]?.p ?? 0;
      return '<div class="ck-line"><span>' + (PACKS[id] ? '📦 ' : '🎓 ') + esc(t) + '</span><span>' + fmt(p) + '</span></div>';
    }).join('');

    inner.innerHTML =
      '<div style="padding:4px 0 16px">' +
        '<h2 style="font-size:21px;font-weight:800">إتمام الحجز 🧾</h2>' +
        '<p style="font-size:12.5px;color:var(--mut,#9c9cab);margin-top:4px">املأ بياناتك واختار طريقة الدفع — وبعد التأكيد هنراجع الطلب ونفعّل كورساتك</p>' +
      '</div>' +
      '<div class="ck-grid">' +
        '<div class="ck-box">' +
          '<h3><i class="bi bi-person"></i>بياناتك</h3>' +
          '<div class="ck-fld"><label>الاسم</label><input id="ckName" value="' + esc(user?.displayName || '') + '" placeholder="اسمك الكامل"></div>' +
          '<div class="ck-fld"><label>رقم الموبايل</label><input id="ckPhone" dir="ltr" value="' + esc(phone0) + '" placeholder="01xxxxxxxxx"></div>' +
          '<div class="ck-fld"><label>ملاحظات (اختياري)</label><textarea id="ckNotes" placeholder="أي تفاصيل إضافية…"></textarea></div>' +
          '<h3 style="margin-top:18px"><i class="bi bi-wallet2"></i>طريقة الدفع</h3>' +
          '<label class="pay-opt"><input type="radio" name="payMethod" value="vodafone-cash" checked>' +
            '<span><span class="po-t">فودافون كاش</span><br><span class="po-d">تحويل على ' + PHONE + ' — نبعتلك التفاصيل</span></span></label>' +
          '<label class="pay-opt"><input type="radio" name="payMethod" value="instapay">' +
            '<span><span class="po-t">InstaPay</span><br><span class="po-d">هنبعتلك بيانات التحويل</span></span></label>' +
          '<label class="pay-opt"><input type="radio" name="payMethod" value="manual">' +
            '<span><span class="po-t">تنسيق يدوي</span><br><span class="po-d">نتواصل معاك ونحدد الأنسب</span></span></label>' +
        '</div>' +
        '<div>' +
          '<div class="ck-box">' +
            '<h3><i class="bi bi-receipt"></i>ملخص الطلب</h3>' +
            itemsRows +
            '<div class="ck-line total"><span>الإجمالي</span><b>' + fmt(total) + '</b></div>' +
            '<button type="button" class="btn-main" id="ckConfirm" style="width:100%;margin-top:16px;height:48px;font-size:14.5px">' +
              '<i class="bi bi-check2-circle"></i>تأكيد الطلب' +
            '</button>' +
            '<p class="sc-note" style="margin-top:10px">مفيش خصم تلقائي — الدفع بيتم بعد تواصلنا معاك</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    const ckBtn = qs('#ckConfirm');
    if (ckBtn) ckBtn.addEventListener('click', async () => {
      const name = qs('#ckName').value.trim();
      const phone = qs('#ckPhone').value.trim().replace(/\s+/g, '');
      const method = qs('input[name="payMethod"]:checked')?.value || 'manual';
      if (name.length < 2) { notify('اكتب اسمك', 'error'); return; }
      if (!/^(\+?20)?01\d{9}$/.test(phone)) { notify('رقم موبايل غير صحيح', 'error'); return; }

      const btn = qs('#ckConfirm');
      btn.disabled = true; btn.textContent = 'لحظة…';
      try {
        const orderId = 'NX-' + Date.now().toString(36).toUpperCase().slice(-6);
        await db.collection('orders').add({
          orderId, userId: auth.currentUser.uid, name, phone,
          items: cart.map((id) => ({
            type: PACKS[id] ? 'pack' : 'course', id,
            title: CATALOG[id]?.t ?? PACKS[id]?.t ?? id,
            price: CATALOG[id]?.p ?? PACKS[id]?.p ?? 0,
            ...(PACKS[id] ? { courseIds: PACKS[id].ids } : {})
          })),
          totalCash: total,
          payMethod: method, notes: qs('#ckNotes').value.trim(),
          status: 'pending', createdAt: new Date().toISOString()
        });
        cart = []; saveCart();
        renderOrderOK(orderId);
      } catch (e) {
        console.error('[SHOP]', e.code);
        notify('فشل إرسال الطلب: ' + (e.code || ''), 'error');
        btn.disabled = false; btn.textContent = 'تأكيد الطلب';
      }
    });
  }

  function renderOrderOK(orderId) {
    const inner = qs('#shopInner-checkout');
    if (!inner) return;
    inner.innerHTML =
      '<div class="ok-page">' +
        '<div class="oi">🎉</div>' +
        '<p class="ot">تم إرسال حجزك بنجاح!</p>' +
        '<p class="on">' + esc(orderId) + '</p>' +
        '<p class="od"><b>الخطوة الجاية:</b> حوّل المبلغ (فودافون كاش على ' + PHONE + ') وابعت سكرين شوت التحويل على واتساب —' +
        ' أول ما نأكد الدفع هنفعّل كل كورساتك على حسابك فورًا، وهتتابع حالتها من <b>"حجوزاتي"</b>.</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          '<a class="btn-main" href="' + WA + '?text=' + encodeURIComponent('أهلاً 👋 بعتت حجز رقم ' + orderId + ' — هبعت سكرين شوت التحويل') + '">📱 كلّمنا واتساب</a>' +
          '<button type="button" class="btn-sc add" id="okOrders">حجوزاتي</button>' +
        '</div>' +
      '</div>';
    const okBtn = qs('#okOrders');
    if (okBtn) okBtn.addEventListener('click', () => {
      const b = qs('[data-nav="view:orders-mine"]');
      if (b) b.click();
      else notify('افتح "حجوزاتي" من القايمة الجانبية', 'info');
    });
  }

  /* ---------- Wishlist ---------- */
  function renderWishlist() {
    const inner = qs('#shopInner-wishlist');
    if (!inner) return;
    if (!wishlist.length) {
      inner.innerHTML =
        '<div class="shop-empty"><div class="ei">❤️</div><p class="et">المفضلة فاضية</p>' +
        '<p class="ed">دوس ❤️ جنب أي كورس تحب تشتريه بعدين</p>' +
        '<button type="button" class="btn-main" data-shop-nav="courses">تصفح الكورسات</button></div>';
      bindNavBtns();
      return;
    }
    const cardsHTML = wishlist.map(function (id) {
      const c = CATALOG[id];
      if (!c) return '';
      const addBtn = inCart(id)
        ? '<button type="button" class="btn-sc add added" disabled>في السلة ✓</button>'
        : '<button type="button" class="btn-sc add" data-add-cart-course="' + esc(id) + '">أضف للسلة</button>';
      return '<article class="shop-card">' +
        '<div class="sc-top"><span class="sc-cat">' + esc(c.cat) + '</span>' +
          '<button type="button" class="sc-wish on" data-wish="' + esc(id) + '"><i class="bi bi-heart-fill"></i></button></div>' +
        '<h3 class="sc-title" data-detail="' + esc(id) + '">' + esc(c.t) + '</h3>' +
        '<p class="sc-desc">' + esc(c.d) + '</p>' +
        '<div class="sc-price">' + fmt(c.p) + ' <span class="sc-inst">/ كاش</span></div>' +
        '<div class="sc-btns">' + addBtn +
          '<a class="btn-sc buy" href="' + WA + '?text=' + encodeURIComponent('أهلاً 👋 عايز أشترك في ' + c.t) + '" target="_blank" rel="noopener noreferrer">اشترك</a>' +
        '</div>' +
      '</article>';
    }).join('');

    inner.innerHTML =
      '<div style="padding:4px 0 16px"><h2 style="font-size:21px;font-weight:800">المفضلة ❤️ (' + wishlist.length + ')</h2></div>' +
      '<div class="shop-grid">' + cardsHTML + '</div>';
    bindShopEvents(inner);
  }

  /* ---------- تفاصيل كورس ---------- */
  function renderDetail(id) {
    const inner = qs('#shopInner-detail');
    if (!inner) return;
    const c = CATALOG[id];
    if (!c) {
      notify('الكورس ده مش في الكتالوج المدفوع', 'warn');
      const b = qs('[data-nav="view:catalog"]'); if (b) b.click();
      return;
    }
    const addBtn = inCart(id)
      ? '<button type="button" class="btn-sc add added" style="height:48px" disabled>في السلة ✓</button>'
      : '<button type="button" class="btn-sc add" style="height:48px" data-add-cart-course="' + esc(id) + '"><i class="bi bi-cart3"></i>أضف للسلة</button>';

    inner.innerHTML =
      '<div class="detail-hero">' +
        '<span class="sc-cat">' + esc(c.cat) + '</span>' +
        '<h2 class="detail-title">' + esc(c.t) + '</h2>' +
        '<p class="detail-desc">' + esc(c.d) + '</p>' +
        '<div class="detail-meta">' +
          '<span class="dmeta">🎓 كورس مسجل</span>' +
          '<span class="dmeta">♾️ وصول مدى الحياة</span>' +
          '<span class="dmeta">🏅 شهادة إتمام</span>' +
          '<span class="dmeta">🛠️ مشاريع عملية</span>' +
        '</div>' +
        '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px">' +
          '<span style="font-size:11px;font-weight:700;color:#4ade80;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.25);padding:3px 10px;border-radius:6px">دفع كاش</span>' +
          '<span class="sc-price" style="font-size:24px">' + fmt(c.p) + '</span>' +
        '</div>' +
        '<p class="sc-inst" style="margin-bottom:18px">أو بالتقسيط: ' + fmt(c.inst) + ' × ' + c.instN + ' دفعات = ' + fmt(c.instT) + '</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
          addBtn +
          '<a class="btn-sc buy" style="height:48px" href="' + WA + '?text=' + encodeURIComponent('أهلاً 👋 عايز أشترك في ' + c.t) + '" target="_blank" rel="noopener noreferrer"><i class="bi bi-whatsapp"></i>اشترك دلوقتي</a>' +
          '<button type="button" class="sc-wish ' + (inWish(id) ? 'on' : '') + '" data-wish="' + esc(id) + '" style="height:48px;width:48px;border:1px solid var(--edge,#212129);border-radius:11px;font-size:20px">' +
            '<i class="bi ' + (inWish(id) ? 'bi-heart-fill' : 'bi-heart') + '"></i></button>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="btn-sc add" data-shop-nav="courses" style="max-width:180px"><i class="bi bi-arrow-right-circle"></i>كل الكورسات</button>';
    bindShopEvents(inner);
  }

  /* ---------- ربط الأحداث ---------- */
  function bindShopEvents(scope) {
    qsa(scope + ' [data-add-cart-course]').forEach((b) => b.addEventListener('click', () => {
      toggleCart(b.dataset.addCartCourse);
      notify(inCart(b.dataset.addCartCourse) ? 'اتضاف للسلة 🛒' : 'اتشال من السلة');
      if (currentView === 'wishlist') renderWishlist();
      if (currentView === 'detail') renderDetail(currentDetailId);
    }));
    qsa(scope + ' [data-wish]').forEach((b) => b.addEventListener('click', () => {
      toggleWish(b.dataset.wish);
      if (currentView === 'wishlist') renderWishlist();
      if (currentView === 'detail') renderDetail(currentDetailId);
    }));
    qsa(scope + ' [data-detail]').forEach((t) => t.addEventListener('click', () => {
      currentDetailId = t.dataset.detail;
      showView('detail'); renderDetail(currentDetailId);
    }));
    bindNavBtns(scope);
  }

  function bindNavBtns(scope) {
    qsa((scope || document) + ' [data-shop-nav]').forEach((b) => {
      if (b.__bound) return;
      b.__bound = true;
      b.addEventListener('click', () => {
        const v = b.dataset.shopNav;
        if (v === 'courses') { const x = qs('[data-nav="view:catalog"]'); if (x) x.click(); }
        else if (v === 'cart') { showView('cart'); renderCart(); }
        else if (v === 'wishlist') { showView('wishlist'); renderWishlist(); }
      });
    });
  }

  /* ---------- شارات الهيدر ---------- */
  function ensureBadges() {
    const host = qs('header .ms-auto') || qs('header');
    if (!host) return;
    if (!qs('#cartNavBtn')) {
      const btn = document.createElement('button');
      btn.id = 'cartNavBtn';
      btn.type = 'button';
      btn.className = 'lock-chip';
      btn.setAttribute('aria-label', 'السلة والمفضلة');
      btn.innerHTML = '<i class="bi bi-cart3 text-[12px]"></i><span id="cartBadge" style="display:none" class="text-[11px] font-bold"></span><i class="bi bi-heart text-[11px]" style="color:#f4636e"></i><span id="wishBadge" style="display:none" class="text-[11px] font-bold"></span>';
      btn.addEventListener('click', () => { showView('cart'); renderCart(); });
      host.insertBefore(btn, host.firstChild);
    }
    updateBadges();
  }
  function updateBadges() {
    const cb = qs('#cartBadge'), wb = qs('#wishBadge');
    if (cb) { cb.textContent = cart.length; cb.style.display = cart.length ? 'inline' : 'none'; }
    if (wb) { wb.textContent = wishlist.length; wb.style.display = wishlist.length ? 'inline' : 'none'; }
  }

  /* ---------- بند المفضلة في القايمة ---------- */
  function ensureNavEntries() {
    const nav = qs('#sideNav');
    if (!nav || qs('[data-nav="view:wishlist"]')) return;
    const files = qs('[data-nav="view:files"]');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.nav = 'view:wishlist';
    btn.className = 'nav-item';
    btn.innerHTML = '<i class="bi bi-heart text-[13.5px] w-4 text-center shrink-0" style="color:#f4636e"></i>' +
                    '<span class="grow text-start truncate">المفضلة</span>';
    if (files) files.after(btn);
    else nav.appendChild(btn);
  }

  /* ---------- أحداث الكتالوج ---------- */
  document.addEventListener('click', (e) => {
    const navWish = e.target.closest('[data-nav="view:wishlist"]');
    if (navWish) {
      e.stopPropagation(); e.preventDefault();
      showView('wishlist'); renderWishlist();
      return;
    }
    const wishBtn = e.target.closest('.nex-card [data-wish]');
    if (wishBtn) {
      e.stopPropagation(); e.preventDefault();
      toggleWish(wishBtn.dataset.wish);
      wishBtn.classList.toggle('on', inWish(wishBtn.dataset.wish));
      const ic = wishBtn.querySelector('i');
      if (ic) ic.className = inWish(wishBtn.dataset.wish) ? 'bi bi-heart-fill' : 'bi bi-heart';
      return;
    }
    const title = e.target.closest('.nex-title');
    if (title) {
      const card = title.closest('.nex-card');
      const id = card ? matchCourseIdFromCard(card) : null;
      if (id) {
        e.stopPropagation(); e.preventDefault();
        currentDetailId = id;
        showView('detail'); renderDetail(id);
      }
    }
  }, true);

  function matchCourseIdFromCard(cardEl) {
    const t = cardEl.querySelector('.nex-title')?.textContent?.trim();
    if (!t) return null;
    const src = getCatalogSource();
    const found = (src.courses || []).find((c) => c.title === t);
    return found ? found.id : null;
  }

  /* هوك السايدبار */
  function installHook() {
    if (window.__shopSidebarHooked) return;
    const orig = window.renderSidebar;
    if (typeof orig !== 'function') return;
    window.__shopSidebarHooked = true;
    window.renderSidebar = function () {
      orig();
      ensureNavEntries();
    };
  }

  function boot() {
    ensureShopDOM();
    ensureBadges();
    ensureNavEntries();
    installHook();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* API عام */
  window.NexoraShop = {
    addToCart: (id) => { if (!inCart(id)) { cart.push(id); saveCart(); } },
    inCart, toggleWish, inWish,
    openCart: () => { showView('cart'); renderCart(); }
  };
})();