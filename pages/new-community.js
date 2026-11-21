
/* The Merge, made to feel alive: notifications drop in, the Inspired count ticks, a reply types itself, and the Inspired buttons work. Mock only. */
(function () {
  var d = document, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ic = function (n) { return window.COAP && COAP.icon ? COAP.icon(n) : ''; };
  var T = [
    ['https://coaponline.github.io/site-assets/assets/rich-face.webp', '<b>Rich</b> replied to your post', 'Bring a wide lens for the hangars'],
    ['star', '<b>7 members</b> found your shot inspiring', 'Keep it dark'],
    ['https://coaponline.github.io/site-assets/assets/community/av-08.webp', '<b>A member</b> added a shot', 'Keep it dark'],
    ['video', '<b>Live workshop with Matty</b>', 'Starts in 1 hr. Join on Zoom'],
    ['https://coaponline.github.io/site-assets/assets/tom-face.webp', '<b>Tom</b> answered in Help', 'It’s under Live, then Replays'],
    ['https://coaponline.github.io/site-assets/assets/kolab/k-02.webp', '<b>Shot of the week</b> is up', 'Joe Copalman, picked by Rich']
  ];
  var box = d.querySelector('[data-cpm-toasts]'), k = 0;
  function toast() {
    if (!box) return;
    var t = T[k++ % T.length], el = d.createElement('div'); el.className = 'cpm-toast';
    el.innerHTML = (t[0].indexOf('.') > -1 ? '<img src="' + t[0] + '" alt="">' : '<i>' + ic(t[0]) + '</i>') + '<span>' + t[1] + '<small>' + t[2] + '</small></span>';
    box.appendChild(el); setTimeout(function () { el.remove(); }, 4200);
  }
  if (!reduce) { setTimeout(toast, 900); setInterval(toast, 2600); } else { toast(); }

  /* the hero post: Inspired ticks up, then a second reply types in */
  var cnt = d.querySelector('[data-cpm-count]'), n = 19;
  if (cnt && !reduce) setInterval(function () {
    if (n >= 27) return; n++; cnt.querySelector('b').textContent = n; cnt.classList.add('pop'); setTimeout(function () { cnt.classList.remove('pop'); }, 200);
  }, 3100);
  /* the reply's space is kept from the start, so nothing moves when it arrives */
  var slot = d.querySelector('[data-cpm-slot]'), com = d.querySelector('[data-cpm-com]');
  if (slot) {
    if (reduce) slot.classList.remove('wait');
    else setTimeout(function () { slot.classList.add('typing'); setTimeout(function () { slot.classList.remove('typing', 'wait'); if (com) com.textContent = '14'; }, 2200); }, 3800);
  }

  /* Inspired buttons work */
  d.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cpm-like]'); if (!b) return;
    var c = b.querySelector('b'), on = b.classList.toggle('on'); c.textContent = (+c.textContent) + (on ? 1 : -1);
    b.classList.add('pop'); setTimeout(function () { b.classList.remove('pop'); }, 200);
  });

  /* the ticker loops: write its list twice */
  var ul = d.querySelector('.cpm-tick ul'); if (ul) ul.innerHTML += ul.innerHTML;
})();
