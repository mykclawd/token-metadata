import { type Address, type Abi } from "viem";
import { fetchJsonOrText, resolveIpfsUri, safeJsonParse } from "./utils";
import { makePublicClient } from "./rpc";

type ProbeStatus = "success" | "reverted" | "unavailable" | "error";

export interface ProbeResult {
  fn: string;
  status: ProbeStatus;
  raw?: string;
  parsed?: unknown;
  error?: string;
}

const PROBE_FUNCTIONS: { name: string; abi: Abi }[] = [
  {
    name: "tokenURI",
    abi: [{ name: "tokenURI", type: "function", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }], stateMutability: "view" }],
  },
  {
    name: "contractURI",
    abi: [{ name: "contractURI", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
  },
  {
    name: "uri",
    abi: [{ name: "uri", type: "function", inputs: [{ name: "id", type: "uint256" }], outputs: [{ type: "string" }], stateMutability: "view" }],
  },
  {
    name: "metadata",
    abi: [{ name: "metadata", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
  },
  {
    name: "image",
    abi: [{ name: "image", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
  },
  {
    name: "imageURI",
    abi: [{ name: "imageURI", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
  },
  {
    name: "imageURL",
    abi: [{ name: "imageURL", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
  },
  {
    name: "allData",
    abi: [{ name: "allData", type: "function", inputs: [], outputs: [{ type: "bytes" }], stateMutability: "view" }],
  },
];

async function callWithFallback(
  address: Address,
  fn: { name: string; abi: Abi },
  chainId: number
): Promise<ProbeResult> {
  const client = makePublicClient(chainId);
  try {
    const args: unknown[] = ["tokenURI", "uri"].includes(fn.name) ? [0n] : [];

    const raw = await client.readContract({
      address,
      abi: fn.abi,
      functionName: fn.name,
      args,
    });

    const rawStr = typeof raw === "string" ? raw : typeof raw === "object" && raw !== null ? JSON.stringify(raw) : String(raw);

    return {
      fn: fn.name,
      status: "success",
      raw: rawStr,
      parsed: safeJsonParse(rawStr),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRevert =
      msg.includes("revert") ||
      msg.includes("execution reverted") ||
      msg.includes("invalid opcode") ||
      msg.includes("out of gas");
    const isUnavailable =
      msg.includes("Function") ||
      msg.includes("not a function") ||
      msg.includes("does not exist") ||
      msg.includes("selector") ||
      msg.toLowerCase().includes("abi") ||
      msg.toLowerCase().includes("0x");

    return {
      fn: fn.name,
      status: isRevert ? "reverted" : isUnavailable ? "unavailable" : "error",
      error: msg.slice(0, 200),
    };
  }
}

export interface DiscoveredMetadata {
  probeResults: ProbeResult[];
  resolvedMetadata: Record<string, unknown> | null;
  resolvedImageUrls: string[];
  rawResponses: Record<string, string>;
}

export async function probeContract(address: Address, chainId: number): Promise<DiscoveredMetadata> {
  const results = await Promise.all(
    PROBE_FUNCTIONS.map((fn) => callWithFallback(address, fn, chainId))
  );

  const rawResponses: Record<string, string> = {};
  for (const r of results) {
    if (r.status === "success" && r.raw) {
      rawResponses[r.fn] = r.raw;
    }
  }

  let resolvedMetadata: Record<string, unknown> | null = null;
  const resolvedImageUrls: string[] = [];

  for (const r of results) {
    if (r.status !== "success" || !r.raw) continue;

    const raw = r.raw;

    if (raw.startsWith("ipfs://") || raw.startsWith("http://") || raw.startsWith("https://")) {
      try {
        const fetched = await fetchJsonOrText(raw);
        if (fetched.data && typeof fetched.data === "object") {
          resolvedMetadata = resolvedMetadata ?? {};
          Object.assign(resolvedMetadata, fetched.data as Record<string, unknown>);
          rawResponses[`${r.fn}:fetched`] = fetched.raw;
        } else if (typeof fetched.data === "string") {
          const parsed = safeJsonParse(fetched.data);
          if (parsed && typeof parsed === "object") {
            resolvedMetadata = resolvedMetadata ?? {};
            Object.assign(resolvedMetadata, parsed as Record<string, unknown>);
          }
          rawResponses[`${r.fn}:fetched`] = fetched.raw;
        }
      } catch {
        // non-fatal
      }
      if (raw.startsWith("ipfs://") || raw.match(/\.(png|jpg|jpeg|gif|svg|webp)/i)) {
        resolvedImageUrls.push(resolveIpfsUri(raw));
      }
    } else {
      const parsed = safeJsonParse(raw);
      if (parsed && typeof parsed === "object") {
        resolvedMetadata = resolvedMetadata ?? {};
        Object.assign(resolvedMetadata, parsed as Record<string, unknown>);
      }
    }
  }

  if (resolvedMetadata) {
    const imageField = (resolvedMetadata as Record<string, unknown>).image;
    if (typeof imageField === "string" && imageField) {
      resolvedImageUrls.push(resolveIpfsUri(imageField));
    }
  }

  return {
    probeResults: results,
    resolvedMetadata,
    resolvedImageUrls: [...new Set(resolvedImageUrls)],
    rawResponses,
  };
}
