let BACK = 1
let history = []
let correctPosC = 0
let correctColC = 0
let total = 0
window.active = false
let timeRemaining;
let progressInterval;


const colors = [
  '--sd-yellow', '--sd-orange', '--sd-magenta',
  '--sd-violet', '--sd-blue', '--sd-cyan', '--sd-green'
]; // Removed red, too close to orange/magenta
const progressCircle = document.querySelector(".progress-circle");

function getRandomSolarizedColor() {
  return colors[randomIndex];
}

let lastReply
function resetReply() {
  lastReply = { position: false, color: false };
}

Array.from(document.querySelectorAll('.inner-square')).map(e => {
  e.addEventListener('click', ev => {
    BACK = +(e.id.replace("d", ""))+1
    document.getElementById("top-button").textContent = BACK;
    history = []
    correctPosC = 0
    correctColC = 0
    total = 0
    document.getElementById(`left-button`).querySelector("p").style.backgroundColor = "";
    document.getElementById(`right-button`).querySelector("p").style.backgroundColor = "";
  })
})

const modal = document.getElementById("modal")

modal.addEventListener("click", (e) => {
  document.getElementById("modal").classList.remove("front");
  document.getElementById("modal").classList.add("back");
});


function showResults(){
  if(total==0){
    const p = document.createElement("P")
    p.textContent = "Not enough rounds to have statistics"
    return
  }
  const pctPos = 100*correctPosC / total;
  const pctCol = 100*correctColC / total;
  const modalContent = modal.querySelector("#modal-content");
  modalContent.innerHTML = ""
  const p1 = document.createElement("P")
  const p2 = document.createElement("P")
  p1.innerHTML = `Positions: <span style="float: right;">${correctPosC} / ${total} (${pctPos.toFixed(2)})</span>`
  p2.innerHTML = `Colors: <span style="float: right;"> ${correctColC} / ${total} (${pctPos.toFixed(2)})</span>`
  modalContent.appendChild(p1)
  modalContent.appendChild(p2)
}

function startStop() {
  console.info('Start/stop');
  const squares = Array.from(document.querySelectorAll(".inner-square"))
  if(window.active){
    document.getElementById("left-button").classList.add("back")
    document.getElementById("right-button").classList.add("back")
    document.getElementById("middle-button").classList.add("back")
    document.getElementById("left-button").classList.remove("front")
    document.getElementById("right-button").classList.remove("front")
    document.getElementById("middle-button").classList.remove("front")
    clearInterval(window.active)
    window.active = false;
    squares.map(e => e.style.borderColor = "var(--slighty-lighter-dark-background)")
    document.getElementById("modal").classList.remove("back");
    document.getElementById("modal").classList.add("front");
    showResults();
  } else {
    document.getElementById("top-button").textContent = BACK;
    document.getElementById("left-button").classList.add("front")
    document.getElementById("right-button").classList.add("front")
    document.getElementById("middle-button").classList.add("front")
    document.getElementById("left-button").classList.remove("back")
    document.getElementById("right-button").classList.remove("back")
    document.getElementById("middle-button").classList.remove("back")
    document.getElementById("modal").classList.add("back");
    document.getElementById("modal").classList.remove("front");
    stepping()
    window.active = setInterval(stepping, 4000)
    squares.map(e => e.style.borderColor = "black")
  }
}

document.getElementById('middle-button').addEventListener('click', startStop)
document.getElementById('top-button').addEventListener('click', startStop)

document.getElementById('left-button').addEventListener('click', function() {
  console.info('Same position');
  lastReply.position = true;
});

document.getElementById('right-button').addEventListener('click', function() {
  console.info('Same color');
  lastReply.color = true;
});

const coin = () => Math.random() < 0.3; // Kind of coin


function generateStep(previous){
  let position = Math.floor(Math.random() * 9);
  let color = Math.floor(Math.random() * colors.length);
  if(previous){
    if(coin()){
      position = previous.position;
    }
    if(coin()){
      color = previous.color;
    }
  }
  return {
    position: position,
    color: color
  };
}

function render(step){
  const colorCSS = colors[step.color];
  const position = step.position;
  const element = document.getElementById(`d${position}`);
  element.style.borderColor = `var(${colorCSS})`;
}

function unrender(step){
  const position = step.position;
  const element = document.getElementById(`d${position}`);
  element.style.borderColor = `black`;
}

function score(toScore={kind: "none", increase: 0}){
  const score = toScore.increase
  const color = score > 0 ? "green" : "red"
  let selector = ""
  if(toScore.kind == "pos"){
    correctPosC += score
    selector = "left"
  }
  if(toScore.kind == "col"){
    correctColC += score
    selector = "right"
  }
  document.getElementById(`${selector}-button`).querySelector("p").style.backgroundColor = `var(--sd-${color})`;
}

function checkReply(){
  if(history.length < 1 + BACK){
    return
  }
  total += 1;
  lastIdx = history.length - 1
  previousIdx = history.length - 1 - BACK
  const last = history[lastIdx]
  const previous = history[previousIdx]
  if(last.position == previous.position){
    if(lastReply.position){
      score({kind: "pos", increase: 1})
    } else {
      score({kind: "pos", increase: 0})
    }
  } else {
    if(!lastReply.position){
      score({kind: "pos", increase: 1})
    } else {
      score({kind: "pos", increase: 0})
    }
  }
  if(last.color == previous.color){
    if(lastReply.color){
      score({kind: "col", increase: 1})
    } else {
      score({kind: "col", increase: 0})
    }
  } else {
    if(!lastReply.color){
      score({kind: "col", increase: 1})
    } else {
      score({kind: "col", increase: 0})
    }
  }
  console.info(`pos: ${correctPosC} col: ${correctColC}`)
}

function stepping(){
  let step, prev
  checkReply();
  if(history.length >= 1){
    prev = history[history.length - 1];
    unrender(prev)
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
  const svg = progressContainer.querySelector("svg");
  const targetRect = square.getBoundingClientRect();
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  const containerLeft = targetCenterX - svg.clientWidth / 2;
  const containerTop = targetCenterY - svg.clientHeight / 2;
  progressContainer.style.left = `${containerLeft}px`;
  progressContainer.style.top = `${containerTop}px`;

  history.push(step);
  setTimeout(() => render(step), 300);
  resetReply()
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

