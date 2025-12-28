# Transaction Bookmarks Documentation

Complete guide to the Transaction Bookmarks feature in FurnaceScout.

---

## Overview

Transaction Bookmarks allow you to save, label, and organize interesting transactions for quick access later. Perfect for tracking failed transactions, successful deployments, or any transaction you want to revisit.

### Key Features

- 📌 **Save transactions** with custom labels and notes
- 🔍 **Search bookmarks** by label, notes, or hash
- ✏️ **Edit bookmarks** - Update labels and notes anytime
- 📥 **Export/Import** - Backup or share your bookmarks
- 🎯 **Quick access** - Panel accessible from any page

---

## How to Use

### Bookmarking a Transaction

1. **Navigate to any transaction page** (`/tx/[hash]`)
2. **Click the "☆ Bookmark" button** (next to status badge)
3. **Enter a label** (required) - e.g., "Failed swap attempt"
4. **Add notes** (optional) - Additional context or details
5. **Click "Save Bookmark"**

The button will change to **"★ Bookmarked"** to indicate it's saved.

### Viewing All Bookmarks

1. **Click "📌 Bookmarks"** button in the header
2. **Bookmarks panel slides in** from the right
3. **See all your bookmarks** with labels, notes, and timestamps

### Searching Bookmarks

In the bookmarks panel:
1. **Type in the search box** at the top
2. **Search by**:
   - Label text
   - Notes content
   - Transaction hash
3. **Results filter in real-time**

### Editing a Bookmark

1. **Open bookmarks panel**
2. **Click the ✏️ edit icon** on any bookmark
3. **Modify label and/or notes**
4. **Click "Save"** or "Cancel"

### Removing a Bookmark

**From transaction page:**
- Click "★ Bookmarked" button → Confirm removal

**From bookmarks panel:**
- Click 🗑️ trash icon → Confirm removal

---

## Features in Detail

### Labels

- **Required field** when creating bookmark
- **Short description** of the transaction
- **Searchable** - Used in search queries
- **Editable** - Can be changed anytime

**Examples of good labels:**
- "Failed swap - insufficient liquidity"
- "Successful contract deployment"
- "Test transaction #5"
- "Gas optimization baseline"
- "Revert on line 42"

### Notes

- **Optional field** for additional context
- **Multi-line support** - Add as much detail as needed
- **Searchable** - Included in search results
- **Editable** - Can be updated later

**Examples of good notes:**
```
Attempting to swap 100 USDC for ETH on Uniswap V3.
Reverted with "Insufficient liquidity" error.
Need to investigate pool state before retry.
```

### Timestamps

- **Automatically added** when bookmark is created
- **Shown in bookmarks panel** - Easy reference
- **Format**: Local date and time (e.g., "12/15/2024, 3:45:23 PM")

---

## Storage

### Where Data is Stored

Bookmarks are stored in **browser localStorage** under the key `furnacescout_bookmarks`.

**This means:**
- ✅ Persists across browser sessions
- ✅ No server or account required
- ✅ Completely private (local only)
- ⚠️ Per-browser (not synced)
- ⚠️ Clearing browser data removes bookmarks

### Data Structure

Each bookmark contains:
```json
{
  "id": "1702847123456",
  "hash": "0x1234...",
  "label": "Failed swap attempt",
  "notes": "Insufficient liquidity error",
  "createdAt": "2024-12-15T15:45:23.456Z",
  "updatedAt": "2024-12-15T16:30:00.123Z"
}
```

---

## Export & Import

### Exporting Bookmarks

1. **Open bookmarks panel**
2. **Click "📥 Export" button**
3. **JSON file downloads** - `furnacescout-bookmarks-[timestamp].json`
4. **Save file** - Backup for safekeeping

**Use cases:**
- Backup before clearing browser data
- Share bookmarks with team members
- Transfer between browsers
- Archive for later reference

### Importing Bookmarks

**Coming in future release**

Planned features:
- Import JSON file
- Merge with existing bookmarks
- Detect and skip duplicates

---

## Use Cases

### 1. Debugging Failed Transactions

