// Utility functions for analyzing blockchain state changes and diffs

import { publicClient } from "@/lib/viem";

/**
 * Get storage changes for a transaction
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Object>} Storage changes by address
 */
export async function getTransactionStorageChanges(txHash) {
  try {
    // Get transaction receipt to find affected addresses
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

    // Get transaction details
    const tx = await publicClient.getTransaction({ hash: txHash });

    // Get block before and after transaction
    const blockNumber = receipt.blockNumber;
    const prevBlockNumber = blockNumber - 1n;

    const changes = {
      blockNumber: Number(blockNumber),
      transactionHash: txHash,
      from: tx.from,
      to: tx.to,
      addresses: [],
    };

    // Collect all addresses involved
    const addresses = new Set();
    addresses.add(tx.from.toLowerCase());
    if (tx.to) addresses.add(tx.to.toLowerCase());

    // Add contract addresses from logs
    for (const log of receipt.logs || []) {
      addresses.add(log.address.toLowerCase());
    }

    // For each address, check balance and nonce changes
    for (const address of addresses) {
      const addressChanges = {
        address,
        balanceChange: null,
        nonceChange: null,
        codeChange: null,
        storageChanges: [],
      };

      try {
        // Get balance before and after
        const balanceBefore = await publicClient.getBalance({
          address,
          blockNumber: prevBlockNumber,
        });
        const balanceAfter = await publicClient.getBalance({
          address,
          blockNumber: blockNumber,
        });

        if (balanceBefore !== balanceAfter) {
          addressChanges.balanceChange = {
            before: balanceBefore.toString(),
            after: balanceAfter.toString(),
            diff: (balanceAfter - balanceBefore).toString(),
          };
        }

        // Get nonce before and after
        const nonceBefore = await publicClient.getTransactionCount({
          address,
          blockNumber: prevBlockNumber,
        });
        const nonceAfter = await publicClient.getTransactionCount({
          address,
          blockNumber: blockNumber,
        });

        if (nonceBefore !== nonceAfter) {
          addressChanges.nonceChange = {
            before: nonceBefore,
            after: nonceAfter,
            diff: nonceAfter - nonceBefore,
          };
        }

        // Check for code changes (contract deployment/destruction)
        const codeBefore = await publicClient.getCode({
          address,
          blockNumber: prevBlockNumber,
        });
        const codeAfter = await publicClient.getCode({
          address,
          blockNumber: blockNumber,
        });

        if (codeBefore !== codeAfter) {
          addressChanges.codeChange = {
            before: codeBefore,
            after: codeAfter,
            isDeployment: !codeBefore || codeBefore === "0x",
            isDestruction: !codeAfter || codeAfter === "0x",
          };
        }

        changes.addresses.push(addressChanges);
      } catch (error) {
        console.error(`Error checking address ${address}:`, error);
      }
    }

    return changes;
  } catch (error) {
    console.error("Failed to get transaction storage changes:", error);
    throw error;
  }
}

/**
 * Get detailed storage changes from transaction trace
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Array>} Array of storage operations
 */
export async function getDetailedStorageChanges(txHash) {
  try {
    const trace = await publicClient.request({
      method: "debug_traceTransaction",
      params: [txHash, {}],
    });

    const storageOps = [];
    const storage = {};

    if (!trace.structLogs) {
      return storageOps;
    }

    for (const log of trace.structLogs) {
      // Track SSTORE operations (storage writes)
      if (log.op === "SSTORE") {
        const key = log.stack[log.stack.length - 1];
        const value = log.stack[log.stack.length - 2];
        const oldValue = storage[key] || "0x0";

        if (oldValue !== value) {
          storageOps.push({
            op: "SSTORE",
            key,
            oldValue,
            newValue: value,
            pc: log.pc,
            depth: log.depth,
            gas: log.gas,
            gasCost: log.gasCost,
          });

          storage[key] = value;
        }
      }

      // Track SLOAD operations (storage reads)
      if (log.op === "SLOAD") {
        const key = log.stack[log.stack.length - 1];
        const value = storage[key] || "0x0";

        storageOps.push({
          op: "SLOAD",
          key,
          value,
          pc: log.pc,
          depth: log.depth,
          gas: log.gas,
          gasCost: log.gasCost,
        });
      }
    }

    return storageOps;
  } catch (error) {
    console.error("Failed to get detailed storage changes:", error);
    throw error;
  }
}

/**
 * Compare state between two blocks
 * @param {bigint} blockNumber1 - First block number
 * @param {bigint} blockNumber2 - Second block number
 * @param {Array<string>} addresses - Addresses to compare
 * @returns {Promise<Object>} State differences
 */
