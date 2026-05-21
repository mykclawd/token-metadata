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

const PROBE_FUNCTIONS: { name: string; abi: Abi; argVariants?: unknown[][] }[] = [
  {
    name: "tokenURI",
    // Try no-args first (tokenURI()), then tokenURI(uint256) with id=0.
    // ERC-20 tokens often expose tokenURI() with no args; ERC-721-style tokenURI(uint256) is tried as fallback.
    abi: [{ name: "tokenURI", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
    argVariants: [
      [],
      [0n],
    ],
  },
  {
    name: "contractURI",
    abi: [{ name: "contractURI", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
  },
  {
    name: "uri",
    abi: [{ name: "uri", type: "function", inputs: [{ name: "id", type: "uint256" }], outputs: [{ type: "string" }], stateMutability: "view" }],
    argVariants: [[0n]],
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
    name: "imageUrl",
    abi: [{ name: "imageUrl", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
  },
  {
    name: "allData",
    abi: [{ name: "allData", type: "function", inputs: [], outputs: [{ type: "bytes" }], stateMutability: "view" }],
  },
];

async function tryCall(
  client: ReturnType<typeof makePublicClient>,
  address: Address,
  fn: { name: string; abi: Abi },
  args: unknown[]
): Promise<{ raw: string } | { error: string; isRevert: boolean }> {
  try {
    const raw = await client.readContract({
      address,
      abi: fn.abi,
      functionName: fn.name,
      args,
    });
    const rawStr = typeof raw === "string" ? raw : typeof raw === "object" && raw !== null ? JSON.stringify(raw) : String(raw);
    return { raw: rawStr };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRevert =
      msg.includes("revert") ||
      msg.includes("execution reverted") ||
      msg.includes("invalid opcode") ||
      msg.includes("out of gas");
    return { error: msg.slice(0, 200), isRevert };
  }
}

async function callWithFallback(
  address: Address,
  fn: { name: string; abi: Abi; argVariants?: unknown[][] },
  chainId: number
): Promise<ProbeResult> {
  const client = makePublicClient(chainId);
  const variants = fn.argVariants ?? [[]];
  let lastError = "";
  let lastIsRevert = false;

  for (const args of variants) {
    const result = await tryCall(client, address, fn, args);
    if ("raw" in result) {
      return {
        fn: fn.name,
        status: "success",
        raw: result.raw,
        parsed: safeJsonParse(result.raw),
      };
    }
    lastError = result.error;
    lastIsRevert = result.isRevert;
  }

  const isUnavailable =
    lastError.includes("Function") ||
    lastError.includes("not a function") ||
    lastError.includes("does not exist") ||
    lastError.includes("selector") ||
    lastError.toLowerCase().includes("abi") ||
    lastError.toLowerCase().includes("0x");

  return {
    fn: fn.name,
    status: lastIsRevert ? "reverted" : isUnavailable ? "unavailable" : "error",
    error: lastError,
  };
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
      const isImageFetch = r.fn.toLowerCase().startsWith("image");
      try {
        const fetched = await fetchJsonOrText(raw);
        if (fetched.data && typeof fetched.data === "object") {
          resolvedMetadata = resolvedMetadata ?? {};
          Object.assign(resolvedMetadata, fetched.data as Record<string, unknown>);
          if (!isImageFetch) rawResponses[`${r.fn}:fetched`] = fetched.raw;
        } else if (typeof fetched.data === "string") {
          const parsed = safeJsonParse(fetched.data);
          if (parsed && typeof parsed === "object") {
            resolvedMetadata = resolvedMetadata ?? {};
            Object.assign(resolvedMetadata, parsed as Record<string, unknown>);
          }
          if (!isImageFetch) rawResponses[`${r.fn}:fetched`] = fetched.raw;
        }
      } catch {
        // non-fatal
      }
      if (isImageFetch || raw.startsWith("ipfs://") || raw.match(/\.(png|jpg|jpeg|gif|svg|webp)/i)) {
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
