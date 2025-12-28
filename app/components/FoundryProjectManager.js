"use client";

import { useState, useEffect } from "react";
import {
  scanFoundryProject,
  loadFoundryABIs,
  getFoundryContracts,
  linkFoundryContract,
  clearFoundryData,
  getFoundryStats,
  saveFoundryConfig,
} from "@/lib/foundry-project";

export default function FoundryProjectManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [linkAddress, setLinkAddress] = useState("");
  const [linkError, setLinkError] = useState("");
  const [loadSuccess, setLoadSuccess] = useState(false);

  // Load existing Foundry contracts on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      loadExistingContracts();
    }
  }, []);

  const loadExistingContracts = () => {
    const foundryContracts = getFoundryContracts();
    const foundryStats = getFoundryStats();
    setContracts(foundryContracts);
    setStats(foundryStats);
  };

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setLoadSuccess(false);

    try {
      const result = await scanFoundryProject();

      if (!result.found) {
        setError("No Foundry project detected. Make sure foundry.toml exists.");
        setProject(null);
        return;
      }

      if (!result.compiled) {
        setError(
          "Foundry project detected but not compiled. Run 'forge build' first."
        );
        setProject(result);
        return;
      }

      setProject(result);

      // Save config
      if (result.config) {
        saveFoundryConfig(result.config);
      }
    } catch (err) {
      setError(err.message || "Failed to scan for Foundry project");
      setProject(null);
    } finally {
      setScanning(false);
    }
  };

  const handleLoadAll = () => {
    if (!project || !project.contracts) return;

    try {
      const loaded = loadFoundryABIs(project.contracts);
      setLoadSuccess(true);
      loadExistingContracts();

      setTimeout(() => {
        setLoadSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to load ABIs");
    }
  };

  const handleLinkContract = (contract) => {
    setSelectedContract(contract);
    setLinkAddress("");
    setLinkError("");
  };

  const handleLinkSubmit = (e) => {
    e.preventDefault();
    setLinkError("");

    if (!linkAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setLinkError("Invalid Ethereum address format");
      return;
    }

    try {
      linkFoundryContract(selectedContract.name, linkAddress);
      setSelectedContract(null);
      setLinkAddress("");
      loadExistingContracts();
    } catch (err) {
      setLinkError(err.message || "Failed to link contract");
    }
  };

  const handleClear = () => {
    if (
      confirm(
        "Are you sure you want to remove all Foundry contracts? This cannot be undone."
      )
    ) {
      clearFoundryData();
      setProject(null);
      setContracts([]);
      setStats(null);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-semibold text-sm transition-colors"
        title="Foundry Project Manager"
      >
        🔨 Foundry
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  🔨 Foundry Project Manager
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Auto-detect and load contracts from your Foundry project
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Scan Section */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                    📁 Project Detection
                  </h3>
                  <button
                    onClick={handleScan}
                    disabled={scanning}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-semibold text-sm disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {scanning ? "Scanning..." : "🔍 Scan for Project"}
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {loadSuccess && (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
                    ✓ ABIs loaded successfully!
                  </div>
                )}

                {project && project.found && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">
                          Project Root
                        </div>
                        <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                          {project.foundryRoot || "./"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">
                          Output Directory
                        </div>
                        <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                          {project.outDir || "out"}
                        </div>
                      </div>
                    </div>

                    {project.compiled && project.summary && (
                      <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {project.summary.totalContracts}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            Contracts
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {project.summary.totalFunctions}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            Functions
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {project.summary.totalEvents}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            Events
                          </div>
                        </div>
                      </div>
                    )}

                    {project.compiled && (
                      <button
                        onClick={handleLoadAll}
                        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold transition-colors"
                      >
                        📦 Load All ABIs
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Loaded Contracts */}
              {stats && stats.total > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                      📋 Loaded Contracts ({stats.total})
                    </h3>
                    <button
                      onClick={handleClear}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm font-semibold transition-colors"
                    >
                      🗑️ Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.withAddress}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">
                        With Address
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {stats.needsAddress}
                      </div>
                      <div className="text-xs text-orange-700 dark:text-orange-300">
                        Needs Address
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-zinc-600 dark:text-zinc-400">
                        {stats.totalFunctions}
                      </div>
                      <div className="text-xs text-zinc-700 dark:text-zinc-300">
                        Functions
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {contracts.map((contract, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-red-500 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {contract.name}
                              </div>
                              {contract.needsAddress && (
                                <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                                  No address
                                </span>
                              )}
                              {contract.address && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                                  Linked
                                </span>
                              )}
                            </div>

                            {contract.address && (
                              <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                                {contract.address}
                              </div>
                            )}

                            {contract.path && (
                              <div className="font-mono text-xs text-zinc-500 mb-2">
                                {contract.path}
                              </div>
                            )}

                            <div className="flex gap-4 text-xs text-zinc-500">
                              <span>
                                {contract.abi?.filter(
                                  (item) => item.type === "function"
                                ).length || 0}{" "}
                                functions
                              </span>
                              <span>
                                {contract.abi?.filter(
                                  (item) => item.type === "event"
                                ).length || 0}{" "}
                                events
                              </span>
                            </div>
                          </div>

                          {contract.needsAddress && (
                            <button
                              onClick={() => handleLinkContract(contract)}
                              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-semibold transition-colors"
                            >
                              🔗 Link Address
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 How to use
                </div>
                <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1 list-disc list-inside">
                  <li>Click "Scan for Project" to detect your Foundry project</li>
                  <li>
                    Click "Load All ABIs" to import all compiled contracts
                  </li>
                  <li>
                    Use "Link Address" to connect a contract to its deployed
                    address
                  </li>
                  <li>
                    Linked contracts will be available throughout FurnaceScout
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Contract Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              🔗 Link Contract Address
            </h3>

            <div className="mb-4">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Contract Name:
              </div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedContract.name}
              </div>
            </div>

            <form onSubmit={handleLinkSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Deployed Address *
                </label>
                <input
                  type="text"
                  value={linkAddress}
                  onChange={(e) => setLinkAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                  required
                />
              </div>

              {linkError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                  {linkError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedContract(null)}
                  className="flex-1 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-semibold transition-colors"
                >
                  Link Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
