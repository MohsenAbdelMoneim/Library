/* ==========================================================
   gate.js — v14
   بوابة الحماية + واتساب وفودافون كاش + إدارة المشتركين
   (يوتيوب مفتوح للجميع — Drive للمشتركين فقط)
   ========================================================== */

'use strict';

(function () {
  console.log('%c MCL Gate — v14 ', 'background:#4ade80;color:#052e12;font-weight:bold');

  const ADMIN_KEY = 'my-course-library:admin';
  const SUBSCRIBER_KEY = 'my-course-library:subscriber';
  const SUBS_LOCAL_KEY = 'my-course-library:subs-local';
  const SUBS_EXPORTED_KEY = 'my-course-library:subs-exported';

  const MCL = window.MCL = {
    version: '14',
    ADMIN_PASSWORD: '01096295395mo',
    CONTACT_PHONE: '01096295395',
    WHATSAPP_INTL: '201096295395',
    SUBS_URL: 'subscriptions.json',
    subscriptions: {},
    onRender: null,
    getView: null,
    renderAll: null
  };

  /* ---------- أدوات ---------- */
  const qs  = (s, el) => (el || document).querySelector(s);
  const qsa = (s, el) => [...(el || document).querySelectorAll(s)];

  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const norm = (s) => String(s ?? '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/\s+/g, '').trim();

  function normPhone(s) {
    let v = norm(s).replace(/^\+?20/, '');
    if (v.length === 10 && v.startsWith('1')) v = '0' + v;
    return v;
  }
  MCL.norm = norm;
  MCL.normPhone = normPhone;

  const isEgyptPhone = (v) => /^01\d{9}$/.test(v);

  function maskPhone(p) {
    p = String(p || '');
    return p.length >= 6 ? p.slice(0, 3) + '••••' + p.slice(-2) : p;
  }

  function waLink(text) {
    return `https://wa.me/${MCL.WHATSAPP_INTL}?text=${encodeURIComponent(text)}`;
  }

  async function copyText(t, okMsg) {
    try { await navigator.clipboard.writeText(t); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* تجاهل */ }
      ta.remove();
    }
    notify(okMsg || 'تم النسخ.', 'success');
  }

  function notify(msg, type = 'info', duration = 4200, action = null) {
    if (typeof window.showToast === 'function') { window.showToast(msg, type, { duration, action }); return; }
    const box = qs('#toasts') || document.body;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  function appConfirm(opts) {
    if (typeof window.openConfirm === 'function') { window.openConfirm(opts); return; }
    if (window.confirm(opts.message)) opts.onConfirm();
  }

  function emit() {
    renderChips();
    if (typeof MCL.onRender === 'function') MCL.onRender(MCL.getView ? MCL.getView() : null);
  }
  MCL.emit = emit;

  /* ---------- وضع المالك ---------- */
  let adminMem = false;
  function isAdminActive() {
    try { return sessionStorage.getItem(ADMIN_KEY) === '1'; } catch { return adminMem; }
  }
  function setAdminMode(on) {
    adminMem = on;
    try { on ? sessionStorage.setItem(ADMIN_KEY, '1') : sessionStorage.removeItem(ADMIN_KEY); } catch { /* تجاهل */ }
  }
  MCL.isAdminActive = isAdminActive;

  /* ---------- المشترك ---------- */
  let subMem = null;
  function getSubscriberPhone() {
    try { return sessionStorage.getItem(SUBSCRIBER_KEY); } catch { return subMem; }
  }
  function setSubscriberPhone(p) {
    subMem = p;
    try { p ? sessionStorage.setItem(SUBSCRIBER_KEY, p) : sessionStorage.removeItem(SUBSCRIBER_KEY); } catch { /* تجاهل */ }
  }
  MCL.getSubscriberPhone = getSubscriberPhone;

  /* ---------- نموذج الحماية ---------- */
  function isProtected(r) { return !!r && r.source === 'Google Drive'; }
  MCL.isProtected = isProtected;

  function allowedFor(phone, r) {
    const plan = MCL.subscriptions[normPhone(phone)];
    if (!plan) return false;
    if (plan === 'all') return true;
    return Array.isArray(plan) && (plan.includes(r.title) || plan.includes(r.id));
  }

  function isResourceLocked(r) {
    if (!isProtected(r)) return false;
    if (isAdminActive()) return false;
    const p = getSubscriberPhone();
    if (!p) return true;
    return !allowedFor(p, r);
  }
  MCL.isResourceLocked = isResourceLocked;

  let pendingAction = null;
  let lockMode = null;
  let lockResource = null;

  function requireUnlock(r, run) {
    if (!isResourceLocked(r)) { run(); return; }
    const p = getSubscriberPhone();
    if (p && !allowedFor(p, r)) {
      notify(`«${r.title}» مش ضمن اشتراك رقمك (${maskPhone(p)}).`, 'warn', 6000, {
        label: 'كلمنا واتساب',
        onClick() { window.open(waLink(`أهلاً 👋 عايز أضيف كورس «${r.title}» لاشتراكي`), '_blank', 'noopener,noreferrer'); }
      });
      return;
    }
    pendingAction = { run };
    openLockModal({ mode: 'gate', resource: r });
  }
  MCL.requireUnlock = requireUnlock;

  function requireAdmin(run) {
    if (isAdminActive()) { run(); return; }
    pendingAction = { run };
    openLockModal({ mode: 'login' });
    notify('هذه العملية لوضع المالك — أدخل كلمة مرور المالك.', 'info');
  }
  MCL.requireAdmin = requireAdmin;

  /* ---------- أنماط ---------- */
  const STYLES = `
.lock-chip{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:10px;font-size:11.5px;font-weight:600;border:1px solid var(--edge,#212129);color:var(--mut,#9c9cab);transition:color .15s,border-color .15s,background .15s;cursor:pointer}
.lock-chip:hover{color:var(--ink,#ececf1);border-color:var(--edge2,#2e2e39)}
.lock-chip.locked{color:var(--acc,#f0b53e);border-color:rgba(240,181,62,.35);background:rgba(240,181,62,.07)}
.lock-chip.unlocked{color:#4ade80;border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.07)}
.lock-overlay{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:600;color:var(--acc,#f0b53e);background:rgba(10,10,13,.75);backdrop-filter:blur(4px);border:1px solid rgba(240,181,62,.35);padding:7px 13px;border-radius:999px}
.shake{animation:shake .4s cubic-bezier(.36,.07,.19,.97)}
@keyframes shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-4px)}40%,60%{transform:translateX(4px)}}
.subs-check{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;font-size:12px;color:var(--mut,#9c9cab);cursor:pointer;transition:background .15s,color .15s}
.subs-check:hover{background:var(--raise,#16161d);color:var(--ink,#ececf1)}
.subs-check input{accent-color:#f0b53e;width:14px;height:14px;cursor:pointer}
.lock-contact{margin-top:14px;padding-top:12px;border-top:1px solid var(--edge,#212129)}
.lock-contact-title{font-size:11px;color:var(--dim,#66666f);text-align:center;margin-bottom:9px}
.wa-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:36px;padding:0 14px;border-radius:10px;background:#25D366;color:#04310f;font-size:12px;font-weight:700;transition:background .15s;flex:1;text-decoration:none}
.wa-btn:hover{background:#3ce07e}
.wa-btn i{font-size:14px}
.cash-btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:10px;border:1px solid var(--edge,#212129);background:var(--bg,#0a0a0d);color:var(--mut,#9c9cab);font-size:11.5px;font-weight:600;transition:color .15s,border-color .15s;cursor:pointer}
.cash-btn:hover{color:var(--ink,#ececf1);border-color:var(--edge2,#2e2e39)}
.cash-btn .num{font-family:'IBM Plex Mono',monospace;direction:ltr}
`;

  function buildModalHTML() {
    return `
  <div class="modal-backdrop absolute inset-0 bg-black/70 backdrop-blur-[3px]" data-close-lock></div>
  <div class="absolute inset-0 overflow-y-auto">
    <div class="min-h-full flex items-center justify-center p-4">
      <div class="modal-panel relative w-full max-w-sm rounded-2xl border border-edge2 bg-panel shadow-2xl p-5">
        <div class="flex items-start gap-3">
          <span class="icon-tile !border-accent/30 !text-accent"><i class="bi bi-person-badge"></i></span>
          <div class="min-w-0">
            <h2 id="lockTitle" class="text-[14.5px] font-semibold">دخول المشتركين</h2>
            <p id="lockCourse" class="mt-1 text-[12.5px] font-semibold text-accent truncate"></p>
            <p id="lockDesc" class="mt-1.5 text-[12.5px] leading-relaxed text-mut"></p>
          </div>
        </div>
        <form id="lockForm" novalidate class="mt-4">
          <label for="lockPassword" id="lockLabel" class="field-label">رقم الموبايل</label>
          <div class="relative">
            <input id="lockPassword" type="text" inputmode="numeric" class="field pe-10" autocomplete="off"
                   placeholder="010xxxxxxxxx" aria-describedby="lockError">
            <button type="button" id="lockToggle" class="icon-btn absolute end-1.5 top-1/2 -translate-y-1/2"
                    aria-label="إظهار كلمة المرور"><i class="bi bi-eye"></i></button>
          </div>
          <p id="lockError" class="field-err hidden mt-1.5">الرقم غير مسجّل في الاشتراكات — تأكد منه أو تواصل معنا.</p>
          <p id="lockAdminHint" class="mt-1.5 text-[10.5px] text-dim">صاحب المكتبة؟ أدخل كلمة مرور المالك.</p>
          <div class="mt-4 flex items-center justify-end gap-2">
            <button type="button" id="lockCancel" class="btn-ghost" data-close-lock>تصفح فقط</button>
            <button type="submit" id="lockSubmitBtn" class="btn-accent">
              <i class="bi bi-unlock text-[12px]" aria-hidden="true"></i>دخول
            </button>
          </div>
        </form>
        <div id="lockContact" class="lock-contact">
          <p class="lock-contact-title">عايز تشترك في كورس؟ الدفع فودافون كاش على</p>
          <div class="flex items-center gap-2">
            <a id="waContactBtn" href="#" target="_blank" rel="noopener noreferrer" class="wa-btn">
              <i class="bi bi-whatsapp" aria-hidden="true"></i>كلمنا واتساب
            </a>
            <button type="button" id="waCopyCash" class="cash-btn" title="نسخ رقم فودافون كاش">
              <span class="num">${escapeHtml(MCL.CONTACT_PHONE)}</span>
              <i class="bi bi-clipboard text-[12px]" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  }

  function ensureGateDOM() {
    if (!document.getElementById('gateStyles')) {
      const st = document.createElement('style');
      st.id = 'gateStyles';
      st.textContent = STYLES;
      document.head.appendChild(st);
    }

    qsa('#lockModal').forEach((m) => m.remove());
    const modal = document.createElement('div');
    modal.id = 'lockModal';
    modal.className = 'modal fixed inset-0 z-[68] hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'lockTitle');
    modal.innerHTML = buildModalHTML();
    document.body.appendChild(modal);

    const host = qs('header .ms-auto') || qs('header');
    if (host) {
      let chip = qs('#lockChip');
      if (!chip) {
        chip = document.createElement('button');
        chip.id = 'lockChip';
        chip.type = 'button';
        chip.className = 'lock-chip locked';
        chip.innerHTML = '<i class="bi bi-lock-fill text-[12px]" aria-hidden="true"></i>' +
                         '<span id="lockChipText" class="hidden sm:inline">Drive مقفل</span>';
        host.insertBefore(chip, host.firstChild);
      }
      chip.addEventListener('click', () => {
        if (isAdminActive()) { notify('أنت في وضع المالك — كل الكورسات متاحة.', 'info'); return; }
        const p = getSubscriberPhone();
        if (p) notify(`اشتراكك مفعّل برقم ${maskPhone(p)}.`, 'info');
        else openLockModal({ mode: 'gate' });
      });

      let subChip = qs('#subChip');
      if (!subChip) {
        subChip = document.createElement('button');
        subChip.id = 'subChip';
        subChip.type = 'button';
        subChip.className = 'lock-chip';
        subChip.innerHTML = '<i class="bi bi-person-badge text-[12px]" aria-hidden="true"></i>' +
                            '<span id="subChipText" class="hidden sm:inline">دخول مشترك</span>';
        chip.after(subChip);
      }
      subChip.addEventListener('click', () => {
        const p = getSubscriberPhone();
        if (p) {
          setSubscriberPhone(null);
          emit();
          if (typeof MCL.renderAll === 'function') MCL.renderAll();
          notify('خرجت من الاشتراك — كورسات Drive مقفلة تاني.', 'info');
        } else openLockModal({ mode: 'gate' });
      });

      let adminChip = qs('#adminChip');
      if (!adminChip) {
        adminChip = document.createElement('button');
        adminChip.id = 'adminChip';
        adminChip.type = 'button';
        adminChip.className = 'lock-chip';
        adminChip.innerHTML = '<i class="bi bi-shield-lock text-[12px]" aria-hidden="true"></i>' +
                              '<span id="adminChipText" class="hidden sm:inline">دخول المالك</span>';
        subChip.after(adminChip);
      }
      adminChip.addEventListener('click', () => {
        if (isAdminActive()) {
          setAdminMode(false);
          emit();
          if (typeof MCL.renderAll === 'function') MCL.renderAll();
          notify('تم الخروج من وضع المالك.', 'info');
        } else openLockModal({ mode: 'login' });
      });
    }

    ensureSubsViewDOM();
  }

  /* ---------- نافذة الدخول ---------- */
  function openLockModal({ mode = 'gate', resource = null } = {}) {
    lockMode = mode;
    lockResource = resource;
    const courseEl = qs('#lockCourse');
    const descEl = qs('#lockDesc');
    const label = qs('#lockLabel');
    const input = qs('#lockPassword');
    const toggleBtn = qs('#lockToggle');
    const cancelBtn = qs('#lockCancel');
    const adminHint = qs('#lockAdminHint');
    const contact = qs('#lockContact');
    const waBtn = qs('#waContactBtn');

    if (mode === 'login') {
      if (qs('#lockTitle')) qs('#lockTitle').textContent = 'دخول المالك';
      if (courseEl) courseEl.classList.add('hidden');
      if (descEl) descEl.textContent = 'ادخل كلمة مرور المالك لتفعيل أدوات الإضافة والتعديل وإدارة المشتركين.';
      if (label) label.textContent = 'كلمة مرور المالك';
      if (input) { input.type = 'password'; input.inputMode = ''; input.placeholder = 'أدخل كلمة المرور…'; }
      if (toggleBtn) toggleBtn.classList.remove('hidden');
      if (cancelBtn) cancelBtn.textContent = 'إلغاء';
      if (adminHint) adminHint.classList.add('hidden');
      if (contact) contact.classList.add('hidden');
    } else {
      if (qs('#lockTitle')) qs('#lockTitle').textContent = 'دخول المشتركين';
      if (courseEl) {
        if (resource) { courseEl.classList.remove('hidden'); courseEl.textContent = `الكورس المطلوب: «${resource.title}»`; }
        else courseEl.classList.add('hidden');
      }
      if (descEl) descEl.textContent = 'اكتب رقم الموبايل المسجّل في اشتراكك لفتح كورساتك. YouTube متاح للجميع بدون اشتراك.';
      if (label) label.textContent = 'رقم الموبايل';
      if (input) { input.type = 'text'; input.inputMode = 'numeric'; input.placeholder = '010xxxxxxxxx'; }
      if (toggleBtn) toggleBtn.classList.add('hidden');
      if (cancelBtn) cancelBtn.textContent = 'تصفح فقط';
      if (adminHint) adminHint.classList.remove('hidden');
      if (contact) contact.classList.remove('hidden');
      if (waBtn) {
        const msg = resource
          ? `أهلاً 👋 عايز أشترك في كورس «${resource.title}» — ابعتلي التفاصيل`
          : 'أهلاً 👋 عايز أشترك في كورسات المكتبة — ابعتلي التفاصيل';
        waBtn.href = waLink(msg);
      }
    }
    const submitBtn = qs('#lockSubmitBtn');
    if (submitBtn) {
      const ic = submitBtn.querySelector('i');
      if (ic) ic.className = (mode === 'login' ? 'bi bi-shield-lock' : 'bi bi-unlock') + ' text-[12px]';
    }

    const form = qs('#lockForm');
    if (form) form.reset();
    hideLockError();
    if (typeof window.openModal === 'function') window.openModal(qs('#lockModal'), input);
    else {
      qs('#lockModal').classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
      setTimeout(() => input && input.focus(), 60);
    }
  }
  MCL.openLockModal = openLockModal;

  function closeLockModal() {
    if (typeof window.closeModal === 'function') window.closeModal(qs('#lockModal'));
    else { qs('#lockModal').classList.add('hidden'); document.body.classList.remove('overflow-hidden'); }
    pendingAction = null;
    lockMode = null;
    lockResource = null;
  }

  function hideLockError() {
    const err = qs('#lockError');
    const input = qs('#lockPassword');
    if (err) err.classList.add('hidden');
    if (input) input.classList.remove('invalid');
  }

  function showLockError(msg) {
    const err = qs('#lockError');
    const input = qs('#lockPassword');
    if (err) {
      if (msg) err.textContent = msg;
      err.classList.remove('hidden');
    }
    if (input) { input.classList.add('invalid'); input.focus(); input.select(); }
    const panel = qs('#lockModal .modal-panel');
    if (panel) { panel.classList.remove('shake'); void panel.offsetWidth; panel.classList.add('shake'); }
  }

  /* ---------- المعالج المركزي: باسورد المالك يُفحص أولًا ----------
     مهم: الفحص هنا على القيمة الخام، قبل فحص صيغة رقم الموبايل،
     عشان باسورد المالك اللي فيه حروف يشتغل من أي شاشة. */
  function handleLockSubmit(form) {
    const input = (form && form.querySelector('#lockPassword')) || qs('#lockPassword');
    const adminPass = norm(MCL.ADMIN_PASSWORD);
    const pending = pendingAction;
    let ok = false, msg = '';

    if (lockMode === 'login') {
      const val = norm(input ? input.value : '');
      console.info('[GATE] محاولة دخول مالك — طول:', val.length);
      if (val === adminPass) { setAdminMode(true); ok = true; msg = 'وضع المالك مفعّل — كل الأدوات متاحة الآن.'; }
    } else {
      const raw = norm(input ? input.value : '');
      const val = normPhone(raw);
      console.info('[GATE] محاولة دخول مشترك — بعد التطبيع:', val);

      if (raw === adminPass) {
        setAdminMode(true);
        ok = true;
        msg = 'وضع المالك مفعّل — كل الأدوات والكورسات متاحة.';
      } else if (!isEgyptPhone(val)) {
        showLockError('اكتب رقم موبايل مصري مكوّن من 11 رقم يبدأ بـ 01 (مثال: 01012345678).');
        return;
      } else if (MCL.subscriptions[val]) {
        setSubscriberPhone(val);
        ok = true;
        msg = 'تم تفعيل اشتراكك — كورساتك متاحة حتى تقفل الصفحة.';
      }
    }

    if (!ok) {
      console.warn('[GATE] مدخلات غير مطابقة. الوضع:', lockMode,
        '| الأرقام المسجّلة:', Object.keys(MCL.subscriptions));
      showLockError();
      return;
    }
    pendingAction = null;
    lockMode = null;
    lockResource = null;
    closeLockModal();
    emit();
    if (typeof MCL.renderAll === 'function') MCL.renderAll();
    notify(msg, 'success');
    if (pending && pending.run) pending.run();
  }

  /* ---------- الاشتراكات (احتياطي — cloud.js بيستبدلها بالمزامنة السحابية) ---------- */
  function validateSubsPayload(data) {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
    if (!('subscriptions' in data) || typeof data.subscriptions !== 'object' || data.subscriptions === null) return null;
    const subs = {};
    for (const [phone, plan] of Object.entries(data.subscriptions)) {
      const p = normPhone(phone);
      if (!isEgyptPhone(p)) return null;
      if (plan === 'all') { subs[p] = 'all'; continue; }
      if (Array.isArray(plan) && plan.every((t) => typeof t === 'string' && t.trim())) {
        subs[p] = plan.map((t) => t.trim());
        continue;
      }
      return null;
    }
    return subs;
  }

  function loadLocalSubs() {
    try {
      const raw = JSON.parse(localStorage.getItem(SUBS_LOCAL_KEY) || 'null');
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw;
    } catch { /* تجاهل */ }
    return null;
  }

  function saveLocalSubs() {
    try { localStorage.setItem(SUBS_LOCAL_KEY, JSON.stringify(MCL.subscriptions)); } catch { /* تجاهل */ }
  }

  function sortSnapshot(subs) {
    const o = {};
    Object.keys(subs).sort().forEach((k) => { o[k] = subs[k]; });
    return JSON.stringify(o);
  }

  function lastExportedSnapshot() {
    try { return localStorage.getItem(SUBS_EXPORTED_KEY); } catch { return null; }
  }

  function unsyncedCount() {
    const last = lastExportedSnapshot();
    const cur = MCL.subscriptions;
    let lastMap = {};
    if (last) { try { lastMap = JSON.parse(last); } catch { lastMap = {}; } }
    let diff = 0;
    const keys = new Set([...Object.keys(cur), ...Object.keys(lastMap)]);
    keys.forEach((k) => {
      if (JSON.stringify(cur[k] ?? null) !== JSON.stringify(lastMap[k] ?? null)) diff++;
    });
    return diff;
  }

  async function loadSubscriptions() {
    let fileSubs = null;
    try {
      const res = await fetch(MCL.SUBS_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      fileSubs = validateSubsPayload(await res.json());
      if (!fileSubs) throw new Error('بنية الملف غير صحيحة');
    } catch (err) {
      console.warn('[GATE] subscriptions.json غير متاح أو غير صالح (' + err.message + ')');
    }

    const local = loadLocalSubs();
    if (local) {
      MCL.subscriptions = local;
      console.info('[GATE] الاشتراكات: النسخة المحلية للمالك —', Object.keys(local).length, 'مشترك');
    } else if (fileSubs) {
      MCL.subscriptions = fileSubs;
      console.info('[GATE] الاشتراكات المحمّلة من الملف:', Object.keys(fileSubs).length);
    } else {
      MCL.subscriptions = {};
      console.info('[GATE] مفيش اشتراكات — كل كورسات Drive مقفلة.');
    }
    emit();
    if (typeof MCL.renderAll === 'function') MCL.renderAll();
  }
  MCL.loadSubscriptions = loadSubscriptions;

  function exportSubscriptions() {
    const payload = { version: 1, updatedAt: new Date().toISOString(), subscriptions: MCL.subscriptions };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'subscriptions.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    try { localStorage.setItem(SUBS_EXPORTED_KEY, sortSnapshot(MCL.subscriptions)); } catch { /* تجاهل */ }
    renderSubsView();
    notify('نزّلت نسخة احتياطية — مع المزامنة السحابية مش محتاج ترفعها، خزّنها عندك كأمان.', 'success', 7000);
  }
  MCL.exportSubscriptions = exportSubscriptions;

  /* ---------- شارات الهيدر ---------- */
  function renderChips() {
    const admin = isAdminActive();
    const addBtn = qs('#addResourceBtn');
    if (addBtn) addBtn.classList.toggle('hidden', !admin);
    const qExp = qs('#quickExportBtn');
    if (qExp) qExp.classList.toggle('hidden', !admin);

    const lockChip = qs('#lockChip');
    if (lockChip) {
      const anyProtected = typeof MCL.hasProtected === 'function' && MCL.hasProtected();
      if (!anyProtected) { lockChip.classList.add('hidden'); }
      else {
        lockChip.classList.remove('hidden');
        const lockedVisible = typeof MCL.countLockedVisible === 'function' ? MCL.countLockedVisible() : 0;
        const open = admin || lockedVisible === 0;
        lockChip.classList.toggle('locked', !open);
        lockChip.classList.toggle('unlocked', open);
        const txt = qs('#lockChipText');
        if (txt) txt.textContent = open ? 'كورساتك مفتوحة' : `${lockedVisible} مقفلة`;
        const ic = lockChip.querySelector('i');
        if (ic) ic.className = open ? 'bi bi-unlock-fill text-[12px]' : 'bi bi-lock-fill text-[12px]';
        lockChip.title = getSubscriberPhone() ? 'حالة اشتراكك' : 'دخول المشتركين';
      }
    }

    const subChip = qs('#subChip');
    if (subChip) {
      const p = getSubscriberPhone();
      subChip.classList.toggle('unlocked', !!p);
      const ic = subChip.querySelector('i');
      if (ic) ic.className = (p ? 'bi bi-person-check' : 'bi bi-person-badge') + ' text-[12px]';
      const txt = qs('#subChipText');
      if (txt) txt.textContent = p ? maskPhone(p) : 'دخول مشترك';
      subChip.title = p ? 'انقر للخروج من الاشتراك' : 'دخول المشتركين برقم الموبايل';
    }

    const adminChip = qs('#adminChip');
    if (adminChip) {
      adminChip.classList.toggle('unlocked', admin);
      const ic = adminChip.querySelector('i');
      if (ic) ic.className = (admin ? 'bi bi-shield-check' : 'bi bi-shield-lock') + ' text-[12px]';
      const txt = qs('#adminChipText');
      if (txt) txt.textContent = admin ? 'وضع المالك' : 'دخول المالك';
      adminChip.title = admin ? 'انقر للخروج من وضع المالك' : 'دخول وضع المالك';
    }
  }

  /* ---------- قسم إدارة المشتركين ---------- */
  let subsEditingPhone = null;

  function ensureSubsViewDOM() {
    if (qs('#view-subs')) return;
    const main = qs('main#content') || qs('main');
    if (!main) return;
    const section = document.createElement('section');
    section.id = 'view-subs';
    section.className = 'hidden space-y-4';
    section.setAttribute('aria-label', 'إدارة المشتركين');
    section.innerHTML = `
    <div id="subsSyncBanner" class="hidden rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink">
      <i class="bi bi-cloud-check-fill text-accent mt-0.5 shrink-0" aria-hidden="true"></i>
      <p id="subsSyncText"></p>
    </div>
    <div class="rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 flex items-start gap-2.5 text-[12px] leading-relaxed text-ink">
      <i class="bi bi-info-circle-fill text-accent mt-0.5 shrink-0" aria-hidden="true"></i>
      <p>طريقة تفعيل اشتراك عميل: أضف رقمه وعلّم على كورساته ← لو ظهرت رسالة
      <b class="text-accent">«متصل بالسحابة»</b> في الـConsole فالتعديل بينشر تلقائيًا ←
      ابعت لعميلك إنه يكتب رقمه. لو مفيش اتصال سحابي، استخدم التصدير كنسخة احتياطية.</p>
    </div>
    <div class="grid gap-4 lg:grid-cols-2 items-start">
      <div class="rounded-2xl border border-edge bg-panel p-5">
        <h2 id="subsFormTitle" class="text-[13.5px] font-semibold">إضافة مشترك جديد</h2>
        <div class="mt-3">
          <label for="subsPhone" class="field-label">رقم الموبايل (11 رقم يبدأ بـ 01)</label>
          <input id="subsPhone" type="text" inputmode="numeric" class="field" dir="ltr" placeholder="01xxxxxxxxx" autocomplete="off">
        </div>
        <div class="mt-3 flex items-center gap-4">
          <label class="flex items-center gap-2 text-[12.5px] cursor-pointer">
            <input type="radio" name="subsPlan" value="all" checked class="accent-[#f0b53e]">كل كورسات Drive
          </label>
          <label class="flex items-center gap-2 text-[12.5px] cursor-pointer">
            <input type="radio" name="subsPlan" value="custom" class="accent-[#f0b53e]">كورسات محددة
          </label>
        </div>
        <div id="subsCoursesBox" class="hidden mt-2 rounded-xl border border-edge bg-canvas p-2 max-h-52 overflow-y-auto grid sm:grid-cols-2"></div>
        <div class="mt-4 flex items-center gap-2">
          <button type="button" id="subsSaveBtn" class="btn-accent"><i class="bi bi-person-plus text-[13px]"></i>إضافة المشترك</button>
          <button type="button" id="subsCancelEditBtn" class="btn-ghost hidden">إلغاء التعديل</button>
        </div>
      </div>
      <div class="rounded-2xl border border-edge bg-panel overflow-hidden">
        <div class="px-5 py-3.5 border-b border-edge flex items-center justify-between gap-2">
          <h2 class="text-[13.5px] font-semibold">المشتركون (<span id="subsCount">0</span>)</h2>
          <button type="button" id="subsReloadBtn" class="text-[11px] text-mut hover:text-ink transition" title="تجاهل تعديلاتك المحلية وتحميل نسخة السحابة">تحميل نسخة السحابة</button>
        </div>
        <ul id="subsList" class="max-h-[420px] overflow-y-auto"></ul>
        <div class="px-5 py-4 border-t border-edge flex flex-wrap items-center gap-2">
          <button type="button" id="subsExportBtn" class="btn-ghost"><i class="bi bi-download text-[12px]"></i>نسخة احتياطية</button>
          <button type="button" id="subsImportBtn" class="btn-ghost"><i class="bi bi-upload text-[12px]"></i>استيراد ملف</button>
          <input type="file" id="subsImportFile" accept=".json,application/json" class="hidden">
        </div>
      </div>
    </div>`;
    main.appendChild(section);

    section.addEventListener('click', (e) => {
      if (e.target.closest('input[name="subsPlan"]')) { toggleCoursesBox(); return; }
      if (e.target.closest('#subsSaveBtn')) { saveSubscriber(); return; }
      if (e.target.closest('#subsCancelEditBtn')) { resetSubsForm(); return; }
      if (e.target.closest('#subsExportBtn')) { exportSubscriptions(); return; }
      if (e.target.closest('#subsImportBtn')) { qs('#subsImportFile').click(); return; }
      if (e.target.closest('#subsReloadBtn')) { reloadFromServer(); return; }
      const btn = e.target.closest('[data-subs-action]');
      if (btn) {
        const phone = btn.dataset.phone;
        if (btn.dataset.subsAction === 'edit') editSubscriber(phone);
        else deleteSubscriber(phone);
      }
    });
    qs('#subsImportFile').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) importSubsFile(f);
      e.target.value = '';
    });
  }

  function updateSyncBanner() {
    const banner = qs('#subsSyncBanner');
    if (!banner) return;
    const diff = unsyncedCount();
    const cloudOk = window.CloudSync && CloudSync.authed;
    if (diff > 0 && !cloudOk) {
      qs('#subsSyncText').innerHTML =
        `<b>${diff}</b> تعديل محلي ومش متزامن مع السحابة (وضع المالك مش متصل سحابيًا).
         لو ظهرت رسالة اتصال سحابية في الـConsole هيتبعتوا تلقائيًا، أو استخدم التصدير كنسخة احتياطية.`;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  function planLabel(plan) {
    if (plan === 'all') return 'كل كورسات Drive';
    return Array.isArray(plan) ? `${plan.length} كورس محدد` : '—';
  }

  function renderSubsView() {
    const box = qs('#subsList');
    if (!box) return;

    const courses = (typeof MCL.getCourses === 'function' ? MCL.getCourses() : []);
    const boxChecks = qs('#subsCoursesBox');
    if (boxChecks) {
      boxChecks.innerHTML = courses.map((t) =>
        `<label class="subs-check"><input type="checkbox" class="subs-course" value="${escapeHtml(t)}">
         <span class="truncate">${escapeHtml(t)}</span></label>`).join('') ||
        '<p class="col-span-2 p-3 text-[12px] text-dim text-center">مفيش كورسات Drive في المكتبة لسه.</p>';
    }

    const phones = Object.keys(MCL.subscriptions).sort();
    qs('#subsCount').textContent = phones.length;
    updateSyncBanner();

    if (!phones.length) {
      box.innerHTML = `<li class="px-5 py-10 text-center text-[12.5px] text-dim">
        مفيش مشتركين لسه — ضيف أول رقم من الفورم اللي جنبه.</li>`;
      return;
    }
    box.innerHTML = phones.map((p) => {
      const plan = MCL.subscriptions[p];
      return `<li class="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-edge last:border-0">
        <span class="w-9 h-9 rounded-[10px] bg-canvas border border-edge grid place-items-center text-mut shrink-0">
          <i class="bi bi-person-fill text-[14px]" aria-hidden="true"></i></span>
        <div class="grow min-w-0">
          <p class="text-[13.5px] font-medium text-ink font-mono" dir="ltr">${escapeHtml(p)}</p>
          <p class="text-[11px] text-dim mt-0.5">${escapeHtml(planLabel(plan))}${Array.isArray(plan) ? ' — ' + escapeHtml(plan.join(' · ')) : ''}</p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-subs-action="edit" data-phone="${escapeHtml(p)}" class="icon-btn" aria-label="تعديل" title="تعديل"><i class="bi bi-pencil-square"></i></button>
          <button type="button" data-subs-action="delete" data-phone="${escapeHtml(p)}" class="icon-btn hover:!text-[#f4636e]" aria-label="حذف" title="حذف"><i class="bi bi-trash3"></i></button>
        </div>
      </li>`;
    }).join('');
  }

  function toggleCoursesBox() {
    const custom = qs('#view-subs input[name="subsPlan"][value="custom"]');
    const box = qs('#subsCoursesBox');
    if (custom && box) box.classList.toggle('hidden', !custom.checked);
  }

  function resetSubsForm() {
    subsEditingPhone = null;
    const phone = qs('#subsPhone');
    if (phone) phone.value = '';
    const allRadio = qs('#view-subs input[name="subsPlan"][value="all"]');
    if (allRadio) allRadio.checked = true;
    qsa('#view-subs .subs-course').forEach((c) => { c.checked = false; });
    toggleCoursesBox();
    const title = qs('#subsFormTitle');
    if (title) title.textContent = 'إضافة مشترك جديد';
    const saveBtn = qs('#subsSaveBtn');
    if (saveBtn) saveBtn.innerHTML = '<i class="bi bi-person-plus text-[13px]"></i>إضافة المشترك';
    const cancelBtn = qs('#subsCancelEditBtn');
    if (cancelBtn) cancelBtn.classList.add('hidden');
  }

  function saveSubscriber() {
    const phone = normPhone(qs('#subsPhone') ? qs('#subsPhone').value : '');
    if (!isEgyptPhone(phone)) { notify('رقم الموبايل لازم يكون 11 رقم يبدأ بـ 01.', 'error'); return; }
    const isEdit = subsEditingPhone !== null;
    if (!isEdit && MCL.subscriptions[phone]) {
      notify('الرقم ده مسجّل بالفعل — استخدم زرار التعديل لتغيير خطته.', 'warn');
      return;
    }
    const planAll = qs('#view-subs input[name="subsPlan"][value="all"]').checked;
    if (planAll) {
      MCL.subscriptions[phone] = 'all';
    } else {
      const selected = qsa('#view-subs .subs-course:checked').map((c) => c.value);
      if (!selected.length) { notify('اختر كورس واحد على الأقل، أو اختَر «كل كورسات Drive».', 'error'); return; }
      MCL.subscriptions[phone] = selected;
    }
    if (isEdit && subsEditingPhone !== phone) delete MCL.subscriptions[subsEditingPhone];
    saveLocalSubs();
    renderSubsView();
    emit();
    if (typeof MCL.renderAll === 'function') MCL.renderAll();
    resetSubsForm();
    notify(isEdit
      ? `تم تحديث اشتراك ${phone} — بينشر على السحابة تلقائيًا.`
      : `تمت إضافة ${phone} — بينشر على السحابة تلقائيًا. ابعت لعميلك إنه يكتب رقمه.`,
      'success', 6000);
  }

  function editSubscriber(phone) {
    const plan = MCL.subscriptions[phone];
    if (!plan) return;
    subsEditingPhone = phone;
    const phoneInput = qs('#subsPhone');
    if (phoneInput) phoneInput.value = phone;
    const allRadio = qs('#view-subs input[name="subsPlan"][value="all"]');
    const customRadio = qs('#view-subs input[name="subsPlan"][value="custom"]');
    if (plan === 'all') {
      if (allRadio) allRadio.checked = true;
      qsa('#view-subs .subs-course').forEach((c) => { c.checked = false; });
    } else {
      if (customRadio) customRadio.checked = true;
      qsa('#view-subs .subs-course').forEach((c) => { c.checked = plan.includes(c.value); });
    }
    toggleCoursesBox();
    const title = qs('#subsFormTitle');
    if (title) title.textContent = `تعديل اشتراك ${phone}`;
    const saveBtn = qs('#subsSaveBtn');
    if (saveBtn) saveBtn.innerHTML = '<i class="bi bi-check2 text-[13px]"></i>حفظ التعديل';
    const cancelBtn = qs('#subsCancelEditBtn');
    if (cancelBtn) cancelBtn.classList.remove('hidden');
    const sec = qs('#view-subs');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function deleteSubscriber(phone) {
    appConfirm({
      title: 'إلغاء اشتراك',
      message: `سيتم إلغاء اشتراك الرقم ${phone} — وبينشر على السحابة تلقائيًا بعد ثواني.`,
      confirmLabel: 'إلغاء الاشتراك',
      danger: true,
      onConfirm() {
        delete MCL.subscriptions[phone];
        saveLocalSubs();
        renderSubsView();
        emit();
        if (typeof MCL.renderAll === 'function') MCL.renderAll();
        notify(`تم إلغاء اشتراك ${phone} — بينشر على السحابة تلقائيًا.`, 'warn', 5500);
      }
    });
  }

  function reloadFromServer() {
    appConfirm({
      title: 'تحميل نسخة السحابة',
      message: 'سيتم تجاهل كل تعديلاتك المحلية وتحميل نسخة الاشتراكات من السحابة. متأكد؟',
      confirmLabel: 'تحميل من السحابة',
      danger: true,
      onConfirm() {
        try {
          localStorage.removeItem(SUBS_LOCAL_KEY);
          localStorage.removeItem(SUBS_EXPORTED_KEY);
        } catch { /* تجاهل */ }
        loadSubscriptions();
        resetSubsForm();
        notify('تم تحميل نسخة السحابة ومسح التعديلات المحلية.', 'info');
      }
    });
  }

  function importSubsFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const subs = validateSubsPayload(JSON.parse(reader.result));
        if (!subs) { notify('ملف الاشتراكات غير صالح — البنية المطلوبة { version, updatedAt, subscriptions }.', 'error', 6000); return; }
        appConfirm({
          title: 'استيراد الاشتراكات',
          message: `سيتم تحميل ${Object.keys(subs).length} اشتراك من الملف بدل القايمة الحالية (${Object.keys(MCL.subscriptions).length})، وينشر على السحابة تلقائيًا.`,
          confirmLabel: 'استيراد',
          onConfirm() {
            MCL.subscriptions = subs;
            saveLocalSubs();
            renderSubsView();
            emit();
            if (typeof MCL.renderAll === 'function') MCL.renderAll();
            notify('تم استيراد الاشتراكات — بينشروا على السحابة تلقائيًا.', 'success');
          }
        });
      } catch { notify('الملف ليس JSON صالحًا.', 'error'); }
    };
    reader.readAsText(file);
  }

  /* ---------- أحداث النافذة ---------- */
  document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'lockForm') { e.preventDefault(); handleLockSubmit(e.target); }
  });
  document.addEventListener('click', (e) => {
    if (!qs('#lockModal')) return;
    if (e.target.closest('#waCopyCash')) {
      copyText(MCL.CONTACT_PHONE, 'تم نسخ رقم فودافون كاش.');
      return;
    }
    const submitBtn = e.target.closest('#lockModal button[type="submit"]');
    if (submitBtn) { e.preventDefault(); handleLockSubmit(submitBtn.closest('form')); return; }
    if (e.target.closest('#lockModal [data-close-lock]')) { closeLockModal(); return; }
    if (e.target.closest('#lockToggle')) {
      const input = qs('#lockPassword');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      qs('#lockToggle i').className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
      input.focus();
    }
  });

  /* ---------- تشغيل ---------- */
  ensureGateDOM();
  MCL.closeLockModal = closeLockModal;
  MCL.renderChips = renderChips;
  window.renderSubsViewGate = renderSubsView;
})();