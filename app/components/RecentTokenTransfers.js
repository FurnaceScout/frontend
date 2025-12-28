"use client";

import { useEffect, useState } from "react";
import { publicClient, shortenAddress } from "@/lib/viem";
import {
  parseTokenTransfers,
  detectTokenType,
  formatTokenAmount,
} from "@/lib/tokens";
import Link from "next/link";
import LabelBadge from "./LabelBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Button } from "@/app/components/ui/button";

export default function RecentTokenTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [tokenMetadata, setTokenMetadata] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecentTransfers() {
      try {
        const latestBlock = await publicClient.getBlockNumber();
        const fromBlock = latestBlock - 50n; // Last ~50 blocks

        const allTransfers = [];
        const metadataMap = {};

        for (let i = latestBlock; i > fromBlock; i--) {
          const block = await publicClient.getBlock({
            blockNumber: i,
            includeTransactions: true,
          });

          if (!block || !block.transactions) continue;

          for (const tx of block.transactions) {
            const receipt = await publicClient
              .getTransactionReceipt({ hash: tx.hash })
              .catch(() => null);

            if (!receipt || !receipt.logs || receipt.logs.length === 0)
              continue;

            const txTransfers = parseTokenTransfers(receipt.logs);

            for (const transfer of txTransfers) {
              allTransfers.push({
                ...transfer,
                txHash: tx.hash,
                blockNumber: block.number.toString(),
                timestamp: block.timestamp,
              });

              if (!metadataMap[transfer.token.toLowerCase()]) {
                metadataMap[transfer.token.toLowerCase()] = null;
              }
            }
          }

          if (allTransfers.length >= 20) break;
        }

        setTransfers(allTransfers.slice(0, 20));

        // Fetch metadata for unique tokens
        const uniqueTokens = Object.keys(metadataMap);
        const metadata = {};

        await Promise.all(
          uniqueTokens.map(async (tokenAddress) => {
            try {
              const info = await detectTokenType(tokenAddress);
              if (info.isToken) {
                metadata[tokenAddress] = {
                  type: info.type,
                  ...info.metadata,
                };
              }
            } catch (error) {
              console.error(
                `Error fetching metadata for ${tokenAddress}:`,
                error,
              );
            }
          }),
        );

        setTokenMetadata(metadata);
      } catch (error) {
        console.error("Error loading recent token transfers:", error);
      } finally {
        setLoading(false);
      }
    }

    loadRecentTransfers();
  }, []);

  const getTokenBadgeVariant = (type) => {
    if (type.startsWith("ERC20")) return "default";
    if (type.startsWith("ERC721")) return "secondary";
    return "outline";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Token Transfers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (transfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Token Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🪙</div>
            <div className="text-muted-foreground">
              No recent token transfers
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Token Transfers</CardTitle>
          <Button variant="link" size="sm" asChild>
            <Link href="/tokens">View All →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transfers.map((transfer, index) => {
            const metadata = tokenMetadata[transfer.token.toLowerCase()] || {};
            const decimals = metadata.decimals || 18;

            return (
              <div
                key={`${transfer.txHash}-${index}`}
                className="p-3 border rounded-lg hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Left: Type & Token Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getTokenBadgeVariant(transfer.type)}>
                        {transfer.type}
                      </Badge>
                      {metadata.name && (
                        <Link
                          href={`/tokens/${transfer.token}`}
                          className="text-sm font-semibold hover:text-primary truncate"
                        >
                          {metadata.name}
                        </Link>
                      )}
                      {metadata.symbol && (
                        <span className="text-xs text-muted-foreground">
                          ({metadata.symbol})
                        </span>
                      )}
                    </div>

                    {/* Addresses */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <Link
                        href={`/address/${transfer.from}`}
                        className="font-mono hover:text-primary"
                      >
                        <LabelBadge
                          address={transfer.from}
                          fallback={shortenAddress(transfer.from, 4)}
                        />
                      </Link>
                      <span className="text-muted-foreground text-xs">→</span>
                      <Link
                        href={`/address/${transfer.to}`}
                        className="font-mono hover:text-primary"
                      >
                        <LabelBadge
                          address={transfer.to}
                          fallback={shortenAddress(transfer.to, 4)}
                        />
                      </Link>
                    </div>

                    {/* TX Hash */}
                    <Link
                      href={`/tx/${transfer.txHash}`}
                      className="text-xs text-muted-foreground hover:text-primary font-mono mt-1 block"
                    >
                      {shortenAddress(transfer.txHash, 4)}
                    </Link>
                  </div>

                  {/* Right: Amount/Value */}
                  <div className="text-right text-sm">
                    {transfer.type.startsWith("ERC20") && transfer.value ? (
                      <div className="font-semibold">
                        {formatTokenAmount(BigInt(transfer.value), decimals)}
                      </div>
                    ) : transfer.type.startsWith("ERC721") &&
                      transfer.tokenId ? (
                      <div className="font-mono text-xs">
                        #{transfer.tokenId}
                      </div>
                    ) : transfer.type === "ERC1155" ? (
                      <div className="font-mono text-xs">
                        #{transfer.tokenId}×{transfer.value}
                      </div>
                    ) : null}
                    {transfer.timestamp && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(
                          Number(transfer.timestamp) * 1000,
                        ).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t">
          <Button variant="link" className="w-full" asChild>
            <Link href="/tokens">View All Token Transfers →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
