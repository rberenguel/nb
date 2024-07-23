let BACK = 1
let triple = false
let history = []
let correctPosC = 0
let correctColC = 0
let correctLetC = 0
let total = 0
window.active = false
let timeRemaining;
let progressInterval;
let lastReply

const colors = [
  "--blue", 
  "--orange", 
  "--yellow",
  "--pink", 
  "--maroon", 
  "--green", 
  "--grey", 
  "--brown", 
  "--white",
]; 

const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "J"]

const progressCircle = document.querySelector(".progress-circle");

if(window.location.search == "?colors"){
  Array.from(document.querySelectorAll(".inner-square")).map((e, i) => {
    console.log(i)
    e.style.borderColor = `var(${colors[i]})`;
    e.style.backgroundColor = `var(${colors[i]})`;
  })
}

function getRandomSolarizedColor() {
  return colors[randomIndex];
}

function resetReply() {
  lastReply = { position: false, color: false, letter: false };
}

function resetEverything(){
  history = [];
  correctPosC = 0;
  correctLetC = 0;
  correctColC = 0;
  total = 0;
  resetReply();
}

Array.from(document.querySelectorAll('.inner-square')).map(e => {
  e.addEventListener('click', ev => {
    if(window.active){
      return;
    }
    new_back = +(e.id.replace("d", ""))+1;
    if(BACK == new_back){
      triple = !triple;
    }
    BACK = new_back;
    let text = BACK
    if(triple){
      text += ` (triple)`
    }
    document.getElementById("top-button").textContent = text;
    resetEverything();
    ev.stopPropagation();
  })
});

const modal = document.getElementById("modal");

modal.addEventListener("click", (e) => {
  document.getElementById("modal").classList.remove("front");
  document.getElementById("modal").classList.add("back");
  e.stopPropagation();
});


function showResults(){
  if(total==0){
    const p = document.createElement("P");
    p.textContent = "Not enough rounds to have statistics";
    return;
  }
  const pctPos = 100*correctPosC / total;
  const pctCol = 100*correctColC / total;
  const pctLet = 100*correctLetC / total;
  const modalContent = modal.querySelector("#modal-content");
  modalContent.innerHTML = "";
  const p1 = document.createElement("P");
  const p2 = document.createElement("P");
  const p3 = document.createElement("P");
  p1.innerHTML = `Positions: <span style="float: right;">${correctPosC} / ${total} (${pctPos.toFixed(2)})</span>`;
  p2.innerHTML = `Colors: <span style="float: right;"> ${correctColC} / ${total} (${pctPos.toFixed(2)})</span>`;
  p3.innerHTML = `Letters: <span style="float: right;"> ${correctLetC} / ${total} (${pctPos.toFixed(2)})</span>`;
  modalContent.appendChild(p1);
  modalContent.appendChild(p2);
  if(triple){
    modalContent.appendChild(p3);
  }
}

function startStop(e) {
  e.stopPropagation();
  console.info('Start/stop');
  const squares = Array.from(document.querySelectorAll(".inner-square"));
  if(window.active){
    if(triple){
      document.getElementById("bottom-button").classList.remove("front");
      document.getElementById("bottom-button").classList.add("back");
    }
    document.getElementById("left-button").classList.add("back");
    document.getElementById("right-button").classList.add("back");
    document.getElementById("middle-button").classList.add("back");
    document.getElementById("left-button").classList.remove("front");
    document.getElementById("right-button").classList.remove("front");
    document.getElementById("middle-button").classList.remove("front");
    clearInterval(window.active);
    window.active = false;
    history = [] // Reset history, so it starts again from the beginning.
    // TODO the button text should not show until we can answer
    squares.map(e => e.style.borderColor = "var(--slighty-lighter-dark-background)");
    squares.map(e => e.style.backgroundColor = "var(--slighty-lighter-dark-background)");
    document.getElementById("modal").classList.remove("back");
    document.getElementById("modal").classList.add("front");
    showResults();
  } else {
    let text = BACK
    if(triple){
      text += ` (triple)`
    }
    document.getElementById("top-button").textContent = text;
    document.getElementById("middle-button").classList.add("front");
    document.getElementById("middle-button").classList.remove("back");
    document.getElementById("modal").classList.add("back");
    document.getElementById("modal").classList.remove("front");
    stepping();
    window.active = setInterval(stepping, 4000);
    squares.map(e => e.style.borderColor = "black");
    squares.map(e => e.style.backgroundColor = "black");
  }
}

document.getElementById('middle-button').addEventListener('click', startStop);
document.getElementById('top-button').addEventListener('click', startStop);
document.body.addEventListener('click', startStop);

function showAnswerButtons(){
  document.getElementById("left-button").classList.add("front");
  document.getElementById("right-button").classList.add("front");
  document.getElementById("left-button").classList.remove("back");
  document.getElementById("right-button").classList.remove("back");
  if(triple){
    document.getElementById("bottom-button").classList.add("front");
    document.getElementById("bottom-button").classList.remove("back");
  }
}

document.getElementById('left-button').addEventListener('click', function(e) {
  console.info('Same position');
  lastReply.position = !lastReply.position;
  const color = lastReply.position ? "var(--lighter-dark-background)" : "";
  document.getElementById("left-button").querySelector("p").style.backgroundColor = color;
  e.stopPropagation();
});

