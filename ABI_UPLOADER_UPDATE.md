# 🔥 ABI Uploader Updated!

## What's New

The ABI upload page now supports **JSON file uploads** with automatic parsing of Foundry output!

### ✨ New Features

#### 1. **File Upload Support**
- Upload Foundry's JSON output files directly
- Drag & drop or click to browse
- Automatic ABI extraction from Foundry format

#### 2. **Dual Upload Methods**
- **📁 Upload File**: Upload `out/Contract.sol/Contract.json` directly
- **📝 Paste JSON**: Traditional paste method still available

#### 3. **Smart Parsing**
- Automatically detects Foundry format `{ abi: [...], bytecode: {...} }`
- Also supports raw ABI array format
- Extracts contract name from filename

#### 4. **Better UX**
- Visual file upload area with drag & drop
- Preview of parsed ABI
- Shows timestamp when ABI was saved
- Function count display (functions only, not events/errors)
- Scrollable saved ABIs list

### 📦 Supported Formats

**Foundry Output (Recommended)**
```json
{
  "abi": [
    { "type": "function", ... },
    { "type": "event", ... }
  ],
  "bytecode": { ... },
  "deployedBytecode": { ... }
}
```

**Raw ABI Array**
```json
[
  { "type": "function", "name": "transfer", ... },
  { "type": "event", "name": "Transfer", ... }
]
```

### 🚀 Usage

#### Quick Upload from Foundry Project

```bash
# 1. Deploy your contract
forge create src/Counter.sol:Counter --rpc-url http://127.0.0.1:8545 --private-key 0xac...

# 2. In FurnaceScout:
# - Go to "Upload ABI"
# - Click "Upload File"
# - Select out/Counter.sol/Counter.json
# - Enter contract address
# - Click "Upload ABI"
# Done! ✨
```

### 💡 Benefits

1. **No Manual Extraction**: Just upload the Foundry output file
2. **Less Error-Prone**: No copying/pasting ABI arrays
3. **Faster Workflow**: One-click upload
4. **Auto-Naming**: Contract name extracted from filename

### 📸 UI Changes

**Before:**
- Single textarea for pasting JSON
- Manual ABI extraction needed

**After:**
- Tab interface: File Upload / Paste JSON
- Drag & drop file upload area
- Automatic parsing and preview
- Better visual feedback

### 🔧 Technical Details

The uploader now:
- Reads `.json` files
- Parses JSON content
- Checks for `json.abi` field (Foundry format)
- Falls back to raw array parsing
- Extracts contract name from filename pattern
- Shows preview of parsed content

### 📝 Updated Documentation

- ✅ `README.md` - Updated with file upload instructions
- ✅ `QUICKSTART.md` - Shows both upload methods
- ✅ `ABI_UPLOADER_UPDATE.md` - This file

### 🎯 Example Workflow

```bash
# Terminal 1: Anvil
anvil

# Terminal 2: Deploy contract
forge create src/MyToken.sol:MyToken --rpc-url http://127.0.0.1:8545 --private-key 0xac...

# Copy the deployed address

# Browser: FurnaceScout
# 1. Go to http://localhost:3000/upload-abi
# 2. Paste contract address
# 3. Click "Upload File" tab
# 4. Select out/MyToken.sol/MyToken.json
# 5. Click "Upload ABI"
# 6. Search for your contract address
# 7. Interact with your contract! 🎉
```

### ✨ This Makes FurnaceScout Even Better!

No more manual ABI extraction. Just drag, drop, and go! 🔥

---

Made with 🔥 by the FurnaceScout team
