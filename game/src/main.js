// main.js — Second Look's boot: collect the page's elements, build the title screen's scene
// list, wire the header buttons and the keyboard, then either stage a ?shot= screenshot frame
// or open on the title screen over a quiet first scene.

import { SCENES } from './scenes.js';
import { Game } from './game.js';
import { stageShot } from './shots.js';
import { setMuted, isMuted, playClick } from './audio.js';

const $ = (id) => document.getElementById(id);

const ui = {
  panelA: $('panel-a'),
  panelB: $('panel-b'),
  stage: $('stage'),
  sceneName: $('scene-name'),
  counter: $('counter'),
  score: $('score'),
  timerFill: $('timer-fill'),
  timerText: $('timer-text'),
  btnHint: $('btn-hint'),
  status: $('status'),
  toast: $('toast'),
  screenTitle: $('screen-title'),
  screenPause: $('screen-pause'),
  screenWin: $('screen-win'),
  screenLose: $('screen-lose'),
  winStats: $('win-stats'),
  loseStats: $('lose-stats'),
  btnNext: $('btn-next'),
  sceneList: $('scene-list'),
};

const game = new Game(ui);

// Title screen: one card per scene, with its difference count and the player's best score.
for (const [index, scene] of SCENES.entries()) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'scene-pick';
  button.innerHTML =
    `<span class="scene-pick-title">${scene.title}</span>` +
    `<span class="scene-pick-sub">${scene.subtitle}</span>` +
    `<span class="scene-pick-meta">${scene.diffs.length} differences · best: <span data-best="${scene.id}">not cleared yet</span></span>`;
  button.addEventListener('click', () => game.startScene(index));
  ui.sceneList.appendChild(button);
}

$('btn-hint').addEventListener('click', () => game.useHint());
$('btn-pause').addEventListener('click', () => game.togglePause());
$('btn-resume').addEventListener('click', () => game.togglePause());
$('btn-restart').addEventListener('click', () => {
  if (game.state !== 'title') game.startScene(game.sceneIndex);
});
$('btn-next').addEventListener('click', () => game.startScene(game.sceneIndex + 1));
$('btn-win-replay').addEventListener('click', () => game.startScene(game.sceneIndex));
$('btn-retry').addEventListener('click', () => game.startScene(game.sceneIndex));
for (const id of ['btn-pause-menu', 'btn-win-menu', 'btn-lose-menu']) {
  $(id).addEventListener('click', () => {
    playClick();
    game.toTitle();
  });
}

const btnSound = $('btn-sound');
function toggleSound() {
  setMuted(!isMuted());
  btnSound.textContent = isMuted() ? 'Sound: off' : 'Sound: on';
  if (!isMuted()) playClick();
}
btnSound.addEventListener('click', toggleSound);

window.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') toggleSound();
  else game.handleKey(event);
});

const shot = new URLSearchParams(location.search).get('shot');
if (!stageShot(game, shot)) {
  game.toTitle();
}
