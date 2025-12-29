import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";

/**
 * Run forge test and return results
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      gasReport = true,
      coverage: _coverage = false,
      matchContract = "",
      matchTest = "",
      verbosity = 2,
    } = body;

    // Get project root
    const projectRoot = process.cwd();

    // Check if foundry.toml exists
    const foundryToml = join(projectRoot, "foundry.toml");
    if (!existsSync(foundryToml)) {
      return NextResponse.json(
        {
          success: false,
          error: "No Foundry project detected. foundry.toml not found.",
        },
        { status: 400 },
      );
    }

    // Build forge test command
    const args = ["test", "--json"];

    // Add verbosity
    if (verbosity >= 2) {
      args.push("-vv");
    } else if (verbosity >= 3) {
      args.push("-vvv");
    } else if (verbosity >= 4) {
      args.push("-vvvv");
    }

    // Add gas report
    if (gasReport) {
      args.push("--gas-report");
    }

    // Add match contract filter
    if (matchContract) {
      args.push("--match-contract", matchContract);
    }

    // Add match test filter
    if (matchTest) {
      args.push("--match-test", matchTest);
    }

    // Add general test filter
    if (testFilter) {
      args.push("--match", testFilter);
    }

    // Run forge test
    const result = await runForgeTest(args, projectRoot);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Forge test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to run forge test",
      },
      { status: 500 },
    );
  }
}

/**
 * Get test history (stored results)
 */
export async function GET(_request) {
  // Test history is stored client-side in localStorage
  // This endpoint could be extended to store server-side if needed
  return NextResponse.json({
    message: "Test history is stored in browser localStorage",
  });
}

/**
 * Run forge test command and parse output
 */
function runForgeTest(args, cwd) {
  return new Promise((resolve, reject) => {
    const forge = spawn("forge", args, {
      cwd,
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";
    let jsonOutput = "";

    forge.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;

      // Try to extract JSON from output
      const lines = output.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("{")) {
          jsonOutput += `${line}\n`;
        }
      }
    });

    forge.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    forge.on("close", (code) => {
      try {
        // Parse test results
        const results = parseForgeTestOutput(jsonOutput, stdout, stderr);

        resolve({
          exitCode: code,
          success: code === 0,
          results,
          stdout,
          stderr,
          timestamp: Date.now(),
        });
      } catch (error) {
        reject(
          new Error(`Failed to parse forge test output: ${error.message}`),
        );
      }
    });

    forge.on("error", (error) => {
      reject(new Error(`Failed to spawn forge: ${error.message}`));
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      forge.kill();
      reject(new Error("Forge test timed out after 5 minutes"));
    }, 300000);
  });
}

/**
 * Parse forge test JSON output
 */
function parseForgeTestOutput(jsonOutput, stdout, _stderr) {
  const results = {
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
    },
    gasReport: null,
    coverage: null,
  };

  try {
    // Parse JSON lines
    const lines = jsonOutput.split("\n").filter((line) => line.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);

        // Handle different event types
        if (data.type === "test") {
          // Individual test result
          const test = {
            name: data.name || "Unknown Test",
            contract: data.contract || "Unknown Contract",
            status: data.status || "unknown",
            duration: data.duration || 0,
            gasUsed: data.gas || null,
            reason: data.reason || null,
            counterexample: data.counterexample || null,
            logs: data.logs || [],
            traces: data.traces || [],
          };

          results.tests.push(test);
          results.summary.total++;

          if (test.status === "Success" || test.status === "success") {
            results.summary.passed++;
          } else if (test.status === "Failure" || test.status === "failure") {
            results.summary.failed++;
          } else if (test.status === "Skipped" || test.status === "skipped") {
            results.summary.skipped++;
          }
        } else if (data.type === "suite") {
          // Test suite summary
          if (data.duration) {
            results.summary.duration += data.duration;
          }
        }
      } catch (_e) {}
    }

    // Parse gas report from stdout
    results.gasReport = parseGasReport(stdout);

    // If no JSON output, try to parse plain text output
    if (results.tests.length === 0) {
      const plainTextResults = parsePlainTextOutput(stdout);
      if (plainTextResults.tests.length > 0) {
        return plainTextResults;
      }
    }
  } catch (error) {
    console.error("Error parsing forge test output:", error);
  }

  return results;
}

/**
 * Parse gas report from stdout
 */
function parseGasReport(stdout) {
  const gasReport = {
    contracts: [],
  };

  try {
    // Look for gas report table in output
    const lines = stdout.split("\n");
    let inGasReport = false;
    let currentContract = null;

    for (const line of lines) {
      // Detect start of gas report
      if (line.includes("Gas report") || line.includes("gas report")) {
        inGasReport = true;
        continue;
      }

      if (!inGasReport) continue;

      // Contract header
      if (line.match(/^[A-Za-z_][A-Za-z0-9_]*:?\s*$/)) {
        currentContract = {
          name: line.replace(":", "").trim(),
          functions: [],
        };
        gasReport.contracts.push(currentContract);
        continue;
      }

      // Function gas usage
      const functionMatch = line.match(
        /([A-Za-z_][A-Za-z0-9_]*)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/,
      );
      if (functionMatch && currentContract) {
        currentContract.functions.push({
          name: functionMatch[1],
          min: parseInt(functionMatch[2], 10),
          avg: parseInt(functionMatch[3], 10),
          median: parseInt(functionMatch[4], 10),
          max: parseInt(functionMatch[5], 10),
        });
      }
    }
  } catch (error) {
    console.error("Error parsing gas report:", error);
  }

  return gasReport.contracts.length > 0 ? gasReport : null;
}

/**
 * Parse plain text forge test output (fallback)
 */
function parsePlainTextOutput(stdout) {
  const results = {
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
    },
    gasReport: null,
  };

  try {
    const lines = stdout.split("\n");

    for (const line of lines) {
      // Match test result lines
      // Format: [PASS] testName() (gas: 12345)
      const passMatch = line.match(
        /\[PASS\]\s+([^(]+)\(\)\s*(?:\(gas:\s*(\d+)\))?/,
      );
      if (passMatch) {
        results.tests.push({
          name: passMatch[1].trim(),
          contract: "Unknown",
          status: "Success",
          gasUsed: passMatch[2] ? parseInt(passMatch[2], 10) : null,
          duration: 0,
        });
        results.summary.total++;
        results.summary.passed++;
        continue;
      }

      // Format: [FAIL] testName()
      const failMatch = line.match(/\[FAIL\]\s+([^(]+)\(\)/);
      if (failMatch) {
        results.tests.push({
          name: failMatch[1].trim(),
          contract: "Unknown",
          status: "Failure",
          gasUsed: null,
          duration: 0,
        });
        results.summary.total++;
        results.summary.failed++;
      }
    }

    // Parse summary line
    const summaryMatch = stdout.match(
      /Test result:\s+(\w+)\.\s+(\d+)\s+passed;\s+(\d+)\s+failed/i,
    );
    if (summaryMatch) {
      results.summary.passed = parseInt(summaryMatch[2], 10);
      results.summary.failed = parseInt(summaryMatch[3], 10);
      results.summary.total = results.summary.passed + results.summary.failed;
    }
  } catch (error) {
    console.error("Error parsing plain text output:", error);
  }

  return results;
}
