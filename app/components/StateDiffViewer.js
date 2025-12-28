"use client";

import { useState, useEffect } from "react";
import {
  getTransactionStorageChanges,
  getDetailedStorageChanges,
  compareBlockStates,
  getBlockBalanceChanges,
  formatStorageKey,
  formatStorageValue,
  formatBalanceChange,
  categorizeAddress,
  getStateDiffSummary,
  exportStateDiff,
  detectERC20Transfers,
  detectERC721Transfers,
} from "@/lib/state-diff";

export default function StateDiffViewer({ transactionHash, receipt }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stateDiff, setStateDiff] = useState(null);
  const [detailedStorage, setDetailedStorage] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedAddresses, setExpandedAddresses] = useState({});
  const [showDetailedStorage, setShowDetailedStorage] = useState(false);
  const [erc20Transfers, setErc20Transfers] = useState([]);
  const [erc721Transfers, setErc721Transfers] = useState([]);

  useEffect(() => {
    if (transactionHash) {
      loadStateDiff();
    }
  }, [transactionHash]);

  useEffect(() => {
    if (receipt?.logs) {
      const erc20 = detectERC20Transfers(receipt.logs);
      const erc721 = detectERC721Transfers(receipt.logs);
      setErc20Transfers(erc20);
      setErc721Transfers(erc721);
    }
  }, [receipt]);

  async function loadStateDiff() {
    setLoading(true);
    setError(null);

    try {
      const changes = await getTransactionStorageChanges(transactionHash);
      setStateDiff(changes);
    } catch (err) {
      setError(err.message || "Failed to load state changes");
      console.error("State diff error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetailedStorage() {
    setLoading(true);
    setError(null);

    try {
      const storage = await getDetailedStorageChanges(transactionHash);
      setDetailedStorage(storage);
      setShowDetailedStorage(true);
    } catch (err) {
      setError(err.message || "Failed to load detailed storage");
      console.error("Detailed storage error:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleAddress(address) {
    setExpandedAddresses((prev) => ({
      ...prev,
      [address]: !prev[address],
    }));
  }

  function handleExport() {
    if (!stateDiff) return;

    const json = exportStateDiff(stateDiff);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `state-diff-${transactionHash.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyAddress(address) {
    navigator.clipboard.writeText(address);
  }

  if (loading && !stateDiff) {
    return (
      <div className="p-8 text-center text-gray-400">
        Loading state changes...
      </div>
    );
  }

  if (error && !stateDiff) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-700 rounded text-red-400">
        <div className="font-semibold mb-2">Error Loading State Changes</div>
        <div className="text-sm">{error}</div>
      </div>
    );
  }

  if (!stateDiff) {
    return null;
  }

  const summary = getStateDiffSummary(stateDiff);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">State Changes</h3>
        <div className="flex gap-2">
          {!showDetailedStorage && (
            <button
              type="button"
              onClick={loadDetailedStorage}
              disabled={loading}
              className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors"
            >
              {loading ? "Loading..." : "Load Detailed Storage"}
            </button>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-3 bg-gray-800 border border-gray-700 rounded">
          <div className="text-xs text-gray-400">Addresses</div>
          <div className="text-2xl font-bold">{summary.totalAddresses}</div>
        </div>
        <div className="p-3 bg-gray-800 border border-gray-700 rounded">
          <div className="text-xs text-gray-400">Balance Changes</div>
          <div className="text-2xl font-bold">{summary.totalBalanceChanges}</div>
        </div>
        <div className="p-3 bg-gray-800 border border-gray-700 rounded">
          <div className="text-xs text-gray-400">Nonce Changes</div>
          <div className="text-2xl font-bold">{summary.totalNonceChanges}</div>
        </div>
        <div className="p-3 bg-gray-800 border border-gray-700 rounded">
          <div className="text-xs text-gray-400">Code Changes</div>
          <div className="text-2xl font-bold">{summary.totalCodeChanges}</div>
        </div>
        <div className="p-3 bg-gray-800 border border-gray-700 rounded">
          <div className="text-xs text-gray-400">Storage Ops</div>
          <div className="text-2xl font-bold">{summary.totalStorageChanges}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "overview"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("balances")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "balances"
              ? "text-green-400 border-b-2 border-green-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Balances ({summary.totalBalanceChanges})
        </button>
        {(erc20Transfers.length > 0 || erc721Transfers.length > 0) && (
          <button
            type="button"
            onClick={() => setActiveTab("tokens")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "tokens"
                ? "text-yellow-400 border-b-2 border-yellow-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Tokens ({erc20Transfers.length + erc721Transfers.length})
          </button>
        )}
        {showDetailedStorage && detailedStorage && (
          <button
            type="button"
            onClick={() => setActiveTab("storage")}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "storage"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Storage Ops ({detailedStorage.length})
          </button>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {stateDiff.addresses.map((addressChange, idx) => {
            const hasChanges =
              addressChange.balanceChange ||
              addressChange.nonceChange ||
              addressChange.codeChange;

            if (!hasChanges) return null;

            const isExpanded = expandedAddresses[addressChange.address];

            return (
              <div
                key={idx}
                className="border border-gray-700 rounded bg-gray-800/50"
              >
                {/* Address Header */}
                <button
                  type="button"
                  onClick={() => toggleAddress(addressChange.address)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-2 py-1 rounded font-semibold bg-gray-700 text-gray-300"
                    >
                      {categorizeAddress(addressChange.address, addressChange.codeChange?.after)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAddress(addressChange.address);
                      }}
                      className="font-mono text-sm text-blue-400 hover:text-blue-300"
                      title="Click to copy"
                    >
                      {addressChange.address.slice(0, 10)}...{addressChange.address.slice(-8)}
                    </button>
                    <div className="flex gap-2">
                      {addressChange.balanceChange && (
                        <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">
                          Balance
                        </span>
                      )}
                      {addressChange.nonceChange && (
                        <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">
                          Nonce
                        </span>
                      )}
                      {addressChange.codeChange && (
                        <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-400 rounded">
                          {addressChange.codeChange.isDeployment ? "Deployed" : "Code Changed"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </button>

                {/* Address Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Balance Change */}
                    {addressChange.balanceChange && (
                      <div className="p-3 bg-gray-900 rounded border border-gray-700">
                        <div className="text-sm font-semibold text-green-400 mb-2">
                          Balance Change
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Before</div>
                            <div className="font-mono">
                              {(Number(addressChange.balanceChange.before) / 1e18).toFixed(6)} ETH
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">After</div>
                            <div className="font-mono">
                              {(Number(addressChange.balanceChange.after) / 1e18).toFixed(6)} ETH
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">Difference</div>
                            <div className={`font-mono font-semibold ${
                              BigInt(addressChange.balanceChange.diff) > 0n
                                ? "text-green-400"
                                : "text-red-400"
                            }`}>
                              {formatBalanceChange(addressChange.balanceChange.diff).sign}
                              {formatBalanceChange(addressChange.balanceChange.diff).eth} ETH
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Nonce Change */}
                    {addressChange.nonceChange && (
                      <div className="p-3 bg-gray-900 rounded border border-gray-700">
                        <div className="text-sm font-semibold text-blue-400 mb-2">
                          Nonce Change
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Before</div>
                            <div className="font-mono">{addressChange.nonceChange.before}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">After</div>
                            <div className="font-mono">{addressChange.nonceChange.after}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Difference</div>
                            <div className="font-mono text-blue-400">
                              +{addressChange.nonceChange.diff}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Code Change */}
                    {addressChange.codeChange && (
                      <div className="p-3 bg-gray-900 rounded border border-gray-700">
                        <div className="text-sm font-semibold text-purple-400 mb-2">
                          Code Change
                        </div>
                        {addressChange.codeChange.isDeployment && (
                          <div className="text-sm text-green-400">
                            ✓ Contract Deployed ({addressChange.codeChange.after?.length || 0} bytes)
                          </div>
                        )}
                        {addressChange.codeChange.isDestruction && (
                          <div className="text-sm text-red-400">
                            ✗ Contract Destroyed
                          </div>
                        )}
                        {!addressChange.codeChange.isDeployment && !addressChange.codeChange.isDestruction && (
                          <div className="text-sm text-yellow-400">
                            ⚠ Code Modified (rare - possible proxy upgrade)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {stateDiff.addresses.filter(a => a.balanceChange || a.nonceChange || a.codeChange).length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No state changes detected in this transaction
            </div>
          )}
        </div>
      )}

      {/* Balances Tab */}
      {activeTab === "balances" && (
        <div className="space-y-2">
          {stateDiff.addresses
            .filter((a) => a.balanceChange)
            .map((addressChange, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-800 border border-gray-700 rounded"
              >
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => handleCopyAddress(addressChange.address)}
                    className="font-mono text-sm text-blue-400 hover:text-blue-300"
                    title="Click to copy"
                  >
                    {addressChange.address}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Before</div>
                    <div className="font-mono">
                      {(Number(addressChange.balanceChange.before) / 1e18).toFixed(6)} ETH
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {addressChange.balanceChange.before} wei
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">After</div>
                    <div className="font-mono">
                      {(Number(addressChange.balanceChange.after) / 1e18).toFixed(6)} ETH
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {addressChange.balanceChange.after} wei
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 mb-1">Change</div>
                    <div className={`font-mono font-semibold ${
                      BigInt(addressChange.balanceChange.diff) > 0n
                        ? "text-green-400"
                        : "text-red-400"
                    }`}>
                      {formatBalanceChange(addressChange.balanceChange.diff).sign}
                      {formatBalanceChange(addressChange.balanceChange.diff).eth} ETH
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {formatBalanceChange(addressChange.balanceChange.diff).sign}
                      {formatBalanceChange(addressChange.balanceChange.diff).wei} wei
                    </div>
                  </div>
                </div>
              </div>
            ))}

          {stateDiff.addresses.filter((a) => a.balanceChange).length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No balance changes in this transaction
            </div>
          )}
        </div>
      )}

      {/* Tokens Tab */}
      {activeTab === "tokens" && (
        <div className="space-y-4">
          {/* ERC20 Transfers */}
          {erc20Transfers.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-yellow-400">
                ERC20 Transfers ({erc20Transfers.length})
              </h4>
              <div className="space-y-2">
                {erc20Transfers.map((transfer, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-800 border border-gray-700 rounded"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-400 rounded font-semibold">
                        ERC20
                      </span>
                      <span className="text-sm text-gray-400">Token:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyAddress(transfer.token)}
                        className="font-mono text-sm text-blue-400 hover:text-blue-300"
                      >
                        {transfer.token.slice(0, 10)}...{transfer.token.slice(-8)}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">From</div>
                        <div className="font-mono text-xs">{transfer.from.slice(0, 10)}...{transfer.from.slice(-6)}</div>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div>
                        <div className="text-gray-400">To</div>
                        <div className="font-mono text-xs">{transfer.to.slice(0, 10)}...{transfer.to.slice(-6)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Amount</div>
                        <div className="font-mono">{BigInt(transfer.value).toString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ERC721 Transfers */}
          {erc721Transfers.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-purple-400">
                ERC721 Transfers ({erc721Transfers.length})
              </h4>
              <div className="space-y-2">
                {erc721Transfers.map((transfer, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gray-800 border border-gray-700 rounded"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-400 rounded font-semibold">
                        ERC721
                      </span>
                      <span className="text-sm text-gray-400">Token:</span>
                      <button
                        type="button"
                        onClick={() => handleCopyAddress(transfer.token)}
                        className="font-mono text-sm text-blue-400 hover:text-blue-300"
                      >
                        {transfer.token.slice(0, 10)}...{transfer.token.slice(-8)}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">From</div>
                        <div className="font-mono text-xs">{transfer.from.slice(0, 10)}...{transfer.from.slice(-6)}</div>
                      </div>
                      <div className="text-gray-400">→</div>
                      <div>
                        <div className="text-gray-400">To</div>
                        <div className="font-mono text-xs">{transfer.to.slice(0, 10)}...{transfer.to.slice(-6)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Token ID</div>
                        <div className="font-mono">{transfer.tokenId}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Storage Tab */}
      {activeTab === "storage" && showDetailedStorage && detailedStorage && (
        <div className="space-y-2">
          <div className="text-sm text-gray-400 mb-4">
            Showing all SSTORE and SLOAD operations from transaction trace
          </div>
          {detailedStorage.map((op, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-800 border border-gray-700 rounded text-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded font-semibold ${
                      op.op === "SSTORE"
                        ? "bg-orange-900/30 text-orange-400"
                        : "bg-blue-900/30 text-blue-400"
                    }`}
                  >
                    {op.op}
                  </span>
                  <span className="text-gray-400">PC: {op.pc}</span>
                  <span className="text-gray-400">Depth: {op.depth}</span>
                </div>
                <div className="text-gray-400">
                  Gas: {op.gas} (-{op.gasCost})
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-gray-400">Key</div>
                  <div className="font-mono text-xs break-all">
                    {formatStorageKey(op.key)}
                  </div>
                </div>
                {op.op === "SSTORE" ? (
                  <>
                    <div>
                      <div className="text-gray-400">Old Value</div>
                      <div className="font-mono text-xs break-all">
                        {formatStorageValue(op.oldValue)}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-gray-400">New Value</div>
                      <div className="font-mono text-xs break-all">
                        {formatStorageValue(op.newValue)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="text-gray-400">Value</div>
                    <div className="font-mono text-xs break-all">
                      {formatStorageValue(op.value)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {detailedStorage.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No storage operations in this transaction
            </div>
          )}
        </div>
      )}
    </div>
  );
}
