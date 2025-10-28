import type { FhevmRelayerSDKType } from './fhevm/fhevmTypes';

declare global {
  interface Window {
    relayerSDK: FhevmRelayerSDKType;
  }
}

export {};

