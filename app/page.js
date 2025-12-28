"use client";

import Link from "next/link";
import { formatEther, shortenAddress } from "@/lib/viem";
import {
  useLatestBlocks,
  useLatestTransactions,
} from "@/app/hooks/useBlockchain";

export default function Home() {
  const { blocks, loading: blocksLoading } = useLatestBlocks(10);
  const { transactions, loading: txLoading } = useLatestTransactions(10, 100);

  const loading = blocksLoading || txLoading;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading blockchain data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Blocks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Latest Blocks
            </h2>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </span>
          </div>
          <div className="space-y-3">
            {blocks.map((block) => (
              <Link
                key={block.number.toString()}
                href={`/block/${block.number}`}
                className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-red-500 dark:hover:border-red-500 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📦</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      Block #{block.number.toString()}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(
                      Number(block.timestamp) * 1000,
                    ).toLocaleTimeString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Transactions:
                    </span>
                    <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      {Array.isArray(block.transactions)
                        ? block.transactions.length
                        : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Gas Used:
                    </span>
                    <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      {block.gasUsed.toString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Latest Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Latest Transactions
            </h2>
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </span>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center">
                <p className="text-zinc-500 dark:text-zinc-400">
                  No transactions yet
                </p>
              </div>
            ) : (
              transactions.map((tx) => (
                <Link
                  key={tx.hash}
                  href={`/tx/${tx.hash}`}
                  className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-red-500 dark:hover:border-red-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📝</span>
                      <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                        {shortenAddress(tx.hash)}
                      </span>
                    </div>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      Block #{tx.blockNumber?.toString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        From:
                      </span>
                      <span className="ml-2 font-mono text-zinc-900 dark:text-zinc-100">
                        {shortenAddress(tx.from)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        To:
                      </span>
                      <span className="ml-2 font-mono text-zinc-900 dark:text-zinc-100">
                        {tx.to ? shortenAddress(tx.to) : "Contract Creation"}
                      </span>
                    </div>
                  </div>
                  {tx.value && tx.value > 0n && (
                    <div className="mt-2 text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">
                        Value:
                      </span>
                      <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">
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
  );
}
