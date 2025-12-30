"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchBlocksBatched, getLatestBlockNumber } from "@/lib/block-utils";
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
        const fromBlock = blockNumber - BigInt(count - 1);
        const actualFromBlock = fromBlock < 0n ? 0n : fromBlock;

        const fetchedBlocks = await fetchBlocksBatched(
          actualFromBlock,
          blockNumber,
          {
            includeTransactions: true,
            batchSize: 10,
          },
        );

        // Sort by block number descending (newest first)
        fetchedBlocks.sort((a, b) => Number(b.number) - Number(a.number));

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
        const fromBlock = blockNumber - BigInt(maxBlocksToScan - 1);
        const actualFromBlock = fromBlock < 0n ? 0n : fromBlock;

        // Fetch all blocks in parallel batches
        const blocks = await fetchBlocksBatched(actualFromBlock, blockNumber, {
          includeTransactions: true,
          batchSize: 10,
        });

        // Sort by block number descending (newest first)
        blocks.sort((a, b) => Number(b.number) - Number(a.number));

        // Extract transactions from blocks
        const recentTxs = [];
        for (const block of blocks) {
          if (recentTxs.length >= count) break;

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
          publicClient
            .getBalance({ address })
            .then((bal) => ({ address, balance: bal })),
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

/**
 * Hook for watching contract events in real-time
 */
export function useWatchEvents(options = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unwatchRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startWatching = async () => {
      try {
        const watchParams = {
          onLogs: (logs) => {
            if (mounted) {
              setEvents((prev) => [...logs, ...prev].slice(0, 100));
              setLoading(false);
            }
          },
          onError: (err) => {
            console.error("Error watching events:", err);
            if (mounted) {
              setError(err);
            }
          },
          pollingInterval: 1000,
        };

        // Add filters
        if (options.address) {
          watchParams.address = options.address;
        }

        if (options.event) {
          watchParams.event = options.event;
        }

        if (options.args) {
          watchParams.args = options.args;
        }

        // Start watching
        const unwatch = publicClient.watchEvent(watchParams);
        unwatchRef.current = unwatch;
        setLoading(false);
      } catch (err) {
        console.error("Failed to start watching events:", err);
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
  }, [options.address, options.event, options.args]);

  return { events, loading, error };
}

/**
 * Hook for event streaming with persistence
 */
export function useEventStream(subscriptionId) {
  const [events, setEvents] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || !subscriptionId) return;

    // Import dynamically to avoid SSR issues
    import("@/lib/event-streaming").then((module) => {
      const manager = module.getSubscriptionManager();
      if (!manager) return;

      // Get subscription
      const sub = manager.getSubscription(subscriptionId);
      setSubscription(sub);

      // Get stored events for this subscription
      const storedEvents = module.getStoredEvents({ subscriptionId });
      setEvents(storedEvents);
      setLoading(false);

      // Listen for new events
      const unregister = manager.on((event) => {
        if (
          event.subscriptionId === subscriptionId &&
          event.type === "events"
        ) {
          setEvents((prev) => [...event.events, ...prev].slice(0, 100));
          setSubscription({
            ...sub,
            eventCount: sub.eventCount + event.events.length,
          });
        }
      });

      return () => {
        unregister();
      };
    });
  }, [subscriptionId]);

  return { events, subscription, loading };
}

/**
 * Hook for managing event subscriptions
 */
export function useEventSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSubscriptions = useCallback(() => {
    if (typeof window === "undefined") return;

    import("@/lib/event-streaming").then((module) => {
      const manager = module.getSubscriptionManager();
      if (manager) {
        setSubscriptions(manager.getAllSubscriptions());
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const createSubscription = useCallback(
    async (options) => {
      if (typeof window === "undefined") return null;

      const module = await import("@/lib/event-streaming");
      const manager = module.getSubscriptionManager();
      if (!manager) return null;

      const sub = await manager.subscribe(options);
      loadSubscriptions();
      return sub;
    },
    [loadSubscriptions],
  );

  const updateSubscription = useCallback(
    (id, updates) => {
      if (typeof window === "undefined") return null;

      import("@/lib/event-streaming").then((module) => {
        const manager = module.getSubscriptionManager();
        if (manager) {
          manager.updateSubscription(id, updates);
          loadSubscriptions();
        }
      });
    },
    [loadSubscriptions],
  );

  const deleteSubscription = useCallback(
    (id) => {
      if (typeof window === "undefined") return;

      import("@/lib/event-streaming").then((module) => {
        const manager = module.getSubscriptionManager();
        if (manager) {
          manager.deleteSubscription(id);
          loadSubscriptions();
        }
      });
    },
    [loadSubscriptions],
  );

  const startAll = useCallback(() => {
    if (typeof window === "undefined") return;

    import("@/lib/event-streaming").then((module) => {
      const manager = module.getSubscriptionManager();
      if (manager) {
        manager.startAll();
        loadSubscriptions();
      }
    });
  }, [loadSubscriptions]);

  const stopAll = useCallback(() => {
    if (typeof window === "undefined") return;

    import("@/lib/event-streaming").then((module) => {
      const manager = module.getSubscriptionManager();
      if (manager) {
        manager.stopAll();
        loadSubscriptions();
      }
    });
  }, [loadSubscriptions]);

  return {
    subscriptions,
    loading,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    startAll,
    stopAll,
    refresh: loadSubscriptions,
  };
}
