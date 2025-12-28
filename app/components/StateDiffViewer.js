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
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Skeleton } from "@/app/components/ui/skeleton";

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
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error && !stateDiff) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <div className="font-semibold mb-2">Error Loading State Changes</div>
          <div className="text-sm">{error}</div>
        </AlertDescription>
      </Alert>
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
            <Button
              variant="outline"
              size="sm"
              onClick={loadDetailedStorage}
              disabled={loading}
              className="bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20"
            >
              {loading ? "Loading..." : "Load Detailed Storage"}
            </Button>
          )}
          <Button variant="default" size="sm" onClick={handleExport}>
            Export JSON
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-3">
            <div className="text-xs text-muted-foreground">Addresses</div>
            <div className="text-2xl font-bold">{summary.totalAddresses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="text-xs text-muted-foreground">Balance Changes</div>
            <div className="text-2xl font-bold">
              {summary.totalBalanceChanges}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="text-xs text-muted-foreground">Nonce Changes</div>
            <div className="text-2xl font-bold">
              {summary.totalNonceChanges}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="text-xs text-muted-foreground">Code Changes</div>
            <div className="text-2xl font-bold">{summary.totalCodeChanges}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="text-xs text-muted-foreground">Storage Ops</div>
            <div className="text-2xl font-bold">
              {summary.totalStorageChanges}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="balances">
            Balances ({summary.totalBalanceChanges})
          </TabsTrigger>
          {(erc20Transfers.length > 0 || erc721Transfers.length > 0) && (
            <TabsTrigger value="tokens">
              Tokens ({erc20Transfers.length + erc721Transfers.length})
            </TabsTrigger>
          )}
          {showDetailedStorage && detailedStorage && (
            <TabsTrigger value="storage">
              Storage Ops ({detailedStorage.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {stateDiff.addresses.map((addressChange, idx) => {
            const hasChanges =
              addressChange.balanceChange ||
              addressChange.nonceChange ||
              addressChange.codeChange;

            if (!hasChanges) return null;

            const isExpanded = expandedAddresses[addressChange.address];

            return (
              <Card key={idx}>
                {/* Address Header */}
                <button
                  type="button"
                  onClick={() => toggleAddress(addressChange.address)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors rounded-t-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {categorizeAddress(
                        addressChange.address,
                        addressChange.codeChange?.after,
                      )}
                    </Badge>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAddress(addressChange.address);
                      }}
                      className="font-mono text-sm text-primary hover:underline"
                      title="Click to copy"
                    >
                      {addressChange.address.slice(0, 10)}...
                      {addressChange.address.slice(-8)}
                    </button>
                    <div className="flex gap-2">
                      {addressChange.balanceChange && (
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                        >
                          Balance
                        </Badge>
                      )}
                      {addressChange.nonceChange && (
                        <Badge
                          variant="outline"
                          className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        >
                          Nonce
                        </Badge>
                      )}
                      {addressChange.codeChange && (
                        <Badge
                          variant="outline"
                          className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        >
                          {addressChange.codeChange.isDeployment
                            ? "Deployed"
                            : "Code Changed"}
                        </Badge>
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
                  <CardContent className="space-y-3">
                    {/* Balance Change */}
                    {addressChange.balanceChange && (
                      <Alert className="bg-green-500/10 border-green-500/20">
                        <AlertDescription>
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                            Balance Change
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">
                                Before
                              </div>
                              <div className="font-mono">
                                {(
                                  Number(addressChange.balanceChange.before) /
                                  1e18
                                ).toFixed(6)}{" "}
                                ETH
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">After</div>
                              <div className="font-mono">
                                {(
                                  Number(addressChange.balanceChange.after) /
                                  1e18
                                ).toFixed(6)}{" "}
                                ETH
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">
                                Difference
                              </div>
                              <div
                                className={`font-mono font-semibold ${
                                  BigInt(addressChange.balanceChange.diff) > 0n
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-destructive"
                                }`}
                              >
                                {
                                  formatBalanceChange(
                                    addressChange.balanceChange.diff,
                                  ).sign
                                }
                                {
                                  formatBalanceChange(
                                    addressChange.balanceChange.diff,
                                  ).eth
                                }{" "}
                                ETH
                              </div>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Nonce Change */}
                    {addressChange.nonceChange && (
                      <Alert className="bg-blue-500/10 border-blue-500/20">
                        <AlertDescription>
                          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
                            Nonce Change
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">
                                Before
                              </div>
                              <div className="font-mono">
                                {addressChange.nonceChange.before}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">After</div>
                              <div className="font-mono">
                                {addressChange.nonceChange.after}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">
                                Difference
                              </div>
                              <div className="font-mono text-blue-600 dark:text-blue-400">
                                +{addressChange.nonceChange.diff}
                              </div>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Code Change */}
                    {addressChange.codeChange && (
                      <Alert className="bg-purple-500/10 border-purple-500/20">
                        <AlertDescription>
                          <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                            Code Change
                          </div>
                          {addressChange.codeChange.isDeployment && (
                            <div className="text-sm text-green-600 dark:text-green-400">
                              ✓ Contract Deployed (
                              {addressChange.codeChange.after?.length || 0}{" "}
                              bytes)
                            </div>
                          )}
                          {addressChange.codeChange.isDestruction && (
                            <div className="text-sm text-destructive">
                              ✗ Contract Destroyed
                            </div>
                          )}
                          {!addressChange.codeChange.isDeployment &&
                            !addressChange.codeChange.isDestruction && (
                              <div className="text-sm text-yellow-600 dark:text-yellow-500">
                                ⚠ Code Modified (rare - possible proxy upgrade)
                              </div>
                            )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {stateDiff.addresses.filter(
            (a) => a.balanceChange || a.nonceChange || a.codeChange,
          ).length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No state changes detected in this transaction
            </div>
          )}
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances" className="space-y-2 mt-4">
          {stateDiff.addresses
            .filter((a) => a.balanceChange)
            .map((addressChange, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(addressChange.address)}
                      className="font-mono text-sm text-primary hover:underline"
                      title="Click to copy"
                    >
                      {addressChange.address}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Before</div>
                      <div className="font-mono">
                        {(
                          Number(addressChange.balanceChange.before) / 1e18
                        ).toFixed(6)}{" "}
                        ETH
                      </div>
                      <div className="text-xs text-muted-foreground/70 font-mono">
                        {addressChange.balanceChange.before} wei
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">After</div>
                      <div className="font-mono">
                        {(
                          Number(addressChange.balanceChange.after) / 1e18
                        ).toFixed(6)}{" "}
                        ETH
                      </div>
                      <div className="text-xs text-muted-foreground/70 font-mono">
                        {addressChange.balanceChange.after} wei
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Change</div>
                      <div
                        className={`font-mono font-semibold ${
                          BigInt(addressChange.balanceChange.diff) > 0n
                            ? "text-green-600 dark:text-green-400"
                            : "text-destructive"
                        }`}
                      >
                        {
                          formatBalanceChange(addressChange.balanceChange.diff)
                            .sign
                        }
                        {
                          formatBalanceChange(addressChange.balanceChange.diff)
                            .eth
                        }{" "}
                        ETH
                      </div>
                      <div className="text-xs text-muted-foreground/70 font-mono">
                        {
                          formatBalanceChange(addressChange.balanceChange.diff)
                            .sign
                        }
                        {
                          formatBalanceChange(addressChange.balanceChange.diff)
                            .wei
                        }{" "}
                        wei
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          {stateDiff.addresses.filter((a) => a.balanceChange).length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No balance changes in this transaction
            </div>
          )}
        </TabsContent>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-4 mt-4">
          {/* ERC20 Transfers */}
          {erc20Transfers.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-yellow-600 dark:text-yellow-400">
                ERC20 Transfers ({erc20Transfers.length})
              </h4>
              <div className="space-y-2">
                {erc20Transfers.map((transfer, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
                        >
                          ERC20
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Token:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAddress(transfer.token)}
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {transfer.token.slice(0, 10)}...
                          {transfer.token.slice(-8)}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">From</div>
                          <div className="font-mono text-xs">
                            {transfer.from.slice(0, 10)}...
                            {transfer.from.slice(-6)}
                          </div>
                        </div>
                        <div className="text-muted-foreground">→</div>
                        <div>
                          <div className="text-muted-foreground">To</div>
                          <div className="font-mono text-xs">
                            {transfer.to.slice(0, 10)}...{transfer.to.slice(-6)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Amount</div>
                          <div className="font-mono">
                            {BigInt(transfer.value).toString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ERC721 Transfers */}
          {erc721Transfers.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-purple-600 dark:text-purple-400">
                ERC721 Transfers ({erc721Transfers.length})
              </h4>
              <div className="space-y-2">
                {erc721Transfers.map((transfer, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        >
                          ERC721
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Token:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAddress(transfer.token)}
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {transfer.token.slice(0, 10)}...
                          {transfer.token.slice(-8)}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">From</div>
                          <div className="font-mono text-xs">
                            {transfer.from.slice(0, 10)}...
                            {transfer.from.slice(-6)}
                          </div>
                        </div>
                        <div className="text-muted-foreground">→</div>
                        <div>
                          <div className="text-muted-foreground">To</div>
                          <div className="font-mono text-xs">
                            {transfer.to.slice(0, 10)}...{transfer.to.slice(-6)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Token ID</div>
                          <div className="font-mono">{transfer.tokenId}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Storage Tab */}
        <TabsContent value="storage" className="space-y-2 mt-4">
          {showDetailedStorage && detailedStorage && (
            <>
              <div className="text-sm text-muted-foreground mb-4">
                Showing all SSTORE and SLOAD operations from transaction trace
              </div>
              {detailedStorage.map((op, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={
                            op.op === "SSTORE"
                              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          }
                        >
                          {op.op}
                        </Badge>
                        <span className="text-muted-foreground">
                          PC: {op.pc}
                        </span>
                        <span className="text-muted-foreground">
                          Depth: {op.depth}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Gas: {op.gas} (-{op.gasCost})
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-muted-foreground">Key</div>
                        <div className="font-mono text-xs break-all">
                          {formatStorageKey(op.key)}
                        </div>
                      </div>
                      {op.op === "SSTORE" ? (
                        <>
                          <div>
                            <div className="text-muted-foreground">
                              Old Value
                            </div>
                            <div className="font-mono text-xs break-all">
                              {formatStorageValue(op.oldValue)}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-muted-foreground">
                              New Value
                            </div>
                            <div className="font-mono text-xs break-all">
                              {formatStorageValue(op.newValue)}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div>
                          <div className="text-muted-foreground">Value</div>
                          <div className="font-mono text-xs break-all">
                            {formatStorageValue(op.value)}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {detailedStorage.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No storage operations in this transaction
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
