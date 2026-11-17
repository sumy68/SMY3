/* SMY Agency – Partikel-Hintergrund (three.js, lokal unter /assets/three.min.js)
   Abschnitte mit data-szene bestimmen die Form: 0 Kugel, 1 zwei Wolken, 2 Spirale, 3 Würfel, 4 Rakete.
   data-pos="x,y,Größe,Deckkraft" setzt die Lage am Desktop.

   Performance:
   - Start erst nach window.load + requestIdleCallback; three.js wird bei Bedarf nachgeladen.
   - Init in kurzen Häppchen (scheduler.yield / setTimeout-Fallback) statt eines langen Tasks.
   - Partikelanzahl an die Bildschirmfläche gekoppelt; Punktgröße gleicht die Dichte aus (gleiche Helligkeit).
   - Mit GPU volle Qualität (22.000/9.000 Partikel, Antialiasing, devicePixelRatio bis 2).
   - Ohne GPU (Software-Rendering) / reduzierte Bewegung: Standbild; ohne GPU zusätzlich weniger Partikel.
   - Adaptive Qualität: erst bei mehreren Sekunden unter 40 fps werden schrittweise Partikel ausgeblendet.
   - Pause bei verstecktem Tab.
   - Keine Layout-Abfragen im Animations-Loop: Abschnittspositionen werden nur bei Resize/Größenänderung gemessen. */
