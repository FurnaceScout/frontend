import { publicClient } from "./viem";
import { parseTokenTransfers, detectTokenType } from "./tokens";

/**
 * Fetch token transfers for a specific address with filters
 * @param {string} address - Address to get transfers for (null for all transfers)
 * @param {object} options - Filter options
 * @returns {Promise<Array>} Array of token transfers with metadata
 */
export async function getTokenTransfers(address = null, options = {}) {
  const {
    tokenType = null, // 'ERC20', 'ERC721', 'ERC1155', or null for all
    tokenAddress = null, // Specific token contract address
    fromBlock = 0n,
    toBlock = null,
    direction = "all", // 'in', 'out', 'all'
    limit = 100,
  } = options;

  try {
    const latestBlock = toBlock || (await publicClient.getBlockNumber());
    const startBlock = BigInt(fromBlock);
    const endBlock = BigInt(latestBlock);

    // Fetch blocks in batches
    const batchSize = 1000n;
    const allTransfers = [];

    for (
      let currentBlock = startBlock;
      currentBlock <= endBlock;
      currentBlock += batchSize
    ) {
      const batchEnd =
        currentBlock + batchSize > endBlock ? endBlock : currentBlock + batchSize;

      // Fetch blocks in this range
      const blocks = await fetchBlockRange(currentBlock, batchEnd);

      for (const block of blocks) {
        if (!block.transactions) continue;

        for (const tx of block.transactions) {
          // Get receipt to access logs
          const receipt = await publicClient.getTransactionReceipt({
            hash: tx.hash,
          });

          if (!receipt || !receipt.logs || receipt.logs.length === 0) continue;

          // Parse token transfers
          const transfers = parseTokenTransfers(receipt.logs);

          for (const transfer of transfers) {
            // Apply filters
            if (tokenType && !transfer.type.startsWith(tokenType)) continue;
            if (tokenAddress && transfer.token.toLowerCase() !== tokenAddress.toLowerCase())
              continue;

            if (address) {
              const addressLower = address.toLowerCase();
              const fromMatch = transfer.from.toLowerCase() === addressLower;
              const toMatch = transfer.to.toLowerCase() === addressLower;

              if (direction === "in" && !toMatch) continue;
              if (direction === "out" && !fromMatch) continue;
              if (direction === "all" && !fromMatch && !toMatch) continue;
            }

            // Add transaction and block context
            allTransfers.push({
              ...transfer,
              txHash: tx.hash,
              blockNumber: block.number.toString(),
              timestamp: block.timestamp,
              from: transfer.from,
              to: transfer.to,
            });
          }
        }
      }

      if (allTransfers.length >= limit) break;
    }

    return allTransfers.slice(0, limit);
  } catch (error) {
    console.error("Error fetching token transfers:", error);
    return [];
  }
}

/**
 * Fetch block range with transactions
 */
async function fetchBlockRange(fromBlock, toBlock) {
  const blocks = [];
  const promises = [];

  for (let i = fromBlock; i <= toBlock; i++) {
    promises.push(
      publicClient
        .getBlock({ blockNumber: i, includeTransactions: true })
        .catch(() => null),
    );
  }

  const results = await Promise.all(promises);
  return results.filter((block) => block !== null);
}

/**
 * Get recent token transfers from recent blocks
 * More efficient than scanning entire chain
 */
