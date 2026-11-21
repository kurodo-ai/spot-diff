// audio.js — every sound in Second Look is synthesized with WebAudio oscillators; there are no
// audio files. A single shared AudioContext is created lazily (browsers require a user gesture
// before sound may start, so the game calls unlock() from its first pointer/key event).

let context = null;
let muted = false;

function ensureContext() {
  if (context === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    context = new AC();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

/** Call from any user gesture so later sounds are allowed to play. */
export function unlock() {
  ensureContext();
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

/** One soft oscillator note with an exponential decay envelope. */
function note(freq, at, dur, type = 'sine', gain = 0.16) {
  const ac = ensureContext();
  if (!ac || muted) return;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  const t0 = ac.currentTime + at;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** A found difference: a bright two-note chime, rising with the current streak. */
export function playFind(streak = 0) {
  const base = 660 * Math.pow(2, Math.min(streak, 6) / 12);
  note(base, 0, 0.18, 'sine', 0.18);
  note(base * 1.5, 0.07, 0.26, 'sine', 0.16);
}

/** A wrong click: a low, gentle buzz — noticeable, never harsh. */
export function playMiss() {
  note(140, 0, 0.16, 'square', 0.05);
  note(110, 0.02, 0.2, 'square', 0.045);
}

/** The hint pulse: a little sparkle arpeggio. */
export function playHint() {
  note(880, 0, 0.14, 'triangle', 0.12);
  note(1174, 0.08, 0.14, 'triangle', 0.12);
  note(1568, 0.16, 0.22, 'triangle', 0.1);
}

/** A plain UI click. */
export function playClick() {
  note(520, 0, 0.07, 'triangle', 0.08);
}

/** The win jingle: four rising notes. */
export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => note(f, i * 0.11, 0.3, 'sine', 0.15));
}

/** The out-of-time sting: two falling notes. */
export function playLose() {
  note(392, 0, 0.3, 'sine', 0.13);
  note(262, 0.16, 0.45, 'sine', 0.13);
}
