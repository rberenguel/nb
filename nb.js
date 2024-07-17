// a
const colors = [
  '--sd-yellow', '--sd-orange', '--sd-red', '--sd-magenta',
  '--sd-violet', '--sd-blue', '--sd-cyan', '--sd-green'
];

let BACK = 1

function getRandomSolarizedColor() {
  return colors[randomIndex];
}

let lastReply
function resetReply() {
  lastReply = { position: false, color: false };
}

window.active = false

Array.from(document.querySelectorAll('.inner-square')).map(e => {
  e.addEventListener('click', ev => {
    BACK = +(e.id.replace("d", ""))+1
    document.getElementById("top-button").textContent = BACK;
  })
})

function startStop() {
  console.log('Start/stop');
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
  } else {
    document.getElementById("top-button").textContent = BACK;
    document.getElementById("left-button").classList.add("front")
    document.getElementById("right-button").classList.add("front")
    document.getElementById("middle-button").classList.add("front")
    document.getElementById("left-button").classList.remove("back")
    document.getElementById("right-button").classList.remove("back")
    document.getElementById("middle-button").classList.remove("back")
    window.active = setInterval(stepping, 4000)
    squares.map(e => e.style.borderColor = "black")
  }
}

document.getElementById('middle-button').addEventListener('click', startStop)
document.getElementById('top-button').addEventListener('click', startStop)

document.getElementById('left-button').addEventListener('click', function() {
  console.log('Same position');
  lastReply.position = true;
});

document.getElementById('right-button').addEventListener('click', function() {
  console.log('Same color');
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
  console.log("Rendering")
  const colorCSS = colors[step.color];
  const position = step.position;
  const element = document.getElementById(`d${position}`);
  element.style.borderColor = `var(${colorCSS})`;
}

function unrender(step){
  console.log("Unrendering")
  const position = step.position;
  const element = document.getElementById(`d${position}`);
  element.style.borderColor = `black`;
}

let history = []
let correctPosC = 0
let correctColC = 0

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
  lastIdx = history.length - 1
  previousIdx = history.length - 1 - BACK
  const last = history[lastIdx]
  const previous = history[previousIdx]
  console.log(last, previous)
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
  history.push(step);
  setTimeout(() => render(step), 300);
  console.info(history);
  resetReply()
}

resetReply();

