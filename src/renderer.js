import { buildBoard, getTubeGroups, markDirty } from './scene/SceneManager.js';
import { TubeGroup, GiantTubeGroup } from './scene/TubeGroup.js';
import { gridToWorld } from './scene/BoardLayout.js';
import * as AnimationSystem from './scene/AnimationSystem.js';
import * as state from './state.js';
import { GIANT_TUBE_IDX, ZEN_CAPACITY, SAND_CAPACITY } from './constants.js';

let _gridCols = 4;

// ─── Board construction ───────────────────────────────────────────────────────
export function rebuildBoard(gridCols = _gridCols) {
  _gridCols = gridCols;

  if (state.zenMode || state.sandMode) {
    _buildZenSandBoard();
  } else {
    _buildNormalBoard(gridCols);
  }
}

function _buildNormalBoard(gridCols) {
  const total    = state.tubes.length;
  const gridRows = Math.ceil(total / gridCols);
  const groups   = state.tubes.map((_, i) => {
    const tg  = new TubeGroup(i);
    const pos = gridToWorld(i % gridCols, Math.floor(i / gridCols), gridCols, gridRows);
    tg.group.position.copy(pos);
    return tg;
  });
  buildBoard(groups, gridCols, gridRows);
}

function _buildZenSandBoard() {
  // 12 small tubes split left/right of the giant tube (3 rows × 5 cols, col 2 = giant)
  const positions = [
    [0,0],[0,1],[0,3],[0,4],
    [1,0],[1,1],[1,3],[1,4],
    [2,0],[2,1],[2,3],[2,4],
  ];
  const GC = 5, GR = 3;
  const groups = [];

  for (let i = 0; i < GIANT_TUBE_IDX; i++) {
    const tg  = new TubeGroup(i);
    const [row, col] = positions[i];
    tg.group.position.copy(gridToWorld(col, row, GC, GR));
    groups.push(tg);
  }

  const giant = new GiantTubeGroup();
  giant.group.position.copy(gridToWorld(2, 1, GC, GR));
  groups.push(giant);

  buildBoard(groups, GC, GR);
}

// ─── Sync state → 3D ─────────────────────────────────────────────────────────
export function render() {
  const groups = getTubeGroups();
  groups.forEach((tg, i) => {
    if (tg.isGiant) {
      tg.syncToState({
        tube:       state.zenMode ? state.zenTube : state.sandTube,
        isSelected: state.selected === GIANT_TUBE_IDX,
        capacity:   state.zenMode ? ZEN_CAPACITY : SAND_CAPACITY,
      });
    } else {
      tg.syncToState({
        tube:         state.tubes[i] || [],
        isSelected:   state.selected === i,
        isLocked:     state.lockedTubes.has(i),
        lockProgress: state.lockProgress.get(i) || 0,
      });
    }
  });
  markDirty();
}

// ─── Animation shim ───────────────────────────────────────────────────────────
export function animTube(idx, cls) {
  const groups = getTubeGroups();
  const tg = groups[idx];
  if (!tg) return;
  switch (cls) {
    case 'bounce':          AnimationSystem.animBounce(tg.group);   break;
    case 'shake':           AnimationSystem.animShake(tg.group);    break;
    case 'completing':      AnimationSystem.animComplete(tg.group); break;
    case 'unlocking':       AnimationSystem.animUnlock(tg.group);   break;
    case 'gravity-shaking': AnimationSystem.animShake(tg.group);    break;
  }
}
