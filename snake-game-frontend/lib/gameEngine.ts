/**
 * Snake Game Engine
 * Classic snake game logic with FHE integration
 */

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export type Position = { x: number; y: number };

export enum GameState {
  IDLE = "idle",
  PLAYING = "playing",
  PAUSED = "paused",
  GAME_OVER = "game_over",
  SUBMITTING = "submitting",
}

export interface GameConfig {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  initialSpeed: number; // ms per frame
  speedIncrement: number; // score points to trigger speed increase
  speedDecrease: number; // ms to decrease per speed increase
  maxSpeed: number; // minimum ms per frame
}

export interface Snake {
  body: Position[];
  direction: Direction;
  nextDirection: Direction;
}

export interface GameData {
  snake: Snake;
  food: Position;
  score: number;
  gameState: GameState;
  speed: number;
  combo: number; // consecutive food eaten
  lastFoodTime: number; // timestamp
}

export const DEFAULT_CONFIG: GameConfig = {
  gridWidth: 20,
  gridHeight: 20,
  cellSize: 20,
  initialSpeed: 150,
  speedIncrement: 50,
  speedDecrease: 10,
  maxSpeed: 50,
};

/**
 * Initialize game data
 */
export function initGame(config: GameConfig = DEFAULT_CONFIG): GameData {
  const centerX = Math.floor(config.gridWidth / 2);
  const centerY = Math.floor(config.gridHeight / 2);

  const snake: Snake = {
    body: [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY },
    ],
    direction: "RIGHT",
    nextDirection: "RIGHT",
  };

  return {
    snake,
    food: generateFood(snake.body, config),
    score: 0,
    gameState: GameState.IDLE,
    speed: config.initialSpeed,
    combo: 0,
    lastFoodTime: Date.now(),
  };
}

/**
 * Generate random food position (not on snake)
 */
export function generateFood(snakeBody: Position[], config: GameConfig): Position {
  const occupied = new Set(snakeBody.map((pos) => `${pos.x},${pos.y}`));

  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * config.gridWidth),
      y: Math.floor(Math.random() * config.gridHeight),
    };
  } while (occupied.has(`${food.x},${food.y}`));

  return food;
}

/**
 * Check if two positions are equal
 */
