# 📋 Billing & Payment Operations Guide
**Krisdomingo Trucking Operations Management System**

This guide explains the step-by-step process of issuing Statements of Account (SOA), tracking receivables, and recording client payments.

---

## 🔄 End-to-End Billing Lifecycle

```
 +-------------------------------------------------------------------------+
 |                            TRIP COMPLETION                              |
 |   Truck completes delivery -> Driver submits POD -> Trip Logs logged    |
 +------------------------------------+------------------------------------+
                                      |
                                      v
 +-------------------------------------------------------------------------+
 |                       STEP 1: FOR BILLING (Unbilled)                    |
 |   Trips appear under the [For Billing] tab with no SOA number yet       |
 +------------------------------------+------------------------------------+
                                      |
                                      v  [SOA & Actions] -> "Generate Client SOA"
 +-------------------------------------------------------------------------+
 |                       STEP 2: ISSUING THE SOA                           |
 |   System assigns SOA #, sets Invoice Date & Due Date -> Print/Send PDF  |
 +------------------------------------+------------------------------------+
                                      |
                                      v
 +-------------------------------------------------------------------------+
 |                       STEP 3: PENDING PAYMENT                           |
 |   Trips automatically move to the [Pending] tab                         |
 |   (If past Due Date without payment -> moves to [Overdue] tab)          |
 +------------------------------------+------------------------------------+
                                      |
                                      v  Client releases payment (Check / Transfer)
 +-------------------------------------------------------------------------+
 |                       STEP 4: RECORDING PAYMENT                         |
 |                                                                         |
 |   [Option A: Recommended]            |   [Option B: Single Trip]        |
 |   "Batch Payment by SOA #"           |   Click Teal Invoice Icon        |
 |   Marks 100% of trips under the SOA  |   in the ACTIONS column          |
 |   as PAID in one single click!       |   to enter partial/custom amt    |
 +------------------------------------+------------------------------------+
                                      |
                                      v
 +-------------------------------------------------------------------------+
 |                       STEP 5: SETTLED & PAID                            |
 |   All trips move to [Paid] tab (Green badge)                            |
 |   KPI Dashboard logs 100% On-Time Payment collection                    |
 +-------------------------------------------------------------------------+
```

---

## 🖥️ Screen Layout & Where to Find Actions

```
+---------------------------------------------------------------------------------------------------------+
| [Billing Statement]  Client: All Clients  09/01/2026 -> 09/08/2026                 [Filters] [SOA & Actions v] |
+---------------------------------------------------------------------------------------------------------+
| [ TOTAL TRIPS ]   [ TOTAL AMOUNT ]   [ TOTAL PAID ]   [ UNPAID BALANCE ]   [ OVERDUE AMOUNT ]           |
|      57                P184,500           P112,000         P72,500                 P0                   |
+---------------------------------------------------------------------------------------------------------+
|  [57 All]   [25 For Billing]   [0 Pending]   [0 Partially Paid]   [32 Paid]   [0 Overdue]               |
+---------------------------------------------------------------------------------------------------------+
| ACTIONS | DATE       | CLIENT     | PLATE NO | BOOKING DR # | SOA #          | RATE (P) | BILL STATUS   |
|---------+------------+------------+----------+--------------+----------------+----------+---------------|
| [E][I][X]| 09/02/2026 | Nestlé     | NFD-1234 | DR-88219     | SOA-NES-26-001 | 4,500.00 | Paid          |
| [E][I][X]| 09/03/2026 | San Miguel | WXY-9876 | DR-88240     | —              | 5,200.00 | For Billing   |
+---------------------------------------------------------------------------------------------------------+
  ^
  |-- [E] Blue Pencil  = Edit Trip Details & Rates
  |-- [I] Teal Invoice = Single Trip Payment / Update SOA
  |-- [X] Red Trash    = Delete Record
```

---

## 📌 Step-by-Step Instructions

### Step 1: Filter & Review Trips for Billing
1. Click the **`Filters`** button at the top-right.
2. Select the **Client Name** and the **Date Range** (e.g. Sept 1 to Sept 15).
3. Click **Apply Filters**.
4. Click the **`For Billing`** tab to see trips that haven't been billed yet.

---

