import { TUBE_CAPACITY, GIANT_TUBE_IDX, ZEN_CAPACITY, SAND_CAPACITY, ZEN_GRID_POS, LOCK_ICON_SVG, UNLOCK_MOVES } from './constants.js';
import * as state from './state.js';

// ─── CSS-grad helpers (DOM renderer) ─────────────────────────────
function liquidGrad(hex) {
  return `linear-gradient(152deg,${hex}d8 0%,${hex}f5 48%,${hex}e0 100%)`;
}

function buildSandGradient(arr) {
  const n = arr.length; if (!n) return 'transparent';
  const share = 100/n, blend = share*0.45;
  const stops = [];
  arr.forEach((col,i) => {
    const s = i*share, e = (i+1)*share;
    stops.push(`${col} ${i===0 ? 0 : s+blend}%`);
    stops.push(`${col} ${i===n-1 ? 100 : e-blend}%`);
  });
  return `linear-gradient(to top,${stops.join(',')})`;
}

// Exported for Three.js renderer to reuse
export { buildSandGradient };

// ─── animTube — CSS animation trigger on DOM wrapper ─────────────
export function animTube(idx, cls) {
  const w = document.querySelectorAll('.tube-wrapper')[idx];
  if (!w) return;
  w.classList.remove(cls); void w.offsetWidth; w.classList.add(cls);
  w.addEventListener('animationend', () => w.classList.remove(cls), {once:true});
}

// ─── DOM render ───────────────────────────────────────────────────
export function render() {
  const area = document.getElementById('tubes-area');
  area.innerHTML = '';
  if (state.sandMode) { area.classList.add('zen-mode'); renderSandContent(area); return; }
  if (state.zenMode)  { area.classList.add('zen-mode'); renderZenContent(area); return; }
  area.classList.remove('zen-mode');

  const mainCount = state.tubes.length - state.sosUsed;
  const sosRow = state.sosUsed > 0 ? document.createElement('div') : null;
  if (sosRow) sosRow.style.cssText = 'grid-column:1 / -1;display:flex;justify-content:center;gap:12px;';

  state.tubes.forEach((tube, idx) => {
    const isC = _isTubeComplete(tube), isSel = idx===state.selected, isLk = state.lockedTubes.has(idx);
    const w = document.createElement('div');
    w.className = 'tube-wrapper';
    if (isSel) w.classList.add('selected');
    if (isC)   w.classList.add('complete');
    if (isLk)  w.classList.add('locked');
    w.onclick = () => _clickHandler(idx);

    const stopper = document.createElement('div');
    stopper.className = 'tube-stopper';
    if (isC) {
      const col = tube[0];
      stopper.style.background = `linear-gradient(to bottom,${col}dd,${col}aa)`;
      stopper.style.boxShadow = '0 1px 3px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.25)';
      stopper.classList.add('visible');
    }

    const rim = document.createElement('div'); rim.className = 'tube-rim';
    const tubeEl = document.createElement('div'); tubeEl.className = 'tube';
    for (let i=0; i<TUBE_CAPACITY; i++) {
      const d = document.createElement('div'); d.className = 'layer';
      if (tube[i]) { d.style.background = liquidGrad(tube[i]); d.classList.add('filled'); }
      tubeEl.appendChild(d);
    }

    if (isLk) {
      const dotsEl = document.createElement('div'); dotsEl.className = 'lock-progress';
      const prog = state.lockProgress.get(idx) || 0;
      dotsEl.innerHTML = Array.from({length:UNLOCK_MOVES}, (_,i) => `<div class="lock-dot${i<prog?' filled':''}"></div>`).join('');
      w.appendChild(dotsEl);
    } else {
      const sp = document.createElement('div'); sp.style.cssText = 'height:14px;margin-bottom:3px;'; w.appendChild(sp);
    }

    w.appendChild(stopper); w.appendChild(rim); w.appendChild(tubeEl);
    if (isLk) { const lk = document.createElement('div'); lk.className = 'lock-icon'; lk.innerHTML = LOCK_ICON_SVG; w.appendChild(lk); }

    if (sosRow && idx >= mainCount) sosRow.appendChild(w);
    else area.appendChild(w);
  });
  if (sosRow) area.appendChild(sosRow);
}

