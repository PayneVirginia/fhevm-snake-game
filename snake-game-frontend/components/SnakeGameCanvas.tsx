"use client";

import { useEffect, useRef } from "react";
import { GameData, GameState, DEFAULT_CONFIG, type GameConfig } from "@/lib/gameEngine";
import { designTokens } from "@/design-tokens";

interface SnakeGameCanvasProps {
  gameData: GameData;
  config?: GameConfig;
}

export function SnakeGameCanvas({ gameData, config = DEFAULT_CONFIG }: SnakeGameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = designTokens.game.canvas.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = designTokens.game.canvas.gridColor;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= config.gridWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * config.cellSize, 0);
      ctx.lineTo(x * config.cellSize, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= config.gridHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * config.cellSize);
      ctx.lineTo(canvas.width, y * config.cellSize);
      ctx.stroke();
    }

    // Draw food with glow effect
    ctx.save();
    ctx.shadowColor = designTokens.game.food.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = designTokens.game.food.color;
    ctx.beginPath();
    ctx.arc(
      gameData.food.x * config.cellSize + config.cellSize / 2,
      gameData.food.y * config.cellSize + config.cellSize / 2,
      config.cellSize / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    // Draw snake
    gameData.snake.body.forEach((segment, index) => {
      const isHead = index === 0;
      const isDead = gameData.gameState === GameState.GAME_OVER;

      if (isDead) {
        ctx.fillStyle = designTokens.game.snake.deadColor;
      } else if (isHead) {
        ctx.fillStyle = designTokens.game.snake.headColor;
      } else {
        ctx.fillStyle = designTokens.game.snake.bodyColor;
      }

      // Draw rounded rectangle for snake segments
      const x = segment.x * config.cellSize + 1;
      const y = segment.y * config.cellSize + 1;
      const size = config.cellSize - 2;
      const radius = 4;

      ctx.beginPath();
      ctx.roundRect(x, y, size, size, radius);
      ctx.fill();

      // Draw eyes on head
      if (isHead && !isDead) {
        const eyeSize = 2;
        const eyeOffset = config.cellSize / 4;
        ctx.fillStyle = designTokens.colors.dark.background;

        // Determine eye positions based on direction
        let eye1X, eye1Y, eye2X, eye2Y;
        switch (gameData.snake.direction) {
          case "UP":
            eye1X = x + config.cellSize / 2 - eyeOffset;
            eye1Y = y + config.cellSize / 3;
            eye2X = x + config.cellSize / 2 + eyeOffset;
            eye2Y = y + config.cellSize / 3;
            break;
          case "DOWN":
            eye1X = x + config.cellSize / 2 - eyeOffset;
            eye1Y = y + (2 * config.cellSize) / 3;
            eye2X = x + config.cellSize / 2 + eyeOffset;
            eye2Y = y + (2 * config.cellSize) / 3;
            break;
          case "LEFT":
            eye1X = x + config.cellSize / 3;
            eye1Y = y + config.cellSize / 2 - eyeOffset;
            eye2X = x + config.cellSize / 3;
            eye2Y = y + config.cellSize / 2 + eyeOffset;
            break;
          case "RIGHT":
            eye1X = x + (2 * config.cellSize) / 3;
            eye1Y = y + config.cellSize / 2 - eyeOffset;
            eye2X = x + (2 * config.cellSize) / 3;
            eye2Y = y + config.cellSize / 2 + eyeOffset;
            break;
        }

        ctx.fillRect(eye1X, eye1Y, eyeSize, eyeSize);
        ctx.fillRect(eye2X, eye2Y, eyeSize, eyeSize);
      }
    });

    // Draw game over overlay
    if (gameData.gameState === GameState.GAME_OVER) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = designTokens.colors.light.error;
      ctx.font = "bold 24px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);

      ctx.fillStyle = designTokens.colors.light.text;
      ctx.font = "16px Inter, sans-serif";
      ctx.fillText(
        `Score: ${gameData.score}`,
        canvas.width / 2,
        canvas.height / 2 + 30
      );
    }

    // Draw paused overlay
    if (gameData.gameState === GameState.PAUSED) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = designTokens.colors.light.primary;
      ctx.font = "bold 24px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
    }
  }, [gameData, config]);

  const canvasWidth = config.gridWidth * config.cellSize;
  const canvasHeight = config.gridHeight * config.cellSize;

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border-2 border-slate-700 rounded-lg shadow-lg"
        style={{
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

