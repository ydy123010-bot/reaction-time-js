# Fix Header and Sidebar Layout Overlap

## Problem
The ACME logo in the header is being cut off on the left side on desktop because:
1. The header is rendered in `app/(dashboard)/layout.tsx` outside the `SidebarProvider` context
2. The sidebar is rendered in `app/(dashboard)/dashboard/layout.tsx` and uses fixed positioning
3. The sidebar overlays on top of the header, cutting off the logo

## Root Cause
The layouts are nested incorrectly:
```
app/(dashboard)/layout.tsx
  └─ DashboardHeader (full width with app-container padding)
     └─ app/(dashboard)/dashboard/layout.tsx
        └─ SidebarProvider
           └─ AppSidebar (fixed position, overlays header)
```

## Solution
Move the header inside the `SidebarProvider` context so it can properly account for sidebar width. The corrected structure will be:

```
app/(dashboard)/layout.tsx
  └─ Children only (no header)

app/(dashboard)/dashboard/layout.tsx
  └─ SidebarProvider
     ├─ AppSidebar
     └─ main (flex-1)
        ├─ DashboardHeader (on mobile: SidebarTrigger, on desktop: full header)
        └─ page content
```

## Implementation Steps

### 1. Update `app/(dashboard)/layout.tsx`
- Remove the `DashboardHeader` component rendering
- Keep only the wrapper structure
- The header will be moved to the dashboard layout instead

### 2. Update `app/(dashboard)/dashboard/layout.tsx`
- Import the header components (CircleIcon, Link, Avatar, DropdownMenu, etc.)
- Move the `UserMenu` and header rendering logic into this file
- Update the structure:
  - Keep `SidebarProvider` as wrapper
  - Keep `AppSidebar`
  - Update `main` element to include:
    - Desktop header with logo and user menu (hidden on mobile)
    - Existing mobile header with `SidebarTrigger` (hidden on desktop)
    - Page content

### 3. Header Layout Details
The header should:
- Use the `app-container` class for consistent padding
- Be positioned inside the main content area (not overlaid by sidebar)
- Show full header (logo + user menu) on desktop
- Show only SidebarTrigger on mobile (keep existing mobile header)

## Critical Files
- `/Users/jasonhwang/src/base/saas-starter/app/(dashboard)/layout.tsx`
- `/Users/jasonhwang/src/base/saas-starter/app/(dashboard)/dashboard/layout.tsx`
- `/Users/jasonhwang/src/base/saas-starter/components/page-header.tsx` (reference only, no changes needed)

## Verification
After implementation:
1. Check desktop view - logo should not be cut off
2. Check mobile view - SidebarTrigger should still work
3. Verify header styling is consistent
4. Test sidebar toggle functionality
5. Check dark mode compatibility
