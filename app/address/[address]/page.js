"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import AddressLabel from "@/app/components/AddressLabel";
import ContractGasProfile from "@/app/components/ContractGasProfile";
import ContractInteraction from "@/app/components/ContractInteraction";
import LabelBadge from "@/app/components/LabelBadge";
import SourceCodeViewer from "@/app/components/SourceCodeViewer";
import TokenBalances from "@/app/components/TokenBalances";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { getABI, getSourceCode, saveSourceCode } from "@/lib/abi-store";
import {
  fetchBlocksBatched,
  fetchReceiptsBatched,
  getLatestBlockNumber,
} from "@/lib/block-utils";
import { formatEther, publicClient, shortenAddress } from "@/lib/viem";

export default function AddressPage({ params }) {
  const { address } = use(params);
  const [balance, setBalance] = useState(null);
  const [code, setCode] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [abiData, setAbiData] = useState(null);
  const [sourceData, setSourceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [uploadingSource, setUploadingSource] = useState(false);

  const isContract = code && code !== "0x";

  useEffect(() => {
    async function fetchAddressData() {
      try {
        const [balanceData, codeData] = await Promise.all([
          publicClient.getBalance({ address }),
          publicClient.getCode({ address }),
        ]);

        setBalance(balanceData);
        setCode(codeData);

        // Check if ABI exists
        if (codeData && codeData !== "0x") {
          const abi = getABI(address);
          setAbiData(abi);

          // Check if source code exists
          const source = getSourceCode(address);
          setSourceData(source);
        }

        setLoading(false);

        // Fetch recent transactions
        fetchTransactions();
      } catch (error) {
        console.error("Error fetching address data:", error);
        setLoading(false);
      }
    }

    async function fetchTransactions() {
      try {
        // Get recent blocks and filter transactions
        const blockNumber = await getLatestBlockNumber();
        const fromBlock = blockNumber - 99n > 0n ? blockNumber - 99n : 0n;

        // Fetch all blocks in parallel batches
        const blocks = await fetchBlocksBatched(fromBlock, blockNumber, {
          includeTransactions: true,
          batchSize: 10,
        });

        // Sort blocks by number descending (newest first)
        blocks.sort((a, b) => Number(b.number) - Number(a.number));

        // Filter transactions involving this address
        const addressLower = address.toLowerCase();
        const filteredTxs = [];
        const txToBlock = new Map();

        for (const block of blocks) {
          if (!Array.isArray(block.transactions)) continue;

          for (const tx of block.transactions) {
            if (
              tx.from?.toLowerCase() === addressLower ||
              tx.to?.toLowerCase() === addressLower
            ) {
              filteredTxs.push(tx);
              txToBlock.set(tx.hash.toLowerCase(), block);
            }
          }

          // Stop early if we have enough
          if (filteredTxs.length >= 20) break;
        }

        // Fetch receipts for filtered transactions in parallel
        const hashes = filteredTxs.slice(0, 20).map((tx) => tx.hash);
        const receipts = await fetchReceiptsBatched(hashes, { batchSize: 20 });

        // Create receipt lookup map
        const receiptMap = new Map();
        for (const receipt of receipts) {
          if (receipt && receipt.transactionHash) {
            receiptMap.set(receipt.transactionHash.toLowerCase(), receipt);
          }
        }

        // Combine transactions with receipts
        const recentTxs = filteredTxs.slice(0, 20).map((tx) => {
          const block = txToBlock.get(tx.hash.toLowerCase());
          const receipt = receiptMap.get(tx.hash.toLowerCase());
          return {
            ...tx,
            blockNumber: block?.number,
            timestamp: block?.timestamp,
            logs: receipt?.logs || [],
          };
        });

        setTransactions(recentTxs);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setTxLoading(false);
      }
    }

    fetchAddressData();
  }, [address]);

  const handleSourceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSource(true);
    try {
      const text = await file.text();
      saveSourceCode(address, text, file.name);
      setSourceData({ sourceCode: text, fileName: file.name });
    } catch (err) {
      console.error("Failed to upload source:", err);
      alert("Failed to upload source code");
    } finally {
      setUploadingSource(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">
          {isContract ? "Contract" : "Address"}
        </h1>
        {isContract && <Badge variant="secondary">Contract</Badge>}
      </div>

      {/* Address Info */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Address</div>
              <div className="font-mono text-sm break-all">{address}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Balance</div>
              <div className="text-2xl font-bold">
                {formatEther(balance, 6)} ETH
              </div>
            </div>
            {isContract && (
              <>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Contract Status
                  </div>
                  <div className="flex items-center gap-2">
                    {abiData ? (
                      <>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          ABI Available {abiData.name && `(${abiData.name})`}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <span className="text-yellow-600 dark:text-yellow-400">
                          No ABI Available
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          asChild
                          className="ml-2 h-auto p-0"
                        >
                          <Link href="/upload-abi">Upload ABI</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Bytecode
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {code.length} bytes
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Label */}
      <div className="mb-8">
        <AddressLabel address={address} />
      </div>

      {/* Contract Interaction */}
      {isContract && abiData && (
        <div className="mb-8">
          <ContractInteraction address={address} abiData={abiData} />
        </div>
      )}

      {/* Contract Gas Profile */}
      {isContract && (
        <div className="mb-8">
          <ContractGasProfile address={address} />
        </div>
      )}

      {/* Token Balances */}
      <div className="mb-8">
        <TokenBalances address={address} transactions={transactions} />
      </div>

      {/* Source Code */}
      {isContract && (
        <div className="mb-8">
          {sourceData ? (
            <SourceCodeViewer
              sourceCode={sourceData.sourceCode}
              fileName={sourceData.fileName}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Contract Source Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📄</div>
                  <div className="text-muted-foreground mb-4">
                    No source code available
                  </div>
                  <input
                    type="file"
                    accept=".sol"
                    onChange={handleSourceUpload}
                    className="hidden"
                    id="source-upload"
                  />
                  <Button asChild>
                    <label htmlFor="source-upload" className="cursor-pointer">
                      {uploadingSource
                        ? "Uploading..."
                        : "📤 Upload Source Code"}
                    </label>
                  </Button>
                  <div className="text-xs text-muted-foreground mt-2">
                    Upload .sol file from your Foundry project
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Contract Bytecode */}
      {isContract && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Contract Bytecode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded font-mono text-xs break-all max-h-96 overflow-y-auto">
              {code}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isFrom = tx.from.toLowerCase() === address.toLowerCase();
                const isTo = tx.to?.toLowerCase() === address.toLowerCase();

                return (
                  <Link
                    key={tx.hash}
                    href={`/tx/${tx.hash}`}
                    className="block p-4 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isFrom && <Badge variant="destructive">OUT</Badge>}
                        {isTo && (
                          <Badge className="bg-green-600 hover:bg-green-700">
                            IN
                          </Badge>
                        )}
                        <span className="font-mono text-sm">
                          {shortenAddress(tx.hash, 8)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Block {tx.blockNumber?.toString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {isFrom ? (
                          <>
                            To:{" "}
                            <span className="font-mono">
                              {tx.to
                                ? shortenAddress(tx.to)
                                : "Contract Creation"}
                            </span>
                            {tx.to && <LabelBadge address={tx.to} />}
                          </>
                        ) : (
                          <>
                            From:{" "}
                            <span className="font-mono">
                              {shortenAddress(tx.from)}
                            </span>
                            <LabelBadge address={tx.from} />
                          </>
                        )}
                      </div>
                      <div className="font-semibold text-primary">
                        {formatEther(tx.value)} ETH
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found in recent blocks
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
