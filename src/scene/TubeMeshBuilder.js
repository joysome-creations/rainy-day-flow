import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TUBE_CAPACITY, UNLOCK_MOVES } from '../constants.js';

const IS_MOBILE = navigator.maxTouchPoints > 0;

export const TUBE_H   = 1.44;
export const LAYER_H  = 0.34;
export const GIANT_H  = 3.60;
export const GIANT_CAP = 40;

// Layer 0 (bottom) sits at y = -TUBE_H/2 + margin + LAYER_H/2
function layerY(i) { return -TUBE_H / 2 + 0.05 + LAYER_H * (i + 0.5); }

// ─── Shared geometry cache ────────────────────────────────────────────────────
const _g = {};
const geo = (k, fn) => _g[k] || (_g[k] = fn());

// ─── Material factories ───────────────────────────────────────────────────────
export function makeGlassMat() {
  if (IS_MOBILE) {
    return new THREE.MeshStandardMaterial({
      color: 0xd4eaf5, transparent: true, opacity: 0.30,
      roughness: 0.05, side: THREE.FrontSide,
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: 0xd4eaf5, transmission: 0.88, ior: 1.45, roughness: 0.06,
    transparent: true, depthWrite: false, renderOrder: 2, side: THREE.FrontSide,
  });
}

export function makeRimMat() {
  return new THREE.MeshStandardMaterial({ color: 0xb0c8d4, roughness: 0.35, metalness: 0.15 });
}

export function makeLiquidMat(hex) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex), roughness: 0.25, transparent: true, opacity: 0.90,
  });
}

export function makeLockOverlayMat() {
  if (IS_MOBILE) {
    return new THREE.MeshStandardMaterial({ color: 0xb8d8f0, transparent: true, opacity: 0.38 });
  }
  return new THREE.MeshPhysicalMaterial({
    color: 0xb8d8f0, transmission: 0.50, transparent: true,
    opacity: 0.42, roughness: 0.10, depthWrite: false,
  });
}

// ─── Regular tube meshes ──────────────────────────────────────────────────────
export function buildTubeMeshes(tubeIdx) {
  const glass = new THREE.Mesh(
    geo('body',    () => new RoundedBoxGeometry(0.44, TUBE_H, 0.44, 4, 0.06)),
    makeGlassMat(),
  );
  glass.castShadow = true;
  glass.renderOrder = 2;
  glass.userData.tubeIndex = tubeIdx;

  const rim = new THREE.Mesh(
    geo('rim', () => new RoundedBoxGeometry(0.50, 0.06, 0.50, 4, 0.02)),
    makeRimMat(),
  );
  rim.position.y = TUBE_H / 2 + 0.03;
  rim.userData.tubeIndex = tubeIdx;

  const stopper = new THREE.Mesh(
    geo('stopper', () => new THREE.BoxGeometry(0.46, 0.10, 0.46)),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
  );
  stopper.position.y = TUBE_H / 2 + 0.08;
  stopper.renderOrder = 3;
  stopper.userData.tubeIndex = tubeIdx;

  const layers = Array.from({ length: TUBE_CAPACITY }, (_, i) => {
    const m = new THREE.Mesh(
      geo('layer', () => new THREE.BoxGeometry(0.36, LAYER_H, 0.36)),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0 }),
    );
    m.position.y = layerY(i);
    m.renderOrder = 1;
    m.userData.tubeIndex = tubeIdx;
    return m;
  });

  return { glass, rim, stopper, layers };
}

// ─── Lock overlay meshes ──────────────────────────────────────────────────────
export function buildLockMeshes(tubeIdx) {
  const overlay = new THREE.Mesh(
    geo('lockBody', () => new RoundedBoxGeometry(0.50, TUBE_H + 0.06, 0.50, 4, 0.06)),
    makeLockOverlayMat(),
  );
  overlay.renderOrder = 4;
  overlay.userData.tubeIndex = tubeIdx;

  const dotGeo = geo('dot', () => new THREE.SphereGeometry(0.055, 8, 6));
  const dots = Array.from({ length: UNLOCK_MOVES }, (_, i) => {
    const d = new THREE.Mesh(
      dotGeo,
      new THREE.MeshStandardMaterial({ color: 0x909090 }),
    );
    d.position.set((i - (UNLOCK_MOVES - 1) / 2) * 0.15, TUBE_H / 2 + 0.22, 0);
    d.userData.tubeIndex = tubeIdx;
    return d;
  });

  return { overlay, dots };
}

// ─── Giant tube meshes (Zen / Sand) ──────────────────────────────────────────
export function buildGiantTubeMeshes() {
  const glass = new THREE.Mesh(
    new RoundedBoxGeometry(0.52, GIANT_H + 0.08, 0.52, 4, 0.08),
    makeGlassMat(),
  );
  glass.castShadow = true;
  glass.renderOrder = 2;
  glass.userData.tubeIndex = 999;

  const rim = new THREE.Mesh(
    new RoundedBoxGeometry(0.58, 0.08, 0.58, 4, 0.02),
    makeRimMat(),
  );
  rim.position.y = GIANT_H / 2 + 0.04;
  rim.userData.tubeIndex = 999;

  const stopper = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.10, 0.48),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
  );
  stopper.position.y = GIANT_H / 2 + 0.10;
  stopper.renderOrder = 3;
  stopper.userData.tubeIndex = 999;

  const slotH = GIANT_H / GIANT_CAP;
  const slotGeo = new THREE.BoxGeometry(0.40, slotH - 0.005, 0.40);
  const slots = Array.from({ length: GIANT_CAP }, (_, i) => {
    const m = new THREE.Mesh(
      slotGeo,
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0 }),
    );
    m.position.y = -GIANT_H / 2 + (i + 0.5) * slotH;
    m.renderOrder = 1;
    m.userData.tubeIndex = 999;
    return m;
  });

  return { glass, rim, stopper, slots };
}
