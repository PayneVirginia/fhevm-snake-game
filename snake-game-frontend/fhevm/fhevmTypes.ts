import type { BrowserProvider } from "ethers";

export type FhevmInstance = {
  reencrypt: (
    handle: bigint,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddress: string,
    account: string
  ) => Promise<string>;
  createEncryptedInput: (
    contractAddress: string,
    callerAddress: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any;
  getPublicKey: (chainId: number) => Promise<string>;
  userDecrypt: (
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: `0x${string}`[],
    userAddress: `0x${string}`,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<string, string | bigint | boolean>>;
  createEIP712: (
    publicKey: string,
    contractAddresses: `0x${string}`[],
    startTimestamp: number,
    durationDays: number
  ) => EIP712Type;
  generateKeypair: () => { publicKey: string; privateKey: string };
};

export type FhevmInstanceConfig = {
  chainId: number;
  publicKeyVerifier: string;
  kmsVerifier: string;
  executorAddress: string;
  aclAddress: string;
  network: {
    url: string;
    chainId: number;
  };
};

export type FhevmInitSDKOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tfheParams?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  kmsParams?: any;
  thread?: number;
};

export type FhevmCreateInstanceType = () => Promise<FhevmInstance>;
export type FhevmInitSDKType = (
  options?: FhevmInitSDKOptions
) => Promise<boolean>;
export type FhevmLoadSDKType = () => Promise<void>;
export type IsFhevmSupportedType = (chainId: number) => boolean;

export type FhevmRelayerSDKType = {
  initSDK: FhevmInitSDKType;
  createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
  SepoliaConfig: FhevmInstanceConfig;
  __initialized__?: boolean;
};

export type FhevmWindowType = {
  relayerSDK: FhevmRelayerSDKType;
};

export type CreateFhevmInstanceParams = {
  chainId: number;
  provider: BrowserProvider;
};

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number; // Unix timestamp in seconds
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};

export type EIP712Type = {
  domain: {
    chainId: number;
    name: string;
    verifyingContract: `0x${string}`;
    version: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any;
  primaryType: string;
  types: {
    [key: string]: {
      name: string;
      type: string;
    }[];
  };
};

