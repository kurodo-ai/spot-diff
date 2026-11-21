# spot-diff

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/kurodo-ai/spot-diff/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/kurodo-ai/spot-diff/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

**Second Look** is a spot-the-difference game for the desktop browser. Two near-identical
pictures stand side by side; click each difference in either picture before the clock runs out.
Every scene is painted procedurally on canvas from scene data — one renderer draws the original,
and the same renderer with a set of changes applied draws its twin — so the differences are data,
not doctored images: a parasol that changed colour, a sail that vanished, an awning with one
stripe fewer, a telescope that dipped its nose.

Three scenes of rising difficulty:

- **Coral Café Terrace** — 5 differences, 2:00 on the clock
- **Lantern Row Night Market** — 7 differences, 2:30
- **The Attic Observatory** — 9 differences, 3:00

A found difference rings on both panels with a chime and a burst of sparks; a wrong click costs
5 seconds and 25 points. Three hints per scene pulse around a difference still hiding. Scores
earn a time bonus, and each scene remembers your best. All sound is synthesized live with
WebAudio — the game ships no assets at all and runs fully offline from static files.

The source is split by job under `game/src/`: `scenes.js` (the three scene painters and their
difference data), `render.js` (panel drawing, markers, hint pulses, find effects), `game.js`
(the state machine, timer, hit-testing and scoring), `audio.js` (the synthesized sounds),
`shots.js` (the `?shot=` frames the screenshots were staged with) and `main.js` (boot and UI
wiring). `main.ts` at the root hands the entry in; `serve.ts` plays it locally.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

---

Entered on [make.fun](https://make.fun/?ref=gzzxjh8r&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards
