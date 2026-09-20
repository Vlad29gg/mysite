(() => {
  'use strict';

  const API = 'https://papachiz-music-7948828570.papachiz-music.workers.dev';
  const $ = id => document.getElementById(id);

  const audio = $('audio');
  const play = $('play');
  const prev = $('prev');
  const next = $('next');
  const shuffle = $('shuffle');
  const repeat = $('repeat');
  const seek = $('seek');
  const volume = $('volume');
  const title = $('track-title');
  const artist = $('track-artist');
  const cover = $('track-cover');
  const fallback = $('cover-fallback');
  const current = $('time-current');
  const duration = $('time-duration');
  const status = $('music-status');
  const list = $('track-list');
  const count = $('track-count');

  let tracks = [];
  let index = 0;
  let shuffleOn = false;
  let repeatOn = false;

  function time(value) {
    if (!Number.isFinite(value) || value < 0) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function trackTitle(track) {
    return track?.title || 'Без названия';
  }

  function trackArtist(track) {
    return track?.artist || 'PAPACHIZ';
  }

  function setPlaying(isPlaying) {
    document.querySelector('.play-symbol').style.display = isPlaying ? 'none' : 'inline';
    document.querySelector('.pause-symbol').style.display = isPlaying ? 'inline' : 'none';
    play.setAttribute('aria-label', isPlaying ? 'Пауза' : 'Воспроизвести');
  }

  function paint(track) {
    title.textContent = trackTitle(track);
    artist.textContent = trackArtist(track);

    if (track?.cover && /^https:\/\//i.test(track.cover)) {
      cover.src = track.cover;
      cover.hidden = false;
      fallback.hidden = true;
    } else {
      cover.hidden = true;
      cover.removeAttribute('src');
      fallback.hidden = false;
    }
  }

  function trackWord(total) {
    const mod10 = total % 10;
    const mod100 = total % 100;
    if (mod10 === 1 && mod100 !== 11) return 'трек';
    if ([2,3,4].includes(mod10) && ![12,13,14].includes(mod100)) return 'трека';
    return 'треков';
  }

  function renderList() {
    list.textContent = '';
    count.textContent = `${tracks.length} ${trackWord(tracks.length)}`;

    if (!tracks.length) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'Плейлист пока пуст.';
      list.appendChild(empty);
      return;
    }

    tracks.forEach((track, i) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `track-item${i === index ? ' active' : ''}`;
      button.setAttribute('aria-label', `Включить ${trackTitle(track)}`);

      const number = document.createElement('span');
      number.className = 'track-number';
      number.textContent = String(i + 1).padStart(2, '0');

      const meta = document.createElement('span');
      meta.className = 'track-meta';

      const name = document.createElement('strong');
      name.textContent = trackTitle(track);

      const by = document.createElement('small');
      by.textContent = trackArtist(track);

      const action = document.createElement('span');
      action.className = 'track-action';
      action.textContent = i === index && !audio.paused ? 'Ⅱ' : '▶';

      meta.append(name, by);
      button.append(number, meta, action);
      button.addEventListener('click', () => load(i, true));
      li.appendChild(button);
      list.appendChild(li);
    });
  }

  function load(i, autoplay = false) {
    if (!tracks.length) return;

    index = (i + tracks.length) % tracks.length;
    const track = tracks[index];
    paint(track);

    if (audio.src !== track.src) {
      audio.src = track.src;
      seek.value = 0;
      current.textContent = '0:00';
      duration.textContent = '0:00';
    }

    renderList();

    if (autoplay) {
      audio.play().catch(() => {
        status.textContent = 'Нажми ▶ ещё раз, чтобы включить музыку.';
      });
    } else {
      status.textContent = 'Готово к воспроизведению';
    }
  }

  function nextIndex() {
    if (!tracks.length) return 0;
    if (shuffleOn && tracks.length > 1) {
      let target = index;
      while (target === index) target = Math.floor(Math.random() * tracks.length);
      return target;
    }
    return (index + 1) % tracks.length;
  }

  play.addEventListener('click', () => {
    if (!tracks.length) return;
    if (audio.paused) audio.play().catch(() => status.textContent = 'Браузер не разрешил запуск. Нажми ещё раз.');
    else audio.pause();
  });

  prev.addEventListener('click', () => load(index - 1, true));
  next.addEventListener('click', () => load(nextIndex(), true));

  shuffle.addEventListener('click', () => {
    shuffleOn = !shuffleOn;
    shuffle.setAttribute('aria-pressed', String(shuffleOn));
    shuffle.title = shuffleOn ? 'Перемешивание включено' : 'Перемешать';
  });

  repeat.addEventListener('click', () => {
    repeatOn = !repeatOn;
    repeat.setAttribute('aria-pressed', String(repeatOn));
    repeat.title = repeatOn ? 'Повтор текущего трека включён' : 'Повтор';
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
  });

  seek.addEventListener('input', () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value);
  });

  audio.addEventListener('play', () => {
    setPlaying(true);
    status.textContent = 'Воспроизведение';
    renderList();
  });

  audio.addEventListener('pause', () => {
    setPlaying(false);
    if (tracks.length && !audio.ended) status.textContent = 'На паузе';
    renderList();
  });

  audio.addEventListener('loadedmetadata', () => {
    seek.max = Number.isFinite(audio.duration) ? audio.duration : 1;
    duration.textContent = time(audio.duration);
  });

  audio.addEventListener('durationchange', () => {
    seek.max = Number.isFinite(audio.duration) ? audio.duration : 1;
    duration.textContent = time(audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    if (!Number.isFinite(audio.duration)) return;
    seek.max = audio.duration;
    seek.value = audio.currentTime;
    current.textContent = time(audio.currentTime);
    duration.textContent = time(audio.duration);
  });

  audio.addEventListener('waiting', () => status.textContent = 'Загрузка…');

  audio.addEventListener('ended', () => {
    if (repeatOn) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    load(nextIndex(), true);
  });

  audio.addEventListener('error', () => {
    setPlaying(false);
    status.textContent = 'Этот трек сейчас недоступен. Выбери другой.';
  });

  async function refreshPlaylist() {
    try {
      status.textContent = 'Загружаю плейлист…';
      const response = await fetch(`${API.replace(/\/$/, '')}/playlist`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      tracks = Array.isArray(data?.tracks)
        ? data.tracks.filter(track => track && typeof track.src === 'string' && /^https:\/\//i.test(track.src))
        : [];

      if (!tracks.length) {
        title.textContent = 'Музыка скоро появится';
        artist.textContent = '';
        status.textContent = 'Плейлист пока пуст';
        renderList();
        return;
      }

      load(0, false);
      status.textContent = 'Плейлист загружен';
    } catch {
      tracks = [];
      title.textContent = 'Не удалось загрузить музыку';
      artist.textContent = '';
      status.textContent = 'Обнови страницу чуть позже.';
      renderList();
    }
  }

  refreshPlaylist();
})();
