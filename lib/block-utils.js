/**
 * Block Utilities
 * Optimized batch fetching and caching for blockchain data
 */

import { publicClient } from "./viem";

// ============================================================================
// Block Cache (LRU)
// ============================================================================

const blockCache = new Map();
const MAX_CACHE_SIZE = 1000;

/**
 * Get a block from cache or fetch it
 * @param {bigint|number|string} blockNumber - Block number to fetch
 * @param {object} options - Options for getBlock
 * @returns {Promise<object>} Block data
 */
export async function getCachedBlock(blockNumber, options = {}) {
  const blockNum = BigInt(blockNumber);
  const key = `${blockNum}-${options.includeTransactions || false}`;

  if (blockCache.has(key)) {
    return blockCache.get(key);
  }

  const block = await publicClient.getBlock({
    blockNumber: blockNum,
    ...options,
  });

  // LRU eviction - remove oldest entry if at capacity
  if (blockCache.size >= MAX_CACHE_SIZE) {
    const firstKey = blockCache.keys().next().value;
    blockCache.delete(firstKey);
  }

  blockCache.set(key, block);
  return block;
}

/**
 * Clear the block cache
 */
export function clearBlockCache() {
  blockCache.clear();
}

/**
 * Get current cache size
 * @returns {number} Number of cached blocks
 */
export function getBlockCacheSize() {
  return blockCache.size;
}

// ============================================================================
// Batch Block Fetching
// ============================================================================

/**
 * Fetch multiple blocks in parallel batches
 * @param {number|bigint} startBlock - Starting block number
 * @param {number|bigint} endBlock - Ending block number
 * @param {object} options - Fetch options
 * @param {boolean} options.includeTransactions - Include full transaction objects
 * @param {number} options.batchSize - Number of concurrent requests (default: 10)
 * @param {boolean} options.useCache - Use block cache (default: true)
 * @returns {Promise<object[]>} Array of blocks
 */
export async function fetchBlocksBatched(startBlock, endBlock, options = {}) {
  const {
    includeTransactions = true,
    batchSize = 10,
    useCache = true,
  } = options;

  const start = BigInt(startBlock);
  const end = BigInt(endBlock);

  if (start > end) {
    return [];
  }

  const blocks = [];

  for (let i = start; i <= end; i += BigInt(batchSize)) {
    const batchEnd = i + BigInt(batchSize) - 1n > end ? end : i + BigInt(batchSize) - 1n;
    const batch = [];

    for (let j = i; j <= batchEnd; j++) {
      if (useCache) {
        batch.push(getCachedBlock(j, { includeTransactions }));
      } else {
        batch.push(
          publicClient.getBlock({
            blockNumber: j,
            includeTransactions,
          })
        );
      }
    }

    const results = await Promise.all(batch);
    blocks.push(...results.filter(Boolean));
  }

  return blocks;
}

/**
 * Fetch blocks in reverse order (newest first)
 * @param {number|bigint} fromBlock - Starting block (newest)
 * @param {number} count - Number of blocks to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<object[]>} Array of blocks (newest first)
 */
export async function fetchRecentBlocks(fromBlock, count, options = {}) {
  const {
    includeTransactions = true,
    batchSize = 10,
    useCache = true,
  } = options;

  const start = BigInt(fromBlock);
  const end = start - BigInt(count) + 1n;
  const actualEnd = end < 0n ? 0n : end;

  const blocks = await fetchBlocksBatched(actualEnd, start, {
    includeTransactions,
    batchSize,
    useCache,
  });

  // Reverse to get newest first
  return blocks.reverse();
}

// ============================================================================
// Receipt Cache
// ============================================================================

const receiptCache = new Map();
const MAX_RECEIPT_CACHE_SIZE = 500;

/**
 * Get a transaction receipt from cache or fetch it
 * @param {string} hash - Transaction hash
 * @returns {Promise<object|null>} Receipt data or null if failed
 */
