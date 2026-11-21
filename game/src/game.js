// game.js — the Second Look state machine: title -> playing -> paused / won / lost, the countdown
// timer, click hit-testing against the scene's difference data, hints, streaks and scoring.
// Rendering lives in render.js, scene data in scenes.js, sounds in audio.js; this file owns the
// rules and the HUD.

import { SCENES, SCENE_W, SCENE_H } from './scenes.js';
import { drawPanel } from './render.js';
import { playFind, playMiss, playHint, playWin, playLose, playClick, unlock } from './audio.js';

const MISS_TIME_PENALTY = 5;   // seconds lost per wrong click
const MISS_SCORE_PENALTY = 25; // points lost per wrong click
const FIND_SCORE = 100;        // points per difference found
const TIME_BONUS_PER_SECOND = 5;

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function loadBest() {
  try {
    return JSON.parse(localStorage.getItem('secondlook-best') || '{}');
  } catch {
    return {};
  }
}

function saveBest(best) {
  try {
    localStorage.setItem('secondlook-best', JSON.stringify(best));
  } catch {
    /* storage unavailable (e.g. some file:// setups): best scores are a nicety, not a rule */
  }
}

export class Game {
  constructor(ui) {
    this.ui = ui;
    this.state = 'title';
    this.sceneIndex = 0;
    this.found = new Set();
    this.remaining = 0;
    this.hintsLeft = 0;
    this.score = 0;
    this.streak = 0;
    this.misses = 0;
    this.missMarks = [];
    this.pops = [];
    this.hint = null;
    this.best = loadBest();
    this.raf = 0;
    this.lastTs = 0;

    for (const canvas of [ui.panelA, ui.panelB]) {
      canvas.addEventListener('pointerdown', (event) => this.onPointer(event, canvas));
    }
  }

  get scene() {
    return SCENES[this.sceneIndex];
  }

  get remainingCount() {
    return this.scene.diffs.length - this.found.size;
  }

  /* ------------------------------------------------------------ scene flow */

  startScene(index) {
    unlock();
    this.sceneIndex = index;
    const scene = this.scene;
    this.found = new Set();
    this.remaining = scene.time;
    this.hintsLeft = scene.hints;
    this.score = 0;
    this.streak = 0;
    this.misses = 0;
    this.missMarks = [];
    this.pops = [];
    this.hint = null;
    this.state = 'playing';
    this.showScreen(null);
    this.showToast(scene);
    this.syncHud();
    this.startLoop();
    this.announce(`${scene.title}: find ${scene.diffs.length} differences.`);
  }

