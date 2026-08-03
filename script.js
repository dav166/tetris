// Board Dimensions
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// Game Timing
const STARTING_DROP_INTERVAL = 1000;
const MIN_DROP_INTERVAL = 100;
const LEVEL_SPEED_STEP = 75;
const ROW_CLEAR_ANIMATION_TIME = 250;
const LOCK_DELAY_TIME = 500;
const LOCK_DELAY_RESET_LIMIT = 15;
const GAME_STATUS = Object.freeze({
    READY: "ready",
    PLAYING: "playing",
    PAUSED: "paused",
    GAME_OVER: "game-over"
});

const GAME_STATUS_CONTENT = Object.freeze({
    [GAME_STATUS.READY]: {
        eyebrow: "Game ready",
        title: "Ready?",
        message: "Press Start or P to begin.",
        overlayAction: "Start Game",
        controlText: "Start",
        controlLabel: "Start game",
        showOverlay: true
    },
    [GAME_STATUS.PLAYING]: {
        eyebrow: "",
        title: "",
        message: "",
        overlayAction: "",
        controlText: "Pause",
        controlLabel: "Pause game",
        showOverlay: false
    },
    [GAME_STATUS.PAUSED]: {
        eyebrow: "Game paused",
        title: "Paused",
        message: "Your board is safe. Resume when you are ready.",
        overlayAction: "Resume Game",
        controlText: "Resume",
        controlLabel: "Resume game",
        showOverlay: true
    },
    [GAME_STATUS.GAME_OVER]: {
        eyebrow: "",
        title: "",
        message: "",
        overlayAction: "",
        controlText: "New Game",
        controlLabel: "Start a new game",
        showOverlay: false
    }
});

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
        this.lockDelayResetCount = 0;

        this.holdTetrimino = null;
        this.canHold = true;

        this.gameBoardElement = document.getElementById("game-board");
        this.boardCells = [];

        this.init();
    }

    init() {
        this.createBoardCells();
        this.draw();
        this.drawNextTetrimino();
        this.drawHoldTetrimino();
        this.updateScoreboard();
        this.updateGameStatus();
    }

    createBoardCells() {
        const cellCount = BOARD_WIDTH * BOARD_HEIGHT;
        const fragment = document.createDocumentFragment();

        this.gameBoardElement.replaceChildren();
        this.boardCells = [];

        for (let index = 0; index < cellCount; index++) {
            const cell = document.createElement("div");

            cell.className = "empty";
            cell.setAttribute("aria-hidden", "true");

            this.boardCells.push(cell);
            fragment.appendChild(cell);
        }

        this.gameBoardElement.appendChild(fragment);
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

    getGameStatus() {
        if (this.isGameOver) {
            return GAME_STATUS.GAME_OVER;
        }

        if (!this.hasStarted) {
            return GAME_STATUS.READY;
        }

        if (this.isPaused) {
            return GAME_STATUS.PAUSED;
        }

        return GAME_STATUS.PLAYING;
    }

    updateGameStatus() {
        const status = this.getGameStatus();
        const content = GAME_STATUS_CONTENT[status];

        const gameContainer = document.getElementById("game-container");
        const statusOverlay = document.getElementById("game-status");
        const statusEyebrow = document.getElementById("game-status-eyebrow");
        const statusTitle = document.getElementById("game-status-title");
        const statusMessage = document.getElementById("game-status-message");
        const statusActionButton = document.getElementById("game-status-action");
        const startPauseButton = document.getElementById("start-pause");

        gameContainer.dataset.gameState = status;
        statusOverlay.dataset.status = status;

        statusEyebrow.textContent = content.eyebrow;
        statusTitle.textContent = content.title;
        statusMessage.textContent = content.message;
        statusActionButton.textContent = content.overlayAction;

        statusOverlay.classList.toggle("is-visible", content.showOverlay);
        statusOverlay.setAttribute(
            "aria-hidden",
            String(!content.showOverlay)
        );

        statusActionButton.disabled = !content.showOverlay;
        statusActionButton.tabIndex = content.showOverlay ? 0 : -1;

        startPauseButton.textContent = content.controlText;
        startPauseButton.setAttribute(
            "aria-label",
            content.controlLabel
        );
    }

    draw() {
        this.drawBoard();
        this.drawGhostTetrimino();
        this.drawCurrentTetrimino();
    }

    drawBoard() {
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            for (let x = 0; x < BOARD_WIDTH; x++) {
                const index = y * BOARD_WIDTH + x;
                const cellValue = this.board[y][x];
                const cell = this.boardCells[index];

                cell.className = cellValue || "empty";
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
        if (!this.hasStarted || this.isGameOver || this.isClearing) {
            return;
        }

        const ghostY = this.getGhostY();

        if (ghostY === this.currentTetrimino.y) {
            return;
        }

        this.currentTetrimino.blocks.forEach((block) => {
            const x = block.x + this.currentTetrimino.x;
            const y = block.y + ghostY;

            const isInsideBoard =
                y >= 0 &&
                y < BOARD_HEIGHT &&
                x >= 0 &&
                x < BOARD_WIDTH;

            if (!isInsideBoard) {
                return;
            }

            const index = y * BOARD_WIDTH + x;
            const cell = this.boardCells[index];

            if (cell) {
                cell.className = `${this.currentTetrimino.color} ghost`;
            }
        });
    }

    drawCurrentTetrimino() {
        this.currentTetrimino.blocks.forEach((block) => {
            const x = block.x + this.currentTetrimino.x;
            const y = block.y + this.currentTetrimino.y;

            const isInsideBoard =
                y >= 0 &&
                y < BOARD_HEIGHT &&
                x >= 0 &&
                x < BOARD_WIDTH;

            if (!isInsideBoard) {
                return;
            }

            const index = y * BOARD_WIDTH + x;
            const cell = this.boardCells[index];

            if (cell) {
                cell.className = this.currentTetrimino.color;
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

    tryRefreshLockDelay() {
        if (!this.isTouchingGround()) {
            this.clearLockDelay();
            return;
        }

        if (this.lockDelayResetCount >= LOCK_DELAY_RESET_LIMIT) {
            this.startLockDelay();
            return;
        }

        this.lockDelayResetCount++;
        this.clearLockDelay();
        this.startLockDelay();
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
        this.clearLockDelay();
        this.isClearing = true;

        this.lockTetrimino();

        const linesCleared = await this.clearLines();
        this.applyLineClearScore(linesCleared);

        this.currentTetrimino = this.nextTetrimino;
        this.currentTetrimino.resetPosition();
        this.lockDelayResetCount = 0;

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
            this.startLockDelay();
            return;
        }
        
        this.syncLockDelay();
        this.draw();
    }

    async hardDrop() {
        if (!this.canUseControls()) return;

        this.clearLockDelay();

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

        const movedSuccessfully = !this.checkCollision();

        if (!movedSuccessfully) {
            this.currentTetrimino.x++;
        }

        if (movedSuccessfully) {
            this.tryRefreshLockDelay();
        } else {
            this.syncLockDelay();
        }

        this.draw();
    }

    moveRight() {
        if (!this.canUseControls()) return;

        this.currentTetrimino.x++;

        const movedSuccessfully = !this.checkCollision();

        if (!movedSuccessfully) {
            this.currentTetrimino.x--;
        }

        if (movedSuccessfully) {
            this.tryRefreshLockDelay();
        } else {
            this.syncLockDelay();
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
            this.syncLockDelay();
        } else {
            this.tryRefreshLockDelay();
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

        this.syncLockDelay();
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
        this.lockDelayResetCount = 0;

        this.holdTetrimino = null;
        this.canHold = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.clearLockDelay();

        document.getElementById("game-over").style.display = "none";

        this.draw();
        this.drawNextTetrimino();
        this.drawHoldTetrimino();
        this.updateScoreboard();
        this.updateGameStatus();
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

        this.clearLockDelay();

        this.updateScoreboard();
        this.updateGameOverStats();
        this.updateGameStatus();

        document.getElementById("game-over").style.display = "flex";
        document.getElementById("game-over-restart").focus();
    }

    start() {
        if (this.hasStarted && !this.isPaused) {
            return;
        }

        if (this.isGameOver) {
            this.resetGameState();
        }

        this.hasStarted = true;
        this.isPaused = false;
        this.lastTime = 0;
        this.dropCounter = 0;

        this.draw();
        this.updateScoreboard();
        this.updateGameStatus();

        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame((time) => {
                this.gameLoop(time);
            });
        }
    }

    togglePause() {
        if (this.isGameOver) {
            this.restart();
            return;
        }

        if (!this.hasStarted) {
            this.start();
            return;
        }

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            this.clearLockDelay();
            this.updateGameStatus();
            return;
        }

        this.lastTime = 0;
        this.dropCounter = 0;

        this.updateGameStatus();
        this.syncLockDelay();

        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame((time) => {
                this.gameLoop(time);
            });
        }
    }

    async gameLoop(time = 0) {
        if (this.isGameOver || this.isPaused) {
            this.animationFrameId = null;
            return;
        }

        if (this.lastTime === 0) {
            this.lastTime = time;
        }

        const deltaTime = time - this.lastTime;

        this.lastTime = time;
        this.dropCounter += deltaTime;

        if (this.dropCounter >= this.dropInterval) {
            await this.softDrop();
            this.dropCounter = 0;
        }

        if (this.isGameOver || this.isPaused) {
            this.animationFrameId = null;
            return;
        }

        this.draw();
        this.updateScoreboard();

        this.animationFrameId = requestAnimationFrame((nextTime) => {
            this.gameLoop(nextTime);
        });
    }
}

const game = new Game();

const REPEAT_INPUTS = Object.freeze({
    ArrowLeft: {
        action: "moveLeft",
        delay: 150,
        interval: 45,
        axis: "horizontal"
    },
    ArrowRight: {
        action: "moveRight",
        delay: 150,
        interval: 45,
        axis: "horizontal"
    },
    ArrowDown: {
        action: "moveDown",
        delay: 70,
        interval: 35,
        axis: "vertical"
    }
});

const SINGLE_INPUTS = Object.freeze({
    ArrowUp: "rotate",
    KeyC: "hold",
    KeyP: "togglePause",
    Space: "hardDrop"
});

const activeRepeats = new Map();
const heldKeys = new Set();

let activeHorizontalKey = null;

const invokeGameAction = (action) => {
    const method = game[action];

    if (typeof method !== "function") {
        throw new Error(`Unknown game action: ${action}`);
    }

    return method.call(game);
};

const stopRepeat = (repeatId) => {
    const state = activeRepeats.get(repeatId);

    if (!state) {
        return;
    }

    clearTimeout(state.timeoutId);
    clearInterval(state.intervalId);

    activeRepeats.delete(repeatId);
};

const startRepeat = (
    repeatId,
    action,
    delay,
    interval
) => {
    stopRepeat(repeatId);
    invokeGameAction(action);

    const state = {
        timeoutId: null,
        intervalId: null
    };

    state.timeoutId = setTimeout(() => {
        state.intervalId = setInterval(() => {
            invokeGameAction(action);
        }, interval);
    }, delay);

    activeRepeats.set(repeatId, state);
};

const stopAllRepeats = () => {
    [...activeRepeats.keys()].forEach((repeatId) => {
        stopRepeat(repeatId);
    });
};

const isRecognizedKey = (code) => {
    return Boolean(
        REPEAT_INPUTS[code] ||
        SINGLE_INPUTS[code]
    );
};

const startKeyboardRepeat = (code) => {
    const config = REPEAT_INPUTS[code];

    if (config.axis === "horizontal") {
        if (
            activeHorizontalKey &&
            activeHorizontalKey !== code
        ) {
            stopRepeat(
                `keyboard:${activeHorizontalKey}`
            );
        }

        activeHorizontalKey = code;
    }

    startRepeat(
        `keyboard:${code}`,
        config.action,
        config.delay,
        config.interval
    );
};

const resumeHeldHorizontalKey = () => {
    const fallbackKey = [
        "ArrowLeft",
        "ArrowRight"
    ].find((code) => {
        return heldKeys.has(code);
    });

    if (fallbackKey) {
        startKeyboardRepeat(fallbackKey);
    }
};

const resetKeyboardInput = () => {
    stopAllRepeats();
    heldKeys.clear();
    activeHorizontalKey = null;
};

document.addEventListener("keydown", (event) => {
    const { code } = event;

    if (!isRecognizedKey(code)) {
        return;
    }

    event.preventDefault();

    if (heldKeys.has(code)) {
        return;
    }

    heldKeys.add(code);

    if (REPEAT_INPUTS[code]) {
        startKeyboardRepeat(code);
        return;
    }

    const action = SINGLE_INPUTS[code];

    if (action === "togglePause") {
        stopAllRepeats();
        activeHorizontalKey = null;
    }

    invokeGameAction(action);
});

document.addEventListener("keyup", (event) => {
    const { code } = event;

    if (!isRecognizedKey(code)) {
        return;
    }

    event.preventDefault();

    heldKeys.delete(code);
    stopRepeat(`keyboard:${code}`);

    if (activeHorizontalKey === code) {
        activeHorizontalKey = null;
        resumeHeldHorizontalKey();
    }
});

window.addEventListener(
    "blur",
    resetKeyboardInput
);

document.addEventListener(
    "visibilitychange",
    () => {
        if (document.hidden) {
            resetKeyboardInput();
        }
    }
);

const blurActiveButton = () => {
    if (
        document.activeElement instanceof
        HTMLButtonElement
    ) {
        document.activeElement.blur();
    }
};

const prepareForGameStateChange = () => {
    stopAllRepeats();
    activeHorizontalKey = null;
};

const bindActionButton = (
    elementId,
    action
) => {
    const button = document.getElementById(elementId);

    button.addEventListener("click", () => {
        blurActiveButton();

        if (
            action === "togglePause" ||
            action === "restart"
        ) {
            prepareForGameStateChange();
        }

        invokeGameAction(action);
    });
};

const bindRepeatingButton = (
    elementId,
    action,
    delay,
    interval
) => {
    const button = document.getElementById(elementId);
    const repeatId = `button:${elementId}`;

    let activePointerId = null;

    const stop = () => {
        stopRepeat(repeatId);

        activePointerId = null;
        button.classList.remove("is-pressed");
    };

    button.addEventListener(
        "pointerdown",
        (event) => {
            if (activePointerId !== null) {
                return;
            }

            event.preventDefault();
            blurActiveButton();

            activePointerId = event.pointerId;

            button.setPointerCapture(
                event.pointerId
            );

            button.classList.add("is-pressed");

            startRepeat(
                repeatId,
                action,
                delay,
                interval
            );
        }
    );

    button.addEventListener(
        "pointerup",
        stop
    );

    button.addEventListener(
        "pointercancel",
        stop
    );

    button.addEventListener(
        "lostpointercapture",
        stop
    );

    button.addEventListener(
        "click",
        (event) => {
            /*
             * Keyboard-generated clicks normally use
             * detail === 0. Pointer clicks are already
             * handled by pointerdown.
             */
            if (event.detail === 0) {
                invokeGameAction(action);
            }
        }
    );
};

bindActionButton(
    "game-status-action",
    "togglePause"
);

bindActionButton(
    "start-pause",
    "togglePause"
);

bindActionButton(
    "restart-button",
    "restart"
);

bindActionButton(
    "game-over-restart",
    "restart"
);

bindActionButton(
    "rotate-button",
    "rotate"
);

bindActionButton(
    "hard-drop-button",
    "hardDrop"
);

bindActionButton(
    "hold-button",
    "hold"
);

bindRepeatingButton(
    "left-button",
    "moveLeft",
    150,
    45
);

bindRepeatingButton(
    "right-button",
    "moveRight",
    150,
    45
);

bindRepeatingButton(
    "down-button",
    "moveDown",
    70,
    35
);

const SWIPE_STEP_DISTANCE = 24;
const SWIPE_RELEASE_DISTANCE = 12;
const HARD_DROP_SWIPE_DISTANCE = 48;
const TAP_DISTANCE_TOLERANCE = 10;

const boardShell =
    document.getElementById("board-shell");

let boardGesture = null;

const invokeRepeatedly = (
    action,
    count
) => {
    for (
        let step = 0;
        step < count;
        step++
    ) {
        invokeGameAction(action);
    }
};

const clearBoardGesture = () => {
    if (
        boardGesture &&
        boardShell.hasPointerCapture(
            boardGesture.pointerId
        )
    ) {
        boardShell.releasePointerCapture(
            boardGesture.pointerId
        );
    }

    boardGesture = null;
};

boardShell.addEventListener(
    "pointerdown",
    (event) => {
        if (
            event.pointerType === "mouse" ||
            event.target.closest("button") ||
            !game.canUseControls()
        ) {
            return;
        }

        event.preventDefault();

        boardShell.setPointerCapture(
            event.pointerId
        );

        boardGesture = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            lastX: event.clientX,
            lastY: event.clientY,
            movedPiece: false
        };
    }
);

boardShell.addEventListener(
    "pointermove",
    (event) => {
        if (
            !boardGesture ||
            boardGesture.pointerId !==
                event.pointerId
        ) {
            return;
        }

        event.preventDefault();

        const deltaX =
            event.clientX - boardGesture.lastX;

        const deltaY =
            event.clientY - boardGesture.lastY;

        const absoluteX = Math.abs(deltaX);
        const absoluteY = Math.abs(deltaY);

        const isHorizontalGesture =
            absoluteX >= SWIPE_STEP_DISTANCE &&
            absoluteX > absoluteY;

        if (isHorizontalGesture) {
            const stepCount = Math.floor(
                absoluteX / SWIPE_STEP_DISTANCE
            );

            const action =
                deltaX < 0
                    ? "moveLeft"
                    : "moveRight";

            invokeRepeatedly(
                action,
                stepCount
            );

            boardGesture.lastX +=
                Math.sign(deltaX) *
                stepCount *
                SWIPE_STEP_DISTANCE;

            boardGesture.lastY = event.clientY;
            boardGesture.movedPiece = true;

            return;
        }

        const isDownwardGesture =
            deltaY >= SWIPE_STEP_DISTANCE &&
            absoluteY > absoluteX;

        if (isDownwardGesture) {
            const stepCount = Math.floor(
                deltaY / SWIPE_STEP_DISTANCE
            );

            invokeRepeatedly(
                "moveDown",
                stepCount
            );

            boardGesture.lastY +=
                stepCount *
                SWIPE_STEP_DISTANCE;

            boardGesture.lastX = event.clientX;
            boardGesture.movedPiece = true;
        }
    }
);

boardShell.addEventListener(
    "pointerup",
    (event) => {
        if (
            !boardGesture ||
            boardGesture.pointerId !==
                event.pointerId
        ) {
            return;
        }

        const totalX =
            event.clientX - boardGesture.startX;

        const totalY =
            event.clientY - boardGesture.startY;

        const absoluteX = Math.abs(totalX);
        const absoluteY = Math.abs(totalY);

        const totalDistance = Math.hypot(
            totalX,
            totalY
        );

        const movedPiece =
            boardGesture.movedPiece;

        clearBoardGesture();

        if (movedPiece) {
            return;
        }

        const isHardDropGesture =
            totalY <=
                -HARD_DROP_SWIPE_DISTANCE &&
            absoluteY > absoluteX;

        if (isHardDropGesture) {
            invokeGameAction("hardDrop");
            return;
        }

        const isHorizontalRelease =
            absoluteX >=
                SWIPE_RELEASE_DISTANCE &&
            absoluteX > absoluteY;

        if (isHorizontalRelease) {
            invokeGameAction(
                totalX < 0
                    ? "moveLeft"
                    : "moveRight"
            );

            return;
        }

        const isDownwardRelease =
            totalY >=
                SWIPE_RELEASE_DISTANCE &&
            absoluteY > absoluteX;

        if (isDownwardRelease) {
            invokeGameAction("moveDown");
            return;
        }

        if (
            totalDistance <=
            TAP_DISTANCE_TOLERANCE
        ) {
            invokeGameAction("rotate");
        }
    }
);

boardShell.addEventListener(
    "pointercancel",
    clearBoardGesture
);

boardShell.addEventListener(
    "lostpointercapture",
    () => {
        boardGesture = null;
    }
);