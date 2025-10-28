export const SDK_CDN_URL =
  "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

export const SUPPORTED_CHAIN_IDS = [31337, 11155111] as const; // localhost, Sepolia

export const CHAIN_NAMES: Record<number, string> = {
  31337: "Hardhat",
  11155111: "Sepolia",
};

