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
  