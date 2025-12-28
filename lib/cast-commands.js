// Cast command generation utilities for FurnaceScout

/**
 * Generate a cast call command for read-only contract functions
 * @param {string} contractAddress - Contract address
 * @param {string} functionSignature - Function signature (e.g., "balanceOf(address)")
 * @param {Array} args - Function arguments
 * @param {string} rpcUrl - RPC URL (optional)
 * @returns {string} Cast command
 */
export function generateCastCall(
  contractAddress,
  functionSignature,
  args = [],
  rpcUrl = "http://127.0.0.1:8545"
) {
  let command = `cast call ${contractAddress} "${functionSignature}"`;

  // Add arguments
  if (args && args.length > 0) {
    const formattedArgs = args
      .map((arg) => {
        // Handle different types
        if (typeof arg === "string") {
          // Check if it's already quoted or is an address/hex
          if (arg.startsWith("0x") || arg.startsWith('"')) {
            return arg;
          }
          return `"${arg}"`;
        }
        return arg.toString();
      })
      .join(" ");
    command += ` ${formattedArgs}`;
  }

  // Add RPC URL
  command += ` --rpc-url ${rpcUrl}`;

  return command;
}

/**
 * Generate a cast send command for write functions
 * @param {string} contractAddress - Contract address
 * @param {string} functionSignature - Function signature
 * @param {Array} args - Function arguments
 * @param {Object} options - Additional options
 * @returns {string} Cast command
 */
export function generateCastSend(contractAddress, functionSignature, args = [], options = {}) {
  const {
    privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    value = null,
    gasLimit = null,
    gasPrice = null,
    rpcUrl = "http://127.0.0.1:8545",
  } = options;

  let command = `cast send ${contractAddress} "${functionSignature}"`;

  // Add arguments
  if (args && args.length > 0) {
    const formattedArgs = args
      .map((arg) => {
        if (typeof arg === "string") {
          if (arg.startsWith("0x") || arg.startsWith('"')) {
            return arg;
          }
          return `"${arg}"`;
        }
        return arg.toString();
      })
      .join(" ");
    command += ` ${formattedArgs}`;
  }

  // Add value if sending ETH
  if (value && value !== "0" && value !== "0x0") {
    command += ` --value ${value}`;
  }

  // Add gas limit
  if (gasLimit) {
    command += ` --gas-limit ${gasLimit}`;
  }

  // Add gas price
  if (gasPrice) {
    command += ` --gas-price ${gasPrice}`;
  }

  // Add private key
  command += ` --private-key ${privateKey}`;

  // Add RPC URL
  command += ` --rpc-url ${rpcUrl}`;

  return command;
}

/**
 * Generate a cast balance command
 * @param {string} address - Address to check
 * @param {string} rpcUrl - RPC URL
 * @returns {string} Cast command
 */
export function generateCastBalance(address, rpcUrl = "http://127.0.0.1:8545") {
  return `cast balance ${address} --rpc-url ${rpcUrl}`;
}

/**
 * Generate a cast code command to check contract bytecode
 * @param {string} address - Contract address
 * @param {string} rpcUrl - RPC URL
 * @returns {string} Cast command
 */
export function generateCastCode(address, rpcUrl = "http://127.0.0.1:8545") {
  return `cast code ${address} --rpc-url ${rpcUrl}`;
}

/**
 * Generate a cast storage command to read storage slot
 * @param {string} address - Contract address
 * @param {string} slot - Storage slot (hex)
 * @param {string} rpcUrl - RPC URL
 * @returns {string} Cast command
 */
export function generateCastStorage(address, slot, rpcUrl = "http://127.0.0.1:8545") {
  return `cast storage ${address} ${slot} --rpc-url ${rpcUrl}`;
}

/**
 * Generate a cast receipt command to get transaction receipt
 * @param {string} txHash - Transaction hash
 * @param {string} rpcUrl - RPC URL
 * @returns {string} Cast command
 */
export function generateCastReceipt(txHash, rpcUrl = "http://127.0.0.1:8545") {
  return `cast receipt ${txHash} --rpc-url ${rpcUrl}`;
}

/**
 * Generate a cast tx command to get transaction details
 * @param {string} txHash - Transaction hash
 * @param {string} rpcUrl - RPC URL
 * @returns {string} Cast command
 */
export function generateCastTx(txHash, rpcUrl = "http://127.0.0.1:8545") {
  return `cast tx ${txHash} --rpc-url ${rpcUrl}`;
}

/**
 * Generate a cast block command
 * @param {string|number} blockNumber - Block number or 'latest'
 * @param {string} rpcUrl - RPC URL
 * @returns {string} Cast command
 */
