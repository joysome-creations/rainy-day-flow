import * as THREE from 'three';

export const TUBE_SPACING_X = 0.56;
export const TUBE_SPACING_Z = 0.80;

let _gridCols = 4;
let _gridRows = 2;

export function setGrid(cols, rows) { _gridCols = cols; _gridRows = rows; }
export function getGrid() { return { cols: _gridCols, rows: _gridRows }; }

export function gridToWorld(col, row, gridCols, gridRows) {
  return new THREE.Vector3(
    (col - (gridCols - 1) / 2) * TUBE_SPACING_X,
    0,
    (row - (gridRows - 1) / 2) * TUBE_SPACING_Z,
  );
}

// Camera basis vectors at azimuth=PI/4, elevation=PI/10 (derived analytically)
const CAM_RIGHT = { x: -0.7071, y: 0, z: 0.7071 };
const CAM_UP    = { x: -0.2180, y: 0.9511, z: -0.2180 };

export function computeFrustum(camera, gridCols, gridRows, viewportW, viewportH) {
  const aspect = viewportW / viewportH;

  // Half-extents of bounding box enclosing the full board
  const hx = (gridCols - 1) / 2 * TUBE_SPACING_X + 0.50;
  const hy = 1.05;  // half tube height + selection lift buffer
  const hz = (gridRows - 1) / 2 * TUBE_SPACING_Z + 0.50;

  let maxR = 0, maxU = 0;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * hx, y = sy * hy, z = sz * hz;
    maxR = Math.max(maxR, Math.abs(CAM_RIGHT.x * x + CAM_RIGHT.z * z));
    maxU = Math.max(maxU, Math.abs(CAM_UP.x * x + CAM_UP.y * y + CAM_UP.z * z));
  }

  maxR += 0.20;
  maxU += 0.20;

  if (maxR / maxU > aspect) maxU = maxR / aspect;
  else                       maxR = maxU * aspect;

  camera.left   = -maxR;
  camera.right  =  maxR;
  camera.top    =  maxU;
  camera.bottom = -maxU;
  camera.updateProjectionMatrix();
}
