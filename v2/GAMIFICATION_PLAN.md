# Dual N-Back Gamification Plan

## Overview
Transform the dual n-back game into an engaging, rewarding experience with score tracking, haptic feedback, visual celebrations, and progress visualization.

---

## Phase 1: Foundation - Score Tracking & Haptics

### Task 1.1: Score Tracking System ⬜
**Goal:** Implement localStorage-based high score tracking

**Implementation:**
- [x] Define score calculation formula
  - Points = correct answers × level multiplier
  - 1-back: 1pt, 2-back: 2pt, 3-back: 3pt, etc.
  - Triple mode: 1.5x multiplier
  - Perfect round bonus: +5 points
- [ ] Create score storage module
  - Key: `dnback_highscores`
  - Structure: `{ score, level, mode, percentage, totalRounds, date }`
  - Store top 5 scores
- [ ] Add to game end sequence
  - Calculate final score
  - Save to localStorage
  - Highlight if new record

**Code Reference:** `/Users/ruben/code/apoquerar/script.js` (lines 632-655)

**Files to create/modify:**
- `v2/scoring.js` (new module)
- `v2/v2.js` (import and integrate)

---

### Task 1.2: Haptic Feedback System ⬜
**Goal:** Add tactile feedback for user interactions

**Implementation:**
- [ ] Copy haptic module
  - Source: `/Users/ruben/code/apoquerar/haptic.js`
  - Destination: `v2/haptic.js`
- [ ] Import into v2.js
  - `import { haptic } from "./haptic.js"`
- [ ] Add haptic triggers:
  - **Light (50ms):** Button press (position/color/letter)
  - **Medium (100ms):** Correct answer (green flash)
  - **Strong (150ms):** Wrong answer (red flash)
  - **Celebration (200ms):** Perfect round
  - **Pattern (50-100-50):** New high score

**Code Reference:** `/Users/ruben/code/apoquerar/haptic.js` (complete module)

**Files to create/modify:**
- `v2/haptic.js` (copy from apoquerar)
- `v2/v2.js` (add haptic() calls)
- `v2/v2.html` (convert to ES6 module: `<script type="module" src="v2.js">`)

---

## Phase 2: Visual Progress - Brain Indicator

### Task 2.1: Brain Icon Integration ⬜
**Goal:** Add animated brain icon showing game progress

**Implementation:**
- [ ] Get Phosphor brain icon
  - Source: https://phosphoricons.com (brain icon)
  - Format: SVG inline in HTML
- [ ] Create brain container in top-right
  - Replace current stats display
  - Position: `position: fixed; top: 1rem; right: 1rem;`
- [ ] Add gradient fill overlay
  - CSS clip-path to match brain shape
  - Animated height based on progress
  - `--fill-percentage: calc(total / 120 * 100%)`

**Color progression:**
- 0-20%: `#696969` (grey) → `#8d8673` (light grey)
- 20-40%: `#8d8673` → `#4363f8` (blue)
- 40-60%: `#4363f8` → `#fcbeff` (pink)
- 60-80%: `#fcbeff` → `#ffe119` (yellow)
- 80-100%: `#ffe119` → Rainbow gradient

**Files to modify:**
- `v2/v2.html` (add brain SVG + container)
- `v2/v2.css` (brain styles + animations)
- `v2/v2.js` (update brain fill on each round)

---

### Task 2.2: Score Display with "Sixtyfour" Font ⬜
**Goal:** Add eye-catching score display with animated gradient

**Implementation:**
- [ ] Copy font file
  - Source: `/Users/ruben/code/suc/SixtyFour.woff2`
  - Destination: `v2/fonts/SixtyFour.woff2`
- [ ] Add @font-face declaration
  - In `v2.css`
- [ ] Create score display element
  - Position: Below brain icon
  - Font: Sixtyfour, 3rem
  - Gradient: `linear-gradient(to right, #c60, #cc0, #0cc, #06c, #0cc, #cc0, #c60)`
  - Animation: Gradient shift (10s loop)
