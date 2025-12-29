// Utility functions for Foundry project detection and ABI management

/**
 * Scan for Foundry project and load ABIs
 * @param {string} path - Optional path to scan (defaults to current directory)
 * @returns {Promise<Object>} Project information and contracts
 */
export async function scanFoundryProject(path = null) {
  try {
    const params = path ? `?path=${encodeURIComponent(path)}` : "";
    const response = await fetch(`/api/foundry/scan${params}`);

    if (!response.ok) {
      throw new Error(`Scan failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to scan Foundry project:", error);
    throw error;
  }
}

/**
 * Load Foundry project ABIs into localStorage
 * @param {Array} contracts - Array of contract objects from scan
 * @param {Object} deployments - Optional deployment addresses mapping
 * @returns {number} Number of ABIs loaded
 */
export function loadFoundryABIs(contracts, deployments = {}) {
  if (!contracts || contracts.length === 0) {
    return 0;
  }

  let loaded = 0;

  try {
    // Get existing ABIs
    const stored = JSON.parse(
      localStorage.getItem("furnacescout_abis") || "{}",
    );

    // Add or update each contract
    for (const contract of contracts) {
      // Check if we have a deployment address for this contract
      const address = deployments[contract.name];

      if (address) {
        const normalized = address.toLowerCase();
        stored[normalized] = {
          abi: contract.abi,
          name: contract.name,
          timestamp: Date.now(),
          source: "foundry",
          path: contract.path,
        };
        loaded++;
      } else {
        // Store without address (for later linking)
        const key = `foundry:${contract.name}`;
        stored[key] = {
          abi: contract.abi,
          name: contract.name,
          timestamp: Date.now(),
          source: "foundry",
          path: contract.path,
          needsAddress: true,
        };
        loaded++;
      }
    }

    localStorage.setItem("furnacescout_abis", JSON.stringify(stored));
    return loaded;
  } catch (error) {
    console.error("Failed to load Foundry ABIs:", error);
    throw error;
  }
}

/**
 * Get all Foundry contracts (with or without addresses)
 * @returns {Array} Array of Foundry contracts
 */
export function getFoundryContracts() {
  try {
    const stored = JSON.parse(
      localStorage.getItem("furnacescout_abis") || "{}",
    );

    return Object.entries(stored)
      .filter(
        ([key, data]) =>
          data.source === "foundry" || key.startsWith("foundry:"),
      )
      .map(([key, data]) => ({
        key,
        address: key.startsWith("foundry:") ? null : key,
        ...data,
      }));
  } catch (error) {
    console.error("Failed to get Foundry contracts:", error);
    return [];
  }
}

/**
 * Link a Foundry contract to a deployed address
 * @param {string} contractName - Name of the contract
 * @param {string} address - Deployment address
 * @returns {boolean} Success status
 */
export function linkFoundryContract(contractName, address) {
  try {
    const stored = JSON.parse(
      localStorage.getItem("furnacescout_abis") || "{}",
    );

    // Find contract by name
    const foundryKey = `foundry:${contractName}`;
    const contract = stored[foundryKey];

    if (!contract) {
      throw new Error(`Contract ${contractName} not found`);
    }

    // Add with address
    const normalized = address.toLowerCase();
    stored[normalized] = {
      ...contract,
      needsAddress: false,
    };

    // Remove unlinked entry
    delete stored[foundryKey];

    localStorage.setItem("furnacescout_abis", JSON.stringify(stored));
    return true;
  } catch (error) {
    console.error("Failed to link Foundry contract:", error);
    throw error;
  }
}

/**
 * Parse deployment information from Foundry broadcast files
 * @param {string} chainId - Chain ID (e.g., "31337" for Anvil)
 * @returns {Promise<Object>} Mapping of contract names to addresses
 */
export async function loadFoundryDeployments(chainId = "31337") {
  try {
    // Try to fetch broadcast files (this would need a separate API route)
    const response = await fetch(`/api/foundry/deployments?chainId=${chainId}`);

    if (!response.ok) {
      return {};
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to load Foundry deployments:", error);
    return {};
  }
}

/**
 * Store Foundry project configuration
 * @param {Object} config - Foundry config from foundry.toml
 */
export function saveFoundryConfig(config) {
  try {
    localStorage.setItem(
      "furnacescout_foundry_config",
      JSON.stringify({
        config,
        timestamp: Date.now(),
      }),
    );
  } catch (error) {
    console.error("Failed to save Foundry config:", error);
  }
}

/**
 * Get stored Foundry project configuration
 * @returns {Object|null} Foundry config or null
 */
export function getFoundryConfig() {
  try {
    const stored = localStorage.getItem("furnacescout_foundry_config");
    if (!stored) return null;

    const data = JSON.parse(stored);
    return data.config;
  } catch (error) {
    console.error("Failed to get Foundry config:", error);
    return null;
  }
}

/**
 * Clear all Foundry-related data
 */
export function clearFoundryData() {
  try {
    // Remove Foundry contracts
    const stored = JSON.parse(
      localStorage.getItem("furnacescout_abis") || "{}",
    );

    const filtered = Object.fromEntries(
      Object.entries(stored).filter(
        ([key, data]) =>
          data.source !== "foundry" && !key.startsWith("foundry:"),
      ),
    );

    localStorage.setItem("furnacescout_abis", JSON.stringify(filtered));

    // Remove config
    localStorage.removeItem("furnacescout_foundry_config");

    return true;
  } catch (error) {
    console.error("Failed to clear Foundry data:", error);
    return false;
  }
}

/**
 * Get statistics about loaded Foundry contracts
 * @returns {Object} Statistics
 */
export function getFoundryStats() {
  const contracts = getFoundryContracts();

  return {
    total: contracts.length,
    withAddress: contracts.filter((c) => c.address).length,
    needsAddress: contracts.filter((c) => c.needsAddress).length,
    totalFunctions: contracts.reduce(
      (sum, c) =>
        sum + (c.abi?.filter((item) => item.type === "function").length || 0),
      0,
    ),
    totalEvents: contracts.reduce(
      (sum, c) =>
        sum + (c.abi?.filter((item) => item.type === "event").length || 0),
      0,
    ),
  };
}

/**
 * Export Foundry contracts as JSON
 * @returns {string} JSON string of all Foundry contracts
 */
export function exportFoundryContracts() {
  const contracts = getFoundryContracts();
  return JSON.stringify(contracts, null, 2);
}

/**
 * Check if a Foundry project is detected
 * @returns {Promise<boolean>}
 */
export async function hasFoundryProject() {
  try {
    const result = await scanFoundryProject();
    return result.found && result.compiled;
  } catch (_error) {
    return false;
  }
}
