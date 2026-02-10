// Modal management module

// DOM elements
const modal = document.getElementById("modal");
const modalInstructions = document.getElementById("modal-instructions");
const modalPause = document.getElementById("modal-pause");
const modalResults = document.getElementById("modal-results");
const modalHistory = document.getElementById("modal-history");

// Track which modal is currently open
let currentModal = null;
let onCloseCallback = null;

/**
 * Hide all modals and the overlay
 */
export function hideModal() {
  modal.classList.add("hidden");
  modalInstructions.classList.add("hidden");
  modalPause.classList.add("hidden");
  modalResults.classList.add("hidden");
  modalHistory.classList.add("hidden");

  // Call the close callback if one was set
  if (onCloseCallback) {
    const callback = onCloseCallback;
    onCloseCallback = null;
    callback();
  }

  currentModal = null;
}

/**
 * Show a specific modal
 */
function showModal(modalElement, closeCallback = null) {
  // Hide any currently showing modal
  modalInstructions.classList.add("hidden");
  modalPause.classList.add("hidden");
  modalResults.classList.add("hidden");
  modalHistory.classList.add("hidden");

  // Show the requested modal
  modalElement.classList.remove("hidden");
  modal.classList.remove("hidden");

  currentModal = modalElement;
  onCloseCallback = closeCallback;
}

/**
 * Show instructions modal
 */
export function showInstructions() {
  showModal(modalInstructions);
}

/**
 * Show pause stats modal
 * @param {Object} stats - Game statistics
 * @param {number} stats.BACK - N-back level
 * @param {boolean} stats.triple - Triple mode?
 * @param {number} stats.total - Total rounds completed
 * @param {number} stats.correctPosC - Correct position answers
 * @param {number} stats.correctColC - Correct color answers
 * @param {number} stats.correctLetC - Correct letter answers (triple only)
 * @param {Function} onClose - Callback when modal is closed (resume game)
 */
export function showPauseStats(stats, onClose) {
  // Calculate percentages (handle division by zero)
  const pctPos =
    stats.total > 0 ? Math.round((100 * stats.correctPosC) / stats.total) : 0;
  const pctCol =
    stats.total > 0 ? Math.round((100 * stats.correctColC) / stats.total) : 0;
  const pctLet =
    stats.triple && stats.total > 0
      ? Math.round((100 * stats.correctLetC) / stats.total)
      : 0;
  const totalAnswers = stats.triple ? stats.total * 3 : stats.total * 2;
  const correctAnswers = stats.triple
    ? stats.correctPosC + stats.correctColC + stats.correctLetC
    : stats.correctPosC + stats.correctColC;
  const overall =
    totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  // Update modal content
  document.getElementById("pause-level").textContent =
    `Level: ${stats.BACK}-back ${stats.triple ? "(Triple)" : "(Dual)"}`;
  document.getElementById("pause-rounds").textContent =
    `Rounds: ${stats.total} / 100`;
  document.getElementById("pause-overall").textContent = `Overall: ${overall}%`;
  document.getElementById("pause-position").textContent =
    `Position: ${stats.correctPosC}/${stats.total} (${pctPos}%)`;
  document.getElementById("pause-color").textContent =
    `Color: ${stats.correctColC}/${stats.total} (${pctCol}%)`;

  const pauseLetter = document.getElementById("pause-letter");
  if (stats.triple) {
    pauseLetter.textContent = `Letter: ${stats.correctLetC}/${stats.total} (${pctLet}%)`;
    pauseLetter.classList.remove("hidden");
  } else {
    pauseLetter.classList.add("hidden");
  }

  showModal(modalPause, onClose);
}

/**
 * Show results modal
 * @param {Object} stats - Game statistics (same structure as pause stats)
 */
