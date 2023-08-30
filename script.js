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
        this.board = Array.from({ length: 20 }, () => Array(10).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.currentTetrimino = this.randomTetrimino();
        this.nextTetrimino = this.randomTetrimino();
        this.highScore = localStorage.getItem('highScore') || 0; // Load high score from local storage
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
        const gameBoardElement = document.getElementById("game-board");
        gameBoardElement.innerHTML = "";
    
        // Draw the static blocks on the board
        for (let y = 0; y < this.board.length; y++) {
            for (let x = 0; x < this.board[y].length; x++) {
                const cell = document.createElement("div");
                cell.className = this.board[y][x] ? this.board[y][x] : 'empty';
                gameBoardElement.appendChild(cell);
            }
        }
    
        // Draw the current Tetrimino
        this.currentTetrimino.blocks.forEach((block) => {
            const x = block.x + this.currentTetrimino.x;
            const y = block.y + this.currentTetrimino.y;
            if (y >= 0) {
                const index = y * 10 + x;  // 10 is the width of the board
                gameBoardElement.childNodes[index].classList.remove("empty");
                gameBoardElement.childNodes[index].classList.add(this.currentTetrimino.color);
            }
        });
    }

    lockTetrimino() {
        this.currentTetrimino.blocks.forEach(block => {
            const x = block.x + this.currentTetrimino.x;
            const y = block.y + this.currentTetrimino.y;
            this.board[y][x] = this.currentTetrimino.color;
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
        this.currentTetrimino.y++;
  
        // Collision detection and other game logic go here...
        if (this.checkCollision()) {
            // Revert the move
            this.currentTetrimino.y--;
            // Lock the Tetrimino and generate a new one
            this.lockTetrimino();
            this.currentTetrimino = this.nextTetrimino;
            this.nextTetrimino = this.randomTetrimino();
            this.drawNextTetrimino();

            if (this.checkCollision()) {
                this.showGameOver();
                return;
            }
        }

        // Clear lines and update score
        this.clearLines();
        // Draw the updated state
        this.draw();
        // Update the scoreboard
        this.updateScoreboard();

        const speed = Math.max(50, 500 - (this.level * 50));
        setTimeout(() => this.gameLoop(), speed);
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

    clearLines() {
        for (let y = 19; y >= 0; ) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(10).fill(0));
                this.lines++;
                this.score += 10;
            } else {
                y--;
            }
        }
        this.level = Math.floor(this.lines / 10) + 1;

        // Check and update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
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
        const newBlocks = this.currentTetrimino.blocks.map(block => {
            return { x: -block.y, y: block.x };
        });
        
        const originalBlocks = [...this.currentTetrimino.blocks];
        this.currentTetrimino.blocks = newBlocks;
    
        if (this.checkCollision()) {
            this.currentTetrimino.blocks = originalBlocks;
        }
    
        this.draw();
    }

    updateScoreboard() {
        document.getElementById("score-value").textContent = this.score;
        document.getElementById("lines-value").textContent = this.lines;
        document.getElementById("level-value").textContent = this.level;
        document.getElementById("high-score-value").textContent = this.highScore;
    }

    restart() {
        this.board = Array.from({ length: 20 }, () => Array(10).fill(0));
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
        this.draw();
        this.updateScoreboard();
        this.gameLoop();
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
    80: 'togglePause'
};

document.addEventListener("keydown", function(event) {
    const action = keyMap[event.keyCode];
    if (action) {
        game[action]();
    }
});

document.getElementById("start-pause").addEventListener("click", () => {
    if (game.isPaused) {
      game.togglePause();
    } else {
      game.start();
    }
  });
document.getElementById("game-over-restart").addEventListener("click", () => game.restart());
