// Import modules
import { haptic } from "./haptic.js";
import { FireSystem } from "./fire.js";
import { Fireworks } from "./fireworks.js";
import * as Modals from "./modals.js";
import { get, set } from "./lib/idb-keyval.js";

// Game state
let BACK = 1;
let triple = false;
let history = [];
let correctPosC = 0;
let correctColC = 0;
let correctLetC = 0;
let total = 0;
let perfectRounds = 0; // Track perfect rounds for fire gradient
let roundResults = []; // Track per-round correctness for visualization
let active = false;
let lastReply = { position: false, color: false, letter: false };
let combo = -1;
let starting = true;
let paused = false;
let nextRoundTimeout = null;
let renderTimeout = null;
let warmupRounds = 0;
let lastRoundWasWarmup = true; // Track if previous round was warmup

// Session history
let sessions = [];

const TOTAL_TIME = () => (triple ? 5000 : 3000);
const RESET_TIME = () => 300;

// Session storage functions
async function loadSessions() {
  const stored = await get("sessions");
  sessions = stored || [];
}

async function saveSessions() {
  await set("sessions", sessions);
}

async function addSession(stats) {
  const pctPos = stats.total > 0 ? (stats.correctPosC / stats.total) * 100 : 0;
  const pctCol = stats.total > 0 ? (stats.correctColC / stats.total) * 100 : 0;
  const pctLet =
    stats.triple && stats.total > 0
      ? (stats.correctLetC / stats.total) * 100
      : 0;

  // Encode round results compactly: each round as a number 0-7 (3 bits)
  // Bit 0: position, Bit 1: color, Bit 2: letter
  const encodedResults = stats.roundResults
    ? stats.roundResults.map((r) => {
        let val = 0;
        if (r.position) val |= 1;
        if (r.color) val |= 2;
        if (r.letter) val |= 4;
        return val;
      })
    : [];

  sessions.push({
    level: stats.BACK,
    triple: stats.triple,
    pctPos,
    pctCol,
    pctLet: stats.triple ? pctLet : null,
    date: Date.now(),
    roundResults: encodedResults, // Store compact round-by-round results
  });

  await saveSessions();
  updateSessionStars(); // Update stars after saving
}

// Progress icon configurations
// All icon sets use the same gradient fill system (defined in CSS)
const PROGRESS_ICON_SETS = [
  {
    name: "brain",
    icons: ["\ue74e"], // Single icon
    fillRange: { bottom: 88, top: 8 }, // Brain doesn't fill full height
  },
  {
    name: "battery-vertical",
    icons: [
      { threshold: 0, icon: "\ue7c6" }, // empty
      { threshold: 0.2, icon: "\ue7be" }, // low
      { threshold: 0.4, icon: "\ue7c0" }, // medium
      { threshold: 0.6, icon: "\ue7c2" }, // high
      { threshold: 0.8, icon: "\ue7c4" }, // full
    ],
    fillRange: { bottom: 96, top: 0 }, // Battery starts at 96
  },
];

// Randomly select an icon set on page load
const selectedIconSet =
  PROGRESS_ICON_SETS[Math.floor(Math.random() * PROGRESS_ICON_SETS.length)];

// Colors and letters
const colors = [
  "--color1",
  "--color2",
  "--color3",
  "--color4",
  "--color5",
  "--color6",
  "--color7",
  "--color8",
  "--color9",
];

const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J"];

// DOM elements
const levelDisplay = document.getElementById("level-display");
const fillup = document.getElementById("fillup");
const roundDisplay = document.getElementById("round-display");
const buttonLeft = document.getElementById("button-left");
const buttonRight = document.getElementById("button-right");
const buttonBottom = document.getElementById("button-bottom");
const buttonPause = document.getElementById("button-pause");
const brainBase = document.querySelector(".brain-base");
const brainFill = document.querySelector(".brain-fill");
const progressText = document.querySelector(".progress-text");
const sessionStars = document.getElementById("session-stars");
const brainProgressFill = document.querySelector(".brain-progress-fill");
const brainFireFill = document.querySelector(".brain-fire-fill");

// Initialize squares
const squares = Array.from(document.querySelectorAll(".square"));

// Reset functions
function resetReply() {
  lastReply = { position: false, color: false, letter: false };
}

