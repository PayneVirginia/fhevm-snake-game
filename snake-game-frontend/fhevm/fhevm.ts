import { BrowserProvider, JsonRpcProvider } from "ethers";
import type { CreateFhevmInstanceParams, FhevmInstance } from "./fhevmTypes";
import { isFhevmWindowType, RelayerSDKLoader } from "./loader";

export class FhevmError extends Error {
  code: string;
  constructor(code: string, message?: string) {
    super(message);
    this.code = code;
    this.name = "FhevmError";
  }
}

// Check if Relayer SDK is loaded and initialized
const isFhevmInitialized = (): boolean => {
  if (!isFhevmWindowType(window)) {
    return false;
  }
  return window.relayerSDK.__initialized__ === true;
};

// Load Relayer SDK from CDN
export const loadRelayerSDK = async (): Promise<void> => {
  const loader = new RelayerSDKLoader({ trace: console.log });
  return loader.load();
};

// Initialize Relayer SDK
export const initRelayerSDK = async (): Promise<boolean> => {
  if (!isFhevmWindowType(window)) {
    throw new Error("window.relayerSDK is not available");
  }
  const result = await window.relayerSDK.initSDK();
  window.relayerSDK.__initialized__ = result;
  if (!result) {
    throw new Error("window.relayerSDK.initSDK failed.");
  }
  return true;
};

/**
 * Create FHEVM instance
 * - For chainId 31337 (localhost): use Mock utils
 * - For other chains: use Relayer SDK
 */
export async function createFhevmInstance(
  params: CreateFhevmInstanceParams
): Promise<FhevmInstance> {
  const { chainId, provider } = params;

  console.log(`[FHEVM] Creating instance for chainId ${chainId}`);

  // Local development (Mock)
  if (chainId === 31337) {
    console.log("[FHEVM] Using Mock mode for localhost");
    return await createMockInstance(provider);
  }

  // Sepolia or other networks (Relayer)
  console.log("[FHEVM] Using Relayer SDK mode");
  return await createRelayerInstance(chainId);
}

/**
 * Create Mock instance for local development
 */
async function createMockInstance(
  provider: BrowserProvider
): Promise<FhevmInstance> {
  try {
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    if (chainId !== 31337) {
      throw new FhevmError(
        "INVALID_CHAINID",
        `Mock instance requires chainId 31337, got ${chainId}`
      );
    }

    // Check if we have relayer metadata (required for Mock)
    const metadata = await tryFetchRelayerMetadata("http://127.0.0.1:8545");
    if (!metadata) {
      throw new FhevmError(
        "NO_METADATA",
        "Failed to fetch FHEVM relayer metadata. Make sure Hardhat node is running with FHEVM."
      );
    }

    console.log("[FHEVM] Fetched metadata successfully:", metadata);

    //////////////////////////////////////////////////////////////////////////
    // WARNING!!
    // ALWAYS USE DYNAMIC IMPORT TO AVOID INCLUDING THE ENTIRE FHEVM MOCK LIB 
    // IN THE FINAL PRODUCTION BUNDLE!!
    //////////////////////////////////////////////////////////////////////////
    const fhevmMock = await import("./mock/fhevmMock");

    console.log("[FHEVM] Creating mock instance with metadata");

    const instance = await fhevmMock.fhevmMockCreateInstance({
      rpcUrl: "http://127.0.0.1:8545",
      chainId,
      metadata,
    });

    console.log("[FHEVM] Mock instance created successfully");
    return instance;
  } catch (error) {
    console.error("[FHEVM] Failed to create mock instance:", error);
    throw new FhevmError(
      "MOCK_CREATION_FAILED",
      `Failed to create mock FHEVM instance: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Create Relayer instance for Sepolia or mainnet
 */
async function createRelayerInstance(chainId: number): Promise<FhevmInstance> {
  try {
    // Load Relayer SDK if not loaded
    if (!isFhevmWindowType(window)) {
      console.log("[FHEVM] Loading Relayer SDK...");
      await loadRelayerSDK();
    }

    // Initialize SDK if not initialized
    if (!isFhevmInitialized()) {
      console.log("[FHEVM] Initializing Relayer SDK...");
      await initRelayerSDK();
    }

    const { relayerSDK } = window;

    // Use SepoliaConfig for Sepolia network
    if (chainId === 11155111) {
      console.log("[FHEVM] Creating Sepolia instance");
      const instance = await relayerSDK.createInstance(relayerSDK.SepoliaConfig);
      return instance;
    }

    throw new FhevmError(
      "UNSUPPORTED_CHAIN",
      `ChainId ${chainId} is not supported. Supported chains: 31337 (localhost), 11155111 (Sepolia)`
    );
  } catch (error) {
    console.error("[FHEVM] Failed to create relayer instance:", error);
    throw new FhevmError(
      "RELAYER_CREATION_FAILED",
      `Failed to create relayer FHEVM instance: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Try to fetch FHEVM relayer metadata from Hardhat node
 */
async function tryFetchRelayerMetadata(
  rpcUrl: string = "http://127.0.0.1:8545"
): Promise<{
  ACLAddress: `0x${string}`;
  InputVerifierAddress: `0x${string}`;
  KMSVerifierAddress: `0x${string}`;
} | null> {
  let rpc: JsonRpcProvider | null = null;
  try {
    // Create a new JsonRpcProvider
    rpc = new JsonRpcProvider(rpcUrl);

    // Check if it's a Hardhat node
    const version = await rpc.send("web3_clientVersion", []);
    if (!version || typeof version !== "string" || !version.toLowerCase().includes("hardhat")) {
      console.log("[FHEVM] Not a Hardhat node, version:", version);
      return null;
    }

    // Fetch FHEVM metadata
    const metadata = await rpc.send("fhevm_relayer_metadata", []);
    
    if (!metadata || typeof metadata !== "object") {
      console.log("[FHEVM] Invalid metadata response:", metadata);
      return null;
    }

    const typedMetadata = metadata as Record<string, unknown>;

    // Validate metadata fields
    if (
      !(
        "ACLAddress" in typedMetadata &&
        typeof typedMetadata.ACLAddress === "string" &&
        typedMetadata.ACLAddress.startsWith("0x")
      )
    ) {
      console.log("[FHEVM] Invalid ACLAddress");
      return null;
    }

    if (
      !(
        "InputVerifierAddress" in typedMetadata &&
        typeof typedMetadata.InputVerifierAddress === "string" &&
        typedMetadata.InputVerifierAddress.startsWith("0x")
      )
    ) {
      console.log("[FHEVM] Invalid InputVerifierAddress");
      return null;
    }

    if (
      !(
        "KMSVerifierAddress" in typedMetadata &&
        typeof typedMetadata.KMSVerifierAddress === "string" &&
        typedMetadata.KMSVerifierAddress.startsWith("0x")
      )
    ) {
      console.log("[FHEVM] Invalid KMSVerifierAddress");
      return null;
    }

    return {
      ACLAddress: typedMetadata.ACLAddress as `0x${string}`,
      InputVerifierAddress: typedMetadata.InputVerifierAddress as `0x${string}`,
      KMSVerifierAddress: typedMetadata.KMSVerifierAddress as `0x${string}`,
    };
  } catch (error) {
    console.warn("[FHEVM] Failed to fetch relayer metadata:", error);
    return null;
  } finally {
    if (rpc) {
      rpc.destroy();
    }
  }
}

/**
 * Utility to check if a chainId is supported
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId === 31337 || chainId === 11155111;
}

