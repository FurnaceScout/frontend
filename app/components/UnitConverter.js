"use client";

import { useState } from "react";

export default function UnitConverter({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("wei"); // 'wei' | 'hex' | 'time'

  // Wei/Gwei/ETH converter state
  const [wei, setWei] = useState("");
  const [gwei, setGwei] = useState("");
  const [eth, setEth] = useState("");

  // Hex/Decimal converter state
  const [hexValue, setHexValue] = useState("");
  const [decValue, setDecValue] = useState("");

  // Unix timestamp converter state
  const [unixTimestamp, setUnixTimestamp] = useState("");
  const [dateValue, setDateValue] = useState("");

  // Wei/Gwei/ETH conversions
  function handleWeiChange(value) {
    setWei(value);
    if (value === "") {
      setGwei("");
      setEth("");
      return;
    }
    try {
      const weiNum = BigInt(value);
      setGwei((Number(weiNum) / 1e9).toString());
      setEth((Number(weiNum) / 1e18).toString());
    } catch {
      setGwei("Invalid");
      setEth("Invalid");
    }
  }

  function handleGweiChange(value) {
    setGwei(value);
    if (value === "") {
      setWei("");
      setEth("");
      return;
    }
    try {
      const gweiNum = parseFloat(value);
      if (isNaN(gweiNum)) throw new Error("Invalid");
      const weiNum = BigInt(Math.floor(gweiNum * 1e9));
      setWei(weiNum.toString());
      setEth((gweiNum / 1e9).toString());
    } catch {
      setWei("Invalid");
      setEth("Invalid");
    }
  }

  function handleEthChange(value) {
    setEth(value);
    if (value === "") {
      setWei("");
      setGwei("");
      return;
    }
    try {
      const ethNum = parseFloat(value);
      if (isNaN(ethNum)) throw new Error("Invalid");
      const weiNum = BigInt(Math.floor(ethNum * 1e18));
      setWei(weiNum.toString());
      setGwei((ethNum * 1e9).toString());
    } catch {
      setWei("Invalid");
      setGwei("Invalid");
    }
  }

  // Hex/Decimal conversions
  function handleHexChange(value) {
    setHexValue(value);
    if (value === "") {
      setDecValue("");
      return;
    }
    try {
      const cleaned = value.replace(/^0x/, "");
      const decimal = BigInt("0x" + cleaned);
      setDecValue(decimal.toString());
    } catch {
      setDecValue("Invalid");
    }
  }

  function handleDecChange(value) {
    setDecValue(value);
    if (value === "") {
      setHexValue("");
      return;
    }
    try {
      const decimal = BigInt(value);
      setHexValue("0x" + decimal.toString(16));
    } catch {
      setHexValue("Invalid");
    }
  }

  // Unix timestamp conversions
  function handleUnixChange(value) {
    setUnixTimestamp(value);
    if (value === "") {
      setDateValue("");
      return;
    }
    try {
      const timestamp = parseInt(value);
      if (isNaN(timestamp)) throw new Error("Invalid");
      const date = new Date(timestamp * 1000);
      setDateValue(date.toISOString().slice(0, 16));
    } catch {
      setDateValue("Invalid");
    }
  }

  function handleDateChange(value) {
    setDateValue(value);
    if (value === "") {
      setUnixTimestamp("");
      return;
    }
    try {
      const date = new Date(value);
      const timestamp = Math.floor(date.getTime() / 1000);
      setUnixTimestamp(timestamp.toString());
    } catch {
      setUnixTimestamp("Invalid");
    }
  }

  function handleSetNow() {
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    setUnixTimestamp(timestamp.toString());
    setDateValue(now.toISOString().slice(0, 16));
  }

  function clearAll() {
    setWei("");
    setGwei("");
    setEth("");
    setHexValue("");
    setDecValue("");
    setUnixTimestamp("");
    setDateValue("");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            🔧 Unit Converter
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab("wei")}
              className={`flex-1 px-4 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === "wei"
                  ? "border-red-500 text-red-600 dark:text-red-400"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Wei / ETH
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hex")}
              className={`flex-1 px-4 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === "hex"
                  ? "border-red-500 text-red-600 dark:text-red-400"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Hex / Decimal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("time")}
              className={`flex-1 px-4 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === "time"
                  ? "border-red-500 text-red-600 dark:text-red-400"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              Timestamp
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Wei/Gwei/ETH Tab */}
          {activeTab === "wei" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Wei
                </label>
                <input
                  type="text"
                  value={wei}
                  onChange={(e) => handleWeiChange(e.target.value)}
                  placeholder="1000000000000000000"
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-center text-zinc-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Gwei
                </label>
                <input
                  type="text"
                  value={gwei}
                  onChange={(e) => handleGweiChange(e.target.value)}
                  placeholder="1000000000"
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-center text-zinc-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  ETH
                </label>
                <input
                  type="text"
                  value={eth}
                  onChange={(e) => handleEthChange(e.target.value)}
                  placeholder="1.0"
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-400">
                <div className="font-semibold mb-1">Conversion Reference:</div>
                <div className="space-y-1 font-mono text-xs">
                  <div>1 ETH = 1,000,000,000 Gwei</div>
                  <div>1 ETH = 1,000,000,000,000,000,000 Wei</div>
                  <div>1 Gwei = 1,000,000,000 Wei</div>
                </div>
              </div>
            </div>
          )}

          {/* Hex/Decimal Tab */}
          {activeTab === "hex" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Hexadecimal
                </label>
                <input
                  type="text"
                  value={hexValue}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="0x1a4"
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  Can start with or without '0x' prefix
                </div>
              </div>

              <div className="flex items-center justify-center text-zinc-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Decimal
                </label>
                <input
                  type="text"
                  value={decValue}
                  onChange={(e) => handleDecChange(e.target.value)}
                  placeholder="420"
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-sm text-purple-700 dark:text-purple-400">
                <div className="font-semibold mb-1">Common Use Cases:</div>
                <div className="space-y-1 text-xs">
                  <div>• Block numbers (decimal to hex for JSON-RPC)</div>
                  <div>• Token amounts in contract calls</div>
                  <div>• Gas limits and prices</div>
                  <div>• Method IDs and function selectors</div>
                </div>
              </div>
            </div>
          )}

          {/* Timestamp Tab */}
          {activeTab === "time" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Unix Timestamp (seconds)
                </label>
                <input
                  type="text"
                  value={unixTimestamp}
                  onChange={(e) => handleUnixChange(e.target.value)}
                  placeholder="1704067200"
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-center text-zinc-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={dateValue}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSetNow}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
              >
                📅 Set to Current Time
              </button>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-700 dark:text-green-400">
                <div className="font-semibold mb-1">Block Timestamps:</div>
                <div className="space-y-1 text-xs">
                  <div>• Block timestamps are in Unix time (seconds since 1970)</div>
                  <div>• Useful for testing time-based contract logic</div>
                  <div>• Anvil can manipulate block timestamps</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
