// === Setup ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("overlay");
const gameOverScreen = document.getElementById("gameOverScreen");
const pauseOverlay = document.getElementById("pauseOverlay");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const scoreDisplay = document.getElementById("score");
const finalScore = document.getElementById("finalScore");
const volumeSlider = document.getElementById("volumeSlider");

const birdImg = new Image();
birdImg.src = "https://i.ibb.co/p6rtypTB/bird.png";

const bgAudio = new Audio("background.mp3");
const jumpSound = new Audio("flap.mp3");
const scoreSound = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_d1e408f9fc.mp3");
const gameOverSound = new Audio("gameover.mp3");

let allSounds = [bgAudio, jumpSound, scoreSound, gameOverSound];
allSounds.forEach(sound => sound.volume = 0.6);

let bird = { x: 100, y: 300, radius: 20, width: 50, height: 40 };
let velocity = 0;
const gravity = 0.9;
const flapPower = -14;

let pipeGap = 180;
const pipeWidth = 60;
let pipes = [];

let score = 0;
let highScore = localStorage.getItem("highScore") || 0;
let isGameRunning = false;
let gameOver = false;
let isPaused = false;
let level = "Easy";
let speed = 3;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function resetGame() {
  bird.y = canvas.height / 2;
  velocity = 0;
  pipes = [];
  score = 0;
  gameOver = false;
  isPaused = false;
  level = "Easy";
  speed = 3;
  scoreDisplay.textContent = `Score: 0 | Level: ${level} | High: ${highScore}`;
  const top = Math.random() * (canvas.height / 2) + 50;
  pipes.push({ x: bird.x + 200, top, bottom: top + pipeGap, scored: false });
  bgAudio.currentTime = 0;
  bgAudio.loop = true;
  bgAudio.play();
}

function getPipeSpacing() {
  if (level === "Hard") return 160;
  if (level === "Normal") return 200;
  return 230;
}

function spawnPipe() {
  const top = Math.random() * (canvas.height / 2) + 50;
  const pipeSpacing = getPipeSpacing();
  const x = pipes.length ? pipes[pipes.length - 1].x + pipeSpacing : bird.x + 200;
  pipes.push({ x, top, bottom: top + pipeGap, scored: false });
}

function updateLevel() {
  if (score >= 20) {
    level = "Hard";
    speed = 6;
    pipeGap = 140;
  } else if (score >= 10) {
    level = "Normal";
    speed = 4.5;
    pipeGap = 160;
  } else {
    level = "Easy";
    speed = 3;
    pipeGap = 180;
  }
}

function update() {
  if (!isGameRunning || gameOver || isPaused) return;
  velocity += gravity;
  bird.y += velocity;
  updateLevel();
  pipes.forEach(pipe => {
    pipe.x -= speed;
    const birdLeft = bird.x - bird.width / 2 + 5;
    const birdRight = bird.x + bird.width / 2 - 5;
    const birdTop = bird.y - bird.height / 2 + 5;
    const birdBottom = bird.y + bird.height / 2 - 5;
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + pipeWidth;
    if (
      birdRight > pipeLeft &&
      birdLeft < pipeRight &&
      (birdTop < pipe.top || birdBottom > pipe.bottom)
    ) {
      endGame();
    }
    if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
      pipe.scored = true;
      score++;
      scoreSound.currentTime = 0;
      scoreSound.play();
      scoreDisplay.textContent = `Score: ${score} | Level: ${level} | High: ${highScore}`;
    }
  });
  pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
  const lastPipe = pipes[pipes.length - 1];
  if (!lastPipe || (canvas.width - lastPipe.x) >= getPipeSpacing()) spawnPipe();
  if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
    endGame();
  }
}

function drawPipe(x, y, height) {
  const gradient = ctx.createLinearGradient(x, y, x + pipeWidth, y + height);
  gradient.addColorStop(0, "#4ade80");
  gradient.addColorStop(1, "#16a34a");
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, pipeWidth, height, 15);
  ctx.fillStyle = gradient;
  ctx.shadowColor = "#22c55e";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.strokeStyle = "#15803d";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

CanvasRenderingContext2D.prototype.roundRect ||= function (x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
};

function draw() {
  function drawForeground() {
  const t = Date.now();
  const hillOffset = (t / 30) % canvas.width;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-hillOffset, canvas.height - 50);
  ctx.bezierCurveTo(
    canvas.width * 0.25 - hillOffset, canvas.height - 100,
    canvas.width * 0.75 - hillOffset, canvas.height,
    canvas.width * 1.2 - hillOffset, canvas.height - 50
  );
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();

  const grassGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
  grassGradient.addColorStop(0, "#4ade80");
  grassGradient.addColorStop(1, "#16a34a");
  ctx.fillStyle = grassGradient;
  ctx.fill();
  ctx.restore();
}
drawForeground();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, level === "Hard" ? "#0f172a" : level === "Normal" ? "#fdba74" : "#87ceeb");
  bg.addColorStop(1, level === "Hard" ? "#1e293b" : level === "Normal" ? "#fef3c7" : "#ffffff");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const angle = Math.min(Math.max(velocity * 0.05, -0.4), 0.4);
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(angle);
  ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  ctx.restore();
  pipes.forEach(pipe => {
    drawPipe(pipe.x, 0, pipe.top);
    drawPipe(pipe.x, pipe.bottom, canvas.height - pipe.bottom);
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function flap() {
  if (!isGameRunning || gameOver || isPaused) return;
  velocity = flapPower;
  jumpSound.currentTime = 0;
  jumpSound.play();
  setTimeout(() => {
    jumpSound.pause();
    jumpSound.currentTime = 0;
  }, 800);
}

function startGame() {
  resetGame();
  isGameRunning = true;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseOverlay.classList.add("hidden");
}

function endGame() {
  gameOver = true;
  isGameRunning = false;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  gameOverSound.currentTime = 0;
  gameOverSound.play();
  finalScore.textContent = `Your Score: ${score} | High Score: ${highScore}`;
  gameOverScreen.classList.remove("hidden");
  bgAudio.pause();
  bgAudio.currentTime = 0;
}

// 🔁 PAUSE FUNCTIONALITY
function togglePause() {
  if (!isGameRunning || gameOver) return;
  isPaused = !isPaused;
  pauseOverlay.classList.toggle("hidden", !isPaused);
  if (isPaused) {
    bgAudio.pause();
    pauseBtn.textContent = "Resume";
  } else {
    bgAudio.play();
    pauseBtn.textContent = "Pause";
  }
}

// 🧠 EVENT LISTENERS
window.addEventListener("keydown", (e) => {
  if (["Space", "ArrowUp"].includes(e.code)) e.preventDefault();
  if (!isGameRunning && !gameOver && e.code === "Space") {
    startGame();
  } else if (gameOver && e.code === "Space") {
    startGame();
  } else if (e.code === "KeyP") {
    togglePause();
  }
});

document.addEventListener("keydown", e => {
  if (["Space", "ArrowUp"].includes(e.code)) flap();
});

canvas.addEventListener("click", flap);
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);

volumeSlider.addEventListener("input", () => {
  const volume = volumeSlider.value / 100;
  allSounds.forEach(sound => sound.volume = volume);
});

gameLoop();
