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
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Switch } from "@/app/components/ui/switch";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Alert, AlertDescription } from "@/app/components/ui/alert";

export default function ForgeTestRunner() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("run");
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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
      toast.success("Tests completed successfully");
    } catch (err) {
      const errorMsg = err.message || "Failed to run tests";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setRunning(false);
    }
  };

  const handleDeleteHistory = (id) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteTestResult(deleteTargetId);
      loadData();
      toast.success("Test result deleted");
      setDeleteTargetId(null);
    }
    setShowDeleteConfirm(false);
  };

  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  const confirmClearHistory = () => {
    clearTestHistory();
    loadData();
    toast.success("Test history cleared");
    setShowClearConfirm(false);
  };

  const handleExport = (format = "json") => {
    const data =
      format === "json" ? exportTestResults() : exportTestResultsCSV();
    const blob = new Blob([data], {
      type: format === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-results-${Date.now()}.${format}`;
    a.click();
    toast.success(`Test results exported as ${format.toUpperCase()}`);
  };

  const handleSaveSettings = () => {
    saveTestSettings(settings);
    toast.success("Settings saved!");
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
      toast.info("Select another test run to compare");
    } else {
      const comp = compareTestResults(compareWith, item);
      setComparison(comp);
      setCompareMode(false);
      setCompareWith(null);
      setActiveTab("results");
      toast.success("Comparison complete");
    }
  };

  const handleToggleFavorite = (testKey) => {
    toggleFavoriteTest(testKey);
    // Force re-render by creating new results object
    if (currentResults) {
      setCurrentResults({ ...currentResults });
    }
    toast.success(
      isTestFavorite(testKey) ? "Added to favorites" : "Removed from favorites",
    );
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
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        size="sm"
        title="Forge Test Runner"
      >
        🧪 Tests
      </Button>

      {/* Main Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl">🧪 Forge Test Runner</DialogTitle>
            <DialogDescription>Run and analyze Foundry tests</DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <TabsList className="mx-6">
              <TabsTrigger value="run">▶️ Run Tests</TabsTrigger>
              <TabsTrigger value="results" disabled={!currentResults}>
                📊 Results
                {currentResults && ` (${currentResults.results.summary.total})`}
              </TabsTrigger>
              <TabsTrigger value="history">
                📜 History ({history.length})
              </TabsTrigger>
              <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Run Tab */}
              <TabsContent value="run" className="mt-4 space-y-6">
                {/* Statistics */}
                {stats && stats.totalRuns > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {stats.totalRuns}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total Runs
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.avgPassRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg Pass Rate
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {formatDuration(stats.avgDuration)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg Duration
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {stats.recentTrend === "improving" && "📈"}
                            {stats.recentTrend === "declining" && "📉"}
                            {stats.recentTrend === "stable" && "➡️"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stats.recentTrend}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Test Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Test Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="match-contract">Match Contract</Label>
                      <Input
                        id="match-contract"
                        type="text"
                        value={matchContract}
                        onChange={(e) => setMatchContract(e.target.value)}
                        placeholder="CounterTest"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="match-test">Match Test</Label>
                      <Input
                        id="match-test"
                        type="text"
                        value={matchTest}
                        onChange={(e) => setMatchTest(e.target.value)}
                        placeholder="testIncrement"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="test-filter">General Filter</Label>
                      <Input
                        id="test-filter"
                        type="text"
                        value={testFilter}
                        onChange={(e) => setTestFilter(e.target.value)}
                        placeholder="Filter test names..."
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Run Button */}
                <Button
                  onClick={handleRunTests}
                  disabled={running}
                  className="w-full"
                  size="lg"
                >
                  {running ? "⏳ Running Tests..." : "▶️ Run Tests"}
                </Button>

                {/* Error Display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>💡 Quick Start</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                      <li>Leave filters empty to run all tests</li>
                      <li>Use "Match Contract" to test specific contracts</li>
                      <li>Use "Match Test" to run specific test functions</li>
                      <li>Results include gas reports and timing</li>
                      <li>Test history is saved automatically</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="mt-4 space-y-4">
                {currentResults && (
                  <>
                    {/* Comparison View */}
                    {comparison ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold">Test Comparison</h3>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setComparison(null);
                              setCompareWith(null);
                            }}
                          >
                            Back to Results
                          </Button>
                        </div>

                        {/* Summary Comparison */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">
                                  Passed
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold">
                                    {comparison.summary.passed.before} →{" "}
                                    {comparison.summary.passed.after}
                                  </span>
                                  <Badge
                                    variant={
                                      comparison.summary.passed.diff >= 0
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {comparison.summary.passed.diff >= 0
                                      ? "+"
                                      : ""}
                                    {comparison.summary.passed.diff}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">
                                  Failed
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold">
                                    {comparison.summary.failed.before} →{" "}
                                    {comparison.summary.failed.after}
                                  </span>
                                  <Badge
                                    variant={
                                      comparison.summary.failed.diff <= 0
                                        ? "default"
                                        : "destructive"
                                    }
                                  >
                                    {comparison.summary.failed.diff >= 0
                                      ? "+"
                                      : ""}
                                    {comparison.summary.failed.diff}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">
                                  Duration
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold">
                                    {formatDuration(
                                      comparison.summary.duration.before,
                                    )}{" "}
                                    →{" "}
                                    {formatDuration(
                                      comparison.summary.duration.after,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Changed Tests */}
                        {comparison.tests.changed.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>
                                Changed Tests ({comparison.tests.changed.length}
                                )
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {comparison.tests.changed.map((change, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded"
                                >
                                  <div className="font-mono text-sm font-semibold">
                                    {change.contract}::{change.name}
                                  </div>
                                  {change.statusChanged && (
                                    <div className="text-xs mt-1">
                                      Status: {change.before.status} →{" "}
                                      {change.after.status}
                                    </div>
                                  )}
                                  {change.gasChanged && (
                                    <div className="text-xs mt-1">
                                      Gas: {formatGas(change.before.gasUsed)} →{" "}
                                      {formatGas(change.after.gasUsed)}
                                      <span
                                        className={
                                          change.gasDiff > 0
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }
                                      >
                                        {" "}
                                        ({change.gasDiff > 0 ? "+" : ""}
                                        {formatGas(change.gasDiff)})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}

                        {/* Added/Removed Tests */}
                        {(comparison.tests.added.length > 0 ||
                          comparison.tests.removed.length > 0) && (
                          <div className="grid grid-cols-2 gap-4">
                            {comparison.tests.added.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-green-600">
                                    Added Tests ({comparison.tests.added.length}
                                    )
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                  {comparison.tests.added.map((test, idx) => (
                                    <div
                                      key={idx}
                                      className="text-sm font-mono"
                                    >
                                      + {test.contract}::{test.name}
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>
                            )}
                            {comparison.tests.removed.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-red-600">
                                    Removed Tests (
                                    {comparison.tests.removed.length})
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                  {comparison.tests.removed.map((test, idx) => (
                                    <div
                                      key={idx}
                                      className="text-sm font-mono"
                                    >
                                      - {test.contract}::{test.name}
                                    </div>
                                  ))}
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Summary */}
                        <Card>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-3xl font-bold">
                                  {currentResults.results.summary.total}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Total Tests
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                  {currentResults.results.summary.passed}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Passed
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                  {currentResults.results.summary.failed}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Failed
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                  {formatDuration(
                                    currentResults.results.summary.duration,
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Duration
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Controls */}
                        <div className="flex gap-2 flex-wrap items-center">
                          <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tests..."
                            className="flex-1 min-w-[200px]"
                          />
                          <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Status</SelectItem>
                              <SelectItem value="success">Passed</SelectItem>
                              <SelectItem value="failure">Failed</SelectItem>
                              <SelectItem value="skipped">Skipped</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name">Sort: Name</SelectItem>
                              <SelectItem value="status">
                                Sort: Status
                              </SelectItem>
                              <SelectItem value="gas">Sort: Gas</SelectItem>
                              <SelectItem value="duration">
                                Sort: Duration
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant={groupByContract ? "default" : "outline"}
                            size="sm"
                            onClick={() => setGroupByContract(!groupByContract)}
                          >
                            {groupByContract ? "📁 Grouped" : "📄 Flat"}
                          </Button>
                          <Button
                            variant={showOnlyFavorites ? "default" : "outline"}
                            size="sm"
                            onClick={() =>
                              setShowOnlyFavorites(!showOnlyFavorites)
                            }
                          >
                            ⭐ Favorites
                          </Button>
                        </div>

                        {/* Tests List */}
                        <div className="space-y-4">
                          {Object.entries(groupedTests).map(
                            ([contract, tests]) => (
                              <div key={contract}>
                                {groupByContract && (
                                  <h4 className="font-bold text-lg mb-2">
                                    {contract} ({tests.length})
                                  </h4>
                                )}
                                <div className="space-y-2">
                                  {tests.map((test, idx) => {
                                    const testKey = `${test.contract}::${test.name}`;
                                    const isFav = isTestFavorite(testKey);
                                    return (
                                      <Card
                                        key={idx}
                                        className="hover:border-primary transition-colors"
                                      >
                                        <CardContent className="pt-6">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xl">
                                                  {getTestStatusIcon(
                                                    test.status,
                                                  )}
                                                </span>
                                                <span className="font-mono text-sm font-semibold">
                                                  {test.name}
                                                </span>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-8 w-8 p-0"
                                                  onClick={() =>
                                                    handleToggleFavorite(
                                                      testKey,
                                                    )
                                                  }
                                                >
                                                  {isFav ? "⭐" : "☆"}
                                                </Button>
                                              </div>
                                              <div className="flex gap-4 text-xs text-muted-foreground">
                                                {test.gasUsed && (
                                                  <span>
                                                    ⛽ Gas:{" "}
                                                    {formatGas(test.gasUsed)}
                                                  </span>
                                                )}
                                                {test.duration > 0 && (
                                                  <span>
                                                    ⏱️{" "}
                                                    {formatDuration(
                                                      test.duration,
                                                    )}
                                                  </span>
                                                )}
                                              </div>
                                              {test.reason && (
                                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400">
                                                  {test.reason}
                                                </div>
                                              )}
                                            </div>
                                            <Badge
                                              variant={
                                                test.status === "success"
                                                  ? "default"
                                                  : test.status === "failure"
                                                    ? "destructive"
                                                    : "secondary"
                                              }
                                            >
                                              {test.status}
                                            </Badge>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              </div>
                            ),
                          )}
                        </div>

                        {processedTests.length === 0 && (
                          <Card>
                            <CardContent className="pt-12 pb-12 text-center">
                              <div className="text-muted-foreground">
                                No tests match your filters
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Gas Report */}
                        {currentResults.results.gasReport && (
                          <Card>
                            <CardHeader>
                              <CardTitle>⛽ Gas Report</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {currentResults.results.gasReport.contracts.map(
                                (contract, idx) => (
                                  <div key={idx} className="mb-4">
                                    <h4 className="font-bold mb-2">
                                      {contract.name}
                                    </h4>
                                    <div className="overflow-x-auto">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Function</TableHead>
                                            <TableHead className="text-right">
                                              Min
                                            </TableHead>
                                            <TableHead className="text-right">
                                              Avg
                                            </TableHead>
                                            <TableHead className="text-right">
                                              Median
                                            </TableHead>
                                            <TableHead className="text-right">
                                              Max
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {contract.functions.map(
                                            (func, fidx) => (
                                              <TableRow key={fidx}>
                                                <TableCell className="font-mono">
                                                  {func.name}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                  {formatGas(func.min)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                  {formatGas(func.avg)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                  {formatGas(func.median)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                  {formatGas(func.max)}
                                                </TableCell>
                                              </TableRow>
                                            ),
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                ),
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )}
                  </>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-4 space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleExport("json")}
                  >
                    📥 Export JSON
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleExport("csv")}
                  >
                    📊 Export CSV
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleClearHistory}
                    className="ml-auto"
                  >
                    🗑️ Clear History
                  </Button>
                </div>

                {compareMode && (
                  <Alert>
                    <AlertDescription>
                      <div className="font-semibold">
                        🔄 Compare Mode Active
                      </div>
                      <div className="text-sm mt-1">
                        Select another test run to compare with
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {history.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <div className="text-4xl mb-3">🧪</div>
                      <CardTitle className="mb-2">
                        No test history yet
                      </CardTitle>
                      <CardDescription>
                        Run tests to see history here
                      </CardDescription>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <Card
                        key={item.id}
                        className={
                          compareWith?.id === item.id
                            ? "border-primary"
                            : "hover:border-primary transition-colors"
                        }
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg">
                                  {item.success ? "✅" : "❌"}
                                </span>
                                <span className="text-sm text-muted-foreground">
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
                                <span className="text-muted-foreground">
                                  ⏱️ {formatDuration(item.summary.duration)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleViewHistory(item)}
                              >
                                👁️ View
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCompare(item)}
                              >
                                🔄 Compare
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteHistory(item.id)}
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Include gas report</Label>
                        <div className="text-sm text-muted-foreground">
                          Generate detailed gas usage reports
                        </div>
                      </div>
                      <Switch
                        checked={settings.gasReport}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, gasReport: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Generate coverage report</Label>
                        <div className="text-sm text-muted-foreground">
                          Track code coverage during tests
                        </div>
                      </div>
                      <Switch
                        checked={settings.coverage}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, coverage: checked })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="verbosity">Verbosity Level</Label>
                      <Select
                        value={settings.verbosity.toString()}
                        onValueChange={(value) =>
                          setSettings({
                            ...settings,
                            verbosity: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger id="verbosity" className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Normal (-v)</SelectItem>
                          <SelectItem value="2">Verbose (-vv)</SelectItem>
                          <SelectItem value="3">Very Verbose (-vvv)</SelectItem>
                          <SelectItem value="4">Maximum (-vvvv)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleSaveSettings} className="w-full">
                      Save Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>💡 About Forge Tests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                      <li>Tests must be in a Foundry project</li>
                      <li>Run `forge build` before testing</li>
                      <li>Test results are saved in browser</li>
                      <li>Gas reports show function costs</li>
                      <li>Compare runs to track improvements</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test Result?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this test result. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear History Confirmation AlertDialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Test History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all test history. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearHistory}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
