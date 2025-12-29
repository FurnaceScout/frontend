/**
 * Gas Profiling Utilities
 * Track and analyze gas usage by function, contract, and over time
 */

import { getABI } from "./abi-store";
import { publicClient } from "./viem";

/**
 * Extract function selector from transaction input data
 * @param {string} data - Transaction input data
 * @returns {string} Function selector (first 4 bytes)
 */
export function extractFunctionSelector(data) {
  if (!data || data === "0x" || data.length < 10) {
    return "0x00000000"; // Fallback/transfer
  }
  return data.slice(0, 10);
}

/**
 * Decode function name from selector using ABI
 * @param {string} selector - Function selector
 * @param {string} contractAddress - Contract address
 * @returns {string} Function name or selector if not found
 */
export function decodeFunctionName(selector, contractAddress) {
  try {
    const abiData = getABI(contractAddress);
    if (!abiData || !abiData.abi) {
      return selector;
    }

    const func = abiData.abi.find((item) => {
      if (item.type !== "function") return false;
      // Calculate selector from function signature
      const signature = `${item.name}(${item.inputs.map((i) => i.type).join(",")})`;
      const hash = require("viem").keccak256(require("viem").toHex(signature));
      return hash.slice(0, 10) === selector;
    });

    return func ? func.name : selector;
  } catch (_error) {
    return selector;
  }
}

/**
 * Get gas usage for a specific transaction
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Object>} Gas usage details
 */
export async function getTransactionGasUsage(txHash) {
  try {
    const [tx, receipt] = await Promise.all([
      publicClient.getTransaction({ hash: txHash }),
      publicClient.getTransactionReceipt({ hash: txHash }),
    ]);

    const gasUsed = receipt.gasUsed;
    const gasPrice = tx.gasPrice || 0n;
    const effectiveGasPrice = receipt.effectiveGasPrice || gasPrice;
    const gasCost = gasUsed * effectiveGasPrice;

    const selector = extractFunctionSelector(tx.input);
    const functionName = tx.to
      ? decodeFunctionName(selector, tx.to)
      : "Contract Creation";

    return {
      txHash,
      gasUsed: gasUsed.toString(),
      gasLimit: tx.gas.toString(),
      gasPrice: gasPrice.toString(),
      effectiveGasPrice: effectiveGasPrice.toString(),
      gasCost: gasCost.toString(),
      gasEfficiency: Number((gasUsed * 10000n) / tx.gas) / 100, // Percentage
      functionSelector: selector,
      functionName,
      contractAddress: tx.to,
      success: receipt.status === "success",
    };
  } catch (error) {
    console.error("Error getting transaction gas usage:", error);
    throw error;
  }
}

/**
 * Analyze gas usage for a contract over recent transactions
 * @param {string} contractAddress - Contract address
 * @param {number} blockRange - Number of blocks to analyze
 * @returns {Promise<Object>} Gas analysis by function
 */
export async function analyzeContractGasUsage(
  contractAddress,
  blockRange = 100,
) {
  try {
    const latestBlock = await publicClient.getBlockNumber();
    const startBlock = latestBlock - BigInt(blockRange) + 1n;

    const functionStats = {};
    let totalGasUsed = 0n;
    let totalTransactions = 0;

    for (let i = startBlock; i <= latestBlock; i++) {
      const block = await publicClient.getBlock({
        blockNumber: i,
        includeTransactions: true,
      });

      if (!Array.isArray(block.transactions)) continue;

      for (const tx of block.transactions) {
        if (tx.to?.toLowerCase() !== contractAddress.toLowerCase()) continue;

        try {
          const receipt = await publicClient.getTransactionReceipt({
            hash: tx.hash,
          });

          const gasUsed = receipt.gasUsed;
          const selector = extractFunctionSelector(tx.input);
          const functionName = decodeFunctionName(selector, contractAddress);

          if (!functionStats[selector]) {
            functionStats[selector] = {
              selector,
              functionName,
              callCount: 0,
              totalGasUsed: 0n,
              minGasUsed: gasUsed,
              maxGasUsed: gasUsed,
              successCount: 0,
              failCount: 0,
            };
          }

          const stats = functionStats[selector];
          stats.callCount++;
          stats.totalGasUsed += gasUsed;
          stats.minGasUsed =
            gasUsed < stats.minGasUsed ? gasUsed : stats.minGasUsed;
          stats.maxGasUsed =
            gasUsed > stats.maxGasUsed ? gasUsed : stats.maxGasUsed;

          if (receipt.status === "success") {
            stats.successCount++;
          } else {
            stats.failCount++;
          }

          totalGasUsed += gasUsed;
          totalTransactions++;
        } catch (error) {
          console.error(`Error processing tx ${tx.hash}:`, error);
        }
      }
    }

    // Calculate averages and percentages
    const functions = Object.values(functionStats).map((stats) => ({
      ...stats,
      totalGasUsed: stats.totalGasUsed.toString(),
      minGasUsed: stats.minGasUsed.toString(),
      maxGasUsed: stats.maxGasUsed.toString(),
      avgGasUsed: (stats.totalGasUsed / BigInt(stats.callCount)).toString(),
      gasPercentage:
        totalGasUsed > 0n
          ? Number((stats.totalGasUsed * 10000n) / totalGasUsed) / 100
          : 0,
      successRate: (stats.successCount / stats.callCount) * 100,
    }));

    // Sort by total gas used (descending)
    functions.sort((a, b) =>
      Number(BigInt(b.totalGasUsed) - BigInt(a.totalGasUsed)),
    );

    return {
      contractAddress,
      blockRange,
      totalTransactions,
      totalGasUsed: totalGasUsed.toString(),
      averageGasPerTx:
        totalTransactions > 0
          ? (totalGasUsed / BigInt(totalTransactions)).toString()
          : "0",
      functions,
    };
  } catch (error) {
    console.error("Error analyzing contract gas usage:", error);
    throw error;
  }
}