export async function getCachedReceipt(hash) {
  const key = hash.toLowerCase();

  if (receiptCache.has(key)) {
    return receiptCache.get(key);
  }

  try {
    const receipt = await publicClient.getTransactionReceipt({ hash });

    // LRU eviction
    if (receiptCache.size >= MAX_RECEIPT_CACHE_SIZE) {
      const firstKey = receiptCache.keys().next().value;
      receiptCache.delete(firstKey);
    }

    receiptCache.set(key, receipt);
    return receipt;
  } catch (error) {
    console.error(`Failed to fetch receipt for ${hash}:`, error);
    return null;
  }
}

/**
 * Clear the receipt cache
 */
export function clearReceiptCache() {
  receiptCache.clear();
}

// ============================================================================
// Batch Receipt Fetching
// ============================================================================

/**
 * Fetch multiple transaction receipts in parallel batches
 * @param {string[]} hashes - Array of transaction hashes
 * @param {object} options - Fetch options
 * @param {number} options.batchSize - Number of concurrent requests (default: 20)
 * @param {boolean} options.useCache - Use receipt cache (default: true)
 * @returns {Promise<object[]>} Array of receipts (nulls filtered out)
 */
export async function fetchReceiptsBatched(hashes, options = {}) {
  const { batchSize = 20, useCache = true } = options;

  if (!hashes || hashes.length === 0) {
    return [];
  }

  const receipts = [];

  for (let i = 0; i < hashes.length; i += batchSize) {
    const batch = hashes.slice(i, i + batchSize).map((hash) => {
      if (useCache) {
        return getCachedReceipt(hash);
      }
      return publicClient
        .getTransactionReceipt({ hash })
        .catch(() => null);
    });

    const results = await Promise.all(batch);
    receipts.push(...results.filter(Boolean));
  }

  return receipts;
}

/**
 * Fetch receipts for all transactions in a block
 * @param {object} block - Block object with transactions
 * @param {object} options - Fetch options
 * @returns {Promise<object[]>} Array of receipts
 */
export async function fetchBlockReceipts(block, options = {}) {
  if (!block || !block.transactions || block.transactions.length === 0) {
    return [];
  }

  // Handle both full transaction objects and hash-only arrays
  const hashes = block.transactions.map((tx) =>
    typeof tx === "string" ? tx : tx.hash
  );

  return fetchReceiptsBatched(hashes, options);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the latest block number
 * @returns {Promise<bigint>} Latest block number
 */
export async function getLatestBlockNumber() {
  return publicClient.getBlockNumber();
}

/**
 * Fetch blocks and their receipts together
 * @param {number|bigint} startBlock - Starting block number
 * @param {number|bigint} endBlock - Ending block number
 * @param {object} options - Fetch options
 * @returns {Promise<{blocks: object[], receipts: Map}>} Blocks and receipts map
 */
export async function fetchBlocksWithReceipts(startBlock, endBlock, options = {}) {
  const { batchSize = 10 } = options;

  // First fetch all blocks
  const blocks = await fetchBlocksBatched(startBlock, endBlock, {
    includeTransactions: true,
    batchSize,
  });

  // Collect all transaction hashes
  const allHashes = [];
  for (const block of blocks) {
    if (block.transactions && Array.isArray(block.transactions)) {
      for (const tx of block.transactions) {
        const hash = typeof tx === "string" ? tx : tx.hash;
        allHashes.push(hash);
      }
    }
  }

  // Fetch all receipts in batches
  const receipts = await fetchReceiptsBatched(allHashes, { batchSize: 20 });

  // Create a map for easy lookup
  const receiptMap = new Map();
  for (const receipt of receipts) {
    if (receipt && receipt.transactionHash) {
      receiptMap.set(receipt.transactionHash.toLowerCase(), receipt);
    }
  }

  return { blocks, receipts: receiptMap };
}

/**
 * Clear all caches
 */
export function clearAllCaches() {
  clearBlockCache();
  clearReceiptCache();
}
