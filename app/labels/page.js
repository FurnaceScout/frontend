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

export default function LabelsPage() {
  const [labels, setLabels] = useState([]);
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [activeTab, setActiveTab] = useState("labels"); // 'labels' | 'notes' | 'stats'
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMerge, setImportMerge] = useState(true);
  const [importStatus, setImportStatus] = useState(null);

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
        .sort((a, b) => b.timestamp - a.timestamp)
    );

    setNotes(
      Object.entries(notesData)
        .map(([txHash, data]) => ({ txHash, ...data }))
        .sort((a, b) => b.timestamp - a.timestamp)
    );

    setStats(statsData);
  }

  function handleDeleteLabel(address) {
    if (confirm("Are you sure you want to delete this label?")) {
      deleteAddressLabel(address);
      loadData();
    }
  }

  function handleDeleteNote(txHash) {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteTransactionNote(txHash);
      loadData();
    }
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
  }

  function handleImport() {
    setImportStatus(null);
    const result = importLabelsAndNotes(importText, importMerge);
    setImportStatus(result);

    if (result.success) {
      loadData();
      setTimeout(() => {
        setShowImportModal(false);
        setImportText("");
        setImportStatus(null);
      }, 2000);
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
    if (
      confirm(
        "Are you sure you want to delete ALL labels and notes? This cannot be undone!"
      )
    ) {
      if (confirm("Really sure? This will delete everything!")) {
        clearAllLabelsAndNotes();
        loadData();
      }
    }
  }

  const displayLabels = searchResults ? searchResults.addresses : labels;
  const displayNotes = searchResults ? searchResults.transactions : notes;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Labels & Notes
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage your address labels and transaction notes
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search labels and notes..."
            className="w-full px-4 py-3 pl-12 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            🔍
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              ✕
            </button>
          )}
        </div>
        {searchResults && (
          <div className="text-sm text-zinc-500 mt-2">
            Found {searchResults.addresses.length} label(s) and{" "}
            {searchResults.transactions.length} note(s)
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          📥 Export All
        </button>
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
        >
          📤 Import
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors ml-auto"
        >
          🗑️ Clear All
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("labels")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "labels"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Labels ({displayLabels.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "notes"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Notes ({displayNotes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === "stats"
                ? "border-red-500 text-red-600 dark:text-red-400"
                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Labels Tab */}
      {activeTab === "labels" && (
        <div>
          {displayLabels.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🏷️</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                {searchQuery ? "No labels found" : "No labels yet"}
              </div>
              {!searchQuery && (
                <div className="text-sm text-zinc-500 mt-2">
                  Add labels to addresses to organize your testnet work
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayLabels.map((label) => (
                <div
                  key={label.address}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-semibold ${getLabelColorClass(
                            label.color
                          )}`}
                        >
                          {label.label}
                        </span>
                      </div>
                      <Link
                        href={`/address/${label.address}`}
                        className="font-mono text-sm text-red-600 dark:text-red-400 hover:underline"
                      >
                        {shortenAddress(label.address, 8)}
                      </Link>
                      {label.note && (
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                          {label.note}
                        </div>
                      )}
                      <div className="text-xs text-zinc-400 mt-2">
                        {new Date(label.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteLabel(label.address)}
                      className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div>
          {displayNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📝</div>
              <div className="text-zinc-600 dark:text-zinc-400">
                {searchQuery ? "No notes found" : "No notes yet"}
              </div>
              {!searchQuery && (
                <div className="text-sm text-zinc-500 mt-2">
                  Add notes to transactions to track your testing
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayNotes.map((note) => (
                <div
                  key={note.txHash}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Link
                        href={`/tx/${note.txHash}`}
                        className="font-mono text-sm text-red-600 dark:text-red-400 hover:underline mb-2 block"
                      >
                        {shortenAddress(note.txHash, 12)}
                      </Link>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 whitespace-pre-wrap">
                        {note.note}
                      </div>
                      <div className="text-xs text-zinc-400 mt-2">
                        {new Date(note.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.txHash)}
                      className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === "stats" && stats && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {stats.totalLabels}
              </div>
              <div className="text-zinc-600 dark:text-zinc-400">
                Total Labels
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {stats.totalNotes}
              </div>
              <div className="text-zinc-600 dark:text-zinc-400">
                Total Notes
              </div>
            </div>
          </div>

          {/* Labels by Color */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Labels by Color
            </h2>
            <div className="space-y-2">
              {LABEL_COLORS.map((color) => {
                const count = stats.labelsByColor[color.id] || 0;
                const percentage =
                  stats.totalLabels > 0
                    ? ((count / stats.totalLabels) * 100).toFixed(1)
                    : 0;

                return (
                  <div key={color.id} className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded text-sm font-semibold min-w-[100px] ${getLabelColorClass(
                        color.id
                      )}`}
                    >
                      {color.name}
                    </span>
                    <div className="flex-1 h-8 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                      <div
                        className={`h-full ${getLabelColorClass(color.id)} opacity-50`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[80px] text-right">
                      {count} ({percentage}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Recent Labels
              </h2>
              {stats.recentLabels.length === 0 ? (
                <div className="text-center py-4 text-zinc-500">
                  No labels yet
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentLabels.map((label) => (
                    <div key={label.address} className="text-sm">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${getLabelColorClass(
                          label.color
                        )}`}
                      >
                        {label.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                Recent Notes
              </h2>
              {stats.recentNotes.length === 0 ? (
                <div className="text-center py-4 text-zinc-500">
                  No notes yet
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentNotes.map((note) => (
                    <div
                      key={note.txHash}
                      className="text-sm text-zinc-600 dark:text-zinc-400 truncate"
                    >
                      {note.note}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Import Labels & Notes
            </h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Import from file
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Or paste JSON
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste exported JSON here..."
                rows={8}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={importMerge}
                  onChange={(e) => setImportMerge(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-zinc-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Merge with existing data (uncheck to replace)
                </span>
              </label>
            </div>

            {importStatus && (
              <div
                className={`mb-4 p-3 rounded-lg ${
                  importStatus.success
                    ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                }`}
              >
                {importStatus.success ? (
                  <div>
                    ✓ Successfully imported {importStatus.imported.labels}{" "}
                    label(s) and {importStatus.imported.notes} note(s)
                  </div>
                ) : (
                  <div>✗ Import failed: {importStatus.error}</div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleImport}
                disabled={!importText.trim()}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Import
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportText("");
                  setImportStatus(null);
                }}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
