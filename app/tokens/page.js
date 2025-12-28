"use client";

import { useEffect, useState } from "react";
import { publicClient } from "@/lib/viem";
import { parseTokenTransfers, detectTokenType, formatTokenAmount } from "@/lib/tokens";
import {
  filterTransfers,
  sortTransfers,
  exportTransfersToCSV,
  groupTransfersByToken,
  paginateTransfers,
  searchTransfers,
  getTokenTransferStats,
} from "@/lib/token-transfers";
import { shortenAddress } from "@/lib/viem";
import Link from "next/link";
import LabelBadge from "@/app/components/LabelBadge";

export default function TokenTransfersPage() {
  const [transfers, setTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [tokenMetadata, setTokenMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    tokenType: "",
    tokenAddress: "",
    address: "",
    direction: "all",
    searchQuery: "",
    fromBlock: "",
    toBlock: "",
  });

  // Sorting state
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // View mode
  const [viewMode, setViewMode] = useState("list"); // 'list', 'grouped'

  // Load recent token transfers
  useEffect(() => {
    async function loadRecentTransfers() {
      try {
        setLoading(true);
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock - 500n; // Last ~500 blocks

        const allTransfers = [];
        const metadataMap = {};

        // Fetch recent blocks
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

              // Queue token metadata fetch
              if (!metadataMap[transfer.token.toLowerCase()]) {
                metadataMap[transfer.token.toLowerCase()] = null;
              }
            }
          }

          // Limit to reasonable number
          if (allTransfers.length >= 500) break;
        }

        setTransfers(allTransfers);
        setFilteredTransfers(allTransfers);

        // Fetch metadata for all unique tokens
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

        // Calculate stats
        const transferStats = await getTokenTransferStats(allTransfers);
        setStats(transferStats);
      } catch (error) {
        console.error("Error loading token transfers:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRecentTransfers();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...transfers];

    // Apply filters
    result = filterTransfers(result, filters);

    // Apply search
    if (filters.searchQuery) {
      result = searchTransfers(result, filters.searchQuery, tokenMetadata);
    }

    // Apply sorting
    result = sortTransfers(result, sortBy, sortOrder);

    setFilteredTransfers(result);
    setCurrentPage(1); // Reset to first page
  }, [filters, sortBy, sortOrder, transfers, tokenMetadata]);

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Handle export
  const handleExport = () => {
    const csv = exportTransfersToCSV(filteredTransfers, tokenMetadata);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `token-transfers-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      tokenType: "",
      tokenAddress: "",
      address: "",
      direction: "all",
      searchQuery: "",
      fromBlock: "",
      toBlock: "",
    });
  };

  // Paginate results
  const paginatedData = paginateTransfers(filteredTransfers, currentPage, pageSize);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8 text-zinc-900 dark:text-zinc-100">
          Token Transfers
        </h1>
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">
          Token Transfers
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Browse and filter token transfers across all standards (ERC20, ERC721, ERC1155)
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-500 mb-1">Total Transfers</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.total.toLocaleString()}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">ERC20</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.byType.ERC20}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">ERC721</div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.byType.ERC721}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-sm text-green-600 dark:text-green-400 mb-1">ERC1155</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.byType.ERC1155}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="text-sm text-zinc-500 mb-1">Unique Tokens</div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.uniqueTokens}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Filters
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearFilters}
              className="px-3 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleExport}
              disabled={filteredTransfers.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Export CSV ({filteredTransfers.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange("searchQuery", e.target.value)}
              placeholder="Address, token, tx hash..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          {/* Token Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Token Type
            </label>
            <select
              value={filters.tokenType}
              onChange={(e) => handleFilterChange("tokenType", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="">All Types</option>
              <option value="ERC20">ERC20</option>
              <option value="ERC721">ERC721</option>
              <option value="ERC1155">ERC1155</option>
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Direction
            </label>
            <select
              value={filters.direction}
              onChange={(e) => handleFilterChange("direction", e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="all">All Directions</option>
              <option value="in">Incoming</option>
              <option value="out">Outgoing</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Token Address */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Token Address
            </label>
            <input
              type="text"
              value={filters.tokenAddress}
              onChange={(e) => handleFilterChange("tokenAddress", e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none font-mono text-sm"
            />
          </div>

          {/* Address Filter */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Address (From/To)
            </label>
            <input
              type="text"
              value={filters.address}
              onChange={(e) => handleFilterChange("address", e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Sort and View Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-400">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
            >
              <option value="timestamp">Time</option>
              <option value="blockNumber">Block</option>
              <option value="value">Value</option>
              <option value="tokenType">Type</option>
            </select>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm transition-colors"
          >
            {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewMode === "list"
                ? "bg-red-600 text-white"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode("grouped")}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewMode === "grouped"
                ? "bg-red-600 text-white"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            }`}
          >
            Grouped by Token
          </button>
        </div>
      </div>

      {/* Results */}
      {filteredTransfers.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            No transfers found
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "list" ? (
        <>
          {/* List View */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedData.items.map((transfer, index) => {
                const metadata = tokenMetadata[transfer.token.toLowerCase()] || {};
                const decimals = metadata.decimals || 18;

                return (
                  <div key={`${transfer.txHash}-${index}`} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Transfer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {/* Type Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              transfer.type.startsWith("ERC20")
                                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                                : transfer.type.startsWith("ERC721")
                                  ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                                  : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            }`}
                          >
                            {transfer.type}
                          </span>

                          {/* Token Name */}
                          {metadata.name && (
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {metadata.name}
                            </span>
                          )}
                          {metadata.symbol && (
                            <span className="text-sm text-zinc-500">({metadata.symbol})</span>
                          )}
                        </div>

                        {/* Addresses */}
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <Link
                            href={`/address/${transfer.from}`}
                            className="font-mono text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <LabelBadge address={transfer.from} fallback={shortenAddress(transfer.from, 6)} />
                          </Link>
                          <span className="text-zinc-400">→</span>
                          <Link
                            href={`/address/${transfer.to}`}
                            className="font-mono text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <LabelBadge address={transfer.to} fallback={shortenAddress(transfer.to, 6)} />
                          </Link>
                        </div>

                        {/* Token Address & TX */}
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <Link
                            href={`/address/${transfer.token}`}
                            className="hover:text-red-600 dark:hover:text-red-400 font-mono"
                          >
                            Token: {shortenAddress(transfer.token, 4)}
                          </Link>
                          <Link
                            href={`/tx/${transfer.txHash}`}
                            className="hover:text-red-600 dark:hover:text-red-400 font-mono"
                          >
                            TX: {shortenAddress(transfer.txHash, 4)}
                          </Link>
                          <span>Block #{transfer.blockNumber}</span>
                          {transfer.timestamp && (
                            <span>
                              {new Date(Number(transfer.timestamp) * 1000).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Amount */}
                      <div className="text-right">
                        {transfer.type.startsWith("ERC20") && transfer.value ? (
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {formatTokenAmount(BigInt(transfer.value), decimals)}
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
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {paginatedData.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Showing {((currentPage - 1) * pageSize) + 1} to{" "}
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
      ) : (
        /* Grouped View */
        <div className="space-y-4">
          {Object.entries(groupTransfersByToken(paginatedData.items)).map(
            ([tokenAddress, group]) => {
              const metadata = tokenMetadata[tokenAddress] || {};

              return (
                <div
                  key={tokenAddress}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {metadata.name || "Unknown Token"}
                      </h3>
                      <Link
                        href={`/address/${group.token}`}
                        className="font-mono text-sm text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                      >
                        {group.token}
                      </Link>
                    </div>
                    <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {group.count} transfers
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.transfers.map((transfer, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-t border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Link
                            href={`/address/${transfer.from}`}
                            className="font-mono text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400"
                          >
                            {shortenAddress(transfer.from, 4)}
                          </Link>
                          <span className="text-zinc-400">→</span>
                          <Link
                            href={`/address/${transfer.to}`}
                            className="font-mono text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400"
                          >
                            {shortenAddress(transfer.to, 4)}
                          </Link>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                          {transfer.value && (
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatTokenAmount(
                                BigInt(transfer.value),
                                metadata.decimals || 18
                              )}
                            </span>
                          )}
                          <Link
                            href={`/tx/${transfer.txHash}`}
                            className="font-mono hover:text-red-600 dark:hover:text-red-400"
                          >
                            {shortenAddress(transfer.txHash, 4)}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
