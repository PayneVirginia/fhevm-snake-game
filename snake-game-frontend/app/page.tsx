"use client";

import Link from "next/link";
import { WalletStatus } from "@/components/WalletStatus";
import { Navigation } from "@/components/Navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-2">
            FHEVM Snake Game
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Privacy-Preserving Gaming on the Blockchain
          </p>
        </div>

        {/* Wallet Connection */}
        <WalletStatus />

        {/* Navigation */}
        <Navigation />

        {/* Welcome Content */}
        <div className="glass p-8 rounded-lg mb-6">
          <h2 className="text-3xl font-bold mb-6 text-center">
            Welcome to FHEVM Snake! 🐍
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Game Features */}
            <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 p-6 rounded-lg border border-teal-200 dark:border-teal-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🎮</span> Game Features
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Classic snake gameplay with modern graphics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Speed increases as you score more points</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Combo system for consecutive eating</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Responsive controls (keyboard & touch)</span>
                </li>
              </ul>
            </div>

            {/* Privacy Features */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>🔐</span> Privacy Features
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>All scores are encrypted on-chain using FHEVM</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Only you can decrypt your own scores</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Rankings based on encrypted comparisons</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">✓</span>
                  <span>Fair competition without revealing scores</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg border-2 border-primary/20">
            <h3 className="text-xl font-bold mb-4 text-center">
              🚀 Quick Start Guide
            </h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-3xl mb-2">1️⃣</div>
                <div className="font-semibold mb-1">Connect Wallet</div>
                <div className="text-slate-600 dark:text-slate-400">
                  Click "Connect Wallet" above
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">2️⃣</div>
                <div className="font-semibold mb-1">Play Game</div>
                <div className="text-slate-600 dark:text-slate-400">
                  Navigate to "Play Game" page
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">3️⃣</div>
                <div className="font-semibold mb-1">Submit Score</div>
                <div className="text-slate-600 dark:text-slate-400">
                  Play for 10+ seconds and submit
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">4️⃣</div>
                <div className="font-semibold mb-1">Check Rankings</div>
                <div className="text-slate-600 dark:text-slate-400">
                  Compare with other players
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-8">
            <Link
              href="/game"
              className="inline-block bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold py-4 px-8 rounded-lg text-lg shadow-lg transition-all transform hover:scale-105"
            >
              Start Playing Now! 🎮
            </Link>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="glass p-6 rounded-lg text-center">
          <h3 className="font-semibold mb-3">Powered By</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div>🔐 FHEVM (Zama)</div>
            <div>⚡ Next.js 15</div>
            <div>💎 Ethereum</div>
            <div>🎨 Tailwind CSS</div>
            <div>🦊 MetaMask</div>
          </div>
        </div>
      </div>
    </div>
  );
}
