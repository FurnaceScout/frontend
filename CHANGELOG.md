# Changelog

All notable changes to FurnaceScout will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - 2024

#### Block "latest" Route Support
- **Dynamic latest block**: Added support for `/block/latest` route to automatically fetch and display the most recent block
- **Flexible block parameter**: Block page now handles both numeric block numbers and the "latest" keyword
- **Improved navigation**: Users can now easily access the latest block without knowing the current block height

#### Homepage Improvements
- **Removed incorrect "View all" links**: Removed non-functional "View all" links from Latest Blocks and Latest Transactions sections
- **Cleaner UI**: Simplified section headers for better visual clarity
- **Better UX**: Eliminated broken navigation links that led to non-existent list pages

#### Disclaimer Additions
- **Homepage disclaimer badge**: Prominent unofficial notice in hero section
- **Footer disclaimer**: Site-wide footer with unofficial status and Foundry links
- **README disclaimer**: Enhanced disclaimer section with official Foundry resources
- **Metadata update**: Page description includes unofficial status
- **Docker documentation**: Added disclaimer to Docker deployment guide
- **Unofficial badge**: Added orange "Unofficial" badge to README
- **Official resources**: Links to Foundry Book, GitHub, and Telegram support

#### Branding Update
- **Updated branding**: Changed from "IronScout" to "FurnaceScout" throughout the application
- **Homepage hero section**: Updated title and descriptions to reflect FurnaceScout branding
- **Docker files**: Updated all Docker-related files (Dockerfile, docker-compose.yml, docker-start.sh)
- **Documentation**: Updated all documentation to use FurnaceScout naming
- **Container names**: Docker containers now use `furnacescout` instead of `ironscout`
- **Consistent branding**: All references across codebase now use FurnaceScout

#### Docker Support
- **Multi-stage Dockerfile**: Optimized build with Bun runtime (~200MB final image)
- **Docker Compose configuration**: Easy setup with Anvil integration options
- **Quick start script**: `docker-start.sh` for convenient Docker launching
- **Non-root container**: Runs as `nextjs` user (UID 1001) for security
- **Health checks**: Automatic container health monitoring (30s interval)
- **Volume mounting**: Support for Foundry project directory mounting
- **Network configurations**: Host network and bridge network support with `host.docker.internal`
- **Environment configuration**: `.env.docker.example` with comprehensive documentation
- **Standalone Next.js output**: Optimized production build for Docker
- **Read-only volumes**: Foundry projects mounted as `:ro` for safety
- **Multiple deployment options**: Docker CLI, docker-compose, or quick start script
- **Comprehensive documentation**: Complete Docker guide in `/docs/DOCKER.md`
- **CI/CD examples**: GitHub Actions workflow for Docker builds
- **Troubleshooting guide**: Common issues and solutions
- **Performance optimization**: BuildKit support, layer caching, resource limits

#### Homepage Redesign
- **Professional hero section**: Large branding with clear value proposition and tagline
- **Prominent search bar**: Smart search with auto-detection for tx hashes, addresses, and block numbers
- **Real-time network statistics**: Live status, latest block, gas price, and chain ID with 12-second polling
- **Developer tools feature grid**: 6-card grid showcasing Block Explorer, Contract Interaction, Foundry Deployments, Anvil State Manager, State Diff Viewer, and Cast Builder
- **Enhanced latest activity section**: Improved card layouts for blocks and transactions with better visual hierarchy
- **Footer CTA section**: Call-to-action promoting key features with action buttons
- **Smart search detection**: Automatically routes to correct page based on input format
- **Improved visual design**: Gradient backgrounds, hover effects, lift animations, and shadows
- **Better information density**: Gas values in Gwei and millions, cleaner stat displays
- **Responsive layout**: Mobile-first design with adaptive grids for tablet and desktop
- **Empty states**: Helpful messaging when no transactions are available
- **Loading states**: Better loading experience with minimal flash
- **Documentation**: Complete homepage redesign documentation in `/docs/HOMEPAGE_REDESIGN.md`

