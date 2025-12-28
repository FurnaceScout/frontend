# Transaction Trace Viewer Documentation

Complete guide to the Transaction Trace Viewer feature in FurnaceScout.

---

## Overview

The Transaction Trace Viewer provides deep insight into transaction execution at the opcode level. This is an incredibly powerful debugging tool that shows you **exactly** what happened during a transaction.

### What You Can See

- 📊 **Call Tree** - Visual hierarchy of all contract calls
- ⚙️ **Opcode Execution** - Step-by-step instruction execution
- 💾 **Storage Changes** - All SLOAD/SSTORE operations
- 💰 **Value Transfers** - ETH transfers between contracts
- ⛽ **Gas Usage** - Gas costs per operation
- ❌ **Revert Reasons** - Why transactions failed

---

## Features

### 1. Call Tree View

Visualizes the entire call stack as a hierarchical tree.

**What it shows:**
- Call type (CALL, DELEGATECALL, STATICCALL, CREATE)
- Target addresses
- Gas used per call
- Value transferred
- Input/output data
- Nested subcalls
- Reverts and errors

**How to use:**
- Click ▶/▼ buttons to expand/collapse calls
- Each call shows its depth level (indentation)
- Errors are highlighted in red
- Value transfers highlighted in orange

**Example:**
```
├─ CALL → 0x1234...5678
│  ├─ Gas: 45,234
│  ├─ Value: 1.0000 ETH
│  └─ DELEGATECALL → 0xabcd...ef01
│     ├─ Gas: 23,451
│     └─ ❌ Revert: "Insufficient balance"
```

---

### 2. Opcodes View

Shows every single opcode executed during the transaction.

**What it shows:**
- Opcode name (e.g., PUSH1, SSTORE, CALL)
- Program Counter (PC)
- Gas remaining
- Gas cost for operation
- Call depth
- Stack contents (top 3 items)

**Filters:**
- **Search by opcode** - Type to filter (e.g., "SSTORE")
- **Important Only** - Shows only key operations:
  - CALL, DELEGATECALL, STATICCALL
  - CREATE, CREATE2
  - SSTORE, SLOAD
  - REVERT, RETURN
  - SELFDESTRUCT

**Interactive:**
- Click any step to see full details
- View complete stack contents
- See memory and storage changes

**Example:**
```
Step | PC  | Opcode  | Gas     | Cost | Depth | Stack (top 3)
-----|-----|---------|---------|------|-------|---------------
0    | 0   | PUSH1   | 100,000 | 3    | 1     | —
1    | 2   | PUSH1   | 99,997  | 3    | 1     | 0x60
2    | 4   | MSTORE  | 99,994  | 6    | 1     | 0x60, 0x40
...
156  | 234 | SSTORE  | 45,231  | 5000 | 1     | 0x00, 0x05
```

---

### 3. Storage View

Shows all storage slot changes during execution.

**What it shows:**
- Storage slot key (256-bit)
- Old value (before transaction)
- New value (after transaction)
- Program Counter where change occurred
- Call depth

**Useful for:**
- Tracking state variable changes
- Understanding storage layout
- Debugging storage collisions
- Verifying upgrade patterns

**Example:**
```
Storage Change #1
├─ Slot: 0x0000...0001
├─ Old Value: 0x0000...0005
├─ New Value: 0x0000...0006
└─ PC: 234 • Depth: 1
```

---

## Usage

### Accessing the Trace Viewer

1. **Navigate to any transaction** page: `/tx/[hash]`
2. **Scroll to bottom** - Trace viewer appears after logs
3. **Switch between views** using the tabs:
   - 📊 Call Tree
   - ⚙️ Opcodes
   - 💾 Storage

### Understanding Call Types

| Type | Color | Description |
|------|-------|-------------|
| **CALL** | Blue | Normal external call to another contract |
| **DELEGATECALL** | Purple | Execute code in context of caller |
| **STATICCALL** | Green | Read-only call (no state changes) |
| **CREATE** | Yellow | Contract creation |
| **CREATE2** | Yellow | Deterministic contract creation |

---

## Use Cases

### 1. Debugging Reverts

**Problem**: Transaction reverted but you don't know why.

**Solution**: Use the trace viewer to:
1. Switch to **Call Tree** view
2. Look for red error indicators (❌)
3. See exact revert reason and where it occurred
4. Trace back to see what led to the revert

**Example:**
```
Transaction reverted at:
├─ MyContract.withdraw()
│  └─ TokenContract.transfer()
│     └─ ❌ Revert: "ERC20: insufficient balance"
```

### 2. Gas Optimization

**Problem**: Transaction uses too much gas.

**Solution**: Use opcodes view to:
1. Enable **Important Only** filter
2. Look for expensive operations (SSTORE costs 5000+ gas)
3. Count how many times operations repeat
4. Identify optimization opportunities

**Example Finding:**
```
SSTORE appears 15 times → 75,000 gas
Solution: Batch updates or use memory
```

### 3. Understanding Complex Interactions

