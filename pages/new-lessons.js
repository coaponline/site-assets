
/* lessons.html only: the before and after in "Edit it". Without script it sits at half and half. */
(function(){
  var c=document.getElementById('ls-cmp'); if(!c) return;
  var r=c.querySelector('input');
  r.addEventListener('input',function(){c.classList.remove('ls-nudge');c.style.setProperty('--p',r.value+'%');});
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){c.classList.add('ls-nudge');io.disconnect();}});},{threshold:.5});
    io.observe(c);
  }
})();