export async function compareBlockStates(blockNumber1, blockNumber2, addresses) {
  try {
    const diffs = {
      block1: Number(blockNumber1),
      block2: Number(blockNumber2),
      addresses: [],
    };

    for (const address of addresses) {
      const addressDiff = {
        address: address.toLowerCase(),
        balanceChange: null,
        nonceChange: null,
        codeChange: null,
      };

      try {
        // Compare balances
        const balance1 = await publicClient.getBalance({
          address,
          blockNumber: blockNumber1,
        });
        const balance2 = await publicClient.getBalance({
          address,
          blockNumber: blockNumber2,
        });

        if (balance1 !== balance2) {
          addressDiff.balanceChange = {
            block1: balance1.toString(),
            block2: balance2.toString(),
            diff: (balance2 - balance1).toString(),
          };
        }

        // Compare nonces
        const nonce1 = await publicClient.getTransactionCount({
          address,
          blockNumber: blockNumber1,
        });
        const nonce2 = await publicClient.getTransactionCount({
          address,
          blockNumber: blockNumber2,
        });

        if (nonce1 !== nonce2) {
          addressDiff.nonceChange = {
            block1: nonce1,
            block2: nonce2,
            diff: nonce2 - nonce1,
          };
        }

        // Compare code
        const code1 = await publicClient.getCode({
          address,
          blockNumber: blockNumber1,
        });
        const code2 = await publicClient.getCode({
          address,
          blockNumber: blockNumber2,
        });

        if (code1 !== code2) {
          addressDiff.codeChange = {
            block1: code1,
            block2: code2,
            wasDeployed: (!code1 || code1 === "0x") && code2 && code2 !== "0x",
            wasDestroyed: code1 && code1 !== "0x" && (!code2 || code2 === "0x"),
          };
        }

        diffs.addresses.push(addressDiff);
      } catch (error) {
        console.error(`Error comparing address ${address}:`, error);
      }
    }

    return diffs;
  } catch (error) {
    console.error("Failed to compare block states:", error);
    throw error;
  }
}

/**
 * Get all balance changes in a block
 * @param {bigint} blockNumber - Block number
 * @returns {Promise<Array>} Array of balance changes
 */
export async function getBlockBalanceChanges(blockNumber) {
  try {
    const block = await publicClient.getBlock({
      blockNumber,
      includeTransactions: true,
    });

    const changes = [];
    const prevBlockNumber = blockNumber - 1n;

    // Collect all unique addresses from transactions
    const addresses = new Set();

    for (const tx of block.transactions) {
      addresses.add(tx.from.toLowerCase());
      if (tx.to) addresses.add(tx.to.toLowerCase());

      // Get receipt to find contract addresses from logs
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash: tx.hash });
        for (const log of receipt.logs || []) {
          addresses.add(log.address.toLowerCase());
        }

        // Add contract address if contract deployment
        if (receipt.contractAddress) {
          addresses.add(receipt.contractAddress.toLowerCase());
        }
      } catch (error) {
        console.error(`Error getting receipt for ${tx.hash}:`, error);
      }
    }

    // Check balance changes for each address
    for (const address of addresses) {
      try {
        const balanceBefore = await publicClient.getBalance({
          address,
          blockNumber: prevBlockNumber,
        });
        const balanceAfter = await publicClient.getBalance({
          address,
          blockNumber: blockNumber,
        });

        if (balanceBefore !== balanceAfter) {
          changes.push({
            address,
            before: balanceBefore.toString(),
            after: balanceAfter.toString(),
            diff: (balanceAfter - balanceBefore).toString(),
          });
        }
      } catch (error) {
        console.error(`Error checking balance for ${address}:`, error);
      }
    }

    return changes;
  } catch (error) {
    console.error("Failed to get block balance changes:", error);
    throw error;
  }
}

/**
 * Format storage key for display
 * @param {string} key - Storage key (hex)
 * @returns {string} Formatted key
 */
export function formatStorageKey(key) {
  if (!key) return "0x0";

  // If key is a large hex number, show abbreviated version
  if (key.length > 20) {
    return `${key.slice(0, 10)}...${key.slice(-8)}`;
  }

  return key;
}

/**
 * Format storage value for display
 * @param {string} value - Storage value (hex)
 * @returns {string} Formatted value
 */
export function formatStorageValue(value) {
  if (!value || value === "0x0" || value === "0x") return "0";

  // Try to convert to decimal if reasonable size
  try {
    const decimal = BigInt(value);
    if (decimal < BigInt(1000000000)) {
      return decimal.toString();
    }
  } catch (error) {
    // Not a valid number, keep as hex
  }

  // Show abbreviated hex for large values
  if (value.length > 20) {
    return `${value.slice(0, 10)}...${value.slice(-8)}`;
  }

  return value;
}

