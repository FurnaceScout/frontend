"use client";

import { useEffect, useState } from "react";
import {
  getNetworkHealth,
  getBlockStatsOverTime,
  getTransactionVolume,
  getActiveAddresses,
  calculateAverageBlockTime,
} from "@/lib/stats";
import { formatEther } from "@/lib/viem";
import Link from "next/link";

export default function StatsPage() {
  const [health, setHealth] = useState(null);
  const [blockStats, setBlockStats] = useState([]);
  const [volume, setVolume] = useState(null);
  const [addresses, setAddresses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockRange, setBlockRange] = useState(100);

  useEffect(() => {
    loadStats();
  }, [blockRange]);

  async function loadStats() {
    try {
      setLoading(true);

      const [healthData, statsData, volumeData, addressData] =
        await Promise.all([
          getNetworkHealth(),
          getBlockStatsOverTime(blockRange, 20),
          getTransactionVolume(blockRange),
          getActiveAddresses(blockRange),
        ]);

      setHealth(healthData);
      setBlockStats(statsData);
      setVolume(volumeData);
      setAddresses(addressData);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }

  if (loading && !health) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            📊 Network Statistics
          </h1>
          <div className="flex items-center gap-3">
            <select
              value={blockRange}
              onChange={(e) => setBlockRange(Number(e.target.value))}
              className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value={50}>Last 50 blocks</option>
              <option value={100}>Last 100 blocks</option>
              <option value={200}>Last 200 blocks</option>
              <option value={500}>Last 500 blocks</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {refreshing ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          Real-time blockchain metrics and performance data
        </p>
      </div>

      {/* Network Health Overview */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="text-sm text-zinc-500 mb-1">Latest Block</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {health.latestBlock.toLocaleString()}
            </div>
            <Link
              href={`/block/${health.latestBlock}`}
              className="text-sm text-red-500 hover:underline"
            >
              View Block →
            </Link>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="text-sm text-zinc-500 mb-1">
              Average Block Time
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {health.averageBlockTime.toFixed(2)}s
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Last {blockRange} blocks
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="text-sm text-zinc-500 mb-1">
              Transactions Per Second
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {health.transactionsPerSecond.toFixed(2)}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Current TPS
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="text-sm text-zinc-500 mb-1">
              Total Transactions
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {health.totalTransactions.toLocaleString()}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Last {blockRange} blocks
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="text-sm text-zinc-500 mb-1">Active Addresses</div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {health.activeAddresses.toLocaleString()}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Unique addresses
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="text-sm text-zinc-500 mb-1">Avg Tx/Block</div>
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-2">
              {health.avgTxPerBlock.toFixed(2)}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Transactions per block
            </div>
          </div>
        </div>
      )}

      {/* Transaction Volume */}
      {volume && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Transaction Volume
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-zinc-500 mb-1">Total Value</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatEther(volume.totalValue, 4)} ETH
              </div>
            </div>
            <div>
              <div className="text-sm text-zinc-500 mb-1">Total Gas Used</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {BigInt(volume.totalGasUsed).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-zinc-500 mb-1">
                Total Transactions
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {volume.totalTransactions.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Addresses Breakdown */}
      {addresses && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Active Addresses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-zinc-500 mb-1">Total Active</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {addresses.totalActive.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-zinc-500 mb-1">Unique Senders</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {addresses.uniqueSenders.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-zinc-500 mb-1">
                Unique Receivers
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {addresses.uniqueReceivers.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Stats Chart */}
      {blockStats.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Transaction Activity Over Time
          </h2>

          {/* Simple bar chart */}
          <div className="space-y-2">
            {blockStats.map((stat, index) => {
              const maxTx = Math.max(
                ...blockStats.map((s) => s.transactionCount)
              );
              const width =
                maxTx > 0 ? (stat.transactionCount / maxTx) * 100 : 0;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-xs text-zinc-500 w-20 text-right">
                    Block {stat.blockNumber}
                  </div>
                  <div className="flex-1 h-8 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="text-sm text-zinc-900 dark:text-zinc-100 w-20">
                    {stat.transactionCount} tx
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-zinc-500">
            Showing {blockStats.length} sample points from last {blockRange}{" "}
            blocks
          </div>
        </div>
      )}

      {/* Gas Usage Chart */}
      {blockStats.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Gas Usage Over Time
          </h2>

          {/* Simple bar chart for gas */}
          <div className="space-y-2">
            {blockStats.map((stat, index) => {
              const maxGas = Math.max(
                ...blockStats.map((s) => Number(s.gasUsed))
              );
              const width = maxGas > 0 ? (Number(stat.gasUsed) / maxGas) * 100 : 0;

              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="text-xs text-zinc-500 w-20 text-right">
                    Block {stat.blockNumber}
                  </div>
                  <div className="flex-1 h-8 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <div className="text-sm text-zinc-900 dark:text-zinc-100 w-32">
                    {(Number(stat.gasUsed) / 1e6).toFixed(2)}M
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-zinc-500">
            Gas usage displayed in millions (M)
          </div>
        </div>
      )}
    </div>
  );
}
