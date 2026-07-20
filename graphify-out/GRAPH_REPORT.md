# Graph Report - C:\Users\sonny\OneDrive\Desktop\truck\truck-operations-management-system  (2026-07-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 740 nodes · 1480 edges · 58 communities (27 shown, 31 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 30 edges (avg confidence: 0.69)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `889a3fe6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- page.tsx
- gs.js
- Booking
- use-users.ts
- DashboardClient.tsx
- booking.ts
- devDependencies
- clients.ts
- TripDetailsModal.tsx
- compilerOptions
- page.tsx
- drivers.ts
- RegistrationTables.tsx
- page.tsx
- ModuleSkeletons.tsx
- HelpersTable.tsx
- DriversTable.tsx
- usePodDownload.ts
- layout.tsx
- dependencies
- TableSkeleton.tsx
- db-connection.mjs
- loading.tsx
- loading.tsx
- loading.tsx
- proxy.ts
- clsx
- docx
- dotenv
- drizzle-orm
- drizzle-zod
- eslint.config.mjs
- html2canvas
- jspdf-autotable
- @mantine/core
- mantine-datatable
- @mantine/dates
- @mantine/form
- @mantine/hooks
- @mantine/modals
- @mantine/notifications
- next
- next.config.ts
- next-safe-action
- react-dom
- @supabase/supabase-js
- @tabler/icons-react
- @tanstack/react-query
- xlsx-js-style
- zod
- postcss.config.mjs
- globals.d.ts

