// Board Dimensions
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Game Timing
const STARTING_DROP_INTERVAL = 1000;
const MIN_DROP_INTERVAL = 100;
const LEVEL_SPEED_STEP = 75;
const ROW_CLEAR_ANIMATION_TIME = 250;
const LOCK_DELAY_TIME = 500;

const createEmptyBoard = () => {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
};

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

const shuffle = (items) => {
    const shuffledItems = [...items];

    for (let index = shuffledItems.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));

        [shuffledItems[index], shuffledItems[randomIndex]] = [
            shuffledItems[randomIndex],
            shuffledItems[index]
        ];
    }

    return shuffledItems;
};

const TETRIMINO_TEMPLATES = [
    {
        blocks: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 }
        ],
        color: "O"
    },
    {
        blocks: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 3, y: 0 }
        ],
        color: "I"
    },
    {
        blocks: [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ],
        color: "T"
    },
    {
        blocks: [
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 }
        ],
        color: "S"
    },
    {
        blocks: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ],
        color: "Z"
    },
    {
        blocks: [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ],
        color: "J"
    },
    {
        blocks: [
            { x: 2, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ],
        color: "L"
    }
];

// Class for individual Tetriminos
class Tetrimino {
    constructor(blocks, color) {
        this.blocks = blocks.map(block => ({ ...block }));
        this.color = color;
        this.resetPosition();
    }

    resetPosition() {
        this.x = Math.floor(BOARD_WIDTH / 2) - 2;
        this.y = 0;
    }
}

// Main game logic
class Game {
    constructor() {
        this.board = createEmptyBoard();

        this.score = 0;
        this.lines = 0;
        this.level = 1;

        this.isGameOver = false;
        this.isPaused = true;
        this.hasStarted = false;
        this.isClearing = false;

        this.tetriminoBag = [];

        this.currentTetrimino = this.getNextTetrimino();
        this.nextTetrimino = this.getNextTetrimino();

        this.highScore = Number(localStorage.getItem("highScore")) || 0;

        this.dropCounter = 0;
        this.dropInterval = STARTING_DROP_INTERVAL;
        this.lastTime = 0;
        this.animationFrameId = null;
        this.lockDelayTimerId = null;

        this.holdTetrimino = null;
        this.canHold = true;

        this.init();
    }

    init() {
        this.draw();
        this.drawNextTetrimino();
        this.drawHoldTetrimino();
        this.updateScoreboard();
    }

    refillTetriminoBag() {
        this.tetriminoBag = shuffle(TETRIMINO_TEMPLATES);
    }

    getNextTetrimino() {
        if (this.tetriminoBag.length === 0) {
            this.refillTetriminoBag();
        }

        const { color } = this.tetriminoBag.pop();

        return this.createTetriminoByColor(color);
    }

    createTetriminoByColor(color) {
        const template = TETRIMINO_TEMPLATES.find((tetrimino) => {
            return tetrimino.color === color;
        });

        if (!template) {
            throw new Error(`Unknown tetrimino color: ${color}`);
        }

        return new Tetrimino(template.blocks, template.color);
    }

    canUseControls() {
        return this.hasStarted && !this.isPaused && !this.isGameOver && !this.isClearing;
    }

    draw() {
        this.drawBoard();
        this.drawGhostTetrimino();
        this.drawCurrentTetrimino();
    }

