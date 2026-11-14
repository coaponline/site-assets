/* COAP site on Kajabi: designed forms -> Kajabi native forms.

   Every page keeps the form exactly as designed. Each page also carries a hidden native Kajabi
   form block (it sits in the hidden Kajabi section shell). On submit, this script copies the
   designed form's values into that native form and clicks its button, so Kajabi records the
   contact (CSRF token, honeypot, reCAPTCHA and tags all its own) and redirects to the block's
   thank-you URL.

   window.COAP_SITE.forms maps a designed form's data-kajabi-form key to its Kajabi form:
     { id: <Kajabi form id>, need: ['name','email'], own: true, done: 'message' }
   sel   a selector for forms that carry no data-kajabi-form in their markup
   need  fields that must be filled before it sends (default: email)
   own   the page has no submit handler of its own, so this script shows errors and the message
   done  the message shown after Kajabi redirects back with ?done=<key>

   After the redirect (?done=<key>), forms without `own` are replayed through the page's own
   handler, so the designed "You're in" state shows exactly as in the mock.
   Field mapping: email input -> email, textarea -> custom_2 (How can we help?), name input -> name. */
(function () {
  var C = window.COAP_SITE || {}, F = C.forms || {}, d = document, SK = 'coap-kjb', bypass = false;
  var RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var MAP = { name: 'form_submission[name]', email: 'form_submission[email]', message: 'form_submission[custom_2]' };

  /* forms tagged by selector instead of in their markup (the workshop page's two .sf forms) */
  Object.keys(F).forEach(function (k) { if (F[k].sel) [].forEach.call(d.querySelectorAll(F[k].sel), function (f) { if (!f.hasAttribute('data-kajabi-form')) f.setAttribute('data-kajabi-form', k); }); });

  function nat(key) { var c = F[key]; return c ? d.querySelector('form[action*="/forms/' + c.id + '/"]') : null; }
  function kind(i) {
    var h = ((i.name || '') + ' ' + (i.getAttribute('autocomplete') || '') + ' ' + (i.id || '')).toLowerCase();
    if (i.type === 'email' || /email/.test(h)) return 'email';
    if (i.tagName === 'TEXTAREA' || /message|msg/.test(h)) return 'message';
    if (/name/.test(h)) return 'name';
    return null;
  }
  function inputs(f) { return [].filter.call(f.querySelectorAll('input,textarea'), function (i) { return i.type !== 'hidden' && i.type !== 'submit' && kind(i); }); }
  function values(f) { var o = {}; inputs(f).forEach(function (i) { o[kind(i)] = i.value.trim(); }); return o; }
  function firstBad(f, key) {
    var need = F[key].need || ['email'], v = values(f), bad = null;
    inputs(f).forEach(function (i) {
      var k = kind(i), b = need.indexOf(k) > -1 && (!v[k] || (k === 'email' && !RE.test(v[k])));
      if (F[key].own) i.classList.toggle('bad', b);
      if (b && !bad) bad = i;
    });
    return bad;
  }

  d.addEventListener('submit', function (e) {
    if (bypass) return;
    var f = e.target, key = f && f.getAttribute && f.getAttribute('data-kajabi-form');
    if (!key || !F[key]) return;
    var n = nat(key), own = !!F[key].own;
    if (own) e.preventDefault();
    if (!n) return;                                   /* no native block on this page: leave it to the page */
    var bad = firstBad(f, key);
    if (bad) { if (own) bad.focus(); return; }        /* the page's own handler shows its errors */
    e.preventDefault(); e.stopImmediatePropagation();
    var v = values(f);
    for (var k in MAP) { var t = n.querySelector('[name="' + MAP[k] + '"]'); if (t && v[k] != null) t.value = v[k]; }
    try { sessionStorage.setItem(SK, JSON.stringify({ key: key, v: v })); } catch (x) {}
    var b = f.querySelector('[type=submit]');
    if (b) { b.disabled = true; f.setAttribute('aria-busy', 'true'); setTimeout(function () { b.disabled = false; f.removeAttribute('aria-busy'); }, 10000); }
    var s = n.querySelector('[type=submit]');
    if (s) { s.disabled = false; s.click(); }   /* Kajabi disables its button after a submit: a retry must still go */ else if (n.requestSubmit) n.requestSubmit(); else n.submit();
  }, true);

  function replay() {
    var m = location.search.match(/[?&]done=([a-z-]+)/); if (!m || !F[m[1]]) return;
    var key = m[1], s = null;
    try { s = JSON.parse(sessionStorage.getItem(SK) || 'null'); sessionStorage.removeItem(SK); } catch (x) {}
    var v = (s && s.key === key) ? s.v : {};
    var f = d.querySelector('form[data-kajabi-form="' + key + '"]'); if (!f) return;
    if (F[key].own || F[key].done) {
      var p = d.createElement('p'); p.className = 'kjb-done'; p.setAttribute('role', 'status'); p.textContent = F[key].done || 'Thanks.';
      f.parentNode.replaceChild(p, f); p.scrollIntoView({ block: 'center' }); return;
    }
    inputs(f).forEach(function (i) { var k = kind(i); i.value = v[k] || (k === 'email' ? 'you@example.com' : ''); });
    bypass = true;
    try { f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); } finally { bypass = false; }
    inputs(f).forEach(function (i) { if (i.isConnected) i.value = ''; });
    var c = f.closest('[data-card]') || f.parentNode; if (c && c.scrollIntoView) c.scrollIntoView({ block: 'center' });
  }
  if (d.readyState === 'complete') setTimeout(replay, 0); else window.addEventListener('load', function () { setTimeout(replay, 0); });
})();
