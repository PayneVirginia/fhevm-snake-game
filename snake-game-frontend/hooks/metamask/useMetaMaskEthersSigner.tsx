"use client";

import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useEffect, useState } from "react";

export function useMetaMaskEthersSigner(
  browserProvider: BrowserProvider | undefined,
  account: string | undefined
): {
  signer: JsonRpcSigner | undefined;
  isLoading: boolean;
  error: Error | undefined;
} {
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    if (!browserProvider || !account) {
      setSigner(undefined);
      return;
    }

    const getSigner = async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        const ethSigner = await browserProvider.getSigner(account);
        setSigner(ethSigner);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setSigner(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    getSigner();
  }, [browserProvider, account]);

  return { signer, isLoading, error };
}

