"use client";

import Link from "next/link";
import { useState } from "react";
import NetworkStatsWidget from "@/app/components/NetworkStatsWidget";
import RecentTokenTransfers from "@/app/components/RecentTokenTransfers";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  useLatestBlocks,
  useLatestTransactions,
  useChainInfo,
  useGasPrice,
} from "@/app/hooks/useBlockchainQueries";
import { formatEther, shortenAddress } from "@/lib/viem";

export default function Home() {
  // Use React Query hooks for caching and deduplication
  const {
    data: blocks = [],
    isLoading: blocksLoading,
    blockNumber,
  } = useLatestBlocks(5);
  const { data: transactions = [], isLoading: txLoading } =
    useLatestTransactions(5, 50);
  const [searchQuery, _setSearchQuery] = useState("");

  // Network stats from React Query hooks - automatically cached and refreshed
  const { data: chainInfo } = useChainInfo();
  const { data: gasPrice } = useGasPrice({ refetchInterval: 12000 });

  const loading = blocksLoading || txLoading;

  // Build networkStats from React Query data
  const networkStats = chainInfo
    ? {
        blockNumber: blockNumber || BigInt(chainInfo.blockNumber || 0),
        gasPrice: gasPrice || BigInt(chainInfo.gasPrice || 0),
        chainId: Number(chainInfo.chainId || 31337),
      }
    : null;

  const _handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();

    // Detect search type and redirect
    if (query.startsWith("0x") && query.length === 66) {
      // Transaction hash
      router.push(`/tx/${query}`);
    } else if (query.startsWith("0x") && query.length === 42) {
      // Address
      router.push(`/address/${query}`);
    } else if (/^\d+$/.test(query)) {
      // Block number
      router.push(`/block/${query}`);
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
              <Link key={index} href={feature.href}>
                <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}
                    >
                      {feature.icon}
                    </div>
                    <CardTitle className="group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
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
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>📦</span> Latest Blocks
              </h3>
            </div>
            <div className="space-y-3">
              {blocks.map((block) => (
                <Link
                  key={block.number.toString()}
                  href={`/block/${block.number}`}
                >
                  <Card className="hover:border-red-500 dark:hover:border-red-500 hover:shadow-lg transition-all m-6 min-h-40">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Block #{block.number.toString()}</CardTitle>
                        <Badge variant="outline">
                          {new Date(
                            Number(block.timestamp) * 1000,
                          ).toLocaleTimeString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">
                            Transactions
                          </div>
                          <div className="font-semibold">
                            {Array.isArray(block.transactions)
                              ? block.transactions.length
                              : 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">
                            Gas Used
                          </div>
                          <div className="font-semibold">
                            {(Number(block.gasUsed) / 1e6).toFixed(2)}M
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">
                            Gas Limit
                          </div>
                          <div className="font-semibold">
                            {(Number(block.gasLimit) / 1e6).toFixed(2)}M
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Latest Transactions */}
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>📝</span> Latest Transactions
              </h3>
            </div>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <Card className="p-12 text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-muted-foreground">No transactions yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Transactions will appear here as they occur
                    </p>
                  </CardContent>
                </Card>
              ) : (
                transactions.map((tx) => (
                  <Link key={tx.hash} href={`/tx/${tx.hash}`}>
                    <Card className="hover:border-red-500 dark:hover:border-red-500 hover:shadow-lg transition-all m-6 min-h-40">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-semibold">
                            {shortenAddress(tx.hash)}
                          </span>
                          <Badge variant="outline">
                            Block #{tx.blockNumber?.toString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                          <div>
                            <div className="text-muted-foreground mb-1">
                              From
                            </div>
                            <div className="font-mono">
                              {shortenAddress(tx.from)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">To</div>
                            <div className="font-mono">
                              {tx.to ? (
                                shortenAddress(tx.to)
                              ) : (
                                <Badge variant="secondary">
                                  Contract Deploy
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {tx.value && tx.value > 0n ? (
                          <div className="text-sm pt-2 border-t">
                            <span className="text-muted-foreground">
                              Value:
                            </span>
                            <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                              {formatEther(tx.value)} ETH
                            </span>
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Network Stats Widget */}
        <div className="max-w-7xl mx-auto mt-12">
          <NetworkStatsWidget />
        </div>

        {/* Recent Token Transfers Widget */}
        <div className="max-w-7xl mx-auto mt-8">
          <RecentTokenTransfers />
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
