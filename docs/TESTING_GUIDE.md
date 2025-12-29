# Testing Guide for New Features

This guide helps you verify that the real-time updates and enhanced syntax highlighting are working correctly.

---

## Prerequisites

Before testing, ensure you have:

- ✅ Bun installed (`bun --version`)
- ✅ Foundry installed (`forge --version`)
- ✅ Dependencies installed (`bun install`)
- ✅ Port 8545 available (for Anvil)
- ✅ Port 3000 available (for Next.js)

---

## Quick Test Setup

### Step 1: Start Anvil

Open a terminal and start Anvil:

```bash
anvil
```

You should see:
```
                             _   _
                            (_) | |
      __ _   _ __   __   __  _  | |
     / _` | | '_ \  \ \ / / | | | |
    | (_| | | | | |  \ V /  | | | |
     \__,_| |_| |_|   \_/   |_| |_|

    0.8.0 (1234567 2024-01-01T00:00:00.000000000Z)

    ...

Listening on 127.0.0.1:8545
```

**Keep this terminal open!**

---

### Step 2: Start FurnaceScout

Open a **second terminal** and start the development server:

```bash
cd ironscout
bun dev
```

You should see:
```
$ next dev
▲ Next.js 16.1.1 (Turbopack)
- Local:        http://localhost:3000

✓ Ready in 1.5s
```

---

### Step 3: Open in Browser

Visit: **http://localhost:3000**

---

## Test 1: Real-Time Block Updates ⚡

### What to Test
Verify that new blocks appear instantly without refreshing.

### Steps

1. **Open the homepage** (http://localhost:3000)

2. **Look for the "Live" badge**:
   - Should see green pulsing badge next to "Latest Blocks"
   - Should see green pulsing badge next to "Latest Transactions"

3. **Generate a transaction in Anvil**:
   
   Open a **third terminal** and run:
   ```bash
   cast send 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
     --value 1ether \
     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

4. **Watch the FurnaceScout homepage**:
   - ✅ New block should appear within ~100ms
   - ✅ New transaction should appear in the transaction list
   - ✅ No page refresh needed
   - ✅ Block counter increases

### Expected Behavior

```
Before transaction:
Latest Blocks (● Live)
📦 Block #0

[Send transaction via cast]

After transaction (instant):
Latest Blocks (● Live)
📦 Block #1  ← NEW!
📦 Block #0
```

### ❌ Troubleshooting

- **No updates?** Check that Anvil is running on port 8545
- **Still polling?** Restart the dev server (`Ctrl+C`, then `bun dev`)
- **Console errors?** Check browser DevTools (F12) for errors

---

## Test 2: Real-Time Balance Updates 💰

### What to Test
Verify that account balances update automatically.

### Steps

1. **Open the homepage** and scroll down

2. **Find the Anvil Status widget**:
   - Should show "◉ Anvil Connected" with pulsing dot
   - Click to expand it

3. **Note the balances**:
   - All accounts should show ~10000 ETH

4. **Send another transaction**:
   ```bash
   cast send 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
     --value 100ether \
     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

5. **Watch the balances**:
   - ✅ Account 0 balance should decrease (sent 100 ETH + gas)
   - ✅ Account 1 balance should increase (+100 ETH)
   - ✅ Updates happen automatically
   - ✅ Block number in header increases

### Expected Behavior

```
Before:
⓪ 0xf39F...2266    10000.00 ETH
① 0x7099...C8      10000.00 ETH

[Send 100 ETH]

After:
⓪ 0xf39F...2266    9899.99 ETH  ← Decreased
① 0x7099...C8      10100.00 ETH ← Increased
```

---

## Test 3: Enhanced Syntax Highlighting 🎨

### What to Test
Verify that Solidity code displays with professional highlighting.

### Steps

1. **Create a test Solidity file**:

   ```bash
   cat > TestContract.sol << 'EOF'
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.0;

   contract TestContract {
       uint256 public value;
       address public owner;
       
       constructor() {
           owner = msg.sender;
       }
       
       function setValue(uint256 _value) public {
           require(msg.sender == owner, "Not owner");
           value = _value;
       }
       
       function getValue() public view returns (uint256) {
           return value;
       }
   }
   EOF
   ```

2. **Go to Upload ABI page**: http://localhost:3000/upload-abi

3. **Scroll down to "Upload Source Code"**

4. **Upload the TestContract.sol file**

5. **Verify highlighting**:
   - ✅ Keywords (`contract`, `function`, `require`) should be purple/pink
   - ✅ Types (`uint256`, `address`) should be blue
   - ✅ Comments should be green/gray
   - ✅ Strings should be orange
   - ✅ Line numbers appear on the left

### Expected Appearance

**Light Mode**:
```
1  │ // SPDX-License-Identifier: MIT    ← Green
2  │ pragma solidity ^0.8.0;            ← Purple
3  │
4  │ contract TestContract {            ← Purple
5  │     uint256 public value;          ← Blue + Purple
```

**Dark Mode**:
- Similar colors but adjusted for dark background
- Switch theme in system preferences to test

---

## Test 4: Code Folding 📁

### What to Test
Verify that code sections can be folded/unfolded.

### Steps

1. **With TestContract.sol uploaded** (from Test 3)

2. **Hover over line 8** (the `constructor` line)
   - ✅ Fold button (▼) should appear

3. **Click the fold button**
   - ✅ Constructor body should collapse
   - ✅ Should show "... 2 lines folded ..."

4. **Hover over line 12** (the `setValue` function)
   - ✅ Fold button (▼) should appear

5. **Click to fold**
   - ✅ Function body collapses
   - ✅ Shows "... 3 lines folded ..."

6. **Click "Unfold All" button** at top
   - ✅ All sections expand
   - ✅ Full code visible again

### Expected Behavior

```
Before folding:
8  │     constructor() {
9  │         owner = msg.sender;
10 │     }

After folding:
8 ▶│     constructor() {
...│     ... 2 lines folded ...
```

---

## Test 5: Line Number Toggle 🔢

### What to Test
Verify that line numbers can be hidden/shown.

### Steps

1. **With source code visible**

2. **Click "🔢 Hide Line Numbers" button**
   - ✅ Line numbers disappear
   - ✅ Code shifts left
   - ✅ Button changes to "🔢 Show Line Numbers"

3. **Click "🔢 Show Line Numbers"**
   - ✅ Line numbers reappear
   - ✅ Fold buttons work again

---

## Test 6: Multiple Real-Time Sources 🔄

### What to Test
Verify that multiple components update simultaneously.

### Steps

1. **Open homepage** in main browser window

2. **Open a block detail page** in a new tab:
   - Go to http://localhost:3000/block/0

3. **Arrange windows side-by-side**

4. **Send a transaction**:
   ```bash
   cast send 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
     --value 1ether \
     --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

5. **Watch both tabs**:
   - ✅ Homepage shows new block
   - ✅ Block page doesn't update (correct - it's viewing a specific block)
   - ✅ No console errors in either tab

---

## Test 7: Connection Recovery 🔌

### What to Test
Verify that the app handles Anvil restarts gracefully.

### Steps

1. **With homepage open** and showing live updates

2. **Stop Anvil** (Ctrl+C in Anvil terminal)

3. **Watch the homepage**:
   - Updates stop (expected)
   - No crashes or errors

4. **Restart Anvil**:
   ```bash
   anvil
   ```

5. **Watch the homepage**:
   - ✅ Connection restores automatically
   - ✅ Block number resets to 0
   - ✅ Live indicator continues pulsing

---

## Performance Tests 🚀

### Test 8: Network Activity

1. **Open browser DevTools** (F12)

2. **Go to Network tab**

3. **Watch requests** while homepage is open

4. **Verify**:
   - ✅ Initial burst of requests (loading data)
   - ✅ Then quiet until new blocks
   - ✅ No constant polling every 5 seconds

### Test 9: Memory Usage

1. **Open DevTools** → Performance tab

2. **Take a heap snapshot**

3. **Let app run for 5 minutes**

4. **Take another snapshot**

5. **Verify**:
   - ✅ Memory stays relatively stable
   - ✅ No significant memory leaks
   - ✅ Garbage collection working properly

---

## Common Issues & Solutions

### Issue: "Cannot connect to Anvil"

**Solution**:
- Ensure Anvil is running: `ps aux | grep anvil`
- Check port: `lsof -i :8545`
- Restart Anvil if needed

### Issue: "Updates not appearing"

**Solution**:
- Hard refresh browser: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Check `.env.local` has correct RPC URL
- Restart dev server

### Issue: "Syntax highlighting not working"

**Solution**:
- Verify Shiki is installed: `bun pm ls | grep shiki`
- Reinstall if needed: `bun add shiki`
- Clear `.next` cache: `rm -rf .next && bun dev`

### Issue: "Code folding buttons not appearing"

**Solution**:
- Ensure file has proper Solidity syntax
- Try hovering directly over line numbers
- Check that sections have 3+ lines

---

## Regression Tests ✅

Ensure old features still work:

- [ ] Search by block number works
- [ ] Search by transaction hash works
- [ ] Search by address works
- [ ] ABI upload via JSON file works
- [ ] ABI upload via paste works
- [ ] Contract read functions work
- [ ] Contract write functions work (with wallet)
- [ ] Event log viewer works
- [ ] CSV export works
- [ ] Clipboard copy works (addresses, private keys)
- [ ] Dark mode toggle works
- [ ] Responsive design works on mobile

---

## Automated Testing Script

For quick verification, run this script:

```bash
#!/bin/bash

echo "🧪 FurnaceScout Feature Test"
echo "=============================="
echo ""

# Check Anvil
echo "1. Checking Anvil..."
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    echo "   ✅ Anvil is running"
else
    echo "   ❌ Anvil is NOT running"
    exit 1
fi

# Check dev server
echo "2. Checking dev server..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "   ✅ Dev server is running"
else
    echo "   ❌ Dev server is NOT running"
    exit 1
fi

# Test RPC connection
echo "3. Testing RPC connection..."
if curl -s -X POST -H "Content-Type: application/json" \
   --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
   http://localhost:8545 | grep -q result ; then
    echo "   ✅ RPC responding"
else
    echo "   ❌ RPC not responding"
    exit 1
fi

# Send test transaction
echo "4. Sending test transaction..."
cast send 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  --value 1ether \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ Transaction sent"
else
    echo "   ❌ Transaction failed"
    exit 1
fi

echo ""
echo "✅ All automated tests passed!"
echo ""
echo "📋 Manual tests remaining:"
echo "   - Check homepage for new block"
echo "   - Verify live indicators are pulsing"
echo "   - Test syntax highlighting"
echo "   - Test code folding"
echo ""
echo "See TESTING_GUIDE.md for full manual test steps"
```

Save as `test-features.sh` and run:
```bash
chmod +x test-features.sh
./test-features.sh
```

---

## Test Checklist

Copy this checklist for your testing session:

```
Real-Time Features:
[ ] Live badges appear and pulse
[ ] New blocks appear instantly
[ ] Balances update automatically
[ ] Anvil Status shows live data
[ ] No polling in Network tab

Syntax Highlighting:
[ ] Code displays with colors
[ ] Light mode theme works
[ ] Dark mode theme works
[ ] Comments are highlighted
[ ] Keywords are highlighted
[ ] Types are highlighted

Code Folding:
[ ] Fold buttons appear on hover
[ ] Sections fold correctly
[ ] Unfold All button works
[ ] Only 3+ line sections fold

UI/UX:
[ ] Line numbers toggle works
[ ] Loading states display
[ ] Empty states display
[ ] Mobile responsive
[ ] No console errors

Performance:
[ ] No memory leaks
[ ] Network traffic reduced
[ ] UI remains responsive
[ ] No lag or jank
```

---

## Success Criteria

Your tests are successful if:

1. ✅ All blocks appear within 100ms of being mined
2. ✅ Balances update automatically on every block
3. ✅ Network requests are reduced by ~70%
4. ✅ Code displays with professional highlighting
5. ✅ Code folding works smoothly
6. ✅ No console errors during normal operation
7. ✅ App handles Anvil restarts gracefully
8. ✅ All existing features still work

---

## Reporting Issues

If you find bugs:

1. Note exact steps to reproduce
2. Check browser console for errors (F12)
3. Note your environment:
   - OS and version
   - Browser and version
   - Node/Bun version
   - Anvil version
4. Open a GitHub issue with details

---

**Happy Testing! 🧪**

For more information, see:
- [Real-Time Features Documentation](./REAL_TIME_FEATURES.md)
- [Enhancement Summary](./ENHANCEMENTS_SUMMARY.md)
- [Visual Guide](./VISUAL_GUIDE.md)