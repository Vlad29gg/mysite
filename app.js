(()=>{
'use strict';

const API='https://papachiz-music-7948828570.papachiz-music.workers.dev';
const $=id=>document.getElementById(id);

const audio=$('audio'),
      title=$('title'),
      artist=$('artist'),
      cover=$('cover'),
      current=$('current'),
      duration=$('duration'),
      seek=$('seek'),
      play=$('play'),
      prev=$('prev'),
      next=$('next'),
      shuffle=$('shuffle'),
      repeat=$('repeat'),
      repeatOne=$('repeat-one'),
      mute=$('mute'),
      volume=$('volume'),
      volumeValue=$('volume-value'),
      eq=$('eq'),
      open=$('songs-open'),
      close=$('songs-close'),
      panel=$('playlist'),
      list=$('track-list'),
      tc=$('track-count'),
      pc=$('playlist-count');

let tracks=[];
let index=0;
let shuffleOn=false;
let repeatMode='off'; // off -> all -> one -> off
let previousVolume=1;

const PLAY='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7L8 5Z"/></svg>';
const PAUSE='<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z"/></svg>';
const ACTIVE_MARK='<svg viewBox="0 0 24 24"><path d="M4 10h3v4H4v-4Zm5-4h3v12H9V6Zm5 2h3v8h-3V8Zm5-5h3v18h-3V3Z"/></svg>';

const fmt=v=>Number.isFinite(v)?`${Math.floor(v/60)}:${Math.floor(v%60).toString().padStart(2,'0')}`:'0:00';
const name=t=>t?.title||'Без названия';
const by=t=>t?.artist||'PAPACHIZ123';
const coverOf=t=>{
  const candidates=[t?.cover,t?.cover_url,t?.coverUrl,t?.thumbnail,t?.thumbnail_url,t?.image,t?.image_url,t?.artwork,t?.photo];
  const found=candidates.find(v=>typeof v==='string'&&/^https:\/\//i.test(v));
  return found||'profile.jpg';
};

function setRangeFill(el,value,max=1){
  const pct=max>0?Math.max(0,Math.min(100,(value/max)*100)):0;
  el.style.setProperty('--fill',pct+'%');
}

function syncPlay(){
  play.innerHTML=audio.paused?PLAY:PAUSE;
  play.title=audio.paused?'Воспроизвести':'Пауза';
  play.setAttribute('aria-label',play.title);
  const active=!audio.paused&&!audio.ended;
  eq.classList.toggle('playing',active);
  cover.classList.toggle('playing',active);
}

function syncVolume(){
  const v=audio.muted?0:audio.volume;
  volume.value=v;
  setRangeFill(volume,v,1);
  volumeValue.textContent=Math.round(v*100)+'%';
  mute.querySelector('.volume-on').hidden=(v===0);
  mute.querySelector('.volume-off').hidden=(v!==0);
  mute.title=v===0?'Включить звук':'Выключить звук';
  mute.setAttribute('aria-label',mute.title);
}

function syncRepeat(){
  repeat.classList.toggle('active',repeatMode!=='off');
  repeatOne.hidden=repeatMode!=='one';
  const label=repeatMode==='all'?'Повтор списка':repeatMode==='one'?'Повтор одной песни':'Повтор выключен';
  repeat.title=label;
  repeat.setAttribute('aria-label',label);
}

function paint(t){
  title.textContent=name(t);
  artist.textContent=by(t);
  cover.src=coverOf(t); cover.onerror=()=>{cover.src='profile.jpg'};
}

function render(){
  list.innerHTML='';
  const n=tracks.length;
  tc.textContent=n;
  pc.textContent=`${n} ${n===1?'трек':(n>=2&&n<=4)?'трека':'треков'}`;

  if(!n){
    const li=document.createElement('li');
    li.className='empty';
    li.textContent='Плейлист пока пуст.';
    list.append(li);
    return;
  }

  tracks.forEach((t,i)=>{
    const li=document.createElement('li');
    const b=document.createElement('button');
    b.type='button';
    b.className='track'+(i===index?' active':'');

    const img=document.createElement('img');
    img.className='track-cover';
    img.src=coverOf(t); img.onerror=()=>{img.src='profile.jpg'};
    img.alt='';
    img.loading='lazy';

    const cp=document.createElement('span');
    cp.className='track-copy';
    const s=document.createElement('strong');
    s.textContent=name(t);
    const sm=document.createElement('small');
    sm.textContent=by(t);
    cp.append(s,sm);

    const tm=document.createElement('span');
    tm.className='track-time';
    tm.textContent=Number.isFinite(Number(t.duration))?fmt(Number(t.duration)):'—';

    const state=document.createElement('span');
    state.className='track-state';
    state.innerHTML=ACTIVE_MARK;

    b.append(img,cp,tm,state);
    b.addEventListener('click',()=>{
      load(i,true);
      panel.hidden=true;
    });
    li.append(b);
    list.append(li);
  });
}

function randomDifferent(){
  if(tracks.length<2)return index;
  let n=index;
  while(n===index)n=Math.floor(Math.random()*tracks.length);
  return n;
}

function nextManual(){
  if(!tracks.length)return;
  if(shuffleOn) load(randomDifferent(),true);
  else load((index+1)%tracks.length,true);
}

function previousManual(){
  if(!tracks.length)return;
  load((index-1+tracks.length)%tracks.length,true);
}

function load(i,auto=false){
  if(!tracks.length)return;
  index=(i+tracks.length)%tracks.length;
  const t=tracks[index];
  paint(t);

  if(audio.src!==t.src){
    audio.src=t.src;
    seek.value=0;
    setRangeFill(seek,0,1);
    current.textContent='0:00';
    duration.textContent=Number.isFinite(Number(t.duration))?fmt(Number(t.duration)):'0:00';
  }

  render();
  if(auto) audio.play().catch(()=>{});
}

play.addEventListener('click',()=>audio.paused?audio.play().catch(()=>{}):audio.pause());
prev.addEventListener('click',previousManual);
next.addEventListener('click',nextManual);

shuffle.addEventListener('click',()=>{
  shuffleOn=!shuffleOn;
  shuffle.classList.toggle('active',shuffleOn);
  shuffle.title=shuffleOn?'Перемешивание включено':'Перемешать';
});

repeat.addEventListener('click',()=>{
  repeatMode=repeatMode==='off'?'all':repeatMode==='all'?'one':'off';
  syncRepeat();
});

mute.addEventListener('click',()=>{
  if(audio.muted||audio.volume===0){
    audio.muted=false;
    audio.volume=previousVolume>0?previousVolume:0.75;
  }else{
    previousVolume=audio.volume;
    audio.muted=true;
  }
  syncVolume();
});

volume.addEventListener('input',()=>{
  const v=Number(volume.value);
  audio.muted=false;
  audio.volume=v;
  if(v>0) previousVolume=v;
  syncVolume();
});

seek.addEventListener('input',()=>{
  if(Number.isFinite(audio.duration)){
    audio.currentTime=Number(seek.value);
    setRangeFill(seek,Number(seek.value),audio.duration);
  }
});

open.addEventListener('click',()=>panel.hidden=false);
close.addEventListener('click',()=>panel.hidden=true);
panel.addEventListener('click',e=>{if(e.target===panel)panel.hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')panel.hidden=true});

audio.addEventListener('play',syncPlay);
audio.addEventListener('pause',syncPlay);
audio.addEventListener('volumechange',syncVolume);

audio.addEventListener('loadedmetadata',()=>{
  seek.max=Number.isFinite(audio.duration)?audio.duration:1;
  duration.textContent=fmt(audio.duration);
  setRangeFill(seek,audio.currentTime||0,audio.duration||1);
});

audio.addEventListener('timeupdate',()=>{
  if(!Number.isFinite(audio.duration))return;
  seek.max=audio.duration;
  seek.value=audio.currentTime;
  current.textContent=fmt(audio.currentTime);
  duration.textContent=fmt(audio.duration);
  setRangeFill(seek,audio.currentTime,audio.duration);
});

audio.addEventListener('ended',()=>{
  if(repeatMode==='one'){
    audio.currentTime=0;
    audio.play().catch(()=>{});
    return;
  }

  if(shuffleOn){
    load(randomDifferent(),true);
    return;
  }

  if(index<tracks.length-1){
    load(index+1,true);
    return;
  }

  if(repeatMode==='all'){
    load(0,true);
    return;
  }

  syncPlay();
});

function animateEq(){
  const bars=eq.querySelectorAll('i');
  if(!audio.paused&&!audio.ended){
    const t=audio.currentTime||0;
    const vals=[
      Math.abs(Math.sin(t*6.2)),
      Math.abs(Math.sin(t*8.1+1.1)),
      Math.abs(Math.sin(t*5.4+2.2)),
      Math.abs(Math.sin(t*7.3+3.4))
    ];
    bars.forEach((bar,i)=>bar.style.height=(3+Math.round(vals[i]*9))+'px');
  }else{
    bars.forEach(bar=>bar.style.height='2px');
  }
  requestAnimationFrame(animateEq);
}
animateEq();

fetch(API.replace(/\/$/,'')+'/playlist',{cache:'no-store'})
  .then(r=>{if(!r.ok)throw new Error();return r.json()})
  .then(data=>{
    tracks=Array.isArray(data?.tracks)
      ? data.tracks.filter(t=>t&&typeof t.src==='string'&&/^https:\/\//i.test(t.src))
      : [];
    if(!tracks.length){
      title.textContent='Плейлист пуст';
      artist.textContent='PAPACHIZ123';
      render();
      return;
    }
    load(0,false);
  })
  .catch(()=>{
    title.textContent='Музыка недоступна';
    artist.textContent='PAPACHIZ123';
    render();
  });

audio.volume=1;
syncPlay();
syncRepeat();
syncVolume();
setRangeFill(seek,0,1);
})();