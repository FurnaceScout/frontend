"use client";

import { use, useEffect, useState } from "react";
import { publicClient, shortenAddress } from "@/lib/viem";
import {
  detectTokenType,
  formatTokenAmount,
  parseTokenTransfers,
} from "@/lib/tokens";
import {
  paginateTransfers,
  sortTransfers,
  exportTransfersToCSV,
} from "@/lib/token-transfers";
import Link from "next/link";
import LabelBadge from "@/app/components/LabelBadge";

export default function TokenDetailPage({ params }) {
  const { address } = use(params);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [directionFilter, setDirectionFilter] = useState("all");
  const [addressFilter, setAddressFilter] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Stats
  const [stats, setStats] = useState({
    totalTransfers: 0,
    uniqueSenders: new Set(),
    uniqueReceivers: new Set(),
    totalVolume: 0n,
  });

  useEffect(() => {
    async function loadTokenData() {
      try {
        setLoading(true);
        setError(null);

        // Detect token type and metadata
        const info = await detectTokenType(address);
        if (!info.isToken) {
          setError("This address is not a recognized token contract");
          setLoading(false);
          return;
        }

        setTokenInfo(info);

        // Fetch recent blocks and parse transfers
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock - 500n; // Last ~500 blocks

        const allTransfers = [];
        const uniqueSenders = new Set();
        const uniqueReceivers = new Set();
        let totalVolume = 0n;

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

            if (!receipt || !receipt.logs || receipt.logs.length === 0)
              continue;

            const txTransfers = parseTokenTransfers(receipt.logs);

            for (const transfer of txTransfers) {
              // Only include transfers for this token
              if (transfer.token.toLowerCase() !== address.toLowerCase())
                continue;

              allTransfers.push({
                ...transfer,
                txHash: tx.hash,
                blockNumber: block.number.toString(),
                timestamp: block.timestamp,
              });

              // Track stats
              uniqueSenders.add(transfer.from.toLowerCase());
              uniqueReceivers.add(transfer.to.toLowerCase());
              if (transfer.value && info.type === "ERC20") {
                totalVolume += BigInt(transfer.value);
              }
            }
          }

          // Limit to reasonable number
          if (allTransfers.length >= 500) break;
        }

        setTransfers(allTransfers);
        setStats({
          totalTransfers: allTransfers.length,
          uniqueSenders,
          uniqueReceivers,
          totalVolume,
        });
      } catch (err) {
        console.error("Error loading token data:", err);
        setError("Failed to load token data: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTokenData();
  }, [address]);

  // Apply filters and sorting
  const filteredTransfers = transfers
    .filter((transfer) => {
      // Direction filter
      if (directionFilter !== "all" && addressFilter) {
        const addressLower = addressFilter.toLowerCase();
        const fromMatch = transfer.from.toLowerCase() === addressLower;
        const toMatch = transfer.to.toLowerCase() === addressLower;

        if (directionFilter === "in" && !toMatch) return false;
        if (directionFilter === "out" && !fromMatch) return false;
        if (directionFilter === "all" && !fromMatch && !toMatch) return false;
      } else if (addressFilter) {
        const addressLower = addressFilter.toLowerCase();
        const fromMatch = transfer.from.toLowerCase().includes(addressLower);
        const toMatch = transfer.to.toLowerCase().includes(addressLower);
        if (!fromMatch && !toMatch) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "timestamp":
          aVal = a.timestamp || 0;
          bVal = b.timestamp || 0;
          break;
        case "blockNumber":
          aVal = BigInt(a.blockNumber || 0);
          bVal = BigInt(b.blockNumber || 0);
          break;
        case "value":
          aVal = BigInt(a.value || 0);
          bVal = BigInt(b.value || 0);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const paginatedData = paginateTransfers(filteredTransfers, currentPage, pageSize);

  const handleExport = () => {
    const csv = exportTransfersToCSV(filteredTransfers, {
      [address.toLowerCase()]: tokenInfo?.metadata || {},
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tokenInfo?.metadata?.symbol || "token"}-transfers-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
            Error
          </h2>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <Link
            href="/tokens"
            className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Tokens
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Token Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {tokenInfo?.metadata?.name || "Unknown Token"}
              </h1>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                  tokenInfo?.type === "ERC20"
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                    : tokenInfo?.type === "ERC721"
                      ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                      : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                }`}
              >
                {tokenInfo?.type}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-mono">{address}</span>
              {tokenInfo?.metadata?.symbol && (
                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">
                  {tokenInfo.metadata.symbol}
                </span>
              )}
            </div>
          </div>
          <Link
            href={`/address/${address}`}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors"
          >
            View Contract →
          </Link>
        </div>

        {/* Token Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-500 mb-1">Total Transfers</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalTransfers.toLocaleString()}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-500 mb-1">Unique Senders</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.uniqueSenders.size}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-500 mb-1">Unique Receivers</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.uniqueReceivers.size}
            </div>
          </div>
          {tokenInfo?.type === "ERC20" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <div className="text-sm text-zinc-500 mb-1">Total Volume</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatTokenAmount(
                  stats.totalVolume,
                  tokenInfo?.metadata?.decimals || 18
                )}
              </div>
            </div>
          )}
          {tokenInfo?.metadata?.totalSupply && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
              <div className="text-sm text-zinc-500 mb-1">Total Supply</div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {formatTokenAmount(
                  BigInt(tokenInfo.metadata.totalSupply),
                  tokenInfo.metadata.decimals || 18
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Transfer History
          </h2>
          <button
            onClick={handleExport}
            disabled={filteredTransfers.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Export CSV ({filteredTransfers.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Address Filter */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Filter by Address
            </label>
            <input
              type="text"
              value={addressFilter}
              onChange={(e) => setAddressFilter(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none font-mono text-sm"
            />
          </div>

          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Direction
            </label>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="all">All Directions</option>
              <option value="in">Incoming</option>
              <option value="out">Outgoing</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="timestamp">Time</option>
                <option value="blockNumber">Block</option>
                <option value="value">Value</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer List */}
      {filteredTransfers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            No transfers found
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            No transfers match your current filters
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedData.items.map((transfer, index) => (
                <div
                  key={`${transfer.txHash}-${index}`}
                  className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Transfer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-zinc-500">
                          {transfer.type}
                        </span>
                        {transfer.timestamp && (
                          <span className="text-sm text-zinc-500">
                            {new Date(
                              Number(transfer.timestamp) * 1000
                            ).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Addresses */}
                      <div className="flex items-center gap-2 text-sm mb-2">
                        <Link
                          href={`/address/${transfer.from}`}
                          className="font-mono text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <LabelBadge
                            address={transfer.from}
                            fallback={shortenAddress(transfer.from, 6)}
                          />
                        </Link>
                        <span className="text-zinc-400">→</span>
                        <Link
                          href={`/address/${transfer.to}`}
                          className="font-mono text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <LabelBadge
                            address={transfer.to}
                            fallback={shortenAddress(transfer.to, 6)}
                          />
                        </Link>
                      </div>

                      {/* Transaction & Block */}
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <Link
                          href={`/tx/${transfer.txHash}`}
                          className="hover:text-red-600 dark:hover:text-red-400 font-mono"
                        >
                          TX: {shortenAddress(transfer.txHash, 4)}
                        </Link>
                        <span>Block #{transfer.blockNumber}</span>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right">
                      {transfer.type.startsWith("ERC20") && transfer.value ? (
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {formatTokenAmount(
                            BigInt(transfer.value),
                            tokenInfo?.metadata?.decimals || 18
                          )}
                          {tokenInfo?.metadata?.symbol && (
                            <span className="text-sm text-zinc-500 ml-1">
                              {tokenInfo.metadata.symbol}
                            </span>
                          )}
                        </div>
                      ) : transfer.type.startsWith("ERC721") && transfer.tokenId ? (
                        <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                          NFT #{transfer.tokenId}
                        </div>
                      ) : transfer.type === "ERC1155" ? (
                        <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                          ID #{transfer.tokenId}
                          <br />× {transfer.value}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {paginatedData.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredTransfers.length)} of{" "}
                {filteredTransfers.length} transfers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!paginatedData.hasPrev}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 dark:text-zinc-100 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Page {currentPage} of {paginatedData.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!paginatedData.hasNext}
                  className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 dark:text-zinc-100 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
