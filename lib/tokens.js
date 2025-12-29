import { decodeAbiParameters, parseAbiParameters } from "viem";
import { publicClient } from "./viem";

// Standard ERC20 function signatures
const ERC20_FUNCTIONS = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
  balanceOf: "0x70a08231",
  transfer: "0xa9059cbb",
  allowance: "0xdd62ed3e",
  approve: "0x095ea7b3",
  transferFrom: "0x23b872dd",
};

// Standard ERC721 function signatures
const ERC721_FUNCTIONS = {
  balanceOf: "0x70a08231",
  ownerOf: "0x6352211e",
  safeTransferFrom: "0x42842e0e",
  transferFrom: "0x23b872dd",
  approve: "0x095ea7b3",
  setApprovalForAll: "0xa22cb465",
  getApproved: "0x081812fc",
  isApprovedForAll: "0xe985e9c5",
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  tokenURI: "0xc87b56dd",
};

// Standard ERC1155 function signatures
const ERC1155_FUNCTIONS = {
  balanceOf: "0x00fdd58e",
  balanceOfBatch: "0x4e1273f4",
  setApprovalForAll: "0xa22cb465",
  isApprovedForAll: "0xe985e9c5",
  safeTransferFrom: "0xf242432a",
  safeBatchTransferFrom: "0x2eb2c2d6",
};

// ERC165 interface IDs
const INTERFACE_IDS = {
  ERC165: "0x01ffc9a7",
  ERC20: "0x36372b07",
  ERC721: "0x80ac58cd",
  ERC721Metadata: "0x5b5e139f",
  ERC1155: "0xd9b67a26",
  ERC1155MetadataURI: "0x0e89341c",
};

/**
 * Detect if an address is a token contract and determine its type
 * @param {string} address - Contract address
 * @returns {Promise<{isToken: boolean, type: string|null, metadata: object}>}
 */
export async function detectTokenType(address) {
  try {
    // Check if it's a contract
    const code = await publicClient.getCode({ address });
    if (!code || code === "0x") {
      return { isToken: false, type: null, metadata: {} };
    }

    // Try ERC165 supportsInterface first (most reliable)
    const supportsERC165 = await checkSupportsInterface(
      address,
      INTERFACE_IDS.ERC165,
    );

    if (supportsERC165) {
      // Check ERC1155 first (most specific)
      if (await checkSupportsInterface(address, INTERFACE_IDS.ERC1155)) {
        const metadata = await getERC1155Metadata(address);
        return { isToken: true, type: "ERC1155", metadata };
      }

      // Check ERC721
      if (await checkSupportsInterface(address, INTERFACE_IDS.ERC721)) {
        const metadata = await getERC721Metadata(address);
        return { isToken: true, type: "ERC721", metadata };
      }
    }

    // Fallback to function signature detection for ERC20
    // (ERC20 doesn't have ERC165)
    const hasERC20Functions = await checkERC20Functions(address);
    if (hasERC20Functions) {
      const metadata = await getERC20Metadata(address);
      return { isToken: true, type: "ERC20", metadata };
    }

    return { isToken: false, type: null, metadata: {} };
  } catch (error) {
    console.error("Error detecting token type:", error);
    return { isToken: false, type: null, metadata: {} };
  }
}

/**
 * Check if contract supports ERC165 interface
 */
async function checkSupportsInterface(address, interfaceId) {
  try {
    const data = await publicClient.call({
      to: address,
      data: `0x01ffc9a7${interfaceId.slice(2).padStart(64, "0")}`,
    });
    return data.data && data.data !== "0x" && data.data.slice(-1) === "1";
  } catch {
    return false;
  }
}

/**
 * Check if contract has ERC20 functions
 */
async function checkERC20Functions(address) {
  try {
    // Check for essential ERC20 functions
    const checks = await Promise.all([
      publicClient.call({
        to: address,
        data: ERC20_FUNCTIONS.totalSupply,
      }),
      publicClient.call({
        to: address,
        data: ERC20_FUNCTIONS.decimals,
      }),
    ]);

    return checks.every((result) => result.data && result.data !== "0x");
  } catch {
    return false;
  }
}

/**
 * Get ERC20 token metadata
 */
