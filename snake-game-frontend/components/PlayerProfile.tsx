"use client";

import { useState, useEffect } from "react";
import { Contract, JsonRpcSigner } from "ethers";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import type { GenericStringStorage } from "@/fhevm/GenericStringStorage";

interface PlayerStats {
  totalGames: number;
  firstPlayTime: number;
  lastPlayTime: number;
}

interface PlayerProfileProps {
  contract: Contract | undefined;
  playerAddress: string | undefined;
  fhevmInstance: FhevmInstance | undefined;
  signer: JsonRpcSigner | undefined;
}

const signatureStorage: GenericStringStorage | null = (typeof window !== 'undefined') 
  ? window.localStorage 
  : null;

export function PlayerProfile({ contract, playerAddress, fhevmInstance, signer }: PlayerProfileProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [decryptedMaxScore, setDecryptedMaxScore] = useState<number | null>(null);
  const [decryptedTotalScore, setDecryptedTotalScore] = useState<number | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    if (!contract || !playerAddress) return;

    const loadStats = async () => {
      setLoading(true);
      try {
        const playerStats = await contract.playerStats(playerAddress);
        setStats({
          totalGames: Number(playerStats.totalGames),
          firstPlayTime: Number(playerStats.firstPlayTime),
          lastPlayTime: Number(playerStats.lastPlayTime),
        });
      } catch (error) {
        console.error("Failed to load player stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [contract, playerAddress]);

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return "Never";
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDecryptScores = async () => {
    if (!contract || !fhevmInstance || !signer || !playerAddress || !signatureStorage) {
      console.error("Missing dependencies for decryption");
      return;
    }

    setIsDecrypting(true);

    try {
      const contractAddress = await contract.getAddress();

      // Get encrypted handles
      const encryptedMaxScore = await contract.getPlayerMaxScore(playerAddress);
      const encryptedTotalScore = await contract.getPlayerTotalScore(playerAddress);

      // Get or create decryption signature
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [contractAddress as `0x${string}`],
        signer,
        signatureStorage
      );

      if (!sig) {
        throw new Error("Failed to create decryption signature");
      }

      // Decrypt max score
      if (encryptedMaxScore !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        const maxScoreResult = await fhevmInstance.userDecrypt(
          [{ handle: encryptedMaxScore, contractAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
        const decryptedMax = maxScoreResult[encryptedMaxScore];
        setDecryptedMaxScore(typeof decryptedMax === 'bigint' ? Number(decryptedMax) : parseInt(String(decryptedMax)));
      } else {
        setDecryptedMaxScore(0);
      }

      // Decrypt total score
      if (encryptedTotalScore !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        const totalScoreResult = await fhevmInstance.userDecrypt(
          [{ handle: encryptedTotalScore, contractAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
        const decryptedTotal = totalScoreResult[encryptedTotalScore];
        setDecryptedTotalScore(typeof decryptedTotal === 'bigint' ? Number(decryptedTotal) : parseInt(String(decryptedTotal)));
      } else {
        setDecryptedTotalScore(0);
      }

      console.log("✅ Scores decrypted successfully");
    } catch (error) {
      console.error("Failed to decrypt scores:", error);
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="glass p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Player Profile</h2>

      {!playerAddress ? (
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          Connect wallet to view profile
        </div>
      ) : loading ? (
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          Loading profile...
        </div>
      ) : (
        <div className="space-y-4">
          {/* Address */}
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
              Address
            </div>
            <div className="font-mono text-sm break-all">{playerAddress}</div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-primary">
                {stats?.totalGames || 0}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Total Games
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-secondary">
                {decryptedMaxScore !== null ? (
                  <span>{decryptedMaxScore}</span>
                ) : (
                  <span>🔒</span>
                )}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Max Score
              </div>
              {decryptedMaxScore === null && (
                <div className="text-xs text-slate-500 mt-1">
                  (Encrypted)
                </div>
              )}
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-accent">
                {decryptedTotalScore !== null ? (
                  <span>{decryptedTotalScore}</span>
                ) : (
                  <span>🔒</span>
                )}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Total Score
              </div>
              {decryptedTotalScore === null && (
                <div className="text-xs text-slate-500 mt-1">
                  (Encrypted)
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 p-4 rounded-lg text-center flex items-center justify-center">
              <button
                onClick={handleDecryptScores}
                disabled={isDecrypting || !fhevmInstance || !signer}
                className="bg-primary hover:bg-primary/90 disabled:bg-slate-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm disabled:cursor-not-allowed"
              >
                {isDecrypting ? "Decrypting..." : decryptedMaxScore !== null ? "Refresh 🔄" : "Decrypt Scores 🔓"}
              </button>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                First Game:
              </span>
              <span className="font-semibold">
                {formatDate(stats?.firstPlayTime || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Last Game:
              </span>
              <span className="font-semibold">
                {formatDate(stats?.lastPlayTime || 0)}
              </span>
            </div>
          </div>

          {/* Achievements Preview */}
          <div className="border-t border-slate-300 dark:border-slate-700 pt-4">
            <div className="text-sm font-semibold mb-2">Achievements</div>
            <div className="flex gap-2 flex-wrap">
              {stats && stats.totalGames >= 1 && (
                <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-xs">
                  🎮 First Game
                </div>
              )}
              {stats && stats.totalGames >= 10 && (
                <div className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full text-xs">
                  🔟 Play 10 Games
                </div>
              )}
              {stats && stats.totalGames < 1 && (
                <div className="text-xs text-slate-500 italic">
                  Play games to unlock achievements
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

