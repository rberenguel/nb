# nb

A very simple PWA for the [n-back task](https://en.wikipedia.org/wiki/N-back), visual-only.
Has double and triple modes.

A long time ago I found an app I liked for it, with only positions and letters. Most are
position+audio, which I don't like. But that stopped working, so…
[wrote my own](https://www.youtube.com/watch?v=ubPWaDWcOLU).

I have the feeling the n-back task is useful for focus. Otherwise, it was a neat side
project to hack together in a couple afternoons.

## Usage

> [!NOTE]
> This should work best on a phone in portrait, it could look weird otherwise.

To change the depth level press any of the squares (assume they are 1-9), the number in the top (the `n`-level) 
will change accordingly. Pressing the same square twice switches from dual to triple N-back.

To start, tap the top, where the level appears. To pause while playing, press the middle or top. To dismiss the pause,
tap the modal and then either choose a different level or just start. It will begin from "now" (so, no history),
but will keep your current score.

The answer buttons (details below) won't appear until an answer is expected. The answer buttons will briefly flash red or green depending on whether you were right or wrong.

### Dual

- You need to remember colors and positions.
- If it's the same position as `n`-steps before, tap the middle left side, it will change color when selected. Press again to undo the answer.
- If it's the same color as `n`-steps before, tap the middler right side, it will change color when selected. Press again to undo the answer.

### Triple

- You need to remember colors, positions and letters.
- For position and color, as in dual.
- For letter, press the bottom.

## Tip(s)

If you want to see all possible colors, visit the page with the URL ending in `?colors`.
