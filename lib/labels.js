/**
 * Label and Notes Management System
 * Uses localStorage to store address labels, transaction notes, and color coding
 */

const STORAGE_KEYS = {
  ADDRESS_LABELS: "furnacescout_address_labels",
  TX_NOTES: "furnacescout_tx_notes",
  LABEL_COLORS: "furnacescout_label_colors",
};

// Available label colors
export const LABEL_COLORS = [
  {
    id: "red",
    name: "Red",
    class:
      "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  {
    id: "orange",
    name: "Orange",
    class:
      "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
  {
    id: "yellow",
    name: "Yellow",
    class:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  {
    id: "green",
    name: "Green",
    class:
      "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  {
    id: "blue",
    name: "Blue",
    class:
      "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  {
    id: "purple",
    name: "Purple",
    class:
      "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  {
    id: "pink",
    name: "Pink",
    class:
      "bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  },
  {
    id: "gray",
    name: "Gray",
    class:
      "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  },
];

/**
 * Get all address labels
 * @returns {Object} Map of address -> {label, color, note, timestamp}
 */
export function getAddressLabels() {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ADDRESS_LABELS);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error reading address labels:", error);
    return {};
  }
}

/**
 * Get label for a specific address
 * @param {string} address - Address to get label for
 * @returns {Object|null} Label object or null
 */
export function getAddressLabel(address) {
  const labels = getAddressLabels();
  const normalized = address.toLowerCase();
  return labels[normalized] || null;
}

/**
 * Save address label
 * @param {string} address - Address to label
 * @param {string} label - Label text
 * @param {string} color - Color ID (from LABEL_COLORS)
 * @param {string} note - Optional note
 */
export function saveAddressLabel(address, label, color = "blue", note = "") {
  if (typeof window === "undefined") return;

  try {
    const labels = getAddressLabels();
    const normalized = address.toLowerCase();

    labels[normalized] = {
      label: label.trim(),
      color,
      note: note.trim(),
      timestamp: Date.now(),
      address: normalized,
    };

    localStorage.setItem(STORAGE_KEYS.ADDRESS_LABELS, JSON.stringify(labels));

    // Dispatch event for UI updates
    window.dispatchEvent(
      new CustomEvent("labelsUpdated", { detail: { address: normalized } }),
    );

    return true;
  } catch (error) {
    console.error("Error saving address label:", error);
    return false;
  }
}

/**
 * Delete address label
 * @param {string} address - Address to remove label from
 */
export function deleteAddressLabel(address) {
  if (typeof window === "undefined") return;

  try {
    const labels = getAddressLabels();
    const normalized = address.toLowerCase();

    delete labels[normalized];

    localStorage.setItem(STORAGE_KEYS.ADDRESS_LABELS, JSON.stringify(labels));

    // Dispatch event for UI updates
    window.dispatchEvent(
      new CustomEvent("labelsUpdated", { detail: { address: normalized } }),
    );

    return true;
  } catch (error) {
    console.error("Error deleting address label:", error);
    return false;
  }
}

/**
 * Get all transaction notes
 * @returns {Object} Map of txHash -> {note, timestamp}
 */
export function getTransactionNotes() {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TX_NOTES);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error reading transaction notes:", error);
    return {};
  }
}

/**
 * Get note for a specific transaction
 * @param {string} txHash - Transaction hash
 * @returns {Object|null} Note object or null
 */
export function getTransactionNote(txHash) {
  const notes = getTransactionNotes();
  const normalized = txHash.toLowerCase();
  return notes[normalized] || null;
}

/**
 * Save transaction note
 * @param {string} txHash - Transaction hash
 * @param {string} note - Note text
 */
export function saveTransactionNote(txHash, note) {
  if (typeof window === "undefined") return;

  try {
    const notes = getTransactionNotes();
    const normalized = txHash.toLowerCase();

    if (note.trim()) {
      notes[normalized] = {
        note: note.trim(),
        timestamp: Date.now(),
        txHash: normalized,
      };
    } else {
      // Delete if note is empty
      delete notes[normalized];
    }

    localStorage.setItem(STORAGE_KEYS.TX_NOTES, JSON.stringify(notes));

    // Dispatch event for UI updates
    window.dispatchEvent(
      new CustomEvent("notesUpdated", { detail: { txHash: normalized } }),
    );

    return true;
  } catch (error) {
    console.error("Error saving transaction note:", error);
    return false;
  }
}

/**
 * Delete transaction note
 * @param {string} txHash - Transaction hash
 */
export function deleteTransactionNote(txHash) {
  if (typeof window === "undefined") return;

  try {
    const notes = getTransactionNotes();
    const normalized = txHash.toLowerCase();

    delete notes[normalized];

    localStorage.setItem(STORAGE_KEYS.TX_NOTES, JSON.stringify(notes));

    // Dispatch event for UI updates
    window.dispatchEvent(
      new CustomEvent("notesUpdated", { detail: { txHash: normalized } }),
    );

    return true;
  } catch (error) {
    console.error("Error deleting transaction note:", error);
    return false;
  }
}

