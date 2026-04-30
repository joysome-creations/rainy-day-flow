import { initNightMode, toggleNightMode, updateSOSBtn, mascotSad, updateRestartBtn, setMsg, stopConfetti, mascotIdle, updateBestDisplay } from './ui.js';
import { toggleSound } from './audio.js';
import { loadLevel, restartLevel, LEVEL_CONFIGS } from './levels.js';
import { handleTubeClick } from './logic.js';
import { animTube, render, rebuildBoard } from './renderer.js';
import { setState, pushSnapshot } from './state.js';
import * as state from './state.js';
import { SOS_MAX } from './constants.js';
import { playPour, playSOS } from './audio.js';
import { initScene, getTubeGroups } from './scene/SceneManager.js';
import { initInteraction } from './scene/Interaction.js';
import { animShake } from './scene/AnimationSystem.js';

// ─── Init Three.js scene ──────────────────────────────────────────────────────
const canvas = document.getElementById('three-canvas');
initScene(canvas);
initInteraction(canvas, handleTubeClick);

// ─── Button handlers exposed to HTML onclick ──────────────────────────────────
window.loadLevel     = loadLevel;
window.toggleSound   = toggleSound;
window.toggleNightMode = toggleNightMode;

window.restartOrNew = function() {
  if (state.moves === 0 || state.won) loadLevel(state.currentLevel);
  else restartLevel();
};

window.undoMove = function() {
  if (!state.history.length) return;
  if (state.gravityFlipping) return;
  const snap = state.history.pop();
  setState({
    tubes: snap.tubes,
    lockedTubes: new Set(snap.locked),
    lockProgress: new Map(snap.progress),
    sosUsed: snap.sosUsed,
    moves: state.moves + 1,
    selected: null,
    won: false,
  });
  if (state.gravityMode) setState({ movesSinceFlip: snap.movesSinceFlip });
  if (state.zenMode)     setState({ zenTube: [...snap.zenTube] });
  if (state.sandMode)    setState({ sandTube: [...snap.sandTube] });
  document.getElementById('move-count').textContent = state.moves;
  setMsg(''); render(); updateRestartBtn(); updateSOSBtn();
};

window.triggerSOS = function() {
  if (state.won || state.sosUsed >= SOS_MAX || state.zenMode || state.sandMode) return;
  pushSnapshot();
  setState({ sosUsed: state.sosUsed + 1 });
  state.tubes.push([]);
  rebuildBoard();   // board gained a tube
  render();
  getTubeGroups().forEach(tg => animShake(tg.group));
  playSOS();
  mascotSad();
  updateSOSBtn();
};

// ─── Init ─────────────────────────────────────────────────────────────────────
initNightMode();
loadLevel(0);
