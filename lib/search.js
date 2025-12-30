/**
 * Advanced Search and Filtering Utilities
 * Multi-criteria transaction search with localStorage history
 */

import {
  fetchBlocksBatched,
  fetchReceiptsBatched,
  getLatestBlockNumber,
} from "./block-utils";
import { publicClient } from "./viem";

const STORAGE_KEY = "furnacescout_search_history";
const MAX_HISTORY_ITEMS = 20;

/**
 * Search criteria structure
 * @typedef {Object} SearchCriteria
 * @property {string} query - General search query (address/tx/block)
 * @property {string} methodId - Method ID filter (4 bytes)
 * @property {string} minValue - Minimum value in ETH
 * @property {string} maxValue - Maximum value in ETH
 * @property {number} startBlock - Start block number
 * @property {number} endBlock - End block number
 * @property {string} status - Transaction status (success/failed/all)
 * @property {string} fromAddress - From address filter
 * @property {string} toAddress - To address filter
 * @property {number} limit - Max results to return
 */

/**
 * Search transactions with multiple criteria
 * @param {SearchCriteria} criteria - Search criteria
 * @returns {Promise<Array>} Filtered transactions
 */
export async function searchTransactions(criteria) {
  try {
    const {
      query: _query = "",
      methodId: _methodId = "",
      minValue: _minValue = "",
      maxValue: _maxValue = "",
      startBlock = null,
      endBlock = null,
      status = "all",
      fromAddress: _fromAddress = "",
      toAddress: _toAddress = "",
      limit = 50,
    } = criteria;

    // Determine block range
    const latestBlock = await getLatestBlockNumber();
    const searchEndBlock = endBlock ? BigInt(endBlock) : latestBlock;
    const searchStartBlock = startBlock
      ? BigInt(startBlock)
      : searchEndBlock - 100n; // Default to last 100 blocks

    const maxBlocks = 500; // Limit scanning to prevent long operations
    const actualEndBlock =
      searchEndBlock - searchStartBlock > BigInt(maxBlocks)
        ? searchStartBlock + BigInt(maxBlocks) - 1n
        : searchEndBlock;

    // Fetch all blocks in parallel batches
    const blocks = await fetchBlocksBatched(searchStartBlock, actualEndBlock, {
      includeTransactions: true,
      batchSize: 10,
    });

    // Collect matching transactions and create lookup map
    const matchingTxs = [];
    const txToBlock = new Map();

    for (const block of blocks) {
      if (!Array.isArray(block.transactions)) continue;

      for (const tx of block.transactions) {
        // Apply pre-receipt filters
        if (!matchesCriteria(tx, block, criteria)) continue;

        matchingTxs.push(tx);
        txToBlock.set(tx.hash.toLowerCase(), block);
      }
    }

    // Fetch receipts for matching transactions in parallel batches
    const hashes = matchingTxs.map((tx) => tx.hash);
    const receipts = await fetchReceiptsBatched(hashes, { batchSize: 20 });

    // Create receipt lookup map
    const receiptMap = new Map();
    for (const receipt of receipts) {
      if (receipt && receipt.transactionHash) {
        receiptMap.set(receipt.transactionHash.toLowerCase(), receipt);
      }
    }

    // Process transactions with their receipts
    const results = [];
    for (const tx of matchingTxs) {
      if (results.length >= limit) break;

      const receipt = receiptMap.get(tx.hash.toLowerCase());
      if (!receipt) continue;

      // Status filter
      if (status !== "all") {
        const txStatus = receipt.status === "success" ? "success" : "failed";
        if (txStatus !== status) continue;
      }

      const block = txToBlock.get(tx.hash.toLowerCase());

      results.push({
        ...tx,
        blockNumber: block?.number,
        timestamp: block?.timestamp,
        status: receipt.status,
        gasUsed: receipt.gasUsed,
        logs: receipt.logs,
      });
    }

    return results;
  } catch (error) {
    console.error("Error searching transactions:", error);
    throw error;
  }
}

/**
 * Check if transaction matches search criteria
 * @param {Object} tx - Transaction object
 * @param {Object} block - Block object
 * @param {SearchCriteria} criteria - Search criteria
 * @returns {boolean} True if matches
 */
