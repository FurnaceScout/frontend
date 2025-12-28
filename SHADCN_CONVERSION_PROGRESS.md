# shadcn/ui Conversion Progress

This document tracks the conversion of FurnaceScout from raw Tailwind CSS to shadcn/ui components.

## Overview

**Goal**: Replace custom Tailwind components with shadcn/ui (Radix-based) components for better:
- UI consistency
- Accessibility (built-in ARIA patterns)
- Dark mode support
- Maintainability

**Progress**: ~75-80% Complete

---

## Phase 1: Core UI Components ✅ COMPLETE

### Pages Converted ✅
- [x] Homepage (`/`)
- [x] Tokens Listing (`/tokens`)
- [x] Token Detail (`/tokens/[address]`)
- [x] Address Detail (`/address/[address]`)
- [x] Transaction Detail (`/tx/[hash]`)
- [x] Block Detail (`/block/[number]`)
- [x] Dashboard (`/dashboard`)
- [x] Search (`/search`)
- [x] Cast Builder (`/cast-builder`)
- [x] Events (`/events`)
- [x] Upload ABI (`/upload-abi`)
- [x] Gas Analytics (`/gas`)
- [x] Labels (`/labels`)
- [x] Stats (`/stats`)
- [x] Header component

### Small Components Converted ✅
- [x] UnitConverter - Dialog, Tabs, Input, Button
- [x] AddressLabel - Card, Input, Badge, Button
- [x] BookmarksPanel - Sheet, Card, Input, Button
- [x] BookmarkButton - Dialog, Button, Input, Textarea, Alert
- [x] TransactionNote - Card, Button, Textarea, AlertDialog
- [x] LabelBadge - Badge
- [x] TokenBalances - Card, Badge, Skeleton, Alert
- [x] ThemeToggle - Button
- [x] NetworkStatsWidget - Card, Button, Skeleton, Alert

---

## Phase 2: Medium Components ✅ COMPLETE

### Components Converted ✅
- [x] TokenTransfers - Table, Badge, Card, Skeleton
- [x] RecentTokenTransfers - Table, Card, Skeleton
- [x] TransactionTrace - Card, Badge, Skeleton, Alert
- [x] SourceCodeViewer - Tabs, Card, Badge, Alert
- [x] ContractGasProfile - Card, Table, Badge, Skeleton
- [x] AnvilStatus - Card, Badge, Button, Alert

---

## Phase 3: Large/Complex Components (In Progress) 🔄

### Priority Order (Recommended)

#### High Priority - Complex Components
- [ ] **ContractInteraction** (~400+ lines) - **NEXT RECOMMENDED**
  - Needs: Input, Button, Select, Card, Dialog, Alert
  - Replace native alerts with sonner/AlertDialog
  - High user interaction, critical for contract testing

- [ ] **StateDiffViewer** (~600+ lines) - **LARGE & COMPLEX**
  - Needs: Card, Tabs, Badge, Button, Skeleton, Alert
  - Multiple nested views and data structures
  - Important for transaction analysis

#### Medium Priority - Anvil/Foundry Tools
- [ ] AnvilStateManager (~200 lines)
  - Needs: Card, Sheet, Button, Input, Badge, Alert
  
- [ ] EventStreamManager (~150 lines)
  - Needs: Card, Badge, Sheet, Button, Skeleton

- [ ] ForgeTestRunner (~300 lines)
  - Needs: Card, Button, Badge, Tabs, Alert, Skeleton

- [ ] FoundryProjectManager (~250 lines)
  - Needs: Card, Dialog, Input, Button, Badge, Alert

- [ ] CastCommandBuilder (~200 lines)
  - Needs: Card, Input, Select, Textarea, Button

#### Largest Component - Save for Last
- [ ] **DeploymentTracker** (~500 lines) - **LARGEST COMPONENT**
  - Needs: Card, Table, Dialog, Badge, Tabs, Input, Button, Alert, Skeleton
  - Multiple nested views and complex state management
  - Consider breaking into smaller subcomponents first
  - Should be done last or split before converting

---

## Phase 4: Polish & Refinement 🎨

