# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server (localhost:3000)
pnpm build        # production build + type check
pnpm lint         # ESLint
pnpm exec tsc --noEmit  # type-check only (faster than build)
```

After editing, always delete `tsconfig.tsbuildinfo` before running `tsc --noEmit` or the incremental cache may report stale errors:
```bash
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
```

Deploy: `vercel --prod` (project is already linked; env vars are set on Vercel).

## Architecture

Single Next.js App Router app. All EVM calls happen server-side — the client never touches an RPC directly.

**Request flow:**
1. User enters address + selects chain in `TokenInspector` (client component)
2. `GET /api/inspect?address=&chainId=` is called
3. Route validates address → checks bytecode → checks ERC-20 → fetches standard fields + probes optional functions in parallel
4. Response is rendered by `TokenInspector` into 4 collapsible sections

**`src/lib/` — server-only**

- `rpc.ts` — `makePublicClient(chainId)` creates a viem client with a fallback transport: Thirdweb RPC (`{chainId}.rpc.thirdweb.com/{clientId}`) → Ankr → viem chain default. Also exports `SUPPORTED_CHAINS` and `DEFAULT_CHAIN_ID` (Base, 8453). To add a chain: add it to `SUPPORTED_CHAINS` and optionally to `ANKR_SLUGS`.
- `erc20.ts` — `hasBytecode`, `isERC20Contract`, `getERC20Metadata`. All accept `chainId` and call `makePublicClient` internally.
- `probe.ts` — calls a list of optional contract functions (`tokenURI`, `contractURI`, `uri`, `metadata`, `image*`, `allData`). Each entry has `argVariants` tried in order — first success wins. `tokenURI` tries no-args before `uint256` because ERC-20 tokens commonly expose `tokenURI()` with no arguments. Results whose function name starts with `image` are always added to `resolvedImageUrls` regardless of URL scheme/extension. IPFS and HTTP URLs are fetched and merged into `resolvedMetadata`.
- `utils.ts` — pure helpers. Key ones:
  - `extractSocialLinks(obj)` — two-pass: first checks for `{platform, url}` array items (e.g. `socialMediaUrls`), then falls back to key-name matching. Tweet URLs (`x.com/*/status/`) are always routed to the `twitter` slot regardless of key name. If no website is found by key, scans the `description` field for URLs.
  - `resolveIpfsUri(uri)` — converts `ipfs://` to `https://ipfs.io/ipfs/`.
  - `safeJsonParse` — returns `null` on failure, never throws.

**`src/components/`**

- `TokenInspector.tsx` — owns all UI state (address, chainId, loading, error, result). Chain list is duplicated here as a plain array mirroring `SUPPORTED_CHAINS` in `rpc.ts` (kept separate to avoid a server-lib import in a client component).
- `JsonViewer.tsx` — recursive renderer for arbitrary JSON; makes URLs clickable and renders images inline for image-key values.
- `ProbeResults.tsx`, `SocialLinks.tsx`, `ImageGallery.tsx` — display-only, no state.

## Environment variables

| Variable | Where used | Notes |
|---|---|---|
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | `rpc.ts` (client + server) | Required; used to build Thirdweb RPC URLs |
| `RPC_URL` | unused (removed) | Was the old single-endpoint override; no longer read |

## Probe function conventions

To add a new probe function, add an entry to `PROBE_FUNCTIONS` in `probe.ts`:
```ts
{
  name: "myFunction",
  abi: [{ name: "myFunction", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" }],
  // argVariants: [[]] is implied if omitted
}
```
If the function has ambiguous signatures (like `tokenURI`), add multiple arg sets to `argVariants` — they are tried in order and the first success is used.

DISTILLED_AESTHETICS_PROMPT = """
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
"""