### Step 2: Issue Statement of Account (SOA)
1. In the top-right corner, click the blue **`SOA & Actions`** button.
2. Click **`Generate Client SOA`** from the dropdown menu.
```
  +-------------------------------------+
  | SOA & Actions                     v |
  +-------------------------------------+
  |  Generate Client SOA       <-- Click|
  |  Generate Subcon SOA                |
  |  Print Client Statement             |
  |  ---------------------------------  |
  |  Batch Payment by SOA #             |
  |  ---------------------------------  |
  |  Export CSV / XLSX                  |
  +-------------------------------------+
```
3. A popup modal will open:
   - **SOA #**: Auto-generated sequential code (e.g. `SOA-NES-2026-001`). You can also customize this.
   - **Invoice Date**: Date issued to client.
   - **Due Date**: Payment deadline according to client credit terms (e.g. 15 or 30 days).
   - **Signatories**: Confirm the *Prepared By* name.
4. Click **`Save & Generate SOA`**.
5. **Print or Save as PDF** to forward to the client's accounting department.
   *(The trips will now automatically move to the **`Pending`** tab!)*

---

### Step 3: Record Client Payment

When the client deposits payment, you have two ways to mark it in the system:

#### 🟢 Method A: Batch Payment by SOA # *(Recommended — Fastest)*
Use this when the client pays the full invoice (or a lump-sum for all trips under the SOA):

```
  +---------------------------------------------------------------+
  |  Batch Payment by SOA #                                   [X] |
  +---------------------------------------------------------------+
  |  Select Statement of Account (SOA #):                         |
  |  [ SOA-NES-2026-001                                       v ] |
  |                                                               |
  |  Summary:                                                     |
  |  +---------------------------------------------------------+  |
  |  | Total Trips: 12   | Total Billed: P54,000 | Paid: P0    |  |
  |  +---------------------------------------------------------+  |
  |                                                               |
  |  Payment Settlement Mode:                                     |
  |  (o) Full SOA Settlement (Mark 100% of trips as Paid)         |
  |  ( ) Pro-Rated Partial Lump-Sum                               |
  |  ( ) Manual Trip-by-Trip Allocation                           |
  |                                                               |
  |                        [ Cancel ]  [ Apply Batch Payment ]    |
  +---------------------------------------------------------------+
```

1. Click **`SOA & Actions`** ➔ **`Batch Payment by SOA #`**.
2. Select the client's **SOA Number**.
3. Keep the mode as **Full SOA Settlement** (default).
4. Click **`Apply Batch Payment`**.
5. **Instant Result:** All trips under this SOA are immediately marked as **Paid (Green)** and moved to the **`Paid`** tab!

---

#### 🔵 Method B: Individual Trip Payment *(Per-trip custom update)*
Use this if the client only paid for one specific delivery:

```
  ACTIONS Column
  +-------+
  | [ I ] | <-- Click Teal Invoice Icon
  +-------+
      |
      v
  +---------------------------------------------------------------+
  |  Update Billing & Trip Rate                               [X] |
  +---------------------------------------------------------------+
  |  Trip Rate (P):       [ 4,500.00 ]                            |
  |  SOA Number:          [ SOA-NES-2026-001 ]                    |
  |  Amount Paid (P):     [ 4,500.00 ]  <-- Enter payment here    |
  |  Invoice Date:        [ 2026-09-02 ]                          |
  |  Due Date:            [ 2026-09-17 ]                          |
  |                                                               |
  |                        [ Cancel ]  [ Save Changes ]           |
  +---------------------------------------------------------------+
```

1. Locate the trip in the table.
2. In the **ACTIONS** column on the far left, click the **Teal Invoice Icon** (`Update Payment / SOA Details`).
3. Enter the amount in **`Amount Paid (₱)`**.
   - If `Amount Paid` is equal to or greater than the Rate ➔ automatically becomes **Paid**.
   - If `Amount Paid` is less than the Rate ➔ automatically becomes **Partially Paid**.
4. Click **`Save Changes`**.

---

## 💡 Quick Reference Guide

| Status Tab | Meaning | Action Needed |
| :--- | :--- | :--- |
| **All** | All filtered trips | Overview of entire period |
| **For Billing** | Completed trips without an SOA | Click `SOA & Actions` ➔ `Generate Client SOA` |
| **Pending** | SOA issued, waiting for payment | Follow up with client before Due Date |
| **Partially Paid** | Client paid partial amount | Awaiting balance settlement |
| **Paid** | 100% collected | No action needed; recorded in KPI |
| **Overdue** | Past Due Date with balance | Urgent collection follow-up |

> [!TIP]
> **Transportify Deliveries:**
> Trips under client **Transportify** are **auto-settled** by the system upon completion. You do not need to manually create an SOA or mark them as paid!