**Problem**: Multiple contracts interacting, unclear flow.

**Solution**: Use call tree to:
1. See the entire call hierarchy
2. Track value transfers between contracts
3. Understand delegation patterns
4. Verify proxy implementations

### 4. Storage Layout Verification

**Problem**: Need to verify storage slots match expectations.

**Solution**: Use storage view to:
1. See which slots were modified
2. Verify slot keys match your variables
3. Check for storage collisions
4. Debug upgrade storage gaps

---

## Technical Details

### How It Works

FurnaceScout uses Anvil's `debug_traceTransaction` RPC method:

```javascript
// Fetch call tree
const callTrace = await publicClient.request({
  method: "debug_traceTransaction",
  params: [hash, { tracer: "callTracer" }]
});

// Fetch opcode trace
const opcodeTrace = await publicClient.request({
  method: "debug_traceTransaction",
  params: [hash, {}]
});
```

### Data Returned

**Call Tracer:**
- Hierarchical call structure
- Gas usage per call
- Input/output data
- Error messages
- Value transfers

**Opcode Tracer:**
- Every instruction executed
- Program counter values
- Gas costs
- Stack contents
- Memory state
- Storage changes

### Limitations

1. **Anvil Only**: Traces are only available on Anvil (local testnet)
2. **Recent Transactions**: Very old transactions may not have traces
3. **Performance**: Large traces (100k+ steps) may be slow to render
4. **Memory**: Deep call stacks might use significant browser memory

---

## Advanced Features

### Opcode Step Details

Click any opcode step to see:
- Full stack contents (all items, not just top 3)
- Exact program counter
- Gas remaining at that step
- Gas cost for that operation
- Call depth

### Storage Change Tracking

The viewer automatically:
- Detects SLOAD and SSTORE operations
- Tracks old vs new values
- Links changes to specific program counters
- Shows changes in call depth context

### Call Expansion

The call tree:
- Starts with root call expanded
- Click any call to expand/collapse
- See nested calls at any depth
- Maintains expansion state as you navigate

---

## Examples

### Example 1: Simple Transfer

```
Transaction: Transfer 1 ETH

Call Tree:
└─ CALL → TokenContract.transfer()
   ├─ Gas: 51,234
   ├─ Value: 0 ETH
   └─ Status: Success

Storage Changes:
├─ Slot 0x00...01 (sender balance)
│  └─ 100 ETH → 99 ETH
└─ Slot 0x00...02 (receiver balance)
   └─ 50 ETH → 51 ETH
```

### Example 2: Failed Delegate Call

```
Transaction: Proxy call that reverted

Call Tree:
└─ CALL → ProxyContract.execute()
   ├─ Gas: 78,456
   └─ DELEGATECALL → LogicContract.doSomething()
      ├─ Gas: 45,231
      └─ ❌ Revert: "Only owner"

Result: Entire transaction reverted
```

### Example 3: Complex DeFi Transaction

```
Transaction: Swap on DEX

Call Tree:
└─ CALL → Router.swapExactTokensForTokens()
   ├─ CALL → TokenA.transferFrom()
   │  └─ Storage: Update balances
   ├─ CALL → Pair.swap()
   │  ├─ CALL → TokenA.transfer()
   │  └─ CALL → TokenB.transfer()
   └─ CALL → TokenB.transfer()

Total Gas: 145,678
Storage Changes: 8
```

---

## Troubleshooting

### "Failed to Load Trace"

**Causes:**
- Transaction doesn't exist
- Anvil isn't running
- RPC connection issues
- Transaction too old (trace expired)

**Solutions:**
1. Verify Anvil is running on port 8545
2. Check transaction hash is correct
3. Ensure transaction is recent
4. Try refreshing the page

### Trace Loads Slowly

**Causes:**
- Very large transaction (100k+ opcodes)
- Many storage changes
- Deep call stack

**Solutions:**
1. Use **Important Only** filter in Opcodes view
2. Collapse unnecessary calls in Call Tree
3. Close other browser tabs
4. Use a more powerful machine

### Missing Storage Changes

**Causes:**
- No storage was modified (e.g., view functions)
- Using STATICCALL (no storage changes allowed)

**Solutions:**
- This is expected behavior
- Check Call Tree to verify call type
- Look at Opcodes to confirm no SSTORE

---

## Performance Tips

### For Large Traces

1. **Use filters** - Start with "Important Only"
2. **Collapse calls** - Don't expand everything at once
3. **Search specific opcodes** - Use the search box
4. **Close details panel** - Don't keep step details open

### Browser Optimization

1. Close DevTools when not needed
2. Use Chrome/Edge for best performance
3. Close other tabs to free memory
4. Disable browser extensions temporarily

---

## Keyboard Shortcuts

*Coming soon in future release*

Planned shortcuts:
- `J/K` - Navigate opcode steps
- `Space` - Expand/collapse call
- `/` - Focus search box
- `Esc` - Close details panel

---

## Comparison with Other Tools

