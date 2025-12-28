"use client";

import { use, useEffect, useState } from "react";
import { publicClient, formatEther, shortenAddress } from "@/lib/viem";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";

export default function BlockPage({ params }) {
  const { number } = use(params);
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlock() {
      try {
        let blockData;

        // Handle "latest" keyword
        if (number === "latest") {
          blockData = await publicClient.getBlock({
            includeTransactions: true,
          });
        } else {
          blockData = await publicClient.getBlock({
            blockNumber: BigInt(number),
            includeTransactions: true,
          });
        }

        setBlock(blockData);
      } catch (error) {
        console.error("Error fetching block:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBlock();
  }, [number]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive">
                Block not found
              </h1>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const txCount = Array.isArray(block.transactions)
    ? block.transactions.length
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Block #{block.number.toString()}</h1>
        {number === "latest" && <Badge variant="secondary">Latest</Badge>}
      </div>

      {/* Block Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Block Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoRow label="Block Height" value={block.number.toString()} />
            <InfoRow
              label="Timestamp"
              value={new Date(Number(block.timestamp) * 1000).toLocaleString()}
            />
            <InfoRow
              label="Transactions"
              value={
                <Badge variant="outline">
                  {txCount} transaction{txCount !== 1 ? "s" : ""}
                </Badge>
              }
            />
            <InfoRow label="Gas Used" value={block.gasUsed.toString()} />
            <InfoRow label="Gas Limit" value={block.gasLimit.toString()} />
            <InfoRow
              label="Base Fee"
              value={`${formatEther(block.baseFeePerGas)} ETH`}
            />
            <InfoRow label="Hash" value={block.hash} mono full />
            <InfoRow label="Parent Hash" value={block.parentHash} mono full />
            <InfoRow
              label="Miner"
              value={
                <Link
                  href={`/address/${block.miner}`}
                  className="text-primary hover:underline font-mono break-all"
                >
                  {block.miner}
                </Link>
              }
              full
            />
            <InfoRow label="Difficulty" value={block.difficulty.toString()} />
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({txCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {txCount > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {block.transactions.map((tx) => (
                  <TableRow key={tx.hash}>
                    <TableCell>
                      <Link
                        href={`/tx/${tx.hash}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {shortenAddress(tx.hash, 8)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/address/${tx.from}`}
                        className="font-mono text-sm hover:text-primary transition-colors"
                      >
                        {shortenAddress(tx.from)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {tx.to ? (
                        <Link
                          href={`/address/${tx.to}`}
                          className="font-mono text-sm hover:text-primary transition-colors"
                        >
                          {shortenAddress(tx.to)}
                        </Link>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Contract Creation
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatEther(tx.value)} ETH
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions in this block
            </div>
          )}
        </CardContent>
      </Card>
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
