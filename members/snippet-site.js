/* COAP new look switch: off unless this browser opened a page with ?newlook=on. Source: github.com/coaponline/site-assets members/loader.js */
(function (L) {
  var on = !!L, k = 'coap-newlook';
  try {
    var q = location.search.match(/[?&]newlook=(on|off)\b/);
    if (q) localStorage.setItem(k, q[1]);
    var v = localStorage.getItem(k);
    if (v === 'on') on = true; else if (v === 'off') on = false;
  } catch (e) {}
  if (!on) return;
  var d = document, h = d.documentElement;
  h.classList.add('coap-nl');
  var st = d.createElement('style'); st.id = 'coap-nl-cloak'; st.textContent = 'html.coap-nl body{visibility:hidden}';
  (d.head || h).appendChild(st);
  setTimeout(function () { var c = d.getElementById('coap-nl-cloak'); if (c) c.parentNode.removeChild(c); }, 5000);
  var s = d.createElement('script');
  s.src = 'https://coaponline.github.io/site-assets/members/boot.js?v=' + Math.floor(Date.now() / 6e5);
  (d.head || h).appendChild(s);
})(0);
