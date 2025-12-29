"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Card, CardContent } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  clearDeployments,
  deleteDeployment,
  exportDeployments,
  getDeploymentStats,
  getDeployments,
  importDeployments,
  linkDeploymentsToABIs,
  loadDeployments,
  scanFoundryDeployments,
} from "@/lib/foundry-deployments";

export default function DeploymentTracker({ defaultChainId = "31337" }) {
  const router = useRouter();
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadFromStorage = useCallback(() => {
    const stored = getDeployments(
      selectedChain === "all" ? null : selectedChain,
    );
    setDeployments(stored);
    setStats(getDeploymentStats());
  }, [selectedChain]);

  // Load deployments from localStorage on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  async function handleScan() {
    setLoading(true);
    setError(null);
    setLinkResult(null);

    try {
      const result = await scanFoundryDeployments(
        selectedChain === "all" ? null : selectedChain,
        showHistory,
      );

      if (!result.found) {
        const errorMsg = "No Foundry project detected";
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (!result.hasBroadcast) {
        const errorMsg =
          "No broadcast directory found. Run 'forge script' to deploy contracts.";
        setError(errorMsg);
        toast.error(errorMsg);
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
      toast.success(`Scanned ${count} deployments`);
    } catch (err) {
      const errorMsg = err.message || "Failed to scan deployments";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("Scan error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setShowClearConfirm(true);
  }

  function confirmClear() {
    clearDeployments();
    setDeployments([]);
    setHistory(null);
    setStats(null);
    setLinkResult(null);
    setShowClearConfirm(false);
    toast.success("All deployment data cleared");
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
    toast.success("Deployments exported");
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
        toast.success(`Imported ${count} deployments`);
      } catch (err) {
        toast.error(`Import failed: ${err.message}`);
      }
    };
    input.click();
  }

  function handleDelete(address, chainId) {
    setDeleteTarget({ address, chainId });
    setShowDeleteConfirm(true);
  }

  function confirmDelete() {
    if (deleteTarget) {
      deleteDeployment(deleteTarget.address, deleteTarget.chainId);
      loadFromStorage();
      toast.success("Deployment deleted");
      setDeleteTarget(null);
    }
    setShowDeleteConfirm(false);
  }

  function handleCopyAddress(address) {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  }

  function handleNavigateToAddress(address) {
    router.push(`/address/${address}`);
  }

  function handleNavigateToTx(hash) {
    if (hash) {
      router.push(`/tx/${hash}`);
    }
  }

  function handleNavigateToBlock(blockNumber) {
    if (blockNumber) {
      router.push(`/block/${blockNumber}`);
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
          <Button onClick={handleScan} disabled={loading} variant="default">
            {loading ? "Scanning..." : "Scan Deployments"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={deployments.length === 0}
            variant="secondary"
          >
            Export
          </Button>
          <Button onClick={handleImport} variant="secondary">
            Import
          </Button>
          <Button
            onClick={handleClear}
            disabled={deployments.length === 0}
            variant="destructive"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Options */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="chain-select">Chain ID:</Label>
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger id="chain-select" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  <SelectItem value="31337">31337 (Anvil)</SelectItem>
                  <SelectItem value="1">1 (Mainnet)</SelectItem>
                  <SelectItem value="11155111">11155111 (Sepolia)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="showHistory"
                checked={showHistory}
                onCheckedChange={setShowHistory}
              />
              <Label htmlFor="showHistory" className="cursor-pointer">
                Include full history
              </Label>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Input
                type="text"
                placeholder="Filter by name, address, or script..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                Total Deployments
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">
                Unique Contracts
              </div>
              <div className="text-2xl font-bold">{stats.contractCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Chains</div>
              <div className="text-2xl font-bold">{stats.chainCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Latest</div>
              <div className="text-sm font-mono">
                {stats.latestDeployment
                  ? new Date(stats.latestDeployment).toLocaleString()
                  : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Link Result */}
      {linkResult && (
        <Alert>
          <AlertDescription>
            <div className="font-medium">ABIs Linked</div>
            <div className="text-sm">
              Linked {linkResult.linked} of {linkResult.total} deployments to
              ABIs
              {linkResult.notFound > 0 &&
                ` (${linkResult.notFound} ABIs not found)`}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="font-medium">Error</div>
            <div className="text-sm">{error}</div>
          </AlertDescription>
        </Alert>
      )}

      {/* Deployments Table */}
      {filteredDeployments.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSortBy("name");
                          setSortDesc(!sortDesc);
                        }}
                        className="hover:text-primary"
                      >
                        Contract {sortBy === "name" && (sortDesc ? "↓" : "↑")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSortBy("address");
                          setSortDesc(!sortDesc);
                        }}
                        className="hover:text-primary"
                      >
                        Address {sortBy === "address" && (sortDesc ? "↓" : "↑")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSortBy("block");
                          setSortDesc(!sortDesc);
                        }}
                        className="hover:text-primary"
                      >
                        Block {sortBy === "block" && (sortDesc ? "↓" : "↑")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSortBy("timestamp");
                          setSortDesc(!sortDesc);
                        }}
                        className="hover:text-primary"
                      >
                        Deployed{" "}
                        {sortBy === "timestamp" && (sortDesc ? "↓" : "↑")}
                      </Button>
                    </TableHead>
                    <TableHead>Script</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeployments.map((deployment, idx) => (
                    <TableRow
                      key={`${deployment.contractAddress}-${deployment.chainId}-${idx}`}
                    >
                      <TableCell className="font-mono text-sm">
                        {deployment.contractName || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() =>
                            handleCopyAddress(deployment.contractAddress)
                          }
                          className="font-mono text-sm p-0 h-auto"
                          title="Click to copy"
                        >
                          {deployment.contractAddress?.slice(0, 10)}...
                          {deployment.contractAddress?.slice(-8)}
                        </Button>
                      </TableCell>
                      <TableCell>
                        {deployment.blockNumber ? (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() =>
                              handleNavigateToBlock(deployment.blockNumber)
                            }
                            className="p-0 h-auto"
                          >
                            {deployment.blockNumber}
                          </Button>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {deployment.deploymentTimestamp
                          ? new Date(
                              deployment.deploymentTimestamp,
                            ).toLocaleString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {deployment.scriptName || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {deployment.chainId || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              handleNavigateToAddress(
                                deployment.contractAddress,
                              )
                            }
                            title="View contract"
                          >
                            View
                          </Button>
                          {deployment.transactionHash && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                handleNavigateToTx(deployment.transactionHash)
                              }
                              title="View deployment transaction"
                            >
                              Tx
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleDelete(
                                deployment.contractAddress,
                                deployment.chainId,
                              )
                            }
                            title="Delete"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="text-muted-foreground">
              {deployments.length === 0
                ? "No deployments found. Click 'Scan Deployments' to load from broadcast files."
                : "No deployments match the current filter."}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history && history.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Deployment History</h3>
          <div className="space-y-4">
            {history.map((entry, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono font-medium">
                      {entry.scriptName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.timestamp
                        ? new Date(entry.timestamp).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Chain: {entry.chainId} • File: {entry.fileName}
                    {entry.commit && ` • Commit: ${entry.commit.slice(0, 8)}`}
                  </div>
                  <div className="pl-4 border-l-2 border-border space-y-2">
                    {entry.deployments.map((deployment, dIdx) => (
                      <div key={dIdx} className="text-sm">
                        <span className="font-mono">
                          {deployment.contractName}
                        </span>
                        {" → "}
                        <span className="text-primary font-mono">
                          {deployment.contractAddress}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Clear Confirmation AlertDialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Deployment Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all deployment data. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deployment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the deployment for{" "}
              {deleteTarget?.address}. This action cannot be undone.
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
    </div>
  );
}
