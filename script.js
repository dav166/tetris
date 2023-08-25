const gameBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
let currentTetrimino = null;
let isGameOver = false;
let score = 0;
let lines = 0;
let level = 0;

const tetriminoShapes = {
    'O': [
      [1, 1],
      [1, 1]
    ],
    'I': [
      [1, 1, 1, 1]
    ],
    'T': [
      [0, 1, 0],
      [1, 1, 1]
    ],
    'S': [
      [0, 1, 1],
      [1, 1, 0]
    ],
    'Z': [
      [1, 1, 0],
      [0, 1, 1]
      ],
    'J': [
      [1, 0, 0],
      [1, 1, 1]
    ],
    'L': [
      [0, 0, 1],
      [1, 1, 1]
    ]
};
  
function generateRandomTetrimino() {
    const keys = Object.keys(tetriminoShapes);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return {
        shape: tetriminoShapes[randomKey],
        x: 5, // Start in the middle of the game board
        y: 0  // Start at the top of the game board
    };
}

function gameLoop() {
    if (isGameOver) return;
  
    // Move the Tetrimino down by one square
    currentTetrimino.y++;
  
    // Collision detection and other game logic go here...
    if(checkCollision(currentTetrimino, gameBoard)) {
        // Revert the move
        currentTetrimino.y--;
        //Lock the Tetrimino and generate a new one
        lockTetrimino();
        currentTetrimino = generateRandomTetrimino();
    }

    // Clear lines and update score
    clearLines();

    // Draw the updated state
    draw();
  
    // Run the game loop again after a delay
    setTimeout(gameLoop, 500 - (level * 50));
}
  
// To start the game
currentTetrimino = generateRandomTetrimino();
gameLoop();

function draw() {
    const gameBoardElement = document.getElementById("game-board");
    gameBoardElement.innerHTML = "";
    
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        const cell = document.createElement("div");
        cell.classList.add(gameBoard[y][x] ? "filled" : "empty");
        gameBoardElement.appendChild(cell);
      }
    }
}

function checkCollision(tetrimino, board) {
    for (let y = 0; y < tetrimino.shape.length; y++) {
        for (let x = 0; x < tetrimino.shape[y].length; x++) {
            if (tetrimino.shape[y][x] &&
                (board[y + tetrimino.y] && board[y + tetrimino.y][x + tetrimino.x]) !== 0) {
            return true;
            }
        }
    }
    return false;
}
  
function clearLines() {
    for (let y = 19; y >= 0; ) {
        if (gameBoard[y].every(cell => cell !== 0)) {
            gameBoard.splice(y, 1);
            gameBoard.unshift(Array(10).fill(0));
            lines++;
            score += 10;
        } else {
            y--;
        }
    }
  }
  
document.addEventListener("keydown", function(event) {
    switch(event.keyCode) {
        case 37: // Left arrow key
            moveTetrimino(-1, 0);
            break;
        case 39: // Right arrow key
            moveTetrimino(-1, 0);
            break;
        case 40: // Down arrow key
            moveTetrimino(0, 1);
            break;
        case 38: // Up arrow key
            rotateTetrimino();
            break;
    }
});

function moveTetrimino(dx, dy) {
    currentTetrimino.x += dx;
    currentTetrimino.y += dy;

    if (checkCollision(currentTetrimino, gameBoard)) {
        // Revert the move
        currentTetrimino.x -= dx;
        currentTetrimino.y -= dy;
    }
}

function rotateTetrimino() {
    const originalShape = currentTetrimino.shape;

    // Rotate the Tetrimino 
    currentTetrimino.shape = rotateShape(currentTetrimino.shape);

    if (checkCollision(currentTetrimino, gameBoard)) {
        // Revert the rotation
        currentTetrimino.shape = originalShape;
    }
}