  toTitle() {
    this.state = 'title';
    this.stopLoop();
    // Reset the HUD to a fresh first scene, so the bar above the title card reads sensibly.
    this.sceneIndex = 0;
    this.found = new Set();
    this.remaining = this.scene.time;
    this.hintsLeft = this.scene.hints;
    this.score = 0;
    this.missMarks = [];
    this.pops = [];
    this.hint = null;
    this.syncHud();
    this.showScreen('title');
    this.renderTitleBest();
    this.drawBoth(performance.now());
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.showScreen('pause');
      playClick();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.showScreen(null);
      this.lastTs = performance.now();
      playClick();
    }
  }

  win() {
    this.state = 'won';
    const bonus = Math.ceil(this.remaining) * TIME_BONUS_PER_SECOND;
    this.score += bonus;
    playWin();
    const id = this.scene.id;
    if (!this.best[id] || this.score > this.best[id]) {
      this.best[id] = this.score;
      saveBest(this.best);
    }
    this.ui.winStats.textContent =
      `${this.scene.title} cleared — ${this.scene.diffs.length} differences, ` +
      `${this.misses} miss${this.misses === 1 ? '' : 'es'}, ${formatTime(this.remaining)} to spare. ` +
      `Time bonus +${bonus}. Score ${this.score} (best ${this.best[id]}).`;
    this.ui.btnNext.hidden = this.sceneIndex >= SCENES.length - 1;
    this.syncHud();
    this.showScreen('win');
    this.announce(`Scene cleared. Score ${this.score}.`);
  }

  lose() {
    this.state = 'lost';
    this.remaining = 0;
    playLose();
    this.ui.loseStats.textContent =
      `Out of time on ${this.scene.title} — ${this.found.size} of ${this.scene.diffs.length} ` +
      `differences found, ${this.remainingCount} still hiding.`;
    this.showScreen('lose');
    this.syncHud();
    this.announce('Out of time.');
  }

  /* ------------------------------------------------------------ interaction */

  onPointer(event, canvas) {
    unlock();
    if (this.state !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (SCENE_W / rect.width);
    const y = (event.clientY - rect.top) * (SCENE_H / rect.height);
    const now = performance.now();

    let bestDiff = null;
    let bestDist = Infinity;
    for (const diff of this.scene.diffs) {
      if (this.found.has(diff.id)) continue;
      const dist = Math.hypot(x - diff.x, y - diff.y);
      if (dist <= Math.max(diff.r, 26) && dist < bestDist) {
        bestDiff = diff;
        bestDist = dist;
      }
    }

    if (bestDiff) {
      this.found.add(bestDiff.id);
      this.streak += 1;
      this.score += FIND_SCORE;
      this.pops.push({ x: bestDiff.x, y: bestDiff.y, at: now, seed: Math.random() * 6, text: `+${FIND_SCORE}` });
      playFind(this.streak);
      this.announce(`Found: ${bestDiff.label}. ${this.remainingCount} to go.`);
      if (this.remainingCount === 0) {
        this.syncHud();
        this.win();
        return;
      }
    } else {
      this.streak = 0;
      this.misses += 1;
      this.score = Math.max(0, this.score - MISS_SCORE_PENALTY);
      this.remaining = Math.max(0, this.remaining - MISS_TIME_PENALTY);
      this.missMarks.push({ x, y, at: now });
      playMiss();
      canvas.classList.remove('shake');
      void canvas.offsetWidth;
      canvas.classList.add('shake');
      this.announce(`Not there. Minus ${MISS_TIME_PENALTY} seconds.`);
      if (this.remaining <= 0) {
        this.lose();
        return;
      }
    }
    this.syncHud();
    this.drawBoth(now);
  }

  useHint() {
    if (this.state !== 'playing' || this.hintsLeft <= 0 || this.hint) return;
    const unfound = this.scene.diffs.filter((d) => !this.found.has(d.id));
    if (unfound.length === 0) return;
    const pick = unfound[Math.floor(Math.random() * unfound.length)];
    this.hintsLeft -= 1;
    this.hint = { id: pick.id, start: performance.now(), until: performance.now() + 1500 };
    playHint();
    this.syncHud();
    this.announce('A hint shimmers somewhere in the picture.');
  }

  handleKey(event) {
    if (event.key === 'h' || event.key === 'H') this.useHint();
    else if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
      if (this.state === 'playing' || this.state === 'paused') this.togglePause();
    } else if (event.key === 'r' || event.key === 'R') {
      if (this.state !== 'title') this.startScene(this.sceneIndex);
    }
  }

  /* ------------------------------------------------------------ shot staging */

  /** Freeze a mid-game frame for screenshots: a real scene, some differences already found. */
  applyShot({ sceneIndex, foundIds, timeLeft, hintsLeft }) {
    this.sceneIndex = sceneIndex;
    this.found = new Set(foundIds);
    this.remaining = timeLeft;
    this.hintsLeft = hintsLeft;
    this.score = foundIds.length * FIND_SCORE;
    this.streak = 0;
    this.misses = 1;
    this.missMarks = [];
    this.pops = [];
    this.hint = null;
    this.state = 'shot';
    this.showScreen(null);
    this.hideToast();
    this.syncHud();
    this.startLoop();
  }

  /* ------------------------------------------------------------ loop + draw */

  startLoop() {
    this.stopLoop();
    this.lastTs = performance.now();
    const frame = (ts) => {
      if (this.state !== 'playing' && this.state !== 'shot') return;
      const dt = Math.min(0.1, (ts - this.lastTs) / 1000);
      this.lastTs = ts;
      if (this.state === 'playing') {
        this.remaining -= dt;
        if (this.remaining <= 0) {
          this.lose();
          return;
        }
      }
      if (this.hint && ts > this.hint.until) this.hint = null;
      this.syncTimer();
      this.drawBoth(ts);
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stopLoop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  drawBoth(now) {
    const base = {
      found: this.found,
      hintId: this.hint ? this.hint.id : null,
      hintT: this.hint ? ((now - this.hint.start) / 450) % 1 : 0,
      misses: this.missMarks
        .filter((m) => now - m.at < 600)
        .map((m) => ({ x: m.x, y: m.y, age: (now - m.at) / 1000 })),
      pops: this.pops
        .filter((p) => now - p.at < 550)
        .map((p) => ({ x: p.x, y: p.y, age: (now - p.at) / 1000, seed: p.seed, text: p.text })),
      now,
    };
    drawPanel(this.ui.panelA, this.scene, { ...base, changed: false });
    drawPanel(this.ui.panelB, this.scene, { ...base, changed: true });
  }

  /* ------------------------------------------------------------ HUD + screens */

  syncHud() {
    const scene = this.scene;
    this.ui.sceneName.textContent = scene.title;
    this.ui.counter.textContent = `Found ${this.found.size} of ${scene.diffs.length} · ${this.remainingCount} to go`;
    this.ui.score.textContent = `Score ${this.score}`;
    this.ui.btnHint.textContent = `Hint (${this.hintsLeft})`;
    this.ui.btnHint.disabled = this.hintsLeft <= 0 || this.state !== 'playing';
    this.syncTimer();
  }

  syncTimer() {
    const total = this.scene.time;
    const frac = Math.max(0, this.remaining / total);
    this.ui.timerFill.style.width = `${frac * 100}%`;
    this.ui.timerFill.classList.toggle('danger', this.remaining < 20 && this.state === 'playing');
    this.ui.timerText.textContent = formatTime(this.remaining);
  }

  showScreen(name) {
    const screens = {
      title: this.ui.screenTitle,
      pause: this.ui.screenPause,
      win: this.ui.screenWin,
      lose: this.ui.screenLose,
    };
    for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
    this.ui.stage.classList.toggle('dimmed', name === 'pause');
  }

  showToast(scene) {
    const toast = this.ui.toast;
    toast.querySelector('.toast-title').textContent = scene.title;
    toast.querySelector('.toast-sub').textContent =
      `${scene.subtitle} — ${scene.diffs.length} differences · ${formatTime(scene.time)} · ${scene.hints} hints`;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
  }

  hideToast() {
    this.ui.toast.classList.remove('show');
  }

  renderTitleBest() {
    for (const el of this.ui.sceneList.querySelectorAll('[data-best]')) {
      const id = el.getAttribute('data-best');
      el.textContent = this.best[id] ? `${this.best[id]}` : 'not cleared yet';
    }
  }

  announce(text) {
    this.ui.status.textContent = text;
  }
}