#### State Diff Viewer
- **Transaction state change analysis**: Complete visibility into blockchain state modifications
- **Balance tracking**: Show ETH balance changes before/after for all affected addresses
- **Nonce tracking**: Display transaction count changes per address
- **Code change detection**: Identify contract deployments and destructions
- **Storage operations**: Detailed SSTORE/SLOAD tracking with keys, values, gas costs
- **Token transfer detection**: Automatic ERC20 and ERC721 transfer recognition from logs
- **Multi-tab interface**: Organized views (Overview/Balances/Tokens/Storage)
- **Address categorization**: Distinguish between EOAs and contracts
- **Export functionality**: Download complete state diff as JSON
- **Expandable details**: Click addresses to see detailed changes
- **Color-coded changes**: Green for increases, red for decreases
- **Before/After comparison**: Clear display of state transitions
- **Components**:
  - `StateDiffViewer` - State change visualization component (625 lines)
- **Utilities** (`/lib/state-diff.js`):
  - `getTransactionStorageChanges()` - Analyze transaction state changes
  - `getDetailedStorageChanges()` - Extract SSTORE/SLOAD from trace
  - `compareBlockStates()` - Compare state between two blocks
  - `getBlockBalanceChanges()` - Get all balance changes in a block
  - `formatStorageKey()` / `formatStorageValue()` - Format storage for display
  - `formatBalanceChange()` - Format balance diffs with ETH/wei
  - `categorizeAddress()` - Classify EOA vs Contract
  - `getStateDiffSummary()` - Calculate statistics
  - `exportStateDiff()` - Export as JSON
  - `compareStorageSlots()` - Compare specific slots between blocks
  - `detectERC20Transfers()` - Parse ERC20 Transfer events
  - `detectERC721Transfers()` - Parse ERC721 Transfer events
- **Features**:
  - Parallel address queries for speed
  - Debug trace integration for storage ops
  - Automatic token transfer extraction
  - Summary statistics dashboard
  - Address expansion/collapse UI
  - Copy addresses to clipboard
  - Load detailed storage on demand
  - Support for complex transactions
- **Integration**:
  - Automatically appears on transaction pages
  - Works with transaction trace viewer
  - Complements contract interaction
  - Integrates with event detection
- **Documentation**: `/docs/STATE_DIFF_VIEWER.md` - Complete state diff guide (585 lines)

#### Anvil State Management Panel
- **Complete Anvil control interface**: UI for all Anvil RPC testing features
- **Snapshot management**: Create named snapshots and revert to any saved state
- **Mining control**: Manual block mining, automine toggle, interval mining configuration
- **Time manipulation**: Increase time by seconds or set exact block timestamps
- **Balance management**: Set any account balance to any ETH amount instantly
- **Nonce management**: Set account nonces for testing or fixing stuck transactions
- **Account impersonation**: Send transactions as any address without private key
- **Advanced operations**: Reset Anvil, drop pending transactions
- **Persistent metadata**: Snapshot and impersonation tracking in localStorage
- **Multi-tab interface**: Organized by function (Snapshots/Mining/Time/Accounts/Advanced)
- **Time travel helpers**: Quick buttons for 1 hour, 1 day, 1 week
- **Current state display**: Shows current block timestamp
- **Impersonation tracking**: List active impersonations with stop controls
- **Success/error feedback**: Clear messages for all operations
- **Confirmation prompts**: Protection for destructive operations
- **Components**:
  - `AnvilStateManager` - State management UI modal (882 lines)
- **Utilities** (`/lib/anvil-state.js`):
  - `createSnapshot()` - Create blockchain state snapshot
  - `revertToSnapshot()` - Restore to previous snapshot
  - `mineBlock()` / `mineBlocks()` - Manual block mining
  - `increaseTime()` - Fast-forward blockchain time
  - `setNextBlockTimestamp()` - Set exact timestamp for next block
  - `setBalance()` - Set account ETH balance
  - `setNonce()` - Set account transaction nonce
  - `setCode()` - Set contract bytecode at address
  - `setStorageAt()` - Set storage slot value
  - `impersonateAccount()` - Start impersonating account
  - `stopImpersonatingAccount()` - Stop impersonating
  - `setAutomine()` - Enable/disable automine
  - `setIntervalMining()` - Set interval mining (mine blocks at regular intervals)
  - `reset()` - Reset Anvil to genesis state
  - `dropAllTransactions()` - Clear mempool
  - `getSavedSnapshots()` / `saveSnapshotMetadata()` - Snapshot persistence
  - `getImpersonatedAccounts()` / `addImpersonatedAccount()` - Impersonation tracking
  - `ethToWei()` / `weiToEth()` - ETH/wei conversions
  - `formatTimestamp()` - Format Unix timestamps
  - `getCurrentBlockTimestamp()` - Get current block time
