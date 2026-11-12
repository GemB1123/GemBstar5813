/* ---------- EA_JPL: the shared NASA JPL ephemeris (DE441) for every World and every app ----------
   Source: NASA JPL Development Ephemeris DE441 (Park, Folkner, Williams and Boggs 2021), public domain, covering
   about 13,000 BCE to 17,000 CE. tools/jpl/gen.py re-fits DE441 into compact Chebyshev series, one file per
   "chunk" of 36,864 days (about 101 years), about 360 KB each, every body within about 0.3 arcseconds of JPL
   as seen from Earth (the Moon within 0.6 km, about 0.3 arcseconds).
   Bodies: Sun, Moon, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.
   The chunks for about 1900 to 2101 are built into the page; others load on demand (from ./jpl/ beside the page,
   then from the GemBstar5813 test site), and EA_JPL.onLoad listeners fire so views can redraw.
   Pipeline for apparent geocentric places: light time (3 passes), annual aberration, frame bias, Vondrak, Capitaine
   and Wallace (2011) long-term precession (the pole vectors are fitted into each chunk), and a 45-term nutation
   series fitted to IAU 2000A/2006 (within about 0.013 arcseconds). Times in are Universal Time (Julian Day);
   Delta T (Espenak and Meeus polynomials, the same as Stargazing's sgeph.js) turns UT into TT inside.
   Returns null when the chunk for a date is not loaded yet; callers fall back to their own math and redraw later. */
