"use client";

import { useState, useEffect } from "react";
import {
  createSnapshot,
  revertToSnapshot,
  mineBlock,
  mineBlocks,
  increaseTime,
  setNextBlockTimestamp,
  setBalance,
  setNonce,
  impersonateAccount,
  stopImpersonatingAccount,
  setAutomine,
  setIntervalMining,
  reset,
  dropAllTransactions,
  getSavedSnapshots,
  saveSnapshotMetadata,
  deleteSnapshotMetadata,
  clearSnapshotMetadata,
  getImpersonatedAccounts,
  addImpersonatedAccount,
  removeImpersonatedAccount,
  clearImpersonatedAccounts,
  ethToWei,
  weiToEth,
  formatTimestamp,
  getCurrentBlockTimestamp,
} from "@/lib/anvil-state";
import { publicClient } from "@/lib/viem";

export default function AnvilStateManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("snapshots");
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Snapshots
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotDescription, setSnapshotDescription] = useState("");

  // Mining
  const [blockCount, setBlockCount] = useState(1);
  const [automineEnabled, setAutomineEnabled] = useState(true);
  const [intervalMining, setIntervalMining] = useState(0);

  // Time
  const [timeIncrease, setTimeIncrease] = useState(3600); // 1 hour default
  const [nextBlockTimestamp, setNextBlockTimestamp] = useState("");
  const [currentTimestamp, setCurrentTimestamp] = useState(null);

  // Balance
  const [balanceAddress, setBalanceAddress] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("10");

  // Nonce
  const [nonceAddress, setNonceAddress] = useState("");
  const [nonceValue, setNonceValue] = useState("0");

  // Impersonation
  const [impersonationAddress, setImpersonationAddress] = useState("");
  const [impersonatedAccounts, setImpersonatedAccounts] = useState([]);

  // Load data on mount
  useEffect(() => {
    loadSnapshots();
    loadImpersonations();
    loadCurrentTimestamp();
  }, []);

  function loadSnapshots() {
    setSnapshots(getSavedSnapshots());
  }

  function loadImpersonations() {
    setImpersonatedAccounts(getImpersonatedAccounts());
  }

  async function loadCurrentTimestamp() {
    try {
      const timestamp = await getCurrentBlockTimestamp();
      setCurrentTimestamp(timestamp);
    } catch (error) {
      console.error("Failed to load timestamp:", error);
    }
  }

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  function showSuccess(message) {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  }

  function showError(message) {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }

  async function handleCreateSnapshot() {
    if (!snapshotName.trim()) {
      showError("Snapshot name is required");
      return;
    }

    setLoading((prev) => ({ ...prev, createSnapshot: true }));
    clearMessages();

    try {
      const snapshotId = await createSnapshot();
      saveSnapshotMetadata(snapshotId, snapshotName, snapshotDescription);
      loadSnapshots();
      setSnapshotName("");
      setSnapshotDescription("");
      showSuccess(`Snapshot created: ${snapshotId}`);
    } catch (err) {
      showError(err.message || "Failed to create snapshot");
    } finally {
      setLoading((prev) => ({ ...prev, createSnapshot: false }));
    }
  }

  async function handleRevertSnapshot(snapshotId) {
    setLoading((prev) => ({ ...prev, [`revert_${snapshotId}`]: true }));
    clearMessages();

    try {
      const success = await revertToSnapshot(snapshotId);
      if (success) {
        showSuccess(`Reverted to snapshot: ${snapshotId}`);
        await loadCurrentTimestamp();
      } else {
        showError("Failed to revert to snapshot");
      }
    } catch (err) {
      showError(err.message || "Failed to revert to snapshot");
    } finally {
      setLoading((prev) => ({ ...prev, [`revert_${snapshotId}`]: false }));
    }
  }

  function handleDeleteSnapshot(snapshotId) {
    if (confirm("Delete this snapshot metadata? (Note: The snapshot may still exist in Anvil)")) {
      deleteSnapshotMetadata(snapshotId);
      loadSnapshots();
      showSuccess("Snapshot metadata deleted");
    }
  }

  function handleClearSnapshots() {
    if (confirm("Clear all snapshot metadata?")) {
      clearSnapshotMetadata();
      loadSnapshots();
      showSuccess("All snapshot metadata cleared");
    }
  }

  async function handleMineBlocks() {
    if (blockCount < 1) {
      showError("Block count must be at least 1");
      return;
    }

    setLoading((prev) => ({ ...prev, mineBlocks: true }));
    clearMessages();

    try {
      await mineBlocks(blockCount);
      showSuccess(`Mined ${blockCount} block(s)`);
      await loadCurrentTimestamp();
    } catch (err) {
      showError(err.message || "Failed to mine blocks");
    } finally {
      setLoading((prev) => ({ ...prev, mineBlocks: false }));
    }
  }

  async function handleSetAutomine() {
    setLoading((prev) => ({ ...prev, automine: true }));
    clearMessages();

    try {
      await setAutomine(!automineEnabled);
      setAutomineEnabled(!automineEnabled);
      showSuccess(`Automine ${!automineEnabled ? "enabled" : "disabled"}`);
    } catch (err) {
      showError(err.message || "Failed to set automine");
    } finally {
      setLoading((prev) => ({ ...prev, automine: false }));
    }
  }

  async function handleSetIntervalMining() {
    setLoading((prev) => ({ ...prev, intervalMining: true }));
    clearMessages();

    try {
      await setIntervalMining(intervalMining);
      showSuccess(
        intervalMining > 0
          ? `Interval mining set to ${intervalMining}s`
          : "Interval mining disabled"
      );
    } catch (err) {
      showError(err.message || "Failed to set interval mining");
    } finally {
      setLoading((prev) => ({ ...prev, intervalMining: false }));
    }
  }

  async function handleIncreaseTime() {
    if (timeIncrease < 1) {
      showError("Time increase must be at least 1 second");
      return;
    }

    setLoading((prev) => ({ ...prev, increaseTime: true }));
    clearMessages();

    try {
      await increaseTime(timeIncrease);
      showSuccess(`Time increased by ${timeIncrease} seconds`);
      await loadCurrentTimestamp();
    } catch (err) {
      showError(err.message || "Failed to increase time");
    } finally {
      setLoading((prev) => ({ ...prev, increaseTime: false }));
    }
  }

  async function handleSetNextBlockTimestamp() {
    if (!nextBlockTimestamp) {
      showError("Timestamp is required");
      return;
    }

    const timestamp = parseInt(nextBlockTimestamp);
    if (isNaN(timestamp)) {
      showError("Invalid timestamp");
      return;
    }

    setLoading((prev) => ({ ...prev, setTimestamp: true }));
    clearMessages();

    try {
      await setNextBlockTimestamp(timestamp);
      showSuccess(`Next block timestamp set to ${timestamp}`);
      await loadCurrentTimestamp();
    } catch (err) {
      showError(err.message || "Failed to set timestamp");
    } finally {
      setLoading((prev) => ({ ...prev, setTimestamp: false }));
    }
  }

  async function handleSetBalance() {
    if (!balanceAddress || !balanceAmount) {
      showError("Address and amount are required");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(balanceAddress)) {
      showError("Invalid address format");
      return;
    }

    setLoading((prev) => ({ ...prev, setBalance: true }));
    clearMessages();

    try {
      const weiAmount = ethToWei(balanceAmount);
      await setBalance(balanceAddress, weiAmount);
      showSuccess(`Balance set to ${balanceAmount} ETH for ${balanceAddress}`);
    } catch (err) {
      showError(err.message || "Failed to set balance");
    } finally {
      setLoading((prev) => ({ ...prev, setBalance: false }));
    }
  }

  async function handleSetNonce() {
    if (!nonceAddress) {
      showError("Address is required");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(nonceAddress)) {
      showError("Invalid address format");
      return;
    }

    const nonce = parseInt(nonceValue);
    if (isNaN(nonce) || nonce < 0) {
      showError("Invalid nonce value");
      return;
    }

    setLoading((prev) => ({ ...prev, setNonce: true }));
    clearMessages();

    try {
      await setNonce(nonceAddress, nonce);
      showSuccess(`Nonce set to ${nonce} for ${nonceAddress}`);
    } catch (err) {
      showError(err.message || "Failed to set nonce");
    } finally {
      setLoading((prev) => ({ ...prev, setNonce: false }));
    }
  }

  async function handleImpersonateAccount() {
    if (!impersonationAddress) {
      showError("Address is required");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(impersonationAddress)) {
      showError("Invalid address format");
      return;
    }

    setLoading((prev) => ({ ...prev, impersonate: true }));
    clearMessages();

    try {
      await impersonateAccount(impersonationAddress);
      addImpersonatedAccount(impersonationAddress);
      loadImpersonations();
      setImpersonationAddress("");
      showSuccess(`Impersonating ${impersonationAddress}`);
    } catch (err) {
      showError(err.message || "Failed to impersonate account");
    } finally {
      setLoading((prev) => ({ ...prev, impersonate: false }));
    }
  }

  async function handleStopImpersonating(address) {
    setLoading((prev) => ({ ...prev, [`stopImpersonate_${address}`]: true }));
    clearMessages();

    try {
      await stopImpersonatingAccount(address);
      removeImpersonatedAccount(address);
      loadImpersonations();
      showSuccess(`Stopped impersonating ${address}`);
    } catch (err) {
      showError(err.message || "Failed to stop impersonating");
    } finally {
      setLoading((prev) => ({ ...prev, [`stopImpersonate_${address}`]: false }));
    }
  }

  function handleClearImpersonations() {
    if (confirm("Clear all impersonation tracking? (Note: This only clears tracking, accounts remain impersonated in Anvil)")) {
      clearImpersonatedAccounts();
      loadImpersonations();
      showSuccess("Impersonation tracking cleared");
    }
  }

  async function handleReset() {
    if (!confirm("Reset Anvil? This will clear all state and cannot be undone.")) {
      return;
    }

    setLoading((prev) => ({ ...prev, reset: true }));
    clearMessages();

    try {
      await reset();
      clearSnapshotMetadata();
      clearImpersonatedAccounts();
      loadSnapshots();
      loadImpersonations();
      await loadCurrentTimestamp();
      showSuccess("Anvil reset successfully");
    } catch (err) {
      showError(err.message || "Failed to reset Anvil");
    } finally {
      setLoading((prev) => ({ ...prev, reset: false }));
    }
  }

  async function handleDropAllTransactions() {
    if (!confirm("Drop all pending transactions?")) {
      return;
    }

    setLoading((prev) => ({ ...prev, dropTxs: true }));
    clearMessages();

    try {
      await dropAllTransactions();
      showSuccess("All pending transactions dropped");
    } catch (err) {
      showError(err.message || "Failed to drop transactions");
    } finally {
      setLoading((prev) => ({ ...prev, dropTxs: false }));
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors font-semibold"
        title="Anvil State Management"
      >
        ⚙️ Anvil
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Anvil State Management</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-900/20 border border-green-700 rounded text-green-400 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4 border-b border-gray-700">
          {["snapshots", "mining", "time", "accounts", "advanced"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "text-orange-400 border-b-2 border-orange-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Snapshots Tab */}
          {activeTab === "snapshots" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Create Snapshot</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Name *</label>
                    <input
                      type="text"
                      value={snapshotName}
                      onChange={(e) => setSnapshotName(e.target.value)}
                      placeholder="e.g., Before deployment"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={snapshotDescription}
                      onChange={(e) => setSnapshotDescription(e.target.value)}
                      placeholder="Optional description"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateSnapshot}
                    disabled={loading.createSnapshot}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors font-semibold"
                  >
                    {loading.createSnapshot ? "Creating..." : "Create Snapshot"}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Saved Snapshots</h3>
                  {snapshots.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSnapshots}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                {snapshots.length > 0 ? (
                  <div className="space-y-2">
                    {snapshots.map((snapshot) => (
                      <div
                        key={snapshot.id}
                        className="p-4 bg-gray-800 border border-gray-700 rounded"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-white">{snapshot.name}</div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleRevertSnapshot(snapshot.id)}
                              disabled={loading[`revert_${snapshot.id}`]}
                              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded"
                            >
                              {loading[`revert_${snapshot.id}`] ? "Reverting..." : "Revert"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSnapshot(snapshot.id)}
                              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {snapshot.description && (
                          <div className="text-sm text-gray-400 mb-2">{snapshot.description}</div>
                        )}
                        <div className="text-xs text-gray-500">
                          ID: {snapshot.id} • Created: {new Date(snapshot.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No snapshots saved. Create one to save the current state.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mining Tab */}
          {activeTab === "mining" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Mine Blocks</h3>
                <div className="flex gap-3">
                  <input
                    type="number"
                    min="1"
                    value={blockCount}
                    onChange={(e) => setBlockCount(parseInt(e.target.value) || 1)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                  />
                  <button
                    type="button"
                    onClick={handleMineBlocks}
                    disabled={loading.mineBlocks}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors font-semibold"
                  >
                    {loading.mineBlocks ? "Mining..." : "Mine Blocks"}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Automine</h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSetAutomine}
                    disabled={loading.automine}
                    className={`px-4 py-2 rounded transition-colors font-semibold ${
                      automineEnabled
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-600 hover:bg-gray-700"
                    } disabled:bg-gray-600 text-white`}
                  >
                    {loading.automine ? "Setting..." : automineEnabled ? "Enabled" : "Disabled"}
                  </button>
                  <span className="text-sm text-gray-400">
                    {automineEnabled ? "Blocks mined on each transaction" : "Manual mining required"}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Interval Mining</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="0"
                      value={intervalMining}
                      onChange={(e) => setIntervalMining(parseInt(e.target.value) || 0)}
                      placeholder="Seconds (0 to disable)"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSetIntervalMining}
                      disabled={loading.intervalMining}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors font-semibold"
                    >
                      {loading.intervalMining ? "Setting..." : "Set Interval"}
                    </button>
                  </div>
                  <div className="text-sm text-gray-400">
                    Mine blocks at regular intervals (0 to disable)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Tab */}
          {activeTab === "time" && (
            <div className="space-y-6">
              {currentTimestamp && (
                <div className="p-4 bg-gray-800 border border-gray-700 rounded">
                  <div className="text-sm text-gray-400 mb-1">Current Block Timestamp</div>
                  <div className="text-lg font-mono text-white">{currentTimestamp}</div>
                  <div className="text-sm text-gray-400">{formatTimestamp(currentTimestamp)}</div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Increase Time</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="1"
                      value={timeIncrease}
                      onChange={(e) => setTimeIncrease(parseInt(e.target.value) || 1)}
                      placeholder="Seconds"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                    <button
                      type="button"
                      onClick={handleIncreaseTime}
                      disabled={loading.increaseTime}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors font-semibold"
                    >
                      {loading.increaseTime ? "Increasing..." : "Increase Time"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {[3600, 86400, 604800].map((seconds) => (
                      <button
                        key={seconds}
                        type="button"
                        onClick={() => setTimeIncrease(seconds)}
                        className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
                      >
                        {seconds === 3600 ? "1 hour" : seconds === 86400 ? "1 day" : "1 week"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Set Next Block Timestamp</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={nextBlockTimestamp}
                      onChange={(e) => setNextBlockTimestamp(e.target.value)}
                      placeholder="Unix timestamp"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSetNextBlockTimestamp}
                      disabled={loading.setTimestamp}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors font-semibold"
                    >
                      {loading.setTimestamp ? "Setting..." : "Set Timestamp"}
                    </button>
                  </div>
                  <div className="text-sm text-gray-400">
                    Set the exact timestamp for the next mined block
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === "accounts" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Set Balance</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={balanceAddress}
                    onChange={(e) => setBalanceAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono"
                  />
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      placeholder="ETH amount"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSetBalance}
                      disabled={loading.setBalance}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors font-semibold"
                    >
                      {loading.setBalance ? "Setting..." : "Set Balance"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Set Nonce</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={nonceAddress}
                    onChange={(e) => setNonceAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono"
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="0"
                      value={nonceValue}
                      onChange={(e) => setNonceValue(e.target.value)}
                      placeholder="Nonce value"
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSetNonce}
                      disabled={loading.setNonce}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded transition-colors font-semibold"
                    >
                      {loading.setNonce ? "Setting..." : "Set Nonce"}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Impersonate Account</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={impersonationAddress}
                      onChange={(e) => setImpersonationAddress(e.target.value)}
                      placeholder="0x..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleImpersonateAccount}
                      disabled={loading.impersonate}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded transition-colors font-semibold"
                    >
                      {loading.impersonate ? "Starting..." : "Impersonate"}
                    </button>
                  </div>
                  <div className="text-sm text-gray-400">
                    Send transactions as any address without needing the private key
                  </div>
                </div>
              </div>

              {impersonatedAccounts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Active Impersonations</h3>
                    <button
                      type="button"
                      onClick={handleClearImpersonations}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Clear Tracking
                    </button>
                  </div>
                  <div className="space-y-2">
                    {impersonatedAccounts.map((address) => (
                      <div
                        key={address}
                        className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded"
                      >
                        <span className="font-mono text-sm text-white">{address}</span>
                        <button
                          type="button"
                          onClick={() => handleStopImpersonating(address)}
                          disabled={loading[`stopImpersonate_${address}`]}
                          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded"
                        >
                          {loading[`stopImpersonate_${address}`] ? "Stopping..." : "Stop"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === "advanced" && (
            <div className="space-y-6">
              <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded text-yellow-400 text-sm">
                ⚠️ Warning: These operations are destructive and cannot be undone.
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Drop Pending Transactions</h3>
                <button
                  type="button"
                  onClick={handleDropAllTransactions}
                  disabled={loading.dropTxs}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded transition-colors font-semibold"
                >
                  {loading.dropTxs ? "Dropping..." : "Drop All Transactions"}
                </button>
                <div className="text-sm text-gray-400 mt-2">
                  Remove all pending transactions from the mempool
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Reset Anvil</h3>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading.reset}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-colors font-semibold"
                >
                  {loading.reset ? "Resetting..." : "Reset Anvil"}
                </button>
                <div className="text-sm text-gray-400 mt-2">
                  Reset the blockchain to genesis state. All data will be lost.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
