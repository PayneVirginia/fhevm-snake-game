"use client";

import { useMemo } from "react";
import { useMetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { BrowserProvider } from "ethers";

export function useSigner() {
  const { provider: rawProvider, accounts, chainId } = useMetaMaskProvider();
  
  // Convert Eip1193Provider to BrowserProvider
  // Use useMemo to prevent creating new BrowserProvider on every render
  const browserProvider = useMemo(() => {
    return rawProvider ? new BrowserProvider(rawProvider) : undefined;
  }, [rawProvider]);

  const { signer, isLoading, error } = useMetaMaskEthersSigner(
    browserProvider,
    accounts[0]
  );

  return { 
    signer, 
    browserProvider,
    account: accounts[0],
    chainId,
    isLoading, 
    error 
  };
}