async function getERC20Metadata(address) {
  const metadata = {};

  try {
    // Name
    const nameResult = await publicClient.call({
      to: address,
      data: ERC20_FUNCTIONS.name,
    });
    if (nameResult.data && nameResult.data !== "0x") {
      try {
        const decoded = decodeAbiParameters(
          parseAbiParameters("string"),
          nameResult.data,
        );
        metadata.name = decoded[0];
      } catch {
        metadata.name = "Unknown";
      }
    }

    // Symbol
    const symbolResult = await publicClient.call({
      to: address,
      data: ERC20_FUNCTIONS.symbol,
    });
    if (symbolResult.data && symbolResult.data !== "0x") {
      try {
        const decoded = decodeAbiParameters(
          parseAbiParameters("string"),
          symbolResult.data,
        );
        metadata.symbol = decoded[0];
      } catch {
        metadata.symbol = "???";
      }
    }

    // Decimals
    const decimalsResult = await publicClient.call({
      to: address,
      data: ERC20_FUNCTIONS.decimals,
    });
    if (decimalsResult.data && decimalsResult.data !== "0x") {
      try {
        const decoded = decodeAbiParameters(
          parseAbiParameters("uint8"),
          decimalsResult.data,
        );
        metadata.decimals = Number(decoded[0]);
      } catch {
        metadata.decimals = 18;
      }
    }

    // Total Supply
    const supplyResult = await publicClient.call({
      to: address,
      data: ERC20_FUNCTIONS.totalSupply,
    });
    if (supplyResult.data && supplyResult.data !== "0x") {
      try {
        const decoded = decodeAbiParameters(
          parseAbiParameters("uint256"),
          supplyResult.data,
        );
        metadata.totalSupply = decoded[0].toString();
      } catch {
        metadata.totalSupply = "0";
      }
    }
  } catch (error) {
    console.error("Error fetching ERC20 metadata:", error);
  }

  return metadata;
}

/**
 * Get ERC721 token metadata
 */
async function getERC721Metadata(address) {
  const metadata = {};

  try {
    // Name
    const nameResult = await publicClient.call({
      to: address,
      data: ERC721_FUNCTIONS.name,
    });
    if (nameResult.data && nameResult.data !== "0x") {
      try {
        const decoded = decodeAbiParameters(
          parseAbiParameters("string"),
          nameResult.data,
        );
        metadata.name = decoded[0];
      } catch {
        metadata.name = "Unknown";
      }
    }

    // Symbol
    const symbolResult = await publicClient.call({
      to: address,
      data: ERC721_FUNCTIONS.symbol,
    });
    if (symbolResult.data && symbolResult.data !== "0x") {
      try {
        const decoded = decodeAbiParameters(
          parseAbiParameters("string"),
          symbolResult.data,
        );
        metadata.symbol = decoded[0];
      } catch {
        metadata.symbol = "NFT";
      }
    }
  } catch (error) {
    console.error("Error fetching ERC721 metadata:", error);
  }

  return metadata;
}

/**
 * Get ERC1155 token metadata
 */
async function getERC1155Metadata(address) {
  const metadata = {};

  try {
    // ERC1155 doesn't have standard name/symbol, but some implement it
    // Try to get name and symbol anyway
    try {
      const nameResult = await publicClient.call({
        to: address,
        data: "0x06fdde03", // name()
      });
      if (nameResult.data && nameResult.data !== "0x") {
        const decoded = decodeAbiParameters(
          parseAbiParameters("string"),
          nameResult.data,
        );
        metadata.name = decoded[0];
      }
    } catch {
      metadata.name = "ERC1155 Collection";
    }

    try {
      const symbolResult = await publicClient.call({
        to: address,
        data: "0x95d89b41", // symbol()
      });
      if (symbolResult.data && symbolResult.data !== "0x") {
        const decoded = decodeAbiParameters(
          parseAbiParameters("string"),
          symbolResult.data,
        );
        metadata.symbol = decoded[0];
      }
    } catch {
      metadata.symbol = "ERC1155";
    }
  } catch (error) {
    console.error("Error fetching ERC1155 metadata:", error);
  }

  return metadata;
}

/**
 * Get ERC20 token balance for an address
 */
export async function getERC20Balance(tokenAddress, holderAddress) {
  try {
    const data = `${ERC20_FUNCTIONS.balanceOf}${holderAddress.slice(2).padStart(64, "0")}`;
    const result = await publicClient.call({
      to: tokenAddress,
      data,
    });

    if (result.data && result.data !== "0x") {
      const decoded = decodeAbiParameters(
        parseAbiParameters("uint256"),
        result.data,
      );
      return decoded[0];
    }
    return 0n;
  } catch (error) {
    console.error("Error fetching ERC20 balance:", error);
    return 0n;
  }
}

/**
 * Get ERC721 token balance for an address
 */
export async function getERC721Balance(tokenAddress, holderAddress) {
  try {
    const data = `${ERC721_FUNCTIONS.balanceOf}${holderAddress.slice(2).padStart(64, "0")}`;
    const result = await publicClient.call({
      to: tokenAddress,
      data,
    });

    if (result.data && result.data !== "0x") {
      const decoded = decodeAbiParameters(
        parseAbiParameters("uint256"),
        result.data,
      );
      return decoded[0];
    }
    return 0n;
  } catch (error) {
    console.error("Error fetching ERC721 balance:", error);
    return 0n;
  }
}

/**
 * Get ERC1155 token balance for an address and token ID
 */
