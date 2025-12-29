"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
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
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  addImpersonatedAccount,
  clearImpersonatedAccounts,
  clearSnapshotMetadata,
  createSnapshot,
  deleteSnapshotMetadata,
  dropAllTransactions,
  ethToWei,
  formatTimestamp,
  getCurrentBlockTimestamp,
  getImpersonatedAccounts,
  getSavedSnapshots,
  impersonateAccount,
  increaseTime,
  mineBlocks,
  removeImpersonatedAccount,
  reset,
  revertToSnapshot,
  saveSnapshotMetadata,
  setAutomine,
  setBalance,
  setNonce,
  stopImpersonatingAccount,
} from "@/lib/anvil-state";

export default function AnvilStateManager({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
} = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen =
    controlledOnClose !== undefined
      ? (value) => {
          if (!value) controlledOnClose();
        }
      : setInternalIsOpen;
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

  // AlertDialog states
  const [showDeleteSnapshotConfirm, setShowDeleteSnapshotConfirm] =
    useState(false);
  const [showClearSnapshotsConfirm, setShowClearSnapshotsConfirm] =
    useState(false);
  const [showClearImpersonationsConfirm, setShowClearImpersonationsConfirm] =
    useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDropTxsConfirm, setShowDropTxsConfirm] = useState(false);
  const [deleteSnapshotTarget, setDeleteSnapshotTarget] = useState(null);

  const loadSnapshots = useCallback(() => {
    setSnapshots(getSavedSnapshots());
  }, []);

  const loadImpersonations = useCallback(() => {
    setImpersonatedAccounts(getImpersonatedAccounts());
  }, []);

  const loadCurrentTimestamp = useCallback(async () => {
    try {
      const timestamp = await getCurrentBlockTimestamp();
      setCurrentTimestamp(timestamp);
    } catch (error) {
      console.error("Failed to load timestamp:", error);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadSnapshots();
    loadImpersonations();
    loadCurrentTimestamp();
  }, [loadCurrentTimestamp, loadImpersonations, loadSnapshots]);

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
    setDeleteSnapshotTarget(snapshotId);
    setShowDeleteSnapshotConfirm(true);
  }

  function confirmDeleteSnapshot() {
    if (deleteSnapshotTarget) {
      deleteSnapshotMetadata(deleteSnapshotTarget);
      loadSnapshots();
      showSuccess("Snapshot metadata deleted");
      setDeleteSnapshotTarget(null);
    }
    setShowDeleteSnapshotConfirm(false);
  }

  function handleClearSnapshots() {
    setShowClearSnapshotsConfirm(true);
  }

  function confirmClearSnapshots() {
    clearSnapshotMetadata();
    loadSnapshots();
    showSuccess("All snapshot metadata cleared");
    setShowClearSnapshotsConfirm(false);
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
          : "Interval mining disabled",
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

    const timestamp = parseInt(nextBlockTimestamp, 10);
    if (Number.isNaN(timestamp)) {
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

    const nonce = parseInt(nonceValue, 10);
    if (Number.isNaN(nonce) || nonce < 0) {
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
      setLoading((prev) => ({
        ...prev,
        [`stopImpersonate_${address}`]: false,
      }));
    }
  }

  function handleClearImpersonations() {
    setShowClearImpersonationsConfirm(true);
  }

  function confirmClearImpersonations() {
    clearImpersonatedAccounts();
    setImpersonatedAccounts([]);
    showSuccess("All impersonation tracking cleared");
    setShowClearImpersonationsConfirm(false);
  }

  async function handleReset() {
    setShowResetConfirm(true);
  }

  async function confirmReset() {
    setShowResetConfirm(false);
    setLoading((prev) => ({ ...prev, reset: true }));
    clearMessages();

    try {
      await reset();
      setSnapshots([]);
      setImpersonatedAccounts([]);
      showSuccess("Anvil reset successfully");
    } catch (err) {
      showError(err.message || "Failed to reset Anvil");
    } finally {
      setLoading((prev) => ({ ...prev, reset: false }));
    }
  }

  async function handleDropAllTransactions() {
    setShowDropTxsConfirm(true);
  }

  async function confirmDropAllTransactions() {
    setShowDropTxsConfirm(false);
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
      <Button
        onClick={() => setIsOpen(true)}
        variant="default"
        size="sm"
        title="Anvil State Management"
        className="bg-orange-600 hover:bg-orange-700"
      >
        ⚙️ Anvil
      </Button>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>⚙️ Anvil State Management</DialogTitle>
          </DialogHeader>

          {/* Messages */}
          {success && (
            <Alert className="bg-green-500/10 border-green-500/20">
              <AlertDescription className="text-green-600 dark:text-green-400 text-sm">
                {success}
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
              <TabsTrigger value="mining">Mining</TabsTrigger>
              <TabsTrigger value="time">Time</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Snapshots Tab */}
              <TabsContent value="snapshots" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Create Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Name *</Label>
                      <Input
                        type="text"
                        value={snapshotName}
                        onChange={(e) => setSnapshotName(e.target.value)}
                        placeholder="e.g., Before deployment"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Input
                        type="text"
                        value={snapshotDescription}
                        onChange={(e) => setSnapshotDescription(e.target.value)}
                        placeholder="Optional description"
                      />
                    </div>
                    <Button
                      onClick={handleCreateSnapshot}
                      disabled={loading.createSnapshot}
                    >
                      {loading.createSnapshot
                        ? "Creating..."
                        : "Create Snapshot"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Saved Snapshots</CardTitle>
                      {snapshots.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearSnapshots}
                          className="text-destructive hover:text-destructive"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {snapshots.length > 0 ? (
                      <div className="space-y-2">
                        {snapshots.map((snapshot) => (
                          <Card key={snapshot.id}>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold">
                                  {snapshot.name}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleRevertSnapshot(snapshot.id)
                                    }
                                    disabled={loading[`revert_${snapshot.id}`]}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {loading[`revert_${snapshot.id}`]
                                      ? "Reverting..."
                                      : "Revert"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleDeleteSnapshot(snapshot.id)
                                    }
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                              {snapshot.description && (
                                <div className="text-sm text-muted-foreground mb-2">
                                  {snapshot.description}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                ID: {snapshot.id} • Created:{" "}
                                {new Date(snapshot.timestamp).toLocaleString()}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No snapshots saved. Create one to save the current
                        state.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mining Tab */}
              <TabsContent value="mining" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Mine Blocks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        min="1"
                        value={blockCount}
                        onChange={(e) =>
                          setBlockCount(parseInt(e.target.value, 10) || 1)
                        }
                        className="flex-1"
                      />
                      <Button
                        onClick={handleMineBlocks}
                        disabled={loading.mineBlocks}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {loading.mineBlocks ? "Mining..." : "Mine Blocks"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Automine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleSetAutomine}
                        disabled={loading.automine}
                        className={
                          automineEnabled
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-muted hover:bg-muted/80"
                        }
                      >
                        {loading.automine
                          ? "Setting..."
                          : automineEnabled
                            ? "Enabled"
                            : "Disabled"}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {automineEnabled
                          ? "Blocks mined on each transaction"
                          : "Manual mining required"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interval Mining</CardTitle>
                    <CardDescription>
                      Mine blocks at regular intervals (0 to disable)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        min="0"
                        value={intervalMining}
                        onChange={(e) =>
                          setIntervalMining(parseInt(e.target.value, 10) || 0)
                        }
                        placeholder="Seconds (0 to disable)"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSetIntervalMining}
                        disabled={loading.intervalMining}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {loading.intervalMining ? "Setting..." : "Set Interval"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Time Tab */}
              <TabsContent value="time" className="space-y-6 mt-0">
                {currentTimestamp && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground mb-1">
                        Current Block Timestamp
                      </div>
                      <div className="text-lg font-mono">
                        {currentTimestamp}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTimestamp(currentTimestamp)}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Increase Time</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        min="1"
                        value={timeIncrease}
                        onChange={(e) =>
                          setTimeIncrease(parseInt(e.target.value, 10) || 1)
                        }
                        placeholder="Seconds"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleIncreaseTime}
                        disabled={loading.increaseTime}
                      >
                        {loading.increaseTime
                          ? "Increasing..."
                          : "Increase Time"}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {[3600, 86400, 604800].map((seconds) => (
                        <Button
                          key={seconds}
                          variant="secondary"
                          size="sm"
                          onClick={() => setTimeIncrease(seconds)}
                        >
                          {seconds === 3600
                            ? "1 hour"
                            : seconds === 86400
                              ? "1 day"
                              : "1 week"}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Set Next Block Timestamp</CardTitle>
                    <CardDescription>
                      Set the exact timestamp for the next mined block
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        value={nextBlockTimestamp}
                        onChange={(e) => setNextBlockTimestamp(e.target.value)}
                        placeholder="Unix timestamp"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSetNextBlockTimestamp}
                        disabled={loading.setTimestamp}
                      >
                        {loading.setTimestamp ? "Setting..." : "Set Timestamp"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accounts Tab */}
              <TabsContent value="accounts" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Set Balance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      type="text"
                      value={balanceAddress}
                      onChange={(e) => setBalanceAddress(e.target.value)}
                      placeholder="0x..."
                      className="font-mono"
                    />
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                        placeholder="ETH amount"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSetBalance}
                        disabled={loading.setBalance}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading.setBalance ? "Setting..." : "Set Balance"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Set Nonce</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      type="text"
                      value={nonceAddress}
                      onChange={(e) => setNonceAddress(e.target.value)}
                      placeholder="0x..."
                      className="font-mono"
                    />
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        min="0"
                        value={nonceValue}
                        onChange={(e) => setNonceValue(e.target.value)}
                        placeholder="Nonce value"
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSetNonce}
                        disabled={loading.setNonce}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading.setNonce ? "Setting..." : "Set Nonce"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Impersonate Account</CardTitle>
                    <CardDescription>
                      Send transactions as any address without needing the
                      private key
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        value={impersonationAddress}
                        onChange={(e) =>
                          setImpersonationAddress(e.target.value)
                        }
                        placeholder="0x..."
                        className="flex-1 font-mono"
                      />
                      <Button
                        onClick={handleImpersonateAccount}
                        disabled={loading.impersonate}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        {loading.impersonate ? "Starting..." : "Impersonate"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {impersonatedAccounts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Active Impersonations</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearImpersonations}
                          className="text-destructive hover:text-destructive"
                        >
                          Clear Tracking
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {impersonatedAccounts.map((address) => (
                          <div
                            key={address}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <span className="font-mono text-sm">{address}</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStopImpersonating(address)}
                              disabled={loading[`stopImpersonate_${address}`]}
                            >
                              {loading[`stopImpersonate_${address}`]
                                ? "Stopping..."
                                : "Stop"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6 mt-0">
                <Alert className="bg-yellow-500/10 border-yellow-500/20">
                  <AlertDescription className="text-yellow-600 dark:text-yellow-500 text-sm">
                    ⚠️ Warning: These operations are destructive and cannot be
                    undone.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle>Drop Pending Transactions</CardTitle>
                    <CardDescription>
                      Remove all pending transactions from the mempool
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleDropAllTransactions}
                      disabled={loading.dropTxs}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {loading.dropTxs
                        ? "Dropping..."
                        : "Drop All Transactions"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reset Anvil</CardTitle>
                    <CardDescription>
                      Reset the blockchain to genesis state. All data will be
                      lost.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleReset}
                      disabled={loading.reset}
                      variant="destructive"
                    >
                      {loading.reset ? "Resetting..." : "Reset Anvil"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Snapshot Confirmation */}
      <AlertDialog
        open={showDeleteSnapshotConfirm}
        onOpenChange={setShowDeleteSnapshotConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Snapshot Metadata?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the snapshot metadata. Note: The snapshot may
              still exist in Anvil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSnapshot}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Snapshots Confirmation */}
      <AlertDialog
        open={showClearSnapshotsConfirm}
        onOpenChange={setShowClearSnapshotsConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Snapshot Metadata?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all snapshot metadata. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearSnapshots}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Impersonations Confirmation */}
      <AlertDialog
        open={showClearImpersonationsConfirm}
        onOpenChange={setShowClearImpersonationsConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Clear All Impersonation Tracking?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all impersonation tracking. Note: This only clears
              tracking, accounts remain impersonated in Anvil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearImpersonations}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Anvil Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Anvil?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all state and cannot be undone. All balances,
              nonces, and deployed contracts will be reset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset Anvil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drop All Transactions Confirmation */}
      <AlertDialog
        open={showDropTxsConfirm}
        onOpenChange={setShowDropTxsConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drop All Pending Transactions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will drop all pending transactions from the mempool. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDropAllTransactions}>
              Drop All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
