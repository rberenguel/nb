let BACK = 1;
let triple = false;
let history = [];
let correctPosC = 0;
let correctColC = 0;
let correctLetC = 0;
let total = 0;
window.active = false;
let timeRemaining;
let progressInterval;
let lastReply;
let combo = -1;
let gameScore = 0;

let stats;

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

const progressCircle = document.querySelector(".progress-circle");

if (window.location.search == "?colors") {
  Array.from(document.querySelectorAll(".inner-square")).map((e, i) => {
    e.style.borderColor = `var(${colors[i]})`;
    e.style.backgroundColor = `var(${colors[i]})`;
  });
}

function getRandomSolarizedColor() {
  return colors[randomIndex];
}

function resetReply() {
  lastReply = { position: false, color: false, letter: false };
}

function resetStats() {
  stats = {
    combo: 0,
  };
}

function resetEverything() {
  history = [];
  correctPosC = 0;
  correctLetC = 0;
  correctColC = 0;
  gameScore = 0;
  combo = -1;
  total = 0;
  resetStats();
  resetReply();
}

Array.from(document.querySelectorAll(".inner-square")).map((e) => {
  e.addEventListener("click", (ev) => {
    if (window.active) {
      return;
    }
    new_back = +e.id.replace("d", "") + 1;
    if (BACK == new_back) {
      triple = !triple;
    }
    BACK = new_back;
    let text = BACK;
    if (triple) {
      text += `<sub>3</sub>`;
    } else {
      text += `<sub>2</sub>`;
    }
    document.getElementById("top-button").innerHTML = text;
    resetEverything();
    ev.stopPropagation();
  });
});

const modal = document.getElementById("modal");

modal.addEventListener("click", (e) => {
  toBack("modal");
  e.stopPropagation();
});

function getPcts() {
  const pctPos = (100 * correctPosC) / total;
  const pctCol = (100 * correctColC) / total;
  const pctLet = (100 * correctLetC) / total;
  return {
    pos: pctPos.toFixed(0),
    col: pctCol.toFixed(0),
    let: pctLet.toFixed(0),
  };
}

function showResults() {
  if (total == 0) {
    const p = document.createElement("P");
    p.textContent = "Not enough rounds to have statistics";
    return;
  }
  const pcts = getPcts();
  const modalContent = modal.querySelector("#modal-content");
  modalContent.innerHTML = "";
  const p1 = document.createElement("P");
  const p2 = document.createElement("P");
  const p3 = document.createElement("P");
  p1.innerHTML = `Positions: <span style="float: right;">${correctPosC} / ${total} (${pcts.pos}%)</span>`;
  p2.innerHTML = `Colors: <span style="float: right;"> ${correctColC} / ${total} (${pcts.col}%)</span>`;
  p3.innerHTML = `Letters: <span style="float: right;"> ${correctLetC} / ${total} (${pcts.let}%)</span>`;
  modalContent.appendChild(p1);
  modalContent.appendChild(p2);
  if (triple) {
    modalContent.appendChild(p3);
  }
  const p4 = document.createElement("p");
  p4.innerHTML = `Max combo: ${stats.combo}`;
  modalContent.appendChild(p4);
}

function toBack(id) {
  document.getElementById(id).classList.add("back");
  document.getElementById(id).classList.remove("front");
}
function toFront(id) {
  document.getElementById(id).classList.remove("back");
  document.getElementById(id).classList.add("front");
}

function startStop(e) {
  e.stopPropagation();
  console.info("Start/stop");
  const squares = Array.from(document.querySelectorAll(".inner-square"));
  if (window.active) {
    if (triple) {
      toBack("bottom-button");
    }
    [
      "circular-progress",
      "left-button",
      "right-button",
      "middle-button",
      "letter",
    ].map(toBack);
    clearInterval(window.active);
    window.active = false;
    history = []; // Reset history, so it starts again from the beginning.
    // TODO the button text should not show until we can answer
    squares.map((e) => (e.style.borderColor = "var(--dark)"));
    squares.map((e) => (e.style.backgroundColor = "var(--dark)"));
    toFront("modal");
    showResults();
  } else {
    let text = BACK;
    if (triple) {
      text += `<sub>3</sub>`;
    } else {
      text += `<sub>2</sub>`;
    }
    document.getElementById("top-button").innerHTML = text;
    toFront("middle-button");
    toBack("modal");
    stepping();
    window.active = setInterval(stepping, 4000);
    squares.map((e) => (e.style.borderColor = "var(--alternate-background)"));
    squares.map(
      (e) => (e.style.backgroundColor = "var(--alternate-background)"),
    );
  }
}

