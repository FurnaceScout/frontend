# FurnaceScout Performance Optimization Plan

## Executive Summary

This document outlines the performance optimization strategy for FurnaceScout, focusing on bundle size reduction, lazy loading, and runtime performance improvements.

## Current State Analysis

### Large Components (by lines of code)
1. **ForgeTestRunner** - 1,115 lines
2. **AnvilStateManager** - 1,112 lines
3. **ContractInteraction** - 943 lines
4. **EventStreamManager** - 836 lines
5. **StateDiffViewer** - 724 lines
6. **TransactionTrace** - 708 lines
7. **DeploymentTracker** - 650 lines
8. **FoundryProjectManager** - 505 lines
9. **CastCommandBuilder** - 493 lines

### Routes Distribution
- **Static Routes (○)**: 11 pages
- **Dynamic Routes (ƒ)**: 8 pages

---

## Optimization Strategy

### Phase 1: Lazy Loading (High Priority)
**Goal**: Reduce initial bundle size by 40-60%

#### 1.1 Dialog Components (Immediate Win)
These components are only used when dialogs are opened - perfect for lazy loading:

**Components to Lazy Load:**
```javascript
// Header.js
const AnvilStateManager = lazy(() => import('./AnvilStateManager'));
const ThemeToggle = lazy(() => import('./ThemeToggle'));

// Various pages
const ForgeTestRunner = lazy(() => import('./ForgeTestRunner'));
const EventStreamManager = lazy(() => import('./EventStreamManager'));
const FoundryProjectManager = lazy(() => import('./FoundryProjectManager'));
```

**Expected Impact**: ~300KB bundle reduction

#### 1.2 Tab Content Components
Load tab content only when the tab is selected:

**In DeploymentTracker:**
- Lazy load individual deployment detail views
- Load deployment list first, details on demand

**In AnvilStateManager:**
- Each tab (Snapshots, Mining, Time, Accounts, Advanced) can be lazy loaded

**Expected Impact**: ~150KB bundle reduction

#### 1.3 Heavy Feature Components
**Components:**
- StateDiffViewer (only needed on transaction pages)
- TransactionTrace (only needed when "View Trace" clicked)
- ContractGasProfile (only needed on gas tab)
- SourceCodeViewer (only needed when viewing source)

**Expected Impact**: ~200KB bundle reduction

---

### Phase 2: Code Splitting by Route (Medium Priority)
**Goal**: Split page-specific code into separate chunks

#### 2.1 Dynamic Imports for Page Components
```javascript
// app/page.js - Homepage
const RecentBlocks = lazy(() => import('./components/RecentBlocks'));
const RecentTransactions = lazy(() => import('./components/RecentTransactions'));

// app/tokens/page.js
const TokenBalances = lazy(() => import('../components/TokenBalances'));
const TokenTransfers = lazy(() => import('../components/TokenTransfers'));
```

#### 2.2 Vendor Splitting
Separate large dependencies:
- ethers.js utilities
- viem/wagmi
- Chart libraries (if any)

**Expected Impact**: Better caching, faster page transitions

---

### Phase 3: Runtime Optimizations (Medium Priority)
**Goal**: Reduce CPU usage and improve responsiveness

#### 3.1 Memoization
**Add useMemo for:**
- Filtered/sorted lists (transactions, events, deployments)
- Expensive calculations (gas calculations, balance conversions)
- Formatted data (addresses, timestamps, BigInt conversions)

**Add useCallback for:**
- Event handlers passed to child components
- API fetch functions
- Filter/sort functions

#### 3.2 Virtual Scrolling
**Implement for:**
- Transaction lists (100+ items)
- Event logs (1000+ items)
- Block lists
- Deployment history

**Libraries to consider:**
- `react-window` (11KB, recommended)
- `@tanstack/react-virtual` (8KB, modern)

**Expected Impact**: 10x faster rendering for large lists

#### 3.3 Debouncing & Throttling
**Add debounce for:**
- Search input (300ms)
- Filter inputs (200ms)
- Resize handlers (150ms)

**Add throttle for:**
- Scroll handlers (16ms = 60fps)
- Real-time data updates (500ms)

---

### Phase 4: Data Fetching Optimizations (High Priority)
**Goal**: Reduce network requests and improve perceived performance

#### 4.1 Pagination
**Replace infinite loading with pagination in:**
- `/events` - Event log viewer
- `/tokens` - Token transfers list
- `/stats` - Historical data views
- Address transaction history

**Benefits:**
- Faster initial load
- Reduced memory usage
- Better UX with page numbers

#### 4.2 Request Batching
**Batch multiple RPC calls:**
```javascript
// Instead of 10 separate calls
const [block1, block2, block3] = await Promise.all([...]);

// Use multicall pattern
const results = await publicClient.multicall({ contracts: [...] });
```

#### 4.3 Smart Caching
**Implement:**
- Cache block data (immutable once finalized)
- Cache contract ABIs (localStorage + memory)
- Cache transaction receipts (immutable)
- Use stale-while-revalidate for changing data

