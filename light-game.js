(() => {
 'use strict';
 const dialog=document.getElementById('light-game'),arena=dialog.querySelector('.lg-arena'),overlay=dialog.querySelector('.lg-overlay');
 const title=overlay.querySelector('h3'),description=overlay.querySelector('p'),start=dialog.querySelector('#lg-start'),pause=dialog.querySelector('#lg-pause');
 const scoreNode=dialog.querySelector('#lg-score'),bestNode=dialog.querySelector('#lg-best'),timeNode=dialog.querySelector('#lg-time'),meter=dialog.querySelector('.lg-meter span');
 let roundToken=null,hits=[],serial=0;
 let state='ready',score=0,energy=100,elapsed=0,best=0,last=0,spawnIn=0,frame=0,targets=[];
 try{best=Math.max(0,Number(localStorage.getItem('papachiz.light.best'))||0);}catch{}
 bestNode.textContent=best;
 const api='https://papachiz-game-7948828570.papachiz-music.workers.dev/api/light';
 const form=document.getElementById('lg-submit'),notice=document.getElementById('lg-network');
 async function call(path,data){const r=await fetch(api+path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,signal:AbortSignal.timeout(10000)});const j=await r.json();if(!r.ok)throw Error(j.error||'Рейтинг недоступен');return j;}
 async function top(){try{const j=await call('/top');const list=document.getElementById('lg-top');list.replaceChildren();for(let i=0;i<3;i++){const li=document.createElement('li');const label=document.createElement('span'),value=document.createElement('strong');label.textContent=(i+1)+'. '+(j.top[i]?.name||'Место свободно');value.textContent=j.top[i]?j.top[i].score+' очков':'—';li.append(label,value);list.append(li);}}catch{document.getElementById('lg-top').textContent='Рейтинг пока недоступен';}}
 form.addEventListener('submit',async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;try{await call('/finish',{token:roundToken,hits,elapsed,name:document.getElementById('lg-name').value});form.hidden=true;notice.textContent='Результат отправлен. В рейтинге сохраняется лучший результат этого ника.';top();}catch(e){notice.textContent=e.message;}finally{button.disabled=false;}});
 function stats(){scoreNode.textContent=score;timeNode.textContent=Math.max(0,Math.ceil(60-elapsed))+' с';meter.style.width=Math.max(0,energy)+'%';dialog.querySelector('.lg-meter').setAttribute('aria-valuenow',Math.round(Math.max(0,energy)));}
 function clearTargets(){targets.forEach(t=>t.el.remove());targets=[];arena.querySelectorAll('.lg-popup').forEach(e=>e.remove());}
 function show(heading,text,label){title.textContent=heading;description.textContent=text;start.textContent=label;overlay.hidden=false;start.focus();}
 function end(){state='over';cancelAnimationFrame(frame);clearTargets();if(score>best){best=score;try{localStorage.setItem('papachiz.light.best',String(best));}catch{}}bestNode.textContent=best;stats();show(energy<=0?'Свет погас':'Ты сохранил свет',score+' очков. Рекорд на этом устройстве: '+best+'.','Ещё раз');pause.disabled=true;form.hidden=!roundToken||!score;}
 function spawn(){
  const rect=arena.getBoundingClientRect();if(rect.width<70||rect.height<70)return;
  let x,y;
  for(let i=0;i<20;i++){x=32+Math.random()*(rect.width-64);y=32+Math.random()*(rect.height-64);if(targets.every(t=>Math.hypot(t.x*rect.width-x,t.y*rect.height-y)>68))break;if(i===19)return;}
  const el=document.createElement('button');el.type='button';el.className='lg-target';el.setAttribute('aria-label','Поймать огонёк');el.style.left=x/rect.width*100+'%';el.style.top=y/rect.height*100+'%';
  const target={id:serial++,born:elapsed,el,x:x/rect.width,y:y/rect.height,ttl:Math.max(1.2,2.5-elapsed/50)};targets.push(target);arena.append(el);
  function hit(event){event.preventDefault();event.stopPropagation();if(state!=='playing'||!targets.includes(target))return;hits.push({id:target.id,born:target.born,at:elapsed});score+=10;energy=Math.min(100,energy+8);targets=targets.filter(t=>t!==target);el.remove();const p=document.createElement('span');p.className='lg-popup';p.textContent='+10';p.style.left=target.x*100+'%';p.style.top=target.y*100+'%';arena.append(p);setTimeout(()=>p.remove(),500);stats();}
  el.addEventListener('pointerdown',hit);el.addEventListener('click',hit);
 }
 function tick(now){if(state!=='playing')return;const dt=Math.min((now-last)/1000,.1);last=now;elapsed+=dt;energy-=dt*(5+elapsed/15);spawnIn-=dt;
  for(const t of [...targets]){t.ttl-=dt;if(t.ttl<=0){t.el.remove();targets=targets.filter(x=>x!==t);energy-=10;}else t.el.style.opacity=String(Math.min(1,.35+t.ttl));}
  if(spawnIn<=0){spawn();spawnIn=Math.max(.38,.8-elapsed/140);}stats();if(energy<=0||elapsed>=60){end();return;}frame=requestAnimationFrame(tick);
 }
 async function begin(){if(state!=='paused'){score=0;energy=100;elapsed=0;spawnIn=0;clearTargets();hits=[];serial=0;roundToken=null;form.hidden=true;notice.textContent='';start.disabled=true;try{const result=await call('/start',{});roundToken=result.token;}catch{notice.textContent='Игра без рейтинга: сервер недоступен.';}finally{start.disabled=false;}if(!dialog.open)return;}state='playing';overlay.hidden=true;pause.disabled=false;pause.textContent='Пауза';last=performance.now();stats();pause.focus();frame=requestAnimationFrame(tick);}
 function suspend(){if(state!=='playing')return;state='paused';cancelAnimationFrame(frame);show('Пауза','Свет подождёт. Продолжим?','Продолжить');}
 document.getElementById('mini-launch').addEventListener('click',()=>{dialog.showModal();top();stats();start.focus();});
 document.getElementById('lg-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);state='ready';form.hidden=true;clearTargets();title.textContent='Не дай свету погаснуть';description.textContent='Лови огоньки мышкой или пальцем. Пропущенный огонёк отнимает свет. Продержись 60 секунд.';start.textContent='Начать';overlay.hidden=false;document.getElementById('mini-launch').focus();});
 start.addEventListener('click',begin);pause.addEventListener('click',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});window.addEventListener('blur',suspend);window.addEventListener('resize',()=>{if(state==='playing')suspend();clearTargets();});
})();
