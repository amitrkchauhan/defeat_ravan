const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const GRID_ROWS = 5;
const GRID_COLS = 4;
const SPACING = 3;

// Screens
const SCREEN_TITLE = 0;
const SCREEN_INSTRUCTIONS1 = 1;
const SCREEN_GAME = 2;
const SCREEN_INSTRUCTIONS2 = 3;
const SCREEN_GAMEOVER = 4;
const SCREEN_CREDITS = 5;
let SCREEN = SCREEN_TITLE;

// Game states

const SCREEN_GAME_START_COUNTDOWN = 0;
const SCREEN_GAME_ALL_WINDOW_OPEN = 1;
const SCREEN_GAME_WATCH_TIMER = 2;
const SCREEN_GAME_PLAYING = 3;
const SCREEN_GAME_BLASTING = 4;
const SCREEN_GAME_POPUP = 5;
const SCREEN_GAME_ENDED = 6;
let gameState = SCREEN_GAME_START_COUNTDOWN;

// Countdown
let countdown = 3;

// Loading bar
let loadingProgress = 0; // 0 → 1 (percentage as fraction)

// UI images
const titleImg = new Image(); titleImg.src = "assets/title1.png";
const instruction1 = new Image(); instruction1.src = "assets/instruction1.png";
const instruction2 = new Image(); instruction2.src = "assets/instruction2.png";
const startButton = new Image(); startButton.src = "assets/start_button.png";
const findEvilButton = new Image(); findEvilButton.src = "assets/find_evil_button.png";
const loose_screen = new Image(); loose_screen.src = "assets/loose_screen.png";
const win_screen = new Image(); win_screen.src = "assets/win_screen.png";
const playAgainButton = new Image(); playAgainButton.src = "assets/play_again_button.png";
const closeButton = new Image(); closeButton.src = "assets/close_button.png";

// Game assets
const windowFrames = ["assets/window1.png", "assets/window2.png", "assets/window3.png"].map(src => {
  const img = new Image(); img.src = src; return img;
});
const blastFrames = ["assets/blast1.png", "assets/blast2.png", "assets/blast3.png"].map(src => {
  const img = new Image(); img.src = src; return img;
});

// Devils with linked offers
const devilData = [];
for (let i = 1; i <= 10; i++) {
  devilData.push({
    devilImg: (() => { const img = new Image(); img.src = `assets/D${i}.png`; return img; })(),
    offerImg: (() => { const img = new Image(); img.src = `assets/offer${i}.png`; return img; })(),
    offerLink: `https://example.com/offer${i}`
  });
}

let grid = [];
let cellSize, offsetX, offsetY;

function setupGrid() {
  const shuffled = [...devilData].sort(() => Math.random() - 0.5);
  const chosenDevils = shuffled.slice(0, 10); // place 10 devils

  grid = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({
        devil: null,
        state: "closed", // closed | opening | open | blasting | completed
        frame: 0,
        blastFrame: 0,
      });
    }
    grid.push(row);
  }

  // Randomly place chosen devils
  let placed = 0;
  while (placed < chosenDevils.length) {
    const r = Math.floor(Math.random() * GRID_ROWS);
    const c = Math.floor(Math.random() * GRID_COLS);
    if (!grid[r][c].devil) {
      grid[r][c].devil = chosenDevils[placed];
      placed++;
    }
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const totalSpacingX = (GRID_COLS - 1) * SPACING;
  const totalSpacingY = (GRID_ROWS - 1) * SPACING;

  cellSize = Math.floor(
    Math.min(
      (canvas.width - totalSpacingX) / GRID_COLS,
      (canvas.height - totalSpacingY) / GRID_ROWS
    )
  );

  offsetX = (canvas.width - (GRID_COLS * cellSize + totalSpacingX)) / 2;
  offsetY = (canvas.height - (GRID_ROWS * cellSize + totalSpacingY)) / 2;
}

function drawBackground() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = grid[r][c];
      const x = offsetX + c * (cellSize + SPACING);
      const y = offsetY + r * (cellSize + SPACING);

      if (cell.state === "removed") continue;

      if (SCREEN === SCREEN_GAME) {
        switch (gameState) {
          case SCREEN_GAME_START_COUNTDOWN:
            if (windowFrames[0].complete) {
              ctx.drawImage(windowFrames[0], x, y, cellSize, cellSize);
            }
            break;
          case SCREEN_GAME_ALL_WINDOW_OPEN:
            // Show windows open
            if (windowFrames[2].complete) {
              ctx.drawImage(windowFrames[2], x, y, cellSize, cellSize);
            }
            if (cell.devil && cell.devil.devilImg.complete) {
              const scale = 0.85;
              const devilW = cellSize * scale;
              const devilH = cellSize * scale;
              const devilX = x + (cellSize - devilW) / 2;
              const devilY = y + (cellSize - devilH) / 2;
              ctx.drawImage(cell.devil.devilImg, devilX, devilY, devilW, devilH);
            }
            break;
          case SCREEN_GAME_PLAYING:
            // Normal closed windows
            if (cell.state === "closed") {
              ctx.drawImage(windowFrames[0], x, y, cellSize, cellSize);
            } else if (cell.state === "opening") {
              ctx.drawImage(windowFrames[cell.frame], x, y, cellSize, cellSize);
            } else if (cell.state === "open") {
              ctx.drawImage(windowFrames[2], x, y, cellSize, cellSize);
              if (cell.devil && cell.devil.devilImg.complete) {
                const scale = 0.85;
                const devilW = cellSize * scale;
                const devilH = cellSize * scale;
                const devilX = x + (cellSize - devilW) / 2;
                const devilY = y + (cellSize - devilH) / 2;
                ctx.drawImage(cell.devil.devilImg, devilX, devilY, devilW, devilH);
              }
            } else if (cell.state === "blasting") {
              if (blastFrames[cell.blastFrame].complete) {
                ctx.drawImage(blastFrames[cell.blastFrame], x, y, cellSize, cellSize);
              }
              ctx.drawImage(windowFrames[2], x, y, cellSize, cellSize);
            } else if (cell.state === "completed") {
              ctx.drawImage(windowFrames[2], x, y, cellSize, cellSize);
            }
            break;
        }
      }
    }
  }
}

