// render.js — draws one panel of a scene onto its canvas: the painted scene itself, the ring
// markers on differences already found, the expanding pulse of a hint, the red X of a fresh miss,
// and the burst particles of a fresh find. The game state lives in game.js; this file only draws.

import { SCENE_W, SCENE_H } from './scenes.js';

/** The set of difference ids the altered panel must apply: every diff of the scene. */
export function changedSet(scene) {
  return new Set(scene.diffs.map((d) => d.id));
}

const EMPTY = new Set();

/**
 * Draw a complete panel.
 * opts: { changed:boolean, found:Set, hintId:string|null, hintT:number, misses:[{x,y,age}],
 *         pops:[{x,y,age}], now:number }
 * hintT is 0..1 progress of the hint pulse; ages are seconds since the event.
 */
export function drawPanel(canvas, scene, opts) {
  const ctx = canvas.getContext('2d');
  const scale = canvas.width / SCENE_W;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, SCENE_W, SCENE_H);
  scene.paint(ctx, opts.changed ? changedSet(scene) : EMPTY);

  // Found markers: a double ring with a soft glow, gently breathing.
  for (const diff of scene.diffs) {
    if (!opts.found.has(diff.id)) continue;
    const breathe = 1 + Math.sin(opts.now / 340 + diff.x) * 0.03;
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, diff.r * 0.62 * breathe, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(20, 160, 90, 0.95)';
    ctx.lineWidth = 5;
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, diff.r * 0.62 * breathe - 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Hint pulse: three expanding rings around the hinted difference.
  if (opts.hintId) {
    const diff = scene.diffs.find((d) => d.id === opts.hintId);
    if (diff) {
      for (let ring = 0; ring < 3; ring += 1) {
        const t = (opts.hintT + ring / 3) % 1;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, 8 + t * diff.r * 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 190, 40, ${0.85 * (1 - t)})`;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
  }

  // Miss marks: a red X that fades over 0.6 s.
  for (const miss of opts.misses) {
    const alpha = Math.max(0, 1 - miss.age / 0.6);
    const s = 11;
    ctx.strokeStyle = `rgba(224, 49, 49, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(miss.x - s, miss.y - s);
    ctx.lineTo(miss.x + s, miss.y + s);
    ctx.moveTo(miss.x + s, miss.y - s);
    ctx.lineTo(miss.x - s, miss.y + s);
    ctx.stroke();
  }

  // Find pops: small dots bursting outward from a fresh find, plus one expanding ring flash,
  // and a floating score label that rises and fades.
  for (const pop of opts.pops) {
    const t = pop.age / 0.55;
    if (t >= 1) continue;
    ctx.beginPath();
    ctx.arc(pop.x, pop.y, 6 + t * 30, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 190, 40, ${0.7 * (1 - t)})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2 + pop.seed;
      const dist = 10 + t * 34;
      ctx.beginPath();
      ctx.arc(pop.x + Math.cos(a) * dist, pop.y + Math.sin(a) * dist, 3.2 * (1 - t) + 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 190, 40, ${1 - t})`;
      ctx.fill();
    }
    if (pop.text) {
      ctx.font = 'bold 17px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(27, 120, 66, ${1 - t})`;
      ctx.fillText(pop.text, pop.x, pop.y - 16 - t * 22);
    }
  }
}
