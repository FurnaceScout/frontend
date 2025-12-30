"use client";

/**
 * React Query hooks for blockchain data
 * Provides caching, deduplication, and automatic refetching
 */

import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  fetchBlocksBatched,
  fetchReceiptsBatched,
  getCachedBlock,
  getCachedReceipt,
  getLatestBlockNumber,
} from "@/lib/block-utils";
import {
  getNetworkHealth,
  getBlockStatsOverTime,
  getTransactionVolume,
  getActiveAddresses,
} from "@/lib/stats";
import {
  getTopGasConsumers,
  getGasTrends,
  getGasStatistics,
} from "@/lib/gas-profiling";
import { decodeLogs } from "@/lib/contract-decoder";
import { parseTokenTransfers, detectTokenType } from "@/lib/tokens";
import {
  getTokenTransferStats,
  filterTransfers,
  searchTransfers,
  sortTransfers,
} from "@/lib/token-transfers";
import { publicClient } from "@/lib/viem";

// ============================================================================
// Query Key Factories
// ============================================================================

export const blockchainKeys = {
  all: ["blockchain"],
  // Block queries
  blocks: () => [...blockchainKeys.all, "blocks"],
  block: (blockNumber) => [...blockchainKeys.blocks(), blockNumber],
  blockRange: (start, end) => [...blockchainKeys.blocks(), "range", start, end],
  latestBlockNumber: () => [...blockchainKeys.blocks(), "latest"],
  latestBlocks: (count) => [...blockchainKeys.blocks(), "latest", count],
  // Transaction queries
  transactions: () => [...blockchainKeys.all, "transactions"],
  transaction: (hash) => [...blockchainKeys.transactions(), hash],
  // Receipt queries
  receipts: () => [...blockchainKeys.all, "receipts"],
  receipt: (hash) => [...blockchainKeys.receipts(), hash],
  // Balance queries
  balances: () => [...blockchainKeys.all, "balances"],
  balance: (address) => [...blockchainKeys.balances(), address],
  // Chain info
  chainInfo: () => [...blockchainKeys.all, "chainInfo"],
  gasPrice: () => [...blockchainKeys.all, "gasPrice"],
  // Stats queries
  stats: () => [...blockchainKeys.all, "stats"],
  networkHealth: (blockRange) => [
    ...blockchainKeys.stats(),
    "health",
    blockRange,
  ],
  blockStats: (blockRange, sampleSize) => [
    ...blockchainKeys.stats(),
    "blockStats",
    blockRange,
    sampleSize,
  ],
  transactionVolume: (blockRange) => [
    ...blockchainKeys.stats(),
    "volume",
    blockRange,
  ],
  activeAddresses: (blockRange) => [
    ...blockchainKeys.stats(),
    "addresses",
    blockRange,
  ],
  // Gas profiling queries
  gas: () => [...blockchainKeys.all, "gas"],
  topGasConsumers: (blockRange, limit) => [
    ...blockchainKeys.gas(),
    "topConsumers",
    blockRange,
    limit,
  ],
  gasTrends: (blockRange, sampleSize) => [
    ...blockchainKeys.gas(),
    "trends",
    blockRange,
    sampleSize,
  ],
  gasStatistics: (blockRange) => [
    ...blockchainKeys.gas(),
    "statistics",
    blockRange,
  ],
  // Event queries
  events: () => [...blockchainKeys.all, "events"],
  eventLogs: (fromBlock, toBlock, filters) => [
    ...blockchainKeys.events(),
    "logs",
    fromBlock,
    toBlock,
    filters,
  ],
  // Token transfer queries
  tokens: () => [...blockchainKeys.all, "tokens"],
  tokenTransfers: (blockCount) => [
    ...blockchainKeys.tokens(),
    "transfers",
    blockCount,
  ],
  tokenMetadata: (addresses) => [
    ...blockchainKeys.tokens(),
    "metadata",
    addresses,
  ],
  // Address queries
  address: () => [...blockchainKeys.all, "address"],
  addressData: (address) => [...blockchainKeys.address(), address, "data"],
  addressCode: (address) => [...blockchainKeys.address(), address, "code"],
  addressTransactions: (address, blockCount) => [
    ...blockchainKeys.address(),
    address,
    "transactions",
    blockCount,
  ],
};