export async function getERC1155Balance(tokenAddress, holderAddress, tokenId) {
  try {
    const data = `${ERC1155_FUNCTIONS.balanceOf}${holderAddress.slice(2).padStart(64, "0")}${tokenId.toString(16).padStart(64, "0")}`;
    const result = await publicClient.call({
      to: tokenAddress,
      data,
    });

    if (result.data && result.data !== "0x") {
      const decoded = decodeAbiParameters(
        parseAbiParameters("uint256"),
        result.data,
      );
      return decoded[0];
    }
    return 0n;
  } catch (error) {
    console.error("Error fetching ERC1155 balance:", error);
    return 0n;
  }
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount, decimals = 18) {
  if (!amount) return "0";
  const divisor = BigInt(10) ** BigInt(decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (fractionalPart === 0n) {
    return wholePart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const trimmed = fractionalStr.replace(/0+$/, "");
  return `${wholePart}.${trimmed}`;
}

/**
 * Parse token transfers from transaction logs
 */
export function parseTokenTransfers(logs) {
  const transfers = [];

  // ERC20 Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
  const ERC20_TRANSFER_TOPIC =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  // ERC721 Transfer event: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
  // Same signature as ERC20

  // ERC1155 TransferSingle: TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)
  const ERC1155_TRANSFER_SINGLE_TOPIC =
    "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";

  // ERC1155 TransferBatch: TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)
  const ERC1155_TRANSFER_BATCH_TOPIC =
    "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";

  for (const log of logs) {
    if (!log.topics || log.topics.length === 0) continue;

    const topic = log.topics[0];

    if (topic === ERC20_TRANSFER_TOPIC && log.topics.length === 3) {
      // ERC20 or ERC721 Transfer
      try {
        const from = `0x${log.topics[1].slice(-40)}`;
        const to = `0x${log.topics[2].slice(-40)}`;
        const value = BigInt(log.data);

        transfers.push({
          type: value > 1000000000000000000000000n ? "ERC20" : "ERC20/721", // Heuristic
          token: log.address,
          from,
          to,
          value: value.toString(),
          tokenId: value < 1000000n ? value.toString() : null, // Could be ERC721 tokenId
          logIndex: log.logIndex,
        });
      } catch (error) {
        console.error("Error parsing transfer:", error);
      }
    } else if (topic === ERC1155_TRANSFER_SINGLE_TOPIC) {
      // ERC1155 TransferSingle
      try {
        const operator = `0x${log.topics[1].slice(-40)}`;
        const from = `0x${log.topics[2].slice(-40)}`;
        const to = `0x${log.topics[3].slice(-40)}`;

        // Data contains id and value
        const dataParams = decodeAbiParameters(
          parseAbiParameters("uint256, uint256"),
          log.data,
        );
        const tokenId = dataParams[0];
        const value = dataParams[1];

        transfers.push({
          type: "ERC1155",
          token: log.address,
          from,
          to,
          operator,
          tokenId: tokenId.toString(),
          value: value.toString(),
          logIndex: log.logIndex,
        });
      } catch (error) {
        console.error("Error parsing ERC1155 transfer:", error);
      }
    } else if (topic === ERC1155_TRANSFER_BATCH_TOPIC) {
      // ERC1155 TransferBatch
      try {
        const operator = `0x${log.topics[1].slice(-40)}`;
        const from = `0x${log.topics[2].slice(-40)}`;
        const to = `0x${log.topics[3].slice(-40)}`;

        // Data contains ids and values arrays
        const dataParams = decodeAbiParameters(
          parseAbiParameters("uint256[], uint256[]"),
          log.data,
        );
        const tokenIds = dataParams[0];
        const values = dataParams[1];

        transfers.push({
          type: "ERC1155_BATCH",
          token: log.address,
          from,
          to,
          operator,
          tokenIds: tokenIds.map((id) => id.toString()),
          values: values.map((v) => v.toString()),
          logIndex: log.logIndex,
        });
      } catch (error) {
        console.error("Error parsing ERC1155 batch transfer:", error);
      }
    }
  }

  return transfers;
}

/**
 * Get all token balances for an address
 * Note: This requires knowing which tokens to check
 * In practice, you'd track token interactions from transaction history
 */
export async function getTokenBalances(address, tokenAddresses) {
  const balances = [];

  for (const tokenAddress of tokenAddresses) {
    try {
      const tokenInfo = await detectTokenType(tokenAddress);

      if (!tokenInfo.isToken) continue;

      if (tokenInfo.type === "ERC20") {
        const balance = await getERC20Balance(tokenAddress, address);
        if (balance > 0n) {
          balances.push({
            type: "ERC20",
            token: tokenAddress,
            balance: balance.toString(),
            metadata: tokenInfo.metadata,
          });
        }
      } else if (tokenInfo.type === "ERC721") {
        const balance = await getERC721Balance(tokenAddress, address);
        if (balance > 0n) {
          balances.push({
            type: "ERC721",
            token: tokenAddress,
            balance: balance.toString(),
            metadata: tokenInfo.metadata,
          });
        }
      }
      // ERC1155 requires token IDs, so we'd need to track those separately
    } catch (error) {
      console.error(`Error fetching balance for token ${tokenAddress}:`, error);
    }
  }

  return balances;
}

/**
 * Extract unique token addresses from transaction history
 */
export function extractTokenAddresses(transactions) {
  const tokenSet = new Set();

  for (const tx of transactions) {
    if (tx.logs && Array.isArray(tx.logs)) {
      const transfers = parseTokenTransfers(tx.logs);
      for (const transfer of transfers) {
        tokenSet.add(transfer.token.toLowerCase());
      }
    }
  }

  return Array.from(tokenSet);
}