export async function getRecentTokenTransfers(options = {}) {
  const {
    blockCount = 100,
    tokenType = null,
    tokenAddress = null,
    address = null,
    direction = "all",
  } = options;

  try {
    const latestBlock = await publicClient.getBlockNumber();
    const fromBlock = latestBlock - BigInt(blockCount);

    const allTransfers = [];

    // Fetch recent blocks
    for (let i = latestBlock; i > fromBlock; i--) {
      const block = await publicClient.getBlock({
        blockNumber: i,
        includeTransactions: true,
      });

      if (!block || !block.transactions) continue;

      for (const tx of block.transactions) {
        // Get receipt to access logs
        const receipt = await publicClient
          .getTransactionReceipt({ hash: tx.hash })
          .catch(() => null);

        if (!receipt || !receipt.logs || receipt.logs.length === 0) continue;

        // Parse token transfers
        const transfers = parseTokenTransfers(receipt.logs);

        for (const transfer of transfers) {
          // Apply filters
          if (tokenType && !transfer.type.startsWith(tokenType)) continue;
          if (
            tokenAddress &&
            transfer.token.toLowerCase() !== tokenAddress.toLowerCase()
          )
            continue;

          if (address) {
            const addressLower = address.toLowerCase();
            const fromMatch = transfer.from.toLowerCase() === addressLower;
            const toMatch = transfer.to.toLowerCase() === addressLower;

            if (direction === "in" && !toMatch) continue;
            if (direction === "out" && !fromMatch) continue;
            if (direction === "all" && !fromMatch && !toMatch) continue;
          }

          // Add transaction and block context
          allTransfers.push({
            ...transfer,
            txHash: tx.hash,
            blockNumber: block.number.toString(),
            timestamp: block.timestamp,
          });
        }
      }
    }

    return allTransfers;
  } catch (error) {
    console.error("Error fetching recent token transfers:", error);
    return [];
  }
}

/**
 * Get token transfer statistics
 */
export async function getTokenTransferStats(transfers) {
  const stats = {
    total: transfers.length,
    byType: {
      ERC20: 0,
      ERC721: 0,
      ERC1155: 0,
    },
    uniqueTokens: new Set(),
    uniqueSenders: new Set(),
    uniqueReceivers: new Set(),
    totalValue: {}, // By token address
  };

  for (const transfer of transfers) {
    // Count by type
    if (transfer.type.startsWith("ERC20")) {
      stats.byType.ERC20++;
    } else if (transfer.type.startsWith("ERC721")) {
      stats.byType.ERC721++;
    } else if (transfer.type.startsWith("ERC1155")) {
      stats.byType.ERC1155++;
    }

    // Track unique addresses
    stats.uniqueTokens.add(transfer.token.toLowerCase());
    stats.uniqueSenders.add(transfer.from.toLowerCase());
    stats.uniqueReceivers.add(transfer.to.toLowerCase());

    // Aggregate values (for ERC20)
    if (transfer.value && transfer.type.startsWith("ERC20")) {
      const tokenKey = transfer.token.toLowerCase();
      if (!stats.totalValue[tokenKey]) {
        stats.totalValue[tokenKey] = 0n;
      }
      stats.totalValue[tokenKey] += BigInt(transfer.value);
    }
  }

  // Convert sets to counts
  stats.uniqueTokens = stats.uniqueTokens.size;
  stats.uniqueSenders = stats.uniqueSenders.size;
  stats.uniqueReceivers = stats.uniqueReceivers.size;

  return stats;
}

/**
 * Filter transfers by criteria
 */
export function filterTransfers(transfers, filters) {
  return transfers.filter((transfer) => {
    // Token type filter
    if (filters.tokenType && !transfer.type.startsWith(filters.tokenType)) {
      return false;
    }

    // Token address filter
    if (
      filters.tokenAddress &&
      transfer.token.toLowerCase() !== filters.tokenAddress.toLowerCase()
    ) {
      return false;
    }

    // Address filter (from or to)
    if (filters.address) {
      const addressLower = filters.address.toLowerCase();
      const fromMatch = transfer.from.toLowerCase() === addressLower;
      const toMatch = transfer.to.toLowerCase() === addressLower;

      if (filters.direction === "in" && !toMatch) return false;
      if (filters.direction === "out" && !fromMatch) return false;
      if (filters.direction === "all" && !fromMatch && !toMatch) return false;
    }

    // Value range filter (for ERC20)
    if (filters.minValue && transfer.value) {
      if (BigInt(transfer.value) < BigInt(filters.minValue)) return false;
    }
    if (filters.maxValue && transfer.value) {
      if (BigInt(transfer.value) > BigInt(filters.maxValue)) return false;
    }

    // Block range filter
    if (filters.fromBlock && BigInt(transfer.blockNumber) < BigInt(filters.fromBlock)) {
      return false;
    }
    if (filters.toBlock && BigInt(transfer.blockNumber) > BigInt(filters.toBlock)) {
      return false;
    }

    // Time range filter
    if (filters.fromTimestamp && transfer.timestamp < filters.fromTimestamp) {
      return false;
    }
    if (filters.toTimestamp && transfer.timestamp > filters.toTimestamp) {
      return false;
    }

    return true;
  });
}