/**
 * Format balance change for display
 * @param {string} diff - Balance diff in wei
 * @returns {Object} Formatted change
 */
export function formatBalanceChange(diff) {
  const wei = BigInt(diff);
  const isIncrease = wei > 0n;
  const absWei = wei < 0n ? -wei : wei;

  // Convert to ETH
  const eth = Number(absWei) / 1e18;

  return {
    wei: absWei.toString(),
    eth: eth.toFixed(18).replace(/\.?0+$/, ""),
    direction: isIncrease ? "increase" : "decrease",
    sign: isIncrease ? "+" : "-",
  };
}

/**
 * Categorize address type
 * @param {string} address - Address
 * @param {string} code - Contract code
 * @returns {string} Address type
 */
export function categorizeAddress(address, code) {
  if (!code || code === "0x") {
    return "EOA"; // Externally Owned Account
  }
  return "Contract";
}

/**
 * Get state diff summary
 * @param {Object} changes - State changes object
 * @returns {Object} Summary statistics
 */
export function getStateDiffSummary(changes) {
  let totalBalanceChanges = 0;
  let totalNonceChanges = 0;
  let totalCodeChanges = 0;
  let totalStorageChanges = 0;

  for (const addressChange of changes.addresses || []) {
    if (addressChange.balanceChange) totalBalanceChanges++;
    if (addressChange.nonceChange) totalNonceChanges++;
    if (addressChange.codeChange) totalCodeChanges++;
    if (addressChange.storageChanges?.length > 0) {
      totalStorageChanges += addressChange.storageChanges.length;
    }
  }

  return {
    totalAddresses: changes.addresses?.length || 0,
    totalBalanceChanges,
    totalNonceChanges,
    totalCodeChanges,
    totalStorageChanges,
  };
}

/**
 * Export state diff as JSON
 * @param {Object} diff - State diff object
 * @returns {string} JSON string
 */
export function exportStateDiff(diff) {
  return JSON.stringify(diff, (key, value) =>
    typeof value === "bigint" ? value.toString() : value
  , 2);
}

/**
 * Compare storage slots
 * @param {string} address - Contract address
 * @param {Array<string>} slots - Storage slots to compare
 * @param {bigint} blockNumber1 - First block
 * @param {bigint} blockNumber2 - Second block
 * @returns {Promise<Array>} Slot comparisons
 */
export async function compareStorageSlots(address, slots, blockNumber1, blockNumber2) {
  try {
    const comparisons = [];

    for (const slot of slots) {
      const value1 = await publicClient.getStorageAt({
        address,
        slot,
        blockNumber: blockNumber1,
      });

      const value2 = await publicClient.getStorageAt({
        address,
        slot,
        blockNumber: blockNumber2,
      });

      if (value1 !== value2) {
        comparisons.push({
          slot,
          block1: {
            blockNumber: Number(blockNumber1),
            value: value1,
          },
          block2: {
            blockNumber: Number(blockNumber2),
            value: value2,
          },
          changed: true,
        });
      } else {
        comparisons.push({
          slot,
          value: value1,
          changed: false,
        });
      }
    }

    return comparisons;
  } catch (error) {
    console.error("Failed to compare storage slots:", error);
    throw error;
  }
}

/**
 * Detect ERC20 transfer from logs
 * @param {Array} logs - Transaction logs
 * @returns {Array} Detected transfers
 */
export function detectERC20Transfers(logs) {
  // ERC20 Transfer event signature
  const TRANSFER_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  const transfers = [];

  for (const log of logs) {
    if (log.topics[0] === TRANSFER_SIGNATURE && log.topics.length === 3) {
      transfers.push({
        token: log.address,
        from: `0x${log.topics[1].slice(26)}`,
        to: `0x${log.topics[2].slice(26)}`,
        value: log.data,
        logIndex: log.logIndex,
      });
    }
  }

  return transfers;
}

/**
 * Detect ERC721 transfer from logs
 * @param {Array} logs - Transaction logs
 * @returns {Array} Detected transfers
 */
export function detectERC721Transfers(logs) {
  // ERC721 Transfer event signature (same as ERC20 but with tokenId)
  const TRANSFER_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  const transfers = [];

  for (const log of logs) {
    if (log.topics[0] === TRANSFER_SIGNATURE && log.topics.length === 4) {
      transfers.push({
        token: log.address,
        from: `0x${log.topics[1].slice(26)}`,
        to: `0x${log.topics[2].slice(26)}`,
        tokenId: BigInt(log.topics[3]).toString(),
        logIndex: log.logIndex,
      });
    }
  }

  return transfers;
}
