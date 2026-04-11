"use client";

type AnchorPayload = {
  score: number;
  rating: string;
  risk: string;
  walletAddress: string;
  diagnosis?: {
    disease?: string;
    confidence?: string;
    source?: string;
  } | null;
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_SEPOLIA_HEX = "0x14a34";

export function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const candidate = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  return candidate ?? null;
}

export function getAgriScoreContractAddress() {
  return process.env.NEXT_PUBLIC_AGRISCORE_CONTRACT_ADDRESS?.trim() || "";
}

export function isBlockchainConfigured() {
  return Boolean(getAgriScoreContractAddress());
}

function encodeUint256(value: bigint) {
  return value.toString(16).padStart(64, "0");
}

function encodeBytes32(value: string) {
  return value.replace(/^0x/, "").padStart(64, "0");
}

// Fallback-friendly deterministic hash for payload integrity display.
export async function hashAgriScorePayload(payload: AnchorPayload) {
  const encoder = new TextEncoder();
  const input = JSON.stringify(payload, Object.keys(payload).sort());
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return `0x${Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

async function buildAnchorCallData(score: number, scoreHash: string) {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet found.");

  const signatureHex = `0x${Array.from(new TextEncoder().encode("anchorAgriScore(uint256,bytes32)"))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;

  const selector = ((await provider.request({
    method: "web3_sha3",
    params: [signatureHex],
  })) as string).replace(/^0x/, "").slice(0, 8);

  return `0x${selector}${encodeUint256(BigInt(score))}${encodeBytes32(scoreHash)}`;
}

export async function connectWallet() {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("No injected wallet found.");
  }

  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];

  return accounts[0] ?? null;
}

export async function ensureBaseSepolia() {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet found.");

  const currentChainId = (await provider.request({ method: "eth_chainId" })) as string;
  if (currentChainId?.toLowerCase() === BASE_SEPOLIA_HEX) return;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_HEX }],
    });
  } catch {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BASE_SEPOLIA_HEX,
          chainName: "Base Sepolia",
          nativeCurrency: {
            name: "Ethereum",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: [process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://sepolia.base.org"],
          blockExplorerUrls: ["https://sepolia.basescan.org"],
        },
      ],
    });
  }
}

export async function anchorAgriScoreOnChain(args: {
  walletAddress: string;
  score: number;
  scoreHash: string;
}) {
  const provider = getInjectedProvider();
  const contractAddress = getAgriScoreContractAddress();

  if (!provider) throw new Error("No injected wallet found.");
  if (!contractAddress) throw new Error("AgriScore contract address is not configured.");

  await ensureBaseSepolia();

  const data = await buildAnchorCallData(args.score, args.scoreHash);

  const txHash = (await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from: args.walletAddress,
        to: contractAddress,
        data,
      },
    ],
  })) as string;

  return txHash;
}

export async function waitForTransactionReceipt(txHash: string) {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet found.");

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const receipt = (await provider.request({
      method: "eth_getTransactionReceipt",
      params: [txHash],
    })) as Record<string, unknown> | null;

    if (receipt) return receipt;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error("Timed out waiting for transaction confirmation.");
}
