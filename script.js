const gameBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
let currentTetrimino = null;
let isGameOver = false;
let score = 0;
let lines = 0;
let level = 1;
let isPaused = false;

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
    if (isGameOver || isPaused) return;
  
    // Move the Tetrimino down by one square
    currentTetrimino.y++;
  
    // Collision detection and other game logic go here...
    if(checkCollision(currentTetrimino, gameBoard)) {
        // Revert the move
        currentTetrimino.y--;
        // Lock the Tetrimino and generate a new one
        lockTetrimino();
        if (checkCollision(currentTetrimino, gameBoard)) {
            isGameOver = true;
            alert("Game Over!");
        }
        currentTetrimino = generateRandomTetrimino();
    }

    // Clear lines and update score
    clearLines();

    updateScoreboard();

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
        let cleared = false
        if (gameBoard[y].every(cell => cell !== 0)) {
            gameBoard.splice(y, 1);
            gameBoard.unshift(Array(10).fill(0));
            lines++;
            score += 10;
            cleared = true
        } else {
            y--;
        }
        if (lines % 10 === 0) {
            level++;
        }
        if (cleared) {
            updateScoreboard();
        }
    }
}
  
document.addEventListener("keydown", function(event) {
    switch(event.keyCode) {
        case 37: // Left arrow key
            moveTetrimino(-1, 0);
            break;
        case 39: // Right arrow key
            moveTetrimino(1, 0);
            break;
        case 40: // Down arrow key
            moveTetrimino(0, 1);
            break;
        case 38: // Up arrow key
            rotateTetrimino();
            break;
        case 80: // 'P' key
            isPaused = !isPaused;
            if (!isPaused) gameLoop(); // Resume game loop if unpaused
            break;
    }
});

document.getElementById("restart-button").addEventListener("click", function() {
    isGameOver = false;
    gameBoard = createEmptyBoard(); 
    score = 0;
    lines = 0;
    level = 1;
    updateScoreboard();
    gameLoop();
})

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

function rotateShape(matrix) {
    const N = matrix.length - 1;
    let result = matrix.map((row, i) =>
        row.map((val, j) => matrix[N - j][i])
    );
    return result;
}

function updateScoreboard () {
    document.getElementById("score-value").textContent = score;
    document.getElementById("lines-value").textContent = lines;
    document.getElementById("level-value").textContent = level;
}

function createEmptyBoard() {
    return Array.from({ length: 20 }, () => Array(10).fill(0));
}

// // //

class Tetrimino {
    constructor(shape) {
        this.shape = shape;
        this.x = 5;
        this.y = 0;
    }
}

class Game {
    constructor() {
        this.board = Array.from({ length: 20 }, () => Array(10).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.currentTetrimino = this.randomTetrimino();
        this.nextTetrimino = this.randomTetrimino();
    }

    randomTetrimino() {
        const shapes = {
            'O': [[1, 1], [1, 1]],
            'I': [[1, 1, 1, 1]],
            'T': [[0, 1, 0],[1, 1, 1]],
            'S': [[0, 1, 1],[1, 1, 0]],
            'Z': [[1, 1, 0],[0, 1, 1]],
            'J': [[1, 0, 0],[1, 1, 1]],
            'L': [[0, 0, 1],[1, 1, 1]]
        };
        const keys = Object.keys(shapes);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return new Tetrimino(shapes[randomKey]);
    }

    drawNextTetrimino() {
        const nextTetriminoElement = document.getElementById("next-tetrimino");
        nextTetriminoElement.innerHTML = "";

        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = document.createElement("div");
                cell.classList.add("empty");
                nextTetriminoElement.appendChild(cell);
            }
        }

        this.nextTetrimino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const index = 4 * y + x;
                    nextTetriminoElement.childNodes[index].classList.remove("empty");
                    nextTetriminoElement.childNodes[index].classList.add("filled");
                }
            });
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.gameLoop();
        }
        document.getElementById("start-pause").textContent = this.isPaused ? "Resume" : "Pause";
    }

    gameLoop() {
        if (this.isGameOver || this.isPaused) return;
    
        // Move the Tetrimino down by one square
        currentTetrimino.y++;
  
        // Collision detection and other game logic go here...
        if(checkCollision(currentTetrimino, gameBoard)) {
        
            // Revert the move
            currentTetrimino.y--;
    
            // Lock the Tetrimino and generate a new one
            lockTetrimino();
            if (checkCollision(currentTetrimino, gameBoard)) {
                isGameOver = true;
                alert("Game Over!");
            }
            currentTetrimino = generateRandomTetrimino();
        }

        // Clear lines and update score
        clearLines();

        updateScoreboard();

        // Draw the updated state
        draw();

        setTimeout(() => this.gameLoop(), 500 - (this.level * 50));
    }

    showGameOver() {
        this.isGameOver = true;
        document.getElementById("game-over").style.display = "none";
    }
}

// ... Initialization code ...
// game.drawNextTetrimino(); // Draw the next Tetrimino when appropriate

document.getElementById("start-pause").addEventListener("click", () => game.togglePause());
document.getElementById("restart").addEventListener("click", () => game.restart());
const game = new Game();
// Initialize, set up listeners, etc