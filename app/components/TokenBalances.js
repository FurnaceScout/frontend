"use client";

import { useEffect, useState } from "react";
import {
  detectTokenType,
  getTokenBalances,
  extractTokenAddresses,
  formatTokenAmount,
} from "@/lib/tokens";
import { shortenAddress } from "@/lib/viem";
import Link from "next/link";

export default function TokenBalances({ address, transactions }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTokenBalances() {
      if (!transactions || transactions.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Extract token addresses from transaction history
        const tokenAddresses = extractTokenAddresses(transactions);

        if (tokenAddresses.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch balances for all discovered tokens
        const balances = await getTokenBalances(address, tokenAddresses);
        setTokens(balances);
      } catch (err) {
        console.error("Error fetching token balances:", err);
        setError("Failed to load token balances");
      } finally {
        setLoading(false);
      }
    }

    fetchTokenBalances();
  }, [address, transactions]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          Token Balances
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
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          Token Balances
        </h2>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="text-zinc-600 dark:text-zinc-400">{error}</div>
        </div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          Token Balances
        </h2>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🪙</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            No token balances found
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            Tokens will appear here after transactions
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Token Balances
        </h2>
        <span className="text-sm text-zinc-500">
          {tokens.length} token{tokens.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {tokens.map((token, index) => (
          <Link
            key={`${token.token}-${index}`}
            href={`/address/${token.token}`}
            className="block p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-red-500 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Token Type Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      token.type === "ERC20"
                        ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        : token.type === "ERC721"
                          ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                          : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    }`}
                  >
                    {token.type}
                  </span>

                  {/* Token Name/Symbol */}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {token.metadata?.name || "Unknown Token"}
                  </span>
                  {token.metadata?.symbol && (
                    <span className="text-sm text-zinc-500">
                      ({token.metadata.symbol})
                    </span>
                  )}
                </div>

                {/* Token Address */}
                <div className="font-mono text-xs text-zinc-500">
                  {shortenAddress(token.token, 6)}
                </div>
              </div>

              {/* Balance */}
              <div className="text-right ml-4">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  {token.type === "ERC20"
                    ? formatTokenAmount(
                        BigInt(token.balance),
                        token.metadata?.decimals || 18,
                      )
                    : token.balance}{" "}
                  {token.type === "ERC721" && (
                    <span className="text-xs text-zinc-500">NFT{token.balance !== "1" ? "s" : ""}</span>
                  )}
                </div>
                {token.type === "ERC20" && token.metadata?.totalSupply && (
                  <div className="text-xs text-zinc-500 mt-1">
                    Supply:{" "}
                    {formatTokenAmount(
                      BigInt(token.metadata.totalSupply),
                      token.metadata.decimals || 18,
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-xs text-zinc-500 text-center">
          💡 Token balances are detected from transaction history
        </div>
      </div>
    </div>
  );
}