/**
 * Search labels and notes
 * @param {string} query - Search query
 * @returns {Object} { addresses: [], transactions: [] }
 */
export function searchLabelsAndNotes(query) {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return { addresses: [], transactions: [] };
  }

  const labels = getAddressLabels();
  const notes = getTransactionNotes();

  // Search address labels
  const addresses = Object.entries(labels)
    .filter(([address, data]) => {
      return (
        address.includes(lowerQuery) ||
        data.label.toLowerCase().includes(lowerQuery) ||
        data.note.toLowerCase().includes(lowerQuery)
      );
    })
    .map(([address, data]) => ({
      address,
      ...data,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  // Search transaction notes
  const transactions = Object.entries(notes)
    .filter(([txHash, data]) => {
      return (
        txHash.includes(lowerQuery) ||
        data.note.toLowerCase().includes(lowerQuery)
      );
    })
    .map(([txHash, data]) => ({
      txHash,
      ...data,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  return { addresses, transactions };
}

/**
 * Get statistics about labels and notes
 * @returns {Object} Statistics
 */
export function getLabelsStats() {
  const labels = getAddressLabels();
  const notes = getTransactionNotes();

  const colorCounts = {};
  for (const color of LABEL_COLORS) {
    colorCounts[color.id] = 0;
  }

  Object.values(labels).forEach((label) => {
    if (Object.hasOwn(colorCounts, label.color)) {
      colorCounts[label.color]++;
    }
  });

  return {
    totalLabels: Object.keys(labels).length,
    totalNotes: Object.keys(notes).length,
    labelsByColor: colorCounts,
    recentLabels: Object.values(labels)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5),
    recentNotes: Object.values(notes)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5),
  };
}

/**
 * Export all labels and notes as JSON
 * @returns {string} JSON string
 */
export function exportLabelsAndNotes() {
  return JSON.stringify(
    {
      version: "1.0",
      exported: new Date().toISOString(),
      labels: getAddressLabels(),
      notes: getTransactionNotes(),
    },
    null,
    2,
  );
}

/**
 * Import labels and notes from JSON
 * @param {string} jsonString - JSON string to import
 * @param {boolean} merge - Whether to merge with existing data
 * @returns {Object} { success: boolean, imported: { labels: number, notes: number }, error?: string }
 */
export function importLabelsAndNotes(jsonString, merge = false) {
  if (typeof window === "undefined") {
    return {
      success: false,
      imported: { labels: 0, notes: 0 },
      error: "Not in browser environment",
    };
  }

  try {
    const data = JSON.parse(jsonString);

    if (!data.labels || !data.notes) {
      return {
        success: false,
        imported: { labels: 0, notes: 0 },
        error: "Invalid format",
      };
    }

    const existingLabels = merge ? getAddressLabels() : {};
    const existingNotes = merge ? getTransactionNotes() : {};

    const newLabels = { ...existingLabels, ...data.labels };
    const newNotes = { ...existingNotes, ...data.notes };

    localStorage.setItem(
      STORAGE_KEYS.ADDRESS_LABELS,
      JSON.stringify(newLabels),
    );
    localStorage.setItem(STORAGE_KEYS.TX_NOTES, JSON.stringify(newNotes));

    // Dispatch events for UI updates
    window.dispatchEvent(new CustomEvent("labelsUpdated"));
    window.dispatchEvent(new CustomEvent("notesUpdated"));

    return {
      success: true,
      imported: {
        labels: Object.keys(data.labels).length,
        notes: Object.keys(data.notes).length,
      },
    };
  } catch (error) {
    console.error("Error importing labels and notes:", error);
    return {
      success: false,
      imported: { labels: 0, notes: 0 },
      error: error.message,
    };
  }
}

/**
 * Clear all labels and notes
 */
export function clearAllLabelsAndNotes() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEYS.ADDRESS_LABELS);
    localStorage.removeItem(STORAGE_KEYS.TX_NOTES);

    // Dispatch events for UI updates
    window.dispatchEvent(new CustomEvent("labelsUpdated"));
    window.dispatchEvent(new CustomEvent("notesUpdated"));

    return true;
  } catch (error) {
    console.error("Error clearing labels and notes:", error);
    return false;
  }
}

/**
 * Get color class for a color ID
 * @param {string} colorId - Color ID
 * @returns {string} Tailwind class string
 */
export function getLabelColorClass(colorId) {
  const color = LABEL_COLORS.find((c) => c.id === colorId);
  return color ? color.class : LABEL_COLORS[4].class; // Default to blue
}
