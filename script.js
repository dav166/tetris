
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

        setTimeout(() => this.gameLoop(), 500 - (this.level * 50));
    }

    checkCollision() {
        for (let y = 0; y < this.currentTetrimino.shape.length; y++) {
            for (let x = 0; x < this.currentTetrimino.shape[y].length; x++) {
                if (this.currentTetrimino.shape[y][x] &&
                    (this.board[y + this.currentTetrimino.y] && this.board[y + this.currentTetrimino.y][x + this.currentTetrimino.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    lockTetrimino() {
        this.currentTetrimino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.board[y + this.currentTetrimino.y][x + this.currentTetrimino.x] = value;
                }
            });
        });
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
        if (this.lines % 10 === 0) {
            this.level++;
        }
    }

    draw() {
        const gameBoardElement = document.getElementById("game-board");
        gameBoardElement.innerHTML = "";
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                const cell = document.createElement("div");
                cell.classList.add(this.board[y][x] ? "filled" : "empty");
                gameBoardElement.appendChild(cell);
            }
        }
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
        document.getElementById("game-over").style.display = "none";
    }
}

// ... Initialization code ...
const game = new Game();
game.drawNextTetrimino(); // Draw next Tetrimino when appropriate

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

document.getElementById("start-pause").addEventListener("click", () => game.togglePause());
document.getElementById("restart").addEventListener("click", () => game.restart());

// Kick off the game loop
game.gameLoop();