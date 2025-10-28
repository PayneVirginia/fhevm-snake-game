"use client";

import { useState } from "react";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useSigner } from "@/hooks/useSigner";
import { useSnakeGame } from "@/hooks/useSnakeGame";
import { useSnakeContract } from "@/hooks/useSnakeContract";
import { SnakeGameCanvas } from "@/components/SnakeGameCanvas";
import { GameControls } from "@/components/GameControls";
import { WalletStatus } from "@/components/WalletStatus";
import { Navigation } from "@/components/Navigation";
import { GameState } from "@/lib/gameEngine";

export default function GamePage() {
  const { accounts, isConnected } = useMetaMaskProvider();
  const { signer, browserProvider, account, chainId } = useSigner();
  const { contract, fhevmInstance, submitScore, isSubmitting } = useSnakeContract(
    browserProvider,
    signer,
    chainId,
    account
  );

  const {
    gameData,
    gameDuration,
    handleStart,
    handlePause,
    handleReset,
    handleDirectionChange,
  } = useSnakeGame();

  const [showScoreSubmitted, setShowScoreSubmitted] = useState(false);

  const handleSubmitScore = async () => {
    if (!isConnected || gameData.gameState !== GameState.GAME_OVER) {
      return;
    }

    // Validate game duration (must be at least 10 seconds)
    if (gameDuration < 10) {
      alert(`Game too short! Please play for at least 10 seconds.\nYour game lasted ${gameDuration} seconds.`);
      return;
    }

    try {
      await submitScore(gameData.score, gameDuration);
      setShowScoreSubmitted(true);
      setTimeout(() => setShowScoreSubmitted(false), 3000);
    } catch (error) {
      console.error("Failed to submit score:", error);
      alert("Failed to submit score. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-2">
            Play FHEVM Snake
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Play for at least 10 seconds to submit your score
          </p>
        </div>

        {/* Wallet Connection */}
        <WalletStatus />

        {/* Navigation */}
        <Navigation />

        {/* Game Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Canvas */}
          <div className="lg:col-span-2">
            <SnakeGameCanvas gameData={gameData} />
            
            {/* Success Message */}
            {showScoreSubmitted && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500 rounded-lg text-center">
                <p className="text-green-700 dark:text-green-400 font-semibold">
                  ✅ Score submitted successfully to the blockchain!
                </p>
              </div>
            )}
          </div>

          {/* Game Controls */}
          <div>
            <GameControls
              gameState={gameData.gameState}
              score={gameData.score}
              combo={gameData.combo}
              duration={gameDuration}
              isSubmitting={isSubmitting}
              isConnected={isConnected}
              onStart={handleStart}
              onPause={handlePause}
              onReset={handleReset}
              onSubmit={handleSubmitScore}
              onDirectionChange={handleDirectionChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

