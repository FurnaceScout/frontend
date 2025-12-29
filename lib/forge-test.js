// Forge Test Integration Utilities
// Run tests, manage results, and track test history

const STORAGE_KEYS = {
  TEST_HISTORY: "furnacescout_test_history",
  TEST_SETTINGS: "furnacescout_test_settings",
  FAVORITE_TESTS: "furnacescout_favorite_tests",
};

const MAX_HISTORY_ITEMS = 50;

/**
 * Run forge tests via API
 */
export async function runForgeTest(options = {}) {
  const {
    testFilter = "",
    gasReport = true,
    coverage = false,
    matchContract = "",
    matchTest = "",
    verbosity = 2,
  } = options;

  try {
    const response = await fetch("/api/forge/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        testFilter,
        gasReport,
        coverage,
        matchContract,
        matchTest,
        verbosity,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to run tests");
    }

    const result = await response.json();

    // Save to history
    if (result.success) {
      saveTestResult(result);
    }

    return result;
  } catch (error) {
    console.error("Failed to run forge test:", error);
    throw error;
  }
}

/**
 * Save test result to history
 */
export function saveTestResult(result) {
  if (typeof window === "undefined") return;

  try {
    const history = getTestHistory();

    // Add new result
    const historyItem = {
      id: `test-${Date.now()}`,
      timestamp: result.timestamp || Date.now(),
      summary: result.results.summary,
      tests: result.results.tests,
      gasReport: result.results.gasReport,
      exitCode: result.exitCode,
      success: result.success,
      filters: {
        matchContract: result.matchContract || "",
        matchTest: result.matchTest || "",
      },
    };

    history.unshift(historyItem);

    // Trim to max size
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(STORAGE_KEYS.TEST_HISTORY, JSON.stringify(trimmed));

    return historyItem;
  } catch (error) {
    console.error("Failed to save test result:", error);
  }
}

/**
 * Get test history
 */
export function getTestHistory() {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEST_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load test history:", error);
    return [];
  }
}

/**
 * Get test result by ID
 */
export function getTestResult(id) {
  const history = getTestHistory();
  return history.find((item) => item.id === id);
}

/**
 * Delete test result from history
 */
export function deleteTestResult(id) {
  if (typeof window === "undefined") return;

  try {
    const history = getTestHistory();
    const filtered = history.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.TEST_HISTORY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete test result:", error);
    return false;
  }
}

/**
 * Clear all test history
 */
export function clearTestHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.TEST_HISTORY);
}

/**
 * Compare two test results
 */
export function compareTestResults(result1, result2) {
  const comparison = {
    summary: {
      passed: {
        before: result1.summary.passed,
        after: result2.summary.passed,
        diff: result2.summary.passed - result1.summary.passed,
      },
      failed: {
        before: result1.summary.failed,
        after: result2.summary.failed,
        diff: result2.summary.failed - result1.summary.failed,
      },
      total: {
        before: result1.summary.total,
        after: result2.summary.total,
        diff: result2.summary.total - result1.summary.total,
      },
      duration: {
        before: result1.summary.duration,
        after: result2.summary.duration,
        diff: result2.summary.duration - result1.summary.duration,
      },
    },
    tests: {
      added: [],
      removed: [],
      changed: [],
      unchanged: [],
    },
  };

  // Build test maps
  const tests1 = new Map(
    result1.tests.map((t) => [`${t.contract}::${t.name}`, t]),
  );
  const tests2 = new Map(
    result2.tests.map((t) => [`${t.contract}::${t.name}`, t]),
  );

  // Find added tests
  for (const [key, test] of tests2) {
    if (!tests1.has(key)) {
      comparison.tests.added.push(test);
    }
  }

  // Find removed tests
  for (const [key, test] of tests1) {
    if (!tests2.has(key)) {
      comparison.tests.removed.push(test);
    }
  }

  // Find changed and unchanged tests
  for (const [key, test1] of tests1) {
    const test2 = tests2.get(key);
    if (!test2) continue;

    if (test1.status !== test2.status || test1.gasUsed !== test2.gasUsed) {
      comparison.tests.changed.push({
        name: test1.name,
        contract: test1.contract,
        before: test1,
        after: test2,
        statusChanged: test1.status !== test2.status,
        gasChanged: test1.gasUsed !== test2.gasUsed,
        gasDiff: test2.gasUsed - test1.gasUsed,
      });
    } else {
      comparison.tests.unchanged.push(test2);
    }
  }

  return comparison;
}