    drawBoard() {
        const gameBoardElement = document.getElementById("game-board");
        gameBoardElement.innerHTML = "";

        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const cell = document.createElement("div");
                const cellValue = this.board[y][x];

                cell.className = cellValue || "empty";
                gameBoardElement.appendChild(cell);
            }
        }
    }

    getGhostY() {
        let ghostY = this.currentTetrimino.y;

        while (
            !this.wouldCollideAt(
                this.currentTetrimino,
                this.currentTetrimino.x,
                ghostY + 1
            )
        ) {
            ghostY++;
        }

        return ghostY;
    }

    drawGhostTetrimino() {
        if (!this.hasStarted || this.isGameOver || this.isClearing) return;

        const ghostY = this.getGhostY();

        if (ghostY === this.currentTetrimino.y) return;

        const gameBoardElement = document.getElementById("game-board");

        this.currentTetrimino.blocks.forEach((block) => {
            const x = block.x + this.currentTetrimino.x;
            const y = block.y + ghostY;

            if (y >= 0 && x >= 0 && x < BOARD_WIDTH && y < BOARD_HEIGHT) {
                const index = y * BOARD_WIDTH + x;
                const cell = gameBoardElement.childNodes[index];

                if (cell) {
                    cell.className = `${this.currentTetrimino.color} ghost`;
                }
            }
        });
    }

    drawCurrentTetrimino() {
        const gameBoardElement = document.getElementById("game-board");

        this.currentTetrimino.blocks.forEach((block) => {
            const x = block.x + this.currentTetrimino.x;
            const y = block.y + this.currentTetrimino.y;

            if (y >= 0 && x >= 0 && x < BOARD_WIDTH && y < BOARD_HEIGHT) {
                const index = y * BOARD_WIDTH + x;
                const cell = gameBoardElement.childNodes[index];

                if (cell) {
                    cell.className = this.currentTetrimino.color;
                }
            }
        });
    }

    drawNextTetrimino() {
        this.drawPreviewTetrimino("next-tetrimino", this.nextTetrimino);
    }

    drawHoldTetrimino() {
        this.drawPreviewTetrimino("hold-tetrimino", this.holdTetrimino);
    }

    drawPreviewTetrimino(elementId, tetrimino) {
        const previewElement = document.getElementById(elementId);
        previewElement.innerHTML = "";

        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                const cell = document.createElement("div");
                cell.classList.add("empty");
                previewElement.appendChild(cell);
            }
        }

        if (!tetrimino) return;

        tetrimino.blocks.forEach((block) => {
            const x = block.x;
            const y = block.y;

            if (y >= 0 && y < 4 && x >= 0 && x < 4) {
                const index = y * 4 + x;
                previewElement.childNodes[index].className = tetrimino.color;
            }
        });
    }

    wouldCollideAt(tetrimino, targetX, targetY) {
        for (const block of tetrimino.blocks) {
            const x = block.x + targetX;
            const y = block.y + targetY;

            const isOutsideLeft = x < 0;
            const isOutsideRight = x >= BOARD_WIDTH;
            const isOutsideBottom = y >= BOARD_HEIGHT;
            const isInsideBoard = y >= 0;

            if (isOutsideLeft || isOutsideRight || isOutsideBottom) {
                return true;
            }

            if (isInsideBoard && this.board[y][x] !== 0) {
                return true;
            }
        }

        return false;
    }

    checkCollision() {
        return this.wouldCollideAt(
            this.currentTetrimino,
            this.currentTetrimino.x,
            this.currentTetrimino.y
        );
    }

    isTouchingGround() {
        return this.wouldCollideAt (
            this.currentTetrimino,
            this.currentTetrimino.x,
            this.currentTetrimino.y + 1
        );
    }

    clearLockDelay() {
        if (this.lockDelayTimerId) {
            clearTimeout(this.lockDelayTimerId);
            this.lockDelayTimerId = null;
        }
    }

    startLockDelay() {
        if (
            this.lockDelayTimerId ||
            this.isGameOver ||
            this.isPaused ||
            this.isClearing
        ) {
            return;
        }

        this.lockDelayTimerId = setTimeout(async () => {
            this.lockDelayTimerId = null;

            if (this.isGameOver || this.isPaused || this.isClearing) {
                return;
            }

            if (this.isTouchingGround()) {
                await this.lockAndAdvance();
            }
        }, LOCK_DELAY_TIME);
    }

    syncLockDelay() {
        if (
            !this.hasStarted ||
            this.isGameOver ||
            this.isPaused ||
            this.isClearing
        ) {
            return;
        }

        if (this.isTouchingGround()) {
            this.startLockDelay();
        } else {
            this.clearLockDelay();
        }
    }

    lockTetrimino() {
        this.currentTetrimino.blocks.forEach(block => {
            const x = block.x + this.currentTetrimino.x;
            const y = block.y + this.currentTetrimino.y;

            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
                this.board[y][x] = this.currentTetrimino.color;
            }
        });
    }

    async lockAndAdvance() {
        this.isClearing = true;

        this.lockTetrimino();

        const linesCleared = await this.clearLines();
        this.applyLineClearScore(linesCleared);

        this.currentTetrimino = this.nextTetrimino;
        this.currentTetrimino.resetPosition();

        this.nextTetrimino = this.getNextTetrimino();
        this.canHold = true;

        this.drawNextTetrimino();

        this.isClearing = false;

        if (this.checkCollision()) {
            this.showGameOver();
            return;
        }

        this.draw();
        this.updateScoreboard();
    }

    async clearLines() {
        const fullRows = [];

        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (this.board[y].every(cell => cell !== 0)) {
                fullRows.push(y);
            }
        }

        if (fullRows.length === 0) {
            return 0;
        }

        fullRows.forEach(rowIndex => {
            this.board[rowIndex] = Array(BOARD_WIDTH).fill("clearing");
        });

        this.draw();

        await sleep(ROW_CLEAR_ANIMATION_TIME);

        this.board = this.board.filter((row, rowIndex) => {
            return !fullRows.includes(rowIndex);
        });

        while (this.board.length < BOARD_HEIGHT) {
            this.board.unshift(Array(BOARD_WIDTH).fill(0));
        }

        return fullRows.length;
    }

    applyLineClearScore(linesCleared) {
        if (linesCleared === 0) return;

        this.lines += linesCleared;

        const lineClearPoints = [0, 40, 100, 300, 1200];
        this.score += lineClearPoints[linesCleared] * this.level;

        this.level = Math.floor(this.lines / 10) + 1;
        this.dropInterval = Math.max(
            MIN_DROP_INTERVAL,
            STARTING_DROP_INTERVAL - ((this.level - 1) * LEVEL_SPEED_STEP)
        );

        this.updateHighScore();
    }

    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem("highScore", this.highScore);
        }
    }

    async softDrop() {
        if (this.isClearing || this.isGameOver) return;

        this.currentTetrimino.y++;

        if (this.checkCollision()) {
            this.currentTetrimino.y--;
            await this.lockAndAdvance();
            return;
        }

        this.draw();
    }

    async hardDrop() {
        if (!this.canUseControls()) return;

        let droppedRows = 0;

        while (true) {
            this.currentTetrimino.y++;

            if (this.checkCollision()) {
                this.currentTetrimino.y--;
                break;
            }

            droppedRows++;
        }

        this.score += droppedRows * 2;
        this.updateHighScore();
        this.updateScoreboard();

        await this.lockAndAdvance();
    }

    moveLeft() {
        if (!this.canUseControls()) return;

        this.currentTetrimino.x--;

        if (this.checkCollision()) {
            this.currentTetrimino.x++;
        }

        this.draw();
    }

    moveRight() {
        if (!this.canUseControls()) return;

        this.currentTetrimino.x++;

        if (this.checkCollision()) {
            this.currentTetrimino.x--;
        }

        this.draw();
    }

    async moveDown() {
        if (!this.canUseControls()) return;

        await this.softDrop();
        this.updateScoreboard();
    }

    rotate() {
        if (!this.canUseControls()) return;

        if (this.currentTetrimino.color === "O") {
            return;
        }

        const originalX = this.currentTetrimino.x;
        const originalBlocks = this.currentTetrimino.blocks.map(block => ({ ...block }));

        const rotatedBlocks = this.currentTetrimino.blocks.map(block => ({
            x: -block.y,
            y: block.x
        }));

        const minX = Math.min(...rotatedBlocks.map(block => block.x));
        const minY = Math.min(...rotatedBlocks.map(block => block.y));

        this.currentTetrimino.blocks = rotatedBlocks.map(block => ({
            x: block.x - minX,
            y: block.y - minY
        }));

        const offsets = [0, -1, 1, -2, 2];
        let foundValidPosition = false;

        for (const offset of offsets) {
            this.currentTetrimino.x = originalX + offset;

            if (!this.checkCollision()) {
                foundValidPosition = true;
                break;
            }
        }

        if (!foundValidPosition) {
            this.currentTetrimino.blocks = originalBlocks;
            this.currentTetrimino.x = originalX;
        }

        this.draw();
    }

    hold() {
        if (!this.canUseControls() || !this.canHold) return;

        this.canHold = false;

        const currentPieceColor = this.currentTetrimino.color;

        if (this.holdTetrimino) {
            const heldPieceColor = this.holdTetrimino.color;

            this.currentTetrimino = this.createTetriminoByColor(heldPieceColor);
            this.holdTetrimino = this.createTetriminoByColor(currentPieceColor);
        } else {
            this.holdTetrimino = this.createTetriminoByColor(currentPieceColor);

            this.currentTetrimino = this.nextTetrimino;
            this.currentTetrimino.resetPosition();

            this.nextTetrimino = this.getNextTetrimino();
            this.drawNextTetrimino();
        }

        this.drawHoldTetrimino();

        if (this.checkCollision()) {
            this.showGameOver();
            return;
        }

        this.draw();
    }

    updateScoreboard() {
        document.getElementById("score-value").textContent = this.score;
        document.getElementById("lines-value").textContent = this.lines;
        document.getElementById("level-value").textContent = this.level;
        document.getElementById("high-score-value").textContent = this.highScore;
    }

    updateGameOverStats() {
        document.getElementById("game-over-score-value").textContent = this.score;
        document.getElementById("game-over-lines-value").textContent = this.lines;
        document.getElementById("game-over-level-value").textContent = this.level;
        document.getElementById("game-over-high-score-value").textContent = this.highScore;
    }

    resetGameState() {
        this.board = createEmptyBoard();

        this.score = 0;
        this.lines = 0;
        this.level = 1;

        this.isGameOver = false;
        this.isPaused = true;
        this.hasStarted = false;
        this.isClearing = false;

        this.tetriminoBag = [];

        this.currentTetrimino = this.getNextTetrimino();
        this.nextTetrimino = this.getNextTetrimino();

        this.dropCounter = 0;
        this.dropInterval = STARTING_DROP_INTERVAL;
        this.lastTime = 0;

        this.holdTetrimino = null;
        this.canHold = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        document.getElementById("game-over").style.display = "none";
        document.getElementById("start-pause").textContent = "Start";

        this.draw();
        this.drawNextTetrimino();
        this.drawHoldTetrimino();
        this.updateScoreboard();
    }

    restart() {
        this.resetGameState();
        this.start();
    }

    showGameOver() {
        this.isGameOver = true;
        this.isPaused = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.updateScoreboard();
        this.updateGameOverStats();

        document.getElementById("start-pause").textContent = "Start";
        document.getElementById("game-over").style.display = "flex";
    }

    start() {
        if (this.hasStarted && !this.isPaused) return;

        if (this.isGameOver) {
            this.resetGameState();
        }

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

    async gameLoop(time = 0) {
        if (this.isGameOver || this.isPaused) {
            this.animationFrameId = null;
            return;
        }

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            await this.softDrop();
            this.dropCounter = 0;
        }

        this.draw();
        this.updateScoreboard();

        this.animationFrameId = requestAnimationFrame((nextTime) => this.gameLoop(nextTime));
    }
}

