import { PALETTE, SOS_MAX } from './constants.js';
import * as state from './state.js';
import { setState } from './state.js';
import { setNightMode as _setNightMode3D } from './scene/SceneManager.js';

// ─── Night mode ───────────────────────────────────────────────────
export function initNightMode() {
  try {
    if (localStorage.getItem('nightMode') === '1') {
      setState({ nightModeOn: true });
      document.body.classList.add('night-mode');
      const b = document.getElementById('night-btn');
      if (b) b.textContent = '☀ Day';
      _setNightMode3D(true);
    }
  } catch(e) {}
}

export function toggleNightMode() {
  const on = !state.nightModeOn;
  setState({ nightModeOn: on });
  document.body.classList.toggle('night-mode', on);
  document.getElementById('night-btn').textContent = on ? '☀ Day' : '☽ Night';
  _setNightMode3D(on);
  try { localStorage.setItem('nightMode', on ? '1' : '0'); } catch(e) {}
}

// ─── Score ────────────────────────────────────────────────────────
export function getBest(idx) {
  try { const v = localStorage.getItem(`wsbest_${idx}`); return v ? parseInt(v) : null; } catch(e) { return null; }
}

export function setBest(idx, score) {
  try { localStorage.setItem(`wsbest_${idx}`, score); } catch(e) { console.warn('setBest:', e); }
}

export function updateBestDisplay() {
  const best = getBest(state.currentLevel);
  document.getElementById('best-score').textContent = best !== null ? `best: ${best}` : '';
}

// ─── Buttons ──────────────────────────────────────────────────────
export function updateRestartBtn() {
  const btn = document.getElementById('restart-btn'); if (!btn) return;
  btn.textContent = (state.moves===0 || state.won) ? 'New Game' : '↺ Restart';
}

export function updateSOSBtn() {
  const btn = document.getElementById('sos-btn'); if (!btn) return;
  const active = (SOS_MAX - state.sosUsed) > 0 && !state.zenMode && !state.sandMode;
  btn.style.opacity = active ? '1' : '0.4';
  btn.style.pointerEvents = active ? 'auto' : 'none';
}

export function setMsg(txt, cls='') {
  const el = document.getElementById('message');
  el.textContent = txt; el.className = cls;
}

// ─── Mascot ───────────────────────────────────────────────────────
let mascotResetTimer = null;

function _mascotSetFace(name) {
  ['idle','oops','yay','sad'].forEach(f => {
    document.getElementById(`face-${f}`).setAttribute('display', f===name ? '' : 'none');
  });
}

export function mascotIdle() {
  if (mascotResetTimer) { clearTimeout(mascotResetTimer); mascotResetTimer = null; }
  const m = document.getElementById('mascot');
  m.classList.remove('oops','yay','floating','sad');
  void m.offsetWidth;
  m.classList.add('floating');
  _mascotSetFace('idle');
}

export function mascotOops() {
  if (mascotResetTimer) clearTimeout(mascotResetTimer);
  const m = document.getElementById('mascot');
  m.classList.remove('oops','yay','floating','sad'); void m.offsetWidth; m.classList.add('oops');
  _mascotSetFace('oops');
  mascotResetTimer = setTimeout(mascotIdle, 900);
}

export function mascotYay() {
  if (mascotResetTimer) clearTimeout(mascotResetTimer);
  const m = document.getElementById('mascot');
  m.classList.remove('oops','yay','floating','sad'); void m.offsetWidth; m.classList.add('yay');
  _mascotSetFace('yay');
}

export function mascotSad() {
  if (mascotResetTimer) clearTimeout(mascotResetTimer);
  const m = document.getElementById('mascot');
  m.classList.remove('oops','yay','floating','sad'); void m.offsetWidth; m.classList.add('sad');
  _mascotSetFace('sad');
  mascotResetTimer = setTimeout(mascotIdle, 2200);
}

// ─── Confetti ─────────────────────────────────────────────────────
let confettiTimeout = null;

export function launchConfetti() {
  const wrap = document.getElementById('confetti-wrap');
  wrap.innerHTML = ''; wrap.classList.add('active');
  for (let i=0; i<50; i++) {
    const el = document.createElement('div');
    el.className = 'petal';
    const sz = Math.random()*8+3, col = PALETTE[Math.floor(Math.random()*PALETTE.length)];
    el.style.cssText = `width:${sz}px;height:${sz*0.55}px;left:${Math.random()*100}%;top:-14px;background:${col};animation-duration:${Math.random()*2+2.2}s;animation-delay:${Math.random()*1.4}s;transform:rotate(${Math.random()*360}deg);`;
    wrap.appendChild(el);
  }
  if (confettiTimeout) clearTimeout(confettiTimeout);
  confettiTimeout = setTimeout(stopConfetti, 5800);
}

export function stopConfetti() {
  const wrap = document.getElementById('confetti-wrap');
  wrap.classList.remove('active'); wrap.innerHTML = '';
  if (confettiTimeout) { clearTimeout(confettiTimeout); confettiTimeout = null; }
}