function resetEverything() {
  history = [];
  correctPosC = 0;
  correctLetC = 0;
  correctColC = 0;
  combo = -1;
  total = 0;
  perfectRounds = 0;
  roundResults = [];
  lastRoundWasWarmup = true;
  resetReply();
  updateBrainProgress(); // Reset brain to 0
}

// Square click handlers (for level selection)
squares.forEach((square, idx) => {
  square.addEventListener("click", (ev) => {
    if (active) return;

    // Light haptic feedback on level selection
    haptic(50);

    const newBack = idx + 1;
    if (BACK === newBack) {
      triple = !triple;
    }
    BACK = newBack;

    updateLevelDisplay();
    resetEverything();
    ev.stopPropagation();
  });
});

function updateLevelDisplay() {
  const sub = triple ? "3" : "2";
  levelDisplay.innerHTML = `${BACK}<sub>${sub}</sub>`;
  levelDisplay.style.fontFamily = ""; // Reset to default font
}

// Level display and fillup click (start game)
levelDisplay.addEventListener("click", () => {
  if (active || paused) return;

  // Medium haptic feedback on game start
  haptic(100);

  startGame();
});

fillup.addEventListener("click", () => {
  if (active || paused) return;

  // Medium haptic feedback on game start
  haptic(100);

  startGame();
});

// Start game
function startGame() {
  active = true;
  starting = true;
  resetEverything();

  // Clear info icon from round display
  roundDisplay.textContent = "";
  roundDisplay.style.fontFamily = "";
  roundDisplay.style.cursor = "";

  // Show buttons
  buttonLeft.classList.remove("hidden");
  buttonRight.classList.remove("hidden");
  buttonPause.classList.remove("hidden");
  if (triple) {
    buttonBottom.classList.remove("hidden");
  }

  // Hide button text initially
  updateButtonVisibility();

  // Start first round
  setTimeout(() => {
    starting = false;
    nextRound();
  }, 1000);
}

// Pause/Resume game
function togglePause() {
  if (starting) return;

  if (!paused && active) {
    // Pause the game
    paused = true;
    active = false;

    // Light haptic on pause
    haptic(50);

    // Clear all timers
    if (nextRoundTimeout) clearTimeout(nextRoundTimeout);
    if (renderTimeout) clearTimeout(renderTimeout);

    // Clear current animation
    squares.forEach((sq) => {
      sq.classList.remove("active");
      sq.style.removeProperty("--active-color");
      sq.style.removeProperty("--timer-duration");
      const letterCircle = sq.querySelector(".letter-circle");
      if (letterCircle) {
        letterCircle.remove();
      }
    });

    // Clear button states (pressed, correct, incorrect)
    buttonLeft.classList.remove("pressed", "correct", "incorrect");
    buttonRight.classList.remove("pressed", "correct", "incorrect");
    buttonBottom.classList.remove("pressed", "correct", "incorrect");

    // Hide button text during pause
    updateButtonVisibility(false);

    // Reset reply state
    resetReply();

    // Show pause indicator (Phosphor pause icon)
    levelDisplay.textContent = "\ue39e";
    levelDisplay.style.fontFamily = "Phosphor-Light";
    levelDisplay.style.opacity = "0.5";

    // Show restart icon in round display
    roundDisplay.textContent = "\ue038"; // arrow-counter-clockwise
    roundDisplay.style.fontFamily = "Phosphor-Light";
    roundDisplay.style.cursor = "pointer";
    roundDisplay.style.opacity = "1";

    // Show pause stats modal (pass resumeGame as callback)
    Modals.showPauseStats(
      {
        BACK,
        triple,
        total,
        correctPosC,
        correctColC,
        correctLetC,
        roundResults,
      },
      resumeGame,
    );
  } else if (paused) {
    // Resume the game
    resumeGame();
  }
}

// Resume game from pause
function resumeGame() {
  paused = false;
  active = true;

  // Medium haptic on resume
  haptic(100);

  // Restore level display
  updateLevelDisplay();
  levelDisplay.style.opacity = "1";

  // Restore round display
  roundDisplay.style.fontFamily = "";
  roundDisplay.style.cursor = "";
  roundDisplay.style.opacity = "";

  // Start warmup period - need BACK rounds before accepting answers
  warmupRounds = BACK;
  lastRoundWasWarmup = true; // Treat as if coming from warmup

  // Continue with next round
  nextRound();
}