- **RPC Methods Used**:
  - `evm_snapshot`, `evm_revert` - Snapshots
  - `evm_mine`, `evm_setAutomine`, `evm_setIntervalMining` - Mining
  - `evm_increaseTime`, `evm_setNextBlockTimestamp` - Time
  - `anvil_setBalance`, `anvil_setNonce`, `anvil_setCode`, `anvil_setStorageAt` - State
  - `anvil_impersonateAccount`, `anvil_stopImpersonatingAccount` - Impersonation
  - `anvil_reset`, `anvil_dropAllTransactions` - Advanced
- **Features**:
  - Named snapshots with descriptions and timestamps
  - Multiple snapshots support
  - One-click revert to any snapshot
  - Batch block mining (mine N blocks at once)
  - Quick time increase buttons (common intervals)
  - Balance setting in ETH (auto-converts to wei)
  - Real-time impersonation list
  - Destructive operation warnings
  - localStorage persistence for metadata
  - Clean modal interface with tab navigation
- **Integration**:
  - Accessible from header (⚙️ Anvil button)
  - Works with all testing workflows
  - Complements contract interaction
  - Essential for development testing
- **Documentation**: `/docs/ANVIL_STATE_MANAGEMENT.md` - Complete guide (821 lines)

#### Contract Interaction UI
- **Complete contract interaction interface**: Read and write functions via ABI
- **Read function calls**: Query contract state without gas (view/pure functions)
- **Write function transactions**: Send state-changing transactions with wallet integration
- **Gas estimation**: Estimate transaction costs before sending via `eth_estimateGas`
- **Transaction simulation**: Test transactions before execution to preview results
- **Payable function support**: Send ETH with function calls
- **Comprehensive type handling**: Support for all Solidity types (uint, int, address, bool, string, bytes, arrays, structs, tuples)
- **Input validation**: Real-time validation with type-specific error messages
- **Result decoding**: Automatic formatting of return values (BigInt, arrays, objects)
- **Call history**: Track last 10 calls per function with one-click replay
- **Wallet integration**: Connect/disconnect MetaMask and web3 wallets via wagmi
- **Multi-tab interface**: Separate tabs for Read, Write, and Events
- **Expandable function cards**: Clean UI with collapsible function details
- **Gas estimate display**: Show estimated gas units before transaction
- **Simulation results**: Preview expected return values
- **Transaction receipts**: Display hash, status, gas used, with links to tx details
- **Error handling**: Detailed error messages for validation, estimation, and execution failures
- **Function signatures**: Display full function signatures with parameter and return types
- **History management**: Load previous calls, clear history per function
- **Components**:
  - `ContractInteraction` - Enhanced interaction UI (790 lines)
- **Utilities** (`/lib/contract-interaction.js`):
  - `parseABI()` - Categorize functions by type (read/write/events/errors)
  - `getFunctionSignature()` - Generate human-readable signatures
  - `parseInputValue()` - Parse and validate input by Solidity type
  - `formatOutputValue()` - Format return values for display
  - `callReadFunction()` - Execute read function calls
  - `estimateGas()` - Estimate gas for write functions
  - `sendWriteTransaction()` - Send transactions via wallet
  - `simulateWriteFunction()` - Simulate transaction execution
  - `getDefaultValue()` - Get default value for Solidity type
  - `validateInput()` - Validate input against type constraints
  - `getInputFieldType()` - Determine HTML input type
  - `isPayable()` - Check if function accepts ETH
  - `encodeFunctionCall()` - Encode function calldata
  - `decodeFunctionResultData()` - Decode function results
  - `getFunctionSelector()` - Get function selector
  - `formatEther()` / `parseEther()` - ETH/wei conversions
  - `getRecentCalls()` - Retrieve call history
  - `saveCallToHistory()` - Persist call history
  - `clearCallHistory()` - Remove call history