/**
 * Get top gas-consuming contracts
 * @param {number} blockRange - Number of blocks to analyze
 * @param {number} limit - Number of top contracts to return
 * @returns {Promise<Array>} Top gas-consuming contracts
 */
export async function getTopGasConsumers(blockRange = 100, limit = 10) {
  try {
    const latestBlock = await publicClient.getBlockNumber();
    const startBlock = latestBlock - BigInt(blockRange) + 1n;

    const contractStats = {};

    for (let i = startBlock; i <= latestBlock; i++) {
      const block = await publicClient.getBlock({
        blockNumber: i,
        includeTransactions: true,
      });

      if (!Array.isArray(block.transactions)) continue;

      for (const tx of block.transactions) {
        if (!tx.to) continue; // Skip contract creations

        try {
          const receipt = await publicClient.getTransactionReceipt({
            hash: tx.hash,
          });

          const address = tx.to.toLowerCase();
          if (!contractStats[address]) {
            contractStats[address] = {
              address: tx.to,
              totalGasUsed: 0n,
              transactionCount: 0,
              successCount: 0,
              failCount: 0,
            };
          }

          const stats = contractStats[address];
          stats.totalGasUsed += receipt.gasUsed;
          stats.transactionCount++;

          if (receipt.status === "success") {
            stats.successCount++;
          } else {
            stats.failCount++;
          }
        } catch (error) {
          console.error(`Error processing tx ${tx.hash}:`, error);
        }
      }
    }

    // Convert to array and calculate averages
    const contracts = Object.values(contractStats).map((stats) => ({
      address: stats.address,
      totalGasUsed: stats.totalGasUsed.toString(),
      transactionCount: stats.transactionCount,
      averageGasPerTx: (
        stats.totalGasUsed / BigInt(stats.transactionCount)
      ).toString(),
      successCount: stats.successCount,
      failCount: stats.failCount,
      successRate: (stats.successCount / stats.transactionCount) * 100,
    }));

    // Sort by total gas used (descending) and limit
    contracts.sort((a, b) =>
      Number(BigInt(b.totalGasUsed) - BigInt(a.totalGasUsed)),
    );

    return contracts.slice(0, limit);
  } catch (error) {
    console.error("Error getting top gas consumers:", error);
    return [];
  }
}

/**
 * Get gas usage trends over time
 * @param {number} blockRange - Number of blocks to analyze
 * @param {number} sampleSize - Number of data points
 * @returns {Promise<Array>} Gas usage trend data
 */
export async function getGasTrends(blockRange = 200, sampleSize = 20) {
  try {
    const latestBlock = await publicClient.getBlockNumber();
    const startBlock = latestBlock - BigInt(blockRange) + 1n;
    const interval = Math.floor(blockRange / sampleSize);

    const trends = [];

    for (let i = 0; i < sampleSize; i++) {
      const blockNum = startBlock + BigInt(i * interval);
      if (blockNum > latestBlock) break;

      const block = await publicClient.getBlock({
        blockNumber: blockNum,
        includeTransactions: true,
      });

      let totalGasUsed = 0n;
      let transactionCount = 0;
      let totalGasPrice = 0n;

      if (Array.isArray(block.transactions)) {
        for (const tx of block.transactions) {
          try {
            const receipt = await publicClient.getTransactionReceipt({
              hash: tx.hash,
            });
            totalGasUsed += receipt.gasUsed;
            totalGasPrice += tx.gasPrice || 0n;
            transactionCount++;
          } catch (_error) {
            // Skip failed receipts
          }
        }
      }

      trends.push({
        blockNumber: Number(blockNum),
        timestamp: Number(block.timestamp),
        totalGasUsed: totalGasUsed.toString(),
        transactionCount,
        averageGasPerTx:
          transactionCount > 0
            ? (totalGasUsed / BigInt(transactionCount)).toString()
            : "0",
        averageGasPrice:
          transactionCount > 0
            ? (totalGasPrice / BigInt(transactionCount)).toString()
            : "0",
        blockGasLimit: block.gasLimit.toString(),
        blockGasUsed: block.gasUsed.toString(),
        gasUtilization: Number((block.gasUsed * 10000n) / block.gasLimit) / 100,
      });
    }

    return trends;
  } catch (error) {
    console.error("Error getting gas trends:", error);
    return [];
  }
}

