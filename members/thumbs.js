/* COAP replay preview images. Kajabi's connector can't upload a lesson thumbnail, so the replays job makes one and
   puts it in /replays/<lesson id>.jpg, listed in /replays/index.json. On a course section page, any lesson in that
   list with no Kajabi thumbnail of its own gets ours. A thumbnail set in Kajabi always wins. Loaded by a one-line
   snippet in the Learning Resources theme (and by members/boot.js for the new look). */
(function () {
  var B = 'https://coaponline.github.io/site-assets/replays/';
  function id(a) { var m = (a.getAttribute('href') || '').match(/\/posts\/(\d+)/); return m ? m[1] : null; }
  function apply(ids) {
    var rows = document.querySelectorAll('a.category-post');
    for (var i = 0; i < rows.length; i++) {
      var a = rows[i], n = id(a);
      if (!n || ids.indexOf(Number(n)) < 0 || a.querySelector('img.category-post-img')) continue;
      var body = a.querySelector('.media-body'); if (!body || !body.parentNode) continue;
      var w = document.createElement('div'), im = document.createElement('img');
      im.className = 'category-post-img'; im.alt = ''; im.loading = 'lazy'; im.src = B + n + '.jpg';
      im.onerror = function () { var p = this.parentNode; if (p && p.parentNode) p.parentNode.removeChild(p); };
      w.appendChild(im); body.parentNode.insertBefore(w, body);
    }
  }
  function go() {
    if (!document.querySelector('a.category-post')) return;
    fetch(B + 'index.json?v=' + Math.floor(Date.now() / 6e5)).then(function (r) { return r.ok ? r.json() : { ids: [] }; })
      .then(function (j) { apply((j && j.ids) || []); }).catch(function () {});
  }
  window.coapThumbs = apply;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
