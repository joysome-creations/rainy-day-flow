import { TUBE_CAPACITY, GIANT_TUBE_IDX, ZEN_CAPACITY, SAND_CAPACITY, UNLOCK_MOVES } from './constants.js';
import * as state from './state.js';
import { setState, pushSnapshot } from './state.js';
import { render, animTube } from './renderer.js';
import { playPour, playTubeComplete, playWin, playInvalid, playUnlock, playGravityRumble } from './audio.js';
import { setMsg, updateBestDisplay, updateRestartBtn, updateSOSBtn, getBest, setBest, launchConfetti, stopConfetti, mascotIdle, mascotOops, mascotYay } from './ui.js';

export const topColor = t => t.length ? t[t.length-1] : null;

export function topCount(tube) {
  if (!tube.length) return 0;
  const c = topColor(tube);
  let n = 0;
  for (let i=tube.length-1; i>=0; i--) { if (tube[i]===c) n++; else break; }
  return n;
}

export function canPour(from, to) {
  const { tubes } = state;
  if (from===to || !tubes[from].length || tubes[to].length===TUBE_CAPACITY) return false;
  return !tubes[to].length || topColor(tubes[from])===topColor(tubes[to]);
}

export function doPour(from, to) {
  const { tubes } = state;
  const amount = Math.min(topCount(tubes[from]), TUBE_CAPACITY-tubes[to].length);
  const color = topColor(tubes[from]);
  for (let i=0; i<amount; i++) { tubes[from].pop(); tubes[to].push(color); }
}

export function isTubeComplete(t) {
  return t.length === TUBE_CAPACITY && t.every(c => c===t[0]);
}

export function checkWin() {
  const { sandMode, zenMode, sandTube, zenTube, tubes } = state;
  if (sandMode) return sandTube.length === SAND_CAPACITY;
  if (zenMode) return zenTube.length === ZEN_CAPACITY;
  return tubes.every(t => isTubeComplete(t) || t.length===0);
}

export function canPourToGiant(fi) {
  const { zenTube, zenSequence, tubes } = state;
  if (zenTube.length >= ZEN_CAPACITY) return false;
  const t = tubes[fi];
  if (!t || !t.length) return false;
  return topColor(t) === zenSequence[zenTube.length];
}

export function doPourToGiant(fi) {
  const { zenTube, zenSequence, tubes } = state;
  const color = topColor(tubes[fi]);
  const room = ZEN_CAPACITY - zenTube.length;
  const amount = Math.min(topCount(tubes[fi]), room);
  for (let i=0; i<amount; i++) {
    if (zenSequence[zenTube.length] !== color) break;
    tubes[fi].pop();
    zenTube.push(color);
  }
}

export function canPourToSand(fi) {
  const { sandTube, tubes } = state;
  return sandTube.length < SAND_CAPACITY && tubes[fi].length > 0;
}

export function doPourToSand(fi) {
  const { sandTube, tubes } = state;
  const color = topColor(tubes[fi]);
  const room = SAND_CAPACITY - sandTube.length;
  const amount = Math.min(topCount(tubes[fi]), room);
  for (let i=0; i<amount; i++) { tubes[fi].pop(); sandTube.push(color); }
}

export function applyAdjacentProgress(from, to) {
  const { lockedTubes, lockProgress } = state;
  const unlocked = [];
  for (const [l, prog] of lockProgress) {
    if (!lockedTubes.has(l)) continue;
    if (Math.abs(l-from)===1 || Math.abs(l-to)===1) {
      const next = prog + 1;
      lockProgress.set(l, next);
      if (next >= UNLOCK_MOVES) unlocked.push(l);
    }
  }
  return unlocked;
}

let hintTimer = null;

function clearNeighbourHints() {
  document.querySelectorAll('.tube-wrapper.neighbour-hint').forEach(el => el.classList.remove('neighbour-hint'));
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
}

function showNeighbourHints(li) {
  clearNeighbourHints();
  const ws = document.querySelectorAll('.tube-wrapper');
  [li-1, li+1].forEach(n => {
    if (n>=0 && n<ws.length && !state.lockedTubes.has(n)) ws[n].classList.add('neighbour-hint');
  });
  hintTimer = setTimeout(clearNeighbourHints, 1200);
}

function _triggerWin() {
  setState({ won: true });
  const best = getBest(state.currentLevel);
  if (best === null || state.moves < best) { setBest(state.currentLevel, state.moves); updateBestDisplay(); }
  updateRestartBtn();
  setTimeout(() => { setMsg('✦ all sorted — lovely ✦', 'win'); launchConfetti(); playWin(); mascotYay(); }, 280);
}

