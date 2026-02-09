// Game state
let BACK = 1;
let triple = false;
let history = [];
let correctPosC = 0;
let correctColC = 0;
let correctLetC = 0;
let total = 0;
let cycles = 0;
let active = false;
let timeRemaining;
let progressInterval;
let lastReply = { position: false, color: false, letter: false };
let combo = -1;
let starting = true;
let paused = false;
let nextRoundTimeout = null;
let renderTimeout = null;
let warmupRounds = 0;
let lastRoundWasWarmup = true; // Track if previous round was warmup

const CYCLE_LENGTH = 20;
const TOTAL_TIME = () => (triple ? 5000 : 3000);
const RESET_TIME = () => 300;

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
const roundDisplay = document.getElementById("round-display");
const statsDisplay = document.getElementById("stats-display");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");
const buttonLeft = document.getElementById("button-left");
const buttonRight = document.getElementById("button-right");
const buttonBottom = document.getElementById("button-bottom");
const buttonPause = document.getElementById("button-pause");

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
  lastRoundWasWarmup = true;
  resetReply();
}

// Square click handlers (for level selection)
squares.forEach((square, idx) => {
  square.addEventListener("click", (ev) => {
    if (active) return;

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
}

// Level display click (start game)
levelDisplay.addEventListener("click", () => {
  if (active) return;
  startGame();
});

// Start game
function startGame() {
  active = true;
  starting = true;
  resetEverything();

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

    // Clear all timers
    clearInterval(progressInterval);
    if (nextRoundTimeout) clearTimeout(nextRoundTimeout);
    if (renderTimeout) clearTimeout(renderTimeout);

    // Clear current animation
    squares.forEach(sq => {
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

    // Show pause indicator
    levelDisplay.textContent = "⏸";
    levelDisplay.style.opacity = "0.5";
  } else if (paused) {
    // Resume the game
    paused = false;
    active = true;

    // Restore level display
    updateLevelDisplay();
    levelDisplay.style.opacity = "1";

    // Start warmup period - need BACK rounds before accepting answers
    warmupRounds = BACK;
    lastRoundWasWarmup = true; // Treat as if coming from warmup

    // Continue with next round
    nextRound();
  }
}

// End game
function endGame() {
  paused = false;
  active = false;

  // Clear all timers
  clearInterval(progressInterval);
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
  squares.forEach(sq => {
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

  // Show results
  showResults();
}

// Pause button
buttonPause.addEventListener("click", () => {
  togglePause();
});

// Update button text visibility based on history length and warmup state
function updateButtonVisibility(canAnswer) {
  const leftSpan = buttonLeft.querySelector('span');
  const rightSpan = buttonRight.querySelector('span');
  const bottomSpan = buttonBottom.querySelector('span');

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
    letter = triple && Math.random() < 0.5 ? prev.letter : Math.floor(Math.random() * 9);
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
  const colorValue = getComputedStyle(document.documentElement).getPropertyValue(colorVar);

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

  // Start timer
  timeRemaining = TOTAL_TIME();
}

// Unrender previous step
function unrender(step) {
  const square = squares[step.position];
  square.classList.remove("active");
  square.style.removeProperty("--active-color");
  square.style.removeProperty("--timer-duration");

  // Remove letter circle if exists
  const letterCircle = square.querySelector(".letter-circle");
  if (letterCircle) {
    letterCircle.remove();
  }
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

  // Check if we should move to next cycle or end
  if (total >= CYCLE_LENGTH * (cycles + 1)) {
    cycles++;
    if (cycles >= 6) {
      endGame();
      return;
    }
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

  lastReply[type] = !lastReply[type];

  if (lastReply[type]) {
    button.classList.add("pressed");
  } else {
    button.classList.remove("pressed");
  }
}

buttonLeft.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleButton(buttonLeft, "position");
});

buttonRight.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleButton(buttonRight, "color");
});

buttonBottom.addEventListener("click", (e) => {
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
  const posCorrect = (posMatch && lastReply.position) || (!posMatch && !lastReply.position);
  if (posCorrect) correctPosC++;
  flashButton(buttonLeft, posCorrect);

  // Check color
  const colMatch = current.color === prev.color;
  const colCorrect = (colMatch && lastReply.color) || (!colMatch && !lastReply.color);
  if (colCorrect) correctColC++;
  flashButton(buttonRight, colCorrect);

  // Check letter (if triple mode)
  if (triple) {
    const letMatch = current.letter === prev.letter;
    const letCorrect = (letMatch && lastReply.letter) || (!letMatch && !lastReply.letter);
    if (letCorrect) correctLetC++;
    flashButton(buttonBottom, letCorrect);
  }

  // Update stats after flash
  setTimeout(() => {
    updateStatsDisplay();
  }, 300);
}

function flashButton(button, correct) {
  button.classList.remove("pressed");
  button.classList.add(correct ? "correct" : "incorrect");

  setTimeout(() => {
    button.classList.remove("correct", "incorrect");
  }, 500);
}

function updateStatsDisplay() {
  if (total === 0) return;

  if (triple) {
    const avg = Math.round(((correctPosC + correctColC + correctLetC) / (total * 3)) * 100);
    statsDisplay.textContent = `${avg}%`;
  } else {
    const avg = Math.round(((correctPosC + correctColC) / (total * 2)) * 100);
    statsDisplay.textContent = `${avg}%`;
  }
}

// Show results modal
function showResults() {
  const totalAnswers = triple ? total * 3 : total * 2;
  const correctAnswers = triple ? correctPosC + correctColC + correctLetC : correctPosC + correctColC;
  const percentage = Math.round((correctAnswers / totalAnswers) * 100);

  let html = `<h2>Game Over</h2>`;
  html += `<p>Level: ${BACK}-back ${triple ? "(Triple)" : "(Dual)"}</p>`;
  html += `<p>Rounds: ${total}</p>`;
  html += `<p>Overall: ${percentage}%</p>`;
  html += `<hr style="margin: 1rem 0;">`;
  html += `<p>Position: ${correctPosC}/${total} (${Math.round((correctPosC / total) * 100)}%)</p>`;
  html += `<p>Color: ${correctColC}/${total} (${Math.round((correctColC / total) * 100)}%)</p>`;
  if (triple) {
    html += `<p>Letter: ${correctLetC}/${total} (${Math.round((correctLetC / total) * 100)}%)</p>`;
  }
  html += `<p style="margin-top: 1rem; cursor: pointer;" onclick="document.getElementById('modal').classList.add('hidden')">Tap to close</p>`;

  modalContent.innerHTML = html;
  modal.classList.remove("hidden");
}

// Initialize
updateLevelDisplay();
