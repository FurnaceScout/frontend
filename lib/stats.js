/**
 * Blockchain Statistics Utilities
 * Calculate TPS, block times, transaction volumes, and active addresses
 *
 * Optimized with batch fetching for reduced RPC calls
 */

import {
  fetchBlocksBatched,
  getCachedBlock,
  getLatestBlockNumber,
} from "./block-utils";
import { publicClient } from "./viem";

/**
 * Calculate transactions per second over a time period
 * @param {number} startBlock - Starting block number
 * @param {number} endBlock - Ending block number
 * @returns {Promise<number>} TPS value
 */
export async function calculateTPS(startBlock, endBlock) {
  try {
    // Safety check for negative or invalid block numbers
    if (startBlock < 0 || endBlock < 0 || startBlock > endBlock) {
      return 0;
    }

    const [startBlockData, endBlockData] = await Promise.all([
      getCachedBlock(startBlock),
      getCachedBlock(endBlock),
    ]);

    // Calculate time difference in seconds
    const timeDiff = Number(endBlockData.timestamp - startBlockData.timestamp);
    if (timeDiff === 0) return 0;

    // Fetch all blocks in batches (optimized)
    const blocks = await fetchBlocksBatched(startBlock, endBlock, {
      includeTransactions: true,
    });

    // Count total transactions
    let totalTxs = 0;
    for (const block of blocks) {
      totalTxs += Array.isArray(block.transactions)
        ? block.transactions.length
        : 0;
    }

    return totalTxs / timeDiff;
  } catch (error) {
    console.error("Error calculating TPS:", error);
    return 0;
  }
}

/**
 * Calculate average block time over a range
 * @param {number} blockCount - Number of recent blocks to analyze
 * @returns {Promise<number>} Average block time in seconds
 */
export async function calculateAverageBlockTime(blockCount = 100) {
  try {
    const latestBlock = await getLatestBlockNumber();

    // Handle case where blockchain has fewer blocks than requested
    if (latestBlock < BigInt(blockCount)) {
      blockCount = Number(latestBlock) + 1;
    }

    const startBlock = latestBlock - BigInt(blockCount) + 1n;

    if (startBlock < 0n || latestBlock < 1n) return 0;

    const [firstBlock, lastBlock] = await Promise.all([
      getCachedBlock(startBlock),
      getCachedBlock(latestBlock),
    ]);

    const timeDiff = Number(lastBlock.timestamp - firstBlock.timestamp);
    return timeDiff / (blockCount - 1);
  } catch (error) {
    console.error("Error calculating average block time:", error);
    return 0;
  }
}

/**
 * Get transaction volume statistics
 * @param {number} blockCount - Number of recent blocks to analyze
 * @returns {Promise<Object>} Volume statistics
 */
export async function getTransactionVolume(blockCount = 100) {
  try {
    const latestBlock = await getLatestBlockNumber();

    // Handle case where blockchain has fewer blocks than requested
    if (latestBlock < BigInt(blockCount)) {
      blockCount = Number(latestBlock) + 1;
    }

    const startBlock = latestBlock - BigInt(blockCount) + 1n;

    // Safety check for negative or invalid block numbers
    if (startBlock < 0n || latestBlock < 0n) {
      return {
        totalTransactions: 0,
        totalValue: "0",
        totalGasUsed: "0",
        averageTxPerBlock: 0,
      };
    }

    // Fetch all blocks in batches (optimized)
    const blocks = await fetchBlocksBatched(startBlock, latestBlock, {
      includeTransactions: true,
    });

    let totalValue = 0n;
    let totalTxs = 0;
    let totalGasUsed = 0n;

    for (const block of blocks) {
      if (Array.isArray(block.transactions)) {
        totalTxs += block.transactions.length;

        for (const tx of block.transactions) {
          if (tx.value) {
            totalValue += tx.value;
          }
        }
      }

      if (block.gasUsed) {
        totalGasUsed += block.gasUsed;
      }
    }

    return {
      totalTransactions: totalTxs,
      totalValue: totalValue.toString(),
      totalGasUsed: totalGasUsed.toString(),
      averageTxPerBlock: totalTxs / blockCount,
    };
  } catch (error) {
    console.error("Error calculating transaction volume:", error);
    return {
      totalTransactions: 0,
      totalValue: "0",
      totalGasUsed: "0",
      averageTxPerBlock: 0,
    };
  }
}

