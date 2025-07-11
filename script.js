// Конфигурация
const CONFIG = {
  colors: ["red", "blue", "green", "yellow"],
  flashDuration: 300,
  delayBetweenFlashes: 600,
  vibrationDuration: 30
};

const gameState = {
  sequence: [],
  userInput: [],
  level: 0,
  bestScore: Number(localStorage.getItem("bestScore")) || 0,
  canClick: false,
  audioContext: null,
  soundBuffers: {}
};

const elements = {
  statusText: document.getElementById("status-text"),
  scoreEl: document.getElementById("score"),
  highScoreEl: document.getElementById("high-score"),
  startBtn: document.getElementById("start-btn"),
  splashScreen: document.getElementById("splash-screen"),
  splashBtn: document.getElementById("splash-btn"),
  levelFlash: document.getElementById("level-flash"),
  colorBtns: document.querySelectorAll(".color-btn")
};

const soundFrequencies = {
  red: 329.63,
  blue: 440.00,
  green: 587.33,
  yellow: 659.25,
  error: 220.00
};

async function initAudio() {
  try {
    if (!gameState.audioContext) {
      gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      for (const color in soundFrequencies) {
        gameState.soundBuffers[color] = createSoundBuffer(soundFrequencies[color]);
      }
    }
  } catch (e) {
    console.log("Audio initialization error:", e);
  }
}

function createSoundBuffer(frequency) {
  const duration = 0.3;
  const sampleRate = gameState.audioContext.sampleRate;
  const frameCount = Math.floor(duration * sampleRate);
  const buffer = gameState.audioContext.createBuffer(1, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    const time = i / sampleRate;
    channelData[i] = Math.sin(2 * Math.PI * frequency * time) * Math.exp(-time * 3);
  }
  
  return buffer;
}

function playSound(type) {
  if (!gameState.audioContext) return;
  
  try {
    const source = gameState.audioContext.createBufferSource();
    source.buffer = gameState.soundBuffers[type];
    source.connect(gameState.audioContext.destination);
    source.start();
  } catch (e) {
    console.log("Sound error:", e);
  }
}

function flashColor(color) {
  const btn = document.getElementById(color);
  btn.classList.add("flash");
  playSound(color);
  
  if ("vibrate" in navigator) {
    navigator.vibrate(CONFIG.vibrationDuration);
  }
  
  setTimeout(() => {
    btn.classList.remove("flash");
  }, CONFIG.flashDuration);
}

function showLevelFlash() {
  elements.levelFlash.textContent = `Уровень ${gameState.level}`;
  elements.levelFlash.classList.add("show");
  
  setTimeout(() => {
    elements.levelFlash.classList.remove("show");
  }, 1000);
}

function nextRound() {
  gameState.canClick = false;
  gameState.userInput = [];
  gameState.level++;
  
  updateScore();
  showLevelFlash();
  
  const nextColor = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
  gameState.sequence.push(nextColor);
  
  let i = 0;
  const showSequence = () => {
    if (i < gameState.sequence.length) {
      flashColor(gameState.sequence[i]);
      i++;
      setTimeout(showSequence, CONFIG.delayBetweenFlashes);
    } else {
      gameState.canClick = true;
      elements.statusText.textContent = "Твоя очередь!";
    }
  };
  
  setTimeout(showSequence, 800);
}

function updateScore() {
  const currentScore = gameState.level - 1;
  elements.scoreEl.textContent = currentScore;
  
  if (currentScore > gameState.bestScore) {
    gameState.bestScore = currentScore;
    elements.highScoreEl.textContent = gameState.bestScore;
    localStorage.setItem("bestScore", gameState.bestScore);
  }
}

function handleUserClick(color) {
  if (!gameState.canClick) return;
  
  flashColor(color);
  gameState.userInput.push(color);
  
  const currentIndex = gameState.userInput.length - 1;
  
  if (gameState.userInput[currentIndex] !== gameState.sequence[currentIndex]) {
    endGame();
    return;
  }
  
  if (gameState.userInput.length === gameState.sequence.length) {
    gameState.canClick = false;
    setTimeout(nextRound, 800);
  }
}

function endGame() {
  playSound("error");
  elements.statusText.textContent = `❌ Игра окончена! Рекорд: ${gameState.bestScore}`;
  
  gameState.sequence = [];
  gameState.level = 0;
  gameState.canClick = false;
}

async function startGame() {
  await initAudio(); // ДОЛЖНОООООО!!! инициализираать аудио по клику
  
  gameState.sequence = [];
  gameState.level = 0;
  updateScore();
  elements.statusText.textContent = "Запоминай!";
  nextRound();
}

function initGame() {
  // Загрузочный экран - кнопка запускает аудио и скрывает экран -- НЕ РАБОТАЕТ. (НА ПОТОМ)
  elements.splashBtn.addEventListener("click", async () => {
    await initAudio();
    elements.splashScreen.style.display = "none";
    elements.startBtn.focus();
  });
  
  elements.startBtn.addEventListener("click", startGame);
  
  elements.colorBtns.forEach(btn => {
    btn.addEventListener("click", () => handleUserClick(btn.dataset.color));
  });
  
  elements.highScoreEl.textContent = gameState.bestScore;
}

document.addEventListener("DOMContentLoaded", initGame);