// End game
async function endGame() {
  paused = false;
  active = false;

  // Strong haptic on game end
  haptic(150);

  // Clear all timers
  if (nextRoundTimeout) clearTimeout(nextRoundTimeout);
  if (renderTimeout) clearTimeout(renderTimeout);

  // Hide and reset buttons
  buttonLeft.classList.add("hidden");
  buttonLeft.classList.remove("pressed", "correct", "incorrect");
  buttonRight.classList.add("hidden");
  buttonRight.classList.remove("pressed", "correct", "incorrect");
  buttonBottom.classList.add("hidden");
  buttonBottom.classList.remove("pressed", "correct", "incorrect");
  buttonPause.classList.add("hidden");

  // Clear active states
  squares.forEach((sq) => {
    sq.classList.remove("active");
    sq.style.removeProperty("--active-color");
    sq.style.removeProperty("--timer-duration");
    const letterCircle = sq.querySelector(".letter-circle");
    if (letterCircle) {
      letterCircle.remove();
    }
  });

  // Restore level display
  updateLevelDisplay();
  levelDisplay.style.opacity = "1";

  // Restore round display
  roundDisplay.style.fontFamily = "";
  roundDisplay.style.cursor = "";
  roundDisplay.style.opacity = "";

  // Save session if completed 100 rounds
  if (total === 100) {
    await addSession({
      BACK,
      triple,
      total,
      correctPosC,
      correctColC,
      correctLetC,
    });
  }

  // Show results
  Modals.showResults({
    BACK,
    triple,
    total,
    correctPosC,
    correctColC,
    correctLetC,
    roundResults,
  });
}

// Restart game (return to IDLE state)
function restartGame() {
  if (!paused) return; // Only works during pause

  // Dismiss any open modals
  Modals.hideModal();

  // Clear pause state
  paused = false;
  active = false;

  // Medium haptic on restart
  haptic(100);

  // Clear all timers
  if (nextRoundTimeout) clearTimeout(nextRoundTimeout);
  if (renderTimeout) clearTimeout(renderTimeout);

  // Hide and reset buttons
  buttonLeft.classList.add("hidden");
  buttonLeft.classList.remove("pressed", "correct", "incorrect");
  buttonRight.classList.add("hidden");
  buttonRight.classList.remove("pressed", "correct", "incorrect");
  buttonBottom.classList.add("hidden");
  buttonBottom.classList.remove("pressed", "correct", "incorrect");
  buttonPause.classList.add("hidden");

  // Clear active states
  squares.forEach((sq) => {
    sq.classList.remove("active", "was-active");
    sq.style.removeProperty("--active-color");
    sq.style.removeProperty("--timer-duration");
    const letterCircle = sq.querySelector(".letter-circle");
    if (letterCircle) {
      letterCircle.remove();
    }
  });

  // Restore level display
  updateLevelDisplay();
  levelDisplay.style.opacity = "1";

  // Restore round display
  roundDisplay.textContent = "";
  roundDisplay.style.fontFamily = "";
  roundDisplay.style.cursor = "";
  roundDisplay.style.opacity = "";

  // Reset game state (but keep BACK and triple settings)
  resetEverything();

  // Show info icon again
  updateRoundDisplay();
}

// Pause button
buttonPause.addEventListener("mousedown", (e) => {
  e.preventDefault();
  togglePause();
});

// Round display click (restart during pause, info in idle)
roundDisplay.addEventListener("click", (e) => {
  if (paused) {
    e.stopPropagation();
    restartGame();
  } else if (!active) {
    e.stopPropagation();
    Modals.showInstructions();
  }
});

// Progress icon click (show session history)
const brainContainer = document.querySelector(".brain-container");
brainContainer.addEventListener("click", (e) => {
  if (!active && !paused) {
    e.stopPropagation();
    haptic(50);
    Modals.showHistory(sessions);
  }
});