- [ ] Add "bling" animation on score increase
  - Scale bounce: 1 → 0.92 → 1.11 → settle to 1
  - Duration: 600ms with elastic easing

**Code Reference:** `/Users/ruben/code/suc/blocker.js` (lines 10-59)

**Files to modify:**
- `v2/fonts/SixtyFour.woff2` (copy)
- `v2/v2.css` (font + score styles)
- `v2/v2.html` (score display element)
- `v2/v2.js` (update score + trigger bling)

---

## Phase 3: Visual Celebrations - Effects System

### Task 3.1: Canvas Particle System ⬜
**Goal:** Create reusable particle animation engine

**Implementation:**
- [ ] Create effects module
  - `v2/effects.js`
  - Canvas setup (fullscreen overlay, pointer-events: none)
  - Particle class with physics (position, velocity, alpha, decay)
  - Animation loop with RAF
- [ ] Implement particle types:
  - **Firework:** Circular burst, multi-color, trails, friction-based
  - **Explosion:** Radial spread, gravity, orange-to-red gradient
  - **Confetti:** Random shapes, rotation, slower decay

**Code Reference:**
- `/Users/ruben/code/suc/content_script.js` (lines 86-246)
- Firework config: friction 0.98, no gravity, color schemes
- Explosion config: gravity 0.075, speed multiplier, decay rates

**Files to create:**
- `v2/effects.js` (new particle system module)

---

### Task 3.2: Celebration Triggers ⬜
**Goal:** Trigger visual effects at key moments

**Implementation:**
- [ ] Perfect round (all answers correct)
  - Small firework burst at brain icon
  - Brain icon "pop" scale animation
  - Haptic celebration pattern
- [ ] Cycle completion (every 20 rounds)
  - Large firework burst from brain
  - Multiple color particles
  - Longer haptic pattern
- [ ] New high score
  - Explosion + firework combo
  - Screen-wide confetti
  - Star emoji appears on score
  - Double haptic pattern
- [ ] 100% accuracy milestone
  - Rainbow firework
  - Brain icon rainbow gradient pulse
  - Triple haptic celebration

**Files to modify:**
- `v2/v2.js` (import effects, add trigger logic in checkAnswers + endGame)

---

## Phase 4: High Scores Display & Polish

### Task 4.1: High Scores Modal Section ⬜
**Goal:** Display top 5 scores in game over modal

**Implementation:**
- [ ] Add high scores section to modal
  - List of top 5 scores
  - Highlight new record with animation
  - Show: rank, score, level, mode, percentage, date
- [ ] Style high score entries
  - Gradient background for #1
  - Subtle border for others
  - "NEW!" badge for current score if record
- [ ] Add personal best indicator
  - Show user's best for current level/mode combination

**Code Reference:** `/Users/ruben/code/apoquerar/script.js` (lines 641-655)

**Files to modify:**
- `v2/v2.js` (displayHighScores function in showResults)
- `v2/v2.css` (high score list styles)
- `v2/v2.html` (high scores container in modal)

---

### Task 4.2: Progress Milestones ⬜
**Goal:** Show achievement-like milestones

**Implementation:**
- [ ] Define milestone list
  - "First Steps" - Complete 10 rounds
  - "Getting Focused" - Complete 40 rounds
  - "Half Marathon" - Complete 60 rounds
  - "Century" - Complete 100 rounds
  - "Perfect Game" - 100% accuracy for full cycle
  - "Einstein Mode" - Complete 9-back game
  - "Triple Threat" - Complete triple mode game
- [ ] Store unlocked milestones in localStorage
- [ ] Show toast notification when unlocked
  - Slide in from top
  - Icon + title + description
  - Auto-dismiss after 4s
- [ ] Display in modal if achieved during game

**Files to modify:**
- `v2/v2.js` (milestone tracking + notifications)
- `v2/v2.css` (toast notification styles)
- `v2/scoring.js` (milestone storage)

---

## Phase 5: Additional Polish

