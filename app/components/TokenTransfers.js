"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  detectTokenType,
  formatTokenAmount,
  parseTokenTransfers,
} from "@/lib/tokens";
import { shortenAddress } from "@/lib/viem";

export default function TokenTransfers({ logs }) {
  const [transfers, setTransfers] = useState([]);
  const [tokenMetadata, setTokenMetadata] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function processTransfers() {
      if (!logs || logs.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Parse token transfers from logs
        const parsedTransfers = parseTokenTransfers(logs);
        setTransfers(parsedTransfers);

        // Fetch metadata for all unique token addresses
        const uniqueTokens = [
          ...new Set(parsedTransfers.map((t) => t.token.toLowerCase())),
        ];

        const metadata = {};
        await Promise.all(
          uniqueTokens.map(async (tokenAddress) => {
            try {
              const info = await detectTokenType(tokenAddress);
              if (info.isToken) {
                metadata[tokenAddress.toLowerCase()] = {
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
        console.error("Error processing token transfers:", error);
      } finally {
        setLoading(false);
      }
    }

    processTransfers();
  }, [logs]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Transfers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (transfers.length === 0) {
    return null; // Don't show section if no token transfers
  }

  const getTokenBadgeVariant = (type) => {
    switch (type) {
      case "ERC20":
      case "ERC20/721":
        return "default";
      case "ERC721":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Token Transfers</CardTitle>
          <Badge variant="secondary">
            {transfers.length} transfer{transfers.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {transfers.map((transfer, index) => {
          const metadata = tokenMetadata[transfer.token.toLowerCase()] || {};
          const decimals = metadata.decimals || 18;

          return (
            <div
              key={`${transfer.token}-${transfer.logIndex || index}`}
              className="p-4 border rounded-lg"
            >
              {/* Transfer Type Badge */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={getTokenBadgeVariant(transfer.type)}>
                  {transfer.type}
                </Badge>
                {metadata.name && (
                  <span className="font-semibold">{metadata.name}</span>
                )}
                {metadata.symbol && (
                  <span className="text-sm text-muted-foreground">
                    ({metadata.symbol})
                  </span>
                )}
              </div>

              {/* Token Address */}
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Token Address
                </div>
                <Link
                  href={`/address/${transfer.token}`}
                  className="font-mono text-sm text-primary hover:underline"
                >
                  {shortenAddress(transfer.token, 8)}
                </Link>
              </div>

              {/* Transfer Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* From */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">From</div>
                  <Link
                    href={`/address/${transfer.from}`}
                    className="font-mono text-sm hover:text-primary transition-colors"
                  >
                    {transfer.from ===
                    "0x0000000000000000000000000000000000000000"
                      ? "0x0 (Mint)"
                      : shortenAddress(transfer.from, 6)}
                  </Link>
                </div>

                {/* To */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">To</div>
                  <Link
                    href={`/address/${transfer.to}`}
                    className="font-mono text-sm hover:text-primary transition-colors"
                  >
                    {transfer.to ===
                    "0x0000000000000000000000000000000000000000"
                      ? "0x0 (Burn)"
                      : shortenAddress(transfer.to, 6)}
                  </Link>
                </div>

                {/* Amount/Token ID */}
                <div>
                  {transfer.type === "ERC20" || transfer.type === "ERC20/721"
                    ? <>
                        <div className="text-xs text-muted-foreground mb-1">
                          Amount
                        </div>
                        <div className="font-semibold">
                          {transfer.value && BigInt(transfer.value) < 1000000n
                            ? `Token ID #${transfer.value}`
                            : formatTokenAmount(
                                BigInt(transfer.value),
                                decimals,
                              )}
                        </div>
                      </>
                    : transfer.type === "ERC721"
                      ? <>
                          <div className="text-xs text-muted-foreground mb-1">
                            Token ID
                          </div>
                          <div className="font-mono text-sm">
                            #{transfer.tokenId}
                          </div>
                        </>
                      : transfer.type === "ERC1155"
                        ? <>
                            <div className="text-xs text-muted-foreground mb-1">
                              Token ID / Amount
                            </div>
                            <div className="font-mono text-sm">
                              #{transfer.tokenId} × {transfer.value}
                            </div>
                          </>
                        : transfer.type === "ERC1155_BATCH"
                          ? <>
                              <div className="text-xs text-muted-foreground mb-1">
                                Batch Transfer
                              </div>
                              <div className="text-sm">
                                {transfer.tokenIds?.length || 0} tokens
                              </div>
                            </>
                          : null}
                </div>
              </div>

              {/* Operator (for ERC1155) */}
              {transfer.operator && transfer.operator !== transfer.from && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-1">
                    Operator (Approved)
                  </div>
                  <Link
                    href={`/address/${transfer.operator}`}
                    className="font-mono text-sm text-muted-foreground hover:text-primary"
                  >
                    {shortenAddress(transfer.operator, 6)}
                  </Link>
                </div>
              )}

              {/* Batch Details (for ERC1155_BATCH) */}
              {transfer.type === "ERC1155_BATCH" &&
                transfer.tokenIds &&
                transfer.values && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-2">
                      Batch Details
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {transfer.tokenIds.map((tokenId, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <span className="font-mono text-muted-foreground">
                            Token #{tokenId}
                          </span>
                          <span>× {transfer.values[idx]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
