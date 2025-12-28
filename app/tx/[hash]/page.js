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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";

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
          <h1 className="text-2xl font-bold text-destructive">
            Transaction not found
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Transaction Details</h1>

      {/* Transaction Note */}
      <div className="mb-8">
        <TransactionNote txHash={hash} />
      </div>

      {/* Status Badge & Bookmark */}
      <div className="mb-6 flex items-center gap-4">
        {receipt.status === "success" ? (
          <Badge className="bg-green-600 hover:bg-green-700">✓ Success</Badge>
        ) : (
          <Badge variant="destructive">✗ Failed</Badge>
        )}
        <BookmarkButton
          hash={hash}
          defaultLabel={`Transaction ${receipt.status === "success" ? "Success" : "Failed"}`}
        />
      </div>

      {/* Transaction Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoRow label="Transaction Hash" value={tx.hash} mono full />
            <InfoRow
              label="Block"
              value={
                <Link
                  href={`/block/${receipt.blockNumber}`}
                  className="text-primary hover:underline"
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
                    className="text-primary hover:underline font-mono"
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
                      className="text-primary hover:underline font-mono"
                    >
                      {tx.to}
                    </Link>
                    <LabelBadge address={tx.to} />
                  </div>
                ) : (
                  <Badge variant="secondary">Contract Creation</Badge>
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
                      className="text-primary hover:underline font-mono"
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
        </CardContent>
      </Card>

      {/* Decoded Input */}
      {decodedInput && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              Decoded Input{" "}
              {decodedInput.contractName && `(${decodedInput.contractName})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {decodedInput.error ? (
              <div className="text-destructive mb-4">{decodedInput.error}</div>
            ) : (
              <div className="mb-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Function
                </div>
                <div className="font-mono text-primary font-semibold">
                  {decodedInput.functionName}
                </div>

                {decodedInput.args && decodedInput.args.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-2">
                      Arguments
                    </div>
                    <div className="space-y-2">
                      {decodedInput.args.map((arg, idx) => (
                        <div key={idx} className="bg-muted p-3 rounded">
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

            <Separator className="my-4" />

            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Raw Input
              </div>
              <div className="bg-muted p-3 rounded font-mono text-xs break-all">
                {tx.input}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {decodedLogs.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Logs ({decodedLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {decodedLogs.map((log, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-mono text-sm text-muted-foreground">
                        Log Index: {log.logIndex}
                      </div>
                      <Link
                        href={`/address/${log.address}`}
                        className="text-primary hover:underline text-sm font-mono"
                      >
                        {shortenAddress(log.address)}
                      </Link>
                    </div>

                    {log.decoded ? (
                      <div>
                        <div className="font-mono text-primary font-semibold mb-2">
                          {log.decoded.eventName}{" "}
                          {log.contractName && `(${log.contractName})`}
                        </div>
                        {log.decoded.args && (
                          <div className="bg-muted p-3 rounded font-mono text-xs">
                            {JSON.stringify(
                              log.decoded.args,
                              (_, v) =>
                                typeof v === "bigint" ? v.toString() : v,
                              2,
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {log.error || "Not decoded"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Transfers */}
      {receipt.logs && receipt.logs.length > 0 && (
        <div className="mb-8">
          <TokenTransfers logs={receipt.logs} />
        </div>
      )}

      {/* State Changes */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <StateDiffViewer transactionHash={hash} receipt={receipt} />
        </CardContent>
      </Card>

      {/* Transaction Trace */}
      <TransactionTrace hash={hash} />
    </div>
  );
}

function InfoRow({ label, value, mono = false, full = false }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div
        className={`text-sm ${mono ? "font-mono" : ""} ${full ? "break-all" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
