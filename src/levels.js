import { TUBE_CAPACITY, GIANT_TUBE_IDX, ZEN_CAPACITY, SAND_CAPACITY, PALETTE } from './constants.js';
import { buildColorPalette, buildZenShades, shuffle } from './palette.js';
import * as state from './state.js';
import { setState, cloneTubes } from './state.js';
import { render } from './renderer.js';
import { setMsg, updateBestDisplay, updateRestartBtn, updateSOSBtn, stopConfetti, mascotIdle } from './ui.js';

export const LEVEL_CONFIGS = [
  {label:'Easy',  numColors:6,  numTubes:8,  numEmpty:8,  numRepeated:0, numLocked:0, gridCols:4},
  {label:'Medium',numColors:10, numTubes:12, numEmpty:8,  numRepeated:0, numLocked:0, gridCols:4},
  {label:'Hard',  numColors:8,  numTubes:12, numEmpty:8,  numRepeated:2, numLocked:0, gridCols:4},
  {label:'Frozen',numColors:9,  numTubes:15, numEmpty:12, numRepeated:3, numLocked:3, gridCols:5},
];

export function generateLevel(config, palette=null) {
  const { numColors, numTubes, numEmpty, numRepeated } = config;
  const emptyPerTube = new Array(numTubes).fill(0);
  for (let rem=numEmpty; rem>0; rem--) {
    const el = emptyPerTube.map((_,i)=>i).filter(i=>emptyPerTube[i]<TUBE_CAPACITY);
    emptyPerTube[el[Math.floor(Math.random()*el.length)]]++;
  }
  const cols = palette || shuffle([...PALETTE]).slice(0, numColors);
  const idxs = shuffle([...Array(cols.length).keys()]);
  const repeated = new Set(shuffle([...idxs]).slice(0, numRepeated));
  const items = [];
  for (const i of idxs) {
    const cnt = TUBE_CAPACITY * (repeated.has(i) ? 2 : 1);
    for (let j=0; j<cnt; j++) items.push(cols[i]);
  }
  shuffle(items); let cur = 0;
  return Array.from({length:numTubes}, (_,t) => {
    const fs = TUBE_CAPACITY - emptyPerTube[t];
    const tube = [];
    for (let s=0; s<fs; s++) tube.push(items[cur++]);
    return tube;
  });
}

export function chooseLockIndices(numTubes, numLocked, numCols) {
  const numRows = Math.ceil(numTubes/numCols), result = [];
  for (let row=0; row<numRows && result.length<numLocked; row++) {
    const start=row*numCols, end=Math.min(start+numCols,numTubes)-1, interior=[];
    for (let i=start+1; i<end; i++) interior.push(i);
    if (interior.length) result.push(interior[Math.floor(Math.random()*interior.length)]);
  }
  return result;
}

export function buildZenSequence(shades) {
  const seq = [];
  for (const col of shades) for (let j=0; j<TUBE_CAPACITY; j++) seq.push(col);
  return seq;
}

function _finishLoad({label, selectValue, expertNote='', hint='', gridCols=null}) {
  document.getElementById('move-count').textContent = 0;
  document.getElementById('level-label').textContent = label;
  document.getElementById('level-select').value = selectValue;
  document.getElementById('expert-note').textContent = expertNote;
  document.getElementById('level-hint').textContent = hint;
  if (gridCols) document.getElementById('tubes-area').style.gridTemplateColumns = `repeat(${gridCols}, auto)`;
  setMsg(''); updateBestDisplay(); stopConfetti(); mascotIdle(); render(); updateRestartBtn(); updateSOSBtn();
}

export function loadLevel(idx) {
  if (idx === 4) { loadZen(); return; }
  if (idx === 5) { loadGravity(); return; }
  if (idx === 6) { loadSand(); return; }
  const cfg = LEVEL_CONFIGS[idx];
  const palette = buildColorPalette(cfg.numColors, cfg.label);
  const initialTubes = generateLevel(cfg, palette);
  const li = chooseLockIndices(initialTubes.length, cfg.numLocked||0, cfg.gridCols);
  setState({
    zenMode: false, sandMode: false, gravityMode: false,
    currentLevel: idx,
    tubes: cloneTubes(initialTubes),
    initialTubes,
    selected: null, moves: 0, history: [], won: false, sosUsed: 0,
    initialLocked: new Set(li),
    lockedTubes: new Set(li),
    initialLockProgress: new Map(li.map(i=>[i,0])),
    lockProgress: new Map(li.map(i=>[i,0])),
  });
  _finishLoad({label:cfg.label, selectValue:idx, expertNote:idx===3?'4 neighbouring moves unlocks':'', gridCols:cfg.gridCols});
}

