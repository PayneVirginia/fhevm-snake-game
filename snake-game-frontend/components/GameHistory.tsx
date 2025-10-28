"use client";

import { useState, useEffect } from "react";
import { Contract, JsonRpcSigner } from "ethers";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import type { GenericStringStorage } from "@/fhevm/GenericStringStorage";

interface GameRecord {
  gameId: number;
  timestamp: number;
  duration: number;
  encryptedScore: string;
  decryptedScore?: number;
}

interface GameHistoryProps {
  contract: Contract | undefined;
  fhevmInstance: FhevmInstance | undefined;
  playerAddress: string | undefined;
  signer: JsonRpcSigner | undefined;
}

// Use window.localStorage for signature storage
const signatureStorage: GenericStringStorage | null = (typeof window !== 'undefined') 
  ? window.localStorage 
  : null;

export function GameHistory({ contract, fhevmInstance, playerAddress, signer }: GameHistoryProps) {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [decryptingId, setDecryptingId] = useState<number | null>(null);

  useEffect(() => {
    if (!contract || !playerAddress) return;

    const loadHistory = async () => {
      setLoading(true);
      try {
        const count = await contract.getPlayerRecordCount(playerAddress);
        const recordCount = Math.min(Number(count), 10); // Last 10 games

        const gameRecords: GameRecord[] = [];
        for (let i = 0; i < recordCount; i++) {
          const record = await contract.getGameRecord(playerAddress, i);
          gameRecords.push({
            gameId: Number(record.gameId),
            timestamp: Number(record.timestamp),
            duration: Number(record.duration),
            encryptedScore: record.score,
          });
        }

        // Reverse to show most recent first
        setRecords(gameRecords.reverse());
      } catch (error) {
        console.error("Failed to load game history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [contract, playerAddress]);

  const handleDecrypt = async (record: GameRecord) => {
    if (!fhevmInstance || !contract || !playerAddress || !signer || !signatureStorage) return;

    setDecryptingId(record.gameId);
    try {
      const contractAddress = await contract.getAddress();
      
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

      // Decrypt using userDecrypt
      const result = await fhevmInstance.userDecrypt(
        [{ handle: record.encryptedScore, contractAddress }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      const decryptedValue = result[record.encryptedScore];
      const score = typeof decryptedValue === 'bigint' ? Number(decryptedValue) : parseInt(String(decryptedValue));
      
      setRecords((prev) =>
        prev.map((r) =>
          r.gameId === record.gameId ? { ...r, decryptedScore: score } : r
        )
      );
    } catch (error) {
      console.error("Failed to decrypt score:", error);
    } finally {
      setDecryptingId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Game History</h2>

      {loading ? (
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          Loading history...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-slate-600 dark:text-slate-400">
          No game history yet. Start playing to create records!
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.gameId}
              className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-sm">
                    Game #{record.gameId}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {formatDate(record.timestamp)}
                  </div>
                </div>
                <div className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                  ⏱ {formatDuration(record.duration)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Score: </span>
                  {record.decryptedScore !== undefined ? (
                    <span className="font-bold text-primary">
                      {record.decryptedScore}
                    </span>
                  ) : (
                    <span className="text-slate-500">🔒 Encrypted</span>
                  )}
                </div>

                {record.decryptedScore === undefined && (
                  <button
                    onClick={() => handleDecrypt(record)}
                    disabled={decryptingId === record.gameId}
                    className="text-xs bg-primary hover:bg-primary/90 disabled:bg-slate-400 text-white px-3 py-1 rounded transition-colors"
                  >
                    {decryptingId === record.gameId ? "..." : "Decrypt"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

