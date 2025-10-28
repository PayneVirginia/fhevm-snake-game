"use client";

import { useState, useEffect } from "react";
import { Contract, JsonRpcSigner } from "ethers";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import type { GenericStringStorage } from "@/fhevm/GenericStringStorage";

interface LeaderboardEntry {
  rank: number;
  address: string;
  totalGames: number;
  isCurrentUser: boolean;
  myComparison?: "higher" | "lower" | "unknown";
}

interface LeaderboardProps {
  contract: Contract | undefined;
  currentAddress: string | undefined;
  fhevmInstance: FhevmInstance | undefined;
  signer: JsonRpcSigner | undefined;
}

// Use window.localStorage for signature storage
const signatureStorage: GenericStringStorage | null = (typeof window !== 'undefined') 
  ? window.localStorage 
  : null;

export function Leaderboard({ contract, currentAddress, fhevmInstance, signer }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "total">("single");
  const [hasCompared, setHasCompared] = useState(false);
  const [compareProgress, setCompareProgress] = useState({ current: 0, total: 0 });

  // Compare current user with other players
  const compareWithOthers = async (players: string[]) => {
    if (!fhevmInstance || !signer || !signatureStorage || !currentAddress || !contract) {
      return {};
    }

    const comparisons: Record<string, "higher" | "lower"> = {};
    const contractAddress = await contract.getAddress();

    try {
      // Get decryption signature
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [contractAddress as `0x${string}`],
        signer,
        signatureStorage
      );

      if (!sig) {
        console.error("Failed to create decryption signature");
        return comparisons;
      }

      // Compare with each player
      for (const player of players) {
        if (player.toLowerCase() === currentAddress.toLowerCase()) {
          continue;
        }

        try {
          // Send transaction to compare (this sets msg.sender correctly for authorization)
          const compareTx = activeTab === "single" 
            ? await contract.compareMaxScores(currentAddress, player)
            : await contract.compareTotalScores(currentAddress, player);
          
          // Wait for transaction to be mined
          await compareTx.wait();
          
          // Now get the result handle using staticCall
          const result = activeTab === "single"
            ? await contract.compareMaxScores.staticCall(currentAddress, player)
            : await contract.compareTotalScores.staticCall(currentAddress, player);
          
          // Decrypt the comparison result
          const decryptResult = await fhevmInstance.userDecrypt(
            [{ handle: result, contractAddress }],
            sig.privateKey,
            sig.publicKey,
            sig.signature,
            sig.contractAddresses,
            sig.userAddress,
            sig.startTimestamp,
            sig.durationDays
          );

          const amIHigher = decryptResult[result];
          comparisons[player.toLowerCase()] = amIHigher ? "higher" : "lower";
        } catch (error) {
          console.error(`Error comparing with ${player}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in compareWithOthers:", error);
    }

    return comparisons;
  };

  useEffect(() => {
    if (!contract) return;

    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const count = await contract.getActivePlayersCount();
        let players = await contract.getActivePlayers(
          0,
          Math.min(Number(count), 10)
        );

        // Convert to array if needed
        players = Array.isArray(players) ? players : [];

        if (players.length === 0) {
          setEntries([]);
          return;
        }

        // Load player stats (sorted by total games for now)
        const entriesData: LeaderboardEntry[] = [];
        for (let i = 0; i < players.length; i++) {
          const stats = await contract.playerStats(players[i]);
          entriesData.push({
            rank: i + 1,
            address: players[i],
            totalGames: Number(stats.totalGames),
            isCurrentUser: players[i].toLowerCase() === currentAddress?.toLowerCase(),
            myComparison: "unknown",
          });
        }

        // Sort by total games (descending)
        entriesData.sort((a, b) => b.totalGames - a.totalGames);
        entriesData.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setEntries(entriesData);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [contract, currentAddress, activeTab]);

  const handleCompare = async () => {
    if (!currentAddress || entries.length === 0 || !contract || !fhevmInstance || !signer || !signatureStorage) return;
    
    setComparing(true);
    setHasCompared(false);
    
    const otherPlayers = entries.filter(e => !e.isCurrentUser);
    setCompareProgress({ current: 0, total: otherPlayers.length });
    
    try {
      const comparisons: Record<string, "higher" | "lower"> = {};
      const contractAddress = await contract.getAddress();
      
      // Get decryption signature
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [contractAddress as `0x${string}`],
        signer,
        signatureStorage
      );

      if (!sig) {
        console.error("Failed to create decryption signature");
        return;
      }

      // OPTIMIZED: Batch compare with all players in ONE transaction
      const otherAddresses = otherPlayers.map(p => p.address);
      
      console.log(`🚀 Batch comparing with ${otherAddresses.length} players in ONE transaction...`);
      
      // Send batch comparison transaction
      const batchTx = activeTab === "single"
        ? await contract.batchCompareMaxScores(otherAddresses)
        : await contract.batchCompareTotalScores(otherAddresses);
      
      setCompareProgress({ current: 1, total: 1 });
      await batchTx.wait();
      
      console.log('✅ Batch comparison completed, now decrypting results...');
      
      // Now get all comparison results using staticCall and decrypt
      for (let i = 0; i < otherPlayers.length; i++) {
        const player = otherPlayers[i];
        
        try {
          // Get the result handle using staticCall
          const result = activeTab === "single"
            ? await contract.compareMaxScores.staticCall(currentAddress, player.address)
            : await contract.compareTotalScores.staticCall(currentAddress, player.address);
          
          // Decrypt the comparison result
          const decryptResult = await fhevmInstance.userDecrypt(
            [{ handle: result, contractAddress }],
            sig.privateKey,
            sig.publicKey,
            sig.signature,
            sig.contractAddresses,
            sig.userAddress,
            sig.startTimestamp,
            sig.durationDays
          );

          const amIHigher = decryptResult[result];
          comparisons[player.address.toLowerCase()] = amIHigher ? "higher" : "lower";
        } catch (error) {
          console.error(`Error decrypting comparison with ${player.address}:`, error);
        }
      }
      
      // Update entries with comparison results and sort
      const updatedEntries = entries.map(entry => ({
        ...entry,
        myComparison: entry.isCurrentUser 
          ? undefined 
          : (comparisons[entry.address.toLowerCase()] || "unknown")
      }));

      // Sort based on comparison results:
      // Assign priority scores:
      // - "lower" (they are higher) = 0 (first)
      // - current user = 1 (middle)
      // - "higher" (they are lower) = 2 (last)
      // - "unknown" = 3 (end)
      updatedEntries.sort((a, b) => {
        const getPriority = (entry: typeof updatedEntries[0]) => {
          if (entry.isCurrentUser) return 1;
          if (entry.myComparison === "lower") return 0; // They scored higher than me
          if (entry.myComparison === "higher") return 2; // They scored lower than me
          return 3; // Unknown
        };

        const aPriority = getPriority(a);
        const bPriority = getPriority(b);

        // Sort by priority first
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Same priority, sort by total games as tiebreaker
        return b.totalGames - a.totalGames;
      });

      // Update ranks
      updatedEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setEntries(updatedEntries);
      setHasCompared(true);
    } catch (error) {
      console.error("Failed to compare:", error);
    } finally {
      setComparing(false);
      setCompareProgress({ current: 0, total: 0 });
    }
  };

  const getBadge = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  const getComparisonIcon = (comparison?: "higher" | "lower" | "unknown") => {
    if (!comparison || comparison === "unknown") return null;
    return comparison === "higher" ? "📈" : "📉";
  };

  return (
    <div className="glass p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("single")}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
            activeTab === "single"
              ? "bg-primary text-white"
              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          }`}
        >
          Single Game
        </button>
        <button
          onClick={() => setActiveTab("total")}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
            activeTab === "total"
              ? "bg-primary text-white"
              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
          }`}
        >
          Total Score
        </button>
      </div>

      {/* Compare Button */}
      {currentAddress && entries.length > 1 && (
        <div className="mb-4 space-y-2">
          <button
            onClick={handleCompare}
            disabled={comparing}
            className="w-full py-2 px-4 bg-accent hover:bg-accent/80 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {comparing 
              ? `Comparing ${compareProgress.current}/${compareProgress.total}...` 
              : hasCompared 
                ? "Refresh Rankings 🔄" 
                : "Compare My Scores 🔍"
            }
          </button>
          {!hasCompared && (
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              ⚡ Optimized: Only 1 transaction to compare with all {entries.length - 1} players!
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          Loading leaderboard...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          No players yet. Be the first to play!
        </div>
      ) : (
        <>
          {/* Sorting Info */}
          {!hasCompared && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <span className="text-lg">ℹ️</span>
                <div>
                  <div className="font-semibold">Default Sorting</div>
                  <div className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                    Players are currently sorted by <strong>number of games played</strong>.
                    Click "Compare My Scores" below to rank by actual {activeTab === "single" ? "max score" : "total score"} using encrypted comparisons.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {entries.map((entry) => (
            <div
              key={entry.address}
              className={`p-3 rounded-lg flex items-center justify-between ${
                entry.isCurrentUser
                  ? "bg-primary/10 border border-primary"
                  : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl w-10 text-center">{getBadge(entry.rank)}</div>
                <div>
                  <div className="font-semibold text-sm">
                    {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {entry.totalGames} games played
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {entry.myComparison && entry.myComparison !== "unknown" && (
                  <span title={entry.myComparison === "higher" ? "You score higher" : "You score lower"}>
                    {getComparisonIcon(entry.myComparison)}
                  </span>
                )}
                <div className="text-xs text-slate-500">
                  🔒 Encrypted
                </div>
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      <div className="mt-4 text-xs text-slate-600 dark:text-slate-400 text-center">
        {currentAddress 
          ? hasCompared
            ? "Rankings based on encrypted comparisons. Refresh to update if new players joined."
            : "Click 'Compare My Scores' to rank players based on encrypted score comparisons."
          : "Connect wallet to compare your scores with others."
        }<br />
        <span className="text-primary font-semibold">All scores remain encrypted for privacy.</span>
        {hasCompared && (
          <>
            <br />
            📉 = Higher than you | 📈 = Lower than you
          </>
        )}
      </div>
    </div>
  );
}

