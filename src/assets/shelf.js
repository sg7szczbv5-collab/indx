/* مسيرة المملكة — curved archive shelf engine (shared by both parts).
   Shelf.init(cfg) builds the shelf inside the page's .hero and wires the
   caption, timeline, cursor and detail sheet. Items read right-to-left:
   later items sit to the left of the open cover. */
(function(){
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const E="cubic-bezier(.2,.8,.2,1)";
const RM=matchMedia("(prefers-reduced-motion: reduce)").matches;
const mod=(a,n)=>((a%n)+n)%n;
const smooth=t=>t*t*(3-2*t);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const P=1400, MIR=-1;

function revealOnScroll(){
  document.querySelectorAll(".sh>*,.phase>*,.mil>.tx,.mil>.y,[data-rv]").forEach(el=>{
    const w=document.createElement("span");w.className="rv";w.style.display="block";
    el.parentNode.insertBefore(w,el);w.appendChild(el);
  });
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}}),{rootMargin:"0px 0px -8% 0px"});
  document.querySelectorAll(".rv").forEach((el,i)=>{el.firstElementChild.style.transitionDelay=(i%4)*70+"ms";io.observe(el);});
}

function init(cfg){
  const items=cfg.items, N=items.length, COPIES=Math.max(5,Math.ceil(36/N)), TOT=N*COPIES, HALF=TOT/2;
  const Y0=cfg.y0, Y1=cfg.y1;
  const hero=$(".hero"),stage=$(".stage"),shelf=$(".shelf"),probe=$(".probe");
  items.forEach(it=>{const i=new Image();i.src=it.img;});

  /* ---- tapes ---- */
  const tapes=[];
  for(let v=0;v<TOT;v++){
    const i=v%N,it=items[i];
    const t=document.createElement("div");t.className="tape";t.dataset.v=v;
    t.innerHTML=
     `<div class="face sp t${i%3}"><i class="sp-ph" style="background-image:url(${it.img})"></i><i class="sp-rule"></i>`+
     `<b class="sp-name">${esc(it.short)}</b><i class="sp-rule"></i><span class="sp-n">${i+1}</span><span class="sp-y">${esc(it.spineYear||it.from)}</span></div>`+
     `<div class="face cv" style="background-image:url(${it.img});background-position:${it.pos||"center 15%"}"><div class="cv-top"><span>${esc(cfg.coverLabel)}</span><span>${i+1} / ${N}</span></div>`+
     `<div class="cv-bot"><span class="cv-ord">${esc(cfg.sub(it,i))}</span><b class="cv-name">${esc(it.short)}</b><span class="cv-y">${esc(cfg.years(it,i))}</span></div><i class="cv-frame"></i></div>`;
    stage.appendChild(t);
    tapes.push({el:t,cv:t.querySelector(".cv"),v,lift:0,hidden:false});
  }

  /* ---- measurements ---- */
  let Hh=500,ws=80,d=330,gap=17,U=650,W=innerWidth,VH=innerHeight,CYL=0,CY=0,XS=new Float32Array(2);
  function measure(){
    Hh=probe.offsetHeight;CYL=probe.offsetTop;W=hero.clientWidth;VH=innerHeight;
    ws=Hh*.165;d=Hh*.68;gap=Hh*.035;U=Hh*(W<768?1.05:1.3);
    const st=document.documentElement.style;st.setProperty("--ws",ws+"px");st.setProperty("--d",d+"px");
    const n=Math.ceil(3*U/2)+2;XS=new Float32Array(n);
    for(let i=1;i<n;i++){const u=i*2;XS[i]=XS[i-1]+2/(1+Math.pow(u/U,1.6));}
  }
  const scl=u=>1/(1+Math.pow(Math.abs(u)/U,1.6));
  function xsc(u){const a=Math.abs(u)/2,i=Math.floor(a);if(i>=XS.length-1)return Math.sign(u)*XS[XS.length-1];return Math.sign(u)*(XS[i]+(XS[i+1]-XS[i])*(a-i));}
  const B=r=>Math.abs(r)<1?(r+Math.sin(Math.PI*r)/Math.PI)/2:(r>0?.5:-.5);
  const F=r=>r*(ws+gap)+(d-ws+1.4*gap)*B(r);
  const rel=(v,s)=>mod(v-s+HALF,TOT)-HALF;

  /* ---- state ---- */
  const start=(cfg.start||0)+N*Math.floor(COPIES/2);
  let T=start,s=T,tiltX=0,tiltY=0,mx=-1e4,my=-1e4,cx=0,cy=0,hasMouse=false,inZone=false;
  let active=-1,yearCur=items[cfg.start||0].from,hoverV=-1,dragging=false,down=null,justDragged=false;
  let detailOpen=false,openAt=0,closing=false,cursorTarget="",heroVisible=true;

  /* ---- caption ---- */
  const capT=$(".c-title"),capS=$(".c-sub"),capY=$(".c-year");
  function swap(mask,text,dir,instant){
    const old=[...mask.children];
    const n=document.createElement("span");n.textContent=text;mask.appendChild(n);
    if(instant||RM){old.forEach(o=>o.remove());return;}
    n.animate([{transform:`translateY(${dir*105}%)`},{transform:"translateY(0)"}],{duration:650,easing:E,fill:"both"});
    old.forEach(o=>{
      const cur=getComputedStyle(o).transform;o.getAnimations().forEach(a=>a.cancel());
      const a=o.animate([{transform:cur==="none"?"translateY(0)":cur},{transform:`translateY(${-dir*105}%)`}],{duration:650,easing:E,fill:"both"});
      a.onfinish=()=>o.remove();
    });
  }
  function setActive(i,dir,instant){
    active=i;const it=items[i];
    swap(capT,cfg.title(it,i),dir,instant);swap(capS,cfg.sub(it,i),dir,instant);swap(capY,cfg.years(it,i),dir,instant);
  }

  /* ---- timeline (right-to-left) ---- */
  const ticks=$(".tl-ticks"),dot=$(".tl-dot");
  const pct=y=>(y-Y0)/(Y1-Y0)*100;
  items.forEach((it,i)=>{
    const end=it.to||(items[i+1]&&items[i+1].from)||cfg.now;
    const r=document.createElement("i");r.className="reign";r.style.right=pct(it.from)+"%";r.style.width=Math.max(.4,pct(end)-pct(it.from))+"%";ticks.appendChild(r);
  });
  let li=0;
  for(let y=Y0;y<=Y1;y+=cfg.minor){
    const p=pct(y),mj=(y-Y0)%cfg.major===0;
    const t=document.createElement("i");t.className="tick "+(mj?"mj":"mn");t.style.right=p+"%";ticks.appendChild(t);
    if(mj){const l=document.createElement("span");l.className="yr num"+(y===Y0?" first":y===Y1?" last":"")+(li++%2===1?" alt":"");l.style.right=p+"%";l.textContent=y;ticks.appendChild(l);}
  }
  function yearTarget(){
    const fl=Math.floor(s),f=s-fl,i0=mod(fl,N),i1=mod(fl+1,N),y0=items[i0].from,y1=items[i1].from;
    if(i0===N-1||Math.abs(y1-y0)>60)return f<.5?y0:y1;
    return y0+(y1-y0)*f;
  }

  /* ---- render loop ---- */
  const play=$(".play"),cursor=$(".cursor"),detail=$(".detail");
  let cursorState="";
  function setCursor(c){if(c!==cursorState){if(cursorState)cursor.classList.remove(cursorState);if(c)cursor.classList.add(c);cursorState=c;}}
  function render(dt){
    for(const tp of tapes){
      const r=rel(tp.v,s),u=F(r);
      if(Math.abs(u)>U*1.95){if(!tp.hidden){tp.el.style.display="none";tp.hidden=true;}continue;}
      if(tp.hidden){tp.el.style.display="";tp.hidden=false;}
      const o=smooth(Math.max(0,1-Math.abs(r)));
      const want=(tp.v===hoverV&&Math.abs(r)>.5&&!detailOpen)?1:0;
      tp.lift=RM?want:tp.lift+(want-tp.lift)*(1-Math.exp(-12*dt));
      const sc=scl(u),k=1/sc,z=P*(1-k)+o*Hh*.1,x=MIR*xsc(u)*k;
      const y=(Hh*.5*(1-sc)*.42+o*Hh*.012-tp.lift*Hh*.05)*k;
      const ry=MIR*Math.sign(u)*Math.min(1,Math.abs(u)/U)*26*(1-o)-90*o+tiltY*o;
      tp.el.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${(tiltX*o).toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`;
      tp.el.style.zIndex=Math.round(3000+z);
      tp.el.style.setProperty("--ss",Math.min(.6,o*.55+(1-sc)*.32).toFixed(3));
      tp.el.style.setProperty("--cs",((1-o)*.82).toFixed(3));
    }
  }
  const onCover=()=>Math.abs(mx-W/2)<.55*d&&Math.abs(my-CY)<.55*Hh&&Math.abs(T-s)<.3&&!detailOpen&&heroVisible;
  let last=performance.now();
  function frame(now){
    const dt=Math.min(.05,(now-last)/1000);last=now;
    const hr=hero.getBoundingClientRect();heroVisible=hr.bottom>0;CY=hr.top+CYL;
    if(RM)s=T;else{const k=dragging?18:5.2;s+=(T-s)*(1-Math.exp(-k*dt));if(Math.abs(T-s)<1e-4)s=T;}
    if(Math.abs(s)>4*TOT){const sh=Math.round(s/TOT)*TOT;s-=sh;T-=sh;if(down)down.T0-=sh;}
    const a=mod(Math.round(s),N);if(a!==active)setActive(a,Math.sign(T-s)||1,false);
    const yt=yearTarget();
    if(Math.abs(yt-yearCur)>6||RM)yearCur=yt;else yearCur+=(yt-yearCur)*(1-Math.exp(-14*dt));
    dot.style.right=pct(yearCur)+"%";
    const oc=hasMouse&&onCover();let tY,tX;
    if(oc){tY=(mx-W/2)/(.55*d)*8;tX=-(my-CY)/(Hh/2)*5;}else{tY=hasMouse&&heroVisible?(mx-W/2)/W*4:0;tX=0;}
    const kt=1-Math.exp(-7*dt);tiltY+=(tY-tiltY)*kt;tiltX+=(tX-tiltX)*kt;
    if(heroVisible||detailOpen)render(dt);
    const ps=detailOpen?0:smooth(Math.max(0,1-Math.abs(T-s)*3));
    play.style.transform=`translate3d(${(W/2+d/2+6-44).toFixed(1)}px,${(CYL+.36*Hh).toFixed(1)}px,0) scale(${ps.toFixed(3)})`;
    play.style.pointerEvents=ps>.5?"auto":"none";
    const ck=1-Math.exp(-16*dt);cx+=(mx-cx)*ck;cy+=(my-cy)*ck;
    cursor.style.transform=`translate3d(${(cx-29).toFixed(1)}px,${(cy-29).toFixed(1)}px,0)`;
    cursor.classList.toggle("live",hasMouse&&inZone);
    if(cursorTarget==="btn")setCursor("btn");else if(oc)setCursor("open");else if(hoverV>=0&&!detailOpen)setCursor("spine");else setCursor("");
    if(detailOpen&&!closing)inkTick(now);
    requestAnimationFrame(frame);
  }

  /* ---- input ---- */
  addEventListener("pointermove",e=>{
    if(e.pointerType==="mouse"&&!hasMouse&&(e.clientX||e.clientY)){hasMouse=true;cx=e.clientX;cy=e.clientY;}
    mx=e.clientX;my=e.clientY;
    const el=document.elementFromPoint(mx,my);
    inZone=!!(el&&el.closest(".hero,.detail"));
    cursorTarget=el&&el.closest("[data-btn],a,button")?"btn":"";
    const tp=el&&!detailOpen?el.closest(".tape"):null;hoverV=tp?+tp.dataset.v:-1;
  },{passive:true});
  document.addEventListener("pointerleave",()=>{hoverV=-1;inZone=false;});
  shelf.addEventListener("pointerdown",e=>{if(detailOpen||e.button>0)return;down={x:e.clientX,T0:T,id:e.pointerId};dragging=false;});
  addEventListener("pointermove",e=>{
    if(!down||e.pointerId!==down.id)return;
    const dx=e.clientX-down.x;
    if(!dragging&&Math.abs(dx)>5){dragging=true;try{shelf.setPointerCapture(e.pointerId);}catch(_){}}
    if(dragging)T=down.T0-MIR*dx/(ws+gap);
  });
  function endDrag(){if(!down)return;if(dragging){T=Math.round(T);justDragged=true;setTimeout(()=>justDragged=false,0);}dragging=false;down=null;}
  addEventListener("pointerup",endDrag);addEventListener("pointercancel",endDrag);
  const centreTape=()=>tapes.find(t=>Math.abs(rel(t.v,s))<.5)||tapes[start];
  shelf.addEventListener("click",e=>{
    if(justDragged||detailOpen)return;
    let tp=e.target.closest(".tape");
    if(!tp){ // the turned cover face is not always hit-tested in 3D; fall back to its projected box
      const c=centreTape(),b=c.cv.getBoundingClientRect();
      if(e.clientX>=b.left&&e.clientX<=b.right&&e.clientY>=b.top&&e.clientY<=b.bottom)tp=c.el;
    }
    if(!tp)return;
    const r=rel(+tp.dataset.v,T);
    if(Math.abs(r)<.5)openDetail();else T=Math.round(T+r);
  });
  play.addEventListener("click",()=>openDetail());
  $(".a-left").addEventListener("click",()=>{T=Math.round(T)+1;});
  $(".a-right").addEventListener("click",()=>{T=Math.round(T)-1;});
  addEventListener("keydown",e=>{
    if(e.key==="Escape"){if(detailOpen)closeDetail();return;}
    if(detailOpen||e.target.closest("input,textarea,select"))return;
    if(hero.getBoundingClientRect().top<-VH*.4)return;
    if(e.key==="ArrowLeft"){T=Math.round(T)+1;e.preventDefault();}
    else if(e.key==="ArrowRight"){T=Math.round(T)-1;e.preventDefault();}
    else if(e.key==="Enter"&&!e.target.closest("a,button")){openDetail();e.preventDefault();}
  });
  let wheelTimer=0;
  shelf.addEventListener("wheel",e=>{
    if(detailOpen||Math.abs(e.deltaX)<=Math.abs(e.deltaY))return; // vertical wheel scrolls the page
    T+=MIR*-e.deltaX/(ws+gap)*.5;
    clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{T=Math.round(T);},160);
    e.preventDefault();
  },{passive:false});
  const nearest=i=>{const base=Math.round(T),h=Math.floor(N/2);return base+(mod(i-mod(base,N)+h,N)-h);};
  $(".tl-hit").addEventListener("click",e=>{
    if(detailOpen)return;
    const r=e.currentTarget.parentNode.getBoundingClientRect();
    const yr=Y0+clamp((r.right-e.clientX)/r.width,0,1)*(Y1-Y0);
    let best=0;items.forEach((it,i)=>{if(yr>=it.from-.5)best=i;});
    T=nearest(best);
  });

  /* ---- detail sheet ---- */
  const dText=$(".d-text"),pimg=$(".pimg"),pframe=$(".pframe");
  const blots=[...document.querySelectorAll(".blots circle")].map(c=>({el:c,d:+c.dataset.d}));
  const easeOutCubic=t=>1-Math.pow(1-t,3);
  function inkTick(now){
    for(const b of blots){const t=clamp((now-openAt-520-b.d)/1250,0,1);b.el.setAttribute("r",(1100*easeOutCubic(t)).toFixed(1));}
    pframe.setAttribute("opacity",now-openAt>1400?1:0);
  }
  function coverInset(){
    const r=centreTape().cv.getBoundingClientRect();
    return `inset(${r.top}px ${innerWidth-r.right}px ${VH-r.bottom}px ${r.left}px round 3px)`;
  }
  function openDetail(){
    if(detailOpen)return;
    T=Math.round(T);s=T;
    const i=mod(T,N);if(active!==i)setActive(i,1,true);
    dText.innerHTML=cfg.detail(items[i],i,esc);
    pimg.setAttribute("href",items[i].img);
    pimg.setAttribute("preserveAspectRatio",items[i].posterFit||"xMidYMin slice");
    blots.forEach(b=>b.el.setAttribute("r","0"));pframe.setAttribute("opacity",0);
    render(0);
    const from=coverInset();
    detailOpen=true;closing=false;hoverV=-1;
    detail.getAnimations({subtree:true}).forEach(a=>a.cancel());
    detail.classList.add("on");detail.scrollTop=0;document.body.classList.add("lock");
    const now=performance.now();openAt=RM?now-5000:now;inkTick(now);
    detail.animate([{clipPath:from},{clipPath:"inset(0px 0px 0px 0px round 0px)"}],{duration:RM?1:1050,easing:"cubic-bezier(.76,0,.18,1)",fill:"both"});
    [...dText.querySelectorAll(".m>*")].forEach((l,j)=>l.animate([{transform:"translateY(110%)"},{transform:"translateY(0)"}],{duration:RM?1:900,delay:RM?0:620+Math.min(j,10)*75,easing:E,fill:"both"}));
    $(".d-close").focus({preventScroll:true});
  }
  function closeDetail(){
    if(!detailOpen||closing)return;
    closing=true;
    const to=coverInset();
    const a=detail.animate([{clipPath:"inset(0px 0px 0px 0px round 0px)"},{clipPath:to}],{duration:RM?1:850,easing:"cubic-bezier(.76,0,.18,1)",fill:"both"});
    a.onfinish=()=>{detail.classList.remove("on");detail.getAnimations({subtree:true}).forEach(x=>x.cancel());a.cancel();document.body.classList.remove("lock");detailOpen=false;closing=false;};
  }
  $(".d-close").addEventListener("click",closeDetail);

  /* open item i from elsewhere on the page (cards, links) */
  function show(i){
    T=nearest(i);s=T;
    hero.scrollIntoView({behavior:RM?"auto":"smooth"});
    setTimeout(openDetail,RM?0:650);
  }
  document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();show(+b.dataset.open);}));

  measure();addEventListener("resize",measure);
  setActive(cfg.start||0,1,true);render(0);
  requestAnimationFrame(t=>{last=t;frame(t);});
  revealOnScroll();
  return {show};
}
window.Shelf={init,esc};
})();
