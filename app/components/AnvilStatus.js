"use client";

import { useState } from "react";
import { formatEther, shortenAddress } from "@/lib/viem";
import { useChainInfo, useWatchBalances } from "@/app/hooks/useBlockchain";

// Anvil's default test accounts
const ANVIL_ACCOUNTS = [
  {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
  {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey:
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  },
  {
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    privateKey:
      "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  },
  {
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    privateKey:
      "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  },
  {
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    privateKey:
      "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  },
  {
    address: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    privateKey:
      "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  },
  {
    address: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    privateKey:
      "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  },
  {
    address: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    privateKey:
      "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  },
  {
    address: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    privateKey:
      "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6",
  },
];

export default function AnvilStatus({ expanded = false, onToggle }) {
  const [copiedItem, setCopiedItem] = useState(null);

  // Use real-time hooks instead of polling
  const { chainInfo, loading: chainLoading } = useChainInfo();
  const addresses = ANVIL_ACCOUNTS.map((acc) => acc.address);
  const { balances, loading: balancesLoading } = useWatchBalances(addresses);

  const loading = chainLoading || balancesLoading;

  const copyToClipboard = async (text, label) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS or older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback copy failed:", err);
        }
        document.body.removeChild(textArea);
      }
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return <div className="text-sm text-zinc-500">Loading Anvil status...</div>;
  }

  if (!chainInfo) {
    return (
      <div className="text-sm text-red-500">⚠️ Cannot connect to Anvil</div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-left">
              Anvil Connected
            </div>
            <div className="text-xs text-zinc-500 text-left">
              Chain ID: {chainInfo.chainId} | Block: {chainInfo.blockNumber}
            </div>
          </div>
        </div>
        <div className="text-zinc-400">{expanded ? "▼" : "▶"}</div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          {/* Chain Info */}
          <div className="p-4 grid grid-cols-3 gap-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Chain ID</div>
              <div className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {chainInfo.chainId}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Current Block</div>
              <div className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {chainInfo.blockNumber}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Gas Price</div>
              <div className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {(Number(chainInfo.gasPrice) / 1e9).toFixed(2)} Gwei
              </div>
            </div>
          </div>

          {/* Test Accounts */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Test Accounts
              </h3>
              <div className="text-xs text-zinc-500">
                {ANVIL_ACCOUNTS.length} accounts
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {ANVIL_ACCOUNTS.map((account, index) => (
                <div
                  key={account.address}
                  className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400">
                        {index}
                      </div>
                      <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                        {shortenAddress(account.address, 6)}
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {balances[account.address.toLowerCase()]
                        ? `${formatEther(balances[account.address.toLowerCase()], 2)} ETH`
                        : "Loading..."}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(account.address, `addr-${index}`)
                      }
                      className="flex-1 px-2 py-1 text-xs bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
                    >
                      {copiedItem === `addr-${index}`
                        ? "✓ Copied"
                        : "📋 Address"}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(account.privateKey, `key-${index}`)
                      }
                      className="flex-1 px-2 py-1 text-xs bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors"
                    >
                      {copiedItem === `key-${index}`
                        ? "✓ Copied"
                        : "🔑 Private Key"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <div className="text-xs text-zinc-500 mb-2">Quick Actions</div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors font-semibold"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => copyToClipboard("http://127.0.0.1:8545", "rpc")}
                className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors font-semibold"
              >
                {copiedItem === "rpc" ? "✓ Copied" : "📋 Copy RPC URL"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
