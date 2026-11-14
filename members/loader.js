/* COAP new look: the switch. This file is the source of the snippet pasted into Kajabi's theme script boxes
   (each course's product theme "embedded scripts", and the site theme's "js" box). It does nothing unless switched on.

   On:   open any member page with ?newlook=on   (remembered in this browser)
   Off:  open any member page with ?newlook=off
   Launch day: change the 0 at the end of the snippet to 1 in every theme, so everyone gets the new look.

   When on, it hides the page for a moment (at most 5 seconds) and loads members/boot.js, which rebuilds the page. */
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
