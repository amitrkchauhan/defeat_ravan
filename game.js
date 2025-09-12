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
let SCREEN = -1;

// Game states
const SCREEN_GAME_START_COUNTDOWN = 0;
const SCREEN_GAME_ALL_WINDOW_OPEN = 1;
const SCREEN_GAME_PLAYING = 2;
const SCREEN_GAME_BLASTING = 3;
const SCREEN_GAME_POPUP = 4;
const SCREEN_GAME_ENDED = 5;
let gameState = SCREEN_GAME_START_COUNTDOWN;

// Countdown & reveal timer
let countdown = 3;
let revealTimer = 5;
let revealInterval;

// Loading state
let assetsToLoad = 0;
let assetsLoaded = 0;
let loadingProgress = 0;

// Arrays for animation frames
let windowFrames = [];
let blastFrames = [];

// Title image (load first)
const titleImg = new Image();
titleImg.src = "assets/title1.png";
titleImg.onload = () => {
  startLoadingAssets();
  SCREEN = SCREEN_TITLE;
};

// Asset paths
const assetPaths = [
  "assets/instruction1.png",
  "assets/instruction2.png",
  "assets/start_button.png",
  "assets/find_evil_button.png",
  "assets/loose_screen.png",
  "assets/win_screen.png",
  "assets/play_again_button.png",
  "assets/close_button.png",
  "assets/window1.png",
  "assets/window2.png",
  "assets/window3.png",
  "assets/blast1.png",
  "assets/blast2.png",
  "assets/blast3.png",
  ...Array.from({ length: 10 }, (_, i) => `assets/D${i + 1}.png`),
  ...Array.from({ length: 10 }, (_, i) => `assets/offer${i + 1}.png`)
];

const loadedAssets = {};

function startLoadingAssets() {
  assetsToLoad = assetPaths.length;

  assetPaths.forEach(path => {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      assetsLoaded++;
      // console.log(`Loaded: ${path} (${assetsLoaded}/${assetsToLoad})`);
      loadedAssets[path] = img;
      if (assetsLoaded === assetsToLoad) {
        setupFrames();
        setupGrid();
      }
    };
  });
}

// Initialize animation frame arrays
function setupFrames() {
  windowFrames = [
    loadedAssets["assets/window1.png"],
    loadedAssets["assets/window2.png"],
    loadedAssets["assets/window3.png"]
  ];

  blastFrames = [
    loadedAssets["assets/blast1.png"],
    loadedAssets["assets/blast2.png"],
    loadedAssets["assets/blast3.png"]
  ];
}

// Grid + devils
let grid = [];
let cellSize, offsetX, offsetY;
const devilData = [];

