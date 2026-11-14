/* Layout check for the Kajabi build: the same element list on the mock and on Kajabi, positions relative to the page header.
   probe() -> lines; compare(slug) fetches the mock's lines for this width and reports the differences into window.__qa. */
(function(){
  function roots(){
    var kids=[].slice.call(document.body.children);
    var start=kids.findIndex(function(e){return e.tagName==='HEADER';});
    return kids.slice(start<0?0:start).filter(function(e){
      return !e.hasAttribute('data-coap-shell')&&!e.hasAttribute('data-site-switch')&&!/^(SCRIPT|STYLE|IFRAME|LINK)$/.test(e.tagName)&&!e.classList.contains('pv')&&!e.classList.contains('review')&&!e.id.match(/^(probe|kajabi|nova)/i)&&(e.tagName!=='DIV'||e.className||e.id);
    });
  }
  function probe(){
    if(!document.getElementById('qa-still')){var st=document.createElement('style');st.id='qa-still';st.textContent='*,*::before,*::after{animation:none!important;transition:none!important}';document.head.appendChild(st);}
    [].forEach.call(document.querySelectorAll('[data-reveal],.reveal'),function(e){e.classList.add('in');});
    var out=[],rs=[];
    roots().forEach(function(r){ if(r.tagName==='MAIN'){[].forEach.call(r.children,function(c){rs.push(c);});} else rs.push(r); });
    rs.forEach(function(r){var y0=null;[r].concat([].slice.call(r.querySelectorAll('*'))).forEach(function(el){
      if(el.closest('.pv,.review,[data-site-switch],script,style'))return;
      var b=el.getBoundingClientRect();if(b.width<1||b.height<1)return;
      var cs=getComputedStyle(el);if(cs.visibility==='hidden')return;
      if(y0===null)y0=b.top+scrollY;
      var cls=(typeof el.className==='string'?el.className:'').replace(/\b(in|reveal|is-in|on|off)\b/g,'').trim().slice(0,40);
      out.push([el.tagName,cls,Math.round(b.left),Math.round(b.top+scrollY-y0),Math.round(b.width),Math.round(b.height),cs.fontSize,cs.fontFamily.slice(0,14),cs.color,cs.backgroundColor].join('|'));
    });});
    return out;
  }
  window.__probe=probe;
  window.__compare=function(slug){
    var w=document.documentElement.clientWidth;
    return fetch('https://coaponline.github.io/site-assets/qa/'+slug+'_'+w+'.txt?'+Date.now()).then(function(r){return r.text();}).then(function(t){
      var A=t.split('\n').filter(Boolean),B=probe(),bad=[];
      var n=Math.min(A.length,B.length);
      for(var i=0;i<n;i++){var a=A[i].split('|'),b=B[i].split('|');
        var off=a[0]!==b[0]||Math.abs(a[2]-b[2])>3||Math.abs(a[3]-b[3])>3||Math.abs(a[4]-b[4])>3||Math.abs(a[5]-b[5])>3||a[6]!==b[6]||a[7]!==b[7]||a[8]!==b[8]||a[9]!==b[9];
        if(off)bad.push('#'+i+'\n  mock '+A[i]+'\n  kjb  '+B[i]);}
      window.__qa='width '+w+'  mock '+A.length+'  kajabi '+B.length+'  differences '+bad.length+'\n'+bad.slice(0,12).join('\n');
      return window.__qa;
    });
  };
  /* Aligned comparison: matches elements by tag and class in order, then reports what's missing, extra and different.
     __check(slug) also leaves out the hero, whose height follows the window. */
  window.__check=async function(slug,keepHero){
    var imgs=[].slice.call(document.images);imgs.forEach(function(i){i.loading='eager';});
    await Promise.race([Promise.all(imgs.map(function(i){return i.complete?0:new Promise(function(r){i.onload=i.onerror=r;});})),new Promise(function(r){setTimeout(r,8000);})]);
    for(var y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(function(r){setTimeout(r,100);});}
    scrollTo(0,0);await new Promise(function(r){setTimeout(r,1200);});
    var w=document.documentElement.clientWidth;
    var t=await (await fetch('https://coaponline.github.io/site-assets/qa/'+slug+'_'+w+'.txt?'+Date.now())).text();
    var A=t.split('\n').filter(Boolean),B=probe();
    var ka=A.map(function(x){return x.split('|').slice(0,2).join('|');}),kb=B.map(function(x){return x.split('|').slice(0,2).join('|');});
    var n=ka.length,m=kb.length,L=[],i,j;for(i=0;i<=n;i++)L.push(new Int16Array(m+1));
    for(i=n-1;i>=0;i--)for(j=m-1;j>=0;j--)L[i][j]=ka[i]===kb[j]?L[i+1][j+1]+1:Math.max(L[i+1][j],L[i][j+1]);
    var hs=keepHero?-1:A.findIndex(function(l){return /^SECTION\|(hero|hm-h2|lg-stage)/.test(l);});
    var he=hs<0?-1:A.findIndex(function(l,k){var p=l.split('|');return k>hs+1&&p[3]==='0'&&p[2]==='0'&&/^(SECTION|DIV|FOOTER|ASIDE|NAV)$/.test(p[0]);});
    var inHero=function(k){return hs>=0&&k>=hs&&k<he;};
    i=0;j=0;var miss=[],extra=[],bad=[];
    while(i<n&&j<m){if(ka[i]===kb[j]){var a=A[i].split('|'),b=B[j].split('|');
      var off=Math.abs(a[2]-b[2])>3||Math.abs(a[3]-b[3])>3||Math.abs(a[4]-b[4])>3||Math.abs(a[5]-b[5])>3||a[6]!==b[6]||a[7]!==b[7]||a[8]!==b[8]||a[9]!==b[9];
      if(off&&!inHero(i))bad.push(i+' M '+A[i].slice(0,115)+'\n    K '+B[j].slice(0,115));i++;j++;}
      else if(L[i+1][j]>=L[i][j+1]){miss.push(i+' '+A[i].slice(0,90));i++;}else{extra.push(j+' '+B[j].slice(0,90));j++;}}
    while(i<n){miss.push(i+' '+A[i].slice(0,90));i++;}while(j<m){extra.push(j+' '+B[j].slice(0,90));j++;}
    return 'width '+w+'  mock '+n+'  kajabi '+m+(hs>=0?'  (hero '+hs+'-'+he+' left out)':'')+'\nMISSING '+miss.length+'\n'+miss.slice(0,8).join('\n')+'\nEXTRA '+extra.length+'\n'+extra.slice(0,8).join('\n')+'\nDIFFERENT '+bad.length+'\n'+bad.slice(0,14).join('\n');
  };
})();
