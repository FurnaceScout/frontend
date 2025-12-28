'use client';

import { useEffect, useState } from 'react';
import { publicClient } from '@/lib/viem';
import { decodeLogs } from '@/lib/contract-decoder';
import { getAllABIs } from '@/lib/abi-store';
import Link from 'next/link';
import { shortenAddress } from '@/lib/viem';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    address: '',
    fromBlock: '',
    toBlock: '',
    eventName: '',
  });
  const [availableContracts, setAvailableContracts] = useState([]);

  useEffect(() => {
    // Load available contracts from ABI store
    const abis = getAllABIs();
    const contracts = Object.entries(abis).map(([addr, data]) => ({
      address: addr,
      name: data.name,
    }));
    setAvailableContracts(contracts);

    // Fetch events on load
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const blockNumber = await publicClient.getBlockNumber();
      const fromBlock = filters.fromBlock
        ? BigInt(filters.fromBlock)
        : blockNumber - 100n;
      const toBlock = filters.toBlock ? BigInt(filters.toBlock) : blockNumber;

      const allEvents = [];

      // Fetch logs from blocks
      for (let i = fromBlock; i <= toBlock && allEvents.length < 100; i++) {
        try {
          const block = await publicClient.getBlock({
            blockNumber: i,
            includeTransactions: true,
          });

          if (Array.isArray(block.transactions) && block.transactions.length > 0) {
            for (const tx of block.transactions) {
              try {
                const receipt = await publicClient.getTransactionReceipt({
                  hash: tx.hash,
                });

                if (receipt.logs && receipt.logs.length > 0) {
                  // Filter by address if specified
                  let filteredLogs = receipt.logs;
                  if (filters.address) {
                    filteredLogs = filteredLogs.filter(
                      (log) =>
                        log.address.toLowerCase() === filters.address.toLowerCase()
                    );
                  }

                  // Decode logs
                  const decodedLogs = decodeLogs(filteredLogs);

                  // Filter by event name if specified
                  let finalLogs = decodedLogs;
                  if (filters.eventName) {
                    finalLogs = decodedLogs.filter(
                      (log) =>
                        log.decoded?.eventName
                          ?.toLowerCase()
                          .includes(filters.eventName.toLowerCase())
                    );
                  }

                  allEvents.push(
                    ...finalLogs.map((log) => ({
                      ...log,
                      transactionHash: tx.hash,
                      blockNumber: block.number,
                      timestamp: block.timestamp,
                    }))
                  );
                }
              } catch (e) {
                // Skip failed receipts
                continue;
              }
            }
          }
        } catch (e) {
          // Skip failed blocks
          continue;
        }
      }

      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleReset = () => {
    setFilters({
      address: '',
      fromBlock: '',
      toBlock: '',
      eventName: '',
    });
    setTimeout(() => fetchEvents(), 0);
  };

  const exportToCSV = () => {
    const headers = ['Block', 'Transaction', 'Contract', 'Event', 'Data'];
    const rows = events.map((event) => [
      event.blockNumber?.toString() || '',
      event.transactionHash || '',
      event.address || '',
      event.decoded?.eventName || 'Unknown',
      event.decoded?.args
        ? JSON.stringify(event.decoded.args)
        : JSON.stringify(event.data),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Event Logs
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          View and filter contract events across blocks
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Contract Address Filter */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Contract Address
              </label>
              {availableContracts.length > 0 ? (
                <select
                  value={filters.address}
                  onChange={(e) => handleFilterChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                >
                  <option value="">All Contracts</option>
                  {availableContracts.map((contract) => (
                    <option key={contract.address} value={contract.address}>
                      {contract.name || shortenAddress(contract.address)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filters.address}
                  onChange={(e) => handleFilterChange('address', e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                />
              )}
            </div>

            {/* Event Name Filter */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Event Name
              </label>
              <input
                type="text"
                value={filters.eventName}
                onChange={(e) => handleFilterChange('eventName', e.target.value)}
                placeholder="Transfer, Approval..."
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              />
            </div>

            {/* From Block */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                From Block
              </label>
              <input
                type="number"
                value={filters.fromBlock}
                onChange={(e) => handleFilterChange('fromBlock', e.target.value)}
                placeholder="Latest - 100"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              />
            </div>

            {/* To Block */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                To Block
              </label>
              <input
                type="number"
                value={filters.toBlock}
                onChange={(e) => handleFilterChange('toBlock', e.target.value)}
                placeholder="Latest"
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold text-sm disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Searching...' : '🔍 Search Events'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 font-semibold text-sm transition-colors"
            >
              Reset
            </button>
            {events.length > 0 && (
              <button
                type="button"
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold text-sm transition-colors ml-auto"
              >
                📥 Export CSV
              </button>
            )}
          </div>
        </form>

        {/* Info Banner */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded text-sm text-blue-700 dark:text-blue-300">
          <strong>💡 Tip:</strong> Upload contract ABIs to see decoded event data.
          Without ABIs, only raw event data is shown.
        </div>
      </div>

      {/* Results */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            Events ({events.length})
          </h2>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              Loading events...
            </div>
          )}
        </div>

        {!loading && events.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <div className="text-4xl mb-3">📋</div>
            <div className="font-semibold mb-1">No events found</div>
            <div className="text-sm">Try adjusting your filters or block range</div>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <div
                key={`${event.transactionHash}-${event.logIndex}-${index}`}
                className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-red-500 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {event.decoded ? (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs font-semibold">
                          DECODED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded text-xs font-semibold">
                          RAW
                        </span>
                      )}
                      <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
                        {event.decoded?.eventName || 'Unknown Event'}
                      </span>
                      {event.contractName && (
                        <span className="text-xs text-zinc-500">
                          ({event.contractName})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      Log Index: {event.logIndex?.toString()}
                    </div>
                  </div>
                  <div className="text-right text-xs text-zinc-500">
                    <div>
                      Block{' '}
                      <Link
                        href={`/block/${event.blockNumber}`}
                        className="text-red-500 hover:underline font-mono"
                      >
                        {event.blockNumber?.toString()}
                      </Link>
                    </div>
                    <div>
                      {new Date(Number(event.timestamp) * 1000).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Contract & Transaction */}
                <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                  <div>
                    <div className="text-zinc-500 mb-1">Contract</div>
                    <Link
                      href={`/address/${event.address}`}
                      className="font-mono text-red-500 hover:underline"
                    >
                      {shortenAddress(event.address)}
                    </Link>
                  </div>
                  <div>
                    <div className="text-zinc-500 mb-1">Transaction</div>
                    <Link
                      href={`/tx/${event.transactionHash}`}
                      className="font-mono text-red-500 hover:underline"
                    >
                      {shortenAddress(event.transactionHash, 8)}
                    </Link>
                  </div>
                </div>

                {/* Event Data */}
                {event.decoded?.args ? (
                  <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded">
                    <div className="text-xs text-zinc-500 mb-2 font-semibold">
                      Decoded Arguments:
                    </div>
                    <pre className="font-mono text-xs text-zinc-900 dark:text-zinc-100 overflow-x-auto">
                      {JSON.stringify(
                        event.decoded.args,
                        (_, v) => (typeof v === 'bigint' ? v.toString() : v),
                        2
                      )}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded">
                    <div className="text-xs text-zinc-500 mb-2 font-semibold">
                      Raw Data:
                    </div>
                    <div className="font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all">
                      {event.data}
                    </div>
                    {event.error && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                        ⚠ {event.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