function setupGrid() {
  devilData.length = 0;
  for (let i = 1; i <= 10; i++) {
    devilData.push({
      devilImg: loadedAssets[`assets/D${i}.png`],
      offerImg: loadedAssets[`assets/offer${i}.png`],
      offerLink: `https://www.ajio.com/${i}`
    });
  }

  const shuffled = [...devilData].sort(() => Math.random() - 0.5);
  const chosenDevils = shuffled.slice(0, 10);

  grid = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({
        devil: null,
        state: "closed",
        frame: 0,
        blastFrame: 0,
      });
    }
    grid.push(row);
  }

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
  ctx.fillStyle = "#180b00";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = grid[r][c];
      const x = offsetX + c * (cellSize + SPACING);
      const y = offsetY + r * (cellSize + SPACING);

      if (SCREEN === SCREEN_GAME) {
        switch (gameState) {
          case SCREEN_GAME_START_COUNTDOWN:
            ctx.drawImage(windowFrames[0], x, y, cellSize, cellSize);
            break;
          case SCREEN_GAME_ALL_WINDOW_OPEN:

            if (cell.devil && cell.devil.devilImg) {
              const scale = 0.85;
              const devilW = cellSize * scale;
              const devilH = cellSize * scale;
              const devilX = x + (cellSize - devilW) / 2;
              const devilY = y + (cellSize - devilH) / 2;
              ctx.drawImage(cell.devil.devilImg, devilX, devilY, devilW, devilH);
            }
            ctx.drawImage(windowFrames[cell.frame], x, y, cellSize, cellSize);
            break;
          case SCREEN_GAME_PLAYING:
            // console.log(cell.state);
            if (cell.devil && cell.devil.devilImg && cell.state != "open" && cell.state != "completed" && cell.state != "blasting") {
              const scale = 0.85;
              const devilW = cellSize * scale;
              const devilH = cellSize * scale;
              const devilX = x + (cellSize - devilW) / 2;
              const devilY = y + (cellSize - devilH) / 2;
              ctx.drawImage(cell.devil.devilImg, devilX, devilY, devilW, devilH);
            } else if (cell.devil && (cell.state === "open" || cell.state === "blasting")) {
              const scale = 0.85;
              const devilW = cellSize * scale;
              const devilH = cellSize * scale;
              const devilX = x + (cellSize - devilW) / 2;
              const devilY = y + (cellSize - devilH) / 2;
              ctx.drawImage(blastFrames[cell.blastFrame], devilX, devilY, devilW, devilH);
            }

            if (cell.state === "closed") {
              ctx.drawImage(windowFrames[0], x, y, cellSize, cellSize);
              // console.log("closed Unknown cell state:", cell.state);
            } else if (cell.state === "opening") {
              ctx.drawImage(windowFrames[cell.frame], x, y, cellSize, cellSize);
              // console.log("opening Unknown cell state:", cell.state);
            } else if (cell.state === "open" || cell.state === "completed" || cell.state === "blasting") {
              ctx.drawImage(windowFrames[2], x, y, cellSize, cellSize);
              // console.log("open completed Unknown cell state:", cell.state);
            } else {
              console.log("else Unknown cell state:", cell.state);
            }
            break;
          case SCREEN_GAME_POPUP:
            break;
          case SCREEN_GAME_ENDED:
            break;
        }
      }
    }
  }
}

function drawScene() {
  drawBackground();
  if (SCREEN > SCREEN_TITLE && assetsToLoad > 0) {
    drawGrid();
  }


  switch (SCREEN) {
    case SCREEN_TITLE:
      if (titleImg.complete) {
        const scale = canvas.width / titleImg.width;
        const titleW = titleImg.width * scale;
        const titleH = titleImg.height * scale;
        const titleX = (canvas.width - titleW) / 2;
        const titleY = (canvas.height - titleH) / 3;
        ctx.drawImage(titleImg, titleX, titleY, titleW, titleH);
      }

      if (assetsToLoad > 0) {
        // loadingProgress = assetsLoaded / assetsToLoad;

        setInterval(() => {
          loadingProgress += 0.01;
        }, 2500);
        if (loadingProgress >= 1) {
          loadingProgress = 1;
        }
        drawLoadingBar();

        if (loadingProgress >= 1) {
          loadingProgress = 1;
          setTimeout(() => {
            SCREEN = SCREEN_INSTRUCTIONS1;
          }, 500);
        }
      }
      break;
    case SCREEN_INSTRUCTIONS1:
      const instruction1_scale = canvas.width / loadedAssets["assets/instruction1.png"].width;
      const instruction1W = loadedAssets["assets/instruction1.png"].width * instruction1_scale;
      const instruction1H = loadedAssets["assets/instruction1.png"].height * instruction1_scale;
      const instruction1X = (canvas.width - instruction1W) / 2;
      const instruction1Y = (canvas.height - instruction1H) / 2;
      ctx.drawImage(loadedAssets["assets/instruction1.png"], instruction1X, instruction1Y, instruction1W, instruction1H);

      const startButton_scale = canvas.width / loadedAssets["assets/instruction1.png"].width;
      const startButtonW = loadedAssets["assets/instruction1.png"].width * startButton_scale * 0.35;
      const startButtonH = loadedAssets["assets/instruction1.png"].height * startButton_scale * 0.15;
      const startButtonX = (canvas.width - startButtonW) / 2;
      const startButtonY = (canvas.height - startButtonH) / 1.5;

      ctx.drawImage(loadedAssets["assets/start_button.png"], startButtonX, startButtonY, startButtonW, startButtonH);

      break;
    case SCREEN_GAME:
      // if (gameState === SCREEN_GAME_START_COUNTDOWN) {
      //   ctx.fillStyle = "white";
      //   ctx.font = `${canvas.width * 0.2}px Arial Black`;
      //   ctx.textAlign = "center";
      //   ctx.textBaseline = "middle";
      //   ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
      // }

      if (gameState === SCREEN_GAME_ALL_WINDOW_OPEN) {
        ctx.fillStyle = "yellow";
        ctx.font = `${canvas.width * 0.08}px Arial Black`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(revealTimer, canvas.width / 2, 30);
      }
      break;
  }
}