// Update button text visibility based on history length and warmup state
function updateButtonVisibility(canAnswer) {
  const leftSpan = buttonLeft.querySelector("span");
  const rightSpan = buttonRight.querySelector("span");
  const bottomSpan = buttonBottom.querySelector("span");

  if (leftSpan) leftSpan.style.opacity = canAnswer ? "1" : "0";
  if (rightSpan) rightSpan.style.opacity = canAnswer ? "1" : "0";
  if (triple && bottomSpan) {
    bottomSpan.style.opacity = canAnswer ? "1" : "0";
  }
}

// Generate step
function generateStep(prev) {
  const randomIndex = Math.floor(Math.random() * 9);
  let position, color, letter;

  if (prev && Math.random() < 0.3) {
    // 30% chance to match previous
    position = Math.random() < 0.5 ? prev.position : randomIndex;
    color = Math.random() < 0.5 ? prev.color : Math.floor(Math.random() * 9);
    letter =
      triple && Math.random() < 0.5
        ? prev.letter
        : Math.floor(Math.random() * 9);
  } else {
    position = randomIndex;
    color = Math.floor(Math.random() * 9);
    letter = Math.floor(Math.random() * 9);
  }

  return { position, color, letter };
}

// Render step
function render(step) {
  const square = squares[step.position];
  const colorVar = colors[step.color];
  const colorValue = getComputedStyle(
    document.documentElement,
  ).getPropertyValue(colorVar);

  // Set active square
  square.classList.add("active");
  square.style.setProperty("--active-color", colorValue);
  square.style.setProperty("--timer-duration", `${TOTAL_TIME() / 1000}s`);

  // Show letter if triple mode
  if (triple) {
    const letterCircle = document.createElement("div");
    letterCircle.className = "letter-circle";
    letterCircle.textContent = letters[step.letter];
    letterCircle.style.color = colorValue;
    square.appendChild(letterCircle);
  }
}

// Unrender previous step
function unrender(step) {
  const square = squares[step.position];
  square.classList.remove("active");
  square.classList.add("was-active"); // Add for shake animation
  square.style.removeProperty("--active-color");
  square.style.removeProperty("--timer-duration");

  // Remove letter circle if exists
  const letterCircle = square.querySelector(".letter-circle");
  if (letterCircle) {
    letterCircle.remove();
  }

  // Clean up was-active class after shake completes
  setTimeout(() => {
    square.classList.remove("was-active");
  }, 200);
}

// Next round
function nextRound() {
  if (!active || paused) return;

  // Unrender previous step
  if (history.length >= 1) {
    const prev = history[history.length - 1];
    unrender(prev);
  }

  // Capture warmup state for THIS round BEFORE any changes
  const isWarmup = warmupRounds > 0;

  // Check answers from previous round (only if PREVIOUS round was answerable)
  if (!lastRoundWasWarmup && history.length > BACK) {
    checkAnswers();
  }

  // Decrement warmup counter AFTER checking
  if (warmupRounds > 0) {
    warmupRounds--;
  }

  // Check if we've completed 100 rounds
  if (total >= 100) {
    endGame();
    return;
  }

  // Generate next step
  let step;
  if (history.length >= BACK) {
    const previousIdx = history.length - BACK;
    const prev = history[previousIdx];
    step = generateStep(prev);
  } else {
    step = generateStep();
  }

  history.push(step);

  // Determine if user can answer THIS round (based on pre-decrement warmup state)
  const canAnswer = !isWarmup && history.length > BACK;

  // Update button visibility
  updateButtonVisibility(canAnswer);

  // Update round display (only count answerable rounds, not warmup/initial rounds)
  if (canAnswer) {
    roundDisplay.textContent = `${total + 1}`;
  } else {
    roundDisplay.textContent = "—";
  }

  // Reset reply state for this round
  resetReply();

  // Remember warmup state for next round
  lastRoundWasWarmup = isWarmup;

  // Render after reset time
  renderTimeout = setTimeout(() => {
    if (active && !paused) {
      render(step);

      // Auto advance to next round
      nextRoundTimeout = setTimeout(() => {
        if (active && !paused) {
          nextRound();
        }
      }, TOTAL_TIME());
    }
  }, RESET_TIME());
}

// Answer handlers - toggle button state
function toggleButton(button, type) {
  if (!active || history.length <= BACK || warmupRounds > 0) return;

  // Light haptic feedback on button press
  haptic(50);

  lastReply[type] = !lastReply[type];

  if (lastReply[type]) {
    button.classList.add("pressed");
  } else {
    button.classList.remove("pressed");
  }
}

