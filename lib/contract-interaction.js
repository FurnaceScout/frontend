// Utility functions for contract interaction via ABIs

import { publicClient, getWalletClient } from "@/lib/viem";
import { encodeFunctionData, decodeFunctionResult, parseAbi, formatEther as viemFormatEther } from "viem";

/**
 * Parse ABI and categorize functions
 * @param {Array} abi - Contract ABI
 * @returns {Object} Categorized functions
 */
export function parseABI(abi) {
  if (!abi || !Array.isArray(abi)) {
    return { read: [], write: [], events: [], errors: [], constructor: null };
  }

  const read = [];
  const write = [];
  const events = [];
  const errors = [];
  let constructor = null;

  for (const item of abi) {
    switch (item.type) {
      case "function":
        if (item.stateMutability === "view" || item.stateMutability === "pure") {
          read.push(item);
        } else {
          write.push(item);
        }
        break;
      case "event":
        events.push(item);
        break;
      case "error":
        errors.push(item);
        break;
      case "constructor":
        constructor = item;
        break;
      default:
        break;
    }
  }

  return { read, write, events, errors, constructor };
}

/**
 * Get function signature for display
 * @param {Object} func - ABI function item
 * @returns {string} Function signature
 */
export function getFunctionSignature(func) {
  const inputs = func.inputs || [];
  const params = inputs.map((input) => {
    const name = input.name || "";
    return name ? `${input.type} ${name}` : input.type;
  }).join(", ");

  let signature = `${func.name}(${params})`;

  if (func.outputs && func.outputs.length > 0) {
    const outputs = func.outputs.map((output) => output.type).join(", ");
    signature += ` returns (${outputs})`;
  }

  if (func.stateMutability) {
    signature += ` ${func.stateMutability}`;
  }

  return signature;
}

/**
 * Parse input value based on Solidity type
 * @param {string} value - Raw input value
 * @param {string} type - Solidity type
 * @returns {any} Parsed value
 */
export function parseInputValue(value, type) {
  if (!value && value !== 0 && value !== false) {
    throw new Error("Value is required");
  }

  // Handle arrays
  if (type.includes("[")) {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        throw new Error("Array expected");
      }
      return parsed;
    } catch (e) {
      throw new Error(`Invalid array format: ${e.message}`);
    }
  }

  // Handle tuples/structs
  if (type.startsWith("(") || type.startsWith("tuple")) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== "object") {
        throw new Error("Object expected for tuple");
      }
      return parsed;
    } catch (e) {
      throw new Error(`Invalid tuple format: ${e.message}`);
    }
  }

  // Handle basic types
  switch (type) {
    case "address":
      if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
        throw new Error("Invalid address format");
      }
      return value.toLowerCase();

    case "bool":
      if (value === "true" || value === true) return true;
      if (value === "false" || value === false) return false;
      throw new Error("Boolean must be true or false");

    case "string":
      return String(value);

    case "bytes":
      if (!/^0x[a-fA-F0-9]*$/.test(value)) {
        throw new Error("Invalid bytes format (must start with 0x)");
      }
      return value;

    default:
      // Handle uintX, intX, bytesX
      if (type.startsWith("uint") || type.startsWith("int")) {
        const num = BigInt(value);
        return num;
      }

      if (type.startsWith("bytes")) {
        if (!/^0x[a-fA-F0-9]*$/.test(value)) {
          throw new Error("Invalid bytes format");
        }
        return value;
      }

      return value;
  }
}

/**
 * Format output value for display
 * @param {any} value - Output value
 * @param {string} type - Solidity type
 * @returns {string} Formatted value
 */
export function formatOutputValue(value, type) {
  if (value === null || value === undefined) {
    return "null";
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return JSON.stringify(value, null, 2);
  }

  // Handle BigInt
  if (typeof value === "bigint") {
    return value.toString();
  }

  // Handle objects/tuples
  if (typeof value === "object") {
    return JSON.stringify(value, (key, val) =>
      typeof val === "bigint" ? val.toString() : val
    , 2);
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value.toString();
  }

  // Handle strings
  return String(value);
}

