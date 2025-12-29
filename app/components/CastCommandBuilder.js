"use client";

import { useState } from "react";
import {
  generateCastBalance,
  generateCastBlock,
  generateCastCall,
  generateCastCode,
  generateCastEstimate,
  generateCastReceipt,
  generateCastSend,
  generateCastSig,
  generateCastStorage,
  generateCastTx,
  getAnvilAccounts,
} from "@/lib/cast-commands";

export default function CastCommandBuilder({
  contractAddress = "",
  functionName = "",
  functionSignature = "",
  isWrite = false,
  inputs: _inputs = [],
}) {
  const [mode, setMode] = useState("contract"); // contract, transaction, utility
  const [commandType, setCommandType] = useState(isWrite ? "send" : "call");
  const [args, setArgs] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(0);
  const [value, setValue] = useState("");
  const [gasLimit, setGasLimit] = useState("");
  const [txHash, setTxHash] = useState("");
  const [address, setAddress] = useState(contractAddress);
  const [signature, setSignature] = useState(functionSignature);
  const [storageSlot, setStorageSlot] = useState("");
  const [blockNumber, setBlockNumber] = useState("latest");
  const [copied, setCopied] = useState(false);

  const anvilAccounts = getAnvilAccounts();
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

  // Initialize args based on inputs
  useState(() => {
    if (inputs && inputs.length > 0) {
      setArgs(new Array(inputs.length).fill(""));
    }
  }, [inputs]);

  const handleArgChange = (index, value) => {
    const newArgs = [...args];
    newArgs[index] = value;
    setArgs(newArgs);
  };

  const generateCommand = () => {
    try {
      if (mode === "contract") {
        if (commandType === "call") {
          return generateCastCall(address, signature, args, rpcUrl);
        } else if (commandType === "send") {
          return generateCastSend(address, signature, args, {
            privateKey: anvilAccounts[selectedAccount].privateKey,
            value: value || null,
            gasLimit: gasLimit || null,
            rpcUrl,
          });
        } else if (commandType === "estimate") {
          return generateCastEstimate(address, signature, args, {
            from: anvilAccounts[selectedAccount].address,
            value: value || null,
            rpcUrl,
          });
        }
      } else if (mode === "transaction") {
        if (commandType === "receipt") {
          return generateCastReceipt(txHash, rpcUrl);
        } else if (commandType === "tx") {
          return generateCastTx(txHash, rpcUrl);
        }
      } else if (mode === "utility") {
        if (commandType === "balance") {
          return generateCastBalance(address, rpcUrl);
        } else if (commandType === "code") {
          return generateCastCode(address, rpcUrl);
        } else if (commandType === "storage") {
          return generateCastStorage(address, storageSlot, rpcUrl);
        } else if (commandType === "block") {
          return generateCastBlock(blockNumber, rpcUrl);
        } else if (commandType === "sig") {
          return generateCastSig(signature);
        }
      }
      return "";
    } catch (error) {
      return `Error: ${error.message}`;
    }
  };

  const command = generateCommand();

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
      } else {
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = command;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🛠️</span>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Cast Command Builder
          </h3>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("contract");
              setCommandType(isWrite ? "send" : "call");
            }}
            className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
              mode === "contract"
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600"
            }`}
          >
            Contract
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("transaction");
              setCommandType("receipt");
            }}
            className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
              mode === "transaction"
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600"
            }`}
          >
            Transaction
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("utility");
              setCommandType("balance");
            }}
            className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
              mode === "utility"
                ? "bg-red-500 text-white"
                : "bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600"
            }`}
          >
            Utility
          </button>
        </div>
      </div>

      {/* Configuration */}
      <div className="p-4 space-y-4">
        {mode === "contract" && (
          <>
            {/* Command Type */}
            <div>
              <div className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Command Type
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCommandType("call")}
                  className={`px-3 py-2 rounded text-sm font-semibold transition-colors flex-1 ${
                    commandType === "call"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-2 border-transparent"
                  }`}
                >
                  cast call (read)
                </button>
                <button
                  type="button"
                  onClick={() => setCommandType("send")}
                  className={`px-3 py-2 rounded text-sm font-semibold transition-colors flex-1 ${
                    commandType === "send"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-2 border-transparent"
                  }`}
                >
                  cast send (write)
                </button>
                <button
                  type="button"
                  onClick={() => setCommandType("estimate")}
                  className={`px-3 py-2 rounded text-sm font-semibold transition-colors flex-1 ${
                    commandType === "estimate"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-2 border-transparent"
                  }`}
                >
                  estimate gas
                </button>
              </div>
            </div>

            {/* Contract Address */}
            <div>
              <label htmlFor="contract-address" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Contract Address
              </label>
              <input
                id="contract-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
              />
            </div>

            {/* Function Signature */}
            <div>
              <label htmlFor="function-signature" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Function Signature
              </label>
              <input
                id="function-signature"
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="e.g., transfer(address,uint256)"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
              />
            </div>

            {/* Arguments */}
            {inputs && inputs.length > 0 && (
              <div>
                <div className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Arguments
                </div>
                <div className="space-y-2">
                  {inputs.map((input, index) => (
                    <div key={index}>
                      <label htmlFor={`arg-${index}`} className="block text-xs text-zinc-500 mb-1">
                        {input.name || `arg${index}`} ({input.type})
                      </label>
                      <input
                        id={`arg-${index}`}
                        type="text"
                        value={args[index] || ""}
                        onChange={(e) => handleArgChange(index, e.target.value)}
                        placeholder={`${input.type}`}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Options for send */}
            {/* Sender Account */}
            {commandType === "send" && (
              <div>
                <label htmlFor="sender-account" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Sender Account
                </label>
                <select
                  id="sender-account"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                >
                    {anvilAccounts.map((account) => (
                      <option key={account.index} value={account.index}>
                        Account {account.index}: {account.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="tx-value" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Value (ETH, optional)
                  </label>
                  <input
                    id="tx-value"
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g., 1ether, 1000000000000000000wei"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                  />
                </div>

                {/* Gas Limit */}
                {commandType === "send" && (
                  <div>
                    <label htmlFor="gas-limit" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      Gas Limit (optional)
                    </label>
                    <input
                      id="gas-limit"
                      type="text"
                      value={gasLimit}
                      onChange={(e) => setGasLimit(e.target.value)}
                      placeholder="auto"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                    />
                  </div>
                )}
          </>
        )}

        {mode === "transaction" && (
          <>
            {/* Transaction Type */}
            <div>
              <div className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Transaction Info Type
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCommandType("receipt")}
                  className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                    commandType === "receipt"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-2 border-transparent"
                  }`}
                >
                  Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setCommandType("tx")}
                  className={`px-3 py-2 rounded text-sm font-semibold transition-colors ${
                    commandType === "tx"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-2 border-transparent"
                  }`}
                >
                  Transaction
                </button>
              </div>
            </div>

            {/* Transaction Hash */}
            <div>
              <label htmlFor="tx-hash" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Transaction Hash
              </label>
              <input
                id="tx-hash"
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
              />
            </div>
          </>
        )}

        {mode === "utility" && (
          <>
            <div>
              <label htmlFor="utility-command" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Utility Command
              </label>
              <select
                id="utility-command"
                value={commandType}
                onChange={(e) => setCommandType(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              >
                <option value="balance">Balance Check</option>
                <option value="code">Contract Code</option>
                <option value="storage">Storage Slot</option>
                <option value="block">Block Info</option>
                <option value="sig">Function Selector</option>
              </select>
            </div>

            {(commandType === "balance" || commandType === "code") && (
              <div>
                <label htmlFor="utility-address" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Address
                </label>
                <input
                  id="utility-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                />
              </div>
            )}

            {commandType === "storage" && (
              <>
                <div>
                  <label htmlFor="storage-address" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Contract Address
                  </label>
                  <input
                    id="storage-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                  />
                </div>
                {/* Storage Slot */}
                {commandType === "storage" && (
                  <div>
                    <label htmlFor="storage-slot" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      Storage Slot
                    </label>
                    <input
                      id="storage-slot"
                      type="text"
                      value={storageSlot}
                      onChange={(e) => setStorageSlot(e.target.value)}
                      placeholder="0x0"
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                    />
                  </div>
                )}

            {/* Block Number */}
            {commandType === "block" && (
              <div>
                <label htmlFor="block-number" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Block Number
                </label>
                <input
                  id="block-number"
                  type="text"
                  value={blockNumber}
                  onChange={(e) => setBlockNumber(e.target.value)}
                  placeholder="latest"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                />
              </div>
            )}

            {/* Function Signature for sig command */}
            {commandType === "sig" && (
              <div>
                <label htmlFor="sig-signature" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Function Signature
                </label>
                <input
                  id="sig-signature"
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="e.g., transfer(address,uint256)"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Generated Command */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Generated Command
          </div>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!command}
            className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>
        <div className="bg-black text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
          {command || (
            <span className="text-zinc-600">Configure options above...</span>
          )}
        </div>
        {command && (
          <div className="mt-2 text-xs text-zinc-500">
            💡 Tip: Copy this command and run it in your terminal
          </div>
        )}
      </div>
    </div>
  );
}
