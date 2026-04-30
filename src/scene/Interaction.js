import * as THREE from 'three';
import { getCamera, getAllMeshes } from './SceneManager.js';

const _raycaster = new THREE.Raycaster();
const _pointer   = new THREE.Vector2();

let _clickHandler = null;
let _hoverIdx     = null;

export function initInteraction(canvas, clickHandler) {
  _clickHandler = clickHandler;
  canvas.addEventListener('pointerdown', e => _onPointer(e, true));
  canvas.addEventListener('pointermove', e => _onPointer(e, false));
}

function _onPointer(event, isClick) {
  const rect = event.currentTarget.getBoundingClientRect();
  _pointer.x =  ((event.clientX - rect.left) / rect.width)  * 2 - 1;
  _pointer.y = -((event.clientY - rect.top)  / rect.height) * 2 + 1;

  _raycaster.setFromCamera(_pointer, getCamera());
  const hits = _raycaster.intersectObjects(getAllMeshes(), false);
  const idx  = hits.length ? hits[0].object.userData.tubeIndex : undefined;

  if (isClick) {
    if (idx !== undefined) _clickHandler?.(idx);
  }
}
