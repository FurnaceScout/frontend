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
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";

export default function StatsPage() {
  const [health, setHealth] = useState(null);
  const [blockStats, setBlockStats] = useState([]);
  const [volume, setVolume] = useState(null);
  const [addresses, setAddresses] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockRange, setBlockRange] = useState("100");

  useEffect(() => {
    loadStats();
  }, [blockRange]);

  async function loadStats() {
    try {
      setLoading(true);

      const blockCount = parseInt(blockRange);
      const [healthData, statsData, volumeData, addressData] =
        await Promise.all([
          getNetworkHealth(),
          getBlockStatsOverTime(blockCount, 20),
          getTransactionVolume(blockCount),
          getActiveAddresses(blockCount),
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
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">📊 Network Statistics</h1>
          <div className="flex items-center gap-3">
            <Select value={blockRange} onValueChange={setBlockRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Block range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">Last 50 blocks</SelectItem>
                <SelectItem value="100">Last 100 blocks</SelectItem>
                <SelectItem value="200">Last 200 blocks</SelectItem>
                <SelectItem value="500">Last 500 blocks</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "🔄 Refresh"}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Real-time blockchain metrics and performance data
        </p>
      </div>

      {/* Network Health Overview */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Latest Block</CardDescription>
              <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                {health.latestBlock.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/block/${health.latestBlock}`}
                className="text-sm text-primary hover:underline"
              >
                View Block →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Block Time</CardDescription>
              <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">
                {health.averageBlockTime.toFixed(2)}s
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Last {blockRange} blocks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Transactions Per Second</CardDescription>
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                {health.transactionsPerSecond.toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Current TPS</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Transactions</CardDescription>
              <CardTitle className="text-3xl text-purple-600 dark:text-purple-400">
                {health.totalTransactions.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Last {blockRange} blocks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Addresses</CardDescription>
              <CardTitle className="text-3xl text-orange-600 dark:text-orange-400">
                {health.activeAddresses.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Unique addresses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Tx/Block</CardDescription>
              <CardTitle className="text-3xl text-pink-600 dark:text-pink-400">
                {health.avgTxPerBlock.toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Transactions per block
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction Volume */}
      {volume && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>
              Aggregate metrics for last {blockRange} blocks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Total Value
                </div>
                <div className="text-2xl font-bold">
                  {formatEther(volume.totalValue, 4)} ETH
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Total Gas Used
                </div>
                <div className="text-2xl font-bold">
                  {BigInt(volume.totalGasUsed).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Total Transactions
                </div>
                <div className="text-2xl font-bold">
                  {volume.totalTransactions.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Addresses Breakdown */}
      {addresses && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Active Addresses</CardTitle>
            <CardDescription>Address activity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Total Active
                </div>
                <div className="text-2xl font-bold">
                  {addresses.totalActive.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Unique Senders
                </div>
                <div className="text-2xl font-bold">
                  {addresses.uniqueSenders.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Unique Receivers
                </div>
                <div className="text-2xl font-bold">
                  {addresses.uniqueReceivers.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Block Stats Chart */}
      {blockStats.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Transaction Activity Over Time</CardTitle>
            <CardDescription>Transaction count per block</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blockStats.map((stat, index) => {
                const maxTx = Math.max(
                  ...blockStats.map((s) => s.transactionCount),
                );
                const width =
                  maxTx > 0 ? (stat.transactionCount / maxTx) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-20">
                      <Link
                        href={`/block/${stat.blockNumber}`}
                        className="text-xs font-mono text-primary hover:underline"
                      >
                        #{stat.blockNumber}
                      </Link>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all flex items-center justify-end px-2"
                        style={{ width: `${width}%` }}
                      >
                        {width > 20 && (
                          <span className="text-xs font-semibold text-white">
                            {stat.transactionCount} tx
                          </span>
                        )}
                      </div>
                    </div>
                    {width <= 20 && (
                      <div className="text-sm w-20 text-muted-foreground">
                        {stat.transactionCount} tx
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {blockStats.length} sample points from last {blockRange}{" "}
              blocks
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gas Usage Chart */}
      {blockStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gas Usage Over Time</CardTitle>
            <CardDescription>Gas consumption per block</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blockStats.map((stat, index) => {
                const maxGas = Math.max(
                  ...blockStats.map((s) => Number(s.gasUsed)),
                );
                const width =
                  maxGas > 0 ? (Number(stat.gasUsed) / maxGas) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-20">
                      <Link
                        href={`/block/${stat.blockNumber}`}
                        className="text-xs font-mono text-primary hover:underline"
                      >
                        #{stat.blockNumber}
                      </Link>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all flex items-center justify-end px-2"
                        style={{ width: `${width}%` }}
                      >
                        {width > 20 && (
                          <span className="text-xs font-semibold text-white">
                            {(Number(stat.gasUsed) / 1e6).toFixed(2)}M
                          </span>
                        )}
                      </div>
                    </div>
                    {width <= 20 && (
                      <div className="text-sm w-32 text-muted-foreground">
                        {(Number(stat.gasUsed) / 1e6).toFixed(2)}M
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Gas usage displayed in millions (M)
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