document.getElementById("middle-button").addEventListener("click", startStop);
document.getElementById("top-button").addEventListener("click", startStop);
document.body.addEventListener("click", startStop);

function showAnswerButtons() {
  ["left-button", "right-button"].map(toFront);
  if (triple) {
    toFront("bottom-button");
  }
}

function answerButtonCommon(identifier, flag, e) {
  const color = flag ? "var(--dark)" : "";
  const textColor = flag ? "var(--light)" : "var(--textcolor)";
  document
    .getElementById(`${identifier}-button`)
    .querySelector("p").style.backgroundColor = color;
  document
    .getElementById(`${identifier}-button`)
    .querySelector("p").style.color = textColor;
  e.stopPropagation();
}

document.getElementById("left-button").addEventListener("click", function (e) {
  console.info("Same position");
  lastReply.position = !lastReply.position;
  answerButtonCommon("left", lastReply.position, e);
});

document.getElementById("right-button").addEventListener("click", function (e) {
  console.info("Same color");
  lastReply.color = !lastReply.color;
  answerButtonCommon("right", lastReply.color, e);
});

document
  .getElementById("bottom-button")
  .addEventListener("click", function (e) {
    if (!triple) {
      return;
    }
    console.info("Same letter");
    lastReply.letter = !lastReply.letter;
    answerButtonCommon("bottom", lastReply.letter, e);
  });

const coin = () => Math.random() < 0.3; // Kind of coin

function generateStep(previous) {
  let position = Math.floor(Math.random() * 9);
  let color = Math.floor(Math.random() * colors.length);
  let letter = Math.floor(Math.random() * letters.length);
  // I use "coin" to try to force each variable to be statistically closer to the
  // previous one, otherwise it is very easy to get high % just assuming everything
  // is always different, i.e. not answering at all.
  if (previous) {
    if (coin()) {
      position = previous.position;
    }
    if (coin()) {
      color = previous.color;
    }
    if (coin()) {
      letter = previous.letter;
    }
  }
  return {
    position: position,
    color: color,
    letter: letter,
  };
}

function render(step) {
  const colorCSS = colors[step.color];
  const position = step.position;
  const element = document.getElementById(`d${position}`);
  element.style.borderColor = `var(${colorCSS})`;
  element.style.backgroundColor = `var(${colorCSS})`;
}

function unrender(step) {
  const position = step.position;
  const element = document.getElementById(`d${position}`);
  element.style.borderColor = `var(--alternate-background)`;
  element.style.backgroundColor = `var(--alternate-background)`;
}

function score(toScore = { kind: "none", increase: 0 }) {
  const score = toScore.increase;
  const color = score > 0 ? "green" : "red";
  let selector = "";
  if (toScore.kind == "pos") {
    correctPosC += score;
    selector = "left";
  }
  if (toScore.kind == "col") {
    correctColC += score;
    selector = "right";
  }
  if (toScore.kind == "let") {
    correctLetC += score;
    selector = "bottom";
  }
  document
    .getElementById(`${selector}-button`)
    .querySelector("p").style.backgroundColor = `var(--sd-${color})`;
}

function checkReply() {
  if (history.length < 1 + BACK) {
    return;
  }
  total += 1;
  const lastIdx = history.length - 1;
  const previousIdx = history.length - 1 - BACK;
  const last = history[lastIdx];
  const previous = history[previousIdx];
  const previousScores = {
    pos: correctPosC,
    col: correctColC,
    let: correctLetC,
  };
  if (last.position == previous.position) {
    if (lastReply.position) {
      score({ kind: "pos", increase: 1 });
    } else {
      score({ kind: "pos", increase: 0 });
    }
  } else {
    if (!lastReply.position) {
      score({ kind: "pos", increase: 1 });
    } else {
      score({ kind: "pos", increase: 0 });
    }
  }
  if (last.color == previous.color) {
    if (lastReply.color) {
      score({ kind: "col", increase: 1 });
    } else {
      score({ kind: "col", increase: 0 });
    }
  } else {
    if (!lastReply.color) {
      score({ kind: "col", increase: 1 });
    } else {
      score({ kind: "col", increase: 0 });
    }
  }
  if (triple) {
    if (last.letter == previous.letter) {
      if (lastReply.letter) {
        score({ kind: "let", increase: 1 });
      } else {
        score({ kind: "let", increase: 0 });
      }
    } else {
      if (!lastReply.letter) {
        score({ kind: "let", increase: 1 });
      } else {
        score({ kind: "let", increase: 0 });
      }
    }
  }
  // Check combo increase
  const delta = {
    pos: previousScores.pos - correctPosC,
    col: previousScores.col - correctColC,
    let: previousScores.let - correctLetC,
  };
  if (triple) {
    if (delta.pos != 0 && delta.col != 0 && delta.let != 0) {
      combo += 1;
    } else {
      combo = 0;
    }
  } else {
    if (delta.pos != 0 && delta.col != 0) {
      combo += 1;
    } else {
      combo = -1;
    }
  }
  stats.combo = Math.max(stats.combo, combo);
  // Score
  let increase = combo > 0 ? 1 : 0;
  if (triple) {
    increase = increase * 3 ** combo;
  } else {
    increase = increase * 2 ** combo;
  }
  gameScore += increase;
  document.getElementById("score").innerHTML =
    `<span style="float: left;">${formatGameScore(gameScore)}</span> <span style="float: right">${combo > 0 ? combo : 1} x</span>`;
  console.info(`pos: ${correctPosC} col: ${correctColC}`);
}