(function(){
  'use strict';
  let canvas=document.getElementById('buehne');
  if(!canvas)return;
  const ruhig=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const THREE_URL='/assets/three.min.js';
  // Echte GPU: volle Qualität wie im Original (fein, scharf auf Retina)
  const MAX_DPR=2;
  const N_DESKTOP=22000, N_MOBIL=9000;
  // Nur Software-Rendering (ohne GPU): reduziertes Setup, größere Punkte gleichen die Helligkeit aus
  const SW_N_FAKTOR=0.5, SW_N_MIN=4000;
  // Adaptive Reduktion: nur wenn die Bildrate mehrere Sekunden am Stück unter 40 fps liegt
  const ADAPT_FENSTER_MS=2000, ADAPT_SCHLECHTE_FENSTER=2, ADAPT_ZIEL_FPS=40, ADAPT_STATISCH_FPS=17;
  const ADAPT_AUFWAERMEN_MS=2500, ADAPT_SCHRITT=0.75, ADAPT_MIN_ANTEIL=0.35;
  const RESIZE_DEBOUNCE_MS=150;
  const STARTVERZUG_MS=1200;

  // Start nach window.load, frühestens STARTVERZUG_MS nach Navigationsbeginn (Headline/LCP zuerst),
  // dann im Leerlauf – three.js (600 KB) konkurriert so nicht mit dem ersten Rendern.
  function nachDemLaden(fn){
    const leerlauf=()=>('requestIdleCallback' in window)?requestIdleCallback(fn,{timeout:1500}):setTimeout(fn,200);
    const nachVerzug=()=>setTimeout(leerlauf,Math.max(0,STARTVERZUG_MS-performance.now()));
    if(document.readyState==='complete')nachVerzug();
    else addEventListener('load',nachVerzug,{once:true});
  }
  function threeLaden(fertig){
    if(window.THREE){fertig();return;}
    const s=document.createElement('script');
    s.src=THREE_URL;s.async=true;
    s.onload=fertig;
    s.onerror=()=>{canvas.style.display='none';console.warn('[smy-3d] three.js konnte nicht geladen werden');};
    document.head.appendChild(s);
  }
  nachDemLaden(()=>threeLaden(()=>{start().catch(e=>{canvas.style.display='none';console.warn('[smy-3d] Start fehlgeschlagen',e);});}));

  // Main-Thread kurz freigeben, damit der Init nicht ein einziger langer Task ist (TBT)
  const pause=()=>(window.scheduler&&typeof scheduler.yield==='function')?scheduler.yield():new Promise(r=>setTimeout(r,0));

  function istSoftwareRenderer(r){
    try{
      const gl=r.getContext();
      const ext=gl.getExtension('WEBGL_debug_renderer_info');
      const name=String(gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER));
      return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
    }catch(e){return false;}
  }
  const neuerRenderer=aa=>new THREE.WebGLRenderer({canvas,antialias:aa,alpha:true,powerPreference:'high-performance'});

  async function start(){
  // Unterseiten ohne eigene Szenen: Kugel im Hero, danach eine blasse Galaxie im Hintergrund
  if(!document.querySelector('[data-szene]')){
    const teile=[...document.querySelectorAll('main > section, main > div > section')];
    teile.forEach((el,i)=>{el.dataset.szene=i===0?'0':'2';el.dataset.pos=i===0?'3.6,0.2,0.78,0.85':'0,0,1.7,0.12';});
  }

  if(!window.THREE){canvas.style.display='none';return;}
  // Ohne GPU (Software-Rendering) muss der Browser das Vollbild-Canvas jeden Frame auf die CPU zurücklesen
  // (ReadPixels) – unabhängig von der Partikelzahl. Dann wie bei reduzierter Bewegung: statisches Bild,
  // das beim Scrollen weiter zwischen den Formen wechselt.
  let renderer;
  try{renderer=neuerRenderer(false);}
  catch(e){canvas.style.display='none';console.warn('[smy-3d] WebGL nicht verfügbar',e);return;}
  const softwareGL=istSoftwareRenderer(renderer);
  let statisch=ruhig||softwareGL;
  if(!softwareGL){
    // Echte GPU: auf frischem Canvas mit Antialiasing neu anlegen (Kontext-Attribute sind nachträglich fix).
    // Ohne GPU bleibt der erste Kontext – kein zweiter Kontext im teuren Software-Pfad.
    await pause();
    renderer.dispose(); // alter Kontext wird mit dem entfernten Canvas freigegeben
    const frisch=canvas.cloneNode(false);canvas.replaceWith(frisch);canvas=frisch;
    try{renderer=neuerRenderer(true);}
    catch(e){canvas.style.display='none';console.warn('[smy-3d] WebGL nicht verfügbar',e);return;}
  }
  const pixeldichte=()=>softwareGL?1:Math.min(devicePixelRatio||1,MAX_DPR);
  renderer.setPixelRatio(pixeldichte());
  await pause();

  let vw=innerWidth,vh=innerHeight;
  const mobil=vw<760;
  // Partikelanzahl: mit GPU wie im Original; ohne GPU reduziert (dort nur ein Standbild)
  const nVoll=mobil?N_MOBIL:N_DESKTOP;
  const N=softwareGL?Math.max(SW_N_MIN,Math.round(nVoll*SW_N_FAKTOR)):nVoll;
  // Punktgröße nur im Software-Fall anheben (Helligkeit trotz weniger Punkte) – mit GPU bleiben die Punkte fein
  const dichteAusgleich=n=>softwareGL?Math.sqrt(Math.max(1,nVoll/n)):1;
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(42,1,0.1,100);
  cam.position.set(0,0,11);

  // Zufall mit festem Startwert, damit die Formen bei jedem Laden gleich sind.
  // Jede Form hat eine eigene Folge -> Formen können unabhängig voneinander (später) berechnet werden.
  function zufall(start){
    let seed=start;
    const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
    const gauss=()=>{let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
    return {rnd,gauss};
  }
  const {rnd,gauss}=zufall(7);

  // Zufällige Reihenfolge der Slots: so ist jeder Anfangsbereich (drawRange) eine gleichmäßige Stichprobe der Form
  const slot=new Uint32Array(N);for(let i=0;i<N;i++)slot[i]=i;
  for(let i=N-1;i>0;i--){const j=Math.floor(rnd()*(i+1));const t=slot[i];slot[i]=slot[j];slot[j]=t;}
  function form(fn){const a=new Float32Array(N*3);for(let i=0;i<N;i++){const p=fn(i),k=slot[i]*3;a[k]=p[0];a[k+1]=p[1];a[k+2]=p[2];}return a;}

  const bauer=[
    // 0: Kugel, die atmet – dichter Kern, lockere Hülle
    ()=>{const {rnd,gauss}=zufall(11);return form(i=>{
      const y=1-2*(i+0.5)/N, r=Math.sqrt(1-y*y), phi=i*2.39996;
      const schale=rnd()<0.75?2.6+gauss()*0.12:rnd()*2.4;
      return [Math.cos(phi)*r*schale,y*schale,Math.sin(phi)*r*schale];
    });},
    // 1: zwei Wolken – Vertrieb und Programmierung
    ()=>{const {rnd}=zufall(13);return form(i=>{
      const links=i%2===0, c=links?[-2.4,0.3,0]:[2.4,-0.3,0];
      const rr=Math.cbrt(rnd())*1.7; const th=rnd()*Math.PI*2, ph=Math.acos(2*rnd()-1);
      return [c[0]+rr*Math.sin(ph)*Math.cos(th),c[1]+rr*Math.cos(ph),c[2]+rr*Math.sin(ph)*Math.sin(th)];
    });},
    // 2: Spiralgalaxie mit drei Armen
    ()=>{const {rnd,gauss}=zufall(17);return form(i=>{
      const arm=i%3, t=Math.pow(rnd(),0.7), r=0.3+t*4.2;
      const a=arm*2.0944+t*5.2+gauss()*0.22/(0.4+t);
      return [Math.cos(a)*r+gauss()*0.12,gauss()*0.18*(1.2-t),Math.sin(a)*r+gauss()*0.12];
    });},
    // 3: Gitterwürfel – Code und Struktur
    ()=>{const {gauss}=zufall(19);const n=Math.ceil(Math.cbrt(N)), sp=4.4/(n-1);return form(i=>{
      const x=i%n,y=Math.floor(i/n)%n,z=Math.floor(i/(n*n))%n;
      return [-2.2+x*sp+gauss()*0.015,-2.2+y*sp+gauss()*0.015,-2.2+z*sp+gauss()*0.015];
    });}
  ];
  // Formen erst bei Bedarf berechnen: Kugel sofort, der Rest stückweise im Leerlauf (kurzer Init-Task)
  const formen=new Array(5);
  const holeForm=k=>formen[k]||(formen[k]=bauer[k]());
  const kugel=holeForm(0);
  await pause();
  const imLeerlauf=fn=>('requestIdleCallback' in window)?requestIdleCallback(fn,{timeout:3000}):setTimeout(fn,50);
  (function weiterBauen(k){if(k>=bauer.length)return;imLeerlauf(()=>{holeForm(k);weiterBauen(k+1);});})(1);
  // 4: Raketen-Logo aus Partikeln (wird im Leerlauf nach dem Laden des Logos befüllt, bis dahin Kugel)
  const rakete=new Float32Array(N*3);rakete.set(kugel);formen[4]=rakete;
  var letzteMisch=-1;
  function raketeBauen(bild){
    const W=bild.width,H=bild.height,c=document.createElement('canvas');c.width=W;c.height=H;
    const g=c.getContext('2d');g.drawImage(bild,0,0);
    const d=g.getImageData(0,0,W,H).data,pts=[];
    for(let y=0;y<H;y+=1)for(let x=0;x<W;x+=1){
      const k=(y*W+x)*4;if(d[k+3]<128)continue;
      const istRakete=x<140&&d[k]>150&&d[k+1]<120; // rote Linien der Rakete
      const wdh=istRakete?3:((x+y)%2===0?1:0);
      for(let r=0;r<wdh;r++)pts.push(y*W+x);
    }
    if(!pts.length)return;
    for(let i=0;i<N;i++){
      const p=pts[Math.floor(rnd()*pts.length)],px=p%W,py=(p-px)/W;
      rakete[i*3]=(px-W/2)/W*8.6+gauss()*0.012;
      rakete[i*3+1]=-(py-H/2)/W*8.6+gauss()*0.012;
      rakete[i*3+2]=gauss()*0.08;
    }
    letzteMisch=-1;
  }
  const logoBild=new Image();
  logoBild.onload=()=>imLeerlauf(()=>raketeBauen(logoBild));
  logoBild.onerror=()=>console.warn('[smy-3d] Logo für die Raketen-Form nicht geladen');
  logoBild.src='/assets/logo-header.png';

  // Platz der Form auf dem Bildschirm je Szene
  const desk=!mobil;
  const lage=[
    {x:desk?3.3:0.8,y:desk?0:-1.6,s:desk?1:0.75,op:1},
    {x:0,y:0,s:desk?1.25:0.7,op:.55},
    {x:desk?3.2:0.5,y:-0.4,s:desk?1:0.65,op:.55},
    {x:desk?3.6:0.6,y:0,s:desk?0.95:0.6,op:.4},
    {x:desk?3.7:0,y:desk?-0.9:-1.55,s:desk?0.46:0.36,op:1}
  ];

  const pos=new Float32Array(N*3);pos.set(kugel);
  const farbe=new Float32Array(N*3),groesse=new Float32Array(N),phase=new Float32Array(N);
  const rot=new THREE.Color(0xff2a1a),hell=new THREE.Color(0xffd6cf),tief=new THREE.Color(0x8a0a05);
  for(let i=0;i<N;i++){
    const r=rnd(), c=r<0.12?hell:(r<0.55?rot:tief);
    farbe[i*3]=c.r;farbe[i*3+1]=c.g;farbe[i*3+2]=c.b;
    groesse[i]=(rnd()<0.04?2.6:1)*(0.6+rnd()*0.8);phase[i]=rnd()*6.283;
  }
  const geo=new THREE.BufferGeometry();
  const posAttr=new THREE.BufferAttribute(pos,3);
  if(posAttr.setUsage)posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position',posAttr);
  geo.setAttribute('farbe',new THREE.BufferAttribute(farbe,3));
  geo.setAttribute('groesse',new THREE.BufferAttribute(groesse,1));
  geo.setAttribute('phase',new THREE.BufferAttribute(phase,1));
  let aktivN=N;
  geo.setDrawRange(0,aktivN);
  const mat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uZeit:{value:0},uPx:{value:renderer.getPixelRatio()},uDichte:{value:dichteAusgleich(aktivN)},uMaus:{value:new THREE.Vector3(99,99,0)},uAlpha:{value:1}},
    vertexShader:`
      attribute vec3 farbe;attribute float groesse;attribute float phase;
      uniform float uZeit,uPx,uDichte;uniform vec3 uMaus;
      varying vec3 vF;varying float vA;
      void main(){
        vec3 p=position;
        p+=0.06*vec3(sin(uZeit*0.9+phase),cos(uZeit*0.7+phase*1.3),sin(uZeit*0.8+phase*0.7));
        vec4 w=modelMatrix*vec4(p,1.0);
        vec2 d=w.xy-uMaus.xy;float l=length(d);
        w.xy+=normalize(d+1e-4)*smoothstep(1.6,0.0,l)*0.9;
        vec4 mv=viewMatrix*w;
        gl_Position=projectionMatrix*mv;
        gl_PointSize=groesse*uDichte*uPx*(40.0/-mv.z);
        vF=farbe;vA=0.55+0.45*sin(uZeit*1.7+phase);
      }`,
    fragmentShader:`
      uniform float uAlpha;varying vec3 vF;varying float vA;
      void main(){
        vec2 c=gl_PointCoord-0.5;float d=length(c);
        float a=smoothstep(0.5,0.0,d);a=a*a*1.4;
        gl_FragColor=vec4(vF,a*vA*uAlpha);
      }`
  });
  const punkte=new THREE.Points(geo,mat);
  const gruppe=new THREE.Group();gruppe.add(punkte);scene.add(gruppe);
  await pause();
  renderer.compile(scene,cam); // Shader vorab übersetzen – eigener Task statt Teil des ersten Frames
  await pause();

  // Abschnittsmitten in Dokument-Koordinaten – nur bei Resize/Größenänderung gemessen, nie pro Frame
  const abschnitte=[...document.querySelectorAll('[data-szene]')];
  const eigeneLage=abschnitte.map(el=>{const p=el.dataset.pos;if(!p||!desk)return null;const v=p.split(',').map(Number);return {x:v[0],y:v[1],s:v[2],op:v[3]};});
  let mittenDok=[],seitenHoehe=0;
  function messen(){
    const y=scrollY;
    mittenDok=abschnitte.map(a=>{const r=a.getBoundingClientRect();return y+(r.top+r.bottom)/2;});
    seitenHoehe=document.documentElement.scrollHeight;
    vw=innerWidth;vh=innerHeight;
  }

  // Scroll -> Szene als Kommazahl (z. B. 1.4 = zwischen Form 1 und der nächsten); rechnet nur mit gecachten Werten
  let vonI=0,nachI=0;
  let von=0,nach=0,mischZiel=0,misch=0;
  function scrollSzene(){
    if(!abschnitte.length)return;
    const sy=scrollY,m=vh*0.5;
    const mitten=mittenDok.map(v=>v-sy);
    let i=0;while(i<mitten.length-1&&mitten[i+1]<m)i++;
    const a=+abschnitte[i].dataset.szene,b=+abschnitte[Math.min(i+1,abschnitte.length-1)].dataset.szene;
    let f=0;if(i<mitten.length-1&&mitten[i]<m){f=(m-mitten[i])/(mitten[i+1]-mitten[i]);}
    f=Math.min(1,Math.max(0,f));
    f=f<0.2?0:f>0.8?1:(f-0.2)/0.6; // Form hält, dann gleitet sie
    von=a;nach=b;vonI=i;nachI=Math.min(i+1,abschnitte.length-1);mischZiel=f*f*(3-2*f);
    const rest=abschnitte.length<2?1e9:seitenHoehe-(sy+vh);
    const letzte=+abschnitte[abschnitte.length-1].dataset.szene;
    if(rest<vh*0.9){vonI=abschnitte.length-2;nachI=abschnitte.length-1;if(a===letzte)vonI=nachI;const v=+abschnitte[abschnitte.length-2].dataset.szene;const g=Math.min(1,Math.max(0,1-rest/(vh*0.9)));von=v;nach=letzte;mischZiel=Math.max(mischZiel*(a===v?1:0),g*g*(3-2*g));if(a===letzte){von=letzte;mischZiel=1;}}
  }

  let mx=99,my=99,mzx=0,mzy=0,mausDa=false;
  addEventListener('pointermove',e=>{mausDa=true;mzx=e.clientX/vw*2-1;mzy=-(e.clientY/vh*2-1);},{passive:true});
  const ray=new THREE.Vector3();

  function groesseSetzen(){
    messen();
    // Pixeldichte kann sich ändern (Fenster auf anderen Bildschirm gezogen) – Punktgröße bleibt daran gekoppelt
    renderer.setPixelRatio(pixeldichte());mat.uniforms.uPx.value=renderer.getPixelRatio();
    renderer.setSize(vw,vh,false);cam.aspect=vw/vh;cam.updateProjectionMatrix();
    scrollSzene();
  }
  let resizeUhr=0;
  const spaeterMessen=()=>{clearTimeout(resizeUhr);resizeUhr=setTimeout(()=>{groesseSetzen();anstossen();},RESIZE_DEBOUNCE_MS);};
  addEventListener('resize',spaeterMessen,{passive:true});
  // Inhalt ändert seine Höhe (Akkordeon, Bewertungen, Schriften) -> Abschnitte neu vermessen
  if('ResizeObserver' in window)new ResizeObserver(spaeterMessen).observe(document.body);
  groesseSetzen();
  misch=mischZiel;
  await pause();

  const akt={...lage[0]};let zeit=0,t0=performance.now(),letzteVon=-1,letzteNach=-1;letzteMisch=-1;
  // Einstieg: Partikel kommen aus einer weiten Wolke zusammen
  let intro=statisch?1:0;const startWolke=statisch?null:form(()=>[gauss()*9,gauss()*6,gauss()*5]);

  // Adaptive Qualität: misst die Bildrate in Zeitfenstern. Erst wenn mehrere Fenster am Stück (= mehrere
  // Sekunden) unter ADAPT_ZIEL_FPS liegen, werden schrittweise Partikel ausgeblendet. Kurze Ruckler
  // (Scrollen, Tab-Wechsel, Shader-Übersetzung beim Start) lösen nichts aus.
  let fensterStart=0,fensterFrames=0,schlechteFenster=0,adaptAb=performance.now()+ADAPT_AUFWAERMEN_MS;
  function qualitaetPruefen(now){
    if(now<adaptAb)return;
    if(!fensterStart){fensterStart=now;fensterFrames=0;return;}
    fensterFrames++;
    const dauer=now-fensterStart;
    if(dauer<ADAPT_FENSTER_MS)return;
    const fps=fensterFrames*1000/dauer;
    fensterStart=now;fensterFrames=0;
    if(fps>=ADAPT_ZIEL_FPS){schlechteFenster=0;return;}
    if(++schlechteFenster<ADAPT_SCHLECHTE_FENSTER)return;
    schlechteFenster=0;
    const minimum=Math.ceil(N*ADAPT_MIN_ANTEIL);
    // Letzte Stufe: auch mit minimaler Partikelzahl unter ~17 fps -> Standbild statt ruckelnder Animation
    if(aktivN<=minimum){if(fps<ADAPT_STATISCH_FPS){statisch=true;intro=1;}return;}
    aktivN=Math.max(minimum,Math.round(aktivN*ADAPT_SCHRITT));
    geo.setDrawRange(0,aktivN);
    mat.uniforms.uDichte.value=dichteAusgleich(aktivN);
    letzteMisch=-1;adaptAb=now+ADAPT_FENSTER_MS; // nach jeder Stufe neu einschwingen lassen
  }
  // Pause (Tab im Hintergrund) zählt nicht als langsame Bildrate
  function messungZuruecksetzen(){fensterStart=0;fensterFrames=0;schlechteFenster=0;}

  function zeichnen(now){
    const dt=Math.min(0.05,(now-t0)/1000);t0=now;zeit+=statisch?0:dt;
    const k=statisch?1:1-Math.pow(0.03,dt);
    misch+=(mischZiel-misch)*k;
    if(intro<1)intro=Math.min(1,intro+dt*0.45);
    const ie=1-Math.pow(1-intro,3);
    // Positionen mischen (nur wenn sich etwas ändert, nur für sichtbare Partikel)
    if(intro<1||von!==letzteVon||nach!==letzteNach||Math.abs(misch-letzteMisch)>0.0005){
      const A=holeForm(von),B=holeForm(nach),ende=aktivN*3;
      for(let i=0;i<ende;i++){
        const v=A[i]+(B[i]-A[i])*misch;
        pos[i]=intro<1?startWolke[i]+(v-startWolke[i])*ie:v;
      }
      posAttr.updateRange.offset=0;posAttr.updateRange.count=ende;
      posAttr.needsUpdate=true;
      letzteVon=von;letzteNach=nach;letzteMisch=misch;
    }
    const L1=eigeneLage[vonI]||lage[von],L2=eigeneLage[nachI]||lage[nach];
    for(const key of ['x','y','s','op']){const z=L1[key]+(L2[key]-L1[key])*misch;akt[key]+=(z-akt[key])*k;}
    gruppe.position.set(akt.x,akt.y,0);
    gruppe.scale.setScalar(akt.s);
    const gew=n=>(von===n?1-misch:0)+(nach===n?misch:0);
    const w2=gew(2),w4=gew(4);
    const spin=zeit*0.12, ruhe=Math.round(spin/6.2832)*6.2832+Math.sin(zeit*0.5)*0.22;
    gruppe.rotation.y=spin*(1-w4)+ruhe*w4+mzx*0.25;
    gruppe.rotation.x=(0.25+0.6*w2)*(1-w4)+mzy*0.15;
    // Maus in Weltkoordinaten (Ebene z=0)
    ray.set(mzx,mzy,0.5).unproject(cam).sub(cam.position).normalize();
    const tt=-cam.position.z/ray.z;if(mausDa){mx+=((cam.position.x+ray.x*tt)-mx)*0.15;my+=((cam.position.y+ray.y*tt)-my)*0.15;}
    mat.uniforms.uMaus.value.set(mx,my,0);
    mat.uniforms.uZeit.value=zeit;
    mat.uniforms.uAlpha.value=akt.op;
    renderer.render(scene,cam);
  }

  // Animations-Loop ausschließlich über requestAnimationFrame
  let rafId=0;
  function frame(now){
    rafId=0;
    zeichnen(now);
    if(!statisch)qualitaetPruefen(now);
    if(!statisch&&!document.hidden)rafId=requestAnimationFrame(frame);
  }
  function anstossen(){
    if(rafId||document.hidden)return;
    t0=performance.now();messungZuruecksetzen();
    rafId=requestAnimationFrame(frame);
  }
  // Tab im Hintergrund -> Loop anhalten, beim Zurückkehren ohne Zeitsprung weiter
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(rafId){cancelAnimationFrame(rafId);rafId=0;}}
    else if(!statisch)anstossen();
  });

  // Statisch (reduzierte Bewegung / Software-Rendering / zu langsam): nur beim Scrollen neu zeichnen, gebündelt pro Frame
  addEventListener('scroll',()=>{scrollSzene();if(statisch)anstossen();},{passive:true});
  anstossen();
  }
})();
