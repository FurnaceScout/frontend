"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  debugTraceTransaction,
  debugTraceTransactionOpcodes,
  formatGas,
  parseStorageChanges,
  shortenAddress,
} from "@/lib/viem";

export default function TransactionTrace({ hash }) {
  const [trace, setTrace] = useState(null);
  const [opcodeTrace, setOpcodeTrace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCalls, setExpandedCalls] = useState(new Set(["root"]));
  const [selectedStep, setSelectedStep] = useState(null);

  useEffect(() => {
    async function fetchTrace() {
      setLoading(true);
      setError(null);

      try {
        const [callTrace, opcodes] = await Promise.all([
          debugTraceTransaction(hash),
          debugTraceTransactionOpcodes(hash),
        ]);

        setTrace(callTrace);
        setOpcodeTrace(opcodes);
      } catch (err) {
        console.error("Failed to fetch trace:", err);
        setError(err.message || "Failed to load trace");
      } finally {
        setLoading(false);
      }
    }

    fetchTrace();
  }, [hash]);

  const toggleCall = (id) => {
    setExpandedCalls((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔍 Transaction Trace</CardTitle>
          <CardDescription>Loading trace data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🔍 Transaction Trace</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="mt-4 text-xs text-muted-foreground text-center">
            Note: Trace data is only available for recent transactions on Anvil
          </p>
        </CardContent>
      </Card>
    );
  }

  const storageChanges = opcodeTrace?.structLogs
    ? parseStorageChanges(opcodeTrace.structLogs)
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>🔍 Transaction Trace</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Gas Used:</span>
            <Badge variant="secondary" className="font-mono">
              {trace?.gasUsed ? formatGas(trace.gasUsed) : "N/A"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="callTree" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="callTree">📊 Call Tree</TabsTrigger>
            <TabsTrigger value="opcodes">⚙️ Opcodes</TabsTrigger>
            <TabsTrigger value="storage">
              💾 Storage ({storageChanges.length})
            </TabsTrigger>
            <TabsTrigger value="memory">🧠 Memory</TabsTrigger>
          </TabsList>

          <TabsContent value="callTree" className="mt-4">
            {trace && (
              <CallTreeView
                trace={trace}
                expandedCalls={expandedCalls}
                toggleCall={toggleCall}
              />
            )}
          </TabsContent>

          <TabsContent value="opcodes" className="mt-4">
            {opcodeTrace && (
              <OpcodesView
                structLogs={opcodeTrace.structLogs}
                selectedStep={selectedStep}
                setSelectedStep={setSelectedStep}
              />
            )}
          </TabsContent>

          <TabsContent value="storage" className="mt-4">
            <StorageView changes={storageChanges} />
          </TabsContent>

          <TabsContent value="memory" className="mt-4">
            {opcodeTrace && (
              <MemoryView
                structLogs={opcodeTrace.structLogs}
                selectedStep={selectedStep}
                setSelectedStep={setSelectedStep}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Call Tree View Component
function CallTreeView({ trace, expandedCalls, toggleCall }) {
  const renderCall = (call, depth = 0, id = "root") => {
    const isExpanded = expandedCalls.has(id);
    const hasChildren = call.calls && call.calls.length > 0;
    const isError = call.error || call.revertReason;

    const getCallTypeBadgeVariant = (type) => {
      switch (type) {
        case "CALL":
          return "default";
        case "DELEGATECALL":
          return "secondary";
        case "STATICCALL":
          return "outline";
        case "CREATE":
        case "CREATE2":
          return "secondary";
        default:
          return "outline";
      }
    };

    return (
      <div key={id} className="font-mono text-sm">
        <div
          className={`flex items-start gap-2 p-3 rounded hover:bg-muted ${
            isError ? "bg-destructive/10" : ""
          }`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCall(id)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? "▼" : "▶"}
            </Button>
          )}
          {!hasChildren && <span className="w-6 flex-shrink-0"></span>}

          {/* Call Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={getCallTypeBadgeVariant(call.type)}>
                {call.type}
              </Badge>

              {call.to && (
                <span className="text-muted-foreground">
                  → {shortenAddress(call.to)}
                </span>
              )}

              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground text-xs">
                Gas: {formatGas(call.gasUsed)}
              </span>

              {call.value && call.value !== "0x0" && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Badge
                    variant="outline"
                    className="text-orange-600 dark:text-orange-400"
                  >
                    {(Number(call.value) / 1e18).toFixed(4)} ETH
                  </Badge>
                </>
              )}
            </div>

            {/* Input (Function Signature) */}
            {call.input && call.input !== "0x" && (
              <div className="text-xs text-muted-foreground truncate">
                Input: {call.input.slice(0, 10)}...
              </div>
            )}

            {/* Output */}
            {call.output && call.output !== "0x" && (
              <div className="text-xs text-muted-foreground truncate">
                Output: {call.output.slice(0, 10)}...
              </div>
            )}

            {/* Error */}
            {isError && (
              <div className="text-xs text-destructive mt-1 font-semibold">
                ❌ {call.error || call.revertReason}
              </div>
            )}
          </div>
        </div>

        {/* Recursive Calls */}
        {isExpanded && hasChildren && (
          <div>
            {call.calls.map((subCall, idx) =>
              renderCall(subCall, depth + 1, `${id}-${idx}`),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1 max-h-[600px] overflow-y-auto border rounded-lg p-2">
      {renderCall(trace)}
    </div>
  );
}

// Opcodes View Component
function OpcodesView({ structLogs, selectedStep, setSelectedStep }) {
  const [filter, setFilter] = useState("");
  const [showOnlyImportant, setShowOnlyImportant] = useState(false);

  const importantOps = new Set([
    "CALL",
    "DELEGATECALL",
    "STATICCALL",
    "CREATE",
    "CREATE2",
    "SSTORE",
    "SLOAD",
    "REVERT",
    "RETURN",
    "SELFDESTRUCT",
  ]);

  const filteredLogs = structLogs.filter((log) => {
    if (showOnlyImportant && !importantOps.has(log.op)) return false;
    if (filter && !log.op.toLowerCase().includes(filter.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <Input
          type="text"
          placeholder="Filter by opcode..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={() => setShowOnlyImportant(!showOnlyImportant)}
          variant={showOnlyImportant ? "default" : "secondary"}
        >
          Important Only
        </Button>
      </div>

      {/* Opcodes List */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-2 grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground border-b">
          <div className="col-span-1">Step</div>
          <div className="col-span-1">PC</div>
          <div className="col-span-2">Opcode</div>
          <div className="col-span-1">Gas</div>
          <div className="col-span-1">Cost</div>
          <div className="col-span-1">Depth</div>
          <div className="col-span-5">Stack (top 3)</div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {filteredLogs.map((log, idx) => {
            const isImportant = importantOps.has(log.op);
            const isSelected = selectedStep === idx;

            return (
              <div
                key={idx}
                onClick={() => setSelectedStep(idx)}
                className={`grid grid-cols-12 gap-2 p-2 text-xs font-mono border-b cursor-pointer hover:bg-muted ${
                  isSelected ? "bg-primary/10" : ""
                } ${isImportant ? "font-semibold" : ""}`}
              >
                <div className="col-span-1 text-muted-foreground">{idx}</div>
                <div className="col-span-1 text-muted-foreground">{log.pc}</div>
                <div
                  className={`col-span-2 ${isImportant ? "text-primary" : ""}`}
                >
                  {log.op}
                </div>
                <div className="col-span-1 text-muted-foreground">
                  {formatGas(log.gas)}
                </div>
                <div className="col-span-1 text-muted-foreground">
                  {log.gasCost || 0}
                </div>
                <div className="col-span-1 text-muted-foreground">
                  {log.depth}
                </div>
                <div className="col-span-5 text-muted-foreground truncate">
                  {log.stack && log.stack.length > 0
                    ? log.stack
                        .slice(-3)
                        .reverse()
                        .map((s) => s.slice(0, 8))
                        .join(", ")
                    : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Showing {filteredLogs.length} of {structLogs.length} steps
      </div>

      {/* Selected Step Details */}
      {selectedStep !== null && structLogs[selectedStep] && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">
              Step {selectedStep} Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-mono">
            <div>
              <span className="text-muted-foreground">Opcode:</span>{" "}
              <Badge variant="default">{structLogs[selectedStep].op}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Program Counter:</span>{" "}
              {structLogs[selectedStep].pc}
            </div>
            <div>
              <span className="text-muted-foreground">Gas Remaining:</span>{" "}
              {formatGas(structLogs[selectedStep].gas)}
            </div>
            <div>
              <span className="text-muted-foreground">Gas Cost:</span>{" "}
              {structLogs[selectedStep].gasCost || 0}
            </div>
            <div>
              <span className="text-muted-foreground">Stack Depth:</span>{" "}
              {structLogs[selectedStep].stack?.length || 0}
            </div>
            {structLogs[selectedStep].stack &&
              structLogs[selectedStep].stack.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Full Stack:</span>
                  <div className="mt-1 p-2 bg-muted rounded text-xs max-h-32 overflow-y-auto">
                    {structLogs[selectedStep].stack
                      .slice()
                      .reverse()
                      .map((item, idx) => (
                        <div key={idx} className="text-foreground">
                          [{idx}] {item}
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Storage View Component
function StorageView({ changes }) {
  if (changes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No storage changes detected in this transaction
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {changes.map((change, idx) => (
        <Card key={idx}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Storage Change #{idx + 1}
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                PC: {change.pc} • Depth: {change.depth}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-muted-foreground">Slot:</span>
              <div className="mt-1 p-2 bg-muted rounded break-all">
                {change.key}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Old Value:</span>
                <div className="mt-1 p-2 bg-destructive/10 rounded break-all text-destructive">
                  {change.oldValue}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">New Value:</span>
                <div className="mt-1 p-2 bg-green-100 dark:bg-green-900/20 rounded break-all text-green-700 dark:text-green-300">
                  {change.newValue}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Memory View Component
function MemoryView({ structLogs, selectedStep, setSelectedStep }) {
  const [memoryOffset, setMemoryOffset] = useState(0);
  const bytesPerRow = 32;

  // Get memory from selected step or first step with memory
  const currentStep = selectedStep !== null ? selectedStep : 0;
  const stepData = structLogs[currentStep];
  const memory = stepData?.memory || [];

  // Parse hex memory strings into bytes
  const parseMemory = (memArray) => {
    if (!memArray || memArray.length === 0) return [];

    const allBytes = [];
    memArray.forEach((chunk) => {
      const hex = chunk.startsWith("0x") ? chunk.slice(2) : chunk;
      for (let i = 0; i < hex.length; i += 2) {
        allBytes.push(hex.slice(i, i + 2));
      }
    });
    return allBytes;
  };

  const memoryBytes = parseMemory(memory);
  const totalBytes = memoryBytes.length;
  const maxOffset = Math.max(
    0,
    Math.floor(totalBytes / bytesPerRow) * bytesPerRow,
  );

  const startByte = memoryOffset;
  const endByte = Math.min(startByte + bytesPerRow * 16, totalBytes);
  const visibleBytes = memoryBytes.slice(startByte, endByte);

  const rows = [];
  for (let i = 0; i < visibleBytes.length; i += bytesPerRow) {
    const rowBytes = visibleBytes.slice(i, i + bytesPerRow);
    const offset = startByte + i;
    rows.push({ offset, bytes: rowBytes });
  }

  const bytesToAscii = (bytes) => {
    return bytes
      .map((b) => {
        const code = parseInt(b, 16);
        return code >= 32 && code <= 126 ? String.fromCharCode(code) : ".";
      })
      .join("");
  };

  const copyMemory = () => {
    const hex = memoryBytes.join("");
    navigator.clipboard.writeText(`0x${hex}`);
  };

  const goToPrevStep = () => {
    if (currentStep > 0) setSelectedStep(currentStep - 1);
  };

  const goToNextStep = () => {
    if (currentStep < structLogs.length - 1) setSelectedStep(currentStep + 1);
  };

  const stepsWithMemory = structLogs
    .map((log, idx) => ({
      idx,
      hasMemory: log.memory && log.memory.length > 0,
    }))
    .filter((s) => s.hasMemory)
    .map((s) => s.idx);

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex gap-2">
          <Button
            onClick={goToPrevStep}
            disabled={currentStep === 0}
            size="sm"
            variant="outline"
          >
            ← Prev Step
          </Button>
          <Button
            onClick={goToNextStep}
            disabled={currentStep === structLogs.length - 1}
            size="sm"
            variant="outline"
          >
            Next Step →
          </Button>
        </div>

        <Badge variant="secondary" className="px-3 py-2">
          Step: {currentStep} / {structLogs.length - 1}
        </Badge>

        <Button onClick={copyMemory} size="sm" variant="outline">
          📋 Copy Memory
        </Button>

        <Badge variant="secondary" className="px-3 py-2">
          {totalBytes} bytes
        </Badge>
      </div>

      {totalBytes === 0
        ? <div className="text-center py-12 text-muted-foreground">
            No memory data at this step
          </div>
        : <>
            {/* Memory Display */}
            <div className="border rounded-lg overflow-hidden font-mono text-xs">
              <div className="bg-muted p-2 flex gap-4 text-muted-foreground border-b">
                <div className="w-20">Offset</div>
                <div className="flex-1">Hex</div>
                <div className="w-32">ASCII</div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 p-2 border-b hover:bg-muted"
                  >
                    <div className="w-20 text-muted-foreground">
                      0x{row.offset.toString(16).padStart(4, "0")}
                    </div>
                    <div className="flex-1">
                      {row.bytes.map((byte, i) => (
                        <span key={i} className={i % 2 === 0 ? "mr-1" : "mr-2"}>
                          {byte}
                        </span>
                      ))}
                    </div>
                    <div className="w-32 text-muted-foreground">
                      {bytesToAscii(row.bytes)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalBytes > bytesPerRow * 16 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  onClick={() =>
                    setMemoryOffset(
                      Math.max(0, memoryOffset - bytesPerRow * 16),
                    )
                  }
                  disabled={memoryOffset === 0}
                  size="sm"
                  variant="outline"
                >
                  ← Previous Page
                </Button>
                <span className="text-sm text-muted-foreground">
                  Bytes {startByte} - {endByte} of {totalBytes}
                </span>
                <Button
                  onClick={() =>
                    setMemoryOffset(
                      Math.min(maxOffset, memoryOffset + bytesPerRow * 16),
                    )
                  }
                  disabled={memoryOffset >= maxOffset}
                  size="sm"
                  variant="outline"
                >
                  Next Page →
                </Button>
              </div>
            )}
          </>}

      {/* Steps with Memory */}
      {stepsWithMemory.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">
            Steps with memory: {stepsWithMemory.length}
          </p>
          <div className="flex flex-wrap gap-1">
            {stepsWithMemory.slice(0, 50).map((stepIdx) => (
              <Button
                key={stepIdx}
                onClick={() => setSelectedStep(stepIdx)}
                size="sm"
                variant={stepIdx === currentStep ? "default" : "outline"}
                className="h-8 px-2"
              >
                {stepIdx}
              </Button>
            ))}
            {stepsWithMemory.length > 50 && (
              <span className="text-xs text-muted-foreground self-center">
                +{stepsWithMemory.length - 50} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
