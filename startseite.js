/* SMY Agency – Interaktionen der Startseite (ohne JavaScript bleibt alles lesbar) */
(function(){
  'use strict';
  var ruhig=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sichtbar=function(el,fn,schwelle){
    if(!el)return;
    if(!('IntersectionObserver' in window)){fn();return;}
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.disconnect();fn();}});},{threshold:schwelle||.35});
    io.observe(el);
  };

  // Wechselndes Wort in der Headline
  var wort=document.getElementById('wechsel');
  if(wort&&!ruhig){
    var woerter=['designen','entwickeln','vermarkten','optimieren'],wi=0;
    setInterval(function(){wort.classList.add('raus');setTimeout(function(){wi=(wi+1)%woerter.length;wort.textContent=woerter[wi];wort.classList.remove('raus');},320);},2600);
  }

  // Zahlen: Endwert steht im HTML, beim ersten Sichtbarwerden zählen sie hoch
  if(!ruhig){
    document.querySelectorAll('[data-count]').forEach(function(el){
      var ziel=+el.dataset.count,nach=el.dataset.suffix||'';
      sichtbar(el,function(){
        var t0=performance.now();
        (function lauf(t){var p=Math.min(1,(t-t0)/1600);el.textContent=Math.round(ziel*(1-Math.pow(1-p,3)))+nach;if(p<1)requestAnimationFrame(lauf);})(t0);
      },.6);
    });
  }

  // Web & Tech: Code tippt sich, die Seite daneben baut sich auf
  var codeEl=document.getElementById('code'),teile=document.querySelectorAll('.bs');
  if(codeEl){
    var zeilen=[
      '<header class="nav">SMY</header>',
      '<h1>Dein Business. Online.</h1>',
      '<p>Mehr Anfragen, weniger Aufwand.</p>',
      '<a class="btn">Jetzt anfragen</a>',
      '<form>Kontaktformular</form>'
    ];
    var esc=function(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};
    var farbig=function(s){return esc(s).replace(/(class=)("[^"]*")/g,'$1<span class="a">$2</span>').replace(/(&lt;\/?[a-z0-9]+)/g,'<span class="t">$1</span>');};
    var alles=function(){codeEl.innerHTML=zeilen.map(farbig).join('\n');teile.forEach(function(t){t.classList.add('da');});};
    sichtbar(document.getElementById('bau'),function(){
      if(ruhig){alles();return;}
      var z=0,c=0,fertig='';
      (function schritt(){
        if(z>=zeilen.length)return;
        c++;codeEl.innerHTML=fertig+farbig(zeilen[z].slice(0,c));
        if(c>=zeilen[z].length){if(teile[z])teile[z].classList.add('da');fertig+=farbig(zeilen[z])+'\n';z++;c=0;setTimeout(schritt,260);}
        else setTimeout(schritt,22+Math.random()*30);
      })();
    });
  }

  // Design: Brand-Kit-Karten fächern beim Scrollen auf
  var faecher=document.getElementById('faecher');
  if(faecher){
    var faechern=function(){
      var r=faecher.getBoundingClientRect(),p=Math.min(1,Math.max(0,(innerHeight-r.top)/(innerHeight*0.75)));
      if(ruhig)p=1;
      faecher.style.setProperty('--f',(p*p*(3-2*p)).toFixed(3));
    };
    addEventListener('scroll',faechern,{passive:true});faechern();
  }

  // Services: aufklappbare Zeilen, immer eine offen
  var ls=[].slice.call(document.querySelectorAll('#leistungen .l'));
  ls.forEach(function(l){
    var oeffnen=function(){ls.forEach(function(x){x.classList.toggle('offen',x===l);x.querySelector('.l__kopf').setAttribute('aria-expanded',x===l);});};
    l.querySelector('.l__kopf').addEventListener('click',oeffnen);
    if(window.matchMedia('(hover:hover)').matches)l.addEventListener('mouseenter',oeffnen);
  });

  // Bewertungen: die Karten aus dem Build werden zur Rampenlicht-Ansicht
  var spot=document.getElementById('spot'),karten=[].slice.call(document.querySelectorAll('#reviews .ds-review'));
  if(spot&&karten.length){
    var stimmen=karten.map(function(k){
      var st=k.querySelector('.ds-review__stars');
      return {name:(k.querySelector('.ds-review__name')||{}).textContent||'',text:(k.querySelector('.ds-review__text')||{}).textContent||'',sterne:st?st.textContent:'★★★★★',label:st?st.getAttribute('aria-label'):''};
    });
    var zitat=document.getElementById('spot-zitat'),namen=document.getElementById('spot-namen'),sterneEl=document.getElementById('spot-sterne');
    var DAUER=7000,akt=-1,uhr=null,pause=false;
    spot.style.setProperty('--dauer',DAUER+'ms');
    spot.hidden=false;document.getElementById('reviews').classList.add('spot-aktiv');
    var knoepfe=stimmen.map(function(s,i){
      var b=document.createElement('button');b.type='button';b.className='spot__name';b.setAttribute('role','tab');
      b.textContent=s.name;b.appendChild(document.createElement('i'));
      b.addEventListener('click',function(){zeige(i);});namen.appendChild(b);return b;
    });
    var planen=function(){clearTimeout(uhr);if(ruhig||pause)return;uhr=setTimeout(function(){zeige((akt+1)%stimmen.length);},DAUER);};
    var zeige=function(i){
      if(i===akt)return;akt=i;
      knoepfe.forEach(function(b,j){b.setAttribute('aria-selected',j===i);var n=b.querySelector('i');n.style.animation='none';void n.offsetWidth;n.style.animation='';});
      var setzen=function(){zitat.textContent=stimmen[i].text;sterneEl.textContent=stimmen[i].sterne;if(stimmen[i].label)sterneEl.setAttribute('aria-label',stimmen[i].label);};
      if(ruhig)setzen();else{zitat.classList.add('raus');setTimeout(function(){setzen();zitat.classList.remove('raus');},380);}
      planen();
    };
    spot.addEventListener('mouseenter',function(){pause=true;spot.classList.add('pause');clearTimeout(uhr);});
    spot.addEventListener('mouseleave',function(){pause=false;spot.classList.remove('pause');planen();});
    zeige(0);
  }
})();