function _renderSmallTubes(area, appendSpacer) {
  state.tubes.forEach((tube, idx) => {
    const [gr,gc] = ZEN_GRID_POS[idx];
    const isC = _isTubeComplete(tube), isSel = idx===state.selected;
    const w = document.createElement('div'); w.className = 'tube-wrapper';
    if (isSel) w.classList.add('selected'); if (isC) w.classList.add('complete');
    w.style.gridRow = gr; w.style.gridColumn = gc;
    w.onclick = () => _clickHandler(idx);

    const stopper = document.createElement('div'); stopper.className = 'tube-stopper';
    if (isC) {
      const c = tube[0];
      stopper.style.background = `linear-gradient(to bottom,${c}dd,${c}aa)`;
      stopper.style.boxShadow = '0 1px 3px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.25)';
      stopper.classList.add('visible');
    }
    const rim = document.createElement('div'); rim.className = 'tube-rim';
    const tubeEl = document.createElement('div'); tubeEl.className = 'tube';
    for (let i=0; i<TUBE_CAPACITY; i++) {
      const d = document.createElement('div'); d.className = 'layer';
      if (tube[i]) { d.style.background = liquidGrad(tube[i]); d.classList.add('filled'); }
      tubeEl.appendChild(d);
    }
    w.appendChild(stopper); w.appendChild(rim); w.appendChild(tubeEl);
    if (appendSpacer) { const sp = document.createElement('div'); sp.style.cssText = 'height:14px;margin-bottom:3px;'; w.appendChild(sp); }
    area.appendChild(w);
  });
}

function renderZenContent(area) {
  _renderSmallTubes(area, true);
  const isC = state.zenTube.length === ZEN_CAPACITY;
  const gW = document.createElement('div'); gW.className = 'zen-giant-wrapper'; if (isC) gW.classList.add('complete');
  gW.style.gridRow = '1 / 4'; gW.style.gridColumn = '3';
  gW.onclick = () => _clickHandler(GIANT_TUBE_IDX);

  const gS = document.createElement('div'); gS.className = 'zen-tube-stopper';
  if (isC) { const tc = state.zenTube[state.zenTube.length-1]; gS.style.background = `linear-gradient(to bottom,${tc}dd,${tc}aa)`; gS.style.boxShadow = '0 1px 3px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.25)'; gS.classList.add('visible'); }
  const gR = document.createElement('div'); gR.className = 'zen-tube-rim';
  const gT = document.createElement('div'); gT.className = 'zen-tube sand-tube';
  if (state.zenTube.length > 0) {
    const fill = document.createElement('div'); fill.className = 'sand-fill';
    fill.style.height = `${(state.zenTube.length/ZEN_CAPACITY)*100}%`;
    fill.style.background = buildSandGradient(state.zenTube);
    gT.appendChild(fill);
  }
  const pl = document.createElement('div'); pl.className = 'zen-progress-label'; pl.textContent = `${state.zenTube.length} / ${ZEN_CAPACITY}`;
  const nh = document.createElement('div'); nh.className = 'zen-next-hint';
  if (!isC) { nh.style.background = `${state.zenSequence[state.zenTube.length]}99`; nh.title = 'next colour needed'; } else { nh.style.opacity = '0'; }
  gW.appendChild(gS); gW.appendChild(gR); gW.appendChild(gT); gW.appendChild(pl); gW.appendChild(nh);
  area.appendChild(gW);
}

function renderSandContent(area) {
  _renderSmallTubes(area, false);
  const isC = state.sandTube.length === SAND_CAPACITY;
  const gW = document.createElement('div'); gW.className = 'zen-giant-wrapper sand-giant'; if (isC) gW.classList.add('complete');
  gW.style.gridRow = '1 / 4'; gW.style.gridColumn = '3';
  gW.onclick = () => _clickHandler(GIANT_TUBE_IDX);

  const gS = document.createElement('div'); gS.className = 'zen-tube-stopper';
  if (isC) { const tc = state.sandTube[state.sandTube.length-1]; gS.style.background = `linear-gradient(to bottom,${tc}dd,${tc}aa)`; gS.style.boxShadow = '0 1px 3px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.25)'; gS.classList.add('visible'); }
  const gR = document.createElement('div'); gR.className = 'zen-tube-rim';
  const gT = document.createElement('div'); gT.className = 'zen-tube sand-tube';
  if (state.sandTube.length > 0) {
    const fill = document.createElement('div'); fill.className = 'sand-fill';
    fill.style.height = `${(state.sandTube.length/SAND_CAPACITY)*100}%`;
    fill.style.background = buildSandGradient(state.sandTube);
    gT.appendChild(fill);
  }
  const pl = document.createElement('div'); pl.className = 'zen-progress-label'; pl.textContent = `${state.sandTube.length} / ${SAND_CAPACITY}`;
  const rainbowBar = document.createElement('div'); rainbowBar.className = 'sand-rainbow-bar';
  if (isC) rainbowBar.style.opacity = '0';
  gW.appendChild(gS); gW.appendChild(gR); gW.appendChild(gT); gW.appendChild(pl); gW.appendChild(rainbowBar);
  area.appendChild(gW);
}

// ─── Inline duplicates to avoid circular deps ─────────────────────
function _isTubeComplete(t) { return t.length===TUBE_CAPACITY && t.every(c=>c===t[0]); }

// Set by main.js after logic module is loaded
let _clickHandler = () => {};
export function setClickHandler(fn) { _clickHandler = fn; }