(function(){'use strict';
const R=Math.PI/180,AS=Math.PI/648000,C_KMD=299792.458*86400,AU=149597870.7,EMRAT=81.30056822149722;
const A0=2415020.5,CH=36864;                       /* chunk k covers [A0+k*CH, A0+(k+1)*CH) in TT */
const KMIN=-147,KMAX=148;                           /* DE441 chunks that exist: about -13,000 to +17,000 (k -147..148 for the linux file range) */
const chunks=new Map(),pending=new Map(),listeners=[];
const cfg={bases:['jpl/','https://gemb1123.github.io/GemBstar5813/ephemeris/de441/'],auto:true};
/* ---- Delta T (seconds), NASA Espenak and Meeus polynomials, Morrison and Stephenson outside -500..2150 ---- */
function deltaT(y){let t,u;const c=-0.000012932*(y-1955)*(y-1955);
 if(y<-500){u=(y-1820)/100;return -20+32*u*u+c}
 if(y<500){u=y/100;return 10583.6-1014.41*u+33.78311*u**2-5.952053*u**3-0.1798452*u**4+0.022174192*u**5+0.0090316521*u**6+c}
 if(y<1600){u=(y-1000)/100;return 1574.2-556.01*u+71.23472*u**2+0.319781*u**3-0.8503463*u**4-0.005050998*u**5+0.0083572073*u**6+c}
 if(y<1700){t=y-1600;return 120-0.9808*t-0.01532*t*t+t**3/7129+c}
 if(y<1800){t=y-1700;return 8.83+0.1603*t-0.0059285*t*t+0.00013336*t**3-t**4/1174000+c}
 if(y<1860){t=y-1800;return 13.72-0.332447*t+0.0068612*t*t+0.0041116*t**3-0.00037436*t**4+0.0000121272*t**5-0.0000001699*t**6+0.000000000875*t**7+c}
 if(y<1900){t=y-1860;return 7.62+0.5737*t-0.251754*t*t+0.01680668*t**3-0.0004473624*t**4+t**5/233174+c}
 if(y<1920){t=y-1900;return -2.79+1.494119*t-0.0598939*t*t+0.0061966*t**3-0.000197*t**4+c}
 if(y<1941){t=y-1920;return 21.20+0.84493*t-0.076100*t*t+0.0020936*t**3+c}
 if(y<1961){t=y-1950;return 29.07+0.407*t-t*t/233+t**3/2547+c}
 if(y<1986){t=y-1975;return 45.45+1.067*t-t*t/260-t**3/718+c}
 if(y<2005){t=y-2000;return 63.86+0.3345*t-0.060374*t*t+0.0017275*t**3+0.000651814*t**4+0.00002373599*t**5+c}
 if(y<2050){t=y-2000;return 62.92+0.32217*t+0.005589*t*t+c}
 if(y<2150)return -20+32*((y-1820)/100)**2-0.5628*(2150-y)+c;
 return -20+32*((y-1820)/100)**2+c}
const ttOf=jd=>jd+deltaT(2000+(jd-2451545)/365.25)/86400;
/* ---- chunk decoding ---- */
function addChunk(buf){const u=new Uint8Array(buf);
 if(u[0]!==69||u[1]!==65||u[2]!==74||u[3]!==49)throw new Error('Not an EA_JPL chunk');
 const hl=u[4]|(u[5]<<8),H=JSON.parse(new TextDecoder().decode(u.subarray(6,6+hl)));let p=6+hl;
 const S={};
 for(const [name,L,N,q,dim] of H.s){const n=(H.ch/L)*dim*(N+1),a=new Float64Array(n);
  for(let i=0;i<n;i++){let v=0,s=1,b;do{b=u[p++];v+=(b&127)*s;s*=128}while(b&128);a[i]=(v%2?-(v+1)/2:v/2)*q}
  S[name]={L,N,dim,a}}
 chunks.set(H.k,{t0:H.t0,S});pending.delete(H.k);
 for(const f of listeners.slice())try{f(H.k)}catch(e){}
 return H.k}
function addBase64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return addChunk(u.buffer)}
const kOf=tt=>Math.floor((tt-A0)/CH);
const fileOf=k=>'c'+(k<0?'-':'+')+String(Math.abs(k)).padStart(3,'0')+'.bin';
function load(k){if(chunks.has(k))return Promise.resolve(k);if(k<KMIN||k>KMAX)return Promise.reject(new Error('Outside DE441'));
 if(pending.has(k))return pending.get(k);
 const pr=(async()=>{let last;for(const b of cfg.bases){try{const r=await fetch(b+fileOf(k));if(!r.ok)throw new Error(r.status);return addChunk(await r.arrayBuffer())}catch(e){last=e}}
  pending.delete(k);throw last})();
 pending.set(k,pr);pr.catch(()=>{});return pr}
function chunkFor(tt){const k=kOf(tt),c=chunks.get(k);if(!c&&cfg.auto)load(k).catch(()=>{});return c||null}
/* ---- Chebyshev evaluation ---- */
function ev(c,name,tt,out,off){const s=c.S[name],x=tt-c.t0,i=Math.min(Math.floor(x/s.L),CH/s.L-1),tau=2*(x-i*s.L)/s.L-1,n=s.N+1,base=i*s.dim*n,a=s.a,t2=2*tau;
 for(let d=0;d<s.dim;d++){const o=base+d*n;let b1=0,b2=0;for(let j=n-1;j>=1;j--){const b=t2*b1-b2+a[o+j];b2=b1;b1=b}out[off+d]=tau*b1-b2+a[o]}return out}
/* barycentric ICRF position (km) of a body at TT, or null */
const BODY={Sun:'sun',Mercury:'mercury',Venus:'venus',Mars:'mars',Jupiter:'jupiter',Saturn:'saturn',Uranus:'uranus',Neptune:'neptune',Pluto:'pluto'};
function bary(name,tt){const c=chunkFor(tt);if(!c)return null;const v=[0,0,0];
 if(name==='Earth'||name==='Moon'){const e=ev(c,'emb',tt,[0,0,0],0),m=ev(c,'moon',tt,[0,0,0],0),f=1/(1+EMRAT);
  return name==='Earth'?[e[0]-m[0]*f,e[1]-m[1]*f,e[2]-m[2]*f]:[e[0]+m[0]*(1-f),e[1]+m[1]*(1-f),e[2]+m[2]*(1-f)]}
 if(name==='EMB')return ev(c,'emb',tt,v,0);
 return ev(c,BODY[name],tt,v,0)}
/* ---- frame: bias, long-term precession (fitted poles), nutation ---- */
const BIAS=[[1,-7.078368960971557e-08,8.056213977613186e-08],[7.078368694637675e-08,1,3.305943742989134e-08],[-8.056214211620057e-08,-3.305943172740586e-08,1]];
const NUT={"args":[[0,0,0,0,1],[0,0,2,-2,2],[0,0,2,0,2],[0,0,0,0,2],[0,1,0,0,0],[1,0,0,0,0],[0,1,2,-2,2],[0,0,2,0,1],[1,0,2,0,2],[1,0,0,-2,0],[0,0,2,-2,1],[1,0,-2,0,-2],[0,1,-2,2,-2],[1,0,0,0,1],[1,0,0,0,-1],[1,0,-2,-2,-2],[0,0,0,2,0],[1,0,2,0,1],[2,0,-2,0,-1],[2,0,0,-2,0],[0,0,2,2,2],[2,0,2,0,2],[1,0,2,-2,2],[2,0,0,0,0],[0,0,2,0,0],[1,0,-2,0,-1],[0,0,2,-2,0],[1,0,0,-2,-1],[0,2,2,-2,2],[0,1,0,0,-1],[0,1,0,0,1],[1,0,0,-2,1],[1,0,-2,-2,-1],[2,0,-2,0,0],[1,0,2,2,2],[0,1,2,0,2],[0,0,2,2,1],[1,1,0,-2,0],[0,0,0,2,1],[0,1,-2,0,-2],[2,0,2,-2,2],[2,0,0,-2,-1],[1,0,0,2,0],[1,0,2,-2,1],[2,0,2,0,1]],"dpsi":[-17.20649,0.00338,-1.31831,-0.00082,-0.22768,0.00026,0.20743,-9e-05,0.14721,-0.00297,0.07112,-0.0001,-0.05173,-6e-05,-0.03875,3e-05,-0.03014,6e-05,-0.01571,-3e-05,0.01284,3e-05,-0.01233,4e-05,-0.0188,-0.00502,0.00636,-1e-05,0.00581,-3e-05,0.00595,2e-05,0.00633,-2e-05,-0.00517,4e-05,-0.00458,-1e-05,0.00477,-0.0,-0.00385,1e-05,-0.00308,4e-05,0.00286,1e-05,0.00291,0.0,0.00257,-2e-05,-0.00202,1e-05,-0.00218,-2e-05,-0.00151,1e-05,-0.00157,4e-05,0.00158,0.00018,-0.00141,-1e-05,-0.00128,2e-05,0.00102,-0.0,0.00112,-3e-05,-0.00077,-1e-05,0.00076,-2e-05,-0.00066,-2e-05,-0.00073,0.0,-0.00065,2e-05,0.00065,-5e-05,0.00063,-3e-05,0.00059,-0.0,0.00064,1e-05,0.00056,2e-05,-0.00052,4e-05,-0.01742,1e-05,-0.00012,8e-05,-2e-05,0.0,2e-05,-0.0],"deps":[0.00151,9.20519,-0.00046,0.57303,0.00013,0.09784,-2e-05,-0.08973,0.00053,0.00764,3e-05,-0.00068,-2e-05,0.02242,3e-05,0.02008,4e-05,0.0129,-1e-05,-0.00012,-0.0,-0.00691,1e-05,-0.00532,-0.00071,-0.00973,-1e-05,-0.00333,1e-05,0.00315,-2e-05,0.00254,0.0,-0.00012,1e-05,0.00264,-1e-05,-0.00243,1e-05,5e-05,-1e-05,0.00164,-0.0,0.00131,-1e-05,-0.00124,0.0,-8e-05,1e-05,-6e-05,0.0,-0.00108,-1e-05,-2e-05,-0.0,-0.0008,-0.0,0.00068,0.0001,0.00045,-1e-05,0.00086,1e-05,0.00071,0.0,0.00052,0.0,3e-05,2e-05,0.00034,0.0,-0.00032,-1e-05,0.00033,0.0,0.0,1e-05,0.00032,-0.0,0.0003,-0.0,-0.00028,-1e-05,0.00029,1e-05,-4e-05,-1e-05,-0.00029,0.0,0.00026,-0.0,0.00088,-0.0,-0.0003,-0.0,-5e-05,-0.0,5e-05],"nsec":4};
function nutation(t){const s=x=>x*AS;
 const F=[s(485868.249036+t*(1717915923.2178+t*(31.8792+t*(0.051635-0.00024470*t)))),s(1287104.79305+t*(129596581.0481+t*(-0.5532+t*(0.000136-0.00001149*t)))),
  s(335779.526232+t*(1739527262.8478+t*(-12.7512+t*(-0.001037+0.00000417*t)))),s(1072260.70369+t*(1602961601.2090+t*(-6.3706+t*(0.006593-0.00003169*t)))),
  s(450160.398036+t*(-6962890.5431+t*(7.4722+t*(0.007702-0.00005939*t))))];
 let dp=0,de=0;const n=NUT.args.length;
 for(let i=0;i<n;i++){const g=NUT.args[i],a=g[0]*F[0]+g[1]*F[1]+g[2]*F[2]+g[3]*F[3]+g[4]*F[4],sa=Math.sin(a),ca=Math.cos(a);
  dp+=NUT.dpsi[2*i]*sa+NUT.dpsi[2*i+1]*ca;de+=NUT.deps[2*i]*sa+NUT.deps[2*i+1]*ca;
  if(i<NUT.nsec){const j=2*n+2*i;dp+=t*(NUT.dpsi[j]*sa+NUT.dpsi[j+1]*ca);de+=t*(NUT.deps[j]*sa+NUT.deps[j+1]*ca)}}
 return [dp*AS,de*AS]}
const mul=(A,B)=>A.map(r=>[0,1,2].map(j=>r[0]*B[0][j]+r[1]*B[1][j]+r[2]*B[2][j]));
const mv=(M,v)=>[M[0][0]*v[0]+M[0][1]*v[1]+M[0][2]*v[2],M[1][0]*v[0]+M[1][1]*v[1]+M[1][2]*v[2],M[2][0]*v[0]+M[2][1]*v[1]+M[2][2]*v[2]];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>{const l=Math.hypot(a[0],a[1],a[2]);return [a[0]/l,a[1]/l,a[2]/l]};
const R1=t=>{const c=Math.cos(t),s=Math.sin(t);return [[1,0,0],[0,c,s],[0,-s,c]]},R3=t=>{const c=Math.cos(t),s=Math.sin(t);return [[c,s,0],[-s,c,0],[0,0,1]]};
let fc={tt:NaN};
function frame(tt){if(fc.tt===tt)return fc;const c=chunkFor(tt);if(!c)return null;
 const p=ev(c,'pole',tt,new Array(6),0),pe=nrm(p.slice(0,3)),pc=nrm(p.slice(3,6)),x=nrm(cross(pe,pc)),y=cross(pe,x);
 const P=mul([x,y,pe],BIAS),eps0=Math.acos(pe[0]*pc[0]+pe[1]*pc[1]+pe[2]*pc[2]),[dpsi,deps]=nutation((tt-2451545)/36525),eps=eps0+deps;
 const NP=mul(mul(mul(R1(-eps),R3(-dpsi)),R1(eps0)),P);
 fc={tt,P,NP,eps0,eps,dpsi,deps};return fc}
/* ---- sidereal time: Earth rotation angle + IAU 2006 terms + equation of the equinoxes (degrees) ---- */
function gast(jd,f){const tu=jd-2451545,t=(ttOf(jd)-2451545)/36525;
 const era=2*Math.PI*(0.7790572732640+0.00273781191135448*tu+(jd%1));
 const gmst=era+(0.014506+t*(4612.156534+t*(1.3915817+t*(-0.00000044-t*0.000029956))))*AS;
 f=f||frame(ttOf(jd));return (((gmst+(f?f.dpsi*Math.cos(f.eps):0))/R)%360+360)%360}
/* ---- apparent geocentric place ---- */
const NAMES=['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
function astrometric(name,tt,E){let tau=0,p;
 for(let it=0;it<3;it++){const b=bary(name,tt-tau);if(!b)return null;p=[b[0]-E[0],b[1]-E[1],b[2]-E[2]];tau=Math.hypot(p[0],p[1],p[2])/C_KMD}
 return p}
function aberr(p,V){const d=Math.hypot(p[0],p[1],p[2]),u=[p[0]/d,p[1]/d,p[2]/d],uv=u[0]*V[0]+u[1]*V[1]+u[2]*V[2],q=[u[0]+V[0]-u[0]*uv,u[1]+V[1]-u[1]*uv,u[2]+V[2]-u[2]*uv],l=Math.hypot(q[0],q[1],q[2]);
 return [q[0]/l*d,q[1]/l*d,q[2]/l*d]}
/* body(name, jdUT, {tt:true if jd is already TT, topo:{lat,lon,elev}, speed:false}) ->
   {lon,lat,ra,dec (degrees, apparent, true equinox of date), dist (AU), lonSpeed (deg/day), x,y,z (km, true equator of date)} */
function body(name,jd,o){o=o||{};const tt=o.tt?jd:ttOf(jd),f=frame(tt);if(!f)return null;
 const E=bary('Earth',tt),E1=bary('Earth',tt+0.01),E0=bary('Earth',tt-0.01);if(!E||!E1||!E0)return null;
 const V=[(E1[0]-E0[0])/0.02/C_KMD,(E1[1]-E0[1])/0.02/C_KMD,(E1[2]-E0[2])/0.02/C_KMD];
 let p=astrometric(name,tt,E);if(!p)return null;p=mv(f.NP,aberr(p,V));
 if(o.topo){const ut=o.tt?jd-(ttOf(jd)-jd):jd,th=(gast(ut,f)+o.topo.lon)*R,ph=o.topo.lat*R,a=6378.1366,fl=1/298.25642,
  C=1/Math.sqrt(Math.cos(ph)**2+(1-fl)**2*Math.sin(ph)**2),S=(1-fl)**2*C,h=(o.topo.elev||0)/1000,rc=(a*C+h)*Math.cos(ph),rs=(a*S+h)*Math.sin(ph);
  p=[p[0]-rc*Math.cos(th),p[1]-rc*Math.sin(th),p[2]-rs]}
 const d=Math.hypot(p[0],p[1],p[2]),ra=Math.atan2(p[1],p[0]),dec=Math.asin(p[2]/d),e=mv(R1(f.eps),p);
 const r={lon:((Math.atan2(e[1],e[0])/R)%360+360)%360,lat:Math.asin(e[2]/d)/R,ra:((ra/R)%360+360)%360,dec:dec/R,dist:d/AU,x:p[0],y:p[1],z:p[2]};
 if(o.speed!==false){const b=body(name,tt+0.05,{tt:true,speed:false}),a=body(name,tt-0.05,{tt:true,speed:false});if(a&&b)r.lonSpeed=(((b.lon-a.lon+540)%360)-180)/0.1}
 return r}
/* positions(jdUT) -> {Sun:lon,...,Pluto:lon} apparent tropical longitudes of date, or null when not loaded */
function positions(jd,o){const tt=(o&&o.tt)?jd:ttOf(jd),f=frame(tt);if(!f)return null;
 const E=bary('Earth',tt),E1=bary('Earth',tt+0.01),E0=bary('Earth',tt-0.01);if(!E||!E1||!E0)return null;
 const V=[(E1[0]-E0[0])/0.02/C_KMD,(E1[1]-E0[1])/0.02/C_KMD,(E1[2]-E0[2])/0.02/C_KMD],M=mul(R1(f.eps),f.NP),out={};
 for(const n of NAMES){const p=astrometric(n,tt,E);if(!p)return null;const e=mv(M,aberr(p,V));out[n]=((Math.atan2(e[1],e[0])/R)%360+360)%360;
  if(o&&o.lat)(out.lat||(out.lat={}))[n]=Math.asin(e[2]/Math.hypot(e[0],e[1],e[2]))/R}
 return out}
/* helio(name, jdUT) -> geometric heliocentric {lon,lat (mean ecliptic of date), r (AU), x,y,z (AU)}; name may be 'Earth' */
function helio(name,jd,o){const tt=(o&&o.tt)?jd:ttOf(jd),f=frame(tt);if(!f)return null;const b=bary(name,tt),s=bary('Sun',tt);if(!b||!s)return null;
 const e=mv(mul(R1(f.eps0),f.P),[b[0]-s[0],b[1]-s[1],b[2]-s[2]]),d=Math.hypot(e[0],e[1],e[2]);
 return {lon:((Math.atan2(e[1],e[0])/R)%360+360)%360,lat:Math.asin(e[2]/d)/R,r:d/AU,x:e[0]/AU,y:e[1]/AU,z:e[2]/AU}}
const rangeTT=[A0+KMIN*CH,A0+(KMAX+1)*CH];
window.EA_JPL={version:'DE441',source:'NASA JPL DE441 (public domain)',deltaT:y=>deltaT(y),ttOf,gast:jd=>gast(jd),
 has:jd=>chunks.has(kOf(ttOf(jd))),need:jd=>load(kOf(ttOf(jd))),load,addChunk,addBase64,fileOf,chunkOf:jd=>kOf(ttOf(jd)),
 onLoad:f=>{listeners.push(f);return ()=>{const i=listeners.indexOf(f);if(i>=0)listeners.splice(i,1)}},
 config:cfg,range:rangeTT,loaded:()=>[...chunks.keys()].sort((a,b)=>a-b),
 body,positions,helio,astrometric:(n,jd,o)=>{const tt=(o&&o.tt)?jd:ttOf(jd),E=bary('Earth',tt),p=E&&astrometric(n,tt,E);if(!p)return null;const d=Math.hypot(p[0],p[1],p[2]);return {ra:((Math.atan2(p[1],p[0])/R)%360+360)%360,dec:Math.asin(p[2]/d)/R,dist:d/AU}},bary:(n,jd,o)=>bary(n,(o&&o.tt)?jd:ttOf(jd)),frame:jd=>frame(ttOf(jd)),NAMES};
})();
