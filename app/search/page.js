"use client";

import { useState, useEffect } from "react";
import {
  searchTransactions,
  getSearchHistory,
  saveSearchToHistory,
  deleteSearchFromHistory,
  clearSearchHistory,
  loadSearchFromHistory,
  getCommonMethodIds,
  formatSearchCriteria,
  validateSearchCriteria,
  exportResultsAsCSV,
  downloadCSV,
} from "@/lib/search";
import { formatEther, shortenAddress } from "@/lib/viem";
import Link from "next/link";

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
  const [activeTab, setActiveTab] = useState("search"); // 'search' | 'history'

  useEffect(() => {
    loadHistory();

    // Listen for history updates
    const handleUpdate = () => loadHistory();
    window.addEventListener("searchHistoryUpdated", handleUpdate);
    return () => window.removeEventListener("searchHistoryUpdated", handleUpdate);
  }, []);

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
      startBlock: startBlock ? parseInt(startBlock) : null,
      endBlock: endBlock ? parseInt(endBlock) : null,
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
      setErrors(["Search failed: " + error.message]);
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
      setActiveTab("search");
    }
  }

  function handleExport() {
    const csv = exportResultsAsCSV(results);
    downloadCSV(csv, `search-results-${Date.now()}.csv`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          🔍 Advanced Search
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Search transactions with multiple criteria and filters
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "search"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            History ({searchHistory.length})
          </button>
        </div>
      </div>

      {/* Search Tab */}
      {activeTab === "search" && (
        <div>
          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Search Criteria
            </h2>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
                  Validation Errors:
                </div>
                <ul className="text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Query */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  General Query
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Address, transaction hash, or partial match..."
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Method ID */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Method ID (Function Selector)
                </label>
                <input
                  type="text"
                  value={methodId}
                  onChange={(e) => setMethodId(e.target.value)}
                  placeholder="e.g., 0xa9059cbb"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="mt-2">
                  <select
                    value={methodId}
                    onChange={(e) => setMethodId(e.target.value)}
                    className="text-xs px-2 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Select common method...</option>
                    {getCommonMethodIds().map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Value Range */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Min Value (ETH)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Max Value (ETH)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  placeholder="∞"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Block Range */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Start Block
                </label>
                <input
                  type="number"
                  value={startBlock}
                  onChange={(e) => setStartBlock(e.target.value)}
                  placeholder="Auto (last 100 blocks)"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  End Block
                </label>
                <input
                  type="number"
                  value={endBlock}
                  onChange={(e) => setEndBlock(e.target.value)}
                  placeholder="Latest"
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Address Filters */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  From Address
                </label>
                <input
                  type="text"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  To Address
                </label>
                <input
                  type="text"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Result Limit */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Result Limit
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value={10}>10 results</option>
                  <option value={25}>25 results</option>
                  <option value={50}>50 results</option>
                  <option value={100}>100 results</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={searching}
                className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {searching ? "Searching..." : "🔍 Search"}
              </button>
              <button
                type="button"
                onClick={handleClearForm}
                className="px-6 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Search Results ({results.length})
                </h2>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  📥 Export CSV
                </button>
              </div>

              <div className="space-y-3">
                {results.map((tx) => (
                  <Link
                    key={tx.hash}
                    href={`/tx/${tx.hash}`}
                    className="block p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-red-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            tx.status === "success"
                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {tx.status === "success" ? "✓" : "✗"}
                        </span>
                        <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                          {shortenAddress(tx.hash, 8)}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        Block #{tx.blockNumber?.toString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-zinc-500 mb-1">From</div>
                        <div className="font-mono text-zinc-900 dark:text-zinc-100">
                          {shortenAddress(tx.from)}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 mb-1">To</div>
                        <div className="font-mono text-zinc-900 dark:text-zinc-100">
                          {tx.to ? shortenAddress(tx.to) : "Contract Creation"}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 mb-1">Value</div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatEther(tx.value)} ETH
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 mb-1">Gas Used</div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {tx.gasUsed?.toString() || "N/A"}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!searching && results.length === 0 && query && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                No results found. Try adjusting your search criteria.
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Search History
            </h2>
            {searchHistory.length > 0 && (
              <button
                onClick={clearSearchHistory}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {searchHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📜</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                No search history yet
              </div>
              <div className="text-sm text-zinc-500 mt-2">
                Your searches will appear here
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {searchHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                        {formatSearchCriteria(entry.criteria)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(entry.timestamp).toLocaleString()} •{" "}
                        {entry.resultCount} result{entry.resultCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleLoadSearch(entry.id)}
                        className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteSearchFromHistory(entry.id)}
                        className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