function drawScene() {
  drawBackground();
  drawGrid();

  switch (SCREEN) {
    case SCREEN_TITLE:
      if (titleImg.complete) {
        const maxWidth = canvas.width * 1.0;
        const scale = maxWidth / titleImg.width;
        const titleW = titleImg.width * scale;
        const titleH = titleImg.height * scale;
        const titleX = (canvas.width - titleW) / 2;
        const titleY = (canvas.height - titleH) / 2;
        ctx.drawImage(titleImg, titleX, titleY, titleW, titleH);
      }
      drawLoadingBar();
      loadingProgress += 0.005;
      if (loadingProgress > 1) loadingProgress = 1;

      if (loadingProgress === 1) {
        setTimeout(() => {
          SCREEN = SCREEN_INSTRUCTIONS1;
        }, 500);
      }
      break;

    case SCREEN_INSTRUCTIONS1:
      if (instruction1.complete) {
        const maxWidth = canvas.width * 1.0;
        const scale = maxWidth / instruction1.width;
        const instruction1W = instruction1.width * scale;
        const instruction1H = instruction1.height * scale;
        const instruction1X = (canvas.width - instruction1W) / 2;
        const instruction1Y = (canvas.height - instruction1H) / 2;
        ctx.drawImage(instruction1, instruction1X, instruction1Y, instruction1W, instruction1H);
      }
      if (startButton.complete) {
        const startButtonW = startButton.width * 0.25;
        const startButtonH = startButton.height * 0.25;
        const startButtonX = (canvas.width - startButtonW) / 2;
        const startButtonY = (canvas.height + ((canvas.width / instruction1.width) * instruction1.height)) / 2.35;
        ctx.drawImage(startButton, startButtonX, startButtonY, startButtonW, startButtonH);
      }
      break;

    case SCREEN_GAME:
      if (gameState === SCREEN_GAME_START_COUNTDOWN) {
        ctx.fillStyle = "white";
        ctx.font = `${canvas.width * 0.2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
      }
      break;
  }
}

// Animate cell opening
function animateCell(cell) {
  if (cell.state === "closed") {
    cell.state = "opening";
    cell.frame = 0;

    let openInterval = setInterval(() => {
      cell.frame++;
      if (cell.frame >= windowFrames.length - 1) {
        clearInterval(openInterval);
        cell.state = "open";

        if (cell.devil) {
          setTimeout(() => {
            cell.state = "blasting";
            cell.blastFrame = 0;
            let blastInterval = setInterval(() => {
              cell.blastFrame++;
              if (cell.blastFrame >= blastFrames.length) {
                clearInterval(blastInterval);
                showOfferPopup(cell.devil);
                cell.state = "completed";
              }
            }, 150);
          }, 600);
        }
      }
    }, 100);
  }
}

// Click handling
canvas.addEventListener("click", (e) => {
  switch (SCREEN) {
    case SCREEN_INSTRUCTIONS1:
      let countdownInterval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          gameState = SCREEN_GAME_ALL_WINDOW_OPEN;
          SCREEN = SCREEN_GAME;
          clearInterval(countdownInterval);

          // After 3s reveal, close all windows
          setTimeout(() => {
            grid.forEach(row => row.forEach(cell => {
              cell.state = "opening";
              cell.frame = windowFrames.length - 1;
              let closeInterval = setInterval(() => {
                cell.frame--;
                if (cell.frame <= 0) {
                  clearInterval(closeInterval);
                  cell.state = "closed";
                }
              }, 150);
            }));
            gameState = SCREEN_GAME_PLAYING;
          }, 5000);
        }
      }, 10);
      break;

    case SCREEN_GAME:
      if (gameState === SCREEN_GAME_PLAYING) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            const x = offsetX + c * (cellSize + SPACING);
            const y = offsetY + r * (cellSize + SPACING);

            if (
              mouseX >= x && mouseX <= x + cellSize &&
              mouseY >= y && mouseY <= y + cellSize
            ) {
              const cell = grid[r][c];
              if (cell.state === "closed") {
                animateCell(cell);
              }
            }
          }
        }
      }
      break;
  }
});

function gameLoop() {
  drawScene();
  requestAnimationFrame(gameLoop);
}

setupGrid();
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
gameLoop();

/* ----------------------
   Popup handling
----------------------- */
const offerPopup = document.getElementById("offerPopup");
const offerImage = document.getElementById("offerImage");
const offerLink = document.getElementById("offerLink");
const closeOffer = document.getElementById("closeOffer");

function showOfferPopup(devil) {
  offerImage.src = devil.offerImg.src;
  offerLink.href = devil.offerLink;
  offerPopup.style.display = "flex";
}

closeOffer.addEventListener("click", () => {
  offerPopup.style.display = "none";
});

function drawLoadingBar() {
  const barWidth = canvas.width * 0.6;
  const barHeight = 12;
  const barX = (canvas.width - barWidth) / 2;
  const barY = canvas.height * 0.90;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  drawRoundedRect(barX, barY, barWidth, barHeight, 10);
  ctx.stroke();

  ctx.fillStyle = "#fcda00ff";
  drawRoundedRect(barX, barY, barWidth * loadingProgress, barHeight, 10);
  ctx.fill();
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
