
class Tetrimino {
    constructor(shape, color) {
      this.shape = shape;
      this.color = color;
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
        this.drawNextTetrimino();
    }

    randomTetrimino() {
        const tetriminos = [
          { shape: [[1, 1], [1, 1]], color: 'O' },
          { shape: [[1, 1, 1, 1]], color: 'I' },
          { shape: [[0, 1, 0], [1, 1, 1]], color: 'T' },
          { shape: [[0, 1, 1], [1, 1, 0]], color: 'S' },
          { shape: [[1, 1, 0], [0, 1, 1]], color: 'Z' },
          { shape: [[1, 0, 0], [1, 1, 1]], color: 'J' },
          { shape: [[0, 0, 1], [1, 1, 1]], color: 'L' }
        ];
        const randomIndex = Math.floor(Math.random() * tetriminos.length);
        const { shape, color } = tetriminos[randomIndex];
        return new Tetrimino(shape, color);
    }

    draw() {
        const gameBoardElement = document.getElementById("game-board");
        gameBoardElement.innerHTML = "";
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = document.createElement("div");
                let cellType = 'empty';
    
                if (y >= this.currentTetrimino.y && x >= this.currentTetrimino.x &&
                    y < this.currentTetrimino.y + this.currentTetrimino.shape.length &&
                    x < this.currentTetrimino.x + this.currentTetrimino.shape[0].length &&
                    this.currentTetrimino.shape[y - this.currentTetrimino.y][x - this.currentTetrimino.x]
                ) {
                    cellType = this.currentTetrimino.color;
                } else {
                    cellType = this.board[y][x] ? this.board[y][x] : 'empty';
                }
                cell.classList.add(cellType);
                gameBoardElement.appendChild(cell);
            }
        }
    }

    lockTetrimino() {
        this.currentTetrimino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.board[y + this.currentTetrimino.y][x + this.currentTetrimino.x] = this.currentTetrimino.color;
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
        for (let y = 0; y < this.currentTetrimino.shape.length; y++) {
          for (let x = 0; x < this.currentTetrimino.shape[y].length; x++) {
            if (this.currentTetrimino.shape[y][x]) {
              if (
                // outside the game bounds
                this.currentTetrimino.y + y >= this.board.length ||
                this.currentTetrimino.x + x < 0 ||
                this.currentTetrimino.x + x >= this.board[0].length ||
                // collides with another tetrimino
                this.board[this.currentTetrimino.y + y][this.currentTetrimino.x + x] !== 0
              ) {
                return true;
              }
            }
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
        if (this.lines > 0 && this.lines % 10 === 0) {
            this.level++;
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
        const newShape = []

        for (let y = 0; y < this.currentTetrimino.shape[0].length; y++) {
            newShape[y] = [];
            for (let x = 0; x < this.currentTetrimino.shape.length; x++) {
                newShape[y][x] = this.currentTetrimino.shape[this.currentTetrimino.shape.length - 1 - x][y];
            }
        }

        const currentShape = this.currentTetrimino.shape;

        this.currentTetrimino.shape = newShape;

        if (this.checkCollision()) {
            this.currentTetrimino.shape = currentShape;
        }

        this.draw();

    }

    updateScoreboard() {
        document.getElementById("score-value").textContent = this.score;
        document.getElementById("lines-value").textContent = this.lines;
        document.getElementById("level-value").textContent = this.level;
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
        this.gameLoop();
    }

    showGameOver() {
        this.isGameOver = true;
        document.getElementById("game-over").style.display = "block";
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
                    nextTetriminoElement.childNodes[index].classList.add(this.nextTetrimino.color);
                }
            });
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
game.drawNextTetrimino();

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
document.getElementById("restart-button").addEventListener("click", () => game.restart());
