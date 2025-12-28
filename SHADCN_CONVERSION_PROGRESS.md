# shadcn/ui Conversion Progress

This document tracks the conversion of FurnaceScout from raw Tailwind CSS to shadcn/ui components.

## Overview

**Goal**: Replace custom Tailwind components with shadcn/ui (Radix-based) components for better:
- UI consistency
- Accessibility (built-in ARIA patterns)
- Dark mode support
- Maintainability

**Progress**: ~60% Complete

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

## Phase 2: Medium Components (In Progress) 🔄

### Components Remaining
- [ ] TokenTransfers - Table, Badge, Card
- [ ] RecentTokenTransfers - Table, Card
- [ ] TransactionTrace - Accordion, Card, Badge
- [ ] SourceCodeViewer - Tabs, Card, Badge
- [ ] StateDiffViewer - Card, Badge, Accordion
- [ ] ContractGasProfile - Card, Table, Badge
- [ ] ContractInteraction - Card, Input, Button, Select

---

## Phase 3: Large/Complex Components 📋

### Anvil/Foundry Tools
- [ ] AnvilStateManager (~200 lines) - Card, Dialog, Button, Input
- [ ] AnvilStatus (~100 lines) - Card, Badge, Button
- [ ] EventStreamManager (~150 lines) - Card, Badge, Sheet
- [ ] ForgeTestRunner (~300 lines) - Card, Button, Badge, Tabs
- [ ] FoundryProjectManager (~250 lines) - Card, Dialog, Input, Button
- [ ] CastCommandBuilder (~200 lines) - Card, Input, Select, Textarea

### Deployment Tracker
- [ ] DeploymentTracker (~500 lines) - **LARGEST COMPONENT**
  - Will need: Card, Table, Dialog, Badge, Tabs, Input, Button, Alert
  - Multiple nested views and state management
  - Should be done last

---

## Phase 4: Polish & Refinement 🎨

### Tasks
- [ ] Add tooltips where helpful (Tooltip component)
- [ ] Add command palette for quick navigation (Command component)
- [ ] Implement consistent loading states (Skeleton)
- [ ] Standardize empty states across all pages
- [ ] Add more toast notifications for user feedback
- [ ] Review accessibility (keyboard nav, screen readers)
- [ ] Visual consistency audit (spacing, typography, colors)
- [ ] Performance optimization (lazy loading, bundle size)

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
- [ ] tooltip
- [ ] popover
- [ ] dropdown-menu
- [ ] command
- [ ] scroll-area
- [ ] progress
- [ ] accordion
- [ ] checkbox
- [ ] radio-group
- [ ] switch
- [ ] slider

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

---

## Commits Made

1. ✅ Converted Upload ABI, Gas, Labels, Stats pages
2. ✅ Converted UnitConverter, AddressLabel, BookmarksPanel components
3. ✅ Converted BookmarkButton, TransactionNote, LabelBadge components
4. ✅ Converted TokenBalances, ThemeToggle, NetworkStatsWidget components

---

## Notes

- **IMPORTANT**: Only update this document when completing an ENTIRE top-level phase
- Individual component conversions tracked via Git commits
- Build validation after each conversion batch
- Testing checklist run manually:
  - [ ] Light mode
  - [ ] Dark mode
  - [ ] Mobile responsive
  - [ ] Keyboard navigation
  - [ ] Screen reader compatibility

---

Last Updated: $(date)