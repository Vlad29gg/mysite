(()=>{
"use strict";

const API="https://papachiz-music-7948828570.papachiz-music.workers.dev";
const $=id=>document.getElementById(id);

const audio=$("audio"), title=$("title"), artist=$("artist"), cover=$("cover"),
      current=$("current"), duration=$("duration"), seek=$("seek"),
      play=$("play"), prev=$("prev"), next=$("next"),
      openBtn=$("playlist-open"), closeBtn=$("playlist-close"),
      modal=$("playlist-modal"), list=$("track-list"), count=$("count");

let tracks=[], index=0;

const fmt=s=>{
  if(!Number.isFinite(s))return "0:00";
  const m=Math.floor(s/60), sec=Math.floor(s%60).toString().padStart(2,"0");
  return `${m}:${sec}`;
};
const name=t=>t?.title||"Без названия";
const by=t=>t?.artist||"PAPACHIZ123";

function syncPlay(){ play.textContent=audio.paused?"▶":"Ⅱ"; }

function paint(t){
  title.textContent=name(t);
  artist.textContent=by(t);
  cover.src=(t?.cover&&/^https:\/\//i.test(t.cover))?t.cover:"profile.jpg";
}

function renderList(){
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

    const cp=document.createElement("span");
    cp.className="track-copy";
    const s=document.createElement("strong");
    s.textContent=name(t);
    const sm=document.createElement("small");
    sm.textContent=by(t);
    cp.append(s,sm);

    const tm=document.createElement("span");
    tm.className="track-time";
    tm.textContent=Number.isFinite(Number(t.duration))?fmt(Number(t.duration)):"▶";

    b.append(no,cp,tm);
    b.addEventListener("click",()=>{ load(i,true); closePlaylist(); });
    li.append(b);
    list.append(li);
  });
}

function load(i,autoplay=false){
  if(!tracks.length)return;
  index=(i+tracks.length)%tracks.length;
  const t=tracks[index];
  paint(t);
  if(audio.src!==t.src){
    audio.src=t.src;
    seek.value=0;
    current.textContent="0:00";
    duration.textContent=Number.isFinite(Number(t.duration))?fmt(Number(t.duration)):"0:00";
  }
  renderList();
  if(autoplay) audio.play().catch(()=>{});
}

function openPlaylist(){
  modal.hidden=false;
  document.body.classList.add("modal-open");
}
function closePlaylist(){
  modal.hidden=true;
  document.body.classList.remove("modal-open");
}

openBtn.addEventListener("click",openPlaylist);
closeBtn.addEventListener("click",closePlaylist);
modal.addEventListener("click",e=>{ if(e.target===modal)closePlaylist(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!modal.hidden)closePlaylist(); });

play.addEventListener("click",()=>audio.paused?audio.play().catch(()=>{}):audio.pause());
prev.addEventListener("click",()=>load(index-1,true));
next.addEventListener("click",()=>load(index+1,true));
seek.addEventListener("input",()=>{ if(Number.isFinite(audio.duration))audio.currentTime=Number(seek.value); });

audio.addEventListener("play",syncPlay);
audio.addEventListener("pause",syncPlay);
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
audio.addEventListener("ended",()=>load(index+1,true));
audio.addEventListener("error",()=>{ title.textContent="Трек недоступен"; });

fetch(API.replace(/\/$/,"")+"/playlist",{cache:"no-store"})
  .then(r=>{ if(!r.ok)throw new Error("playlist"); return r.json(); })
  .then(data=>{
    tracks=Array.isArray(data?.tracks)
      ? data.tracks.filter(t=>t&&typeof t.src==="string"&&/^https:\/\//i.test(t.src))
      : [];
    if(!tracks.length){
      title.textContent="Плейлист пуст";
      artist.textContent="PAPACHIZ123";
      renderList();
      return;
    }
    load(0,false);
  })
  .catch(()=>{
    tracks=[];
    title.textContent="Музыка недоступна";
    artist.textContent="PAPACHIZ123";
    renderList();
  });

syncPlay();
})();