### vs Etherscan Transaction Trace

| Feature | FurnaceScout | Etherscan |
|---------|--------------|-----------|
| Local Anvil | ✅ Yes | ❌ No |
| Call Tree | ✅ Interactive | ✅ Static |
| Opcode View | ✅ Filterable | ✅ Basic |
| Storage Changes | ✅ Tracked | ❌ Limited |
| Real-time | ✅ Instant | ❌ Delayed |
| Free | ✅ Always | ⚠️ Limited |

### vs Tenderly Debugger

| Feature | FurnaceScout | Tenderly |
|---------|--------------|----------|
| Cost | ✅ Free | 💰 Paid |
| Setup | ✅ Zero config | ⚙️ Account required |
| Local Dev | ✅ Perfect | ⚠️ Limited |
| UI | ✅ Clean | ✅ Advanced |
| Simulation | ❌ Not yet | ✅ Yes |

---

## API Reference

### Component Props

```javascript
<TransactionTrace hash={string} />
```

**Props:**
- `hash` (required) - Transaction hash to trace

### Hook Usage

```javascript
import { debugTraceTransaction } from "@/lib/viem";

const trace = await debugTraceTransaction(hash);
// Returns: Call tree structure

import { debugTraceTransactionOpcodes } from "@/lib/viem";

const opcodes = await debugTraceTransactionOpcodes(hash);
// Returns: { structLogs: [...], gas: "...", returnValue: "..." }
```

### Utility Functions

```javascript
import { parseStorageChanges, formatGas } from "@/lib/viem";

// Parse storage changes from struct logs
const changes = parseStorageChanges(structLogs);

// Format gas for display
const formatted = formatGas(12345); // "12,345"
```

---

## Future Enhancements

### Planned Features

- [ ] Search within call tree
- [ ] Export trace as JSON
- [ ] Compare two traces side-by-side
- [ ] Memory view panel
- [ ] Jump to specific PC
- [ ] Bookmark important steps
- [ ] Keyboard shortcuts
- [ ] Trace diff for upgrades
- [ ] Gas heatmap visualization
- [ ] Time travel debugging (step back)

### Community Requests

Want a feature? Open an issue on GitHub!

---

## Best Practices

### When Debugging

1. **Start with Call Tree** - Get the big picture
2. **Look for reverts** - Red indicators show problems
3. **Check storage** - Verify state changes
4. **Use filters** - Don't get overwhelmed by opcodes
5. **Take notes** - Document findings as you debug

### When Optimizing

1. **Count SSTOREs** - Most expensive operation
2. **Look for loops** - Repeated operations waste gas
3. **Check call depth** - Deep stacks cost more
4. **Minimize delegatecalls** - Add overhead
5. **Batch operations** - Reduce total calls

### When Learning

1. **Trace simple transactions first** - Build understanding
2. **Compare successful vs failed** - Learn patterns
3. **Study DeFi protocols** - See how pros do it
4. **Experiment locally** - It's free on Anvil!
5. **Read opcode docs** - Know what each does

---

## Resources

### EVM Opcodes

- [EVM Codes](https://www.evm.codes/) - Interactive opcode reference
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Formal specification
- [Solidity Docs](https://docs.soliditylang.org/) - High-level language reference

### Debugging Guides

- [Foundry Debugging](https://book.getfoundry.sh/forge/debugger) - Official Forge debugger
- [Tenderly Docs](https://docs.tenderly.co/) - Professional debugging tools
- [DamnVulnerableDeFi](https://www.damnvulnerabledefi.xyz/) - Practice challenges

### Related Tools

- **Forge Debugger** - Terminal-based debugger (`forge debug`)
- **Remix Debugger** - Browser-based Solidity debugger
- **Hardhat Console.log** - Print debugging
- **ETH.Build** - Visual learning tool

---

## FAQ

### Q: Can I use this with mainnet transactions?

**A:** No, traces are only available on Anvil. For mainnet, use Etherscan or Tenderly.

### Q: Why is my trace empty?

**A:** The transaction may be too old or Anvil wasn't running in debug mode.

### Q: How do I trace failed transactions?

**A:** Failed transactions are traced just like successful ones. Look for red error indicators.

### Q: Can I export the trace?

**A:** Not yet, but it's on the roadmap! For now, you can copy data from the UI.

### Q: What's the maximum transaction size?

**A:** Technically unlimited, but traces over 100k steps may be slow to render.

### Q: How accurate is the gas calculation?

**A:** Extremely accurate - it's from Anvil's actual execution, not estimated.

### Q: Can I trace transactions from Remix?

**A:** Yes! Just deploy to Anvil instead of JavaScript VM, then use FurnaceScout.

---

## Support

Need help with the trace viewer?

- **Documentation**: This file
- **Examples**: See `/docs/VISUAL_GUIDE.md`
- **Issues**: [GitHub Issues](https://github.com/FurnaceScout/frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/FurnaceScout/frontend/discussions)

---

**Happy Debugging! 🐛🔍**