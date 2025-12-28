"use client";

import { useState, useEffect } from "react";
import {
  debugTraceTransaction,
  debugTraceTransactionOpcodes,
  parseStorageChanges,
  formatGas,
  shortenAddress,
} from "@/lib/viem";

export default function TransactionTrace({ hash }) {
  const [trace, setTrace] = useState(null);
  const [opcodeTrace, setOpcodeTrace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("callTree"); // callTree, opcodes, storage
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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading transaction trace...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8">
        <div className="text-center">
          <div className="text-red-500 font-semibold mb-2">
            ⚠️ Failed to Load Trace
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {error}
          </div>
          <div className="mt-4 text-xs text-zinc-500">
            Note: Trace data is only available for recent transactions on Anvil
          </div>
        </div>
      </div>
    );
  }

  const storageChanges = opcodeTrace?.structLogs
    ? parseStorageChanges(opcodeTrace.structLogs)
    : [];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            🔍 Transaction Trace
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Gas Used:</span>
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
              {trace?.gasUsed ? formatGas(trace.gasUsed) : "N/A"}
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("callTree")}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
              viewMode === "callTree"
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600"
            }`}
          >
            📊 Call Tree
          </button>
          <button
            onClick={() => setViewMode("opcodes")}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
              viewMode === "opcodes"
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600"
            }`}
          >
            ⚙️ Opcodes
          </button>
          <button
            onClick={() => setViewMode("storage")}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
              viewMode === "storage"
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600"
            }`}
          >
            💾 Storage ({storageChanges.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === "callTree" && trace && (
          <CallTreeView
            trace={trace}
            expandedCalls={expandedCalls}
            toggleCall={toggleCall}
          />
        )}

        {viewMode === "opcodes" && opcodeTrace && (
          <OpcodesView
            structLogs={opcodeTrace.structLogs}
            selectedStep={selectedStep}
            setSelectedStep={setSelectedStep}
          />
        )}

        {viewMode === "storage" && (
          <StorageView changes={storageChanges} />
        )}
      </div>
    </div>
  );
}

// Call Tree View Component
function CallTreeView({ trace, expandedCalls, toggleCall }) {
  const renderCall = (call, depth = 0, id = "root") => {
    const isExpanded = expandedCalls.has(id);
    const hasChildren = call.calls && call.calls.length > 0;
    const isError = call.error || call.revertReason;

    return (
      <div key={id} className="font-mono text-sm">
        <div
          className={`flex items-start gap-2 p-3 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
            isError ? "bg-red-50 dark:bg-red-900/20" : ""
          }`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleCall(id)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex-shrink-0"
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          {!hasChildren && <span className="w-4 flex-shrink-0"></span>}

          {/* Call Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  call.type === "CALL"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : call.type === "DELEGATECALL"
                    ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    : call.type === "STATICCALL"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : call.type === "CREATE" || call.type === "CREATE2"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {call.type}
              </span>

              {call.to && (
                <span className="text-zinc-600 dark:text-zinc-400">
                  → {shortenAddress(call.to)}
                </span>
              )}

              <span className="text-zinc-400">•</span>
              <span className="text-zinc-500 text-xs">
                Gas: {formatGas(call.gasUsed)}
              </span>

              {call.value && call.value !== "0x0" && (
                <>
                  <span className="text-zinc-400">•</span>
                  <span className="text-orange-600 dark:text-orange-400 text-xs font-semibold">
                    {(Number(call.value) / 1e18).toFixed(4)} ETH
                  </span>
                </>
              )}
            </div>

            {/* Input (Function Signature) */}
            {call.input && call.input !== "0x" && (
              <div className="text-xs text-zinc-500 truncate">
                Input: {call.input.slice(0, 10)}...
              </div>
            )}

            {/* Output */}
            {call.output && call.output !== "0x" && (
              <div className="text-xs text-zinc-500 truncate">
                Output: {call.output.slice(0, 10)}...
              </div>
            )}

            {/* Error */}
            {isError && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
                ❌ {call.error || call.revertReason}
              </div>
            )}
          </div>
        </div>

        {/* Recursive Calls */}
        {isExpanded && hasChildren && (
          <div>
            {call.calls.map((subCall, idx) =>
              renderCall(subCall, depth + 1, `${id}-${idx}`)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1 max-h-[600px] overflow-y-auto">
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
        <input
          type="text"
          placeholder="Filter by opcode..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
        />
        <button
          onClick={() => setShowOnlyImportant(!showOnlyImportant)}
          className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
            showOnlyImportant
              ? "bg-red-500 text-white"
              : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
          }`}
        >
          Important Only
        </button>
      </div>

      {/* Opcodes List */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-2 grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
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
                className={`grid grid-cols-12 gap-2 p-2 text-xs font-mono border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                  isSelected ? "bg-red-50 dark:bg-red-900/20" : ""
                } ${isImportant ? "font-semibold" : ""}`}
              >
                <div className="col-span-1 text-zinc-500">{idx}</div>
                <div className="col-span-1 text-zinc-500">{log.pc}</div>
                <div
                  className={`col-span-2 ${
                    isImportant
                      ? "text-red-600 dark:text-red-400"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {log.op}
                </div>
                <div className="col-span-1 text-zinc-600 dark:text-zinc-400">
                  {formatGas(log.gas)}
                </div>
                <div className="col-span-1 text-zinc-600 dark:text-zinc-400">
                  {log.gasCost || 0}
                </div>
                <div className="col-span-1 text-zinc-600 dark:text-zinc-400">
                  {log.depth}
                </div>
                <div className="col-span-5 text-zinc-500 truncate">
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

      <div className="mt-4 text-xs text-zinc-500">
        Showing {filteredLogs.length} of {structLogs.length} steps
      </div>

      {/* Selected Step Details */}
      {selectedStep !== null && structLogs[selectedStep] && (
        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Step {selectedStep} Details
          </h3>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <span className="text-zinc-500">Opcode:</span>{" "}
              <span className="text-red-600 dark:text-red-400 font-semibold">
                {structLogs[selectedStep].op}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Program Counter:</span>{" "}
              {structLogs[selectedStep].pc}
            </div>
            <div>
              <span className="text-zinc-500">Gas Remaining:</span>{" "}
              {formatGas(structLogs[selectedStep].gas)}
            </div>
            <div>
              <span className="text-zinc-500">Gas Cost:</span>{" "}
              {structLogs[selectedStep].gasCost || 0}
            </div>
            <div>
              <span className="text-zinc-500">Stack Depth:</span>{" "}
              {structLogs[selectedStep].stack?.length || 0}
            </div>
            {structLogs[selectedStep].stack &&
              structLogs[selectedStep].stack.length > 0 && (
                <div>
                  <span className="text-zinc-500">Full Stack:</span>
                  <div className="mt-1 p-2 bg-white dark:bg-zinc-900 rounded text-xs max-h-32 overflow-y-auto">
                    {structLogs[selectedStep].stack
                      .slice()
                      .reverse()
                      .map((item, idx) => (
                        <div key={idx} className="text-zinc-700 dark:text-zinc-300">
                          [{idx}] {item}
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

// Storage View Component
function StorageView({ changes }) {
  if (changes.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No storage changes detected in this transaction
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {changes.map((change, idx) => (
        <div
          key={idx}
          className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Storage Change #{idx + 1}
            </div>
            <div className="text-xs text-zinc-500">
              PC: {change.pc} • Depth: {change.depth}
            </div>
          </div>

          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-zinc-500">Slot:</span>
              <div className="mt-1 p-2 bg-zinc-50 dark:bg-zinc-800 rounded break-all">
                {change.key}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-zinc-500">Old Value:</span>
                <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded break-all text-red-700 dark:text-red-300">
                  {change.oldValue}
                </div>
              </div>
              <div>
                <span className="text-zinc-500">New Value:</span>
                <div className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 rounded break-all text-green-700 dark:text-green-300">
                  {change.newValue}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
