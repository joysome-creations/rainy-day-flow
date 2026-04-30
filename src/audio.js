export let soundEnabled = false;
let _audioCtx = null;
let _lastInvalidTime = 0;

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  const b = document.getElementById('sound-btn');
  b.textContent = soundEnabled ? '♪ Mute' : '♪ Sound';
  b.style.opacity = soundEnabled ? '1' : '0.5';
}

function makeOsc(ctx, type, freq, gainPeak, startT, duration) {
  const osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, startT);
  g.gain.setValueAtTime(0, startT);
  g.gain.linearRampToValueAtTime(gainPeak, startT+0.015);
  g.gain.exponentialRampToValueAtTime(0.001, startT+duration);
  osc.connect(g); g.connect(ctx.destination);
  osc.start(startT); osc.stop(startT+duration+0.01);
  osc.onended = () => { osc.disconnect(); g.disconnect(); };
}

function makeNoise(ctx, dur, ftype, ffreq, fQ, gain, t) {
  const len = Math.floor(ctx.sampleRate*dur), buf = ctx.createBuffer(1,len,ctx.sampleRate), d = buf.getChannelData(0);
  for (let i=0; i<len; i++) d[i] = Math.random()*2-1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filt = ctx.createBiquadFilter(); filt.type = ftype; filt.frequency.value = ffreq; filt.Q.value = fQ;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t+dur);
  src.connect(filt); filt.connect(g); g.connect(ctx.destination);
  src.start(t); src.stop(t+dur+0.01);
  src.onended = () => { src.disconnect(); filt.disconnect(); g.disconnect(); };
}

export function playPour(isGiant=false) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx(); ctx.resume().then(() => {
      const t = ctx.currentTime, root = (isGiant?380:520) + Math.random()*40;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(root*1.04, t); osc.frequency.exponentialRampToValueAtTime(root, t+0.03);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t+0.008); g.gain.exponentialRampToValueAtTime(0.001, t+0.55);
      osc.connect(g); g.connect(ctx.destination); osc.start(t); osc.stop(t+0.58);
      osc.onended = () => { osc.disconnect(); g.disconnect(); };
      const fifth = ctx.createOscillator(), fg = ctx.createGain();
      fifth.type = 'sine'; fifth.frequency.value = root*1.5;
      fg.gain.setValueAtTime(0, t); fg.gain.linearRampToValueAtTime(0.08, t+0.008); fg.gain.exponentialRampToValueAtTime(0.001, t+0.35);
      fifth.connect(fg); fg.connect(ctx.destination); fifth.start(t); fifth.stop(t+0.38);
      fifth.onended = () => { fifth.disconnect(); fg.disconnect(); };
      const oct = ctx.createOscillator(), og = ctx.createGain();
      oct.type = 'sine'; oct.frequency.value = root*2;
      og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(0.04, t+0.008); og.gain.exponentialRampToValueAtTime(0.001, t+0.18);
      oct.connect(og); og.connect(ctx.destination); oct.start(t); oct.stop(t+0.20);
      oct.onended = () => { oct.disconnect(); og.disconnect(); };
      makeNoise(ctx, 0.012, 'bandpass', 1400, 1.2, 0.035, t);
    });
  } catch(e) { console.warn('playPour:', e); }
}

export function playTubeComplete() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx(); ctx.resume().then(() => {
      [523,659,784].forEach((freq,i) => makeOsc(ctx,'sine',freq,0.18,ctx.currentTime+i*0.13,0.22));
    });
  } catch(e) { console.warn('playTubeComplete:', e); }
}

export function playWin() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx(); ctx.resume().then(() => {
      const t = ctx.currentTime;
      [523.25,659.25,783.99,1046.50].forEach((freq,i) => {
        const s = t+i*0.10; makeOsc(ctx,'sine',freq,0.045,s,0.7); makeOsc(ctx,'sine',freq*1.008,0.022,s+0.01,0.595);
      });
      makeNoise(ctx, 0.25, 'bandpass', 3200, 2.0, 0.008, t);
    });
  } catch(e) { console.warn('playWin:', e); }
}

export function playInvalid() {
  if (!soundEnabled) return;
  const now = performance.now(); if (now-_lastInvalidTime < 120) return; _lastInvalidTime = now;
  try {
    const ctx = getAudioCtx(); ctx.resume().then(() => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(200, t); osc.frequency.exponentialRampToValueAtTime(90, t+0.14);
      g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.22);
      osc.connect(g); g.connect(ctx.destination); osc.start(t); osc.stop(t+0.24);
      osc.onended = () => { osc.disconnect(); g.disconnect(); };
    });
  } catch(e) { console.warn('playInvalid:', e); }
}

export function playUnlock() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx(); ctx.resume().then(() => {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(95, t); osc.frequency.exponentialRampToValueAtTime(55, t+0.12);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t+0.008); g.gain.exponentialRampToValueAtTime(0.001, t+0.16);
      osc.connect(g); g.connect(ctx.destination); osc.start(t); osc.stop(t+0.18);
      osc.onended = () => { osc.disconnect(); g.disconnect(); };
      makeNoise(ctx, 0.022, 'bandpass', 700, 1.2, 0.07, t);
      makeNoise(ctx, 0.018, 'bandpass', 600, 1.0, 0.05, t+0.07);
    });
  } catch(e) { console.warn('playUnlock:', e); }
}

export function playGravityRumble(duration=0.55) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx(); ctx.resume().then(() => {
      const t = ctx.currentTime;
      const len = Math.floor(ctx.sampleRate*duration);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i=0; i<len; i++) { last = (last+(Math.random()*2-1)*0.08)*0.98; d[i] = last; }
      const src = ctx.createBufferSource(); src.buffer = buf;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; lp.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.55, t+0.18);
      g.gain.setValueAtTime(0.55, t+duration-0.22);
      g.gain.linearRampToValueAtTime(0, t+duration);
      src.connect(lp); lp.connect(g); g.connect(ctx.destination);
      src.start(t); src.stop(t+duration+0.05);
      src.onended = () => { src.disconnect(); lp.disconnect(); g.disconnect(); };
    });
  } catch(e) { console.warn('playGravityRumble:', e); }
}

export function playSOS() {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx(); ctx.resume().then(() => {
      const t = ctx.currentTime;
      [523.25,440.00,349.23,293.66,233.08].forEach((freq,i) => {
        const s = t+i*0.13;
        const osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq*1.012, s);
        osc.frequency.linearRampToValueAtTime(freq*0.988, s+0.06);
        osc.frequency.linearRampToValueAtTime(freq*1.006, s+0.12);
        g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(0.13, s+0.012); g.gain.exponentialRampToValueAtTime(0.001, s+0.28);
        osc.connect(g); g.connect(ctx.destination); osc.start(s); osc.stop(s+0.30);
        osc.onended = () => { osc.disconnect(); g.disconnect(); };
        const low = ctx.createOscillator(), lg = ctx.createGain();
        low.type = 'sine'; low.frequency.value = freq*0.841;
        lg.gain.setValueAtTime(0, s); lg.gain.linearRampToValueAtTime(0.05, s+0.015); lg.gain.exponentialRampToValueAtTime(0.001, s+0.22);
        low.connect(lg); lg.connect(ctx.destination); low.start(s); low.stop(s+0.24);
        low.onended = () => { low.disconnect(); lg.disconnect(); };
      });
    });
  } catch(e) { console.warn('playSOS:', e); }
}
