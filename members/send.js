/* The send page: an ambassador (Steven) writes a Deep Dive or a Slider Sunday, it's built and published as a lesson in Learn (no approval step, Tom 16 Nov 2026).
   Lives in a hidden Kajabi lesson (the "Ambassadors" course) whose body is:
     <section class="ch-tut wd-page"><div data-coap-send data-endpoint="APPS SCRIPT URL" data-key="SEND_KEY from the Apps Script" data-author="Steven Wilson"></div></section>
   boot.js loads this file and members/coap-index.js when it sees [data-coap-send].
   Back end: ops/jobs/deep-dives/apps-script/Code.gs. The draft is made by the Claude routine (ops/jobs/deep-dives/ROUTINE.md). */
(function () {
  var d = document, root = d.querySelector('[data-coap-send]'); if (!root) return;
  var END = root.getAttribute('data-endpoint'), KEY = root.getAttribute('data-key') || root.getAttribute('data-coap-send') || '',   /* the key may sit on either attribute */ AUTHOR = root.getAttribute('data-author') || 'Steven Wilson';
  var INI = AUTHOR.split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
  var IX = window.COAP_INDEX || [], DRAFT = 'coap-wd-draft', LAST = 'coap-wd-last';
  function he(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) { return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9#]+/g, ' ').trim(); }
  function $(id) { return d.getElementById(id); }
  /* site.js is loaded first, so its icons are ready */
  function icons(el) { if (!window.COAP || !window.COAP.icon) return; [].forEach.call(el.querySelectorAll('[data-icon]'), function (i) { if (!i.firstChild) i.innerHTML = window.COAP.icon(i.getAttribute('data-icon')); }); }
  function get(q) { return fetch(END + '?' + q).then(function (r) { return r.json(); }); }
  /* text/plain keeps it a simple request, which Apps Script accepts from another site */
  function post(o) { return fetch(END, { method: 'POST', body: JSON.stringify(o) }).then(function (r) { return r.json(); }); }
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
                set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

  var link = d.createElement('link'); link.rel = 'stylesheet'; link.href = (window.COAP_CDN || 'https://coaponline.github.io/site-assets/') + 'members/send.css?v=' + Math.floor(Date.now() / 6e5); d.head.appendChild(link);

  root.innerHTML =
    '<div class="wd"><div class="wd-top"><h2 class="caps" style="font-size:clamp(44px,6vw,76px);line-height:.9;font-style:italic;font-weight:900;transform:skewX(-8deg);transform-origin:left bottom">Write a <em style="font:inherit;color:var(--gold-d)">deep dive</em></h2>' +
    '<div class="wd-me"><span class="wd-av" aria-hidden="true">' + he(INI) + '</span><span><b>' + he(AUTHOR) + '</b><i class="tier amb">Ambassador</i></span></div></div>' +
    '<div class="wd-cols"><div style="display:grid;gap:18px">' +
    '<form class="wd-form" id="wd-form" onsubmit="return false">' +
      '<div class="wd-f"><span class="wd-lb">Which one?</span><div class="wd-ser" role="radiogroup" aria-label="Which series">' +
        '<label><input type="radio" name="ser" value="dd" checked>Deep Dive Sunday <b id="wd-ndd">#</b></label>' +
        '<label><input type="radio" name="ser" value="ss">Slider Sunday <b id="wd-nss">#</b></label></div>' +
        '<p class="wd-help">The number fills itself in. <button type="button" class="tlink" id="wd-nch" style="background:none;border:0;padding:0;font:inherit;cursor:pointer">Change it</button></p>' +
        '<input class="wd-in" id="wd-no" type="number" min="1" max="999" hidden aria-label="Number"></div>' +
      '<div class="wd-f"><label for="wd-t">Title</label><input class="wd-in" id="wd-t" autocomplete="off" placeholder="For example: Point Color and range masks"></div>' +
      '<div class="wd-f"><label for="wd-x">Your post <small>Write it the way you always do</small></label><textarea class="wd-ta" id="wd-x" spellcheck="true" placeholder="Paste or write your post here."></textarea>' +
        '<p class="wd-help">Put each heading on its own line. Write "Refer to Image 3" where a photo goes, and the photo will sit right there in the lesson.</p><p class="wd-saved" id="wd-saved" aria-live="polite"></p></div>' +
      '<div class="wd-f"><span class="wd-lb">Photos <small id="wd-pc">No photos yet</small></span><ul class="wd-ph" id="wd-ph"></ul>' +
        '<label class="wd-drop" id="wd-drop"><input type="file" accept="image/*" multiple id="wd-file"><span>Drop your photos here, or click to choose them</span><small>Add them in order. Drag to change the order.</small></label>' +
        '<p class="wd-help">Photo 1 is the After and photo 2 the Before. Together they make the drag-across slider at the top of the lesson. You don\'t need to write "Image 1" on the photos.</p></div>' +
      '<div class="wd-f"><span class="wd-lb">Lessons it goes with <small>Every COAP lesson, deep dive and article</small></span><div class="wd-lsn" id="wd-lsn"></div>' +
        '<div class="wd-sug" id="wd-sug" hidden><span>Mentioned in your post:</span></div>' +
        '<div class="wd-cb"><i data-icon="search"></i><input class="wd-in" id="wd-la" type="search" role="combobox" aria-expanded="false" aria-controls="wd-res" aria-autocomplete="list" autocomplete="off" placeholder="Search ' + IX.length + ' lessons, deep dives and articles"><ul class="wd-res" id="wd-res" role="listbox" hidden></ul></div></div>' +
      '<p class="wd-err" id="wd-err" role="alert"></p>' +
      '<div class="wd-go"><button class="btn" type="button" id="wd-make"><i data-icon="upload"></i>Publish my deep dive</button>' +
        '<p>It goes live in Learn under Deep dives as soon as it\'s built, usually within ten minutes. If anything needs changing, edit your post and send it again: it updates the same lesson.</p></div>' +
    '</form>' +
    '<section class="wd-run" id="wd-run" aria-live="polite"><h2 class="caps">Building your deep dive</h2><p style="margin:0;font-size:16px">You can close this page. It\'ll be here when you come back.</p>' +
      '<ol class="wd-steps"><li>Sending your post and photos</li><li>Claude is sorting it into steps and placing the photos</li><li>Building the lesson in the COAP layout</li><li>Publishing it in Learn</li></ol></section>' +
    '<section class="wd-draft" id="wd-draft" aria-label="Your draft"></section>' +
    '<div class="wd-sent" id="wd-sent" role="status"></div>' +
    '</div><aside class="wd-side"><div class="wd-box"><h2 class="caps">Your posts</h2><ul class="wd-mine" id="wd-mine"><li class="none">Loading…</li></ul></div></aside></div></div>' +
    '<div class="wd-pv" id="wd-pv" role="dialog" aria-modal="true" aria-label="Your deep dive"><div class="wd-pv-bar"><span>Your deep dive, as members see it</span><button class="btn sm" type="button" id="wd-close">Close</button></div><iframe title="The draft lesson" src="about:blank" id="wd-if"></iframe></div>';
  icons(root);

  /* ---- numbers: one more than the highest so far in each series ---- */
  var mine = [], next = { dd: 25, ss: 2 };
  function setNo() {
    $('wd-ndd').textContent = '#' + next.dd; $('wd-nss').textContent = '#' + next.ss;
    var s = d.querySelector('input[name=ser]:checked').value; if ($('wd-no').hidden) $('wd-no').value = next[s];
  }
  d.querySelectorAll('input[name=ser]').forEach(function (r) { r.addEventListener('change', function () { $('wd-no').hidden = true; setNo(); }); });
  $('wd-nch').addEventListener('click', function () { $('wd-no').hidden = false; $('wd-no').focus(); });
  function drawMine() {
    $('wd-mine').innerHTML = mine.length ? mine.slice().reverse().map(function (p) {
      return '<li><a href="' + he(p.lessonId ? '/products/learning-resources/categories/2161117943/posts/' + p.lessonId : '#') + '">' + (p.cover ? '<img src="' + he(p.cover) + '" alt="">' : '<span></span>') +
        '<span><small>' + (p.series === 'ss' ? 'Slider Sunday #' : 'Deep Dive #') + p.no + '</small><b>' + he(p.card) + '</b><em>' + he(p.date || '') + '. <i class="' + (p.state === 'live' ? 'ok' : 'st') + '">' + (p.state === 'live' ? 'Live' : 'Draft') + '</i></em></span></a></li>';
    }).join('') : '<li class="none">Your deep dives will show here.</li>';
  }
  get('action=mine').then(function (r) {
    mine = (r && r.posts) || [];
    mine.forEach(function (p) { if (p.no >= next[p.series]) next[p.series] = p.no + 1; });
    drawMine(); setNo();
  }).catch(function () { $('wd-mine').innerHTML = '<li class="none">Couldn\'t load your posts just now.</li>'; setNo(); });

  /* ---- saved as he types ---- */
  var x = $('wd-x'), t = $('wd-t'), tm, sv = store.get(DRAFT);
  if (sv) { x.value = sv.x || ''; t.value = sv.t || ''; }
  function keep() { clearTimeout(tm); tm = setTimeout(function () { store.set(DRAFT, { x: x.value, t: t.value }); $('wd-saved').textContent = 'Saved on this computer'; }, 500); }
  x.addEventListener('input', keep); t.addEventListener('input', keep);

  /* ---- photos: resized here (2000px, JPEG) so they send quickly; drag to reorder ---- */
  var ph = $('wd-ph'), dragEl = null, shots = [];   /* shots[i] = data URL, in the order shown */
  function renumber() {
    shots = [];
    ph.querySelectorAll('li').forEach(function (el, i) {
      shots.push(el.getAttribute('data-src'));
      el.querySelector('b').textContent = i + 1;
      var tag = el.querySelector('i'); if (tag) tag.remove();
      if (i < 2) { var n = d.createElement('i'); n.className = i === 0 ? 'a' : ''; n.textContent = i === 0 ? 'After' : 'Before'; el.insertBefore(n, el.querySelector('.x')); }
    });
    $('wd-pc').textContent = shots.length ? shots.length + (shots.length === 1 ? ' photo' : ' photos') : 'No photos yet';
  }
  function shrink(file) {
    return new Promise(function (ok, bad) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var m = 2000, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, m / Math.max(w, h));
        var c = d.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        ok(c.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = function () { bad(new Error(file.name)); }; img.src = url;
    });
  }
  function add(files) {
    var list = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type); });
    list.sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
    Promise.all(list.map(shrink)).then(function (urls) {
      urls.forEach(function (u) {
        var li = d.createElement('li'); li.draggable = true; li.setAttribute('data-src', u);
        li.innerHTML = '<img alt="" src="' + u + '"><b></b><button type="button" class="x" aria-label="Remove this photo">&times;</button>';
        ph.appendChild(li);
      });
      renumber();
    }).catch(function (e) { $('wd-err').textContent = 'Couldn\'t read ' + e.message + '. Try saving it as a JPEG.'; });
  }
  ph.addEventListener('dragstart', function (e) { dragEl = e.target.closest('li'); if (dragEl) dragEl.classList.add('drag'); });
  ph.addEventListener('dragend', function () { if (dragEl) dragEl.classList.remove('drag'); ph.querySelectorAll('.over').forEach(function (o) { o.classList.remove('over'); }); dragEl = null; renumber(); });
  ph.addEventListener('dragover', function (e) { if (!dragEl) return; e.preventDefault(); var o = e.target.closest('li'); ph.querySelectorAll('.over').forEach(function (z) { if (z !== o) z.classList.remove('over'); }); if (o && o !== dragEl) { o.classList.add('over'); var r = o.getBoundingClientRect(); ph.insertBefore(dragEl, e.clientX < r.left + r.width / 2 ? o : o.nextSibling); } });
  ph.addEventListener('click', function (e) { var b = e.target.closest('.x'); if (b) { b.closest('li').remove(); renumber(); } });
  var drop = $('wd-drop');
  $('wd-file').addEventListener('change', function (e) { add(e.target.files); e.target.value = ''; });
  ['dragenter', 'dragover'].forEach(function (k) { drop.addEventListener(k, function (e) { if (e.dataTransfer && [].indexOf.call(e.dataTransfer.types, 'Files') > -1) { e.preventDefault(); drop.classList.add('on'); } }); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('on'); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); drop.classList.remove('on'); add(e.dataTransfer.files); });

  /* ---- lessons: search the index; suggest the ones named in the post ---- */
  var box = $('wd-lsn'), inp = $('wd-la'), res = $('wd-res'), sug = $('wd-sug'), hits = [], sel = -1, picked = [];
  function cls(k) { return k === 'Deep dive' ? 'dd' : k === 'Article' ? 'ar' : ''; }
  function has(it) { return picked.indexOf(it) > -1; }
  function drawPicked() {
    box.innerHTML = picked.map(function (it, i) { return '<span><em>' + he(it.k) + '</em><b>' + he(it.t) + '</b><button type="button" data-i="' + i + '" aria-label="Remove ' + he(it.t) + '">&times;</button><small>' + he(it.w) + '</small></span>'; }).join('');
    suggest();
  }
  function addIt(it) { if (!has(it)) { picked.push(it); drawPicked(); } }
  box.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { picked.splice(+b.getAttribute('data-i'), 1); drawPicked(); } });
  function find(q) {
    var w = norm(q).split(' ').filter(Boolean); if (!w.length) return [];
    var out = [];
    IX.forEach(function (it) {
      var tt = norm(it.t), all = tt + ' ' + norm(it.w + ' ' + it.a), sc = 0;
      for (var i = 0; i < w.length; i++) { if (all.indexOf(w[i]) < 0) return; sc += tt.indexOf(w[i]) > -1 ? (tt.indexOf(w[i]) === 0 ? 3 : 2) : 1; }
      sc += it.k === 'Lesson' ? 1 : 0; out.push([sc, it]);
    });
    return out.sort(function (a, b) { return b[0] - a[0]; }).slice(0, 8).map(function (z) { return z[1]; });
  }
  /* words are only letters, digits and # after norm(), so they're safe in a pattern */
  function mark(s, q) { var h = he(s); norm(q).split(' ').filter(function (z) { return z.length > 1; }).forEach(function (w) { h = h.replace(new RegExp('(' + w + ')', 'ig'), '<mark>$1</mark>'); }); return h; }
  function draw() {
    hits = find(inp.value); sel = hits.length ? 0 : -1;
    res.innerHTML = hits.length ? hits.map(function (it, i) { return '<li role="option" id="wd-o' + i + '" aria-selected="' + (i === sel) + '"><em class="' + cls(it.k) + '">' + he(it.k) + '</em><b>' + mark(it.t, inp.value) + '</b><small>' + he(it.w) + '</small></li>'; }).join('') : '<li class="none">Nothing called that. Try one word, like masking or noise.</li>';
    var open = inp.value.trim().length > 0; res.hidden = !open; inp.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (sel > -1) inp.setAttribute('aria-activedescendant', 'wd-o0'); else inp.removeAttribute('aria-activedescendant');
  }
  function pick(i) { if (hits[i]) { addIt(hits[i]); inp.value = ''; draw(); inp.focus(); } }
  inp.addEventListener('input', draw);
  inp.addEventListener('keydown', function (e) {
    if (res.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!hits.length) return; sel = (sel + (e.key === 'ArrowDown' ? 1 : hits.length - 1)) % hits.length; res.querySelectorAll('li').forEach(function (li, i) { li.setAttribute('aria-selected', i === sel); }); inp.setAttribute('aria-activedescendant', 'wd-o' + sel); res.children[sel].scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(sel); }
    else if (e.key === 'Escape') { inp.value = ''; draw(); }
  });
  res.addEventListener('mousedown', function (e) { var li = e.target.closest('li[role=option]'); if (li) { e.preventDefault(); pick([].indexOf.call(res.children, li)); } });
  d.addEventListener('click', function (e) { if (!e.target.closest('.wd-cb')) { res.hidden = true; inp.setAttribute('aria-expanded', 'false'); } });
  function suggest() {
    var tx = norm(x.value), found = IX.filter(function (it) { return it.k !== 'Article' && it.t.length > 14 && tx.indexOf(norm(it.t)) > -1 && norm(t.value).indexOf(norm(it.t)) < 0 && !has(it); }).slice(0, 4);
    sug.querySelectorAll('button').forEach(function (b) { b.remove(); });
    found.forEach(function (it) { var b = d.createElement('button'); b.type = 'button'; b.textContent = '+ ' + it.t; b.title = it.w; b.addEventListener('click', function () { addIt(it); }); sug.appendChild(b); });
    sug.hidden = !found.length;
  }
  var st; x.addEventListener('input', function () { clearTimeout(st); st = setTimeout(suggest, 600); }); suggest();

  /* ---- send, then wait for the draft ---- */
  var run = $('wd-run'), steps = run.querySelectorAll('li'), poll;
  function stepTo(i) { steps.forEach(function (s, j) { s.className = j < i ? 'done' : j === i ? 'now' : ''; }); }
  function waiting(id) {
    $('wd-form').hidden = true; run.classList.add('on'); stepTo(1);
    var n = 0;
    clearInterval(poll);
    poll = setInterval(function () {
      n++; if (n === 4) stepTo(2); if (n === 9) stepTo(3);
      get('action=status&id=' + encodeURIComponent(id)).then(function (r) {
        var s = r && r.status; if (!s) return;
        if (s.state === 'live' || s.state === 'ready' || s.state === 'checked' || s.state === 'changes') { clearInterval(poll); run.classList.remove('on'); showDraft(s); }
        if (s.state === 'failed') { clearInterval(poll); run.classList.remove('on'); $('wd-form').hidden = false; $('wd-err').textContent = 'It didn\'t work this time (' + (s.error || 'unknown') + '). Tom has been told. Your post is still here.'; store.set(LAST, null); }
      }).catch(function () {});
      if (n > 180) { clearInterval(poll); }   /* an hour: the email still arrives */
    }, 20000);
  }
  function showDraft(s) {
    var dr = $('wd-draft');
    dr.innerHTML = '<div class="wd-card">' + (s.previewUrl ? '<img src="' + he(s.previewUrl.replace(/preview\.html$/, '1.jpg')) + '" alt="">' : '') + '<div>' +
      '<p class="mtag"><b>' + (s.state === 'live' ? 'Live in Learn' : 'Draft ready') + '</b><span>#' + he(s.no) + '</span></p><h3 class="caps">' + he(s.card || s.title) + '</h3><ul class="wd-chk">' +
      (s.steps ? '<li>' + s.steps.length + ' steps, from your headings: ' + he(s.steps.join(', ')) + '</li>' : '') +
      (s.photos ? '<li>' + s.photos + ' photos placed</li>' : '') +
      (s.lessons && s.lessons.length ? '<li>' + s.lessons.length + ' lesson' + (s.lessons.length > 1 ? 's' : '') + ' linked: ' + he(s.lessons.join(', ')) + '</li>' : '') +
      (s.flags || []).map(function (f) { return '<li class="q">' + he(f) + '</li>'; }).join('') + '</ul>' +
      '<div class="wd-btns"><button class="btn" type="button" id="wd-open"><i data-icon="ext"></i>See how it looks</button><button class="btn ghost" type="button" id="wd-edit">Change something</button></div></div></div>' +
      (s.kolab ? '<div class="wd-kolab"><b>For The Merge on Kōlab</b><p>' + he(s.kolab) + '</p><div class="wd-btns"><button class="btn sm ghost" type="button" id="wd-copy">Copy the text</button></div></div>' : '') +
      '<div id="wd-chg" hidden style="display:grid;gap:10px"><label class="wd-lb" for="wd-nt">What should change?</label><textarea class="wd-note" id="wd-nt" placeholder="For example: step 2 should come before step 1, and photo 5 is the wrong one."></textarea>' +
      '<div class="wd-btns"><button class="btn" type="button" id="wd-snd">Send to Tom</button><button class="btn ghost" type="button" id="wd-fix">Edit my post and send it again</button></div></div>' +
      '<div class="wd-go" id="wd-ok"><button class="btn" type="button" id="wd-send"><i data-icon="check"></i>Looks right, send it to Tom and Rich</button><p>They get an email and publish it.</p></div>';
    dr.classList.add('on'); icons(dr);
    if (s.state === 'live') $('wd-ok').hidden = true;   /* published already: nothing to approve */
    $('wd-open').onclick = function () { $('wd-if').src = s.previewUrl; $('wd-pv').classList.add('on'); };
    $('wd-edit').onclick = function () { $('wd-chg').hidden = false; $('wd-ok').hidden = true; $('wd-nt').focus(); };
    $('wd-fix').onclick = function () { dr.classList.remove('on'); $('wd-form').hidden = false; store.set(LAST, null); };
    if ($('wd-copy')) $('wd-copy').onclick = function (e) { try { navigator.clipboard.writeText(s.kolab); e.target.textContent = 'Copied'; } catch (er) {} };
    function checked(note) {
      post({ action: 'checked', id: s.id, note: note || '' }).then(function (r) {
        if (!r.ok) throw new Error(r.error);
        dr.classList.remove('on'); store.set(LAST, null);
        $('wd-sent').innerHTML = note ? '<b>Sent to Tom</b>He\'ll make the change, or send it back to you.' : '<b>With Tom and Rich</b>They\'ll publish it and let you know. It shows in Learn under Deep dives.';
        $('wd-sent').classList.add('on');
      }).catch(function (e) { alertBox(e.message); });
    }
    $('wd-send').onclick = function () { checked(''); };
    $('wd-snd').onclick = function () { var v = $('wd-nt').value.trim(); if (v) checked(v); };
  }
  function alertBox(m) { var p = d.createElement('p'); p.className = 'wd-err'; p.textContent = m; $('wd-draft').prepend(p); }
  $('wd-close').addEventListener('click', function () { $('wd-pv').classList.remove('on'); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('wd-pv').classList.remove('on'); });

  $('wd-make').addEventListener('click', function () {
    var err = $('wd-err'); err.textContent = '';
    if (!t.value.trim()) { err.textContent = 'Give it a title first.'; t.focus(); return; }
    if (x.value.trim().length < 80) { err.textContent = 'Your post looks very short. Paste the whole thing in.'; x.focus(); return; }
    if (!shots.length) { err.textContent = 'Add your photos first.'; return; }
    var b = $('wd-make'); b.disabled = true; b.lastChild.textContent = 'Sending…';
    run.classList.add('on'); $('wd-form').hidden = true; stepTo(0);
    post({ action: 'send', key: KEY, series: d.querySelector('input[name=ser]:checked').value, no: +$('wd-no').value, title: t.value.trim(), text: x.value,
           author: AUTHOR, lessons: picked.map(function (it) { return { t: it.t, w: it.w, u: it.u }; }), photos: shots })
      .then(function (r) {
        b.disabled = false; b.lastChild.textContent = 'Publish my deep dive';
        if (!r.ok) throw new Error(r.error || 'not sent');
        store.set(LAST, r.id); store.set(DRAFT, null); waiting(r.id);
      })
      .catch(function (e) { b.disabled = false; b.lastChild.textContent = 'Publish my deep dive'; run.classList.remove('on'); $('wd-form').hidden = false; err.textContent = 'It didn\'t send: ' + e.message + ' Your post is still here, so try again in a minute.'; });
  });

  /* came back to the page while a draft was being made */
  var last = store.get(LAST); if (last) waiting(last);
})();
