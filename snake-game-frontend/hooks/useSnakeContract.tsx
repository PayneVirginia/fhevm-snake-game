"use client";

import { useState, useEffect, useCallback } from "react";
import { Contract, JsonRpcSigner } from "ethers";
import { SnakeGameABI } from "@/abi/SnakeGameABI";
import { SnakeGameAddresses } from "@/abi/SnakeGameAddresses";
import { createFhevmInstance } from "@/fhevm/fhevm";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import type { BrowserProvider } from "ethers";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import type { GenericStringStorage } from "@/fhevm/GenericStringStorage";

export interface UseSnakeContractReturn {
  contract: Contract | undefined;
  fhevmInstance: FhevmInstance | undefined;
  isInitializing: boolean;
  error: Error | undefined;
  // Actions
  submitScore: (score: number, duration: number) => Promise<void>;
  decryptMaxScore: (playerAddress: string) => Promise<number | undefined>;
  decryptTotalScore: (playerAddress: string) => Promise<number | undefined>;
  getPlayerStats: (playerAddress: string) => Promise<{
    totalGames: bigint;
    firstPlayTime: bigint;
    lastPlayTime: bigint;
  } | undefined>;
  // State
  isSubmitting: boolean;
  isDecrypting: boolean;
}

// Create a simple localStorage-based storage for signatures
// window.localStorage already implements the GenericStringStorage interface
const signatureStorage: GenericStringStorage | null = (typeof window !== 'undefined') 
  ? window.localStorage 
  : null;

export function useSnakeContract(
  browserProvider: BrowserProvider | undefined,
  signer: JsonRpcSigner | undefined,
  chainId: number | undefined,
  account: string | undefined
): UseSnakeContractReturn {
  const [contract, setContract] = useState<Contract | undefined>();
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | undefined>();
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Initialize contract and FHEVM instance
  useEffect(() => {
    if (!browserProvider || !signer || !chainId || !account) {
      setContract(undefined);
      setFhevmInstance(undefined);
      return;
    }

    // Prevent duplicate initialization
    let isCancelled = false;

    const init = async () => {
      if (isCancelled) return;
      
      setIsInitializing(true);
      setError(undefined);

      try {
        // Get contract address for current chain
        const addressData = SnakeGameAddresses[chainId.toString() as keyof typeof SnakeGameAddresses];
        
        if (!addressData) {
          throw new Error(`SnakeGame contract not deployed on chain ${chainId}`);
        }

        // Create contract instance
        const contractInstance = new Contract(
          addressData.address,
          SnakeGameABI.abi,
          signer
        );

        if (isCancelled) return;
        setContract(contractInstance);

        // Create FHEVM instance
        const fhevm = await createFhevmInstance({
          chainId,
          provider: browserProvider,
        });

        if (isCancelled) return;
        setFhevmInstance(fhevm);
      } catch (err) {
        if (isCancelled) return;
        console.error("Failed to initialize contract:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    };

    init();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isCancelled = true;
    };
  }, [browserProvider, signer, chainId, account]);

  // Submit encrypted score
  const submitScore = useCallback(
    async (score: number, duration: number) => {
      if (!contract || !fhevmInstance || !account) {
        throw new Error("Contract not initialized");
      }

      setIsSubmitting(true);
      setError(undefined);

      try {
        // Create encrypted input
        const contractAddress = await contract.getAddress();
        const encryptedInput = fhevmInstance.createEncryptedInput(
          contractAddress,
          account
        );
        
        encryptedInput.add32(score);
        const encrypted = await encryptedInput.encrypt();

        // Submit to contract
        const tx = await contract.submitScore(
          encrypted.handles[0],
          encrypted.inputProof,
          duration
        );

        await tx.wait();
        console.log(`Score submitted: ${score} (duration: ${duration}s)`);
      } catch (err) {
        console.error("Failed to submit score:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [contract, fhevmInstance, account]
  );

  // Decrypt player's max score
  const decryptMaxScore = useCallback(
    async (playerAddress: string): Promise<number | undefined> => {
      if (!contract || !fhevmInstance || !account || !signer || !signatureStorage) {
        console.error("Contract not initialized");
        return undefined;
      }

      setIsDecrypting(true);
      setError(undefined);

      try {
        const encryptedMaxScore = await contract.getPlayerMaxScore(playerAddress);
        
        if (encryptedMaxScore === "0x0000000000000000000000000000000000000000000000000000000000000000") {
          return 0;
        }

        const contractAddress = await contract.getAddress();
        
        // Get or create decryption signature
        const sig = await FhevmDecryptionSignature.loadOrSign(
          fhevmInstance,
          [contractAddress as `0x${string}`],
          signer,
          signatureStorage  // TypeScript now knows it's not null
        );

        if (!sig) {
          throw new Error("Failed to create decryption signature");
        }

        // Decrypt using userDecrypt
        const result = await fhevmInstance.userDecrypt(
          [{ handle: encryptedMaxScore, contractAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        const decryptedValue = result[encryptedMaxScore];
        return typeof decryptedValue === 'bigint' ? Number(decryptedValue) : parseInt(String(decryptedValue));
      } catch (err) {
        console.error("Failed to decrypt max score:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return undefined;
      } finally {
        setIsDecrypting(false);
      }
    },
    [contract, fhevmInstance, account, signer]
  );

  // Decrypt player's total score
  const decryptTotalScore = useCallback(
    async (playerAddress: string): Promise<number | undefined> => {
      if (!contract || !fhevmInstance || !account || !signer || !signatureStorage) {
        console.error("Contract not initialized");
        return undefined;
      }

      setIsDecrypting(true);
      setError(undefined);

      try {
        const encryptedTotalScore = await contract.getPlayerTotalScore(playerAddress);
        
        if (encryptedTotalScore === "0x0000000000000000000000000000000000000000000000000000000000000000") {
          return 0;
        }

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
          [{ handle: encryptedTotalScore, contractAddress }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        const decryptedValue = result[encryptedTotalScore];
        return typeof decryptedValue === 'bigint' ? Number(decryptedValue) : parseInt(String(decryptedValue));
      } catch (err) {
        console.error("Failed to decrypt total score:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return undefined;
      } finally {
        setIsDecrypting(false);
      }
    },
    [contract, fhevmInstance, account, signer]
  );

  // Get player statistics
  const getPlayerStats = useCallback(
    async (playerAddress: string) => {
      if (!contract) {
        return undefined;
      }

      try {
        const stats = await contract.playerStats(playerAddress);
        return {
          totalGames: stats.totalGames,
          firstPlayTime: stats.firstPlayTime,
          lastPlayTime: stats.lastPlayTime,
        };
      } catch (err) {
        console.error("Failed to get player stats:", err);
        return undefined;
      }
    },
    [contract]
  );

  return {
    contract,
    fhevmInstance,
    isInitializing,
    error,
    submitScore,
    decryptMaxScore,
    decryptTotalScore,
    getPlayerStats,
    isSubmitting,
    isDecrypting,
  };
}

