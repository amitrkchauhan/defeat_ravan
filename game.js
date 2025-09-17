const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const BUTTON_STATE_NONE = 0;
const BUTTON_STATE_DOWN = 1;
const BUTTON_STATE_UP = 2;


let hud_cross;
let hud_crossH;
let hud_crossX;
let hud_crossY;

let play_again_scale;
let play_againW;
let play_againH;
let play_againX;
let play_againY;

let visit_brand_scale;
let visit_brandW;
let visit_brandH;
let visit_brandX;
let visit_brandY;

let button_close_scale;
let button_closeW;
let button_closeH;
let button_closeX;
let button_closeY;

let button_state = BUTTON_STATE_NONE;

// Background music
const bgMusic = new Audio("assets/bg_loop.mp3");
bgMusic.loop = true;      // keep looping
bgMusic.volume = 0.5;     // default volume (0.0 - 1.0)

// Example SFX
const sfxClick = new Audio("assets/button_click.mp3");
const sfxBlast = new Audio("assets/explosion.mp3");
const sfxEvilLaugh1 = new Audio("assets/evil_laugh.mp3");
const sfxEvilLaugh2 = new Audio("assets/evil_laugh2.mp3");
const sfxWindow = new Audio("assets/window.mp3");
const sfxWrongAnswer = new Audio("assets/wrong_answer.mp3");

let firstTouch = false;
let pulseTime = 0;

// const sfxWin   = new Audio("assets/win.mp3");
const GRID_ROWS = 5;
const GRID_COLS = 4;
const SPACING = 3;

// Screens
const SCREEN_NONE = -1;
const SCREEN_TITLE = 0;
const SCREEN_GAME = 1;
const SCREEN_WIN = 2;
const SCREEN_LOOSE = 3;
const SCREEN_INSTRUCTIONS1 = 4;
const SCREEN_INSTRUCTIONS2 = 5;

const TOTAL_HEADS = 10;
let headCount = 0;

let SCREEN = SCREEN_NONE;

// Game states
const gameStates = {
  NONE: -1,
  ALL_WINDOW_OPEN: 0,
  INSTRUCTION1: 1,
  TIMER: 2,
  ALL_WINDOW_CLOSE: 3,
  INSTRUCTION2: 4,
  START: 5,
  POPUP: 6,
  WIN: 7,
  LOOSE: 8
};
const SCREEN_GAME_START_COUNTDOWN = 10;
const SCREEN_GAME_ALL_WINDOW_OPEN = 11;
const SCREEN_GAME_PLAYING = 12;
const SCREEN_GAME_BLASTING = 13;
const SCREEN_GAME_POPUP = 14;
const SCREEN_GAME_ENDED = 15;
let gameState = gameStates.NONE;
let playerLives = 3;

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

const brandLogo = new Image();
brandLogo.src = "assets/ajio.png";


