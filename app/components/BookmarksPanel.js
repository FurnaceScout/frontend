"use client";

import { useState, useEffect } from "react";
import {
  getBookmarks,
  removeBookmark,
  updateBookmark,
  searchBookmarks,
  exportBookmarks,
  clearAllBookmarks,
} from "@/lib/bookmarks";
import Link from "next/link";
import { shortenAddress } from "@/lib/viem";

export default function BookmarksPanel({ isOpen, onClose }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadBookmarks();
    }
  }, [isOpen]);

  const loadBookmarks = () => {
    if (searchQuery) {
      setBookmarks(searchBookmarks(searchQuery));
    } else {
      setBookmarks(getBookmarks());
    }
  };

  const handleRemove = (id) => {
    if (confirm("Remove this bookmark?")) {
      removeBookmark(id);
      loadBookmarks();
    }
  };

  const handleEdit = (bookmark) => {
    setEditingId(bookmark.id);
    setEditLabel(bookmark.label);
    setEditNotes(bookmark.notes || "");
  };

  const handleSaveEdit = (id) => {
    try {
      updateBookmark(id, {
        label: editLabel.trim(),
        notes: editNotes.trim(),
      });
      setEditingId(null);
      loadBookmarks();
    } catch (error) {
      alert("Failed to update bookmark: " + error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
    setEditNotes("");
  };

  const handleExport = () => {
    const json = exportBookmarks();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `furnacescout-bookmarks-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    clearAllBookmarks();
    loadBookmarks();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      ></div>

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white dark:bg-zinc-900 shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📌</span>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Bookmarks
              </h2>
              <p className="text-sm text-zinc-500">
                {bookmarks.length} saved transaction
                {bookmarks.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setTimeout(loadBookmarks, 100);
            }}
            placeholder="Search bookmarks..."
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
          />

          {bookmarks.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors font-semibold"
              >
                📥 Export
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-semibold"
              >
                🗑️ Clear All
              </button>
            </div>
          )}
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto p-4">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📌</div>
              <p className="text-zinc-500 dark:text-zinc-400 mb-2">
                {searchQuery ? "No bookmarks found" : "No bookmarks yet"}
              </p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {searchQuery
                  ? "Try a different search query"
                  : "Bookmark transactions to save them for later"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-red-500 dark:hover:border-red-500 transition-colors"
                >
                  {editingId === bookmark.id ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-semibold"
                      />
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm resize-none"
                        placeholder="Notes..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(bookmark.id)}
                          className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/tx/${bookmark.hash}`}
                            onClick={onClose}
                            className="font-semibold text-zinc-900 dark:text-zinc-100 hover:text-red-500 dark:hover:text-red-400 transition-colors block"
                          >
                            {bookmark.label}
                          </Link>
                          <div className="text-xs text-zinc-500 font-mono mt-1">
                            {shortenAddress(bookmark.hash, 8)}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleEdit(bookmark)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors text-sm"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleRemove(bookmark.id)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm"
                            title="Remove"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {bookmark.notes && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                          {bookmark.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>📅</span>
                        <span>
                          {new Date(bookmark.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