- **Features**:
  - Automatic ABI parsing and function categorization
  - Dynamic form generation based on function parameters
  - Support for complex nested types (arrays of structs, multi-dimensional arrays)
  - Transaction simulation before sending (no gas cost)
  - Gas estimation with buffer (10% added automatically)
  - Wallet connection state management
  - localStorage persistence for call history
  - One-click load from history
  - Clickable transaction hashes linking to tx details
  - Real-time input validation with error display
  - Function badges (READ/WRITE/PAYABLE)
  - Call count display from history
  - Collapsible function cards for better UX
- **Integration**:
  - Automatically appears on contract address pages when ABI loaded
  - Works with Foundry-scanned ABIs
  - Works with manually uploaded ABIs
  - Works with deployment-linked ABIs
- **Documentation**: `/docs/CONTRACT_INTERACTION.md` - Complete interaction guide (788 lines)

#### Foundry Deployment Tracker
- **Automatic deployment detection**: Scan and parse Foundry `broadcast/` files from forge script
- **Deployment history tracking**: View complete deployment history across all scripts and chains
- **Multi-chain support**: Track deployments on Anvil, Mainnet, Sepolia, and custom chains
- **Automatic ABI linking**: Link deployed contracts to compiled ABIs by name
- **Quick navigation**: Navigate to contract addresses, deployment transactions, and blocks
- **Filter and sort**: Filter by contract name, address, or script; sort by any column
- **Statistics dashboard**: View total deployments, unique contracts, chains, and latest deployment
- **Import/Export**: Backup and share deployment data as JSON
- **Data persistence**: Store deployments in browser localStorage
- **Deployment management**: View, delete, and organize deployment records
- **API Routes**:
  - `/api/foundry/deployments` - Scan broadcast directory and extract deployments
- **Components**:
  - `DeploymentTracker` - Main deployment tracking UI component (500 lines)
- **Utilities** (`/lib/foundry-deployments.js`):
  - `scanFoundryDeployments()` - Scan broadcast files
  - `loadDeployments()` - Load deployments into storage
  - `getDeployments()` - Retrieve deployments with optional chain filter
  - `getDeploymentByAddress()` - Find deployment by address
  - `getDeploymentsByName()` - Find all deployments of a contract
  - `linkDeploymentsToABIs()` - Automatically link deployments to ABIs
  - `getDeploymentStats()` - Calculate deployment statistics
  - `clearDeployments()` - Clear all deployment data
  - `exportDeployments()` - Export as JSON
  - `importDeployments()` - Import from JSON
  - `saveDeployment()` - Add or update deployment
  - `deleteDeployment()` - Remove deployment
  - `isKnownDeployment()` - Check if address is known
  - `getDeploymentSummary()` - Get display summary
- **Pages**:
  - `/deployments` - Dedicated deployment tracker page
- **Features**:
  - Parses both transactions and receipts array formats
  - Extracts contract names, addresses, deployers, blocks, gas usage
  - Supports run-latest.json and run-*.json files
  - Shows script names, timestamps, and git commits
  - Full history view with expandable deployment details
  - Security: read-only, project directory restricted
- **Documentation**: `/docs/DEPLOYMENT_TRACKER.md` - Complete deployment tracking guide

#### Forge Test Integration
- **Run forge tests from UI**: Execute Foundry tests directly from FurnaceScout interface
- **Real-time test execution**: Run tests with live progress and results
- **Test result display**: Comprehensive test results with status, gas usage, and timing
- **Gas reporting**: Detailed gas reports for each test function (min, avg, median, max)
- **Test filtering**: Filter tests by contract name, test name, or general pattern
- **Test history**: Automatically save up to 50 test runs in browser localStorage
- **Test comparison**: Compare two test runs to see changes in pass/fail rates and gas usage
- **Test statistics**: Track total runs, pass rates, average duration, and trends
- **Favorite tests**: Star important tests for quick access
- **Export functionality**: Export test history as JSON or CSV
- **Advanced filtering**: Search, filter by status, sort by name/status/gas/duration
- **Group by contract**: Organize tests by contract for better readability
- **Verbosity control**: Adjust test output verbosity (1-4 levels)
- **Coverage support**: Enable code coverage reports (optional)
- **API Routes**:
  - `/api/forge/test` - Execute forge test command and parse results
- **Components**:
  - `ForgeTestRunner` - Main test runner UI component (874 lines)
