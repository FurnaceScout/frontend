"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LabelBadge from "@/app/components/LabelBadge";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  fetchBlocksBatched,
  fetchReceiptsBatched,
  getLatestBlockNumber,
} from "@/lib/block-utils";
import {
  exportTransfersToCSV,
  filterTransfers,
  getTokenTransferStats,
  groupTransfersByToken,
  paginateTransfers,
  searchTransfers,
  sortTransfers,
} from "@/lib/token-transfers";
import {
  detectTokenType,
  formatTokenAmount,
  parseTokenTransfers,
} from "@/lib/tokens";
import { shortenAddress } from "@/lib/viem";

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
  const [pageSize, _setPageSize] = useState(25);

  // View mode
  const [viewMode, setViewMode] = useState("list"); // 'list', 'grouped'

  // Load recent token transfers
  useEffect(() => {
    async function loadRecentTransfers() {
      try {
        setLoading(true);
        const latestBlock = await getLatestBlockNumber();
        const fromBlock = latestBlock - 500n > 0n ? latestBlock - 500n : 0n;

        // Fetch all blocks in parallel batches
        const blocks = await fetchBlocksBatched(fromBlock, latestBlock, {
          includeTransactions: true,
          batchSize: 10,
        });

        // Sort blocks by number descending (newest first)
        blocks.sort((a, b) => Number(b.number) - Number(a.number));

        // Collect all transaction hashes and create lookup map
        const txHashToBlock = new Map();
        for (const block of blocks) {
          if (!block || !block.transactions) continue;
          for (const tx of block.transactions) {
            const hash = typeof tx === "string" ? tx : tx.hash;
            txHashToBlock.set(hash.toLowerCase(), block);
          }
        }

        // Fetch all receipts in parallel batches
        const allHashes = Array.from(txHashToBlock.keys());
        const receipts = await fetchReceiptsBatched(allHashes, {
          batchSize: 20,
        });

        // Process receipts and extract token transfers
        const allTransfers = [];
        const metadataMap = {};

        for (const receipt of receipts) {
          if (!receipt || !receipt.logs || receipt.logs.length === 0) continue;

          const block = txHashToBlock.get(
            receipt.transactionHash.toLowerCase(),
          );
          if (!block) continue;

          const txTransfers = parseTokenTransfers(receipt.logs);

          for (const transfer of txTransfers) {
            allTransfers.push({
              ...transfer,
              txHash: receipt.transactionHash,
              blockNumber: block.number.toString(),
              timestamp: block.timestamp,
            });

            // Queue token metadata fetch
            if (!metadataMap[transfer.token.toLowerCase()]) {
              metadataMap[transfer.token.toLowerCase()] = null;
            }
          }

          // Limit to reasonable number
          if (allTransfers.length >= 500) break;
        }

        // Sort transfers by block number descending
        allTransfers.sort((a, b) => {
          const blockDiff = Number(b.blockNumber) - Number(a.blockNumber);
          if (blockDiff !== 0) return blockDiff;
          return Number(b.timestamp) - Number(a.timestamp);
        });

        setTransfers(allTransfers.slice(0, 500));
        setFilteredTransfers(allTransfers.slice(0, 500));

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
              console.error(
                `Error fetching metadata for ${tokenAddress}:`,
                error,
              );
            }
          }),
        );

        setTokenMetadata(metadata);

        // Calculate stats
        const transferStats = await getTokenTransferStats(
          allTransfers.slice(0, 500),
        );
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
  const paginatedData = paginateTransfers(
    filteredTransfers,
    currentPage,
    pageSize,
  );

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
          Browse and filter token transfers across all standards (ERC20, ERC721,
          ERC1155)
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
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
              ERC20
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.byType.ERC20}
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">
              ERC721
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.byType.ERC721}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="text-sm text-green-600 dark:text-green-400 mb-1">
              ERC1155
            </div>
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
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear All
              </Button>
              <Button
                onClick={handleExport}
                disabled={filteredTransfers.length === 0}
                variant="destructive"
                size="sm"
              >
                Export CSV ({filteredTransfers.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                type="text"
                value={filters.searchQuery}
                onChange={(e) =>
                  handleFilterChange("searchQuery", e.target.value)
                }
                placeholder="Address, token, tx hash..."
              />
            </div>

            {/* Token Type */}
            <div className="space-y-2">
              <Label htmlFor="token-type">Token Type</Label>
              <Select
                value={filters.tokenType || "all"}
                onValueChange={(value) =>
                  handleFilterChange("tokenType", value === "all" ? "" : value)
                }
              >
                <SelectTrigger id="token-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ERC20">ERC20</SelectItem>
                  <SelectItem value="ERC721">ERC721</SelectItem>
                  <SelectItem value="ERC1155">ERC1155</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <Select
                value={filters.direction}
                onValueChange={(value) =>
                  handleFilterChange("direction", value)
                }
              >
                <SelectTrigger id="direction">
                  <SelectValue placeholder="All Directions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="in">Incoming</SelectItem>
                  <SelectItem value="out">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Token Address */}
            <div className="space-y-2">
              <Label htmlFor="token-address">Token Address</Label>
              <Input
                id="token-address"
                type="text"
                value={filters.tokenAddress}
                onChange={(e) =>
                  handleFilterChange("tokenAddress", e.target.value)
                }
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>

            {/* Address Filter */}
            <div className="space-y-2">
              <Label htmlFor="address-filter">Address (From/To)</Label>
              <Input
                id="address-filter"
                type="text"
                value={filters.address}
                onChange={(e) => handleFilterChange("address", e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sort and View Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="sort-by" className="text-sm">
              Sort by:
            </Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-by" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Time</SelectItem>
                <SelectItem value="blockNumber">Block</SelectItem>
                <SelectItem value="value">Value</SelectItem>
                <SelectItem value="tokenType">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List View
          </Button>
          <Button
            variant={viewMode === "grouped" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grouped")}
          >
            Grouped by Token
          </Button>
        </div>
      </div>

      {/* Results */}
      {filteredTransfers.length === 0 ? (
        <Card className="p-12 text-center">
          <CardContent>
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No transfers found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button onClick={handleClearFilters} variant="destructive">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <>
          {/* List View */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {paginatedData.items.map((transfer, index) => {
                  const metadata =
                    tokenMetadata[transfer.token.toLowerCase()] || {};
                  const decimals = metadata.decimals || 18;

                  return (
                    <div
                      key={`${transfer.txHash}-${index}`}
                      className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Transfer Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {/* Type Badge */}
                            <Badge
                              variant={
                                transfer.type.startsWith("ERC20")
                                  ? "default"
                                  : transfer.type.startsWith("ERC721")
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {transfer.type}
                            </Badge>

                            {/* Token Name */}
                            {metadata.name && (
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {metadata.name}
                              </span>
                            )}
                            {metadata.symbol && (
                              <span className="text-sm text-zinc-500">
                                ({metadata.symbol})
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
                                {new Date(
                                  Number(transfer.timestamp) * 1000,
                                ).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Amount */}
                        <div className="text-right">
                          {transfer.type.startsWith("ERC20") &&
                          transfer.value ? (
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                              {formatTokenAmount(
                                BigInt(transfer.value),
                                decimals,
                              )}
                            </div>
                          ) : transfer.type.startsWith("ERC721") &&
                            transfer.tokenId ? (
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
            </CardContent>
          </Card>

          {/* Pagination */}
          {paginatedData.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredTransfers.length)} of{" "}
                {filteredTransfers.length} transfers
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!paginatedData.hasPrev}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {paginatedData.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!paginatedData.hasNext}
                >
                  Next
                </Button>
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
                <Card key={tokenAddress}>
                  <CardContent className="p-6">
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
                      <Badge variant="secondary">{group.count} transfers</Badge>
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
                                  metadata.decimals || 18,
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
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
