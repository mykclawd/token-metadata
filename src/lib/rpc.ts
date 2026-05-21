import { createPublicClient, fallback, http } from "viem";
import { mainnet } from "viem/chains";

function makeRpcTransport() {
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
  const rpcUrl = process.env.RPC_URL;

  const endpoints: string[] = [];

  if (rpcUrl) endpoints.push(rpcUrl);
  if (clientId) endpoints.push(`https://1.rpc.thirdweb.com/${clientId}`);
  endpoints.push("https://rpc.ankr.com/eth");
  endpoints.push("https://cloudflare-eth.com");

  if (endpoints.length === 1) return http(endpoints[0]);
  return fallback(endpoints.map((url) => http(url)));
}

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: makeRpcTransport(),
});