// Title image (load first)
const titleImg = new Image();
titleImg.src = "assets/title1.png";
titleImg.onload = () => {
  startLoadingAssets();
  setScreen(SCREEN_TITLE);
  playBGMusic();
  // SCREEN = SCREEN_TITLE;
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
  "assets/window1.png",
  "assets/window2.png",
  "assets/window3.png",
  "assets/blast1.png",
  "assets/blast2.png",
  "assets/blast3.png",
  "assets/hud_bg.png",
  "assets/hud_cross.png",
  "assets/hud_heart.png",
  "assets/hud_heart2.png",
  "assets/ajio.png",
  "assets/wrong_cross.png",
  "assets/button_visit_ajio.png",
  "assets/button_close.png",
  ...Array.from({ length: 10 }, (_, i) => `assets/D${i + 1}.png`),
  ...Array.from({ length: 1 }, (_, i) => `assets/offer1.png`)
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
const devilOfferData = [];


function setupGrid() {
  devilData.length = 0;
  for (let i = 1; i <= 10; i++) {
      devilData.push({
        devilImg: loadedAssets[`assets/D${i}.png`]
        // offerImg: loadedAssets[`assets/offer.png`],
        // offerLink: `https://www.ajio.com`
      });
    }
    setupOffer();
  }

  function setupOffer() {
    devilOfferData.length = 0;
    for (let i = 1; i <= 1; i++) {
      devilOfferData.push({
        offerImg: loadedAssets[`assets/offer1.png`],
        offerLink: `https://www.ajio.com`
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
          case gameStates.ALL_WINDOW_OPEN:
          case gameStates.INSTRUCTION1:
          case gameStates.INSTRUCTION2:
          case gameStates.TIMER:
          case gameStates.WIN:
          case gameStates.LOOSE:

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
          // case SCREEN_GAME_PLAYING:
          case gameStates.START:
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

              if (!cell.devil) {
                const scale = 0.80;
                const devilW = cellSize * scale;
                const devilH = cellSize * scale;
                const devilX = x + (cellSize - devilW) / 2;
                const devilY = y + (cellSize - devilH) / 2;
                ctx.drawImage(loadedAssets["assets/wrong_cross.png"], devilX, devilY, devilW, devilH);
              }
              ctx.drawImage(windowFrames[2], x, y, cellSize, cellSize);
              // console.log("open completed Unknown cell state:", cell.state);
            } else {
              console.log("else Unknown cell state:", cell.state);
            }
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
        if (!firstTouch) {
          drawLoadingBar();
        } else {
          const baseSize = canvas.width * 0.08;
          const pulseScale = 1 + 0.1 * Math.sin(pulseTime * 2); // pulse between 100% and 110%

          ctx.fillStyle = "yellow";
          ctx.font = `${baseSize * pulseScale}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText("TAP TO PLAY", canvas.width / 2, canvas.height * 0.85);

        }
        if (brandLogo.complete) {
          const scale = canvas.width / brandLogo.width;
          const brandLogoW = brandLogo.width * scale * 0.4;
          const brandLogoH = brandLogo.height * scale * 0.4;
          const brandLogoX = (canvas.width - brandLogoW) / 2;
          const brandLogoY = (canvas.height - brandLogoH) / 1.25;
          ctx.drawImage(brandLogo, brandLogoX, brandLogoY, brandLogoW, brandLogoH);
        }


        if (loadingProgress >= 1) {
          loadingProgress = 1;
          setTimeout(() => {
            firstTouch = true;

            // SCREEN = SCREEN_INSTRUCTIONS1;
            // setScreen(SCREEN_GAME);
            // SCREEN = SCREEN_GAME;
          }, 500);
        }
      }
      break;
    case SCREEN_INSTRUCTIONS1:


      break;
    case SCREEN_GAME:
      // if (gameState === SCREEN_GAME_START_COUNTDOWN) {
      //   ctx.fillStyle = "white";
      //   ctx.font = `${canvas.width * 0.2}px Arial Black`;
      //   ctx.textAlign = "center";
      //   ctx.textBaseline = "middle";
      //   ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
      // }

      const hud_bg_scale = canvas.width / loadedAssets["assets/hud_bg.png"].width;
      const hud_bgW = loadedAssets["assets/hud_bg.png"].width * hud_bg_scale;
      const hud_bgH = loadedAssets["assets/hud_bg.png"].height * hud_bg_scale;
      const hud_bgX = (canvas.width - hud_bgW) / 2;
      const hud_bgY = hud_bgH / 2;
      ctx.drawImage(loadedAssets["assets/hud_bg.png"], hud_bgX, hud_bgY, hud_bgW, hud_bgH);

      // const hud_cross_scale = canvas.width / loadedAssets["assets/hud_cross.png"].width;

      // hud_crossW = loadedAssets["assets/hud_cross.png"].width * 0.45;
      // hud_crossH = loadedAssets["assets/hud_cross.png"].height * 0.45;
      // hud_crossX = canvas.width - hud_crossW * 1.5;
      // hud_crossY = (hud_crossH + hud_bgH) / 2.5;
      
      // ctx.drawImage(loadedAssets["assets/hud_cross.png"], hud_crossX, hud_crossY, hud_crossW, hud_crossH);


      drawLives(playerLives);

      ctx.fillStyle = "yellow";
      ctx.font = `${canvas.width * 0.06}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(headCount + "/10", canvas.width / 4.8, 32);


      // const hud_heart_scale = canvas.width / loadedAssets["assets/hud_heart.png"].width;
      // const hud_heartW = loadedAssets["assets/hud_heart.png"].width * 0.45;
      // const hud_heartH = loadedAssets["assets/hud_heart.png"].height * 0.45;
      // const hud_heartX = (canvas.width - hud_heartW) / 2;
      // const hud_heartY = hud_heartH / 2;
      // ctx.drawImage(loadedAssets["assets/hud_heart.png"], hud_heartX, hud_heartY, hud_heartW, hud_heartH);

      switch (gameState) {
        case gameStates.NONE:
          break;
        case gameStates.ALL_WINDOW_OPEN:

          break;
        case gameStates.INSTRUCTION1:
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
        case gameStates.TIMER:
          ctx.fillStyle = "yellow";
          ctx.font = `${canvas.width * 0.08}px Arial Black`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(revealTimer, canvas.width / 2, 72);
          break;
        case gameStates.ALL_WINDOW_CLOSE:
          break;
        case gameStates.INSTRUCTION2:
          const instruction2_scale = canvas.width / loadedAssets["assets/instruction2.png"].width;
          const instruction2W = loadedAssets["assets/instruction2.png"].width * instruction2_scale;
          const instruction2H = loadedAssets["assets/instruction2.png"].height * instruction2_scale;
          const instruction2X = (canvas.width - instruction2W) / 2;
          const instruction2Y = (canvas.height - instruction2H) / 2;
          ctx.drawImage(loadedAssets["assets/instruction2.png"], instruction2X, instruction2Y, instruction2W, instruction2H);

          const findEvil_scale = canvas.width / loadedAssets["assets/find_evil_button.png"].width;
          const findEvilW = loadedAssets["assets/find_evil_button.png"].width * findEvil_scale * 0.35;
          const findEvilH = loadedAssets["assets/find_evil_button.png"].height * findEvil_scale * 0.35;
          const findEvilX = (canvas.width - findEvilW) / 2;
          const findEvilY = (canvas.height - findEvilH) / 1.5;

          ctx.drawImage(loadedAssets["assets/find_evil_button.png"], findEvilX, findEvilY, findEvilW, findEvilH);

          break;
        case gameStates.WIN:
        case gameStates.LOOSE:
          if (gameState === gameStates.WIN) {
            const win_screen_scale = canvas.width / loadedAssets["assets/win_screen.png"].width;
            const win_screenW = loadedAssets["assets/win_screen.png"].width * win_screen_scale;
            const win_screenH = loadedAssets["assets/win_screen.png"].height * win_screen_scale;
            const win_screenX = (canvas.width - win_screenW) / 2;
            const win_screenY = (canvas.height - win_screenH) / 2;
            ctx.drawImage(loadedAssets["assets/win_screen.png"], win_screenX, win_screenY, win_screenW, win_screenH);
          } else if (gameState === gameStates.LOOSE) {
            const loose_screen_scale = canvas.width / loadedAssets["assets/loose_screen.png"].width;
            const loose_screenW = loadedAssets["assets/loose_screen.png"].width * loose_screen_scale;
            const loose_screenH = loadedAssets["assets/loose_screen.png"].height * loose_screen_scale;
            const loose_screenX = (canvas.width - loose_screenW) / 2;
            const loose_screenY = (canvas.height - loose_screenH) / 2;
            ctx.drawImage(loadedAssets["assets/loose_screen.png"], loose_screenX, loose_screenY, loose_screenW, loose_screenH);
          }




          play_again_scale = canvas.width / loadedAssets["assets/play_again_button.png"].width;
          play_againW = loadedAssets["assets/play_again_button.png"].width * play_again_scale * 0.35;
          play_againH = loadedAssets["assets/play_again_button.png"].height * play_again_scale * 0.35;
          play_againX = (canvas.width - play_againW) / 8;
          play_againY = (canvas.height - play_againH) / 1.71;
          
          ctx.drawImage(loadedAssets["assets/play_again_button.png"], play_againX, play_againY, play_againW, play_againH);
          // ctx.fillRect(play_againX, play_againY, play_againW, play_againH);

          // button_close_scale = canvas.width / loadedAssets["assets/button_close.png"].width; 
          // button_closeW = loadedAssets["assets/button_close.png"].width * button_close_scale * 0.35;
          // button_closeH = loadedAssets["assets/button_close.png"].height * button_close_scale * 0.35;
          // button_closeX = (canvas.width - button_closeW) / 1.2;
          // button_closeY = (canvas.height - button_closeH) / 1.71;
          
          ctx.drawImage(loadedAssets["assets/button_close.png"], button_closeX, button_closeY, button_closeW, button_closeH);
          // ctx.fillRect(button_closeX, button_closeY, button_closeW, button_closeH);

          visit_brand_scale = canvas.width / loadedAssets["assets/button_visit_ajio.png"].width;
          visit_brandW = loadedAssets["assets/button_visit_ajio.png"].width * visit_brand_scale * 0.35;
          visit_brandH = loadedAssets["assets/button_visit_ajio.png"].height * visit_brand_scale * 0.35;
          visit_brandX = (canvas.width - visit_brandW) / 1.2;
          visit_brandY = (canvas.height - visit_brandH) / 1.71;

          // visit_brandX = (canvas.width - visit_brandW) / 2;
          // visit_brandY = (canvas.height - visit_brandH) / 1.5;
          
          ctx.drawImage(loadedAssets["assets/button_visit_ajio.png"], visit_brandX, visit_brandY, visit_brandW, visit_brandH);

          // ctx.fillRect(visit_brandX, visit_brandY, visit_brandW, visit_brandH);



          break;
        // case gameStates.LOOSE:

        //   const loose_screen_scale = canvas.width / loadedAssets["assets/loose_screen.png"].width;
        //   const loose_screenW = loadedAssets["assets/loose_screen.png"].width * loose_screen_scale;
        //   const loose_screenH = loadedAssets["assets/loose_screen.png"].height * loose_screen_scale;
        //   const loose_screenX = (canvas.width - loose_screenW) / 2;
        //   const loose_screenY = (canvas.height - loose_screenH) / 2;
        //   ctx.drawImage(loadedAssets["assets/loose_screen.png"], loose_screenX, loose_screenY, loose_screenW, loose_screenH);

        //   play_again_scale = canvas.width / loadedAssets["assets/play_again_button.png"].width;
        //   play_againW = loadedAssets["assets/play_again_button.png"].width * play_again_scale * 0.35;
        //   play_againH = loadedAssets["assets/play_again_button.png"].height * play_again_scale * 0.35;
        //   play_againX = (canvas.width - play_againW) / 8;
        //   play_againY = (canvas.height - play_againH) / 1.71;
          
        //   ctx.drawImage(loadedAssets["assets/play_again_button.png"], play_againX, play_againY, play_againW, play_againH);
        //   // ctx.fillRect(play_againX, play_againY, play_againW, play_againH);

        //   button_close_scale = canvas.width / loadedAssets["assets/button_close.png"].width; 
        //   button_closeW = loadedAssets["assets/button_close.png"].width * button_close_scale * 0.35;
        //   button_closeH = loadedAssets["assets/button_close.png"].height * button_close_scale * 0.35;
        //   button_closeX = (canvas.width - button_closeW) / 1.2;
        //   button_closeY = (canvas.height - button_closeH) / 1.71;
          
        //   ctx.drawImage(loadedAssets["assets/button_close.png"], button_closeX, button_closeY, button_closeW, button_closeH);
        //   // ctx.fillRect(button_closeX, button_closeY, button_closeW, button_closeH);

        //   visit_brand_scale = canvas.width / loadedAssets["assets/button_visit_ajio.png"].width;
        //   visit_brandW = loadedAssets["assets/button_visit_ajio.png"].width * visit_brand_scale * 0.35;
        //   visit_brandH = loadedAssets["assets/button_visit_ajio.png"].height * visit_brand_scale * 0.35;
        //   visit_brandX = (canvas.width - visit_brandW) / 2;
        //   visit_brandY = (canvas.height - visit_brandH) / 1.5;
          
        //   ctx.drawImage(loadedAssets["assets/button_visit_ajio.png"], visit_brandX, visit_brandY, visit_brandW, visit_brandH);
          break;
        default:
          break;
      }
      break;
  }
}


canvas.addEventListener("click", (e) => {

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;


//   if (
//   mouseX >= hud_crossX &&
//   mouseX <= hud_crossX + hud_crossW &&
//   mouseY >= hud_crossY &&
//   mouseY <= hud_crossY + hud_crossY
// ){
//   console.log("Clicked on cross button");
//   window.close();
//   return;
// }
switch (SCREEN) {
    case SCREEN_TITLE:
      playBGMusic();
      setScreen(SCREEN_GAME);
      break;
    case SCREEN_GAME:
      switch (gameState) {
        case gameStates.NONE:
          break;
        case gameStates.ALL_WINDOW_OPEN:
          break;
        case gameStates.INSTRUCTION1:
          playSFX(sfxEvilLaugh1);
          setInGameState(gameStates.TIMER)
          break;
        case gameStates.TIMER:
          break;
        case gameStates.ALL_WINDOW_CLOSE:
          break;
        case gameStates.INSTRUCTION2:
          stopBGMusic();
          playSFX(sfxEvilLaugh1);
          setInGameState(gameStates.START);
          button_state = BUTTON_STATE_NONE;
          break;
        case gameStates.START:

          playSFX(sfxWindow);
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
                  console.log("ButtonState 0000 ", button_state);
                  if (button_state == BUTTON_STATE_DOWN) return;
                  button_state = BUTTON_STATE_DOWN;
                  console.log("ButtonState 1111 ", button_state);
                  animateWindow(cell, true, () => {

                    setTimeout(() => {
                      cell.state = "open";
                      animateBlast(cell);

                    }, 500);
                  });
                }
              }
            }
          }
          break;
        case gameStates.WIN:
        case gameStates.LOOSE:
            if (mouseX >= play_againX && mouseX <= play_againX + play_againW && mouseY >= play_againY && mouseY <= play_againY + play_againW){
              playerLives = 3;
              headCount = 0;
              setupGrid();
              setInGameState(gameStates.ALL_WINDOW_OPEN);
              return;
            }

            // if (mouseX >= button_closeX && mouseX <= button_closeX + button_closeW && mouseY >= button_closeY && mouseY <= button_closeY + button_closeH){
            //   window.close();
            //   return;
            // }

            if (mouseX >= visit_brandX && mouseX <= visit_brandX + visit_brandW && mouseY >= visit_brandY && mouseY <= visit_brandY + visit_brandH){
              window.open("https://www.ajio.com", "_blank");
              return;
            }
          break;
        // case gameStates.LOOSE:
        //   playerLives = 3;
        //   headCount = 0;
        //   setupGrid();
        //   setInGameState(gameStates.ALL_WINDOW_OPEN);
        //   break;
        default:
          break;
      }

      break;
    case SCREEN_WIN:
      



      break;
    case SCREEN_LOOSE:
      playerLives = 3;
      headCount = 0;
      setupGrid();
      setInGameState(gameStates.ALL_WINDOW_OPEN);
      break
  }


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
            },
              setTimeout(() => {
                gameState = SCREEN_GAME_PLAYING
              }, 1000)

            ));
            // gameState = SCREEN_GAME_PLAYING;
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
  pulseTime += 0.05;  // adjust speed of pulsing
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
          playSFX(sfxBlast);
          clearInterval(blastInterval);

          // show popup then remove window
          cell.state = "completed";
          button_state = BUTTON_STATE_NONE;
          console.log("ButtonState 2222 ", button_state);
          headCount++;
          if (headCount >= TOTAL_HEADS) {
            showOfferPopup(cell.devil);
            setTimeout(() => {
              setInGameState(gameStates.WIN);
              playBGMusic();
            }, 1000);
          }
          // showOfferPopup(cell.devil);

        }
      }, 75);
    }, 10);
  } else {
    playerLives--;
    // playerLives -= 3;
    button_state = BUTTON_STATE_NONE;
    console.log("ButtonState 3333 ", button_state);
    playSFX(sfxWrongAnswer);
    if (playerLives <= 0) {
      setTimeout(() => {
        playSFX(sfxEvilLaugh2);
        setInGameState(gameStates.LOOSE);
      }, 1000);
    }
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

    offerImage.src = loadedAssets["assets/offer1.png"].src;
  offerLink.href = `https://www.ajio.com/s/50to90percentoff-140961`;
  offerPopup.style.display = "flex";
  // offerImage.src = devil.offerImg.src;
  // offerLink.href = devil.offerLink;
  // offerPopup.style.display = "flex";
}

