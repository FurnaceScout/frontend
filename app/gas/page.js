"use client";

import { useEffect, useState } from "react";
import {
  getTopGasConsumers,
  getGasTrends,
  getGasStatistics,
  formatGas,
} from "@/lib/gas-profiling";
import { formatEther, shortenAddress } from "@/lib/viem";
import Link from "next/link";

export default function GasAnalyticsPage() {
  const [topConsumers, setTopConsumers] = useState([]);
  const [trends, setTrends] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockRange, setBlockRange] = useState(100);
  const [activeTab, setActiveTab] = useState("consumers"); // 'consumers' | 'trends' | 'stats'

  useEffect(() => {
    loadData();
  }, [blockRange]);

  async function loadData() {
    try {
      setLoading(true);

      const [consumersData, trendsData, statsData] = await Promise.all([
        getTopGasConsumers(blockRange, 10),
        getGasTrends(blockRange, 20),
        getGasStatistics(blockRange),
      ]);

      setTopConsumers(consumersData);
      setTrends(trendsData);
      setStatistics(statsData);
    } catch (error) {
      console.error("Error loading gas analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (loading && !statistics) {
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
            ⛽ Gas Profiling Dashboard
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
          Analyze gas consumption patterns and identify optimization opportunities
        </p>
      </div>

      {/* Summary Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="text-sm text-zinc-500 mb-1">Total Gas Used</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
              {formatGas(statistics.totalGasUsed, "M")}M
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Last {blockRange} blocks
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="text-sm text-zinc-500 mb-1">Avg Gas/Block</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {formatGas(statistics.averageGasUsedPerBlock, "M")}M
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Per block average
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="text-sm text-zinc-500 mb-1">Avg Gas/Tx</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
              {formatGas(statistics.averageGasPerTransaction, "K")}K
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Per transaction average
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="text-sm text-zinc-500 mb-1">Gas Utilization</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {statistics.overallUtilization.toFixed(1)}%
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Of block gas limit
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("consumers")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "consumers"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Top Consumers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trends")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "trends"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Gas Trends
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "stats"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Top Gas Consumers Tab */}
      {activeTab === "consumers" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            Top Gas Consuming Contracts
          </h2>

          {topConsumers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">⛽</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                No contract interactions found
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Rank
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Contract
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Total Gas
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Transactions
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Avg Gas/Tx
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                      Success Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topConsumers.map((consumer, index) => (
                    <tr
                      key={consumer.address}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg font-bold ${
                              index === 0
                                ? "text-yellow-600"
                                : index === 1
                                  ? "text-gray-400"
                                  : index === 2
                                    ? "text-orange-600"
                                    : "text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/address/${consumer.address}`}
                          className="font-mono text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                          {shortenAddress(consumer.address, 6)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-zinc-900 dark:text-zinc-100">
                        {formatGas(consumer.totalGasUsed, "M")}M
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-zinc-900 dark:text-zinc-100">
                        {consumer.transactionCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-zinc-900 dark:text-zinc-100">
                        {formatGas(consumer.averageGasPerTx, "K")}K
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        <span
                          className={`font-semibold ${
                            consumer.successRate === 100
                              ? "text-green-600 dark:text-green-400"
                              : consumer.successRate >= 50
                                ? "text-yellow-600 dark:text-yellow-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {consumer.successRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Gas Trends Tab */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          {/* Gas Usage Over Time */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Gas Usage Over Time
            </h2>

            {trends.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📊</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  No trend data available
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {trends.map((trend, index) => {
                  const maxGas = Math.max(...trends.map((t) => Number(t.totalGasUsed)));
                  const width = maxGas > 0 ? (Number(trend.totalGasUsed) / maxGas) * 100 : 0;

                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="text-xs text-zinc-500 w-24 text-right">
                        Block {trend.blockNumber}
                      </div>
                      <div className="flex-1 h-10 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all flex items-center px-2"
                          style={{ width: `${width}%` }}
                        >
                          {width > 15 && (
                            <span className="text-xs text-white font-semibold">
                              {formatGas(trend.totalGasUsed, "M")}M
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 w-20 text-right">
                        {trend.transactionCount} tx
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gas Utilization Over Time */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Block Gas Utilization
            </h2>

            {trends.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📈</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  No utilization data available
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {trends.map((trend, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="text-xs text-zinc-500 w-24 text-right">
                      Block {trend.blockNumber}
                    </div>
                    <div className="flex-1 h-8 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          trend.gasUtilization > 80
                            ? "bg-red-500"
                            : trend.gasUtilization > 50
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${trend.gasUtilization}%` }}
                      />
                    </div>
                    <div className="text-sm text-zinc-900 dark:text-zinc-100 w-20 text-right font-semibold">
                      {trend.gasUtilization.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === "stats" && statistics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gas Usage Stats */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Gas Usage
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Total Gas Used</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {formatGas(statistics.totalGasUsed, "M")}M
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Total Gas Limit</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {formatGas(statistics.totalGasLimit, "M")}M
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Average Gas/Block</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {formatGas(statistics.averageGasUsedPerBlock, "M")}M
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Average Gas/Transaction</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {formatGas(statistics.averageGasPerTransaction, "K")}K
                  </div>
                </div>
              </div>
            </div>

            {/* Gas Price Stats */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Gas Prices
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Average Gas Price</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {formatGas(statistics.averageGasPrice, "gwei")} Gwei
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Min Gas Price</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatGas(statistics.minGasPrice, "gwei")} Gwei
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Max Gas Price</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatGas(statistics.maxGasPrice, "gwei")} Gwei
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">Total Transactions</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {statistics.totalTransactions.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Utilization Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Overall Gas Utilization
            </h2>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {formatGas(statistics.totalGasUsed, "M")}M used
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {formatGas(statistics.totalGasLimit, "M")}M limit
                </span>
              </div>
              <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                <div
                  className={`h-full flex items-center justify-center font-bold text-white transition-all ${
                    statistics.overallUtilization > 80
                      ? "bg-red-500"
                      : statistics.overallUtilization > 50
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${statistics.overallUtilization}%` }}
                >
                  {statistics.overallUtilization.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {statistics.overallUtilization > 80 ? (
                <span className="text-red-600 dark:text-red-400">
                  ⚠️ High utilization - blocks are nearly full
                </span>
              ) : statistics.overallUtilization > 50 ? (
                <span className="text-yellow-600 dark:text-yellow-400">
                  ⚡ Moderate utilization - good activity level
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400">
                  ✓ Low utilization - plenty of capacity available
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
