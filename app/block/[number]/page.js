'use client';

import { use, useEffect, useState } from 'react';
import { publicClient, formatEther, shortenAddress } from '@/lib/viem';
import Link from 'next/link';

export default function BlockPage({ params }) {
  const { number } = use(params);
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlock() {
      try {
        const blockData = await publicClient.getBlock({
          blockNumber: BigInt(number),
          includeTransactions: true,
        });
        setBlock(blockData);
      } catch (error) {
        console.error('Error fetching block:', error);
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Block not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">
        Block #{block.number.toString()}
      </h1>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoRow label="Block Height" value={block.number.toString()} />
          <InfoRow
            label="Timestamp"
            value={new Date(Number(block.timestamp) * 1000).toLocaleString()}
          />
          <InfoRow
            label="Transactions"
            value={Array.isArray(block.transactions) ? block.transactions.length : 0}
          />
          <InfoRow label="Gas Used" value={block.gasUsed.toString()} />
          <InfoRow label="Gas Limit" value={block.gasLimit.toString()} />
          <InfoRow label="Base Fee" value={`${formatEther(block.baseFeePerGas)} ETH`} />
          <InfoRow label="Hash" value={block.hash} mono full />
          <InfoRow label="Parent Hash" value={block.parentHash} mono full />
          <InfoRow label="Miner" value={block.miner} mono full />
          <InfoRow label="Difficulty" value={block.difficulty.toString()} />
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
        Transactions ({Array.isArray(block.transactions) ? block.transactions.length : 0})
      </h2>

      <div className="space-y-3">
        {Array.isArray(block.transactions) && block.transactions.length > 0 ? (
          block.transactions.map((tx) => (
            <Link
              key={tx.hash}
              href={`/tx/${tx.hash}`}
              className="block p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-red-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                  {shortenAddress(tx.hash, 8)}
                </div>
                <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatEther(tx.value)} ETH
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                <div>From: <span className="font-mono">{shortenAddress(tx.from)}</span></div>
                <div>→</div>
                <div>To: <span className="font-mono">{tx.to ? shortenAddress(tx.to) : 'Contract Creation'}</span></div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-zinc-500">No transactions in this block</div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false, full = false }) {
  return (
    <div>
      <div className="text-sm text-zinc-500 mb-1">{label}</div>
      <div className={`text-sm text-zinc-900 dark:text-zinc-100 ${mono ? 'font-mono' : ''} ${full ? 'break-all' : ''}`}>
        {value}
      </div>
    </div>
  );
}
