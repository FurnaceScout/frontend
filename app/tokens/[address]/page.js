"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
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
  exportTransfersToCSV,
  paginateTransfers,
  sortTransfers,
} from "@/lib/token-transfers";
import {
  detectTokenType,
  formatTokenAmount,
  parseTokenTransfers,
} from "@/lib/tokens";
import { publicClient, shortenAddress } from "@/lib/viem";

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
  const [pageSize, _setPageSize] = useState(25);

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

        // Detect token type
        const info = await detectTokenType(address);
        setTokenInfo(info);

        // Get token transfers from recent blocks
        // For demo, we scan last 5000 blocks
        // In production, you'd want to use indexed events or a subgraph
        const latestBlock = await publicClient.getBlockNumber();
        const _fromBlock = latestBlock - 5000n;

        const allTransfers = [];
        const uniqueSenders = new Set();
        const uniqueReceivers = new Set();
        let totalVolume = 0n;

        // Fetch blocks in batches
        const block = await publicClient.getBlock({
          blockNumber: latestBlock,
          includeTransactions: true,
        });

        // Process transactions
        for (const tx of block.transactions.slice(0, 10)) {
          // Get receipt for logs
          const receipt = await publicClient.getTransactionReceipt({
            hash: tx,
          });

          // Parse token transfers from logs
          try {
            const txTransfers = parseTokenTransfers(
              receipt.logs,
              address.toLowerCase(),
            );
            if (txTransfers.length > 0) {
              // Get block for timestamp
              const txBlock = await publicClient.getBlock({
                blockNumber: receipt.blockNumber,
              });

              txTransfers.forEach((t) => {
                const txHash = receipt.transactionHash;
                const blockNumber = Number(receipt.blockNumber);
                const timestamp = Number(txBlock.timestamp);

                allTransfers.push({
                  ...t,
                  txHash,
                  blockNumber,
                  timestamp,
                });

                uniqueSenders.add(t.from.toLowerCase());
                uniqueReceivers.add(t.to.toLowerCase());

                if (t.value) {
                  totalVolume += BigInt(t.value);
                }
              });
            }
          } catch (err) {
            console.warn("Error parsing transfers:", err);
          }
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTokenData();
  }, [address]);

  // Filter and sort transfers
  const filteredTransfers = sortTransfers(
    transfers.filter((transfer) => {
      // Direction filter
      if (
        directionFilter === "in" &&
        transfer.to.toLowerCase() !== addressFilter.toLowerCase()
      ) {
        if (!addressFilter) return false;
        const addressLower = addressFilter.toLowerCase();
        const _fromMatch = transfer.from.toLowerCase().includes(addressLower);
        const toMatch = transfer.to.toLowerCase().includes(addressLower);
        if (!toMatch) return false;
      }
      if (
        directionFilter === "out" &&
        transfer.from.toLowerCase() !== addressFilter.toLowerCase()
      ) {
        if (!addressFilter) return false;
        const addressLower = addressFilter.toLowerCase();
        const fromMatch = transfer.from.toLowerCase().includes(addressLower);
        const _toMatch = transfer.to.toLowerCase().includes(addressLower);
        if (!fromMatch) return false;
      }

      // Address filter
      if (addressFilter) {
        const addressLower = addressFilter.toLowerCase();
        return (
          transfer.from.toLowerCase().includes(addressLower) ||
          transfer.to.toLowerCase().includes(addressLower)
        );
      }

      return true;
    }),
    sortBy,
    sortOrder,
  );

  const paginatedData = paginateTransfers(
    filteredTransfers,
    currentPage,
    pageSize,
  );

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
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold mb-2">Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild>
                <Link href="/tokens">Back to Tokens</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
              <h1 className="text-3xl font-bold">
                {tokenInfo?.metadata?.name || "Unknown Token"}
              </h1>
              <Badge
                variant={
                  tokenInfo?.type === "ERC20"
                    ? "default"
                    : tokenInfo?.type === "ERC721"
                      ? "secondary"
                      : "outline"
                }
              >
                {tokenInfo?.type}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="font-mono">{address}</span>
              {tokenInfo?.metadata?.symbol && (
                <Badge variant="outline">{tokenInfo.metadata.symbol}</Badge>
              )}
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/address/${address}`}>View Contract →</Link>
          </Button>
        </div>

        {/* Token Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">
                Total Transfers
              </div>
              <div className="text-2xl font-bold">
                {stats.totalTransfers.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">
                Unique Senders
              </div>
              <div className="text-2xl font-bold">
                {stats.uniqueSenders.size}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">
                Unique Receivers
              </div>
              <div className="text-2xl font-bold">
                {stats.uniqueReceivers.size}
              </div>
            </CardContent>
          </Card>

          {tokenInfo?.type === "ERC20" && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Total Volume
                </div>
                <div className="text-2xl font-bold">
                  {formatTokenAmount(
                    stats.totalVolume,
                    tokenInfo?.metadata?.decimals || 18,
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {tokenInfo?.metadata?.totalSupply && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Total Supply
                </div>
                <div className="text-2xl font-bold">
                  {formatTokenAmount(
                    BigInt(tokenInfo.metadata.totalSupply),
                    tokenInfo.metadata.decimals || 18,
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Filters and Controls */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transfer History</CardTitle>
            <Button
              onClick={handleExport}
              disabled={filteredTransfers.length === 0}
              size="sm"
            >
              Export CSV ({filteredTransfers.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Address Filter */}
            <div className="space-y-2">
              <Label htmlFor="address-filter">Filter by Address</Label>
              <Input
                id="address-filter"
                type="text"
                value={addressFilter}
                onChange={(e) => setAddressFilter(e.target.value)}
                placeholder="0x..."
                className="font-mono text-sm"
              />
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <Label htmlFor="direction-filter">Direction</Label>
              <Select
                value={directionFilter}
                onValueChange={setDirectionFilter}
              >
                <SelectTrigger id="direction-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Directions</SelectItem>
                  <SelectItem value="in">Incoming</SelectItem>
                  <SelectItem value="out">Outgoing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label htmlFor="sort-by">Sort By</Label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort-by" className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp">Time</SelectItem>
                    <SelectItem value="blockNumber">Block</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer List */}
      {filteredTransfers.length === 0
        ? <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold mb-2">
                  No transfers found
                </h3>
                <p className="text-muted-foreground">
                  No transfers match your current filters
                </p>
              </div>
            </CardContent>
          </Card>
        : <>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {paginatedData.items.map((transfer, index) => (
                    <div
                      key={`${transfer.txHash}-${index}`}
                      className="p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Transfer Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{transfer.type}</Badge>
                            {transfer.timestamp && (
                              <span className="text-sm text-muted-foreground">
                                {new Date(
                                  Number(transfer.timestamp) * 1000,
                                ).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Addresses */}
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <Link
                              href={`/address/${transfer.from}`}
                              className="font-mono hover:text-primary transition-colors"
                            >
                              <LabelBadge
                                address={transfer.from}
                                fallback={shortenAddress(transfer.from, 6)}
                              />
                            </Link>
                            <span className="text-muted-foreground">→</span>
                            <Link
                              href={`/address/${transfer.to}`}
                              className="font-mono hover:text-primary transition-colors"
                            >
                              <LabelBadge
                                address={transfer.to}
                                fallback={shortenAddress(transfer.to, 6)}
                              />
                            </Link>
                          </div>

                          {/* Transaction & Block */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <Link
                              href={`/tx/${transfer.txHash}`}
                              className="hover:text-primary font-mono"
                            >
                              TX: {shortenAddress(transfer.txHash, 4)}
                            </Link>
                            <span>Block #{transfer.blockNumber}</span>
                          </div>
                        </div>

                        {/* Right: Amount */}
                        <div className="text-right">
                          {transfer.type.startsWith("ERC20") && transfer.value
                            ? <div className="font-bold">
                                {formatTokenAmount(
                                  BigInt(transfer.value),
                                  tokenInfo?.metadata?.decimals || 18,
                                )}
                                {tokenInfo?.metadata?.symbol && (
                                  <span className="text-sm text-muted-foreground ml-1">
                                    {tokenInfo.metadata.symbol}
                                  </span>
                                )}
                              </div>
                            : transfer.type.startsWith("ERC721") &&
                                transfer.tokenId
                              ? <div className="font-mono text-sm">
                                  NFT #{transfer.tokenId}
                                </div>
                              : transfer.type === "ERC1155"
                                ? <div className="font-mono text-sm">
                                    ID #{transfer.tokenId}
                                    <br />× {transfer.value}
                                  </div>
                                : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {paginatedData.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredTransfers.length)}{" "}
                  of {filteredTransfers.length} transfers
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
          </>}
    </div>
  );
}
