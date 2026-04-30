import * as THREE from 'three';
import gsap from 'gsap';
import { computeFrustum, setGrid } from './BoardLayout.js';

const AZIMUTH   = Math.PI / 4;   // 45° around Y
const ELEVATION = Math.PI / 10;  // ~18° above horizon
const D = 20;

let renderer, camera, scene;
export let needsRender = true;

const ambLight = new THREE.AmbientLight(0xfff8e7, 0.55);
const sunLight = new THREE.DirectionalLight(0xfff4d6, 1.10);
const rimLight = new THREE.DirectionalLight(0xd0eaff, 0.28);

let _tubeGroups = [];
let _allMeshes  = [];
let _gridCols   = 4;
let _gridRows   = 2;

export function markDirty() { needsRender = true; }

export function initScene(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();

  camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 500);
  camera.position.set(
    D * Math.cos(ELEVATION) * Math.sin(AZIMUTH),
    D * Math.sin(ELEVATION),
    D * Math.cos(ELEVATION) * Math.cos(AZIMUTH),
  );
  camera.lookAt(0, 0, 0);

  sunLight.position.set(-3, 8, 5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  rimLight.position.set(4, 3, -6);
  scene.add(ambLight, sunLight, rimLight);

  window.addEventListener('resize', _onResize);
  _onResize();

  gsap.ticker.add(() => {
    if (needsRender || gsap.globalTimeline.isActive()) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  });
  gsap.ticker.fps(60);
}

function _onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  computeFrustum(camera, _gridCols, _gridRows, w, h);
  markDirty();
}

export function getCamera()    { return camera; }
export function getRenderer()  { return renderer; }
export function getAllMeshes()  { return _allMeshes; }
export function getTubeGroups(){ return _tubeGroups; }

export function buildBoard(tubeGroups, gridCols, gridRows) {
  _tubeGroups.forEach(tg => scene.remove(tg.group));
  _tubeGroups = tubeGroups;
  _allMeshes  = tubeGroups.flatMap(tg => tg.getAllMeshes());
  _gridCols   = gridCols;
  _gridRows   = gridRows;
  setGrid(gridCols, gridRows);
  tubeGroups.forEach(tg => scene.add(tg.group));
  computeFrustum(camera, gridCols, gridRows, window.innerWidth, window.innerHeight);
  markDirty();
}

export function setNightMode(on) {
  if (on) {
    ambLight.color.set(0x1e2a40); ambLight.intensity = 0.50;
    sunLight.color.set(0x4060a0); sunLight.intensity = 0.65;
    rimLight.color.set(0x6090c0); rimLight.intensity = 0.40;
  } else {
    ambLight.color.set(0xfff8e7); ambLight.intensity = 0.55;
    sunLight.color.set(0xfff4d6); sunLight.intensity = 1.10;
    rimLight.color.set(0xd0eaff); rimLight.intensity = 0.28;
  }
  markDirty();
}
