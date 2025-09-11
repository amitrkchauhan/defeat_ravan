const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

//This is a test

const GRID_ROWS = 5;
const GRID_COLS = 4;
const SPACING = 3;

const windowFrames = ["assets/window1.png","assets/window2.png","assets/window3.png"].map(src=>{
  const img=new Image(); img.src=src; return img;
});

const blastFrames = ["assets/blast1.png","assets/blast2.png","assets/blast3.png"].map(src=>{
  const img=new Image(); img.src=src; return img;
});

// Devils with linked offers
const devilData = [];
for (let i = 1; i <= 10; i++) {
  devilData.push({
    devilImg: (()=>{const img=new Image(); img.src=`assets/D${i}.png`; return img;})(),
    offerImg: (()=>{const img=new Image(); img.src=`assets/offer${i}.png`; return img;})(),
    offerLink: `https://example.com/offer${i}` // 🔗 replace with actual links
  });
}

let grid = [];
let cellSize, offsetX, offsetY;
let introPhase = true; // 🔴 intro phase at start

function setupGrid() {
  const shuffled = [...devilData].sort(() => Math.random() - 0.5);
  const chosenDevils = shuffled.slice(0, 10); // place 10 devils

  grid = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push({
        devil: null,
        state: "closed", // closed | opening | open | blasting | removed
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

      if (cell.state === "removed") continue; // removed cell not drawn

      if (introPhase) {
        // During intro → show window open with devil inside
        if (windowFrames[2].complete) {
            ctx.drawImage(windowFrames[2], x, y, cellSize, cellSize);
        }
        if (cell.devil && cell.devil.devilImg.complete) {
          ctx.drawImage(cell.devil.devilImg, x, y, cellSize, cellSize);
        }
      } else {
        if (cell.state === "closed") {
          if (windowFrames[0].complete) ctx.drawImage(windowFrames[0], x, y, cellSize, cellSize);
        } else if (cell.state === "opening") {
          if (windowFrames[cell.frame] && windowFrames[cell.frame].complete) {
            ctx.drawImage(windowFrames[cell.frame], x, y, cellSize, cellSize);
          }
        } else if (cell.state === "open") {
          if (windowFrames[2].complete) {
            ctx.drawImage(windowFrames[2], x, y, cellSize, cellSize);
          }
        //   if (cell.devil && cell.devil.devilImg.complete) {
        //     ctx.drawImage(cell.devil.devilImg, x, y, cellSize, cellSize);
        //   }
        } else if (cell.state === "blasting") {
            if (windowFrames[2].complete) {
                ctx.drawImage(windowFrames[2], x, y, cellSize, cellSize);
            }
          if (blastFrames[cell.blastFrame] && blastFrames[cell.blastFrame].complete) {
            ctx.drawImage(blastFrames[cell.blastFrame], x, y, cellSize, cellSize);
          }
        }
      }
    }
  }
}

function drawScene() {
  drawBackground();
  drawGrid();
}

// Open → delay → blast → popup → remove
function animateCell(cell) {
  if (cell.state === "closed") {
    cell.state = "opening";
    cell.frame = 0;

    let openInterval = setInterval(() => {
      cell.frame++;
      if (cell.frame >= windowFrames.length - 1) {
        clearInterval(openInterval);
        cell.state = "open";

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
                showOfferPopup(cell.devil);
                cell.state = "open";
              }
            }, 300);
          }, 400);
        }
      }
    }, 300);
  }
}

canvas.addEventListener("click", (e) => {
  if (introPhase) return; // ignore clicks during intro

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
          animateCell(cell);
        }
      }
    }
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
   Intro phase (5 sec open windows with devils)
----------------------- */
setTimeout(() => {
  // after 5 sec → windows close (reverse animation)
  introPhase = false;

grid.forEach(row => row.forEach(cell => {
  // play closing animation backwards for ALL cells
  cell.state = "opening";
  cell.frame = windowFrames.length - 1;

  let closeInterval = setInterval(() => {
    cell.frame--;
    if (cell.frame <= 0) {
      clearInterval(closeInterval);
      cell.state = "closed";
    }
  }, 300);
}));

}, 5000);

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