buttonLeft.addEventListener("mousedown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleButton(buttonLeft, "position");
});

buttonRight.addEventListener("mousedown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleButton(buttonRight, "color");
});

buttonBottom.addEventListener("mousedown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleButton(buttonBottom, "letter");
});

// Check answers at end of round and provide feedback
function checkAnswers() {
  if (history.length < 1 + BACK) return;
  if (warmupRounds > 0) return; // Safety: never check during warmup

  total++;

  const currentIdx = history.length - 1;
  const prevIdx = currentIdx - BACK;
  const current = history[currentIdx];
  const prev = history[prevIdx];

  // Check position
  const posMatch = current.position === prev.position;
  const posCorrect =
    (posMatch && lastReply.position) || (!posMatch && !lastReply.position);
  if (posCorrect) correctPosC++;
  flashButton(buttonLeft, posCorrect);

  // Check color
  const colMatch = current.color === prev.color;
  const colCorrect =
    (colMatch && lastReply.color) || (!colMatch && !lastReply.color);
  if (colCorrect) correctColC++;
  flashButton(buttonRight, colCorrect);

  // Check letter (if triple mode)
  let letCorrect = true; // Default true for dual mode
  if (triple) {
    const letMatch = current.letter === prev.letter;
    letCorrect =
      (letMatch && lastReply.letter) || (!letMatch && !lastReply.letter);
    if (letCorrect) correctLetC++;
    flashButton(buttonBottom, letCorrect);
  }

  // Store round result for visualization
  roundResults.push({
    position: posCorrect,
    color: colCorrect,
    letter: triple ? letCorrect : null,
  });

  // Perfect round celebration
  const isPerfect = posCorrect && colCorrect && letCorrect;
  if (isPerfect) {
    perfectRounds++; // Increment fire gradient progress
    setTimeout(() => {
      haptic(200); // Celebration haptic
      // Brain pop animation
      const brainIcon = document.querySelector(".brain-container");
      brainIcon.classList.add("pop");
      setTimeout(() => brainIcon.classList.remove("pop"), 600);
    }, 600); // After feedback flashes
  }

  // Update stats after flash
  setTimeout(() => {
    updateStatsDisplay();

    // Celebrate milestones (20, 40, 60, 80)
    if (total === 20 || total === 40 || total === 60 || total === 80) {
      Fireworks.triggerAtElement(levelDisplay);
    }
  }, 300);
}

function flashButton(button, correct) {
  button.classList.remove("pressed");
  button.classList.add(correct ? "correct" : "incorrect");

  // Haptic feedback: medium for correct, strong for incorrect
  haptic(correct ? 100 : 150);

  setTimeout(() => {
    button.classList.remove("correct", "incorrect");
  }, 500);
}

function updateStatsDisplay() {
  updateBrainProgress();
}

function updateBrainProgress() {
  const maxRounds = 100;
  const progress = Math.min(total / maxRounds, 1);
  const fireProgress = Math.min(perfectRounds / maxRounds, 1);

  // Determine which icon to show based on progress
  let currentIcon;
  if (typeof selectedIconSet.icons[0] === "string") {
    // Single icon (brain)
    currentIcon = selectedIconSet.icons[0];
  } else {
    // Multiple icons (battery) - find current based on threshold
    currentIcon = selectedIconSet.icons[0].icon;
    for (const iconDef of selectedIconSet.icons) {
      if (progress >= iconDef.threshold) {
        currentIcon = iconDef.icon;
      }
    }
  }

  // Update all layers to show current icon
  brainBase.textContent = currentIcon;
  brainProgressFill.textContent = currentIcon;
  brainFireFill.textContent = currentIcon;

  // Calculate insets for both gradients
  const bottom = selectedIconSet.fillRange.bottom;
  const top = selectedIconSet.fillRange.top;

  // Overall progress gradient (always increases)
  const progressInset = bottom - progress * (bottom - top);
  brainProgressFill.style.setProperty("--progress-inset", `${progressInset}%`);

  // Fire gradient (only increases on perfect rounds)
  const fireInset = bottom - fireProgress * (bottom - top);
  brainFireFill.style.setProperty("--fire-inset", `${fireInset}%`);

  // Update fire particles based on fire progress (not overall progress)
  FireSystem.update(fireProgress, fireInset);

  progressText.textContent = `${total}/${maxRounds}`;
}

