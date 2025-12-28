import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join, relative } from "path";
import { existsSync } from "fs";

// Find Foundry project root by looking for foundry.toml
async function findFoundryRoot(startPath) {
  let currentPath = startPath;
  const maxDepth = 5;

  for (let i = 0; i < maxDepth; i++) {
    const tomlPath = join(currentPath, "foundry.toml");
    if (existsSync(tomlPath)) {
      return currentPath;
    }

    const parentPath = join(currentPath, "..");
    if (parentPath === currentPath) break;
    currentPath = parentPath;
  }

  return null;
}

// Parse a broadcast JSON file
async function parseBroadcastFile(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    // Extract deployment transactions
    const deployments = [];

    if (data.transactions && Array.isArray(data.transactions)) {
      for (const tx of data.transactions) {
        // Look for contract creation transactions
        if (tx.transactionType === "CREATE" || tx.transactionType === "CREATE2" || !tx.transaction?.to) {
          deployments.push({
            contractName: tx.contractName || "Unknown",
            contractAddress: tx.contractAddress || tx.transaction?.creates,
            transactionHash: tx.hash || tx.transaction?.hash,
            deployer: tx.transaction?.from,
            blockNumber: tx.transaction?.blockNumber,
            gasUsed: tx.transaction?.gas || tx.transaction?.gasLimit,
            arguments: tx.arguments || [],
            timestamp: tx.timestamp,
            transactionType: tx.transactionType,
          });
        }
      }
    }

    // Also check receipts array (older format)
    if (data.receipts && Array.isArray(data.receipts)) {
      for (const receipt of data.receipts) {
        if (receipt.contractAddress) {
          deployments.push({
            contractName: receipt.contractName || "Unknown",
            contractAddress: receipt.contractAddress,
            transactionHash: receipt.transactionHash,
            deployer: receipt.from,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            timestamp: receipt.timestamp,
          });
        }
      }
    }

    return {
      deployments,
      chain: data.chain || null,
      chainId: data.chainId || null,
      timestamp: data.timestamp || null,
      commit: data.commit || null,
    };
  } catch (error) {
    console.error(`Failed to parse broadcast file ${filePath}:`, error);
    return null;
  }
}

// Scan broadcast directory for deployment files
async function scanBroadcastDirectory(broadcastPath, chainId = null) {
  const deploymentHistory = [];

  try {
    if (!existsSync(broadcastPath)) {
      return deploymentHistory;
    }

    // Read all entries in broadcast directory
    const entries = await readdir(broadcastPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const scriptDir = join(broadcastPath, entry.name);
      const scriptName = entry.name;

      // Read chain subdirectories
      const chainEntries = await readdir(scriptDir, { withFileTypes: true });

      for (const chainEntry of chainEntries) {
        if (!chainEntry.isDirectory()) continue;

        const chainDirName = chainEntry.name;

        // Skip if chainId filter is provided and doesn't match
        if (chainId && chainDirName !== chainId) continue;

        const chainDir = join(scriptDir, chainDirName);

        // Look for run-*.json and run-latest.json files
        const files = await readdir(chainDir);

        for (const file of files) {
          if (file.endsWith(".json") && (file.startsWith("run-") || file === "run-latest.json")) {
            const filePath = join(chainDir, file);
            const parsed = await parseBroadcastFile(filePath);

            if (parsed && parsed.deployments.length > 0) {
              deploymentHistory.push({
                scriptName,
                fileName: file,
                chainId: chainDirName,
                chain: parsed.chain,
                timestamp: parsed.timestamp,
                commit: parsed.commit,
                deployments: parsed.deployments,
                filePath: relative(broadcastPath, filePath),
              });
            }
          }
        }
      }
    }

    // Sort by timestamp (newest first)
    deploymentHistory.sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });

    return deploymentHistory;
  } catch (error) {
    console.error("Failed to scan broadcast directory:", error);
    return [];
  }
}

// Get unique deployments (latest for each contract)
function getUniqueDeployments(history) {
  const uniqueMap = new Map();

  for (const entry of history) {
    for (const deployment of entry.deployments) {
      const key = `${deployment.contractName}-${entry.chainId}`;

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          ...deployment,
          scriptName: entry.scriptName,
          fileName: entry.fileName,
          chainId: entry.chainId,
          chain: entry.chain,
          deploymentTimestamp: entry.timestamp,
        });
      }
    }
  }

  return Array.from(uniqueMap.values());
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get("chainId");
    const includeHistory = searchParams.get("history") === "true";
    const scanPath = searchParams.get("path") || process.cwd();

    // Security: Only allow scanning within project directory
    const projectRoot = process.cwd();
    if (!scanPath.startsWith(projectRoot)) {
      return NextResponse.json(
        { error: "Path outside project directory not allowed" },
        { status: 403 }
      );
    }

    // Find Foundry project root
    const foundryRoot = await findFoundryRoot(scanPath);

    if (!foundryRoot) {
      return NextResponse.json({
        found: false,
        message: "No Foundry project detected",
        deployments: [],
      });
    }

    // Look for broadcast directory
    const broadcastPath = join(foundryRoot, "broadcast");

    if (!existsSync(broadcastPath)) {
      return NextResponse.json({
        found: true,
        foundryRoot: relative(projectRoot, foundryRoot),
        hasBroadcast: false,
        message: "No broadcast directory found. Run 'forge script' to deploy contracts.",
        deployments: [],
      });
    }

    // Scan broadcast directory
    const history = await scanBroadcastDirectory(broadcastPath, chainId);

    // Get unique deployments (latest per contract)
    const uniqueDeployments = getUniqueDeployments(history);

    // Calculate statistics
    const stats = {
      totalDeployments: uniqueDeployments.length,
      totalScripts: new Set(history.map((h) => h.scriptName)).size,
      chains: Array.from(new Set(history.map((h) => h.chainId))),
      latestDeployment: history[0]?.timestamp || null,
    };

    return NextResponse.json({
      found: true,
      foundryRoot: relative(projectRoot, foundryRoot),
      hasBroadcast: true,
      deployments: uniqueDeployments,
      history: includeHistory ? history : undefined,
      stats,
    });
  } catch (error) {
    console.error("Deployment scan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scan deployments" },
      { status: 500 }
    );
  }
}
