// scenes.js — the three Second Look scenes: "Coral Café Terrace", "Lantern Row Night Market" and
// "The Attic Observatory". Every scene is painted procedurally on a 600x450 canvas from the same
// code for both panels: paint(ctx, changed) draws the original when `changed` is an empty set and
// the altered picture when it holds difference ids. Each scene's `diffs` list is the data the game
// hit-tests against: { id, x, y, r, kind, label } in scene coordinates.

export const SCENE_W = 600;
export const SCENE_H = 450;

/** Deterministic pseudo-random generator, so both panels (and every replay) agree exactly. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, fill) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function poly(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function stroke(ctx, points, color, width) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function line(ctx, x1, y1, x2, y2, color, width) {
  stroke(ctx, [[x1, y1], [x2, y2]], color, width);
}

function cloud(ctx, x, y, s, color) {
  ellipse(ctx, x, y, 34 * s, 15 * s, color);
  ellipse(ctx, x - 22 * s, y + 4 * s, 22 * s, 11 * s, color);
  ellipse(ctx, x + 24 * s, y + 4 * s, 24 * s, 12 * s, color);
  ellipse(ctx, x + 2 * s, y - 9 * s, 22 * s, 13 * s, color);
}

function gull(ctx, x, y, s, color) {
  ctx.beginPath();
  ctx.arc(x - 7 * s, y, 7 * s, Math.PI * 1.15, Math.PI * 1.95);
  ctx.arc(x + 7 * s, y, 7 * s, Math.PI * 1.05, Math.PI * 1.85);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function star4(ctx, x, y, r, color) {
  poly(ctx, [[x, y - r], [x + r * 0.22, y - r * 0.22], [x + r, y], [x + r * 0.22, y + r * 0.22],
    [x, y + r], [x - r * 0.22, y + r * 0.22], [x - r, y], [x - r * 0.22, y - r * 0.22]], color);
}

function stars(ctx, seed, count, maxY, area) {
  const rand = rng(seed);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < count; i += 1) {
    const x = rand() * SCENE_W;
    const y = rand() * maxY;
    if (area && (x < area[0] || x > area[2] || y < area[1] || y > area[3])) continue;
    ctx.globalAlpha = 0.35 + rand() * 0.6;
    ctx.fillRect(x, y, rand() < 0.2 ? 2.4 : 1.5, rand() < 0.2 ? 2.4 : 1.5);
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------------ scene 1: café terrace */

