# nb

A very simple PWA for the [n-back task](https://en.wikipedia.org/wiki/N-back), visual-only.
Has dual and triple modes.

A long time ago I found an app I liked for it, with only positions and letters. Most are
position+audio, which I don't like. But that stopped working, so…
[wrote my own](https://www.youtube.com/watch?v=ubPWaDWcOLU).

I have the feeling the `n`-back task is useful for focus. Otherwise, it was a neat side
project to hack together in a couple afternoons.

## Usage

> [!IMPORTANT]
> This will work best on a phone in portrait, it will look weird otherwise, particularly in triple-n-back mode. This is because the third mode button is designed to take the bottom of a portrait view. There is no explicit minimum width, but the screen should be reasonably wide (`600px` according to the simulator)
>
> I will likely add keyboard shortcuts so it is playable on desktops and using a keyboard on iPad, which are _my_ landscape scenarios.

To change the depth level press any of the squares (assume they are 1-9), the number in the top (the `n`-level) 
will change accordingly. Pressing the same square twice switches from dual to triple N-back.

To start, tap the top, where the level appears. To pause while playing, press the middle or top. To dismiss the pause,
tap the modal and then either choose a different level or just start normally. It will begin from "now" (so, no history),
but will keep your current score. Your current stats will show in the upper right area, the amount of answers on the upper
left area.

The answer buttons (details below) won't appear until an answer is expected. The answer buttons will briefly flash red or green depending on whether you were right or wrong.

### Dual

- You need to remember colors and positions.
- If it's the same position as `n`-steps before, tap the left side, it will change color when selected. Press again to undo the answer.
- If it's the same color as `n`-steps before, tap the right side, it will change color when selected. Press again to undo the answer.

### Triple

- You need to remember colors, positions and letters.
- For position and color, controls are as in dual.
- For letter, press the bottom (the letter button should take 50% of the bottom).

## Tip(s)

- If you want to see all possible colors, visit the page with the URL ending in `?colors`.
- You should be able to tweak the CSS to change the colors, backgrounds and that. I made it easier once I found out dark background (which I prefer) is hard on the eyes because the colors have high contrast.
