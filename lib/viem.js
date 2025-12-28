import { createPublicClient, createWalletClient, http, custom } from "viem";
import { foundry } from "viem/chains";

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: foundry,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"),
});

// Get wallet client for write operations (browser only)
export function getWalletClient() {
  if (typeof window === "undefined" || !window.ethereum) {
    return null;
  }

  return createWalletClient({
    chain: foundry,
    transport: custom(window.ethereum),
  });
}

// Format wei to ether with proper decimals
export function formatEther(wei, decimals = 4) {
  if (!wei) return "0";
  const ether = Number(wei) / 1e18;
  return ether.toFixed(decimals);
}

// Shorten address for display
export function shortenAddress(address, chars = 4) {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// Debug trace utilities
export async function debugTraceTransaction(hash) {
  try {
    const trace = await publicClient.request({
      method: "debug_traceTransaction",
      params: [hash, { tracer: "callTracer" }],
    });
    return trace;
  } catch (error) {
    console.error("Error tracing transaction:", error);
    throw error;
  }
}

// Get detailed opcode trace
export async function debugTraceTransactionOpcodes(hash) {
  try {
    const trace = await publicClient.request({
      method: "debug_traceTransaction",
      params: [hash, {}],
    });
    return trace;
  } catch (error) {
    console.error("Error tracing transaction opcodes:", error);
    throw error;
  }
}

// Parse storage changes from trace
export function parseStorageChanges(structLogs) {
  const changes = [];
  const storage = {};

  for (const log of structLogs) {
    if (log.op === "SSTORE") {
      const key = log.stack[log.stack.length - 1];
      const value = log.stack[log.stack.length - 2];

      if (!storage[key] || storage[key] !== value) {
        changes.push({
          key,
          oldValue: storage[key] || "0x0",
          newValue: value,
          pc: log.pc,
          depth: log.depth,
        });
        storage[key] = value;
      }
    } else if (log.op === "SLOAD") {
      const key = log.stack[log.stack.length - 1];
      if (!storage[key]) {
        storage[key] = "0x0";
      }
    }
  }

  return changes;
}

// Format gas cost
export function formatGas(gas) {
  if (!gas) return "0";
  return Number(gas).toLocaleString();
}