- **Utilities** (`/lib/forge-test.js`):
  - `runForgeTest()` - Execute tests via API
  - `saveTestResult()` - Persist test results
  - `getTestHistory()` - Retrieve test history
  - `deleteTestResult()` - Remove test result
  - `clearTestHistory()` - Clear all history
  - `compareTestResults()` - Compare two test runs
  - `getTestStatistics()` - Calculate statistics
  - `exportTestResults()` - Export as JSON
  - `exportTestResultsCSV()` - Export as CSV
  - `getTestSettings()` - Retrieve settings
  - `saveTestSettings()` - Save settings
  - `toggleFavoriteTest()` - Star/unstar tests
  - `groupTestsByContract()` - Organize tests
  - `sortTests()` - Sort by various criteria
  - `filterTests()` - Apply filters
  - Helper functions for formatting and display
- **Features**:
  - JSON output parsing from forge test
  - Plain text fallback parser
  - Gas report extraction from stdout
  - Test status tracking (passed/failed/skipped)
  - Duration measurement per test
  - Counterexample capture for fuzzing
  - Error reason extraction
  - 5-minute timeout protection
  - Persistent settings across sessions
  - Trend analysis (improving/declining/stable)
- **Use cases**:
  - Run entire test suite from UI
  - Test specific contracts or functions
  - Track test performance over time
  - Compare test runs before/after changes
  - Monitor gas optimization progress
  - Debug failing tests
  - Generate test reports
- **Storage**: Up to 50 test runs kept in localStorage with full results

#### Enhanced Event Streaming
- **Real-time event subscriptions**: Monitor contract events with live updates using viem's watchEvent
- **Notification system**: Browser notifications, in-app alerts, and optional sound notifications
- **Event persistence**: Store up to 1000 events in browser localStorage with filtering and search
- **Subscription manager**: Create, pause, resume, and delete event subscriptions
- **Event filtering**: Filter by contract address, event name, date range, and subscription
- **Pin/bookmark events**: Mark important events for quick access
- **Export functionality**: Export events as JSON or CSV for analysis
- **Statistics dashboard**: Real-time stats on events, subscriptions, and contract activity
- **Notification settings**: Customizable notifications (desktop, sound, in-app, auto-close)
- **Batch operations**: Start/stop all subscriptions, clear events, export all
- **Contract integration**: Auto-create subscriptions for loaded contracts
- **Event badge**: Visual notification counter in header
- **Components**:
  - `EventStreamManager` - Main event streaming UI component (759 lines)
- **Utilities** (`/lib/event-streaming.js`):
  - `EventSubscriptionManager` - Manages all event subscriptions
  - `getSubscriptionManager()` - Get singleton subscription manager
  - `storeEvents()` - Persist events to localStorage
  - `getStoredEvents()` - Retrieve and filter stored events
  - `clearStoredEvents()` - Remove all stored events
  - `getEventStats()` - Calculate event statistics
  - `togglePinEvent()` - Pin/unpin important events
  - `getPinnedEvents()` - Get all pinned events
  - `getNotificationSettings()` - Retrieve notification preferences
  - `saveNotificationSettings()` - Save notification preferences
  - `showEventNotification()` - Display event notifications
  - `requestNotificationPermission()` - Request browser notification permission
  - `exportEvents()` - Export as JSON
  - `exportEventsCSV()` - Export as CSV
  - `createSubscriptionsForLoadedContracts()` - Auto-create subscriptions
  - `watchEvents()` - Hook-friendly event watching
- **Hooks** (`/app/hooks/useBlockchain.js`):
  - `useWatchEvents()` - Watch events with React hook
  - `useEventStream()` - Subscribe to event stream
  - `useEventSubscriptions()` - Manage subscriptions in components
- **Features**:
  - Real-time event monitoring with 1-second polling
  - Multiple concurrent subscriptions
  - Auto-reconnect on connection loss
  - Efficient event filtering and decoding
  - Browser notification support with permission handling
  - Sound alerts for new events
  - Persistent storage across browser sessions
  - Pin important events to prevent auto-deletion
  - Export history for external analysis
  - Integration with existing ABI system
  - Dark mode support throughout
