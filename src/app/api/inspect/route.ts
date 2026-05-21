import { NextRequest, NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { hasBytecode, isERC20Contract, getERC20Metadata } from "@/lib/erc20";
import { probeContract } from "@/lib/probe";
import { extractImageUrls, extractSocialLinks, normalizeMetadata } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.trim();

  if (!address || !isAddress(address)) {
    return NextResponse.json({ error: "Enter a valid EVM address." }, { status: 400 });
  }

  const checksummed = address as Address;

  const hasCode = await hasBytecode(checksummed);
  if (!hasCode) {
    return NextResponse.json({ error: "No bytecode found at this address — not a contract." }, { status: 400 });
  }

  const isToken = await isERC20Contract(checksummed);
  if (!isToken) {
    return NextResponse.json({ error: "Enter the address of a valid ERC-20 contract." }, { status: 400 });
  }

  const [erc20Metadata, discovered] = await Promise.all([
    getERC20Metadata(checksummed),
    probeContract(checksummed),
  ]);

  const normalized = discovered.resolvedMetadata
    ? normalizeMetadata(discovered.resolvedMetadata)
    : null;

  const imageUrls = [
    ...discovered.resolvedImageUrls,
    ...(normalized ? extractImageUrls(normalized) : []),
  ];

  const socialLinks = normalized ? extractSocialLinks(normalized) : {};

  return NextResponse.json({
    address: checksummed,
    erc20: erc20Metadata,
    discovered: {
      metadata: normalized,
      imageUrls: [...new Set(imageUrls)],
      socialLinks,
    },
    probeResults: discovered.probeResults,
    rawResponses: discovered.rawResponses,
  });
}
