"use client";

import { parseTokenTransfers } from "@/lib/tokens";
import { shortenAddress } from "@/lib/viem";
import Link from "next/link";
import { useEffect, useState } from "react";
import { detectTokenType, formatTokenAmount } from "@/lib/tokens";

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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
          Token Transfers
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (transfers.length === 0) {
    return null; // Don't show section if no token transfers
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Token Transfers
        </h2>
        <span className="text-sm text-zinc-500">
          {transfers.length} transfer{transfers.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4">
        {transfers.map((transfer, index) => {
          const metadata = tokenMetadata[transfer.token.toLowerCase()] || {};
          const decimals = metadata.decimals || 18;

          return (
            <div
              key={`${transfer.token}-${transfer.logIndex || index}`}
              className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg"
            >
              {/* Transfer Type Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    transfer.type === "ERC20" || transfer.type === "ERC20/721"
                      ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                      : transfer.type === "ERC721"
                        ? "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                        : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  }`}
                >
                  {transfer.type}
                </span>
                {metadata.name && (
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {metadata.name}
                  </span>
                )}
                {metadata.symbol && (
                  <span className="text-sm text-zinc-500">
                    ({metadata.symbol})
                  </span>
                )}
              </div>

              {/* Token Address */}
              <div className="mb-3">
                <div className="text-xs text-zinc-500 mb-1">Token Address</div>
                <Link
                  href={`/address/${transfer.token}`}
                  className="font-mono text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  {shortenAddress(transfer.token, 8)}
                </Link>
              </div>

              {/* Transfer Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* From */}
                <div>
                  <div className="text-xs text-zinc-500 mb-1">From</div>
                  <Link
                    href={`/address/${transfer.from}`}
                    className="font-mono text-sm text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    {transfer.from === "0x0000000000000000000000000000000000000000"
                      ? "0x0 (Mint)"
                      : shortenAddress(transfer.from, 6)}
                  </Link>
                </div>

                {/* To */}
                <div>
                  <div className="text-xs text-zinc-500 mb-1">To</div>
                  <Link
                    href={`/address/${transfer.to}`}
                    className="font-mono text-sm text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    {transfer.to === "0x0000000000000000000000000000000000000000"
                      ? "0x0 (Burn)"
                      : shortenAddress(transfer.to, 6)}
                  </Link>
                </div>

                {/* Amount/Token ID */}
                <div>
                  {transfer.type === "ERC20" || transfer.type === "ERC20/721" ? (
                    <>
                      <div className="text-xs text-zinc-500 mb-1">Amount</div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {transfer.value && BigInt(transfer.value) < 1000000n
                          ? `Token ID #${transfer.value}`
                          : formatTokenAmount(BigInt(transfer.value), decimals)}
                      </div>
                    </>
                  ) : transfer.type === "ERC721" ? (
                    <>
                      <div className="text-xs text-zinc-500 mb-1">Token ID</div>
                      <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                        #{transfer.tokenId}
                      </div>
                    </>
                  ) : transfer.type === "ERC1155" ? (
                    <>
                      <div className="text-xs text-zinc-500 mb-1">
                        Token ID / Amount
                      </div>
                      <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                        #{transfer.tokenId} × {transfer.value}
                      </div>
                    </>
                  ) : transfer.type === "ERC1155_BATCH" ? (
                    <>
                      <div className="text-xs text-zinc-500 mb-1">
                        Batch Transfer
                      </div>
                      <div className="text-sm text-zinc-900 dark:text-zinc-100">
                        {transfer.tokenIds?.length || 0} tokens
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Operator (for ERC1155) */}
              {transfer.operator && transfer.operator !== transfer.from && (
                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs text-zinc-500 mb-1">
                    Operator (Approved)
                  </div>
                  <Link
                    href={`/address/${transfer.operator}`}
                    className="font-mono text-sm text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    {shortenAddress(transfer.operator, 6)}
                  </Link>
                </div>
              )}

              {/* Batch Details (for ERC1155_BATCH) */}
              {transfer.type === "ERC1155_BATCH" &&
                transfer.tokenIds &&
                transfer.values && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="text-xs text-zinc-500 mb-2">
                      Batch Details
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {transfer.tokenIds.map((tokenId, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1"
                        >
                          <span className="font-mono text-zinc-600 dark:text-zinc-400">
                            Token #{tokenId}
                          </span>
                          <span className="text-zinc-900 dark:text-zinc-100">
                            × {transfer.values[idx]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
