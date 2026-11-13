/* SMY Agency – Partikel-Hintergrund (three.js, lokal unter /assets/three.min.js)
   Abschnitte mit data-szene bestimmen die Form: 0 Kugel, 1 zwei Wolken, 2 Spirale, 3 Würfel, 4 Rakete.
   data-pos="x,y,Größe,Deckkraft" setzt die Lage am Desktop. */
(function(){
  const canvas=document.getElementById('buehne');
  const ruhig=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Unterseiten ohne eigene Szenen: Kugel im Hero, danach eine blasse Galaxie im Hintergrund
  if(!document.querySelector('[data-szene]')){
    const teile=[...document.querySelectorAll('main > section, main > div > section')];
    teile.forEach((el,i)=>{el.dataset.szene=i===0?'0':'2';el.dataset.pos=i===0?'3.6,0.2,0.78,0.85':'0,0,1.7,0.12';});
  }

  if(!window.THREE){canvas.style.display='none';return;}
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true,powerPreference:'high-performance'});}
  catch(e){canvas.style.display='none';return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));

  const mobil=innerWidth<760;
  const N=mobil?9000:22000;
  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(42,1,0.1,100);
  cam.position.set(0,0,11);

  // Zufall mit festem Startwert, damit die Formen bei jedem Laden gleich sind
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646;};
  const gauss=()=>{let u=0,v=0;while(!u)u=rnd();while(!v)v=rnd();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};

  function form(fn){const a=new Float32Array(N*3);for(let i=0;i<N;i++){const p=fn(i);a[i*3]=p[0];a[i*3+1]=p[1];a[i*3+2]=p[2];}return a;}

  // 0: Kugel, die atmet – dichter Kern, lockere Hülle
  const kugel=form(i=>{
    const y=1-2*(i+0.5)/N, r=Math.sqrt(1-y*y), phi=i*2.39996;
    const schale=rnd()<0.75?2.6+gauss()*0.12:rnd()*2.4;
    return [Math.cos(phi)*r*schale,y*schale,Math.sin(phi)*r*schale];
  });
  // 1: zwei Wolken – Vertrieb und Programmierung
  const zwei=form(i=>{
    const links=i%2===0, c=links?[-2.4,0.3,0]:[2.4,-0.3,0];
    const rr=Math.cbrt(rnd())*1.7; const th=rnd()*Math.PI*2, ph=Math.acos(2*rnd()-1);
    return [c[0]+rr*Math.sin(ph)*Math.cos(th),c[1]+rr*Math.cos(ph),c[2]+rr*Math.sin(ph)*Math.sin(th)];
  });
  // 2: Spiralgalaxie mit drei Armen
  const spirale=form(i=>{
    const arm=i%3, t=Math.pow(rnd(),0.7), r=0.3+t*4.2;
    const a=arm*2.0944+t*5.2+gauss()*0.22/(0.4+t);
    return [Math.cos(a)*r+gauss()*0.12,gauss()*0.18*(1.2-t),Math.sin(a)*r+gauss()*0.12];
  });
  // 3: Gitterwürfel – Code und Struktur
  const n=Math.ceil(Math.cbrt(N)), sp=4.4/(n-1);
  const wuerfel=form(i=>{
    const x=i%n,y=Math.floor(i/n)%n,z=Math.floor(i/(n*n))%n;
    return [-2.2+x*sp+gauss()*0.015,-2.2+y*sp+gauss()*0.015,-2.2+z*sp+gauss()*0.015];
  });
  // 4: Raketen-Logo aus Partikeln (wird nach dem Laden des Logos befüllt, bis dahin Kugel)
  const rakete=new Float32Array(N*3);rakete.set(kugel);
  const logoBild=new Image();
  logoBild.onload=function(){
    const W=logoBild.width,H=logoBild.height,c=document.createElement('canvas');c.width=W;c.height=H;
    const g=c.getContext('2d');g.drawImage(logoBild,0,0);
    const d=g.getImageData(0,0,W,H).data,pts=[];
    for(let y=0;y<H;y+=1)for(let x=0;x<W;x+=1){
      const k=(y*W+x)*4;if(d[k+3]<128)continue;
      const istRakete=x<140&&d[k]>150&&d[k+1]<120; // rote Linien der Rakete
      const wdh=istRakete?3:((x+y)%2===0?1:0);
      for(let r=0;r<wdh;r++)pts.push([x,y]);
    }
    if(!pts.length)return;
    for(let i=0;i<N;i++){
      const p=pts[Math.floor(rnd()*pts.length)];
      rakete[i*3]=(p[0]-W/2)/W*8.6+gauss()*0.012;
      rakete[i*3+1]=-(p[1]-H/2)/W*8.6+gauss()*0.012;
      rakete[i*3+2]=gauss()*0.08;
    }
    letzteMisch=-1;
  };
  logoBild.src='/assets/logo-header.png';
  const formen=[kugel,zwei,spirale,wuerfel,rakete];

  // Platz der Form auf dem Bildschirm je Szene
  var letzteMisch=-1;
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
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('farbe',new THREE.BufferAttribute(farbe,3));
  geo.setAttribute('groesse',new THREE.BufferAttribute(groesse,1));
  geo.setAttribute('phase',new THREE.BufferAttribute(phase,1));
  const mat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uZeit:{value:0},uPx:{value:renderer.getPixelRatio()},uMaus:{value:new THREE.Vector3(99,99,0)},uAlpha:{value:1}},
    vertexShader:`
      attribute vec3 farbe;attribute float groesse;attribute float phase;
      uniform float uZeit,uPx;uniform vec3 uMaus;
      varying vec3 vF;varying float vA;
      void main(){
        vec3 p=position;
        p+=0.06*vec3(sin(uZeit*0.9+phase),cos(uZeit*0.7+phase*1.3),sin(uZeit*0.8+phase*0.7));
        vec4 w=modelMatrix*vec4(p,1.0);
        vec2 d=w.xy-uMaus.xy;float l=length(d);
        w.xy+=normalize(d+1e-4)*smoothstep(1.6,0.0,l)*0.9;
        vec4 mv=viewMatrix*w;
        gl_Position=projectionMatrix*mv;
        gl_PointSize=groesse*uPx*(40.0/-mv.z);
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

  // Scroll -> Szene als Kommazahl (z. B. 1.4 = zwischen Form 1 und der nächsten)
  const abschnitte=[...document.querySelectorAll('[data-szene]')];
  const eigeneLage=abschnitte.map(el=>{const p=el.dataset.pos;if(!p||!desk)return null;const v=p.split(',').map(Number);return {x:v[0],y:v[1],s:v[2],op:v[3]};});
  let vonI=0,nachI=0;
  let von=0,nach=0,mischZiel=0,misch=0;
  function scrollSzene(){
    const m=innerHeight*0.5;
    const mitten=abschnitte.map(a=>{const r=a.getBoundingClientRect();return (r.top+r.bottom)/2;});
    let i=0;while(i<mitten.length-1&&mitten[i+1]<m)i++;
    const a=+abschnitte[i].dataset.szene,b=+abschnitte[Math.min(i+1,abschnitte.length-1)].dataset.szene;
    let f=0;if(i<mitten.length-1&&mitten[i]<m){f=(m-mitten[i])/(mitten[i+1]-mitten[i]);}
    f=Math.min(1,Math.max(0,f));
    f=f<0.2?0:f>0.8?1:(f-0.2)/0.6; // Form hält, dann gleitet sie
    von=a;nach=b;vonI=i;nachI=Math.min(i+1,abschnitte.length-1);mischZiel=f*f*(3-2*f);
    const rest=abschnitte.length<2?1e9:document.documentElement.scrollHeight-(scrollY+innerHeight);
    const letzte=+abschnitte[abschnitte.length-1].dataset.szene;
    if(rest<innerHeight*0.9){vonI=abschnitte.length-2;nachI=abschnitte.length-1;if(a===letzte)vonI=nachI;const v=+abschnitte[abschnitte.length-2].dataset.szene;const g=Math.min(1,Math.max(0,1-rest/(innerHeight*0.9)));von=v;nach=letzte;mischZiel=Math.max(mischZiel*(a===v?1:0),g*g*(3-2*g));if(a===letzte){von=letzte;mischZiel=1;}}
  }
  addEventListener('scroll',scrollSzene,{passive:true});

  let mx=99,my=99,mzx=0,mzy=0,mausDa=false;
  addEventListener('pointermove',e=>{mausDa=true;mzx=e.clientX/innerWidth*2-1;mzy=-(e.clientY/innerHeight*2-1);},{passive:true});
  const ray=new THREE.Vector3();

  function groesseSetzen(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
  addEventListener('resize',groesseSetzen);groesseSetzen();scrollSzene();
  misch=mischZiel;

  const akt={...lage[0]};let zeit=0,t0=performance.now(),letzteVon=-1,letzteNach=-1;letzteMisch=-1;
  // Einstieg: Partikel kommen aus einer weiten Wolke zusammen
  let intro=ruhig?1:0;const start=form(()=>[gauss()*9,gauss()*6,gauss()*5]);

  function frame(now){
    const dt=Math.min(0.05,(now-t0)/1000);t0=now;zeit+=ruhig?0:dt;
    const k=1-Math.pow(0.03,dt);
    misch+=(mischZiel-misch)*k;
    if(intro<1)intro=Math.min(1,intro+dt*0.45);
    const ie=1-Math.pow(1-intro,3);
    // Positionen mischen (nur wenn sich etwas ändert)
    if(intro<1||von!==letzteVon||nach!==letzteNach||Math.abs(misch-letzteMisch)>0.0005){
      const A=formen[von],B=formen[nach];
      for(let i=0;i<N*3;i++){
        const v=A[i]+(B[i]-A[i])*misch;
        pos[i]=intro<1?start[i]+(v-start[i])*ie:v;
      }
      geo.attributes.position.needsUpdate=true;
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
    if(!ruhig)requestAnimationFrame(frame);
  }
  if(ruhig){frame(performance.now());addEventListener('scroll',()=>{scrollSzene();misch=mischZiel;frame(performance.now());},{passive:true});}
  else requestAnimationFrame(frame);
})();
