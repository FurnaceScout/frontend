"use client";

import { useEffect, useState } from "react";
import {
  getTransactionNote,
  saveTransactionNote,
  deleteTransactionNote,
} from "@/lib/labels";

export default function TransactionNote({ txHash }) {
  const [note, setNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    loadNote();

    // Listen for note updates from other components
    const handleUpdate = () => loadNote();
    window.addEventListener("notesUpdated", handleUpdate);
    return () => window.removeEventListener("notesUpdated", handleUpdate);
  }, [txHash]);

  function loadNote() {
    const noteData = getTransactionNote(txHash);
    setNote(noteData);
  }

  function handleEdit() {
    setEditNote(note?.note || "");
    setIsEditing(true);
  }

  function handleSave() {
    if (editNote.trim()) {
      saveTransactionNote(txHash, editNote);
      setIsEditing(false);
      loadNote();
    }
  }

  function handleCancel() {
    setIsEditing(false);
  }

  function handleDelete() {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteTransactionNote(txHash);
      setIsEditing(false);
      loadNote();
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          {note ? "Edit Note" : "Add Note"}
        </h3>

        {/* Note Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Transaction Note
          </label>
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Add notes about this transaction (e.g., deployment details, test scenario, etc.)"
            rows={4}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            maxLength={1000}
          />
          <div className="text-xs text-zinc-500 mt-1">
            {editNote.length}/1000 characters
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!editNote.trim()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Note
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
          >
            Cancel
          </button>
          {note && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors ml-auto"
            >
              Delete Note
            </button>
          )}
        </div>
      </div>
    );
  }

  if (note) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                📝 Transaction Note
              </span>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 whitespace-pre-wrap">
              {note.note}
            </div>
            <div className="text-xs text-zinc-400 mt-2">
              Added {new Date(note.timestamp).toLocaleDateString()}
            </div>
          </div>
          <button
            type="button"
            onClick={handleEdit}
            className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          No note for this transaction
        </div>
        <button
          type="button"
          onClick={handleEdit}
          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          + Add Note
        </button>
      </div>
    </div>
  );
}
