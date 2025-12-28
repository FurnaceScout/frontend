// Utility functions for Anvil state management and testing features

import { publicClient } from "@/lib/viem";

/**
 * Create a snapshot of the current blockchain state
 * @returns {Promise<string>} Snapshot ID
 */
export async function createSnapshot() {
  try {
    const snapshotId = await publicClient.request({
      method: "evm_snapshot",
      params: [],
    });
    return snapshotId;
  } catch (error) {
    console.error("Failed to create snapshot:", error);
    throw error;
  }
}

/**
 * Revert to a previous snapshot
 * @param {string} snapshotId - Snapshot ID to revert to
 * @returns {Promise<boolean>} Success status
 */
export async function revertToSnapshot(snapshotId) {
  try {
    const success = await publicClient.request({
      method: "evm_revert",
      params: [snapshotId],
    });
    return success;
  } catch (error) {
    console.error("Failed to revert to snapshot:", error);
    throw error;
  }
}

/**
 * Mine a single block
 * @returns {Promise<string>} Block hash
 */
export async function mineBlock() {
  try {
    const result = await publicClient.request({
      method: "evm_mine",
      params: [],
    });
    return result;
  } catch (error) {
    console.error("Failed to mine block:", error);
    throw error;
  }
}

/**
 * Mine multiple blocks
 * @param {number} count - Number of blocks to mine
 * @returns {Promise<void>}
 */
export async function mineBlocks(count) {
  try {
    for (let i = 0; i < count; i++) {
      await mineBlock();
    }
  } catch (error) {
    console.error("Failed to mine blocks:", error);
    throw error;
  }
}

/**
 * Increase time by a specified number of seconds
 * @param {number} seconds - Seconds to increase
 * @returns {Promise<number>} New timestamp
 */
export async function increaseTime(seconds) {
  try {
    const result = await publicClient.request({
      method: "evm_increaseTime",
      params: [seconds],
    });

    // Mine a block to apply the time change
    await mineBlock();

    return result;
  } catch (error) {
    console.error("Failed to increase time:", error);
    throw error;
  }
}

/**
 * Set the next block timestamp
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {Promise<void>}
 */
export async function setNextBlockTimestamp(timestamp) {
  try {
    await publicClient.request({
      method: "evm_setNextBlockTimestamp",
      params: [timestamp],
    });

    // Mine a block to apply the timestamp
    await mineBlock();
  } catch (error) {
    console.error("Failed to set next block timestamp:", error);
    throw error;
  }
}

/**
 * Set an account's balance
 * @param {string} address - Account address
 * @param {string} balance - Balance in wei (hex string)
 * @returns {Promise<void>}
 */
export async function setBalance(address, balance) {
  try {
    // Convert balance to hex if it's a number or BigInt
    let hexBalance = balance;
    if (typeof balance === "number" || typeof balance === "bigint") {
      hexBalance = `0x${BigInt(balance).toString(16)}`;
    }

    await publicClient.request({
      method: "anvil_setBalance",
      params: [address, hexBalance],
    });
  } catch (error) {
    console.error("Failed to set balance:", error);
    throw error;
  }
}

/**
 * Set an account's nonce
 * @param {string} address - Account address
 * @param {number} nonce - New nonce value
 * @returns {Promise<void>}
 */
export async function setNonce(address, nonce) {
  try {
    await publicClient.request({
      method: "anvil_setNonce",
      params: [address, nonce],
    });
  } catch (error) {
    console.error("Failed to set nonce:", error);
    throw error;
  }
}

/**
 * Set contract code at an address
 * @param {string} address - Contract address
 * @param {string} code - Bytecode (hex string with 0x prefix)
 * @returns {Promise<void>}
 */
export async function setCode(address, code) {
  try {
    await publicClient.request({
      method: "anvil_setCode",
      params: [address, code],
    });
  } catch (error) {
    console.error("Failed to set code:", error);
    throw error;
  }
}

/**
 * Set a storage slot value
 * @param {string} address - Contract address
 * @param {string} slot - Storage slot (hex string)
 * @param {string} value - Value to set (hex string)
 * @returns {Promise<void>}
 */
export async function setStorageAt(address, slot, value) {
  try {
    await publicClient.request({
      method: "anvil_setStorageAt",
      params: [address, slot, value],
    });
  } catch (error) {
    console.error("Failed to set storage:", error);
    throw error;
  }
}

