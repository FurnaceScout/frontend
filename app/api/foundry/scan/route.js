import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { NextResponse } from "next/server";

// Find Foundry project root by looking for foundry.toml
async function findFoundryRoot(startPath) {
  let currentPath = startPath;
  const maxDepth = 5; // Don't search too far up

  for (let i = 0; i < maxDepth; i++) {
    const tomlPath = join(currentPath, "foundry.toml");
    if (existsSync(tomlPath)) {
      return currentPath;
    }

    const parentPath = join(currentPath, "..");
    if (parentPath === currentPath) break; // Reached root
    currentPath = parentPath;
  }

  return null;
}

// Parse foundry.toml file
async function parseFoundryToml(tomlPath) {
  try {
    const content = await readFile(tomlPath, "utf-8");
    const config = {};

    // Simple TOML parser (basic key = value pairs)
    const lines = content.split("\n");
    let currentSection = "default";

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith("#")) continue;

      // Section header
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        currentSection = trimmed.slice(1, -1);
        config[currentSection] = config[currentSection] || {};
        continue;
      }

      // Key = value
      const match = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        // Remove quotes from string values
        const cleanValue = value.replace(/^["']|["']$/g, "").trim();

        if (!config[currentSection]) {
          config[currentSection] = {};
        }
        config[currentSection][key] = cleanValue;
      }
    }

    return config;
  } catch (error) {
    console.error("Failed to parse foundry.toml:", error);
    return null;
  }
}

// Recursively scan directory for JSON files
async function scanDirectory(dirPath, baseDir, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];

  const files = [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = relative(baseDir, fullPath);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await scanDirectory(
          fullPath,
          baseDir,
          maxDepth,
          currentDepth + 1,
        );
        files.push(...subFiles);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push({
          name: entry.name,
          path: relativePath,
          fullPath,
        });
      }
    }
  } catch (error) {
    console.error(`Failed to scan directory ${dirPath}:`, error);
  }

  return files;
}

// Extract ABI and metadata from Foundry output JSON
async function parseFoundryOutput(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    const json = JSON.parse(content);

    // Foundry output format
    if (json.abi && Array.isArray(json.abi)) {
      return {
        abi: json.abi,
        bytecode: json.bytecode?.object || null,
        deployedBytecode: json.deployedBytecode?.object || null,
        metadata: json.metadata || null,
      };
    }

    return null;
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scanPath = searchParams.get("path") || process.cwd();

    // Security: Only allow scanning within project directory
    const projectRoot = process.cwd();
    if (!scanPath.startsWith(projectRoot)) {
      return NextResponse.json(
        { error: "Path outside project directory not allowed" },
        { status: 403 },
      );
    }

    // Find Foundry project root
    const foundryRoot = await findFoundryRoot(scanPath);

    if (!foundryRoot) {
      return NextResponse.json({
        found: false,
        message: "No Foundry project detected (foundry.toml not found)",
      });
    }

    // Parse foundry.toml
    const tomlPath = join(foundryRoot, "foundry.toml");
    const config = await parseFoundryToml(tomlPath);

    // Get output directory from config (default: "out")
    const outDir = config?.profile?.out || config?.default?.out || "out";
    const outPath = join(foundryRoot, outDir);

    // Check if out directory exists
    if (!existsSync(outPath)) {
      return NextResponse.json({
        found: true,
        configured: true,
        compiled: false,
        foundryRoot: relative(projectRoot, foundryRoot),
        config,
        message:
          "Foundry project detected but not compiled. Run 'forge build' first.",
      });
    }

    // Scan out directory for contract JSONs
    const jsonFiles = await scanDirectory(outPath, outPath);

    // Parse each JSON file to extract ABIs
    const contracts = [];
    for (const file of jsonFiles) {
      // Skip metadata files
      if (file.name === "metadata.json") continue;

      const parsed = await parseFoundryOutput(file.fullPath);
      if (parsed?.abi) {
        // Extract contract name from path
        // e.g., "Counter.sol/Counter.json" -> "Counter"
        const nameMatch = file.path.match(/([^/\\]+)\.json$/);
        const contractName = nameMatch
          ? nameMatch[1]
          : file.name.replace(".json", "");

        contracts.push({
          name: contractName,
          path: file.path,
          abi: parsed.abi,
          bytecode: parsed.bytecode,
          hasBytecode: !!parsed.bytecode,
          functionCount: parsed.abi.filter((item) => item.type === "function")
            .length,
          eventCount: parsed.abi.filter((item) => item.type === "event").length,
        });
      }
    }

    return NextResponse.json({
      found: true,
      configured: true,
      compiled: true,
      foundryRoot: relative(projectRoot, foundryRoot),
      outDir,
      config,
      contracts,
      summary: {
        totalContracts: contracts.length,
        totalFunctions: contracts.reduce((sum, c) => sum + c.functionCount, 0),
        totalEvents: contracts.reduce((sum, c) => sum + c.eventCount, 0),
      },
    });
  } catch (error) {
    console.error("Foundry scan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to scan for Foundry project" },
      { status: 500 },
    );
  }
}