---

### Phase 5: Bundle Optimizations (Low Priority)
**Goal**: Reduce final bundle size

#### 5.1 Tree Shaking
**Verify proper imports:**
```javascript
// ❌ Bad - imports entire library
import _ from 'lodash';

// ✅ Good - imports specific function
import { debounce } from 'lodash-es';

// ✅ Better - use native or smaller alternative
const debounce = (fn, ms) => { /* custom implementation */ };
```

#### 5.2 Replace Heavy Dependencies
**Candidates:**
- Replace `ethers.js` with `viem` (already done ✓)
- Use `date-fns` instead of `moment` (if used)
- Use native Intl API instead of external formatters

#### 5.3 Dynamic Imports for Polyfills
Only load polyfills for older browsers that need them.

---

### Phase 6: Image & Asset Optimization (Low Priority)
**Goal**: Reduce asset load time

#### 6.1 Image Optimization
- Use Next.js Image component
- Serve WebP with PNG fallback
- Lazy load images below fold

#### 6.2 Font Optimization
- Subset fonts (Latin only if appropriate)
- Use `font-display: swap`
- Preload critical fonts

---

## Implementation Priority

### Week 1: Quick Wins (Lazy Loading)
- [ ] Lazy load dialog components (AnvilStateManager, ThemeToggle, etc.)
- [ ] Lazy load heavy feature components (StateDiffViewer, TransactionTrace)
- [ ] Add Suspense boundaries with loading skeletons
- [ ] Test and verify bundle reduction

**Expected Results:**
- 40-50% bundle size reduction
- 2-3x faster initial page load
- No UX regressions

### Week 2: Data Performance
- [ ] Implement pagination for event logs
- [ ] Implement pagination for token transfers
- [ ] Implement pagination for transaction lists
- [ ] Add virtual scrolling to large lists
- [ ] Add request batching for block fetching

**Expected Results:**
- 5-10x faster list rendering
- 70% fewer network requests
- Better memory usage

### Week 3: Runtime Performance
- [ ] Add useMemo for filtered/sorted lists
- [ ] Add useCallback for event handlers
- [ ] Add debouncing to search inputs
- [ ] Add throttling to scroll handlers
- [ ] Profile and optimize hot paths

**Expected Results:**
- Smoother scrolling
- More responsive UI
- Reduced CPU usage

### Week 4: Polish & Testing
- [ ] Bundle analysis and optimization
- [ ] Performance testing (Lighthouse)
- [ ] Load testing with large datasets
- [ ] Cross-browser performance testing
- [ ] Documentation updates

---

## Success Metrics

### Before Optimization (Baseline)
- Initial bundle size: ~800KB (estimated)
- Time to Interactive (TTI): ~2.5s
- First Contentful Paint (FCP): ~1.2s
- Large list render time: ~500ms for 100 items

### Target After Optimization
- Initial bundle size: <400KB (50% reduction)
- Time to Interactive (TTI): <1.5s (40% improvement)
- First Contentful Paint (FCP): <0.8s (33% improvement)
- Large list render time: <50ms for 100 items (90% improvement)
- Lighthouse Performance Score: >90

---

## Testing Strategy

### Performance Testing
1. **Lighthouse CI**: Run on each PR
2. **Bundle Analysis**: Use `@next/bundle-analyzer`
3. **React DevTools Profiler**: Profile hot paths
4. **Chrome DevTools Performance**: Record user interactions

### Load Testing
1. Test with 10,000+ transactions
2. Test with 1,000+ event logs
3. Test with 100+ deployments
4. Test rapid navigation between pages

### Regression Testing
1. Ensure all features still work
2. Verify no visual regressions
3. Test on slow 3G connection
4. Test on low-end devices

---

## Tools & Libraries

### Required
- `react` (already installed) - Suspense, lazy, memo, callback
- `next` (already installed) - Code splitting, dynamic imports

### Recommended
- `@tanstack/react-virtual` - Virtual scrolling (8KB)
- `@next/bundle-analyzer` - Bundle analysis (dev dependency)

### Optional
- `react-window` - Alternative virtual scrolling (11KB)
- `web-vitals` - Performance monitoring (3KB)

---

## Monitoring & Maintenance

### Continuous Monitoring
1. Set up bundle size budgets in CI
2. Monitor Lighthouse scores on each deploy
3. Track Core Web Vitals in production
4. Review bundle analysis monthly

### Performance Budget
- Initial JS: <400KB
- Initial CSS: <50KB
- Per-route JS: <200KB
- Total page weight: <1MB

---

## Notes

- All optimizations should be backward compatible
- Maintain accessibility (ARIA, keyboard nav) during optimizations
- Keep code readable - don't over-optimize
- Profile first, optimize second (measure, don't guess)
- User-perceived performance > raw metrics

---

## References

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Web.dev Performance](https://web.dev/performance/)
- [Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)