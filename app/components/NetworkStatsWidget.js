"use client";

import { useEffect, useState } from "react";
import { getNetworkHealth } from "@/lib/stats";
import Link from "next/link";

export default function NetworkStatsWidget() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();

    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      const data = await getNetworkHealth();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Error loading network stats:", err);
      setError("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Network Statistics
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Network Statistics
        </h2>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="text-zinc-600 dark:text-zinc-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          📊 Network Statistics
        </h2>
        <Link
          href="/stats"
          className="text-sm text-red-600 dark:text-red-400 hover:underline font-semibold"
        >
          View Details →
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Latest Block</div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">
              {stats.latestBlock.toLocaleString()}
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Block Time</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {stats.averageBlockTime.toFixed(2)}s
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">TPS</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {stats.transactionsPerSecond.toFixed(2)}
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Transactions</div>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {stats.totalTransactions.toLocaleString()}
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Active Addresses</div>
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {stats.activeAddresses.toLocaleString()}
            </div>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-xs text-zinc-500 mb-1">Avg Tx/Block</div>
            <div className="text-xl font-bold text-pink-600 dark:text-pink-400">
              {stats.avgTxPerBlock.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-zinc-500 text-center">
        Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}
