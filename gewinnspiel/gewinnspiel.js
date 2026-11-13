(()=>{const s=document.querySelector('.gw-sparks');if(!s)return;
for(let i=0;i<18;i++){const e=document.createElement('span');const a=Math.random()*Math.PI*2,r=140+Math.random()*120;
e.style.left='50%';e.style.top='48%';e.style.setProperty('--dx',Math.cos(a)*r+'px');e.style.setProperty('--dy',Math.sin(a)*r-40+'px');
e.style.animationDelay=(Math.random()*2.4).toFixed(2)+'s';e.style.animationDuration=(1.8+Math.random()*1.4).toFixed(2)+'s';s.appendChild(e);}
const b=document.querySelector('.gw-box');if(b)b.addEventListener('click',()=>{b.animate([{transform:'rotate(0)'},{transform:'rotate(-8deg)'},{transform:'rotate(8deg)'},{transform:'rotate(-5deg)'},{transform:'rotate(0)'}],{duration:500});});
})();