// ============================================================================
// Stale Time Configuration
// ============================================================================

// Blocks are immutable once confirmed, so we can cache them for a long time
const BLOCK_STALE_TIME = 1000 * 60 * 60; // 1 hour
const RECEIPT_STALE_TIME = 1000 * 60 * 60; // 1 hour
const TRANSACTION_STALE_TIME = 1000 * 60 * 60; // 1 hour

// Latest block number changes frequently
const LATEST_BLOCK_STALE_TIME = 1000 * 2; // 2 seconds

// Balances can change with each block
const BALANCE_STALE_TIME = 1000 * 5; // 5 seconds

// Gas price fluctuates
const GAS_PRICE_STALE_TIME = 1000 * 10; // 10 seconds

// Stats are computed over block ranges, moderately stable
const STATS_STALE_TIME = 1000 * 30; // 30 seconds

// ============================================================================
// Block Hooks
// ============================================================================

/**
 * Hook to get the latest block number with auto-refresh
 */
export function useLatestBlockNumber(options = {}) {
  return useQuery({
    queryKey: blockchainKeys.latestBlockNumber(),
    queryFn: getLatestBlockNumber,
    staleTime: LATEST_BLOCK_STALE_TIME,
    refetchInterval: options.refetchInterval ?? 2000, // Poll every 2 seconds
    ...options,
  });
}

/**
 * Hook to get a single block by number
 */
