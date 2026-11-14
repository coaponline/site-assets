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
  function txt(e) { return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }
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

  /* ---------- course front page: learn.html's shelves of module cards ---------- */
  function coursePage(o, prodTitle, home) {
    var sub = txt($('.dashboard-welcome-subtitle')), p = (sub.match(/(\d+)\s*%/) || [0, 0])[1];
    var resume = $('a.dashboard-welcome-btn'), cards = $$('a.category');
    var img = function (a) { var i = $('img', a); return i ? i.getAttribute('src') : ''; };
    var info = {}; cards.forEach(function (a) { info[idOf(a.getAttribute('href'), 'categories')] = { img: img(a), desc: txt($('.category-description', a)) }; });
    var hero = cards[0] ? img(cards[0]) : '';
    var h = '<div class="cs-top" id="top"><div class="tx"><span class="kick">Welcome back</span>' +
      '<h1 class="caps">' + esc(nm(prodTitle)) + '</h1>' +
      '<span class="row"><span class="el-bar"><i style="width:' + p + '%"></i></span>' + p + '% watched</span>' +
      (resume ? '<a class="btn" href="' + esc(rel(resume.getAttribute('href'))) + '"><i data-icon="play"></i>' + (+p ? 'Carry on' : 'Start') + '</a>' : '') +
      '</div>' + (hero ? '<figure class="el-ph"><img src="' + esc(hero) + '" alt=""></figure>' : '') + '</div>';
    function card(c) {
      var i = info[c.id] || {};
      var n = c.posts.length, m_ = c.subs.length;
      return '<a class="ln-c" href="' + esc(c.href) + '"><figure class="el-ph">' + (i.img ? '<img src="' + esc(i.img) + '" alt="" loading="lazy">' : '') + '</figure>' +
        '<span class="pad"><b>' + esc(nm(c.title)) + '</b><span class="m">' + (m_ ? m_ + ' modules, ' : '') + n + ' lesson' + (n === 1 ? '' : 's') + '</span></span></a>';
    }
    if (LR) {
      var used = [];
      SHELVES.forEach(function (sh) {
        var list = o.cats.filter(function (c) { return used.indexOf(c) < 0 && sh[2].test(c.title); });
        if (!list.length) return; list.forEach(function (c) { used.push(c); });
        var n = list.reduce(function (t, c) { return t + c.posts.length; }, 0);
        h += '<section id="' + sh[0] + '"><div class="ln-h"><h2 class="caps">' + sh[1] + '</h2><p>' + n + ' lessons</p></div><div class="ln-cards">' + list.map(card).join('') + '</div></section>';
      });
    } else {
      h += '<section id="modules"><div class="ln-h"><h2 class="caps">In this course</h2><p>' + o.posts.length + ' lessons</p></div><div class="ln-cards">' + o.cats.map(card).join('') + '</div></section>';
    }
    return h;
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
    var inner = kind === 'course' ? coursePage(o, prodTitle, home) : kind === 'module' ? modulePage(o, here) : lessonPage(o, here, parts);
    main.innerHTML = '<div class="el">' + sideHTML(o, here, home, LR ? 'The library' : nm(prodTitle)) + '<div class="el-main">' + inner + '</div></div>';

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
        var b = parts.done; b.className = 'btn sm dark ls-done post-actions-complete';
        var label = function () {
          var on = /completed|complete\s*$/i.test(txt(b)) && !/^complete lesson$/i.test(txt(b)) || b.classList.contains('completed') || b.getAttribute('data-completed') === 'true';
          b.setAttribute('aria-pressed', String(!!on));
        };
        label(); slot('done').replaceWith(b);
      } else if (slot('done')) slot('done').remove();
      if (parts.comments && slot('comments')) [].slice.call(parts.comments.children).forEach(function (n) { slot('comments').appendChild(n); });
    }

    d.body.setAttribute('data-area', 'member'); d.body.setAttribute('data-page', 'learn'); d.body.setAttribute('data-nosubnav', '');
    d.body.classList.add('coap-nl-on');
    d.title = (kind === 'lesson' ? txt($('.post-body-title', main)) || d.title : kind === 'course' ? nm(prodTitle) : txt($('h1', main))) + ' | COAP Online';
    /* the outline is open on a desktop and folded on a phone, as in the mock */
    var side = $('.el-side', main); if (side && window.matchMedia && !matchMedia('(min-width:1040px)').matches) side.open = false;
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

  window.COAP_SITE = {
    live: true, assets: CDN + 'assets/', member: true,
    routes: {
      'home.html': '/library', 'learn.html': '/products/learning-resources', 'library.html': '/library', 'login.html': '/login',
      'perks.html': '/clifton', 'account.html': '/library', 'shots.html': '/library', 'challenge.html': '/library',
      'challenge-academy.html': '/library', 'high-roller.html': '/library', 'wings.html': '/library', 'my-academy.html': '/library',
      'live.html': '/products/learning-resources', 'course.html': '/products/learning-resources', 'lesson.html': '/products/learning-resources'
    }
  };

  var css = Promise.all([
    addCSS('https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@600;700;800;900&family=Instrument+Serif:ital@0;1&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap'),
    addCSS(CDN + 'site.css?v=' + VER), addCSS(CDN + 'members/pages.css?v=' + VER), addCSS(CDN + 'members/members.css?v=' + VER)
  ]);
  function start() {
    css.then(function () {
      try { build(); kajabiStyles(false); }
      catch (e) { undo(e); return; }
      return addJS(CDN + 'site.js?v=' + VER).then(function () { requestAnimationFrame(uncloak); });
    }).catch(undo);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})();