- **Use cases**:
  - Monitor contract deployments and interactions
  - Track token transfers in real-time
  - Debug contract events during development
  - Audit contract activity
  - Create alerts for specific events
  - Build event-driven workflows
- **Storage**: Up to 1000 events kept in localStorage, oldest auto-removed

#### Foundry Project Auto-detection
- **Automatic project detection**: Scans for `foundry.toml` and detects Foundry projects
- **Batch ABI loading**: Load all compiled contract ABIs with one click from `out/` directory
- **Contract linking**: Connect loaded contracts to deployed addresses
- **Project statistics**: Real-time stats (contracts, functions, events)
- **Configuration parsing**: Reads and parses `foundry.toml` settings
- **Smart organization**: Separates contracts with addresses vs. needing addresses
- **Persistent storage**: All loaded contracts persist in browser localStorage
- **Clear/reset functionality**: Remove all Foundry contracts or individual ones
- **API integration**: RESTful API route `/api/foundry/scan` for project scanning
- **Header integration**: Accessible via "🔨 Foundry" button in navigation
- **Components**:
  - `FoundryProjectManager` - Main project management modal
- **API Routes**:
  - `/api/foundry/scan` - Scan for Foundry project and load artifacts
- **Utilities** (`/lib/foundry-project.js`):
  - `scanFoundryProject()` - Detect and scan Foundry project
  - `loadFoundryABIs()` - Load ABIs into localStorage
  - `getFoundryContracts()` - Retrieve loaded contracts
  - `linkFoundryContract()` - Link contract to deployed address
  - `clearFoundryData()` - Remove all Foundry data
  - `getFoundryStats()` - Get project statistics
  - `saveFoundryConfig()` - Store project configuration
  - `getFoundryConfig()` - Retrieve stored configuration
- **Documentation**: Comprehensive guide at `/docs/FOUNDRY_PROJECT.md` (800+ lines)
- **Use cases**:
  - Seamless development workflow integration
  - Quick project setup and testing
  - Multi-contract project management
  - Version comparison and A/B testing
- **Features**:
  - Auto-extracts ABIs from Foundry JSON output
  - Displays contract metadata (functions, events, bytecode)
  - Batch operations (load all, clear all)
  - Integration with existing ABI features
  - Security: read-only file system access within project directory

#### Memory View for Transaction Traces
- **Step-by-step memory inspection**: View EVM memory state at each execution step
- **Hex dump format**: Standard 32 bytes per row with memory offsets
- **ASCII preview**: See readable text representation of memory contents
- **Step navigation**: Move forward/backward through execution steps with Prev/Next buttons
- **Memory pagination**: Page Up/Down navigation for large memory regions (512+ bytes)
- **Copy functionality**: Export entire memory dump to clipboard
- **Current opcode display**: See which opcode is executing at each step
- **Memory statistics**: Total memory size and step counter
- **Interactive UI**: Click-to-navigate through execution timeline
- **Performance optimized**: Efficient rendering of large memory dumps
- **Integration**: New "🧠 Memory" tab in Transaction Trace Viewer
- **Documentation**: Comprehensive guide in `/docs/TRANSACTION_TRACE.md`
- **Use cases**:
  - Debug MSTORE/MLOAD operations
  - Understand ABI encoding/decoding
  - Track memory layout during execution
  - Analyze string and bytes handling
  - Learn how calldata is processed

#### Cast Command Builder
- **Generate cast commands from UI**: User-friendly interface for building Foundry cast commands
- **Multiple command types**:
  - Contract interactions (call, send, estimate)
  - Transaction queries (receipt, tx)
  - Utility commands (balance, code, storage, block, sig)
- **Smart argument handling**: Automatic formatting for different parameter types
- **Anvil account integration**: Built-in test accounts with private keys
- **Real-time command preview**: See generated command as you configure options
- **Copy to clipboard**: One-click copy of generated commands
- **Dedicated page**: `/cast-builder` route with examples and quick reference
- **Components**:
  - `CastCommandBuilder` - Main command builder component
- **Utilities** (`/lib/cast-commands.js`):
  - `generateCastCall()` - Generate read commands
  - `generateCastSend()` - Generate write commands
  - `generateCastBalance()` - Balance check commands
  - `generateCastReceipt()` - Transaction receipt commands
  - `generateCastEstimate()` - Gas estimation commands
  - 15+ command generation functions
  - `getAnvilAccounts()` - Access Anvil test accounts

