"use client";

import { useEffect, useState } from "react";
import { analyzeContractGasUsage, formatGas } from "@/lib/gas-profiling";
import Link from "next/link";

export default function ContractGasProfile({ address }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockRange, setBlockRange] = useState(100);

  useEffect(() => {
    loadAnalysis();
  }, [address, blockRange]);

  async function loadAnalysis() {
    try {
      setLoading(true);
      setError(null);
      const data = await analyzeContractGasUsage(address, blockRange);
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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          ⛽ Gas Profile
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !analysis || analysis.totalTransactions === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          ⛽ Gas Profile
        </h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">⛽</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            {error || "No transactions found in recent blocks"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          ⛽ Gas Profile
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={blockRange}
            onChange={(e) => setBlockRange(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value={50}>Last 50 blocks</option>
            <option value={100}>Last 100 blocks</option>
            <option value={200}>Last 200 blocks</option>
          </select>
          <Link
            href="/gas"
            className="text-sm text-red-600 dark:text-red-400 hover:underline font-semibold"
          >
            View Full Analytics →
          </Link>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">Total Gas</div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400">
            {formatGas(analysis.totalGasUsed, "M")}M
          </div>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">Transactions</div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {analysis.totalTransactions}
          </div>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">Avg Gas/Tx</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatGas(analysis.averageGasPerTx, "K")}K
          </div>
        </div>
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-500 mb-1">Functions</div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {analysis.functions.length}
          </div>
        </div>
      </div>

      {/* Function Gas Usage */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Gas Usage by Function
        </h3>

        {analysis.functions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            No function calls found
          </div>
        ) : (
          <div className="space-y-3">
            {analysis.functions.slice(0, 5).map((func, index) => (
              <div
                key={func.selector}
                className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {func.functionName}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs font-semibold">
                          Top Consumer
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-zinc-500">
                      {func.selector}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {formatGas(func.totalGasUsed, "M")}M
                    </div>
                    <div className="text-xs text-zinc-500">
                      {func.gasPercentage.toFixed(1)}% of total
                    </div>
                  </div>
                </div>

                {/* Gas Usage Bar */}
                <div className="mb-2">
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                      style={{ width: `${func.gasPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Function Stats */}
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-zinc-500 mb-1">Calls</div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {func.callCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Avg Gas</div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatGas(func.avgGasUsed, "K")}K
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Min/Max</div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatGas(func.minGasUsed, "K")}K / {formatGas(func.maxGasUsed, "K")}K
                    </div>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Success</div>
                    <div
                      className={`font-semibold ${
                        func.successRate === 100
                          ? "text-green-600 dark:text-green-400"
                          : func.successRate >= 50
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {func.successRate.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {analysis.functions.length > 5 && (
              <div className="text-center pt-2">
                <Link
                  href="/gas"
                  className="text-sm text-red-600 dark:text-red-400 hover:underline font-semibold"
                >
                  View All {analysis.functions.length} Functions →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optimization Tips */}
      {analysis.functions.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Optimization Opportunities
          </div>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            {analysis.functions[0] && (
              <li>
                • <strong>{analysis.functions[0].functionName}</strong> uses{" "}
                {analysis.functions[0].gasPercentage.toFixed(1)}% of total gas - consider optimization
              </li>
            )}
            {analysis.functions.some((f) => f.successRate < 100) && (
              <li>
                • Some functions have failures - check for revert conditions and error handling
              </li>
            )}
            {Number(analysis.averageGasPerTx) > 1000000 && (
              <li>
                • Average gas per transaction is high - look for opportunities to reduce complexity
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