export function showResults(stats) {
  const totalAnswers = stats.triple ? stats.total * 3 : stats.total * 2;
  const correctAnswers = stats.triple
    ? stats.correctPosC + stats.correctColC + stats.correctLetC
    : stats.correctPosC + stats.correctColC;
  const percentage = Math.round((correctAnswers / totalAnswers) * 100);

  // Update modal content
  document.getElementById("results-level").textContent =
    `Level: ${stats.BACK}-back ${stats.triple ? "(Triple)" : "(Dual)"}`;
  document.getElementById("results-rounds").textContent =
    `Rounds: ${stats.total}`;
  document.getElementById("results-overall").textContent =
    `Overall: ${percentage}%`;
  document.getElementById("results-position").textContent =
    `Position: ${stats.correctPosC}/${stats.total} (${Math.round((stats.correctPosC / stats.total) * 100)}%)`;
  document.getElementById("results-color").textContent =
    `Color: ${stats.correctColC}/${stats.total} (${Math.round((stats.correctColC / stats.total) * 100)}%)`;

  const resultsLetter = document.getElementById("results-letter");
  if (stats.triple) {
    resultsLetter.textContent = `Letter: ${stats.correctLetC}/${stats.total} (${Math.round((stats.correctLetC / stats.total) * 100)}%)`;
    resultsLetter.classList.remove("hidden");
  } else {
    resultsLetter.classList.add("hidden");
  }

  // Add level suggestion based on performance
  let suggestion = "";
  if (percentage >= 80) {
    suggestion =
      stats.BACK < 9
        ? "Consider advancing to a higher level"
        : "Excellent work at maximum level!";
  } else if (percentage >= 50) {
    suggestion = "Keep practicing at this level";
  } else {
    suggestion =
      stats.BACK > 1
        ? "Try an easier level for better results"
        : "Keep practicing!";
  }
  document.getElementById("results-suggestion").textContent = suggestion;

  showModal(modalResults);
}

/**
 * Show history modal
 * @param {Array} sessions - Array of session objects
 */
export function showHistory(sessions) {
  const historyList = document.getElementById("history-list");

  if (!sessions || sessions.length === 0) {
    historyList.innerHTML =
      '<p style="opacity: 0.7; text-align: center;">No completed sessions yet.</p>';
  } else {
    // Sort by date (most recent first)
    const sortedSessions = [...sessions].sort((a, b) => b.date - a.date);

    let html = "";
    sortedSessions.forEach((session, index) => {
      const date = new Date(session.date);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      const mode = session.triple ? "Triple" : "Dual";
      const pctPos = Math.round(session.pctPos);
      const pctCol = Math.round(session.pctCol);
      const pctLet = session.triple ? Math.round(session.pctLet) : null;

      html += `
        <div style="padding: 0.75rem; margin-bottom: 0.75rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 0.5rem; background: rgba(255,255,255,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem;">
            <strong>${session.level}-back ${mode}</strong>
            <span style="font-size: 0.75rem; opacity: 0.6;">${dateStr} ${timeStr}</span>
          </div>
          <div style="font-size: 0.85rem; opacity: 0.9;">
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <span>Pos: ${pctPos}%</span>
              <span>Col: ${pctCol}%</span>
              ${pctLet !== null ? `<span>Let: ${pctLet}%</span>` : ""}
            </div>
          </div>
        </div>
      `;
    });

    historyList.innerHTML = html;
  }

  showModal(modalHistory);
}

// Set up global click handler for modal dismissal
modal.addEventListener("click", (e) => {
  // Only close if clicking the overlay itself or a close hint
  if (e.target === modal || e.target.classList.contains("modal-close-hint")) {
    hideModal();
  }
});

// Instructions modal can be dismissed by clicking anywhere in it
modalInstructions.addEventListener("click", () => {
  hideModal();
});

// Pause modal can be dismissed by clicking the close hint
modalPause.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-close-hint")) {
    hideModal();
  }
});

// Results modal can be dismissed by clicking the close hint
modalResults.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-close-hint")) {
    hideModal();
  }
});

// History modal can be dismissed by clicking the close hint
modalHistory.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-close-hint")) {
    hideModal();
  }
});

// Export for external access (keyboard shortcuts)
export { modal };
