/* COAP new look on Kajabi's OWN member pages: course front pages, modules, lessons (and later the library and login).
   Loaded only when the switch is on in this browser (see members/loader.js, pasted into each theme's script box).
   Kajabi still draws every page. This script reads what Kajabi drew, rebuilds it in the mock's layout
   (learn.html, course.html, lesson.html in the site mock) and moves Kajabi's own working parts into it:
   the video player, Complete, downloads and the comments. Kajabi's own styles are switched off on these pages.
   If anything fails, the page is put back exactly as Kajabi drew it. */
(function () {
  'use strict';
  var d = document, html = d.documentElement;
  var CDN = 'https://coaponline.github.io/site-assets/';
  var VER = Math.floor(Date.now() / 6e5);          /* changes every 10 minutes, like GitHub Pages' cache */
  function uncloak() { var c = d.getElementById('coap-nl-cloak'); if (c) c.parentNode.removeChild(c); }

  /* ---------- which page is this ---------- */
  var P = location.pathname.replace(/\/+$/, '') || '/', m, kind = null, prod = null, catId = null, postId = null;
  if ((m = P.match(/^\/products\/([^/]+)(?:\/categories\/(\d+)(?:\/posts\/(\d+))?)?$/)) && m[1] !== 'communities') {
    prod = m[1]; catId = m[2] || null; postId = m[3] || null;
    kind = postId ? 'lesson' : catId ? 'module' : 'course';
  }
  else if (P === '/library') kind = 'library';
  else if (P === '/login') kind = 'login';
  if (!kind) { uncloak(); return; }
  var LR = prod === 'learning-resources';          /* the Lessons course: its modules are grouped under the mock's shelves */

  /* ---------- names: what the site says now (site/map.html, "Old name, new name") ---------- */
  var RENAME = {
    'Learning Resources': 'Lessons', 'Edit Like A Pro': 'Lightroom masterclass', 'Create Like A Boss': 'Photoshop masterclass',
    'Showcase Like An Expert': 'The Portfolio Series', 'Write Like A Hero': 'Writing', 'Shoot Like An Ace': 'Shoot Like An Ace',
    'Live Workshop Replays': 'Live workshop replays', 'Light The Burners Blueprint': 'Guides and cheatsheets'
  };
  var SHELVES = [['shoot', 'Shoot it', /shoot/i], ['edit', 'Edit it', /edit like|create like/i], ['show', 'Show it', /showcase|write like/i], ['more', 'More', /[\s\S]/]];
  function nm(t) {
    t = (t || '').replace(/\s+/g, ' ').trim();
    if (RENAME[t]) return RENAME[t];
    var mm = t.match(/^Module\s*(\d+)\s*[-–—:]\s*(.+)$/i);
    return mm ? mm[1] + '. ' + mm[2].trim() : t;
  }
  function shelfOf(title) { for (var i = 0; i < SHELVES.length; i++) if (SHELVES[i][2].test(title)) return SHELVES[i]; return SHELVES[3]; }

  /* ---------- small helpers ---------- */
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
  /* text only, without the hidden titles inside Kajabi's SVG icons ("video lesson icon ... Created with Sketch.") */
  function txt(e) {
    if (!e) return '';
    var t = '', w = d.createTreeWalker(e, 4, null), n;
    while ((n = w.nextNode())) if (!(n.parentNode && n.parentNode.closest && n.parentNode.closest('svg,style,script'))) t += n.nodeValue + ' ';
    return t.replace(/\s+/g, ' ').trim();
  }
  function rel(h) { return (h || '').replace(/^https?:\/\/[^/]+/, ''); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function idOf(h, k) { var r = (h || '').match(new RegExp(k + '/(\\d+)')); return r ? r[1] : null; }
  function pct(e) { var r = e && (e.className || '').match(/progress-icon-(\d+)/); return r ? +r[1] : 0; }
  function addCSS(href) {
    return new Promise(function (ok) {
      var l = d.createElement('link'); l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-coap', '');
      l.onload = l.onerror = function () { ok(); }; d.head.appendChild(l); setTimeout(ok, 4000);
    });
  }
  function addJS(src) {
    return new Promise(function (ok) { var s = d.createElement('script'); s.src = src; s.onload = s.onerror = function () { ok(); }; d.head.appendChild(s); });
  }

  /* ---------- Kajabi's outline (the sidebar on every course page): categories, sub-categories, lessons ---------- */
  function outline() {
    var o = $('.product-outline'), cats = [], c = null, s = null, all = [];
    if (!o) return { cats: cats, posts: all };
    [].forEach.call(o.children, function (e) {
      if (e.matches('h3.product-outline-category')) {
        var a = $('a', e); c = { title: txt(e), href: a ? rel(a.getAttribute('href')) : null, id: a ? idOf(a.getAttribute('href'), 'categories') : null, subs: [], posts: [] };
        s = null; cats.push(c);
      } else if (e.matches('h3.product-outline-subcategory')) {
        var b = $('a', e); s = { title: txt(e), href: b ? rel(b.getAttribute('href')) : null, id: b ? idOf(b.getAttribute('href'), 'categories') : null, posts: [], parent: c };
        if (c) c.subs.push(s);
      } else if (e.matches('a.product-outline-post')) {
        var h = e.getAttribute('href'), p = { title: txt(e), href: rel(h), id: idOf(h, 'posts'), cat: c, sub: s };
        if (c) c.posts.push(p); if (s) s.posts.push(p); all.push(p);
      }
    });
    return { cats: cats, posts: all };
  }
  function findCat(o, id) {
    for (var i = 0; i < o.cats.length; i++) {
      var c = o.cats[i]; if (c.id === id) return { cat: c, sub: null };
      for (var j = 0; j < c.subs.length; j++) if (c.subs[j].id === id) return { cat: c, sub: c.subs[j] };
    }
    return { cat: null, sub: null };
  }

  /* ---------- the outline column (learn.html / course.html / lesson.html: .el-side) ---------- */
  function sideHTML(o, here, home, title) {
    var h = '<details class="el-side" open><summary>' + esc(title) + '</summary><nav class="el-out" aria-label="Every shelf and module">' +
      '<a class="home" href="' + esc(home) + '"' + (kind === 'course' ? ' aria-current="page"' : '') + '><i data-icon="grid"></i>All lessons</a>';
    function item(c) {
      var open = here.cat === c;
      if (c.subs.length) {
        return '<details' + (open ? ' open' : '') + '><summary>' + esc(nm(c.title)) + '<small>' + c.posts.length + '</small></summary><div>' +
          '<a href="' + esc(c.href) + '"' + (open && !here.sub && !here.post ? ' aria-current="page"' : '') + '>Everything in ' + esc(nm(c.title)) + '</a>' +
          c.subs.map(function (s) {
            var cur = here.sub === s;
            return '<a href="' + esc(s.href) + '"' + (cur && !here.post ? ' aria-current="page"' : '') + '>' + esc(nm(s.title)) + '<small>' + s.posts.length + '</small></a>' +
              (cur && here.post ? lessons(s.posts) : '');
          }).join('') + '</div></details>';
      }
      if (open && here.post && c.posts.length <= 60) {
        return '<details open><summary>' + esc(nm(c.title)) + '<small>' + c.posts.length + '</small></summary>' + lessons(c.posts) + '</details>';
      }
      return '<a href="' + esc(c.href) + '"' + (open && !here.post ? ' aria-current="page"' : '') + '>' + esc(nm(c.title)) + '<small>' + c.posts.length + '</small></a>';
    }
    function lessons(ps) {
      return '<div class="el-ls">' + ps.map(function (p) {
        return '<a href="' + esc(p.href) + '"' + (p === here.post ? ' aria-current="page"' : '') + '><span>' + esc(p.title) + '</span></a>';
      }).join('') + '</div>';
    }
    if (LR) {
      var used = [];
      SHELVES.forEach(function (sh) {
        var list = o.cats.filter(function (c) { return used.indexOf(c) < 0 && sh[2].test(c.title); });
        if (!list.length) return; list.forEach(function (c) { used.push(c); });
        h += '<h3>' + sh[1] + '</h3>' + list.map(item).join('');
      });
    } else {
      h += '<h3>In this course</h3>' + o.cats.map(item).join('');
    }
    return h + '</nav></details>';
  }

  /* ---------- course front page: learn.html (photo header, shelf buttons, one shelf at a time, Carry on rail) ---------- */
  function fetchDoc(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (t) { return new DOMParser().parseFromString(t, 'text/html'); }).catch(function () { return null; });
  }
  function catData(doc) {
    if (!doc) return { done: 0, total: 0, items: [] };
    var st = txt($('.category-progress-stats', doc)).match(/(\d+)\s*\/\s*(\d+)/);
    return {
      done: st ? +st[1] : 0, total: st ? +st[2] : 0,
      items: $$('.category-outline > a.category-post', doc).map(function (a) {
        var h = a.getAttribute('href'), i = $('img', a);
        return { href: rel(h), isSub: !/\/posts\//.test(h), title: txt($('.category-post-title', a)), img: i ? i.getAttribute('src') : '', p: pct($('.progress-icon', a)) };
      })
    };
  }
  var LSHELVES = [['shoot', 'Shoot it', /shoot/i], ['edit', 'Edit it', /edit like|create like/i], ['show', 'Show it', /showcase|write like/i], ['replays', 'Replays', /replay/i], ['guides', 'Guides', /[\s\S]/]];
  function stateText(done, total) { return !done ? 'Not started' : done >= total ? 'Watched' : done + ' of ' + total; }
  function coursePage(o, prodTitle) {
    var sub = txt($('.dashboard-welcome-subtitle')), all = +((sub.match(/(\d+)\s*%/) || [0, 0])[1]);
    var resume = $('a.dashboard-welcome-btn'), rhref = resume ? rel(resume.getAttribute('href')) : '';
    var cimg = {}; $$('a.category').forEach(function (a) { var i = $('img', a); cimg[idOf(a.getAttribute('href'), 'categories')] = i ? i.getAttribute('src') : ''; });
    return Promise.all(o.cats.map(function (c) { return c.href ? fetchDoc(c.href) : Promise.resolve(null); })).then(function (docs) {
      var data = {}, imgOf = {};
      o.cats.forEach(function (c, i) { data[c.id] = catData(docs[i]); data[c.id].items.forEach(function (x) { imgOf[x.href] = x; }); });
      var bar = function (done, total) { var w = total ? Math.round(done / total * 100) : 0; return '<span class="p"><span class="el-bar"><i style="width:' + w + '%"></i></span>' + stateText(done, total) + '</span>'; };
      var card = function (href, img, title, m, p) {
        return '<a class="ln-c" href="' + esc(href) + '"><figure class="el-ph">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '') +
          (p >= 100 ? '<span class="el-tick done"><span class="vh">Watched</span></span>' : '') + '</figure>' +
          '<span class="pad"><b>' + esc(title) + '</b>' + (m ? '<span class="m">' + esc(m) + '</span>' : '') + (p > 0 && p < 100 ? '<span class="p"><span class="el-bar"><i style="width:' + p + '%"></i></span>In progress</span>' : '') + '</span></a>';
      };
      var shelves = [], used = [];
      (LR ? LSHELVES : [['modules', 'In this course', /[\s\S]/]]).forEach(function (sh) {
        var list = o.cats.filter(function (c) { return used.indexOf(c) < 0 && sh[2].test(c.title); });
        if (list.length) { list.forEach(function (c) { used.push(c); }); shelves.push({ key: sh[0], title: sh[1], cats: list }); }
      });
      var sec = shelves.map(function (sh) {
        var n = sh.cats.reduce(function (t, c) { return t + c.posts.length; }, 0), body = '', note = n + ' lesson' + (n === 1 ? '' : 's');
        if (sh.key === 'edit') {
          note = n + ' lessons in ' + (sh.cats.length === 2 ? 'two courses' : sh.cats.length + ' courses');
          body = '<div class="ln-wide">' + sh.cats.map(function (c) {
            var dd = data[c.id];
            return '<div class="ln-m"><figure class="el-ph">' + (cimg[c.id] ? '<img src="' + esc(cimg[c.id]) + '" alt="" loading="lazy">' : '') + '</figure><div class="pad">' +
              '<h3 class="caps"><a href="' + esc(c.href) + '">' + esc(nm(c.title)) + '</a></h3><span class="m">' + c.posts.length + ' lessons' + (c.subs.length ? ' in ' + c.subs.length + ' parts' : '') + '.</span>' +
              bar(dd.done, dd.total || c.posts.length) +
              (c.subs.length ? '<ol>' + c.subs.map(function (s) {
                var x = imgOf[s.href] || {};
                return '<li><a href="' + esc(s.href) + '"><span class="el-tick' + (x.p >= 100 ? ' done' : '') + '"></span>' + esc(nm(s.title)) + '<small>' + s.posts.length + '</small></a></li>';
              }).join('') + '</ol>' : '') + '</div></div>';
          }).join('') + '</div>';
        } else {
          var cards = [];
          sh.cats.forEach(function (c) {
            if (c.subs.length) c.subs.forEach(function (s) { var x = imgOf[s.href] || {}; cards.push(card(s.href, x.img || cimg[c.id], nm(s.title), s.posts.length + ' ' + (sh.key === 'replays' ? 'replays' : 'lessons'), x.p || 0)); });
            else if (sh.key === 'shoot') data[c.id].items.filter(function (x) { return !x.isSub; }).forEach(function (x) { cards.push(card(x.href, x.img, x.title, '', x.p)); });
            else { var dd = data[c.id]; cards.push(card(c.href, cimg[c.id], nm(c.title), c.posts.length + ' ' + (/podcast/i.test(c.title) ? 'episodes' : /burner|guide/i.test(c.title) ? 'downloads' : 'lessons'), dd.total ? Math.round(dd.done / dd.total * 100) : 0)); }
          });
          if (sh.key === 'replays') note = sh.cats.reduce(function (t, c) { return t + c.posts.length; }, 0) + ' replays';
          body = '<div class="ln-cards">' + cards.join('') + '</div>';
        }
        return '<section id="' + sh.key + '" aria-labelledby="ln-' + sh.key + '-t"><div class="ln-h"><h2 class="caps" id="ln-' + sh.key + '-t">' + esc(sh.title) + '</h2><p>' + esc(note) + '</p></div>' + body + '</section>';
      }).join('');
      var doors = shelves.length > 1 ? '<div class="ln-pick"><h2 class="caps" id="ln-pick-t">Browse the learning</h2><p>Pick one to see what\'s in it.</p></div><nav class="ln-doors" aria-labelledby="ln-pick-t">' + shelves.map(function (sh) {
        var c = sh.cats[0], n = sh.cats.reduce(function (t, x) { return t + x.posts.length; }, 0);
        return '<a href="#' + sh.key + '" data-shelf="' + sh.key + '">' + (cimg[c.id] ? '<img src="' + esc(cimg[c.id]) + '" alt="" loading="lazy">' : '') + '<span><b>' + esc(sh.title) + '</b><small>' + n + ' ' + (sh.key === 'replays' ? 'replays' : 'lessons') + '</small></span></a>';
      }).join('') + '</nav>' : '';
      var rp = o.posts.filter(function (p) { return p.href === rhref; })[0], rx = imgOf[rhref] || {};
      var go = resume ? '<a class="ln-go el-dark" href="' + esc(rhref) + '" id="resume"><figure class="el-ph">' + (rx.img ? '<img src="' + esc(rx.img) + '" alt="">' : '') + '</figure>' +
        '<span class="tx"><span class="kick">' + (all ? 'Carry on where you stopped' : 'Start here') + '</span><b>' + esc(rp ? rp.title : 'Your next lesson') + '</b>' +
        (rp ? '<span class="m">' + esc(nm((rp.sub || rp.cat || {}).title || '')) + '</span>' : '') +
        '<span class="row"><span class="el-bar"><i style="width:' + all + '%"></i></span>' + all + '% of ' + (LR ? 'the library' : 'this course') + ' watched</span>' +
        '<span class="btn sm"><i data-icon="play"></i>' + (all ? 'Carry on' : 'Start') + '</span></span></a>' : '';
      var first = o.cats[0];
      var lib = first ? '<div class="ln-lib"><h2 class="caps">' + (LR ? 'The full library' : 'Every lesson') + '</h2><p>All ' + o.posts.length + ' lessons, by ' + (LR ? 'course and ' : '') + 'module, with what you\'ve watched ticked off.</p><a class="btn dark sm" href="' + esc(first.href) + '"><i data-icon="grid"></i>' + (LR ? 'Open the library' : 'See every lesson') + '</a></div>' : '';
      var hero = LR ? '<section class="mh"><div class="mh-sky" aria-hidden="true"></div><img class="mh-ph" src="' + CDN + 'assets/shoot-f16.webp" alt="" fetchpriority="high"><div class="mh-in"><div class="mh-tx">' +
          '<p class="mtag"><b>Learn</b><span>Lessons and replays</span></p><h1 class="caps">Learn to shoot it, <em>edit it and show it</em></h1>' +
          '<p class="mh-sub">Masterclasses, Lightroom and Photoshop from Rich and Tom, plus every live replay.</p></div></div></section>'
        : '<section class="mh"><div class="mh-sky" aria-hidden="true"></div>' + (cimg[(o.cats[0] || {}).id] ? '<img class="mh-ph" src="' + esc(cimg[o.cats[0].id]) + '" alt="">' : '') + '<div class="mh-in"><div class="mh-tx"><p class="mtag"><b>Learn</b><span>' + o.posts.length + ' lessons</span></p><h1 class="caps">' + esc(nm(prodTitle)) + '</h1></div></div></section>';
      return hero + '<div class="el"><div class="el-main"><div class="ln-cols"><div class="ln-colmain">' + doors + sec + '</div><aside class="ln-rail" aria-label="Your lessons">' + go + lib + '</aside></div></div></div>';
    });
  }
  function shelvesOneAtATime(main) {
    var ids = $$('.ln-colmain > section[id]', main).map(function (s) { return s.id; }); if (ids.length < 2) return;
    function show(id, jump) {
      if (ids.indexOf(id) < 0) id = ids[0];
      ids.forEach(function (x) { var el = d.getElementById(x); if (el) el.hidden = x !== id; });
      $$('[data-shelf]', main).forEach(function (a) { if (a.getAttribute('data-shelf') === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      if (jump) { var dr = $('.ln-doors', main); if (dr) dr.scrollIntoView({ block: 'start' }); }
    }
    main.addEventListener('click', function (e) { var a = e.target.closest ? e.target.closest('[data-shelf]') : null; if (a) { e.preventDefault(); history.replaceState(null, '', '#' + a.getAttribute('data-shelf')); show(a.getAttribute('data-shelf')); } });
    show(location.hash.slice(1), !!location.hash);
  }

  /* ---------- a module (Kajabi category or sub-category): course.html ---------- */
  function modulePage(o, here) {
    var title = txt($('.category-banner-title')) || (here.sub || here.cat || {}).title || '';
    var bimg = $('img.category-banner-img'), stats = txt($('.category-progress-stats'));
    var st = stats.match(/(\d+)\s*\/\s*(\d+)/), done = st ? +st[1] : 0, total = st ? +st[2] : 0;
    var items = $$('.category-outline > a.category-post').map(function (a) {
      var h = a.getAttribute('href'), i = $('img', a);
      return { href: rel(h), isSub: !/\/posts\//.test(h), title: txt($('.category-post-title', a)), img: i ? i.getAttribute('src') : '', p: pct($('.progress-icon', a)) };
    });
    var lessons = items.filter(function (x) { return !x.isSub; }), subs = items.filter(function (x) { return x.isSub; });
    var next = lessons.filter(function (x) { return x.p < 100; })[0] || lessons[0];
    var kick = '';
    if (here.sub) {
      var k = here.cat.subs.indexOf(here.sub);
      kick = (LR ? shelfOf(here.cat.title)[1] + '. ' : '') + nm(here.cat.title) + ', part ' + (k + 1) + ' of ' + here.cat.subs.length + '.';
    } else if (here.cat) kick = LR ? shelfOf(here.cat.title)[1] + '.' : '';
    var w = total ? Math.round(done / total * 100) : 0;
    var h = '<div class="cs-top" id="module"><div class="tx">' + (kick ? '<span class="kick">' + esc(kick) + '</span>' : '') +
      '<h1 class="caps">' + esc(nm(title)) + '</h1>' +
      (total ? '<span class="row"><span class="el-bar"><i style="width:' + w + '%"></i></span>' + done + ' of ' + total + ' watched</span>' : '') +
      (next ? '<a class="btn" href="' + esc(next.href) + '"><i data-icon="play"></i>' + (done ? 'Carry on' : 'Start') + '</a>' : '') +
      '</div>' + (bimg ? '<figure class="el-ph"><img src="' + esc(bimg.getAttribute('src')) + '" alt=""></figure>' : '') + '</div>';
    if (subs.length) {
      h += '<ol class="cs-list" aria-label="Parts of ' + esc(nm(title)) + '">' + subs.map(function (x) {
        var s = (here.cat ? here.cat.subs : []).filter(function (y) { return y.href === x.href; })[0];
        var n = s ? s.posts.length : 0;
        return '<li><a href="' + esc(x.href) + '"><span class="el-tick' + (x.p >= 100 ? ' done' : '') + '"><span class="vh">' + (x.p >= 100 ? 'Watched' : 'Not finished yet') + '</span></span>' +
          '<figure class="el-ph">' + (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy">' : '') + '</figure>' +
          '<span><b>' + esc(nm(x.title)) + '</b><small>' + (n ? n + ' lessons' : '') + '</small></span></a></li>';
      }).join('') + '</ol>';
    }
    var loose = here.cat && here.cat.subs.length && !here.sub ? lessons.filter(function (x) {
      var p = o.posts.filter(function (y) { return y.href === x.href; })[0]; return !p || !p.sub;
    }) : lessons;
    if (loose.length) {
      h += '<ol class="cs-list" aria-label="Lessons in ' + esc(nm(title)) + '">' + loose.map(function (x, i) {
        var now = x === next && done > 0;
        return '<li' + (now ? ' class="now"' : '') + '><a href="' + esc(x.href) + '"><span class="el-tick' + (x.p >= 100 ? ' done' : '') + '"><span class="vh">' + (x.p >= 100 ? 'Watched' : 'Not watched yet') + '</span></span>' +
          '<figure class="el-ph">' + (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy">' : '') + '</figure>' +
          '<span><b>' + esc(x.title) + '</b><small>' + (now ? 'Carry on here' : 'Lesson ' + (i + 1)) + '</small></span></a></li>';
      }).join('') + '</ol>';
    }
    /* next part of the same course */
    if (here.sub) {
      var nx = here.cat.subs[here.cat.subs.indexOf(here.sub) + 1];
      if (nx) h += '<a class="cs-next" href="' + esc(nx.href) + '"><span><small>Next part</small><b>' + esc(nm(nx.title)) + '</b><span>' + nx.posts.length + ' lessons</span></span><i data-icon="next"></i></a>';
    }
    return h;
  }

  /* ---------- a lesson: lesson.html ---------- */
  function lessonPage(o, here, parts) {
    var title = txt($('.post-body-title')) || (here.post || {}).title || '';
    var dur = txt($('.post-actions-duration')) || ((txt($('.post-actions')).match(/\d+\s+minutes?/) || [''])[0]);
    var group = here.sub || here.cat, list = group ? group.posts : [], i = list.indexOf(here.post);
    var where = group ? 'Lesson ' + (i + 1) + ' of ' + list.length + ' in ' + nm(group.title) + '.' : '';
    var flat = o.posts, fi = flat.indexOf(here.post);
    var pg = $$('.post-actions-pagination a');
    var prevA = pg.filter(function (a) { return $('.fa-angle-left', a); })[0], nextA = pg.filter(function (a) { return $('.fa-angle-right', a); })[0];
    var prev = fi > 0 ? flat[fi - 1] : null, next = fi > -1 ? flat[fi + 1] : null;
    var h = '';
    if (parts.video) h += '<div class="el-ph ls-video kv" id="lesson" data-kjb-slot="video"></div>';
    h += '<div class="ls-head"><h1 class="caps">' + esc(title) + '</h1><div class="row">' +
      '<div class="person"><div><b>' + esc(group ? nm(group.title) : '') + '</b><span>' + esc([dur ? dur.replace(/^(\d+) minutes?$/, '$1 min') + '.' : '', where].join(' ').trim()) + '</span></div></div>' +
      '<span data-kjb-slot="done"></span></div></div>';
    h += '<div class="ls-desc ls-rich" data-kjb-slot="body"></div>';
    var dl = parts.downloads.map(function (a) {
      return '<a class="ls-chip" href="' + esc(a.getAttribute('href')) + '" target="_blank" rel="noopener"><i data-icon="print"></i>' + esc(txt(a) || 'Download') + '</a>';
    }).join('');
    var pv = (prevA || prev) ? '<a href="' + esc(prevA ? rel(prevA.getAttribute('href')) : prev.href) + '"><i data-icon="prev"></i><span><small>Previous</small><b>' + esc(prev ? prev.title : 'Previous lesson') + '</b></span></a>' : '<span></span>';
    var nv = (nextA || next) ? '<a class="nx" href="' + esc(nextA ? rel(nextA.getAttribute('href')) : next.href) + '"><span><small>Next</small><b>' + esc(next ? next.title : 'Next lesson') + '</b></span><i data-icon="next"></i></a>' : '';
    h += '<div class="ls-bar">' + (dl ? '<div class="ls-dls">' + dl + '</div>' : '<span></span>') + '<nav class="ls-pn2" aria-label="Previous and next lesson">' + pv + nv + '</nav></div>';
    if (parts.comments) h += '<section class="ls-com" id="comments" aria-labelledby="ls-com-t"><h2 class="caps" id="ls-com-t">Questions on this lesson</h2><div data-kjb-slot="comments"></div></section>';
    return h;
  }

  /* ---------- the library (Kajabi's /library, where every login lands): library.html ---------- */
  function libraryPage() {
    /* Kajabi lists what this person owns, 12 to a page: read every page */
    function grab(doc) {
      return $$('.product', doc).map(function (pr) {
        var a = $('.product__title', pr), l = a && a.closest('a'), i = $('.product__image img', pr), bar = $('.progress__inner', pr);
        return { title: txt(a), href: l ? rel(l.getAttribute('href')) : '', img: i ? i.getAttribute('src') : '', p: bar ? parseInt(bar.style.width, 10) || 0 : null };
      }).filter(function (x) { return x.href; });
    }
    var pages = $$('.pag a.pag__link').map(function (a) { return rel(a.getAttribute('href')); })
      .filter(function (h, i, arr) { return h && /page=\d+/.test(h) && arr.indexOf(h) === i && !/[?&]page=1\b/.test(h); });
    var member = fetch('/products/learning-resources', { credentials: 'same-origin' })
      .then(function (r) { return r.ok && /\/products\/learning-resources\/?$/.test(new URL(r.url).pathname); }).catch(function () { return false; });
    return Promise.all([member, Promise.all(pages.map(fetchDoc))]).then(function (res) {
      var isMember = res[0], items = grab(d), seen = {};
      res[1].forEach(function (doc) { if (doc) items = items.concat(grab(doc)); });
      items = items.filter(function (x) { if (seen[x.href]) return false; seen[x.href] = 1; return true; });
      if (!isMember) html.classList.add('lb-cust');
      var merge = '<a class="lb-merge" href="/products/communities/v2/coaponline/home"><img class="patch" src="' + CDN + 'assets/merge-patch.webp" alt="">' +
        '<span class="lb-addr"><i data-icon="people"></i>Members\' community</span><b>The Merge</b><span>Talk, shots, the challenge and High Roller.</span></a>';
      var h = '<div class="wrap"><div class="lb-top"><h1 class="caps">Your library</h1></div>';
      if (isMember) h += '<div id="doors" class="on" data-who="member"><div class="lb-doors on" data-who="member">' + merge + '</div></div>';
      h += '<section id="owned" aria-labelledby="lb-own-t"><h2 class="lb-k" id="lb-own-t">Everything you own</h2><ul class="lb-own on" data-who="member">' + items.map(function (x) {
        var short = x.title.match(/^Aviation Photography (.+?) (Masterclass|Fundamentals)$/i);
        var t = short ? short[1] : nm(x.title), small = x.p == null ? '' : x.p >= 100 ? 'Finished' : x.p > 0 ? x.p + '% watched' : 'Not started';
        if (short) small = short[2] + (small ? '. ' + small : '');
        if (/learning-resources/.test(x.href)) small = 'Every lesson';
        return '<li><a class="lb-p" href="' + esc(x.href) + '">' + (x.img ? '<img src="' + esc(x.img) + '" alt="" loading="lazy">' : '') + (small ? '<small>' + esc(small) + '</small>' : '') + '<b>' + esc(t) + '</b></a></li>';
      }).join('') + '</ul>' + (items.length ? '' : '<p>Nothing here yet. Anything you buy shows here.</p>') + '</section>';
      h += '<div class="lb-more on" id="more" data-who="member"><div class="on" data-who="member">' + (isMember
        ? '<a class="lb-ac" href="' + ROUTE_ACADEMY + '"><span class="lb-route" aria-hidden="true"><div><em>Shoot it</em><i>1</i><i>2</i><i>3</i><i>4</i></div><div><em>Edit it</em><i>5</i><i>6</i><i>7</i><i>8</i></div><div><em>Show it</em><i>9</i><i>10</i><i>11</i><i>12</i></div></span>' +
          '<span class="lb-tag">Cohort 3 starts Mon 1 February</span><b>The Academy</b><span>12 weeks of feedback on your shots from Rich or Tom.</span></a>'
        : '<a class="lb-merge" href="' + ROUTE_ACADEMY + '"><img class="patch" src="' + CDN + 'assets/merge-patch.webp" alt=""><span class="lb-tag">Comes with the Academy</span><b>The Merge</b><span>Members\' talk, shots, challenges and High Roller. Yours for life when you join the Academy.</span></a>') +
        '</div></div>';
      h += '<div class="lb-foot"><span><b>Something missing?</b> <a class="tlink" href="mailto:team@coaponline.com?subject=Something%20is%20missing%20from%20my%20library">Email us</a> from the address you bought with.</span></div></div>';
      return h;
    });
  }

  /* ---------- login: login.html, with Kajabi's own sign-in form moved in ---------- */
  function loginPage() {
    return '<section class="lg-stage"><img src="' + CDN + 'assets/kolab/k-21.webp" alt="F-16s taxiing towards the camera on a wet runway, their landing lights reflected in the water">' +
      '<a class="credit" href="https://kolab.social/post/31079" target="_blank" rel="noopener">Philip L Jackson, on K&#333;lab</a>' +
      '<div class="wrap lg-grid"><div class="lg-form"><h1 class="caps h-lg">Log in</h1><div data-kjb-slot="flash"></div><div data-kjb-slot="form"></div>' +
      '<div class="lg-new"><b>Not a member yet?</b><p>The Academy is the way in. Cohort 3 starts Mon 1 February 2027.</p>' +
      '<div class="row"><a class="btn dark sm" href="' + ROUTE_ACADEMY + '">See the Academy</a><a class="tlink" href="' + ROUTE_WORKSHOP + '">Free workshop</a></div></div></div>' +
      '<div class="lg-after"><span class="eyebrow">After you log in</span><p class="lede">You land on your library, with everything you\'ve bought.</p>' +
      '<ul class="lg-five" aria-label="What\'s in your library"><li><i data-icon="grid"></i>Your courses and guides</li><li><i data-icon="people"></i>The Merge, for members</li><li><i data-icon="flag"></i>Your cohort, for the Academy</li></ul></div>' +
      '</div></section>';
  }
  function loginForm(main) {
    var f = $('form#new_member_session') || $('form[action*="sign_in"]'); if (!f) throw new Error('no login form');
    var flash = $$('.alert, .flash, [class*="flash"], .auth__error').filter(function (e) { return !main.contains(e) && txt(e); });
    flash.forEach(function (e) { e.className = 'lg-flash'; main.querySelector('[data-kjb-slot="flash"]').appendChild(e); });
    var em = $('#member_email', f), pw = $('#member_password', f), rm = $('#member_remember_me', f), btn = $('button[type="submit"], button', f);
    $$('label', f).forEach(function (l) { if (/email/i.test(l.textContent) && !$('input', l)) l.textContent = 'Email'; if (/password/i.test(l.textContent) && !$('input', l)) l.textContent = 'Password'; });
    [em, pw].forEach(function (i) { if (i) { i.className = 'input'; var g = i.closest('.form-group'); if (g) g.className = 'field'; } });
    if (em) { em.setAttribute('placeholder', 'you@example.com'); em.setAttribute('autocomplete', 'email'); var hint = d.createElement('span'); hint.className = 'hint'; hint.textContent = 'The email you joined with.'; em.insertAdjacentElement('afterend', hint); }
    if (pw) pw.setAttribute('autocomplete', 'current-password');
    if (rm) { var rl = rm.closest('label'); if (rl) { rl.className = 'lg-keep'; var sp = $('span', rl); if (sp) sp.textContent = 'Keep me logged in on this device'; var g2 = rl.closest('.form-group'); if (g2) g2.className = 'field lg-keepf'; } }
    if (btn) { btn.className = 'btn block'; btn.textContent = 'Log in'; }
    main.querySelector('[data-kjb-slot="form"]').replaceWith(f);
    var fp = $$('a').filter(function (a) { return /forgot/i.test(a.textContent) && !main.contains(a); })[0];
    if (fp) { fp.className = 'tlink lg-forgot'; fp.textContent = 'Forgotten it?'; f.insertAdjacentElement('afterend', fp); }
    var gg = $$('a, button').filter(function (a) { return /google/i.test(a.textContent + ' ' + (a.getAttribute('href') || '')) && !main.contains(a); })[0];
    if (gg) { gg.className = 'btn block line lg-google'; f.insertAdjacentElement('afterend', gg); }   /* Google sign-in, if it's switched on in Kajabi */
  }

  /* ---------- put it together ---------- */
  function build() {
    var o = outline();
    var pt = $('.product-title h1');
    var prodTitle = txt(pt) || 'Lessons';
    var home = '/products/' + prod;
    var here = { cat: null, sub: null, post: null };
    if (catId) { var f = findCat(o, catId); here.cat = f.cat; here.sub = f.sub; }
    if (postId) { here.post = o.posts.filter(function (p) { return p.id === postId; })[0] || null; if (here.post) { here.cat = here.post.cat; here.sub = here.post.sub; } }

    /* Kajabi's working parts, collected before anything moves */
    var parts = {
      video: $('.main-content-video'),
      body: $('.post-body .main-content-container'),
      done: $('a.post-actions-complete'),
      downloads: $$('a.downloads-link'),
      comments: $('.comments .main-content-container')
    };

    var main = d.createElement('main'); main.id = 'coap-main';
    if (kind === 'library' || kind === 'login') {
      return Promise.resolve(kind === 'library' ? libraryPage() : loginPage()).then(function (inn) {
        if (kind === 'library') main.className = 'lib';
        main.innerHTML = inn;
        [].forEach.call(d.body.children, function (c) { c.setAttribute('data-kjb-hide', ''); });
        d.body.appendChild(main);
        if (kind === 'login') loginForm(main);
        d.body.setAttribute('data-area', kind === 'login' ? 'public' : 'member'); d.body.setAttribute('data-page', kind); d.body.setAttribute('data-nosubnav', '');
        d.body.classList.add('coap-nl-on');
        d.title = (kind === 'login' ? 'Log in' : 'Your library') + ' | COAP Online';
      });
    }
    var inner = kind === 'course' ? coursePage(o, prodTitle) : Promise.resolve(kind === 'module' ? modulePage(o, here) : lessonPage(o, here, parts));
    return inner.then(function (inn) {
    main.innerHTML = kind === 'course' ? inn : '<div class="el">' + sideHTML(o, here, home, LR ? 'The library' : nm(prodTitle)) + '<div class="el-main">' + inn + '</div></div>';

    /* hide everything Kajabi drew, then show ours */
    [].forEach.call(d.body.children, function (c) { c.setAttribute('data-kjb-hide', ''); });
    d.body.appendChild(main);

    /* move Kajabi's own working parts into their slots */
    function slot(n) { return main.querySelector('[data-kjb-slot="' + n + '"]'); }
    if (kind === 'lesson') {
      if (parts.video && slot('video')) slot('video').appendChild(parts.video);
      if (parts.body && slot('body')) {
        [].slice.call(parts.body.childNodes).forEach(function (n) {
          if (n.nodeType === 1 && (n.matches('h1.post-body-title') || (n.tagName === 'HR' && !n.nextElementSibling))) return;
          slot('body').appendChild(n);
        });
        var hr = slot('body').querySelector(':scope > hr:first-child'); if (hr) hr.remove();
        if (!slot('body').textContent.trim() && !slot('body').querySelector('img,iframe,audio,video')) slot('body').remove();
      }
      if (parts.done && slot('done')) {
        /* Kajabi swaps the label between these two attributes and keeps the state in data-post-completion-toggle */
        var b = parts.done; b.className = 'btn sm dark ls-done post-actions-complete';
        b.setAttribute('data-complete-text', 'Mark as complete'); b.setAttribute('data-incomplete-text', 'Completed');
        var label = function () {
          var on = b.getAttribute('data-post-completion-toggle') === 'true';
          b.setAttribute('aria-pressed', String(on));
          var want = on ? 'Completed' : 'Mark as complete'; if (b.textContent.trim() !== want) b.textContent = want;
        };
        label(); slot('done').replaceWith(b);
        if (window.MutationObserver) new MutationObserver(function () { setTimeout(label, 0); }).observe(b, { attributes: true, attributeFilter: ['data-post-completion-toggle'] });
      } else if (slot('done')) slot('done').remove();
      if (parts.comments && slot('comments')) [].slice.call(parts.comments.children).forEach(function (n) { slot('comments').appendChild(n); });
      var ta = main.querySelector('.ls-com textarea'); if (ta) ta.setAttribute('placeholder', 'Ask a question about this lesson');
      var cb = main.querySelector('.ls-com .comments-btn'); if (cb && /post comment/i.test(cb.textContent)) cb.textContent = 'Post';
    }

    d.body.setAttribute('data-area', 'member'); d.body.setAttribute('data-page', 'learn'); d.body.setAttribute('data-nosubnav', '');
    d.body.classList.add('coap-nl-on');
    d.title = (kind === 'course' ? (LR ? 'Learn' : nm(prodTitle)) : txt($('.el-main h1', main)) || nm(prodTitle)) + ' | COAP Online';
    /* the outline is open on a desktop and folded on a phone, as in the mock */
    var side = $('.el-side', main); if (side && window.matchMedia && !matchMedia('(min-width:1040px)').matches) side.open = false;
    if (kind === 'course') shelvesOneAtATime(main);
    });
  }

  function kajabiStyles(on) {
    $$('link[rel~="stylesheet"], style').forEach(function (s) {
      if (s.hasAttribute('data-coap') || s.id === 'coap-nl-cloak') return;
      if (s.sheet) try { s.sheet.disabled = !on; } catch (e) {}
      s.disabled = !on;
    });
  }

  function undo(err) {
    try {
      var mm = d.getElementById('coap-main'); if (mm) mm.parentNode.removeChild(mm);
      $$('[data-kjb-hide]').forEach(function (e) { e.removeAttribute('data-kjb-hide'); });
      kajabiStyles(true); html.classList.remove('coap-nl');
    } catch (e) {}
    if (window.console) console.warn('COAP new look stopped, Kajabi page kept:', err);
    uncloak();
  }

  /* The new public pages are still drafts at these addresses. On launch day they move to /academy, /workshop and so on:
     change these and PUBLIC below (the same list as kajabi-build/build.py ROUTES). */
  var ROUTE_ACADEMY = '/new-academy', ROUTE_WORKSHOP = '/new-workshop';
  var PUBLIC = {
    'academy.html': ROUTE_ACADEMY, 'workshop-optin.html': ROUTE_WORKSHOP, 'index.html': '/new-home', 'lessons.html': '/new-lessons',
    'community-preview.html': '/new-community', 'about.html': '/new-about', 'partners.html': '/new-partners', 'guides.html': '/new-guides',
    'free-props-thanks.html': '/new-free-guide', 'map.html#blog': '/blog', 'map.html#store': '/store', 'map.html#terms': '/privacy-terms', 'map.html': '/new-home',
    'login.html': '/login', 'signin.html': '/login'
  };
  window.COAP_SITE = {
    live: true, assets: CDN + 'assets/', member: true,
    routes: {
      'home.html': '/library', 'learn.html': '/products/learning-resources', 'library.html': '/library', 'login.html': '/login',
      'perks.html': '/clifton', 'account.html': '/library', 'shots.html': '/library', 'challenge.html': '/library',
      'challenge-academy.html': '/library', 'high-roller.html': '/library', 'wings.html': '/library', 'my-academy.html': '/library',
      'live.html': '/products/learning-resources', 'course.html': '/products/learning-resources', 'lesson.html': '/products/learning-resources'
    }
  };
  if (kind === 'login') for (var k in PUBLIC) window.COAP_SITE.routes[k] = PUBLIC[k];

  var css = Promise.all([
    addCSS('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;700;800;900&family=Instrument+Serif:ital@0;1&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap'),
    addCSS(CDN + 'site.css?v=' + VER), addCSS(CDN + 'members/el.css?v=' + VER),
    addCSS(CDN + 'members/' + ({ course: 'learn', module: 'course', lesson: 'lesson', library: 'library', login: 'login' })[kind] + '.css?v=' + VER), addCSS(CDN + 'members/members.css?v=' + VER)
  ]);
  function start() {
    css.then(function () {
      return build().then(function () { kajabiStyles(false); }).then(function () { return addJS(CDN + 'site.js?v=' + VER); }).then(function () { requestAnimationFrame(uncloak); });
    }).catch(undo);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})();