/**
 * Call a read function (view/pure)
 * @param {string} address - Contract address
 * @param {Object} func - ABI function item
 * @param {Array} args - Function arguments
 * @param {Array} abi - Full contract ABI
 * @returns {Promise<any>} Function result
 */
export async function callReadFunction(address, func, args, abi) {
  try {
    const result = await publicClient.readContract({
      address,
      abi,
      functionName: func.name,
      args,
    });

    return result;
  } catch (error) {
    console.error("Read function call failed:", error);
    throw new Error(error.message || "Failed to call read function");
  }
}

/**
 * Estimate gas for a write function
 * @param {string} address - Contract address
 * @param {Object} func - ABI function item
 * @param {Array} args - Function arguments
 * @param {Array} abi - Full contract ABI
 * @param {string} account - Caller account
 * @param {string} value - ETH value (in wei)
 * @returns {Promise<bigint>} Gas estimate
 */
export async function estimateGas(address, func, args, abi, account, value = "0") {
  try {
    const gas = await publicClient.estimateContractGas({
      address,
      abi,
      functionName: func.name,
      args,
      account,
      value: BigInt(value),
    });

    return gas;
  } catch (error) {
    console.error("Gas estimation failed:", error);
    throw new Error(error.message || "Failed to estimate gas");
  }
}

/**
 * Send a write transaction
 * @param {string} address - Contract address
 * @param {Object} func - ABI function item
 * @param {Array} args - Function arguments
 * @param {Array} abi - Full contract ABI
 * @param {string} account - Sender account
 * @param {string} value - ETH value (in wei)
 * @returns {Promise<Object>} Transaction hash and receipt
 */
