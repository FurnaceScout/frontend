// Utility functions for Foundry deployment tracking and management

/**
 * Scan for Foundry deployments from broadcast files
 * @param {string} chainId - Optional chain ID filter (e.g., "31337" for Anvil)
 * @param {boolean} includeHistory - Include full deployment history
 * @returns {Promise<Object>} Deployment information
 */
export async function scanFoundryDeployments(chainId = null, includeHistory = false) {
  try {
    const params = new URLSearchParams();
    if (chainId) params.append("chainId", chainId);
    if (includeHistory) params.append("history", "true");

    const response = await fetch(`/api/foundry/deployments?${params}`);

    if (!response.ok) {
      throw new Error(`Scan failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to scan Foundry deployments:", error);
    throw error;
  }
}

/**
 * Load deployment data into localStorage
 * @param {Array} deployments - Array of deployment objects
 * @returns {number} Number of deployments loaded
 */
export function loadDeployments(deployments) {
  if (!deployments || deployments.length === 0) {
    return 0;
  }

  try {
    const stored = JSON.parse(
      localStorage.getItem("furnacescout_deployments") || "[]"
    );

    // Merge with existing deployments (avoid duplicates)
    const mergedMap = new Map();

    // Add existing
    for (const deployment of stored) {
      const key = `${deployment.contractAddress}-${deployment.chainId}`;
      mergedMap.set(key, deployment);
    }

    // Add new (will overwrite if same key)
    for (const deployment of deployments) {
      const key = `${deployment.contractAddress}-${deployment.chainId}`;
      mergedMap.set(key, {
        ...deployment,
        loadedAt: Date.now(),
      });
    }

    const merged = Array.from(mergedMap.values());
    localStorage.setItem("furnacescout_deployments", JSON.stringify(merged));

    return deployments.length;
  } catch (error) {
    console.error("Failed to load deployments:", error);
    throw error;
  }
}

/**
 * Get all stored deployments
 * @param {string} chainId - Optional chain ID filter
 * @returns {Array} Array of deployments
 */
export function getDeployments(chainId = null) {
  try {
    const stored = JSON.parse(
      localStorage.getItem("furnacescout_deployments") || "[]"
    );

    if (chainId) {
      return stored.filter((d) => d.chainId === chainId);
    }

    return stored;
  } catch (error) {
    console.error("Failed to get deployments:", error);
    return [];
  }
}

/**
 * Get deployment by contract address
 * @param {string} address - Contract address
 * @returns {Object|null} Deployment info or null
 */
export function getDeploymentByAddress(address) {
  try {
    const deployments = getDeployments();
    const normalized = address.toLowerCase();
    return deployments.find((d) => d.contractAddress?.toLowerCase() === normalized) || null;
  } catch (error) {
    console.error("Failed to get deployment by address:", error);
    return null;
  }
}

/**
 * Get deployments by contract name
 * @param {string} contractName - Contract name
 * @returns {Array} Array of deployments for this contract
 */
export function getDeploymentsByName(contractName) {
  try {
    const deployments = getDeployments();
    return deployments.filter((d) => d.contractName === contractName);
  } catch (error) {
    console.error("Failed to get deployments by name:", error);
    return [];
  }
}

/**
 * Link deployment addresses to loaded ABIs
 * @param {Array} deployments - Array of deployments
 * @returns {Object} Result with counts
 */
export function linkDeploymentsToABIs(deployments) {
  let linked = 0;
  let notFound = 0;

  try {
    const abis = JSON.parse(
      localStorage.getItem("furnacescout_abis") || "{}"
    );

    for (const deployment of deployments) {
      if (!deployment.contractAddress || !deployment.contractName) continue;

      const normalized = deployment.contractAddress.toLowerCase();

      // Check if ABI exists for this contract name
      const foundryKey = `foundry:${deployment.contractName}`;
      const contractABI = abis[foundryKey];

      if (contractABI) {
        // Link the ABI to the deployment address
        abis[normalized] = {
          ...contractABI,
          address: normalized,
          needsAddress: false,
          deployment: {
            scriptName: deployment.scriptName,
            timestamp: deployment.deploymentTimestamp,
            chainId: deployment.chainId,
            transactionHash: deployment.transactionHash,
            blockNumber: deployment.blockNumber,
          },
        };

        // Optionally remove the unlinked entry
        // delete abis[foundryKey];

        linked++;
      } else {
        notFound++;
      }
    }

    localStorage.setItem("furnacescout_abis", JSON.stringify(abis));

    return { linked, notFound, total: deployments.length };
  } catch (error) {
    console.error("Failed to link deployments to ABIs:", error);
    throw error;
  }
}

/**
 * Get deployment statistics
 * @returns {Object} Deployment statistics
 */
export function getDeploymentStats() {
  try {
    const deployments = getDeployments();

    const chains = new Set();
    const contracts = new Set();

    for (const deployment of deployments) {
      if (deployment.chainId) chains.add(deployment.chainId);
      if (deployment.contractName) contracts.add(deployment.contractName);
    }

    return {
      total: deployments.length,
      chains: Array.from(chains),
      chainCount: chains.size,
      contracts: Array.from(contracts),
      contractCount: contracts.size,
      latestDeployment: deployments.length > 0
        ? Math.max(...deployments.map((d) => d.deploymentTimestamp || 0))
        : null,
    };
  } catch (error) {
    console.error("Failed to get deployment stats:", error);
    return {
      total: 0,
      chains: [],
      chainCount: 0,
      contracts: [],
      contractCount: 0,
      latestDeployment: null,
    };
  }
}

/**
 * Clear all deployment data
 */
export function clearDeployments() {
  try {
    localStorage.removeItem("furnacescout_deployments");
    return true;
  } catch (error) {
    console.error("Failed to clear deployments:", error);
    return false;
  }
}

/**
 * Export deployments as JSON
 * @returns {string} JSON string
 */
export function exportDeployments() {
  const deployments = getDeployments();
  return JSON.stringify(deployments, null, 2);
}

/**
 * Import deployments from JSON
 * @param {string} json - JSON string
 * @returns {number} Number of deployments imported
 */
export function importDeployments(json) {
  try {
    const imported = JSON.parse(json);

    if (!Array.isArray(imported)) {
      throw new Error("Invalid format: expected array");
    }

    return loadDeployments(imported);
  } catch (error) {
    console.error("Failed to import deployments:", error);
    throw error;
  }
}

/**
 * Add or update a single deployment
 * @param {Object} deployment - Deployment object
 * @returns {boolean} Success status
 */
export function saveDeployment(deployment) {
  try {
    const deployments = getDeployments();

    // Find and update or add new
    const index = deployments.findIndex(
      (d) =>
        d.contractAddress?.toLowerCase() === deployment.contractAddress?.toLowerCase() &&
        d.chainId === deployment.chainId
    );

    if (index >= 0) {
      deployments[index] = { ...deployment, updatedAt: Date.now() };
    } else {
      deployments.push({ ...deployment, createdAt: Date.now() });
    }

    localStorage.setItem("furnacescout_deployments", JSON.stringify(deployments));
    return true;
  } catch (error) {
    console.error("Failed to save deployment:", error);
    return false;
  }
}

/**
 * Delete a deployment
 * @param {string} address - Contract address
 * @param {string} chainId - Chain ID
 * @returns {boolean} Success status
 */
export function deleteDeployment(address, chainId) {
  try {
    const deployments = getDeployments();
    const normalized = address.toLowerCase();

    const filtered = deployments.filter(
      (d) =>
        !(d.contractAddress?.toLowerCase() === normalized && d.chainId === chainId)
    );

    localStorage.setItem("furnacescout_deployments", JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete deployment:", error);
    return false;
  }
}

/**
 * Check if address is a known deployment
 * @param {string} address - Contract address
 * @returns {boolean}
 */
export function isKnownDeployment(address) {
  const deployment = getDeploymentByAddress(address);
  return deployment !== null;
}

/**
 * Get deployment summary for display
 * @param {string} address - Contract address
 * @returns {Object|null} Summary object
 */
export function getDeploymentSummary(address) {
  const deployment = getDeploymentByAddress(address);

  if (!deployment) return null;

  return {
    contractName: deployment.contractName,
    deployer: deployment.deployer,
    blockNumber: deployment.blockNumber,
    transactionHash: deployment.transactionHash,
    timestamp: deployment.deploymentTimestamp,
    scriptName: deployment.scriptName,
    chainId: deployment.chainId,
  };
}
