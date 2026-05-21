# ERC-20 Token Inspector

Paste any EVM contract address and instantly discover everything about it: standard ERC-20 metadata, IPFS-hosted images, social links, on-chain metadata probes, and raw responses.

## Features

- **Standard ERC-20**: name, symbol, decimals, total supply
- **Metadata probing**: safely calls `contractURI()`, `tokenURI()`, `uri()`, `metadata()`, `image()`, `imageURI()`, `imageURL()`, `allData()`
- **IPFS support**: resolves `ipfs://` URIs for metadata and images
- **Recursive JSON viewer**: renders any metadata shape without crashing
- **Social link extraction**: auto-detects website, Twitter/X, Telegram, Discord, Farcaster, GitHub
- **Image gallery**: displays token images from metadata
- **Probe results**: shows which functions succeeded, reverted, or are unavailable
- **Raw responses**: full debug view of every raw contract response

## Local Setup

1. **Clone**
   ```bash
   git clone <your-repo-url>
   cd token-metadata
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and fill in your values
   ```

4. **Run the dev server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | Yes | Thirdweb client ID for SDK access |
| `RPC_URL` | No | Ethereum RPC endpoint (defaults to `https://eth.llamarpc.com`) |

See `.env.example` for the full template.

## Thirdweb Setup

1. Go to [https://thirdweb.com/dashboard/settings/api-keys](https://thirdweb.com/dashboard/settings/api-keys)
2. Create a new API key
3. Copy the **Client ID** into `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`

## Vercel Deploy

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com/new)
3. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` → your Thirdweb client ID
   - `RPC_URL` (optional) → your preferred RPC endpoint
4. Deploy

## GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create token-metadata --public --push
```

## Usage

Paste an ERC-20 contract address (e.g. `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` for USDC) into the input field and click **Inspect**.

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router + Server API Routes
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [viem](https://viem.sh/) — EVM contract reads
- [Thirdweb SDK v5](https://portal.thirdweb.com/typescript/v5)
- [Vercel](https://vercel.com/) — Deployment
