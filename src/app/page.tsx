import { TokenInspector } from "@/components/TokenInspector";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">ERC-20 Token Inspector</h1>
          <p className="text-gray-400 text-sm">
            Paste an EVM contract address to discover all on-chain and off-chain metadata.
          </p>
        </div>
        <TokenInspector />
      </div>
    </main>
  );
}
