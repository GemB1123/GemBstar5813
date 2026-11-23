/* ---------- EAIris: the iris transition between Worlds (Leo, Painter World, Nov 23 2026; lifted from Kid's Moon-in-the-Device iris) ----------
   A circle opens from a point (usually the wheel's center) to show a new view, or closes to that point to hide one.
   Honors the Device setting Settings > Startup/Shutdown > Transition Animations (window.EA_ANIM() returns false when it is off)
   and the system's Reduce Motion setting: then the switch is instant.

   window.EAIris
     open(el, {x, y, r, ms, done})    el appears through a growing circle at (x, y) in el's own pixels (default: its center);
                                      r is the end radius (default: reaches every corner), ms the length (default EAIris.MS)
     close(el, {x, y, r, ms, done})   el shrinks away to (x, y); done() runs at the end (or at once when animations are off).
                                      el stays clipped to nothing until open() or clear()
     snap(el)                         a still copy of el's picture, laid just under el, so the old World stays on screen
                                      while the new one opens over it (Gemini, Nov 23: "iris from the wheel image").
                                      Pass it as {under: copy} to open() and it is removed when the iris is done
     clear(el)                        stop any iris on el and show it whole
     on()                             true when animations should run
     MS                               the standard length, 1100 ms (Gemini, Nov 23: slower); change it to change every World
   Uses the Web Animations API, so no CSS is needed; the clip is removed after an open finishes. */
(function(){
const EASE='cubic-bezier(.45,0,.25,1)';
const on=()=>!(window.EA_ANIM&&!window.EA_ANIM())&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
function geo(el,o){const w=el.offsetWidth||el.clientWidth||0,h=el.offsetHeight||el.clientHeight||0,x=o.x!=null?o.x:w/2,y=o.y!=null?o.y:h/2;
 const r=o.r!=null?o.r:Math.ceil(Math.max(Math.hypot(x,y),Math.hypot(w-x,y),Math.hypot(x,h-y),Math.hypot(w-x,h-y)))+2;return {x,y,r}}
const C=(r,g)=>`circle(${r}px at ${g.x}px ${g.y}px)`;
function stop(el){if(el.__iris){try{el.__iris.onfinish=null;el.__iris.cancel()}catch(e){}el.__iris=null}}
function clear(el){if(!el)return;stop(el);el.style.clipPath=''}
function run(el,o,from,to,end){o=o||{};stop(el);const g=geo(el,o);
 if(!on()||!el.animate){end(g);if(o.done)o.done();return}
 const a=el.animate([{clipPath:C(from(g),g)},{clipPath:C(to(g),g)}],{duration:o.ms||window.EAIris.MS,easing:EASE,fill:'forwards'});el.__iris=a;
 a.onfinish=()=>{if(el.__iris!==a)return;end(g);try{a.cancel()}catch(e){}el.__iris=null;if(o.done)o.done()}}
const open=(el,o)=>{if(!el)return;o=o||{};const u=o.under,d=o.done;run(el,Object.assign({},o,{done:()=>{if(u&&u.remove)u.remove();if(d)d()}}),()=>0,g=>g.r,()=>{el.style.clipPath=''})};
/* The copy keeps el's place and transform; ids inside are renamed (and their url(#…)/href="#…" uses) so they never clash with the new
   picture; canvases are copied pixel for pixel. */
function snap(el){if(!el||!el.parentNode)return null;const cs=getComputedStyle(el),c=document.createElement('div');c.className='eairis-snap';c.setAttribute('aria-hidden','true');
 c.style.cssText=`position:absolute;left:${el.offsetLeft}px;top:${el.offsetTop}px;width:${el.offsetWidth}px;height:${el.offsetHeight}px;pointer-events:none;transform:${cs.transform};transform-origin:${cs.transformOrigin}`;
 for(const k of el.childNodes)c.appendChild(k.cloneNode(true));
 const ids={};c.querySelectorAll('[id]').forEach(n=>{const o=n.id,nw=o+'-eairis';ids[o]=nw;n.id=nw});
 if(Object.keys(ids).length)c.querySelectorAll('*').forEach(n=>{for(const a of [...n.attributes]){if(a.value.indexOf('#')<0)continue;
  const v=a.value.replace(/url\(#([^)]+)\)/g,(m,i)=>ids[i]?`url(#${ids[i]})`:m).replace(/^#(.+)$/,(m,i)=>ids[i]?'#'+ids[i]:m);if(v!==a.value)n.setAttribute(a.name,v)}});
 const src=el.querySelectorAll('canvas'),dst=c.querySelectorAll('canvas');src.forEach((cv,i)=>{try{dst[i].getContext('2d').drawImage(cv,0,0)}catch(e){}});
 el.parentNode.insertBefore(c,el);return c}
const close=(el,o)=>{if(el)run(el,o,g=>g.r,()=>0,g=>{el.style.clipPath=C(0,g)})};
window.EAIris={open,close,clear,on,snap,MS:1100};
})();
