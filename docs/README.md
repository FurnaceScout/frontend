# FurnaceScout Documentation

Welcome to the FurnaceScout documentation! This directory contains comprehensive guides for all features.

---

## 📚 Documentation Index

### Core Documentation

- **[Main README](../README.md)** - Project overview, installation, and quick start
- **[CHANGELOG](../CHANGELOG.md)** - Version history and release notes

### Feature Guides

- **[Real-Time Features](./REAL_TIME_FEATURES.md)** - Complete guide to WebSocket-based live updates
  - Custom hooks API reference
  - Migration guide from polling
  - Performance considerations
  - Troubleshooting

- **[Enhancements Summary](./ENHANCEMENTS_SUMMARY.md)** - High-level overview of recent improvements
  - Real-time monitoring implementation
  - Enhanced syntax highlighting details
  - Performance metrics
  - Before/after comparisons

- **[Visual Guide](./VISUAL_GUIDE.md)** - Visual examples and UI/UX documentation
  - Screenshot-style representations
  - Component architecture diagrams
  - User interaction flows
  - Responsive design examples

- **[Testing Guide](./TESTING_GUIDE.md)** - How to test new features
  - Step-by-step test procedures
  - Automated testing scripts
  - Common issues and solutions
  - Test checklists

---

## 🚀 Quick Links

### For Users
- **Getting Started**: See [Main README](../README.md#quick-start)
- **Testing Features**: See [Testing Guide](./TESTING_GUIDE.md)
- **Visual Examples**: See [Visual Guide](./VISUAL_GUIDE.md)

### For Developers
- **Hooks API**: See [Real-Time Features](./REAL_TIME_FEATURES.md#custom-hooks)
- **Migration Guide**: See [Real-Time Features](./REAL_TIME_FEATURES.md#migration-guide)
- **Architecture**: See [Enhancements Summary](./ENHANCEMENTS_SUMMARY.md#implementation-details)

---

## 🎯 What's New

### Latest Enhancements (v0.2.0)

1. **Real-Time Blockchain Monitoring**
   - WebSocket-based live updates
   - 7 custom React hooks for common operations
   - 71% reduction in API calls
   - Instant block/transaction updates

2. **Enhanced Syntax Highlighting**
   - Shiki integration (VS Code quality)
   - Code folding for contracts, functions, etc.
   - Dual theme support (light/dark)
   - Better Solidity syntax recognition

See [CHANGELOG](../CHANGELOG.md) for complete details.

---

## 📖 Reading Guide

### New to FurnaceScout?
1. Start with [Main README](../README.md)
2. Follow the Quick Start guide
3. Read [Visual Guide](./VISUAL_GUIDE.md) for UI overview
4. Try the features with [Testing Guide](./TESTING_GUIDE.md)

### Integrating Real-Time Updates?
1. Read [Real-Time Features](./REAL_TIME_FEATURES.md)
2. Check the hooks API documentation
3. Follow migration examples
4. Review [Enhancements Summary](./ENHANCEMENTS_SUMMARY.md) for implementation details

### Contributing or Extending?
1. Review [Enhancements Summary](./ENHANCEMENTS_SUMMARY.md)
2. Study the custom hooks in [Real-Time Features](./REAL_TIME_FEATURES.md)
3. Check [CHANGELOG](../CHANGELOG.md) for roadmap
4. See architecture diagrams in [Visual Guide](./VISUAL_GUIDE.md)

---

## 🏗️ Architecture Overview

```
FurnaceScout
├── Real-Time System
│   ├── useWatchBlockNumber (master watch)
│   ├── useLatestBlocks
│   ├── useLatestTransactions
│   ├── useWatchBalance(s)
│   ├── useChainInfo
│   └── useWatchBlock
│
├── UI Components
│   ├── Homepage (blocks + transactions)
│   ├── AnvilStatus (chain info + balances)
│   ├── SourceCodeViewer (syntax + folding)
│   ├── ContractInteraction
│   └── EventLogViewer
│
└── Core Libraries
    ├── viem (blockchain + watching)
    ├── wagmi (wallet connection)
    ├── shiki (syntax highlighting)
    └── Next.js 16 (framework)
```

---

## 💡 Key Concepts

### Real-Time Updates
FurnaceScout uses viem's `watchBlockNumber` to subscribe to new blocks. When a block is mined:
1. Master hook receives notification
2. Dependent hooks trigger updates
3. UI components re-render with new data
4. All happens in ~100ms

See [Real-Time Features](./REAL_TIME_FEATURES.md) for details.

### Custom Hooks
Seven specialized hooks provide real-time data:
- **Watch single**: `useWatchBlockNumber`, `useWatchBalance`, `useWatchBlock`
- **Watch multiple**: `useWatchBalances`
- **Aggregate**: `useLatestBlocks`, `useLatestTransactions`, `useChainInfo`

See [API Reference](./REAL_TIME_FEATURES.md#custom-hooks) for full documentation.

### Enhanced Highlighting
Shiki provides VS Code-quality syntax highlighting:
- Accurate Solidity parsing
- Multi-theme support
- Fast rendering
- Extensible

See [Enhancements Summary](./ENHANCEMENTS_SUMMARY.md#enhancement-2-enhanced-syntax-highlighting) for details.

---

## 🔧 Configuration

### Environment Variables
```bash
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
```

### Polling Interval
Adjust in `/app/hooks/useBlockchain.js`:
```javascript
pollingInterval: 1000, // 1 second for Anvil
```

### Syntax Themes
Configure in `/app/components/SourceCodeViewer.js`:
```javascript
themes: {
  light: "github-light",
  dark: "github-dark",
}
```

---

## 🐛 Troubleshooting

### Common Issues

**Real-time updates not working?**
→ See [Real-Time Features: Troubleshooting](./REAL_TIME_FEATURES.md#troubleshooting)

**Syntax highlighting broken?**
→ See [Testing Guide: Common Issues](./TESTING_GUIDE.md#common-issues--solutions)

**Performance problems?**
→ See [Real-Time Features: Performance](./REAL_TIME_FEATURES.md#performance-considerations)

---

## 📊 Performance

- **API Calls**: Reduced by ~71%
- **Update Latency**: ~100ms (from 0-5 seconds)
- **Memory**: Stable (proper cleanup)
- **Network**: Minimal overhead

See [Enhancements Summary](./ENHANCEMENTS_SUMMARY.md#performance-comparison) for detailed metrics.

---

## 🎯 Future Roadmap

- [ ] Native WebSocket support
- [ ] Real-time event streaming
- [ ] Mempool monitoring
- [ ] Multi-chain support
- [ ] Transaction trace viewer
- [ ] Forge test integration

See [CHANGELOG](../CHANGELOG.md#future-roadmap) for complete roadmap.

---

## 🤝 Contributing

We welcome contributions! Before submitting PRs:

1. Read the documentation
2. Check [CHANGELOG](../CHANGELOG.md) for planned features
3. Follow existing patterns (especially for hooks)
4. Add tests where appropriate
5. Update documentation

---

## 📜 License

MIT License - see [LICENSE](../LICENSE) for details.

---

## 🙏 Acknowledgments

- **viem** - Excellent Ethereum library
- **Shiki** - Beautiful syntax highlighting
- **Foundry** - Amazing development toolkit
- **Next.js** - Powerful React framework

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/FurnaceScout/frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/FurnaceScout/frontend/discussions)
- **Main Repo**: [FurnaceScout/frontend](https://github.com/FurnaceScout/frontend)

---

**Built with ❤️ for the Foundry community**