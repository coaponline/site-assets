
(function () {
  var lb = document.getElementById('gx-lb'); if (!lb || !lb.showModal) return;
  var img = document.getElementById('gx-lb-img'), t = document.getElementById('gx-lb-t'), c = document.getElementById('gx-lb-c'), buy = document.getElementById('gx-lb-buy');
  var list = [], at = 0, name = '', total = 0;
  function show() {
    var p = list[at]; img.src = p[0]; img.alt = name + ': ' + p[1];
    t.textContent = name; c.textContent = at === 0 ? 'The cover' : p[1] + ', page ' + p[2] + (total ? ' of ' + total : '');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.gx-desk button'); 
    if (b) {
      var desk = b.closest('.gx-desk');
      list = desk.getAttribute('data-pages').split('|').map(function (x) { return x.split('~'); });
      name = desk.getAttribute('data-name'); total = +desk.getAttribute('data-total') || 0; at = +b.getAttribute('data-i') || 0;
      var src = desk.closest('.gx').querySelector('[data-guides="buy"]');
      buy.innerHTML = src ? src.innerHTML : '';
      show(); lb.showModal(); return;
    }
    var n = e.target.closest('[data-lb]'); if (!n || !lb.open) return;
    var v = n.getAttribute('data-lb');
    if (v === 'x') { lb.close(); return; }
    at = (at + (+v) + list.length) % list.length; show();
  });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('gx-lb-in')) lb.close(); });
  document.addEventListener('keydown', function (e) { if (!lb.open) return; if (e.key === 'ArrowRight') { at = (at + 1) % list.length; show(); } if (e.key === 'ArrowLeft') { at = (at - 1 + list.length) % list.length; show(); } });
})();
