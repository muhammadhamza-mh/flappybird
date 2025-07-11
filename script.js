const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("overlay");
const gameOverScreen = document.getElementById("gameOverScreen");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreDisplay = document.getElementById("score");
const finalScore = document.getElementById("finalScore");

const birdImg = new Image();
birdImg.src = "https://i.ibb.co/p6rtypTB/bird.png";

const bgAudio = new Audio("https://cdn.pixabay.com/download/audio/2023/06/13/audio_d2529b13d5.mp3?filename=playful-run-146661.mp3");
bgAudio.loop = true;
bgAudio.volume = 0.2;

let bird = {
  x: 100,
  y: 300,
  radius: 20,
  width: 50,
  height: 40
};

let velocity = 0;
const gravity = 0.9;              // ⬆ Faster falling
const flapPower = -14;            // ⬆ Stronger flap

let pipeGap = 180;
const pipeWidth = 60;
let pipes = [];

let score = 0;
let isGameRunning = false;
let gameOver = false;
let level = "Easy";
let speed = 3;
let lastPipeX = 0;

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
  scoreDisplay.textContent = "Score: 0";
  level = "Easy";
  speed = 3;
  lastPipeX = canvas.width;
  spawnPipe();
  bgAudio.play();
}

function spawnPipe() {
  const top = Math.random() * (canvas.height / 2) + 50;
  // 🔥 VERY close pipes (tight spacing)
  pipes.push({ x: lastPipeX + 120, top, bottom: top + pipeGap, scored: false });
  lastPipeX += 120;
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
  if (!isGameRunning || gameOver) return;

  velocity += gravity;
  bird.y += velocity;

  updateLevel();

  pipes.forEach(pipe => {
    pipe.x -= speed;

    if (
      bird.x + bird.radius > pipe.x &&
      bird.x - bird.radius < pipe.x + pipeWidth &&
      (bird.y - bird.radius < pipe.top || bird.y + bird.radius > pipe.bottom)
    ) {
      endGame();
    }

    if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
      pipe.scored = true;
      score++;
      scoreDisplay.textContent = `Score: ${score} | Level: ${level}`;
    }
  });

  pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 120) {
    spawnPipe();
  }

  if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
    endGame();
  }
}
function drawPipe(x, y, height) {
  const gradient = ctx.createLinearGradient(x, y, x + pipeWidth, y + height);
  gradient.addColorStop(0, "#4ade80"); // green
  gradient.addColorStop(1, "#16a34a"); // darker green

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, pipeWidth, height, 15);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.shadowColor = "#22c55e";
  ctx.shadowBlur = 12;
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
  // Background gradient per level
  let bg;
  if (level === "Easy") {
    bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#87ceeb"); // sky blue
    bg.addColorStop(1, "#ffffff"); // white
  } else if (level === "Normal") {
    bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#fdba74"); // light orange
    bg.addColorStop(1, "#fef3c7"); // cream
  } else {
    bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#0f172a"); // dark navy
    bg.addColorStop(1, "#1e293b"); // dark blue gray
  }
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ☁️ Clouds only in Easy mode
  if (level === "Easy") {
    for (let i = 0; i < 6; i++) {
      const x = (i * 300 + (Date.now() / 40)) % (canvas.width + 200) - 100;
      const y = 60 + Math.sin(i + Date.now() / 1000) * 10;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.arc(x + 40, y + 10, 25, 0, Math.PI * 2);
      ctx.arc(x - 40, y + 10, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 🏙 City skyline (foreground layer 1)
  ctx.fillStyle = "rgba(30, 41, 59, 0.5)";
  for (let i = 0; i < canvas.width; i += 100) {
    let offset = (Date.now() / 30) % canvas.width;
    ctx.fillRect(i - offset, canvas.height - 100, 60, 100 - (i % 40));
  }

  // 🌿 Moving grass (foreground layer 2)
  ctx.fillStyle = "#10b981";
  for (let i = 0; i < canvas.width; i += 40) {
    let offset = (Date.now() / 20) % canvas.width;
    ctx.beginPath();
    ctx.arc(i - offset, canvas.height - 10, 20, Math.PI, 0);
    ctx.fill();
  }

  // 🐦 Bird
  const angle = Math.min(Math.max(velocity * 0.05, -0.4), 0.4);
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(angle);
  ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
  ctx.restore();

  // 🧱 Pipes
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
  if (!isGameRunning || gameOver) return;
  velocity = flapPower;
}

function startGame() {
  resetGame();
  isGameRunning = true;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
}

function endGame() {
  gameOver = true;
  isGameRunning = false;
  finalScore.textContent = `Your Score: ${score}`;
  gameOverScreen.classList.remove("hidden");
  bgAudio.pause();
  bgAudio.currentTime = 0;
}

window.addEventListener("keydown", e => {
  if (["Space", "ArrowUp"].includes(e.code)) e.preventDefault();

  if (gameOver && e.code === "Space") {
    startGame();
  }
});

document.addEventListener("keydown", e => {
  if (["Space", "ArrowUp"].includes(e.code)) flap();
});
canvas.addEventListener("click", flap);
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

gameLoop();
