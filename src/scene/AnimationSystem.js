import gsap from 'gsap';
import { markDirty } from './SceneManager.js';

const upd = { onUpdate: markDirty };

// ─── Per-tube animations ──────────────────────────────────────────────────────
export function animBounce(group) {
  const y0 = group.position.y;
  gsap.timeline(upd)
    .to(group.position, { y: y0 + 0.12, duration: 0.14, ease: 'power2.out' })
    .to(group.position, { y: y0 - 0.04, duration: 0.10, ease: 'power2.in' })
    .to(group.position, { y: y0,        duration: 0.18, ease: 'elastic.out(1, 0.4)' });
}

export function animShake(group) {
  const x0 = group.position.x;
  gsap.timeline(upd)
    .to(group.position, { x: x0 - 0.08, duration: 0.05 })
    .to(group.position, { x: x0 + 0.08, duration: 0.07 })
    .to(group.position, { x: x0 - 0.06, duration: 0.06 })
    .to(group.position, { x: x0 + 0.05, duration: 0.05 })
    .to(group.position, { x: x0,        duration: 0.05 });
}

export function animComplete(group) {
  const y0 = group.position.y;
  gsap.timeline(upd)
    .to(group.scale,    { x: 1.06, y: 1.06, z: 1.06, duration: 0.14, ease: 'power2.out' })
    .to(group.position, { y: y0 + 0.12,               duration: 0.14, ease: 'power2.out' }, '<')
    .to(group.scale,    { x: 1.00, y: 1.00, z: 1.00, duration: 0.28, ease: 'elastic.out(1, 0.5)' })
    .to(group.position, { y: y0,                       duration: 0.28, ease: 'elastic.out(1, 0.5)' }, '<');
}

export function animUnlock(group) {
  gsap.timeline(upd)
    .to(group.rotation, { y: -0.35, duration: 0.12, ease: 'power2.out' })
    .to(group.scale,    { x: 1.08, y: 1.08, z: 1.08, duration: 0.12, ease: 'power2.out' }, '<')
    .to(group.rotation, { y:  0.20, duration: 0.14, ease: 'power2.inOut' })
    .to(group.rotation, { y:  0.00, duration: 0.18, ease: 'elastic.out(1, 0.4)' })
    .to(group.scale,    { x: 1.00, y: 1.00, z: 1.00, duration: 0.28, ease: 'elastic.out(1, 0.4)' }, '<');
}

// ─── Gravity flip ─────────────────────────────────────────────────────────────
export function animGravityFlip(tubeGroups, onMidpoint, onDone) {
  const SHAKE = 0.42;
  const FADE  = 0.13;

  // 1 — shake all tubes
  const shakeTl = gsap.timeline(upd);
  tubeGroups.forEach(tg => {
    const x0 = tg.group.position.x;
    shakeTl.to(tg.group.position, {
      keyframes: [
        { x: x0 - 0.08 }, { x: x0 + 0.08 },
        { x: x0 - 0.07 }, { x: x0 + 0.06 },
        { x: x0 - 0.04 }, { x: x0 },
      ],
      duration: SHAKE,
      ease: 'none',
    }, 0);
  });

  shakeTl.call(() => {
    // 2 — fade liquid out
    const fadeTl = gsap.timeline(upd);
    tubeGroups.forEach(tg => {
      const meshes = tg.layers || tg.slots || [];
      meshes.forEach(m => {
        if (m.visible) fadeTl.to(m.material, { opacity: 0, duration: FADE }, 0);
      });
    });

    fadeTl.call(() => {
      // 3 — mutate state + sync 3D
      onMidpoint();

      // 4 — second shake + fade back in
      const shakeTl2 = gsap.timeline(upd);
      tubeGroups.forEach(tg => {
        const x0 = tg.group.position.x;
        shakeTl2.to(tg.group.position, {
          keyframes: [
            { x: x0 - 0.07 }, { x: x0 + 0.07 },
            { x: x0 - 0.05 }, { x: x0 + 0.04 },
            { x: x0 },
          ],
          duration: SHAKE,
          ease: 'none',
        }, 0);
      });

      tubeGroups.forEach(tg => {
        const meshes = tg.layers || tg.slots || [];
        meshes.forEach(m => {
          if (m.visible) gsap.fromTo(m.material, { opacity: 0 }, { ...upd, opacity: 0.90, duration: FADE });
        });
      });

      shakeTl2.call(() => onDone?.());
    });
  });
}