## God Nodes (most connected - your core abstractions)
1. `Booking` - 26 edges
2. `DispatchRecord` - 19 edges
3. `compilerOptions` - 16 edges
4. `Helper` - 15 edges
5. `assert()` - 14 edges
6. `db` - 13 edges
7. `Truck` - 13 edges
8. `ClientWithRoutes` - 12 edges
9. `Driver` - 12 edges
10. `h()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `BillingModule()` --indirect_call--> `f()`  [INFERRED]
  app/(app)/billing/page.tsx → public/gs/gs.js
- `BillingModule()` --indirect_call--> `wb()`  [INFERRED]
  app/(app)/billing/page.tsx → public/gs/gs.js
- `useDispatchExport()` --indirect_call--> `wb()`  [INFERRED]
  app/hooks/useDispatchExport .ts → public/gs/gs.js
- `useTableExport()` --indirect_call--> `wb()`  [INFERRED]
  app/hooks/useTableExport.ts → public/gs/gs.js
- `TimeField()` --indirect_call--> `h()`  [INFERRED]
  components/booking/TripDetailsModal.tsx → public/gs/gs.js

## Import Cycles
- 1-file cycle: `public/gs/gs.mjs -> public/gs/gs.mjs`
- 3-file cycle: `components/trip-logs/ExpensesTab.tsx -> components/trip-logs/TripDetailsModal.tsx -> lib/utils/pdf.ts -> components/trip-logs/ExpensesTab.tsx`
- 3-file cycle: `components/trip-logs/ExpensesTab.tsx -> components/trip-logs/TripDetailsModal.tsx -> components/trip-logs/TripSummaryModal.tsx -> components/trip-logs/ExpensesTab.tsx`
- 4-file cycle: `components/trip-logs/ExpensesTab.tsx -> components/trip-logs/TripDetailsModal.tsx -> components/trip-logs/TripSummaryModal.tsx -> lib/utils/pdf.ts -> components/trip-logs/ExpensesTab.tsx`

## Communities (58 total, 31 thin omitted)

### Community 0 - "page.tsx"
Cohesion: 0.05
Nodes (58): BOOKING_EXPORT_COLUMNS, BookingRecordsPage(), FilterValues, DispatchRecord, MOCK_RECORDS, MOCK_RECORDS_BOOKING, DispatchContext, DispatchContextType (+50 more)

### Community 1 - "gs.js"
Cohesion: 0.06
Nodes (54): TimeField(), A(), ab(), ac(), assert(), b(), Ba(), bb() (+46 more)

### Community 2 - "Booking"
Cohesion: 0.07
Nodes (47): fetchWithRetry(), POST(), DashboardPage(), getWeekDates(), RegistrationTables(), db, globalForDb, Booking (+39 more)

### Community 3 - "use-users.ts"
Cohesion: 0.08
Nodes (36): AccountsTable(), AccountsTableProps, cellStyle, headerCellStyle, AccountsToolbar(), AccountsToolbarProps, CreateUserModal(), CreateUserModalProps (+28 more)

### Community 4 - "DashboardClient.tsx"
Cohesion: 0.06
Nodes (37): CardHeader(), CardHeaderProps, DailyOperationsTable(), DailyOperationsTableProps, DailyTrip, DashboardClient(), FleetCount, getMondayOfWeek() (+29 more)

### Community 5 - "booking.ts"
Cohesion: 0.07
Nodes (40): bookingRelations, bookingWithRelationsSchema, insertBookingSchema, NewBooking, selectBookingSchema, UpdateTripDetailsInput, updateTripDetailsSchema, UpdateTripMonitoringInput (+32 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (39): drizzle-kit, eslint, eslint-config-next, devDependencies, drizzle-kit, eslint, eslint-config-next, postcss (+31 more)

### Community 7 - "clients.ts"
Cohesion: 0.10
Nodes (23): ClientModal(), Props, ClientsTable(), Props, Props, ViewClientModal(), GetBillingSchema, GetIncomeSchema (+15 more)

### Community 8 - "TripDetailsModal.tsx"
Cohesion: 0.15
Nodes (20): NewBudgetTab(), NewBudgetTabProps, ExpensesSummary(), ExpensesSummaryProps, CATEGORY_COLORS, EXPENSE_CATEGORIES, NewExpensesTab(), NewExpensesTabProps (+12 more)

### Community 9 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 10 - "page.tsx"
Cohesion: 0.16
Nodes (17): DispatchPage(), inputStyles, CardHeader(), ClientSection(), LocationSearch(), LocationSection(), PersonnelSection(), ReviewModal() (+9 more)

### Community 11 - "drivers.ts"
Cohesion: 0.19
Nodes (15): DriverModal(), HelperModal(), Props, createDriverAction, driverInputSchema, updateDriverAction, deleteFileFromUrl(), replaceFile() (+7 more)

### Community 12 - "RegistrationTables.tsx"
Cohesion: 0.17
Nodes (16): Props, Props, TruckModal(), Props, TrucksTable(), truckStatusColors, createTruckAction, deleteTruckAction (+8 more)

### Community 13 - "page.tsx"
Cohesion: 0.14
Nodes (12): BillingFilters, BillingModule(), BillingRecord, buildZipLabel(), cell, ExportRow, formatDate(), headerCell (+4 more)

### Community 14 - "ModuleSkeletons.tsx"
Cohesion: 0.14
Nodes (7): SummaryCardsSkeleton(), BILLING_TABLE_HEADERS, BOOKING_TABLE_HEADERS, DashboardModuleSkeleton(), RegistrationModuleSkeleton(), TRIP_LOGS_TABLE_HEADERS, TripLogsModuleSkeleton()

### Community 15 - "HelpersTable.tsx"
Cohesion: 0.14
Nodes (11): DeleteConfirmModal(), HelpersTable(), Props, Props, ViewHelperModal(), TableRowActions(), TableRowActionsProps, deleteHelperAction (+3 more)

### Community 16 - "DriversTable.tsx"
Cohesion: 0.18
Nodes (11): Props, DriversTable(), Props, TableHeader(), TableHeaderProps, Props, ViewDriverModal(), deleteDriverAction (+3 more)

### Community 17 - "usePodDownload.ts"
Cohesion: 0.28
Nodes (8): buildZipName(), DownloadOptions, PodRecord, triggerDownload(), usePodDownload(), UsePodDownloadReturn, jszip, jszip

### Community 18 - "layout.tsx"
Cohesion: 0.29
Nodes (5): geistMono, geistSans, metadata, theme, Providers()

### Community 19 - "dependencies"
Cohesion: 0.29
Nodes (7): @clerk/nextjs, dayjs, dependencies, @clerk/nextjs, dayjs, postgres, postgres

### Community 20 - "TableSkeleton.tsx"
Cohesion: 0.50
Nodes (3): headerCell, TableSkeleton(), TableSkeletonProps

## Knowledge Gaps
- **196 isolated node(s):** `headerCellStyle`, `cellStyle`, `AccountsToolbarProps`, `CreateUserModalProps`, `EditFormValues` (+191 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `page.tsx`, `DashboardClient.tsx`, `devDependencies`, `usePodDownload.ts`, `clsx`, `docx`, `dotenv`, `drizzle-orm`, `drizzle-zod`, `html2canvas`, `jspdf-autotable`, `@mantine/core`, `mantine-datatable`, `@mantine/dates`, `@mantine/form`, `@mantine/hooks`, `@mantine/modals`, `@mantine/notifications`, `next`, `next-safe-action`, `react-dom`, `@supabase/supabase-js`, `@tabler/icons-react`, `@tanstack/react-query`, `xlsx-js-style`, `zod`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **Why does `useTableExport()` connect `page.tsx` to `gs.js`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `xlsx` connect `page.tsx` to `dependencies`, `page.tsx`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `Booking` (e.g. with `POST()` and `DashboardPage()`) actually correct?**
  _`Booking` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `headerCellStyle`, `cellStyle`, `AccountsToolbarProps` to the rest of the system?**
  _196 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.050616050616050616 - nodes in this community are weakly interconnected._
- **Should `gs.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05997778600518327 - nodes in this community are weakly interconnected._