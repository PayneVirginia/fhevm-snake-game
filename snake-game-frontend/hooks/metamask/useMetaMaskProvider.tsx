"use client";

import { BrowserProvider, Eip1193Provider } from "ethers";
import { useEffect, useState } from "react";
import { checkEip6963, Eip6963ProviderDetail } from "./Eip6963Types";
import { useEip6963 } from "./useEip6963";

export interface MetaMaskProviderState {
  provider: Eip1193Provider | undefined;
  browserProvider: BrowserProvider | undefined;
  chainId: number | undefined;
  accounts: string[];
  isConnecting: boolean;
  isConnected: boolean;
  error: Error | undefined;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useMetaMaskProvider(): MetaMaskProviderState {
  const { providers } = useEip6963();
  const [provider, setProvider] = useState<Eip1193Provider | undefined>();
  const [browserProvider, setBrowserProvider] = useState<BrowserProvider | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  // Auto-detect provider
  useEffect(() => {
    if (providers.length > 0 && !provider) {
      // Prefer MetaMask
      const metamask = providers.find((p) =>
        p.info.name.toLowerCase().includes("metamask")
      );
      const selectedProvider = metamask || providers[0];
      setProvider(selectedProvider.provider);
      setBrowserProvider(new BrowserProvider(selectedProvider.provider));
    }
  }, [providers, provider]);

  // Listen to provider events
  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (newAccounts: unknown) => {
      if (Array.isArray(newAccounts)) {
        setAccounts(newAccounts);
        if (newAccounts.length === 0) {
          setIsConnected(false);
        }
      }
    };

    const handleChainChanged = (newChainId: unknown) => {
      if (typeof newChainId === "string") {
        setChainId(parseInt(newChainId, 16));
        // Reload page on chain change as recommended
        window.location.reload();
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setAccounts([]);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyProvider = provider as any;
    if (anyProvider.on) {
      anyProvider.on("accountsChanged", handleAccountsChanged);
      anyProvider.on("chainChanged", handleChainChanged);
      anyProvider.on("disconnect", handleDisconnect);

      return () => {
        if (anyProvider.removeListener) {
          anyProvider.removeListener("accountsChanged", handleAccountsChanged);
          anyProvider.removeListener("chainChanged", handleChainChanged);
          anyProvider.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, [provider]);

  // Auto-reconnect on page load
  useEffect(() => {
    if (!provider) return;

    const checkConnection = async () => {
      try {
        const existingAccounts = await provider.request({
          method: "eth_accounts",
        });
        if (Array.isArray(existingAccounts) && existingAccounts.length > 0) {
          setAccounts(existingAccounts);
          setIsConnected(true);
          const currentChainId = await checkEip6963(provider);
          setChainId(currentChainId);
        }
      } catch (err) {
        console.error("Failed to check existing connection:", err);
      }
    };

    checkConnection();
  }, [provider]);

  const connect = async () => {
    if (!provider) {
      setError(new Error("No wallet provider found"));
      return;
    }

    setIsConnecting(true);
    setError(undefined);

    try {
      const requestedAccounts = await provider.request({
        method: "eth_requestAccounts",
      });

      if (Array.isArray(requestedAccounts) && requestedAccounts.length > 0) {
        setAccounts(requestedAccounts);
        setIsConnected(true);
        const currentChainId = await checkEip6963(provider);
        setChainId(currentChainId);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccounts([]);
    setIsConnected(false);
    setChainId(undefined);
  };

  return {
    provider,
    browserProvider,
    chainId,
    accounts,
    isConnecting,
    isConnected,
    error,
    connect,
    disconnect,
  };
}

