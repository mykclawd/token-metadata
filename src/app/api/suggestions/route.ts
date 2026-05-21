import { NextResponse } from "next/server";
import { makePublicClient } from "@/lib/rpc";
import { type Address } from "viem";

const BASE_CHAIN_ID = 8453;
const MAX_SUGGESTIONS = 12;

const SYMBOL_ABI = [
  { name: "symbol", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
] as const;

interface DexProfile {
  chainId: string;
  tokenAddress: string;
  icon?: string;
}

async function fetchSymbol(address: Address): Promise<string | null> {
  try {
    const client = makePublicClient(BASE_CHAIN_ID);
    const symbol = await client.readContract({ address, abi: SYMBOL_ABI, functionName: "symbol" });
    return symbol as string;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const res = await fetch("https://api.dexscreener.com/token-profiles/latest/v1", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] });

    const data: DexProfile[] = await res.json();
    const baseProfiles = data.filter((p) => p.chainId === "base").slice(0, MAX_SUGGESTIONS);

    const results = await Promise.all(
      baseProfiles.map(async (p) => {
        const symbol = await fetchSymbol(p.tokenAddress as Address);
        if (!symbol) return null;
        return {
          tokenAddress: p.tokenAddress,
          symbol,
          icon: p.icon ?? null,
        };
      })
    );

    return NextResponse.json({
      suggestions: results.filter(Boolean),
    });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
