# 🔥 New Features Added!

Three major features have been added to FurnaceScout:

## 1. 📊 Anvil Status Dashboard

### What It Does
- Shows detailed Anvil connection status
- Displays all 10 test accounts with live balances
- Quick copy buttons for addresses and private keys
- Chain info: Chain ID, current block, gas price
- Real-time updates every 5 seconds

### Where To Find It
- **Dashboard Page**: `/dashboard` (new link in header)
- **Collapsible Widget**: Can be embedded anywhere

### Features
- ✅ Live balance monitoring for all test accounts
- ✅ One-click copy for addresses and private keys
- ✅ Chain statistics (Chain ID: 31337, current block, gas price)
- ✅ Quick refresh button
- ✅ Copy RPC URL button
- ✅ Color-coded account indicators

### Usage
```bash
# Start Anvil
anvil

# Open Dashboard
http://localhost:3000/dashboard
```

## 2. 📋 Event Log Viewer

### What It Does
- Browse and filter contract events across all blocks
- Automatic event decoding with uploaded ABIs
- Export events to CSV
- Filter by contract, event name, block range
- Shows decoded arguments and raw data

### Where To Find It
- **Events Page**: `/events` (new link in dashboard)

### Features
- ✅ Filter by contract address (dropdown of contracts with ABIs)
- ✅ Filter by event name (e.g., "Transfer", "Approval")
- ✅ Filter by block range
- ✅ Automatic event decoding when ABI is available
- ✅ Export to CSV for analysis
- ✅ Shows decoded arguments in JSON format
- ✅ Links to transactions and contracts
- ✅ Timestamp display

### Usage
```javascript
// Example: Find all Transfer events
1. Go to /events
2. Select contract from dropdown
3. Enter "Transfer" in event name
4. Click "Search Events"
5. Export to CSV if needed
```

### CSV Export
Exports include:
- Block number
- Transaction hash
- Contract address
- Event name
- Decoded data (JSON)

## 3. 📄 Contract Source Code Viewer

### What It Does
- View Solidity source code with syntax highlighting
- Upload .sol files from your Foundry project
- Line numbers and syntax highlighting
- Stored in browser localStorage

### Where To Find It
- **Contract Page**: `/address/{contractAddress}` (automatically shown)

### Features
- ✅ Syntax highlighting for Solidity
- ✅ Keywords (contract, function, modifier, etc.) in purple
- ✅ Types (uint256, address, bool) in blue
- ✅ Comments in green
- ✅ Strings in orange
- ✅ Line numbers (toggleable)
- ✅ Hover highlighting per line
- ✅ File name display
- ✅ Line count

### Usage
```bash
# 1. Deploy contract
forge create src/Counter.sol:Counter --rpc-url http://127.0.0.1:8545 --private-key 0xac...

# 2. Navigate to contract address in FurnaceScout

# 3. Click "Upload Source Code"

# 4. Select src/Counter.sol

# 5. View highlighted source code!
```

### Syntax Highlighting
- **Keywords**: `contract`, `function`, `public`, `view`, etc.
- **Types**: `uint256`, `address`, `bool`, etc.
- **Comments**: Single and multi-line
- **Strings**: String literals
- **Numbers**: Numeric literals

## 🎯 Complete Feature List

### Dashboard Features
- [x] Anvil connection status
- [x] Chain ID display
- [x] Current block number
- [x] Gas price display
- [x] 10 test accounts with balances
- [x] Copy addresses
- [x] Copy private keys
- [x] Copy RPC URL
- [x] Quick refresh
- [x] Auto-updates every 5s

### Event Viewer Features
- [x] List all events
- [x] Filter by contract
- [x] Filter by event name
- [x] Filter by block range
- [x] Decode events with ABI
- [x] Show raw event data
- [x] Export to CSV
- [x] Links to transactions
- [x] Links to contracts
- [x] Timestamp display
- [x] Pagination (100 events max)

### Source Code Viewer Features
- [x] Upload .sol files
- [x] Syntax highlighting
- [x] Line numbers
- [x] Toggle line numbers
- [x] File name display
- [x] Line count
- [x] Responsive layout
- [x] Dark mode support
- [x] Keyword highlighting
- [x] Type highlighting
- [x] Comment highlighting
- [x] String highlighting

## 📸 Screenshots

### Dashboard
```
┌─────────────────────────────────────────┐
│  🔥 Anvil Connected                    ▼│
│  Chain ID: 31337 | Block: 123           │
├─────────────────────────────────────────┤
│  Chain ID    Current Block   Gas Price  │
│    31337          123         0.00 Gwei │
├─────────────────────────────────────────┤
│  Test Accounts                     (10)  │
│  ┌───────────────────────────────────┐  │
│  │ 0  0xf39F...2266      10000.00 ETH │  │
│  │    📋 Address    🔑 Private Key    │  │
│  └───────────────────────────────────┘  │
│  ...                                     │
└─────────────────────────────────────────┘
```

### Events Page
```
┌─────────────────────────────────────────┐
│  Event Logs                              │
│  View and filter contract events         │
├─────────────────────────────────────────┤
│  [Contract ▼] [Event Name] [From] [To]  │
│  [🔍 Search Events] [Reset] [📥 Export] │
├─────────────────────────────────────────┤
│  [DECODED] Transfer (MyToken)            │
│  Block 42 | 12/27/2024 3:45 PM          │
│  Contract: 0xabc...def                   │
│  Transaction: 0x123...456                │
│  { from: "0x...", to: "0x...", ... }    │
└─────────────────────────────────────────┘
```

### Source Code Viewer
```
┌─────────────────────────────────────────┐
│  📄 Counter.sol              🔢 Hide     │
├────┬────────────────────────────────────┤
│  1 │ pragma solidity ^0.8.0;            │
│  2 │                                     │
│  3 │ contract Counter {                 │
│  4 │     uint256 public count;          │
│  5 │                                     │
│  6 │     function increment() public {  │
│  7 │         count += 1;                │
│  8 │     }                               │
│  9 │ }                                   │
└────┴────────────────────────────────────┘
```

## 🚀 Quick Start

### View Dashboard
```bash
# Start Anvil
anvil

# Start FurnaceScout
bun dev

# Navigate to
http://localhost:3000/dashboard
```

### View Events
```bash
# Deploy a contract
forge create src/MyToken.sol:MyToken --rpc-url http://127.0.0.1:8545 --private-key 0xac...

# Upload ABI
# Go to /upload-abi

# View events
http://localhost:3000/events
```

### View Source Code
```bash
# Navigate to contract
http://localhost:3000/address/{contractAddress}

# Click "Upload Source Code"

# Select .sol file from src/

# View highlighted code!
```

## 💡 Pro Tips

### Dashboard
- Pin important account addresses for quick access
- Use account #0 for deployments (pre-funded with 10000 ETH)
- Copy private keys directly for MetaMask import

### Events
- Upload ABIs first for decoded events
- Use block range to narrow searches
- Export to CSV for external analysis
- Filter by Transfer events to track token movements

### Source Code
- Upload source immediately after deployment
- Keep source files organized in Foundry's src/ folder
- Use syntax highlighting to spot issues quickly
- Line numbers help reference specific code sections

## 🔗 Related Documentation

- [README.md](./README.md) - Full project documentation
- [QUICKSTART.md](./QUICKSTART.md) - Get started in 5 minutes
- [ABI_UPLOADER_UPDATE.md](./ABI_UPLOADER_UPDATE.md) - ABI upload guide

---

Made with 🔥 by the FurnaceScout team
