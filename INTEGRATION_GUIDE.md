# FurnaceScout Integration Guide

This document explains how to integrate your local FurnaceScout development into the GitHub repository.

## Overview

All necessary files have been created and configured with FurnaceScout branding. The project is ready to be pushed to the GitHub repository at `https://github.com/FurnaceScout/frontend.git`.

## What's Been Done

### ✅ Files Created/Updated

#### Core Infrastructure
- ✅ `lib/viem.js` - Viem client configuration for Anvil
- ✅ `lib/abi-store.js` - ABI storage with localStorage persistence
- ✅ `lib/contract-decoder.js` - Transaction and event decoding utilities

#### Application Pages
- ✅ `app/page.js` - Homepage with latest blocks and transactions
- ✅ `app/layout.js` - Root layout with providers
- ✅ `app/providers.js` - Wagmi and React Query providers
- ✅ `app/block/[number]/page.js` - Block detail page
- ✅ `app/tx/[hash]/page.js` - Transaction detail page with decoding
- ✅ `app/address/[address]/page.js` - Address/contract page
- ✅ `app/upload-abi/page.js` - ABI upload interface

#### Components
- ✅ `app/components/Header.js` - Navigation with search (🔥 FurnaceScout branding)
- ✅ `app/components/ContractInteraction.js` - Contract read/write interface

#### Configuration
- ✅ `package.json` - Updated with FurnaceScout name and dependencies
- ✅ `.env.local` - Environment configuration for Anvil RPC
- ✅ `.gitignore` - Comprehensive ignore rules
- ✅ `README.md` - Complete documentation

### 🎨 Branding Changes

All references to "IronScout" have been updated to "FurnaceScout":
- Orange/red color scheme changed to red/orange (🔥 fire theme)
- Logo changed from ⚒ (hammer) to 🔥 (fire emoji)
- All hover states and accents updated to red
- localStorage keys updated to `furnacescout_abis`

## Integration Steps

### Option 1: Quick Integration (Recommended)

```bash
# 1. Navigate to your project directory
cd /path/to/ironscout

# 2. Install dependencies (if not already done)
bun install

# 3. Initialize git and add remote
git init
git remote add origin https://github.com/FurnaceScout/frontend.git

# 4. Add all files
git add .

# 5. Commit
git commit -m "Initial commit: FurnaceScout block explorer

- Next.js 16 with App Router
- Viem for blockchain interaction
- Contract interaction with read/write functions
- Block, transaction, and address explorer
- Transaction decoding with ABI support
- Wallet integration via Wagmi
- Modern UI with Tailwind CSS v4"

# 6. Push to GitHub
git branch -M main
git push -u origin main
```

### Option 2: Clone and Replace

```bash
# 1. Clone the empty repository
git clone https://github.com/FurnaceScout/frontend.git furnacescout
cd furnacescout

# 2. Copy all files from ironscout (excluding git and node_modules)
cp -r /path/to/ironscout/app .
cp -r /path/to/ironscout/lib .
cp -r /path/to/ironscout/public .
cp /path/to/ironscout/package.json .
cp /path/to/ironscout/.gitignore .
cp /path/to/ironscout/.env.local .
cp /path/to/ironscout/README.md .
cp /path/to/ironscout/next.config.mjs .
cp /path/to/ironscout/postcss.config.mjs .
cp /path/to/ironscout/jsconfig.json .
cp /path/to/ironscout/biome.json .

# 3. Install dependencies
bun install

# 4. Test locally
bun dev

# 5. Commit and push
git add .
git commit -m "Initial commit: FurnaceScout block explorer"
git push origin main
```

## Post-Integration Checklist

After pushing to GitHub, verify:

- [ ] All files are present in the repository
- [ ] README displays correctly with 🔥 emoji
- [ ] Dependencies are correct in package.json
- [ ] .env.local is in .gitignore (not committed)
- [ ] License file is present

## Local Development Setup

For anyone cloning the repository:

```bash
# 1. Clone
git clone https://github.com/FurnaceScout/frontend.git
cd frontend

# 2. Install dependencies
bun install

# 3. Start Anvil in separate terminal
anvil

# 4. Start dev server
bun dev

# 5. Open browser
open http://localhost:3000
```

