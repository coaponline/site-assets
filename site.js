/* COAP Online 2027: shared behaviour for every page in /site.
   Load it in <head> with a plain <script src="site.js"></script> (no defer, no async).
   It does five things:
   1. Sets html.js and html[data-view] before the page paints.
   2. Injects the header, the footer and the mobile tab bar from ONE definition below.
   3. Runs the preview switch (logged out / member / Academy cohort / graduate), kept in localStorage.
   4. Fills [data-fill] and [data-icon] from the shared facts and icons, and adds local time to <time data-local>.
   5. Reveals [data-reveal] on scroll. Nothing is hidden when script is off or motion is reduced.
   6. Final pass (s3-final-pass-rules.md): Kolab galleries and lightbox, quick find, the sub-navigation
      with "back to Home", embedded mode, stat count-ups and the member footer map.

   A page declares: <body data-area="public|member|owner" data-page="home">
   Optional: data-base="" if the page is not inside /site, data-noswitch to hide the preview switch. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  /* SITE MODE (Kajabi). A Kajabi page sets window.COAP_SITE before loading this file:
     { live: true, assets: 'https://.../assets/', routes: { 'academy.html': '/new-academy', ... }, offer: 'workshop' }
     Live mode: links follow the routes, images come from the assets host, the design preview never shows,
     public pages are always the logged-out view, and the free offer is the one set here. Without it, the mock behaves as before. */
  var CFG = window.COAP_SITE || null, LIVE = !!(CFG && CFG.live);
  root.classList.add('js');
  /* Embedded mode: the page is framed inside the Kajabi community, or opened with ?embed=1.
     The header, footer and tab bar are hidden in CSS; the sub-navigation stays. */
  var embed = /[?&]embed=1\b/.test(location.search);
  /* Framed counts as embedded only inside Kajabi or coaponline.com. In the Claude preview (also a frame) the page keeps its header. */
  try {
    if (window.self !== window.top) {
      var anc = (location.ancestorOrigins && location.ancestorOrigins.length ? Array.prototype.join.call(location.ancestorOrigins, ' ') : d.referrer) || '';
      if (/kajabi|coaponline/i.test(anc)) embed = true;
    }
  } catch (e) {}
  if (embed) root.classList.add('embed');

  /* ---------- facts: one place for every date, number and price a page repeats ----------
     Public pages are mocked as they stand before the January workshop.
     Member pages are mocked for the week of Mon 8 February 2027. All figures are examples to confirm. */
  var FACTS = {
    'members': '570',
    'workshop.dates': 'Tue 12 to Thu 14 January 2027',
    'workshop.time': '7pm UK',
    'cohort.name': 'Cohort 3',
    'cohort.start': 'Mon 1 February 2027',
    'cohort.startshort': 'Mon 1 February',
    'cohort.places': '50',
    'cohort.next': 'Cohort 4 starts Mon 3 May 2027',
    'price.early': '\u00a3447',
    'price.full': '\u00a3495',
    'price.deposit': '\u00a347',
    'price.graduate': '\u00a3197',
    'price.earlyends': 'Sun 17 January',
    'month.name': 'February',
    'month.topic': 'Night',
    'month.line': 'After dark',
    'month.workshop': 'Thu 11 Feb, 7pm UK',
    'month.feedback': 'Thu 25 Feb, 7pm UK',
    'month.closes': 'Sun 28 Feb, midnight UK',
    'week.of': 'Week of Mon 8 February',
    'week.n': '2',
    'week.label': 'Week 2 of 12',
    'week.title': 'Night and low light: where to start',
    'week.upload': 'Sunday',
    'week.feedback': 'Wednesday'
  };

  /* ---------- navigation: the single definition ---------- */
  /* The Own The series: one list for the shop shelf, the Learn shelf and the "guide for this lesson" card.
     checkout: the GBP Kajabi offer. New guides get theirs when the offer is made in Kajabi (empty = "Coming soon" in the mock). */
  var GUIDES = [
    { key: 'edit',  t: 'Own The Edit',  s: 'Editing', line: 'Every edit from the card to the finished file, with fifteen recipes and the new Lightroom tools.', pages: 89, isNew: 1, checkout: '', topics: 'edit editing lightroom masks mask colour raw develop sliders recipe denoise' },
    { key: 'dials', t: 'Own The Dials', s: 'Camera settings', line: 'Set your camera up once, then the settings to start from for every kind of flying.', pages: 44, isNew: 1, checkout: '', topics: 'settings exposure iso aperture autofocus metering manual camera dials' },
    { key: 'pan',   t: 'Own The Pan',   s: 'Panning', line: 'Sharp aircraft with moving props, rotors and backgrounds, from the swing to the edit.', pages: 41, isNew: 1, checkout: '', topics: 'panning pan shutter prop props rotor helicopter blur motion' },
    { key: 'print', t: 'Own The Print', s: 'Export and print', line: 'From the edit to the wall: file types, colour spaces, export settings and printing.', pages: 42, isNew: 1, checkout: '', topics: 'print export colour space sharpening crop watermark magazine' },
    { key: 'scene', t: 'Own The Scene', s: 'Composition', line: 'Ten composition techniques, what each one is and when to use it, with aviation examples.', pages: 40, checkout: 'https://www.coaponline.com/offers/8zXKRMKu/checkout', topics: 'composition framing thirds lines background' },
    { key: 'show',  t: 'Own The Show',  s: 'Airshows', line: 'Getting the best out of an airshow: kit, settings, where to stand and what to look for.', pages: 52, checkout: 'https://www.coaponline.com/offers/2dh277PM/checkout', topics: 'airshow show crowdline display spotting' },
    { key: 'night', t: 'Own The Night', s: 'Night shoots', line: 'Aviation photography after dark, with a checklist for the night itself.', pages: 0, checkout: 'https://www.coaponline.com/offers/fjm7JvJ6/checkout', topics: 'night dark tripod long exposure dusk low light starburst' }
  ];
  var GUIDE_PRICE = '\u00a37';
  /* Which guides this person owns. In Kajabi a page script checks access to each guide's product; in the mock the member owns two. */
  var OWNED = { scene: 1, night: 1 };

  var PUBLIC_NAV = [
    { key: 'academy',   label: 'The Academy', href: 'academy.html' },
    { key: 'lessons',   label: 'Lessons',     href: 'lessons.html' },
    { key: 'community', label: 'The Merge',   href: 'community-preview.html' },
    { key: 'guides',    label: 'Guides',      href: 'guides.html' },
    { key: 'about',     label: 'About',       href: 'about.html' }
  ];
  var PUBLIC_CTA = { key: 'workshop', label: 'Free workshop', href: 'workshop-optin.html' };
  var MEMBER_NAV = [
    { key: 'home',      label: 'The Merge', href: 'home.html',      icon: 'home',     desc: 'This week, the posts and the shots' },
    { key: 'shots',     label: 'Shots',     href: 'shots.html',     icon: 'camera',   desc: 'Every shot members have put up' },
    { key: 'learn',     label: 'Learn',     href: 'learn.html',     icon: 'play',     desc: 'Lessons, live evenings and replays' },
    { key: 'challenge', label: 'Challenges', href: 'challenge.html', icon: 'flag',   desc: 'This month\'s brief, tutorial and shots' },
    { key: 'high-roller', label: 'High Roller', href: 'high-roller.html', icon: 'trophy', desc: 'The main competition, scored by guest judges' },
    { key: 'extras',    label: 'Extras',    href: 'perks.html',     icon: 'tag',      desc: 'Member discounts and COAP Wings', kids: [
      { key: 'perks', label: 'Gear Discounts',  href: 'perks.html', icon: 'tag',  desc: 'Member prices at Clifton Cameras' },
      { key: 'wings', label: 'COAP Wings', href: 'wings.html', icon: 'plane', desc: 'Trips and shoots, with member discounts' }
    ] }
  ];
  var MEMBER_MENU = [
    { key: 'my-academy', label: 'My Academy',     href: 'my-academy.html', icon: 'flag', desc: 'The weekly lesson and brief' },
    { key: 'high-roller', label: 'High Roller',   href: 'high-roller.html', icon: 'trophy', desc: 'The main competition, scored by guest judges', phone: 1 },
    { key: 'perks',      label: 'Gear Discounts',      href: 'perks.html',      icon: 'tag',  desc: 'Member prices at Clifton Cameras', phone: 1 },
    { key: 'wings',      label: 'COAP Wings',     href: 'wings.html',      icon: 'plane', desc: 'Trips and shoots, with member discounts', phone: 1 },
    { key: 'library',    label: 'Everything you own', href: 'library.html#owned', icon: 'grid', desc: 'Every course and guide you\'ve bought' },
    { key: 'account',    label: 'Account',        href: 'account.html',    icon: 'user', desc: 'Details, billing and help' }
  ];
  var VIEWS = { out: 'Logged out', member: 'Member', academy: 'Academy cohort', graduate: 'Graduate', admin: 'Admin (Rich, Tom)' };

  var P = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
    play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.2v5.6l5-2.8z" fill="currentColor"/>',
    people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.4-3.3 2.8-5.2 6-5.2s5.6 1.9 6 5.2"/><circle cx="17" cy="9.5" r="2.5"/><path d="M17.5 14.5c2 .3 3.2 1.7 3.5 4"/>',
    camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    flag: '<path d="M5 21V4"/><path d="M5 5h12l-2.5 4L17 13H5"/>',
    tag: '<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.4" fill="currentColor"/>',
    down: '<path d="m7 10 5 5 5-5"/>',
    plane: '<path d="M21 15.5v-2l-7.5-4.5V4a1.5 1.5 0 0 0-3 0v5L3 13.5v2l7.5-2.3V18l-2 1.5V21l3.5-1 3.5 1v-1.5l-2-1.5v-4.8z"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.7-3.8 3.6-5.8 7.5-5.8s6.8 2 7.5 5.8"/>',
    out: '<path d="M10 4H5v16h5"/><path d="M14 8l4 4-4 4M18 12H9"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    upload: '<path d="M12 16V5M7.5 9.5 12 5l4.5 4.5"/><path d="M5 19h14"/>',
    chat: '<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H6a2 2 0 0 1-2-2z"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/>',
    pen: '<path d="M4 20l1-4L16.5 4.5l3 3L8 19z"/><path d="M14 7l3 3"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10.5l5-3v9l-5-3"/>',
    print: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    ext: '<path d="M14 5h5v5M19 5l-8 8"/><path d="M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    prev: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.2 1-1.2 2"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5c0 3 1.2 4.5 3.2 4.8M16 6h3c0 3-1.2 4.5-3.2 4.8M12 13v4M8.5 20h7M10 17h4"/>'
  };
  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" ' + P + '>' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------- view state ---------- */
  var KEY = 'coap-view';
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var q = /[?&]view=(out|member|academy|graduate|admin)\b/.exec(location.search);
  var view = LIVE ? null : ((q && q[1]) || stored());
  if (!VIEWS[view]) view = null;
  if (q) store(view);
  /* Until the body exists we don't know the area, so set what we have and settle it on ready. */
  if (view) root.setAttribute('data-view', view);

  var body, area, page, base;
  function link(href) {
    if (/^(https?:|#|mailto:)/.test(href)) return href;
    if (LIVE && CFG.routes) {
      if (CFG.routes[href] != null) return CFG.routes[href];
      var i = href.indexOf('#'), file = i < 0 ? href : href.slice(0, i), hash = i < 0 ? '' : href.slice(i);
      if (CFG.routes[file] != null) return CFG.routes[file] + hash;
    }
    return base + href;
  }
  function asset(f) { return LIVE && CFG.assets ? CFG.assets + f : base + 'assets/' + f; }

  function setView(v, go) {
    if (!VIEWS[v]) return;
    view = v; store(v);
    root.setAttribute('data-view', v);
    if (go) { location.href = go; return; }
    if (v === 'out' && area === 'member') { location.href = link('login.html'); return; }
    render();
    d.dispatchEvent(new CustomEvent('coap:view', { detail: { view: v } }));
  }

  /* ---------- builders ---------- */
  function a(item, cur, inner) {
    return '<a href="' + link(item.href) + '"' + (cur ? ' aria-current="page"' : '') + '>' + (inner || item.label) + '</a>';
  }
  function findBtn() {
    return '<button class="find" type="button" data-quickfind aria-label="Quick find: search every page, lesson, live session and answer">' + icon('search') + '<span>Find</span><kbd aria-hidden="true">/</kbd></button>';
  }
  function headerHTML() {
    var member = view !== 'out';
    /* Live sits inside Learn, so the Live page lights up Learn. */
    var isCur = function (it, forArea) { return area === forArea && (page === it.key || (page === 'live' && it.key === 'learn') || (it.also && it.also.indexOf(page) > -1)); };
    var h = '<div class="wrap"><a class="logo" href="' + link(member ? 'home.html' : 'index.html') + '" aria-label="COAP Online, ' + (member ? 'The Merge' : 'home page') + '"><img src="' + asset('logo-coap.png') + '" alt="COAP Online" width="137" height="23"></a>';
    if (member) {
      /* One header for every logged-in person: Kajabi can't vary it by access group, so there is no cohort-only button. */
      /* The Academy link shows to the cohort only. In Kajabi the block checks whether the cohort's space opens for this person. */
      /* No Academy tab. Academy things sit inside Learn, Challenges and The Merge, marked in gold. */
      var nav_ = MEMBER_NAV;
      h += '<nav aria-label="Main">' + nav_.map(function (it) {
        if (!it.kids) return a(it, isCur(it, 'member'));
        /* Extras: a small drop-down. Opens on hover and on click; Kajabi's own nav can hold the same two links as a sub-menu. */
        var on = area === 'member' && it.kids.some(function (k) { return k.key === page; });
        return '<div class="xdd' + (on ? ' on' : '') + '"><button type="button" aria-expanded="false" aria-haspopup="true"' + (on ? ' aria-current="page"' : '') + '>' + it.label + icon('down') + '</button><div class="xdd-m">' +
          it.kids.map(function (k) { return '<a href="' + link(k.href) + '"' + (area === 'member' && page === k.key ? ' aria-current="page"' : '') + '><i>' + icon(k.icon) + '</i><span><b>' + k.label + '</b><small>' + k.desc + '</small></span></a>'; }).join('') + '</div></div>';
      }).join('') + '</nav>';
      /* Live tonight: shows on the day of a live evening only. In Kajabi the script checks today's date against the next evening. */
      h += '<div class="right">' + findBtn();
      /* No Post button up here (Tom, 13 Nov): writing happens in The Merge's own box, shots go in from Add a shot on Shots. */
      h += '<details><summary aria-label="Your menu"><span class="me' + (view === 'academy' ? ' t-ac' : '') + '">' + icon('user') + '</span></summary><div class="menu">' +
        (view === 'admin' ? '<p class="lvl"><i class="tier ins">Instructor</i>Admin</p><a href="' + link('learn.html#new-event') + '">' + icon('plus') + 'New event</a>' : view === 'academy' ? '<p class="lvl"><i class="tier ac">Academy</i>' + FACTS['cohort.name'] + '</p>' : view === 'graduate' ? '<p class="lvl"><i class="tier ac">Academy</i>Graduate</p>' : '<p class="lvl"><i class="tier mem">Member</i></p>') +
        MEMBER_MENU.filter(function (it) { return it.key !== 'my-academy'; }).map(function (it) { var x = a(it, isCur(it, 'member'), icon(it.icon) + it.label); return it.phone ? x.replace('<a ', '<a class="m-only" ') : x; }).join('') +
        '<a href="' + link('account.html#help') + '">' + icon('help') + 'Help</a>' +
        (view === 'member' ? '<a class="up" href="' + link('my-academy.html#upgrade') + '"><i class="tier ac">Academy</i><span><b>Upgrade to the Academy</b><small>Members get \u00a3100 off</small></span></a>' : '') +
        '<hr><a href="' + link('index.html') + '" data-set-view="out">' + icon('out') + 'Log out</a></div></details></div>';
    } else {
      h += '<nav aria-label="Main">' + PUBLIC_NAV.map(function (it) { return a(it, isCur(it, 'public')); }).join('') + '</nav>';
      h += '<div class="right">' + findBtn() + '<a class="login" href="' + link('login.html') + '"' + (page === 'login' ? ' aria-current="page"' : '') + '>Log in</a>' +
        '<a class="btn sm hide-s" href="' + link(cta().href) + '">' + cta().label + '</a>' +
        '<details class="only-s"><summary class="burger" aria-label="Menu">' + icon('menu') + '</summary><div class="menu">' +
        PUBLIC_NAV.concat([cta()]).map(function (it) { return a(it, isCur(it, 'public')); }).join('') + '</div></details></div>';
    }
    return h + '</div>';
  }
  d.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.xdd > button');
    d.querySelectorAll('.xdd.open').forEach(function (x) { if (!btn || x !== btn.parentNode) { x.classList.remove('open'); x.firstChild.setAttribute('aria-expanded', 'false'); } });
    if (btn) { var o = btn.parentNode.classList.toggle('open'); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); }
  });
  function tabsHTML() {
    var t = MEMBER_NAV.filter(function (it) { return it.key !== 'extras' && it.key !== 'high-roller'; }).map(function (it) { return a(it, area === 'member' && (page === it.key || (page === 'live' && it.key === 'learn') || (it.also && it.also.indexOf(page) > -1)), '<i>' + icon(it.icon) + '</i><span>' + it.label + '</span>'); });
    return t.join('');
  }
  /* One Post button on every page. It asks what you're posting and sends you to the right place. */
  function postHTML() {
    var row = function (href, ic, b, s) { return '<a href="' + link(href) + '"><i>' + icon(ic) + '</i><b>' + b + '</b><span>' + s + '</span></a>'; };
    return '<div class="box" role="dialog" aria-modal="true" aria-label="What are you posting?"><button class="x" type="button" data-post-close aria-label="Close">' + icon('close') + '</button>' +
      '<h3 class="caps">What are you posting?</h3>' +
      row('home.html#discussion', 'chat', 'A question or something to say', 'It goes in The Merge, for members only') +
      row('shots.html#enter-feedback', 'camera', 'A shot for feedback', 'Rich, Tom and members comment on it') +
      row('shots.html#enter-challenge', 'trophy', 'An entry for the challenge', 'Keep it dark, or High Roller') +
      ((view === 'academy' || view === 'admin') ? row('challenge-academy.html', 'flag', 'This week\'s Academy brief', 'Your cohort only, by ' + FACTS['week.upload']) : '') +
      /* Admins and ambassadors only. In Kajabi: shown to people Kajabi lets create community events. */
      (view === 'admin' ? row('learn.html#new-event', 'calendar', 'A new event', 'A live workshop, a meet-up or anything with a date') : '') + '</div>';
  }
  function logosHTML() {
    return '<div class="wrap"><span>Working with</span>' +
      '<a href="' + link('partners.html#kolab') + '" aria-label="Kōlab, on the partners page"><img src="' + asset('logo-kolab.png') + '" alt="Kōlab" height="26"></a>' +
      '<a href="' + link('partners.html#clifton') + '" aria-label="Clifton Cameras, on the partners page"><img class="clifton" src="' + asset('logo-clifton.png') + '" alt="Clifton Cameras" height="28"></a>' +
      '<a href="' + link('partners.html#caj') + '" aria-label="Combat Aircraft Journal, on the partners page"><img class="caj" src="' + asset('logo-caj.png') + '" alt="Combat Aircraft Journal" height="34"></a></div>';
  }
  function footerHTML() {
    var L = function (label, href) { return '<li><a href="' + link(href) + '">' + label + '</a></li>'; };
    var base_ = '<div class="base"><span>&copy; 2027 COAP Online, the Centre of Aviation Photography</span>' + (LIVE ? '' : '<span><a href="' + link('map.html') + '">Site map for Rich and Tom</a></span>') + '</div>';
    if (view !== 'out') {
      /* Member footer: The Merge's badge and line, one Find box, three short lists. The header already carries the tabs, so no tiles here. */
      var cohort = (view === 'academy' || view === 'admin') || view === 'graduate';
      return '<div class="wrap"><div class="mf">' +
        '<div class="mf-brand"><img src="' + asset('merge-patch.webp') + '" alt="The Merge" width="150" height="150" loading="lazy">' +
        '<div><p class="caps">Where your aviation photography <em>comes together.</em></p>' +
        '<button class="find" type="button" data-quickfind>' + icon('search') + '<span>Find a lesson, a replay or a date</span></button></div></div>' +
        '<div class="mf-cols">' +
        '<div><h4>The Merge</h4><ul>' + L('Discussion', 'home.html#discussion') + L('Shots', 'shots.html') + L('Challenge', 'challenge.html') + L('High Roller', 'high-roller.html') + L('Get feedback', 'shots.html#feedback') + L('Live and replays', 'learn.html#live') + '</ul></div>' +
        '<div><h4>Learn</h4><ul>' + L('Lessons', 'learn.html') + L('This week\'s tutorial', 'challenge.html#how') + L('Replays', 'learn.html#replays') + L('Guides and podcast', 'learn.html#guides') + (cohort ? L('My Academy', 'my-academy.html') : '') + '</ul></div>' +
        '<div><h4>Yours</h4><ul>' + L('Everything you own', 'library.html#owned') + L('Gear Discounts', 'perks.html') + L('COAP Wings', 'wings.html') + L('Account and billing', 'account.html') + L('Help', 'account.html#help') + '<li><a href="https://kolab.social" target="_blank" rel="noopener">K\u014dlab' + icon('ext') + '</a></li></ul></div>' +
        '</div></div>' + base_ + '</div>';
    }
    return '<div class="wrap"><div class="cols">' +
      '<div class="brand"><img src="' + asset('logo-coap.png') + '" alt="COAP Online" width="143" height="24"><p>The Centre of Aviation Photography. Run by Rich Cooper and Tom Dalton.</p></div>' +
      '<div><h4>Learn</h4><ul>' + L('The Academy', 'academy.html') + L('Free workshop', 'workshop-optin.html') + L('Lessons', 'lessons.html') + L('Free weekly tutorials', 'map.html#blog') + '</ul></div>' +
      '<div><h4>Members</h4><ul>' + L('The Merge', 'community-preview.html') + L('High Roller competition', 'community-preview.html#high-roller') + L('Log in', 'login.html') + '</ul></div>' +
      '<div><h4>COAP</h4><ul>' + L('About', 'about.html') + L('Partners', 'partners.html') + L('Courses and guides', 'map.html#store') + L('Contact', 'about.html#contact') + L('Privacy and terms', 'map.html#terms') + '</ul></div>' +
      '</div>' + base_ + '</div>';
  }
  /* The preview switch is a design-review device. It is not a site feature and is not built in Kajabi. */
  function switchHTML() {
    return '<summary><span class="pv-tag">Design preview</span><b>' + VIEWS[view] + '</b></summary><div class="opts">' +
      '<p>For design review only. The real site shows the same page to every logged-in person.</p>' +
      Object.keys(VIEWS).map(function (k) { return '<button type="button" data-set-view="' + k + '" aria-pressed="' + (k === view) + '">' + VIEWS[k] + '</button>'; }).join('') +
      (area === 'public' ? '<p class="pv-h">Free offer on public pages</p>' + Object.keys(OFFERS).map(function (k) { return '<button type="button" data-set-offer="' + k + '" aria-pressed="' + (k === offerKey()) + '">' + (k === 'workshop' ? 'Free workshop' : 'Free guide: ' + OFFERS[k].title) + '</button>'; }).join('') : '') +
      '<a href="' + link('map.html') + '">Map of every page</a><a href="' + link('signin.html') + '">Magic link sign-in page</a></div>';
  }

  function slot(sel, tag, cls, where) {
    var el = d.querySelector(sel);
    if (!el) {
      el = d.createElement(tag);
      if (where === 'first') body.insertBefore(el, body.firstChild); else body.appendChild(el);
    }
    el.className = cls;
    return el;
  }


  /* ---------- THE FREE OFFER: one at a time, on every public page ----------
     The home page's hero card and the closing band of every public page show the same offer, so the site asks one thing.
     While a free workshop is taking sign-ups (from the day the opt-in opens to the last evening) it's the workshop.
     Between workshops it's a free field guide, which leads to the matching Own The guide, then the workshop and the Academy.
     IN KAJABI: one snippet holds OFFER_NOW. Change the key the day the workshop's last evening ends, and back when the next one opens.
     The guide's form is a Kajabi native form: it tags the contact (free-props) and starts a short sequence:
     the PDF straight away, then two days later Own The Pan at £7, then the next workshop when it's announced. */
  var OFFERS = {
    workshop: { kind: 'workshop', tag: 'Free, live on Zoom', title: 'Three free evenings with Rich and Tom',
      line: FACTS['workshop.dates'] + ' at ' + FACTS['workshop.time'] + '. Bring one shot and finish it with us.',
      days: [['Tue', '12', 'Shoot it'], ['Wed', '13', 'Edit it'], ['Thu', '14', 'Show it']],
      img: 'g2.webp', btn: 'Save my free seat', href: 'workshop-optin.html', form: 'workshop', done: 'You\'re in. Check your inbox for the joining details.', note: 'Free, and every evening is recorded.' },
    props: { kind: 'guide', tag: 'Free field guide', title: 'Perfect Props', key: 'free-props',
      line: 'Full-disc shutter speeds for over 30 aircraft, from Chinooks to Spitfires.',
      cover: 'guides/perfect-props.jpg', page: 'guides/pages/props-3-peek.jpg', img: 'g2.webp', btn: 'Send me the guide', form: 'free-props', done: 'Check your inbox. The guide is on its way.',
      note: 'Seven pages, straight to your inbox.' }
  };
  var OFFER_NOW = 'props';   /* 12 Nov 2026: the January workshop's sign-ups aren't open yet */
  var OKEY = 'coap-offer-2';
  function offerKey() { var k = null, m = location.search.match(/[?&]offer=([a-z-]+)/); if (m && OFFERS[m[1]]) { try { localStorage.setItem(OKEY, m[1]); } catch (e) {} return m[1]; } if (LIVE) return OFFERS[CFG.offer] ? CFG.offer : OFFER_NOW; try { k = localStorage.getItem(OKEY); } catch (e) {} return OFFERS[k] ? k : OFFER_NOW; }
  function offerForm(o, cls) {
    return '<form class="of-form of-in-' + cls + '" data-offer-form data-kajabi-form="' + o.form + '" novalidate><label class="sr" for="of-' + cls + '">Your email</label>' +
      '<input id="of-' + cls + '" type="email" placeholder="Your email" autocomplete="email" required>' +
      '<button class="btn" type="submit">' + o.btn + '</button></form>';
  }
  function offerCard(o) {
    if (o.kind === 'workshop') return '<div class="of-card ws"><span class="of-tag">' + o.tag + '</span><b class="of-t">' + o.title + '</b>' +
      '<ol class="of-days">' + o.days.map(function (x) { return '<li><small>' + x[0] + '</small><b>' + x[1] + '</b><span>' + x[2] + '</span></li>'; }).join('') + '</ol>' +
      '<p>' + o.line + '</p><a class="btn" href="' + link(o.href) + '">' + o.btn + '</a><small class="of-n">' + o.note + '</small></div>';
    return '<div class="of-card gd"><div class="of-pdf"><img class="pg" src="' + asset(o.page) + '" alt=""><img class="cv" src="' + asset(o.cover) + '" alt="The cover of ' + o.title + '"></div>' +
      '<div class="of-tx"><span class="of-tag">' + o.tag + '</span><b class="of-t">' + o.title + '</b><p>' + o.line + '</p>' + offerForm(o, 'card') + '<small class="of-n">' + o.note + '</small></div></div>';
  }
  function offerBand(o) {
    return '<img src="' + asset(o.img) + '" alt="" loading="lazy"><div class="wrap">' +
      (o.kind === 'guide' ? '<img class="of-bcv" src="' + asset(o.cover) + '" alt="" loading="lazy">' : '') +
      '<span class="eyebrow">' + o.tag + '</span><h2 class="caps h-xl">' + o.title + '</h2><p>' + o.line + '</p>' +
      offerForm(o, 'band') + '</div>';
  }
  function offer() {
    var o = OFFERS[offerKey()];
    root.setAttribute('data-offer', o.kind);
    /* While the workshop is taking sign-ups, its opt-in page IS the home page (in Kajabi: set it as the homepage for those weeks). */
    if (o.kind === 'workshop' && page === 'home') { location.replace(link('workshop-optin.html')); return; }
    qsa('[data-offer="card"]').forEach(function (el) { el.innerHTML = offerCard(o); });
    qsa('[data-offer="band"]').forEach(function (el) { el.classList.add('band', 'of-band'); el.innerHTML = offerBand(o); });
  }
  d.addEventListener('submit', function (e) {
    var f = e.target.closest && e.target.closest('[data-offer-form]'); if (!f) return;
    e.preventDefault();
    var i = f.querySelector('input'); if (!i.value || i.value.indexOf('@') < 1) { i.focus(); f.classList.add('bad'); return; }
    /* mock only: nothing is sent. Kajabi's form does the real work. */
    /* the free guide's form lands on its thank-you page, which offers the matching Own The guide (Kajabi: the form's thank-you URL) */
    if (f.getAttribute('data-kajabi-form') === 'free-props') { location.href = link('free-props-thanks.html'); return; }
    var ok = ''; for (var k in OFFERS) if (OFFERS[k].form === f.getAttribute('data-kajabi-form')) ok = OFFERS[k].done;
    f.outerHTML = '<p class="of-done">' + icon('check') + (ok || 'Thanks. Check your inbox.') + '</p>';
  });

  /* The header's button follows the offer: the workshop page while it's booking, otherwise the free guide on the home page. */
  function cta() { return OFFERS[offerKey()].kind === 'guide' ? { key: 'free-guide', label: 'Free guide', href: 'index.html#top-form' } : PUBLIC_CTA; }
  function render() {
    var member = view !== 'out';
    var hdr = slot('[data-site-header]', 'header', 'hdr', 'first');
    hdr.setAttribute('data-site-header', ''); hdr.innerHTML = headerHTML();
    /* LIVE SOON: an announcement bar under the header, in the hours before a live evening. The tag counts down ("Live in 1 hr 14 min", then "Live now"), so it's right in every time zone. It scrolls away with the page.
       In Kajabi the script checks today's date against the next event. Closing it hides it until the next visit. */
    var an = d.querySelector('.annc'); if (an) an.parentNode.removeChild(an);
    var off = false; try { off = sessionStorage.getItem('coap-annc') === '1'; } catch (e) {}
    if (area === 'member' && view !== 'out' && !off) hdr.insertAdjacentHTML('afterend',
      '<div class="annc"><div class="wrap"><p class="annc-tag"><i></i>Live in 1 hr 14 min</p>' +
      '<p class="annc-t"><b>Live workshop with Matty</b><span><time data-local datetime="2027-02-11T19:00:00Z">7pm UK</time></span></p>' +
      '<a class="btn sm" href="https://zoom.us/" target="_blank" rel="noopener">' + icon('video') + 'Join on Zoom</a>' +
      '<button type="button" class="annc-x" data-annc-x aria-label="Hide this">' + icon('close') + '</button></div></div>');

    if (area !== 'owner') {
      var lg = d.querySelector('[data-site-logos]');
      if (!member) {
        if (!lg) { lg = d.createElement('div'); lg.setAttribute('data-site-logos', ''); (d.querySelector('[data-site-footer]') ? body.insertBefore(lg, d.querySelector('[data-site-footer]')) : body.appendChild(lg)); }
        lg.className = 'logos'; lg.hidden = page === 'partners'; lg.innerHTML = logosHTML();
      } else if (lg) { lg.hidden = true; }
    }
    var ftr = slot('[data-site-footer]', 'footer', 'ftr' + (member ? ' slim' : ''));
    ftr.setAttribute('data-site-footer', ''); ftr.innerHTML = footerHTML();

    var tabs = d.querySelector('[data-site-tabs]');
    if (member && area !== 'owner') {
      if (!tabs) { tabs = d.createElement('nav'); tabs.setAttribute('data-site-tabs', ''); tabs.setAttribute('aria-label', 'Main, phone'); body.appendChild(tabs); }
      tabs.className = 'tabs'; tabs.hidden = false; tabs.innerHTML = tabsHTML();
      body.classList.add('has-tabs');
    } else { if (tabs) tabs.hidden = true; body.classList.remove('has-tabs'); }

    var ps = d.querySelector('[data-site-post]');
    if (member && area === 'member') {
      if (!ps) { ps = d.createElement('div'); ps.setAttribute('data-site-post', ''); ps.className = 'psheet'; ps.hidden = true; body.appendChild(ps); }
      ps.innerHTML = postHTML();
    } else if (ps) { ps.hidden = true; }

    if (!LIVE && !body.hasAttribute('data-noswitch')) {
      var pv = d.querySelector('[data-site-switch]');
      if (!pv) { pv = d.createElement('details'); pv.setAttribute('data-site-switch', ''); pv.className = 'pv'; body.appendChild(pv); }
      pv.open = false; pv.innerHTML = switchHTML();
    }
    /* an in-page preview switch is labelled the same way, so it never passes for a site control */
    [].forEach.call(d.querySelectorAll('.seg'), function (s) {
      if (s.querySelector('button[data-set-view]')) { s.classList.add('pv-seg'); s.setAttribute('data-pv', 'Design preview'); }
    });
    /* any in-page switch: <div class="seg"><button data-set-view="member">Member</button>...</div> */
    [].forEach.call(d.querySelectorAll('[data-set-view]'), function (b) {
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(b.getAttribute('data-set-view') === view));
    });
  }

  function fill() {
    [].forEach.call(d.querySelectorAll('[data-fill]'), function (el) {
      var v = FACTS[el.getAttribute('data-fill')];
      if (v != null) el.textContent = v;
    });
    [].forEach.call(d.querySelectorAll('[data-icon]'), function (el) {
      if (!el.firstChild) el.innerHTML = icon(el.getAttribute('data-icon'));
    });
    /* <time data-local datetime="2027-02-11T19:00:00Z">Thu 11 Feb, 7pm UK</time> gains the visitor's own time when it differs */
    [].forEach.call(d.querySelectorAll('time[data-local]'), function (el) {
      try {
        var t = new Date(el.getAttribute('datetime')); if (isNaN(t)) return;
        var f = function (tz) { return new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz }).format(t); };
        var here = f(undefined), uk = f('Europe/London');
        if (here !== uk && !el.querySelector('.loc')) {
          var s = d.createElement('span'); s.className = 'loc'; s.textContent = ' (' + here.replace(':00', '').replace(' ', '') + ' your time)'; el.appendChild(s);
        }
      } catch (e) {}
    });
  }

  function reveal() {
    var els = [].slice.call(d.querySelectorAll('[data-reveal]'));
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (e) { io.observe(e); });
    /* safety net: if anything is still hidden after 4s (print, odd embeds), show it */
    setTimeout(function () { els.forEach(function (e) { e.classList.add('in'); }); }, 4000);
  }

  function ready() {
    body = d.body;
    area = body.getAttribute('data-area') || 'public';
    page = body.getAttribute('data-page') || '';
    base = body.getAttribute('data-base') || '';
    if (!view) view = area === 'member' ? 'member' : 'out';   /* first visit: a member page shows the member view */
    if (view === 'out' && area === 'member') { if (embed) view = 'member'; else { location.replace(link('login.html')); return; } }   /* as Kajabi does */
    root.setAttribute('data-view', view);
    root.setAttribute('data-area', area);
    render(); offer(); fill(); shelves(); subnav(); galleries(); stagger(); reveal(); counts(); wire(); upHash(); window.addEventListener('hashchange', upHash);

    d.addEventListener('click', function (e) {
      var ff = e.target.closest ? e.target.closest('[data-focus-form]') : null;
      if (ff) { e.preventDefault(); var hf = qsa('.hm-h2 .hm-one input, .hm-hero .hm-form input').filter(function (x) { return x.offsetParent; })[0]; if (hf) { hf.closest('section').scrollIntoView({ behavior: 'smooth' }); setTimeout(function () { hf.focus({ preventScroll: true }); }, 500); } return; }
      var so = e.target.closest ? e.target.closest('[data-set-offer]') : null;
      if (so) { try { localStorage.setItem(OKEY, so.getAttribute('data-set-offer')); } catch (er) {} offer(); render(); return; }
      var t = e.target.closest ? e.target.closest('[data-set-view]') : null;
      if (t) {
        var href = t.getAttribute('href');
        if (href) e.preventDefault();
        setView(t.getAttribute('data-set-view'), href || null);
        return;
      }
      /* close open header menus and the switch on an outside click */
      [].forEach.call(d.querySelectorAll('.hdr details[open], .pv[open]'), function (m) { if (!m.contains(e.target)) m.open = false; });
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { [].forEach.call(d.querySelectorAll('.hdr details[open], .pv[open]'), function (m) { m.open = false; }); var ps_ = d.querySelector('[data-site-post]'); if (ps_) ps_.hidden = true; }
    });
  }

  /* =====================================================================
     FINAL PASS. Everything below is documented in research/s3-final-pass-rules.md
     ===================================================================== */
  function qsa(sel, ctx) { return [].slice.call((ctx || d).querySelectorAll(sel)); }
  /* Guide shelves. <div data-guides="shelf"> draws all six as books; <div data-guides="pick" data-topic="panning"> draws the one guide that fits. */
  function book(g, member) {
    var own = member && OWNED[g.key];
    var buy = g.checkout ? '<a class="gd-buy" href="' + g.checkout + '" target="_blank" rel="noopener" data-track="buy-' + g.key + '">Buy for ' + GUIDE_PRICE + '</a>' : '<span class="gd-buy soon">Coming soon</span>';
    var act = own ? '<a class="gd-buy own" href="' + link('library.html#owned') + '">' + icon('check') + 'Yours. Open it</a>' : buy;
    return '<article class="gd-b' + (own ? ' is-own' : '') + '"><div class="gd-3d"><img src="' + asset('guides/own-the-' + g.key + '.jpg') + '" alt="The cover of ' + g.t + '" loading="lazy">' +
      (g.isNew && !own ? '<i class="gd-new">New</i>' : '') + '</div><div class="gd-tx"><small>' + g.s + (g.pages ? ' \u00b7 ' + g.pages + ' pages' : '') + '</small><h3>' + g.t + '</h3><p>' + g.line + '</p>' + act + '</div></article>';
  }
  function shelves() {
    var member = area === 'member' && view !== 'out';
    qsa('[data-guides]').forEach(function (box) {
      var mode = box.getAttribute('data-guides');
      if (mode === 'pick') {
        var words = (box.getAttribute('data-topic') || '').toLowerCase().split(/\s+/), best = null, score = 0;
        GUIDES.forEach(function (g) { var n = words.filter(function (w) { return w && g.topics.indexOf(w) > -1; }).length; if (n > score) { score = n; best = g; } });
        if (!best) { box.hidden = true; return; }
        var own = member && OWNED[best.key];
        box.innerHTML = '<div class="gd-pick"><img src="' + asset('guides/own-the-' + best.key + '.jpg') + '" alt="" loading="lazy"><div><small>' + (own ? 'In your library' : 'The guide for this lesson') + '</small><b>' + best.t + '</b><span>' + best.line + '</span></div>' +
          (own ? '<a class="btn sm dark" href="' + link('library.html#owned') + '">Open</a>' : best.checkout ? '<a class="btn sm" href="' + best.checkout + '" target="_blank" rel="noopener" data-track="pick-' + best.key + '">' + GUIDE_PRICE + '</a>' : '<span class="gd-buy soon">Coming soon</span>') + '</div>';
        return;
      }
      if (mode === 'buy') {   /* one guide's Buy button, for the guides page: data-guides="buy" data-key="dials" */
        var g = GUIDES.filter(function (x) { return x.key === box.getAttribute('data-key'); })[0]; if (!g) return;
        var own = member && OWNED[g.key];
        box.innerHTML = own ? '<a class="btn dark" href="' + link('library.html#owned') + '">' + icon('check') + 'Yours. Open it</a>'
          : g.checkout ? '<a class="btn" href="' + g.checkout + '" target="_blank" rel="noopener" data-track="buy-' + g.key + '">Buy for ' + GUIDE_PRICE + '</a>'
          : '<span class="btn ghost-soon" aria-disabled="true">Coming soon</span>';
        return;
      }
      box.innerHTML = '<div class="gd-shelf">' + GUIDES.map(function (g) { return book(g, member); }).join('') + '</div>';
    });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Kolab: the bundled list ----------
     Built from assets/kolab/index.json (34 members' shots from the October challenge on Kolab).
     [post number, photographer, width, height, alt]. The file is k-NN.webp, NN being the position here. */
  var KOLAB_POST = 'https://kolab.social/post/';
  var KOLAB = [
    [31171, "Jason Prior", 1080, 813, "An Apache helicopter head-on against broken cloud"],
    [31183, "Phil Colborne", 1080, 720, "A Gloster Meteor reflected in standing water under a storm sky, in black and white"],
    [31081, "Joe Copalman", 1080, 720, "A Lightning jet on the ground under forked lightning"],
    [31053, "Dave Kingston", 1080, 717, "A Mustang at night with its propeller drawn as a ring of light"],
    [31152, "Steven Wilson", 1080, 607, "A Hind helicopter in silhouette against an orange sunset"],
    [31099, "David Foote", 1080, 720, "A polished twin-engined propeller aircraft seen head-on"],
    [31540, "BartoszJonski", 1080, 660, "An F-35 turning away with its afterburner lit"],
    [31105, "Kees Den Otter", 1080, 608, "An F-35 bursting through a cloud of its own vapour"],
    [31169, "Dave Griffiths", 1080, 776, "A Vulcan bomber reflected in a puddle under a heavy sky"],
    [31078, "Simon Cook", 1080, 720, "An F-16 from behind, throwing up spray on a wet runway"],
    [31004, "Stanimir Stoev", 1080, 720, "A line of F-16s on the flight line"],
    [30967, "Daniela Z", 1080, 720, "A display team trailing smoke across a sunset"],
    [32018, "Ryszard Jonski", 1080, 696, "An F-35 head-on at night"],
    [31116, "Nick Bollion", 1080, 720, "A Tornado low over trees under heavy cloud"],
    [30985, "Artur", 1080, 720, "Four delta-winged jets firing flares against cloud"],
    [31172, "Robert Coomer", 1080, 660, "A Hornet reflected in still water at sunset"],
    [31124, "Andrew Critchell", 1080, 717, "A silver Spitfire running up under a dark sky"],
    [31064, "Nick Morales", 1080, 864, "An airliner crossing below a red moon in orange cloud"],
    [30951, "Lee Hurst", 1080, 720, "A propeller aircraft at night lit in blue, its propeller a ring of light"],
    [31130, "Timothy Homan", 1080, 720, "A polished silver twin reflected in water beside a red tractor"],
    [31199, "Robert Arts", 1080, 718, "An F-16 taxiing at night"],
    [31079, "Philip L Jackson", 1080, 720, "F-16s taxiing on a wet runway with their lights reflected"],
    [31060, "Robin Trewinnard", 1080, 864, "A Harrier head-on on a wet deck under a blue dusk sky"],
    [31122, "Niall Grant", 1080, 608, "The wreck of a DC-3 on a black beach at dusk"],
    [31144, "Bob Sharples", 1080, 688, "A naval helicopter hovering over a cliff edge"],
    [30964, "Anirudh Arun", 1080, 755, "A Hornet taking off with a mountain castle behind it"],
    [31049, "Jeff Krueger", 1080, 586, "A Blue Angels Hornet at take-off with the background blurred"],
    [30959, "Rich Colbourne", 1080, 764, "A B-52 low over an airshow crowd"],
    [31071, "Lagowczak", 1080, 772, "An F-16 banking against bright cloud"],
    [31098, "Nick Barker", 1080, 710, "Two Red Arrows crossing with red and blue smoke"],
    [30971, "Jacob", 1080, 720, "A Corsair with its wings folded in a hangar"],
    [32854, "Davy", 1080, 720, "A Merlin helicopter against dark cloud"],
    [31164, "Antonio Godinho", 1080, 607, "French display team jets lined up on the apron"],
    [31148, "Mark Seabrook", 1080, 720, "A Phantom in a yellow and blue scheme outside a shelter"]
  ].map(function (r, i) {
    var id = 'k-' + (i < 10 ? '0' : '') + i;
    /* sim: in the mock, a few shots stand in for ones whose photographer attached the unedited file on Kolab (the feed's beforeImageUrl). */
    return { n: i, id: id, file: 'kolab/' + id + '.webp', by: r[1], url: KOLAB_POST + r[0], w: r[2], h: r[3], alt: r[4], learn: [3, 18, 5].indexOf(i) >= 0 ? ['Night photography masterclass', 'learn.html#shoot'] : ['The night exposure check', 'challenge.html#how'], sim: [2, 3, 12, 18, 20, 21].indexOf(i) >= 0, sw: [2, 3, 12, 18, 20, 21].indexOf(i) >= 0 ? 'Lightroom' : '' };
  });
  function shotSrc(s) { return s.src || asset(s.file); }
  /* pick('0,3,7-12') gives those shots in that order. No argument gives all 34. */
  function pick(spec) {
    if (spec == null || spec === '' || spec === 'all') return KOLAB.slice();
    var out = [];
    String(spec).split(',').forEach(function (part) {
      var m = /^\s*(\d+)\s*(?:-\s*(\d+))?\s*$/.exec(part); if (!m) return;
      var from = +m[1], to = m[2] == null ? from : +m[2];
      for (var i = from; i <= to; i++) if (KOLAB[i]) out.push(KOLAB[i]);
    });
    return out;
  }

  /* loadKolab(kolabId) resolves to { shots, source }. It asks Kolab for the challenge's shots and, when that
     fails for any reason (no CORS header today, offline, a local file), gives the bundled list instead.
     Change COAP.kolabEndpoint to a Kolab embed endpoint or a proxy when one exists. */
  function loadKolab(kolabId, spec) {
    var bundled = { shots: pick(spec), source: 'bundled' };
    if (!kolabId || !window.fetch || !window.Promise || !/^https?:$/.test(location.protocol)) {
      return window.Promise ? Promise.resolve(bundled) : { then: function (f) { f(bundled); } };
    }
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 2500);
    return fetch(window.COAP.kolabEndpoint.replace('{id}', encodeURIComponent(kolabId)), ctl ? { signal: ctl.signal } : {})
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        clearTimeout(timer);
        var rows = (j && j.data && j.data.result) || [];
        var shots = rows.filter(function (p) { return p && p.imageUrl && p.image; }).map(function (p, i) {
          var who = (p.actor && p.actor.data) || {};
          return { n: i, id: 'live-' + p.image, src: p.imageUrl, by: String(who.name || who.username || 'A COAP member').trim(), url: KOLAB_POST + p.image, before: p.beforeImageUrl || '', sw: (p.showEditingSoftware && p.editingSoftware) || '', alt: 'A photograph by ' + String(who.name || who.username || 'a COAP member').trim() };
        });
        return shots.length >= 4 ? { shots: shots, source: 'live' } : bundled;
      })
      .catch(function () { clearTimeout(timer); return bundled; });
  }

  /* ---------- galleries ----------
     <div data-gallery="wall|filmstrip|mosaic|spotlight" data-shots="0,3,7-12" data-limit="9"
          data-add="challenge.html" data-add-label="Add your shot" data-kolab="331" data-label="Shot of the week">
       ...fallback markup for when script is off...
     </div> */
  function tile(s, lazy) {
    var ar = s.w && s.h ? (s.w / s.h).toFixed(3) : '1.5';
    return '<a class="shot" href="' + esc(s.url || shotSrc(s)) + '" data-shot="' + esc(s.id) + '" style="--ar:' + ar + '" aria-label="Open the photograph by ' + esc(s.by) + '">' +
      '<img src="' + esc(shotSrc(s)) + '" alt="' + esc(s.alt || '') + '"' + (s.w ? ' width="' + s.w + '" height="' + s.h + '"' : '') + (lazy === false ? '' : ' loading="lazy"') + ' decoding="async">' +
      '<span class="credit">' + esc(s.by) + '</span></a>';
  }
  function addTile(el, cls) {
    if (!el.hasAttribute('data-add')) return '';
    var href = el.getAttribute('data-add') || 'challenge.html';
    var label = el.getAttribute('data-add-label') || 'Add your shot';
    var line = el.getAttribute('data-add-line') || 'Added right here, in a minute or two.';
    return '<a class="addshot ' + (cls || '') + '" href="' + esc(link(href)) + '"><i>' + icon('plus') + '</i><b>' + esc(label) + '</b><span>' + esc(line) + '</span></a>';
  }
  var GAL = [];   /* each rendered gallery keeps its list here, for the lightbox */
  function gallery(el, shots) {
    if (typeof el === 'string') el = d.querySelector(el);
    if (!el) return;
    var type = (el.getAttribute('data-gallery') || 'wall').toLowerCase();
    if (type === 'film') type = 'filmstrip';
    shots = shots || pick(el.getAttribute('data-shots'));
    if (!shots.length) return;
    var limit = +el.getAttribute('data-limit') || 0, h = '', i;
    el._shots = shots; if (GAL.indexOf(el) < 0) GAL.push(el);
    el.className = el.className.replace(/\bgal(-\w+)?\b/g, '').trim() + ' gal gal-' + type;
    if (type === 'spotlight') {
      var s = shots[0];
      h = tile(s, false) + '<div class="spot-bar"><div class="who"><span class="eyebrow">' + esc(el.getAttribute('data-label') || 'From the challenge on Kōlab') + '</span>' +
        '<b class="caps" data-spot-by>' + esc(s.by) + '</b></div><div class="acts">' +
        '<a class="btn sm light" data-spot-url href="' + esc(s.url) + '" target="_blank" rel="noopener">See it on Kōlab' + icon('ext') + '</a>' +
        (el.hasAttribute('data-add') ? '<a class="btn sm" href="' + esc(link(el.getAttribute('data-add') || 'challenge.html')) + '">' + icon('upload') + esc(el.getAttribute('data-add-label') || 'Add your shot') + '</a>' : '') +
        '</div></div>';
      el.innerHTML = h;
      if (shots.length > 1 && !reduce) spotRotate(el);
      return;
    }
    if (type === 'mosaic') {
      for (i = 0; i < Math.min(5, shots.length); i++) h += tile(shots[i], i === 0 ? false : true);
      el.innerHTML = h + addTile(el, 'pill');
      return;
    }
    if (type === 'filmstrip') {
      for (i = 0; i < shots.length; i++) h += tile(shots[i]);
      el.innerHTML = '<div class="gal-track" tabindex="0" role="group" aria-label="Members\' photographs. Scroll sideways for more.">' + h + addTile(el, 'tile') + '</div>' +
        '<button class="gal-nav prev" type="button" aria-label="Earlier photographs">' + icon('prev') + '</button>' +
        '<button class="gal-nav next" type="button" aria-label="More photographs">' + icon('next') + '</button>';
      return;
    }
    /* wall */
    var add = addTile(el, 'tile');
    for (i = 0; i < shots.length; i++) {
      h += tile(shots[i]).replace('<a class="shot"', limit && i >= limit ? '<a hidden class="shot"' : '<a class="shot"');
      if (add && i === Math.min(shots.length, limit || 5) - 1) { h += add; add = ''; }   /* the call to action sits in the wall, not after it */
    }
    el.innerHTML = h + add;
    var old = el.nextElementSibling; if (old && old.classList.contains('gal-more')) old.parentNode.removeChild(old);
    if (limit && shots.length > limit) {
      var more = d.createElement('div'); more.className = 'gal-more';
      more.innerHTML = '<button class="btn dark" type="button">Show all ' + shots.length + ' shots</button>';
      el.parentNode.insertBefore(more, el.nextSibling);
      more.firstChild.addEventListener('click', function () {
        var hid = qsa('.shot[hidden]', el); hid.forEach(function (t) { t.hidden = false; });
        more.parentNode.removeChild(more); if (hid[0]) hid[0].focus();
      });
    }
  }
  function spotRotate(el) {
    var i = 0, shots = el._shots;
    setInterval(function () {
      if (d.hidden || root.classList.contains('modal-open') || el.matches(':hover, :focus-within')) return;
      i = (i + 1) % shots.length; var s = shots[i], t = el.querySelector('.shot'), img = t && t.querySelector('img'); if (!img) return;
      var pre = new Image(); pre.onload = function () {
        t.classList.add('swap');
        setTimeout(function () {
          img.src = shotSrc(s); img.alt = s.alt || ''; t.href = s.url; t.setAttribute('data-shot', s.id);
          t.style.setProperty('--ar', s.w && s.h ? (s.w / s.h).toFixed(3) : '1.5');
          t.setAttribute('aria-label', 'Open the photograph by ' + s.by);
          t.querySelector('.credit').textContent = s.by;
          var by = el.querySelector('[data-spot-by]'), u = el.querySelector('[data-spot-url]');
          if (by) by.textContent = s.by; if (u) u.href = s.url;
          t.classList.remove('swap');
        }, 450);
      }; pre.src = shotSrc(s);
    }, 7000);
  }
  function galleries() {
    qsa('[data-gallery]').forEach(function (el) {
      gallery(el);
      var id = el.getAttribute('data-kolab');
      el.setAttribute('data-source', 'bundled');
      if (id) loadKolab(id, el.getAttribute('data-shots')).then(function (r) {
        if (r.source === 'live') { gallery(el, r.shots); el.setAttribute('data-source', 'live'); }
      });
    });
    /* a static credit or tile can name a bundled shot: <a class="credit" data-k="7"> fills the name and the Kolab link */
    qsa('[data-k]').forEach(function (el) {
      var s = KOLAB[+el.getAttribute('data-k')]; if (!s) return;
      if (el.classList.contains('shot')) { if (!el.getAttribute('data-shot')) el.setAttribute('data-shot', s.id); if (!el.getAttribute('href')) el.setAttribute('href', s.url); return; }
      if (!el.textContent.trim()) el.textContent = s.by;
      if (el.tagName === 'A' && !el.getAttribute('href')) { el.href = s.url; el.target = '_blank'; el.rel = 'noopener'; }
    });
  }
  function shotOf(a, list) {
    var id = a.getAttribute('data-shot'), i;
    if (list) for (i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    for (i = 0; i < KOLAB.length; i++) if (KOLAB[i].id === id) return KOLAB[i];
    var img = a.querySelector('img'), cr = a.querySelector('.credit');
    return { id: id || '', src: a.getAttribute('data-full') || (img && (img.currentSrc || img.src)) || a.href, by: a.getAttribute('data-credit') || (cr && cr.textContent.trim()) || '',
      url: a.getAttribute('data-url') || (/^https?:/.test(a.getAttribute('href') || '') ? a.href : ''), alt: (img && img.alt) || '' };
  }

  /* ---------- modal helper: focus stays inside, the page behind doesn't scroll ---------- */
  var modal = null, lastFocus = null;
  function modalOpen(el) { lastFocus = d.activeElement; modal = el; el.hidden = false; root.classList.add('modal-open'); }
  function modalClose() {
    if (!modal) return; modal.hidden = true; modal = null; root.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  function trapTab(e) {
    var f = qsa('a[href], button:not([disabled]), input, [tabindex="0"]', modal).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!modal.contains(d.activeElement)) { e.preventDefault(); first.focus(); }
  }

  /* ---------- lightbox ---------- */
  var lb = null, lbList = [], lbAt = 0, lbLearn = null;
  function lbBuild() {
    lb = d.createElement('div'); lb.className = 'lb'; lb.hidden = true;
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photograph');
    lb.innerHTML = '<div class="lb-top"><span class="lb-count" aria-live="polite"></span>' +
      '<button class="lb-x" type="button" data-lb="close" aria-label="Close">' + icon('close') + '<span>Close</span></button></div>' +
      '<div class="lb-stage"><button class="lb-nav prev" type="button" data-lb="prev" aria-label="Previous photograph">' + icon('prev') + '</button>' +
      '<img class="lb-img" alt=""><button class="lb-nav next" type="button" data-lb="next" aria-label="Next photograph">' + icon('next') + '</button></div>' +
      '<div class="lb-bar"><div class="lb-who"><span>Photograph by</span><b class="caps"></b></div>' +
      '<div class="lb-edit" hidden><button class="lb-ba" type="button" data-lb="ba" aria-pressed="false">' + icon('layers') + '<span>See it before the edit</span></button><small class="lb-sw"></small></div>' +
      '<div class="lb-acts"><a class="lb-learn" hidden>' + icon('play') + '<span><small>Learn this</small><b></b></span></a>' +
      '<a class="btn sm lb-link" target="_blank" rel="noopener">See it on Kōlab' + icon('ext') + '</a></div></div>';
    d.body.appendChild(lb);
    lb.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lb]');
      if (e.target.closest('.lb-learn')) { modalClose(); return; }
      if (b) { var w = b.getAttribute('data-lb'); if (w === 'close') modalClose(); else if (w === 'ba') lbBefore(b.getAttribute('aria-pressed') !== 'true'); else lbGo(w === 'prev' ? -1 : 1); return; }
      if (e.target === lb || e.target.classList.contains('lb-stage')) modalClose();
    });
    var x0 = null, y0 = null;
    lb.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 == null) return; var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) lbGo(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) modalClose();   /* swipe down to close */
    }, { passive: true });
  }
  /* The edit reveal: swaps to the photographer's unedited file where Kolab has one. */
  function lbBefore(on) {
    var s = lbList[lbAt], img = lb.querySelector('.lb-img'), b = lb.querySelector('.lb-ba');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.querySelector('span').textContent = on ? 'Back to the edit' : 'See it before the edit';
    if (s.before) img.src = on ? s.before : shotSrc(s);
    else img.style.filter = on ? 'brightness(.5) contrast(.82) saturate(.6)' : '';
  }
  function lbShow() {
    var s = lbList[lbAt], img = lb.querySelector('.lb-img'), many = lbList.length > 1;
    img.classList.remove('on');
    var src = shotSrc(s);
    var done = function () { img.classList.add('on'); };
    img.onload = done; img.onerror = done;
    img.src = src; img.alt = s.alt || ('A photograph by ' + s.by);
    if (img.complete) done();
    lb.querySelector('.lb-count').textContent = many ? (lbAt + 1) + ' of ' + lbList.length : '';
    lb.querySelector('.lb-who').hidden = !s.by;
    lb.querySelector('.lb-who b').textContent = s.by || '';
    var a = lb.querySelector('.lb-link'); a.hidden = !s.url; if (s.url) a.href = s.url;
    /* Learn this: the lesson or tutorial that teaches the shot. Set per gallery (data-learn="Title|address"), which on the real site means per Kolab mission. */
    var ln = lb.querySelector('.lb-learn'), L = lbLearn || s.learn;
    ln.hidden = !L; if (L) { ln.href = L[1]; ln.querySelector('b').textContent = L[0]; }
    img.style.filter = ''; var ed = lb.querySelector('.lb-edit'), hasB = !!(s.before || s.sim);
    ed.hidden = !(hasB || s.sw); lb.querySelector('.lb-ba').hidden = !hasB;
    lb.querySelector('.lb-ba').setAttribute('aria-pressed', 'false'); lb.querySelector('.lb-ba span').textContent = 'See it before the edit';
    lb.querySelector('.lb-sw').textContent = s.sw ? 'Edited in ' + s.sw : '';
    qsa('.lb-nav', lb).forEach(function (b) { b.hidden = !many; });
    if (many) [1, -1].forEach(function (k) { var n = lbList[(lbAt + k + lbList.length) % lbList.length]; (new Image()).src = shotSrc(n); });
  }
  function lbGo(k) { if (lbList.length < 2) return; lbAt = (lbAt + k + lbList.length) % lbList.length; lbShow(); }
  function openLightbox(list, at, learn) {
    if (!list || !list.length) return;
    if (!lb) lbBuild();
    lbLearn = learn || null;
    lbList = list; lbAt = Math.max(0, Math.min(list.length - 1, at || 0));
    modalOpen(lb); lbShow(); lb.querySelector('.lb-x').focus();
  }
  function lbFromTile(a) {
    var g = a.closest('[data-gallery], [data-lightbox]');
    var tiles = g ? qsa('.shot', g) : [a], list, at;
    if (g && g._shots) { list = g._shots; var s = shotOf(a, list); at = list.indexOf(s); if (at < 0) { list = [s]; at = 0; } }
    else { list = tiles.map(function (t) { return shotOf(t); }); at = tiles.indexOf(a); }
    var gl = g && g.getAttribute('data-learn');
    openLightbox(list, at, gl ? gl.split('|') : null);
  }

  /* ---------- quick find ----------
     One small index of every page, lesson shelf, live session and help answer.
     a: who it is for ('m' logged in, 'p' logged out, '' both). Edit it here when a page or a shelf changes. */
  var INDEX = [
    /* pages, logged in */
    { k: 'Page', a: 'm', i: 'home', t: 'The Merge', s: 'This week, the posts and the shots', h: 'home.html', w: 'home start week community forum posts feed members chat' },
    { k: 'Page', a: 'm', i: 'play', t: 'Lessons', s: '257 lessons on three shelves', h: 'learn.html', w: 'videos tutorials courses library learn watch' },
    { k: 'Page', a: 'm', i: 'camera', t: 'Shots', s: 'The challenge, High Roller, feedback and your shots', h: 'shots.html', w: 'shots photos images upload add enter feedback portfolio kolab challenge high roller' },
    { k: 'Page', a: 'm', i: 'camera', t: 'Challenge', s: 'This month\'s brief and the gallery on Kōlab', h: 'challenge.html', w: 'kolab upload add shot mission gallery photos' },
    { k: 'Page', a: 'm', i: 'calendar', t: 'Live', s: 'Dates, add to calendar, replays', h: 'learn.html#live', w: 'zoom workshop evening session events' },
    { k: 'Page', a: 'm', i: 'flag', t: 'The Academy', s: 'This week\'s lesson, the 12 weeks and your bonuses', h: 'learn.html#academy', w: 'cohort 90 day weeks brief feedback graduate' },
    { k: 'Page', a: 'm', i: 'tag', t: 'Gear Discounts', s: 'Member prices at Clifton Cameras', h: 'perks.html', w: 'kit camera lens clifton aled price perks sony canon nikon extras' },
    { k: 'Page', a: 'm', i: 'plane', t: 'COAP Wings', s: 'Trips and shoots, with member discounts', h: 'wings.html', w: 'wings trips travel japan switzerland heritage exotic air to air shoot night extras discount' },
    { k: 'Page', a: 'm', i: 'user', t: 'Account', s: 'Your details and billing', h: 'account.html', w: 'password email card payment profile settings' },
    { k: 'Page', a: 'm', i: 'grid', t: 'Your library', s: 'Where you land after logging in', h: 'library.html', w: 'library products purchases start landing login' },
    { k: 'Page', a: 'm', i: 'grid', t: 'Everything you own', s: 'Every course and guide you\'ve bought', h: 'library.html#owned', w: 'purchases products courses guides own the scene night masterclass replays bought' },
    { k: 'Lessons', a: 'm', i: 'play', t: 'Every shelf and module', s: 'The Lessons course: Shoot it, Edit it, Show it', h: 'course.html', w: 'course modules shelves resume carry on continue list' },
    { k: 'Lessons', a: 'm', i: 'play', t: 'Shutter speeds for every pass', s: 'Shoot it, 20 minutes, Rich Cooper', h: 'lesson.html', w: 'shutter speed motion panning lesson video settings card' },
    { k: 'Lessons', a: 'm', i: 'play', t: 'The night exposure check', s: 'This week\'s tutorial, nine steps', h: 'challenge.html#how', w: 'tutorial tuesday night dark exposure histogram iso keep it dark' },
    { k: 'Page', a: 'm', i: 'trophy', t: 'High Roller', s: 'The main competition, scored by guest judges', h: 'high-roller.html', w: 'competition contest judges prize enter' },
    { k: 'Page', a: 'm', i: 'chat', t: 'Feedback on a shot', s: 'Put it up on K\u014dlab and mark it Feedback wanted', h: 'home.html#feedback', w: 'critique review help shot' },
    { k: 'Page', a: 'm', i: 'tag', t: 'Discussion', s: 'Questions, kit and meet-ups, in The Merge', h: 'home.html#discussion', w: 'gear tech camera lens' },
    /* pages, logged out */
    { k: 'Page', a: 'p', i: 'flag', t: 'The Academy', s: 'Cohort 3 starts Mon 1 February 2027', h: 'academy.html', w: '90 day course join price cohort feedback' },
    { k: 'Page', a: 'p', i: 'video', t: 'Free workshop', s: 'Three evenings, Tue 12 to Thu 14 January', h: 'workshop-optin.html', w: 'zoom free live register seat' },
    { k: 'Page', a: 'p', i: 'play', t: 'Lessons', s: 'A look at the library: Shoot it, Edit it, Show it', h: 'lessons.html', w: 'videos tutorials courses library' },
    { k: 'Page', a: 'p', i: 'people', t: 'The Merge', s: 'The members\' community, from the outside', h: 'community-preview.html', w: 'community members challenge feedback gallery photos' },
    { k: 'Page', a: 'p', i: 'trophy', t: 'High Roller competition', s: 'Scored by guest judges', h: 'community-preview.html#high-roller', w: 'contest prize enter combat aircraft journal' },
    { k: 'Page', a: 'p', i: 'star', t: 'Partners', s: 'Kōlab, Clifton Cameras, Combat Aircraft Journal', h: 'partners.html', w: 'kolab clifton magazine discounts' },
    { k: 'Page', a: 'p', i: 'user', t: 'About', s: 'Rich Cooper and Tom Dalton', h: 'about.html', w: 'who team centre of aviation photography coap' },
    { k: 'Page', a: 'p', i: 'pen', t: 'Contact', s: 'Send Rich and Tom a message', h: 'about.html#contact', w: 'email message ask question' },
    { k: 'Page', a: 'p', i: 'lock', t: 'Log in', s: 'For members and the Academy', h: 'login.html', w: 'sign in password member' },
    /* lesson shelves */
    { k: 'Lessons', a: 'm', i: 'play', t: 'This week\'s lesson: shutter speeds for every pass', s: 'Shoot it, 20 minutes', h: 'learn.html', w: 'shutter speed motion panning prop blur new latest' },
    { k: 'Lessons', a: 'm', i: 'play', t: 'Start here', s: 'Three lessons to watch first', h: 'learn.html#start', w: 'new beginner first begin' },
    { k: 'Lessons', a: 'm', i: 'play', t: 'This month\'s lessons', s: 'February is Motion', h: 'learn.html#this-month', w: 'motion panning rotor prop blur tuesday' },
    { k: 'Lessons', a: 'm', i: 'camera', t: 'Shoot it', s: 'Settings, light and where to stand', h: 'learn.html#shoot', w: 'shelf shooting camera exposure' },
    { k: 'Lessons', a: 'm', i: 'camera', t: 'Moving to manual', s: 'Shoot it', h: 'learn.html#shoot', w: 'manual mode auto exposure aperture iso' },
    { k: 'Lessons', a: 'm', i: 'camera', t: 'Camera settings in depth', s: 'Shoot it: props, jets, helicopters, night', h: 'learn.html#shoot', w: 'shutter speed autofocus af settings' },
    { k: 'Lessons', a: 'm', i: 'camera', t: 'Night photography', s: 'Shoot it: night shoots and low light', h: 'learn.html#shoot', w: 'low light tripod noise iso dark' },
    { k: 'Lessons', a: 'm', i: 'camera', t: 'Airshows and spotting', s: 'Shoot it: plan the day and pick your spot', h: 'learn.html#shoot', w: 'riat airshow location spot crowd line' },
    { k: 'Lessons', a: 'm', i: 'camera', t: 'Air-to-air', s: 'Shoot it: shooting from another aircraft', h: 'learn.html#shoot', w: 'a2a formation photoship' },
    { k: 'Lessons', a: 'm', i: 'pen', t: 'Edit it', s: 'From a flat RAW file to a finished photograph', h: 'learn.html#edit', w: 'shelf editing processing raw' },
    { k: 'Lessons', a: 'm', i: 'pen', t: 'Lightroom masterclass', s: 'Edit it: 8 parts, 112 lessons', h: 'learn.html#edit', w: 'lightroom editing cycle raw colour masking' },
    { k: 'Lessons', a: 'm', i: 'pen', t: 'Photoshop masterclass', s: 'Edit it: 5 parts, 66 lessons', h: 'learn.html#edit', w: 'photoshop layers clean up remove retouch' },
    { k: 'Lessons', a: 'm', i: 'print', t: 'Show it', s: 'Print it, build a portfolio, write about it', h: 'learn.html#show', w: 'shelf print portfolio social publish' },
    { k: 'Lessons', a: 'm', i: 'print', t: 'Portfolio projects', s: 'Show it: 14 lessons', h: 'learn.html#show', w: 'portfolio website project' },
    { k: 'Lessons', a: 'm', i: 'print', t: 'Printing masterclass', s: 'Show it: from screen to paper', h: 'learn.html#show', w: 'print paper printer wall' },
    { k: 'Lessons', a: 'm', i: 'print', t: 'Writing masterclass', s: 'Show it: 2 parts, 17 lessons', h: 'learn.html#show', w: 'writing captions magazine article published' },
    { k: 'Lessons', a: 'm', i: 'upload', t: 'Light The Burners Blueprint', s: '13 workbooks, checklists and cheatsheets', h: 'learn.html#guides', w: 'pdf checklist cheat sheet cheatsheet download guide guides workbook blueprint burners shortcuts' },
    { k: 'Lessons', a: 'm', i: 'chat', t: 'The Wingman Podcast', s: '8 episodes', h: 'learn.html#podcast', w: 'audio listen podcast' },
    { k: 'Lessons', a: 'p', i: 'camera', t: 'Shoot it', s: 'What the shooting lessons cover', h: 'lessons.html#shoot', w: 'settings camera manual night airshow' },
    { k: 'Lessons', a: 'p', i: 'pen', t: 'Edit it', s: 'Lightroom and Photoshop', h: 'lessons.html#edit', w: 'editing lightroom photoshop raw' },
    { k: 'Lessons', a: 'p', i: 'print', t: 'Show it', s: 'Print, portfolio, writing', h: 'lessons.html#show', w: 'print portfolio writing published' },
    /* live sessions */
    { k: 'Live', a: 'm', i: 'video', t: 'Live workshop with Matty', s: 'Thu 11 Feb, 7pm UK', h: 'learn.html#live', w: 'zoom workshop february motion matty next tonight' },
    { k: 'Live', a: 'm', i: 'chat', t: 'Live feedback with Rich and Tom', s: 'Thu 25 Feb, 7pm UK', h: 'learn.html#live', w: 'zoom review critique february rich tom' },
    { k: 'Live', a: 'm', i: 'video', t: 'Replays', s: 'Every live workshop, up the next day', h: 'learn.html#replays', w: 'recording missed watch again replay' },
    { k: 'Live', a: 'm', i: 'trophy', t: 'Challenge and High Roller close', s: 'Sun 28 Feb, midnight UK', h: 'challenge.html', w: 'deadline closes closing date' },
    { k: 'Live', a: 'm', i: 'flag', t: 'Academy live evenings', s: 'Eight evenings across the 12 weeks', h: 'learn.html#live', w: 'cohort zoom evening graduation' },
    { k: 'Live', a: 'p', i: 'video', t: 'Free workshop', s: 'Tue 12 to Thu 14 January 2027, 7pm UK', h: 'workshop-optin.html', w: 'zoom live evenings january' },
    { k: 'Live', a: 'p', i: 'flag', t: 'Cohort 3 starts', s: 'Mon 1 February 2027, 50 places', h: 'academy.html', w: 'academy start date' },
    /* help answers */
    { k: 'Help', a: 'm', i: 'help', t: 'Where do I add my shot?', s: 'On Challenge. The cohort posts the weekly brief on My Academy.', h: 'account.html#help', w: 'upload post photo kolab submit enter' },
    { k: 'Help', a: 'm', i: 'help', t: 'Where\'s the link for tonight\'s live session?', s: 'Open Community and press Join on the event.', h: 'account.html#help', w: 'zoom link join live tonight' },
    { k: 'Help', a: 'm', i: 'help', t: 'Kōlab is asking me to log in', s: 'It\'s a separate free account. Use the same email.', h: 'account.html#help', w: 'kolab login sign in password account' },
    { k: 'Help', a: 'm', i: 'help', t: 'How do I change my card or stop my membership?', s: 'Change your card under Billing.', h: 'account.html#help', w: 'cancel payment billing card subscription stop' },
    { k: 'Help', a: 'm', i: 'help', t: 'Where are the member prices on kit?', s: 'On Gear discounts. One email to Clifton Cameras.', h: 'account.html#help', w: 'discount clifton camera lens price' },
    { k: 'Help', a: 'm', i: 'help', t: 'Where does my shot go?', s: 'Challenge, Feedback or your Academy space', h: 'community.html#where', w: 'post which where shot feedback' },
    { k: 'Help', a: 'm', i: 'help', t: 'Where is my feedback?', s: 'Under your post in your cohort space on Kōlab', h: 'challenge-academy.html#feedback', w: 'written feedback rich tom academy brief' },
    { k: 'Help', a: 'p', i: 'help', t: 'How do I join?', s: 'Through the Academy. Cohort 3 starts Mon 1 February.', h: 'academy.html', w: 'join membership price sign up cost' },
    { k: 'Help', a: 'p', i: 'help', t: 'I\'m a member and I can\'t get in', s: 'Log in, or reset your password there', h: 'login.html', w: 'password forgot login access' }
  ];
  var qf = null, qfAt = -1;
  function qfBuild() {
    qf = d.createElement('div'); qf.className = 'qf'; qf.hidden = true;
    qf.setAttribute('role', 'dialog'); qf.setAttribute('aria-modal', 'true'); qf.setAttribute('aria-label', 'Quick find');
    qf.innerHTML = '<div class="qf-box"><div class="qf-in">' + icon('search') +
      '<input type="search" id="qf-q" aria-label="Find a page, a lesson, a live session or an answer" placeholder="Find a page, a lesson, a live session or an answer" autocomplete="off" autocapitalize="off" spellcheck="false" aria-controls="qf-list" enterkeyhint="go">' +
      '<button class="qf-x" type="button" aria-label="Close quick find">' + icon('close') + '</button></div>' +
      '<div class="qf-list" id="qf-list" role="listbox" aria-label="Results"></div>' +
      '<p class="qf-hint" aria-hidden="true"><kbd>↑</kbd><kbd>↓</kbd> to move <kbd>Enter</kbd> to open <kbd>Esc</kbd> to close</p></div>';
    d.body.appendChild(qf);
    var input = qf.querySelector('input');
    input.addEventListener('input', function () { qfRender(input.value); });
    qf.addEventListener('click', function (e) {
      if (e.target === qf || e.target.closest('.qf-x')) { modalClose(); return; }
      var opt = e.target.closest('a[role="option"]');
      if (opt && samePage(opt)) modalClose();   /* an anchor on this page: close and let it jump */
    });
    qf.addEventListener('keydown', function (e) {
      var opts = qsa('a[role="option"]', qf);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!opts.length) return;
        qfAt = (qfAt + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length; qfMark(opts, true);
      } else if (e.key === 'Enter' && d.activeElement === input) {
        var go = opts[qfAt < 0 ? 0 : qfAt]; if (go) { e.preventDefault(); go.click(); }
      }
    });
  }
  function samePage(a) { return a.pathname === location.pathname && a.hash; }
  function qfMark(opts, scroll) {
    opts.forEach(function (o, i) { o.setAttribute('aria-selected', String(i === qfAt)); });
    var input = qf.querySelector('input');
    if (opts[qfAt]) { input.setAttribute('aria-activedescendant', opts[qfAt].id); if (scroll) opts[qfAt].scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  }
  function qfSearch(q) {
    var who = view === 'out' ? 'p' : 'm';
    var pool = INDEX.filter(function (e) { return !e.a || e.a === who; });
    var words = q.toLowerCase().replace(/ō/g, 'o').split(/\s+/).filter(Boolean);
    if (!words.length) return pool.filter(function (e) { return e.k === 'Page' || e.k === 'Live'; }).slice(0, 14);
    var hits = [];
    pool.forEach(function (e, n) {
      var t = e.t.toLowerCase().replace(/ō/g, 'o'), all = t + ' ' + (e.s + ' ' + (e.w || '') + ' ' + e.k).toLowerCase().replace(/ō/g, 'o'), score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (t.indexOf(w) === 0) score += 6; else if ((' ' + t).indexOf(' ' + w) >= 0) score += 4; else if (t.indexOf(w) >= 0) score += 3;
        else if ((' ' + all).indexOf(' ' + w) >= 0) score += 2; else return;
      }
      hits.push({ e: e, score: score - n / 1000 });
    });
    hits.sort(function (x, y) { return y.score - x.score; });
    return hits.slice(0, 10).map(function (x) { return x.e; });
  }
  function qfRender(q) {
    var list = qf.querySelector('.qf-list'), res = qfSearch(q || ''), h = '', n = 0;
    if (!res.length) {
      h = '<div class="qf-none"><b>Nothing found for “' + esc(q) + '”</b><span>Try one word, like “night” or “replay”.</span>' +
        (view === 'out' ? '<a class="tlink" href="' + link('about.html#contact') + '">Ask Rich and Tom</a>' : '<a class="tlink" href="' + link('home.html#help') + '">Ask in The Merge</a>') + '</div>';
    } else {
      var groups = {}, keys = [];
      res.forEach(function (e) { var g = q ? 'Best matches' : (e.k === 'Page' ? 'Go to' : 'Coming up'); if (!groups[g]) { groups[g] = []; keys.push(g); } groups[g].push(e); });
      keys.forEach(function (g) {
        h += '<div class="qf-group" role="group" aria-label="' + g + '"><p>' + g + '</p>';
        groups[g].forEach(function (e) {
          h += '<a role="option" id="qf-o' + n + '" aria-selected="false" href="' + esc(link(e.h)) + '"><i>' + icon(e.i || 'arrow') + '</i><span><b>' + esc(e.t) + '</b><em>' + esc(e.s) + '</em></span><small>' + e.k + '</small></a>';
          n++;
        });
        h += '</div>';
      });
    }
    list.innerHTML = h; list.scrollTop = 0;
    qfAt = q && res.length ? 0 : -1; qfMark(qsa('a[role="option"]', qf));
  }
  function openFind(q) {
    if (modal) modalClose();
    if (!qf) qfBuild();
    [].forEach.call(d.querySelectorAll('.hdr details[open], .pv[open]'), function (m) { m.open = false; });
    var input = qf.querySelector('input'); input.value = q || '';
    modalOpen(qf); qfRender(input.value); input.focus();
  }

  /* ---------- sub-navigation: "back to Home" on member pages, and the sections of this page ----------
     A section joins it with <section id="gallery" data-nav="Gallery">. In embedded mode this bar is the only navigation. */
  function subnav() {
    var secs = qsa('main [data-nav][id]');
    var member = area === 'member' && view !== 'out';
    if (body.hasAttribute('data-nosubnav')) return;
    /* Logged-in pages have the header on every page, so there is no second bar and no back link. The bar only shows framed inside Kajabi. */
    if (member && !embed) return;
    /* Public pages: the main header is enough, so no section bar either (Tom, 12 Nov). The Academy page keeps its own bar with the button. */
    if (!member && !embed) return;
    var back = member && page !== 'home';
    if (!back && !secs.length && !(embed && member)) return;
    var here = '';
    MEMBER_NAV.concat(MEMBER_MENU).forEach(function (it) { if (member && it.key === page) here = it.label; });
    var nav = d.createElement('nav'); nav.className = 'subnav'; nav.setAttribute('aria-label', 'This page');
    nav.innerHTML = '<div class="wrap">' +
      (back ? '<a class="back" href="' + link('home.html') + '">' + icon('back') + '<span>The Merge</span></a>' : '') +
      (here && secs.length ? '<b class="here">' + here + '</b>' : (here && back ? '<b class="here solo">' + here + '</b>' : '')) +
      (secs.length ? '<div class="secs">' + secs.map(function (s) { return '<a href="#' + s.id + '">' + esc(s.getAttribute('data-nav')) + '</a>'; }).join('') + '</div>' : '') +
      (embed ? '<button class="find" type="button" data-quickfind aria-label="Quick find">' + icon('search') + '<span>Find</span></button>' : '') + '</div>';
    var main = d.querySelector('main');
    if (main) main.parentNode.insertBefore(nav, main); else body.insertBefore(nav, body.firstChild);
    body.classList.add('has-subnav');
    if (!secs.length || !('IntersectionObserver' in window)) return;
    var links = qsa('.secs a', nav), box = nav.querySelector('.secs');
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) {
          var on = l.getAttribute('href') === '#' + e.target.id;
          if (on) { l.setAttribute('aria-current', 'true'); box.scrollLeft = Math.max(0, l.offsetLeft - box.offsetLeft - 24); } else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ---------- motion helpers ---------- */
  /* <div class="grid g3" data-stagger> reveals its children one after another */
  function stagger() {
    qsa('[data-stagger]').forEach(function (box) {
      var step = parseFloat(box.getAttribute('data-stagger')) || 0.08;
      [].forEach.call(box.children, function (c, i) { if (!c.hasAttribute('data-reveal')) c.setAttribute('data-reveal', ''); c.style.setProperty('--d', (i * step).toFixed(2) + 's'); });
    });
  }
  /* <b data-count>8,500</b> counts up to the number already written in the page */
  function counts() {
    var els = qsa('[data-count]'); if (!els.length || reduce || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target, full = el.textContent, m = /^(\D*)([\d,]+)(.*)$/.exec(full); if (!m) return;
        var end = +m[2].replace(/,/g, ''), comma = m[2].indexOf(',') >= 0, t0 = null, dur = 1300;
        var fmt = function (v) { v = String(Math.round(v)); return comma ? v.replace(/\B(?=(\d{3})+$)/g, ',') : v; };
        var step = function (t) {
          if (t0 == null) t0 = t; var p = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - p, 3);
          el.textContent = p < 1 ? m[1] + fmt(end * ease) + m[3] : full;
          if (p < 1) requestAnimationFrame(step);
        };
        el.style.minWidth = el.offsetWidth + 'px'; requestAnimationFrame(step);
        setTimeout(function () { el.textContent = full; }, dur + 400);   /* whatever happens, the real figure ends up on the page */
      });
    }, { threshold: 0.4 });
    els.forEach(function (e) { io.observe(e); });
  }


  /* ---------- ENTER A SHOT ----------
     The one form for putting a shot on Kolab: this month's challenge, High Roller, or COAP's feedback space.
     It runs on community.coaponline.com (Kolab, on our address and the member's COAP login) and opens over any member page.
     Opened by any link to #enter-challenge, #enter-hr or #enter-feedback, or by [data-up-open][data-up-where]. */
  var UP = {
    challenge: { k: 'This month’s challenge', t: 'Enter Keep it dark', cap: 'Caption', ph: 'Where and what, and any settings worth knowing.', line: 'Entries show on the Shots page and on Kōlab, and so do the comments on them.', go: 'Enter this shot', done: 'Keep it dark' },
    hr: { k: 'High Roller: February', max: 2, lim: 'Max 3 shots. You’ve 2 left.', t: 'Enter High Roller', cap: 'Caption', ph: 'Where and what, and any settings worth knowing.', line: 'Entries show on the Shots page and on Kōlab. Guest judges score them after the round closes.', go: 'Enter this shot', done: 'High Roller: February' },
    feedback: { k: 'Get feedback', t: 'Put up a shot for feedback', cap: 'What would you like to know?', ph: 'Is the crop right? Too much noise? Anything you’re unsure about.', line: 'Feedback shots go up in COAP’s feedback space on Kōlab. Rich, Tom and members comment there, and anyone on Kōlab can see them.', go: 'Put it up', done: 'Get feedback' }
  };
  var upEl = null, upCur = 'challenge', upN = 1;
  var RAW = /\.(cr2|cr3|crw|nef|nrw|arw|srf|sr2|raf|orf|rw2|dng|pef|3fr|iiq|x3f)$/i;
  function upBuild() {
    upEl = d.createElement('div'); upEl.className = 'fx-up'; upEl.hidden = true;
    upEl.innerHTML = '<form class="box" role="dialog" aria-modal="true" aria-labelledby="fx-up-t" onsubmit="return false">' +
      '<button class="x" type="button" data-up-close aria-label="Close">' + icon('close') + '</button>' +
      '<p class="fx-k" data-up-k></p><h3 class="caps" id="fx-up-t" data-up-t></h3>' +
      /* as on Kolab's own sheet: the Mission's limit before they pick, several shots in one post, RAW refused */
      '<p class="fx-lim" data-up-lim></p>' +
      '<label class="fx-drop"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic" class="sr" data-up-first><img data-up-img src="' + asset('kolab/k-21.webp') + '" alt="The shot you picked"><span>' + icon('upload') + 'Change shot</span></label>' +
      '<div class="fx-thumbs" data-up-thumbs><label class="fx-addmore" data-up-addl><input type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple class="sr">' + icon('plus') + 'Add another shot</label></div>' +
      '<p class="fx-err" data-up-err role="alert" hidden></p>' +
      '<label class="fx-cap"><span data-up-cap></span><textarea rows="2" data-up-ph></textarea></label>' +
      /* no software question: Kolab reads the camera, lens, settings and editing software from the file */
      '<label class="fx-sw"><input type="checkbox" checked><span><b>Show how you got it</b><small>Camera, lens and settings, read from the file.</small></span></label>' +
      '<details class="fx-more"><summary>Add the unedited version</summary><div><label class="fx-sm">Before the edit <input type="file" accept="image/jpeg,image/png,image/webp,image/heic"></label></div></details>' +
      '<p class="fx-pubnote"><img src="' + asset('kolab-icon.webp') + '" alt="" width="22" height="22"><span data-up-line></span></p>' +
      '<div class="fx-go"><button class="btn" type="button" data-up-send></button><small>Uses your COAP login. Powered by Kōlab.</small></div></form>';
    d.body.appendChild(upEl);
    upEl.addEventListener('change', function (e) { if (e.target.type === 'file') upFiles(e.target); });
  }
  function upFiles(inp) {
    var fs = [].slice.call(inp.files || []), err = upEl.querySelector('[data-up-err]'), max = UP[upCur].max || 99;
    err.hidden = true;
    if (fs.some(function (f) { return RAW.test(f.name); })) { err.textContent = 'RAW files can’t be added. Export a JPEG and pick that.'; err.hidden = false; inp.value = ''; return; }
    if (inp.hasAttribute('data-up-first')) { if (fs[0]) upEl.querySelector('[data-up-img]').src = URL.createObjectURL(fs[0]); return; }
    var addl = upEl.querySelector('[data-up-addl]'); if (!addl.contains(inp)) return;
    fs.forEach(function (f) {
      if (upN >= max) { err.textContent = 'That’s the limit for this Mission.'; err.hidden = false; return; }
      var i = d.createElement('img'); i.src = URL.createObjectURL(f); i.alt = 'Shot ' + (++upN); addl.parentNode.insertBefore(i, addl);
    });
    addl.hidden = upN >= max; inp.value = '';
  }
  function upOpen(w) {
    if (!upEl) upBuild();
    upCur = UP[w] ? w : 'challenge'; var c = UP[upCur];
    upEl.querySelector('[data-up-k]').textContent = c.k; upEl.querySelector('[data-up-t]').textContent = c.t;
    upEl.querySelector('[data-up-cap]').innerHTML = c.cap + ' <small>Optional</small>'; upEl.querySelector('[data-up-ph]').placeholder = c.ph;
    upEl.querySelector('[data-up-line]').textContent = c.line; upEl.querySelector('[data-up-send]').textContent = c.go;
    upN = 1; [].forEach.call(upEl.querySelectorAll('[data-up-thumbs] img'), function (i) { i.remove(); });
    upEl.querySelector('[data-up-addl]').hidden = (c.max || 99) < 2; upEl.querySelector('[data-up-err]').hidden = true;
    upEl.querySelector('[data-up-lim]').textContent = (c.lim || 'One post can hold several shots.') + ' JPEG or PNG, not RAW.';
    upEl.hidden = false; root.classList.add('fx-lock'); upEl.querySelector('[data-up-close]').focus();
  }
  function upShut() { if (upEl) upEl.hidden = true; root.classList.remove('fx-lock'); }
  function upToast() {
    var t = d.querySelector('.fx-toast'); if (!t) { t = d.createElement('div'); t.className = 'fx-toast'; t.setAttribute('role', 'status'); d.body.appendChild(t); }
    t.innerHTML = icon('check') + '<span>Your shot is up in <b>' + UP[upCur].done + '</b>.</span><a href="' + link('shots.html#yours') + '">Your shots</a>';
    t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, 5200);
  }
  function upHash() { var m = /^#enter-(challenge|hr|feedback)$/.exec(location.hash); if (m && area === 'member') upOpen(m[1]); }

  /* ---------- wiring ---------- */
  function wire() {
    d.addEventListener('click', function (e) {
      if (!e.target.closest) return;
      if (e.target.closest('[data-quickfind]')) { e.preventDefault(); openFind(); return; }
      var ps = d.querySelector('[data-site-post]');
      var en = e.target.closest('[data-up-open], a[href*="#enter-"]');
      if (en && area === 'member') {
        var mw = en.getAttribute('data-up-where') || ((/#enter-(challenge|hr|feedback)/.exec(en.getAttribute('href') || '') || [])[1]);
        e.preventDefault(); if (ps) ps.hidden = true; upOpen(mw); return;
      }
      if (upEl && !upEl.hidden) {
        if (e.target.closest('[data-up-close]') || e.target === upEl) { upShut(); return; }
        if (e.target.closest('[data-up-send]')) { upShut(); upToast(); return; }
      }
      if (ps) {
        if (e.target.closest('[data-post]')) { e.preventDefault(); ps.hidden = false; var f1 = ps.querySelector('a'); if (f1) f1.focus({ preventScroll: true }); return; }
        if (!ps.hidden && (e.target === ps || e.target.closest('[data-post-close]') || e.target.closest('.psheet a'))) ps.hidden = true;
      }
      var s = e.target.closest('a.shot');
      if (s && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button)) { e.preventDefault(); lbFromTile(s); return; }
      var nav = e.target.closest('.gal-nav');
      if (nav) { var tr = nav.parentNode.querySelector('.gal-track'); if (tr) tr.scrollBy({ left: (nav.classList.contains('prev') ? -1 : 1) * tr.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' }); return; }
      /* embedded mode: keep the next same-site page embedded too */
      var a = e.target.closest('a[href]');
      if (embed && a && !a.target && a.host === location.host && /\.html$/.test(a.pathname) && !/[?&]embed=1/.test(a.search) && a.pathname !== location.pathname) {
        a.search += (a.search ? '&' : '?') + 'embed=1';
      }
      tag(a);
    });
    /* Every link that leaves COAP Online carries our tracking, so partners (COAP Wings, Clifton, Kolab) see the visit came from us.
       Added at the moment of the click (and middle-click), so links in Kajabi's own feed get it too. Existing utm_ values are kept. */
    function tag(a) {
      if (!a || !/^https?:$/.test(a.protocol) || a.host === location.host || /(^|\.)(coaponline\.com|kajabi\.com|mykajabi\.com)$/.test(a.hostname)) return;
      if (/[?&]utm_source=/.test(a.search)) return;
      var q = 'utm_source=coaponline&utm_medium=member_site&utm_campaign=' + encodeURIComponent(page || 'site') +
        '&utm_content=' + encodeURIComponent(((a.getAttribute('data-track') || (a.querySelector('h3') || a.querySelector('h4') || a).textContent || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'link').slice(0, 40));
      a.search += (a.search ? '&' : '?') + q;
    }
    d.addEventListener('auxclick', function (e) { tag(e.target.closest && e.target.closest('a[href]')); });
    d.addEventListener('contextmenu', function (e) { tag(e.target.closest && e.target.closest('a[href]')); });
    d.addEventListener('keydown', function (e) {
      if (upEl && !upEl.hidden && e.key === 'Escape') { e.preventDefault(); upShut(); return; }
      if (modal) {
        if (e.key === 'Escape') { e.preventDefault(); modalClose(); return; }
        if (e.key === 'Tab') { trapTab(e); return; }
        if (modal === lb) {
          if (e.key === 'ArrowRight') { e.preventDefault(); lbGo(1); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); lbGo(-1); }
          else if (e.key === 'Home') { e.preventDefault(); lbAt = 0; lbShow(); }
          else if (e.key === 'End') { e.preventDefault(); lbAt = lbList.length - 1; lbShow(); }
        }
        return;
      }
      var t = e.target, typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      if ((e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) || ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K'))) { e.preventDefault(); openFind(); }
    });
    var hdr = d.querySelector('.hdr');
    if (hdr) { var onScroll = function () { hdr.classList.toggle('scrolled', window.scrollY > 8); }; window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); }
    /* a filmstrip scrolls sideways with the arrow keys when it has focus */
    qsa('.gal-track').forEach(function (tr) {
      tr.addEventListener('keydown', function (e) {
        if (e.target !== tr) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); tr.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * 320, behavior: reduce ? 'auto' : 'smooth' }); }
      });
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', ready); else ready();

  window.COAP = {
    facts: FACTS, icon: icon, setView: setView,
    get view() { return view; },
    get embed() { return embed; },
    nav: { public: PUBLIC_NAV, cta: PUBLIC_CTA, member: MEMBER_NAV, menu: MEMBER_MENU },
    kolab: KOLAB, shots: pick, gallery: gallery, loadKolab: loadKolab,
    kolabEndpoint: 'https://kolab.social/api/feed/feeds-services/v1/kolabs/kolab-posts?kolabId={id}&limit=24',
    lightbox: openLightbox, find: openFind, index: INDEX, guides: GUIDES, guidePrice: GUIDE_PRICE
  };
})();

/* The gold line under the main menu slides: to the tab you point at, back to the page you're on, and across when the page changes. */
(function () {
  var d = document;
  function setup() {
    var nav = d.querySelector('.hdr nav'); if (!nav || nav.querySelector('.navline')) return;
    var line = d.createElement('span'); line.className = 'navline'; line.setAttribute('aria-hidden', 'true'); nav.appendChild(line);
    nav.classList.add('has-line');
    function to(a, instant) {
      if (!a) { line.style.opacity = '0'; return; }
      if (instant) line.style.transition = 'none';
      line.style.opacity = '1'; line.style.width = Math.max(0, a.offsetWidth - 26) + 'px'; line.style.transform = 'translateX(' + (a.offsetLeft + 13) + 'px)';
      if (instant) { line.offsetWidth; line.style.transition = ''; }
    }
    var cur = function () { return nav.querySelector(':scope > a[aria-current="page"], :scope > .xdd.on'); };
    var pick = function (t) { return t.closest ? (t.closest('.xdd') || t.closest('a')) : null; };
    to(cur(), true);
    nav.addEventListener('mouseover', function (e) { var a = pick(e.target); if (a) to(a); });
    nav.addEventListener('mouseleave', function () { to(cur()); });
    nav.addEventListener('focusin', function (e) { var a = pick(e.target); if (a) to(a); });
    nav.addEventListener('focusout', function () { to(cur()); });
    window.addEventListener('resize', function () { to(cur(), true); });
    window.addEventListener('load', function () { to(cur(), true); });
  }
  function go() { setup(); var h = d.querySelector('.hdr'); if (h && window.MutationObserver) new MutationObserver(setup).observe(h, { childList: true, subtree: true }); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { setTimeout(go, 0); }); else setTimeout(go, 0);
})();
/* Close the Live tonight bar */
document.addEventListener('click', function (e) {
  var x = e.target.closest ? e.target.closest('[data-annc-x]') : null; if (!x) return;
  var b = x.closest('.annc'); if (b) b.parentNode.removeChild(b);
  try { sessionStorage.setItem('coap-annc', '1'); } catch (err) {}
});


