# Transaction Trace Viewer - Quick Reference Card

**One-page guide to the Transaction Trace Viewer in FurnaceScout**

---

## 🚀 Quick Start

1. Send a transaction to Anvil
2. Go to `/tx/[hash]` in FurnaceScout
3. Scroll to bottom → Trace viewer appears
4. Switch between **Call Tree**, **Opcodes**, **Storage** tabs

---

## 📊 Call Tree View

**What it shows:** Hierarchical structure of all contract calls

### Key Features
- **▶/▼ buttons** - Expand/collapse calls
- **Color badges** - Call types (CALL, DELEGATECALL, etc.)
- **Gas usage** - Per call and cumulative
- **Value transfers** - ETH amounts in orange
- **Errors** - Revert reasons in red

### Call Type Colors
- 🔵 **CALL** - Normal external call
- 🟣 **DELEGATECALL** - Execute in caller context
- 🟢 **STATICCALL** - Read-only call
- 🟡 **CREATE/CREATE2** - Contract creation

### Example
```
├─ CALL → Router.swap() • Gas: 145,678
│  ├─ CALL → Token.transferFrom()
│  ├─ CALL → Pair.swap()
│  │  ├─ CALL → Token.transfer()
│  │  └─ CALL → Token.transfer()
│  └─ Status: ✓ Success
```

---

## ⚙️ Opcodes View

**What it shows:** Every opcode executed step-by-step

### Key Features
- **Filter box** - Search by opcode name
- **Important Only** - Show only key operations
- **Click step** - See full details (stack, memory, etc.)
- **Gas tracking** - Cost per operation
- **Red highlighting** - Important opcodes

### Important Opcodes
- **Storage**: SLOAD, SSTORE
- **Calls**: CALL, DELEGATECALL, STATICCALL
- **Creation**: CREATE, CREATE2
- **Control**: REVERT, RETURN, SELFDESTRUCT

### Columns
| Column | Description |
|--------|-------------|
| Step | Sequential step number |
| PC | Program counter |
| Opcode | Instruction name |
| Gas | Gas remaining |
| Cost | Gas cost for this op |
| Depth | Call depth |
| Stack | Top 3 stack items |

### Example
```
Step | PC  | Opcode | Gas     | Cost | Stack
-----|-----|--------|---------|------|-------
156  | 234 | SSTORE | 45,231  | 5000 | 0x00, 0x05
157  | 236 | PUSH1  | 40,231  | 3    | —
```

---

## 💾 Storage View

**What it shows:** All storage slot modifications

### Key Features
- **Slot tracking** - Which 256-bit slots changed
- **Before/after** - Old vs new values
- **PC reference** - Where change occurred
- **Visual diff** - Red (old) → Green (new)

### Example
```
Storage Change #1
├─ Slot: 0x0000...0001
├─ Old: 0x0000...0005
├─ New: 0x0000...0006
└─ PC: 234 • Depth: 1
```

---

## 🎯 Common Use Cases

### 1. Find Why Transaction Reverted
1. Switch to **Call Tree**
2. Look for red **❌** indicators
3. Read revert reason
4. Trace back to see what led to it

### 2. Optimize Gas Usage
1. Switch to **Opcodes**
2. Click **Important Only**
3. Count SSTORE operations (5000+ gas each)
4. Look for repeated patterns

### 3. Verify Proxy Pattern
1. Switch to **Call Tree**
2. Look for DELEGATECALL
3. Check **Storage View**
4. Verify changes in correct contract

### 4. Debug Storage Layout
1. Switch to **Storage**
2. Note which slots changed
3. Compare with your contract variables
4. Check for collisions

---

## 🔍 Debugging Workflow

```
Transaction fails ❌
       ↓
Open Trace Viewer
       ↓
Check Call Tree
       ↓
Find red error ❌
       ↓
See revert reason
       ↓
Fix the code! ✅
```

**Time saved: 20 minutes → 2 minutes** 🎉

---

## ⌨️ Tips & Tricks

