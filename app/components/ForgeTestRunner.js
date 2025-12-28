"use client";

import { useState, useEffect } from "react";
import {
  runForgeTest,
  getTestHistory,
  deleteTestResult,
  clearTestHistory,
  getTestStatistics,
  exportTestResults,
  exportTestResultsCSV,
  compareTestResults,
  getTestSettings,
  saveTestSettings,
  toggleFavoriteTest,
  isTestFavorite,
  groupTestsByContract,
  sortTests,
  filterTests,
  formatDuration,
  formatGas,
  getTestStatusIcon,
  getTestStatusColor,
} from "@/lib/forge-test";

export default function ForgeTestRunner() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("run"); // run, results, history, settings
  const [running, setRunning] = useState(false);
  const [currentResults, setCurrentResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(getTestSettings());
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareWith, setCompareWith] = useState(null);
  const [comparison, setComparison] = useState(null);

  // Filters
  const [testFilter, setTestFilter] = useState("");
  const [matchContract, setMatchContract] = useState("");
  const [matchTest, setMatchTest] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [groupByContract, setGroupByContract] = useState(true);

  // Load data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      loadData();
    }
  }, []);

  // Refresh data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setHistory(getTestHistory());
    setStats(getTestStatistics());
  };

  const handleRunTests = async () => {
    setRunning(true);
    setError(null);

    try {
      const result = await runForgeTest({
        testFilter,
        matchContract,
        matchTest,
        gasReport: settings.gasReport,
        coverage: settings.coverage,
        verbosity: settings.verbosity,
      });

      setCurrentResults(result);
      setActiveTab("results");
      loadData();
    } catch (err) {
      setError(err.message || "Failed to run tests");
    } finally {
      setRunning(false);
    }
  };

  const handleDeleteHistory = (id) => {
    if (confirm("Delete this test result?")) {
      deleteTestResult(id);
      loadData();
    }
  };

  const handleClearHistory = () => {
    if (
      confirm(
        "Clear all test history? This cannot be undone."
      )
    ) {
      clearTestHistory();
      loadData();
    }
  };

  const handleExport = (format = "json") => {
    const data = format === "json" ? exportTestResults() : exportTestResultsCSV();
    const blob = new Blob([data], {
      type: format === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-results-${Date.now()}.${format}`;
    a.click();
  };

  const handleSaveSettings = () => {
    saveTestSettings(settings);
    alert("Settings saved!");
  };

  const handleViewHistory = (item) => {
    setSelectedHistory(item);
    setCurrentResults({
      results: {
        tests: item.tests,
        summary: item.summary,
        gasReport: item.gasReport,
      },
      success: item.success,
      timestamp: item.timestamp,
    });
    setActiveTab("results");
  };

  const handleCompare = (item) => {
    if (!compareWith) {
      setCompareWith(item);
      setCompareMode(true);
    } else {
      const comp = compareTestResults(compareWith, item);
      setComparison(comp);
      setCompareMode(false);
      setCompareWith(null);
      setActiveTab("results");
    }
  };

  const handleToggleFavorite = (testKey) => {
    toggleFavoriteTest(testKey);
    // Force re-render by creating new results object
    if (currentResults) {
      setCurrentResults({ ...currentResults });
    }
  };

  // Get filtered and sorted tests
  const getProcessedTests = () => {
    if (!currentResults?.results?.tests) return [];

    let tests = currentResults.results.tests;

    // Apply filters
    tests = filterTests(tests, {
      search: searchQuery,
      status: statusFilter,
      contract: contractFilter,
      onlyFavorites: showOnlyFavorites,
    });

    // Apply sort
    tests = sortTests(tests, sortBy);

    return tests;
  };

  const processedTests = getProcessedTests();
  const groupedTests = groupByContract
    ? groupTestsByContract(processedTests)
    : { All: processedTests };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-semibold text-sm transition-colors"
        title="Forge Test Runner"
      >
        🧪 Tests
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  🧪 Forge Test Runner
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Run and analyze Foundry tests
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 pt-4 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab("run")}
                className={`px-4 py-2 rounded-t font-semibold text-sm transition-colors ${
                  activeTab === "run"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                ▶️ Run Tests
              </button>
              <button
                onClick={() => setActiveTab("results")}
                className={`px-4 py-2 rounded-t font-semibold text-sm transition-colors ${
                  activeTab === "results"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
                disabled={!currentResults}
              >
                📊 Results {currentResults && `(${currentResults.results.summary.total})`}
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 rounded-t font-semibold text-sm transition-colors ${
                  activeTab === "history"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                📜 History ({history.length})
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-4 py-2 rounded-t font-semibold text-sm transition-colors ${
                  activeTab === "settings"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                ⚙️ Settings
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Run Tab */}
              {activeTab === "run" && (
                <div className="space-y-6">
                  {/* Statistics */}
                  {stats && stats.totalRuns > 0 && (
                    <div className="grid grid-cols-4 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {stats.totalRuns}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          Total Runs
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {stats.avgPassRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">
                          Avg Pass Rate
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatDuration(stats.avgDuration)}
                        </div>
                        <div className="text-xs text-purple-700 dark:text-purple-300">
                          Avg Duration
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {stats.recentTrend === "improving" && "📈"}
                          {stats.recentTrend === "declining" && "📉"}
                          {stats.recentTrend === "stable" && "➡️"}
                        </div>
                        <div className="text-xs text-orange-700 dark:text-orange-300">
                          {stats.recentTrend}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Filters */}
                  <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                      Test Filters
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                          Match Contract
                        </label>
                        <input
                          type="text"
                          value={matchContract}
                          onChange={(e) => setMatchContract(e.target.value)}
                          placeholder="CounterTest"
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                          Match Test
                        </label>
                        <input
                          type="text"
                          value={matchTest}
                          onChange={(e) => setMatchTest(e.target.value)}
                          placeholder="testIncrement"
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                          General Filter
                        </label>
                        <input
                          type="text"
                          value={testFilter}
                          onChange={(e) => setTestFilter(e.target.value)}
                          placeholder="Filter test names..."
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Run Button */}
                  <button
                    onClick={handleRunTests}
                    disabled={running}
                    className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-lg disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {running ? "⏳ Running Tests..." : "▶️ Run Tests"}
                  </button>

                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
                      <div className="font-semibold mb-1">Error</div>
                      <div className="text-sm">{error}</div>
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      💡 Quick Start
                    </div>
                    <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1 list-disc list-inside">
                      <li>Leave filters empty to run all tests</li>
                      <li>Use "Match Contract" to test specific contracts</li>
                      <li>Use "Match Test" to run specific test functions</li>
                      <li>Results include gas reports and timing</li>
                      <li>Test history is saved automatically</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Results Tab */}
              {activeTab === "results" && currentResults && (
                <div className="space-y-4">
                  {/* Comparison View */}
                  {comparison ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">Test Comparison</h3>
                        <button
                          onClick={() => {
                            setComparison(null);
                            setCompareWith(null);
                          }}
                          className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded text-sm"
                        >
                          Back to Results
                        </button>
                      </div>

                      {/* Summary Comparison */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded">
                        <div>
                          <div className="text-sm text-zinc-500 mb-1">Passed</div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {comparison.summary.passed.before} → {comparison.summary.passed.after}
                            </span>
                            <span className={comparison.summary.passed.diff >= 0 ? "text-green-600" : "text-red-600"}>
                              ({comparison.summary.passed.diff >= 0 ? "+" : ""}{comparison.summary.passed.diff})
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-zinc-500 mb-1">Failed</div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {comparison.summary.failed.before} → {comparison.summary.failed.after}
                            </span>
                            <span className={comparison.summary.failed.diff <= 0 ? "text-green-600" : "text-red-600"}>
                              ({comparison.summary.failed.diff >= 0 ? "+" : ""}{comparison.summary.failed.diff})
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-zinc-500 mb-1">Duration</div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {formatDuration(comparison.summary.duration.before)} → {formatDuration(comparison.summary.duration.after)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Changed Tests */}
                      {comparison.tests.changed.length > 0 && (
                        <div>
                          <h4 className="font-bold mb-2">Changed Tests ({comparison.tests.changed.length})</h4>
                          <div className="space-y-2">
                            {comparison.tests.changed.map((change, idx) => (
                              <div key={idx} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                                <div className="font-mono text-sm font-semibold">{change.contract}::{change.name}</div>
                                {change.statusChanged && (
                                  <div className="text-xs mt-1">
                                    Status: {change.before.status} → {change.after.status}
                                  </div>
                                )}
                                {change.gasChanged && (
                                  <div className="text-xs mt-1">
                                    Gas: {formatGas(change.before.gasUsed)} → {formatGas(change.after.gasUsed)}
                                    <span className={change.gasDiff > 0 ? "text-red-600" : "text-green-600"}>
                                      ({change.gasDiff > 0 ? "+" : ""}{formatGas(change.gasDiff)})
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Added/Removed Tests */}
                      {(comparison.tests.added.length > 0 || comparison.tests.removed.length > 0) && (
                        <div className="grid grid-cols-2 gap-4">
                          {comparison.tests.added.length > 0 && (
                            <div>
                              <h4 className="font-bold mb-2 text-green-600">Added Tests ({comparison.tests.added.length})</h4>
                              <div className="space-y-1">
                                {comparison.tests.added.map((test, idx) => (
                                  <div key={idx} className="text-sm font-mono">+ {test.contract}::{test.name}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {comparison.tests.removed.length > 0 && (
                            <div>
                              <h4 className="font-bold mb-2 text-red-600">Removed Tests ({comparison.tests.removed.length})</h4>
                              <div className="space-y-1">
                                {comparison.tests.removed.map((test, idx) => (
                                  <div key={idx} className="text-sm font-mono">- {test.contract}::{test.name}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Summary */}
                      <div className="grid grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                            {currentResults.results.summary.total}
                          </div>
                          <div className="text-sm text-zinc-500">Total Tests</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {currentResults.results.summary.passed}
                          </div>
                          <div className="text-sm text-zinc-500">Passed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {currentResults.results.summary.failed}
                          </div>
                          <div className="text-sm text-zinc-500">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {formatDuration(currentResults.results.summary.duration)}
                          </div>
                          <div className="text-sm text-zinc-500">Duration</div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex gap-2 flex-wrap items-center">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search tests..."
                          className="flex-1 min-w-[200px] px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                        />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                        >
                          <option value="">All Status</option>
                          <option value="success">Passed</option>
                          <option value="failure">Failed</option>
                          <option value="skipped">Skipped</option>
                        </select>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                        >
                          <option value="name">Sort: Name</option>
                          <option value="status">Sort: Status</option>
                          <option value="gas">Sort: Gas</option>
                          <option value="duration">Sort: Duration</option>
                        </select>
                        <button
                          onClick={() => setGroupByContract(!groupByContract)}
                          className={`px-3 py-2 rounded text-sm font-semibold ${
                            groupByContract
                              ? "bg-red-500 text-white"
                              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {groupByContract ? "📁 Grouped" : "📄 Flat"}
                        </button>
                        <button
                          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                          className={`px-3 py-2 rounded text-sm font-semibold ${
                            showOnlyFavorites
                              ? "bg-yellow-500 text-white"
                              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          ⭐ Favorites
                        </button>
                      </div>

                      {/* Tests List */}
                      <div className="space-y-4">
                        {Object.entries(groupedTests).map(([contract, tests]) => (
                          <div key={contract}>
                            {groupByContract && (
                              <h4 className="font-bold text-lg mb-2 text-zinc-900 dark:text-zinc-100">
                                {contract} ({tests.length})
                              </h4>
                            )}
                            <div className="space-y-2">
                              {tests.map((test, idx) => {
                                const testKey = `${test.contract}::${test.name}`;
                                const isFav = isTestFavorite(testKey);
                                return (
                                  <div
                                    key={idx}
                                    className="p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded hover:border-red-500 transition-colors"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-xl">{getTestStatusIcon(test.status)}</span>
                                          <span className="font-mono text-sm font-semibold">
                                            {test.name}
                                          </span>
                                          <button
                                            onClick={() => handleToggleFavorite(testKey)}
                                            className="text-lg hover:scale-110 transition-transform"
                                          >
                                            {isFav ? "⭐" : "☆"}
                                          </button>
                                        </div>
                                        <div className="flex gap-4 text-xs text-zinc-500">
                                          {test.gasUsed && (
                                            <span>⛽ Gas: {formatGas(test.gasUsed)}</span>
                                          )}
                                          {test.duration > 0 && (
                                            <span>⏱️ {formatDuration(test.duration)}</span>
                                          )}
                                        </div>
                                        {test.reason && (
                                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400">
                                            {test.reason}
                                          </div>
                                        )}
                                      </div>
                                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getTestStatusColor(test.status)}`}>
                                        {test.status}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {processedTests.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                          No tests match your filters
                        </div>
                      )}

                      {/* Gas Report */}
                      {currentResults.results.gasReport && (
                        <div className="mt-6">
                          <h3 className="text-xl font-bold mb-4">⛽ Gas Report</h3>
                          {currentResults.results.gasReport.contracts.map((contract, idx) => (
                            <div key={idx} className="mb-4">
                              <h4 className="font-bold mb-2">{contract.name}</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-zinc-100 dark:bg-zinc-800">
                                    <tr>
                                      <th className="px-4 py-2 text-left">Function</th>
                                      <th className="px-4 py-2 text-right">Min</th>
                                      <th className="px-4 py-2 text-right">Avg</th>
                                      <th className="px-4 py-2 text-right">Median</th>
                                      <th className="px-4 py-2 text-right">Max</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {contract.functions.map((func, fidx) => (
                                      <tr key={fidx} className="border-b border-zinc-200 dark:border-zinc-700">
                                        <td className="px-4 py-2 font-mono">{func.name}</td>
                                        <td className="px-4 py-2 text-right font-mono">{formatGas(func.min)}</td>
                                        <td className="px-4 py-2 text-right font-mono">{formatGas(func.avg)}</td>
                                        <td className="px-4 py-2 text-right font-mono">{formatGas(func.median)}</td>
                                        <td className="px-4 py-2 text-right font-mono">{formatGas(func.max)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExport("json")}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm"
                    >
                      📥 Export JSON
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold text-sm"
                    >
                      📊 Export CSV
                    </button>
                    <button
                      onClick={handleClearHistory}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-semibold text-sm ml-auto"
                    >
                      🗑️ Clear History
                    </button>
                  </div>

                  {compareMode && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                      <div className="font-semibold text-blue-900 dark:text-blue-100">
                        🔄 Compare Mode Active
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Select another test run to compare with
                      </div>
                    </div>
                  )}

                  {history.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <div className="text-4xl mb-3">🧪</div>
                      <div className="font-semibold mb-1">No test history yet</div>
                      <div className="text-sm">Run tests to see history here</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 bg-white dark:bg-zinc-800 border rounded hover:border-red-500 transition-colors ${
                            compareWith?.id === item.id
                              ? "border-blue-500"
                              : "border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg">
                                  {item.success ? "✅" : "❌"}
                                </span>
                                <span className="text-sm text-zinc-500">
                                  {new Date(item.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex gap-4 text-sm">
                                <span className="text-green-600">
                                  ✓ {item.summary.passed}
                                </span>
                                <span className="text-red-600">
                                  ✗ {item.summary.failed}
                                </span>
                                <span className="text-zinc-500">
                                  ⏱️ {formatDuration(item.summary.duration)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewHistory(item)}
                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold"
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() => handleCompare(item)}
                                className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-semibold"
                              >
                                🔄 Compare
                              </button>
                              <button
                                onClick={() => handleDeleteHistory(item.id)}
                                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-semibold"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                      Test Settings
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between">
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Include gas report
                        </span>
                        <input
                          type="checkbox"
                          checked={settings.gasReport}
                          onChange={(e) =>
                            setSettings({ ...settings, gasReport: e.target.checked })
                          }
                          className="w-5 h-5"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Generate coverage report
                        </span>
                        <input
                          type="checkbox"
                          checked={settings.coverage}
                          onChange={(e) =>
                            setSettings({ ...settings, coverage: e.target.checked })
                          }
                          className="w-5 h-5"
                        />
                      </label>

                      <div>
                        <label className="block text-zinc-700 dark:text-zinc-300 mb-2">
                          Verbosity Level
                        </label>
                        <select
                          value={settings.verbosity}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              verbosity: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="1">Normal (-v)</option>
                          <option value="2">Verbose (-vv)</option>
                          <option value="3">Very Verbose (-vvv)</option>
                          <option value="4">Maximum (-vvvv)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      className="w-full mt-6 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold"
                    >
                      Save Settings
                    </button>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      💡 About Forge Tests
                    </div>
                    <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1 list-disc list-inside">
                      <li>Tests must be in a Foundry project</li>
                      <li>Run `forge build` before testing</li>
                      <li>Test results are saved in browser</li>
                      <li>Gas reports show function costs</li>
                      <li>Compare runs to track improvements</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