/**
 * Count active addresses over a period
 * @param {number} blockCount - Number of recent blocks to analyze
 * @returns {Promise<Object>} Active address statistics
 */
export async function getActiveAddresses(blockCount = 100) {
  try {
    const latestBlock = await getLatestBlockNumber();

    // Handle case where blockchain has fewer blocks than requested
    if (latestBlock < BigInt(blockCount)) {
      blockCount = Number(latestBlock) + 1;
    }

    const startBlock = latestBlock - BigInt(blockCount) + 1n;

    // Safety check for negative or invalid block numbers
    if (startBlock < 0n || latestBlock < 0n) {
      return {
        totalActive: 0,
        uniqueSenders: 0,
        uniqueReceivers: 0,
      };
    }

    // Fetch all blocks in batches (optimized)
    const blocks = await fetchBlocksBatched(startBlock, latestBlock, {
      includeTransactions: true,
    });

    const uniqueSenders = new Set();
    const uniqueReceivers = new Set();
    const uniqueAddresses = new Set();

    for (const block of blocks) {
      if (Array.isArray(block.transactions)) {
        for (const tx of block.transactions) {
          const from = tx.from.toLowerCase();
          uniqueSenders.add(from);
          uniqueAddresses.add(from);

          if (tx.to) {
            const to = tx.to.toLowerCase();
            uniqueReceivers.add(to);
            uniqueAddresses.add(to);
          }
        }
      }
    }

    return {
      totalActive: uniqueAddresses.size,
      uniqueSenders: uniqueSenders.size,
      uniqueReceivers: uniqueReceivers.size,
    };
  } catch (error) {
    console.error("Error calculating active addresses:", error);
    return {
      totalActive: 0,
      uniqueSenders: 0,
      uniqueReceivers: 0,
    };
  }
}

/**
 * Get block statistics over time (for charts)
 * @param {number} blockCount - Number of blocks to analyze
 * @param {number} sampleSize - Number of data points to return
 * @returns {Promise<Array>} Array of block statistics
 */
export async function getBlockStatsOverTime(blockCount = 100, sampleSize = 20) {
  try {
    const latestBlock = await getLatestBlockNumber();
    const startBlock = latestBlock - BigInt(blockCount) + 1n;
    const interval = Math.floor(blockCount / sampleSize);

    // Calculate which block numbers we need to sample
    const blockNumbersToFetch = [];
    for (let i = 0; i < sampleSize; i++) {
      const blockNum = startBlock + BigInt(i * interval);
      if (blockNum > latestBlock) break;
      blockNumbersToFetch.push(blockNum);
    }

    // Fetch all sampled blocks in parallel
    const blockPromises = blockNumbersToFetch.map((blockNum) =>
      getCachedBlock(blockNum, { includeTransactions: true }),
    );
    const blocks = await Promise.all(blockPromises);

    const stats = blocks.map((block) => {
      const txCount = Array.isArray(block.transactions)
        ? block.transactions.length
        : 0;

      let totalValue = 0n;
      if (Array.isArray(block.transactions)) {
        for (const tx of block.transactions) {
          if (tx.value) {
            totalValue += tx.value;
          }
        }
      }

      return {
        blockNumber: Number(block.number),
        timestamp: Number(block.timestamp),
        transactionCount: txCount,
        totalValue: totalValue.toString(),
        gasUsed: block.gasUsed.toString(),
      };
    });

    return stats;
  } catch (error) {
    console.error("Error getting block stats over time:", error);
    return [];
  }
}

/**
 * Get transaction statistics by hour
 * @param {number} hours - Number of hours to look back
 * @returns {Promise<Array>} Hourly transaction statistics
 */