closeOffer.addEventListener("click", () => {
  offerPopup.style.display = "none";
});

let previousScreen = SCREEN_NONE;
function setScreen(screen) {
  if (screen === previousScreen) return;
  console.log("Transitioning to screen:", screen, previousScreen, SCREEN);
  switch (screen) {
    case SCREEN_TITLE:
      break;
    case SCREEN_GAME:
      setInGameState(gameStates.ALL_WINDOW_OPEN);
      break
    case SCREEN_WIN:
      break;
    case SCREEN_LOOSE:
      break;
    case SCREEN_INSTRUCTIONS1:
      break;
    case SCREEN_INSTRUCTIONS2:
      break;
    default:
      break;
  }
  previousScreen = screen;
  SCREEN = screen;
}

let previousGameState = gameStates.NONE;
function setInGameState(state) {
  console.log("Transitioning to game state:", state, previousGameState, gameState);
  if (state === previousGameState) return;
  switch (state) {
    case gameStates.NONE:
      break;
    case gameStates.ALL_WINDOW_OPEN:
      setTimeout(() => {
        playSFX(sfxWindow);
        openAllWindows(() => {

          setTimeout(() => {
            console.log("ALL_WINDOW_OPEN: Revealing all windows 5555 ");
            setInGameState(gameStates.INSTRUCTION1);
          }, 1000);
        });

      }, 1000);
      break;
    case gameStates.INSTRUCTION1:
      break;
    case gameStates.TIMER:
      revealTimer = 5;

      revealInterval = setInterval(() => {
        revealTimer--;
        if (revealTimer <= 0) {
          clearInterval(revealInterval);
          closeAllWindows(() => {
            playSFX(sfxWindow);
            setInGameState(gameStates.INSTRUCTION2);
          });
        }
      }, 1000);
      break;
    case gameStates.ALL_WINDOW_CLOSE:
      break;
    case gameStates.INSTRUCTION2:
      break;
    case gameStates.START:
      break;
    case gameStates.POPUP:
      break;
    default:
      break;
  }
  previousGameState = state;
  gameState = state;
}