export function useBlock(blockNumber, options = {}) {
  const enabled = blockNumber !== null && blockNumber !== undefined;

  return useQuery({
    queryKey: blockchainKeys.block(blockNumber?.toString()),
    queryFn: () => getCachedBlock(blockNumber, { includeTransactions: true }),
    enabled,
    staleTime: BLOCK_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get multiple blocks by number
 */
export function useBlocks(blockNumbers, options = {}) {
  const queries = useQueries({
    queries: (blockNumbers || []).map((num) => ({
      queryKey: blockchainKeys.block(num?.toString()),
      queryFn: () => getCachedBlock(num, { includeTransactions: true }),
      staleTime: BLOCK_STALE_TIME,
      enabled: num !== null && num !== undefined,
    })),
    ...options,
  });

  return {
    data: queries.map((q) => q.data).filter(Boolean),
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
    errors: queries.map((q) => q.error).filter(Boolean),
  };
}

/**
 * Hook to get a range of blocks
 */
export function useBlockRange(startBlock, endBlock, options = {}) {
  const enabled =
    startBlock !== null &&
    startBlock !== undefined &&
    endBlock !== null &&
    endBlock !== undefined;

  return useQuery({
    queryKey: blockchainKeys.blockRange(
      startBlock?.toString(),
      endBlock?.toString(),
    ),
    queryFn: () =>
      fetchBlocksBatched(startBlock, endBlock, {
        includeTransactions: true,
        batchSize: 10,
      }),
    enabled,
    staleTime: BLOCK_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get the latest N blocks
 */
export function useLatestBlocks(count = 10, options = {}) {
  const { data: latestBlockNumber } = useLatestBlockNumber();

  const startBlock =
    latestBlockNumber !== undefined
      ? latestBlockNumber - BigInt(count - 1)
      : null;
  const endBlock = latestBlockNumber;

  const query = useQuery({
    queryKey: blockchainKeys.latestBlocks(count),
    queryFn: async () => {
      if (startBlock === null || endBlock === null) return [];

      const blocks = await fetchBlocksBatched(
        startBlock < 0n ? 0n : startBlock,
        endBlock,
        {
          includeTransactions: true,
          batchSize: 10,
        },
      );

      // Sort by block number descending (newest first)
      return blocks.sort((a, b) => Number(b.number) - Number(a.number));
    },
    enabled: latestBlockNumber !== undefined,
    staleTime: LATEST_BLOCK_STALE_TIME,
    ...options,
  });

  return {
    ...query,
    blockNumber: latestBlockNumber,
  };
}

// ============================================================================
// Transaction Hooks
// ============================================================================

/**
 * Hook to get a transaction by hash
 */
export function useTransaction(hash, options = {}) {
  const enabled = !!hash;

  return useQuery({
    queryKey: blockchainKeys.transaction(hash),
    queryFn: () => publicClient.getTransaction({ hash }),
    enabled,
    staleTime: TRANSACTION_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get a transaction receipt by hash
 */
export function useTransactionReceipt(hash, options = {}) {
  const enabled = !!hash;

  return useQuery({
    queryKey: blockchainKeys.receipt(hash),
    queryFn: () => getCachedReceipt(hash),
    enabled,
    staleTime: RECEIPT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get multiple transaction receipts
 */
export function useTransactionReceipts(hashes, options = {}) {
  const enabled = hashes && hashes.length > 0;

  return useQuery({
    queryKey: blockchainKeys.receipts().concat(hashes?.sort() || []),
    queryFn: () => fetchReceiptsBatched(hashes, { batchSize: 20 }),
    enabled,
    staleTime: RECEIPT_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get recent transactions from latest blocks
 */
export function useLatestTransactions(
  count = 10,
  maxBlocksToScan = 100,
  options = {},
) {
  const {
    data: blocks,
    isLoading,
    blockNumber,
  } = useLatestBlocks(maxBlocksToScan, { staleTime: LATEST_BLOCK_STALE_TIME });

  const transactions = [];
  if (blocks) {
    for (const block of blocks) {
      if (transactions.length >= count) break;
      if (block.transactions && Array.isArray(block.transactions)) {
        for (const tx of block.transactions) {
          if (transactions.length >= count) break;
          transactions.push({
            ...tx,
            blockNumber: block.number,
            timestamp: block.timestamp,
          });
        }
      }
    }
  }

  return {
    data: transactions.slice(0, count),
    isLoading,
    blockNumber,
  };
}

// ============================================================================
// Balance Hooks
// ============================================================================

/**
 * Hook to get an address balance
 */
export function useBalance(address, options = {}) {
  const enabled = !!address;

  return useQuery({
    queryKey: blockchainKeys.balance(address?.toLowerCase()),
    queryFn: () => publicClient.getBalance({ address }),
    enabled,
    staleTime: BALANCE_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get multiple address balances
 */
export function useBalances(addresses, options = {}) {
  const queries = useQueries({
    queries: (addresses || []).map((address) => ({
      queryKey: blockchainKeys.balance(address?.toLowerCase()),
      queryFn: () => publicClient.getBalance({ address }),
      staleTime: BALANCE_STALE_TIME,
      enabled: !!address,
    })),
    ...options,
  });

  const balances = {};
  addresses?.forEach((address, index) => {
    if (queries[index]?.data !== undefined) {
      balances[address.toLowerCase()] = queries[index].data;
    }
  });

  return {
    data: balances,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}

// ============================================================================
// Chain Info Hooks
// ============================================================================

/**
 * Hook to get chain information
 */
export function useChainInfo(options = {}) {
  const { data: blockNumber } = useLatestBlockNumber();

  return useQuery({
    queryKey: blockchainKeys.chainInfo(),
    queryFn: async () => {
      const [chainId, gasPrice] = await Promise.all([
        publicClient.getChainId(),
        publicClient.getGasPrice(),
      ]);

      return {
        chainId: chainId.toString(),
        gasPrice: gasPrice.toString(),
        blockNumber: blockNumber?.toString(),
      };
    },
    enabled: blockNumber !== undefined,
    staleTime: GAS_PRICE_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get current gas price
 */
export function useGasPrice(options = {}) {
  return useQuery({
    queryKey: blockchainKeys.gasPrice(),
    queryFn: () => publicClient.getGasPrice(),
    staleTime: GAS_PRICE_STALE_TIME,
    refetchInterval: options.refetchInterval ?? 10000, // Poll every 10 seconds
    ...options,
  });
}

// ============================================================================
// Prefetching & Cache Utilities
// ============================================================================

/**
 * Hook to get cache utility functions
 */
export function useBlockchainCache() {
  const queryClient = useQueryClient();

  const prefetchBlock = useCallback(
    async (blockNumber) => {
      await queryClient.prefetchQuery({
        queryKey: blockchainKeys.block(blockNumber?.toString()),
        queryFn: () =>
          getCachedBlock(blockNumber, { includeTransactions: true }),
        staleTime: BLOCK_STALE_TIME,
      });
    },
    [queryClient],
  );

  const prefetchBlocks = useCallback(
    async (startBlock, endBlock) => {
      const blocks = await fetchBlocksBatched(startBlock, endBlock, {
        includeTransactions: true,
        batchSize: 10,
      });

      // Cache each block individually
      for (const block of blocks) {
        queryClient.setQueryData(
          blockchainKeys.block(block.number.toString()),
          block,
        );
      }

      return blocks;
    },
    [queryClient],
  );

  const prefetchReceipt = useCallback(
    async (hash) => {
      await queryClient.prefetchQuery({
        queryKey: blockchainKeys.receipt(hash),
        queryFn: () => getCachedReceipt(hash),
        staleTime: RECEIPT_STALE_TIME,
      });
    },
    [queryClient],
  );

  const prefetchReceipts = useCallback(
    async (hashes) => {
      const receipts = await fetchReceiptsBatched(hashes, { batchSize: 20 });

      // Cache each receipt individually
      for (const receipt of receipts) {
        if (receipt && receipt.transactionHash) {
          queryClient.setQueryData(
            blockchainKeys.receipt(receipt.transactionHash),
            receipt,
          );
        }
      }

      return receipts;
    },
    [queryClient],
  );

  const invalidateBlocks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: blockchainKeys.blocks() });
  }, [queryClient]);

  const invalidateBalances = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: blockchainKeys.balances() });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: blockchainKeys.all });
  }, [queryClient]);

  const getBlockFromCache = useCallback(
    (blockNumber) => {
      return queryClient.getQueryData(
        blockchainKeys.block(blockNumber?.toString()),
      );
    },
    [queryClient],
  );

  const getReceiptFromCache = useCallback(
    (hash) => {
      return queryClient.getQueryData(blockchainKeys.receipt(hash));
    },
    [queryClient],
  );

  return {
    prefetchBlock,
    prefetchBlocks,
    prefetchReceipt,
    prefetchReceipts,
    invalidateBlocks,
    invalidateBalances,
    invalidateAll,
    getBlockFromCache,
    getReceiptFromCache,
  };
}

// ============================================================================
// Combined Data Hooks
// ============================================================================

/**
 * Hook to get blocks with their receipts
 */
export function useBlocksWithReceipts(startBlock, endBlock, options = {}) {
  const {
    data: blocks,
    isLoading: blocksLoading,
    error: blocksError,
  } = useBlockRange(startBlock, endBlock, options);

  // Collect all transaction hashes from blocks
  const txHashes = [];
  if (blocks) {
    for (const block of blocks) {
      if (block.transactions && Array.isArray(block.transactions)) {
        for (const tx of block.transactions) {
          const hash = typeof tx === "string" ? tx : tx.hash;
          txHashes.push(hash);
        }
      }
    }
  }

  const {
    data: receipts,
    isLoading: receiptsLoading,
    error: receiptsError,
  } = useTransactionReceipts(txHashes, {
    enabled: blocks && blocks.length > 0 && txHashes.length > 0,
  });

  // Create receipt lookup map
  const receiptMap = new Map();
  if (receipts) {
    for (const receipt of receipts) {
      if (receipt && receipt.transactionHash) {
        receiptMap.set(receipt.transactionHash.toLowerCase(), receipt);
      }
    }
  }

  return {
    blocks,
    receipts: receiptMap,
    isLoading: blocksLoading || receiptsLoading,
    error: blocksError || receiptsError,
  };
}

/**
 * Hook to get transaction with its receipt
 */
export function useTransactionWithReceipt(hash, options = {}) {
  const {
    data: transaction,
    isLoading: txLoading,
    error: txError,
  } = useTransaction(hash, options);

  const {
    data: receipt,
    isLoading: receiptLoading,
    error: receiptError,
  } = useTransactionReceipt(hash, options);

  return {
    transaction,
    receipt,
    isLoading: txLoading || receiptLoading,
    error: txError || receiptError,
  };
}

// ============================================================================
// Network Statistics Hooks
// ============================================================================

/**
 * Hook to get network health metrics
 */
export function useNetworkHealth(blockRange = 100, options = {}) {
  return useQuery({
    queryKey: blockchainKeys.networkHealth(blockRange),
    queryFn: () => getNetworkHealth(blockRange),
    staleTime: STATS_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get block stats over time
 */
export function useBlockStats(blockRange = 100, sampleSize = 20, options = {}) {
  return useQuery({
    queryKey: blockchainKeys.blockStats(blockRange, sampleSize),
    queryFn: () => getBlockStatsOverTime(blockRange, sampleSize),
    staleTime: STATS_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get transaction volume metrics
 */
export function useTransactionVolume(blockRange = 100, options = {}) {
  return useQuery({
    queryKey: blockchainKeys.transactionVolume(blockRange),
    queryFn: () => getTransactionVolume(blockRange),
    staleTime: STATS_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get active addresses metrics
 */
export function useActiveAddresses(blockRange = 100, options = {}) {
  return useQuery({
    queryKey: blockchainKeys.activeAddresses(blockRange),
    queryFn: () => getActiveAddresses(blockRange),
    staleTime: STATS_STALE_TIME,
    ...options,
  });
}

/**
 * Combined hook to get all network statistics
 */
export function useNetworkStats(
  blockRange = 100,
  sampleSize = 20,
  options = {},
) {
  const {
    data: health,
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth,
  } = useNetworkHealth(blockRange, options);

  const {
    data: blockStats,
    isLoading: blockStatsLoading,
    error: blockStatsError,
    refetch: refetchBlockStats,
  } = useBlockStats(blockRange, sampleSize, options);

  const {
    data: volume,
    isLoading: volumeLoading,
    error: volumeError,
    refetch: refetchVolume,
  } = useTransactionVolume(blockRange, options);

  const {
    data: addresses,
    isLoading: addressesLoading,
    error: addressesError,
    refetch: refetchAddresses,
  } = useActiveAddresses(blockRange, options);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      refetchHealth(),
      refetchBlockStats(),
      refetchVolume(),
      refetchAddresses(),
    ]);
  }, [refetchHealth, refetchBlockStats, refetchVolume, refetchAddresses]);

  return {
    health,
    blockStats: blockStats || [],
    volume,
    addresses,
    isLoading:
      healthLoading || blockStatsLoading || volumeLoading || addressesLoading,
    error: healthError || blockStatsError || volumeError || addressesError,
    refetch: refetchAll,
  };
}

// ============================================================================
// Gas Profiling Hooks
// ============================================================================

/**
 * Hook to get top gas consuming contracts
 */
export function useTopGasConsumers(blockRange = 100, limit = 10, options = {}) {
  return useQuery({
    queryKey: blockchainKeys.topGasConsumers(blockRange, limit),
    queryFn: () => getTopGasConsumers(blockRange, limit),
    staleTime: STATS_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get gas usage trends over time
 */
export function useGasTrends(blockRange = 200, sampleSize = 20, options = {}) {
  return useQuery({
    queryKey: blockchainKeys.gasTrends(blockRange, sampleSize),
    queryFn: () => getGasTrends(blockRange, sampleSize),
    staleTime: STATS_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get gas statistics summary
 */
export function useGasStatistics(blockRange = 100, options = {}) {
  return useQuery({
    queryKey: blockchainKeys.gasStatistics(blockRange),
    queryFn: () => getGasStatistics(blockRange),
    staleTime: STATS_STALE_TIME,
    ...options,
  });
}

/**
 * Combined hook to get all gas profiling data
 */
export function useGasAnalytics(
  blockRange = 100,
  sampleSize = 20,
  limit = 10,
  options = {},
) {
  const {
    data: topConsumers,
    isLoading: consumersLoading,
    error: consumersError,
    refetch: refetchConsumers,
  } = useTopGasConsumers(blockRange, limit, options);

  const {
    data: trends,
    isLoading: trendsLoading,
    error: trendsError,
    refetch: refetchTrends,
  } = useGasTrends(blockRange, sampleSize, options);

  const {
    data: statistics,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useGasStatistics(blockRange, options);

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchConsumers(), refetchTrends(), refetchStats()]);
  }, [refetchConsumers, refetchTrends, refetchStats]);

  return {
    topConsumers: topConsumers || [],
    trends: trends || [],
    statistics,
    isLoading: consumersLoading || trendsLoading || statsLoading,
    error: consumersError || trendsError || statsError,
    refetch: refetchAll,
  };
}

// ============================================================================
// Event Logs Hooks
// ============================================================================

/**
 * Hook to fetch and decode event logs from a block range
 */
export function useEventLogs(fromBlock, toBlock, filters = {}, options = {}) {
  const { address, eventName } = filters;

  return useQuery({
    queryKey: blockchainKeys.eventLogs(
      fromBlock?.toString(),
      toBlock?.toString(),
      { address, eventName },
    ),
    queryFn: async () => {
      if (
        fromBlock === null ||
        fromBlock === undefined ||
        toBlock === null ||
        toBlock === undefined
      ) {
        return [];
      }

      // Fetch all blocks in parallel batches
      const blocks = await fetchBlocksBatched(fromBlock, toBlock, {
        includeTransactions: true,
        batchSize: 10,
      });

      // Collect all transaction hashes from blocks that have transactions
      const txHashToBlock = new Map();
      for (const block of blocks) {
        if (
          Array.isArray(block.transactions) &&
          block.transactions.length > 0
        ) {
          for (const tx of block.transactions) {
            const hash = typeof tx === "string" ? tx : tx.hash;
            txHashToBlock.set(hash.toLowerCase(), block);
          }
        }
      }

      // Fetch all receipts in parallel batches
      const allHashes = Array.from(txHashToBlock.keys());
      const receipts = await fetchReceiptsBatched(allHashes, { batchSize: 20 });

      // Process receipts and extract events
      const allEvents = [];
      for (const receipt of receipts) {
        if (!receipt || !receipt.logs || receipt.logs.length === 0) continue;

        const block = txHashToBlock.get(receipt.transactionHash.toLowerCase());
        if (!block) continue;

        // Filter by address if specified
        let filteredLogs = receipt.logs;
        if (address) {
          filteredLogs = filteredLogs.filter(
            (log) => log.address.toLowerCase() === address.toLowerCase(),
          );
        }

        if (filteredLogs.length === 0) continue;

        // Decode logs
        const decodedLogs = decodeLogs(filteredLogs);

        // Filter by event name if specified
        let finalLogs = decodedLogs;
        if (eventName) {
          finalLogs = decodedLogs.filter((log) =>
            log.decoded?.eventName
              ?.toLowerCase()
              .includes(eventName.toLowerCase()),
          );
        }

        allEvents.push(
          ...finalLogs.map((log) => ({
            ...log,
            transactionHash: receipt.transactionHash,
            blockNumber: block.number,
            timestamp: block.timestamp,
          })),
        );

        // Limit to 100 events
        if (allEvents.length >= 100) break;
      }

      // Sort events by block number descending (newest first)
      allEvents.sort((a, b) => {
        const blockDiff = Number(b.blockNumber) - Number(a.blockNumber);
        if (blockDiff !== 0) return blockDiff;
        return (b.logIndex || 0) - (a.logIndex || 0);
      });

      return allEvents.slice(0, 100);
    },
    enabled:
      fromBlock !== null &&
      fromBlock !== undefined &&
      toBlock !== null &&
      toBlock !== undefined,
    staleTime: BLOCK_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to fetch recent event logs with filters
 */
export function useRecentEventLogs(
  blockCount = 100,
  filters = {},
  options = {},
) {
  const { data: latestBlockNumber } = useLatestBlockNumber();

  const fromBlock =
    latestBlockNumber !== undefined
      ? latestBlockNumber - BigInt(blockCount)
      : null;
  const toBlock = latestBlockNumber;

  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useEventLogs(
    fromBlock !== null && fromBlock < 0n ? 0n : fromBlock,
    toBlock,
    filters,
    {
      enabled: latestBlockNumber !== undefined,
      ...options,
    },
  );

  return {
    data: events || [],
    isLoading,
    error,
    refetch,
    blockNumber: latestBlockNumber,
  };
}

// ============================================================================
// Token Transfer Hooks
// ============================================================================

/**
 * Hook to fetch recent token transfers
 */
export function useTokenTransfers(blockCount = 500, options = {}) {
  const { data: latestBlockNumber } = useLatestBlockNumber();

  return useQuery({
    queryKey: blockchainKeys.tokenTransfers(blockCount),
    queryFn: async () => {
      if (latestBlockNumber === undefined)
        return { transfers: [], metadata: {} };

      const fromBlock = latestBlockNumber - BigInt(blockCount);
      const actualFromBlock = fromBlock < 0n ? 0n : fromBlock;

      // Fetch all blocks in parallel batches
      const blocks = await fetchBlocksBatched(
        actualFromBlock,
        latestBlockNumber,
        {
          includeTransactions: true,
          batchSize: 10,
        },
      );

      // Sort blocks by number descending (newest first)
      blocks.sort((a, b) => Number(b.number) - Number(a.number));

      // Collect all transaction hashes and create lookup map
      const txHashToBlock = new Map();
      for (const block of blocks) {
        if (!block || !block.transactions) continue;
        for (const tx of block.transactions) {
          const hash = typeof tx === "string" ? tx : tx.hash;
          txHashToBlock.set(hash.toLowerCase(), block);
        }
      }

      // Fetch all receipts in parallel batches
      const allHashes = Array.from(txHashToBlock.keys());
      const receipts = await fetchReceiptsBatched(allHashes, {
        batchSize: 20,
      });

      // Process receipts and extract token transfers
      const allTransfers = [];
      const metadataMap = {};

      for (const receipt of receipts) {
        if (!receipt || !receipt.logs || receipt.logs.length === 0) continue;

        const block = txHashToBlock.get(receipt.transactionHash.toLowerCase());
        if (!block) continue;

        const txTransfers = parseTokenTransfers(receipt.logs);

        for (const transfer of txTransfers) {
          allTransfers.push({
            ...transfer,
            txHash: receipt.transactionHash,
            blockNumber: block.number.toString(),
            timestamp: block.timestamp,
          });

          // Queue token metadata fetch
          if (!metadataMap[transfer.token.toLowerCase()]) {
            metadataMap[transfer.token.toLowerCase()] = null;
          }
        }

        // Limit to reasonable number
        if (allTransfers.length >= 500) break;
      }

      // Sort transfers by block number descending
      allTransfers.sort((a, b) => {
        const blockDiff = Number(b.blockNumber) - Number(a.blockNumber);
        if (blockDiff !== 0) return blockDiff;
        return Number(b.timestamp) - Number(a.timestamp);
      });

      return {
        transfers: allTransfers.slice(0, 500),
        tokenAddresses: Object.keys(metadataMap),
      };
    },
    enabled: latestBlockNumber !== undefined,
    staleTime: STATS_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to fetch token metadata for multiple addresses
 */
export function useTokenMetadata(tokenAddresses, options = {}) {
  return useQuery({
    queryKey: blockchainKeys.tokenMetadata(tokenAddresses?.sort() || []),
    queryFn: async () => {
      if (!tokenAddresses || tokenAddresses.length === 0) return {};

      const metadata = {};
      await Promise.all(
        tokenAddresses.map(async (tokenAddress) => {
          try {
            const info = await detectTokenType(tokenAddress);
            if (info.isToken) {
              metadata[tokenAddress.toLowerCase()] = {
                type: info.type,
                ...info.metadata,
              };
            }
          } catch (error) {
            console.error(
              `Error fetching metadata for ${tokenAddress}:`,
              error,
            );
          }
        }),
      );

      return metadata;
    },
    enabled: tokenAddresses && tokenAddresses.length > 0,
    staleTime: BLOCK_STALE_TIME, // Token metadata is relatively stable
    ...options,
  });
}

/**
 * Combined hook for token transfers with metadata and stats
 */
export function useTokenTransfersWithMetadata(blockCount = 500, options = {}) {
  const {
    data: transferData,
    isLoading: transfersLoading,
    error: transfersError,
    refetch,
  } = useTokenTransfers(blockCount, options);

  const { data: tokenMetadata, isLoading: metadataLoading } = useTokenMetadata(
    transferData?.tokenAddresses,
    {
      enabled: transferData?.tokenAddresses?.length > 0,
    },
  );

  // Calculate stats when transfers are loaded
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function calculateStats() {
      if (transferData?.transfers?.length > 0) {
        const transferStats = await getTokenTransferStats(
          transferData.transfers,
        );
        setStats(transferStats);
      }
    }
    calculateStats();
  }, [transferData?.transfers]);

  return {
    transfers: transferData?.transfers || [],
    tokenMetadata: tokenMetadata || {},
    stats,
    isLoading: transfersLoading || metadataLoading,
    error: transfersError,
    refetch,
  };
}

// ============================================================================
// Address Data Hooks
// ============================================================================

/**
 * Hook to get address balance and code
 */
export function useAddressData(address, options = {}) {
  return useQuery({
    queryKey: blockchainKeys.addressData(address?.toLowerCase()),
    queryFn: async () => {
      const [balance, code] = await Promise.all([
        publicClient.getBalance({ address }),
        publicClient.getCode({ address }),
      ]);

      return {
        balance,
        code,
        isContract: code && code !== "0x",
      };
    },
    enabled: !!address,
    staleTime: BALANCE_STALE_TIME,
    ...options,
  });
}

/**
 * Hook to get address transactions
 */
export function useAddressTransactions(
  address,
  blockCount = 100,
  options = {},
) {
  const { data: latestBlockNumber } = useLatestBlockNumber();

  return useQuery({
    queryKey: blockchainKeys.addressTransactions(
      address?.toLowerCase(),
      blockCount,
    ),
    queryFn: async () => {
      if (!latestBlockNumber || !address) return [];

      const fromBlock = latestBlockNumber - BigInt(blockCount - 1);
      const actualFromBlock = fromBlock < 0n ? 0n : fromBlock;

      // Fetch all blocks in parallel batches
      const blocks = await fetchBlocksBatched(
        actualFromBlock,
        latestBlockNumber,
        {
          includeTransactions: true,
          batchSize: 10,
        },
      );

      // Sort blocks by number descending (newest first)
      blocks.sort((a, b) => Number(b.number) - Number(a.number));

      // Filter transactions involving this address
      const addressLower = address.toLowerCase();
      const filteredTxs = [];
      const txToBlock = new Map();

      for (const block of blocks) {
        if (!Array.isArray(block.transactions)) continue;

        for (const tx of block.transactions) {
          if (
            tx.from?.toLowerCase() === addressLower ||
            tx.to?.toLowerCase() === addressLower
          ) {
            filteredTxs.push(tx);
            txToBlock.set(tx.hash.toLowerCase(), block);
          }
        }

        // Stop early if we have enough
        if (filteredTxs.length >= 20) break;
      }

      // Fetch receipts for filtered transactions in parallel
      const hashes = filteredTxs.slice(0, 20).map((tx) => tx.hash);
      const receipts = await fetchReceiptsBatched(hashes, { batchSize: 20 });

      // Create receipt lookup map
      const receiptMap = new Map();
      for (const receipt of receipts) {
        if (receipt && receipt.transactionHash) {
          receiptMap.set(receipt.transactionHash.toLowerCase(), receipt);
        }
      }

      // Combine transactions with receipts
      const recentTxs = filteredTxs.slice(0, 20).map((tx) => {
        const block = txToBlock.get(tx.hash.toLowerCase());
        const receipt = receiptMap.get(tx.hash.toLowerCase());
        return {
          ...tx,
          blockNumber: block?.number,
          timestamp: block?.timestamp,
          logs: receipt?.logs || [],
        };
      });

      return recentTxs;
    },
    enabled: !!address && latestBlockNumber !== undefined,
    staleTime: LATEST_BLOCK_STALE_TIME,
    ...options,
  });
}

/**
 * Combined hook for address page data
 */
export function useAddressPageData(address, options = {}) {
  const {
    data: addressData,
    isLoading: addressLoading,
    error: addressError,
  } = useAddressData(address, options);

  const {
    data: transactions,
    isLoading: txLoading,
    error: txError,
    refetch: refetchTransactions,
  } = useAddressTransactions(address, 100, options);

  const { data: balance } = useBalance(address, {
    refetchInterval: 5000, // Refresh balance every 5 seconds
  });

  return {
    balance: balance ?? addressData?.balance,
    code: addressData?.code,
    isContract: addressData?.isContract,
    transactions: transactions || [],
    isLoading: addressLoading,
    txLoading,
    error: addressError || txError,
    refetchTransactions,
  };
}
