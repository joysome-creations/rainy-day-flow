export let tubes = [];
export let initialTubes = [];
export let selected = null;
export let moves = 0;
export let history = [];
export let currentLevel = 0;
export let won = false;

export let lockedTubes = new Set();
export let initialLocked = new Set();
export let lockProgress = new Map();
export let initialLockProgress = new Map();

export let zenMode = false;
export let zenTube = [];
export let zenSequence = [];
export let initialZenTube = [];
export let initialZenSequence = [];

export let sandMode = false;
export let sandTube = [];
export let initialSandTube = [];
export let sandColors = [];

export let gravityMode = false;
export let movesSinceFlip = 0;
export let gravityFlipping = false;

export let sosUsed = 0;

export let nightModeOn = false;

// Setters — modules mutate state through these instead of direct assignment
// (needed because ES modules bind exports by value for primitives)
export function setState(patch) {
  if ('tubes'            in patch) tubes            = patch.tubes;
  if ('initialTubes'     in patch) initialTubes     = patch.initialTubes;
  if ('selected'         in patch) selected         = patch.selected;
  if ('moves'            in patch) moves            = patch.moves;
  if ('history'          in patch) history          = patch.history;
  if ('currentLevel'     in patch) currentLevel     = patch.currentLevel;
  if ('won'              in patch) won              = patch.won;
  if ('lockedTubes'      in patch) lockedTubes      = patch.lockedTubes;
  if ('initialLocked'    in patch) initialLocked    = patch.initialLocked;
  if ('lockProgress'     in patch) lockProgress     = patch.lockProgress;
  if ('initialLockProgress' in patch) initialLockProgress = patch.initialLockProgress;
  if ('zenMode'          in patch) zenMode          = patch.zenMode;
  if ('zenTube'          in patch) zenTube          = patch.zenTube;
  if ('zenSequence'      in patch) zenSequence      = patch.zenSequence;
  if ('initialZenTube'   in patch) initialZenTube   = patch.initialZenTube;
  if ('initialZenSequence' in patch) initialZenSequence = patch.initialZenSequence;
  if ('sandMode'         in patch) sandMode         = patch.sandMode;
  if ('sandTube'         in patch) sandTube         = patch.sandTube;
  if ('initialSandTube'  in patch) initialSandTube  = patch.initialSandTube;
  if ('sandColors'       in patch) sandColors       = patch.sandColors;
  if ('gravityMode'      in patch) gravityMode      = patch.gravityMode;
  if ('movesSinceFlip'   in patch) movesSinceFlip   = patch.movesSinceFlip;
  if ('gravityFlipping'  in patch) gravityFlipping  = patch.gravityFlipping;
  if ('sosUsed'          in patch) sosUsed          = patch.sosUsed;
  if ('nightModeOn'      in patch) nightModeOn      = patch.nightModeOn;
}

export const cloneTubes = t => t.map(tube => [...tube]);

export function makeSnapshot() {
  return {
    tubes: cloneTubes(tubes),
    locked: new Set(lockedTubes),
    progress: new Map(lockProgress),
    movesSinceFlip,
    zenTube: [...zenTube],
    sandTube: [...sandTube],
    sosUsed,
  };
}

export function pushSnapshot() {
  history.push(makeSnapshot());
  if (history.length > 150) history.shift();
}
