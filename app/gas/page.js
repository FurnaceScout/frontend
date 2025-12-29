"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  formatGas,
  getGasStatistics,
  getGasTrends,
  getTopGasConsumers,
} from "@/lib/gas-profiling";
import { formatEther, shortenAddress } from "@/lib/viem";

export default function GasAnalyticsPage() {
  const [topConsumers, setTopConsumers] = useState([]);
  const [trends, setTrends] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockRange, setBlockRange] = useState("100");

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function loadData() {
    try {
      setLoading(true);

      const blockCount = parseInt(blockRange, 10);
      const [consumersData, trendsData, statsData] = await Promise.all([
        getTopGasConsumers(blockCount, 10),
        getGasTrends(blockCount, 20),
        getGasStatistics(blockCount),
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
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">⛽ Gas Profiling Dashboard</h1>
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
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="default"
            >
              {refreshing ? "Refreshing..." : "🔄 Refresh"}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          Analyze gas consumption patterns and identify optimization
          opportunities
        </p>
      </div>

      {/* Summary Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Gas Used</CardDescription>
              <CardTitle className="text-2xl text-red-600 dark:text-red-400">
                {formatGas(statistics.totalGasUsed, "M")}M
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Last {blockRange} blocks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Gas/Block</CardDescription>
              <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">
                {formatGas(statistics.averageGasUsedPerBlock, "M")}M
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Per block average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Gas/Tx</CardDescription>
              <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                {formatGas(statistics.averageGasPerTransaction, "K")}K
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Per transaction average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Gas Utilization</CardDescription>
              <CardTitle className="text-2xl text-purple-600 dark:text-purple-400">
                {statistics.overallUtilization.toFixed(1)}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Of block gas limit
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="consumers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consumers">Top Consumers</TabsTrigger>
          <TabsTrigger value="trends">Gas Trends</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Top Gas Consumers Tab */}
        <TabsContent value="consumers">
          <Card>
            <CardHeader>
              <CardTitle>Top Gas Consuming Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              {topConsumers.length === 0
                ? <div className="text-center py-12">
                    <div className="text-4xl mb-3">⛽</div>
                    <div className="text-muted-foreground">
                      No contract interactions found
                    </div>
                  </div>
                : <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Rank</TableHead>
                        <TableHead>Contract</TableHead>
                        <TableHead className="text-right">Total Gas</TableHead>
                        <TableHead className="text-right">
                          Transactions
                        </TableHead>
                        <TableHead className="text-right">Avg Gas/Tx</TableHead>
                        <TableHead className="text-right">
                          Success Rate
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topConsumers.map((consumer, index) => (
                        <TableRow key={consumer.address}>
                          <TableCell>
                            <span
                              className={`text-lg font-bold ${
                                index === 0
                                  ? "text-yellow-600"
                                  : index === 1
                                    ? "text-gray-400"
                                    : index === 2
                                      ? "text-orange-600"
                                      : "text-muted-foreground"
                              }`}
                            >
                              {index === 0
                                ? "🥇"
                                : index === 1
                                  ? "🥈"
                                  : index === 2
                                    ? "🥉"
                                    : `#${index + 1}`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/address/${consumer.address}`}
                              className="font-mono text-sm text-primary hover:underline"
                            >
                              {shortenAddress(consumer.address, 6)}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatGas(consumer.totalGasUsed, "M")}M
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {consumer.transactionCount}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatGas(consumer.averageGasPerTx, "K")}K
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={
                                consumer.successRate === 100
                                  ? "default"
                                  : consumer.successRate >= 50
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {consumer.successRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gas Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gas Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length === 0
                ? <div className="text-center py-12">
                    <div className="text-4xl mb-3">📊</div>
                    <div className="text-muted-foreground">
                      No trend data available
                    </div>
                  </div>
                : <div className="space-y-2">
                    {trends.map((trend, index) => {
                      const maxGas = Math.max(
                        ...trends.map((t) => Number(t.totalGasUsed)),
                      );
                      const width =
                        maxGas > 0
                          ? (Number(trend.totalGasUsed) / maxGas) * 100
                          : 0;

                      return (
                        <div
                          key={index}
                          className="flex items-center gap-4 py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors"
                        >
                          <div className="flex-shrink-0 w-20">
                            <Link
                              href={`/block/${trend.blockNumber}`}
                              className="text-sm font-mono text-primary hover:underline"
                            >
                              #{trend.blockNumber}
                            </Link>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-end px-2"
                                  style={{ width: `${width}%` }}
                                >
                                  {width > 20 && (
                                    <span className="text-xs font-semibold text-white">
                                      {formatGas(trend.totalGasUsed, "M")}M
                                    </span>
                                  )}
                                </div>
                              </div>
                              {width <= 20 && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  {formatGas(trend.totalGasUsed, "M")}M
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{trend.transactionCount} txs</span>
                              <span>•</span>
                              <span>
                                {trend.utilization.toFixed(1)}% utilized
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>}
            </CardContent>
          </Card>

          {/* Gas Price Distribution */}
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle>Gas Price Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        Min Gas Price
                      </div>
                      <div className="text-lg font-bold">
                        {formatEther(statistics.minGasPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground">ETH</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        Avg Gas Price
                      </div>
                      <div className="text-lg font-bold">
                        {formatEther(statistics.averageGasPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground">ETH</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        Max Gas Price
                      </div>
                      <div className="text-lg font-bold">
                        {formatEther(statistics.maxGasPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground">ETH</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Statistics</CardTitle>
                <CardDescription>
                  Analysis of {blockRange} blocks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gas Usage */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Gas Usage</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Total Gas Used
                        </span>
                        <span className="font-mono font-semibold">
                          {formatGas(statistics.totalGasUsed, "M")}M
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Total Gas Limit
                        </span>
                        <span className="font-mono font-semibold">
                          {formatGas(statistics.totalGasLimit, "M")}M
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Avg Gas/Block
                        </span>
                        <span className="font-mono font-semibold">
                          {formatGas(statistics.averageGasUsedPerBlock, "M")}M
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Avg Gas/Tx
                        </span>
                        <span className="font-mono font-semibold">
                          {formatGas(statistics.averageGasPerTransaction, "K")}K
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Block Utilization */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Block Utilization</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Overall Utilization
                        </span>
                        <Badge variant="secondary">
                          {statistics.overallUtilization.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Min Utilization
                        </span>
                        <span className="font-semibold">
                          {statistics.minUtilization.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Max Utilization
                        </span>
                        <span className="font-semibold">
                          {statistics.maxUtilization.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Blocks Analyzed
                        </span>
                        <span className="font-semibold">
                          {statistics.blockCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Stats */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Transactions</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Total Transactions
                        </span>
                        <span className="font-semibold">
                          {statistics.totalTransactions.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Avg Txs/Block
                        </span>
                        <span className="font-semibold">
                          {(
                            statistics.totalTransactions / statistics.blockCount
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gas Prices */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Gas Prices</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Min Gas Price
                        </span>
                        <span className="font-mono font-semibold">
                          {formatEther(statistics.minGasPrice)} ETH
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Avg Gas Price
                        </span>
                        <span className="font-mono font-semibold">
                          {formatEther(statistics.averageGasPrice)} ETH
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">
                          Max Gas Price
                        </span>
                        <span className="font-mono font-semibold">
                          {formatEther(statistics.maxGasPrice)} ETH
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
