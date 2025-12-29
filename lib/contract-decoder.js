import { decodeEventLog, decodeFunctionData } from "viem";
import { getABI } from "./abi-store";

export function decodeTransactionInput(input, contractAddress) {
  if (!input || input === "0x") {
    return null;
  }

  const abiData = getABI(contractAddress);
  if (!abiData) {
    return {
      error: "No ABI available for this contract",
      raw: input,
    };
  }

  try {
    const decoded = decodeFunctionData({
      abi: abiData.abi,
      data: input,
    });

    return {
      functionName: decoded.functionName,
      args: decoded.args,
      abi: abiData.abi,
      contractName: abiData.name,
    };
  } catch (error) {
    return {
      error: `Failed to decode: ${error.message}`,
      raw: input,
    };
  }
}

export function decodeLogs(logs) {
  return logs.map((log) => {
    const abiData = getABI(log.address);

    if (!abiData) {
      return {
        ...log,
        decoded: null,
        error: "No ABI available",
      };
    }

    // Try to decode with each event in the ABI
    for (const item of abiData.abi) {
      if (item.type !== "event") continue;

      try {
        const decoded = decodeEventLog({
          abi: [item],
          data: log.data,
          topics: log.topics,
        });

        return {
          ...log,
          decoded: {
            eventName: decoded.eventName,
            args: decoded.args,
          },
          contractName: abiData.name,
        };
      } catch (_e) {}
    }

    return {
      ...log,
      decoded: null,
      error: "Could not decode event",
    };
  });
}

export function getFunctionSignature(abi, functionName) {
  const func = abi.find(
    (item) => item.type === "function" && item.name === functionName,
  );

  if (!func) return null;

  return func;
}