export async function getHourlyTransactionStats(hours = 24) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const startTime = now - hours * 3600;

    const latestBlock = await getLatestBlockNumber();
    const hourlyStats = new Array(hours).fill(null).map((_, i) => ({
      hour: startTime + i * 3600,
      transactions: 0,
      value: 0n,
      gasUsed: 0n,
    }));

    // Estimate how many blocks we need to scan
    // Assume ~12 second block time, scan 10% extra to be safe
    const estimatedBlocksPerHour = 300; // 3600 / 12
    const estimatedBlocksNeeded = Math.ceil(
      estimatedBlocksPerHour * hours * 1.1,
    );
    const startBlock = latestBlock - BigInt(estimatedBlocksNeeded);
    const actualStartBlock = startBlock < 0n ? 0n : startBlock;

    // Fetch blocks in batches
    const blocks = await fetchBlocksBatched(actualStartBlock, latestBlock, {
      includeTransactions: true,
    });

    // Process blocks (already sorted by block number)
    for (const block of blocks) {
      const blockTime = Number(block.timestamp);
      if (blockTime < startTime) continue;

      // Find which hour bucket this block belongs to
      const hourIndex = Math.floor((blockTime - startTime) / 3600);
      if (hourIndex >= 0 && hourIndex < hours) {
        const txCount = Array.isArray(block.transactions)
          ? block.transactions.length
          : 0;
        hourlyStats[hourIndex].transactions += txCount;

        if (Array.isArray(block.transactions)) {
          for (const tx of block.transactions) {
            if (tx.value) {
              hourlyStats[hourIndex].value += tx.value;
            }
          }
        }

        if (block.gasUsed) {
          hourlyStats[hourIndex].gasUsed += block.gasUsed;
        }
      }
    }

    return hourlyStats.map((stat) => ({
      hour: stat.hour,
      transactions: stat.transactions,
      value: stat.value.toString(),
      gasUsed: stat.gasUsed.toString(),
    }));
  } catch (error) {
    console.error("Error getting hourly transaction stats:", error);
    return [];
  }
}

/**
 * Get network health metrics
 * @returns {Promise<Object>} Network health indicators
 */
export async function getNetworkHealth() {
  try {
    const latestBlock = await getLatestBlockNumber();

    // Run all stats in parallel (they each use batch fetching internally)
    const [avgBlockTime, recentVolume, activeAddrs, recentTPS] =
      await Promise.all([
        calculateAverageBlockTime(50),
        getTransactionVolume(50),
        getActiveAddresses(50),
        (async () => {
          const start = Math.max(0, Number(latestBlock) - 50);
          return calculateTPS(start, Number(latestBlock));
        })(),
      ]);

    return {
      latestBlock: Number(latestBlock),
      averageBlockTime: avgBlockTime,
      transactionsPerSecond: recentTPS,
      totalTransactions: recentVolume.totalTransactions,
      activeAddresses: activeAddrs.totalActive,
      avgTxPerBlock: recentVolume.averageTxPerBlock,
    };
  } catch (error) {
    console.error("Error getting network health:", error);
    return {
      latestBlock: 0,
      averageBlockTime: 0,
      transactionsPerSecond: 0,
      totalTransactions: 0,
      activeAddresses: 0,
      avgTxPerBlock: 0,
    };
  }
}

/**
 * Get statistics summary for a specific block range
 * @param {number} startBlock - Start block number
 * @param {number} endBlock - End block number
 * @returns {Promise<Object>} Statistics summary
 */
export async function getBlockRangeStats(startBlock, endBlock) {
  try {
    const [startBlockData, endBlockData] = await Promise.all([
      getCachedBlock(startBlock),
      getCachedBlock(endBlock),
    ]);

    const timeDiff = Number(endBlockData.timestamp - startBlockData.timestamp);
    const blockCount = endBlock - startBlock + 1;

    // Fetch all blocks in batches (optimized)
    const blocks = await fetchBlocksBatched(startBlock, endBlock, {
      includeTransactions: true,
    });

    let totalTxs = 0;
    let totalValue = 0n;
    let totalGasUsed = 0n;
    const addresses = new Set();

    for (const block of blocks) {
      if (Array.isArray(block.transactions)) {
        totalTxs += block.transactions.length;

        for (const tx of block.transactions) {
          if (tx.value) {
            totalValue += tx.value;
          }
          addresses.add(tx.from.toLowerCase());
          if (tx.to) {
            addresses.add(tx.to.toLowerCase());
          }
        }
      }

      if (block.gasUsed) {
        totalGasUsed += block.gasUsed;
      }
    }

    return {
      blockCount,
      timePeriod: timeDiff,
      totalTransactions: totalTxs,
      totalValue: totalValue.toString(),
      totalGasUsed: totalGasUsed.toString(),
      uniqueAddresses: addresses.size,
      averageBlockTime: timeDiff / (blockCount - 1),
      averageTxPerBlock: totalTxs / blockCount,
      transactionsPerSecond: timeDiff > 0 ? totalTxs / timeDiff : 0,
    };
  } catch (error) {
    console.error("Error getting block range stats:", error);
    throw error;
  }
}
