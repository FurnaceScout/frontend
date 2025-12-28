"use client";

import { useEffect, useState } from "react";
import {
  getAddressLabels,
  getTransactionNotes,
  deleteAddressLabel,
  deleteTransactionNote,
  searchLabelsAndNotes,
  getLabelsStats,
  exportLabelsAndNotes,
  importLabelsAndNotes,
  clearAllLabelsAndNotes,
  LABEL_COLORS,
  getLabelColorClass,
} from "@/lib/labels";
import { shortenAddress } from "@/lib/viem";
import Link from "next/link";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { toast } from "sonner";

export default function LabelsPage() {
  const [labels, setLabels] = useState([]);
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMerge, setImportMerge] = useState(true);

  useEffect(() => {
    loadData();

    // Listen for updates
    const handleUpdate = () => loadData();
    window.addEventListener("labelsUpdated", handleUpdate);
    window.addEventListener("notesUpdated", handleUpdate);
    return () => {
      window.removeEventListener("labelsUpdated", handleUpdate);
      window.removeEventListener("notesUpdated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchLabelsAndNotes(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults(null);
    }
  }, [searchQuery]);

  function loadData() {
    const labelsData = getAddressLabels();
    const notesData = getTransactionNotes();
    const statsData = getLabelsStats();

    setLabels(
      Object.entries(labelsData)
        .map(([address, data]) => ({ address, ...data }))
        .sort((a, b) => b.timestamp - a.timestamp),
    );

    setNotes(
      Object.entries(notesData)
        .map(([txHash, data]) => ({ txHash, ...data }))
        .sort((a, b) => b.timestamp - a.timestamp),
    );

    setStats(statsData);
  }

  function handleDeleteLabel(address) {
    deleteAddressLabel(address);
    loadData();
    toast.success("Label deleted");
  }

  function handleDeleteNote(txHash) {
    deleteTransactionNote(txHash);
    loadData();
    toast.success("Note deleted");
  }

  function handleExport() {
    const json = exportLabelsAndNotes();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `furnacescout-labels-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Labels and notes exported");
  }

  function handleImport() {
    const result = importLabelsAndNotes(importText, importMerge);

    if (result.success) {
      loadData();
      setShowImportModal(false);
      setImportText("");
      toast.success(
        `Successfully imported ${result.labelsCount} labels and ${result.notesCount} notes`,
      );
    } else {
      toast.error(result.error || "Failed to import");
    }
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target.result);
    };
    reader.readAsText(file);
  }

  function handleClearAll() {
    clearAllLabelsAndNotes();
    loadData();
    toast.success("All labels and notes cleared");
  }

  const displayLabels = searchResults ? searchResults.addresses : labels;
  const displayNotes = searchResults ? searchResults.transactions : notes;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Labels & Notes</h1>
        <p className="text-muted-foreground">
          Manage your address labels and transaction notes
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search labels and notes..."
            className="pl-10"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            🔍
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
        {searchResults && (
          <div className="text-sm text-muted-foreground mt-2">
            Found {searchResults.addresses.length} label(s) and{" "}
            {searchResults.transactions.length} note(s)
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={handleExport} variant="secondary">
          📥 Export All
        </Button>
        <Button onClick={() => setShowImportModal(true)} variant="secondary">
          📤 Import
        </Button>
        <Button
          onClick={handleClearAll}
          variant="destructive"
          className="ml-auto"
        >
          🗑️ Clear All
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="labels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="labels">
            Labels{" "}
            <Badge variant="secondary" className="ml-2">
              {displayLabels.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="notes">
            Notes{" "}
            <Badge variant="secondary" className="ml-2">
              {displayNotes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Labels Tab */}
        <TabsContent value="labels">
          {displayLabels.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-3">🏷️</div>
                <div className="text-muted-foreground">
                  {searchQuery ? "No labels found" : "No labels yet"}
                </div>
                {!searchQuery && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Add labels to addresses to organize your testnet work
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayLabels.map((label) => (
                <Card key={label.address}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className={getLabelColorClass(label.color)}
                          >
                            {label.label}
                          </Badge>
                        </div>
                        <Link
                          href={`/address/${label.address}`}
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {shortenAddress(label.address, 8)}
                        </Link>
                        {label.note && (
                          <div className="text-sm text-muted-foreground mt-2">
                            {label.note}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(label.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLabel(label.address)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          {displayNotes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-4xl mb-3">📝</div>
                <div className="text-muted-foreground">
                  {searchQuery ? "No notes found" : "No notes yet"}
                </div>
                {!searchQuery && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Add notes to transactions to track important events
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayNotes.map((note) => (
                <Card key={note.txHash}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2">
                          <Link
                            href={`/tx/${note.txHash}`}
                            className="font-mono text-sm text-primary hover:underline"
                          >
                            {shortenAddress(note.txHash, 10)}
                          </Link>
                        </div>
                        {note.note && (
                          <div className="text-sm text-foreground mb-2">
                            {note.note}
                          </div>
                        )}
                        {note.category && (
                          <Badge variant="outline" className="mb-2">
                            {note.category}
                          </Badge>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {new Date(note.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.txHash)}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats">
          {stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Labels</CardDescription>
                    <CardTitle className="text-3xl">
                      {stats.totalLabels}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Notes</CardDescription>
                    <CardTitle className="text-3xl">
                      {stats.totalNotes}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Most Used Color</CardDescription>
                    <CardTitle className="text-3xl">
                      {stats.mostUsedColor || "—"}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Categories</CardDescription>
                    <CardTitle className="text-3xl">
                      {stats.categories?.length || 0}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {/* Color Distribution */}
              {stats.colorDistribution &&
                Object.keys(stats.colorDistribution).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Label Colors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(stats.colorDistribution).map(
                          ([color, count]) => {
                            const percentage =
                              stats.totalLabels > 0
                                ? (count / stats.totalLabels) * 100
                                : 0;

                            return (
                              <div key={color}>
                                <div className="flex items-center justify-between mb-1">
                                  <Badge
                                    variant="secondary"
                                    className={getLabelColorClass(color)}
                                  >
                                    {color}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {count} ({percentage.toFixed(0)}%)
                                  </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Category Distribution */}
              {stats.categoryDistribution &&
                Object.keys(stats.categoryDistribution).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Note Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(stats.categoryDistribution).map(
                          ([category, count]) => {
                            const percentage =
                              stats.totalNotes > 0
                                ? (count / stats.totalNotes) * 100
                                : 0;

                            return (
                              <div key={category}>
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline">{category}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {count} ({percentage.toFixed(0)}%)
                                  </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Labels & Notes</DialogTitle>
            <DialogDescription>
              Import a previously exported JSON file containing labels and notes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Upload File</Label>
              <Input type="file" accept=".json" onChange={handleImportFile} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-text">Or Paste JSON</Label>
              <textarea
                id="import-text"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"labels": {...}, "notes": {...}}'
                className="w-full px-3 py-2 border border-input rounded-md bg-background font-mono text-xs min-h-[150px] resize-y"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="import-merge"
                checked={importMerge}
                onChange={(e) => setImportMerge(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="import-merge" className="cursor-pointer">
                Merge with existing data (uncheck to replace)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false);
                setImportText("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importText.trim()}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
