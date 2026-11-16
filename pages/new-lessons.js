
/* learning.html only: the header, the reveals, the trailer and the drag. Without script the videos show their posters. */
(function () {
  var d = document, w = window, reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* header turns to dark glass once you leave the top */
  function hdr() { var h = d.querySelector('.hdr'); if (h) h.classList.toggle('lg-solid', w.scrollY > 40); }
  w.addEventListener('scroll', hdr, { passive: true }); w.addEventListener('load', hdr); setTimeout(hdr, 200);

  /* reveals */
  var rv = [].slice.call(d.querySelectorAll('.lg-rv'));
  if ('IntersectionObserver' in w && !reduce) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }); }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('on'); });

  /* shelf loops play only while on screen */
  var loops = [].slice.call(d.querySelectorAll('video[data-lg-auto]'));
  if ('IntersectionObserver' in w) {
    var lo = new IntersectionObserver(function (en) { en.forEach(function (e) { var v = e.target; if (e.isIntersecting && !reduce) { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); }); }, { threshold: .35 });
    loops.forEach(function (v) { lo.observe(v); });
  }
  if (reduce) { var hv = d.querySelector('.lg-hero video'); if (hv) { hv.removeAttribute('autoplay'); hv.pause(); } }

  /* the trailer: grows as it scrolls in, plays while it's on screen */
  var stage = d.getElementById('lg-stage'), film = d.getElementById('lg-film'), pp = d.getElementById('lg-pp'), userPaused = false;
  function grow() {
    if (!stage) return;
    var r = stage.getBoundingClientRect(), vh = w.innerHeight;
    var g = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.9) - 0.15));
    stage.style.setProperty('--g', reduce ? 1 : g.toFixed(3));
  }
  w.addEventListener('scroll', grow, { passive: true }); w.addEventListener('resize', grow); grow();
  function setBtn(playing) { pp.setAttribute('aria-label', playing ? 'Pause the trailer' : 'Play the trailer'); pp.querySelector('span').textContent = playing ? 'Pause' : 'Play'; pp.querySelector('path').setAttribute('d', playing ? 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z' : 'M7 4.5v15l12.5-7.5z'); }
  function play() { var p = film.play(); if (p && p.catch) p.catch(function () {}); setBtn(true); }
  if (film) {
    if ('IntersectionObserver' in w) {
      new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting && !userPaused && !reduce) { film.preload = 'auto'; play(); } else if (!e.isIntersecting) { film.pause(); setBtn(false); } }); }, { threshold: .4 }).observe(film);
    }
    pp.addEventListener('click', function () { if (film.paused) { userPaused = false; play(); } else { userPaused = true; film.pause(); setBtn(false); } });
    setBtn(false);
    /* sound: browsers only autoplay muted, so sound is one tap. Turning it on restarts from the top. */
    var snd = d.getElementById('lg-snd');
    snd.addEventListener('click', function () {
      if (film.muted) { film.muted = false; film.currentTime = 0; userPaused = false; play(); snd.querySelector('span').textContent = 'Sound off'; snd.setAttribute('aria-label', 'Turn the sound off'); }
      else { film.muted = true; snd.querySelector('span').textContent = 'Sound on'; snd.setAttribute('aria-label', 'Turn the sound on'); }
    });
  }
  [].forEach.call(d.querySelectorAll('[data-lg-play]'), function (a) { a.addEventListener('click', function (e) { e.preventDefault(); if (!film) { stage.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); return; } userPaused = false; film.muted = false; film.currentTime = 0; var sb = d.getElementById('lg-snd'); if (sb) { sb.querySelector('span').textContent = 'Sound off'; sb.setAttribute('aria-label', 'Turn the sound off'); } play(); stage.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }); });

  /* waitlist: in the mock it just says thanks */
  var wl = d.getElementById('lg-wl');
  if (wl) wl.addEventListener('submit', function (e) { e.preventDefault(); wl.hidden = true; d.getElementById('lg-wl-done').hidden = false; });

  /* before and after */
  var c = d.getElementById('lg-cmp');
  if (c) { var r = c.querySelector('input'); r.addEventListener('input', function () { c.style.setProperty('--p', r.value + '%'); }); }
})();