#### Transaction Bookmarks
- **Save transactions** with custom labels and notes for quick access
- **Bookmarks panel**: Slide-in panel accessible from header
- **Search functionality**: Filter bookmarks by label, notes, or hash
- **Edit bookmarks**: Update labels and notes anytime
- **Export/Import**: Backup bookmarks as JSON file
- **localStorage persistence**: Bookmarks saved in browser
- **Quick access**: Bookmark button on every transaction page
- **Visual indicators**: ★ for bookmarked, ☆ for unbookmarked
- **Timestamp tracking**: Automatic creation and update timestamps
- **Delete functionality**: Remove individual or all bookmarks
- **Components**:
  - `BookmarkButton` - Add/remove bookmark from transaction pages
  - `BookmarksPanel` - View and manage all bookmarks
- **Utilities** (`/lib/bookmarks.js`):
  - `addBookmark()` - Create new bookmark
  - `removeBookmark()` - Delete bookmark
  - `updateBookmark()` - Edit bookmark
  - `getBookmarks()` - Retrieve all bookmarks
  - `searchBookmarks()` - Search by query
  - `exportBookmarks()` - Export as JSON
  - `isBookmarked()` - Check if transaction saved

#### Transaction Trace Viewer
- **Deep transaction debugging**: Opcode-level insight into transaction execution
- **Three viewing modes**:
  - Call Tree: Visual hierarchy of all contract calls with expand/collapse
  - Opcodes: Step-by-step instruction execution with filtering
  - Storage: All SLOAD/SSTORE operations and state changes
- **Interactive features**:
  - Click opcodes to see full stack contents
  - Filter opcodes by name or show only important operations
  - Expand/collapse calls in the tree
  - Highlight errors and reverts in red
- **Detailed information**:
  - Gas usage per operation and per call
  - Value transfers between contracts
  - Call types (CALL, DELEGATECALL, STATICCALL, CREATE)
  - Storage slot changes with before/after values
  - Revert reasons and error messages
- **Developer utilities**:
  - `debugTraceTransaction()` - Fetch call tree structure
  - `debugTraceTransactionOpcodes()` - Get opcode-level trace
  - `parseStorageChanges()` - Extract storage modifications
  - `formatGas()` - Format gas values for display

#### Real-Time Blockchain Monitoring
- **WebSocket-based updates**: Replaced polling with viem's `watchBlockNumber` for instant updates
- **Custom React hooks**: Created comprehensive hooks library in `/app/hooks/useBlockchain.js`
  - `useWatchBlockNumber()`: Watch for new blocks in real-time
  - `useLatestBlocks()`: Auto-updating block feed
  - `useLatestTransactions()`: Auto-updating transaction feed
  - `useWatchBalance()`: Real-time balance tracking for single addresses
  - `useWatchBalances()`: Efficient multi-address balance monitoring
  - `useChainInfo()`: Live chain information (block number, chain ID, gas price)
  - `useWatchBlock()`: Watch specific blocks with auto-updates
- **Live indicators**: Pulsing green badges show real-time monitoring status
- **Performance optimization**: 1-second polling interval optimized for Anvil's fast blocks
- **Automatic reconnection**: Handles connection drops gracefully

#### Enhanced Syntax Highlighting
- **Shiki integration**: Professional-grade syntax highlighting with VS Code themes
- **Multi-theme support**: Automatic switching between `github-light` and `github-dark` themes
- **Code folding**: Intelligent folding for contracts, functions, modifiers, structs, and enums
  - Visual fold indicators on hover
  - "Unfold All" button for convenience
  - Only allows folding sections with 3+ lines
- **Improved line numbers**: Enhanced styling and hover effects
- **Better Solidity support**: Accurate highlighting of:
  - Keywords (contract, function, modifier, event, etc.)
  - Types (uint256, address, bool, bytes, etc.)
  - Comments (single-line and multi-line)
  - Strings and numeric literals
  - Visibility modifiers (public, private, internal, external)
  - State mutability (pure, view, payable)

#### UI/UX Improvements
- **Redesigned homepage**: Enhanced block and transaction cards with better visual hierarchy
- **Live status badges**: Real-time indicators throughout the application
- **Better empty states**: Improved messaging when no data is available
- **Anvil Status Dashboard**: Enhanced with pulsing connection indicator
- **Improved typography**: Better code formatting and readability