### Call Tree
- Start with root expanded, drill down as needed
- Red backgrounds = errors/reverts
- Orange values = ETH transfers
- Indentation = call depth

### Opcodes
- Use filter to find specific operations
- "Important Only" for quick overview
- Click any step for full stack
- Look for repeated patterns (optimization)

### Storage
- Empty list = no storage changes (normal for views)
- Compare slots with Solidity variable positions
- Track state across multiple calls
- Useful for debugging upgrades

---

## 🚨 Troubleshooting

### "Failed to Load Trace"
- ✅ Check Anvil is running
- ✅ Verify transaction hash
- ✅ Ensure transaction is recent
- ✅ Try refreshing page

### Slow Loading
- Use "Important Only" filter
- Collapse unnecessary calls
- Close other browser tabs
- Transaction may have 100k+ opcodes

### No Storage Changes
- Expected for view/pure functions
- STATICCALLs can't modify storage
- Check call type in Call Tree

---

## 📚 Learn More

### Documentation
- **Complete Guide**: `/docs/TRANSACTION_TRACE.md`
- **Visual Examples**: `/docs/VISUAL_GUIDE.md`
- **Changelog**: `/CHANGELOG.md`

### External Resources
- **EVM Codes**: https://www.evm.codes/
- **Foundry Book**: https://book.getfoundry.sh/
- **Solidity Docs**: https://docs.soliditylang.org/

---

## 🎓 Opcode Cheat Sheet

### Most Common
- `PUSH1-PUSH32` - Push bytes onto stack (3 gas)
- `ADD, SUB, MUL, DIV` - Arithmetic (3-5 gas)
- `SLOAD` - Load from storage (2100 gas)
- `SSTORE` - Save to storage (5000-20000 gas)
- `MSTORE, MLOAD` - Memory ops (3 gas)
- `JUMP, JUMPI` - Control flow (8-10 gas)

### Most Expensive
- `SSTORE` - 5000-20000 gas (storage write)
- `CREATE` - 32000+ gas (deploy contract)
- `CALL` - 700+ gas (external call)
- `SHA3` - 30+ gas per word (hashing)

### Special
- `REVERT` - Revert with reason
- `RETURN` - Return data
- `SELFDESTRUCT` - Destroy contract
- `DELEGATECALL` - Execute in caller context

---

## 💡 Pro Tips

### Gas Optimization
1. Count SSTORE operations
2. Look for storage reads in loops
3. Check if values cached properly
4. Consider using memory instead

### Debugging Patterns
1. Start broad (Call Tree)
2. Then detailed (Opcodes)
3. Verify state (Storage)
4. Repeat until fixed

### Learning EVM
1. Trace simple transactions first
2. Compare similar transactions
3. Read opcode documentation
4. Experiment on Anvil (free!)

---

## 🔗 Quick Links

- **Transaction Page**: `/tx/[hash]`
- **GitHub Issues**: Report bugs
- **Foundry Discord**: Ask questions
- **EVM Playground**: https://www.evm.codes/playground

---

## 📊 Feature Matrix

| Feature | Available | Notes |
|---------|-----------|-------|
| Call Tree | ✅ Yes | Interactive |
| Opcodes | ✅ Yes | Filterable |
| Storage | ✅ Yes | Before/after |
| Memory | ⏳ Planned | Future |
| Export | ⏳ Planned | JSON/CSV |
| Compare | ⏳ Planned | Side-by-side |
| Shortcuts | ⏳ Planned | Keyboard |

---

## ⚡ Performance

- **Small tx** (<1k opcodes): Instant ⚡
- **Medium tx** (1k-10k): <1 second 🚀
- **Large tx** (>10k): 1-3 seconds ⏱️
- **Max supported**: 100k+ opcodes 💪

---

## 🎯 Success Checklist

- [ ] Anvil running on port 8545
- [ ] Transaction completed (success or failed)
- [ ] FurnaceScout open in browser
- [ ] Navigate to `/tx/[hash]`
- [ ] Scroll to bottom
- [ ] See trace viewer!

---

**Built with ❤️ for the Foundry community**

*Print this page for quick reference!*