function matchesCriteria(tx, _block, criteria) {
  const { query, methodId, minValue, maxValue, fromAddress, toAddress } =
    criteria;

  // General query (address or tx hash)
  if (query) {
    const lowerQuery = query.toLowerCase();
    const matchesHash = tx.hash.toLowerCase().includes(lowerQuery);
    const matchesFrom = tx.from.toLowerCase().includes(lowerQuery);
    const matchesTo = tx.to?.toLowerCase().includes(lowerQuery);

    if (!matchesHash && !matchesFrom && !matchesTo) {
      return false;
    }
  }

  // Method ID filter
  if (methodId && tx.input) {
    const txMethodId = tx.input.slice(0, 10).toLowerCase();
    if (txMethodId !== methodId.toLowerCase()) {
      return false;
    }
  }

  // Value range filter
  if (minValue) {
    const minWei = BigInt(Math.floor(parseFloat(minValue) * 1e18));
    if (tx.value < minWei) {
      return false;
    }
  }

  if (maxValue) {
    const maxWei = BigInt(Math.floor(parseFloat(maxValue) * 1e18));
    if (tx.value > maxWei) {
      return false;
    }
  }

  // From address filter
  if (fromAddress) {
    if (tx.from.toLowerCase() !== fromAddress.toLowerCase()) {
      return false;
    }
  }

  // To address filter
  if (toAddress) {
    if (!tx.to || tx.to.toLowerCase() !== toAddress.toLowerCase()) {
      return false;
    }
  }

  return true;
}

/**
 * Search for blocks matching criteria
 * @param {Object} criteria - Block search criteria
 * @returns {Promise<Array>} Matching blocks
 */
export async function searchBlocks(criteria) {
  try {
    const {
      startBlock,
      endBlock,
      minTxCount = 0,
      maxTxCount = null,
      limit = 20,
    } = criteria;

    const latestBlock = await getLatestBlockNumber();
    const searchEndBlock = endBlock ? BigInt(endBlock) : latestBlock;
    const searchStartBlock = startBlock
      ? BigInt(startBlock)
      : searchEndBlock - 100n;

    // Fetch all blocks in parallel batches
    const blocks = await fetchBlocksBatched(searchStartBlock, searchEndBlock, {
      includeTransactions: true,
      batchSize: 10,
    });

    const results = [];

    for (const block of blocks) {
      if (results.length >= limit) break;

      const txCount = Array.isArray(block.transactions)
        ? block.transactions.length
        : 0;

      // Apply tx count filters
      if (txCount < minTxCount) continue;
      if (maxTxCount !== null && txCount > maxTxCount) continue;

      results.push({
        number: block.number,
        hash: block.hash,
        timestamp: block.timestamp,
        transactionCount: txCount,
        gasUsed: block.gasUsed,
        gasLimit: block.gasLimit,
        miner: block.miner,
      });
    }

    return results;
  } catch (error) {
    console.error("Error searching blocks:", error);
    throw error;
  }
}

/**
 * Get search history from localStorage
 * @returns {Array} Search history
 */
export function getSearchHistory() {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading search history:", error);
    return [];
  }
}

/**
 * Save search to history
 * @param {SearchCriteria} criteria - Search criteria
 * @param {number} resultCount - Number of results found
 */
export function saveSearchToHistory(criteria, resultCount) {
  if (typeof window === "undefined") return;

  try {
    const history = getSearchHistory();

    // Create search entry
    const entry = {
      id: Date.now(),
      timestamp: Date.now(),
      criteria,
      resultCount,
    };

    // Add to beginning of history
    history.unshift(entry);

    // Limit history size
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));

    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent("searchHistoryUpdated"));
  } catch (error) {
    console.error("Error saving search to history:", error);
  }
}

/**
 * Delete search from history
 * @param {number} searchId - Search ID to delete
 */
export function deleteSearchFromHistory(searchId) {
  if (typeof window === "undefined") return;

  try {
    const history = getSearchHistory();
    const filtered = history.filter((entry) => entry.id !== searchId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    window.dispatchEvent(new CustomEvent("searchHistoryUpdated"));
  } catch (error) {
    console.error("Error deleting search from history:", error);
  }
}

/**
 * Clear all search history
 */
export function clearSearchHistory() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("searchHistoryUpdated"));
  } catch (error) {
    console.error("Error clearing search history:", error);
  }
}

/**
 * Load search from history
 * @param {number} searchId - Search ID to load
 * @returns {Object|null} Search criteria or null
 */
export function loadSearchFromHistory(searchId) {
  const history = getSearchHistory();
  const entry = history.find((e) => e.id === searchId);
  return entry ? entry.criteria : null;
}

/**
 * Get common method IDs (function selectors)
 * @returns {Array} Common method IDs with descriptions
 */
export function getCommonMethodIds() {
  return [
    {
      id: "0x00000000",
      name: "Fallback / Transfer",
      description: "Plain ETH transfer or fallback",
    },
    {
      id: "0xa9059cbb",
      name: "transfer(address,uint256)",
      description: "ERC20 transfer",
    },
    {
      id: "0x23b872dd",
      name: "transferFrom(address,address,uint256)",
      description: "ERC20 transferFrom",
    },
    {
      id: "0x095ea7b3",
      name: "approve(address,uint256)",
      description: "ERC20 approve",
    },
    {
      id: "0x42842e0e",
      name: "safeTransferFrom(address,address,uint256)",
      description: "ERC721 transfer",
    },
    {
      id: "0xf242432a",
      name: "safeTransferFrom(address,address,uint256,uint256,bytes)",
      description: "ERC1155 transfer",
    },
    {
      id: "0x40c10f19",
      name: "mint(address,uint256)",
      description: "Common mint function",
    },
    {
      id: "0x42966c68",
      name: "burn(uint256)",
      description: "Common burn function",
    },
    {
      id: "0xa22cb465",
      name: "setApprovalForAll(address,bool)",
      description: "NFT approval",
    },
  ];
}

