# Dual N-Back Game - Complete Technical Documentation

**Version:** 0.4.0-alpha
**Last Updated:** 2026-02-10
**Purpose:** Cognitive training game for improving working memory and focus

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & File Structure](#architecture--file-structure)
3. [Game State Machine](#game-state-machine) ⚠️ **CRITICAL**
4. [Core Game Mechanics](#core-game-mechanics)
5. [UI Components & Behavior](#ui-components--behavior)
6. [Visual Feedback Systems](#visual-feedback-systems)
7. [Timing & Animation](#timing--animation)
8. [Code Organization Patterns](#code-organization-patterns)
9. [Future Plans](#future-plans)
10. [Development Notes](#development-notes)

---

## Project Overview

### What is Dual N-Back?

A cognitive training exercise where users must identify when the current stimulus matches one that appeared **N steps ago**. This implementation is **visual-only** (no audio), tracking:

- **Position**: 3×3 grid (9 possible positions)
- **Color**: 9 distinct colors
- **Letter**: 9 letters (triple mode only)

### Key Design Principles

1. **Mobile-first**: Optimized for portrait mode on phones
2. **PWA**: Progressive Web App for offline use and installation
3. **Gamification**: Brain progress indicator, haptic feedback, particle effects
4. **Minimalist**: Clean UI, essential information only
5. **Accessible**: No audio requirement, clear visual feedback

### Current Features

- ✅ Dual mode (position + color) and triple mode (+ letter)
- ✅ 1-back through 9-back difficulty levels
- ✅ 100-round game (5 cycles × 20 rounds)
- ✅ Warmup periods (can't answer during first N rounds)
- ✅ Pause/resume functionality
- ✅ Brain fill progress indicator with fire particle effects
- ✅ Haptic feedback on interactions
- ✅ Perfect round celebrations
- ✅ Statistics display at game end

---

## Architecture & File Structure

```
nb/
├── index.html              # Main HTML structure
├── nb.js                   # Core game logic (ES6 module)
├── style.css               # All styling
├── haptic.js               # Haptic feedback module
├── fire.js                 # Fire particle system module
├── manifest.json           # PWA manifest
├── icon.png                # App icon (192×192)
├── icon_512.png            # App icon (512×512)
├── GAMIFICATION_PLAN.md    # Roadmap for future features
├── old.js                  # Previous version (for reference, has auto-leveling)
└── fonts/                  # Font files
    ├── inter.css           # Inter font declarations
    └── phosphor/           # Phosphor icon font
        └── phosphor.css
```

### Technology Stack

- **HTML5**: Semantic structure
- **CSS3**: Grid layout, animations, CSS custom properties
- **JavaScript ES6+**: Modules, arrow functions, template literals
- **Canvas API**: Fire particle system
- **Vibration API**: Haptic feedback (with iOS workaround)

### Module Dependencies

```javascript
nb.js imports:
  ├── haptic.js (triggerHaptic as haptic)
  └── fire.js (FireSystem)

index.html loads:
  ├── style.css
  ├── fonts/inter.css
  ├── fonts/phosphor/phosphor.css
  └── nb.js (type="module")
```

---

## Game State Machine

### ⚠️ CRITICAL: State Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         IDLE / SETUP                            │
│  active=false, paused=false, starting=true                      │
│                                                                  │
│  • User clicks squares to select BACK level (1-9)              │
│  • Click same square twice to toggle dual ↔ triple             │
│  • Level display shows: N₂ or N₃                               │
│  • Grid squares visible but neutral                            │
│                                                                  │
│  [Click level display to start]                                │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                          STARTING                                │
│  active=true, starting=true                                     │
│                                                                  │
│  • Buttons appear (fade in)                                     │
│  • Button text hidden (opacity: 0)                              │
│  • 1000ms delay                                                 │
│  • starting → false                                             │
│  • Call nextRound()                                             │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                    RUNNING - WARMUP                             │
│  active=true, starting=false, warmupRounds>0 OR history.len≤BACK│
│                                                                  │
│  • First BACK rounds (implicitly via history.length check)     │
│  • Button text hidden (opacity: 0)                              │
│  • Round display shows "—"                                      │
│  • User CANNOT press buttons (guard in toggleButton)            │
│  • No answer checking happens                                   │
│  • Each round: warmupRounds-- (if >0)                           │
│                                                                  │
│  Duration: BACK rounds                                          │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                  RUNNING - ANSWERABLE                            │
│  active=true, starting=false, warmupRounds=0, history.len>BACK  │
│                                                                  │
│  • Button text visible (opacity: 1)                             │
│  • Round display shows round number (1-100)                     │
│  • User CAN press buttons to indicate matches                   │
│  • Answers checked at START of next round                       │
│  • Brain progress indicator fills                               │
│  • Perfect rounds trigger celebration                           │
│                                                                  │
│  [Click pause button] → PAUSED                                  │
│  [Complete 5 cycles] → END                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓ (pause button clicked)
┌─────────────────────────────────────────────────────────────────┐
│                           PAUSED                                 │
│  active=false, paused=true                                      │
│                                                                  │
│  • All timers cleared (nextRoundTimeout, renderTimeout)         │
│  • All animations cleared (square highlights, letters)          │
│  • Button states reset (no pressed/correct/incorrect)           │
│  • Button text hidden                                           │
│  • Level display shows "⏸" (opacity: 0.5)                       │
│  • Reply state reset (lastReply cleared)                        │
│  • Statistics PRESERVED (total, correctPosC, etc.)              │
│  • History PRESERVED (all previous rounds kept)                 │
│                                                                  │
│  [Click pause button again] → Resume                            │
└────────────────────┬────────────────────────────────────────────┘
                     ↓
                  (resume)
                     ↓
           warmupRounds = BACK
                     ↓
         Return to RUNNING - WARMUP
         (gives user fresh start)
                     ↓
         After BACK rounds → RUNNING - ANSWERABLE
         (statistics continue from before pause)


                    (total ≥ 100)
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                            END                                   │
│  active=false, paused=false                                     │
│                                                                  │
│  • Triggered after 100 rounds (5 cycles × 20 rounds)            │
│  • All timers cleared                                           │
│  • Buttons hidden and reset                                     │
│  • Results modal shown with statistics                          │
│  • Level display restored                                       │
│                                                                  │
│  [Click modal] → IDLE                                           │
└─────────────────────────────────────────────────────────────────┘
```

### State Variables Reference

```javascript
// Primary state flags
active       // Boolean: Is game running?
paused       // Boolean: Is game paused?
starting     // Boolean: In initial startup phase?

// Warmup management
warmupRounds        // Number: Countdown for warmup period (only used on resume)
lastRoundWasWarmup  // Boolean: Was previous round a warmup round?

// Game configuration
BACK         // Number 1-9: N-back level
triple       // Boolean: Dual (false) or triple (true) mode

// Game state
history      // Array<{position, color, letter}>: All rounds played
total        // Number 0-100: Count of answerable rounds completed
cycles       // Number 0-4: Count of cycles completed (20 rounds per cycle)

// Statistics
correctPosC  // Number: Count of correct position answers
correctColC  // Number: Count of correct color answers
correctLetC  // Number: Count of correct letter answers (triple only)

// Current round
lastReply    // Object: {position: bool, color: bool, letter: bool}
             // Tracks which buttons user pressed this round

// Timing
nextRoundTimeout   // Number: Timeout ID for auto-advancing to next round
renderTimeout      // Number: Timeout ID for delayed rendering
```

### State Transition Triggers

| From State | To State | Trigger | Action |
|------------|----------|---------|--------|
| IDLE | STARTING | Click level display | `startGame()` |
| STARTING | RUNNING-WARMUP | 1000ms timeout | `starting = false; nextRound()` |
| RUNNING-WARMUP | RUNNING-ANSWERABLE | history.length > BACK | `canAnswer = true` |
| RUNNING-ANSWERABLE | PAUSED | Click pause button | `togglePause()` |
| PAUSED | RUNNING-WARMUP | Click pause button | `togglePause(); warmupRounds = BACK` |
| RUNNING-ANSWERABLE | END | total ≥ 100 | `endGame()` |
| END | IDLE | Click modal | Modal closes |
| RUNNING-ANSWERABLE | IDLE | - | User can select new level |

---

## Core Game Mechanics

### Warmup System

**Purpose:** Prevent users from answering before they have enough history to compare against.

#### On Game Start

- Warmup is **implicit** via `history.length <= BACK` checks
- User cannot press buttons until `history.length > BACK`
- Example: 3-back game
  - Rounds 1-3: Cannot answer (history.length ≤ 3)
  - Round 4+: Can answer (history.length > 3)
- No explicit `warmupRounds` counter set

#### On Resume from Pause

- Warmup is **explicit** via `warmupRounds = BACK`
- Gives user BACK rounds to "warm up" again
- Example: Resume from pause in 3-back game
  - Next 3 rounds: Cannot answer (warmupRounds = 3→2→1→0)
  - After that: Can answer normally
- Statistics and history are PRESERVED from before pause

#### Implementation Details

**Button press guard** (`toggleButton` function):
```javascript
if (!active || history.length <= BACK || warmupRounds > 0) return;
```

This prevents button presses when:
1. Game not active
2. Not enough history (implicit warmup)
3. Explicit warmup period (after resume)

**Button visibility** (`updateButtonVisibility` function):
```javascript
const canAnswer = !isWarmup && history.length > BACK;
// Sets button text opacity to 1 (visible) or 0 (hidden)
```

### Round Lifecycle

Each round follows this precise sequence:

#### 1. Start of `nextRound()`

```javascript
// a. Unrender previous step (if exists)
if (history.length >= 1) {
  unrender(history[history.length - 1]);
}

// b. Capture warmup state BEFORE any changes
const isWarmup = warmupRounds > 0;

// c. Check answers from PREVIOUS round (only if applicable)
if (!lastRoundWasWarmup && history.length > BACK) {
  checkAnswers();
}

// d. Decrement warmup counter (if in explicit warmup)
if (warmupRounds > 0) {
  warmupRounds--;
}

// e. Check for cycle/game completion
if (total >= CYCLE_LENGTH * (cycles + 1)) {
  cycles++;
  if (cycles >= 5) {
    endGame();
    return;
  }
}
```

#### 2. Generate Next Step

```javascript
let step;
if (history.length >= BACK) {
  // Use step from BACK rounds ago as reference
  const previousIdx = history.length - BACK;
  const prev = history[previousIdx];
  step = generateStep(prev); // 30% chance to match each dimension
} else {
  step = generateStep(); // Fully random
}

history.push(step);
```

#### 3. Update UI State

```javascript
// Determine if user can answer THIS round
const canAnswer = !isWarmup && history.length > BACK;

// Update button visibility
updateButtonVisibility(canAnswer);

// Update round display
if (canAnswer) {
  roundDisplay.textContent = `${total + 1}`;
} else {
  roundDisplay.textContent = "—"; // Warmup indicator
}

// Reset reply state for this round
resetReply();

// Remember warmup state for next round
lastRoundWasWarmup = isWarmup;
```

#### 4. Render After Delay

```javascript
// Wait RESET_TIME (300ms) - brief blank period
renderTimeout = setTimeout(() => {
  if (active && !paused) {
    render(step); // Highlight square, show color and letter

    // Auto-advance to next round after TOTAL_TIME
    nextRoundTimeout = setTimeout(() => {
      if (active && !paused) {
        nextRound();
      }
    }, TOTAL_TIME()); // 3000ms dual, 5000ms triple
  }
}, RESET_TIME());
```

#### 5. User Interaction Window

During the round (between render and next round):
- User can toggle buttons (if `canAnswer` is true)
- Button presses update `lastReply` object
- Buttons show pressed state (dark background)

#### 6. Auto-Advance

After `TOTAL_TIME()` expires, `nextRound()` is called automatically, and the cycle repeats.

### Answer Checking Logic

**When:** At the START of each round, checking answers from the PREVIOUS round.

**Conditions:** Only if:
1. `!lastRoundWasWarmup` (previous round was answerable)
2. `history.length > BACK` (we have enough history)

**Process:**

```javascript
function checkAnswers() {
  total++; // Increment round counter

  const currentIdx = history.length - 1;
  const prevIdx = currentIdx - BACK;
  const current = history[currentIdx];
  const prev = history[prevIdx];

  // Check each dimension
  for each dimension (position, color, letter):
    match = (current.dimension === prev.dimension)
    userSaidMatch = lastReply.dimension
    correct = (match && userSaidMatch) || (!match && !userSaidMatch)

    if (correct):
      correctDimensionC++
      flashButton(button, true) // Green flash, medium haptic (100ms)
    else:
      flashButton(button, false) // Red flash, strong haptic (150ms)

  // Check for perfect round
  if (allDimensionsCorrect):
    // Celebration after feedback flashes (600ms delay)
    setTimeout(() => {
      haptic(200) // Strong celebration haptic
      brain.classList.add('pop') // Scale animation
    }, 600)

  // Update stats display (300ms delay)
  setTimeout(() => updateStatsDisplay(), 300)
}
```

**Example Timeline:**

```
Round N:
  [0ms]     Show square, user can answer
  [3000ms]  Round N ends, nextRound() called

Round N+1:
  [0ms]     checkAnswers() - checks answers from round N
            Buttons flash green/red
  [300ms]   Stats update (brain fill increases)
  [300ms]   Previous square unrendered
  [300ms]   RESET_TIME blank period
  [600ms]   New square rendered
  [600ms]   If perfect round: celebration haptic + brain pop
  [3600ms]  Round N+1 ends, nextRound() called

Round N+2:
  [0ms]     checkAnswers() - checks answers from round N+1
  ...
```

### Step Generation Logic

```javascript
function generateStep(prev) {
  const randomIndex = Math.floor(Math.random() * 9);
  let position, color, letter;

  if (prev && Math.random() < 0.3) {
    // 30% chance to match previous step
    // For each dimension, 50% chance to match
    position = Math.random() < 0.5 ? prev.position : randomIndex;
    color = Math.random() < 0.5 ? prev.color : Math.floor(Math.random() * 9);
    letter = triple && Math.random() < 0.5 ? prev.letter : Math.floor(Math.random() * 9);
  } else {
    // 70% chance for fully random step
    position = randomIndex;
    color = Math.floor(Math.random() * 9);
    letter = Math.floor(Math.random() * 9);
  }

  return { position, color, letter };
}
```

**Key Insight:** When `prev` exists (history.length ≥ BACK), there's a 30% chance of attempting matches, making the game not too easy (pure random would be ~11% match rate) but not too hard either.

---

## UI Components & Behavior

### Grid System (3×3)

**HTML Structure:**
```html
<div id="grid-container">
  <div class="grid">
    <div class="square" data-pos="0" id="s0">
      <div class="square-inner"></div>
    </div>
    <!-- 8 more squares... -->
  </div>
</div>
```

**States:**
- **Idle:** Neutral background color (`var(--alternate-background)`)
- **Active:**
  - Border color animates from small to full (timer countdown)
  - Background shows active color
  - Letter circle appears (triple mode only)
- **Was-active** (brief state after unrender):
  - Applied when `.active` is removed
  - Triggers shake animation (0.15s)
  - Cleaned up after 200ms
  - Creates "pop" feedback right as color fills up completely

**Animation:** Timer countdown using CSS animation
```css
.square.active::before {
  animation: timer-countdown var(--timer-duration) linear forwards;
}

@keyframes timer-countdown {
  from { inset: 43%; } /* Starts at 14% visible (43% + 43% = 86% inset) */
  to { inset: 0; } /* Grows to full square */
}
```

**Design rationale:**
- Animation grows from small to large (rather than shrinking) so the colored border is always visible, especially important in triple mode where the letter circle needs to remain visible throughout
- Uses percentage-based insets (43%) for consistent proportional scaling across all screen sizes
- Desktop uses larger padding (6rem vs mobile's 3rem) to create a smaller inner area, making the animation more dramatic and visually similar to mobile
- 43% inset leaves 14% visible at start, creating dramatic growth effect on both mobile and desktop

**Interaction (IDLE state only):**
- Click square N → Set BACK level to N+1
- Click same square again → Toggle dual ↔ triple mode
- Updates level display and resets game stats
- Light haptic feedback (50ms) on each click

### Button System

#### Three Interaction Zones

1. **Left Button (Position)**
   - Location: Left 25% of screen, full height
   - Visual feedback: 2rem vertical strip on left edge
   - Text: "POSITION" (vertical, upright orientation)

2. **Right Button (Color)**
   - Location: Right 25% of screen, full height
   - Visual feedback: 2rem vertical strip on right edge
   - Text: "COLOR" (vertical, upright orientation)

3. **Bottom Button (Letter, triple only)**
   - Location: Center 50% of screen width, bottom 15% of height
   - Visual feedback: 2.5rem horizontal strip on bottom edge
   - Text: "LETTER" (horizontal)

4. **Pause Button (invisible)**
   - Location: Center 50% of screen (between side buttons, above bottom button)
   - No visual element, just click target

#### Button States

| State | Visual | Opacity | Interaction |
|-------|--------|---------|-------------|
| Hidden | `display: none` | 0 | None (before game start) |
| Disabled | Visible, text hidden | Text: 0 | None (during warmup) |
| Ready | Visible, text visible | Text: 1 | Can toggle |
| Pressed | Dark background strip | Text: 1 | Toggle off on re-press |
| Correct | Green flash (500ms) | Text: 1 | After answer check |
| Incorrect | Red flash (500ms) | Text: 1 | After answer check |

#### Button Behavior

**Toggle on Press:**
```javascript
function toggleButton(button, type) {
  if (!active || history.length <= BACK || warmupRounds > 0) return;

  haptic(50); // Light haptic feedback

  lastReply[type] = !lastReply[type]; // Toggle state

  if (lastReply[type]) {
    button.classList.add("pressed");
  } else {
    button.classList.remove("pressed");
  }
}
```

**Flash Feedback:**
```javascript
function flashButton(button, correct) {
  button.classList.remove("pressed");
  button.classList.add(correct ? "correct" : "incorrect");

  haptic(correct ? 100 : 150); // Medium or strong haptic

  setTimeout(() => {
    button.classList.remove("correct", "incorrect");
  }, 500);
}
```

### Top Bar

**Layout:**
```
[Round Display]   [Level Display]   [Brain Progress]
    "42"              "3₂"            [brain + 42/100]
```

#### Round Display
- Shows current round number (1-100) when answerable
- Shows "—" during warmup periods
- Font size: 1.5rem

#### Level Display
- Shows N-back level with subscript for mode
  - Example: `3₂` = 3-back dual mode
  - Example: `5₃` = 5-back triple mode
- **Clickable:** Starts game from IDLE state (with medium haptic, 100ms)
- **During pause:** Shows Phosphor pause icon (unicode \ue39e) at 50% opacity with Phosphor-Light font
- Font size: 3rem, bold

#### Progress Indicator
- **Randomized on page load** - adds variety to each session
- **All icon sets use the same gradient fill system**

**Option 1: Brain (1 icon)**
- Single Phosphor brain icon (\ue74e)
- Gradient fills from bottom to top as progress increases
- Fill range: 88% (bottom) to 8% (top) - adjusted for brain shape

**Option 2: Battery Vertical (5 icons)**
- Icon switches based on progress while gradient fills:
  - 0-19%: Empty battery (\ue7c6)
  - 20-39%: Low battery (\ue7be)
  - 40-59%: Medium battery (\ue7c0)
  - 60-79%: High battery (\ue7c2)
  - 80-100%: Full battery (\ue7c4)
- Gradient continues to fill smoothly even as icon changes
- Fill range: 100% (bottom) to 0% (top) - battery is full height

**Gradient (shared by all):**
- Colors: crimson → orangered → orange → gold (defined in CSS)
- Fill clip-path animates continuously based on progress
- Each icon set has its own fillRange to match its visual shape

**Common elements:**
- Progress text: "42/100"
- Particle fire effect overlay
- Pop animation on perfect rounds

### Modal (Results)

**Trigger:** Game ends after 100 rounds

**Content:**
```
Game Over

Level: 3-back (Dual)
Rounds: 100
Overall: 87%

─────────────────

Position: 90/100 (90%)
Color: 85/100 (85%)
Letter: 86/100 (86%) [if triple]

Consider advancing to a higher level

Tap to close
```

**Level Suggestions:**
- **≥80% accuracy:** "Consider advancing to a higher level" (or "Excellent work at maximum level!" if at 9-back)
- **50-79% accuracy:** "Keep practicing at this level"
- **<50% accuracy:** "Try an easier level for better results" (or "Keep practicing!" if at 1-back)

*Suggestion text is displayed at 85% font size with 70% opacity for subtlety on mobile*

**Dismiss:** Click anywhere on modal → Returns to IDLE state

---

## Visual Feedback Systems

### Progress Indicator System

**Location:** Top right of screen

**Architecture:** All icon sets use identical gradient fill system. The only difference is whether they use 1 icon or multiple icons.

#### Icon Set Configuration

```javascript
const PROGRESS_ICON_SETS = [
  {
    name: "brain",
    icons: ["\ue74e"], // Single icon
    fillRange: { bottom: 88, top: 8 } // Brain doesn't fill full height
  },
  {
    name: "battery-vertical",
    icons: [
      { threshold: 0, icon: "\ue7c6" },   // empty
      { threshold: 0.2, icon: "\ue7be" }, // low
      { threshold: 0.4, icon: "\ue7c0" }, // medium
      { threshold: 0.6, icon: "\ue7c2" }, // high
      { threshold: 0.8, icon: "\ue7c4" }  // full
    ],
    fillRange: { bottom: 100, top: 0 } // Battery is full height
  }
];

// Random selection on page load
const selectedIconSet = PROGRESS_ICON_SETS[Math.floor(Math.random() * PROGRESS_ICON_SETS.length)];
```

#### Update Logic

```javascript
function updateBrainProgress() {
  const progress = Math.min(total / 100, 1);

  // Determine which icon to show
  let currentIcon;
  if (typeof selectedIconSet.icons[0] === "string") {
    // Single icon (brain)
    currentIcon = selectedIconSet.icons[0];
  } else {
    // Multiple icons (battery) - find based on threshold
    currentIcon = selectedIconSet.icons[0].icon;
    for (const iconDef of selectedIconSet.icons) {
      if (progress >= iconDef.threshold) {
        currentIcon = iconDef.icon;
      }
    }
  }

  // Update both base and fill layers
  brainBase.textContent = currentIcon;
  brainFill.textContent = currentIcon;

  // Update gradient fill (same for ALL icon sets)
  const fillInset = bottom - progress * (bottom - top);
  brainFill.style.setProperty('--fill-inset', `${fillInset}%`);
}
```

**Key insight:** Battery icons switch at 20% intervals, but the gradient fill continues smoothly throughout. At 0-19% you see empty battery gradually filling with gradient, at 20-39% you see low battery filling, etc.

#### Adding New Icon Sets

**Single icon example:**
```javascript
{
  name: "heart",
  icons: ["\uXXXX"], // Just one icon
  fillRange: { bottom: 90, top: 10 } // Adjust based on icon shape
}
```

**Multiple icons example:**
```javascript
{
  name: "wifi-signal",
  icons: [
    { threshold: 0, icon: "\uXXXX" },    // no signal
    { threshold: 0.25, icon: "\uXXXX" }, // 1 bar
    { threshold: 0.5, icon: "\uXXXX" },  // 2 bars
    { threshold: 0.75, icon: "\uXXXX" }  // 3 bars
  ],
  fillRange: { bottom: 100, top: 0 } // Full height if icon fills entire bounds
}
```

**Important:** Each icon has different visual bounds within its character space. Set `fillRange` to match where the icon's visual content actually sits (not necessarily 0-100). The gradient is defined in CSS and shared by all icons.

**Pop Animation (on perfect round):**
```css
@keyframes brain-pop {
  0%   { transform: scale(1); }
  30%  { transform: scale(0.9); }
  60%  { transform: scale(1.15); }
  80%  { transform: scale(0.98); }
  100% { transform: scale(1); }
}
```

### Fire Particle System

**Purpose:** Visual gamification - particles rise from brain surface as progress increases

**Implementation:** Canvas-based particle engine running on requestAnimationFrame

#### Particle Properties
```javascript
{
  x: number,        // Horizontal position
  y: number,        // Vertical position (spawns at brain surface)
  vx: number,       // Horizontal velocity (-0.1 to 0.1)
  vy: number,       // Vertical velocity (-0.8 to -1.2, upward)
  size: number,     // Radius (0.4 to 1.6)
  life: number,     // Alpha (1.0 to 0.0)
  decay: number     // Life reduction per frame (0.015 to 0.045)
}
```

#### Intensity Scaling

```javascript
// Intensity ramps cubically for dramatic effect
const intensity = progress > 0 ? Math.pow(progress, 3) * 0.98 + 0.02 : 0;

// Max particles increases with intensity
const maxParticles = progress > 0 ? 5 + Math.floor(130 * intensity) : 0;

// Spawn chance per frame = intensity
if (particles.length < maxParticles && Math.random() < intensity) {
  // Spawn particle at brain surface
}
```

**At 1% progress:** ~2% intensity, tiny particles, rare spawns
**At 50% progress:** ~12% intensity, moderate particles
**At 100% progress:** ~100% intensity, maximum particles, frequent spawns

#### Color Transitions

Particles change color as they fade:
- **Life > 60%:** White (rgba(255, 255, 255, alpha))
- **Life 30-60%:** Orange (rgba(255, 160, 20, alpha))
- **Life < 30%:** Red (rgba(220, 40, 0, alpha))

#### Performance Considerations

- Uses `window.devicePixelRatio` for crisp rendering on high-DPI screens
- Particles automatically removed when life ≤ 0
- Canvas cleared each frame (no trails)
- Blend mode: `screen` for glow effect

### Haptic Feedback

**Implementation:** `haptic.js` module with cross-platform support

**iOS Support:** Creates hidden checkbox/label elements and triggers iOS haptic through label click
**Android Support:** Uses Vibration API directly

**Trigger Durations:**

| Event | Duration | Intensity |
|-------|----------|-----------|
| Level selection (square click) | 50ms | Light |
| Game start (level display click) | 100ms | Medium |
| Button press (answer) | 50ms | Light |
| Correct answer | 100ms | Medium |
| Incorrect answer | 150ms | Strong |
| Perfect round | 200ms | Celebration |
| Pause | 50ms | Light |
| Resume | 100ms | Medium |
| Game end | 150ms | Strong |

**Usage:**
```javascript
import { haptic } from "./haptic.js";

// Trigger haptic feedback
haptic(100); // 100ms vibration
```

### Color Feedback on Buttons

**Pressed State:**
- Edge strip turns dark (`var(--dark)`)
- Button text turns light (`var(--light)`)
- Persists until toggled off or answer checked

**Correct Answer:**
- Edge strip turns green (`var(--sd-green)` = #859900)
- Button text turns white
- Flashes for 500ms

**Incorrect Answer:**
- Edge strip turns red (`var(--sd-red)` = #dc322f)
- Button text turns white
- Flashes for 500ms

### Letter Display (Triple Mode)

**Appearance:** Circular badge overlay on active square

**Styling:**
- Circular container (4rem diameter)
- Semi-transparent background (rgba(141, 134, 115, 0.85))
- Letter text (2.5rem, bold)
- Letter color matches square's active color
- Drop shadow for depth
- Centered on square using absolute positioning

**Lifecycle:**
- Created when square is rendered
- Removed when square is unrendered
- Animates with square's timer countdown

---

## Timing & Animation

### Timing Constants

```javascript
const CYCLE_LENGTH = 20;                    // Rounds per cycle
const TOTAL_TIME = () => triple ? 5000 : 3000;  // Duration per round (ms)
const RESET_TIME = () => 300;               // Blank period between rounds (ms)
```

**Full Round Duration:**
- **Dual mode:** 3300ms total (3000ms display + 300ms reset)
- **Triple mode:** 5300ms total (5000ms display + 300ms reset)

**Game Duration:**
- **Dual mode:** 100 rounds × 3.3s = 5.5 minutes
- **Triple mode:** 100 rounds × 5.3s = 8.8 minutes

### Animation Timing Breakdown

**Single Round Timeline:**

```
T=0ms      Previous round ends, nextRound() called
           ├─ Unrender previous square (instant)
           ├─ Check answers from previous round (instant)
           │  └─ Flash buttons green/red (500ms duration)
           └─ Generate new step (instant)

T=300ms    Stats update completes
           RESET_TIME begins (blank period)

T=300ms    RESET_TIME ends
           ├─ New square rendered
           ├─ Color animation begins
           ├─ Letter appears (if triple)
           └─ Timer countdown animation starts

T=600ms    Perfect round celebration (if applicable)
           └─ Haptic + brain pop animation

T=3300ms   Round ends (dual) or T=5300ms (triple)
           Auto-advance to next round
```

**Button Flash Timing:**

```javascript
flashButton(button, correct) {
  // T=0ms: Add correct/incorrect class
  button.classList.add(correct ? "correct" : "incorrect");
  haptic(correct ? 100 : 150);

  // T=500ms: Remove feedback class
  setTimeout(() => {
    button.classList.remove("correct", "incorrect");
  }, 500);
}
```

**Perfect Round Celebration:**

```javascript
if (isPerfect) {
  setTimeout(() => {
    haptic(200);
    brain.classList.add("pop"); // 600ms animation
    setTimeout(() => brain.classList.remove("pop"), 600);
  }, 600); // Delay to happen after feedback flashes
}
```

### CSS Animation Durations

**Timer Countdown (square border):**
```css
animation: timer-countdown var(--timer-duration) linear forwards;
/* --timer-duration = 3s or 5s */
/* Grows from small (inset: 43%) to full square (inset: 0) */
/* Percentage-based for consistent scaling across screen sizes */
```

**Square Shake (game feel):**
```css
.square.was-active {
  animation: shake 0.15s ease-in-out;
}
```

**Implementation pattern:**
1. When `unrender()` is called (timer complete), `.active` is removed and `.was-active` is added
2. Shake animation triggers immediately on `.was-active` class
3. After 200ms, `.was-active` is cleaned up via setTimeout
4. This allows shake to play precisely when color fills up, even after `.active` removal

**Benefits:**
- Shake plays at exact moment of timer completion
- No timing/delay calculations needed
- Clean separation between active state and feedback state
- Adds tactile "juice" to game interactions

**Brain Pop:**
```css
animation: brain-pop 0.6s ease-out;
```

**Square Shake:**
```css
animation: shake 0.15s ease-in-out;
/* Triggered via .was-active class on unrender, plays precisely when timer completes */
```

**Button Feedback:**
```css
transition: background-color 0.3s ease;
```

**Button Text Fade:**
```css
transition: opacity 0.3s ease;
```

---

## Code Organization Patterns

### Module Structure (nb.js)

```javascript
// 1. Imports
import { haptic } from "./haptic.js";
import { FireSystem } from "./fire.js";

// 2. State Variables (module scope)
let BACK = 1;
let triple = false;
// ... etc

// 3. Constants
const CYCLE_LENGTH = 20;
const colors = [...];
const letters = [...];

// 4. DOM Element References
const levelDisplay = document.getElementById("level-display");
// ... etc

// 5. Utility Functions
function resetReply() { ... }
function resetEverything() { ... }

// 6. UI Update Functions
function updateLevelDisplay() { ... }
function updateButtonVisibility() { ... }

// 7. Event Handlers
squares.forEach((square, idx) => {
  square.addEventListener("click", ...);
});

// 8. Game Logic Functions
function startGame() { ... }
function togglePause() { ... }
function endGame() { ... }
function nextRound() { ... }
function checkAnswers() { ... }

// 9. Generation Functions
function generateStep(prev) { ... }

// 10. Rendering Functions
function render(step) { ... }
function unrender(step) { ... }

// 11. Button Handlers
function toggleButton(button, type) { ... }
function flashButton(button, correct) { ... }

// 12. Stats Functions
function updateStatsDisplay() { ... }
function updateBrainProgress() { ... }
function showResults() { ... }

// 13. Fire System Initialization
FireSystem.init();

// 14. Game Initialization
updateLevelDisplay();
```

### Naming Conventions

**Variables:**
- `camelCase` for regular variables: `correctPosC`, `lastReply`
- `SCREAMING_SNAKE_CASE` for constants: `CYCLE_LENGTH`, `TOTAL_TIME`
- `PascalCase` for objects/classes: `FireSystem`

**Functions:**
- Verb-based names: `resetEverything()`, `updateBrainProgress()`
- Boolean getters: `canAnswer` (not function in current code)

**DOM Elements:**
- Descriptive suffixes: `buttonLeft`, `modalContent`, `levelDisplay`

**CSS Classes:**
- Kebab-case: `.square-inner`, `.brain-container`, `.letter-circle`
- State classes: `.active`, `.pressed`, `.correct`, `.incorrect`, `.hidden`

### Functional Patterns

**State Management:**
- Module-scope variables for game state
- No global namespace pollution (ES6 module)
- Single source of truth for each state value

**Event Handling:**
- Event listeners set up once at module load
- Use guards/early returns to prevent unwanted actions
- `e.stopPropagation()` to prevent bubbling where needed

**Animation:**
- CSS animations for visual effects
- JavaScript only controls timing and state changes
- `requestAnimationFrame` for particle system

**Side Effects:**
- Clear separation: functions that update state vs. functions that update UI
- UI updates often use `setTimeout` to sequence after state changes
- Haptic feedback triggered alongside visual feedback

---

## Future Plans

See `GAMIFICATION_PLAN.md` for detailed roadmap. Key features planned:

### Phase 1: Foundation (Completed ✅)
- Score tracking system
- Haptic feedback (✅ implemented)

### Phase 2: Visual Progress (Completed ✅)
- Brain icon integration (✅ implemented)
- Score display with Sixtyfour font

### Phase 3: Visual Celebrations (In Progress 🔄)
- Canvas particle system (✅ fire particles implemented)
- Additional celebration triggers needed:
  - Cycle completion effects
  - New high score effects
  - 100% accuracy milestone effects

### Phase 4: High Scores Display
- Top 5 scores in localStorage
- High score modal section
- Personal best indicators

### Phase 5: Progress Milestones
- Achievement system
- Toast notifications
- Milestone storage

### Phase 6: Additional Polish
- Enhanced pause screen with stats
- Sound effects (optional)
- Keyboard shortcuts for desktop

### Potential Future Features (Not Yet Planned)
- Auto-level advancement (from old.js)
  - ≥80% accuracy → increase level
  - ≥50% accuracy → maintain level
  - <50% accuracy → decrease level
  - ✅ **Alternative implemented:** Manual advancement with suggestions in results modal
- Statistics persistence across sessions
- Training history/charts
- Customizable color schemes
- Accessibility options

---

## Development Notes

### Design Decisions

**Why no auto-leveling in current version?**
- Playing more than 100 rounds can be mentally exhausting
- User-controlled progression gives better sense of achievement
- Old version had auto-leveling, but was removed for better UX
- **Alternative implemented:** Results modal shows suggestions based on performance
  - ≥80%: Suggest advancing (if not at max level)
  - 50-79%: Suggest staying at current level
  - <50%: Suggest trying easier level (if not at min level)
  - Text is small and subtle (85% size, 70% opacity) for mobile viewing

**Why implicit warmup on start vs explicit on resume?**
- On start: `history.length <= BACK` naturally prevents answering
- On resume: Explicit `warmupRounds` gives user clear fresh start
- Both achieve same effect with minimal code

**Why fire particles from the start (progress > 0)?**
- Immediate gamification feedback
- Builds anticipation as intensity increases
- Would be boring if nothing happened until 50% progress

**Why 100 rounds (5 cycles)?**
- Long enough to be meaningful training session
- Short enough to not cause burnout
- ~6-9 minutes of focused play

**Why position + color (not position + audio)?**
- Visual-only requirement from user preference
- Most n-back apps use audio, this differentiates
- Accessible without headphones

### Known Issues & Quirks

**Warmup Counter Timing:**
- During last warmup round, technically `warmupRounds` becomes 0
- Button presses would be accepted by `toggleButton` guard
- But answers are ignored because `lastRoundWasWarmup` prevents checking
- In practice: Users don't press because button text is hidden
- Could be cleaner: Store `canAnswer` as module variable and check that

**Square Click During Game:**
- Square clicks are for level selection (IDLE state only)
- `if (active) return` prevents clicks during game
- No visual feedback that squares are "disabled" during play
- Sufficient because user focus is on buttons, not grid

**Modal Dismiss:**
- Click anywhere on modal to close
- No explicit "Close" button
- Mentioned in text: "Tap to close"
- Works well on mobile but could be clearer

**Stats Calculation Timing:**
- Statistics update 300ms after answer check
- This is to sequence after button flashes (500ms)
- But update happens before flashes complete
- Could cause brain progress to update while user is watching button feedback
- In practice: Not noticeable because brain is in peripheral vision

### Testing Checklist

**State Transitions:**
- [ ] IDLE → STARTING → RUNNING-WARMUP → RUNNING-ANSWERABLE → END
- [ ] RUNNING-ANSWERABLE → PAUSED → RUNNING-WARMUP → RUNNING-ANSWERABLE
- [ ] Level selection clicks during IDLE
- [ ] Toggle dual/triple mode

**Warmup Behavior:**
- [ ] First BACK rounds: Button text hidden, cannot press
- [ ] Round BACK+1: Button text appears, can press
- [ ] Pause and resume: BACK rounds warmup again
- [ ] Statistics preserved across pause

**Answer Checking:**
- [ ] Correct matches: Green flash, stat increases
- [ ] Correct non-matches: Green flash, stat increases
- [ ] Incorrect matches: Red flash, no stat increase
- [ ] Incorrect non-matches: Red flash, no stat increase
- [ ] Perfect round: Brain pop + celebration haptic

**Visual Feedback:**
- [ ] Timer countdown animation on squares
- [ ] Letter circles appear in triple mode
- [ ] Button pressed states toggle correctly
- [ ] Button flashes green/red appropriately
- [ ] Brain fills smoothly from 0/100 to 100/100
- [ ] Fire particles increase with progress

**Haptic Feedback:**
- [ ] iOS: Light haptic on button press
- [ ] Android: Vibration on button press
- [ ] Correct/incorrect haptic on answer check
- [ ] Celebration haptic on perfect round
- [ ] Pause/resume/end haptics

**Edge Cases:**
- [ ] 1-back mode (minimum level)
- [ ] 9-back mode (maximum level)
- [ ] Pause on first round (no history yet)
- [ ] Complete exactly 100 rounds (game ends correctly)
- [ ] Rapid button pressing (debouncing not needed, toggles work)

### Browser Compatibility

**Tested:**
- Safari iOS (primary target)
- Chrome Android
- Safari macOS
- Chrome desktop

**CSS Features:**
- CSS Grid (✅ all modern browsers)
- CSS Custom Properties (✅ all modern browsers)
- CSS Animations (✅ all modern browsers)
- `clip-path` (✅ all modern browsers)

**JavaScript Features:**
- ES6 Modules (✅ all modern browsers)
- Arrow functions (✅ all modern browsers)
- Template literals (✅ all modern browsers)
- `async`/`await` (not used, but supported)

**APIs:**
- Canvas 2D (✅ all modern browsers)
- Vibration API (⚠️ iOS needs workaround, implemented)
- Service Workers (PWA, ✅ supported)

### Performance Notes

**Fire Particle System:**
- Uses `requestAnimationFrame` for 60fps
- Automatically scales canvas for device pixel ratio
- Particles cap at ~135 maximum
- No performance issues observed on tested devices
- Could optimize further for very low-end devices:
  - Reduce max particles on mobile detection
  - Skip every other frame if FPS drops
  - Disable particles completely (add setting)

**DOM Updates:**
- Minimal DOM manipulation per round
- Class toggles instead of style recalculations
- CSS animations instead of JavaScript-driven
- No layout thrashing observed

**Memory:**
- History array grows to ~100 objects max
- Each object: 3 numbers (position, color, letter)
- Total memory footprint: Negligible (<1KB for history)
- No memory leaks detected

### File Size

- `index.html`: ~2.7 KB
- `nb.js`: ~14.0 KB (after extracting FireSystem)
- `style.css`: ~10.0 KB (after cleanup)
- `haptic.js`: ~1.8 KB
- `fire.js`: ~3.3 KB
- **Total (excluding fonts/icons):** ~31.8 KB

Excellent for a PWA - loads instantly even on slow connections.

---

## Quick Reference

### Starting a Game

1. Select level: Click square (1-9)
2. Toggle mode: Click same square again (dual ↔ triple)
3. Start: Click level display
4. Wait 1 second → Game begins

### Playing

- **Position match?** → Press left side
- **Color match?** → Press right side
- **Letter match?** (triple only) → Press bottom
- Press again to toggle off
- **Pause:** Press center area
- **Resume:** Press center area again

### Understanding Feedback

- **Button text hidden** → Warmup period, can't answer yet
- **Button text visible** → Can answer now
- **Round display "—"** → Warmup period
- **Round display number** → Currently on round N
- **Green flash** → Correct answer!
- **Red flash** → Incorrect answer
- **Brain pop** → Perfect round (all correct)!

### Interpreting Results

- **Position %** → How well you remembered positions
- **Color %** → How well you remembered colors
- **Letter %** → How well you remembered letters (triple only)
- **Overall %** → Combined accuracy
- **≥80%** → Excellent, consider increasing level
- **50-80%** → Good, stay at this level
- **<50%** → Challenging, consider decreasing level

---

## Glossary

- **N-back:** Remember if current stimulus matches one from N steps ago
- **BACK:** The N value (1-9), number of steps to look back
- **Dual mode:** Track 2 dimensions (position + color)
- **Triple mode:** Track 3 dimensions (position + color + letter)
- **Round:** Single display of a square with color (and letter)
- **Cycle:** 20 rounds (used for tracking progress, 5 cycles = 100 rounds)
- **Warmup:** Period where user cannot answer (first N rounds)
- **Match:** Current dimension value equals value from N rounds ago
- **Perfect round:** All dimensions answered correctly
- **History:** Array of all rounds played this game
- **Step:** Another term for round (used in code)

---

**End of Documentation**

*This document is comprehensive and should remain accurate as long as the core game mechanics remain unchanged. Update this file when making significant architectural or gameplay changes.*

*Last major update: 2026-02-10 - Initial comprehensive documentation*