const game = new Game();

const keyMap = {
    ArrowLeft: "moveLeft",
    ArrowRight: "moveRight",
    ArrowDown: "moveDown",
    ArrowUp: "rotate",
    c: "hold",
    C: "hold",
    p: "togglePause",
    P: "togglePause"
};

const codeMap = {
    Space: "hardDrop"
};

const blurActiveButton = () => {
    if (document.activeElement instanceof HTMLButtonElement) {
        document.activeElement.blur();
    }
};

document.addEventListener("keydown", (event) => {
    const action = keyMap[event.key] || codeMap[event.code];

    if (!action) return;

    event.preventDefault();
    game[action]();
});

document.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
        event.preventDefault();
    }
});

document.getElementById("start-pause").addEventListener("click", () => {
    blurActiveButton();
    game.togglePause();
});

document.getElementById("game-over-restart").addEventListener("click", () => {
    blurActiveButton();
    game.restart();
});

document.getElementById("restart-button").addEventListener("click", () => {
    blurActiveButton();
    game.restart();
});

document.getElementById("left-button").addEventListener("click", () => {
    blurActiveButton();
    game.moveLeft();
});

document.getElementById("right-button").addEventListener("click", () => {
    blurActiveButton();
    game.moveRight();
});

document.getElementById("down-button").addEventListener("click", () => {
    blurActiveButton();
    game.moveDown();
});

document.getElementById("rotate-button").addEventListener("click", () => {
    blurActiveButton();
    game.rotate();
});

document.getElementById("hard-drop-button").addEventListener("click", () => {
    blurActiveButton();
    game.hardDrop();
});