export function loadZen() {
  const baseHex = PALETTE[Math.floor(Math.random()*PALETTE.length)];
  const shades = buildZenShades(baseHex);
  const zenSequence = buildZenSequence(shades);
  const zenTube = [shades[0]];
  const pool = [];
  shades.forEach((col,i) => {
    const cnt = i===0 ? TUBE_CAPACITY-1 : TUBE_CAPACITY;
    for (let j=0; j<cnt; j++) pool.push(col);
  });
  shuffle(pool);
  const counts = new Array(GIANT_TUBE_IDX).fill(0);
  let rem = pool.length;
  while (rem > 0) {
    const el = counts.map((_,i)=>i).filter(i=>counts[i]<TUBE_CAPACITY);
    counts[el[Math.floor(Math.random()*el.length)]]++;
    rem--;
  }
  let cur = 0;
  const tubes = Array.from({length:GIANT_TUBE_IDX}, (_,t) => {
    const tube = [];
    for (let s=0; s<counts[t]; s++) tube.push(pool[cur++]);
    return tube;
  });
  setState({
    zenMode: true, sandMode: false, gravityMode: false,
    currentLevel: 4, selected: null, moves: 0, history: [], won: false, sosUsed: 0,
    lockedTubes: new Set(), initialLocked: new Set(),
    lockProgress: new Map(), initialLockProgress: new Map(),
    tubes, initialTubes: cloneTubes(tubes),
    zenTube, initialZenTube: [...zenTube],
    zenSequence, initialZenSequence: [...zenSequence],
  });
  _finishLoad({label:'Gradient', selectValue:4, hint:'fill with a gradient'});
}

export function loadGravity() {
  const cfg = {label:'Gravity', numColors:13, numTubes:15, numEmpty:8, numRepeated:0, gridCols:5};
  const palette = buildColorPalette(13, 'Gravity');
  const initialTubes = generateLevel(cfg, palette);
  setState({
    gravityMode: true, zenMode: false, sandMode: false,
    currentLevel: 5, selected: null, moves: 0, history: [], won: false, sosUsed: 0,
    movesSinceFlip: 0, gravityFlipping: false,
    lockedTubes: new Set(), initialLocked: new Set(),
    lockProgress: new Map(), initialLockProgress: new Map(),
    tubes: cloneTubes(initialTubes), initialTubes,
  });
  _finishLoad({label:'Gravity', selectValue:5, hint:'gravity flips every 4 moves', gridCols:cfg.gridCols});
}

export function loadSand() {
  const chosen = buildColorPalette(10, 'Sand Art');
  const pool = [];
  chosen.forEach(col => { for (let j=0; j<TUBE_CAPACITY; j++) pool.push(col); });
  const counts = new Array(GIANT_TUBE_IDX).fill(0);
  let rem = pool.length;
  while (rem > 0) {
    const el = counts.map((_,i)=>i).filter(i=>counts[i]<TUBE_CAPACITY);
    counts[el[Math.floor(Math.random()*el.length)]]++;
    rem--;
  }
  shuffle(pool); let cur = 0;
  const tubes = Array.from({length:GIANT_TUBE_IDX}, (_,t) => {
    const tube = [];
    for (let s=0; s<counts[t]; s++) tube.push(pool[cur++]);
    return tube;
  });
  setState({
    sandMode: true, zenMode: false, gravityMode: false,
    currentLevel: 6, selected: null, moves: 0, history: [], won: false, sosUsed: 0,
    lockedTubes: new Set(), initialLocked: new Set(),
    lockProgress: new Map(), initialLockProgress: new Map(),
    tubes, initialTubes: cloneTubes(tubes),
    sandTube: [], initialSandTube: [],
    sandColors: [...chosen],
  });
  _finishLoad({label:'Sand Art', selectValue:6, hint:'fill as you like'});
}

export function restartLevel() {
  const s = state;
  if (s.zenMode) {
    setState({ tubes: cloneTubes(s.initialTubes), zenTube: [...s.initialZenTube], zenSequence: [...s.initialZenSequence] });
  } else if (s.sandMode) {
    setState({ tubes: cloneTubes(s.initialTubes), sandTube: [...s.initialSandTube] });
  } else if (s.gravityMode) {
    setState({ tubes: cloneTubes(s.initialTubes), movesSinceFlip: 0, gravityFlipping: false });
    document.getElementById('tubes-area').classList.remove('gravity-hidden');
  } else {
    setState({
      tubes: cloneTubes(s.initialTubes),
      lockedTubes: new Set(s.initialLocked),
      lockProgress: new Map(s.initialLockProgress),
    });
  }
  setState({ selected: null, moves: 0, history: [], won: false, sosUsed: 0 });
  document.getElementById('move-count').textContent = 0;
  setMsg(''); stopConfetti(); mascotIdle(); render(); updateRestartBtn(); updateSOSBtn();
}
