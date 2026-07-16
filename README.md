# Tetris

A polished, responsive falling-block puzzle game built from scratch with vanilla JavaScript, HTML, and CSS.

The project began as a foundational JavaScript exercise and has grown into a more complete browser game featuring modern Tetris-inspired mechanics, persistent scoring, responsive controls, animation, and structured object-oriented game logic.

<p align="center">
  <a href="https://dav166.github.io/tetris/"><strong>Play the live game</strong></a>
</p>

## Features

* Responsive 10 × 20 game board
* All seven standard tetrimino shapes
* Seven-bag randomization system
* Next-piece preview
* Hold-piece system
* Ghost-piece landing preview
* Soft drop and hard drop
* Lock delay with a limited number of movement resets
* Wall-kick-style rotation offsets
* Animated line clearing
* Score, line, and level tracking
* Increasing drop speed as levels advance
* Persistent local high score using `localStorage`
* Pause and restart controls
* Keyboard and touch controls
* Responsive desktop and mobile layouts
* Game-over summary with final statistics
* No frameworks or external runtime dependencies

## Controls

| Action           | Keyboard |
| ---------------- | -------- |
| Move left        | `←`      |
| Move right       | `→`      |
| Soft drop        | `↓`      |
| Rotate clockwise | `↑`      |
| Hard drop        | `Space`  |
| Hold piece       | `C`      |
| Pause or resume  | `P`      |

Touch controls are displayed below the game board for mobile and touchscreen users.

## Technologies

* HTML5
* CSS3
* JavaScript
* DOM manipulation
* `requestAnimationFrame`
* `localStorage`
* Responsive CSS Grid and Flexbox

## Project Structure

```text
tetris/
├── index.html   # Game interface and accessible page structure
├── style.css    # Layout, responsive design, animations, and piece styling
├── script.js    # Game state, rendering, movement, scoring, and input logic
└── README.md    # Project documentation
```

## Running the Project Locally

This project does not require a build process or package installation.

### Option 1: Open the file directly

1. Download or clone the repository.
2. Open `index.html` in a modern browser.

### Option 2: Use a local development server

Clone the repository:

```bash
git clone https://github.com/dav166/tetris.git
cd tetris
```

Then launch the project with an editor extension such as Live Server, or run a simple local server:

```bash
python3 -m http.server 8000
```

Visit:

```text
http://localhost:8000
```

## How the Game Works

### Board representation

The playfield is represented by a two-dimensional JavaScript array containing 20 rows and 10 columns.

An empty cell contains `0`. A locked block contains the letter associated with its tetrimino type, such as `T`, `I`, or `L`.

### Tetriminos

Each tetrimino is created from a reusable template containing:

* Four block coordinates
* A piece type
* A starting board position

The `Tetrimino` class creates independent copies of these templates so rotating or moving one piece does not modify future pieces.

### Seven-bag randomizer

Rather than choosing every piece independently, the game shuffles all seven tetrimino types into a bag.

Pieces are drawn from that bag until it is empty, at which point another seven-piece bag is shuffled. This produces more balanced piece sequences than unrestricted random selection.

### Game loop

The game uses `requestAnimationFrame` to calculate elapsed time and control automatic piece movement.

The loop coordinates:

* Gravity
* Rendering
* Scoreboard updates
* Pausing
* Game-over detection

### Collision detection

Before a piece moves or rotates, the game checks whether any of its blocks would:

* Leave the left side of the board
* Leave the right side of the board
* Pass through the bottom
* Overlap a locked block

Invalid movements are reversed before the board is redrawn.

### Lock delay

A piece does not immediately lock when it touches the ground. A short delay gives the player time to move or rotate it into its final position.

The delay can only be refreshed a limited number of times, preventing a grounded piece from being moved indefinitely.

### Line clearing

After a piece locks, the game searches the board for completed rows.

Completed rows briefly animate, are removed from the board, and are replaced by new empty rows at the top.

### Scoring and progression

Line-clear scores are calculated using the current level:

| Lines cleared | Base points |
| ------------- | ----------: |
| 1             |          40 |
| 2             |         100 |
| 3             |         300 |
| 4             |        1200 |

The base score is multiplied by the player’s current level.

The level increases after every ten cleared lines, and the automatic drop interval becomes shorter as the level rises.

Hard drops also award points based on the number of rows traveled.

## What I Practiced

This project demonstrates practical experience with:

* Object-oriented JavaScript
* Managing asynchronous animations
* Separating game state from rendered UI
* Two-dimensional array manipulation
* Collision-detection algorithms
* Keyboard and pointer input handling
* Browser animation loops
* Local persistence
* Responsive interface design
* Incremental development with semantic Git commits
* Debugging state-related and timing-related defects

## Planned Improvements

* Full Super Rotation System rotation states and kick tables
* Improved keyboard repeat behavior
* Soft-drop scoring
* Pause-state overlay
* Sound effects and volume controls
* Additional visual themes
* Accessibility announcements for game state changes
* Automated tests for collision, scoring, and line clearing
* Refactoring rendering to reuse board cells
* Optional gameplay statistics and session history

## Development Approach

This project is being developed incrementally. Features, fixes, refactors, and visual improvements are committed separately using semantic Git commit messages.

Examples:

```text
feat: Add ghost piece landing preview
fix: Prevent duplicate animation loops after restart
refactor: Extract shared collision detection logic
style: Improve responsive game layout
docs: Expand project documentation
```

## Author

Built by [David Spaulding](https://github.com/dav166) as a JavaScript learning and portfolio project.
