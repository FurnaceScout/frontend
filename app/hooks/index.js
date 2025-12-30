/**
 * Hooks Index
 * Re-export all hooks for convenient imports
 */

// React Query based hooks (recommended for new code)
export {
  // Query key factories
  blockchainKeys,
  // Block hooks
  useLatestBlockNumber,
  useBlock,
  useBlocks,
  useBlockRange,
  useLatestBlocks,
  // Transaction hooks
  useTransaction,
  useTransactionReceipt,
  useTransactionReceipts,
  useLatestTransactions,
  // Balance hooks
  useBalance,
  useBalances,
  // Chain info hooks
  useChainInfo,
  useGasPrice,
  // Cache utilities
  useBlockchainCache,
  // Combined data hooks
  useBlocksWithReceipts,
  useTransactionWithReceipt,
  // Network statistics hooks
  useNetworkHealth,
  useBlockStats,
  useTransactionVolume,
  useActiveAddresses,
  useNetworkStats,
  // Gas profiling hooks
  useTopGasConsumers,
  useGasTrends,
  useGasStatistics,
  useGasAnalytics,
  // Event logs hooks
  useEventLogs,
  useRecentEventLogs,
  // Token transfer hooks
  useTokenTransfers,
  useTokenMetadata,
  useTokenTransfersWithMetadata,
  // Address data hooks
  useAddressData,
  useAddressTransactions,
  useAddressPageData,
} from "./useBlockchainQueries";

// Legacy hooks (still functional, but consider migrating to React Query versions)
export {
  useWatchBlockNumber,
  useLatestBlocks as useLatestBlocksLegacy,
  useLatestTransactions as useLatestTransactionsLegacy,
  useWatchBalance,
  useWatchBalances,
  useChainInfo as useChainInfoLegacy,
  useWatchBlock,
  useWatchEvents,
  useEventStream,
  useEventSubscriptions,
} from "./useBlockchain";

// Theme hook
export { useTheme } from "./useTheme";
