"use client";

import { useEffect, useState } from "react";
import {
  getAddressLabel,
  saveAddressLabel,
  deleteAddressLabel,
  LABEL_COLORS,
  getLabelColorClass,
} from "@/lib/labels";

export default function AddressLabel({ address }) {
  const [label, setLabel] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editColor, setEditColor] = useState("blue");
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    loadLabel();

    // Listen for label updates from other components
    const handleUpdate = () => loadLabel();
    window.addEventListener("labelsUpdated", handleUpdate);
    return () => window.removeEventListener("labelsUpdated", handleUpdate);
  }, [address]);

  function loadLabel() {
    const labelData = getAddressLabel(address);
    setLabel(labelData);
  }

  function handleEdit() {
    if (label) {
      setEditLabel(label.label);
      setEditNote(label.note || "");
      setEditColor(label.color || "blue");
    } else {
      setEditLabel("");
      setEditNote("");
      setEditColor("blue");
    }
    setIsEditing(true);
    setShowColorPicker(false);
  }

  function handleSave() {
    if (editLabel.trim()) {
      saveAddressLabel(address, editLabel, editColor, editNote);
      setIsEditing(false);
      loadLabel();
    }
  }

  function handleCancel() {
    setIsEditing(false);
    setShowColorPicker(false);
  }

  function handleDelete() {
    if (confirm("Are you sure you want to delete this label?")) {
      deleteAddressLabel(address);
      setIsEditing(false);
      loadLabel();
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          {label ? "Edit Label" : "Add Label"}
        </h3>

        {/* Label Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Label Name *
          </label>
          <input
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="e.g., My Test Wallet, Main Contract, etc."
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            maxLength={50}
          />
          <div className="text-xs text-zinc-500 mt-1">
            {editLabel.length}/50 characters
          </div>
        </div>

        {/* Color Picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {LABEL_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setEditColor(color.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  getLabelColorClass(color.id)
                } ${
                  editColor === color.id
                    ? "ring-2 ring-offset-2 ring-red-500 dark:ring-offset-zinc-900"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {color.name}
              </button>
            ))}
          </div>
        </div>

        {/* Note Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Note (Optional)
          </label>
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Add any additional notes about this address..."
            rows={3}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            maxLength={500}
          />
          <div className="text-xs text-zinc-500 mt-1">
            {editNote.length}/500 characters
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={!editLabel.trim()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Label
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
          >
            Cancel
          </button>
          {label && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors ml-auto"
            >
              Delete Label
            </button>
          )}
        </div>
      </div>
    );
  }

  if (label) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-zinc-500">Label:</span>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${getLabelColorClass(
                  label.color,
                )}`}
              >
                {label.label}
              </span>
            </div>
            {label.note && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                <span className="text-zinc-500">Note:</span> {label.note}
              </div>
            )}
            <div className="text-xs text-zinc-400 mt-2">
              Added {new Date(label.timestamp).toLocaleDateString()}
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
          No label for this address
        </div>
        <button
          type="button"
          onClick={handleEdit}
          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
        >
          + Add Label
        </button>
      </div>
    </div>
  );
}