function formatGameScore(number) {
  const ranges = [
    { divider: 1e12, suffix: "T" },
    { divider: 1e9, suffix: "B" },
    { divider: 1e6, suffix: "M" },
    { divider: 1e3, suffix: "k" },
  ];

  for (const range of ranges) {
    if (number >= range.divider) {
      return (number / range.divider).toFixed(1) + range.suffix;
    }
  }

  return number.toString();
}

function resetAnswers() {
  document
    .getElementById("right-button")
    .querySelector("p").style.backgroundColor = "rgba(0,0,0,0)";
  document
    .getElementById("left-button")
    .querySelector("p").style.backgroundColor = "rgba(0,0,0,0)";
  if (triple) {
    document
      .getElementById("bottom-button")
      .querySelector("p").style.backgroundColor = "rgba(0,0,0,0)";
  }
}

function stepping() {
  let step, prev;
  checkReply();
  if (history.length >= BACK) {
    showAnswerButtons();
  }
  setTimeout(resetAnswers, 300);
  if (history.length >= 1) {
    prev = history[history.length - 1];
    unrender(prev);
    if (history.length >= BACK) {
      const previousIdx = history.length - BACK;
      prev = history[previousIdx];
      step = generateStep(prev);
    } else {
      step = generateStep();
    }
  } else {
    step = generateStep();
  }

  // Add info
  if (total > 0) {
    let str;
    const pcts = getPcts();
    str = `<td>%</td><td>${pcts.pos}<sup>P</sup></td><td>${pcts.col}<sup>C</sup></td>`;
    if (triple) {
      str += `<td>${pcts.let}<sup>L</sup></td>`;
    }
    document.getElementById("top-pct").innerHTML = str;
    str = `${total}`;
    document.getElementById("top-round").innerHTML = str;
  }

  timeRemaining = 4000;
  progressCircle.style.strokeDashoffset = 251;
  clearInterval(progressInterval);
  progressInterval = setInterval(updateProgress, 100);
  const square = document.getElementById(`d${step.position}`);
  // Center the timer and set the same color. This could be its own function
  const colorCSS = colors[step.color];
  const progressContainer = document.getElementById("circular-progress");
  progressCircle.style.stroke = `var(${colorCSS})`;
  toFront("circular-progress");
  if (triple) {
    toFront("letter");
  }
  const svg = progressContainer.querySelector("svg");
  const targetRect = square.getBoundingClientRect();
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const containerLeft = targetCenterX - svg.clientWidth / 2;
  const containerTop = targetCenterY - svg.clientHeight / 2;
  progressContainer.style.left = `round(${containerLeft}px, 1px)`;
  progressContainer.style.top = `round(${containerTop}px, 1px)`;

  if (triple) {
    const letter = document.getElementById("letter");
    letter.textContent = letters[step.letter];
    const letterBB = letter.getBoundingClientRect();
    const shiftV = letterBB.height / 2;
    const shiftH = letterBB.width / 2;
    letter.style.left = `round(${containerLeft + shiftH}px, 1px)`;
    letter.style.top = `round(${containerTop + shiftV}px, 1px)`;
    letter.style.color = `var(${colorCSS})`;
  }
  history.push(step);
  setTimeout(() => render(step), 300);
  resetReply();
}

function updateProgress() {
  timeRemaining -= 100;

  const progressPercentage = (timeRemaining / 4000) * 100;
  const strokeDashoffset = 251 + (251 * progressPercentage) / 100;

  progressCircle.style.strokeDashoffset = strokeDashoffset;

  if (timeRemaining <= 0) {
    clearInterval(progressInterval);
  }
}

resetReply();
resetStats();
