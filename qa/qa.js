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
})();
