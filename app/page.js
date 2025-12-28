"use client";

import Link from "next/link";
import { formatEther, shortenAddress } from "@/lib/viem";
import {
  useLatestBlocks,
  useLatestTransactions,
} from "@/app/hooks/useBlockchain";
import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";

export default function Home() {
  const { blocks, loading: blocksLoading } = useLatestBlocks(5);
  const { transactions, loading: txLoading } = useLatestTransactions(5, 50);
  const [searchQuery, setSearchQuery] = useState("");
  const [networkStats, setNetworkStats] = useState(null);
  const publicClient = usePublicClient();

  const loading = blocksLoading || txLoading;

  useEffect(() => {
    const fetchNetworkStats = async () => {
      if (!publicClient) return;

      try {
        const [blockNumber, gasPrice, chainId] = await Promise.all([
          publicClient.getBlockNumber(),
          publicClient.getGasPrice(),
          publicClient.getChainId(),
        ]);

        setNetworkStats({
          blockNumber,
          gasPrice,
          chainId,
        });
      } catch (error) {
        console.error("Failed to fetch network stats:", error);
      }
    };

    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 12000);
    return () => clearInterval(interval);
  }, [publicClient]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();

    // Detect search type and redirect
    if (query.startsWith("0x") && query.length === 66) {
      // Transaction hash
      window.location.href = `/tx/${query}`;
    } else if (query.startsWith("0x") && query.length === 42) {
      // Address
      window.location.href = `/address/${query}`;
    } else if (/^\d+$/.test(query)) {
      // Block number
      window.location.href = `/block/${query}`;
    }
  };

  const features = [
    {
      icon: "🔍",
      title: "Block Explorer",
      description: "Explore blocks, transactions, and addresses in real-time",
      href: "/block/latest",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: "📜",
      title: "Contract Interaction",
      description: "Read and write contract functions with a beautiful UI",
      href: "/address/0x0000000000000000000000000000000000000000",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: "🚀",
      title: "Foundry Deployments",
      description: "Track and manage your Foundry script deployments",
      href: "/deployments",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: "⚙️",
      title: "Anvil State Manager",
      description: "Control snapshots, mining, time, and account state",
      href: "#",
      color: "from-green-500 to-emerald-500",
      onClick: true,
    },
    {
      icon: "🔬",
      title: "State Diff Viewer",
      description: "Analyze transaction state changes and storage operations",
      href: "/tx/latest",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: "🎯",
      title: "Cast Builder",
      description: "Build and execute cast commands with a visual interface",
      href: "/cast-builder",
      color: "from-yellow-500 to-orange-500",
    },
  ];

  if (loading && !networkStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading blockchain data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-zinc-900 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-red-900/50 border border-red-400/50 rounded-lg text-sm text-red-100">
              ⚠️ Unofficial Product - Not affiliated with or supported by the
              Foundry team
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              FurnaceScout
            </h1>
            <p className="text-xl md:text-2xl text-red-100 mb-8">
              Unofficial Foundry-First Block Explorer for Local Development
            </p>
            <p className="text-lg text-red-200 mb-12 max-w-2xl mx-auto">
              Built for developers using Foundry and Anvil. Explore blocks,
              interact with contracts, track deployments, and manage local chain
              state—all in one place.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Address / Tx Hash / Block Number"
                  className="w-full px-6 py-4 pr-12 rounded-lg text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border-2 border-transparent focus:border-red-400 focus:outline-none shadow-xl text-lg"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                >
                  🔍
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Network Stats Bar */}
      {networkStats && (
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Network Status
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    Live
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Latest Block
                </div>
                <div className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                  #{networkStats.blockNumber.toString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Gas Price
                </div>
                <div className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                  {(Number(networkStats.gasPrice) / 1e9).toFixed(2)} Gwei
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                  Chain ID
                </div>
                <div className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                  {networkStats.chainId}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="bg-zinc-50 dark:bg-zinc-950 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-zinc-900 dark:text-zinc-100">
            Developer Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Activity */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-zinc-900 dark:text-zinc-100">
          Latest Activity
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Latest Blocks */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>📦</span> Latest Blocks
              </h3>
              <Link
                href="/block/latest"
                className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {blocks.map((block) => (
                <Link
                  key={block.number.toString()}
                  href={`/block/${block.number}`}
                  className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 hover:border-red-500 dark:hover:border-red-500 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                      Block #{block.number.toString()}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(
                        Number(block.timestamp) * 1000,
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-zinc-500 dark:text-zinc-400 mb-1">
                        Transactions
                      </div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {Array.isArray(block.transactions)
                          ? block.transactions.length
                          : 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500 dark:text-zinc-400 mb-1">
                        Gas Used
                      </div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {(Number(block.gasUsed) / 1e6).toFixed(2)}M
                      </div>
                    </div>
                    <div>
                      <div className="text-zinc-500 dark:text-zinc-400 mb-1">
                        Gas Limit
                      </div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {(Number(block.gasLimit) / 1e6).toFixed(2)}M
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Latest Transactions */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>📝</span> Latest Transactions
              </h3>
              <Link
                href="/tx/latest"
                className="text-red-600 dark:text-red-400 hover:underline text-sm font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    No transactions yet
                  </p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
                    Transactions will appear here as they occur
                  </p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <Link
                    key={tx.hash}
                    href={`/tx/${tx.hash}`}
                    className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 hover:border-red-500 dark:hover:border-red-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100 font-semibold">
                        {shortenAddress(tx.hash)}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
                        Block #{tx.blockNumber?.toString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                      <div>
                        <div className="text-zinc-500 dark:text-zinc-400 mb-1">
                          From
                        </div>
                        <div className="font-mono text-zinc-900 dark:text-zinc-100">
                          {shortenAddress(tx.from)}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 dark:text-zinc-400 mb-1">
                          To
                        </div>
                        <div className="font-mono text-zinc-900 dark:text-zinc-100">
                          {tx.to ? (
                            shortenAddress(tx.to)
                          ) : (
                            <span className="text-purple-600 dark:text-purple-400">
                              Contract Deploy
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {tx.value && tx.value > 0n && (
                      <div className="text-sm pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-zinc-500 dark:text-zinc-400">
                          Value:
                        </span>
                        <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                          {formatEther(tx.value)} ETH
                        </span>
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Built for Foundry Developers
          </h3>
          <p className="text-zinc-300 mb-6 max-w-2xl mx-auto">
            FurnaceScout is designed to work seamlessly with your Foundry and
            Anvil workflow. No configuration needed—just point it at your local
            RPC and start exploring.
          </p>
          <p className="text-zinc-500 text-sm mb-6">
            ⚠️ This is an unofficial, community-built tool. Not affiliated with
            or endorsed by the Foundry team.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/deployments"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
            >
              Track Deployments
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-semibold transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
