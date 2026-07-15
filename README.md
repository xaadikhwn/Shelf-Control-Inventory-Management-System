# BizManage BMS — Business Management System

> **Phase 1: Complete Frontend** — BSc (Hons) Computer Science  
> Student ID: 100536271 · Supervisor: Miss Eleanor Leist

## Overview

BizManage is an integrated Business Management System (BMS) designed for small-to-medium enterprises (SMEs). It unifies core operations — Dashboard, Sales, Inventory, Payroll, Expenses, Customers, and Suppliers — into a single responsive web application.

A key differentiator is the **customer/supplier credit ledger module**, modelling informal credit ("khata") practices common in South Asian retail — tracking outstanding balances, credit limits, utilisation percentages, and overdue accounts.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 18 (functional components + hooks) |
| Language | TypeScript |
| Routing | React Router v6 |
| State | React Context API + useReducer |
| Styling | Tailwind CSS v4 |
| Charts | Chart.js via react-chartjs-2 |
| Icons | lucide-react |
| HTTP Client | Axios (configured, not active in Phase 1) |
| Build Tool | Vite |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npx tsc --noEmit
```

The dev server runs at `http://localhost:5173` by default.

## Project Structure

```
src/
├── components/
│   ├── layout/          # Sidebar, TopBar, Footer, PageHeader, AppShell
│   ├── ui/              # KpiCard, DataTable, StatusBadge, ProgressBar, Modal, Button, ToastContainer
│   └── charts/          # RevenueExpenseChart, SalesByCategoryDonut
├── pages/
│   ├── Dashboard/       # Main dashboard with KPIs, charts, recent orders
│   ├── Sales/           # Sales orders management
│   ├── Inventory/       # Product stock levels and catalogue
│   ├── Payroll/         # Employee pay records with totals
│   ├── Expenses/        # Expense claims tracking
│   ├── Customers/       # Customer credit ledger + detail modal
│   ├── Suppliers/       # Supplier purchase ledger with totals
│   └── Settings/        # Profile, company, notifications, appearance
├── context/             # AuthContext, UIContext (sidebar, notifications, toasts)
├── services/
│   ├── mockApi.ts       # ★ Mock API layer — single seam for backend swap
│   └── apiClient.ts     # Pre-configured Axios instance (Phase 2)
├── mock-data/           # Realistic seed data (8-15 records per entity)
├── types/               # TypeScript interfaces for all entities
├── utils/               # formatCurrency, formatDate, statusColorMap
├── App.tsx              # Router + providers
└── main.tsx             # Entry point
```

## Mock API Seam

All data fetching goes through `src/services/mockApi.ts`, which returns Promises with ~300ms simulated latency. Every page already handles loading, error, and empty states.

**To swap for a real backend (Phase 2):**

1. Update `src/services/apiClient.ts` with your backend URL
2. In `mockApi.ts`, replace each function body with an Axios call:

```typescript
// Before (Phase 1)
getCustomers: async (): Promise<Customer[]> => {
  await delay();
  return [...customers];
},

// After (Phase 2)
getCustomers: async (): Promise<Customer[]> => {
  const { data } = await apiClient.get('/customers');
  return data;
},
```

No component changes required.

## Modules

| Route | Module | Features |
|-------|--------|----------|
| `/` | Dashboard | 4 KPI cards, revenue/expense bar chart, sales donut chart, recent orders |
| `/sales` | Sales | KPIs, full orders table, New Order + Export buttons |
| `/inventory` | Inventory | KPIs, product stock table with color-coded quantities |
| `/payroll` | Payroll | KPIs, employee pay records with totals row, Run Payroll button |
| `/expenses` | Expenses | KPIs, expense claims table, CSV export |
| `/customers` | Customers | Credit ledger with utilisation bars, clickable detail modal |
| `/suppliers` | Suppliers | Purchase ledger with total payable row |
| `/settings` | Settings | Profile, company info, notifications, theme preferences |

## Design System

- **Theme**: Dark navy (`#0a0e1a`) with slate card panels
- **Accent**: Blue (`#3b82f6`) for primary actions and links
- **Status badges**: Green (active/paid), Amber (pending/warning), Red (overdue/rejected), Blue (shipped/credit)
- **Typography**: Inter (UI) + JetBrains Mono (IDs, codes)
- **Responsive**: Mobile, tablet, desktop breakpoints (375px → 1920px)

## Phase Roadmap

- [x] **Phase 1**: Frontend (this phase) — complete UI with mock data
- [ ] **Phase 2**: Backend — Node.js/Express, Sequelize, MySQL, JWT auth, RBAC
- [ ] **Phase 3**: Integration — wire frontend to backend, end-to-end testing

---

*BizManage BMS · BSc (Hons) Computer Science · Student ID: 100536271 · Supervisor: Miss Eleanor Leist*
