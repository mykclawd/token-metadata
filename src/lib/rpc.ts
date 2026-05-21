import { createPublicClient, fallback, http, type Chain } from "viem";
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  bsc,
  avalanche,
  zora,
  linea,
  scroll,
} from "viem/chains";

export const SUPPORTED_CHAINS: { chain: Chain; label: string }[] = [
  { chain: base, label: "Base" },
  { chain: mainnet, label: "Ethereum" },
  { chain: arbitrum, label: "Arbitrum" },
  { chain: optimism, label: "Optimism" },
  { chain: polygon, label: "Polygon" },
  { chain: bsc, label: "BNB Chain" },
  { chain: avalanche, label: "Avalanche" },
  { chain: zora, label: "Zora" },
  { chain: linea, label: "Linea" },
  { chain: scroll, label: "Scroll" },
];

export const DEFAULT_CHAIN_ID = base.id;

export function getChainById(chainId: number): Chain {
  const match = SUPPORTED_CHAINS.find((c) => c.chain.id === chainId);
  return match?.chain ?? base;
}

const ANKR_SLUGS: Record<number, string> = {
  [mainnet.id]: "eth",
  [base.id]: "base",
  [arbitrum.id]: "arbitrum",
  [optimism.id]: "optimism",
  [polygon.id]: "polygon",
  [bsc.id]: "bsc",
  [avalanche.id]: "avalanche",
};

export function makePublicClient(chainId: number) {
  const chain = getChainById(chainId);
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

  const endpoints: string[] = [];

  if (clientId) endpoints.push(`https://${chainId}.rpc.thirdweb.com/${clientId}`);

  const ankrSlug = ANKR_SLUGS[chainId];
  if (ankrSlug) endpoints.push(`https://rpc.ankr.com/${ankrSlug}`);

  const rpcDefault = chain.rpcUrls.default.http[0];
  if (rpcDefault && !endpoints.includes(rpcDefault)) endpoints.push(rpcDefault);

  const transport = endpoints.length > 1
    ? fallback(endpoints.map((url) => http(url)))
    : http(endpoints[0] ?? rpcDefault);

  return createPublicClient({ chain, transport });
}
