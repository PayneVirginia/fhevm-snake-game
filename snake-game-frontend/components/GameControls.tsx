"use client";

import { GameState } from "@/lib/gameEngine";
import { Direction } from "@/lib/gameEngine";

interface GameControlsProps {
  gameState: GameState;
  score: number;
  combo: number;
  duration: number;
  isSubmitting: boolean;
  isConnected: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSubmit: () => void;
  onDirectionChange: (direction: Direction) => void;
}

export function GameControls({
  gameState,
  score,
  combo,
  duration,
  isSubmitting,
  isConnected,
  onStart,
  onPause,
  onReset,
  onSubmit,
  onDirectionChange,
}: GameControlsProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="glass p-4 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{score}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Score</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary">{formatTime(duration)}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent">{combo}x</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">Combo</div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        {gameState === GameState.IDLE && (
          <button
            onClick={onStart}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Start Game
          </button>
        )}

        {gameState === GameState.PLAYING && (
          <button
            onClick={onPause}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Pause
          </button>
        )}

        {gameState === GameState.PAUSED && (
          <button
            onClick={onPause}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Resume
          </button>
        )}

        {gameState === GameState.GAME_OVER && (
          <>
            <button
              onClick={onReset}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Play Again
            </button>
            {isConnected && (
              <button
                onClick={onSubmit}
                disabled={isSubmitting || duration < 10}
                title={duration < 10 ? `Game too short (${duration}s). Play for at least 10 seconds.` : "Submit your score to the blockchain"}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : duration < 10 ? `${duration}s / 10s` : "Submit Score"}
              </button>
            )}
          </>
        )}

        {(gameState === GameState.PLAYING || gameState === GameState.PAUSED) && (
          <button
            onClick={onReset}
            className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="glass p-4 rounded-lg">
        <div className="text-sm text-center mb-2 text-slate-600 dark:text-slate-400">
          Mobile Controls
        </div>
        <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto">
          <div></div>
          <button
            onClick={() => onDirectionChange("UP")}
            disabled={gameState !== GameState.PLAYING}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white p-4 rounded-lg transition-colors disabled:opacity-50"
          >
            ↑
          </button>
          <div></div>
          <button
            onClick={() => onDirectionChange("LEFT")}
            disabled={gameState !== GameState.PLAYING}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white p-4 rounded-lg transition-colors disabled:opacity-50"
          >
            ←
          </button>
          <button
            onClick={() => onDirectionChange("DOWN")}
            disabled={gameState !== GameState.PLAYING}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white p-4 rounded-lg transition-colors disabled:opacity-50"
          >
            ↓
          </button>
          <button
            onClick={() => onDirectionChange("RIGHT")}
            disabled={gameState !== GameState.PLAYING}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white p-4 rounded-lg transition-colors disabled:opacity-50"
          >
            →
          </button>
        </div>
        <div className="text-xs text-center mt-2 text-slate-600 dark:text-slate-400">
          Or use Arrow Keys / WASD
        </div>
      </div>

      {/* Instructions */}
      <div className="glass p-3 rounded-lg text-xs text-slate-600 dark:text-slate-400">
        <div className="font-semibold mb-1">How to Play:</div>
        <ul className="space-y-1">
          <li>• Use arrow keys or WASD to move</li>
          <li>• Eat food to grow and score points</li>
          <li>• Speed increases every 50 points</li>
          <li>• Combo bonus for quick consecutive eating</li>
          <li>• Avoid walls and your own tail!</li>
          <li className="text-primary font-semibold">• Play for at least 10s to submit score</li>
        </ul>
      </div>
    </div>
  );
}

