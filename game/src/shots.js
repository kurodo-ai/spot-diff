// shots.js — screenshot staging behind ?shot=<name>. Each name freezes a real mid-game frame of
// the running game (a scene from scenes.js, some differences already ringed, the counter and
// timer set), so the maker's screenshots are honest renders of the game itself, never composites.
//   cover  — Lantern Row with 3 of 7 found (the cover shot)
//   cafe   — Coral Café Terrace with 2 of 5 found
//   attic  — The Attic Observatory with 4 of 9 found
//   title  — the title screen

const SHOTS = {
  cover: { sceneIndex: 1, foundIds: ['moon', 'jars', 'cat'], timeLeft: 83, hintsLeft: 2 },
  cafe: { sceneIndex: 0, foundIds: ['umbrella', 'sun'], timeLeft: 74, hintsLeft: 2 },
  attic: { sceneIndex: 2, foundIds: ['planet', 'owl', 'rug', 'lamp'], timeLeft: 96, hintsLeft: 1 },
};

/** Stage the named shot on `game`; returns false when the name is not a shot (normal boot). */
export function stageShot(game, name) {
  if (name === 'title') {
    game.toTitle();
    return true;
  }
  const config = SHOTS[name];
  if (!config) return false;
  game.applyShot(config);
  return true;
}
