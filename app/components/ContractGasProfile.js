"use client";

import { useEffect, useState } from "react";
import { analyzeContractGasUsage, formatGas } from "@/lib/gas-profiling";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Alert, AlertDescription } from "@/app/components/ui/alert";

export default function ContractGasProfile({ address }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockRange, setBlockRange] = useState("100");

  useEffect(() => {
    loadAnalysis();
  }, [address, blockRange]);

  async function loadAnalysis() {
    try {
      setLoading(true);
      setError(null);
      const data = await analyzeContractGasUsage(address, Number(blockRange));
      setAnalysis(data);
    } catch (err) {
      console.error("Error loading gas profile:", err);
      setError("Failed to load gas profile");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⛽ Gas Profile</CardTitle>
          <CardDescription>Loading gas usage data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis || analysis.totalTransactions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⛽ Gas Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">⛽</div>
            <div className="text-muted-foreground">
              {error || "No transactions found in recent blocks"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>⛽ Gas Profile</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={blockRange} onValueChange={setBlockRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">Last 50 blocks</SelectItem>
                <SelectItem value="100">Last 100 blocks</SelectItem>
                <SelectItem value="200">Last 200 blocks</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="link" size="sm" asChild>
              <Link href="/gas">View Full Analytics →</Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Total Gas</div>
            <div className="text-lg font-bold text-primary">
              {formatGas(analysis.totalGasUsed, "M")}M
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">
              Transactions
            </div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {analysis.totalTransactions}
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Avg Gas/Tx</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatGas(analysis.averageGasPerTx, "K")}K
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Functions</div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {analysis.functions.length}
            </div>
          </div>
        </div>

        {/* Function Gas Usage */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Gas Usage by Function</h3>

          {analysis.functions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No function calls found
            </div>
          ) : (
            <div className="space-y-3">
              {analysis.functions.slice(0, 5).map((func, index) => (
                <div key={func.selector} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                          {func.functionName}
                        </span>
                        {index === 0 && (
                          <Badge variant="destructive">Top Consumer</Badge>
                        )}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {func.selector}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">
                        {formatGas(func.totalGasUsed, "M")}M
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {func.gasPercentage.toFixed(1)}% of total
                      </div>
                    </div>
                  </div>

                  {/* Gas Usage Bar */}
                  <div className="mb-2">
                    <div className="h-2 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-orange-500"
                        style={{ width: `${func.gasPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Function Stats */}
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-muted-foreground mb-1">Calls</div>
                      <div className="font-semibold">{func.callCount}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Avg Gas</div>
                      <div className="font-semibold">
                        {formatGas(func.avgGasUsed, "K")}K
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Min/Max</div>
                      <div className="font-semibold">
                        {formatGas(func.minGasUsed, "K")}K /{" "}
                        {formatGas(func.maxGasUsed, "K")}K
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Success</div>
                      <Badge
                        variant={
                          func.successRate === 100
                            ? "default"
                            : func.successRate >= 50
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {func.successRate.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {analysis.functions.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="link" asChild>
                    <Link href="/gas">
                      View All {analysis.functions.length} Functions →
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optimization Tips */}
        {analysis.functions.length > 0 && (
          <Alert>
            <AlertDescription>
              <div className="text-sm font-semibold mb-2">
                💡 Optimization Opportunities
              </div>
              <ul className="text-xs space-y-1">
                {analysis.functions[0] && (
                  <li>
                    • <strong>{analysis.functions[0].functionName}</strong> uses{" "}
                    {analysis.functions[0].gasPercentage.toFixed(1)}% of total
                    gas - consider optimization
                  </li>
                )}
                {analysis.functions.some((f) => f.successRate < 100) && (
                  <li>
                    • Some functions have failures - check for revert conditions
                    and error handling
                  </li>
                )}
                {Number(analysis.averageGasPerTx) > 1000000 && (
                  <li>
                    • Average gas per transaction is high - look for
                    opportunities to reduce complexity
                  </li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