/**
 * Sort transfers
 */
export function sortTransfers(transfers, sortBy = "timestamp", order = "desc") {
  const sorted = [...transfers];

  sorted.sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case "timestamp":
        aVal = a.timestamp || 0;
        bVal = b.timestamp || 0;
        break;
      case "blockNumber":
        aVal = BigInt(a.blockNumber || 0);
        bVal = BigInt(b.blockNumber || 0);
        break;
      case "value":
        aVal = BigInt(a.value || 0);
        bVal = BigInt(b.value || 0);
        break;
      case "tokenType":
        aVal = a.type || "";
        bVal = b.type || "";
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Export transfers to CSV
 */
export function exportTransfersToCSV(transfers, metadata = {}) {
  const headers = [
    "Transaction Hash",
    "Block Number",
    "Timestamp",
    "Token Type",
    "Token Address",
    "Token Name",
    "Token Symbol",
    "From",
    "To",
    "Value/Amount",
    "Token ID",
  ];

  const rows = transfers.map((transfer) => {
    const tokenMeta = metadata[transfer.token?.toLowerCase()] || {};
    const timestamp = transfer.timestamp
      ? new Date(Number(transfer.timestamp) * 1000).toISOString()
      : "";

    return [
      transfer.txHash || "",
      transfer.blockNumber || "",
      timestamp,
      transfer.type || "",
      transfer.token || "",
      tokenMeta.name || "",
      tokenMeta.symbol || "",
      transfer.from || "",
      transfer.to || "",
      transfer.value || "",
      transfer.tokenId || "",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  return csvContent;
}

/**
 * Group transfers by token
 */
export function groupTransfersByToken(transfers) {
  const groups = {};

  for (const transfer of transfers) {
    const tokenKey = transfer.token.toLowerCase();
    if (!groups[tokenKey]) {
      groups[tokenKey] = {
        token: transfer.token,
        transfers: [],
        count: 0,
      };
    }
    groups[tokenKey].transfers.push(transfer);
    groups[tokenKey].count++;
  }

  return groups;
}

/**
 * Group transfers by date
 */
export function groupTransfersByDate(transfers) {
  const groups = {};

  for (const transfer of transfers) {
    if (!transfer.timestamp) continue;

    const date = new Date(Number(transfer.timestamp) * 1000);
    const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        transfers: [],
        count: 0,
      };
    }
    groups[dateKey].transfers.push(transfer);
    groups[dateKey].count++;
  }

  return groups;
}

/**
 * Paginate transfers
 */
export function paginateTransfers(transfers, page = 1, pageSize = 50) {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    items: transfers.slice(startIndex, endIndex),
    page,
    pageSize,
    total: transfers.length,
    totalPages: Math.ceil(transfers.length / pageSize),
    hasNext: endIndex < transfers.length,
    hasPrev: page > 1,
  };
}

/**
 * Search transfers by text query
 */
export function searchTransfers(transfers, query, metadata = {}) {
  if (!query || query.trim() === "") return transfers;

  const lowerQuery = query.toLowerCase().trim();

  return transfers.filter((transfer) => {
    const tokenMeta = metadata[transfer.token?.toLowerCase()] || {};

    // Search in addresses
    if (
      transfer.token?.toLowerCase().includes(lowerQuery) ||
      transfer.from?.toLowerCase().includes(lowerQuery) ||
      transfer.to?.toLowerCase().includes(lowerQuery) ||
      transfer.txHash?.toLowerCase().includes(lowerQuery)
    ) {
      return true;
    }

    // Search in token metadata
    if (
      tokenMeta.name?.toLowerCase().includes(lowerQuery) ||
      tokenMeta.symbol?.toLowerCase().includes(lowerQuery)
    ) {
      return true;
    }

    // Search in token type
    if (transfer.type?.toLowerCase().includes(lowerQuery)) {
      return true;
    }

    return false;
  });
}
