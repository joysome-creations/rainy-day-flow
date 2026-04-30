import * as THREE from 'three';
import { TUBE_CAPACITY, GIANT_TUBE_IDX } from '../constants.js';
import {
  buildTubeMeshes, buildLockMeshes, buildGiantTubeMeshes,
  TUBE_H, GIANT_CAP,
} from './TubeMeshBuilder.js';

const SELECT_LIFT = 0.22;

// ─── Regular tube ─────────────────────────────────────────────────────────────
export class TubeGroup {
  constructor(idx) {
    this.idx     = idx;
    this.isGiant = false;
    this.group   = new THREE.Group();
    this.group.userData.tubeIndex = idx;

    const { glass, rim, stopper, layers } = buildTubeMeshes(idx);
    this.glass   = glass;
    this.rim     = rim;
    this.stopper = stopper;
    this.layers  = layers;
    this.group.add(glass, rim, stopper, ...layers);

    this.lockOverlay = null;
    this.lockDots    = null;
  }

  syncToState({ tube, isSelected, isLocked, lockProgress }) {
    this.group.position.y = isSelected ? SELECT_LIFT : 0;

    if (this.glass.material.emissive) {
      this.glass.material.emissive.set(isSelected ? 0x5f918e : 0x000000);
      this.glass.material.emissiveIntensity = isSelected ? 0.18 : 0;
    }

    const isFull = tube.length === TUBE_CAPACITY && tube.every(c => c === tube[0]);
    this.layers.forEach((m, i) => {
      const col = tube[i];
      if (col) { m.material.color.set(col); m.material.opacity = 0.90; m.visible = true; }
      else      { m.visible = false; }
    });

    if (isFull && tube[0]) {
      this.stopper.material.color.set(tube[0]);
      this.stopper.material.opacity = 0.92;
    } else {
      this.stopper.material.opacity = 0;
    }

    if (isLocked) {
      this._ensureLock();
      this.lockOverlay.visible = true;
      this.lockDots.forEach((d, i) => {
        d.material.color.set(i < lockProgress ? 0xffd080 : 0x909090);
        d.visible = true;
      });
    } else if (this.lockOverlay) {
      this.lockOverlay.visible = false;
      this.lockDots.forEach(d => { d.visible = false; });
    }
  }

  _ensureLock() {
    if (this.lockOverlay) return;
    const { overlay, dots } = buildLockMeshes(this.idx);
    this.lockOverlay = overlay;
    this.lockDots    = dots;
    this.group.add(overlay, ...dots);
  }

  getAllMeshes() {
    const ms = [this.glass, this.rim, this.stopper, ...this.layers];
    if (this.lockOverlay) ms.push(this.lockOverlay, ...this.lockDots);
    return ms;
  }
}

// ─── Giant tube (Zen / Sand) ──────────────────────────────────────────────────
export class GiantTubeGroup {
  constructor() {
    this.idx     = GIANT_TUBE_IDX;
    this.isGiant = true;
    this.group   = new THREE.Group();
    this.group.userData.tubeIndex = GIANT_TUBE_IDX;

    const { glass, rim, stopper, slots } = buildGiantTubeMeshes();
    this.glass   = glass;
    this.rim     = rim;
    this.stopper = stopper;
    this.slots   = slots;
    this.group.add(glass, rim, stopper, ...slots);
  }

  syncToState({ tube, isSelected, capacity }) {
    this.group.position.y = isSelected ? SELECT_LIFT * 0.5 : 0;

    if (this.glass.material.emissive) {
      this.glass.material.emissive.set(isSelected ? 0x5f918e : 0x000000);
      this.glass.material.emissiveIntensity = isSelected ? 0.18 : 0;
    }

    this.slots.forEach((m, i) => {
      const col = tube[i];
      if (col) { m.material.color.set(col); m.material.opacity = 0.88; m.visible = true; }
      else      { m.visible = false; }
    });

    const isFull = tube.length >= capacity;
    if (isFull && tube.length > 0) {
      this.stopper.material.color.set(tube[tube.length - 1]);
      this.stopper.material.opacity = 0.92;
    } else {
      this.stopper.material.opacity = 0;
    }
  }

  getAllMeshes() {
    return [this.glass, this.rim, this.stopper, ...this.slots];
  }
}