/**
 * Get test statistics
 */
export function getTestStatistics() {
  const history = getTestHistory();

  if (history.length === 0) {
    return {
      totalRuns: 0,
      totalTests: 0,
      avgPassRate: 0,
      avgDuration: 0,
      recentTrend: "stable",
    };
  }

  const totalRuns = history.length;
  const totalTests = history.reduce((sum, run) => sum + run.summary.total, 0);
  const totalPassed = history.reduce((sum, run) => sum + run.summary.passed, 0);
  const totalDuration = history.reduce(
    (sum, run) => sum + run.summary.duration,
    0,
  );

  const avgPassRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;
  const avgDuration = totalRuns > 0 ? totalDuration / totalRuns : 0;

  // Calculate trend (last 5 runs)
  let recentTrend = "stable";
  if (history.length >= 5) {
    const recent = history.slice(0, 5);
    const passRates = recent.map((run) =>
      run.summary.total > 0
        ? (run.summary.passed / run.summary.total) * 100
        : 0,
    );
    const firstRate = passRates[passRates.length - 1];
    const lastRate = passRates[0];

    if (lastRate > firstRate + 5) {
      recentTrend = "improving";
    } else if (lastRate < firstRate - 5) {
      recentTrend = "declining";
    }
  }

  return {
    totalRuns,
    totalTests,
    avgPassRate,
    avgDuration,
    recentTrend,
    history: history.slice(0, 10), // Last 10 runs
  };
}

/**
 * Export test results as JSON
 */
export function exportTestResults(filters = {}) {
  let history = getTestHistory();

  // Apply filters if provided
  if (filters.afterDate) {
    history = history.filter((item) => item.timestamp >= filters.afterDate);
  }

  if (filters.beforeDate) {
    history = history.filter((item) => item.timestamp <= filters.beforeDate);
  }

  if (filters.onlyFailed) {
    history = history.filter((item) => item.summary.failed > 0);
  }

  if (filters.onlyPassed) {
    history = history.filter((item) => item.summary.failed === 0);
  }

  return JSON.stringify(history, null, 2);
}

/**
 * Export test results as CSV
 */
export function exportTestResultsCSV(filters = {}) {
  let history = getTestHistory();

  // Apply same filters
  if (filters.afterDate) {
    history = history.filter((item) => item.timestamp >= filters.afterDate);
  }

  if (filters.beforeDate) {
    history = history.filter((item) => item.timestamp <= filters.beforeDate);
  }

  const headers = [
    "Timestamp",
    "Total Tests",
    "Passed",
    "Failed",
    "Skipped",
    "Duration (ms)",
    "Pass Rate (%)",
  ];

  const rows = history.map((run) => [
    new Date(run.timestamp).toISOString(),
    run.summary.total,
    run.summary.passed,
    run.summary.failed,
    run.summary.skipped || 0,
    run.summary.duration,
    run.summary.total > 0
      ? ((run.summary.passed / run.summary.total) * 100).toFixed(2)
      : "0.00",
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

/**
 * Get test settings
 */
export function getTestSettings() {
  if (typeof window === "undefined") return getDefaultTestSettings();

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEST_SETTINGS);
    if (stored) {
      return { ...getDefaultTestSettings(), ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load test settings:", error);
  }

  return getDefaultTestSettings();
}

function getDefaultTestSettings() {
  return {
    gasReport: true,
    coverage: false,
    verbosity: 2,
    autoRun: false,
    showOnlyFailed: false,
    sortBy: "name", // name, status, gas, duration
    groupByContract: true,
  };
}

/**
 * Save test settings
 */
export function saveTestSettings(settings) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.TEST_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save test settings:", error);
  }
}

/**
 * Toggle favorite test
 */
export function toggleFavoriteTest(testKey) {
  if (typeof window === "undefined") return false;

  try {
    const favorites = getFavoriteTests();
    const index = favorites.indexOf(testKey);

    if (index > -1) {
      favorites.splice(index, 1);
    } else {
      favorites.push(testKey);
    }

    localStorage.setItem(
      STORAGE_KEYS.FAVORITE_TESTS,
      JSON.stringify(favorites),
    );
    return index === -1; // Return new favorite state
  } catch (error) {
    console.error("Failed to toggle favorite test:", error);
    return false;
  }
}

/**
 * Get favorite tests
 */
export function getFavoriteTests() {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITE_TESTS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load favorite tests:", error);
    return [];
  }
}