document.getElementById('right-button').addEventListener('click', function(e) {
  console.info('Same color');
  lastReply.color = !lastReply.color;
  const color = lastReply.color ? "var(--lighter-dark-background)" : "";
  document.getElementById("right-button").querySelector("p").style.backgroundColor = color;
  e.stopPropagation();
});

document.getElementById('bottom-button').addEventListener('click', function(e) {
  if(!triple){
    return;
  }
  console.info('Same letter');
  lastReply.letter = !lastReply.letter;
  const color = lastReply.letter ? "var(--lighter-dark-background)" : "";
  document.getElementById("bottom-button").querySelector("p").style.backgroundColor = color;
  e.stopPropagation();
});


const coin = () => Math.random() < 0.3; // Kind of coin


function generateStep(previous){
  let position = Math.floor(Math.random() * 9);
  let color = Math.floor(Math.random() * colors.length);
  let letter = Math.floor(Math.random() * letters.length);
  if(previous){
    if(coin()){
      position = previous.position;
    }
    if(coin()){
      color = previous.color;
    }
    if(coin()){
      letter = previous.letter;
    }
  }
  return {
    position: position,
    color: color,
    letter: letter
  };
}

function render(step){
  const colorCSS = colors[step.color];
  const position = step.position;
  const element = document.getElementById(`d${position}`);
  element.style.borderColor = `var(${colorCSS})`;
  element.style.backgroundColor = `var(${colorCSS})`;
}

function unrender(step){
  const position = step.position;
  const element = document.getElementById(`d${position}`);
  element.style.borderColor = `black`;
  element.style.backgroundColor = `black`;
}

function score(toScore={kind: "none", increase: 0}){
  const score = toScore.increase;
  const color = score > 0 ? "green" : "red";
  let selector = "";
  if(toScore.kind == "pos"){
    correctPosC += score;
    selector = "left";
  }
  if(toScore.kind == "col"){
    correctColC += score;
    selector = "right";
  }
  if(toScore.kind == "let"){
    correctLetC += score;
    selector = "bottom";
  }
  document.getElementById(`${selector}-button`).querySelector("p").style.backgroundColor = `var(--sd-${color})`;
}

function checkReply(){
  if(history.length < 1 + BACK){
    return;
  }
  total += 1;
  lastIdx = history.length - 1;
  previousIdx = history.length - 1 - BACK;
  const last = history[lastIdx];
  const previous = history[previousIdx];
  if(last.position == previous.position){
    if(lastReply.position){
      score({kind: "pos", increase: 1});
    } else {
      score({kind: "pos", increase: 0});
    }
  } else {
    if(!lastReply.position){
      score({kind: "pos", increase: 1});
    } else {
      score({kind: "pos", increase: 0});
    }
  }
  if(last.color == previous.color){
    if(lastReply.color){
      score({kind: "col", increase: 1});
    } else {
      score({kind: "col", increase: 0});
    }
  } else {
    if(!lastReply.color){
      score({kind: "col", increase: 1});
    } else {
      score({kind: "col", increase: 0});
    }
  }
  if(triple){
    if(last.letter== previous.letter){
      if(lastReply.letter){
        score({kind: "let", increase: 1});
      } else {
        score({kind: "let", increase: 0});
      }
    } else {
      if(!lastReply.letter){
        score({kind: "let", increase: 1});
      } else {
        score({kind: "let", increase: 0});
      }
    }

  }
  console.info(`pos: ${correctPosC} col: ${correctColC}`);
}

function resetAnswers(){
  document.getElementById("right-button").querySelector("p").style.backgroundColor = "rgba(0,0,0,0)";
  document.getElementById("left-button").querySelector("p").style.backgroundColor = "rgba(0,0,0,0)";
  if(triple){
    document.getElementById("bottom-button").querySelector("p").style.backgroundColor = "rgba(0,0,0,0)";
  }
}

function stepping(){
  let step, prev
  checkReply();
  if(history.length >= BACK){
    showAnswerButtons();
  }
  setTimeout(resetAnswers, 300);
  if(history.length >= 1){
    prev = history[history.length - 1];
    unrender(prev);
    step = generateStep(prev);
  } else {
    step = generateStep();
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
  progressContainer.style.zIndex = 1;
  const svg = progressContainer.querySelector("svg");
  const targetRect = square.getBoundingClientRect();
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const containerLeft = targetCenterX - svg.clientWidth / 2;
  const containerTop = targetCenterY - svg.clientHeight / 2;
  progressContainer.style.left = `${containerLeft}px`;
  progressContainer.style.top = `${containerTop}px`;

  if(triple){
    const letter = document.getElementById("letter")
    letter.textContent = letters[step.letter];
    const letterBB = letter.getBoundingClientRect();
    const shiftV = letterBB.height/2
    const shiftH = letterBB.width/2
    letter.style.left = `${containerLeft+shiftH}px`;
    letter.style.top = `${containerTop+shiftV}px`;
    letter.style.color = `var(${colorCSS})`;
  }
  history.push(step);
  setTimeout(() => render(step), 300);
  resetReply();
}

function updateProgress() {
  timeRemaining -= 100;

  const progressPercentage = (timeRemaining / 4000) * 100;
  const strokeDashoffset = 251 - (251 * progressPercentage) / 100;

  progressCircle.style.strokeDashoffset = strokeDashoffset;

  if (timeRemaining <= 0) {
    clearInterval(progressInterval);
  }
}

resetReply();

