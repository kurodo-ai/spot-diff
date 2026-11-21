// Hand-in program for "Second Look", a spot-the-difference game (Node 22, standard library only).
//
// The game itself is the static site in game/ (game/index.html and its ES modules, no build step,
// no network requests). This program copies game/ and screenshots/ into the output directory and
// writes dossier.json there with the vendored make.fun library, exactly as the bounty asks.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play the game locally with:  node serve.ts   (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own (see the competition's gate): the dossier text is capped, there
// may be at most 4 screenshots of at most 256 KiB each, and game/ may hold at most 993 entries
// and 48 MiB with no path over 1,000 bytes. buildDossier returns the dossier as bytes.
const dossier = Buffer.from(buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
}));
writeFileSync(join(out, 'dossier.json'), dossier);

// Read the hand-in back and report it, so a bad bundle is loud here rather than at the grader:
// the screenshots must be 3 or 4 in number and each within its cap, and the dossier on disk must
// be byte for byte what buildDossier produced, within its own 1.5 MiB cap.
const shotDir = join(out, 'screenshots');
const shots = existsSync(shotDir) ? readdirSync(shotDir).filter((name) => !name.startsWith('.')) : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const name of shots) {
  const size = statSync(join(shotDir, name)).size;
  if (size > 262144) throw new Error(`screenshot ${name} is ${size} bytes, over the 256 KiB cap`);
}
if (!readFileSync(join(out, 'dossier.json')).equals(dossier)) {
  throw new Error('dossier.json on disk differs from what buildDossier wrote');
}
if (dossier.length > 1572864) throw new Error('dossier.json is over the 1.5 MiB cap');
console.log(`Second Look handed in: ${shots.length} screenshots (${shots.join(', ')}), dossier.json ${dossier.length} bytes.`);