/**
 * Format search criteria for display
 * @param {SearchCriteria} criteria - Search criteria
 * @returns {string} Human-readable description
 */
export function formatSearchCriteria(criteria) {
  const parts = [];

  if (criteria.query) {
    parts.push(`Query: "${criteria.query}"`);
  }

  if (criteria.methodId) {
    const common = getCommonMethodIds().find((m) => m.id === criteria.methodId);
    parts.push(`Method: ${common ? common.name : criteria.methodId}`);
  }

  if (criteria.minValue || criteria.maxValue) {
    const range = [];
    if (criteria.minValue) range.push(`≥${criteria.minValue} ETH`);
    if (criteria.maxValue) range.push(`≤${criteria.maxValue} ETH`);
    parts.push(`Value: ${range.join(" and ")}`);
  }

  if (criteria.startBlock || criteria.endBlock) {
    const range = [];
    if (criteria.startBlock) range.push(`#${criteria.startBlock}`);
    if (criteria.endBlock) range.push(`#${criteria.endBlock}`);
    parts.push(`Blocks: ${range.join(" to ")}`);
  }

  if (criteria.status && criteria.status !== "all") {
    parts.push(`Status: ${criteria.status}`);
  }

  if (criteria.fromAddress) {
    parts.push(`From: ${criteria.fromAddress.slice(0, 10)}...`);
  }

  if (criteria.toAddress) {
    parts.push(`To: ${criteria.toAddress.slice(0, 10)}...`);
  }

  return parts.length > 0 ? parts.join(" | ") : "All transactions";
}

/**
 * Validate search criteria
 * @param {SearchCriteria} criteria - Criteria to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateSearchCriteria(criteria) {
  const errors = [];

  // Validate addresses
  if (criteria.fromAddress && !isValidAddress(criteria.fromAddress)) {
    errors.push("Invalid 'From' address format");
  }

  if (criteria.toAddress && !isValidAddress(criteria.toAddress)) {
    errors.push("Invalid 'To' address format");
  }

  // Validate method ID
  if (criteria.methodId && !isValidMethodId(criteria.methodId)) {
    errors.push(
      "Invalid method ID format (must be 10 characters starting with 0x)",
    );
  }

  // Validate value range
  if (criteria.minValue && Number.isNaN(parseFloat(criteria.minValue))) {
    errors.push("Invalid minimum value");
  }

  if (criteria.maxValue && Number.isNaN(parseFloat(criteria.maxValue))) {
    errors.push("Invalid maximum value");
  }

  if (
    criteria.minValue &&
    criteria.maxValue &&
    parseFloat(criteria.minValue) > parseFloat(criteria.maxValue)
  ) {
    errors.push("Minimum value cannot be greater than maximum value");
  }

  // Validate block range
  if (criteria.startBlock && criteria.startBlock < 0) {
    errors.push("Start block cannot be negative");
  }

  if (criteria.endBlock && criteria.endBlock < 0) {
    errors.push("End block cannot be negative");
  }

  if (
    criteria.startBlock &&
    criteria.endBlock &&
    criteria.startBlock > criteria.endBlock
  ) {
    errors.push("Start block cannot be greater than end block");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if string is valid Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
function isValidAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if string is valid method ID
 * @param {string} methodId - Method ID to validate
 * @returns {boolean} True if valid
 */
function isValidMethodId(methodId) {
  return /^0x[a-fA-F0-9]{8}$/.test(methodId);
}

/**
 * Export search results as CSV
 * @param {Array} results - Search results
 * @returns {string} CSV string
 */
export function exportResultsAsCSV(results) {
  if (results.length === 0) return "";

  const headers = [
    "Block Number",
    "Timestamp",
    "Transaction Hash",
    "From",
    "To",
    "Value (ETH)",
    "Gas Used",
    "Status",
    "Method ID",
  ];

  const rows = results.map((tx) => [
    tx.blockNumber?.toString() || "",
    new Date(Number(tx.timestamp) * 1000).toISOString(),
    tx.hash,
    tx.from,
    tx.to || "Contract Creation",
    (Number(tx.value) / 1e18).toString(),
    tx.gasUsed?.toString() || "",
    tx.status || "",
    tx.input?.slice(0, 10) || "0x",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Download CSV file
 * @param {string} csv - CSV content
 * @param {string} filename - Filename
 */
export function downloadCSV(csv, filename = "search-results.csv") {
  if (typeof window === "undefined") return;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
