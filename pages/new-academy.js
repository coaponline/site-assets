
(function(){
  var P={
    GBP:{s:'\u00a3',dep:47,bal:400,eb:447,full:495,m3:149,mem:100,el:995,el3:332,grad:197},
    USD:{s:'$',dep:59,bal:538,eb:597,full:645,m3:199,mem:130,el:1297,el3:433,grad:259},
    EUR:{s:'\u20ac',dep:55,bal:464,eb:519,full:576,m3:173,mem:115,el:1157,el3:386,grad:229}
  };
  function setCur(c){
    var p=P[c]; if(!p){return;}
    document.querySelectorAll('[data-p]').forEach(function(el){var k=el.getAttribute('data-p'); if(p[k]!==undefined){el.textContent=p.s+p[k].toLocaleString('en-GB');}});
    document.querySelectorAll('[data-cur]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-cur')===c?'true':'false');});
    try{localStorage.setItem('apa-cur',c);}catch(e){}
  }
  document.querySelectorAll('[data-cur]').forEach(function(b){b.addEventListener('click',function(){setCur(b.getAttribute('data-cur'));});});
  var saved=null; try{saved=localStorage.getItem('apa-cur');}catch(e){}
  if(!saved){var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(e){}
    if(tz.indexOf('America/')===0){saved='USD';} else if(tz.indexOf('Europe/')===0){saved=(tz==='Europe/London')?'GBP':'EUR';}}
  setCur(saved||'GBP');

  var end=Date.UTC(2027,0,17,23,59,0);
  function pad(n){return (n>9?'':'0')+n;}
  function set(cls,v){document.querySelectorAll(cls).forEach(function(e){e.firstChild.nodeValue=v;});}
  function tick(){var t=Math.floor(Math.max(0,end-Date.now())/1000),m=Math.floor(t/60);
    set('.cdD',pad(Math.floor(m/1440))); set('.cdH',pad(Math.floor((m%1440)/60))); set('.cdM',pad(m%60)); set('.cdS',pad(t%60));}
  tick(); setInterval(tick,1000);

  function setState(s){document.body.setAttribute('data-state',s);
    document.querySelectorAll('.review button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-state')===s?'true':'false');});}
  document.querySelectorAll('.review button').forEach(function(b){b.addEventListener('click',function(){setState(b.getAttribute('data-state'));});});
  var CFGS=(window.COAP_SITE&&window.COAP_SITE.academyState)||'';
  setState(CFGS||(location.hash==='#waitlist'?'waitlist':location.hash==='#early'?'early':'open'));
  var ea=document.getElementById('ea'); if(ea&&!ea.hasAttribute('data-live')){ea.addEventListener('submit',function(e){e.preventDefault();document.getElementById('eaOk').hidden=false;});}
  var wl=document.getElementById('wl'); if(wl){wl.addEventListener('submit',function(e){e.preventDefault();document.getElementById('wlOk').hidden=false;});}
  /* v5: reveal on scroll, counters, raw/edit sliders */
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sel='.sec .head,.buy,.pain .ph,.pb,.blk,.grad,.lp,.case figure,.facts,.minis > div,.james,.stats > div,.wall,.grp,.bcard,.val-r,.fc,.who-st > div,.rvc,.cv,.plan,.guar,.faq details,.wk-top .clock';
  var els=[].slice.call(document.querySelectorAll(sel));
  els.forEach(function(el){el.classList.add('reveal');var i=[].indexOf.call(el.parentNode.children,el);el.style.setProperty('--d',Math.min(i,5)*0.08+'s');});
  function countUp(el){var t=+el.getAttribute('data-count'),plus=el.hasAttribute('data-plus');if(reduce||!t){return;}var t0=null;
    function f(ts){if(!t0){t0=ts;}var k=Math.min(1,(ts-t0)/1400),e=1-Math.pow(1-k,3),v=Math.round(t*e);el.textContent=v.toLocaleString('en-GB')+(plus&&k===1?'+':'');if(k<1){requestAnimationFrame(f);}}
    requestAnimationFrame(f);}
  function hint(c){if(reduce||c.dataset.done){return;}c.dataset.done=1;var t0=null;
    function f(ts){if(!t0){t0=ts;}var k=Math.min(1,(ts-t0)/1800),v=50-28*Math.sin(k*Math.PI*2);c.style.setProperty('--p',v+'%');if(k<1){requestAnimationFrame(f);}else{c.style.setProperty('--p','50%');}}
    requestAnimationFrame(f);}
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting){return;}var el=e.target;el.classList.add('in');
      el.querySelectorAll&&el.querySelectorAll('[data-count]').forEach(countUp);
      if(el.classList.contains('cmp')){setTimeout(function(){hint(el);},400);}
      io.unobserve(el);});},{rootMargin:'0px 0px -8% 0px',threshold:0.12});
    els.forEach(function(el){io.observe(el);});
    document.querySelectorAll('.cmp').forEach(function(c){io.observe(c);});
  } else {els.forEach(function(el){el.classList.add('in');});}
  /* flight path */
  (function(){var g=document.getElementById('what');if(!g){return;}
    g.querySelectorAll('.wp').forEach(function(w,i){w.style.setProperty('--i',i);});
    function place(){if(window.innerWidth<=760){return;}var fp=g.querySelector('.fpath'),pa=g.querySelector('#fpLine'),sv=g.querySelector('.fp-svg');if(!pa||!pa.getTotalLength){return;}
      var W=sv.getBoundingClientRect().width,L=pa.getTotalLength(),tx=[70,330,600,850,1090];
      g.querySelectorAll('.wp').forEach(function(w,i){var best=null,bd=1e9;for(var k=0;k<=400;k++){var pt=pa.getPointAtLength(L*k/400),d=Math.abs(pt.x-tx[i]);if(d<bd){bd=d;best=pt;}}
        var dot=w.querySelector('.dot');w.style.setProperty('--off',(dot.offsetHeight/2)+'px');w.style.left=(best.x/1160*W)+'px';w.style.top=(best.y+20)+'px';});}
    place();window.addEventListener('resize',place);
    function go(){g.classList.add('go');var am=g.querySelector('.fp-am');if(am&&am.beginElement&&!reduce){try{am.beginElement();}catch(e){}}g.querySelectorAll('[data-count]').forEach(countUp);}
    if(reduce||!('IntersectionObserver' in window)){g.classList.add('go');var am0=g.querySelector('.fp-am');if(am0){am0.setAttribute('dur','0.01s');try{am0.beginElement();}catch(e){}}return;}
    var o=new IntersectionObserver(function(es){if(es[0].isIntersecting){o.disconnect();setTimeout(go,300);}},{threshold:.35});o.observe(g.querySelector('.fpath'));
  })();
  /* floating chat */
  (function(){var cw=document.getElementById('cw');if(!cw){return;}
    var P=function(k){var e=document.querySelector('[data-p='+k+']');return e?e.textContent:'';};
    var RI='https://coaponline.github.io/site-assets/assets/rich-face.webp',TO='https://coaponline.github.io/site-assets/assets/tom-face.webp';
    var T=[
     {t:'How it works',q:['week','time','miss','live','upload','abroad']},
     {t:'Is it right for me?',q:['good','pro','kit','airshows','finish','who']},
     {t:'The feedback',q:['whofb','detail','where','more','private','member']},
     {t:'Price and paying',q:['deposit','monthly','guarantee','renew','member','grad','gift']},
     {t:'The bonuses',q:['bonuses','bonusend']}];
    var A={
     week:['What happens each week?',RI,['Every week is the same three steps.','<b>Learn:</b> a new lesson and challenge on Monday, about an hour.<br><b>Practise:</b> do the challenge with shots you already have, or new ones.<br><b>Get feedback:</b> upload by Sunday, and Rich and Tom reply by Wednesday.'],['time','miss']],
     time:['How much time does it take?',TO,['About two hours a week. An hour to watch the lesson, an hour on your shot, and five minutes to upload.','Want to go further? Shoot more, upload more and dig into the library. It\'s all there.'],['miss','week']],
     miss:['What if I miss a week?',RI,['You won\'t fall behind. Every live evening is recorded, and week 8 is a catch-up week.','The 10-Minute Catch-Up Cards put each week on one card, so you\'re back on track in ten minutes.'],['time','bonuses']],
     live:['When are the live evenings?',TO,['There are 8 live evenings across the 12 weeks, at 7pm UK. That\'s 2pm in New York and 8pm in Amsterdam.','Every one is recorded, so you can watch the next day if you can\'t make it.'],['abroad','miss']],
     upload:['How do I get set up on Kōlab?',TO,['Kōlab is our photo platform. It\'s a free account with the same email, and we set it up together on the kick-off call.'],['where','private']],
     abroad:['I live outside the UK. Can I join?',RI,['Yes. Everything is online and recorded, and the feedback is written, so it works from anywhere.','You can see prices in pounds, dollars or euros, and the Starter RAW Pack means you can practise even with no airshow nearby.'],['live','airshows']],
     good:['I\'m not good enough yet.',RI,['That\'s exactly who it\'s for. Most people join because they know they could be better and want someone to show them how.','Only Rich, Tom and your cohort see your work, and the feedback is honest and friendly.'],['private','pro']],
     pro:['I\'m already quite experienced.',TO,['Then the feedback is where you\'ll get the most. It\'s about your shots, at your level, every week.','Plenty of experienced photographers join for an honest second opinion and a reason to finish their best work.'],['detail','grad']],
     kit:['Is my kit good enough?',RI,['Any camera with manual settings will do. We\'ll show you how to get the most out of what you\'ve got before you think about spending more.'],['airshows','good']],
     airshows:['There are no airshows near me.',RI,['You don\'t need one. Every challenge works with shots you already have, a local airfield or a museum.','And the Starter RAW Pack gives you 24 of my raw files to practise on from day one.'],['bonuses','abroad']],
     finish:['I\'ve bought courses and never finished them.',TO,['This one has a start date, a cohort working on the same challenge, and someone waiting for your shot every Sunday.','If life gets in the way, week 8 is a catch-up week.'],['miss','time']],
     who:['Who is it for?',RI,['Aviation photographers with thousands of shots on their hard drive who want them to look like the ones they admire.','Beginners and experienced photographers both join. The feedback meets you where you are.'],['good','pro']],
     whofb:['Who gives the feedback?',TO,['Rich and Tom, every week, on your challenge. Rich has shot aviation professionally for 30 years, and I\'ve spent 20 years in Lightroom and Photoshop.'],['detail','more']],
     detail:['How detailed is the feedback?',RI,['It\'s written for your shot: what works, and the one thing to try next. Short enough to act on, and specific enough to make a difference.'],['more','private']],
     more:['Can I upload more than one shot?',TO,['Yes, as many as you like. Rich and Tom review your challenge, your cohort and Matty comment on the rest, and we pick some up in the Academy feedback evenings.'],['detail','private']],
     private:['Will other people see my work?',RI,['Only Rich, Tom and your cohort. It\'s a private space, so you can post the shots you\'re unsure about.'],['good','upload']],
     deposit:['How does the deposit work?',TO,['Pay {dep} today to secure your place, the early-bird price and all four bonuses.','The remaining {bal} balance is due by Sunday 24 January. The deposit is non-refundable, so only pay it if you mean to join.'],['monthly','guarantee'],1],
     monthly:['Can I spread the cost?',TO,['Yes. Pay in three payments of {m3}, with nothing added. It\'s not a subscription, so it ends in April.'],['deposit','renew'],1],
     guarantee:['What if it isn\'t for me?',RI,['Do the first month. If it isn\'t for you, email us within 30 days of the start date and we\'ll refund your course fee. Only the deposit is non-refundable.'],['renew','deposit'],1],
     renew:['Does anything renew?',TO,['No. The lessons and the community are yours for life, and you can follow any future cohort free.'],['grad','guarantee']],
     member:['I\'m already a member. What\'s the difference?',RI,['Members work monthly: one challenge, Matty\'s workshop, and a live feedback session where we pick shots to review.','The Academy works weekly: a lesson and challenge every week in your private space, with written feedback from Tom and me on every one.','Members get {mem} off a place and 48 hours before the public.'],['grad','where']],
     where:['Where do I post my shots?',TO,['Your weekly challenge goes in your private Academy space on COAP Online. That\'s where your feedback comes back too.','High Roller, our members\' competition, is there as well, if you want to enter.'],['private','more']],
     grad:['I\'ve done the Academy before.',TO,['Welcome back. Graduates can join another cohort, with weekly feedback again, for a one-off {grad} instead of {eb}. There are up to 10 graduate places per cohort.'],['member','renew']],
     gift:['Can I buy it as a present?',RI,['Yes. Buy it in your name, reply to the receipt with their details, and we\'ll move the place over and send you a gift card.'],['deposit','monthly'],1],
     bonuses:['What are the four bonuses?',TO,['Join by Sunday 17 January and you get:<ul><li>A one-to-one archive review</li><li>The 12-Week Planner</li><li>The Starter RAW Pack</li><li>The 10-Minute Catch-Up Cards</li></ul>'],['bonusend','airshows'],1],
     bonusend:['When do the bonuses end?',RI,['Sunday 17 January, at the same time as the early-bird price. After that the price goes up to {full} and the bonuses go.'],['deposit','bonuses'],1]};
    var p=cw.querySelector('.cw-p'),log=cw.querySelector('.cw-log'),ch=cw.querySelector('.cw-ch'),btn=cw.querySelector('.cw-b'),te=cw.querySelector('.cw-tease'),started=false,asked={};
    function fill(x){return x.replace(/\{(\w+)\}/g,function(_,k){return P(k);});}
    function add(html,cls,img){var d=document.createElement('div');d.className='mm '+(cls||'');d.innerHTML=(img?'<img src="'+img+'" alt="">':'')+html;log.appendChild(d);log.scrollTop=log.scrollHeight;return d;}
    function say(lines,img,done){var i=0;(function nx(){if(i>=lines.length){if(done){done();}return;}var t=add('<p class="ty" aria-label="Typing"><i></i><i></i><i></i></p>','',img);setTimeout(function(){t.remove();add('<p>'+fill(lines[i])+'</p>','',img);i++;setTimeout(nx,reduce?0:250);},reduce?0:Math.min(1300,450+lines[i].length*5));})();}
    function chips(list){ch.innerHTML='';list.forEach(function(c){var b=document.createElement('button');b.type='button';b.textContent=c[0];if(c[2]){b.className=c[2];}b.addEventListener('click',c[1]);ch.appendChild(b);});}
    function wait(){ch.innerHTML='';}
    function topics(){chips(T.map(function(t){return [t.t,function(){openTopic(t);},'tp'];}).concat([['Take me to the price',go,'sec']]));}
    function openTopic(t){add('<p>'+t.t+'</p>','me');wait();setTimeout(function(){say(['What would you like to know?'],RI,function(){qChips(t.q);});},reduce?0:300);}
    function qChips(ids){var l=ids.filter(function(k,i){return !asked[k]&&ids.indexOf(k)===i;}).slice(0,6).map(function(k){return [A[k][0],function(){answer(k);}];});
      l.push(['Another topic',function(){add('<p>Another topic</p>','me');wait();say(['Sure. Pick one.'],TO,topics);},'sec']);chips(l);}
    function answer(k){var a=A[k];asked[k]=1;add('<p>'+a[0]+'</p>','me');wait();
      setTimeout(function(){say(a[2],a[1],function(){if(a[4]){add('<p>Ready when you are.<br><a class="btn" href="#price">Secure my place for just '+P('dep')+'</a></p>','',a[1]);}
        var home=T.filter(function(t){return t.q.indexOf(k)>-1;})[0].q;qChips(a[3].concat(home));});},reduce?0:300);}
    function go(){close();var el=document.getElementById('price');if(el){el.scrollIntoView({behavior:reduce?'auto':'smooth'});}}
    function open(){cw.classList.add('open');p.hidden=false;te.hidden=true;btn.setAttribute('aria-expanded','true');try{sessionStorage.setItem('cwSeen','1');}catch(e){}
      if(!started){started=true;say(['Hi, it\'s Rich. Tom and I can answer anything about the Academy.','Pick a topic below.'],RI,topics);}
      setTimeout(function(){var f=ch.querySelector('button');if(f){f.focus({preventScroll:true});}},400);}
    function close(){cw.classList.remove('open');p.hidden=true;btn.setAttribute('aria-expanded','false');}
    btn.addEventListener('click',function(){if(p.hidden){open();}else{close();}});
    cw.querySelector('.cw-close').addEventListener('click',function(){close();btn.focus({preventScroll:true});});
    cw.addEventListener('click',function(e){if(e.target===cw){close();}});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!p.hidden){close();btn.focus({preventScroll:true});}});
    log.addEventListener('click',function(e){var a=e.target.closest('a[href="#price"]');if(a){e.preventDefault();go();}});
    te.addEventListener('click',function(e){if(e.target.closest('.cw-x')){te.hidden=true;try{sessionStorage.setItem('cwSeen','1');}catch(x){}e.stopPropagation();return;}open();});
    var seen=false;try{seen=!!sessionStorage.getItem('cwSeen');}catch(e){}
    if(!seen){setTimeout(function(){if(p.hidden){te.hidden=false;}},15000);}
    window.__cwOpen=open;
  })();
  /* live tiles */
  (function(){var cg=document.querySelector('.cg');if(!cg){return;}
    function m(an,dl){return ' m" style="--an:'+an+(dl?';--dl:'+dl+'s':'')+'"';}
    var A='https://coaponline.github.io/site-assets/assets/',C=A+'community/';
    var T=[
     '<div class="ca a1"><img class="bg" src="'+A+'g2.webp" alt="" style="object-position:50% 70%"><span class="sh"></span><div class="cd2'+m('caUp')+'><h5>Your settings</h5>'+[['Props','1/80'],['Helicopters','1/125'],['Jets','1/1600'],['Night','ISO 3200']].map(function(r,i){return '<div class="r'+m('caLeft',.25+i*.18)+'><b>'+r[0]+'</b><span class="'+m('caPop',.45+i*.18).slice(1)+'>'+r[1]+'</span></div>';}).join('')+'</div></div>',
     '<div class="ca a2"><div class="ph"><img src="'+A+'g4.webp" alt=""><img class="raw" src="'+A+'g4.webp" alt=""><span class="ln"></span><span class="lb" style="left:14px">Raw</span><span class="lb" style="right:14px">Your edit</span></div><div class="pn"><h5>Your workflow</h5>'+[['Exposure','+0.35',58],['Highlights','-48',26],['Shadows','+32',66],['Texture','+18',59],['Vibrance','+22',61]].map(function(r,i){return '<div class="sl"><div><span>'+r[0]+'</span><span>'+r[1]+'</span></div><i style="--x:'+r[2]+'%;--dl:'+(i*.12)+'s"></i></div>';}).join('')+'</div><div class="st">'+['1 Crop','2 Tone','3 Colour','4 Finish'].map(function(x,i){return '<span class="'+m('caPop',1.3+i*.15).slice(1)+'>'+x+'</span>';}).join('')+'</div></div>',
     '<div class="ca a3"><img class="bg" src="'+A+'g6.webp" alt=""><span class="ring'+m('caRing',.2)+'></span><span class="tag'+m('caPop',.5)+'>Sharp on the nose</span><div class="cd2'+m('caRight',.8)+'><div class="who"><img src="'+A+'rich-face.webp" alt=""><div><b>Rich Cooper</b><span>Your week 6 feedback</span></div></div><p>Lovely and sharp. Next time give it more space to fly into.</p></div></div>',
     '<div class="ca a4"><div class="gr">'+['00','03','05','p12','09','p17','13','22','p29','19','06','11'].map(function(k){var p=k[0]==='p',n=p?k.slice(1):k,d=p?({'12':0,'17':.45,'29':.9})[n]:0;return '<div'+(p?' class="p" style="--dl:'+d+'s"':'')+'><img src="'+C+'sh-'+n+'.webp" alt="">'+(p?'<b class="'+m('caPop',d+.1).slice(1)+'>Best</b>':'')+'</div>';}).join('')+'</div></div>',
     '<div class="ca a5"><div class="fr'+m('caDrop',.1)+'><div><img src="'+A+'g3.webp" alt=""></div></div><div class="lp'+m('caUp',.5)+'><div class="bar"><i></i><i></i><i></i></div><div class="site"><b>Your portfolio</b><div class="g">'+['g5','g2','g4','g1','f35','g6'].map(function(x,i){return '<img class="'+m('caPop',.8+i*.1).slice(1)+' src="'+A+x+'.webp" alt="">';}).join('')+'</div></div></div></div>',
     '<div class="ca a6"><div class="mag'+m('caMag',.1)+'><div><img src="'+A+'final.webp" alt="" style="object-position:35% 50%"><span class="crd">Photo: You</span></div><div class="tx"><small>Readers\' gallery</small><b>Your shot in print</b><i></i><i></i><i style="width:80%"></i><i></i><i style="width:60%"></i></div></div><img class="hr'+m('caStamp',.7)+' src="'+A+'hr-patch.png" alt=""><span class="bd'+m('caPop',1.2)+'>Shortlisted</span></div>'];
    var tiles=[].slice.call(cg.querySelectorAll('.ct'));
    tiles.forEach(function(t,i){if(!T[i]){return;}t.insertAdjacentHTML('afterbegin',T[i]);t.classList.add('lv');});
    function fit(){tiles.forEach(function(t){var c=t.querySelector('.ca');if(!c){return;}var w=t.clientWidth,h=t.clientHeight,k=Math.max(w,h)/1025;c.style.transform='translate('+((w-1025*k)/2)+'px,0) scale('+k+')';});}
    fit();window.addEventListener('resize',fit);
    /* replay on hover, or on tap for touch screens */
    function replay(t,i){if(reduce||cg.classList.contains('before')||!t.getAnimations){return;}
      var an=t.getAnimations({subtree:true}).filter(function(x){return x.animationName&&x.animationName.indexOf('ca')===0;});
      if(!an.length||an.some(function(x){return x.playState==='running'||x.currentTime<x.effect.getComputedTiming().activeDuration+x.effect.getTiming().delay;})&&an.some(function(x){return x.playState!=='finished';})){return;}
      an.forEach(function(x){var d=x.effect.getTiming().delay;x.effect.updateTiming({delay:Math.max(0,d-i*110-450)});x.cancel();x.play();});}
    tiles.forEach(function(t,i){t.addEventListener('mouseenter',function(){replay(t,i);});t.addEventListener('click',function(){replay(t,i);});});
  })();
  /* now -> 90 days flip */
  (function(){var cg=document.querySelector('.cg'),fl=document.querySelector('.flip'),hn=document.querySelector('.cg-hint');if(!cg||!fl){return;}
    fl.hidden=false;if(hn){hn.hidden=false;}var touched=false;
    function set(v){cg.classList.toggle('before',v==='before');fl.classList.toggle('after',v==='after');
      fl.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-v')===v?'true':'false');});}
    fl.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){touched=true;set(b.getAttribute('data-v'));});});
    if(reduce||!('IntersectionObserver' in window)){set('after');return;}
    set('before');
    var o=new IntersectionObserver(function(es){if(es[0].isIntersecting){o.disconnect();setTimeout(function(){if(!touched){set('after');}},900);}},{threshold:0.35});o.observe(cg);
  })();
  /* build your plan */
  (function(){var pb=document.getElementById('pb');if(!pb){return;}
    var IC={cam:'<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',sl:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',fr:'<rect x="4" y="3" width="16" height="18" rx="1"/><rect x="7" y="6" width="10" height="9"/><path d="M8 18h8"/>',tr:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>'};
    var Q=[
     {k:'goal',t:'What do you want most by the end of April?',c:'',o:[
      ['shots','cam','Sharper, cleaner shots','Focus, shutter speed and exposure, sorted',"Good choice. February is all about getting it right in camera."],
      ['edits','sl',"Edits I'm proud of",'One workflow that works every time',"March is built for you: four weeks on your editing."],
      ['seen','fr','My work seen','A print on the wall and a portfolio online',"April is yours: printing, social media and a portfolio online."],
      ['comps','tr','Competitions and magazines','Enter with confidence and get published',"Week 12 covers exactly that, and High Roller is included."]]},
     {k:'type',t:'What do you shoot most?',c:'c5',o:[
      ['jets','https://coaponline.github.io/site-assets/assets/g5.webp','Fast jets','',"Fast jets it is. Week 2 sorts out your shutter speeds for every pass."],
      ['props','https://coaponline.github.io/site-assets/assets/community/sh-17.webp','Props and warbirds','',"Props it is. Week 2 sorts out your prop blur."],
      ['helis','https://coaponline.github.io/site-assets/assets/g2.webp','Helicopters','',"Helicopters it is. Week 2 sorts out your rotor blur."],
      ['air','https://coaponline.github.io/site-assets/assets/community/sh-24.webp','Airliners and cargo','',"Airliners it is. Every challenge works at your local airport too."],
      ['mix','https://coaponline.github.io/site-assets/assets/g1.webp','A bit of everything','',"Every challenge works for any aircraft, so you're covered."]]},
     {k:'time',t:'When do you usually get time?',c:'c3',o:[
      ['eve','','Weekday evenings','After work, an hour here and there',"Evenings work well: a lesson one night, your shot another."],
      ['wkd','','Weekends','A good chunk on Saturday or Sunday',"Weekends it is. Watch on Saturday, upload by Sunday night."],
      ['bits','','Bits and pieces','Ten minutes whenever I can',"Short bits work too. Every lesson plays on your phone."]]},
     {k:'pace',t:'How much time can you give most weeks?',c:'c3',n:'You can change pace any week. Two hours covers everything you need.',o:[
      ['steady','Steady','About 2 hours','The lesson and one shot',"Two hours covers everything. Week 8 is there if you fall behind."],
      ['keen','Keen','About 4 hours','Plus a shoot at your local airfield',"Keen it is. You'll be out shooting every month."],
      ['allin','All in','6 hours or more','Plus masterclasses and extra uploads',"All in. You'll get the most from the library as well."]]}];
    var G={shots:['Sharper, cleaner shots',[1,2,3,4],'Sun 28 February','Your first sharp, well-exposed set'],edits:["Edits you're proud of",[5,6,7],'Sun 21 March','Your first finished edit'],seen:['Your work seen',[9,10,11],'Sun 25 April','Your best shot printed and online'],comps:['Competitions and magazines',[9,10,11,12],'Sun 25 April','Your first competition entry']};
    var P={steady:['Steady · about 2 hours a week',['The lesson and your challenge every week','Week 8 to catch up on anything you missed']],keen:['Keen · about 4 hours a week',['The lesson and your challenge every week','A shoot at your local airfield or museum each month','Extra uploads for your cohort to comment on']],allin:['All in · 6 hours or more',['The lesson and your challenge every week','A shoot at your local airfield or museum each month','A library masterclass alongside each month','Every live evening, live rather than on replay']]};
    var TY={jets:['Fast jets','Light The Burners Blueprint'],props:['Props and warbirds','Own The Show'],helis:['Helicopters','Own The Show'],air:['Airliners and cargo','Own The Scene'],mix:['A bit of everything','Own The Scene']};
    var TM={eve:[['Monday evening','Learn'],['Wednesday evening','Practise'],['Sunday','Get feedback']],wkd:[['Saturday morning','Learn'],['Saturday or Sunday','Practise'],['Sunday evening','Get feedback']],bits:[['On your phone, in short bits','Learn'],['Two quiet half-hours','Practise'],['By Sunday','Get feedback']]};
    var TN={eve:'Weekday evenings',wkd:'Weekends',bits:'Bits and pieces'};
    var st={},n=0,stage=pb.querySelector('.pb-stage'),fb=pb.querySelector('.pb-fb'),bar=pb.querySelector('.pb-bar i'),ct=pb.querySelector('.pb-ct'),bk=pb.querySelector('.pb-bk');
    function esc(x){return String(x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
    function save(){try{localStorage.setItem('coapPlan',JSON.stringify(st));}catch(e){}}
    function banner(){var b=document.querySelector('.myplan');if(!b){return;}var ok=st.c&&G[st.goal]&&P[st.pace];b.hidden=!ok;if(ok){b.querySelector('[data-o=sum]').textContent=P[st.pace][0]+' · '+G[st.goal][0];}}
    function prog(){bar.style.width=(Math.min(n,4)/4*100)+'%';ct.textContent=n<4?(n+1)+' of 4':'Done';bk.hidden=n===0;}
    function ask(){var q=Q[n];fb.hidden=true;prog();
      var h='<div class="pb-q"><small>Question '+(n+1)+' of 4</small><h3>'+q.t+'</h3><div class="pb-o '+q.c+'">';
      q.o.forEach(function(o){var inner='';
        if(q.k==='goal'){inner='<span class="ic"><svg viewBox="0 0 24 24">'+IC[o[1]]+'</svg></span><b>'+o[2]+'</b><span>'+o[3]+'</span>';}
        else if(q.k==='type'){inner='<span class="pic"><img src="'+o[1]+'" alt=""></span><b>'+o[2]+'</b>';}
        else if(q.k==='pace'){inner='<em>'+o[1]+'</em><b>'+o[2]+'</b><span>'+o[3]+'</span>';}
        else{inner='<b>'+o[2]+'</b><span>'+o[3]+'</span>';}
        h+='<button type="button" data-v="'+o[0]+'"'+(st[q.k]===o[0]?' class="sel"':'')+'>'+inner+'</button>';});
      h+='</div>'+(q.n?'<p class="pb-n">'+q.n+'</p>':'')+'</div>';stage.innerHTML=h;
      stage.querySelectorAll('.pb-o button').forEach(function(b){b.addEventListener('click',function(){stage.querySelectorAll('.pb-o button').forEach(function(x){x.classList.remove('sel');});b.classList.add('sel');st[q.k]=b.getAttribute('data-v');st.c=false;save();banner();
        var o=q.o.filter(function(x){return x[0]===st[q.k];})[0];fb.querySelector('p').textContent=o[4];fb.hidden=false;bar.style.width=((n+1)/4*100)+'%';fb.querySelector('.pb-cont').focus({preventScroll:true});});});}
    function result(){n=4;prog();fb.hidden=true;var g=G[st.goal],p=P[st.pace],ty=TY[st.type],tm=TM[st.time];
      var wk='';for(var i=1;i<=13;i++){wk+='<i class="'+(i===13?'g':(g[1].indexOf(i)>-1?'f':(i===8?'cu':'')))+'">'+(i===13?'Grad':i)+'</i>';}
      var tl=[['Mon 1 Feb','<b>Kick-off.</b> Meet your cohort, live',0],[g[2],'<b>'+g[3]+'</b>, your big milestone',1],['Mon 22 Mar','<b>Catch-up week.</b> Breathe, and finish anything you missed',0],['Thu 29 Apr','<b>Graduation night.</b> Your portfolio, reviewed live',0]];
      var GO={shots:'sharper, cleaner shots',edits:"edits you're proud of",seen:'your best shot on the wall',comps:'your first competition entry'};
      var TT=['1 hour','1 hour','5 min'],EX={steady:'',keen:'Want more? You picked Keen, so add a shoot at your local airfield each month.',allin:'Want more? You picked All in, so add a library masterclass each month too.'};
      var PRA={jets:'An F-16 taking off, panned against autumn trees',props:'A P-51 Mustang air to air above cloud',helis:'An Apache hovering at blue hour',air:'A B-52 taking off, in silhouette',mix:'Two MiG-29s air to air above cloud'};
      var pr=PRA[st.type]?st.type:'mix',dt=g[2].replace('Sun ','');
      var kn='<svg viewBox="0 0 24 24"><path d="M9 6l-5 6 5 6M15 6l5 6-5 6"/></svg>';
      stage.innerHTML='<div class="pb-r"><div class="pb-hero pb-solo"><div class="pb-one"><img src="https://coaponline.github.io/site-assets/assets/quiz/'+pr+'.webp" alt="'+esc(PRA[pr])+'"><span class="pb-cr">Rich Cooper</span></div>'+
       '<div class="pb-ov"><small>Your plan is ready</small><h3 class="caps">'+esc(GO[st.goal])+' <span class="gold">by '+esc(dt)+'.</span></h3><p>One of Rich\'s. Yours is next.</p></div></div>'+
       '<div class="pb-3s"><span class="lb">Three steps a week</span>'+tm.map(function(x,i){return '<div><span class="n">'+(i+1)+'</span><b>'+x[1]+'</b><small>'+x[0]+' &middot; '+TT[i]+'</small></div>';}).join('')+'</div>'+
       '<p class="pb-safe">Fall behind? Week 8 is a catch-up week, and everything is recorded.'+(EX[st.pace]?'<br>'+EX[st.pace]:'')+'</p>'+
       '<div class="pb-go"'+(st.c?' hidden':'')+'><button type="button" class="pb-hold"><span>Press and hold: I\'m in</span></button><button type="button" class="pb-re">Start again</button></div>'+
       '<div class="pb-done"'+(st.c?'':' hidden')+'><span class="pb-st">You\'re in</span><p><b>One step left.</b> '+(document.body.getAttribute('data-state')==='early'?'Join the waitlist and you\'ll hear before places open. You start on Monday 1 February.':'Secure your place before the 50 go. You start on Monday 1 February.')+'</p><a class="btn" href="#price">'+(document.body.getAttribute('data-state')==='early'?'Get early-bird access':'Secure my place for just '+esc(curDep()))+'</a></div></div>';
      if(!reduce){cm.style.setProperty('--p','100%');setTimeout(function(){var t0=null;function f(ts){if(!t0){t0=ts;}var k=Math.min(1,(ts-t0)/1600),e=1-Math.pow(1-k,3);if(!cm.dataset.done){cm.style.setProperty('--p',(100-80*e)+'%');}if(k<1){requestAnimationFrame(f);}}requestAnimationFrame(f);},500);}
      var hold=stage.querySelector('.pb-hold'),t0=0,raf=0;
      function done(){st.c=true;save();banner();stage.querySelector('.pb-go').hidden=true;var d=stage.querySelector('.pb-done');d.hidden=false;
        if(!reduce){var cf=document.createElement('div');cf.className='pb-cf';var cols=['#d9932b','#f3c46b','#fff','#178f70'];for(var i=0;i<40;i++){var e=document.createElement('i');e.style.left=(Math.random()*100)+'%';e.style.background=cols[i%4];e.style.animationDelay=(Math.random()*.4)+'s';cf.appendChild(e);}d.appendChild(cf);setTimeout(function(){cf.remove();},2200);}}
      function tick(ts){if(!t0){t0=ts;}var k=Math.min(1,(ts-t0)/1100);hold.style.setProperty('--h',k);hold.classList.toggle('go',k>.5);if(k<1){raf=requestAnimationFrame(tick);}else{done();}}
      function start(e){e.preventDefault();if(reduce){done();return;}t0=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);}
      function stop(){cancelAnimationFrame(raf);if(!st.c){hold.style.setProperty('--h',0);hold.classList.remove('go');}}
      hold.addEventListener('pointerdown',start);['pointerup','pointerleave','pointercancel'].forEach(function(ev){hold.addEventListener(ev,stop);});
      hold.addEventListener('keydown',function(e){if((e.key===' '||e.key==='Enter')&&!e.repeat){start(e);}});hold.addEventListener('keyup',stop);
      stage.querySelector('.pb-re').addEventListener('click',function(){st={};save();banner();n=0;ask();});}
    function curDep(){var el=document.querySelector('[data-p=dep]');return el?el.textContent:'\u00a347';}
    fb.querySelector('.pb-cont').addEventListener('click',function(){n++;if(n<4){ask();}else{result();}});
    bk.addEventListener('click',function(){if(n>0){n=Math.min(n,4)-1;ask();}});
    try{var o=JSON.parse(localStorage.getItem('coapPlan')||'{}');if(o&&G[o.goal]&&P[o.pace]&&TY[o.type]&&TM[o.time]){st=o;result();}else{ask();}}catch(e){ask();}
    banner();
  })();
  document.querySelectorAll('.cmp input').forEach(function(r){r.addEventListener('input',function(){var c=r.parentNode;c.dataset.done=1;c.style.setProperty('--p',r.value+'%');});});
})();
