"use client";

import { useEffect, useState } from "react";
import { publicClient, shortenAddress } from "@/lib/viem";
import { parseTokenTransfers, detectTokenType, formatTokenAmount } from "@/lib/tokens";
import Link from "next/link";
import LabelBadge from "./LabelBadge";

export default function RecentTokenTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [tokenMetadata, setTokenMetadata] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecentTransfers() {
      try {
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock - 50n; // Last ~50 blocks

        const allTransfers = [];
        const metadataMap = {};

        for (let i = latestBlock; i > fromBlock; i--) {
          const block = await publicClient.getBlock({
            blockNumber: i,
            includeTransactions: true,
          });

          if (!block || !block.transactions) continue;

          for (const tx of block.transactions) {
            const receipt = await publicClient
              .getTransactionReceipt({ hash: tx.hash })
              .catch(() => null);

            if (!receipt || !receipt.logs || receipt.logs.length === 0) continue;

            const txTransfers = parseTokenTransfers(receipt.logs);

            for (const transfer of txTransfers) {
              allTransfers.push({
                ...transfer,
                txHash: tx.hash,
                blockNumber: block.number.toString(),
                timestamp: block.timestamp,
              });

              if (!metadataMap[transfer.token.toLowerCase()]) {
                metadataMap[transfer.token.toLowerCase()] = null;
              }
            }
          }

          if (allTransfers.length >= 20) break;
        }

        setTransfers(allTransfers.slice(0, 20));

        // Fetch metadata for unique tokens
        const uniqueTokens = Object.keys(metadataMap);
        const metadata = {};

        await Promise.all(
          uniqueTokens.map(async (tokenAddress) => {
            try {
              const info = await detectTokenType(tokenAddress);
              if (info.isToken) {
                metadata[tokenAddress] = {
                  type: info.type,
                  ...info.metadata,
                };
              }
            } catch (error) {
              console.error(`Error fetching metadata for ${tokenAddress}:`, error);
            }
          })
        );

        setTokenMetadata(metadata);
      } catch (error) {
        console.error("Error loading recent token transfers:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRecentTransfers();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Recent Token Transfers
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Recent Token Transfers
          </h2>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🪙</div>
          <div className="text-zinc-600 dark:text-zinc-400">
            No recent token transfers
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Recent Token Transfers
        </h2>
        <Link
          href="/tokens"
          className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-3">
        {transfers.map((transfer, index) => {
          const metadata = tokenMetadata[transfer.token.toLowerCase()] || {};
          const decimals = metadata.decimals || 18;

          return (
            <div
              key={`${transfer.txHash}-${index}`}
              className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-red-500 dark:hover:border-red-500 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: Type & Token Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                        transfer.type.startsWith("ERC20")
                          ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          : transfer.type.startsWith("ERC721")
                            ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                            : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      }`}
                    >
                      {transfer.type}
                    </span>
                    {metadata.name && (
                      <Link
                        href={`/tokens/${transfer.token}`}
                        className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 truncate"
                      >
                        {metadata.name}
                      </Link>
                    )}
                    {metadata.symbol && (
                      <span className="text-xs text-zinc-500">
                        ({metadata.symbol})
                      </span>
                    )}
                  </div>

                  {/* Addresses */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Link
                      href={`/address/${transfer.from}`}
                      className="font-mono text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <LabelBadge
                        address={transfer.from}
                        fallback={shortenAddress(transfer.from, 4)}
                      />
                    </Link>
                    <span className="text-zinc-400 text-xs">→</span>
                    <Link
                      href={`/address/${transfer.to}`}
                      className="font-mono text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <LabelBadge
                        address={transfer.to}
                        fallback={shortenAddress(transfer.to, 4)}
                      />
                    </Link>
                  </div>

                  {/* TX Hash */}
                  <Link
                    href={`/tx/${transfer.txHash}`}
                    className="text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400 font-mono mt-1 block"
                  >
                    {shortenAddress(transfer.txHash, 4)}
                  </Link>
                </div>

                {/* Right: Amount/Value */}
                <div className="text-right text-sm">
                  {transfer.type.startsWith("ERC20") && transfer.value ? (
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatTokenAmount(BigInt(transfer.value), decimals)}
                    </div>
                  ) : transfer.type.startsWith("ERC721") && transfer.tokenId ? (
                    <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                      #{transfer.tokenId}
                    </div>
                  ) : transfer.type === "ERC1155" ? (
                    <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                      #{transfer.tokenId}×{transfer.value}
                    </div>
                  ) : null}
                  {transfer.timestamp && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {new Date(Number(transfer.timestamp) * 1000).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/tokens"
          className="block text-center text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
        >
          View All Token Transfers →
        </Link>
      </div>
    </div>
  );
}
