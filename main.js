/* Portafolio Jesús Morán — lógica de la página.
   Las traducciones viven en i18n/es.js e i18n/en.js */
(function(){
  "use strict";

  /* ---------- Traducciones ---------- */
  var T={ es: i18n_es, en: i18n_en };

  var root=document.documentElement;
  var lang="es";
  var langBtn=document.getElementById("langBtn");
  var themeBtn=document.getElementById("themeBtn");

  function applyLang(l){
    lang=l;
    root.setAttribute("lang",l);
    var d=T[l];
    [].forEach.call(document.querySelectorAll("[data-i18n]"),function(el){
      var v=d[el.getAttribute("data-i18n")];
      if(v!=null){ el.textContent=v; }
    });
    [].forEach.call(document.querySelectorAll("[data-i18n-aria]"),function(el){
      var v=d[el.getAttribute("data-i18n-aria")];
      if(v!=null){ el.setAttribute("aria-label",v); }
    });
    langBtn.textContent=(l==="es")?"EN":"ES";
    langBtn.setAttribute("aria-label",d["aria.lang"]);
  }
  try{
    var savedLang=localStorage.getItem("jm-lang");
    if(savedLang==="en"||savedLang==="es"){ lang=savedLang; }
  }catch(e){}
  applyLang(lang);
  langBtn.addEventListener("click",function(){
    var n=(lang==="es")?"en":"es";
    applyLang(n);
    try{ localStorage.setItem("jm-lang",n); }catch(e){}
  });

  /* ---------- Fondo interactivo: aurora ---------- */
  var bg=(function(){
    var cv=document.getElementById("bg");
    var none={refresh:function(){}};
    if(!cv||!cv.getContext){ return none; }
    var ctx=cv.getContext("2d");
    if(!ctx){ return none; }
    var reduce=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var S={W:0,H:0,hot:"51,70,230",mx:-9999,my:-9999,sx:-9999,sy:-9999,active:false};
    var touchT=0,resizeT=0,running=false,last=0;

    function readColors(){
      var h=getComputedStyle(root).getPropertyValue("--glyph-hot").trim();
      if(h){ S.hot=h; }
    }
    function size(){
      var dpr=Math.min(window.devicePixelRatio||1,2);
      S.W=window.innerWidth; S.H=window.innerHeight;
      cv.width=Math.round(S.W*dpr); cv.height=Math.round(S.H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }

    /* Aurora, manchas de color muy suaves que se desplazan */
    function makeAurora(){
      var t=0,pings=[];
      function blob(x,y,r,a){
        var g=ctx.createRadialGradient(x,y,0,x,y,r);
        g.addColorStop(0,"rgba("+S.hot+","+a.toFixed(3)+")");
        g.addColorStop(1,"rgba("+S.hot+",0)");
        ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
      }
      function init(){ pings=[]; t=3; }
      function draw(dt){
        var W=S.W,H=S.H,m=Math.max(W,H),i,p;
        t+=dt;
        for(i=pings.length-1;i>=0;i--){
          p=pings[i]; p.age+=dt;
          if(p.age>1.6){ pings.splice(i,1); }
        }
        ctx.clearRect(0,0,W,H);
        for(i=0;i<4;i++){
          blob(W*(0.5+0.38*Math.sin(t*0.06+i*1.7)),H*(0.5+0.34*Math.cos(t*0.045+i*2.3)),m*(0.28+0.05*(i%2)),0.08+0.03*Math.sin(t*0.2+i));
        }
        if(S.active){ blob(S.sx,S.sy,240,0.1); }
        for(i=0;i<pings.length;i++){
          p=pings[i];
          blob(p.x,p.y,60+p.age*420,0.16*(1-p.age/1.6));
        }
      }
      function ping(x,y){
        pings.push({x:x,y:y,age:0});
        if(pings.length>4){ pings.shift(); }
      }
      return {init:init,draw:draw,tick:draw,ping:ping};
    }

    var mod=makeAurora();

    function setup(){ size(); mod.init(); mod.draw(0); }
    function loop(ts){
      if(!running){ return; }
      var step=(ts-last)/1000;
      if(step>=0.033){
        last=ts;
        S.sx+=(S.mx-S.sx)*0.2; S.sy+=(S.my-S.sy)*0.2;
        mod.tick(Math.min(step,0.1));
      }
      window.requestAnimationFrame(loop);
    }
    function start(){
      if(running||reduce){ return; }
      running=true; last=performance.now();
      window.requestAnimationFrame(loop);
    }
    function stop(){ running=false; }

    window.addEventListener("pointermove",function(e){
      if(!S.active){ S.sx=e.clientX; S.sy=e.clientY; }
      S.mx=e.clientX; S.my=e.clientY; S.active=true;
      clearTimeout(touchT);
      if(e.pointerType==="touch"){ touchT=setTimeout(function(){ S.active=false; },700); }
    },{passive:true});
    window.addEventListener("pointerdown",function(e){
      if(!reduce){ mod.ping(e.clientX,e.clientY); }
    },{passive:true});
    root.addEventListener("mouseleave",function(){ S.active=false; });
    window.addEventListener("resize",function(){
      clearTimeout(resizeT);
      resizeT=setTimeout(setup,120);
    });
    document.addEventListener("visibilitychange",function(){
      if(document.hidden){ stop(); } else { start(); }
    });

    readColors();
    setup();
    start();
    return {
      refresh:function(){ readColors(); if(!running){ mod.draw(0); } }
    };
  })();

  /* ---------- Tema claro / oscuro ---------- */
  function effTheme(){
    var t=root.getAttribute("data-theme");
    if(t==="dark"||t==="light"){ return t; }
    return (window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";
  }
  function syncTheme(){
    themeBtn.setAttribute("data-mode",effTheme());
    bg.refresh();
  }
  try{
    var savedTheme=localStorage.getItem("jm-theme");
    if(savedTheme==="dark"||savedTheme==="light"){ root.setAttribute("data-theme",savedTheme); }
  }catch(e){}
  themeBtn.addEventListener("click",function(){
    var n=(effTheme()==="dark")?"light":"dark";
    root.setAttribute("data-theme",n);
    try{ localStorage.setItem("jm-theme",n); }catch(e){}
    syncTheme();
  });
  if(window.MutationObserver){
    new MutationObserver(syncTheme).observe(root,{attributes:true,attributeFilter:["data-theme"]});
  }
  if(window.matchMedia){
    var mq=window.matchMedia("(prefers-color-scheme: dark)");
    if(mq.addEventListener){ mq.addEventListener("change",syncTheme); }
    else if(mq.addListener){ mq.addListener(syncTheme); }
  }
  syncTheme();

  /* ---------- Foco de luz en las tarjetas ---------- */
  [].forEach.call(document.querySelectorAll(".card"),function(el){
    el.addEventListener("pointermove",function(e){
      var b=el.getBoundingClientRect();
      el.style.setProperty("--mx",(e.clientX-b.left)+"px");
      el.style.setProperty("--my",(e.clientY-b.top)+"px");
    });
  });

  /* ---------- Sección activa en el menú ---------- */
  var links=[].slice.call(document.querySelectorAll(".nav a"));
  var map={};
  links.forEach(function(a){ map[a.getAttribute("href").slice(1)]=a; });
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          links.forEach(function(a){ a.classList.remove("active"); });
          var a=map[en.target.id];
          if(a){ a.classList.add("active"); }
        }
      });
    },{rootMargin:"-40% 0px -55% 0px"});
    [].forEach.call(document.querySelectorAll(".sec"),function(s){ io.observe(s); });
  }

  /* ---------- Copiar correo ---------- */
  var copyBtn=document.getElementById("copyBtn");
  var emailEl=document.getElementById("email");
  var copyLbl=document.getElementById("copyLbl");
  var copyTimer=0;
  function flash(key){
    copyLbl.textContent=T[lang][key];
    clearTimeout(copyTimer);
    copyTimer=setTimeout(function(){ copyLbl.textContent=T[lang]["contact.copy"]; },1800);
  }
  function selectEmail(){
    try{
      var r=document.createRange(); r.selectNodeContents(emailEl);
      var s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }catch(e){}
  }
  copyBtn.addEventListener("click",function(){
    var text=emailEl.textContent.trim();
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ flash("contact.copied"); },function(){ selectEmail(); flash("contact.selected"); });
    }else{
      selectEmail(); flash("contact.selected");
    }
  });
})();