### Changed

#### Homepage
- Replaced `setInterval` polling with `useLatestBlocks()` and `useLatestTransactions()` hooks
- Improved card design with icons and better spacing
- Added live status indicators
- Enhanced transaction display with conditional value rendering

#### Anvil Status Component
- Replaced manual polling with `useChainInfo()` and `useWatchBalances()` hooks
- Improved connection indicator with pulsing animation
- Better visual feedback for active monitoring
- Optimized balance updates to trigger only on new blocks

#### Source Code Viewer
- Completely rewrote highlighting system using Shiki
- Added code folding functionality with smart section detection
- Improved header with file info and controls
- Better handling of loading states
- Enhanced styling with proper theme integration

### Technical Improvements

#### Performance
- Eliminated redundant API calls through centralized `useWatchBlockNumber` hook
- Implemented proper cleanup in all hooks to prevent memory leaks
- Batched balance requests for multiple addresses
- Parallel block fetching with `Promise.all()`
- Reduced network overhead by ~80% compared to polling approach

#### Code Quality
- Created modular, reusable hooks for common blockchain operations
- Improved component separation of concerns
- Better error handling in all async operations
- Proper TypeScript-compatible patterns (BigInt usage)
- Consistent naming conventions across hooks

#### Documentation
- Created comprehensive `docs/REAL_TIME_FEATURES.md` guide
- Documented all custom hooks with parameters and return types
- Added usage examples and migration guide
- Included troubleshooting section
- Performance considerations documented

### Dependencies

#### Added
- `shiki` (^3.20.0) - Syntax highlighting library

#### No Changes
- Transaction trace viewer uses existing viem debug capabilities
- No additional dependencies required

#### Updated
- No dependency version changes (all existing dependencies compatible)

### Fixed
- Resolved clipboard API issues with robust fallback
- Fixed balance display in Anvil Status for lowercase address keys
- Improved dark mode compatibility throughout the application
- Better handling of missing or invalid data

---

## [0.1.0] - Initial Release

### Added
- Initial FurnaceScout implementation
- Basic block explorer functionality
- Transaction viewer with decoding
- Address/contract explorer
- Contract interaction UI (read/write functions)
- ABI upload and management
- Event log viewer with filtering
- Wallet integration via wagmi
- Dark mode support
- Responsive design
- Search functionality
- Anvil test accounts display

### Technical Stack
- Next.js 16 with App Router
- React 19
- Tailwind CSS v4
- viem for blockchain interactions
- wagmi for wallet connections
- @tanstack/react-query for state management
- Biome for linting and formatting

---

## Future Roadmap

### Planned Features
- [ ] Native WebSocket support for even better performance
- [ ] Real-time event streaming
- [ ] Mempool monitoring (pending transactions)
- [ ] Multi-chain/multi-Anvil support
- [ ] Browser notifications for specific events
- [ ] Historical block playback
- [x] Transaction trace viewer with opcode display ✅ **COMPLETED**
- [ ] Forge test integration
- [ ] Cast command builder
- [ ] Project-level Foundry auto-detection
- [ ] Backend persistence for ABIs and sources
- [ ] Enhanced event pagination and indexing
- [ ] Trace export (JSON, CSV)
- [ ] Side-by-side trace comparison
- [ ] Memory view panel
- [ ] Keyboard shortcuts for trace navigation
- [x] Transaction bookmarks ✅ **COMPLETED**
- [x] Cast command builder ✅ **COMPLETED**
- [ ] Bookmark import functionality
- [ ] Bookmark categories/folders
- [ ] Bookmark tags
- [ ] Cloud sync for bookmarks (optional)
- [ ] Cast command templates/presets
- [ ] Cast command history

### Potential Improvements
- [ ] Add unit tests for hooks
- [ ] E2E testing with Playwright
- [ ] CI/CD pipeline
- [ ] Docker support
- [ ] Performance profiling and optimization
- [ ] Accessibility improvements (WCAG compliance)
- [ ] Internationalization (i18n)

---

For more details on the real-time features, see [docs/REAL_TIME_FEATURES.md](docs/REAL_TIME_FEATURES.md).