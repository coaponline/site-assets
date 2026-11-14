
(function(){
  var d=document,root=d.documentElement;
  /* No thanks */
  d.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-ft-no]');if(!b)return;root.classList.add('ft-done');scrollTo({top:0,behavior:'smooth'});});
  /* sticky bar: shows once the hero's buy button has scrolled out of view */
  var bar=d.querySelector('[data-ft-bar]'),hb=d.querySelector('.ft-hero .ft-btn'),end=d.querySelector('.ft-end');
  if(bar&&hb&&'IntersectionObserver' in window){var hv=true,ev=false;function upd(){bar.classList.toggle('on',!hv&&!ev);}
    new IntersectionObserver(function(en){hv=en[0].isIntersecting||en[0].boundingClientRect.top>0;upd();}).observe(hb);
    new IntersectionObserver(function(en){ev=en[0].isIntersecting;upd();}).observe(end);}
  /* DRAG TO COMPARE. It sweeps once on its own when it comes into view, until someone touches it. */
  var cmp=d.querySelector('[data-cmp]'),ci=d.querySelector('[data-cmp-in]');if(!cmp||!ci)return;
  var touched=false;function setX(v){cmp.style.setProperty('--x',v+'%');ci.value=v;}
  ci.addEventListener('input',function(){touched=true;setX(+ci.value);});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){
    var done=false,io=new IntersectionObserver(function(en){if(!en[0].isIntersecting||done)return;done=true;var t0=null;
      function step(ts){if(touched)return;if(!t0)t0=ts;var k=(ts-t0)/2600;if(k>1){setX(50);return;}setX(50+Math.sin(k*Math.PI*2)*32);requestAnimationFrame(step);}
      requestAnimationFrame(step);},{threshold:.5});io.observe(cmp);}
})();
