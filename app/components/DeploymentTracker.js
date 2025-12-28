"use client";

import { useState, useEffect } from "react";
import {
  scanFoundryDeployments,
  loadDeployments,
  getDeployments,
  getDeploymentStats,
  linkDeploymentsToABIs,
  clearDeployments,
  exportDeployments,
  importDeployments,
  deleteDeployment,
  getDeploymentByAddress,
} from "@/lib/foundry-deployments";

export default function DeploymentTracker({ defaultChainId = "31337" }) {
  const [deployments, setDeployments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedChain, setSelectedChain] = useState(defaultChainId);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(null);
  const [linkResult, setLinkResult] = useState(null);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortDesc, setSortDesc] = useState(true);

  // Load deployments from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [selectedChain]);

  function loadFromStorage() {
    const stored = getDeployments(selectedChain === "all" ? null : selectedChain);
    setDeployments(stored);
    setStats(getDeploymentStats());
  }

  async function handleScan() {
    setLoading(true);
    setError(null);
    setLinkResult(null);

    try {
      const result = await scanFoundryDeployments(
        selectedChain === "all" ? null : selectedChain,
        showHistory
      );

      if (!result.found) {
        setError("No Foundry project detected");
        return;
      }

      if (!result.hasBroadcast) {
        setError("No broadcast directory found. Run 'forge script' to deploy contracts.");
        return;
      }

      // Load deployments into storage
      const count = loadDeployments(result.deployments);

      // Store history if requested
      if (showHistory && result.history) {
        setHistory(result.history);
      }

      // Reload from storage
      loadFromStorage();

      // Try to link ABIs
      if (result.deployments.length > 0) {
        const linkRes = linkDeploymentsToABIs(result.deployments);
        setLinkResult(linkRes);
      }

      setError(null);
    } catch (err) {
      setError(err.message || "Failed to scan deployments");
      console.error("Scan error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    if (confirm("Clear all deployment data?")) {
      clearDeployments();
      setDeployments([]);
      setHistory(null);
      setStats(null);
      setLinkResult(null);
    }
  }

  function handleExport() {
    const json = exportDeployments();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `foundry-deployments-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        const text = await file.text();
        const count = importDeployments(text);
        loadFromStorage();
        alert(`Imported ${count} deployments`);
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    };
    input.click();
  }

  function handleDelete(address, chainId) {
    if (confirm(`Delete deployment for ${address}?`)) {
      deleteDeployment(address, chainId);
      loadFromStorage();
    }
  }

  function handleCopyAddress(address) {
    navigator.clipboard.writeText(address);
  }

  function handleNavigateToAddress(address) {
    window.location.href = `/address/${address}`;
  }

  function handleNavigateToTx(hash) {
    if (hash) {
      window.location.href = `/tx/${hash}`;
    }
  }

  function handleNavigateToBlock(blockNumber) {
    if (blockNumber) {
      window.location.href = `/block/${blockNumber}`;
    }
  }

  // Filter and sort deployments
  const filteredDeployments = deployments
    .filter((d) => {
      if (!filter) return true;
      const searchLower = filter.toLowerCase();
      return (
        d.contractName?.toLowerCase().includes(searchLower) ||
        d.contractAddress?.toLowerCase().includes(searchLower) ||
        d.scriptName?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "name":
          aVal = a.contractName || "";
          bVal = b.contractName || "";
          break;
        case "address":
          aVal = a.contractAddress || "";
          bVal = b.contractAddress || "";
          break;
        case "timestamp":
          aVal = a.deploymentTimestamp || 0;
          bVal = b.deploymentTimestamp || 0;
          break;
        case "block":
          aVal = a.blockNumber || 0;
          bVal = b.blockNumber || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Foundry Deployments</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleScan}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
          >
            {loading ? "Scanning..." : "Scan Deployments"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={deployments.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors"
          >
            Export
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
          >
            Import
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={deployments.length === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center gap-4 p-4 bg-gray-800 rounded">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Chain ID:</label>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="px-3 py-1 bg-gray-700 border border-gray-600 rounded"
          >
            <option value="all">All Chains</option>
            <option value="31337">31337 (Anvil)</option>
            <option value="1">1 (Mainnet)</option>
            <option value="11155111">11155111 (Sepolia)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showHistory"
            checked={showHistory}
            onChange={(e) => setShowHistory(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="showHistory" className="text-sm font-medium">
            Include full history
          </label>
        </div>

        <div className="flex-1">
          <input
            type="text"
            placeholder="Filter by name, address, or script..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded"
          />
        </div>
      </div>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-800 rounded">
            <div className="text-sm text-gray-400">Total Deployments</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded">
            <div className="text-sm text-gray-400">Unique Contracts</div>
            <div className="text-2xl font-bold">{stats.contractCount}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded">
            <div className="text-sm text-gray-400">Chains</div>
            <div className="text-2xl font-bold">{stats.chainCount}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded">
            <div className="text-sm text-gray-400">Latest</div>
            <div className="text-sm font-mono">
              {stats.latestDeployment
                ? new Date(stats.latestDeployment).toLocaleString()
                : "N/A"}
            </div>
          </div>
        </div>
      )}

      {/* Link Result */}
      {linkResult && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded">
          <div className="font-medium">ABIs Linked</div>
          <div className="text-sm text-gray-300">
            Linked {linkResult.linked} of {linkResult.total} deployments to ABIs
            {linkResult.notFound > 0 && ` (${linkResult.notFound} ABIs not found)`}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded">
          <div className="font-medium">Error</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Deployments Table */}
      {filteredDeployments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800 border-b border-gray-700">
                <th className="px-4 py-2 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("name");
                      setSortDesc(!sortDesc);
                    }}
                    className="hover:text-blue-400"
                  >
                    Contract {sortBy === "name" && (sortDesc ? "↓" : "↑")}
                  </button>
                </th>
                <th className="px-4 py-2 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("address");
                      setSortDesc(!sortDesc);
                    }}
                    className="hover:text-blue-400"
                  >
                    Address {sortBy === "address" && (sortDesc ? "↓" : "↑")}
                  </button>
                </th>
                <th className="px-4 py-2 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("block");
                      setSortDesc(!sortDesc);
                    }}
                    className="hover:text-blue-400"
                  >
                    Block {sortBy === "block" && (sortDesc ? "↓" : "↑")}
                  </button>
                </th>
                <th className="px-4 py-2 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("timestamp");
                      setSortDesc(!sortDesc);
                    }}
                    className="hover:text-blue-400"
                  >
                    Deployed {sortBy === "timestamp" && (sortDesc ? "↓" : "↑")}
                  </button>
                </th>
                <th className="px-4 py-2 text-left">Script</th>
                <th className="px-4 py-2 text-left">Chain</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeployments.map((deployment, idx) => (
                <tr
                  key={`${deployment.contractAddress}-${deployment.chainId}-${idx}`}
                  className="border-b border-gray-800 hover:bg-gray-800/50"
                >
                  <td className="px-4 py-2 font-mono text-sm">
                    {deployment.contractName || "Unknown"}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(deployment.contractAddress)}
                      className="font-mono text-sm text-blue-400 hover:text-blue-300"
                      title="Click to copy"
                    >
                      {deployment.contractAddress?.slice(0, 10)}...
                      {deployment.contractAddress?.slice(-8)}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    {deployment.blockNumber ? (
                      <button
                        type="button"
                        onClick={() => handleNavigateToBlock(deployment.blockNumber)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {deployment.blockNumber}
                      </button>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {deployment.deploymentTimestamp
                      ? new Date(deployment.deploymentTimestamp).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-400">
                    {deployment.scriptName || "N/A"}
                  </td>
                  <td className="px-4 py-2 text-sm">{deployment.chainId || "N/A"}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleNavigateToAddress(deployment.contractAddress)}
                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                        title="View contract"
                      >
                        View
                      </button>
                      {deployment.transactionHash && (
                        <button
                          type="button"
                          onClick={() => handleNavigateToTx(deployment.transactionHash)}
                          className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded"
                          title="View deployment transaction"
                        >
                          Tx
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(deployment.contractAddress, deployment.chainId)
                        }
                        className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-400">
          {deployments.length === 0
            ? "No deployments found. Click 'Scan Deployments' to load from broadcast files."
            : "No deployments match the current filter."}
        </div>
      )}

      {/* History */}
      {history && history.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Deployment History</h3>
          <div className="space-y-4">
            {history.map((entry, idx) => (
              <div key={idx} className="p-4 bg-gray-800 rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono font-medium">{entry.scriptName}</div>
                  <div className="text-sm text-gray-400">
                    {entry.timestamp
                      ? new Date(entry.timestamp).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  Chain: {entry.chainId} • File: {entry.fileName}
                  {entry.commit && ` • Commit: ${entry.commit.slice(0, 8)}`}
                </div>
                <div className="pl-4 border-l-2 border-gray-700 space-y-2">
                  {entry.deployments.map((deployment, dIdx) => (
                    <div key={dIdx} className="text-sm">
                      <span className="font-mono">{deployment.contractName}</span>
                      {" → "}
                      <span className="text-blue-400 font-mono">
                        {deployment.contractAddress}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
