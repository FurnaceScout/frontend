"use client";

import { use, useEffect, useState } from "react";
import { publicClient, formatEther, shortenAddress } from "@/lib/viem";
import { decodeTransactionInput, decodeLogs } from "@/lib/contract-decoder";
import Link from "next/link";
import TransactionTrace from "@/app/components/TransactionTrace";
import BookmarkButton from "@/app/components/BookmarkButton";
import StateDiffViewer from "@/app/components/StateDiffViewer";
import TokenTransfers from "@/app/components/TokenTransfers";
import TransactionNote from "@/app/components/TransactionNote";
import LabelBadge from "@/app/components/LabelBadge";

export default function TransactionPage({ params }) {
  const { hash } = use(params);
  const [tx, setTx] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [decodedInput, setDecodedInput] = useState(null);
  const [decodedLogs, setDecodedLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransaction() {
      try {
        const [txData, receiptData] = await Promise.all([
          publicClient.getTransaction({ hash }),
          publicClient.getTransactionReceipt({ hash }),
        ]);

        setTx(txData);
        setReceipt(receiptData);

        // Try to decode input if there's a contract
        if (txData.to && txData.input && txData.input !== "0x") {
          const decoded = decodeTransactionInput(txData.input, txData.to);
          setDecodedInput(decoded);
        }

        // Try to decode logs
        if (receiptData.logs && receiptData.logs.length > 0) {
          const decoded = decodeLogs(receiptData.logs);
          setDecodedLogs(decoded);
        }
      } catch (error) {
        console.error("Error fetching transaction:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransaction();
  }, [hash]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!tx || !receipt) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">
            Transaction not found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
        Transaction Details
      </h1>

      {/* Transaction Note */}
      <div className="mb-8">
        <TransactionNote txHash={hash} />
      </div>

      {/* Status Badge & Bookmark */}
      <div className="mb-6 flex items-center gap-4">
        {receipt.status === "success" ? (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
            ✓ Success
          </span>
        ) : (
          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-semibold">
            ✗ Failed
          </span>
        )}
        <BookmarkButton
          hash={hash}
          defaultLabel={`Transaction ${receipt.status === "success" ? "Success" : "Failed"}`}
        />
      </div>

      {/* Transaction Info */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoRow label="Transaction Hash" value={tx.hash} mono full />
          <InfoRow
            label="Block"
            value={
              <Link
                href={`/block/${receipt.blockNumber}`}
                className="text-red-500 hover:underline"
              >
                {receipt.blockNumber.toString()}
              </Link>
            }
          />
          <InfoRow
            label="From"
            value={
              <div className="flex items-center gap-2">
                <Link
                  href={`/address/${tx.from}`}
                  className="text-red-500 hover:underline font-mono"
                >
                  {tx.from}
                </Link>
                <LabelBadge address={tx.from} />
              </div>
            }
            full
          />
          <InfoRow
            label="To"
            value={
              tx.to ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/address/${tx.to}`}
                    className="text-red-500 hover:underline font-mono"
                  >
                    {tx.to}
                  </Link>
                  <LabelBadge address={tx.to} />
                </div>
              ) : (
                <span className="text-purple-600 dark:text-purple-400">
                  Contract Creation
                </span>
              )
            }
            full
          />
          {receipt.contractAddress && (
            <InfoRow
              label="Contract Address"
              value={
                <div className="flex items-center gap-2">
                  <Link
                    href={`/address/${receipt.contractAddress}`}
                    className="text-red-500 hover:underline font-mono"
                  >
                    {receipt.contractAddress}
                  </Link>
                  <LabelBadge address={receipt.contractAddress} />
                </div>
              }
              full
            />
          )}
          <InfoRow label="Value" value={`${formatEther(tx.value)} ETH`} />
          <InfoRow
            label="Gas Used"
            value={`${receipt.gasUsed.toString()} (${((Number(receipt.gasUsed) / Number(tx.gas)) * 100).toFixed(2)}%)`}
          />
          <InfoRow
            label="Gas Price"
            value={`${formatEther(tx.gasPrice)} ETH`}
          />
          <InfoRow label="Nonce" value={tx.nonce.toString()} />
        </div>
      </div>

      {/* Decoded Input */}
      {decodedInput && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
            Decoded Input{" "}
            {decodedInput.contractName && `(${decodedInput.contractName})`}
          </h2>

          {decodedInput.error ? (
            <div className="text-red-500 mb-4">{decodedInput.error}</div>
          ) : (
            <div className="mb-4">
              <div className="text-sm text-zinc-500 mb-1">Function</div>
              <div className="font-mono text-red-600 dark:text-red-400 font-semibold">
                {decodedInput.functionName}
              </div>

              {decodedInput.args && decodedInput.args.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-zinc-500 mb-2">Arguments</div>
                  <div className="space-y-2">
                    {decodedInput.args.map((arg, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded"
                      >
                        <div className="font-mono text-sm break-all">
                          {typeof arg === "bigint"
                            ? arg.toString()
                            : JSON.stringify(arg)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <div className="text-sm text-zinc-500 mb-1">Raw Input</div>
            <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded font-mono text-xs break-all">
              {tx.input}
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {decodedLogs.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
            Logs ({decodedLogs.length})
          </h2>
          <div className="space-y-4">
            {decodedLogs.map((log, idx) => (
              <div
                key={idx}
                className="border border-zinc-200 dark:border-zinc-800 rounded p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
                    Log Index: {log.logIndex}
                  </div>
                  <Link
                    href={`/address/${log.address}`}
                    className="text-red-500 hover:underline text-sm font-mono"
                  >
                    {shortenAddress(log.address)}
                  </Link>
                </div>

                {log.decoded ? (
                  <div>
                    <div className="font-mono text-red-600 dark:text-red-400 font-semibold mb-2">
                      {log.decoded.eventName}{" "}
                      {log.contractName && `(${log.contractName})`}
                    </div>
                    {log.decoded.args && (
                      <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded font-mono text-xs">
                        {JSON.stringify(
                          log.decoded.args,
                          (_, v) => (typeof v === "bigint" ? v.toString() : v),
                          2,
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500">
                    {log.error || "Not decoded"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Token Transfers */}
      {receipt.logs && receipt.logs.length > 0 && (
        <div className="mb-8">
          <TokenTransfers logs={receipt.logs} />
        </div>
      )}

      {/* State Changes */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-8">
        <StateDiffViewer transactionHash={hash} receipt={receipt} />
      </div>

      {/* Transaction Trace */}
      <TransactionTrace hash={hash} />
    </div>
  );
}

function InfoRow({ label, value, mono = false, full = false }) {
  return (
    <div>
      <div className="text-sm text-zinc-500 mb-1">{label}</div>
      <div
        className={`text-sm text-zinc-900 dark:text-zinc-100 ${mono ? "font-mono" : ""} ${full ? "break-all" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