export function generateCastBlock(blockNumber, rpcUrl = "http://127.0.0.1:8545") {
  return `cast block ${blockNumber} --rpc-url ${rpcUrl}`;
}

/**
 * Generate a cast estimate command to estimate gas
 * @param {string} contractAddress - Contract address
 * @param {string} functionSignature - Function signature
 * @param {Array} args - Function arguments
 * @param {Object} options - Additional options
 * @returns {string} Cast command
 */
export function generateCastEstimate(contractAddress, functionSignature, args = [], options = {}) {
  const { from, value, rpcUrl = "http://127.0.0.1:8545" } = options;

  let command = `cast estimate ${contractAddress} "${functionSignature}"`;

  // Add arguments
  if (args && args.length > 0) {
    const formattedArgs = args
      .map((arg) => {
        if (typeof arg === "string") {
          if (arg.startsWith("0x") || arg.startsWith('"')) {
            return arg;
          }
          return `"${arg}"`;
        }
        return arg.toString();
      })
      .join(" ");
    command += ` ${formattedArgs}`;
  }

  // Add from address
  if (from) {
    command += ` --from ${from}`;
  }

  // Add value
  if (value && value !== "0" && value !== "0x0") {
    command += ` --value ${value}`;
  }

  // Add RPC URL
  command += ` --rpc-url ${rpcUrl}`;

  return command;
}

/**
 * Generate a cast abi-encode command
 * @param {string} functionSignature - Function signature
 * @param {Array} args - Arguments to encode
 * @returns {string} Cast command
 */
export function generateCastAbiEncode(functionSignature, args = []) {
  let command = `cast abi-encode "${functionSignature}"`;

  if (args && args.length > 0) {
    const formattedArgs = args
      .map((arg) => {
        if (typeof arg === "string") {
          if (arg.startsWith("0x") || arg.startsWith('"')) {
            return arg;
          }
          return `"${arg}"`;
        }
        return arg.toString();
      })
      .join(" ");
    command += ` ${formattedArgs}`;
  }

  return command;
}

/**
 * Generate a cast abi-decode command
 * @param {string} functionSignature - Function signature or types
 * @param {string} data - Hex data to decode
 * @returns {string} Cast command
 */
export function generateCastAbiDecode(functionSignature, data) {
  return `cast abi-decode "${functionSignature}" ${data}`;
}

/**
 * Generate a cast sig command to get function selector
 * @param {string} functionSignature - Function signature
 * @returns {string} Cast command
 */
export function generateCastSig(functionSignature) {
  return `cast sig "${functionSignature}"`;
}

/**
 * Generate a cast keccak command
 * @param {string} data - Data to hash
 * @returns {string} Cast command
 */
export function generateCastKeccak(data) {
  return `cast keccak "${data}"`;
}

/**
 * Generate a cast --to-base command for number conversion
 * @param {string} value - Value to convert
 * @param {string} fromBase - Source base (dec, hex, etc.)
 * @param {string} toBase - Target base (dec, hex, etc.)
 * @returns {string} Cast command
 */
export function generateCastToBase(value, fromBase = "hex", toBase = "dec") {
  return `cast --to-base ${value} ${toBase}`;
}

/**
 * Generate a cast --to-wei command
 * @param {string} value - Value in ether
 * @param {string} unit - Unit (ether, gwei, etc.)
 * @returns {string} Cast command
 */
export function generateCastToWei(value, unit = "ether") {
  return `cast --to-wei ${value} ${unit}`;
}

/**
 * Generate a cast --from-wei command
 * @param {string} value - Value in wei
 * @param {string} unit - Target unit (ether, gwei, etc.)
 * @returns {string} Cast command
 */
export function generateCastFromWei(value, unit = "ether") {
  return `cast --from-wei ${value} ${unit}`;
}

/**
 * Get Anvil test account private keys
 * @returns {Array} Array of account objects with address and private key
 */
export function getAnvilAccounts() {
  return [
    {
      index: 0,
      address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      privateKey:
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    },
    {
      index: 1,
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      privateKey:
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    },
    {
      index: 2,
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      privateKey:
        "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    },
    {
      index: 3,
      address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      privateKey:
        "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    },
    {
      index: 4,
      address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      privateKey:
        "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
    },
  ];
}

/**
 * Parse function signature to get function name and parameters
 * @param {string} signature - Function signature
 * @returns {Object} Parsed signature { name, params }
 */
export function parseFunctionSignature(signature) {
  const match = signature.match(/^(\w+)\((.*)\)$/);
  if (!match) {
    throw new Error("Invalid function signature");
  }

  const [, name, paramsStr] = match;
  const params = paramsStr ? paramsStr.split(",").map((p) => p.trim()) : [];

  return { name, params };
}