export async function sendWriteTransaction(address, func, args, abi, account, value = "0") {
  try {
    const walletClient = getWalletClient();

    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    // Estimate gas first
    const gas = await estimateGas(address, func, args, abi, account, value);

    // Send transaction
    const hash = await walletClient.writeContract({
      address,
      abi,
      functionName: func.name,
      args,
      account,
      value: BigInt(value),
      gas: gas + (gas / BigInt(10)), // Add 10% buffer
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return { hash, receipt };
  } catch (error) {
    console.error("Transaction failed:", error);
    throw new Error(error.shortMessage || error.message || "Transaction failed");
  }
}

/**
 * Simulate a write function call
 * @param {string} address - Contract address
 * @param {Object} func - ABI function item
 * @param {Array} args - Function arguments
 * @param {Array} abi - Full contract ABI
 * @param {string} account - Caller account
 * @param {string} value - ETH value (in wei)
 * @returns {Promise<any>} Simulation result
 */
export async function simulateWriteFunction(address, func, args, abi, account, value = "0") {
  try {
    const { result } = await publicClient.simulateContract({
      address,
      abi,
      functionName: func.name,
      args,
      account,
      value: BigInt(value),
    });

    return result;
  } catch (error) {
    console.error("Simulation failed:", error);
    throw new Error(error.message || "Failed to simulate transaction");
  }
}

/**
 * Get default value for a Solidity type
 * @param {string} type - Solidity type
 * @returns {string} Default value
 */
export function getDefaultValue(type) {
  if (type.includes("[")) return "[]";
  if (type.startsWith("(") || type.startsWith("tuple")) return "{}";

  switch (type) {
    case "address":
      return "0x0000000000000000000000000000000000000000";
    case "bool":
      return "false";
    case "string":
      return "";
    case "bytes":
      return "0x";
    default:
      if (type.startsWith("uint") || type.startsWith("int")) {
        return "0";
      }
      if (type.startsWith("bytes")) {
        return "0x";
      }
      return "";
  }
}

/**
 * Validate input value
 * @param {string} value - Input value
 * @param {Object} input - ABI input definition
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
export function validateInput(value, input) {
  try {
    parseInputValue(value, input.type);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get input field type for HTML
 * @param {string} solidityType - Solidity type
 * @returns {string} HTML input type
 */
export function getInputFieldType(solidityType) {
  if (solidityType === "bool") return "checkbox";
  if (solidityType.startsWith("uint") || solidityType.startsWith("int")) return "number";
  if (solidityType.includes("[") || solidityType.startsWith("(") || solidityType.startsWith("tuple")) {
    return "textarea";
  }
  return "text";
}

/**
 * Check if function is payable
 * @param {Object} func - ABI function item
 * @returns {boolean}
 */
export function isPayable(func) {
  return func.stateMutability === "payable";
}

/**
 * Encode function call data
 * @param {Object} func - ABI function item
 * @param {Array} args - Function arguments
 * @param {Array} abi - Full contract ABI
 * @returns {string} Encoded calldata
 */
export function encodeFunctionCall(func, args, abi) {
  try {
    return encodeFunctionData({
      abi,
      functionName: func.name,
      args,
    });
  } catch (error) {
    throw new Error(`Failed to encode function call: ${error.message}`);
  }
}

/**
 * Decode function result
 * @param {Object} func - ABI function item
 * @param {string} data - Result data
 * @param {Array} abi - Full contract ABI
 * @returns {any} Decoded result
 */
export function decodeFunctionResultData(func, data, abi) {
  try {
    return decodeFunctionResult({
      abi,
      functionName: func.name,
      data,
    });
  } catch (error) {
    throw new Error(`Failed to decode result: ${error.message}`);
  }
}

/**
 * Get function selector (first 4 bytes of keccak256 hash)
 * @param {Object} func - ABI function item
 * @returns {string} Function selector
 */
export function getFunctionSelector(func) {
  const inputs = func.inputs || [];
  const types = inputs.map((input) => input.type).join(",");
  const signature = `${func.name}(${types})`;

  // For display purposes, we'll just return the signature
  // Actual selector calculation would require keccak256
  return signature;
}

/**
 * Format ETH value for display
 * @param {bigint|string} wei - Value in wei
 * @returns {string} Formatted ETH value
 */
export function formatEther(wei) {
  if (!wei) return "0 ETH";
  const eth = viemFormatEther(BigInt(wei));
  return `${eth} ETH`;
}

/**
 * Parse ETH value to wei
 * @param {string} eth - ETH value
 * @returns {bigint} Wei value
 */
export function parseEther(eth) {
  if (!eth || eth === "0") return BigInt(0);
  // Simple conversion (1 ETH = 1e18 wei)
  const parts = eth.split(".");
  const whole = BigInt(parts[0] || "0") * BigInt(10 ** 18);
  if (parts.length === 1) return whole;

  const decimal = parts[1].padEnd(18, "0").slice(0, 18);
  const fraction = BigInt(decimal);
  return whole + fraction;
}

/**
 * Get recent function calls from localStorage
 * @param {string} address - Contract address
 * @param {string} functionName - Function name
 * @returns {Array} Recent calls
 */
export function getRecentCalls(address, functionName) {
  try {
    const key = `furnacescout_calls_${address}_${functionName}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get recent calls:", error);
    return [];
  }
}

/**
 * Save function call to history
 * @param {string} address - Contract address
 * @param {string} functionName - Function name
 * @param {Array} args - Function arguments
 * @param {any} result - Call result
 */
export function saveCallToHistory(address, functionName, args, result) {
  try {
    const key = `furnacescout_calls_${address}_${functionName}`;
    const history = getRecentCalls(address, functionName);

    history.unshift({
      args,
      result,
      timestamp: Date.now(),
    });

    // Keep only last 10 calls
    const trimmed = history.slice(0, 10);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to save call to history:", error);
  }
}

/**
 * Clear call history for a function
 * @param {string} address - Contract address
 * @param {string} functionName - Function name
 */
export function clearCallHistory(address, functionName) {
  try {
    const key = `furnacescout_calls_${address}_${functionName}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear call history:", error);
  }
}
