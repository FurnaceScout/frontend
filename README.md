# FurnaceScout 🔥

> **⚠️ UNOFFICIAL PROJECT** - This is a community-built tool. Not affiliated with, maintained by, or endorsed by the Foundry team.

> Unofficial frontend block explorer for Foundry's Anvil testnet

A modern, feature-rich block explorer built specifically for Foundry's Anvil, making local Ethereum development easier and more transparent.

![FurnaceScout](https://img.shields.io/badge/Foundry-Anvil-red?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Unofficial](https://img.shields.io/badge/Status-Unofficial-orange?style=flat-square)

## ⚠️ Disclaimer

**FurnaceScout is an unofficial, community-developed tool.** It is not affiliated with, maintained by, endorsed by, or supported by the Foundry team or Paradigm. This is an independent project created to enhance the local development experience with Foundry and Anvil.

For official Foundry tools and documentation, visit:
- **Foundry Book**: https://book.getfoundry.sh/
- **Foundry GitHub**: https://github.com/foundry-rs/foundry
- **Foundry Support**: https://t.me/foundry_rs

## Features

- 🔍 **Universal Search**: Search by block number, transaction hash, or address
- 📦 **Block Explorer**: Browse blocks with detailed information and transaction lists
- 💸 **Transaction Viewer**: View transaction details with automatic input decoding
- 📝 **Address Explorer**: View address balances and transaction history
- 🔧 **Contract Interaction**: Read and write contract functions directly from the UI
- 📋 **ABI Management**: Upload and manage contract ABIs with localStorage persistence
- 🔓 **Transaction Decoding**: Automatic decoding of contract calls and events when ABI is available
- 🌐 **Wallet Integration**: Connect MetaMask or other injected wallets for contract writes
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- ⚡ **Real-time Updates**: WebSocket-based live updates for blocks, transactions, and balances
- 📊 **Anvil Status Dashboard**: Monitor chain info and test accounts with live balances
- 📜 **Event Log Viewer**: Browse and filter contract events with CSV export
- 💻 **Enhanced Syntax Highlighting**: Professional Solidity code display with Shiki, featuring code folding and multiple themes
- 📄 **Source Code Viewer**: Upload and view Solidity files with syntax highlighting
- 🔍 **Transaction Trace Viewer**: Debug transactions with opcode-level execution traces, call trees, and storage changes

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) - Fast JavaScript runtime and package manager
- [Foundry](https://book.getfoundry.sh/getting-started/installation) - Ethereum development toolkit
- MetaMask or another Web3 wallet (for contract write operations)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/FurnaceScout/frontend.git
cd frontend
```

2. Install dependencies:
```bash
bun install
```

3. Start Anvil (Foundry's local testnet) in a separate terminal:
```bash
anvil
```

4. Start the development server:
```bash
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Docker Installation (Alternative)

If you prefer using Docker:

```bash
# Quick start with docker-compose
docker-compose up -d

# Or use the provided script
./docker-start.sh

# Or manually
docker build -t furnacescout .
docker run -d \
  --name furnacescout \
  -p 3000:3000 \
  -e NEXT_PUBLIC_RPC_URL=http://host.docker.internal:8545 \
  -v $(pwd):/foundry-project:ro \
  --add-host=host.docker.internal:host-gateway \
  furnacescout
```

See [docs/DOCKER.md](docs/DOCKER.md) for comprehensive Docker documentation.

## Usage Guide

### Deploying a Contract to Anvil

Deploy a contract using Forge:

```bash
# Example: Deploy a Counter contract
forge create src/Counter.sol:Counter \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

The private key above is one of Anvil's default test accounts with pre-funded ETH.

### Uploading Contract ABIs

To enable transaction decoding and contract interaction:

1. Navigate to **"Upload ABI"** in the header
2. Enter your contract address (from deployment output)
3. Choose your upload method:

**Option A: Upload File (Recommended)**
   - Click the **📁 Upload File** tab
   - Click the upload area or drag & drop
   - Select `out/YourContract.sol/YourContract.json` from your Foundry project
   - The ABI will be automatically extracted from the Foundry output!

**Option B: Paste JSON**
   - Click the **📝 Paste JSON** tab
   - Paste the raw ABI JSON array

4. Optionally add a contract name (auto-detected from filename when uploading)
5. Click **"Upload ABI"**

ABIs are stored in browser localStorage and persist across sessions.

**Pro Tip**: FurnaceScout automatically parses Foundry's JSON output format, so you can upload the entire contract JSON file without manually extracting the ABI!

### Interacting with Contracts

Once an ABI is uploaded:

1. Search for your contract address
2. The contract page will display all available functions
3. **For read functions**: 
   - Fill in parameters (if any)
   - Click "Query" to view results
4. **For write functions**: 
   - Connect your wallet first
   - Fill in parameters
   - Click "Write" to submit transaction

### Searching the Blockchain

Use the search bar to find:
- **Blocks**: Enter block number (e.g., `42`)
- **Transactions**: Enter full transaction hash (e.g., `0xabc...def`)
- **Addresses**: Enter full address (e.g., `0x123...456`)

### Connecting to Anvil

By default, FurnaceScout connects to `http://127.0.0.1:8545`. 

To use a different RPC endpoint, create or modify `.env.local`:

```env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

## Project Structure

```
frontend/
├── app/
│   ├── address/[address]/     # Address/contract detail pages
│   ├── block/[number]/        # Block detail pages
│   ├── tx/[hash]/             # Transaction detail pages
│   ├── upload-abi/            # ABI upload interface
│   ├── components/            # React components
│   │   ├── Header.js          # Navigation header with search
│   │   └── ContractInteraction.js  # Contract read/write UI
│   ├── layout.js              # Root layout with providers
│   ├── page.js                # Homepage with latest blocks/txs
│   ├── providers.js           # Wagmi/React Query setup
│   └── globals.css            # Global styles
├── lib/
│   ├── viem.js                # Viem client configuration
│   ├── abi-store.js           # ABI storage management
│   └── contract-decoder.js    # Transaction decoder utilities
├── public/                    # Static assets
├── .env.local                 # Environment configuration
├── package.json               # Dependencies
└── next.config.mjs            # Next.js configuration
```

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[Viem](https://viem.sh/)** - Type-safe Ethereum interaction library
- **[Wagmi](https://wagmi.sh/)** - React hooks for Ethereum
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Biome](https://biomejs.dev/)** - Fast linter and formatter

## Development

### Available Scripts

```bash
# Start development server
bun dev

# Build for production
bun build

# Start production server
bun start

# Lint code
bun lint

# Format code
bun format
```

### Adding Custom Chains

To support chains other than Anvil, modify `lib/viem.js` and `app/providers.js`:

```javascript
import { mainnet, sepolia } from 'viem/chains';

// Update the chain configuration
export const publicClient = createPublicClient({
  chain: sepolia, // or mainnet, or custom chain
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});
```

## Troubleshooting

### "Cannot connect to Anvil"

- Ensure Anvil is running: `anvil`
- Check that Anvil is on port 8545
- Verify `.env.local` has correct RPC URL

### "Transaction Decoding Failed"

- Upload the contract ABI via the Upload ABI page
- Ensure the ABI matches the deployed contract
- Check browser console for detailed errors

### "Wallet Connection Failed"

- Install MetaMask or another Web3 wallet
- Add Anvil as a custom network in your wallet:
  - Network Name: Anvil
  - RPC URL: http://127.0.0.1:8545
  - Chain ID: 31337
  - Currency: ETH

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- Built for the [Foundry](https://github.com/foundry-rs/foundry) ecosystem
- Inspired by [Blockscout](https://github.com/blockscout/blockscout) and [Etherscan](https://etherscan.io)
- Part of the FurnaceScout project

## Support

- 🐛 [Report bugs](https://github.com/FurnaceScout/frontend/issues)
- 💡 [Request features](https://github.com/FurnaceScout/frontend/issues)
- 📖 [Read the docs](https://github.com/FurnaceScout/frontend)

---

Made with 🔥 by the FurnaceScout team