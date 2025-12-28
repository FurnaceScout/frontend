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
  DialogFooter,
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
import { Alert, AlertDescription } from "@/app/components/ui/alert";

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
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
          "Foundry project detected but not compiled. Run 'forge build' first.",
        );
        setProject(result);
        return;
      }

      setProject(result);

      // Save config
      if (result.config) {
        saveFoundryConfig(result.config);
      }

      toast.success("Foundry project detected successfully");
    } catch (err) {
      const errorMsg = err.message || "Failed to scan for Foundry project";
      setError(errorMsg);
      setProject(null);
      toast.error(errorMsg);
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
      toast.success("ABIs loaded successfully!");

      setTimeout(() => {
        setLoadSuccess(false);
      }, 3000);
    } catch (err) {
      const errorMsg = err.message || "Failed to load ABIs";
      setError(errorMsg);
      toast.error(errorMsg);
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
      toast.success("Contract linked successfully");
    } catch (err) {
      const errorMsg = err.message || "Failed to link contract";
      setLinkError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleClear = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    clearFoundryData();
    setProject(null);
    setContracts([]);
    setStats(null);
    setShowClearConfirm(false);
    toast.success("All Foundry contracts removed");
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        size="sm"
        title="Foundry Project Manager"
      >
        🔨 Foundry
      </Button>

      {/* Main Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl">
              🔨 Foundry Project Manager
            </DialogTitle>
            <DialogDescription>
              Auto-detect and load contracts from your Foundry project
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
            {/* Scan Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>📁 Project Detection</CardTitle>
                  <Button
                    onClick={handleScan}
                    disabled={scanning}
                    variant="default"
                  >
                    {scanning ? "Scanning..." : "🔍 Scan for Project"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {loadSuccess && (
                  <Alert>
                    <AlertDescription>
                      ✓ ABIs loaded successfully!
                    </AlertDescription>
                  </Alert>
                )}

                {project && project.found && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Project Root
                        </div>
                        <div className="font-mono text-sm">
                          {project.foundryRoot || "./"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Output Directory
                        </div>
                        <div className="font-mono text-sm">
                          {project.outDir || "out"}
                        </div>
                      </div>
                    </div>

                    {project.compiled && project.summary && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">
                                {project.summary.totalContracts}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Contracts
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {project.summary.totalFunctions}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Functions
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {project.summary.totalEvents}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Events
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {project.compiled && (
                      <Button onClick={handleLoadAll} className="w-full">
                        📦 Load All ABIs
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loaded Contracts */}
            {stats && stats.total > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>📋 Loaded Contracts ({stats.total})</CardTitle>
                    <Button
                      onClick={handleClear}
                      variant="destructive"
                      size="sm"
                    >
                      🗑️ Clear All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {stats.withAddress}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            With Address
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                            {stats.needsAddress}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Needs Address
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-muted-foreground">
                            {stats.totalFunctions}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Functions
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {contracts.map((contract, idx) => (
                      <Card
                        key={idx}
                        className="hover:border-primary transition-colors"
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="font-semibold">
                                  {contract.name}
                                </div>
                                {contract.needsAddress && (
                                  <Badge variant="secondary">No address</Badge>
                                )}
                                {contract.address && (
                                  <Badge variant="default">Linked</Badge>
                                )}
                              </div>

                              {contract.address && (
                                <div className="font-mono text-xs text-muted-foreground mb-2">
                                  {contract.address}
                                </div>
                              )}

                              {contract.path && (
                                <div className="font-mono text-xs text-muted-foreground mb-2">
                                  {contract.path}
                                </div>
                              )}

                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>
                                  {contract.abi?.filter(
                                    (item) => item.type === "function",
                                  ).length || 0}{" "}
                                  functions
                                </span>
                                <span>
                                  {contract.abi?.filter(
                                    (item) => item.type === "event",
                                  ).length || 0}{" "}
                                  events
                                </span>
                              </div>
                            </div>

                            {contract.needsAddress && (
                              <Button
                                onClick={() => handleLinkContract(contract)}
                                variant="secondary"
                                size="sm"
                              >
                                🔗 Link Address
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Box */}
            <Card>
              <CardHeader>
                <CardTitle>💡 How to use</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                  <li>
                    Click "Scan for Project" to detect your Foundry project
                  </li>
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
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Contract Dialog */}
      <Dialog
        open={selectedContract !== null}
        onOpenChange={(open) => !open && setSelectedContract(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔗 Link Contract Address</DialogTitle>
            <DialogDescription>
              Connect this contract to its deployed address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Contract Name</Label>
              <div className="font-semibold mt-2">{selectedContract?.name}</div>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <Label htmlFor="link-address">Deployed Address *</Label>
                <Input
                  id="link-address"
                  type="text"
                  value={linkAddress}
                  onChange={(e) => setLinkAddress(e.target.value)}
                  placeholder="0x..."
                  className="font-mono mt-2"
                  required
                />
              </div>

              {linkError && (
                <Alert variant="destructive">
                  <AlertDescription>{linkError}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedContract(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">Link Contract</Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Confirmation AlertDialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove All Foundry Contracts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all Foundry contracts from
              FurnaceScout. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear}>
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