/**
 * Compare gas usage between two contracts
 * @param {string} contract1 - First contract address
 * @param {string} contract2 - Second contract address
 * @param {number} blockRange - Number of blocks to analyze
 * @returns {Promise<Object>} Comparison results
 */
export async function compareContractGasUsage(
  contract1,
  contract2,
  blockRange = 100,
) {
  try {
    const [analysis1, analysis2] = await Promise.all([
      analyzeContractGasUsage(contract1, blockRange),
      analyzeContractGasUsage(contract2, blockRange),
    ]);

    return {
      contract1: analysis1,
      contract2: analysis2,
      comparison: {
        gasUsedDiff:
          BigInt(analysis1.totalGasUsed) - BigInt(analysis2.totalGasUsed),
        transactionCountDiff:
          analysis1.totalTransactions - analysis2.totalTransactions,
        avgGasDiff:
          BigInt(analysis1.averageGasPerTx) - BigInt(analysis2.averageGasPerTx),
      },
    };
  } catch (error) {
    console.error("Error comparing contract gas usage:", error);
    throw error;
  }
}

/**
 * Get gas statistics summary
 * @param {number} blockRange - Number of blocks to analyze
 * @returns {Promise<Object>} Gas statistics summary
 */
export async function getGasStatistics(blockRange = 100) {
  try {
    const latestBlock = await publicClient.getBlockNumber();
    const startBlock = latestBlock - BigInt(blockRange) + 1n;

    let totalGasUsed = 0n;
    let totalGasLimit = 0n;
    let totalTransactions = 0;
    let totalGasPrice = 0n;
    let minGasPrice = null;
    let maxGasPrice = 0n;

    for (let i = startBlock; i <= latestBlock; i++) {
      const block = await publicClient.getBlock({
        blockNumber: i,
        includeTransactions: true,
      });

      totalGasUsed += block.gasUsed;
      totalGasLimit += block.gasLimit;

      if (Array.isArray(block.transactions)) {
        for (const tx of block.transactions) {
          totalTransactions++;
          const gasPrice = tx.gasPrice || 0n;
          totalGasPrice += gasPrice;

          if (minGasPrice === null || gasPrice < minGasPrice) {
            minGasPrice = gasPrice;
          }
          if (gasPrice > maxGasPrice) {
            maxGasPrice = gasPrice;
          }
        }
      }
    }

    return {
      blockRange,
      totalBlocks: blockRange,
      totalGasUsed: totalGasUsed.toString(),
      totalGasLimit: totalGasLimit.toString(),
      averageGasUsedPerBlock: (totalGasUsed / BigInt(blockRange)).toString(),
      averageGasLimitPerBlock: (totalGasLimit / BigInt(blockRange)).toString(),
      overallUtilization: Number((totalGasUsed * 10000n) / totalGasLimit) / 100,
      totalTransactions,
      averageGasPerTransaction:
        totalTransactions > 0
          ? (totalGasUsed / BigInt(totalTransactions)).toString()
          : "0",
      averageGasPrice:
        totalTransactions > 0
          ? (totalGasPrice / BigInt(totalTransactions)).toString()
          : "0",
      minGasPrice: minGasPrice ? minGasPrice.toString() : "0",
      maxGasPrice: maxGasPrice.toString(),
    };
  } catch (error) {
    console.error("Error getting gas statistics:", error);
    throw error;
  }
}

/**
 * Format gas value for display
 * @param {string|bigint} gas - Gas value
 * @param {string} unit - Display unit (gas, gwei, eth)
 * @returns {string} Formatted gas value
 */
export function formatGas(gas, unit = "gas") {
  const gasBigInt = typeof gas === "string" ? BigInt(gas) : gas;

  switch (unit) {
    case "gwei":
      return (Number(gasBigInt) / 1e9).toFixed(4);
    case "eth":
      return (Number(gasBigInt) / 1e18).toFixed(8);
    case "M": // Millions
      return (Number(gasBigInt) / 1e6).toFixed(2);
    case "K": // Thousands
      return (Number(gasBigInt) / 1e3).toFixed(2);
    default: // gas
      return gasBigInt.toLocaleString();
  }
}
