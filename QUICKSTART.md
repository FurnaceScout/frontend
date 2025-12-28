# FurnaceScout Quick Start Guide 🔥

Get your FurnaceScout block explorer running in under 5 minutes!

## Prerequisites

Make sure you have these installed:

- [Bun](https://bun.sh/) - `curl -fsSL https://bun.sh/install | bash`
- [Foundry](https://book.getfoundry.sh/getting-started/installation) - `curl -L https://foundry.paradigm.xyz | bash`
- A Web3 wallet (MetaMask recommended)

## 🚀 Quick Setup

### Step 1: Install Dependencies

```bash
bun install
```

### Step 2: Start Anvil

Open a new terminal and run:

```bash
anvil
```

Keep this terminal running! Anvil creates a local Ethereum testnet on `http://127.0.0.1:8545`

### Step 3: Start FurnaceScout

In your original terminal:

```bash
bun dev
```

### Step 4: Open Browser

Navigate to [http://localhost:3000](http://localhost:3000)

You should see the FurnaceScout interface with 🔥 logo!

## 🎯 First Steps

### 1. Deploy a Test Contract

In a third terminal, deploy a simple counter contract:

```bash
# Create a simple Counter contract
cat > Counter.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 public count;
    
    function increment() public {
        count += 1;
    }
    
    function getCount() public view returns (uint256) {
        return count;
    }
}
EOF

# Deploy it to Anvil
forge create Counter.sol:Counter \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Note:** This private key is from Anvil's test accounts (pre-funded with 10000 ETH).

### 2. Find Your Contract

After deployment, you'll see output like:

```
Deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Copy that address and paste it into the FurnaceScout search bar!

### 3. Upload the ABI

To interact with your contract:

1. Click **"Upload ABI"** in the header
2. Paste your contract address
3. Choose upload method:

**Option A: Upload File (Recommended)**
   - Click the **📁 Upload File** tab
   - Click the upload area
   - Select `out/Counter.sol/Counter.json` from your Foundry project
   - The ABI will be automatically extracted!

**Option B: Paste JSON**
   - Click the **📝 Paste JSON** tab
   - Get the ABI: `cat out/Counter.sol/Counter.json | jq .abi`
   - Paste the ABI JSON

4. Name it "Counter" (optional, auto-detected from filename)
5. Click **"Upload ABI"**

### 4. Interact with Contract

1. Search for your contract address
2. You'll see **Read** and **Write** tabs
3. Try reading `getCount()`
4. Connect your wallet and try `increment()`

## 🔧 Connect MetaMask to Anvil

To interact with write functions:

1. Open MetaMask
2. Click network dropdown
3. Add Network → Add Network Manually
4. Fill in:
   - **Network Name:** Anvil Local
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** ETH
5. Save and switch to this network

### Import Test Account

Import one of Anvil's test accounts:

1. MetaMask → Import Account
2. Select "Private Key"
3. Paste: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

You'll now have 10000 ETH for testing!

## 📱 Features Overview

### Home Page
- Latest 10 blocks (auto-refreshes every 5 seconds)
- Latest 10 transactions
- Click any block or transaction to see details

### Search Bar
- Search by block number: `123`
- Search by transaction hash: `0xabc...def`
- Search by address: `0x123...456`

### Block Details
- Block information
- All transactions in that block
- Miner address
- Gas usage

### Transaction Details
- Transaction status (Success/Failed)
- From/To addresses
- Value transferred
- Gas used
- **Decoded input** (if ABI uploaded)
- **Decoded logs/events** (if ABI uploaded)

### Address/Contract Page
- Balance
- Recent transactions
- **Contract interaction UI** (if ABI uploaded)
- Bytecode viewer

### Contract Interaction
- **Read Functions:** Query contract state
- **Write Functions:** Submit transactions (requires wallet)
- Automatic parameter parsing
- Result display

## 🔥 Pro Tips

### 1. Quick ABI Upload from Foundry

After deploying with Foundry:

```bash
# Your contract JSON is automatically in out/
# Just drag and drop out/YourContract.sol/YourContract.json into FurnaceScout!
```

No need to manually extract the ABI - FurnaceScout handles Foundry's JSON format automatically.

### 2. Use Foundry Scripts

Instead of manual deployment:

```solidity
// script/Deploy.s.sol
contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        Counter counter = new Counter();
        vm.stopBroadcast();
    }
}
```

```bash
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

### 3. Watch for New Blocks

FurnaceScout auto-refreshes every 5 seconds, so you'll see new transactions appear automatically!

### 4. Test Complex Contracts

Deploy more complex contracts like ERC20, ERC721, or DEX contracts to see advanced features.

### 5. Multiple Contracts

Upload ABIs for multiple contracts to see interactions between them decoded.

## 🐛 Troubleshooting

### "Cannot connect to Anvil"
- ✅ Check Anvil is running: `ps aux | grep anvil`
- ✅ Check port 8545 is available: `lsof -i :8545`
- ✅ Restart Anvil

### "Transaction Decoding Failed"
- ✅ Upload the contract ABI via "Upload ABI" page
- ✅ Ensure ABI matches the deployed contract
- ✅ Check console for errors

### "Wallet Connection Failed"
- ✅ Install MetaMask
- ✅ Add Anvil network to MetaMask (see above)
- ✅ Make sure you're on Anvil network

### Dev Server Won't Start
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Restart
bun dev
```

## 📚 Next Steps

1. **Read the full README.md** for advanced features
2. **Check INTEGRATION_GUIDE.md** for deployment info
3. **Explore the code** in `app/` and `lib/` directories
4. **Deploy your own contracts** and explore them!

## 🎓 Learning Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Viem Docs](https://viem.sh/)
- [Next.js Docs](https://nextjs.org/docs)
- [Wagmi Docs](https://wagmi.sh/)

## 💡 Example Workflow

```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy & Test
forge create MyContract.sol:MyContract --rpc-url http://127.0.0.1:8545 --private-key 0xac...
cast send <CONTRACT_ADDR> "myFunction()" --rpc-url http://127.0.0.1:8545 --private-key 0xac...

# Terminal 3: Run FurnaceScout
bun dev

# Browser: Watch your transactions in real-time at localhost:3000
```

---

**Ready to explore? Start Anvil and run `bun dev`!** 🔥

Got questions? Check the [full README](./README.md) or [open an issue](https://github.com/FurnaceScout/frontend/issues).