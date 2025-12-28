"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { publicClient } from "@/lib/viem";

/**
 * Hook for watching the latest block number with real-time updates
 */
export function useWatchBlockNumber() {
  const [blockNumber, setBlockNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unwatchRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startWatching = async () => {
      try {
        // Get initial block number
        const initialBlock = await publicClient.getBlockNumber();
        if (mounted) {
          setBlockNumber(initialBlock);
          setLoading(false);
        }

        // Set up watch for new blocks
        const unwatch = publicClient.watchBlockNumber({
          onBlockNumber: (newBlockNumber) => {
            if (mounted) {
              setBlockNumber(newBlockNumber);
            }
          },
          onError: (err) => {
            console.error("Error watching block number:", err);
            if (mounted) {
              setError(err);
            }
          },
          // Poll every 1 second (Anvil is fast)
          pollingInterval: 1000,
        });

        unwatchRef.current = unwatch;
      } catch (err) {
        console.error("Failed to start watching blocks:", err);
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    startWatching();

    return () => {
      mounted = false;
      if (unwatchRef.current) {
        unwatchRef.current();
      }
    };
  }, []);

  return { blockNumber, loading, error };
}

/**
 * Hook for fetching and auto-updating the latest blocks
 */
export function useLatestBlocks(count = 10) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { blockNumber } = useWatchBlockNumber();

  useEffect(() => {
    if (blockNumber === null) return;

    const fetchBlocks = async () => {
      try {
        const blockPromises = [];
        for (let i = 0; i < count && blockNumber - BigInt(i) >= 0n; i++) {
          blockPromises.push(
            publicClient.getBlock({
              blockNumber: blockNumber - BigInt(i),
              includeTransactions: true,
            })
          );
        }

        const fetchedBlocks = await Promise.all(blockPromises);
        setBlocks(fetchedBlocks);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blocks:", error);
        setLoading(false);
      }
    };

    fetchBlocks();
  }, [blockNumber, count]);

  return { blocks, loading, blockNumber };
}

/**
 * Hook for fetching and auto-updating recent transactions
 */
export function useLatestTransactions(count = 10, maxBlocksToScan = 100) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { blockNumber } = useWatchBlockNumber();
  const lastScannedRef = useRef(null);

  useEffect(() => {
    if (blockNumber === null) return;

    // Only fetch if we haven't scanned this block yet
    if (lastScannedRef.current === blockNumber) return;
    lastScannedRef.current = blockNumber;

    const fetchTransactions = async () => {
      try {
        const recentTxs = [];

        // Scan recent blocks for transactions
        for (
          let i = 0;
          i < maxBlocksToScan && blockNumber - BigInt(i) >= 0n;
          i++
        ) {
          if (recentTxs.length >= count) break;

          const block = await publicClient.getBlock({
            blockNumber: blockNumber - BigInt(i),
            includeTransactions: true,
          });

          if (block.transactions && Array.isArray(block.transactions)) {
            const txsWithBlock = block.transactions.map((tx) => ({
              ...tx,
              blockNumber: block.number,
              timestamp: block.timestamp,
            }));
            recentTxs.push(...txsWithBlock);
          }
        }

        setTransactions(recentTxs.slice(0, count));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [blockNumber, count, maxBlocksToScan]);

  return { transactions, loading, blockNumber };
}

/**
 * Hook for watching a specific address balance
 */
export function useWatchBalance(address) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const { blockNumber } = useWatchBlockNumber();

  useEffect(() => {
    if (!address || blockNumber === null) return;

    const fetchBalance = async () => {
      try {
        const bal = await publicClient.getBalance({ address });
        setBalance(bal);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setLoading(false);
      }
    };

    fetchBalance();
  }, [address, blockNumber]);

  return { balance, loading };
}

/**
 * Hook for watching multiple addresses and their balances
 */
export function useWatchBalances(addresses) {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const { blockNumber } = useWatchBlockNumber();

  useEffect(() => {
    if (!addresses || addresses.length === 0 || blockNumber === null) return;

    const fetchBalances = async () => {
      try {
        const balancePromises = addresses.map((address) =>
          publicClient.getBalance({ address }).then((bal) => ({ address, balance: bal }))
        );

        const results = await Promise.all(balancePromises);
        const balanceMap = {};
        results.forEach(({ address, balance }) => {
          balanceMap[address.toLowerCase()] = balance;
        });

        setBalances(balanceMap);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching balances:", error);
        setLoading(false);
      }
    };

    fetchBalances();
  }, [addresses, blockNumber]);

  return { balances, loading };
}

/**
 * Hook for fetching chain info with real-time updates
 */
export function useChainInfo() {
  const [chainInfo, setChainInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const { blockNumber } = useWatchBlockNumber();

  useEffect(() => {
    if (blockNumber === null) return;

    const fetchChainInfo = async () => {
      try {
        const [chainId, gasPrice] = await Promise.all([
          publicClient.getChainId(),
          publicClient.getGasPrice(),
        ]);

        setChainInfo({
          blockNumber: blockNumber.toString(),
          chainId: chainId.toString(),
          gasPrice: gasPrice.toString(),
        });
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch chain info:", error);
        setLoading(false);
      }
    };

    fetchChainInfo();
  }, [blockNumber]);

  return { chainInfo, loading, blockNumber };
}

/**
 * Hook for watching a specific block
 */
export function useWatchBlock(blockNumberOrTag) {
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const { blockNumber: latestBlock } = useWatchBlockNumber();

  useEffect(() => {
    if (latestBlock === null) return;

    const fetchBlock = async () => {
      try {
        const blockData = await publicClient.getBlock({
          blockNumber:
            blockNumberOrTag === "latest"
              ? latestBlock
              : BigInt(blockNumberOrTag),
          includeTransactions: true,
        });
        setBlock(blockData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching block:", error);
        setLoading(false);
      }
    };

    fetchBlock();
  }, [blockNumberOrTag, latestBlock]);

  return { block, loading };
}
