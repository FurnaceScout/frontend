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
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Separator } from "@/app/components/ui/separator";

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
          <Checkbox
            checked={value === "true" || value === true}
            onCheckedChange={(checked) =>
              handleInputChange(functionName, inputName, String(checked))
            }
          />
          <span className="text-sm text-muted-foreground">
            {value === "true" || value === true ? "true" : "false"}
          </span>
        </div>
      );
    }

    if (fieldType === "textarea") {
      return (
        <Textarea
          value={value}
          onChange={(e) =>
            handleInputChange(functionName, inputName, e.target.value)
          }
          placeholder={`Enter ${input.type} (JSON format)`}
          className={`font-mono text-sm ${
            errors[errorKey] ? "border-destructive" : ""
          }`}
          rows={3}
        />
      );
    }

    return (
      <Input
        type={fieldType}
        value={value}
        onChange={(e) =>
          handleInputChange(functionName, inputName, e.target.value)
        }
        placeholder={`Enter ${input.type}`}
        className={`font-mono text-sm ${
          errors[errorKey] ? "border-destructive" : ""
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
      <Card key={functionName}>
        {/* Function Header */}
        <button
          type="button"
          onClick={() => toggleFunction(functionName)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-3">
            <Badge variant={isWrite ? "destructive" : "default"}>
              {isWrite ? "WRITE" : "READ"}
            </Badge>
            <span className="font-mono font-medium">{functionName}</span>
            {isPayable(func) && (
              <Badge
                variant="outline"
                className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
              >
                PAYABLE
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasHistory && (
              <span className="text-xs text-muted-foreground">
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
          <CardContent className="space-y-4 pt-4">
            {/* Function Signature */}
            <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded overflow-x-auto">
              {getFunctionSignature(func)}
            </div>

            {/* Inputs */}
            {func.inputs && func.inputs.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold">Parameters</div>
                {func.inputs.map((input, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <Label className="text-sm">
                      {input.name || `param${idx}`}{" "}
                      <span className="text-muted-foreground">
                        ({input.type})
                      </span>
                    </Label>
                    {renderInputField(func, input)}
                    {errors[`${functionName}_${input.name}`] && (
                      <p className="text-xs text-destructive">
                        {errors[`${functionName}_${input.name}`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ETH Value (for payable functions) */}
            {isPayable(func) && (
              <div className="space-y-1.5">
                <Label>
                  ETH Value{" "}
                  <span className="text-muted-foreground">(ether)</span>
                </Label>
                <Input
                  type="text"
                  value={getEthValue(functionName)}
                  onChange={(e) =>
                    handleEthValueChange(functionName, e.target.value)
                  }
                  placeholder="0"
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {isWrite ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSimulate(func)}
                    disabled={!isConnected || loading[`${functionName}_sim`]}
                    className="bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20"
                  >
                    {loading[`${functionName}_sim`]
                      ? "Simulating..."
                      : "Simulate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEstimateGas(func)}
                    disabled={!isConnected || loading[`${functionName}_gas`]}
                    className="bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20"
                  >
                    {loading[`${functionName}_gas`]
                      ? "Estimating..."
                      : "Estimate Gas"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleWriteFunction(func)}
                    disabled={!isConnected || isLoading}
                  >
                    {isLoading ? "Sending..." : "Write"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleReadFunction(func)}
                  disabled={isLoading}
                >
                  {isLoading ? "Calling..." : "Query"}
                </Button>
              )}

              {hasHistory && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setShowHistory((prev) => ({
                      ...prev,
                      [functionName]: !prev[functionName],
                    }))
                  }
                >
                  {showHistoryPanel ? "Hide" : "Show"} History
                </Button>
              )}
            </div>

            {/* Gas Estimate */}
            {gasEstimate && (
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertDescription>
                  <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                    Gas Estimate
                  </div>
                  <div className="text-sm font-mono mt-1">
                    {Number(gasEstimate).toLocaleString()} gas
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {errors[`${functionName}_gas`] && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  {errors[`${functionName}_gas`]}
                </AlertDescription>
              </Alert>
            )}

            {/* Simulation Result */}
            {results[`${functionName}_sim`] && (
              <Alert className="bg-purple-500/10 border-purple-500/20">
                <AlertDescription>
                  <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2">
                    Simulation Result
                  </div>
                  <div className="text-sm font-mono break-all">
                    {formatOutputValue(
                      results[`${functionName}_sim`].data,
                      func.outputs?.[0]?.type || "unknown",
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {errors[`${functionName}_sim`] && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  {errors[`${functionName}_sim`]}
                </AlertDescription>
              </Alert>
            )}

            {/* Result */}
            {result && (
              <Alert
                variant={result.success ? "default" : "destructive"}
                className={
                  result.success ? "bg-green-500/10 border-green-500/20" : ""
                }
              >
                <AlertDescription>
                  <div
                    className={`text-sm font-semibold mb-2 ${
                      result.success ? "text-green-600 dark:text-green-400" : ""
                    }`}
                  >
                    {result.success ? "Success" : "Error"}
                  </div>

                  {result.success && isWrite ? (
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Transaction Hash:
                        </span>
                        <a
                          href={`/tx/${result.hash}`}
                          className="ml-2 text-primary hover:underline font-mono"
                        >
                          {result.hash?.slice(0, 10)}...{result.hash?.slice(-8)}
                        </a>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <span
                          className={`ml-2 font-semibold ${
                            result.receipt?.status === "success"
                              ? "text-green-600 dark:text-green-400"
                              : "text-destructive"
                          }`}
                        >
                          {result.receipt?.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gas Used:</span>
                        <span className="ml-2 font-mono">
                          {result.receipt?.gasUsed?.toString()}
                        </span>
                      </div>
                    </div>
                  ) : result.success ? (
                    <div className="text-sm font-mono break-all">
                      {formatOutputValue(
                        result.data,
                        func.outputs?.[0]?.type || "unknown",
                      )}
                    </div>
                  ) : null}
                </AlertDescription>
              </Alert>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Call History */}
            {showHistoryPanel && hasHistory && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Call History</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClearHistory(functionName)}
                      className="h-auto py-1 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      Clear
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {callHistory[functionName].map((item, idx) => (
                      <Card key={idx} className="bg-background">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleLoadFromHistory(functionName, item)
                              }
                              className="h-auto py-0.5 px-2 text-xs text-primary hover:text-primary"
                            >
                              Load
                            </Button>
                          </div>
                          <div className="text-xs font-mono break-all">
                            Args: {JSON.stringify(item.args)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        )}
      </Card>
    );
  }

  if (!abiData?.abi) {
    return (
      <Alert>
        <AlertDescription className="text-center">
          No ABI available for this contract. Upload an ABI to enable
          interaction.
        </AlertDescription>
      </Alert>
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
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 font-mono"
              >
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => disconnect()}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              onClick={() => connect({ connector: injected() })}
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      {!isConnected && parsedABI.write.length > 0 && (
        <Alert className="bg-yellow-500/10 border-yellow-500/20">
          <AlertDescription className="text-sm text-yellow-600 dark:text-yellow-500">
            Connect your wallet to interact with write functions
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="read">
            Read Functions ({parsedABI.read.length})
          </TabsTrigger>
          <TabsTrigger value="write">
            Write Functions ({parsedABI.write.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            Events ({parsedABI.events.length})
          </TabsTrigger>
        </TabsList>

        {/* Read Functions */}
        <TabsContent value="read" className="space-y-3 mt-4">
          {parsedABI.read.length > 0 ? (
            parsedABI.read.map((func) => renderFunctionCard(func, false))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No read functions available
            </div>
          )}
        </TabsContent>

        {/* Write Functions */}
        <TabsContent value="write" className="space-y-3 mt-4">
          {parsedABI.write.length > 0 ? (
            parsedABI.write.map((func) => renderFunctionCard(func, true))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No write functions available
            </div>
          )}
        </TabsContent>

        {/* Events */}
        <TabsContent value="events" className="space-y-3 mt-4">
          {parsedABI.events.length > 0 ? (
            parsedABI.events.map((event, idx) => (
              <Card key={idx}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge
                      variant="outline"
                      className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                    >
                      EVENT
                    </Badge>
                    <span className="font-mono font-medium">{event.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                    {event.name}(
                    {event.inputs
                      ?.map((inp) => `${inp.type} ${inp.name}`)
                      .join(", ")}
                    )
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No events defined
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
