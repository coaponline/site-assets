
(function(){
  'use strict';
  /* ---- the three nights. January is GMT, so 7pm UK is 19:00 UTC. ---- */
  var START=Date.UTC(2027,0,12,19,0,0);
  var ZOOM_URL='';            /* [CONFIRM] paste the Zoom link here so the calendar entries carry it */
  var TITLE='The Free 3-Day Aviation Photography Workshop';
  var NIGHTS=[['20270112','Night one: Shoot it'],['20270113','Night two: Edit it'],['20270114','Night three: Show it']];
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $all(s,r){return [].slice.call((r||document).querySelectorAll(s));}

  /* ---- 1. Kajabi: move the native form block(s) into the slots ---- */
  function moveForms(){
    var moved=0, slots=$all('.formslot');
    slots.forEach(function(slot){
      var blk=document.getElementById(slot.getAttribute('data-kjb-block'));
      if(!blk||slot.contains(blk)){return;}
      var ph=slot.querySelector('form.sf'), id=ph?ph.id:'';
      if(ph){ph.parentNode.removeChild(ph);}
      slot.appendChild(blk); if(id){slot.id=id;} moved++;
    });
    /* On Kajabi with only the first block present, the second placeholder
       can't submit, so it becomes a button back up to the real form. */
    if(moved){slots.forEach(function(slot){var ph=slot.querySelector('form.sf');
      if(ph){slot.innerHTML='<a class="cbtn wide" href="#signup">Save my free seat</a>';}});}
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',moveForms);}else{moveForms();}

  /* ---- 2. countdown to night one ---- */
  function pad(n){return String(n).padStart(2,'0');}
  function setAll(c,v){$all('.'+c).forEach(function(e){e.textContent=v;});}
  function tick(){
    var ms=START-Date.now();
    if(ms<=0){$all('.cdbox').forEach(function(b){b.hidden=true;});clearInterval(tm);return;}
    var d=ms/1000|0;setAll('cdd',pad(d/86400|0));setAll('cdh',pad(d%86400/3600|0));setAll('cdm',pad(d%3600/60|0));setAll('cds',pad(d%60));
  }
  var tm=setInterval(tick,1000);tick();

  /* ---- 3. the visitor's local time ---- */
  try{
    var when=new Date(START), tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
    var hm=function(z){return when.toLocaleString('en-GB',{timeZone:z,weekday:'long',hour:'2-digit',minute:'2-digit',hour12:false});};
    if(tz&&hm(tz)!==hm('Europe/London')){
      var day=when.toLocaleDateString('en-GB',{weekday:'long'});
      var t=when.toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true}).replace(':00','').replace(/\s/g,'');
      var city=tz.split('/').pop().replace(/_/g,' ');
      $all('[data-tz]').forEach(function(e){e.textContent='Night one is '+day+' at '+t+' your time ('+city+').';});
    }
  }catch(e){}

  /* ---- 4. calendar: a real .ics with all three nights, and a Google link ---- */
  function ics(){
    var zoom=ZOOM_URL||'Your Zoom link is in your confirmation email.';
    var L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//COAP Online//Workshop January 2027//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    NIGHTS.forEach(function(n,i){
      L.push('BEGIN:VEVENT','UID:workshop-jan-2027-night-'+(i+1)+'@coaponline.com','DTSTAMP:20261111T120000Z',
        'DTSTART:'+n[0]+'T190000Z','DTEND:'+n[0]+'T203000Z',
        'SUMMARY:'+n[1]+' (Free Aviation Photography Workshop)',
        'LOCATION:'+(ZOOM_URL||'Live on Zoom'),
        'DESCRIPTION:7pm UK\\, 90 minutes. '+zoom.replace(/,/g,'\\,'),
        'BEGIN:VALARM','TRIGGER:-PT15M','ACTION:DISPLAY','DESCRIPTION:'+n[1]+' starts in 15 minutes','END:VALARM','END:VEVENT');
    });
    L.push('END:VCALENDAR');
    /* fold long lines at 73 characters, as RFC 5545 asks */
    return L.map(function(l){var o=[];while(l.length>73){o.push(l.slice(0,73));l=' '+l.slice(73);}o.push(l);return o.join('\r\n');}).join('\r\n');
  }
  function wireCal(root){
    var uri='data:text/calendar;charset=utf-8,'+encodeURIComponent(ics());
    $all('[data-ics]',root).forEach(function(a){a.href=uri;a.setAttribute('download','aviation-photography-workshop.ics');});
    if(ZOOM_URL){$all('[data-gcal]',root).forEach(function(a){a.href=a.href.replace(/location=[^&]*/,'location='+encodeURIComponent(ZOOM_URL));});}
  }
  wireCal(document);

  /* ---- 5. standalone preview: show "You're in" on submit.
          On Kajabi the native form posts and redirects to the confirmation
          page, so this never runs there (the placeholder forms are removed). ---- */
  var calSrc=document.querySelector('[data-cal]');
  function youreIn(name){
    $all('[data-card]').forEach(function(card){
      var slot=card.querySelector('.formslot'); if(!slot){return;}
      var box=document.createElement('div');box.className='okbox';box.setAttribute('role','status');
      var h=document.createElement('h3');h.innerHTML='<i>&#10003;</i>';h.appendChild(document.createTextNode("You're in"+(name?', '+name:'')+'.'));
      var p=document.createElement('p');p.textContent='Your Zoom link is on its way to your inbox. Add the three nights to your diary now, while you’re here.';
      var cal=calSrc.cloneNode(true);
      var t=document.createElement('p');t.className='task';t.innerHTML='<b>Your first job:</b> pick the one shot you’ll bring on Tuesday.';
      box.appendChild(h);box.appendChild(p);box.appendChild(cal);box.appendChild(t);
      slot.innerHTML='';slot.appendChild(box);if(!slot.id){slot.id=card.closest('.final')?'signup2':'signup';}
    });
    document.body.setAttribute('data-in','1');
    var mb=document.getElementById('mbar');if(mb){mb.hidden=true;}
    $all('a[href="#signup"]').forEach(function(a){if(!a.closest('.mbar')){a.textContent="You're in";}});
  }
  $all('form.sf').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var n=f.querySelector('input[type=text]'), m=f.querySelector('input[type=email]'), err=f.querySelector('.err');
      var okN=n.value.trim().length>0, okM=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.value.trim());
      n.classList.toggle('bad',!okN);m.classList.toggle('bad',!okM);err.hidden=okN&&okM;
      if(!okN){n.focus();return;} if(!okM){m.focus();return;}
      var card=f.closest('[data-card]');
      youreIn(n.value.trim().split(/\s+/)[0]);
      if(card){card.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'});}
    });
  });

  /* ---- 6. sticky mobile bar: hide it while a form is on screen ---- */
  var mbar=document.getElementById('mbar');
  if(mbar&&'IntersectionObserver' in window){
    var seen=new Set();
    var fo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){seen.add(e.target);}else{seen.delete(e.target);}});
      mbar.classList.toggle('off',seen.size>0);},{threshold:.25});
    $all('.formslot').forEach(function(s){fo.observe(s);});
  }

  /* ---- 7. reveal on scroll. The class is added here, so with JS off nothing is hidden. ---- */
  if(!reduce&&'IntersectionObserver' in window){
    var els=$all('.sec .head,.nc,.livebar,.mail,.fit .ph,.yes li,.need > div,.who-st > div,.fc,.rvc,.kc,.faq details');
    var vh=window.innerHeight;
    els.forEach(function(el){if(el.getBoundingClientRect().top<vh){return;}
      el.classList.add('reveal');var i=[].indexOf.call(el.parentNode.children,el);el.style.setProperty('--d',Math.min(i,4)*0.08+'s');});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -6% 0px',threshold:0.1});
    $all('.reveal').forEach(function(el){io.observe(el);});
    /* safety net: if anything is still hidden after 4s on screen-less browsers, show it */
    window.addEventListener('load',function(){setTimeout(function(){$all('.reveal:not(.in)').forEach(function(el){if(el.getBoundingClientRect().top<window.innerHeight){el.classList.add('in');}});},4000);});
  }
})();