### Tasks
- [ ] Add tooltips where helpful (Tooltip component)
- [ ] Add command palette for quick navigation (Command component)
- [ ] Implement consistent loading states (Skeleton) - Mostly done
- [ ] Standardize empty states across all pages
- [ ] Add more toast notifications for user feedback
- [ ] Review accessibility (keyboard nav, screen readers)
- [ ] Visual consistency audit (spacing, typography, colors)
- [ ] Performance optimization (lazy loading, bundle size)
- [ ] Add accordion component where collapsible sections would help

---

## shadcn Components Installed

- [x] button
- [x] input
- [x] label
- [x] card
- [x] badge
- [x] separator
- [x] select
- [x] table
- [x] tabs
- [x] dialog
- [x] sheet
- [x] sonner (toast)
- [x] textarea
- [x] alert-dialog
- [x] alert
- [x] skeleton

### Not Yet Installed (May Need Later)
- [ ] tooltip - For hover hints and explanations
- [ ] popover - For contextual menus
- [ ] dropdown-menu - For action menus
- [ ] command - For quick navigation/search
- [ ] scroll-area - For custom scrollbars
- [ ] progress - For loading bars
- [ ] accordion - For collapsible sections (useful for StateDiffViewer, TransactionTrace)
- [ ] checkbox - If needed for multi-select
- [ ] radio-group - If needed for exclusive options
- [ ] switch - For toggle settings
- [ ] slider - For range inputs

---

## Key Patterns Established

### 1. Replace raw buttons with Button component
```jsx
// Before
<button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">

// After
<Button variant="default">Click Me</Button>
```

### 2. Replace custom cards with Card component
```jsx
// Before
<div className="bg-white dark:bg-zinc-900 border rounded-lg p-6">

// After
<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### 3. Replace alert() with toast
```jsx
// Before
alert("Success!");

// After
import { toast } from "sonner";
toast.success("Success!");
```

### 4. Replace confirm() with AlertDialog
```jsx
// Before
if (confirm("Are you sure?")) { ... }

// After
<AlertDialog>
  <AlertDialogTrigger asChild><Button>Delete</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 5. Use semantic colors
```jsx
// Before
<p className="text-zinc-600 dark:text-zinc-400">

// After
<p className="text-muted-foreground">
```

### 6. Consistent loading states with Skeleton
```jsx
// Before
{loading ? <div className="animate-pulse bg-gray-200 h-20"></div> : <Content />}

// After
{loading ? <Skeleton className="h-20 w-full" /> : <Content />}
```

---

## Recent Commits

1. ✅ Converted Upload ABI, Gas, Labels, Stats pages
2. ✅ Converted UnitConverter, AddressLabel, BookmarksPanel components
3. ✅ Converted BookmarkButton, TransactionNote, LabelBadge components
4. ✅ Converted TokenBalances, ThemeToggle, NetworkStatsWidget components
5. ✅ Converted TokenTransfers, RecentTokenTransfers components
6. ✅ Converted TransactionTrace, SourceCodeViewer components
7. ✅ Converted ContractGasProfile, AnvilStatus components

---

## Remaining Work Estimate

**Phase 3 Components**: 7 large components remaining
- Estimated: 15-20 hours of work
- Most complex: ContractInteraction, StateDiffViewer, DeploymentTracker

**Phase 4 Polish**: 
- Estimated: 5-10 hours
- Accessibility audit, visual consistency, performance

**Total Remaining**: ~20-30 hours

---

## Testing Checklist

Run manually after each major conversion:
- [ ] Light mode display
- [ ] Dark mode display
- [ ] Mobile responsive layout
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader compatibility
- [ ] Error states display correctly
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] All interactive elements accessible
- [ ] Forms validate and submit properly

---

## Notes & Best Practices

- **IMPORTANT**: Only update this document when completing an ENTIRE top-level phase
- Individual component conversions tracked via detailed Git commits
- Run `bun run build` after each conversion batch to validate
- Use small, focused commits with descriptive messages
- Replace ALL native `alert()` and `confirm()` calls with sonner toasts and AlertDialog
- Prefer composition over heavy customization of shadcn components
- Maintain accessibility patterns built into shadcn components
- Document complex conversions in commit messages
- Test both light and dark themes after each conversion

---

**Last Updated**: After Phase 2 completion (Medium components)
**Next Focus**: Phase 3 - Large/Complex Components (starting with ContractInteraction)