"use client";

import { useEffect, useState } from "react";
import { getNetworkHealth } from "@/lib/stats";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";

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
      <Card>
        <CardHeader>
          <CardTitle>📊 Network Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Network Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📊 Network Statistics</CardTitle>
          <Button variant="link" size="sm" asChild>
            <Link href="/stats">View Details →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">
                  Latest Block
                </div>
                <div className="text-xl font-bold text-primary">
                  {stats.latestBlock.toLocaleString()}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">
                  Block Time
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.averageBlockTime.toFixed(2)}s
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">TPS</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  {stats.transactionsPerSecond.toFixed(2)}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">
                  Transactions
                </div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.totalTransactions.toLocaleString()}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">
                  Active Addresses
                </div>
                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.activeAddresses.toLocaleString()}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">
                  Avg Tx/Block
                </div>
                <div className="text-xl font-bold text-pink-600 dark:text-pink-400">
                  {stats.avgTxPerBlock.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-muted-foreground text-center">
              Auto-refreshes every 30 seconds
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
