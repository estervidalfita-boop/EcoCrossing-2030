/* =========================================================
   SISTEMA DE AUDIO SINTETIZADO (MÚSICA DE FONDO Y EFECTOS)
   ========================================================= */
const BGM_MELODY = [
  523.25, 659.25, 783.99, 659.25,
  587.33, 698.46, 880.00, 698.46,
  493.88, 587.33, 783.99, 587.33,
  523.25, 659.25, 783.99, 1046.50,
  659.25, 783.99, 987.77, 783.99,
  587.33, 783.99, 880.00, 659.25
];

function ensureAudioContext() {
  if (!game.audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      game.audioCtx = new AudioContextClass();
    }
  }
  if (game.audioCtx && game.audioCtx.state === 'suspended') {
    game.audioCtx.resume().then(() => {
      if (game.musicEnabled && !game.musicUserPaused && !game.musicTimer) {
        startBackgroundMusic();
      }
    }).catch(() => {});
  } else if (game.audioCtx && game.audioCtx.state === 'running' && game.musicEnabled && !game.musicUserPaused && !game.musicTimer) {
    startBackgroundMusic();
  }
}

function startBackgroundMusic() {
  stopBackgroundMusic();
  if (!game.musicEnabled || game.musicUserPaused || !game.audioCtx) return;

  game.musicTimer = setInterval(() => {
    if (!game.musicEnabled || game.musicUserPaused || !game.audioCtx || game.audioCtx.state !== 'running') return;
    try {
      const freq = BGM_MELODY[game.musicStep % BGM_MELODY.length];
      const bassFreq = freq * 0.5;
      const now = game.audioCtx.currentTime;

      const osc = game.audioCtx.createOscillator();
      const gain = game.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.026, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      osc.connect(gain);
      gain.connect(game.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.44);

      if (game.musicStep % 2 === 0) {
        const bassOsc = game.audioCtx.createOscillator();
        const bassGain = game.audioCtx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassFreq, now);
        bassGain.gain.setValueAtTime(0.0001, now);
        bassGain.gain.exponentialRampToValueAtTime(0.02, now + 0.06);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
        bassOsc.connect(bassGain);
        bassGain.connect(game.audioCtx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.68);
      }

      game.musicStep++;
    } catch (err) {
      // Ignorar errores de audio
    }
  }, 460);
}

function stopBackgroundMusic() {
  if (game.musicTimer) {
    clearInterval(game.musicTimer);
    game.musicTimer = null;
  }
}

function toggleMusic() {
  if (!game.musicEnabled || game.musicUserPaused) {
    game.musicEnabled = true;
    game.musicUserPaused = false;
    ensureAudioContext();
    startBackgroundMusic();
    syncAudioButtonsUI();
    playTone('build');
    showToast('🎵', 'Música de fondo activada');
  } else {
    game.musicEnabled = false;
    game.musicUserPaused = true;
    stopBackgroundMusic();
    syncAudioButtonsUI();
    showToast('🔇', 'Música de fondo pausada');
  }
  saveGameState();
}

function toggleSfx() {
  game.sfxEnabled = !game.sfxEnabled;
  const btn = document.getElementById('btn-sfx');
  const icon = document.getElementById('sfx-icon');
  if (game.sfxEnabled) {
    ensureAudioContext();
    btn.className = 'btn-nav btn-sfx-on';
    icon.className = 'fa-solid fa-volume-high';
    playTone('build');
    showToast('🔊', 'Efectos de sonido activados');
  } else {
    btn.className = 'btn-nav btn-sfx-off';
    icon.className = 'fa-solid fa-volume-xmark';
    showToast('🔕', 'Efectos de sonido silenciados');
  }
  saveGameState();
}

function playTone(type) {
  if (!game.sfxEnabled) return;
  ensureAudioContext();
  if (!game.audioCtx) return;

  try {
    const now = game.audioCtx.currentTime;
    const osc = game.audioCtx.createOscillator();
    const gain = game.audioCtx.createGain();

    if (type === 'build') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.14);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(game.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } else if (type === 'quest') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
        const o = game.audioCtx.createOscillator();
        const g = game.audioCtx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, now + idx * 0.08);
        g.gain.setValueAtTime(0.08, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
        o.connect(g);
        g.connect(game.audioCtx.destination);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.24);
      });
    } else if (type === 'demolish') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.18);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      osc.connect(gain);
      gain.connect(game.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(game.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    }
  } catch (err) {
    // Ignorar errores de audio
  }
}

function syncAudioButtonsUI() {
  const audioBtn = document.getElementById('btn-audio');
  const sfxBtn = document.getElementById('btn-sfx');
  const sfxIcon = document.getElementById('sfx-icon');
  const activeMusic = game.musicEnabled && !game.musicUserPaused;

  audioBtn.className = `btn-nav ${activeMusic ? 'btn-audio-on' : 'btn-audio-off'}`;
  sfxBtn.className = `btn-nav ${game.sfxEnabled ? 'btn-sfx-on' : 'btn-sfx-off'}`;
  sfxIcon.className = `fa-solid ${game.sfxEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`;
}