canvas.addEventListener("click", (e) => {
  if (SCREEN === SCREEN_INSTRUCTIONS1) {
    SCREEN = SCREEN_GAME;
    // gameState = SCREEN_GAME_START_COUNTDOWN;
    // gameState = SCREEN_GAME_ALL_WINDOW_OPEN;
    countdown = 1;

    let countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        gameState = SCREEN_GAME_ALL_WINDOW_OPEN;
        revealTimer = 5;

        revealInterval = setInterval(() => {
          revealTimer--;
          if (revealTimer <= 0) {
            clearInterval(revealInterval);
            // grid.forEach(row => row.forEach(cell => (cell.state = "closed")));
            grid.forEach(row => row.forEach(cell => {
              animateWindow(cell, false, () => {
                cell.state = "closed";
              });
            }));
            gameState = SCREEN_GAME_PLAYING;
          }
        }, 1000);
      }
      grid.forEach(row => row.forEach(cell => {
        animateWindow(cell, true, () => {
          cell.state = "open";
        });
      }));
    }, 1000);
  } else if (SCREEN === SCREEN_GAME && gameState === SCREEN_GAME_PLAYING) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = offsetX + c * (cellSize + SPACING);
        const y = offsetY + r * (cellSize + SPACING);

        if (
          mouseX >= x &&
          mouseX <= x + cellSize &&
          mouseY >= y &&
          mouseY <= y + cellSize
        ) {
          const cell = grid[r][c];

          if (cell.state === "closed") {
            animateWindow(cell, true, () => {

              setTimeout(() => {
                cell.state = "open";
                animateBlast(cell);
              }, 1000);
            });
          }
        }
      }
    }
  }


});

function gameLoop() {
  drawScene();
  requestAnimationFrame(gameLoop);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
gameLoop();

/* ----------------------
   Loading Bar
----------------------- */
function drawLoadingBar() {
  const barWidth = canvas.width * 0.6;
  const barHeight = 20;
  const barX = (canvas.width - barWidth) / 2;
  const barY = canvas.height * 0.85;

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

function animateWindow(cell, open = true, onComplete = null) {
  cell.state = "opening";
  cell.frame = open ? 0 : windowFrames.length - 1;
  const step = open ? 1 : -1;

  const interval = setInterval(() => {
    // console.log(`Animating cell to frame`, cell.frame, interval, step, open, windowFrames.length, SCREEN, gameState);
    cell.frame += step;

    if (open && cell.frame >= windowFrames.length - 1) {
      clearInterval(interval);
      // cell.state = "open";
      if (onComplete) onComplete();
    }

    if (!open && cell.frame <= 0) {
      clearInterval(interval);
      // cell.state = "closed";
      if (onComplete) onComplete();
    }
  }, 150); // 150ms per frame
}

function animateBlast(cell) {

  // Trigger blast if devil
  if (cell.devil) {
    setTimeout(() => {
      cell.state = "blasting";
      cell.blastFrame = 0;

      let blastInterval = setInterval(() => {
        cell.blastFrame++;
        if (cell.blastFrame >= blastFrames.length) {
          clearInterval(blastInterval);
          // show popup then remove window
          cell.state = "completed";
          showOfferPopup(cell.devil);
        }
      }, 150);
    }, 150);
  }
}


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