function posEquals(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Get next head position based on direction
 */
function getNextPosition(head: Position, direction: Direction): Position {
  switch (direction) {
    case "UP":
      return { x: head.x, y: head.y - 1 };
    case "DOWN":
      return { x: head.x, y: head.y + 1 };
    case "LEFT":
      return { x: head.x - 1, y: head.y };
    case "RIGHT":
      return { x: head.x + 1, y: head.y };
  }
}

/**
 * Check if position is out of bounds
 */
function isOutOfBounds(pos: Position, config: GameConfig): boolean {
  return pos.x < 0 || pos.x >= config.gridWidth || pos.y < 0 || pos.y >= config.gridHeight;
}

/**
 * Check if snake collides with itself
 */
function checkSelfCollision(head: Position, body: Position[]): boolean {
  // Check against body (excluding head which is at index 0)
  for (let i = 1; i < body.length; i++) {
    if (posEquals(head, body[i])) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate score bonus based on speed and combo
 */
function calculateScoreBonus(speed: number, combo: number, config: GameConfig): number {
  // Base score
  let score = 10;

  // Speed bonus (faster = more points)
  const speedFactor = 1 - (speed - config.maxSpeed) / (config.initialSpeed - config.maxSpeed);
  score += Math.floor(speedFactor * 5);

  // Combo bonus (3+ consecutive foods in 5 seconds)
  if (combo >= 3) {
    score = Math.floor(score * 1.5);
  }

  return score;
}

/**
 * Update game state (called every frame)
 */
export function updateGame(
  gameData: GameData,
  config: GameConfig = DEFAULT_CONFIG
): {
  gameData: GameData;
  events: {
    foodEaten?: boolean;
    gameOver?: boolean;
    speedIncrease?: boolean;
  };
} {
  if (gameData.gameState !== GameState.PLAYING) {
    return { gameData, events: {} };
  }

  const events: {
    foodEaten?: boolean;
    gameOver?: boolean;
    speedIncrease?: boolean;
  } = {};

  // Update direction (prevent 180-degree turn)
  const currentDirection = gameData.snake.direction;
  const nextDirection = gameData.snake.nextDirection;

  const canChangeDirection =
    (currentDirection === "UP" && nextDirection !== "DOWN") ||
    (currentDirection === "DOWN" && nextDirection !== "UP") ||
    (currentDirection === "LEFT" && nextDirection !== "RIGHT") ||
    (currentDirection === "RIGHT" && nextDirection !== "LEFT");

  const actualDirection = canChangeDirection ? nextDirection : currentDirection;

  // Move snake
  const head = gameData.snake.body[0];
  const newHead = getNextPosition(head, actualDirection);

  // Check collisions
  if (isOutOfBounds(newHead, config) || checkSelfCollision(newHead, gameData.snake.body)) {
    return {
      gameData: {
        ...gameData,
        gameState: GameState.GAME_OVER,
      },
      events: { ...events, gameOver: true },
    };
  }

  // Create new body with new head (immutable)
  const newBody = [newHead, ...gameData.snake.body];

  // Check if food eaten
  if (posEquals(newHead, gameData.food)) {
    const now = Date.now();
    const timeSinceLastFood = now - gameData.lastFoodTime;

    // Update combo (reset if more than 5 seconds)
    const newCombo = timeSinceLastFood < 5000 ? gameData.combo + 1 : 1;

    // Calculate score with bonuses
    const scoreGain = calculateScoreBonus(gameData.speed, newCombo, config);
    const newScore = gameData.score + scoreGain;

    // Generate new food
    const newFood = generateFood(newBody, config);

    // Speed up (every speedIncrement points)
    let newSpeed = gameData.speed;
    if (
      newScore > 0 &&
      newScore % config.speedIncrement === 0 &&
      gameData.speed > config.maxSpeed
    ) {
      newSpeed = Math.max(config.maxSpeed, gameData.speed - config.speedDecrease);
      events.speedIncrease = true;
    }

    events.foodEaten = true;

    return {
      gameData: {
        ...gameData,
        snake: {
          ...gameData.snake,
          body: newBody,
          direction: actualDirection,
        },
        food: newFood,
        score: newScore,
        speed: newSpeed,
        combo: newCombo,
        lastFoodTime: now,
      },
      events,
    };
  } else {
    // Remove tail (snake didn't grow) - immutable
    const bodyWithoutTail = newBody.slice(0, -1);

    return {
      gameData: {
        ...gameData,
        snake: {
          ...gameData.snake,
          body: bodyWithoutTail,
          direction: actualDirection,
        },
      },
      events,
    };
  }
}

/**
 * Change snake direction (immutable)
 */
export function changeDirection(gameData: GameData, newDirection: Direction): GameData {
  return {
    ...gameData,
    snake: {
      ...gameData.snake,
      nextDirection: newDirection,
    },
  };
}

/**
 * Start game (immutable)
 */
export function startGame(gameData: GameData): GameData {
  return {
    ...gameData,
    gameState: GameState.PLAYING,
    lastFoodTime: Date.now(),
  };
}

/**
 * Pause game (immutable)
 */
export function pauseGame(gameData: GameData): GameData {
  if (gameData.gameState === GameState.PLAYING) {
    return {
      ...gameData,
      gameState: GameState.PAUSED,
    };
  } else if (gameData.gameState === GameState.PAUSED) {
    return {
      ...gameData,
      gameState: GameState.PLAYING,
    };
  }
  return gameData;
}

/**
 * Reset game
 */
export function resetGame(config: GameConfig = DEFAULT_CONFIG): GameData {
  return initGame(config);
}

