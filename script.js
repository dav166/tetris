// Board Dimensions
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Class for individual Tetriminos
class Tetrimino {
    constructor(blocks, color) {
      this.blocks = blocks;
      this.color = color;
      this.x = 5;
      this.y = 0;
    }
}
  
// Main game logic
class Game {
    constructor() {
        // Initialize board, score, and other state variables
        this.board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.currentTetrimino = this.randomTetrimino();
        this.nextTetrimino = this.randomTetrimino();
        this.highScore = localStorage.getItem('highScore') || 0; // Load high score from local storage
        this.dropCounter = 0;
        this.dropInterval = 1000; // Initial drop speed: 1 second
        this.lastTime = 0;
        this.animationFrameId = null;
        this.hasStarted = false;
        this.holdTetrimino = null;
        this.canHold = true;
        this.init();
    }

    init() {
        this.drawNextTetrimino();
    }

    randomTetrimino() {
        const tetriminos = [
            { blocks: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}], color: 'O' },
            { blocks: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}], color: 'I' },
            { blocks: [{x: 0, y: 1}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}], color: 'T' },
            { blocks: [{x: 1, y: 0}, {x: 2, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}], color: 'S' },
            { blocks: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}], color: 'Z' },
            { blocks: [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}], color: 'J' },
            { blocks: [{x: 2, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}], color: 'L' },
        ];
        const randomIndex = Math.floor(Math.random() * tetriminos.length);
        const { blocks, color } = tetriminos[randomIndex];
        return new Tetrimino(blocks, color);
    }

    draw() {
        this.drawBoard();
        this.drawCurrentTetrimino();
    }

    drawBoard() {
        const gameBoardElement = document.getElementById("game-board");
        gameBoardElement.innerHTML = "";
    
        // Draw the static blocks on the board
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const cell = document.createElement("div");
                cell.className = this.board[y][x] ? this.board[y][x] : 'empty';
                gameBoardElement.appendChild(cell);
            }
        }
    }

    drawCurrentTetrimino() {
        const gameBoardElement = document.getElementById("game-board");
        
        // Draw the current Tetrimino
        this.currentTetrimino.blocks.forEach((block) => {
            const x = block.x + this.currentTetrimino.x;
            const y = block.y + this.currentTetrimino.y;
            if (y >= 0) {
                const index = y * BOARD_WIDTH + x;
                const cell = gameBoardElement.childNodes[index];
                if (cell) {
                    cell.classList.remove("empty");
                    cell.classList.add(this.currentTetrimino.color);
                }
            }
        });
    }

    lockTetrimino() {
        this.currentTetrimino.blocks.forEach(block => {
            const x = block.x + this.currentTetrimino.x;
            const y = block.y + this.currentTetrimino.y;
            this.board[y][x] = this.currentTetrimino.color;
        });
        this.canHold = true;
    }

    async lockAndAdvance() {
        this.lockTetrimino();

        await this.clearLines();

        this.currentTetrimino = this.nextTetrimino;
        this.currentTetrimino.x = 5;
        this.currentTetrimino.y = 0;

        this.nextTetrimino = this.randomTetrimino();
        this.drawNextTetrimino();

        this.canHold = true;

        if (this.checkCollision()) {
            this.showGameOver();
            return;
        }

        this.draw();
        this.updateScoreboard();
    }

    togglePause() {
        if (!this.hasStarted) {
            this.start();
            return;
        }

        if (this.isGameOver) return;

        this.isPaused = !this.isPaused;
        document.getElementById("start-pause").textContent = this.isPaused ? "Resume" : "Pause";

        if (this.isPaused) {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            return;
        }

        this.lastTime = 0;

        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    gameLoop(time = 0) {
        if (this.isGameOver || this.isPaused) {
            this.animationFrameId = null;
            return;
        }   

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            this.currentTetrimino.y++;
            if (this.checkCollision()) {
                this.currentTetrimino.y--;
                this.lockTetrimino();
                this.currentTetrimino = this.nextTetrimino;
                this.nextTetrimino = this.randomTetrimino();
                this.drawNextTetrimino();

                if (this.checkCollision()) {
                    this.showGameOver();
                    return;
                }
            }
            this.dropCounter = 0;
        }

        // Draw, update scoreboard
        this.draw();
        this.updateScoreboard();

        // Adjust drop interval based on level
        this.dropInterval = Math.max(100, 1000 - (this.level * 100));

        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    checkCollision() {
        for (const block of this.currentTetrimino.blocks) {
            const x = block.x + this.currentTetrimino.x;
            const y = block.y + this.currentTetrimino.y;
            if (
                x < 0 || x >= this.board[0].length ||
                y >= this.board.length ||
                this.board[y][x] !== 0
            ) {
                return true;
            }
        }
        return false;
    }

    async clearLines() {
        let linesCleared = 0;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                await this.animateRowClear(y);
                this.board.splice(y, 1);
                this.board.unshift(Array(BOARD_WIDTH).fill(0));
                linesCleared++;
                y++; // Recheck the same row
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;

            // Scoring based on Tetris guidelines
            const lineClearPoints = [0, 40, 100, 300, 1200];
            this.score += lineClearPoints[linesCleared] * this.level;
            
            this.level = Math.floor(this.lines / 10) + 1;
        }
        

        // Check and update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
    }

    async animateRowClear(y) {
        return new Promise(resolve => {
            // Change the row color for animation
            this.board[y] = this.board[y].map(() => 'clearing');
            this.draw();
            setTimeout(() => {
                resolve();
            }, 300); // Duration
        });
    }

    moveLeft() {
        this.currentTetrimino.x--;
        if (this.checkCollision()) {
            this.currentTetrimino.x++;
        }
        this.draw();
    }

    moveRight() {
        this.currentTetrimino.x++;
        if (this.checkCollision()) {
            this.currentTetrimino.x--;
        }
        this.draw();
    }

    moveDown() {
        this.currentTetrimino.y++;
        if (this.checkCollision()) {
            this.currentTetrimino.y--;
            this.lockTetrimino();
        }
        this.draw();
    }

    rotate() {
        const newBlocks = this.currentTetrimino.blocks.map(block => ({ x: -block.y, y: block.x }));
        const originalX = this.currentTetrimino.x;
        const originalBlocks = this.currentTetrimino.blocks;
        this.currentTetrimino.blocks = newBlocks;
    
        const offsets = [0, -1, 1, -2, 2]; // Possible shifts
        let collision = true;
        for (let offset of offsets) {
            this.currentTetrimino.x = originalX + offset;
            if (!this.checkCollision()) {
                collision = false;
                break;
            }
        }

        if (collision) {
            this.currentTetrimino.blocks = originalBlocks;
            this.currentTetrimino.x = originalX;
        }
    
        this.draw();
    }

    hold() {
        if (!this.canHold) return;
        this.canHold = false;

        if (this.holdTetrimino) {
            [this.currentTetrimino, this.holdTetrimino] = [this.holdTetrimino, this.currentTetrimino];
            this.currentTetrimino.x = Math.floor(BOARD_WIDTH / 2) - 1;
            this.currentTetrimino.y = 0;
        } else {
            this.holdTetrimino = this.currentTetrimino;
            this.currentTetrimino = this.nextTetrimino;
            this.nextTetrimino = this.randomTetrimino();
            this.drawNextTetrimino();
        }
        this.drawHoldTetrimino();
        this.draw();
    }

    drawHoldTetrimino() {
        const holdTetriminoElement = document.getElementById("hold-tetrimino");
        holdTetriminoElement.innerHTML = "";

        for(let y = 0; y < 4; y++) {
            for(let x = 0; x < 4; x++) {
                const cell = document.createElement("div");
                cell.classList.add("empty");
                holdTetriminoElement.appendChild(cell);
            }
        }

        if (this.holdTetrimino) {
            this.holdTetrimino.blocks.forEach((block) => {
                const x = block.x;
                const y = block.y;
                if (y >= 0 && y < 4 && x >= 0 && x < 4) {
                    const index = y * 4 + x;
                    holdTetriminoElement.childNodes[index].classList.remove("empty");
                    holdTetriminoElement.childNodes[index].classList.add(this.holdTetrimino.color);
                }
            });
        }
    }

    updateScoreboard() {
        document.getElementById("score-value").textContent = this.score;
        document.getElementById("lines-value").textContent = this.lines;
        document.getElementById("level-value").textContent = this.level;
        document.getElementById("high-score-value").textContent = this.highScore;
    }

    restart() {
        this.board = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.isGameOver = false;
        this.currentTetrimino = this.randomTetrimino();
        this.nextTetrimino = this.randomTetrimino();
        this.updateScoreboard();
        document.getElementById("game-over").style.display = "none"; // Hide the game-over screen
        this.gameLoop();
    }

    showGameOver() {
        this.isGameOver = true;
        document.getElementById("game-over").style.display = "flex";
        document.getElementById("game-over-score-value").textContent = this.score;
        document.getElementById("game-over-lines-value").textContent = this.lines;
        document.getElementById("game-over-level-value").textContent = this.level;
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

        this.nextTetrimino.blocks.forEach((block) => {
            const x = block.x;
            const y = block.y;
            if (y >= 0 && y < 4 && x >= 0 && x < 4) {
                const index = y * 4 + x;
                nextTetriminoElement.childNodes[index].classList.remove("empty");
                nextTetriminoElement.childNodes[index].classList.add(this.nextTetrimino.color);
            }
        });
    }

    start() {
        if (this.hasStarted && !this.isPaused) return;

        this.hasStarted = true;
        this.isPaused = false;
        this.lastTime = 0;
        this.dropCounter = 0;

        document.getElementById("start-pause").textContent = "Pause";

        this.draw();
        this.updateScoreboard();

        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
        }
    }
}
// ... Initialization code ...
const game = new Game();

// Key mapping
const keyMap = {
    37: 'moveLeft',
    39: 'moveRight',
    40: 'moveDown',
    38: 'rotate',
    67: 'hold', // 'C' key to hold
    80: 'togglePause'
};

document.addEventListener("keydown", (event) => {
    if (keyMap[event.keyCode]) {
        event.preventDefault(); // Prevents default browser actions
        const action = keyMap[event.keyCode];
        game[action]();
    }
});

document.getElementById("start-pause").addEventListener("click", () => {
    game.togglePause();
});

document.getElementById("game-over-restart").addEventListener("click", () => 
    game.restart()
);

document.getElementById("restart-button").addEventListener("click", () => 
    game.restart()
);

document.getElementById("left-button").addEventListener("click", () => 
    game.moveLeft());
document.getElementById("right-button").addEventListener("click", () => 
    game.moveRight());
document.getElementById("down-button").addEventListener("click", () => 
    game.moveDown());
document.getElementById("rotate-button").addEventListener("click", () => 
    game.rotate());