## Environment Configuration

Create `.env.local` file (not committed to git):

```env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

## Testing the Integration

After setup, test these features:

### 1. Basic Navigation
- [ ] Homepage loads and shows "FurnaceScout" with 🔥
- [ ] Search bar is functional
- [ ] Navigation links work

### 2. Block Explorer
- [ ] Latest blocks appear on homepage
- [ ] Clicking a block shows details
- [ ] Block transactions are listed

### 3. Transaction Viewer
- [ ] Transaction details display correctly
- [ ] Status badge shows (Success/Failed)
- [ ] Links to addresses work

### 4. Address Explorer
- [ ] Address balance displays
- [ ] Contract detection works
- [ ] Recent transactions appear

### 5. ABI Upload
- [ ] Upload ABI page loads
- [ ] Can paste and save ABI
- [ ] Saved ABIs persist in localStorage
- [ ] Can view saved ABIs

### 6. Contract Interaction
- [ ] Read functions display correctly
- [ ] Can query read functions
- [ ] Write functions require wallet
- [ ] Can connect MetaMask
- [ ] Can execute write functions

## Dependencies Installed

```json
{
  "dependencies": {
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "viem": "^2.21.54",
    "wagmi": "^2.12.32",
    "@tanstack/react-query": "^5.59.20"
  },
  "devDependencies": {
    "@biomejs/biome": "2.2.0",
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4"
  }
}
```

## Troubleshooting

### If dependencies fail to install:
```bash
rm -rf node_modules
rm bun.lockb
bun install
```

### If Anvil connection fails:
- Ensure Anvil is running on port 8545
- Check `.env.local` has correct URL
- Restart dev server after changing .env

### If TypeScript errors appear:
- The project uses JavaScript, not TypeScript
- If you want TypeScript, you'll need to convert files

## Project Structure

```
frontend/
├── app/
│   ├── address/[address]/page.js    # Contract/address explorer
│   ├── block/[number]/page.js        # Block details
│   ├── tx/[hash]/page.js             # Transaction details
│   ├── upload-abi/page.js            # ABI management
│   ├── components/
│   │   ├── Header.js                 # Main navigation
│   │   └── ContractInteraction.js    # Contract UI
│   ├── layout.js                     # Root layout
│   ├── page.js                       # Homepage
│   ├── providers.js                  # Wagmi setup
│   └── globals.css                   # Styles
├── lib/
│   ├── viem.js                       # Blockchain client
│   ├── abi-store.js                  # ABI storage
│   └── contract-decoder.js           # Decoders
├── public/                           # Static files
├── .env.local                        # Local config (not in git)
├── .gitignore                        # Git exclusions
├── package.json                      # Dependencies
├── README.md                         # Documentation
├── next.config.mjs                   # Next.js config
├── postcss.config.mjs                # PostCSS config
├── jsconfig.json                     # JS config
└── biome.json                        # Biome config
```

## Key Features Implemented

✅ **Real-time Updates** - Blocks and transactions refresh every 5 seconds
✅ **Universal Search** - Search blocks, transactions, and addresses
✅ **Transaction Decoding** - Automatic decoding with uploaded ABIs
✅ **Contract Interaction** - Read/write functions directly from UI
✅ **Wallet Integration** - MetaMask support via Wagmi
✅ **ABI Management** - Upload and persist ABIs in localStorage
✅ **Dark Mode** - Full dark mode support
✅ **Responsive Design** - Works on mobile and desktop
✅ **Modern Stack** - Next.js 16, Viem, Tailwind CSS v4

## Next Steps

After successful integration:

1. **Add GitHub Actions** for CI/CD
2. **Deploy to Vercel** for live demo
3. **Add more chains** beyond Anvil
4. **Implement search indexing** for better performance
5. **Add contract verification** features
6. **Create API documentation**
7. **Add unit tests**

## Support

If you encounter issues:
- Check this guide thoroughly
- Review the README.md
- Check Anvil is running on port 8545
- Verify all dependencies installed correctly
- Open an issue on GitHub

---

Made with 🔥 by the FurnaceScout team