```
Bookmark: "Swap reverted - Dec 15"
Notes: "Trying to swap 100 USDC → ETH
       Error: Insufficient liquidity
       Pool address: 0x1234...
       Need to check pool reserves"
```

**Workflow:**
1. Transaction fails → Bookmark it
2. Add debugging notes
3. Come back later to investigate
4. View trace, check storage changes
5. Fix issue and test

### 2. Tracking Successful Deployments

```
Bookmark: "MyContract v1.0 Deployment"
Notes: "Deployed successfully
       Constructor args: [100, 0x5678...]
       Gas used: 2,451,234
       Contract verified on Etherscan"
```

### 3. Gas Optimization Experiments

```
Bookmark: "Baseline - Before Optimization"
Notes: "Gas: 145,678
       15 SSTORE operations
       Need to reduce storage writes"

Bookmark: "After Storage Optimization"
Notes: "Gas: 85,234 (41% reduction!)
       Only 5 SSTORE operations
       Used memory caching"
```

### 4. Learning EVM

```
Bookmark: "Complex DeFi Swap"
Notes: "Study this transaction:
       - Multiple contract calls
       - Delegatecall patterns
       - Storage layout
       Great example of router → pair → tokens"
```

### 5. Team Collaboration

```
Bookmark: "Bug in withdraw() function"
Notes: "@alice found this issue
       Reproduce by calling withdraw(1000)
       when balance < 1000
       See trace for exact revert point"
```

---

## Tips & Best Practices

### Naming Conventions

**Good labels:**
- Descriptive and concise
- Include key information
- Easy to scan in list

**Examples:**
- ✅ "Failed swap - Dec 15"
- ✅ "Contract deploy v2.1"
- ✅ "Gas test #3 (optimized)"
- ❌ "Transaction" (too vague)
- ❌ "0x1234..." (just use the hash)

### Using Notes Effectively

**Structure your notes:**
```
Problem: What went wrong
Context: Relevant details
Action: What to try next
Reference: Links or addresses
```

**Example:**
```
Problem: Revert on line 42 in MyContract.sol
Context: Calling transfer() with amount > balance
Action: Add balance check before transfer
Reference: Contract at 0x1234...
```

### Organization Strategies

**By category:**
- Prefix labels with categories
- Examples: "[BUG]", "[DEPLOY]", "[TEST]", "[OPTIMIZE]"

**By date:**
- Include date in label
- Easy to find recent bookmarks

**By project:**
- Prefix with project name
- Examples: "[MyDApp]", "[TokenProject]"

### Regular Maintenance

1. **Review bookmarks weekly** - Remove obsolete ones
2. **Update notes** - Add new findings
3. **Export regularly** - Backup important bookmarks
4. **Clear old bookmarks** - Keep list manageable

---

## Keyboard Shortcuts

*Coming in future release*

Planned shortcuts:
- `B` - Toggle bookmarks panel
- `/` - Focus search box
- `Esc` - Close panel
- `↑/↓` - Navigate bookmarks
- `Enter` - Open selected bookmark

---

## API Reference

### Import Functions

```javascript
import {
  addBookmark,
  removeBookmark,
  updateBookmark,
  getBookmarks,
  getBookmarkByHash,
  isBookmarked,
  searchBookmarks,
  exportBookmarks,
  clearAllBookmarks,
} from "@/lib/bookmarks";
```

### Functions

#### `getBookmarks()`
Returns all bookmarks as an array.

```javascript
const bookmarks = getBookmarks();
// Returns: [{id, hash, label, notes, createdAt}, ...]
```

#### `addBookmark(hash, label, notes?)`
Creates a new bookmark.

```javascript
const bookmark = addBookmark(
  "0x1234...",
  "My Transaction",
  "Optional notes"
);
// Returns: {id, hash, label, notes, createdAt}
// Throws: Error if already bookmarked
```

#### `removeBookmark(id)`
Deletes a bookmark by ID.

```javascript
removeBookmark("1702847123456");
```

#### `updateBookmark(id, updates)`
Updates label and/or notes.

```javascript
updateBookmark("1702847123456", {
  label: "New Label",
  notes: "Updated notes"
});
// Returns: Updated bookmark object
```