function paintCafe(ctx, changed) {
  // Sky and sea.
  const sky = ctx.createLinearGradient(0, 0, 0, 260);
  sky.addColorStop(0, '#8fd8f2');
  sky.addColorStop(1, '#e8f9fd');
  rect(ctx, 0, 0, 600, 260, sky);
  rect(ctx, 0, 168, 600, 92, '#2ea8bf');
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 9; i += 1) ctx.fillRect(18 + i * 66, 186 + (i % 3) * 22, 30, 3);
  rect(ctx, 0, 252, 600, 52, '#f6ddab');
  // Wooden deck.
  rect(ctx, 0, 304, 600, 146, '#dfa45e');
  ctx.strokeStyle = 'rgba(146,90,32,0.45)';
  ctx.lineWidth = 2;
  for (let y = 330; y < 450; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke(); }
  for (let x = 44; x < 600; x += 88) { ctx.beginPath(); ctx.moveTo(x, 304); ctx.lineTo(x - 14, 450); ctx.stroke(); }

  // Sun — difference "sun": smaller in the changed panel.
  const sunR = changed.has('sun') ? 21 : 30;
  ctx.strokeStyle = '#ffb703';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    line(ctx, 80 + Math.cos(a) * (sunR + 5), 66 + Math.sin(a) * (sunR + 5),
      80 + Math.cos(a) * (sunR + 15), 66 + Math.sin(a) * (sunR + 15), '#ffb703', 4);
  }
  circle(ctx, 80, 66, sunR, '#ffd23f');
  circle(ctx, 80, 66, sunR * 0.72, '#ffdf6b');

  cloud(ctx, 252, 50, 1, '#ffffff');
  cloud(ctx, 428, 34, 0.7, '#ffffff');
  gull(ctx, 285, 92, 1, '#4a6b7a');
  gull(ctx, 332, 112, 0.8, '#4a6b7a');
  gull(ctx, 236, 118, 0.7, '#4a6b7a');

  // Far sailboat (never changes).
  poly(ctx, [[92, 226], [128, 226], [120, 238], [98, 238]], '#8a5a2b');
  line(ctx, 110, 226, 110, 188, '#6b4423', 3);
  poly(ctx, [[112, 190], [112, 222], [130, 222]], '#ffffff');
  poly(ctx, [[108, 196], [108, 222], [94, 222]], '#ffe9a8');

  // Near sailboat — difference "sail": its sail is gone in the changed panel.
  poly(ctx, [[296, 214], [348, 214], [338, 228], [304, 228]], '#a83232');
  line(ctx, 322, 214, 322, 158, '#6b4423', 3);
  if (!changed.has('sail')) {
    poly(ctx, [[325, 162], [325, 208], [348, 208]], '#ffffff');
    poly(ctx, [[319, 170], [319, 208], [300, 208]], '#ffd166');
  }

  // Café building on the right.
  rect(ctx, 415, 118, 185, 216, '#fff3dd');
  poly(ctx, [[402, 122], [612, 122], [580, 92], [432, 92]], '#e4572e');
  circle(ctx, 507, 152, 24, '#ffffff');
  ctx.fillStyle = '#e4572e';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAFÉ', 507, 150);
  ctx.font = 'bold 10px Georgia, serif';
  ctx.fillText('LUMA', 507, 164);
  // Awning — difference "awning": six stripes become five.
  const stripes = changed.has('awning') ? 5 : 6;
  const awnX = 428;
  const awnW = 160;
  for (let i = 0; i < stripes; i += 1) {
    const x0 = awnX + (awnW / stripes) * i;
    const x1 = awnX + (awnW / stripes) * (i + 1);
    poly(ctx, [[x0, 180], [x1, 180], [x1 - 4, 206], [x0 - 4, 206]], i % 2 ? '#fff6e8' : '#ff6f61');
  }
  // Window with a flower box.
  roundRect(ctx, 452, 216, 106, 76, 6, '#7fb6c9');
  line(ctx, 505, 216, 505, 292, '#fff3dd', 5);
  line(ctx, 452, 254, 558, 254, '#fff3dd', 5);
  roundRect(ctx, 446, 292, 118, 14, 5, '#b5542c');
  circle(ctx, 466, 290, 7, '#ef476f');
  circle(ctx, 505, 286, 8, '#ffd166');
  circle(ctx, 544, 290, 7, '#ef476f');
  // Door.
  roundRect(ctx, 540, 240, 44, 94, 6, '#2a9d8f');
  circle(ctx, 550, 290, 3.5, '#ffd166');

  // Parasol — difference "umbrella": coral becomes gold.
  line(ctx, 170, 322, 170, 192, '#8a5a2b', 5);
  const canopy = changed.has('umbrella') ? '#ffc53d' : '#ff6f61';
  ctx.beginPath();
  ctx.arc(170, 200, 78, Math.PI, 0);
  for (let i = 0; i < 6; i += 1) {
    const x = 92 + i * 26;
    ctx.arc(x + 13, 200, 13, 0, Math.PI);
  }
  ctx.closePath();
  ctx.fillStyle = canopy;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(170, 200, 78, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();
  line(ctx, 170, 122, 170, 106, '#8a5a2b', 4);
  circle(ctx, 170, 104, 5, '#e4572e');

  // Table, chairs and cups — difference "cup": a third cup appears in the changed panel.
  ellipse(ctx, 170, 324, 52, 12, '#ffffff');
  ellipse(ctx, 170, 322, 52, 12, '#fdfdfd');
  rect(ctx, 166, 324, 8, 34, '#9aa5ad');
  ellipse(ctx, 170, 360, 26, 6, 'rgba(0,0,0,0.15)');
  const cup = (x, y) => {
    roundRect(ctx, x - 9, y - 7, 18, 13, 3, '#ffffff');
    ctx.beginPath();
    ctx.arc(x + 12, y - 1, 5, -1.2, 1.2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    rect(ctx, x - 9, y - 7, 18, 4, '#c97b4a');
  };
  cup(148, 314);
  cup(194, 316);
  if (changed.has('cup')) cup(171, 306);
  // Chairs: a backrest, a seat and two legs each, angled toward the table.
  const chair = (x, flip) => {
    ctx.save();
    ctx.translate(x, 0);
    ctx.scale(flip, 1);
    roundRect(ctx, -6, 292, 10, 42, 4, '#2a9d8f');
    roundRect(ctx, -14, 330, 30, 9, 4, '#238276');
    rect(ctx, -10, 339, 6, 22, '#238276');
    rect(ctx, 8, 339, 6, 22, '#238276');
    ctx.restore();
  };
  chair(102, 1);
  chair(238, -1);

  // A potted plant and the menu board finish the terrace.
  roundRect(ctx, 356, 356, 40, 34, 5, '#b5542c');
  circle(ctx, 376, 344, 20, '#3d9970');
  circle(ctx, 360, 352, 13, '#46aa7c');
  circle(ctx, 392, 352, 13, '#46aa7c');
  roundRect(ctx, 36, 330, 56, 66, 5, '#5b4636');
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.fillText('MENU', 64, 352);
  ctx.fillStyle = '#ffffff';
  ctx.font = '9px Georgia, serif';
  ctx.fillText('soleil', 64, 368);
  ctx.fillText('sorbet', 64, 380);
}

/* ---------------------------------------------------------- scene 2: lantern row night market */

function paintMarket(ctx, changed) {
  const sky = ctx.createLinearGradient(0, 0, 0, 340);
  sky.addColorStop(0, '#171d38');
  sky.addColorStop(1, '#3a3f6b');
  rect(ctx, 0, 0, 600, 340, sky);
  stars(ctx, 7, 80, 260, null);
  // Ground.
  rect(ctx, 0, 330, 600, 120, '#2c2f4a');
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  const rand = rng(21);
  for (let i = 0; i < 26; i += 1) ellipse(ctx, rand() * 600, 344 + rand() * 96, 22, 6, 'rgba(255,255,255,0.05)');

  // Moon — difference "moon": full moon becomes a crescent.
  circle(ctx, 505, 68, 30, '#f4f1de');
  circle(ctx, 494, 60, 6, '#ddd8c2');
  circle(ctx, 514, 78, 4.5, '#ddd8c2');
  if (changed.has('moon')) circle(ctx, 518, 58, 26, '#1d2340');

  // Bright sparkle star — difference "star": gone in the changed panel.
  if (!changed.has('star')) {
    star4(ctx, 88, 108, 15, '#ffe66d');
    circle(ctx, 88, 108, 3, '#ffffff');
  }

  // String lights across the top; one bulb (the 4th) is the "bulbs" difference.
  const bulbColors = ['#ffd166', '#ff8fa3', '#8ce8ff', '#ffd166', '#b8f26d', '#ff8fa3'];
  const wire = (x0, y0, cx, cy, x1, y1) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
    const pts = [];
    for (let i = 1; i <= 6; i += 1) {
      const t = i / 7;
      const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
      pts.push([x, y]);
    }
    return pts;
  };
  const bulbsA = wire(0, 26, 150, 84, 300, 60);
  const bulbsB = wire(300, 60, 450, 92, 600, 22);
  const allBulbs = [...bulbsA, ...bulbsB];
  allBulbs.forEach(([x, y], i) => {
    if (changed.has('bulbs') && i === 3) return;
    circle(ctx, x, y + 9, 10, 'rgba(255,209,102,0.18)');
    circle(ctx, x, y + 8, 4.6, bulbColors[i % bulbColors.length]);
    line(ctx, x, y, x, y + 4, 'rgba(0,0,0,0.6)', 2);
  });

  const stall = (x, w, canopyColor) => {
    rect(ctx, x + 6, 168, 8, 168, '#4a3428');
    rect(ctx, x + w - 14, 168, 8, 168, '#4a3428');
    poly(ctx, [[x - 8, 172], [x + w + 8, 172], [x + w - 10, 138], [x + 10, 138]], canopyColor);
    rect(ctx, x, 292, w, 44, '#5d4030');
    rect(ctx, x, 292, w, 8, '#77563c');
  };

  // Left stall: spice jars on a shelf — difference "jars": the middle jar is gone.
  stall(30, 180, '#7a4f9e');
  rect(ctx, 44, 226, 152, 8, '#77563c');
  const jar = (x, color) => {
    roundRect(ctx, x - 13, 196, 26, 32, 5, color);
    rect(ctx, x - 9, 188, 18, 9, '#d9c9a3');
  };
  jar(66, '#e4572e');
  if (!changed.has('jars')) jar(105, '#f2c14e');
  jar(144, '#3d9970');
  ellipse(ctx, 76, 316, 20, 14, '#c73e54');
  ellipse(ctx, 118, 318, 22, 15, '#e88ca0');
  ellipse(ctx, 162, 316, 20, 14, '#8e6cc8');

  // Centre stall: the big lantern — difference "lantern": red becomes blue.
  stall(225, 150, '#c73e54');
  line(ctx, 300, 168, 300, 178, '#d9c9a3', 3);
  const lampColor = changed.has('lantern') ? '#3f7fbf' : '#d64541';
  ellipse(ctx, 300, 202, 26, 30, lampColor);
  ellipse(ctx, 300, 202, 26, 30, 'rgba(255,220,130,0.25)');
  ctx.strokeStyle = '#d9c9a3';
  ctx.lineWidth = 2.5;
  for (const dy of [-16, 0, 16]) {
    ctx.beginPath();
    ctx.ellipse(300, 202 + dy, 25, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  rect(ctx, 288, 168, 24, 8, '#d9c9a3');
  roundRect(ctx, 246, 250, 108, 30, 6, '#241f31');
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('LANTERN ROW', 300, 270);
  ellipse(ctx, 262, 318, 18, 13, '#f2c14e');
  ellipse(ctx, 300, 320, 18, 13, '#e4572e');
  ellipse(ctx, 338, 318, 18, 13, '#f2c14e');

  // Right stall: pennant garland and fruit crates.
  stall(390, 180, '#2a9d8f');
  const flags = changed.has('pennant') ? 4 : 5;
  for (let i = 0; i < flags; i += 1) {
    const x = 408 + i * (148 / flags) + 6;
    const colors = ['#ffd166', '#ff8fa3', '#8ce8ff', '#b8f26d', '#e88ca0'];
    poly(ctx, [[x, 184], [x + 20, 184], [x + 10, 204]], colors[i % colors.length]);
  }
  line(ctx, 402, 184, 566, 184, 'rgba(0,0,0,0.5)', 2);
  const crate = (x, y, fruit, leaf) => {
    roundRect(ctx, x, y, 74, 40, 4, '#8a5a2b');
    rect(ctx, x, y + 12, 74, 5, '#6f4520');
    for (let i = 0; i < 4; i += 1) circle(ctx, x + 12 + i * 17, y + 2, 9, fruit);
    ellipse(ctx, x + 20, y - 8, 7, 4, leaf);
  };
  crate(404, 306, '#e63946', '#3d9970');
  crate(492, 306, '#f4a261', '#3d9970');
  crate(448, 262, '#a7c957', '#3d9970');

  // The market cat — difference "cat": charcoal becomes ginger.
  const catColor = changed.has('cat') ? '#e08a3c' : '#33313d';
  ellipse(ctx, 180, 386, 30, 20, catColor);
  circle(ctx, 180, 356, 16, catColor);
  poly(ctx, [[168, 346], [164, 330], [178, 340]], catColor);
  poly(ctx, [[192, 346], [196, 330], [182, 340]], catColor);
  ctx.beginPath();
  ctx.arc(214, 392, 16, Math.PI * 0.9, Math.PI * 1.9);
  ctx.strokeStyle = catColor;
  ctx.lineWidth = 7;
  ctx.stroke();
  circle(ctx, 174, 354, 2.4, '#ffd166');
  circle(ctx, 186, 354, 2.4, '#ffd166');
}

/* ------------------------------------------------------------- scene 3: the attic observatory */

function paintAttic(ctx, changed) {
  const wall = ctx.createLinearGradient(0, 0, 0, 450);
  wall.addColorStop(0, '#4a3428');
  wall.addColorStop(1, '#5d4232');
  rect(ctx, 0, 0, 600, 450, wall);
  // Floor.
  rect(ctx, 0, 350, 600, 100, '#6b4a30');
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  for (let x = 30; x < 600; x += 62) { ctx.beginPath(); ctx.moveTo(x, 350); ctx.lineTo(x - 18, 450); ctx.stroke(); }
  line(ctx, 0, 350, 600, 350, 'rgba(0,0,0,0.4)', 3);
  // Roof beams.
  poly(ctx, [[0, 96], [300, -6], [300, 26], [0, 128]], '#3a271c');
  poly(ctx, [[600, 96], [300, -6], [300, 26], [600, 128]], '#3a271c');
  rect(ctx, 0, 128, 600, 10, '#3a271c');

  // The owl on the left beam — difference "owl": gone in the changed panel.
  if (!changed.has('owl')) {
    ellipse(ctx, 92, 66, 15, 19, '#8a6d4f');
    circle(ctx, 92, 48, 12, '#a5855f');
    circle(ctx, 87, 47, 4.6, '#f4ead8');
    circle(ctx, 97, 47, 4.6, '#f4ead8');
    circle(ctx, 87, 47, 2.2, '#241a12');
    circle(ctx, 97, 47, 2.2, '#241a12');
    poly(ctx, [[89, 52], [95, 52], [92, 57]], '#e8a33d');
  }

  // Hanging bulb — difference "bulb": the bulb is bigger in the changed panel.
  line(ctx, 170, 44, 170, 82, '#241a12', 3);
  const bulbR = changed.has('bulb') ? 18 : 12;
  circle(ctx, 170, 84 + bulbR, bulbR + 7, 'rgba(255,214,120,0.16)');
  circle(ctx, 170, 84 + bulbR, bulbR, '#ffd98a');
  circle(ctx, 170, 84 + bulbR, bulbR * 0.45, '#fff3cf');

  // Round window with the night sky.
  circle(ctx, 300, 118, 84, '#2c1e14');
  ctx.save();
  ctx.beginPath();
  ctx.arc(300, 118, 76, 0, Math.PI * 2);
  ctx.clip();
  const night = ctx.createLinearGradient(0, 42, 0, 194);
  night.addColorStop(0, '#141b3d');
  night.addColorStop(1, '#2c3a6e');
  rect(ctx, 224, 42, 152, 152, night);
  stars(ctx, 42, 40, 180, [230, 48, 370, 188]);
  // Planet — difference "planet": coral becomes green.
  circle(ctx, 352, 86, 16, changed.has('planet') ? '#57cc7a' : '#ff8c69');
  ellipse(ctx, 352, 86, 26, 6, 'rgba(255,255,255,0.35)');
  circle(ctx, 258, 152, 11, '#e8e4d8');
  circle(ctx, 262, 148, 9, '#141b3d');
  ctx.restore();
  line(ctx, 300, 42, 300, 194, '#2c1e14', 6);
  line(ctx, 224, 118, 376, 118, '#2c1e14', 6);

  // Bookshelf with six books on the middle shelf — difference "books": one is gone.
  rect(ctx, 28, 148, 122, 186, '#3a271c');
  rect(ctx, 36, 156, 106, 170, '#54382a');
  for (const shelfY of [218, 274, 330]) rect(ctx, 36, shelfY, 106, 7, '#3a271c');
  const bookCols = ['#c73e54', '#2a9d8f', '#f2c14e', '#7a4f9e', '#e4572e', '#3f7fbf'];
  bookCols.forEach((color, i) => {
    if (changed.has('books') && i === 3) return;
    const x = 44 + i * 16.5;
    rect(ctx, x, 182 - (i % 3) * 4, 13, 36 + (i % 3) * 4, color);
    rect(ctx, x, 190 - (i % 3) * 4, 13, 3, 'rgba(255,255,255,0.5)');
  });
  for (let i = 0; i < 5; i += 1) rect(ctx, 44 + i * 19, 240, 14, 34, bookCols[(i + 2) % 6]);
  for (let i = 0; i < 4; i += 1) rect(ctx, 46 + i * 22, 296, 16, 34, bookCols[(i + 4) % 6]);
  circle(ctx, 128, 204, 9, '#d9c9a3');
  ctx.fillStyle = '#3a271c';
  ctx.font = 'bold 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('IX', 128, 208);

  // Telescope — difference "telescope": the tube points lower in the changed panel.
  line(ctx, 215, 300, 196, 348, '#2c2c34', 7);
  line(ctx, 215, 300, 236, 348, '#2c2c34', 7);
  line(ctx, 215, 300, 215, 348, '#2c2c34', 7);
  circle(ctx, 215, 298, 9, '#454552');
  const tip = changed.has('telescope') ? [302, 222] : [288, 178];
  const tubeGrad = ctx.createLinearGradient(215, 290, tip[0], tip[1]);
  tubeGrad.addColorStop(0, '#c9a227');
  tubeGrad.addColorStop(1, '#8a6d1f');
  ctx.beginPath();
  ctx.moveTo(215, 290);
  ctx.lineTo(tip[0], tip[1]);
  ctx.strokeStyle = tubeGrad;
  ctx.lineWidth = 17;
  ctx.lineCap = 'round';
  ctx.stroke();
  line(ctx, 215, 290, tip[0], tip[1], 'rgba(255,255,255,0.35)', 4);
  circle(ctx, tip[0], tip[1], 10, '#2c2c34');

  // Star chart on the right wall — difference "chart": its brightest star is gone.
  roundRect(ctx, 452, 116, 118, 84, 4, '#e8dcc0');
  const chartPts = [[470, 178], [492, 146], [516, 158], [532, 132], [552, 150]];
  stroke(ctx, chartPts, '#7a6a4f', 1.6);
  chartPts.forEach(([x, y]) => circle(ctx, x, y, 2.6, '#4a3b28'));
  if (!changed.has('chart')) star4(ctx, 532, 132, 9, '#c9962e');
  ctx.fillStyle = '#7a6a4f';
  ctx.font = 'italic 10px Georgia, serif';
  ctx.fillText('the wanderers', 511, 192);

  // Desk with a lamp — difference "lamp": lit in the original, dark in the changed panel.
  rect(ctx, 398, 306, 178, 12, '#3a271c');
  rect(ctx, 408, 318, 10, 44, '#2c1e14');
  rect(ctx, 556, 318, 10, 44, '#2c1e14');
  rect(ctx, 440, 288, 52, 18, '#e8dcc0');
  rect(ctx, 446, 292, 40, 3, '#b8a888');
  if (!changed.has('lamp')) {
    const glow = ctx.createRadialGradient(472, 258, 6, 472, 258, 74);
    glow.addColorStop(0, 'rgba(255,214,120,0.5)');
    glow.addColorStop(1, 'rgba(255,214,120,0)');
    circle(ctx, 472, 258, 74, glow);
  }
  line(ctx, 472, 306, 472, 278, '#2c2c34', 5);
  line(ctx, 472, 278, 458, 262, '#2c2c34', 5);
  poly(ctx, [[444, 268], [476, 268], [468, 244], [452, 244]], changed.has('lamp') ? '#6b5a4a' : '#ffd98a');
  // Mugs — difference "mug": a second mug appears in the changed panel.
  const mug = (x, color) => {
    roundRect(ctx, x - 9, 292, 18, 15, 3, color);
    ctx.beginPath();
    ctx.arc(x + 12, 299, 5, -1.2, 1.2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  mug(524, '#c73e54');
  if (changed.has('mug')) mug(496, '#2a9d8f');

  // Rug — difference "rug": teal becomes purple. A cat sleeps on it either way.
  ellipse(ctx, 300, 394, 132, 30, changed.has('rug') ? '#7a4f9e' : '#2e8f86');
  ellipse(ctx, 300, 394, 100, 21, 'rgba(255,255,255,0.25)');
  ellipse(ctx, 300, 394, 62, 13, changed.has('rug') ? '#7a4f9e' : '#2e8f86');
  ellipse(ctx, 336, 388, 20, 9, '#3a3f4a');
  circle(ctx, 354, 384, 8, '#3a3f4a');
  poly(ctx, [[348, 379], [346, 371], [353, 376]], '#3a3f4a');
  poly(ctx, [[359, 379], [361, 371], [354, 376]], '#3a3f4a');

  // Stacked books and a plant pot on the floor.
  rect(ctx, 168, 330, 44, 10, '#c73e54');
  rect(ctx, 172, 320, 38, 10, '#2a9d8f');
  rect(ctx, 176, 310, 32, 10, '#f2c14e');
  roundRect(ctx, 540, 356, 34, 28, 4, '#b5542c');
  circle(ctx, 557, 346, 15, '#3d9970');
  circle(ctx, 545, 352, 10, '#46aa7c');
  circle(ctx, 569, 352, 10, '#46aa7c');
}

export const SCENES = [
  {
    id: 'cafe',
    title: 'Coral Café Terrace',
    subtitle: 'A slow morning by the sea',
    time: 120,
    hints: 3,
    paint: paintCafe,
    diffs: [
      { id: 'umbrella', x: 170, y: 196, r: 44, kind: 'colour', label: 'the parasol changed colour' },
      { id: 'sail', x: 322, y: 182, r: 32, kind: 'missing', label: 'the near boat lost its sail' },
      { id: 'awning', x: 508, y: 192, r: 46, kind: 'detail', label: 'the awning has one stripe fewer' },
      { id: 'cup', x: 171, y: 310, r: 30, kind: 'extra', label: 'an extra cup on the table' },
      { id: 'sun', x: 80, y: 66, r: 38, kind: 'size', label: 'the sun shrank' },
    ],
  },
  {
    id: 'market',
    title: 'Lantern Row Night Market',
    subtitle: 'Seven stalls of colour after dark',
    time: 150,
    hints: 3,
    paint: paintMarket,
    diffs: [
      { id: 'moon', x: 505, y: 68, r: 36, kind: 'detail', label: 'the full moon became a crescent' },
      { id: 'star', x: 88, y: 108, r: 24, kind: 'missing', label: 'the bright star vanished' },
      { id: 'bulbs', x: 150, y: 58, r: 24, kind: 'missing', label: 'one string light is out' },
      { id: 'jars', x: 105, y: 214, r: 34, kind: 'missing', label: 'a spice jar is missing' },
      { id: 'lantern', x: 300, y: 202, r: 34, kind: 'colour', label: 'the big lantern changed colour' },
      { id: 'pennant', x: 480, y: 192, r: 40, kind: 'detail', label: 'the garland has one flag fewer' },
      { id: 'cat', x: 180, y: 368, r: 36, kind: 'colour', label: 'the market cat changed colour' },
    ],
  },
  {
    id: 'attic',
    title: 'The Attic Observatory',
    subtitle: 'Starlight, dust and quiet books',
    time: 180,
    hints: 3,
    paint: paintAttic,
    diffs: [
      { id: 'planet', x: 352, y: 86, r: 27, kind: 'colour', label: 'the planet changed colour' },
      { id: 'owl', x: 92, y: 60, r: 27, kind: 'missing', label: 'the owl left its beam' },
      { id: 'bulb', x: 170, y: 96, r: 27, kind: 'size', label: 'the hanging bulb grew' },
      { id: 'books', x: 88, y: 200, r: 38, kind: 'missing', label: 'a book is missing from the shelf' },
      { id: 'telescope', x: 256, y: 228, r: 46, kind: 'moved', label: 'the telescope dipped its nose' },
      { id: 'chart', x: 532, y: 132, r: 25, kind: 'missing', label: 'the chart lost its brightest star' },
      { id: 'lamp', x: 466, y: 256, r: 33, kind: 'detail', label: 'the desk lamp went out' },
      { id: 'mug', x: 505, y: 299, r: 27, kind: 'extra', label: 'a second mug appeared' },
      { id: 'rug', x: 300, y: 394, r: 52, kind: 'colour', label: 'the rug changed colour' },
    ],
  },
];
