"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  initGame,
  updateGame,
  changeDirection,
  startGame,
  pauseGame,
  resetGame,
  GameState,
  Direction,
  DEFAULT_CONFIG,
  type GameConfig,
  type GameData,
} from "@/lib/gameEngine";

export function useSnakeGame(config: GameConfig = DEFAULT_CONFIG) {
  const [gameData, setGameData] = useState<GameData>(() => initGame(config));
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [gameDuration, setGameDuration] = useState<number>(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Game loop
  useEffect(() => {
    if (gameData.gameState !== GameState.PLAYING) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    // Reset timer when game starts/resumes
    lastUpdateRef.current = Date.now();

    gameLoopRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;

      if (elapsed >= gameData.speed) {
        lastUpdateRef.current = now;
        setGameData((prevData) => {
          const { gameData: newData } = updateGame(prevData, config);
          return newData;
        });

        // Update duration
        if (gameStartTime > 0) {
          setGameDuration(Math.floor((now - gameStartTime) / 1000));
        }
      }
    }, 16); // ~60 FPS check

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameData.gameState, gameData.speed, config, gameStartTime]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameData.gameState !== GameState.PLAYING) {
        return;
      }

      let newDirection: Direction | null = null;

      switch (e.key.toLowerCase()) {
        case "arrowup":
        case "w":
          newDirection = "UP";
          e.preventDefault();
          break;
        case "arrowdown":
        case "s":
          newDirection = "DOWN";
          e.preventDefault();
          break;
        case "arrowleft":
        case "a":
          newDirection = "LEFT";
          e.preventDefault();
          break;
        case "arrowright":
        case "d":
          newDirection = "RIGHT";
          e.preventDefault();
          break;
        case " ":
        case "p":
          handlePause();
          e.preventDefault();
          break;
      }

      if (newDirection) {
        setGameData((prevData) => changeDirection(prevData, newDirection!));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameData.gameState]);

  const handleStart = useCallback(() => {
    setGameData((prevData) => {
      if (prevData.gameState === GameState.IDLE || prevData.gameState === GameState.GAME_OVER) {
        setGameStartTime(Date.now());
        setGameDuration(0);
      }
      return startGame(prevData);
    });
  }, []);

  const handlePause = useCallback(() => {
    setGameData((prevData) => pauseGame(prevData));
  }, []);

  const handleReset = useCallback(() => {
    setGameData(resetGame(config));
    setGameStartTime(0);
    setGameDuration(0);
  }, [config]);

  const handleDirectionChange = useCallback((direction: Direction) => {
    setGameData((prevData) => changeDirection(prevData, direction));
  }, []);

  return {
    gameData,
    gameDuration,
    handleStart,
    handlePause,
    handleReset,
    handleDirectionChange,
  };
}