#### `isBookmarked(hash)`
Check if transaction is bookmarked.

```javascript
const bookmarked = isBookmarked("0x1234...");
// Returns: true or false
```

#### `getBookmarkByHash(hash)`
Get bookmark for a specific transaction.

```javascript
const bookmark = getBookmarkByHash("0x1234...");
// Returns: Bookmark object or null
```

#### `searchBookmarks(query)`
Search bookmarks by label, notes, or hash.

```javascript
const results = searchBookmarks("failed");
// Returns: Array of matching bookmarks
```

#### `exportBookmarks()`
Get bookmarks as JSON string.

```javascript
const json = exportBookmarks();
// Returns: JSON string of all bookmarks
```

#### `clearAllBookmarks()`
Delete all bookmarks (with confirmation).

```javascript
clearAllBookmarks();
// Prompts user for confirmation
```

---

## Components

### `<BookmarkButton>`

Button component for transaction pages.

**Props:**
- `hash` (required) - Transaction hash
- `defaultLabel` (optional) - Pre-fill label

**Example:**
```javascript
<BookmarkButton 
  hash="0x1234..." 
  defaultLabel="Transaction Success"
/>
```

### `<BookmarksPanel>`

Sliding panel for viewing all bookmarks.

**Props:**
- `isOpen` (required) - Show/hide panel
- `onClose` (required) - Close callback

**Example:**
```javascript
<BookmarksPanel 
  isOpen={showBookmarks}
  onClose={() => setShowBookmarks(false)}
/>
```

---

## Troubleshooting

### Bookmarks Not Saving

**Causes:**
- Browser localStorage disabled
- Incognito/private mode
- Storage quota exceeded

**Solutions:**
1. Check browser settings
2. Use regular browsing mode
3. Clear old data to free space

### Bookmarks Disappeared

**Causes:**
- Browser data cleared
- Different browser/computer
- localStorage manually cleared

**Solutions:**
1. Import from backup (if exported)
2. Check other browsers
3. Contact if data critical (we can't recover local data)

### Search Not Working

**Causes:**
- No matching results
- Query too specific

**Solutions:**
1. Try broader search terms
2. Check spelling
3. Clear search to see all

---

## Future Enhancements

### Planned Features

- [ ] Import functionality
- [ ] Bookmark folders/categories
- [ ] Tags for better organization
- [ ] Sort options (date, label, etc.)
- [ ] Bulk operations (delete multiple)
- [ ] Share bookmark as link
- [ ] Sync across devices (optional cloud)
- [ ] Keyboard shortcuts
- [ ] Quick add from any page
- [ ] Recent bookmarks widget

### Community Requests

Have an idea? Open an issue on GitHub!

---

## Privacy & Security

### What's Stored

- Transaction hashes
- User-provided labels and notes
- Timestamps

### What's NOT Stored

- Private keys
- Wallet addresses (unless in notes)
- Personal information
- Server-side data

### Data Privacy

- **100% local** - Stored only in your browser
- **No tracking** - We don't see your bookmarks
- **No account needed** - Completely anonymous
- **Your control** - Delete anytime

---

## FAQ

### Q: Can I sync bookmarks across browsers?

**A:** Not yet. Bookmarks are stored locally per browser. Export/import can help transfer them manually.

### Q: How many bookmarks can I save?

**A:** Limited only by browser localStorage (~5-10MB typically). Hundreds or thousands of bookmarks are fine.

### Q: What happens if I clear browser data?

**A:** Bookmarks will be deleted. Export regularly as backup!

### Q: Can I share bookmarks with my team?

**A:** Yes! Export the JSON file and share it. Import functionality coming soon.

### Q: Do bookmarks work offline?

**A:** Yes! They're stored locally, so they work without internet.

### Q: Can I bookmark transactions from mainnet?

**A:** The feature works with any transaction hash, but FurnaceScout is designed for Anvil/local development.

---

## Support

Need help with bookmarks?

- **Documentation**: This file
- **Issues**: [GitHub Issues](https://github.com/FurnaceScout/frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/FurnaceScout/frontend/discussions)

---

**Happy Bookmarking! 📌**