/**
 * Check if test is favorite
 */
export function isTestFavorite(testKey) {
  const favorites = getFavoriteTests();
  return favorites.includes(testKey);
}

/**
 * Format test duration
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format gas amount
 */
export function formatGas(gas) {
  if (!gas) return "N/A";
  return gas.toLocaleString();
}

/**
 * Get test status icon
 */
export function getTestStatusIcon(status) {
  const statusLower = status.toLowerCase();
  if (statusLower === "success" || statusLower === "passed") return "✅";
  if (statusLower === "failure" || statusLower === "failed") return "❌";
  if (statusLower === "skipped") return "⏭️";
  return "❓";
}

/**
 * Get test status color
 */
export function getTestStatusColor(status) {
  const statusLower = status.toLowerCase();
  if (statusLower === "success" || statusLower === "passed")
    return "text-green-600 dark:text-green-400";
  if (statusLower === "failure" || statusLower === "failed")
    return "text-red-600 dark:text-red-400";
  if (statusLower === "skipped") return "text-yellow-600 dark:text-yellow-400";
  return "text-zinc-600 dark:text-zinc-400";
}

/**
 * Group tests by contract
 */
export function groupTestsByContract(tests) {
  const grouped = {};

  for (const test of tests) {
    const contract = test.contract || "Unknown";
    if (!grouped[contract]) {
      grouped[contract] = [];
    }
    grouped[contract].push(test);
  }

  return grouped;
}

/**
 * Sort tests
 */
export function sortTests(tests, sortBy = "name") {
  const sorted = [...tests];

  switch (sortBy) {
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "status":
      return sorted.sort((a, b) => {
        const statusOrder = { failure: 0, success: 1, skipped: 2 };
        return (
          statusOrder[a.status.toLowerCase()] -
          statusOrder[b.status.toLowerCase()]
        );
      });
    case "gas":
      return sorted.sort((a, b) => (b.gasUsed || 0) - (a.gasUsed || 0));
    case "duration":
      return sorted.sort((a, b) => b.duration - a.duration);
    default:
      return sorted;
  }
}

/**
 * Filter tests
 */
export function filterTests(tests, filters = {}) {
  let filtered = [...tests];

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (test) =>
        test.name.toLowerCase().includes(searchLower) ||
        test.contract.toLowerCase().includes(searchLower),
    );
  }

  if (filters.status) {
    filtered = filtered.filter(
      (test) => test.status.toLowerCase() === filters.status.toLowerCase(),
    );
  }

  if (filters.contract) {
    filtered = filtered.filter((test) => test.contract === filters.contract);
  }

  if (filters.onlyFavorites) {
    const favorites = getFavoriteTests();
    filtered = filtered.filter((test) =>
      favorites.includes(`${test.contract}::${test.name}`),
    );
  }

  return filtered;
}