/**
 * Impersonate an account (send transactions as this account without private key)
 * @param {string} address - Account address to impersonate
 * @returns {Promise<void>}
 */
export async function impersonateAccount(address) {
  try {
    await publicClient.request({
      method: "anvil_impersonateAccount",
      params: [address],
    });
  } catch (error) {
    console.error("Failed to impersonate account:", error);
    throw error;
  }
}

/**
 * Stop impersonating an account
 * @param {string} address - Account address to stop impersonating
 * @returns {Promise<void>}
 */
export async function stopImpersonatingAccount(address) {
  try {
    await publicClient.request({
      method: "anvil_stopImpersonatingAccount",
      params: [address],
    });
  } catch (error) {
    console.error("Failed to stop impersonating account:", error);
    throw error;
  }
}

/**
 * Enable or disable automine (automatic mining on each transaction)
 * @param {boolean} enabled - Whether to enable automine
 * @returns {Promise<void>}
 */
export async function setAutomine(enabled) {
  try {
    await publicClient.request({
      method: "evm_setAutomine",
      params: [enabled],
    });
  } catch (error) {
    console.error("Failed to set automine:", error);
    throw error;
  }
}

/**
 * Set interval mining (mine blocks at regular intervals)
 * @param {number} interval - Interval in seconds (0 to disable)
 * @returns {Promise<void>}
 */
export async function setIntervalMining(interval) {
  try {
    await publicClient.request({
      method: "evm_setIntervalMining",
      params: [interval],
    });
  } catch (error) {
    console.error("Failed to set interval mining:", error);
    throw error;
  }
}

/**
 * Reset the fork to a specific block number
 * @param {string} jsonRpcUrl - Forked network RPC URL
 * @param {number} blockNumber - Block number to fork from
 * @returns {Promise<void>}
 */
export async function reset(jsonRpcUrl = null, blockNumber = null) {
  try {
    const params = [];

    if (jsonRpcUrl) {
      const forkConfig = { jsonRpcUrl };
      if (blockNumber !== null) {
        forkConfig.blockNumber = blockNumber;
      }
      params.push({ forking: forkConfig });
    }

    await publicClient.request({
      method: "anvil_reset",
      params: params.length > 0 ? params : undefined,
    });
  } catch (error) {
    console.error("Failed to reset:", error);
    throw error;
  }
}

/**
 * Get current automine status
 * @returns {Promise<boolean>} Automine status
 */
export async function getAutomineStatus() {
  try {
    // This is not a standard method, so we'll try to infer it
    // by attempting to get the mining status
    // For now, return null as Anvil doesn't expose this directly
    return null;
  } catch (error) {
    console.error("Failed to get automine status:", error);
    return null;
  }
}

/**
 * Drop all pending transactions
 * @returns {Promise<void>}
 */
export async function dropTransaction(hash) {
  try {
    await publicClient.request({
      method: "anvil_dropTransaction",
      params: [hash],
    });
  } catch (error) {
    console.error("Failed to drop transaction:", error);
    throw error;
  }
}

/**
 * Drop all pending transactions from mempool
 * @returns {Promise<void>}
 */
export async function dropAllTransactions() {
  try {
    await publicClient.request({
      method: "anvil_dropAllTransactions",
      params: [],
    });
  } catch (error) {
    console.error("Failed to drop all transactions:", error);
    throw error;
  }
}

/**
 * Get node information
 * @returns {Promise<Object>} Node info
 */
export async function getNodeInfo() {
  try {
    const info = await publicClient.request({
      method: "anvil_nodeInfo",
      params: [],
    });
    return info;
  } catch (error) {
    console.error("Failed to get node info:", error);
    throw error;
  }
}

/**
 * Set the base fee per gas
 * @param {string} baseFee - Base fee in wei (hex string)
 * @returns {Promise<void>}
 */
export async function setBaseFee(baseFee) {
  try {
    await publicClient.request({
      method: "anvil_setBaseFee",
      params: [baseFee],
    });
  } catch (error) {
    console.error("Failed to set base fee:", error);
    throw error;
  }
}

/**
 * Set the minimum gas price
 * @param {string} gasPrice - Gas price in wei (hex string)
 * @returns {Promise<void>}
 */
