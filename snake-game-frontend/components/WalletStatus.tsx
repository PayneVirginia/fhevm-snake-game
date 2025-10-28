"use client";

import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";

export function WalletStatus() {
  const { accounts, chainId, isConnected, isConnecting, connect, disconnect } =
    useMetaMaskProvider();

  return (
    <div className="glass p-4 rounded-lg mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-semibold text-sm">
                  {accounts[0]?.slice(0, 6)}...{accounts[0]?.slice(-4)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Chain ID: {chainId}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Not Connected
              </span>
            </>
          )}
        </div>
        <button
          onClick={isConnected ? disconnect : connect}
          disabled={isConnecting}
          className="bg-primary hover:bg-primary/90 disabled:bg-slate-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
        >
          {isConnecting ? "Connecting..." : isConnected ? "Disconnect" : "Connect Wallet"}
        </button>
      </div>
    </div>
  );
}