export function handleTubeClick(idx) {
  if (state.won) return;
  if (state.gravityFlipping) return;
  if (state.sandMode || state.zenMode) { handleGiantModeClick(idx); return; }
  if (state.lockedTubes.has(idx)) { animTube(idx,'shake'); playInvalid(); mascotOops(); showNeighbourHints(idx); return; }
  clearNeighbourHints();
  if (state.selected === null) {
    if (!state.tubes[idx].length) return;
    setState({ selected: idx }); render(); return;
  }
  if (state.selected === idx) { setState({ selected: null }); render(); return; }
  if (canPour(state.selected, idx)) {
    pushSnapshot();
    const from = state.selected;
    doPour(from, idx);
    setState({ moves: state.moves+1, selected: null });
    playPour();
    document.getElementById('move-count').textContent = state.moves;
    const dest = idx;
    const nowUnlocked = applyAdjacentProgress(from, dest);
    nowUnlocked.forEach(l => state.lockedTubes.delete(l));
    render(); updateRestartBtn();
    if (isTubeComplete(state.tubes[dest])) { animTube(dest,'completing'); playTubeComplete(); } else { animTube(dest,'bounce'); }
    if (nowUnlocked.length) { nowUnlocked.forEach(l => animTube(l,'unlocking')); playUnlock(); }
    if (checkWin()) { _triggerWin(); return; }
    if (state.gravityMode) {
      setState({ movesSinceFlip: state.movesSinceFlip+1 });
      if (state.movesSinceFlip >= 4) { setState({ movesSinceFlip: 0 }); triggerGravityFlip(); }
    }
  } else {
    const prev = state.selected;
    setState({ selected: idx });
    render();
    animTube(prev,'shake'); playInvalid(); mascotOops();
  }
}

export function handleGiantModeClick(idx) {
  const canPour_ = state.zenMode ? canPourToGiant : canPourToSand;
  const doPour_ = state.zenMode ? doPourToGiant : doPourToSand;
  if (state.selected === null) {
    if (idx === GIANT_TUBE_IDX) return;
    if (!state.tubes[idx].length) return;
    setState({ selected: idx }); render(); return;
  }
  if (state.selected === idx) { setState({ selected: null }); render(); return; }
  if (idx === GIANT_TUBE_IDX) {
    if (canPour_(state.selected)) {
      pushSnapshot();
      doPour_(state.selected);
      setState({ moves: state.moves+1, selected: null });
      playPour(true);
      document.getElementById('move-count').textContent = state.moves;
      render(); updateRestartBtn();
      const gEl = document.querySelector('.zen-giant-wrapper');
      if (gEl) {
        const isFull = state.zenMode ? state.zenTube.length===ZEN_CAPACITY : state.sandTube.length===SAND_CAPACITY;
        const anim = isFull ? 'completing' : 'bounce';
        gEl.classList.remove(anim); void gEl.offsetWidth; gEl.classList.add(anim);
        gEl.addEventListener('animationend', () => gEl.classList.remove(anim), {once:true});
      }
      if (checkWin()) _triggerWin();
    } else {
      setState({ selected: null }); render();
      const gEl = document.querySelector('.zen-giant-wrapper');
      if (gEl) {
        gEl.classList.remove('shake'); void gEl.offsetWidth; gEl.classList.add('shake');
        gEl.addEventListener('animationend', () => gEl.classList.remove('shake'), {once:true});
      }
      playInvalid(); mascotOops();
    }
  } else {
    if (canPour(state.selected, idx)) {
      pushSnapshot();
      const from = state.selected;
      doPour(from, idx);
      setState({ moves: state.moves+1, selected: null });
      playPour();
      document.getElementById('move-count').textContent = state.moves;
      render(); updateRestartBtn();
      animTube(idx, isTubeComplete(state.tubes[idx]) ? 'completing' : 'bounce');
      if (isTubeComplete(state.tubes[idx])) playTubeComplete();
    } else {
      const prev = state.selected;
      setState({ selected: idx });
      render();
      animTube(prev,'shake'); playInvalid(); mascotOops();
    }
  }
}

export function triggerGravityFlip() {
  setState({ gravityFlipping: true, selected: null });
  render();
  const SHAKE_DUR = 420, FADE_DUR = 140;

  function shakeAll() {
    document.querySelectorAll('.tube-wrapper').forEach(w => {
      w.classList.remove('gravity-shaking'); void w.offsetWidth; w.classList.add('gravity-shaking');
      w.addEventListener('animationend', () => w.classList.remove('gravity-shaking'), {once:true});
    });
  }

  shakeAll();
  playGravityRumble(0.55);

  setTimeout(() => {
    document.querySelectorAll('.tube .layer.filled, .tube .layer').forEach(l => l.style.opacity='0');
    setTimeout(() => {
      setState({
        tubes: state.tubes.map(tube => {
          if (isTubeComplete(tube) || tube.length===0) return tube;
          return [...tube].reverse();
        })
      });
      render();
      setTimeout(() => {
        shakeAll();
        setTimeout(() => { setState({ gravityFlipping: false }); }, SHAKE_DUR);
      }, FADE_DUR);
    }, FADE_DUR);
  }, SHAKE_DUR);
}