export async function setMinGasPrice(gasPrice) {
  try {
    await publicClient.request({
      method: "anvil_setMinGasPrice",
      params: [gasPrice],
    });
  } catch (error) {
    console.error("Failed to set min gas price:", error);
    throw error;
  }
}

/**
 * Manage snapshots in localStorage
 */

const SNAPSHOTS_KEY = "furnacescout_anvil_snapshots";

/**
 * Get all saved snapshots
 * @returns {Array} Array of snapshot objects
 */
export function getSavedSnapshots() {
  try {
    const stored = localStorage.getItem(SNAPSHOTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get saved snapshots:", error);
    return [];
  }
}

/**
 * Save a snapshot with metadata
 * @param {string} snapshotId - Snapshot ID
 * @param {string} name - User-friendly name
 * @param {string} description - Optional description
 * @returns {boolean} Success status
 */
export function saveSnapshotMetadata(snapshotId, name, description = "") {
  try {
    const snapshots = getSavedSnapshots();

    snapshots.push({
      id: snapshotId,
      name,
      description,
      timestamp: Date.now(),
    });

    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    return true;
  } catch (error) {
    console.error("Failed to save snapshot metadata:", error);
    return false;
  }
}

/**
 * Delete snapshot metadata
 * @param {string} snapshotId - Snapshot ID
 * @returns {boolean} Success status
 */
export function deleteSnapshotMetadata(snapshotId) {
  try {
    const snapshots = getSavedSnapshots();
    const filtered = snapshots.filter((s) => s.id !== snapshotId);
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete snapshot metadata:", error);
    return false;
  }
}

/**
 * Clear all snapshot metadata
 * @returns {boolean} Success status
 */
export function clearSnapshotMetadata() {
  try {
    localStorage.removeItem(SNAPSHOTS_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear snapshot metadata:", error);
    return false;
  }
}

/**
 * Manage impersonated accounts in localStorage
 */

const IMPERSONATIONS_KEY = "furnacescout_anvil_impersonations";

/**
 * Get all impersonated accounts
 * @returns {Array} Array of addresses
 */
export function getImpersonatedAccounts() {
  try {
    const stored = localStorage.getItem(IMPERSONATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get impersonated accounts:", error);
    return [];
  }
}

/**
 * Add impersonated account to tracking
 * @param {string} address - Account address
 * @returns {boolean} Success status
 */
export function addImpersonatedAccount(address) {
  try {
    const accounts = getImpersonatedAccounts();

    if (!accounts.includes(address.toLowerCase())) {
      accounts.push(address.toLowerCase());
      localStorage.setItem(IMPERSONATIONS_KEY, JSON.stringify(accounts));
    }

    return true;
  } catch (error) {
    console.error("Failed to add impersonated account:", error);
    return false;
  }
}

/**
 * Remove impersonated account from tracking
 * @param {string} address - Account address
 * @returns {boolean} Success status
 */
export function removeImpersonatedAccount(address) {
  try {
    const accounts = getImpersonatedAccounts();
    const filtered = accounts.filter((a) => a !== address.toLowerCase());
    localStorage.setItem(IMPERSONATIONS_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to remove impersonated account:", error);
    return false;
  }
}

/**
 * Clear all impersonated accounts tracking
 * @returns {boolean} Success status
 */
export function clearImpersonatedAccounts() {
  try {
    localStorage.removeItem(IMPERSONATIONS_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear impersonated accounts:", error);
    return false;
  }
}

/**
 * Utility: Convert ETH to wei
 * @param {string} eth - ETH amount
 * @returns {bigint} Wei amount
 */
export function ethToWei(eth) {
  return BigInt(Math.floor(parseFloat(eth) * 1e18));
}

/**
 * Utility: Convert wei to ETH
 * @param {bigint|string} wei - Wei amount
 * @returns {string} ETH amount
 */
export function weiToEth(wei) {
  return (Number(wei) / 1e18).toFixed(18).replace(/\.?0+$/, "");
}

/**
 * Utility: Format timestamp for display
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Utility: Get current block timestamp
 * @returns {Promise<number>} Current block timestamp
 */
export async function getCurrentBlockTimestamp() {
  try {
    const block = await publicClient.getBlock();
    return Number(block.timestamp);
  } catch (error) {
    console.error("Failed to get current block timestamp:", error);
    throw error;
  }
}