### Task 5.1: Pause Screen Enhancement ⬜
**Goal:** Make pause screen more informative

**Implementation:**
- [ ] Show current session stats during pause
  - Current score
  - Rounds completed
  - Current accuracy
  - Time elapsed
- [ ] Add "Resume" button (in addition to tap-anywhere)
- [ ] Blur background slightly

**Files to modify:**
- `v2/v2.js` (pause screen content)
- `v2/v2.css` (pause overlay styles)

---

### Task 5.2: Sound Effects (Optional) ⬜
**Goal:** Add subtle audio feedback

**Implementation:**
- [ ] Create/find sound files
  - Button press: soft click
  - Correct: pleasant chime
  - Wrong: subtle buzz
  - Perfect round: success jingle
  - New high score: fanfare
- [ ] Add audio toggle in settings
- [ ] Implement Web Audio API playback

**Note:** Lower priority - haptics may be sufficient

---

## Technical Considerations

### Module System Migration
Current: `<script src="v2.js"></script>`
Required: `<script type="module" src="v2.js"></script>`

**Why:** To support `import` statements for haptics and effects

**Changes needed:**
- Update `v2/v2.html` script tag
- Convert v2.js to use exports if needed
- Ensure all modules use ES6 syntax

### Performance
- Canvas animations only when particles exist
- Remove particles when alpha <= 0
- Limit max simultaneous particles (200)
- Use RAF for 60fps animations
- Scale particle count on mobile (reduce by 50%)

### Storage Limits
- localStorage max: 5-10MB
- High scores: ~1KB for 5 entries
- Milestones: ~500 bytes
- Total usage: <5KB (safe)

---

## File Structure (After Implementation)

```
v2/
├── v2.html                 # Main HTML (updated with modules)
├── v2.css                  # Styles (brain, score, effects)
├── v2.js                   # Main game logic (updated)
├── haptic.js               # Haptic feedback module (from apoquerar)
├── effects.js              # Particle system (inspired by suc)
├── scoring.js              # Score tracking + milestones
└── fonts/
    └── SixtyFour.woff2     # Display font (from suc)
```

---

## Implementation Order

**Week 1: Foundation**
1. ✅ Copy haptic.js
2. ✅ Add haptic triggers
3. ✅ Implement score tracking
4. ✅ Test localStorage persistence

**Week 2: Visual Progress**
5. ✅ Add brain icon + gradient fill
6. ✅ Copy Sixtyfour font
7. ✅ Create score display with gradient
8. ✅ Test brain animation on progress

**Week 3: Celebrations**
9. ✅ Build particle system
10. ✅ Implement firework effects
11. ✅ Add celebration triggers
12. ✅ Test performance

**Week 4: Polish**
13. ✅ Add high scores modal
14. ✅ Implement milestones
15. ✅ Enhance pause screen
16. ✅ Final testing + tweaks

---

## Success Metrics

- [x] Haptic feedback on all interactions
- [x] Score persists across sessions
- [x] Brain fills smoothly with progress
- [x] Fireworks trigger on achievements
- [x] High scores display correctly
- [x] Performance: 60fps during animations
- [x] Mobile-friendly (touch + haptics work)
- [x] No console errors

---

## Resources

**Code References:**
- Apoquerar: `/Users/ruben/code/apoquerar/`
- Suc: `/Users/ruben/code/suc/`
- Current n-back: `/Users/ruben/code/nb/v2/`

**External:**
- Phosphor Icons: https://phosphoricons.com
- Sixtyfour Font: From suc project
- Game Feel Theory: "Juice It or Lose It" talk

---

## Notes

- Keep effects subtle on mobile (battery concern)
- Test haptics on both iOS (Safari trick) and Android (Vibration API)
- Consider adding settings toggle for effects intensity
- Brain gradient could change based on accuracy (dull if low, bright if high)
- Score could pulse red if below personal best

---

**Last Updated:** 2025-02-09
**Status:** Planning phase - ready to implement Phase 1
