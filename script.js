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
    // Add other shapes like T, S, Z, J, L
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
  