// Initialize fire particle system
FireSystem.init();

// Testing helpers for ES6 module console access
window.nb = {
  testStars: renderStars,
};

// Initialize progress icon display
function initProgressIcon() {
  // Get initial icon
  const initialIcon =
    typeof selectedIconSet.icons[0] === "string"
      ? selectedIconSet.icons[0]
      : selectedIconSet.icons[0].icon;

  // Set initial icon (gradient is already in CSS)
  brainBase.textContent = initialIcon;
  brainProgressFill.textContent = initialIcon;
  brainFireFill.textContent = initialIcon;
}

// Update round display for IDLE/PAUSE states
function updateRoundDisplay() {
  if (!active && !paused) {
    // IDLE state - show info icon
    roundDisplay.textContent = "\ue2ce"; // info icon
    roundDisplay.style.fontFamily = "Phosphor-Light";
    roundDisplay.style.cursor = "pointer";
    roundDisplay.style.opacity = "1";
  } else if (!active) {
    // Game ended or other non-active state - clear
    roundDisplay.textContent = "";
    roundDisplay.style.fontFamily = "";
    roundDisplay.style.cursor = "";
    roundDisplay.style.opacity = "";
  }
  // During active game, round display is managed by nextRound()
}

// Keyboard controls
document.addEventListener("keydown", (e) => {
  // Ignore if typing in an input
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  const key = e.key.toLowerCase();

  // Global shortcuts (work in any state)
  if (key === "escape") {
    // Dismiss modal (will trigger resume callback if it's the pause modal)
    if (!Modals.modal.classList.contains("hidden")) {
      e.preventDefault();
      Modals.hideModal();
    }
    return;
  }

  if (key === "?" || key === "/") {
    // Open info dialog (? or / for US keyboards where ? requires shift)
    e.preventDefault();
    Modals.showInstructions();
    return;
  }

  if (key === " " || key === "spacebar") {
    // Space: Start game / Pause / Resume
    e.preventDefault();
    if (!active && !paused) {
      // IDLE state - start game
      startGame();
    } else if (active || paused) {
      // Active or paused - toggle pause
      togglePause();
    }
    return;
  }

  // Answer controls (only during active gameplay)
  if (!active || paused || starting) return;

  if (key === "z") {
    // Position (left button)
    e.preventDefault();
    toggleButton(buttonLeft, "position");
  } else if (key === "x") {
    // Letter (bottom button) - only in triple mode
    if (triple) {
      e.preventDefault();
      toggleButton(buttonBottom, "letter");
    }
  } else if (key === "c") {
    // Color (right button)
    e.preventDefault();
    toggleButton(buttonRight, "color");
  }
});

// Session stars display
function getTodaysSessions() {
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

  return sessions.filter(
    (session) => session.date >= startOfDay && session.date < endOfDay,
  ).length;
}

// Achievement icons for completed sessions
const ACHIEVEMENT_ICONS = [
  "\ue46a", // star
  "\ue320", // medal
  "\ue67e", // trophy
  "\ue74e", // brain
  "\ue62c", // graduation-cap
  "\ue2de", // lightning
  "\ue57a", // hand-fist
];

function renderStars(count) {
  sessionStars.innerHTML = "";

  if (count === 0) return;

  // Calculate harmonic positions: distribute evenly with equal spacing
  // For n stars, position i at: (i + 1) / (n + 1) * 100%
  for (let i = 0; i < count; i++) {
    const star = document.createElement("div");
    star.className = "session-star";

    // Random icon for each session
    const randomIcon =
      ACHIEVEMENT_ICONS[Math.floor(Math.random() * ACHIEVEMENT_ICONS.length)];
    star.textContent = randomIcon;

    const position = ((i + 1) / (count + 1)) * 100;
    star.style.left = `${position}%`;

    sessionStars.appendChild(star);
  }
}

function updateSessionStars() {
  const todayCount = getTodaysSessions();
  renderStars(todayCount);
}

// Initialize
async function init() {
  await loadSessions();
  initProgressIcon();
  updateLevelDisplay();
  updateRoundDisplay();
  updateSessionStars();
}

init();
