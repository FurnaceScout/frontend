"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import {
  parseABI,
  getFunctionSignature,
  parseInputValue,
  formatOutputValue,
  callReadFunction,
  estimateGas,
  sendWriteTransaction,
  simulateWriteFunction,
  getDefaultValue,
  validateInput,
  getInputFieldType,
  isPayable,
  formatEther,
  parseEther,
  getRecentCalls,
  saveCallToHistory,
  clearCallHistory,
} from "@/lib/contract-interaction";

export default function ContractInteraction({ address, abiData }) {
  const [parsedABI, setParsedABI] = useState({
    read: [],
    write: [],
    events: [],
  });
  const [activeTab, setActiveTab] = useState("read");
  const [expandedFunctions, setExpandedFunctions] = useState({});
  const [inputs, setInputs] = useState({});
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [gasEstimates, setGasEstimates] = useState({});
  const [callHistory, setCallHistory] = useState({});
  const [showHistory, setShowHistory] = useState({});
  const [ethValues, setEthValues] = useState({});

  const { address: walletAddress, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Parse ABI on mount or when it changes
  useEffect(() => {
    if (abiData?.abi) {
      const parsed = parseABI(abiData.abi);
      setParsedABI(parsed);

      // Default to read tab if available, otherwise write
      if (parsed.read.length > 0) {
        setActiveTab("read");
      } else if (parsed.write.length > 0) {
        setActiveTab("write");
      }
    }
  }, [abiData]);

  // Load call history for functions
  useEffect(() => {
    const history = {};
    [...parsedABI.read, ...parsedABI.write].forEach((func) => {
      history[func.name] = getRecentCalls(address, func.name);
    });
    setCallHistory(history);
  }, [address, parsedABI]);

  function toggleFunction(functionName) {
    setExpandedFunctions((prev) => ({
      ...prev,
      [functionName]: !prev[functionName],
    }));
  }

  function handleInputChange(functionName, inputName, value) {
    setInputs((prev) => ({
      ...prev,
      [functionName]: {
        ...prev[functionName],
        [inputName]: value,
      },
    }));

    // Clear error for this input
    setErrors((prev) => ({
      ...prev,
      [`${functionName}_${inputName}`]: null,
    }));
  }

  function handleEthValueChange(functionName, value) {
    setEthValues((prev) => ({
      ...prev,
      [functionName]: value,
    }));
  }

  function getInputValue(functionName, inputName, defaultVal = "") {
    return inputs[functionName]?.[inputName] ?? defaultVal;
  }

  function getEthValue(functionName) {
    return ethValues[functionName] ?? "0";
  }

  async function handleReadFunction(func) {
    const functionName = func.name;
    setLoading((prev) => ({ ...prev, [functionName]: true }));
    setErrors((prev) => ({ ...prev, [functionName]: null }));
    setResults((prev) => ({ ...prev, [functionName]: null }));

    try {
      // Validate and parse inputs
      const args = [];
      for (const input of func.inputs || []) {
        const value = getInputValue(functionName, input.name);
        const validation = validateInput(value, input);

        if (!validation.valid) {
          throw new Error(`Invalid ${input.name}: ${validation.error}`);
        }

        const parsed = parseInputValue(value, input.type);
        args.push(parsed);
      }

      // Call read function
      const result = await callReadFunction(address, func, args, abiData.abi);

      setResults((prev) => ({
        ...prev,
        [functionName]: {
          success: true,
          data: result,
          args,
        },
      }));

      // Save to history
      saveCallToHistory(address, functionName, args, result);

      // Reload history
      setCallHistory((prev) => ({
        ...prev,
        [functionName]: getRecentCalls(address, functionName),
      }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [functionName]: error.message || "Failed to call function",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [functionName]: false }));
    }
  }

  async function handleEstimateGas(func) {
    const functionName = func.name;

    if (!isConnected) {
      alert("Please connect wallet to estimate gas");
      return;
    }

    setLoading((prev) => ({ ...prev, [`${functionName}_gas`]: true }));
    setErrors((prev) => ({ ...prev, [`${functionName}_gas`]: null }));

    try {
      // Validate and parse inputs
      const args = [];
      for (const input of func.inputs || []) {
        const value = getInputValue(functionName, input.name);
        const validation = validateInput(value, input);

        if (!validation.valid) {
          throw new Error(`Invalid ${input.name}: ${validation.error}`);
        }

        const parsed = parseInputValue(value, input.type);
        args.push(parsed);
      }

      // Parse ETH value
      const ethValue = getEthValue(functionName);
      const weiValue = ethValue ? parseEther(ethValue).toString() : "0";

      // Estimate gas
      const gas = await estimateGas(
        address,
        func,
        args,
        abiData.abi,
        walletAddress,
        weiValue,
      );

      setGasEstimates((prev) => ({
        ...prev,
        [functionName]: gas.toString(),
      }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [`${functionName}_gas`]: error.message || "Failed to estimate gas",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [`${functionName}_gas`]: false }));
    }
  }

  async function handleSimulate(func) {
    const functionName = func.name;

    if (!isConnected) {
      alert("Please connect wallet to simulate");
      return;
    }

    setLoading((prev) => ({ ...prev, [`${functionName}_sim`]: true }));
    setErrors((prev) => ({ ...prev, [`${functionName}_sim`]: null }));

    try {
      // Validate and parse inputs
      const args = [];
      for (const input of func.inputs || []) {
        const value = getInputValue(functionName, input.name);
        const validation = validateInput(value, input);

        if (!validation.valid) {
          throw new Error(`Invalid ${input.name}: ${validation.error}`);
        }

        const parsed = parseInputValue(value, input.type);
        args.push(parsed);
      }

      // Parse ETH value
      const ethValue = getEthValue(functionName);
      const weiValue = ethValue ? parseEther(ethValue).toString() : "0";

      // Simulate
      const result = await simulateWriteFunction(
        address,
        func,
        args,
        abiData.abi,
        walletAddress,
        weiValue,
      );

      setResults((prev) => ({
        ...prev,
        [`${functionName}_sim`]: {
          success: true,
          data: result,
          args,
        },
      }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [`${functionName}_sim`]: error.message || "Simulation failed",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [`${functionName}_sim`]: false }));
    }
  }

  async function handleWriteFunction(func) {
    const functionName = func.name;

    if (!isConnected) {
      alert("Please connect wallet first");
      return;
    }

    setLoading((prev) => ({ ...prev, [functionName]: true }));
    setErrors((prev) => ({ ...prev, [functionName]: null }));
    setResults((prev) => ({ ...prev, [functionName]: null }));

    try {
      // Validate and parse inputs
      const args = [];
      for (const input of func.inputs || []) {
        const value = getInputValue(functionName, input.name);
        const validation = validateInput(value, input);

        if (!validation.valid) {
          throw new Error(`Invalid ${input.name}: ${validation.error}`);
        }

        const parsed = parseInputValue(value, input.type);
        args.push(parsed);
      }

      // Parse ETH value
      const ethValue = getEthValue(functionName);
      const weiValue = ethValue ? parseEther(ethValue).toString() : "0";

      // Send transaction
      const { hash, receipt } = await sendWriteTransaction(
        address,
        func,
        args,
        abiData.abi,
        walletAddress,
        weiValue,
      );

      setResults((prev) => ({
        ...prev,
        [functionName]: {
          success: true,
          hash,
          receipt,
          args,
        },
      }));

      // Save to history
      saveCallToHistory(address, functionName, args, {
        hash,
        status: receipt.status,
      });

      // Reload history
      setCallHistory((prev) => ({
        ...prev,
        [functionName]: getRecentCalls(address, functionName),
      }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [functionName]: error.message || "Transaction failed",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [functionName]: false }));
    }
  }

  function handleLoadFromHistory(functionName, historyItem) {
    const newInputs = {};
    historyItem.args.forEach((arg, idx) => {
      const func = [...parsedABI.read, ...parsedABI.write].find(
        (f) => f.name === functionName,
      );
      if (func && func.inputs[idx]) {
        newInputs[func.inputs[idx].name] = String(arg);
      }
    });

    setInputs((prev) => ({
      ...prev,
      [functionName]: newInputs,
    }));

    setShowHistory((prev) => ({
      ...prev,
      [functionName]: false,
    }));
  }

  function handleClearHistory(functionName) {
    if (confirm(`Clear call history for ${functionName}?`)) {
      clearCallHistory(address, functionName);
      setCallHistory((prev) => ({
        ...prev,
        [functionName]: [],
      }));
    }
  }

  function renderInputField(func, input) {
    const functionName = func.name;
    const inputName = input.name;
    const value = getInputValue(
      functionName,
      inputName,
      getDefaultValue(input.type),
    );
    const fieldType = getInputFieldType(input.type);
    const errorKey = `${functionName}_${inputName}`;

    if (fieldType === "checkbox") {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value === "true" || value === true}
            onChange={(e) =>
              handleInputChange(
                functionName,
                inputName,
                String(e.target.checked),
              )
            }
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-400">
            {value === "true" || value === true ? "true" : "false"}
          </span>
        </div>
      );
    }

    if (fieldType === "textarea") {
      return (
        <textarea
          value={value}
          onChange={(e) =>
            handleInputChange(functionName, inputName, e.target.value)
          }
          placeholder={`Enter ${input.type} (JSON format)`}
          className={`w-full px-3 py-2 bg-gray-800 border rounded font-mono text-sm ${
            errors[errorKey] ? "border-red-500" : "border-gray-700"
          }`}
          rows={3}
        />
      );
    }

    return (
      <input
        type={fieldType}
        value={value}
        onChange={(e) =>
          handleInputChange(functionName, inputName, e.target.value)
        }
        placeholder={`Enter ${input.type}`}
        className={`w-full px-3 py-2 bg-gray-800 border rounded font-mono text-sm ${
          errors[errorKey] ? "border-red-500" : "border-gray-700"
        }`}
      />
    );
  }

  function renderFunctionCard(func, isWrite = false) {
    const functionName = func.name;
    const isExpanded = expandedFunctions[functionName];
    const result = results[functionName];
    const error = errors[functionName];
    const isLoading = loading[functionName];
    const gasEstimate = gasEstimates[functionName];
    const hasHistory = callHistory[functionName]?.length > 0;
    const showHistoryPanel = showHistory[functionName];

    return (
      <div
        key={functionName}
        className="border border-gray-700 rounded-lg bg-gray-800/50"
      >
        {/* Function Header */}
        <button
          type="button"
          onClick={() => toggleFunction(functionName)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2 py-1 rounded font-semibold ${
                isWrite ? "bg-red-600 text-white" : "bg-blue-600 text-white"
              }`}
            >
              {isWrite ? "WRITE" : "READ"}
            </span>
            <span className="font-mono font-medium">{functionName}</span>
            {isPayable(func) && (
              <span className="text-xs px-2 py-1 bg-yellow-600 text-white rounded font-semibold">
                PAYABLE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasHistory && (
              <span className="text-xs text-gray-400">
                {callHistory[functionName].length} calls
              </span>
            )}
            <span
              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </div>
        </button>

        {/* Function Body */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Function Signature */}
            <div className="text-xs text-gray-400 font-mono bg-gray-900 p-2 rounded overflow-x-auto">
              {getFunctionSignature(func)}
            </div>

            {/* Inputs */}
            {func.inputs && func.inputs.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-300">
                  Parameters
                </div>
                {func.inputs.map((input, idx) => (
                  <div key={idx}>
                    <label className="block text-sm text-gray-400 mb-1">
                      {input.name || `param${idx}`}{" "}
                      <span className="text-gray-500">({input.type})</span>
                    </label>
                    {renderInputField(func, input)}
                    {errors[`${functionName}_${input.name}`] && (
                      <div className="text-xs text-red-400 mt-1">
                        {errors[`${functionName}_${input.name}`]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ETH Value (for payable functions) */}
            {isPayable(func) && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  ETH Value <span className="text-gray-500">(ether)</span>
                </label>
                <input
                  type="text"
                  value={getEthValue(functionName)}
                  onChange={(e) =>
                    handleEthValueChange(functionName, e.target.value)
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded font-mono text-sm"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {isWrite ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSimulate(func)}
                    disabled={!isConnected || loading[`${functionName}_sim`]}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors text-sm font-semibold"
                  >
                    {loading[`${functionName}_sim`]
                      ? "Simulating..."
                      : "Simulate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEstimateGas(func)}
                    disabled={!isConnected || loading[`${functionName}_gas`]}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded transition-colors text-sm font-semibold"
                  >
                    {loading[`${functionName}_gas`]
                      ? "Estimating..."
                      : "Estimate Gas"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWriteFunction(func)}
                    disabled={!isConnected || isLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded transition-colors text-sm font-semibold"
                  >
                    {isLoading ? "Sending..." : "Write"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleReadFunction(func)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors text-sm font-semibold"
                >
                  {isLoading ? "Calling..." : "Query"}
                </button>
              )}

              {hasHistory && (
                <button
                  type="button"
                  onClick={() =>
                    setShowHistory((prev) => ({
                      ...prev,
                      [functionName]: !prev[functionName],
                    }))
                  }
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm font-semibold"
                >
                  {showHistoryPanel ? "Hide" : "Show"} History
                </button>
              )}
            </div>

            {/* Gas Estimate */}
            {gasEstimate && (
              <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                <div className="text-sm font-semibold text-yellow-400">
                  Gas Estimate
                </div>
                <div className="text-sm text-gray-300 font-mono">
                  {Number(gasEstimate).toLocaleString()} gas
                </div>
              </div>
            )}

            {errors[`${functionName}_gas`] && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
                {errors[`${functionName}_gas`]}
              </div>
            )}

            {/* Simulation Result */}
            {results[`${functionName}_sim`] && (
              <div className="p-3 bg-purple-900/20 border border-purple-700 rounded">
                <div className="text-sm font-semibold text-purple-400 mb-2">
                  Simulation Result
                </div>
                <div className="text-sm text-gray-300 font-mono break-all">
                  {formatOutputValue(
                    results[`${functionName}_sim`].data,
                    func.outputs?.[0]?.type || "unknown",
                  )}
                </div>
              </div>
            )}

            {errors[`${functionName}_sim`] && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
                {errors[`${functionName}_sim`]}
              </div>
            )}

            {/* Result */}
            {result && (
              <div
                className={`p-3 border rounded ${
                  result.success
                    ? "bg-green-900/20 border-green-700"
                    : "bg-red-900/20 border-red-700"
                }`}
              >
                <div
                  className={`text-sm font-semibold mb-2 ${
                    result.success ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {result.success ? "Success" : "Error"}
                </div>

                {result.success && isWrite ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-400">Transaction Hash:</span>
                      <a
                        href={`/tx/${result.hash}`}
                        className="ml-2 text-blue-400 hover:text-blue-300 font-mono"
                      >
                        {result.hash?.slice(0, 10)}...{result.hash?.slice(-8)}
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span
                        className={`ml-2 font-semibold ${
                          result.receipt?.status === "success"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {result.receipt?.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Gas Used:</span>
                      <span className="ml-2 text-gray-300 font-mono">
                        {result.receipt?.gasUsed?.toString()}
                      </span>
                    </div>
                  </div>
                ) : result.success ? (
                  <div className="text-sm text-gray-300 font-mono break-all">
                    {formatOutputValue(
                      result.data,
                      func.outputs?.[0]?.type || "unknown",
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Call History */}
            {showHistoryPanel && hasHistory && (
              <div className="p-3 bg-gray-900 border border-gray-700 rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-300">
                    Call History
                  </div>
                  <button
                    type="button"
                    onClick={() => handleClearHistory(functionName)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {callHistory[functionName].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-gray-800 rounded text-xs border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleLoadFromHistory(functionName, item)
                          }
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Load
                        </button>
                      </div>
                      <div className="text-gray-300 font-mono break-all">
                        Args: {JSON.stringify(item.args)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (!abiData?.abi) {
    return (
      <div className="p-8 text-center text-gray-400">
        No ABI available for this contract. Upload an ABI to enable interaction.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Contract Interaction</h2>

        {/* Wallet Connection */}
        <div>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-900/20 text-green-400 rounded-full text-sm font-mono border border-green-700">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
              <button
                type="button"
                onClick={() => disconnect()}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => connect({ connector: injected() })}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors font-semibold"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      {!isConnected && parsedABI.write.length > 0 && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded text-sm text-yellow-400">
          Connect your wallet to interact with write functions
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab("read")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "read"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Read Functions ({parsedABI.read.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("write")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "write"
              ? "text-red-400 border-b-2 border-red-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Write Functions ({parsedABI.write.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === "events"
              ? "text-purple-400 border-b-2 border-purple-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          Events ({parsedABI.events.length})
        </button>
      </div>

      {/* Read Functions */}
      {activeTab === "read" && (
        <div className="space-y-3">
          {parsedABI.read.length > 0 ? (
            parsedABI.read.map((func) => renderFunctionCard(func, false))
          ) : (
            <div className="p-8 text-center text-gray-400">
              No read functions available
            </div>
          )}
        </div>
      )}

      {/* Write Functions */}
      {activeTab === "write" && (
        <div className="space-y-3">
          {parsedABI.write.length > 0 ? (
            parsedABI.write.map((func) => renderFunctionCard(func, true))
          ) : (
            <div className="p-8 text-center text-gray-400">
              No write functions available
            </div>
          )}
        </div>
      )}

      {/* Events */}
      {activeTab === "events" && (
        <div className="space-y-3">
          {parsedABI.events.length > 0 ? (
            parsedABI.events.map((event, idx) => (
              <div
                key={idx}
                className="border border-gray-700 rounded-lg p-4 bg-gray-800/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded font-semibold">
                    EVENT
                  </span>
                  <span className="font-mono font-medium">{event.name}</span>
                </div>
                <div className="text-xs text-gray-400 font-mono bg-gray-900 p-2 rounded">
                  {event.name}(
                  {event.inputs
                    ?.map((inp) => `${inp.type} ${inp.name}`)
                    .join(", ")}
                  )
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              No events defined
            </div>
          )}
        </div>
      )}
    </div>
  );
}
