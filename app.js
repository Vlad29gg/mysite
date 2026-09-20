(()=>{
"use strict";

const MUSIC_API="https://papachiz-music-7948828570.papachiz-music.workers.dev";
const $=id=>document.getElementById(id);

const audio=$("audio");
const title=$("title");
const artist=$("artist");
const cover=$("cover");
const current=$("current");
const duration=$("duration");
const seek=$("seek");
const status=$("status");
const volume=$("volume");
const play=$("play");
const prev=$("prev");
const next=$("next");
const shuffle=$("shuffle");
const repeat=$("repeat");
const list=$("track-list");
const count=$("count");
const panel=$("playlist-panel");
const toggle=$("toggle-playlist");
const toggleLabel=$("toggle-label");
const layout=document.querySelector(".music-layout");
const topTrack=$("top-track");

let tracks=[];
let index=0;
let shuffleOn=false;
let repeatOn=false;

const fmt=s=>{
  if(!Number.isFinite(s)) return "0:00";
  const m=Math.floor(s/60);
  const sec=Math.floor(s%60).toString().padStart(2,"0");
  return `${m}:${sec}`;
};
const tname=t=>t?.title||"Без названия";
const tartist=t=>t?.artist||"PAPACHIZ123";

function setPlayIcon(){
  play.textContent=audio.paused?"▶":"Ⅱ";
}

function paintTrack(t){
  title.textContent=tname(t);
  artist.textContent=tartist(t);
  topTrack.textContent=tname(t);
  if(t?.cover && /^https:\/\//i.test(t.cover)){
    cover.src=t.cover;
  }else{
    cover.src="profile.jpg";
  }
}

function render(){
  list.innerHTML="";
  const n=tracks.length;
  count.textContent=n+" "+(n===1?"трек":(n>=2&&n<=4)?"трека":"треков");

  if(!n){
    const li=document.createElement("li");
    li.className="empty";
    li.textContent="Плейлист пока пуст.";
    list.append(li);
    return;
  }

  tracks.forEach((t,i)=>{
    const li=document.createElement("li");
    const b=document.createElement("button");
    b.type="button";
    b.className="track"+(i===index?" active":"");
    const no=document.createElement("span");
    no.className="num";
    no.textContent=String(i+1).padStart(2,"0");
    const copy=document.createElement("span");
    copy.className="track-copy";
    const strong=document.createElement("strong");
    strong.textContent=tname(t);
    const small=document.createElement("small");
    small.textContent=tartist(t);
    const tm=document.createElement("span");
    tm.className="track-time";
    tm.textContent=Number.isFinite(Number(t.duration))?fmt(Number(t.duration)):"▶";
    copy.append(strong,small);
    b.append(no,copy,tm);
    b.addEventListener("click",()=>load(i,true));
    li.append(b);
    list.append(li);
  });
}

function load(i,autoplay=false){
  if(!tracks.length)return;
  index=(i+tracks.length)%tracks.length;
  const t=tracks[index];
  paintTrack(t);
  if(audio.src!==t.src){
    audio.src=t.src;
    seek.value=0;
    current.textContent="0:00";
    duration.textContent=Number.isFinite(Number(t.duration))?fmt(Number(t.duration)):"0:00";
  }
  render();
  if(autoplay){
    audio.play().catch(()=>status.textContent="Нажми ▶, чтобы включить музыку.");
  }else{
    status.textContent="Готово к воспроизведению";
  }
}

function randomIndex(){
  if(tracks.length<2)return index;
  let n=index;
  while(n===index)n=Math.floor(Math.random()*tracks.length);
  return n;
}

play.addEventListener("click",()=>{
  if(!tracks.length)return;
  if(audio.paused)audio.play().catch(()=>{});
  else audio.pause();
});
prev.addEventListener("click",()=>load(index-1,true));
next.addEventListener("click",()=>load(shuffleOn?randomIndex():index+1,true));

shuffle.addEventListener("click",()=>{
  shuffleOn=!shuffleOn;
  shuffle.classList.toggle("active",shuffleOn);
  status.textContent=shuffleOn?"Перемешивание включено":"Перемешивание выключено";
});
repeat.addEventListener("click",()=>{
  repeatOn=!repeatOn;
  repeat.classList.toggle("active",repeatOn);
  status.textContent=repeatOn?"Повтор трека включён":"Повтор выключен";
});

toggle.addEventListener("click",()=>{
  const open=panel.hidden;
  panel.hidden=!open;
  layout.classList.toggle("open",open);
  toggleLabel.textContent=open?"Скрыть список":"Список песен";
  toggle.querySelector("b").textContent=open?"⌃":"⌄";
});

$("jump-music").addEventListener("click",()=>{
  document.getElementById("music").scrollIntoView({behavior:"smooth",block:"center"});
});

seek.addEventListener("input",()=>{
  if(Number.isFinite(audio.duration))audio.currentTime=Number(seek.value);
});
volume.addEventListener("input",()=>audio.volume=Number(volume.value));

audio.addEventListener("play",()=>{
  setPlayIcon();
  status.textContent="Воспроизведение";
});
audio.addEventListener("pause",()=>{
  setPlayIcon();
  if(!audio.ended)status.textContent="На паузе";
});
audio.addEventListener("loadedmetadata",()=>{
  seek.max=Number.isFinite(audio.duration)?audio.duration:1;
  duration.textContent=fmt(audio.duration);
});
audio.addEventListener("timeupdate",()=>{
  if(!Number.isFinite(audio.duration))return;
  seek.max=audio.duration;
  seek.value=audio.currentTime;
  current.textContent=fmt(audio.currentTime);
  duration.textContent=fmt(audio.duration);
});
audio.addEventListener("ended",()=>{
  if(repeatOn){
    audio.currentTime=0;
    audio.play().catch(()=>{});
  }else{
    load(shuffleOn?randomIndex():index+1,true);
  }
});
audio.addEventListener("waiting",()=>status.textContent="Загрузка…");
audio.addEventListener("error",()=>status.textContent="Трек недоступен.");

fetch(MUSIC_API.replace(/\/$/,"")+"/playlist",{cache:"no-store"})
  .then(r=>{
    if(!r.ok)throw new Error("playlist");
    return r.json();
  })
  .then(data=>{
    tracks=Array.isArray(data?.tracks)
      ? data.tracks.filter(t=>t&&typeof t.src==="string"&&/^https:\/\//i.test(t.src))
      : [];
    if(!tracks.length){
      title.textContent="Плейлист пока пуст";
      artist.textContent="";
      topTrack.textContent="Плейлист пуст";
      status.textContent="Добавь музыку через Telegram.";
      render();
      return;
    }
    load(0,false);
    status.textContent="Плейлист загружен";
  })
  .catch(()=>{
    tracks=[];
    title.textContent="Не удалось загрузить музыку";
    artist.textContent="";
    topTrack.textContent="Музыка недоступна";
    status.textContent="Проверь подключение или Worker.";
    render();
  });

setPlayIcon();
})();