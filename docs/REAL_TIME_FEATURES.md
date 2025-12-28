# Real-Time Features & Enhanced Syntax Highlighting

This document describes the new real-time blockchain monitoring capabilities and enhanced syntax highlighting features added to FurnaceScout.

## Table of Contents

1. [Real-Time Updates](#real-time-updates)
2. [Enhanced Syntax Highlighting](#enhanced-syntax-highlighting)
3. [Custom Hooks](#custom-hooks)
4. [Performance Considerations](#performance-considerations)
5. [Usage Examples](#usage-examples)

---

## Real-Time Updates

FurnaceScout now uses **viem's `watchBlockNumber`** to provide real-time blockchain updates instead of polling at fixed intervals. This provides:

- ✅ **Instant updates** when new blocks are mined
- ✅ **Efficient resource usage** (no unnecessary polling)
- ✅ **Automatic reconnection** if connection is lost
- ✅ **Lower network overhead**

### Features with Real-Time Updates

#### 1. Homepage Dashboard
- **Live block feed**: New blocks appear instantly as they're mined
- **Live transaction feed**: New transactions appear in real-time
- **Visual indicators**: Pulsing green "Live" badges show active monitoring

#### 2. Anvil Status Widget
- **Real-time chain info**: Block number, chain ID, and gas price update automatically
- **Live balance tracking**: Test account balances update after every block
- **Connection status**: Visual indicator shows active connection to Anvil

#### 3. Address Pages
- **Balance updates**: Address balances refresh with each new block
- **Transaction history**: New transactions appear automatically

### How It Works

The real-time system uses a **single WebSocket-like connection** via viem's `watchBlockNumber`, which triggers callbacks whenever a new block is detected. This eliminates the need for multiple `setInterval` calls throughout the application.

```javascript
// Old approach (polling every 5 seconds)
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 5000);
  return () => clearInterval(interval);
}, []);

// New approach (real-time updates)
const { blockNumber } = useWatchBlockNumber();
useEffect(() => {
  if (blockNumber !== null) {
    fetchData();
  }
}, [blockNumber]);
```

---

## Enhanced Syntax Highlighting

FurnaceScout now uses **Shiki** for professional-grade syntax highlighting of Solidity source code.

### Features

#### 1. Beautiful Syntax Highlighting
- **Multiple themes**: Automatically switches between light and dark themes
- **Accurate Solidity highlighting**: Proper recognition of:
  - Keywords (`contract`, `function`, `modifier`, `event`, etc.)
  - Types (`uint256`, `address`, `bool`, etc.)
  - Comments (single and multi-line)
  - Strings and numbers
  - Special syntax (modifiers, visibility, etc.)

#### 2. Code Folding
- **Automatic detection** of foldable sections:
  - Contract definitions
  - Function definitions
  - Modifier definitions
  - Struct and enum definitions
- **Visual fold indicators**: Hover over line numbers to see fold/unfold buttons
- **Unfold All button**: Quickly expand all folded sections

#### 3. Enhanced Line Numbers
- **Togglable line numbers**: Show/hide with a button
- **Interactive hover**: Line backgrounds highlight on hover
- **Clean typography**: Monospace font optimized for code reading

### Supported Themes

- **Light mode**: `github-light` theme
- **Dark mode**: `github-dark` theme

Themes automatically switch based on system preferences.

---

## Custom Hooks

All real-time functionality is powered by custom React hooks located in `/app/hooks/useBlockchain.js`.

### Available Hooks

#### `useWatchBlockNumber()`
Watches for new blocks and returns the latest block number.

```javascript
const { blockNumber, loading, error } = useWatchBlockNumber();
```

**Returns:**
- `blockNumber`: Latest block number (BigInt)
- `loading`: Boolean indicating initial load
- `error`: Error object if connection fails

---

#### `useLatestBlocks(count = 10)`
Fetches the latest N blocks with automatic updates.

```javascript
const { blocks, loading, blockNumber } = useLatestBlocks(10);
```

**Parameters:**
- `count`: Number of recent blocks to fetch (default: 10)

**Returns:**
- `blocks`: Array of block objects
- `loading`: Boolean indicating initial load
- `blockNumber`: Current block number

---

#### `useLatestTransactions(count = 10, maxBlocksToScan = 100)`
Fetches recent transactions with automatic updates.

```javascript
const { transactions, loading, blockNumber } = useLatestTransactions(10, 100);
```

**Parameters:**
- `count`: Number of transactions to return (default: 10)
- `maxBlocksToScan`: How many blocks back to scan (default: 100)

**Returns:**
- `transactions`: Array of transaction objects with block metadata
- `loading`: Boolean indicating initial load
- `blockNumber`: Current block number

---

#### `useWatchBalance(address)`
Watches a single address balance with automatic updates.

```javascript
const { balance, loading } = useWatchBalance("0x1234...");
```

**Parameters:**
- `address`: Ethereum address to watch

**Returns:**
- `balance`: Current balance (BigInt)
- `loading`: Boolean indicating initial load

---

#### `useWatchBalances(addresses)`
Watches multiple addresses efficiently.

```javascript
const { balances, loading } = useWatchBalances([
  "0x1234...",
  "0x5678...",
]);
```

**Parameters:**
- `addresses`: Array of Ethereum addresses

**Returns:**
- `balances`: Object mapping addresses (lowercase) to balances (BigInt)
- `loading`: Boolean indicating initial load

---

#### `useChainInfo()`
Provides real-time chain information.

```javascript
const { chainInfo, loading, blockNumber } = useChainInfo();
```

**Returns:**
- `chainInfo`: Object with `blockNumber`, `chainId`, and `gasPrice` (all strings)
- `loading`: Boolean indicating initial load
- `blockNumber`: Current block number (BigInt)

---

#### `useWatchBlock(blockNumberOrTag)`
Watches a specific block or "latest".

```javascript
const { block, loading } = useWatchBlock("latest");
const { block, loading } = useWatchBlock(12345);
```

**Parameters:**
- `blockNumberOrTag`: Block number or "latest"

**Returns:**
- `block`: Block object with full details
- `loading`: Boolean indicating initial load

---

## Performance Considerations

### Polling Interval

The real-time system uses a **1-second polling interval** optimized for Anvil's fast block times. For production networks, you may want to adjust this:

```javascript
// In useBlockchain.js, line ~41
pollingInterval: 1000, // 1 second for Anvil
// For mainnet, consider: pollingInterval: 12000 (12 seconds)
```

### Memory Management

- All hooks properly clean up their subscriptions on unmount
- The `unwatchRef` pattern prevents memory leaks
- Only one `watchBlockNumber` subscription is created per hook instance

### Batching

The hooks automatically batch requests when possible:
- `useChainInfo()` fetches chain ID, block number, and gas price in parallel
- `useWatchBalances()` fetches all balances concurrently
- `useLatestBlocks()` uses `Promise.all()` for parallel block fetching

---

## Usage Examples

### Example 1: Real-Time Balance Widget

```javascript
import { useWatchBalance } from "@/app/hooks/useBlockchain";
import { formatEther } from "@/lib/viem";

export default function BalanceWidget({ address }) {
  const { balance, loading } = useWatchBalance(address);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h3>Balance</h3>
      <p>{formatEther(balance)} ETH</p>
      <span className="live-indicator">● Live</span>
    </div>
  );
}
```

### Example 2: Live Transaction Feed

```javascript
import { useLatestTransactions } from "@/app/hooks/useBlockchain";

export default function TransactionFeed() {
  const { transactions, loading } = useLatestTransactions(5);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Recent Transactions</h2>
      {transactions.map((tx) => (
        <TransactionCard key={tx.hash} transaction={tx} />
      ))}
    </div>
  );
}
```

### Example 3: Multi-Address Monitor

```javascript
import { useWatchBalances } from "@/app/hooks/useBlockchain";

export default function AddressMonitor({ addresses }) {
  const { balances, loading } = useWatchBalances(addresses);

  if (loading) return <div>Loading...</div>;

  return (
    <table>
      {addresses.map((addr) => (
        <tr key={addr}>
          <td>{addr}</td>
          <td>{formatEther(balances[addr.toLowerCase()])} ETH</td>
        </tr>
      ))}
    </table>
  );
}
```

---

## Migration Guide

### From Polling to Real-Time

If you have existing components using `setInterval`, here's how to migrate:

**Before:**
```javascript
const [data, setData] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    const blockNumber = await publicClient.getBlockNumber();
    setData(blockNumber);
  };

  fetchData();
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval);
}, []);
```

**After:**
```javascript
import { useWatchBlockNumber } from "@/app/hooks/useBlockchain";

const { blockNumber, loading } = useWatchBlockNumber();
// blockNumber automatically updates on each new block
```

---

## Troubleshooting

### Real-Time Updates Not Working

1. **Check Anvil is running**: Ensure Anvil is running on `http://127.0.0.1:8545`
2. **Check RPC URL**: Verify `NEXT_PUBLIC_RPC_URL` in `.env.local`
3. **Check console**: Look for WebSocket or connection errors
4. **Restart dev server**: Sometimes Next.js needs a restart after env changes

### Syntax Highlighting Issues

1. **Shiki not installed**: Run `bun install shiki`
2. **Large files**: Very large files may take a moment to highlight
3. **Unsupported language**: Shiki supports Solidity, but ensure files have valid syntax

### Performance Issues

1. **Too many hooks**: Avoid creating multiple instances of the same hook for the same data
2. **Large block ranges**: Limit `maxBlocksToScan` in transaction fetching
3. **Memory usage**: Close browser DevTools if open, as it can slow down React

---

## Future Enhancements

Potential improvements for the real-time system:

- [ ] **WebSocket native support**: Use native WebSocket for even better performance
- [ ] **Event streaming**: Real-time event log streaming
- [ ] **Mempool monitoring**: Watch pending transactions
- [ ] **Multi-chain support**: Watch multiple chains simultaneously
- [ ] **Notification system**: Browser notifications for specific events
- [ ] **Historical playback**: Replay past blocks with real-time speed control

---

## Technical Details

### Dependencies

- **viem** (^2.21.54): Blockchain interaction and watching
- **shiki** (^3.20.0): Syntax highlighting
- **React** (19.2.3): Hook-based architecture

### Architecture

The real-time system follows a **single source of truth** pattern:

```
useWatchBlockNumber (master watch)
        │
        ├─── useLatestBlocks
        ├─── useLatestTransactions
        ├─── useWatchBalance
        ├─── useWatchBalances
        ├─── useChainInfo
        └─── useWatchBlock
```

Each component hook subscribes to `useWatchBlockNumber` and reacts to block changes, ensuring synchronized updates across the entire application.

---

## Credits

- **viem**: Excellent TypeScript library for Ethereum interactions
- **Shiki**: Beautiful syntax highlighter with VS Code themes
- **Next.js**: Powerful React framework with great performance

---

For questions or issues, please open a GitHub issue or consult the main README.md.