function openAllWindows(onAllComplete) {
  let total = 0;
  let finished = 0;

  grid.forEach(row => row.forEach(cell => {
    if (cell.state === "closed") {
      total++;
      animateWindow(cell, true, () => {
        cell.state = "open";
        console.log("Opened:", cell);

        finished++;
        if (finished === total) {
          console.log("✅ All windows finished opening!");
          if (onAllComplete) onAllComplete();
        }
      });
    }
  }));

  if (total === 0 && onAllComplete) {
    // Nothing to animate, call immediately
    onAllComplete();
  }
}

function closeAllWindows(onAllComplete) {
  let total = 0;
  let finished = 0;

  grid.forEach(row => row.forEach(cell => {
    total++;
    animateWindow(cell, false, () => {
      cell.state = "closed";

      finished++;
      if (finished === total) {
        console.log("✅ All windows closed!");
        if (onAllComplete) onAllComplete();
      }
    });
  }));

  if (total === 0 && onAllComplete) {
    onAllComplete();
  }
}
function drawLives(lives) {
  const heartImg = loadedAssets["assets/hud_heart.png"];
  const heartImg2 = loadedAssets["assets/hud_heart2.png"];
  if (!heartImg) return;
  if (!heartImg2) return;

  const heartW = heartImg.width * 0.40;
  const heartH = heartImg.height * 0.40;
  const margin = 10; // space between hearts

  // Draw hearts aligned at top-left corner
  // const startX = 20; 
  const startX = (canvas.width - (3 * (heartW + margin))) / 1.0;
  const startY = heartH * 1;

  for (let i = 0; i < 3; i++) {
    const x = startX + i * (heartW + margin);
    if (i >= lives) {
      // ctx.drawImage(heartImg2, x, startY, heartW, heartH);
    } else {
      ctx.drawImage(heartImg, x, startY, heartW, heartH);
    }

  }
}

function playBGMusic() {
  bgMusic.play().catch(err => console.log("Autoplay blocked:", err));
}



function stopBGMusic() {
  bgMusic.pause();
  bgMusic.currentTime = 0; // reset to start
}

function setBGVolume(value) {
  bgMusic.volume = 0.5;
  // bgMusic.volume = Math.min(1, Math.max(0, value)); // keep between 0 and 1
}

function playSFX(sfx) {
  sfx.currentTime = 0; // rewind so it can replay quickly
  sfx.play();
}

document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    // Page is hidden, pause music
    stopBGMusic();
  } else {
    // Page is visible, resume music
    playBGMusic();
  }
});