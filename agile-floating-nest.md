# Thermal Print Feature Implementation Plan

## Summary
Add thermal printing capability to print KOT receipts from orders. Admin can preview and edit order data before printing to outlet-configured thermal printers.

## User Choices
- Preview: Iframe (HTML from backend API)
- Print button: Both table row actions AND OrderDetailModal
- Printer config: Add to existing Outlet edit form

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `printer_ip` to Outlet interface, add PrintData types |
| `src/store/api/printApi.ts` | **NEW** - RTK Query endpoints for print APIs |
| `src/store/api/businessApi.ts` | Add printer IP to outlet update mutation |
| `src/pages/CompanyProfile.tsx` | Add Printer IP field to outlet form |
| `src/components/orders/PrintModal.tsx` | **NEW** - Main print modal component |
| `src/components/orders/OrderDetailModal.tsx` | Add Print button |
| `src/pages/Orders.tsx` | Add print icon to table row, integrate PrintModal |

---

## Implementation Steps

### Step 1: Type Definitions
**File:** `src/types/index.ts`

Add to `Outlet` interface:
```typescript
printer_ip?: string | null;
```

Add new interfaces:
```typescript
interface PrintDataItem {
  name: string;
  quantity: number;
  size_or_weight?: string;
  unit_price: number;
  custom_text?: string;
  delivery_date?: string;
  notes?: string;
  addons?: { name: string; price: number }[];
}

interface PrintData {
  order_number: string;
  order_date: string;
  order_time: string;
  business_name: string;
  customer_name: string;
  customer_phone: string;
  items: PrintDataItem[];
  subtotal: number;
  delivery_fee: number;
  grand_total: number;
  fulfillment_type: 'delivery' | 'takeaway';
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_time?: string;
  outlet_name?: string;
  outlet_address?: string;
  pickup_time?: string;
  sp_note?: string;
}

interface PrintOutlet {
  id: string;
  outlet_name: string;
  printer_ip: string;
}

interface GetPrintDataResponse {
  printData: PrintData;
  outlets: PrintOutlet[];
}
```

---

### Step 2: Print API Endpoints
**File:** `src/store/api/printApi.ts` (NEW)

```typescript
// Endpoints:
// GET  /print/data/:orderId      → getPrintData
// POST /print/preview            → getPreview (returns HTML string)
// POST /print/:orderId           → sendToPrinter
// GET  /print/outlets            → getOutletsWithPrinters
```

---

### Step 3: Outlet Printer IP Field
**File:** `src/pages/CompanyProfile.tsx`

- Add `printer_ip` state to outlet form
- Add input field with IP format validation (xxx.xxx.xxx.xxx or empty)
- Include in create/update outlet payload
- Show printer status indicator (configured/not configured)

---

### Step 4: PrintModal Component
**File:** `src/components/orders/PrintModal.tsx` (NEW)

**Layout:** Two-column modal
- Left: Iframe for HTML preview (renders backend HTML)
- Right: Editable form fields

**Functionality:**
- Fetch print data on open: `useGetPrintDataQuery(orderId)`
- Local state for all editable fields
- Item management: edit/delete existing, add new items
- Auto-recalculate subtotal/grand_total on item changes
- Outlet selector dropdown (only outlets with printers)
- "Refresh Preview" button → POST to /print/preview with edited data
- "Print" button → POST to /print/:orderId with outlet + edited data
- Loading/error/success states with toast notifications

**Editable Fields:**
- customer_name, customer_phone
- items array (name, qty, size_or_weight, unit_price, custom_text, notes, addons)
- delivery_fee
- fulfillment_type, delivery_address, delivery_time
- outlet_name, outlet_address, pickup_time
- sp_note (admin notes)

---

### Step 5: Add Print Button to OrderDetailModal
**File:** `src/components/orders/OrderDetailModal.tsx`

- Add Print button (Printer icon) in header or action area
- On click: close OrderDetailModal, open PrintModal with orderId

---

### Step 6: Add Print to Orders Page
**File:** `src/pages/Orders.tsx`

- Add Printer icon to table row actions (alongside existing action buttons)
- Add PrintModal state: `printOrderId`, `isPrintModalOpen`
- Wire icon click to open PrintModal with that order's ID
- Also handle print from OrderDetailModal callback

---

## Component Structure

```
Orders.tsx
├── OrderDetailModal (existing)
│   └── Print button → opens PrintModal
├── PrintModal (NEW)
│   ├── Preview iframe (left)
│   └── Editable form (right)
│       ├── Customer info fields
│       ├── Items list (editable)
│       ├── Totals (auto-calculated)
│       ├── Fulfillment details
│       └── Outlet selector + Print button
└── Table row actions
    └── Print icon → opens PrintModal
```

---

## API Calls Flow

1. **Open Modal:** `GET /print/data/:orderId` → get editable data + available printers
2. **Edit & Preview:** `POST /print/preview` with edited data → get HTML
3. **Print:** `POST /print/:orderId` with `{ outletId, printData }` → send to printer

---

## Notes
- IP validation regex: `/^(\d{1,3}\.){3}\d{1,3}$/` or empty
- QR code for delivery location generated by backend in preview HTML
- No automatic execution - user controls when to print
