// Bookmark management utilities for FurnaceScout

const STORAGE_KEY = "furnacescout_bookmarks";

/**
 * Get all bookmarks from localStorage
 * @returns {Array} Array of bookmark objects
 */
export function getBookmarks() {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load bookmarks:", error);
    return [];
  }
}

/**
 * Save bookmarks to localStorage
 * @param {Array} bookmarks - Array of bookmark objects
 */
function saveBookmarks(bookmarks) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch (error) {
    console.error("Failed to save bookmarks:", error);
  }
}

/**
 * Add a new bookmark
 * @param {string} hash - Transaction hash
 * @param {string} label - User-provided label
 * @param {string} notes - Optional notes
 * @returns {Object} The created bookmark
 */
export function addBookmark(hash, label, notes = "") {
  const bookmarks = getBookmarks();

  // Check if already bookmarked
  const existing = bookmarks.find(
    (b) => b.hash.toLowerCase() === hash.toLowerCase(),
  );
  if (existing) {
    throw new Error("Transaction already bookmarked");
  }

  const bookmark = {
    id: Date.now().toString(),
    hash: hash.toLowerCase(),
    label,
    notes,
    createdAt: new Date().toISOString(),
  };

  bookmarks.unshift(bookmark); // Add to beginning
  saveBookmarks(bookmarks);

  return bookmark;
}

/**
 * Remove a bookmark by ID
 * @param {string} id - Bookmark ID
 */
export function removeBookmark(id) {
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter((b) => b.id !== id);
  saveBookmarks(filtered);
}

/**
 * Update a bookmark
 * @param {string} id - Bookmark ID
 * @param {Object} updates - Fields to update (label, notes)
 */
export function updateBookmark(id, updates) {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex((b) => b.id === id);

  if (index === -1) {
    throw new Error("Bookmark not found");
  }

  bookmarks[index] = {
    ...bookmarks[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveBookmarks(bookmarks);
  return bookmarks[index];
}

/**
 * Check if a transaction is bookmarked
 * @param {string} hash - Transaction hash
 * @returns {boolean}
 */
export function isBookmarked(hash) {
  const bookmarks = getBookmarks();
  return bookmarks.some((b) => b.hash.toLowerCase() === hash.toLowerCase());
}

/**
 * Get bookmark by transaction hash
 * @param {string} hash - Transaction hash
 * @returns {Object|null}
 */
export function getBookmarkByHash(hash) {
  const bookmarks = getBookmarks();
  return (
    bookmarks.find((b) => b.hash.toLowerCase() === hash.toLowerCase()) || null
  );
}

/**
 * Search bookmarks by label or notes
 * @param {string} query - Search query
 * @returns {Array}
 */
export function searchBookmarks(query) {
  const bookmarks = getBookmarks();
  const lowerQuery = query.toLowerCase();

  return bookmarks.filter(
    (b) =>
      b.label.toLowerCase().includes(lowerQuery) ||
      b.notes.toLowerCase().includes(lowerQuery) ||
      b.hash.includes(lowerQuery),
  );
}

/**
 * Export bookmarks as JSON
 * @returns {string} JSON string
 */
export function exportBookmarks() {
  const bookmarks = getBookmarks();
  return JSON.stringify(bookmarks, null, 2);
}

/**
 * Import bookmarks from JSON
 * @param {string} jsonString - JSON string
 * @param {boolean} merge - If true, merge with existing bookmarks
 */
export function importBookmarks(jsonString, merge = false) {
  try {
    const imported = JSON.parse(jsonString);

    if (!Array.isArray(imported)) {
      throw new Error("Invalid format: expected array");
    }

    const bookmarks = merge ? getBookmarks() : [];

    // Add imported bookmarks, avoiding duplicates
    imported.forEach((item) => {
      if (item.hash && item.label) {
        const exists = bookmarks.some(
          (b) => b.hash.toLowerCase() === item.hash.toLowerCase(),
        );
        if (!exists) {
          bookmarks.push({
            ...item,
            id: item.id || Date.now().toString() + Math.random(),
            importedAt: new Date().toISOString(),
          });
        }
      }
    });

    saveBookmarks(bookmarks);
    return bookmarks.length;
  } catch (error) {
    throw new Error(`Failed to import bookmarks: ${error.message}`);
  }
}

/**
 * Clear all bookmarks
 */
export function clearAllBookmarks() {
  if (typeof window === "undefined") return;

  if (confirm("Are you sure you want to delete all bookmarks?")) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Get bookmark statistics
 * @returns {Object}
 */
export function getBookmarkStats() {
  const bookmarks = getBookmarks();

  return {
    total: bookmarks.length,
    oldest:
      bookmarks.length > 0 ? bookmarks[bookmarks.length - 1].createdAt : null,
    newest: bookmarks.length > 0 ? bookmarks[0].createdAt : null,
  };
}
