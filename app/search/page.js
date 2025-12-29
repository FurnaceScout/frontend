"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  clearSearchHistory,
  deleteSearchFromHistory,
  downloadCSV,
  exportResultsAsCSV,
  formatSearchCriteria,
  getCommonMethodIds,
  getSearchHistory,
  loadSearchFromHistory,
  saveSearchToHistory,
  searchTransactions,
  validateSearchCriteria,
} from "@/lib/search";
import { formatEther, shortenAddress } from "@/lib/viem";

export default function AdvancedSearchPage() {
  // Form state
  const [query, setQuery] = useState("");
  const [methodId, setMethodId] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [startBlock, setStartBlock] = useState("");
  const [endBlock, setEndBlock] = useState("");
  const [status, setStatus] = useState("all");
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [limit, setLimit] = useState(50);

  // Results state
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    loadHistory();

    // Listen for history updates
    const handleUpdate = () => loadHistory();
    window.addEventListener("searchHistoryUpdated", handleUpdate);
    return () =>
      window.removeEventListener("searchHistoryUpdated", handleUpdate);
  }, [loadHistory]);

  function loadHistory() {
    const history = getSearchHistory();
    setSearchHistory(history);
  }

  async function handleSearch(e) {
    e.preventDefault();
    setErrors([]);

    const criteria = {
      query,
      methodId,
      minValue,
      maxValue,
      startBlock: startBlock ? parseInt(startBlock, 10) : null,
      endBlock: endBlock ? parseInt(endBlock, 10) : null,
      status,
      fromAddress,
      toAddress,
      limit,
    };

    // Validate
    const validation = validateSearchCriteria(criteria);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSearching(true);
      const searchResults = await searchTransactions(criteria);
      setResults(searchResults);

      // Save to history
      saveSearchToHistory(criteria, searchResults.length);
      loadHistory();
    } catch (error) {
      console.error("Search error:", error);
      setErrors([`Search failed: ${error.message}`]);
    } finally {
      setSearching(false);
    }
  }

  function handleClearForm() {
    setQuery("");
    setMethodId("");
    setMinValue("");
    setMaxValue("");
    setStartBlock("");
    setEndBlock("");
    setStatus("all");
    setFromAddress("");
    setToAddress("");
    setResults([]);
    setErrors([]);
  }

  function handleLoadSearch(searchId) {
    const criteria = loadSearchFromHistory(searchId);
    if (criteria) {
      setQuery(criteria.query || "");
      setMethodId(criteria.methodId || "");
      setMinValue(criteria.minValue || "");
      setMaxValue(criteria.maxValue || "");
      setStartBlock(criteria.startBlock?.toString() || "");
      setEndBlock(criteria.endBlock?.toString() || "");
      setStatus(criteria.status || "all");
      setFromAddress(criteria.fromAddress || "");
      setToAddress(criteria.toAddress || "");
      setLimit(criteria.limit || 50);
    }
  }

  function handleExport() {
    const csv = exportResultsAsCSV(results);
    downloadCSV(csv, `search-results-${Date.now()}.csv`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔍 Advanced Search</h1>
        <p className="text-muted-foreground">
          Search transactions with multiple criteria and filters
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="search" className="w-full">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="history">
            History ({searchHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search">
          {/* Search Form */}
          <form onSubmit={handleSearch}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Search Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Errors */}
                {errors.length > 0 && (
                  <Card className="mb-4 border-destructive bg-destructive/10">
                    <CardContent className="pt-6">
                      <div className="text-sm font-semibold mb-2">
                        Validation Errors:
                      </div>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Query */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="query">General Query</Label>
                    <Input
                      id="query"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Address, transaction hash, or partial match..."
                    />
                  </div>

                  {/* Method ID */}
                  <div className="space-y-2">
                    <Label htmlFor="method-id">
                      Method ID (Function Selector)
                    </Label>
                    <Input
                      id="method-id"
                      type="text"
                      value={methodId}
                      onChange={(e) => setMethodId(e.target.value)}
                      placeholder="e.g., 0xa9059cbb"
                      className="font-mono"
                    />
                    <Select value={methodId} onValueChange={setMethodId}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Select common method..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          Select common method...
                        </SelectItem>
                        {getCommonMethodIds().map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Value Range */}
                  <div className="space-y-2">
                    <Label htmlFor="min-value">Min Value (ETH)</Label>
                    <Input
                      id="min-value"
                      type="number"
                      step="0.000001"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value)}
                      placeholder="0.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-value">Max Value (ETH)</Label>
                    <Input
                      id="max-value"
                      type="number"
                      step="0.000001"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value)}
                      placeholder="∞"
                    />
                  </div>

                  {/* Block Range */}
                  <div className="space-y-2">
                    <Label htmlFor="start-block">Start Block</Label>
                    <Input
                      id="start-block"
                      type="number"
                      value={startBlock}
                      onChange={(e) => setStartBlock(e.target.value)}
                      placeholder="Auto (last 100 blocks)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-block">End Block</Label>
                    <Input
                      id="end-block"
                      type="number"
                      value={endBlock}
                      onChange={(e) => setEndBlock(e.target.value)}
                      placeholder="Latest"
                    />
                  </div>

                  {/* Address Filters */}
                  <div className="space-y-2">
                    <Label htmlFor="from-address">From Address</Label>
                    <Input
                      id="from-address"
                      type="text"
                      value={fromAddress}
                      onChange={(e) => setFromAddress(e.target.value)}
                      placeholder="0x..."
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="to-address">To Address</Label>
                    <Input
                      id="to-address"
                      type="text"
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      placeholder="0x..."
                      className="font-mono"
                    />
                  </div>

                  {/* Result Limit */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="limit">Result Limit</Label>
                    <Select
                      value={limit.toString()}
                      onValueChange={(value) => setLimit(parseInt(value, 10))}
                    >
                      <SelectTrigger id="limit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 results</SelectItem>
                        <SelectItem value="25">25 results</SelectItem>
                        <SelectItem value="50">50 results</SelectItem>
                        <SelectItem value="100">100 results</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <Button type="submit" disabled={searching}>
                    {searching ? "Searching..." : "🔍 Search"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClearForm}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Search Results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Search Results ({results.length})</CardTitle>
                  <Button onClick={handleExport} size="sm" variant="outline">
                    📥 Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((tx) => (
                    <Link
                      key={tx.hash}
                      href={`/tx/${tx.hash}`}
                      className="block p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              tx.status === "success"
                                ? "default"
                                : "destructive"
                            }
                            className={
                              tx.status === "success"
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }
                          >
                            {tx.status === "success" ? "✓" : "✗"}
                          </Badge>
                          <span className="font-mono text-sm">
                            {shortenAddress(tx.hash, 8)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Block #{tx.blockNumber?.toString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-muted-foreground mb-1">From</div>
                          <div className="font-mono">
                            {shortenAddress(tx.from)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">To</div>
                          <div className="font-mono">
                            {tx.to
                              ? shortenAddress(tx.to)
                              : "Contract Creation"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">
                            Value
                          </div>
                          <div className="font-semibold">
                            {formatEther(tx.value)} ETH
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">
                            Gas Used
                          </div>
                          <div className="font-semibold">
                            {tx.gasUsed?.toString() || "N/A"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!searching && results.length === 0 && query && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="text-muted-foreground">
                    No results found. Try adjusting your search criteria.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Search History</CardTitle>
                {searchHistory.length > 0 && (
                  <Button
                    onClick={clearSearchHistory}
                    variant="destructive"
                    size="sm"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {searchHistory.length === 0
                ? <div className="text-center py-12">
                    <div className="text-4xl mb-3">📜</div>
                    <div className="text-muted-foreground">
                      No search history yet
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Your searches will appear here
                    </div>
                  </div>
                : <div className="space-y-3">
                    {searchHistory.map((entry) => (
                      <Card key={entry.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-sm text-muted-foreground mb-1">
                                {formatSearchCriteria(entry.criteria)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleString()} •{" "}
                                <Badge variant="outline" className="text-xs">
                                  {entry.resultCount} result
                                  {entry.resultCount !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                onClick={() => handleLoadSearch(entry.id)}
                                variant="outline"
                                size="sm"
                              >
                                Load
                              </Button>
                              <Button
                                onClick={() =>
                                  deleteSearchFromHistory(entry.id)
                                }
                                variant="destructive"
                                size="sm"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
