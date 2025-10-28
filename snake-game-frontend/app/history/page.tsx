"use client";

import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useSigner } from "@/hooks/useSigner";
import { useSnakeContract } from "@/hooks/useSnakeContract";
import { GameHistory } from "@/components/GameHistory";
import { WalletStatus } from "@/components/WalletStatus";
import { Navigation } from "@/components/Navigation";

export default function HistoryPage() {
  const { accounts, isConnected } = useMetaMaskProvider();
  const { signer, browserProvider, account, chainId } = useSigner();
  const { contract, fhevmInstance } = useSnakeContract(
    browserProvider,
    signer,
    chainId,
    account
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-2">
            My Game History 📊
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            View and decrypt your past game scores
          </p>
        </div>

        {/* Wallet Connection */}
        <WalletStatus />

        {/* Navigation */}
        <Navigation />

        {/* Content */}
        {!isConnected ? (
          <div className="glass p-8 rounded-lg text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Please connect your wallet to view your game history
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <GameHistory
              contract={contract}
              fhevmInstance={fhevmInstance}
              playerAddress={accounts[0]}
              signer={signer}
            />
          </div>
        )}
      </div>
    </div>
  );
}

