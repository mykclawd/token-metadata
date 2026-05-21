import { type Address } from "viem";
import { makePublicClient } from "./rpc";

const ERC20_ABI = [
  { name: "name", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { name: "symbol", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { name: "decimals", type: "function", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { name: "totalSupply", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export interface ERC20Metadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export async function hasBytecode(address: Address, chainId: number): Promise<boolean> {
  const client = makePublicClient(chainId);
  const code = await client.getBytecode({ address });
  return !!code && code !== "0x" && code.length > 2;
}

export async function isERC20Contract(address: Address, chainId: number): Promise<boolean> {
  const client = makePublicClient(chainId);
  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      client.readContract({ address, abi: ERC20_ABI, functionName: "name" }),
      client.readContract({ address, abi: ERC20_ABI, functionName: "symbol" }),
      client.readContract({ address, abi: ERC20_ABI, functionName: "decimals" }),
      client.readContract({ address, abi: ERC20_ABI, functionName: "totalSupply" }),
    ]);
    return !!(name && symbol && decimals !== undefined && totalSupply !== undefined);
  } catch {
    return false;
  }
}

export async function getERC20Metadata(address: Address, chainId: number): Promise<ERC20Metadata> {
  const client = makePublicClient(chainId);
  const [name, symbol, decimals, totalSupply] = await Promise.all([
    client.readContract({ address, abi: ERC20_ABI, functionName: "name" }),
    client.readContract({ address, abi: ERC20_ABI, functionName: "symbol" }),
    client.readContract({ address, abi: ERC20_ABI, functionName: "decimals" }),
    client.readContract({ address, abi: ERC20_ABI, functionName: "totalSupply" }),
  ]);

  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = totalSupply / divisor;
  const frac = totalSupply % divisor;
  const totalSupplyFormatted = frac === 0n
    ? whole.toLocaleString()
    : `${whole.toLocaleString()}.${frac.toString().padStart(Number(decimals), "0").replace(/0+$/, "")}`;

  return {
    name: name as string,
    symbol: symbol as string,
    decimals: Number(decimals),
    totalSupply: totalSupplyFormatted,
  };
}
