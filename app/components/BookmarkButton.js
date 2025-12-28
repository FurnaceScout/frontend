"use client";

import { useState, useEffect } from "react";
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
  getBookmarkByHash,
} from "@/lib/bookmarks";

export default function BookmarkButton({ hash, defaultLabel = "" }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [label, setLabel] = useState(defaultLabel);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setBookmarked(isBookmarked(hash));

    // Load existing bookmark data if present
    const existing = getBookmarkByHash(hash);
    if (existing) {
      setLabel(existing.label);
      setNotes(existing.notes || "");
    }
  }, [hash]);

  const handleAdd = () => {
    setError("");
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!label.trim()) {
      setError("Label is required");
      return;
    }

    try {
      addBookmark(hash, label.trim(), notes.trim());
      setBookmarked(true);
      setShowDialog(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = () => {
    const existing = getBookmarkByHash(hash);
    if (existing && confirm("Remove this bookmark?")) {
      removeBookmark(existing.id);
      setBookmarked(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setError("");
    // Reset form if not bookmarked
    if (!bookmarked) {
      setLabel(defaultLabel);
      setNotes("");
    }
  };

  return (
    <>
      <button
        onClick={bookmarked ? handleRemove : handleAdd}
        className={`px-4 py-2 rounded font-semibold transition-colors ${
          bookmarked
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
        }`}
        title={bookmarked ? "Remove bookmark" : "Bookmark this transaction"}
      >
        {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
      </button>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
              📌 Bookmark Transaction
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Label *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Failed swap attempt"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this transaction..."
                rows={3}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
              />
            </div>

            <div className="mb-4">
              <div className="text-xs text-zinc-500 break-all">
                Transaction: {hash}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors"
              >
                Save Bookmark
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
